from datetime import datetime
from sqlalchemy.orm import Session
from models import ScheduledBlockDB, TrainScheduleDB

def evaluate_drm_block_decision(block_id: int, db: Session):
    """
    Dynamically computes train delay impacts, conflict costs,
    and punctuality trade-offs for DRM sign-off.
    """
    block = db.query(ScheduledBlockDB).filter(ScheduledBlockDB.id == block_id).first()
    if not block:
        return {"error": "Block request not found"}

    # Fetch all trains scheduled inside the requested possession window
    conflicting_trains = db.query(TrainScheduleDB).filter(
        TrainScheduleDB.corridor == block.section.corridor,
        TrainScheduleDB.section_entry_time <= block.window_end,
        TrainScheduleDB.section_exit_time >= block.window_start
    ).all()

    total_punctuality_penalty = 0.0
    affected_train_manifest = []

    for train in conflicting_trains:
        # Delay calculation based on block duration and train path conflict
        delay_mins = max(10, int(block.required_duration_mins * 0.45))
        penalty = delay_mins * train.priority_weight
        total_punctuality_penalty += penalty

        affected_train_manifest.append({
            "train_number": train.train_number,
            "train_name": train.train_name,
            "category": train.train_category,
            "estimated_delay_mins": delay_mins,
            "priority_weight": train.priority_weight
        })

    # DRM Recommendation Logic
    recommendation = "APPROVE" if block.urgency_score > 80.0 or total_punctuality_penalty < 150 else "RESCHEDULE_OFF_PEAK"

    return {
        "block_id": block.id,
        "section_code": block.section.section_code,
        "requested_duration": block.required_duration_mins,
        "urgency_score": block.urgency_score,
        "total_penalty_score": round(total_punctuality_penalty, 2),
        "trains_delayed_count": len(affected_train_manifest),
        "affected_trains": affected_train_manifest,
        "recommendation": recommendation
    }