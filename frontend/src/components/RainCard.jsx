// Rain probability circular gauge + 3-day outlook
export default function RainCard({ data, loading, state }) {
  if (loading) return (
    <div className="card rain-card">
      <div className="rain-card-header">
        <span className="rain-card-title">🌦️ Rain Forecast</span>
        <span className="rain-card-state">{state}</span>
      </div>
      <div className="shimmer" />
    </div>
  );

  if (!data) return (
    <div className="card rain-card">
      <div className="rain-card-title">🌦️ Rain Forecast</div>
      <p style={{ color: 'var(--text-f)', fontSize: 13 }}>Could not load weather data.</p>
    </div>
  );

  const { rain_probability, expected_rain_mm, temp_max, temp_min,
          weather_emoji, weather_label, forecast_3day } = data;

  // SVG gauge
  const r    = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (rain_probability / 100) * circ;
  const gaugeColor = rain_probability >= 70 ? '#4fc3f7'
    : rain_probability >= 40 ? '#f59e0b' : '#00d4aa';

  return (
    <div className="card rain-card">
      <div className="rain-card-header">
        <span className="rain-card-title">🌦️ Rain Forecast — Tomorrow</span>
        <span className="rain-card-state">{state}</span>
      </div>

      <div className="rain-body">
        {/* SVG Gauge */}
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
          <circle cx="65" cy="65" r={r} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <circle cx="65" cy="65" r={r} fill="none"
            stroke={gaugeColor} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
          <text x="65" y="59" textAnchor="middle" fill={gaugeColor}
            fontSize="22" fontWeight="900" fontFamily="Inter">
            {rain_probability}%
          </text>
          <text x="65" y="77" textAnchor="middle" fill="#94a3b8"
            fontSize="10" fontFamily="Inter">
            rain chance
          </text>
        </svg>

        {/* Info */}
        <div className="rain-info-col">
          <div className="rain-condition">
            <span className="rain-emoji">{weather_emoji}</span>
            <span className="rain-cond-label">{weather_label}</span>
          </div>
          <div className="rain-meta">
            <div className="rain-meta-row">
              <span className="rain-meta-icon">💧</span>
              <span className="rain-meta-val">{expected_rain_mm} mm</span>
              <span>expected</span>
            </div>
            <div className="rain-meta-row">
              <span className="rain-meta-icon">🌡️</span>
              <span className="rain-meta-val">{temp_max}° / {temp_min}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-day strip */}
      {forecast_3day && (
        <div className="forecast-strip">
          {forecast_3day.map((day, i) => (
            <div key={day.date} className={`forecast-day${i === 1 ? ' tmrw' : ''}`}>
              <span className="fd-label">{day.label}</span>
              <span className="fd-emoji">{day.weather_emoji}</span>
              <span className="fd-pct" style={{
                color: day.rain_probability >= 60 ? '#4fc3f7'
                  : day.rain_probability >= 35 ? '#f59e0b' : '#94a3b8',
              }}>
                {day.rain_probability}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-f)' }}>{day.temp_max}°C</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
