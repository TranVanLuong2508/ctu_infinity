from __future__ import annotations

from collections import defaultdict
from math import sqrt

from core import settings
from schemas.dataset import (
    CandidateEvent,
    DatasetSchema,
    ExplanationSchema,
    RecommendationItemSchema,
    RecommendationResponseSchema,
)

INTERACTION_WEIGHTS = {
    "ATTENDED": 2.0,
    "REGISTERED": 1.0,
    "ABSENT": -0.2,
    "CANCELLED": 0.0,
}

#Xây dựng ma trận tương tác user × event dạng dict lồng nhau {studentId: {eventId: weight}}
def _build_user_event_matrix(dataset: DatasetSchema) -> dict[str, dict[str, float]]:
    matrix: dict[str, dict[str, float]] = defaultdict(dict)
    for interaction in dataset.allStudentsInteractions:
        matrix[interaction.studentId][interaction.eventId] = INTERACTION_WEIGHTS.get(interaction.status, 0.0)
    return matrix


#ính cosine similarity giữa hai vector hành vi của hai sinh viên mỗi vector là {eventId: weight})
def _cosine_similarity(left: dict[str, float], right: dict[str, float]) -> float:
    if not left or not right:
        return 0.0

    event_ids = set(left) | set(right)
    dot_product = sum(left.get(event_id, 0.0) * right.get(event_id, 0.0) for event_id in event_ids)
    left_norm = sqrt(sum(value * value for value in left.values()))
    right_norm = sqrt(sum(value * value for value in right.values()))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot_product / (left_norm * right_norm)

#Tìm danh sách sinh viên có hành vi tương tự sinh viên hiện tại nhất:
def _find_neighbors(dataset: DatasetSchema) -> list[tuple[str, float]]:
    matrix = _build_user_event_matrix(dataset)
    target_vector = matrix.get(dataset.studentId, {})
    neighbors: list[tuple[str, float]] = []

    for student_id, vector in matrix.items():
        if student_id == dataset.studentId:
            continue
        similarity = _cosine_similarity(target_vector, vector)
        if similarity > 0:
            neighbors.append((student_id, round(similarity, 6)))

    neighbors.sort(key=lambda item: item[1], reverse=True)
    return neighbors[: settings.cf_neighbor_limit]


#Tính điểm dự đoán cho một event theo công thức weighted average
def score_cf(
    dataset: DatasetSchema,
    event: CandidateEvent,
    *,
    debug: bool = False,
) -> RecommendationItemSchema:
    matrix = _build_user_event_matrix(dataset)
    neighbors = _find_neighbors(dataset)

    numerator = 0.0
    denominator = 0.0
    debug_neighbors: list[dict[str, float | str]] = []

    for neighbor_id, similarity in neighbors:
        interaction_value = matrix.get(neighbor_id, {}).get(event.eventId)
        if interaction_value is None:
            continue
        numerator += similarity * interaction_value
        denominator += abs(similarity)
        if debug:
            debug_neighbors.append(
                {
                    "studentId": neighbor_id,
                    "similarity": round(similarity, 6),
                    "interaction": round(interaction_value, 6),
                }
            )

    if denominator == 0:
        score = 0.0
        neighbor_count = 0
    else:
        score = numerator / denominator
        neighbor_count = len(debug_neighbors) if debug else sum(
            1 for neighbor_id, _ in neighbors if event.eventId in matrix.get(neighbor_id, {})
        )

    recommendation = RecommendationItemSchema(
        eventId=event.eventId,
        score=round(score, 6),
        explanation=ExplanationSchema(
            reasonType="COMMUNITY",
            message="Nhiều sinh viên có hành vi tương tự bạn đã quan tâm hoặc tham gia sự kiện này.",
        ),
        components={"behaviorScore": round(score, 6)},
        neighborCount=neighbor_count,
    )

    if debug:
        recommendation.debugPayload = {"similarUsers": debug_neighbors}

    return recommendation


# chạy score_cf cho tất cả candidate event, sắp xếp giảm dần theo điểm, cắt lấy top_k kết quả,
def get_collab_recommendations(
    dataset: DatasetSchema,
    *,
    top_k: int | None = None,
    debug: bool = False,
) -> RecommendationResponseSchema:
    effective_top_k = top_k or settings.recommendation_top_k
    recommendations = [score_cf(dataset, event, debug=debug) for event in dataset.candidateEvents]
    recommendations.sort(key=lambda item: item.score, reverse=True)

    return RecommendationResponseSchema(
        algorithm="collab",
        studentId=dataset.studentId,
        topK=effective_top_k,
        recommendations=recommendations[:effective_top_k],
    )
