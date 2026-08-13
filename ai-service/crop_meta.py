"""
Agronomic reference table for every crop in the training dataset.

Single source of truth for crop-specific constants used by three consumers:
  * stress.py       — heat/water stress thresholds
  * yield_model.py  — output units, crop-family fallback for unknown crops
  * the Node GDD engine, via `python export_crop_params.py`

The constants are literature-typical values (FAO-56 seasonal crop water
requirement; standard GDD base temperatures used in Indian agromet advisories).
They are approximations chosen per crop family, NOT measured per-state values —
treat them as an advisory adjustment layer, not as calibrated science.

`unit` matters: the dataset's yield column is not tonnes/ha for every crop.
Coconut is recorded in nuts/ha and Cotton in lint tonnes/ha. Reporting either
as "tonnes per hectare" would be off by three orders of magnitude.
"""
from __future__ import annotations

from typing import TypedDict

TONNES = "t/ha"
NUTS = "nuts/ha"


class CropSpec(TypedDict):
    family: str
    unit: str
    base_temp_c: float      # GDD accumulation floor
    upper_temp_c: float     # GDD cap AND heat-stress threshold
    maturity_gdd: float     # cumulative GDD to harvest
    water_need_mm: float    # seasonal requirement
    perennial: bool


def _c(family: str, base: float, upper: float, gdd: float, water: float,
       unit: str = TONNES, perennial: bool = False) -> CropSpec:
    return CropSpec(family=family, unit=unit, base_temp_c=base, upper_temp_c=upper,
                    maturity_gdd=gdd, water_need_mm=water, perennial=perennial)


# --------------------------------------------------------------------------
# Family defaults — used when a crop is not in CROPS below.
# --------------------------------------------------------------------------
FAMILY_DEFAULTS: dict[str, CropSpec] = {
    "cereal":    _c("cereal",    10, 34, 2000, 500),
    "millet":    _c("millet",    10, 36, 1600, 380),
    "pulse":     _c("pulse",     10, 32, 1500, 380),
    "oilseed":   _c("oilseed",    8, 33, 1800, 480),
    "fibre":     _c("fibre",     13, 35, 2200, 700),
    "tuber":     _c("tuber",      7, 30, 1600, 500),
    "vegetable": _c("vegetable",  7, 32, 1700, 450),
    "spice":     _c("spice",     10, 33, 1900, 700),
    "plantation":_c("plantation",12, 34, 3500, 1300, perennial=True),
    "sugar":     _c("sugar",     10, 36, 4500, 1800),
    "other":     _c("other",     10, 33, 1900, 550),
}

# --------------------------------------------------------------------------
# Per-crop table. Keys are the canonical dataset crop names, lowercased.
# --------------------------------------------------------------------------
CROPS: dict[str, CropSpec] = {
    # ---- cereals ----
    "rice":            _c("cereal", 10, 35, 2400, 1100),
    "wheat":           _c("cereal",  5, 30, 2100, 450),
    "maize":           _c("cereal", 10, 35, 1700, 550),
    "barley":          _c("cereal",  5, 30, 1800, 400),
    "jowar":           _c("cereal", 10, 36, 2000, 450),
    "other cereals":   _c("cereal", 10, 34, 1900, 450),

    # ---- millets ----
    "bajra":           _c("millet", 11, 38, 1600, 350),
    "ragi":            _c("millet", 10, 35, 1800, 400),
    "small millets":   _c("millet", 10, 36, 1400, 330),

    # ---- pulses ----
    "gram":            _c("pulse",  10, 30, 1500, 350),
    "arhar/tur":       _c("pulse",  11, 34, 2600, 500),
    "moong(green gram)": _c("pulse", 11, 34, 1200, 320),
    "urad":            _c("pulse",  11, 34, 1300, 330),
    "masoor":          _c("pulse",   5, 29, 1500, 320),
    "moth":            _c("pulse",  12, 38, 1200, 260),
    "horse-gram":      _c("pulse",  11, 35, 1400, 280),
    "khesari":         _c("pulse",   6, 30, 1500, 320),
    "cowpea(lobia)":   _c("pulse",  11, 35, 1300, 340),
    "peas & beans (pulses)": _c("pulse", 5, 28, 1400, 380),
    "guar seed":       _c("pulse",  12, 38, 1500, 300),
    "other kharif pulses": _c("pulse", 11, 34, 1500, 360),
    "other  rabi pulses":  _c("pulse",  6, 30, 1500, 340),
    "other summer pulses": _c("pulse", 12, 35, 1300, 340),

    # ---- oilseeds ----
    "groundnut":       _c("oilseed", 10, 34, 2200, 550),
    "soyabean":        _c("oilseed", 10, 33, 1800, 500),
    "rapeseed &mustard": _c("oilseed", 5, 29, 1500, 350),
    "sunflower":       _c("oilseed",  7, 33, 1700, 500),
    "sesamum":         _c("oilseed", 12, 36, 1400, 350),
    "castor seed":     _c("oilseed", 12, 36, 2500, 550),
    "linseed":         _c("oilseed",  5, 30, 1600, 350),
    "safflower":       _c("oilseed",  5, 31, 1900, 380),
    "niger seed":      _c("oilseed", 10, 33, 1500, 400),
    "other oilseeds":  _c("oilseed",  9, 33, 1800, 450),
    "oilseeds total":  _c("oilseed",  9, 33, 1800, 450),

    # ---- fibres ----
    "cotton(lint)":    _c("fibre", 15, 35, 2800, 800),
    "jute":            _c("fibre", 12, 36, 1800, 500),
    "mesta":           _c("fibre", 12, 36, 1800, 500),
    "sannhamp":        _c("fibre", 12, 36, 1500, 400),

    # ---- sugar ----
    "sugarcane":       _c("sugar", 10, 36, 4500, 1800),

    # ---- tubers / vegetables ----
    "potato":          _c("tuber",  7, 28, 1300, 500),
    "sweet potato":    _c("tuber", 12, 33, 1800, 500),
    "tapioca":         _c("tuber", 13, 35, 4000, 800),
    "onion":           _c("vegetable", 7, 30, 1800, 400),
    "garlic":          _c("vegetable", 5, 28, 1800, 400),

    # ---- spices ----
    "dry chillies":    _c("spice", 12, 34, 1900, 600),
    "turmeric":        _c("spice", 12, 33, 2600, 1200),
    "ginger":          _c("spice", 12, 33, 2400, 1300),
    "coriander":       _c("spice",  5, 30, 1400, 350),
    "black pepper":    _c("spice", 15, 33, 3000, 2000, perennial=True),
    "cardamom":        _c("spice", 12, 30, 3000, 2500, perennial=True),

    # ---- plantation ----
    "coconut":         _c("plantation", 13, 35, 3600, 1400, unit=NUTS, perennial=True),
    "arecanut":        _c("plantation", 13, 35, 3600, 1800, perennial=True),
    "cashewnut":       _c("plantation", 13, 36, 3600, 900,  perennial=True),
    "banana":          _c("plantation", 12, 35, 4000, 1500, perennial=True),

    # ---- other ----
    "tobacco":         _c("other", 12, 33, 1800, 500),
}

