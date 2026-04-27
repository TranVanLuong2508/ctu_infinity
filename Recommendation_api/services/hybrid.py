from __future__ import annotations

from collections import defaultdict

from core import settings
from schemas.dataset import DatasetSchema, ExplanationSchema, RecommendationItemSchema, RecommendationResponseSchema
from services.cbf import get_content_recommendations
from services.cf import get_collab_recommendations

ALPHA = 0.6
BETA = 0.4
HYBRID_ABSENT_PENALTY = 0.85

#Chuẩn hóa điểm của tất cả event về khoảng [0.0, 1.0] theo công thức Min-Max Normalization:(score−min​)/(max-min)
def _normalize_scores(values: dict[str, float]) -> dict[str, float]:
    if not values:
        return {}

    minimum = min(values.values())
    maximum = max(values.values())
    if minimum == maximum:
        return {event_id: 0.5 for event_id in values}
    return {
        event_id: round((score - minimum) / (maximum - minimum), 6)
        for event_id, score in values.items()
    }


#Kiểm tra event có liên quan đến các event mà sinh viên từng ABSENT không, dựa trên hai điều kiện: trùng criteriaId hoặc giao nhau về categoryIds
def _has_absent_overlap(dataset: DatasetSchema, event_id: str) -> bool:
    event = next((candidate for candidate in dataset.candidateEvents if candidate.eventId == event_id), None)
    if event is None:
        return False

    event_categories = set(event.categoryIds)
    for interaction in dataset.interactions:
        if interaction.status != "ABSENT":
            continue
        if interaction.criteriaId == event.criteriaId:
            return True
        if event_categories and event_categories.intersection(interaction.categoryIds):
            return True
    return False


#Sắp xếp lại danh sách kết quả để đảm bảo đa dạng tiêu chí, tránh top_k toàn event cùng một criteriaId:
#Pass 1: Duyệt theo thứ tự điểm, chỉ chọn event nếu criteriaId của nó chưa vượt quá max_per_criteria_in_topk. Dừng khi đủ top_k.
#Pass 2: Nếu pass 1 chưa đủ top_k (do dữ liệu thưa), bổ sung các event còn lại chưa được chọn cho đến khi đủ.
def _apply_diversity_reranking(recommendations: list[RecommendationItemSchema], dataset: DatasetSchema, top_k: int) -> list[RecommendationItemSchema]:
    criteria_by_event = {event.eventId: event.criteriaId for event in dataset.candidateEvents}
    criteria_counter: dict[str, int] = defaultdict(int)
    final_results: list[RecommendationItemSchema] = []
    selected_event_ids: set[str] = set()

    for recommendation in recommendations:
        criteria_id = criteria_by_event.get(recommendation.eventId)
        if criteria_id is None:
            continue
        if criteria_counter[criteria_id] >= settings.max_per_criteria_in_topk:
            continue
        final_results.append(recommendation)
        selected_event_ids.add(recommendation.eventId)
        criteria_counter[criteria_id] += 1
        if len(final_results) == top_k:
            return final_results

    # Keep a second pass so quota does not shrink the list too much when data is sparse.
    for recommendation in recommendations:
        if recommendation.eventId in selected_event_ids:
            continue
        final_results.append(recommendation)
        if len(final_results) == top_k:
            break

    return final_results


def get_hybrid_recommendations(
    dataset: DatasetSchema,
    *,
    top_k: int | None = None,
    debug: bool = False,
) -> RecommendationResponseSchema:
    effective_top_k = top_k or settings.recommendation_top_k

    # Hybrid reuses internal scoring functions directly to avoid HTTP hop and double-filtering.
    content_response = get_content_recommendations(
        dataset,
        top_k=len(dataset.candidateEvents),
        apply_absent_penalty=False,
    )
    collab_response = get_collab_recommendations(
        dataset,
        top_k=len(dataset.candidateEvents),
        debug=debug,
    )

    cbf_map = {item.eventId: item for item in content_response.recommendations}
    cf_map = {item.eventId: item for item in collab_response.recommendations}

    cbf_norm = _normalize_scores({event_id: item.score for event_id, item in cbf_map.items()})
    cf_norm = _normalize_scores({event_id: item.score for event_id, item in cf_map.items()})

    recommendations: list[RecommendationItemSchema] = []

    for event in dataset.candidateEvents:
        content_item = cbf_map[event.eventId]
        collab_item = cf_map[event.eventId]

        content_score_norm = cbf_norm.get(event.eventId, 0.0)
        collab_score_norm = cf_norm.get(event.eventId, 0.0)

        if collab_item.score == 0 or not collab_item.neighborCount:
            score = content_score_norm
        else:
            score = (ALPHA * content_score_norm) + (BETA * collab_score_norm)

        if _has_absent_overlap(dataset, event.eventId):
            score *= HYBRID_ABSENT_PENALTY

        if collab_item.score == 0 or not collab_item.neighborCount:
            explanation = content_item.explanation
        else:
            weighted_content = ALPHA * content_score_norm
            weighted_collab = BETA * collab_score_norm
            explanation = (
                collab_item.explanation
                if weighted_collab > weighted_content
                else content_item.explanation
            )

        recommendation = RecommendationItemSchema(
            eventId=event.eventId,
            score=round(score, 6),
            explanation=ExplanationSchema(
                reasonType=explanation.reasonType,
                message=explanation.message,
            ),
            components={
                "cbfScore": round(content_item.score, 6),
                "cbfNorm": round(content_score_norm, 6),
                "cfScore": round(collab_item.score, 6),
                "cfNorm": round(collab_score_norm, 6),
                "hybridPenaltyApplied": 1.0 if _has_absent_overlap(dataset, event.eventId) else 0.0,
            },
            neighborCount=collab_item.neighborCount,
            debugPayload=collab_item.debugPayload if debug else None,
        )
        recommendations.append(recommendation)

    recommendations.sort(key=lambda item: item.score, reverse=True)
    recommendations = _apply_diversity_reranking(recommendations, dataset, effective_top_k)

    return RecommendationResponseSchema(
        algorithm="hybrid",
        studentId=dataset.studentId,
        topK=effective_top_k,
        recommendations=recommendations,
    )
