from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import ScheduledBlockDB, MaintenanceExecutionDB, TrackDefectDB

def execute_post_maintenance_audit(block_id: int, actual_start: datetime, actual_end: datetime, cost: float, db: Session):
    """
    System 3 Engine: Closes the maintenance loop, calculates efficiency, 
    and resets System 1 degradation parameters.
    """
    block = db.query(ScheduledBlockDB).filter(ScheduledBlockDB.id == block_id).first()
    if not block:
        return {"error": "Block not found"}

    # 1. Calculate Execution Efficiency
    sanctioned_duration = block.required_duration_mins
    actual_duration = int((actual_end - actual_start).total_seconds() / 60)
    burst_mins = actual_duration - sanctioned_duration

    # 2. Log the Execution
    execution = MaintenanceExecutionDB(
        block_id=block.id,
        actual_start_time=actual_start,
        actual_end_time=actual_end,
        block_burst_mins=burst_mins,
        execution_cost_inr=cost,
        status="COMPLETED"
    )
    db.add(execution)

    # 3. Reset System 1 Physics Engine (Close the loop)
    # If this block was tied to a defect, the defect is now repaired.
    if block.defect_id:
        defect = db.query(TrackDefectDB).filter(TrackDefectDB.id == block.defect_id).first()
        if defect:
            defect.status = "REPAIRED"
            # Reset the crack depth so the Paris' Law engine stops flagging it
            defect.initial_crack_depth_mm = 0.0 

    # 4. Close the Block in System 2
    block.status = "EXECUTED"
    
    db.commit()

    return {
        "status": "success",
        "block_id": block.id,
        "efficiency_report": {
            "sanctioned_mins": sanctioned_duration,
            "actual_mins": actual_duration,
            "burst_mins": burst_mins,
            "bue_percentage": round((sanctioned_duration / max(1, actual_duration)) * 100, 1)
        },
        "system_1_status": "Defect metrics reset to baseline."
    }