# --------------------------------------------------------------------------
# Alias map: farmer/UI-facing names -> canonical dataset key.
# --------------------------------------------------------------------------
ALIASES: dict[str, str] = {
    "paddy": "rice", "dhan": "rice", "chawal": "rice",
    "gehu": "wheat", "gehun": "wheat",
    "makka": "maize", "corn": "maize",
    "bengal gram": "gram", "chana": "gram", "chickpea": "gram",
    "pigeon pea": "arhar/tur", "tur": "arhar/tur", "arhar": "arhar/tur", "toor": "arhar/tur",
    "green gram": "moong(green gram)", "moong": "moong(green gram)", "mung": "moong(green gram)",
    "black gram": "urad", "urad dal": "urad", "urd": "urad",
    "lentil": "masoor", "masur": "masoor",
    "pearl millet": "bajra", "finger millet": "ragi", "sorghum": "jowar",
    "mustard": "rapeseed &mustard", "rapeseed": "rapeseed &mustard", "sarson": "rapeseed &mustard",
    "soybean": "soyabean", "soya bean": "soyabean",
    "sesame": "sesamum", "til": "sesamum",
    "cotton": "cotton(lint)", "kapas": "cotton(lint)",
    "sugar cane": "sugarcane", "ganna": "sugarcane",
    "aloo": "potato", "batata": "potato",
    "pyaz": "onion", "onions": "onion",
    "chilli": "dry chillies", "chillies": "dry chillies", "chili": "dry chillies",
    "mirch": "dry chillies", "red chilli": "dry chillies",
    "haldi": "turmeric", "adrak": "ginger", "lehsun": "garlic",
    "cassava": "tapioca", "groundnuts": "groundnut", "peanut": "groundnut",
    "moongphali": "groundnut", "nariyal": "coconut", "kela": "banana",
    "supari": "arecanut", "betelnut": "arecanut", "kaju": "cashewnut",
    "pepper": "black pepper", "kali mirch": "black pepper", "elaichi": "cardamom",
    "cowpea": "cowpea(lobia)", "lobia": "cowpea(lobia)",
    "peas": "peas & beans (pulses)", "matar": "peas & beans (pulses)",
    "horsegram": "horse-gram", "kulthi": "horse-gram",
    "niger": "niger seed", "castor": "castor seed", "guar": "guar seed",
    "sunhemp": "sannhamp", "sunn hemp": "sannhamp", "tambaku": "tobacco",
}


def canonical_crop(name: str) -> str:
    """Normalise arbitrary user input to a dataset crop key."""
    key = " ".join(str(name).strip().lower().split())
    if key in CROPS:
        return key
    if key in ALIASES:
        return ALIASES[key]
    # tolerate punctuation/spacing drift, e.g. "Arhar / Tur", "Moong (Green Gram)"
    squashed = key.replace(" ", "").replace("-", "").replace("_", "")
    for candidate in CROPS:
        if candidate.replace(" ", "").replace("-", "").replace("_", "") == squashed:
            return candidate
    for alias, target in ALIASES.items():
        if alias.replace(" ", "").replace("-", "") == squashed:
            return target
    return key  # unknown; caller decides the fallback


def get_spec(crop: str) -> CropSpec:
    """
    Return the agronomic spec for a crop. Unknown crops resolve to a family
    guess by keyword, then to the generic 'other' profile — never raises, so a
    crop outside the dataset degrades to advisory-quality output instead of a 500.
    """
    key = canonical_crop(crop)
    if key in CROPS:
        return CROPS[key]

    for keyword, family in (
        ("pulse", "pulse"), ("gram", "pulse"), ("bean", "pulse"), ("dal", "pulse"),
        ("millet", "millet"), ("seed", "oilseed"), ("oil", "oilseed"),
        ("nut", "plantation"), ("fruit", "plantation"),
        ("chilli", "spice"), ("spice", "spice"), ("cotton", "fibre"),
        ("cane", "sugar"), ("potato", "tuber"),
    ):
        if keyword in key:
            return FAMILY_DEFAULTS[family]
    return FAMILY_DEFAULTS["other"]


def yield_unit(crop: str) -> str:
    return get_spec(crop)["unit"]


def known_crops() -> list[str]:
    return sorted(CROPS)
