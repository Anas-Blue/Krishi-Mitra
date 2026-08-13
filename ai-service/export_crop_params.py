"""
Export the agronomic table to JSON for the Node GDD engine.

    python export_crop_params.py

crop_meta.py is the single source of truth. The Node service is deployed
separately and cannot import Python, so it reads a generated JSON checked into
the repo. Re-run this whenever crop_meta.py changes; server/tests/gddEngine
asserts the file is present and complete.
"""
from __future__ import annotations

import json
import os

import crop_meta

OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "..", "server", "data", "cropParams.json")


def plausible_yield_bounds() -> dict[str, dict[str, float]]:
    """
    Physically plausible yield range per crop, from the observed distribution.

    The Node validator used a flat 0.3-12 t/ha gate, which is only correct for
    cereals: it would have rejected every sugarcane (~57), banana (~18) and
    coconut (~8,900 nuts) prediction as impossible, and accepted nothing for
    cardamom (~0.1). Bounds are the 1st/99th percentile widened 2x either way,
    so they catch genuine nonsense without second-guessing the model.
    """
    try:
        import pandas as pd

        import train_model
    except ImportError:
        return {}

    dataset = train_model.DATASET_PATH
    if not os.path.exists(dataset):
        return {}

    df = train_model.load_and_clean(dataset)
    bounds = {}
    for crop, group in df.groupby("Crop"):
        lo, hi = group["Yield"].quantile([0.01, 0.99])
        bounds[crop] = {"min": round(float(lo) / 2, 4), "max": round(float(hi) * 2, 4)}
    return bounds


def main() -> None:
    bounds = plausible_yield_bounds()
    payload = {
        "_generated_by": "ai-service/export_crop_params.py — do not edit by hand",
        "_source": "ai-service/crop_meta.py",
        "familyDefaults": {
            family: {
                "base": spec["base_temp_c"],
                "upper": spec["upper_temp_c"],
                "maturityGdd": spec["maturity_gdd"],
                "waterNeedMm": spec["water_need_mm"],
                "unit": spec["unit"],
                "perennial": spec["perennial"],
            }
            for family, spec in crop_meta.FAMILY_DEFAULTS.items()
        },
        "crops": {
            name: {
                "family": spec["family"],
                "base": spec["base_temp_c"],
                "upper": spec["upper_temp_c"],
                "maturityGdd": spec["maturity_gdd"],
                "waterNeedMm": spec["water_need_mm"],
                "unit": spec["unit"],
                "perennial": spec["perennial"],
                **({"yieldMin": bounds[name]["min"], "yieldMax": bounds[name]["max"]}
                   if name in bounds else {}),
            }
            for name, spec in sorted(crop_meta.CROPS.items())
        },
        "aliases": dict(sorted(crop_meta.ALIASES.items())),
    }

    out = os.path.normpath(OUT_PATH)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    print(f"Wrote {len(payload['crops'])} crops + {len(payload['aliases'])} aliases -> {out}")


if __name__ == "__main__":
    main()
