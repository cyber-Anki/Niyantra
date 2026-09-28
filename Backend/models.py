from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class TrackSectionDB(Base):
    __tablename__ = "track_sections"

    id = Column(Integer, primary_key=True, index=True)
    corridor = Column(String(100), index=True)
    gmt_load = Column(Float, default=0.0)
    speed_kmh = Column(Float, default=100.0)
    tgi_score = Column(Float, nullable=False)
    sleeper_density = Column(Float, nullable=False)
    ballast_cushion_mm = Column(Float, nullable=False)
    section_code = Column(String(50), nullable=True)

class TrackDefectDB(Base):
    __tablename__ = "track_defects"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("track_sections.id"), nullable=False)
    usfd_log_id = Column(String(100), nullable=True)
    defect_type = Column(String(50), nullable=False)  # SQUAT/FRACTURE/WELD_FAILURE
    severity = Column(String(50), nullable=False)     # IMR/OBS/REM
    chainage = Column(Float, nullable=False)
    stress_range_mpa = Column(Float, nullable=False)
    last_inspected_at = Column(DateTime, default=datetime.utcnow)
    initial_crack_depth_mm = Column(Float, nullable=False)
    critical_crack_depth_mm = Column(Float, nullable=False)
    status = Column(String(50), default="ACTIVE")
class TrainScheduleDB(Base):
    __tablename__ = "train_schedules"

    id = Column(Integer, primary_key=True, index=True)
    train_number = Column(String(20), index=True, nullable=False)
    train_name = Column(String(100), nullable=False)
    train_category = Column(String(30), nullable=False)   # PREMIER_PASSENGER, MAIL_EXPRESS, FREIGHT
    priority_weight = Column(Float, nullable=False)        # e.g., 10.0 for Vande Bharat, 2.0 for Freight
    corridor = Column(String(100), nullable=False)        # NDLS-GZB
    origin_station = Column(String(10), nullable=False)
    destination_station = Column(String(10), nullable=False)
    section_entry_time = Column(DateTime, nullable=False)
    section_exit_time = Column(DateTime, nullable=False)
    avg_speed_kmh = Column(Float, default=90.0)


class ShadowBlockOpportunityDB(Base):
    __tablename__ = "shadow_block_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("track_sections.id"), nullable=False)
    primary_block_id = Column(String, ForeignKey("scheduled_blocks.block_id"), nullable=False)
    secondary_block_id = Column(String, ForeignKey("scheduled_blocks.block_id"), nullable=False)
    saved_headway_mins = Column(Integer, nullable=False)
    feasibility_status = Column(String(30), default="FEASIBLE")  # FEASIBLE, CONFLICT, REJECTED

class MaintenanceExecutionDB(Base):
    __tablename__ = "maintenance_executions"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(String, ForeignKey("scheduled_blocks.block_id"), unique=True, nullable=False)
    
    # Execution Telemetry
    actual_start_time = Column(DateTime, nullable=True)
    actual_end_time = Column(DateTime, nullable=True)
    block_burst_mins = Column(Integer, default=0)              # Negative if finished early, positive if delayed
    
    # Resource & Cost Tracking
    materials_used = Column(String(255), nullable=True)        # e.g., "2 AT Welds, 50 Sleepers"
    execution_cost_inr = Column(Float, default=0.0)
    
    # Post-Maintenance Audit
    post_repair_tgi = Column(Float, nullable=True)             # New Track Geometry Index post-tamping
    quality_inspector_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="COMPLETED")           # COMPLETED, INCOMPLETE, FAILED_AUDIT

    block = relationship("ScheduledBlockDB", backref="execution_record")

class ScheduledBlockDB(Base):
    __tablename__ = "scheduled_blocks"

    block_id = Column(String, primary_key=True, index=True)
    corridor_id = Column(String, index=True)
    section = Column(String, index=True)
    week_start = Column(String, index=True, nullable=True)
    start_minute = Column(Integer)
    end_minute = Column(Integer)
    window_start = Column(DateTime, nullable=True)
    window_end = Column(DateTime, nullable=True)
    required_duration_mins = Column(Integer, default=0)
    urgency_score = Column(Float, default=0.0)
    department = Column(String(50), nullable=True)
    defect_id = Column(Integer, ForeignKey("track_defects.id"), nullable=True)
    task_ids = Column(JSON, default=list)
    departments = Column(JSON, default=list)
    is_merged = Column(Boolean, default=False)
    total_risk_cleared = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending | approved | rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    decisions = relationship("OfficerDecisionDB", back_populates="block", cascade="all, delete-orphan")


class OfficerDecisionDB(Base):
    __tablename__ = "officer_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    block_id = Column(String, ForeignKey("scheduled_blocks.block_id"), index=True)
    action = Column(String)  # approve | reject | remove_task | retime_task
    task_id = Column(String, nullable=True)
    new_start_minute = Column(Integer, nullable=True)
    new_end_minute = Column(Integer, nullable=True)
    decided_by = Column(String, default="unauthenticated")
    decided_at = Column(DateTime, default=datetime.utcnow)
    block = relationship("ScheduledBlockDB", back_populates="decisions")


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    
    # RBAC Claims
    role = Column(String(50), nullable=False, default="TRACK_ENGINEER")  
    department = Column(String(20), nullable=False, default="ENG")       
    section_zone = Column(String(50), nullable=False, default="SEC-1")
    division = Column(String(50), nullable=False, default="Delhi (DLI)")
    
    # Security & Audit
    failed_attempts = Column(Integer, default=0, nullable=False)
    lockout_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    @property
    def name(self) -> str:
        return self.full_name

    @name.setter
    def name(self, val: str):
        self.full_name = val

    @property
    def password(self) -> str:
        return self.hashed_password

    @password.setter
    def password(self, val: str):
        self.hashed_password = val