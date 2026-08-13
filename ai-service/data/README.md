# Dataset Directory

Place the Kaggle dataset here before running `train_model.py`.

## Required File

`crop_yield.csv` — Agricultural Crop Yield in Indian States (1997–2020)

## Download

1. Go to: https://www.kaggle.com/datasets/akshatgupta7/crop-yield-in-indian-states-dataset
2. Download the CSV
3. Rename/copy it to: `ai-service/data/crop_yield.csv`

## Expected Columns

The script auto-detects column names. It expects columns related to:
- Crop name
- Season (Kharif/Rabi/etc.)
- State name
- Area (hectares)
- Annual rainfall
- Fertilizer usage
- Pesticide usage
- Production OR Yield

After placing the CSV, run:

```bash
cd ai-service
python train_model.py
```

This prints real MAE and R² values, then saves `yield_model.pkl` and `label_encoders.pkl`.
Commit both pkl files to the repo before deploying to Railway.
