"""
Generates realistic seed data for the 3 source systems this project
integrates against (TMS, SMMS, TDMS) plus COA corridor windows.
Replace with real data.gov.in / Kaggle / datameet feeds later —
this keeps the same output shape so nothing downstream changes.
"""
import random
from schemas import MaintenanceTask, Corridor

random.seed(42)

SECTIONS = ["NDLS-GZB", "GZB-MB", "NDLS-PWL", "PWL-MTJ", "MB-SRE"]

TMS_DEFECTS = ["rail_crack", "internal_flaw_head", "transverse_fracture",
               "ballast_deficiency", "fish_plate_wear", "formation_defect"]
SMMS_DEFECTS = ["signal_relay_fault", "cable_fault"]
TDMS_DEFECTS = ["ohe_wire_wear", "insulator_damage"]


def _gen_task(idx: int, dept: str, defect_type: str) -> MaintenanceTask:
    section = random.choice(SECTIONS)
    measured_size = None
    q_value = None
    if defect_type in ("rail_crack", "internal_flaw_head", "transverse_fracture"):
        measured_size = round(random.uniform(0.5, 3.0), 2)
        q_value = round(random.uniform(15, 60), 1)
    duration = {"ENG": random.choice([60, 90, 120]),
                "SNT": random.choice([45, 60]),
                "TRD": random.choice([90, 150])}[dept]

    return MaintenanceTask(
        task_id=f"{dept}-{idx:04d}",
        department=dept,
        defect_type=defect_type,
        section=section,
        chainage_km=round(random.uniform(0, 45), 2),
        measured_size_mm=measured_size,
        q_value=q_value,
        overdue_days=random.randint(0, 180),
        duration_minutes=duration,
        traffic_density=round(random.uniform(20, 140), 1),  # trains/day, replace with real COA data
        colocation_risk=0,  # filled in post-pass below
    )


def _fill_colocation_risk(tasks: list[MaintenanceTask]) -> None:
    """Count open defects from OTHER departments within 2km, same section."""
    for t in tasks:
        count = 0
        for other in tasks:
            if other.task_id == t.task_id or other.department == t.department:
                continue
            if other.section == t.section and abs(other.chainage_km - t.chainage_km) <= 2.0:
                count += 1
        t.colocation_risk = count


def generate_tasks(n_eng=40, n_snt=20, n_trd=20) -> list[MaintenanceTask]:
    tasks = []
    idx = 1
    for _ in range(n_eng):
        tasks.append(_gen_task(idx, "ENG", random.choice(TMS_DEFECTS))); idx += 1
    for _ in range(n_snt):
        tasks.append(_gen_task(idx, "SNT", random.choice(SMMS_DEFECTS))); idx += 1
    for _ in range(n_trd):
        tasks.append(_gen_task(idx, "TRD", random.choice(TDMS_DEFECTS))); idx += 1
    _fill_colocation_risk(tasks)
    return tasks


def generate_corridors(week_label: str = "2025-04-14", n_per_section=2) -> list[Corridor]:
    """
    Simulates COA timetable white-space: realistic corridor windows per
    section, per day. window_minutes ~ available possession time between
    scheduled trains; buffer_minutes = Block Working Manual handover buffer.
    """
    corridors = []
    idx = 1
    days = [f"{week_label}+{d}" for d in range(7)]
    for section in SECTIONS:
        for day in days:
            for _ in range(n_per_section):
                corridors.append(Corridor(
                    corridor_id=f"COR-{idx:04d}",
                    section=section,
                    day=day,
                    start_minute=random.choice([0, 240, 480, 720]),
                    window_minutes=random.choice([120, 180, 240]),
                    buffer_minutes=random.choice([15, 20]),
                ))
                idx += 1
    return corridors


def bootstrap() -> dict:
    tasks = generate_tasks()
    corridors = generate_corridors()
    return {
        "tasks": [t.model_dump() for t in tasks],
        "corridors": [c.model_dump() for c in corridors],
    }
