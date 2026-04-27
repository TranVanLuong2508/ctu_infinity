from __future__ import annotations

from fastapi import APIRouter, Query

from schemas.dataset import DatasetSchema, RecommendationResponseSchema
from services.cf import get_collab_recommendations

router = APIRouter()


@router.post("/collab", response_model=RecommendationResponseSchema)
def recommend_collab(
    dataset: DatasetSchema,
    top_k: int | None = Query(default=None, alias="topK"),
    debug: bool = Query(default=False),
) -> RecommendationResponseSchema:
    return get_collab_recommendations(dataset, top_k=top_k, debug=debug)

