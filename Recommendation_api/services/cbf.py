from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from math import sqrt

from core import settings
from schemas.dataset import (
    CandidateEvent,
    DatasetSchema,
    ExplanationSchema,
    RecommendationItemSchema,
    RecommendationResponseSchema,
)

# === CÁC HẰNG SỐ ===
SUBSCRIPTION_CRITERIA_WEIGHT = 0.7
SUBSCRIPTION_CATEGORY_WEIGHT = 0.3
DEFICIT_WEIGHT = 0.50
SUBSCRIPTION_WEIGHT = 0.25
HISTORY_WEIGHT = 0.15
TIME_WEIGHT = 0.10
ABSENT_HISTORY_PENALTY = 0.85

#Đảm bảo datetime có timezon UTC
def _ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value

#criteriaId => (criteriaName, maxScore) dùng ddererr tra tên tiêu chí và lấy điểm tối đa khi tính thiếu điểm
def _build_criteria_lookup(dataset: DatasetSchema) -> dict[str, tuple[str, int]]:
    lookup: dict[str, tuple[str, int]] = {}
    for criteria in dataset.criterias:
        lookup[criteria.criteriaId] = (criteria.criteriaName, criteria.maxScore or 0)
    return lookup

#Gom tổng điểm user theo thoe tuwngf tiêu chí
def _build_score_by_criteria(dataset: DatasetSchema) -> dict[str, int]:
    score_map: dict[str, int] = defaultdict(int)
    for score in dataset.scores:
        score_map[score.criteriaId] += score.scoreValue
    return score_map

#user thiếu điểm tiêu chí này mà event thuộc veef => ưu tiên: event (max - current) / max
def _deficit_match(event: CandidateEvent, score_map: dict[str, int], criteria_lookup: dict[str, tuple[str, int]]) -> float:
    _, max_score = criteria_lookup.get(event.criteriaId, ("", 0))
    if max_score <= 0:
        return 0.0
    current_score = score_map.get(event.criteriaId, 0)
    deficit_ratio = max(max_score - current_score, 0) / max_score
    return round(deficit_ratio, 6) # làm tròn 6 chữ số thập phân

#Độ giống nhau giữa 2 tập: |A ∩ B| / |A ∪ B|
def _jaccard_similarity(left: list[str], right: list[str]) -> float:
    left_set = set(left)
    right_set = set(right)
    if not left_set or not right_set:
        return 0.0
    union = left_set | right_set
    if not union:
        return 0.0
    return len(left_set & right_set) / len(union)


#So event với sở thích user: Khớp tiêu chí 0.7 và khớp danh mục 0.3
def _subscription_match(event: CandidateEvent, dataset: DatasetSchema) -> float:
    criteria_match = 1.0 if event.criteriaId in dataset.subscription.subscribedCriteriaIds else 0.0
    category_match = _jaccard_similarity(
        event.categoryIds,
        dataset.subscription.subscribedCategoryIds,
    )
    return round(
        (SUBSCRIPTION_CRITERIA_WEIGHT * criteria_match)
        + (SUBSCRIPTION_CATEGORY_WEIGHT * category_match),
        6,
    )


#Xây vector từ lịch sử ATTENDED: số category duy nhất xuất hiện trong toàn bộ các event mà sinh viên đã ATTENDED.
def _build_attended_category_vector(dataset: DatasetSchema) -> dict[str, float]:
    counter: Counter[str] = Counter()
    for interaction in dataset.interactions:
        if interaction.status != "ATTENDED":
            continue
        counter.update(interaction.categoryIds)

    if not counter:
        return {}

    max_count = max(counter.values()) # Lấy số lần xuất hiện lớn nhất
    if max_count <= 0:
        return {}

    return {category_id: count / max_count for category_id, count in counter.items()} # normalize :  count/mãcount


#Tính cosine similarity giữa vector category của event (nhị phân 0/1) và vector lịch sử tham dự của sinh viên
def _cosine_similarity(event_categories: list[str], attended_vector: dict[str, float]) -> float:
    if not event_categories or not attended_vector:
        return 0.0

    event_vector = {category_id: 1.0 for category_id in event_categories} # số chiều = số category duy nhất của event đó
    dot_product = sum(event_vector.get(category_id, 0.0) * attended_vector.get(category_id, 0.0) for category_id in set(event_vector) | set(attended_vector))
    event_norm = sqrt(sum(value * value for value in event_vector.values()))
    history_norm = sqrt(sum(value * value for value in attended_vector.values()))
    if event_norm == 0 or history_norm == 0:
        return 0.0
    return dot_product / (event_norm * history_norm)

