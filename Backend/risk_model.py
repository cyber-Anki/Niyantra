"""
System 1, Layer 2: ML risk-ranking model.
"""
import numpy as np
import xgboost as xgb
import shap

FEATURES = [
    "severity_score",
    "overdue_ratio",
    "traffic_density",
    "colocation_risk",
    "damage_signal",
]

_EXPLAINER_CACHE = None

def get_explainer(model):
    global _EXPLAINER_CACHE
    if _EXPLAINER_CACHE is None:
        _EXPLAINER_CACHE = shap.TreeExplainer(model)
    return _EXPLAINER_CACHE

def score_tasks(model, tasks_df):
    X = tasks_df[FEATURES]
    raw = model.predict(X)
    risk_scores = np.clip(raw, 0.0, 100.0)

    explainer = get_explainer(model)
    shap_raw = explainer.shap_values(X)
    shap_values = np.atleast_2d(shap_raw)

    results = []
    for i in range(len(tasks_df)):
        row_shap = shap_values[i]
        top_idx = np.argsort(-np.abs(row_shap))[:2]
        parts = []
        for idx in top_idx:
            feat = FEATURES[idx]
            direction = "increased" if row_shap[idx] > 0 else "decreased"
            parts.append(f"{feat.replace('_', ' ')} {direction} risk")
        reasoning = "; ".join(parts)
        results.append({
            "risk_score": round(float(risk_scores[i]), 1),
            "reasoning": reasoning
        })
    return results