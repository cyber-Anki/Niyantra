import numpy as np
import pandas as pd
import xgboost as xgb
from rdso_rules import USFD_CYCLE_DAYS, classify_severity

FEATURES = [
    "severity_score",
    "overdue_ratio",
    "traffic_density",
    "colocation_risk",
    "damage_signal",
]

def generate_calibrated_dataset(n_samples: int = 5000) -> pd.DataFrame:
    np.random.seed(42)
    defect_pool = [
        "rail_crack", "internal_flaw_head", "transverse_fracture",
        "ballast_deficiency", "formation_defect", "signal_relay_fault", "ohe_wire_wear"
    ]
    
    rows = []
    for _ in range(n_samples):
        dtype = np.random.choice(defect_pool)
        size_mm = np.random.uniform(0.5, 3.5) if "crack" in dtype or "flaw" in dtype else None
        q_val = np.random.uniform(25.0, 55.0) if dtype == "ballast_deficiency" else None
        overdue_days = int(np.random.exponential(scale=60))
        traffic_density = int(np.random.choice([40, 75, 110, 160]))
        colocation = int(np.random.choice([0, 1, 2, 3], p=[0.5, 0.3, 0.15, 0.05]))
        damage_signal = np.random.uniform(0.0, 1.0)
        
        sev_data = classify_severity(dtype, size_mm, q_val, overdue_days)
        dept_risk_weight = 1.4 if dtype in ["rail_crack", "internal_flaw_head", "transverse_fracture"] else 1.0
        
        latent_hazard = (
            (sev_data["severity_score"] / 4.0) * 45.0 * dept_risk_weight +
            (min(overdue_days / USFD_CYCLE_DAYS, 3.0) / 3.0) * 20.0 +
            (traffic_density / 160.0) * 25.0 +
            (colocation * 3.5) +
            (damage_signal * 10.0)
        )
        
        label = np.clip(latent_hazard + np.random.normal(0, 2.5), 0, 100)
        
        rows.append({
            "severity_score": sev_data["severity_score"],
            "overdue_ratio": overdue_days / USFD_CYCLE_DAYS,
            "traffic_density": traffic_density,
            "colocation_risk": colocation,
            "damage_signal": damage_signal,
            "accident_base_rate_label": round(float(label), 2)
        })
        
    return pd.DataFrame(rows)

def build_and_train(training_df):
    X = training_df[FEATURES]
    y = training_df["accident_base_rate_label"]
    
    model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.05,
        objective="reg:squarederror",
        random_state=42,
    )
    model.fit(X, y)
    return model

if __name__ == "__main__":
    print("Generating calibrated RDSO dataset...")
    df = generate_calibrated_dataset(n_samples=5000)
    print("Training XGBoost risk ranker...")
    trained_model = build_and_train(df)
    trained_model.save_model("risk_model.json")
    print("Done. Model saved as 'risk_model.json'.")