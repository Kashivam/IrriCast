"""
Shared feature engineering pipeline for the Water Demand Forecasting project.

Mirrors the methodology from the original research (Hargreaves-Samani ET0,
FAO-56 crop coefficients, lag/rolling temporal features). Used by BOTH
train.py (offline training) and predict.py (live inference) so training
and serving stay consistent — same features, same order, same math.
"""
import pandas as pd
import numpy as np
import requests

# NOTE: report methodology (Section 3.1.2 / Fig 3.1) documents these coordinates.
# An earlier notebook draft used slightly different (city-level) coords for
# Telangana/TamilNadu — using the report's officially documented values here
# since that's what all published MAE/RMSE/R2 numbers correspond to.
STATES = {
    "Punjab": {"lat": 30.9, "lon": 75.8},
    "Telangana": {"lat": 17.9, "lon": 79.6},
    "TamilNadu": {"lat": 11.1, "lon": 78.6},
}
CROPS = ["rice", "wheat"]

NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
NASA_PARAMS = "T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS2M,RH2M"

FEATURE_COLS = [
    "T2M_MAX", "T2M_MIN", "PRECTOTCORR", "ALLSKY_SFC_SW_DWN", "WS2M", "RH2M",
    "ET0", "Kc", "ETc", "Pe",
    "IWR_lag_1", "IWR_lag_2", "IWR_lag_3", "IWR_lag_7",
    "ET0_lag_1", "ET0_lag_2", "ET0_lag_3", "ET0_lag_7",
    "ET0_7day_avg", "Rain_7day_sum",
]


def fetch_nasa_power(lat: float, lon: float, start: int, end: int) -> pd.DataFrame:
    """Fetch daily meteorological data from NASA POWER API (Agricultural community)."""
    params = {
        "parameters": NASA_PARAMS,
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": start,
        "end": end,
        "format": "JSON",
    }
    resp = requests.get(NASA_POWER_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    df = pd.DataFrame(data["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.reset_index(inplace=True)
    df.rename(columns={"index": "Date"}, inplace=True)
    return df


def compute_et0(df: pd.DataFrame) -> pd.Series:
    """Reference evapotranspiration via Hargreaves-Samani equation."""
    t_mean = (df["T2M_MAX"] + df["T2M_MIN"]) / 2
    rs = df["ALLSKY_SFC_SW_DWN"]
    return 0.0023 * (t_mean + 17.8) * np.sqrt(df["T2M_MAX"] - df["T2M_MIN"]) * rs


def compute_kc(day: int, crop: str) -> float:
    """Crop coefficient by growth stage (FAO-56 piecewise values)."""
    if crop == "rice":
        if day < 30:
            return 1.10
        elif day < 90:
            return 1.20
        return 0.90
    elif crop == "wheat":
        if day < 25:
            return 0.70
        elif day < 75:
            return 1.15
        return 0.40
    raise ValueError(f"Unknown crop: {crop}")


def effective_rainfall(precip: pd.Series) -> pd.Series:
    """80% of total precipitation retained in root zone (typical for Indian soils)."""
    return precip * 0.8


def build_agri_dataframe(lat: float, lon: float, crop: str, start: int, end: int) -> pd.DataFrame:
    """Fetch weather + compute ET0/Kc/ETc/Pe/IWR for one state+crop combo."""
    df = fetch_nasa_power(lat, lon, start, end)
    df["ET0"] = compute_et0(df)
    # NOTE (known limitation, matches report Sec 8.7): Day counts up continuously
    # across the whole date range rather than resetting each growing season, so
    # Kc locks into its "late season" value after day 90/75 for the rest of the
    # series. This matches the original methodology/report numbers as-is.
    df["Day"] = range(1, len(df) + 1)
    df["Kc"] = df["Day"].apply(lambda d: compute_kc(d, crop))
    df["ETc"] = df["ET0"] * df["Kc"]
    df["Pe"] = effective_rainfall(df["PRECTOTCORR"])
    df["IWR"] = (df["ETc"] - df["Pe"]).clip(lower=0)
    df["Crop"] = crop
    return df


def add_lag_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    """Lag (1,2,3,7 day) + 7-day rolling features. No target column — safe for inference."""
    df = df.copy()
    for lag in [1, 2, 3, 7]:
        df[f"IWR_lag_{lag}"] = df["IWR"].shift(lag)
        df[f"ET0_lag_{lag}"] = df["ET0"].shift(lag)
    df["ET0_7day_avg"] = df["ET0"].rolling(7).mean()
    df["Rain_7day_sum"] = df["PRECTOTCORR"].rolling(7).sum()
    return df


def create_training_features(df: pd.DataFrame) -> pd.DataFrame:
    """Full feature set + next-day IWR target, for model training. Drops warm-up NaN rows."""
    df = add_lag_rolling_features(df)
    df["Target_IWR"] = df["IWR"].shift(-1)
    return df.dropna().reset_index(drop=True)


def latest_feature_row(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature row for the most recent day, used to predict TOMORROW's IWR.
    No target needed/dropped here — this is what live inference calls.
    """
    df = add_lag_rolling_features(df)
    df = df.dropna(subset=FEATURE_COLS).reset_index(drop=True)
    if len(df) == 0:
        raise ValueError("Not enough history to compute rolling/lag features — widen the fetch window.")
    return df.iloc[[-1]][FEATURE_COLS]
