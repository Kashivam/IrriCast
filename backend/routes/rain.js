const router = require('express').Router();
const axios = require('axios');

const STATES = {
  Punjab: { lat: 30.9, lon: 75.8 },
  Telangana: { lat: 17.9, lon: 79.6 },
  TamilNadu: { lat: 11.1, lon: 78.6 },
};

const rainCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getWeatherEmoji(condition = '') {
  const text = condition.toLowerCase();

  if (/thunder|lightning/.test(text)) return '⛈️';
  if (/snow|sleet|ice/.test(text)) return '❄️';
  if (/rain|drizzle|shower/.test(text)) return '🌧️';
  if (/fog|mist/.test(text)) return '🌫️';
  if (/partly cloudy/.test(text)) return '⛅';
  if (/cloud|overcast/.test(text)) return '☁️';
  if (/sunny|clear/.test(text)) return '☀️';

  return '🌡️';
}

router.get('/rain/:state', async (req, res) => {
  const { state } = req.params;
  const coord = STATES[state];

  if (!coord) {
    return res.status(400).json({
      error: `Unknown state "${state}". Choose from: ${Object.keys(STATES).join(', ')}`,
    });
  }

  // Reuse a successful response for 10 minutes.
  const cached = rainCache.get(state);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Weather API key is not configured on the server.',
    });
  }

  try {
    const { data } = await axios.get(
      'https://api.weatherapi.com/v1/forecast.json',
      {
        params: {
          key: apiKey,
          q: `${coord.lat},${coord.lon}`,
          days: 3,
          aqi: 'no',
          alerts: 'no',
        },
        timeout: 15000,
      }
    );

    const days = data.forecast?.forecastday;

    if (!days || days.length < 3) {
      throw new Error('Weather provider returned an incomplete forecast.');
    }

    const tomorrow = days[1];
    const tomorrowWeather = tomorrow.day;

    const result = {
      state,
      date: tomorrow.date,
      rain_probability: tomorrowWeather.daily_chance_of_rain ?? 0,
      expected_rain_mm: tomorrowWeather.totalprecip_mm ?? 0,
      temp_max: tomorrowWeather.maxtemp_c,
      temp_min: tomorrowWeather.mintemp_c,
      weather_label: tomorrowWeather.condition.text,
      weather_emoji: getWeatherEmoji(tomorrowWeather.condition.text),

      forecast_3day: days.map((day, index) => ({
        date: day.date,
        label: ['Today', 'Tomorrow', 'Day +2'][index],
        rain_probability: day.day.daily_chance_of_rain ?? 0,
        rain_mm: day.day.totalprecip_mm ?? 0,
        temp_max: day.day.maxtemp_c,
        weather_emoji: getWeatherEmoji(day.day.condition.text),
      })),
    };

    rainCache.set(state, {
      data: result,
      cachedAt: Date.now(),
    });

    return res.json(result);
  } catch (error) {
    const providerMessage =
      error.response?.data?.error?.message || error.message;

    console.error(
      'WeatherAPI request failed:',
      error.response?.status || error.code || 'unknown',
      providerMessage
    );

    return res.status(502).json({
      error: 'Weather API request failed.',
      detail: providerMessage,
    });
  }
});

module.exports = router;
