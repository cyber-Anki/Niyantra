from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class ScheduledBlockDB(Base):
    __tablename__ = "scheduled_blocks"

    block_id = Column(String, primary_key=True, index=True)
    corridor_id = Column(String, index=True)
    section = Column(String, index=True)
    week_start = Column(String, index=True, nullable=True)
    start_minute = Column(Integer)
    end_minute = Column(Integer)
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