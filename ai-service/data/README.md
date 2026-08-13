# Dataset

`crop_yield.csv` — **Crop Yield in Indian States, 1997–2020**. Committed to the
repo, so `train_model.py` runs with no download step.

| | |
|---|---|
| Rows | 19,689 (19,056 after cleaning) |
| Crops | 55 |
| States | 30 |
| Years | 1997–2020 |
| Columns | `Crop, Crop_Year, Season, State, Area, Production, Annual_Rainfall, Fertilizer, Pesticide, Yield` |

Original source: [Kaggle — Agricultural Crop Yield in Indian States](https://www.kaggle.com/datasets/akshatgupta7/crop-yield-in-indian-states-dataset),
compiled from Ministry of Agriculture & Farmers Welfare figures. Kaggle requires
an account, so the copy here was retrieved from a public mirror of the same
file; row count, schema and values match the published dataset.

## Things to know before trusting a number

These are properties of the data itself, and they shape how `train_model.py`
treats it:

- **`Area` is a district/state aggregate**, median 9,317 ha — not a farm. It is
  deliberately *not* a model feature; see the note in `train_model.py`.
- **`Fertilizer` and `Pesticide` are totals, not per-hectare**, and they vary
  only by state-year, not by crop. Training divides them by `Area`.
- **`Yield` is not consistently `Production / Area`.** Training recomputes it
  rather than trusting the column.
- **Units differ by crop.** Coconut is nuts/ha (median ~8,900) and cotton is
  lint. `crop_meta.py` records the unit per crop; never label output "t/ha"
  globally.
- **Rajasthan is absent**, despite being a major agricultural state. Requests
  for it fall back to national crop averages and are flagged `confidence: low`.
- **2020 is nearly empty** (37 rows), so the 2017+ holdout is effectively
  2017–2019.

## Retraining

```bash
cd ai-service
python train_model.py        # prints honest holdout metrics, writes yield_model.pkl
python export_crop_params.py # regenerates server/data/cropParams.json
```

Commit the regenerated `yield_model.pkl`. If you change `scikit-learn` or
`numpy` in `requirements.txt`, retrain in the same commit — the pickle embeds
scikit-learn's internal tree layout.
