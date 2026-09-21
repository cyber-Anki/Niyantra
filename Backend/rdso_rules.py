"""
System 1, Layer 1: Rules-engine severity classification.
Grounded in RDSO "Manual for Ultrasonic Testing of Rails and Welds".
"""

USFD_CYCLE_DAYS = 120  
Q_VALUE_ALERT_THRESHOLD = 40  

DEFECT_LIMITS_MM = {
    "head": 1.5,
    "web": 2.0,
}

DEFECT_CATEGORIES = {
    "rail_crack": {"limit_key": "head", "base_severity": "critical"},
    "internal_flaw_head": {"limit_key": "head", "base_severity": "critical"},
    "transverse_fracture": {"limit_key": "web", "base_severity": "critical"},
    "ballast_deficiency": {"limit_key": None, "base_severity": "moderate"},
    "fish_plate_wear": {"limit_key": None, "base_severity": "moderate"},
    "formation_defect": {"limit_key": None, "base_severity": "high"},
    "cable_fault": {"limit_key": None, "base_severity": "high"},
    "signal_relay_fault": {"limit_key": None, "base_severity": "critical"},
    "ohe_wire_wear": {"limit_key": None, "base_severity": "high"},
    "insulator_damage": {"limit_key": None, "base_severity": "moderate"},
}

SEVERITY_RANK = {"low": 1, "moderate": 2, "high": 3, "critical": 4}

def classify_severity(defect_type: str, measured_size_mm: float | None,
                       q_value: float | None, overdue_days: int) -> dict:
    cat = DEFECT_CATEGORIES.get(defect_type, {"limit_key": None, "base_severity": "moderate"})
    severity = cat["base_severity"]
    reasons = [f"Base category severity for '{defect_type}': {severity}"]

    limit_key = cat["limit_key"]
    if limit_key and measured_size_mm is not None:
        limit = DEFECT_LIMITS_MM[limit_key]
        if measured_size_mm >= limit:
            severity = "critical"
            reasons.append(
                f"Measured defect {measured_size_mm}mm exceeds RDSO {limit_key} "
                f"limit {limit}mm — critical per manual"
            )

    if q_value is not None and q_value > Q_VALUE_ALERT_THRESHOLD:
        if SEVERITY_RANK[severity] < SEVERITY_RANK["high"]:
            severity = "high"
        reasons.append(f"Track Quality Index Q={q_value} exceeds alert threshold {Q_VALUE_ALERT_THRESHOLD}")

    if overdue_days > USFD_CYCLE_DAYS:
        bump_days = overdue_days - USFD_CYCLE_DAYS
        reasons.append(f"{overdue_days}d since last USFD test — {bump_days}d past mandated {USFD_CYCLE_DAYS}d cycle")
        if bump_days > 60 and SEVERITY_RANK[severity] < SEVERITY_RANK["critical"]:
            severity = "critical"

    return {
        "severity": severity,
        "severity_score": SEVERITY_RANK[severity],
        "reasons": reasons,
    }