"""
Train RandomForest yield model on Indian agricultural crop yield dataset (1997–2020).
Run this locally once: python train_model.py
Commits yield_model.pkl so Railway does not retrain on every deploy.
"""
import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import joblib

DATASET_PATH = os.path.join(os.path.dirname(__file__), "data", "crop_yield.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "yield_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "label_encoders.pkl")

FEATURE_COLS = ["Crop", "Season", "State", "Area", "Annual_Rainfall", "Fertilizer", "Pesticide"]
TARGET_COL = "Yield"

CROP_ALIASES = {
    "Rice": "Rice", "Wheat": "Wheat", "Maize": "Maize",
    "rice": "Rice", "wheat": "Wheat", "maize": "Maize",
}


def load_and_clean(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]

    # Normalise column names to match expected schema
    rename_map = {}
    for col in df.columns:
        low = col.lower().replace(" ", "_")
        if "crop" in low and "year" not in low:
            rename_map[col] = "Crop"
        elif "season" in low:
            rename_map[col] = "Season"
        elif "state" in low:
            rename_map[col] = "State"
        elif low == "area":
            rename_map[col] = "Area"
        elif "rainfall" in low:
            rename_map[col] = "Annual_Rainfall"
        elif "fertilizer" in low:
            rename_map[col] = "Fertilizer"
        elif "pesticide" in low:
            rename_map[col] = "Pesticide"
        elif "production" in low:
            rename_map[col] = "Production"
        elif "yield" in low:
            rename_map[col] = "Yield"
    df = df.rename(columns=rename_map)

    # Derive Yield if missing (tonnes/hectare)
    if "Yield" not in df.columns and "Production" in df.columns and "Area" in df.columns:
        df["Yield"] = df["Production"] / df["Area"].replace(0, np.nan)

    required = set(FEATURE_COLS + [TARGET_COL])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}. Available: {list(df.columns)}")

    df = df[FEATURE_COLS + [TARGET_COL]].copy()
    df.dropna(inplace=True)

    # Strip whitespace from categoricals
    for col in ["Crop", "Season", "State"]:
        df[col] = df[col].astype(str).str.strip()

    # Remove physically impossible yields (0 or > 100 t/ha)
    df = df[(df[TARGET_COL] > 0) & (df[TARGET_COL] < 100)]
    df = df[df["Area"] > 0]

    return df


def encode_categoricals(df: pd.DataFrame):
    encoders = {}
    for col in ["Crop", "Season", "State"]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
    return df, encoders


def train(df: pd.DataFrame):
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\n{'='*40}")
    print(f"  Model Evaluation (honest, not invented)")
    print(f"  MAE : {mae:.4f} t/ha")
    print(f"  R²  : {r2:.4f}")
    print(f"{'='*40}\n")

    return model, mae, r2


def main():
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print("Download 'Agricultural Crop Yield in Indian States' dataset from Kaggle")
        print("and place the CSV at ai-service/data/crop_yield.csv")
        sys.exit(1)

    print("Loading and cleaning dataset...")
    df = load_and_clean(DATASET_PATH)
    print(f"Clean records: {len(df):,}")

    print("Encoding categoricals...")
    df, encoders = encode_categoricals(df)

    print("Training RandomForest (200 trees, depth 15)...")
    model, mae, r2 = train(df)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODER_PATH)

    print(f"Saved model → {MODEL_PATH}")
    print(f"Saved encoders → {ENCODER_PATH}")
    print("\nNow commit yield_model.pkl and label_encoders.pkl to the repo.")


if __name__ == "__main__":
    main()
