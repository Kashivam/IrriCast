"""
FastAPI backend for the Water Demand Forecasting Dashboard.

Run:
    python -m uvicorn app:app --reload --port 8000

Then open: http://localhost:8000
"""
import json
import pathlib
import sys
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

_HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(_HERE))

from predict import predict_next_day_iwr
from features import STATES

RESULTS_DIR = _HERE / "results"
FRONTEND_DIR = _HERE / "frontend"

app = FastAPI(title="Water Demand Forecasting API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# WMO weather code → human label + emoji
WMO_CODES = {
    0:  ("Clear Sky",          "☀️"),
    1:  ("Mainly Clear",       "🌤️"),
    2:  ("Partly Cloudy",      "⛅"),
    3:  ("Overcast",           "☁️"),
    45: ("Foggy",              "🌫️"),
    48: ("Icy Fog",            "🌫️"),
    51: ("Light Drizzle",      "🌦️"),
    53: ("Drizzle",            "🌦️"),
    55: ("Heavy Drizzle",      "🌧️"),
    61: ("Light Rain",         "🌧️"),
    63: ("Rain",               "🌧️"),
    65: ("Heavy Rain",         "🌧️"),
    71: ("Light Snow",         "❄️"),
    73: ("Snow",               "❄️"),
    75: ("Heavy Snow",         "❄️"),
    80: ("Rain Showers",       "🌦️"),
    81: ("Rain Showers",       "🌦️"),
    82: ("Heavy Rain Showers", "🌧️"),
    95: ("Thunderstorm",       "⛈️"),
    96: ("Thunderstorm + Hail","⛈️"),
    99: ("Heavy Thunderstorm", "⛈️"),
}

# ── API Routes (must be registered before static mount) ─────────────────────

@app.get("/api/predict/{state}/{crop}")
def predict(state: str, crop: str):
    """Live prediction: fetch recent weather from NASA POWER, return tomorrow's IWR."""
    try:
        result = predict_next_day_iwr(state, crop)
        return JSONResponse(content=result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rain/{state}")
def get_rain_forecast(state: str):
    """
    Fetch tomorrow's rain probability, expected rainfall, temperature
    and weather condition from Open-Meteo (free, no API key required).
    """
    if state not in STATES:
        raise HTTPException(status_code=400, detail=f"Unknown state '{state}'. Choose from {list(STATES)}")

    import requests as req
    coord = STATES[state]
    params = {
        "latitude":  coord["lat"],
        "longitude": coord["lon"],
        "daily": "precipitation_probability_max,precipitation_sum,weathercode,temperature_2m_max,temperature_2m_min",
        "timezone": "Asia/Kolkata",
        "forecast_days": 3,
    }
    try:
        resp = req.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo API error: {e}")

    d = resp.json()["daily"]
    # index 0 = today, index 1 = tomorrow
    code = d["weathercode"][1]
    label, emoji = WMO_CODES.get(code, ("Unknown", "🌡️"))

    return {
        "state":              state,
        "date":               d["time"][1],
        "rain_probability":   d["precipitation_probability_max"][1],   # %
        "expected_rain_mm":   d["precipitation_sum"][1],               # mm
        "temp_max":           d["temperature_2m_max"][1],              # °C
        "temp_min":           d["temperature_2m_min"][1],              # °C
        "weather_code":       code,
        "weather_label":      label,
        "weather_emoji":      emoji,
        # 3-day outlook
        "forecast_3day": [
            {
                "date":             d["time"][i],
                "rain_probability": d["precipitation_probability_max"][i],
                "rain_mm":          d["precipitation_sum"][i],
                "temp_max":         d["temperature_2m_max"][i],
                "weather_emoji":    WMO_CODES.get(d["weathercode"][i], ("","🌡️"))[1],
            }
            for i in range(3)
        ]
    }


@app.get("/api/results/metrics")
def get_metrics():
    with open(RESULTS_DIR / "metrics.json") as f:
        return json.load(f)


@app.get("/api/results/historical")
def get_historical():
    with open(RESULTS_DIR / "historical.json") as f:
        return json.load(f)


@app.get("/api/results/feature_importance")
def get_feature_importance():
    with open(RESULTS_DIR / "feature_importance.json") as f:
        return json.load(f)


@app.get("/api/results/water_savings")
def get_water_savings():
    with open(RESULTS_DIR / "water_savings.json") as f:
        return json.load(f)


# ── Serve the HTML Dashboard ─────────────────────────────────────────────────

@app.get("/")
def root():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

# Static assets (CSS, JS, images if any)
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
