from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import HistoryResponse, TaskRequest
from app.orchestrator.graph import MultiAgentOrchestrator

router = APIRouter()
orchestrator = MultiAgentOrchestrator()


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/runs", response_model=HistoryResponse)
async def list_runs() -> HistoryResponse:
    return HistoryResponse(runs=orchestrator.store.list_runs())


@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    run = orchestrator.store.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/runs")
async def create_run(request: TaskRequest):
    run = await orchestrator.run_once(request.prompt)
    return run


@router.post("/runs/stream")
async def stream_run(request: TaskRequest):
    return StreamingResponse(orchestrator.stream_run(request.prompt), media_type="text/event-stream")
