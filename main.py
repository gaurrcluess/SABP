"""
FastAPI entrypoint for the Block Maker service.

Scope reminder: this service only matches/merges/creates blocks.
No criticality scoring and no optimization happen here.
"""

from fastapi import FastAPI, HTTPException

from app.models.schemas import BlockPlanRequest, BlockPlanResponse
from app.services.planner import generate_block_plan

app = FastAPI(
    title="Block Maker",
    description="Generates an initial maintenance block plan by matching, "
    "merging, or creating blocks for incoming maintenance requests.",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/generate-block-plan", response_model=BlockPlanResponse)
def generate_plan(payload: BlockPlanRequest | None = None):
    """
    Generates a block plan.

    If no body (or a body with null fields) is supplied, falls back to the
    mock CSV data under /data. Supplying maintenance_requests, current_blocks,
    and/or planning_calendar in the request body overrides the corresponding
    default source.
    """
    try:
        payload = payload or BlockPlanRequest()
        return generate_block_plan(
            maintenance_requests=payload.maintenance_requests,
            current_blocks=payload.current_blocks,
            planning_calendar=payload.planning_calendar,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=f"Missing data file: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc
