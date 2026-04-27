from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    recommendation_top_k: int = int(os.getenv("RECOMMENDATION_TOP_K", "20"))
    max_per_criteria_in_topk: int = int(os.getenv("MAX_PER_CRITERIA_IN_TOPK", "3"))
    cf_neighbor_limit: int = int(os.getenv("CF_NEIGHBOR_LIMIT", "20"))


settings = Settings()

