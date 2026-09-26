"""
System 2: CP-SAT scheduler. Assigns tasks to corridor windows, allows
valid cross-department merges, maximizes risk-weighted coverage.
Depends on System 1's risk_score as objective input.
"""
from ortools.sat.python import cp_model
from schemas import MaintenanceTask, Corridor, ScheduledBlock, MergeCandidate

PROXIMITY_KM = 2.0
MERGE_BONUS_WEIGHT = 25  # omega_merge, integer-scaled alongside risk scores


def _section_compatible(task: MaintenanceTask, corridor: Corridor) -> bool:
    return task.section == corridor.section


def _find_merge_candidates(tasks: list[MaintenanceTask], corridors: list[Corridor],
                            valid_pairs: set[tuple[str, str]]) -> list[MergeCandidate]:
    """Spatial proximity filter: distinct depts, same section, chainage <= 2km."""
    candidates = []
    by_corridor_section = {}
    for c in corridors:
        by_corridor_section.setdefault(c.section, []).append(c)

    for i, ti in enumerate(tasks):
        for tj in tasks[i + 1:]:
            if ti.department == tj.department:
                continue
            if ti.section != tj.section:
                continue
            if abs(ti.chainage_km - tj.chainage_km) > PROXIMITY_KM:
                continue
            for corridor in by_corridor_section.get(ti.section, []):
                if (ti.task_id, corridor.corridor_id) not in valid_pairs:
                    continue
                if (tj.task_id, corridor.corridor_id) not in valid_pairs:
                    continue
                chainage_gap = abs(ti.chainage_km - tj.chainage_km)
                affinity = max(0.1, 1.0 - (chainage_gap / PROXIMITY_KM))
                candidates.append(MergeCandidate(
                    task_i=ti.task_id, task_j=tj.task_id,
                    corridor_id=corridor.corridor_id, merge_affinity=round(affinity, 3),
                ))
    return candidates


def optimize_week(tasks: list[MaintenanceTask], corridors: list[Corridor]) -> tuple[list[ScheduledBlock], list[str]]:
    model = cp_model.CpModel()

    # x[i,c] only created for section-compatible pairs (pruning req #2)
    x = {}
    valid_pairs = set()
    for t in tasks:
        for c in corridors:
            if _section_compatible(t, c):
                x[(t.task_id, c.corridor_id)] = model.NewBoolVar(f"x_{t.task_id}_{c.corridor_id}")
                valid_pairs.add((t.task_id, c.corridor_id))

    merge_candidates = _find_merge_candidates(tasks, corridors, valid_pairs)
    y = {}
    for m in merge_candidates:
        y[(m.task_i, m.task_j, m.corridor_id)] = model.NewBoolVar(
            f"y_{m.task_i}_{m.task_j}_{m.corridor_id}"
        )

    task_by_id = {t.task_id: t for t in tasks}

    # Constraint 1: uniqueness — each task scheduled at most once
    for t in tasks:
        relevant = [x[(t.task_id, c.corridor_id)] for c in corridors
                    if (t.task_id, c.corridor_id) in valid_pairs]
        if relevant:
            model.Add(sum(relevant) <= 1)

    # Constraint 5: merge linearization
    for m in merge_candidates:
        yv = y[(m.task_i, m.task_j, m.corridor_id)]
        xi = x[(m.task_i, m.corridor_id)]
        xj = x[(m.task_j, m.corridor_id)]
        model.Add(yv <= xi)
        model.Add(yv <= xj)
        model.Add(yv >= xi + xj - 1)

    # Constraint 3: temporal capacity with shadow block compression
    for c in corridors:
        duration_terms = []
        for t in tasks:
            if (t.task_id, c.corridor_id) in valid_pairs:
                duration_terms.append(t.duration_minutes * x[(t.task_id, c.corridor_id)])
        compression_terms = []
        for m in merge_candidates:
            if m.corridor_id != c.corridor_id:
                continue
            ti, tj = task_by_id[m.task_i], task_by_id[m.task_j]
            shared = min(ti.duration_minutes, tj.duration_minutes)
            compression_terms.append(shared * y[(m.task_i, m.task_j, m.corridor_id)])
        available = c.window_minutes - c.buffer_minutes
        model.Add(sum(duration_terms) - sum(compression_terms) <= available)

    # Constraint 4: departmental crew capacity per corridor
    for c in corridors:
        for dept, cap in c.dept_capacity.items():
            dept_terms = [x[(t.task_id, c.corridor_id)] for t in tasks
                          if t.department == dept and (t.task_id, c.corridor_id) in valid_pairs]
            if dept_terms:
                model.Add(sum(dept_terms) <= cap)

    # Objective: maximize risk-weighted coverage + merge synergy bonus
    risk_terms = []
    for t in tasks:
        risk_int = int(round((t.risk_score or 0) * 10))  # scale for integer solver
        for c in corridors:
            if (t.task_id, c.corridor_id) in valid_pairs:
                risk_terms.append(risk_int * x[(t.task_id, c.corridor_id)])
    merge_terms = []
    for m in merge_candidates:
        affinity_int = int(round(m.merge_affinity * MERGE_BONUS_WEIGHT))
        merge_terms.append(affinity_int * y[(m.task_i, m.task_j, m.corridor_id)])

    model.Maximize(sum(risk_terms) + sum(merge_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 15.0
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    scheduled_blocks = []
    scheduled_task_ids = set()

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for c in corridors:
            assigned = [t for t in tasks
                        if (t.task_id, c.corridor_id) in valid_pairs
                        and solver.Value(x[(t.task_id, c.corridor_id)]) == 1]
            if not assigned:
                continue
            merged_here = [m for m in merge_candidates
                            if m.corridor_id == c.corridor_id
                            and solver.Value(y[(m.task_i, m.task_j, m.corridor_id)]) == 1]
            # Group merged tasks together; each merge produces one shared block
            merged_task_ids = set()
            for m in merged_here:
                merged_task_ids.update([m.task_i, m.task_j])

            cursor = c.start_minute
            if merged_task_ids:
                merged_tasks = [t for t in assigned if t.task_id in merged_task_ids]
                dur = max(t.duration_minutes for t in merged_tasks)
                block = ScheduledBlock(
                    block_id=f"blk_{c.corridor_id}_merged",
                    corridor_id=c.corridor_id,
                    task_ids=[t.task_id for t in merged_tasks],
                    section=c.section,
                    start_minute=cursor,
                    end_minute=cursor + dur,
                    departments=list({t.department for t in merged_tasks}),
                    is_merged=True,
                    total_risk_cleared=sum(t.risk_score or 0 for t in merged_tasks),
                )
                scheduled_blocks.append(block)
                scheduled_task_ids.update(block.task_ids)
                cursor += dur

            for t in assigned:
                if t.task_id in merged_task_ids:
                    continue
                block = ScheduledBlock(
                    block_id=f"blk_{c.corridor_id}_{t.task_id}",
                    corridor_id=c.corridor_id,
                    task_ids=[t.task_id],
                    section=c.section,
                    start_minute=cursor,
                    end_minute=cursor + t.duration_minutes,
                    departments=[t.department],
                    is_merged=False,
                    total_risk_cleared=t.risk_score or 0,
                )
                scheduled_blocks.append(block)
                scheduled_task_ids.add(t.task_id)
                cursor += t.duration_minutes

    unscheduled = [t.task_id for t in tasks if t.task_id not in scheduled_task_ids]
    return scheduled_blocks, unscheduled
