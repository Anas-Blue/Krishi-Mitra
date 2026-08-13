"""
Regression tests for the yield engine.

These pin the behaviours that were actually broken before, so a future refactor
cannot quietly reintroduce them:
  * unknown crop/state/season must degrade, never raise
  * crops are not all measured in tonnes/ha
  * the confidence interval must widen when the model is guessing
  * plot size must not move a per-hectare yield
"""
from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import crop_meta  # noqa: E402
import stress  # noqa: E402

pytest.importorskip("sklearn")
yield_model = pytest.importorskip("yield_model")


BASE = dict(area_ha=2.0, annual_rainfall_mm=1000.0, gdd_pct=0.5,
            tmax_series=[30.0] * 90, daily_rainfall=[5.0] * 90)


def predict(**overrides):
    return yield_model.predict(**{**BASE, **overrides})


# --------------------------------------------------------------------------
# Crop coverage
# --------------------------------------------------------------------------

def test_every_trained_crop_predicts():
    """The whole point of the rebuild: all 55 crops, not three."""
    for crop in yield_model.supported_crops():
        result = predict(crop=crop, season="Kharif", state="Punjab")
        assert result["predicted_yield"] > 0, crop
        assert result["unit"] in (crop_meta.TONNES, crop_meta.NUTS), crop


def test_aliases_resolve_to_same_prediction():
    for alias, canonical in [("paddy", "rice"), ("ganna", "sugarcane"),
                             ("mustard", "rapeseed &mustard"), ("cotton", "cotton(lint)")]:
        a = predict(crop=alias, season="Kharif", state="Punjab")
        b = predict(crop=canonical, season="Kharif", state="Punjab")
        assert a["crop_resolved"] == canonical
        assert a["predicted_yield"] == b["predicted_yield"], alias


def test_unknown_crop_degrades_instead_of_raising():
    result = predict(crop="Quinoa", season="Kharif", state="Punjab")
    assert result["predicted_yield"] > 0
    assert result["crop_recognised"] is False
    assert result["confidence"] == "very_low"


def test_unknown_state_and_season_degrade():
    unknown_state = predict(crop="Rice", season="Kharif", state="Atlantis")
    assert unknown_state["state_resolved"] is None
    assert unknown_state["fallback_level"] == "crop_national"

    # An unrecognised season resolves to the season the crop is actually grown
    # in, rather than silently becoming "Whole Year".
    odd_season = predict(crop="Rice", season="Monsoon", state="Punjab")
    assert odd_season["season_resolved"] in ("Kharif", "Autumn", "Summer", "Winter", "Rabi")


def test_state_aliases():
    assert predict(crop="Rice", season="Kharif", state="Orissa")["state_resolved"] == "Odisha"


# --------------------------------------------------------------------------
# Units — the bug that would report 8,900 tonnes of coconut per hectare
# --------------------------------------------------------------------------

def test_coconut_reported_in_nuts_not_tonnes():
    result = predict(crop="Coconut", season="Whole Year", state="Kerala")
    assert result["unit"] == crop_meta.NUTS
    assert result["predicted_yield"] > 1000


def test_cereal_reported_in_tonnes_and_physically_plausible():
    result = predict(crop="Rice", season="Kharif", state="Punjab")
    assert result["unit"] == crop_meta.TONNES
    assert 1.0 < result["predicted_yield"] < 8.0


# --------------------------------------------------------------------------
# Uncertainty
# --------------------------------------------------------------------------

def test_interval_brackets_the_estimate():
    r = predict(crop="Rice", season="Kharif", state="Punjab")
    assert r["yield_range_low"] < r["predicted_yield"] < r["yield_range_high"]


def test_interval_widens_when_model_is_guessing():
    """A well-covered crop/state must be reported more tightly than a fallback."""
    known = predict(crop="Rice", season="Kharif", state="Punjab")
    guess = predict(crop="Quinoa", season="Kharif", state="Punjab")
    assert guess["interval_half_width_pct"] > known["interval_half_width_pct"]


def test_interval_is_not_the_old_flat_15_percent():
    r = predict(crop="Rice", season="Kharif", state="Punjab")
    ratio = r["yield_range_high"] / r["predicted_yield"]
    assert abs(ratio - 1.15) > 0.01, "interval looks hardcoded again"