#Kiểm tra xem event có trùng tiêu chí hoặc category với bất kỳ event nào mà sinh viên từng ABSENT không.
def _has_absent_overlap(event: CandidateEvent, dataset: DatasetSchema) -> bool:
    event_categories = set(event.categoryIds)
    for interaction in dataset.interactions:
        if interaction.status != "ABSENT":
            continue
        if interaction.criteriaId == event.criteriaId:
            return True
        if event_categories and event_categories.intersection(interaction.categoryIds):
            return True
    return False


#Tính điểm dựa trên lịch sử tham dự: lấy cosine similarity với vector ATTENDED, sau đó nhân với hệ số phạt 0.85 nếu event có liên quan đến các event mà sinh viên từng ABSENT.
def _history_match(event: CandidateEvent, dataset: DatasetSchema, apply_absent_penalty: bool) -> float:
    attended_vector = _build_attended_category_vector(dataset)
    history_match = _cosine_similarity(event.categoryIds, attended_vector)
    if apply_absent_penalty and history_match > 0 and _has_absent_overlap(event, dataset):
        history_match *= ABSENT_HISTORY_PENALTY
    return round(history_match, 6)


#Boost event gần deadline
def _time_bonus(event: CandidateEvent) -> float:
    deadline = _ensure_utc(event.registrationDeadline)
    if deadline is None:
        return 0.0

    now = datetime.now(timezone.utc)
    days_left = (deadline - now).days

    if days_left <= 0:
        return 0.0
    if days_left <= 3:
        return 1.0
    if days_left <= 7:
        return 0.7
    if days_left <= 14:
        return 0.4
    return 0.1


#Chọn lý do chính để giải thích
def _build_content_explanation(
    event: CandidateEvent,
    criteria_lookup: dict[str, tuple[str, int]],
    deficit_match: float,
    subscription_match: float,
    history_match: float,
    semester_name: str | None = None,
) -> ExplanationSchema:
    weighted_reasons = {
        "DEFICIT": DEFICIT_WEIGHT * deficit_match,
        "SUBSCRIPTION": SUBSCRIPTION_WEIGHT * subscription_match,
        "HISTORY": HISTORY_WEIGHT * history_match,
    }
    top_reason = max(weighted_reasons, key=weighted_reasons.get)
    criteria_name = criteria_lookup.get(event.criteriaId, ("tiêu chí chưa rõ", 0))[0]
    semester_text = f"trong {semester_name}" if semester_name else ""

    if top_reason == "SUBSCRIPTION":
        return ExplanationSchema(
            reasonType="SUBSCRIPTION",
            message="Đúng với sở thích bạn đã đăng ký nhận thông báo.",
        )
    if top_reason == "HISTORY":
        return ExplanationSchema(
            reasonType="HISTORY",
            message="Tương tự với các hoạt động bạn từng tham gia.",
        )
    return ExplanationSchema(
        reasonType="DEFICIT",
        message=f"Phù hợp để bù điểm cho tiêu chí {criteria_name} đang thiếu {semester_text}.",
    )


def score_cbf(
    dataset: DatasetSchema,
    event: CandidateEvent,
    *,
    apply_absent_penalty: bool = True,
) -> RecommendationItemSchema:
    criteria_lookup = _build_criteria_lookup(dataset)
    score_map = _build_score_by_criteria(dataset)

    deficit_match = _deficit_match(event, score_map, criteria_lookup)
    subscription_match = _subscription_match(event, dataset)
    history_match = _history_match(event, dataset, apply_absent_penalty)
    time_bonus = _time_bonus(event)

    score = (
        (DEFICIT_WEIGHT * deficit_match)
        + (SUBSCRIPTION_WEIGHT * subscription_match)
        + (HISTORY_WEIGHT * history_match)
        + (TIME_WEIGHT * time_bonus)
    )

    return RecommendationItemSchema(
        eventId=event.eventId,
        score=round(score, 6),
        explanation=_build_content_explanation(
            event,
            criteria_lookup,
            deficit_match,
            subscription_match,
            history_match,
            semester_name=dataset.semesterName,
        ),
        components={
            "deficitMatch": round(deficit_match, 6),
            "subscriptionMatch": round(subscription_match, 6),
            "historyMatch": round(history_match, 6),
            "timeBonus": round(time_bonus, 6),
        },
    )

#chạy score_cbf cho tất cả candidate event, sắp xếp giảm dần theo điểm, cắt lấy top_k kết quả tốt nhất,
def get_content_recommendations(
    dataset: DatasetSchema,
    *,
    top_k: int | None = None,
    apply_absent_penalty: bool = True,
) -> RecommendationResponseSchema:
    effective_top_k = top_k or settings.recommendation_top_k
    recommendations = [
        score_cbf(dataset, event, apply_absent_penalty=apply_absent_penalty)
        for event in dataset.candidateEvents
    ]
    recommendations.sort(key=lambda item: item.score, reverse=True)

    return RecommendationResponseSchema(
        algorithm="content",
        studentId=dataset.studentId,
        topK=effective_top_k,
        recommendations=recommendations[:effective_top_k],
    )

