# Water Demand Forecasting — Step 1: Model Training Pipeline

Converts the research notebook into clean, reusable code that a backend API
can call. Trains 6 models (3 states × 2 crops), saves them to disk, and
exports all the numbers the frontend dashboard will need (comparison charts,
feature importance, historical actual-vs-predicted, water savings).

## ⚠️ Run this yourself — not runnable here

`train.py` needs to call `power.larc.nasa.gov` (NASA POWER API). This sandbox's
network is locked to a small allowlist (pip/npm/github only), so that domain
is blocked here. **I tested the full pipeline logic with synthetic mock data
matching NASA's real response format — it runs end-to-end with no bugs.**
You need to run `train.py` once yourself, from a machine with normal internet
(your laptop, or a Colab cell with `!pip install ...`), to fetch real data and
produce real model files.

## Setup

```bash
cd ml
pip install -r requirements.txt
python train.py
```

Takes a few minutes (6 combos × NASA API fetch + XGBoost + ARIMA fit).
When done you'll have:

```
models/
  xgb_Punjab_rice.pkl      xgb_Punjab_wheat.pkl
  xgb_Telangana_rice.pkl   xgb_Telangana_wheat.pkl
  xgb_TamilNadu_rice.pkl   xgb_TamilNadu_wheat.pkl
  lr_*.pkl                 (6 more — comparison baseline)

results/
  metrics.json              # MAE/RMSE/R2 per state+crop, LR vs XGBoost vs ARIMA
  feature_importance.json   # XGBoost feature importance per state+crop
  historical.json           # actual vs predicted on test set (for line charts)
  water_savings.json        # % saved per state+crop
```

## Verify it worked

```bash
python predict.py Punjab rice
```

Should print something like:
```
{'state': 'Punjab', 'crop': 'rice', 'predicted_iwr_mm': 3.2,
 'as_of_date': '2026-08-14', 'water_saved_pct_vs_traditional': 68.0}
```

That's the exact function Step 2 (FastAPI backend) will import and call.

## File guide

- `ml/features.py` — fetch weather, compute ET0/Kc/IWR, build lag+rolling
  features. Shared by training and live inference so they never drift apart.
- `ml/train.py` — offline, run once. Trains + saves everything.
- `ml/predict.py` — live inference. `predict_next_day_iwr(state, crop)` fetches
  the last ~25 days of weather, engineers features, loads the saved XGBoost
  model, returns tomorrow's predicted IWR + water-saving %.

## Note on coordinates

Report (Section 3.1.2) documents Telangana at 17.9°N/79.6°E and Tamil Nadu at
11.1°N/78.6°E — those are used here. One notebook cell had different
(city-level) coordinates for those two states; used the report's official
values since that's what your published MAE/RMSE/R² numbers correspond to.
Flag if you'd rather match the notebook's version instead.

## Next: Step 2 — FastAPI backend

Wraps `predict_next_day_iwr()` + the results JSON files behind REST endpoints
for the React frontend to call.
