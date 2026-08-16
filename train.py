"""
Offline training script.

Run this ONCE from an environment with unrestricted internet access
(your laptop, or Google Colab) — it needs to reach power.larc.nasa.gov.

    cd ml
    python train.py

Outputs (used later by the backend API):
    ../models/xgb_{state}_{crop}.pkl   <- best model, serves live predictions
    ../models/lr_{state}_{crop}.pkl    <- baseline, kept for comparison
    ../results/metrics.json            <- MAE/RMSE/R2 for LR, XGBoost, ARIMA
    ../results/feature_importance.json <- XGBoost feature importances
    ../results/historical.json         <- actual vs predicted on test set (for charts)
    ../results/water_savings.json      <- % water saved per state/crop
"""
import json
import os
import joblib
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
from statsmodels.tsa.arima.model import ARIMA

from features import STATES, CROPS, build_agri_dataframe, create_training_features, FEATURE_COLS

import pathlib
START, END = 20200101, 20241231
_HERE = pathlib.Path(__file__).parent
MODELS_DIR = str(_HERE / "models")
RESULTS_DIR = str(_HERE / "results")


def calc_water_saved(y_pred, traditional_mm: float = 10.0) -> float:
    """% water saved by demand-based irrigation vs fixed 10mm/day baseline."""
    y_pred_clipped = np.clip(y_pred, 0, traditional_mm)
    daily_saved = traditional_mm - y_pred_clipped
    pct_saved = (daily_saved.sum() / (traditional_mm * len(y_pred))) * 100
    return round(float(pct_saved), 1)


def run_arima(iwr_series, test_frac: float = 0.2) -> dict:
    split = int(len(iwr_series) * (1 - test_frac))
    train, test = iwr_series[:split], iwr_series[split:]
    model = ARIMA(train, order=(2, 1, 2)).fit()
    forecast = model.forecast(steps=len(test))
    return {
        "MAE": round(float(mean_absolute_error(test, forecast)), 2),
        "RMSE": round(float(np.sqrt(mean_squared_error(test, forecast))), 2),
        "R2": round(float(r2_score(test, forecast)), 2),
    }


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    all_metrics, all_importance, all_historical, all_savings = {}, {}, {}, {}

    for crop in CROPS:
        for state, coord in STATES.items():
            key = f"{state}_{crop}"
            print(f"\n=== {key} ===")

            raw = build_agri_dataframe(coord["lat"], coord["lon"], crop, START, END)
            feat = create_training_features(raw)

            X = feat[FEATURE_COLS]
            y = feat["Target_IWR"]
            split = int(len(feat) * 0.8)
            X_train, X_test = X[:split], X[split:]
            y_train, y_test = y[:split], y[split:]

            # --- Linear Regression (baseline) ---
            lr = LinearRegression().fit(X_train, y_train)
            lr_pred = lr.predict(X_test)
            lr_metrics = {
                "MAE": round(float(mean_absolute_error(y_test, lr_pred)), 2),
                "RMSE": round(float(np.sqrt(mean_squared_error(y_test, lr_pred))), 2),
                "R2": round(float(r2_score(y_test, lr_pred)), 2),
            }
            joblib.dump(lr, f"{MODELS_DIR}/lr_{key}.pkl")

            # --- XGBoost (best model — this is what serves live predictions) ---
            xgb = XGBRegressor(
                n_estimators=200, learning_rate=0.05, max_depth=5,
                subsample=0.8, colsample_bytree=0.8, random_state=42,
            )
            xgb.fit(X_train, y_train)
            xgb_pred = xgb.predict(X_test)
            xgb_metrics = {
                "MAE": round(float(mean_absolute_error(y_test, xgb_pred)), 2),
                "RMSE": round(float(np.sqrt(mean_squared_error(y_test, xgb_pred))), 2),
                "R2": round(float(r2_score(y_test, xgb_pred)), 2),
            }
            joblib.dump(xgb, f"{MODELS_DIR}/xgb_{key}.pkl")

            # --- ARIMA (comparison chart only, not served live) ---
            arima_metrics = run_arima(feat["IWR"])

            all_metrics[key] = {
                "LinearRegression": lr_metrics,
                "XGBoost": xgb_metrics,
                "ARIMA": arima_metrics,
            }
            all_importance[key] = {
                col: round(float(imp), 4)
                for col, imp in sorted(
                    zip(FEATURE_COLS, xgb.feature_importances_), key=lambda x: -x[1]
                )
            }
            all_historical[key] = {
                "dates": feat["Date"].iloc[split:].dt.strftime("%Y-%m-%d").tolist(),
                "actual": [round(float(v), 2) for v in y_test],
                "predicted": [round(float(p), 2) for p in xgb_pred],
            }
            all_savings[key] = calc_water_saved(xgb_pred)

            print(f"  XGBoost  MAE={xgb_metrics['MAE']}  RMSE={xgb_metrics['RMSE']}  R2={xgb_metrics['R2']}")
            print(f"  Water saved vs traditional: {all_savings[key]}%")

    with open(f"{RESULTS_DIR}/metrics.json", "w") as f:
        json.dump(all_metrics, f, indent=2)
    with open(f"{RESULTS_DIR}/feature_importance.json", "w") as f:
        json.dump(all_importance, f, indent=2)
    with open(f"{RESULTS_DIR}/historical.json", "w") as f:
        json.dump(all_historical, f, indent=2)
    with open(f"{RESULTS_DIR}/water_savings.json", "w") as f:
        json.dump(all_savings, f, indent=2)

    print(f"\nDone. {len(all_metrics)} state+crop models saved to {MODELS_DIR}/, results in {RESULTS_DIR}/")


if __name__ == "__main__":
    main()
