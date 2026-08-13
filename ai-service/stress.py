"""
Pure stress-factor computation. No side effects, no I/O.
All functions work on daily weather arrays.
"""
from __future__ import annotations
from typing import TypedDict


class StressBreakdown(TypedDict):
    heat_factor: float
    water_factor: float
    dry_spell_factor: float
    stress_factor: float  # clamped composite


CROP_UPPER_TEMPS = {"rice": 35.0, "wheat": 30.0, "maize": 35.0}
CROP_WATER_NEEDS = {"rice": 1100.0, "wheat": 450.0, "maize": 550.0}

_STRESS_MIN = 0.5
_STRESS_MAX = 1.1


def compute_heat_factor(tmax_series: list[float], crop: str, gdd_pct: float) -> float:
    """
    Reduce yield for each day above the crop's upper temperature threshold.
    Extra penalty when heat hits during flowering (40–65% GDD progress).
    """
    upper = CROP_UPPER_TEMPS.get(crop.lower(), 35.0)
    hot_days = sum(1 for t in tmax_series if t > upper)

    base_reduction = hot_days * 0.008  # 0.8% per hot day

    # Flowering heat stress: additional 1% per day beyond 5 hot days
    flowering_active = 0.40 <= gdd_pct <= 0.65
    extra = 0.0
    if flowering_active and hot_days > 5:
        extra = (hot_days - 5) * 0.010

    return max(0.0, base_reduction + extra)


def compute_water_factor(total_rainfall_mm: float, crop: str) -> float:
    """
    Compare actual rainfall to crop water need.
    Reduction scales linearly below 60% of need; bonus possible above need (capped).
    """
    need = CROP_WATER_NEEDS.get(crop.lower(), 550.0)
    ratio = total_rainfall_mm / need if need > 0 else 1.0

    if ratio >= 1.0:
        return -min((ratio - 1.0) * 0.02, 0.05)  # slight bonus for surplus, max 5%
    if ratio >= 0.6:
        return (1.0 - ratio) * 0.20  # gentle linear reduction
    return 0.20 + (0.6 - ratio) * 0.50  # steep below 60%


def compute_dry_spell_factor(daily_rainfall: list[float]) -> float:
    """
    Find the longest consecutive dry run (< 1mm/day).
    Reduction starts after 14 days, increases after 21.
    """
    max_run = 0
    current_run = 0
    for rain in daily_rainfall:
        if rain < 1.0:
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 0

    if max_run <= 14:
        return 0.0
    if max_run <= 21:
        return (max_run - 14) * 0.015  # 1.5% per day beyond 14
    return 0.105 + (max_run - 21) * 0.025  # steeper after 21 days


def apply_stress(
    baseline_yield: float,
    crop: str,
    gdd_pct: float,
    tmax_series: list[float],
    total_rainfall_mm: float,
    daily_rainfall: list[float],
) -> StressBreakdown:
    """
    Compute composite stress factor and apply to baseline.
    Stress factor is clamped to [0.5, 1.1].
    """
    heat_reduction = compute_heat_factor(tmax_series, crop, gdd_pct)
    water_reduction = compute_water_factor(total_rainfall_mm, crop)
    dry_reduction = compute_dry_spell_factor(daily_rainfall)

    total_reduction = heat_reduction + water_reduction + dry_reduction
    stress_factor = max(_STRESS_MIN, min(_STRESS_MAX, 1.0 - total_reduction))
    predicted_yield = baseline_yield * stress_factor

    return StressBreakdown(
        heat_factor=round(heat_reduction, 4),
        water_factor=round(water_reduction, 4),
        dry_spell_factor=round(dry_reduction, 4),
        stress_factor=round(stress_factor, 4),
    )
