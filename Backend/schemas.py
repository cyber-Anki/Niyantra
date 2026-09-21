"""
Shared Pydantic v2 schemas. All other modules import from here.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

Department = Literal["ENG", "SNT", "TRD"]
DefectType = Literal[
    "rail_crack", "internal_flaw_head", "transverse_fracture",
    "ballast_deficiency", "fish_plate_wear", "formation_defect",
    "cable_fault", "signal_relay_fault", "ohe_wire_wear", "insulator_damage",
]
MECHANICAL_DEFECTS = {"rail_crack", "internal_flaw_head", "transverse_fracture",
                       "ballast_deficiency", "fish_plate_wear", "formation_defect"}
ELECTRICAL_DEFECTS = {"cable_fault", "signal_relay_fault", "ohe_wire_wear", "insulator_damage"}


class MaintenanceTask(BaseModel):
    task_id: str
    department: Department
    defect_type: DefectType
    section: str                       # e.g. "NDLS-GZB"
    chainage_km: float                 # km marker along section
    measured_size_mm: Optional[float] = None
    q_value: Optional[float] = None
    overdue_days: int = 0
    duration_minutes: int = 60
    traffic_density: float = 0.0       # trains/day, from COA data
    colocation_risk: int = 0           # count of co-located open defects, other depts
    damage_signal: float = 0.0         # System 3 output, 0-1
    # System 1 output (filled after scoring)
    severity: Optional[str] = None
    risk_score: Optional[float] = None
    reasoning: Optional[str] = None
    # Scheduling state
    week_offset: int = 0               # 0 = this week, rolls forward if unscheduled


class Corridor(BaseModel):
    corridor_id: str
    section: str
    day: str                           # e.g. "2025-04-14"
    start_minute: int                  # minutes from week start
    window_minutes: int                # total available window
    buffer_minutes: int = 15           # Block Working Manual clearance/handover buffer
    dept_capacity: dict[Department, int] = Field(
        default_factory=lambda: {"ENG": 2, "SNT": 2, "TRD": 1}
    )


class MergeCandidate(BaseModel):
    task_i: str
    task_j: str
    corridor_id: str
    merge_affinity: float              # 0-1, higher = better synergy


class ScheduledBlock(BaseModel):
    block_id: str
    corridor_id: str
    task_ids: list[str]                # >1 means merged block
    section: str
    start_minute: int
    end_minute: int
    departments: list[Department]
    is_merged: bool = False
    total_risk_cleared: float = 0.0


class OfficerDecision(BaseModel):
    block_id: str
    action: Literal["approve", "reject", "remove_task", "retime_task"]
    task_id: Optional[str] = None
    new_start_minute: Optional[int] = None
    new_end_minute: Optional[int] = None
    decided_by: str = "unauthenticated"
    decided_at: datetime = Field(default_factory=datetime.utcnow)


class WeeklyPlan(BaseModel):
    week_start: str
    scheduled_blocks: list[ScheduledBlock]
    unscheduled_task_ids: list[str]
    total_risk_cleared: float
    merge_count: int


class SectionTrajectoryPoint(BaseModel):
    week: int
    status_quo_risk: float
    ai_optimized_risk: float


class MonthlyPlan(BaseModel):
    month_label: str
    weekly_plans: list[WeeklyPlan]
    section_trajectories: dict[str, list[SectionTrajectoryPoint]]


class Conflict(BaseModel):
    corridor_id: str
    task_ids: list[str]
    reason: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
