"""
Generate synthetic Indian crop yield dataset for KrishiMitra model training.
Based on publicly reported Indian agricultural statistics (ICAR, DACFW).
Covers Rice, Wheat, Maize across major Indian states, 1997-2020.
"""
import csv
import random
import os

random.seed(42)

STATES = [
    "Uttar Pradesh", "Punjab", "Haryana", "West Bengal", "Andhra Pradesh",
    "Tamil Nadu", "Karnataka", "Madhya Pradesh", "Maharashtra", "Bihar",
    "Odisha", "Rajasthan", "Gujarat", "Assam", "Chhattisgarh",
    "Jharkhand", "Uttarakhand", "Himachal Pradesh", "Telangana", "Jammu and Kashmir"
]

CROP_CONFIGS = {
    "Rice": {
        "seasons": ["Kharif"],
        "base_yield": 2.2,  # t/ha national avg
        "state_multipliers": {
            "Punjab": 1.9, "Haryana": 1.7, "Andhra Pradesh": 1.6,
            "Tamil Nadu": 1.5, "Uttar Pradesh": 1.1, "West Bengal": 1.0,
            "Bihar": 0.9, "Odisha": 0.85, "Assam": 0.8, "Jharkhand": 0.75
        },
        "area_range": (50000, 3000000),
        "rainfall_range": (800, 1600),
        "fertilizer_range": (80, 200),
        "pesticide_range": (0.5, 8),
    },
    "Wheat": {
        "seasons": ["Rabi"],
        "base_yield": 2.9,
        "state_multipliers": {
            "Punjab": 2.1, "Haryana": 2.0, "Uttarakhand": 1.8,
            "Uttar Pradesh": 1.3, "Madhya Pradesh": 1.1, "Rajasthan": 0.95,
            "Bihar": 0.9, "Himachal Pradesh": 1.4, "Jammu and Kashmir": 1.2
        },
        "area_range": (10000, 2500000),
        "rainfall_range": (300, 700),
        "fertilizer_range": (100, 250),
        "pesticide_range": (0.3, 6),
    },
    "Maize": {
        "seasons": ["Kharif", "Rabi"],
        "base_yield": 2.5,
        "state_multipliers": {
            "Karnataka": 1.7, "Andhra Pradesh": 1.6, "Telangana": 1.5,
            "Rajasthan": 1.3, "Madhya Pradesh": 1.2, "Uttar Pradesh": 1.1,
            "Bihar": 0.9, "Jharkhand": 0.85, "Himachal Pradesh": 1.4
        },
        "area_range": (5000, 800000),
        "rainfall_range": (400, 1200),
        "fertilizer_range": (70, 180),
        "pesticide_range": (0.4, 7),
    }
}

YEARS = list(range(1997, 2021))

def generate_records():
    records = []
    for year in YEARS:
        for crop, config in CROP_CONFIGS.items():
            for state in STATES:
                for season in config["seasons"]:
                    # Skip implausible combos (wheat in tropical states)
                    if crop == "Wheat" and state in ["Tamil Nadu", "Andhra Pradesh", "Telangana", "Karnataka", "West Bengal", "Assam", "Odisha", "Chhattisgarh"]:
                        continue

                    multiplier = config["state_multipliers"].get(state, 1.0)
                    # Year trend: productivity improved ~1.5% per year
                    year_factor = 1 + (year - 1997) * 0.015

                    area = random.randint(*config["area_range"])
                    rainfall = random.uniform(*config["rainfall_range"])
                    fertilizer = random.uniform(*config["fertilizer_range"])
                    pesticide = random.uniform(*config["pesticide_range"])

                    # Base yield with noise
                    base = config["base_yield"] * multiplier * year_factor
                    noise = random.gauss(0, 0.15)  # 15% std dev
                    yield_val = max(0.3, base + noise)

                    # Rainfall impact
                    optimal_rain = (config["rainfall_range"][0] + config["rainfall_range"][1]) / 2
                    rain_factor = 1 - abs(rainfall - optimal_rain) / (optimal_rain * 2)
                    yield_val *= (0.85 + 0.3 * max(0, rain_factor))

                    production = yield_val * area

                    records.append({
                        "Crop": crop,
                        "Season": season,
                        "State": state,
                        "Year": year,
                        "Area": round(area, 2),
                        "Production": round(production, 2),
                        "Annual_Rainfall": round(rainfall, 2),
                        "Fertilizer": round(fertilizer, 2),
                        "Pesticide": round(pesticide, 4),
                        "Yield": round(yield_val, 4),
                    })
    return records

def main():
    output_path = os.path.join(os.path.dirname(__file__), "data", "crop_yield.csv")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    records = generate_records()
    random.shuffle(records)

    fieldnames = ["Crop", "Season", "State", "Year", "Area", "Production",
                  "Annual_Rainfall", "Fertilizer", "Pesticide", "Yield"]

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"✅ Generated {len(records):,} records → {output_path}")
    print(f"   Crops: {set(r['Crop'] for r in records)}")
    print(f"   States: {len(set(r['State'] for r in records))}")
    print(f"   Years: 1997–2020")

if __name__ == "__main__":
    main()
