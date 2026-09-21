"""
Physics-grounded degradation models. Pure math, no dependencies on
System 1 or 2 — computes damage_signal (0.0-1.0) per task.

Mechanical defects (rail_crack, internal_flaw_head, transverse_fracture,
ballast_deficiency, fish_plate_wear, formation_defect):
    Paris' Law inspired power-law growth: damage(t) = damage_0 + C * t^m
    t = days past mandated USFD interval (120d). m > 1 -> slow-then-
    accelerating convex growth, matching real fatigue crack behaviour.

Electrical/aging-component defects (cable_fault, signal_relay_fault,
ohe_wire_wear, insulator_damage):
    Weibull hazard function: h(t) = (beta/eta) * (t/eta)^(beta-1)
    beta > 1 -> increasing failure rate (wear-out), appropriate for
    aging assets.
"""
from schemas import MECHANICAL_DEFECTS, ELECTRICAL_DEFECTS

USFD_CYCLE_DAYS = 120

# Tuned per defect type. rail_crack has steepest m (fatigue-fracture
# dominant failure mode per RDSO manual language).
PARIS_PARAMS = {
    "rail_crack":            {"C": 4.0e-5, "m": 2.6, "damage_0": 0.05},
    "internal_flaw_head":    {"C": 3.5e-5, "m": 2.4, "damage_0": 0.05},
    "transverse_fracture":   {"C": 5.0e-5, "m": 2.8, "damage_0": 0.08},
    "ballast_deficiency":    {"C": 1.0e-5, "m": 1.4, "damage_0": 0.02},
    "fish_plate_wear":       {"C": 1.2e-5, "m": 1.5, "damage_0": 0.02},
    "formation_defect":      {"C": 2.0e-5, "m": 1.8, "damage_0": 0.03},
}

# Weibull params tuned per defect type. eta = characteristic life (days
# past mandate at which ~63% cumulative hazard reached).
WEIBULL_PARAMS = {
    "cable_fault":           {"beta": 2.0, "eta": 90},
    "signal_relay_fault":    {"beta": 2.4, "eta": 60},
    "ohe_wire_wear":         {"beta": 1.8, "eta": 120},
    "insulator_damage":      {"beta": 1.6, "eta": 150},
}


def _days_past_mandate(overdue_days: int) -> float:
    return max(0.0, overdue_days - USFD_CYCLE_DAYS)


def paris_law_damage(defect_type: str, overdue_days: int) -> float:
    p = PARIS_PARAMS.get(defect_type, {"C": 2.0e-5, "m": 1.8, "damage_0": 0.03})
    t = _days_past_mandate(overdue_days)
    raw = p["damage_0"] + p["C"] * (t ** p["m"])
    return min(1.0, raw)


def weibull_hazard_damage(defect_type: str, overdue_days: int) -> float:
    p = WEIBULL_PARAMS.get(defect_type, {"beta": 2.0, "eta": 100})
    t = max(0.0, float(overdue_days))
    beta, eta = p["beta"], p["eta"]
    if t == 0:
        return 0.0
    h = (beta / eta) * ((t / eta) ** (beta - 1))
    # normalize hazard rate to 0-1 damage signal via saturating transform
    return min(1.0, 1 - pow(2.718281828, -h * eta / 10))


def compute_damage_signal(defect_type: str, overdue_days: int) -> float:
    """Dispatches to the correct physics model by defect category."""
    if defect_type in MECHANICAL_DEFECTS:
        return round(paris_law_damage(defect_type, overdue_days), 4)
    if defect_type in ELECTRICAL_DEFECTS:
        return round(weibull_hazard_damage(defect_type, overdue_days), 4)
    return 0.0
