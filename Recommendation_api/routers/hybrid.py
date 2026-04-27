from __future__ import annotations

from fastapi import APIRouter, Query

from schemas.dataset import DatasetSchema, RecommendationResponseSchema
from services.hybrid import get_hybrid_recommendations

router = APIRouter()


@router.post("/hybrid", response_model=RecommendationResponseSchema)
def recommend_hybrid(
    dataset: DatasetSchema,
    top_k: int | None = Query(default=None, alias="topK"),
    debug: bool = Query(default=False),
) -> RecommendationResponseSchema:
    return get_hybrid_recommendations(dataset, top_k=top_k, debug=debug)

