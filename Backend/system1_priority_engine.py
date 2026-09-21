"""
System 1 entrypoint. 
"""
import pandas as pd
from rdso_rules import classify_severity, USFD_CYCLE_DAYS
from risk_model import score_tasks

def prepare_features(tasks: list[dict]) -> pd.DataFrame:
    rows = []
    for t in tasks:
        sev = classify_severity(
            t["defect_type"], 
            t.get("measured_size_mm"),
            t.get("q_value"), 
            t.get("overdue_days", 0)
        )
        cycle_days = t.get("cycle_days", USFD_CYCLE_DAYS)
        rows.append({
            "task_id": t["task_id"],
            "severity_score": sev["severity_score"],
            "severity": sev["severity"],
            "rule_reasons": sev["reasons"],
            "overdue_ratio": t.get("overdue_days", 0) / cycle_days,
            "traffic_density": t.get("traffic_density", 0),
            "colocation_risk": t.get("colocation_risk", 0),
            "damage_signal": t.get("damage_signal", 0.0),
        })
    return pd.DataFrame(rows)

def score_all_tasks(tasks: list[dict], model) -> list[dict]:
    df = prepare_features(tasks)
    ml_results = score_tasks(model, df)
    output = []
    for i, t in enumerate(tasks):
        row = df.iloc[i]
        output.append({
            **t,
            "severity": row["severity"],
            "risk_score": ml_results[i]["risk_score"],
            "reasoning": f"{'; '.join(row['rule_reasons'])}. ML: {ml_results[i]['reasoning']}.",
        })
    return output