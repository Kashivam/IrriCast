const router = require('express').Router();
const axios  = require('axios');

const STATES = {
  Punjab:    { lat: 30.9, lon: 75.8 },
  Telangana: { lat: 17.9, lon: 79.6 },
  TamilNadu: { lat: 11.1, lon: 78.6 },
};

// WMO weather interpretation codes → [label, emoji]
const WMO = {
  0:  ['Clear Sky',           '☀️'],
  1:  ['Mainly Clear',        '🌤️'],
  2:  ['Partly Cloudy',       '⛅'],
  3:  ['Overcast',            '☁️'],
  45: ['Foggy',               '🌫️'],
  48: ['Icy Fog',             '🌫️'],
  51: ['Light Drizzle',       '🌦️'],
  53: ['Drizzle',             '🌦️'],
  55: ['Heavy Drizzle',       '🌧️'],
  61: ['Light Rain',          '🌧️'],
  63: ['Rain',                '🌧️'],
  65: ['Heavy Rain',          '🌧️'],
  71: ['Light Snow',          '❄️'],
  73: ['Snow',                '❄️'],
  75: ['Heavy Snow',          '❄️'],
  80: ['Rain Showers',        '🌦️'],
  81: ['Rain Showers',        '🌦️'],
  82: ['Heavy Rain Showers',  '🌧️'],
  95: ['Thunderstorm',        '⛈️'],
  96: ['Thunderstorm + Hail', '⛈️'],
  99: ['Heavy Thunderstorm',  '⛈️'],
};

// ── GET /api/rain/:state ─────────────────────────────────────────────────────
router.get('/rain/:state', async (req, res) => {
  const { state } = req.params;
  const coord = STATES[state];
  if (!coord)
    return res.status(400).json({ error: `Unknown state "${state}". Choose from: ${Object.keys(STATES).join(', ')}` });

  try {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude:  coord.lat,
        longitude: coord.lon,
        daily:     'precipitation_probability_max,precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min',
        timezone:  'Asia/Kolkata',
        forecast_days: 3,
      },
      timeout: 10_000,
    });

    const d = data.daily;
    const wmo1 = WMO[d.weather_code[1]] || ['Unknown', '🌡️'];

    res.json({
      state,
      date:            d.time[1],
      rain_probability:d.precipitation_probability_max[1],   // % for tomorrow
      expected_rain_mm:d.precipitation_sum[1],               // mm
      temp_max:        d.temperature_2m_max[1],
      temp_min:        d.temperature_2m_min[1],
      weather_label:   wmo1[0],
      weather_emoji:   wmo1[1],
      forecast_3day: [0, 1, 2].map(i => ({
        date:            d.time[i],
        label:           ['Today', 'Tomorrow', 'Day +2'][i],
        rain_probability:d.precipitation_probability_max[i],
        rain_mm:         d.precipitation_sum[i],
        temp_max:        d.temperature_2m_max[i],
        weather_emoji:   (WMO[d.weather_code[i]] || ['', '🌡️'])[1],
      })),
    });
  } catch (e) {
    res.status(502).json({ error: 'Open-Meteo API error', detail: e.message });
  }
});

module.exports = router;
