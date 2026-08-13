"""
Yield model wrapper. Loads RandomForest + encoders once at import time.
Raises clearly on missing pkl so Railway startup fails fast.
"""
from __future__ import annotations
import os
import joblib
import numpy as np
from stress import apply_stress

_BASE_DIR = os.path.dirname(__file__)
_MODEL_PATH = os.path.join(_BASE_DIR, "yield_model.pkl")
_ENCODER_PATH = os.path.join(_BASE_DIR, "label_encoders.pkl")

# Load once — fail loudly if pkl missing (means train_model.py was not run)
try:
    _model = joblib.load(_MODEL_PATH)
    _encoders = joblib.load(_ENCODER_PATH)
except FileNotFoundError as exc:
    raise RuntimeError(
        "yield_model.pkl not found. Run `python train_model.py` first, "
        "then commit the .pkl files to the repository."
    ) from exc


def _encode_value(encoder, value: str) -> int:
    """Encode a categorical value; map unknowns to most-frequent class (index 0)."""
    classes = list(encoder.classes_)
    if value in classes:
        return encoder.transform([value])[0]
    # graceful degradation for unseen state/season
    return 0


def predict(
    *,
    crop: str,
    season: str,
    state: str,
    area_ha: float,
    annual_rainfall_mm: float,
    fertilizer_kg_ha: float,
    pesticide_kg_ha: float,
    gdd_pct: float,
    tmax_series: list[float],
    daily_rainfall: list[float],
) -> dict:
    """
    Returns baseline and stress-adjusted yield prediction with range ±15%.
    """
    crop_enc = _encode_value(_encoders["Crop"], crop.capitalize())
    season_enc = _encode_value(_encoders["Season"], season.strip())
    state_enc = _encode_value(_encoders["State"], state.strip())

    features = np.array([[
        crop_enc,
        season_enc,
        state_enc,
        area_ha,
        annual_rainfall_mm,
        fertilizer_kg_ha,
        pesticide_kg_ha,
    ]])

    baseline_yield = float(_model.predict(features)[0])
    total_rainfall = sum(daily_rainfall)

    stress = apply_stress(
        baseline_yield=baseline_yield,
        crop=crop,
        gdd_pct=gdd_pct,
        tmax_series=tmax_series,
        total_rainfall_mm=total_rainfall,
        daily_rainfall=daily_rainfall,
    )

    predicted = baseline_yield * stress["stress_factor"]
    low = round(predicted * 0.85, 3)
    high = round(predicted * 1.15, 3)

    return {
        "baseline_yield": round(baseline_yield, 3),
        "stress_factor": stress["stress_factor"],
        "heat_factor": stress["heat_factor"],
        "water_factor": stress["water_factor"],
        "dry_spell_factor": stress["dry_spell_factor"],
        "predicted_yield": round(predicted, 3),
        "yield_range_low": low,
        "yield_range_high": high,
    }
