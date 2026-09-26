"""
System 3 orchestration: weekly tactical plan + 4-week monthly simulation.
Wires physics_fatigue -> system1_priority_engine -> system2_optimizer.
"""
from copy import deepcopy
from schemas import MaintenanceTask, Corridor, WeeklyPlan, MonthlyPlan, SectionTrajectoryPoint
from physics_fatigue import compute_damage_signal
from system1_priority_engine import score_all_tasks
import system2_optimizer as s2


def refresh_damage_signals(tasks: list[dict]) -> list[dict]:
    for t in tasks:
        t["damage_signal"] = compute_damage_signal(t["defect_type"], t["overdue_days"])
    return tasks


def run_weekly_plan(tasks: list[dict], corridors: list[Corridor], model, week_start: str) -> WeeklyPlan:
    """Tactical weekly plan: refresh physics -> score (System 1) -> optimize (System 2)."""
    tasks = refresh_damage_signals(tasks)
    scored = score_all_tasks(tasks, model)
    task_objs = [MaintenanceTask(**t) for t in scored]

    blocks, unscheduled_ids = s2.optimize_week(task_objs, corridors)
    total_risk = sum(b.total_risk_cleared for b in blocks)
    merge_count = sum(1 for b in blocks if b.is_merged)

    return WeeklyPlan(
        week_start=week_start,
        scheduled_blocks=blocks,
        unscheduled_task_ids=unscheduled_ids,
        total_risk_cleared=round(total_risk, 1),
        merge_count=merge_count,
    ), scored


def run_monthly_simulation(tasks: list[dict], corridors_by_week: list[list[Corridor]],
                            model, month_label: str) -> MonthlyPlan:
    """
    4-week loop. Each week: schedule what fits (AI-optimized path); unscheduled
    tasks age forward (overdue_days += 7), damage_signal + risk recompute.
    A parallel status-quo path (no scheduling at all) ages every task every
    week untouched, for comparison.
    """
    ai_tasks = deepcopy(tasks)
    status_quo_tasks = deepcopy(tasks)

    weekly_plans = []
    section_trajectories: dict[str, list[SectionTrajectoryPoint]] = {}

    def section_risk_totals(task_list: list[dict]) -> dict[str, float]:
        totals = {}
        for t in task_list:
            totals[t["section"]] = totals.get(t["section"], 0) + (t.get("risk_score") or 0)
        return totals

    for week_idx in range(4):
        corridors = corridors_by_week[week_idx] if week_idx < len(corridors_by_week) else corridors_by_week[-1]

        # --- AI-optimized path ---
        plan, scored_ai = run_weekly_plan(ai_tasks, corridors, model, f"{month_label}-W{week_idx + 1}")
        weekly_plans.append(plan)
        scored_by_id = {t["task_id"]: t for t in scored_ai}
        scheduled_ids = {tid for b in plan.scheduled_blocks for tid in b.task_ids}

        next_ai_tasks = []
        for t in scored_by_id.values():
            if t["task_id"] in scheduled_ids:
                continue  # cleared, drops out of backlog
            t["overdue_days"] += 7
            t["week_offset"] = week_idx + 1
            next_ai_tasks.append(t)
        ai_tasks = next_ai_tasks

        # --- status-quo path: no scheduling, everything just ages ---
        status_quo_tasks = refresh_damage_signals(status_quo_tasks)
        status_quo_tasks = score_all_tasks(status_quo_tasks, model)
        for t in status_quo_tasks:
            t["overdue_days"] += 7

        # --- record per-section trajectory point ---
        ai_totals = section_risk_totals(scored_ai if week_idx == 0 else scored_by_id.values())
        sq_totals = section_risk_totals(status_quo_tasks)
        all_sections = set(ai_totals) | set(sq_totals)
        for section in all_sections:
            section_trajectories.setdefault(section, []).append(
                SectionTrajectoryPoint(
                    week=week_idx + 1,
                    status_quo_risk=round(sq_totals.get(section, 0), 1),
                    ai_optimized_risk=round(ai_totals.get(section, 0), 1),
                )
            )

    return MonthlyPlan(
        month_label=month_label,
        weekly_plans=weekly_plans,
        section_trajectories=section_trajectories,
    )
