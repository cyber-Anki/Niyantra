"""
FastAPI entrypoint. Wires System 1 (priority), System 2 (CP-SAT scheduler),
System 3 (physics + multi-horizon), and SQLite persistence for officer
decisions on scheduled blocks.
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Literal
import random
import xgboost as xgb
from sqlalchemy.exc import SQLAlchemyError
from schemas import MaintenanceTask, Corridor
from mock_data_loader import bootstrap
from system1_priority_engine import score_all_tasks
from physics_fatigue import compute_damage_signal
import system2_optimizer as s2
import system3_horizon_engine as s3

from database import Base, engine, get_db
from models import ScheduledBlockDB, OfficerDecisionDB, UserDB

from auth import auth_router, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Block Planning Backend")

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- load System 1 model once at startup ---
_model = xgb.XGBRegressor()
try:
    _model.load_model("risk_model.json")
except Exception:
    _model = None


class PrioritizeRequest(BaseModel):
    tasks: list[dict]


class OptimizeWeeklyRequest(BaseModel):
    tasks: list[dict]
    corridors: list[dict]
    week_start: str = "2025-04-14"


class SimulateMonthlyRequest(BaseModel):
    tasks: list[dict]
    corridors: list[dict]
    month_label: str = "2025-04"


class DecideRequest(BaseModel):
    block_id: str
    action: Literal["approve", "reject", "remove_task", "retime_task"]
    task_id: Optional[str] = None
    new_start_minute: Optional[int] = None
    new_end_minute: Optional[int] = None
    decided_by: str = "unauthenticated"


@app.get("/api/data/bootstrap")
def get_bootstrap():
    return bootstrap()


@app.post("/api/system1/prioritize")
def prioritize(req: PrioritizeRequest):
    if _model is None:
        raise HTTPException(500, "risk_model.json not found — run train_system1.py first")
    tasks = req.tasks
    for t in tasks:
        t["damage_signal"] = compute_damage_signal(t["defect_type"], t["overdue_days"])
    scored = score_all_tasks(tasks, _model)
    scored.sort(key=lambda t: t["risk_score"], reverse=True)
    return {"tasks": scored}


@app.post("/api/system2/optimize-weekly")
def optimize_weekly(req: OptimizeWeeklyRequest, db: Session = Depends(get_db)):
    if _model is None:
        raise HTTPException(500, "risk_model.json not found — run train_system1.py first")
    tasks = req.tasks
    for t in tasks:
        t["damage_signal"] = compute_damage_signal(t["defect_type"], t["overdue_days"])
    scored = score_all_tasks(tasks, _model)
    task_objs = [MaintenanceTask(**t) for t in scored]
    corridor_objs = [Corridor(**c) for c in req.corridors]

    blocks, unscheduled = s2.optimize_week(task_objs, corridor_objs)

    # Persist freshly solved blocks as "pending" — upsert by block_id so
    # re-running the solver for the same week doesn't duplicate rows.
    for b in blocks:
        existing = db.get(ScheduledBlockDB, b.block_id)
        if existing:
            existing.corridor_id = b.corridor_id
            existing.section = b.section
            existing.week_start = req.week_start
            existing.start_minute = b.start_minute
            existing.end_minute = b.end_minute
            existing.task_ids = b.task_ids
            existing.departments = b.departments
            existing.is_merged = b.is_merged
            existing.total_risk_cleared = b.total_risk_cleared
            # NOTE: do not reset status here — leave prior officer decision intact
        else:
            db.add(ScheduledBlockDB(
                block_id=b.block_id, corridor_id=b.corridor_id, section=b.section,
                week_start=req.week_start, start_minute=b.start_minute, end_minute=b.end_minute,
                task_ids=b.task_ids, departments=b.departments, is_merged=b.is_merged,
                total_risk_cleared=b.total_risk_cleared, status="pending",
            ))
    db.commit()

    total_risk = sum(b.total_risk_cleared for b in blocks)
    return {
        "week_start": req.week_start,
        "scheduled_blocks": [b.model_dump() for b in blocks],
        "unscheduled_task_ids": unscheduled,
        "total_risk_cleared": round(total_risk, 1),
        "merge_count": sum(1 for b in blocks if b.is_merged),
        "scored_tasks": scored,
    }


@app.post("/api/system3/simulate-monthly")
def simulate_monthly(req: SimulateMonthlyRequest):
    if _model is None:
        raise HTTPException(500, "risk_model.json not found — run train_system1.py first")
    base_corridors = [Corridor(**c) for c in req.corridors]
    corridors_by_week = [base_corridors for _ in range(4)]

    plan = s3.run_monthly_simulation(req.tasks, corridors_by_week, _model, req.month_label)
    return plan.model_dump()


@app.get("/api/blocks")
def get_blocks(status: Optional[str] = None, week_start: Optional[str] = None,
               db: Session = Depends(get_db)):
    """Returns saved blocks from SQLite, optionally filtered by status/week."""
    query = db.query(ScheduledBlockDB)
    if status:
        query = query.filter(ScheduledBlockDB.status == status)
    if week_start:
        query = query.filter(ScheduledBlockDB.week_start == week_start)
    rows = query.all()
    return [{
        "block_id": r.block_id, "corridor_id": r.corridor_id, "section": r.section,
        "week_start": r.week_start, "start_minute": r.start_minute, "end_minute": r.end_minute,
        "task_ids": r.task_ids, "departments": r.departments, "is_merged": r.is_merged,
        "total_risk_cleared": r.total_risk_cleared, "status": r.status,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    } for r in rows]


@app.post("/api/blocks/decide")
def decide_block(req: DecideRequest, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    """
    Applies an officer decision to a persisted block and logs it.
    approve/reject: sets block status directly.
    remove_task: drops one task_id from a merged block (block stays pending
      review unless it's the last task, in which case it's rejected).
    retime_task: validated against the block's own start/end window before
      being written back (blocks can only be retimed within their own slot).
    """
    block = db.get(ScheduledBlockDB, req.block_id)
    if block is None:
        raise HTTPException(404, f"block {req.block_id} not found")

    if req.action == "approve":
        block.status = "approved"

    elif req.action == "reject":
        block.status = "rejected"

    elif req.action == "remove_task":
        if not req.task_id:
            raise HTTPException(400, "task_id required for remove_task")
        if req.task_id not in block.task_ids:
            raise HTTPException(400, f"task {req.task_id} not on block {req.block_id}")
        remaining = [tid for tid in block.task_ids if tid != req.task_id]
        block.task_ids = remaining
        if not remaining:
            block.status = "rejected"

    elif req.action == "retime_task":
        if req.new_start_minute is None or req.new_end_minute is None:
            raise HTTPException(400, "new_start_minute and new_end_minute required")
        if req.new_start_minute < block.start_minute or req.new_end_minute > block.end_minute:
            raise HTTPException(400, "retime must stay within the block's original window")
        if req.new_start_minute >= req.new_end_minute:
            raise HTTPException(400, "new_start_minute must precede new_end_minute")
        block.start_minute = req.new_start_minute
        block.end_minute = req.new_end_minute

    officer_name = current_user.full_name or req.decided_by or "unauthenticated"
    db.add(OfficerDecisionDB(
        block_id=req.block_id, action=req.action, task_id=req.task_id,
        new_start_minute=req.new_start_minute, new_end_minute=req.new_end_minute,
        decided_by=officer_name,
    ))
    db.commit()
    db.refresh(block)

    return {
        "block_id": block.block_id, "status": block.status,
        "task_ids": block.task_ids, "start_minute": block.start_minute,
        "end_minute": block.end_minute,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}
