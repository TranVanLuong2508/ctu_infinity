from __future__ import annotations

from fastapi import APIRouter, Query

from schemas.dataset import DatasetSchema, RecommendationResponseSchema
from services.cbf import get_content_recommendations

router = APIRouter()


@router.post("/content", response_model=RecommendationResponseSchema)
def recommend_content(
    dataset: DatasetSchema,
    top_k: int | None = Query(default=None, alias="topK"),
) -> RecommendationResponseSchema:
    return get_content_recommendations(dataset, top_k=top_k)

