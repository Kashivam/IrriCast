"""
Live inference: fetch recent weather, engineer features, predict tomorrow's
IWR with the saved XGBoost model. This is what the backend API (Step 2) calls.

CLI usage (for testing):
    python predict.py Punjab rice
"""
import datetime
import pathlib
import joblib

from features import STATES, build_agri_dataframe, latest_feature_row

_HERE = pathlib.Path(__file__).parent
MODELS_DIR = str(_HERE / "models")
BUFFER_DAYS = 25  # need 7+ days history for lag/rolling features, plus margin
TRADITIONAL_MM = 10.0  # fixed baseline irrigation rate, mm/day


def predict_next_day_iwr(state: str, crop: str) -> dict:
    if state not in STATES:
        raise ValueError(f"Unknown state: {state}. Choose from {list(STATES)}")
    coord = STATES[state]

    # NASA POWER data typically has a 1-2 day publishing lag
    end = datetime.date.today() - datetime.timedelta(days=2)
    start = end - datetime.timedelta(days=BUFFER_DAYS)

    raw = build_agri_dataframe(
        coord["lat"], coord["lon"], crop,
        int(start.strftime("%Y%m%d")), int(end.strftime("%Y%m%d")),
    )
    X = latest_feature_row(raw)

    model = joblib.load(f"{MODELS_DIR}/xgb_{state}_{crop}.pkl")
    pred = float(model.predict(X)[0])

    pred_clipped = min(pred, TRADITIONAL_MM)
    water_saved_pct = round((TRADITIONAL_MM - pred_clipped) / TRADITIONAL_MM * 100, 1)

    return {
        "state": state,
        "crop": crop,
        "predicted_iwr_mm": round(pred, 2),
        "as_of_date": raw["Date"].iloc[-1].strftime("%Y-%m-%d"),
        "water_saved_pct_vs_traditional": water_saved_pct,
    }


if __name__ == "__main__":
    import sys
    state = sys.argv[1] if len(sys.argv) > 1 else "Punjab"
    crop = sys.argv[2] if len(sys.argv) > 2 else "rice"
    print(predict_next_day_iwr(state, crop))