# --------------------------------------------------------------------------
# Plot size must not distort a per-hectare figure
# --------------------------------------------------------------------------

def test_area_does_not_change_per_hectare_yield():
    yields = {a: predict(crop="Rice", season="Kharif", state="Punjab", area_ha=a)["predicted_yield"]
              for a in (0.5, 2.0, 10.0, 1000.0)}
    assert len(set(yields.values())) == 1, f"area leaked into per-ha yield: {yields}"


def test_total_production_scales_with_area():
    one = predict(crop="Rice", season="Kharif", state="Punjab", area_ha=1.0)
    ten = predict(crop="Rice", season="Kharif", state="Punjab", area_ha=10.0)
    # rel tolerance, not exact: the total is rounded after multiplying, so it
    # carries a digit of precision the 1 ha figure has already dropped.
    assert ten["total_production"] == pytest.approx(one["total_production"] * 10, rel=1e-3)


def test_defaulted_inputs_are_reported():
    r = predict(crop="Rice", season="Kharif", state="Punjab")
    assert set(r["inputs_defaulted"]) == {"fertilizer_kg_ha", "pesticide_kg_ha"}
    explicit = predict(crop="Rice", season="Kharif", state="Punjab",
                       fertilizer_kg_ha=150.0, pesticide_kg_ha=0.3)
    assert explicit["inputs_defaulted"] == []


# --------------------------------------------------------------------------
# Stress layer
# --------------------------------------------------------------------------

def test_heat_threshold_is_crop_specific():
    """32C is stressful for wheat (upper 30) but not for bajra (upper 38)."""
    hot = [32.0] * 60
    assert stress.compute_heat_factor(hot, "wheat", 0.5) > 0
    assert stress.compute_heat_factor(hot, "bajra", 0.5) == 0


def test_drought_tolerance_is_crop_specific():
    dry = [0.0] * 18 + [10.0] * 10
    assert stress.compute_dry_spell_factor(dry, "rice") > 0        # thirsty, 10-day tolerance
    assert stress.compute_dry_spell_factor(dry, "bajra") == 0      # drought-adapted, 21-day


def test_flowering_heat_costs_more_than_vegetative_heat():
    hot = [40.0] * 30
    flowering = stress.compute_heat_factor(hot, "rice", 0.50)
    vegetative = stress.compute_heat_factor(hot, "rice", 0.10)
    assert flowering > vegetative


def test_stress_factor_stays_clamped():
    catastrophic = stress.apply_stress(
        baseline_yield=3.0, crop="rice", gdd_pct=0.5,
        tmax_series=[50.0] * 200, total_rainfall_mm=0.0, daily_rainfall=[0.0] * 200,
    )
    assert catastrophic["stress_factor"] == 0.5
    lush = stress.apply_stress(
        baseline_yield=3.0, crop="rice", gdd_pct=0.5,
        tmax_series=[25.0] * 90, total_rainfall_mm=5000.0, daily_rainfall=[20.0] * 90,
    )
    assert lush["stress_factor"] <= 1.1


def test_stress_handles_empty_weather_series():
    result = stress.apply_stress(baseline_yield=3.0, crop="rice", gdd_pct=0.5,
                                 tmax_series=[], total_rainfall_mm=0.0, daily_rainfall=[])
    assert 0.5 <= result["stress_factor"] <= 1.1


# --------------------------------------------------------------------------
# Crop metadata
# --------------------------------------------------------------------------

def test_every_trained_crop_has_agronomic_params():
    for crop in yield_model.supported_crops():
        spec = crop_meta.get_spec(crop)
        assert spec["base_temp_c"] < spec["upper_temp_c"], crop
        assert spec["maturity_gdd"] > 0 and spec["water_need_mm"] > 0, crop


def test_unknown_crop_gets_family_default_not_an_error():
    assert crop_meta.get_spec("zzzunknown")["family"] == "other"
    # keyword routing puts an unlisted crop in a sensible family
    assert crop_meta.get_spec("foxtail millet")["family"] == "millet"
    assert crop_meta.get_spec("dragonfruit")["family"] == "plantation"
    assert crop_meta.get_spec("velvet bean")["family"] == "pulse"


def test_model_info_reports_measured_accuracy():
    info = yield_model.model_info()
    assert 0 < info["median_abs_pct_error"] < 30
    assert "temporal holdout" in info["validation"]
    assert info["crops"] >= 50
