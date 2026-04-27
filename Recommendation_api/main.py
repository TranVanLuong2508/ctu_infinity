from __future__ import annotations

import logging

from fastapi import FastAPI

from routers import collab_router, content_router, hybrid_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CTU Infinity Recommendation API",
    version="1.0.0",
)

app.include_router(content_router, prefix="/recommendations", tags=["recommendations"])
app.include_router(collab_router, prefix="/recommendations", tags=["recommendations"])
app.include_router(hybrid_router, prefix="/recommendations", tags=["recommendations"])


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
