// Smart irrigation advice combining predicted IWR + rain probability
export default function SmartAdvice({ prediction, rain }) {
  if (!prediction || !rain) return null;

  const prob = rain.rain_probability;
  const iwr  = prediction.predicted_iwr_mm;
  const mm   = rain.expected_rain_mm;

  let type, icon, title, text, rec, recStyle;

  if (prob >= 70) {
    const deficit = Math.max(0, iwr - mm).toFixed(1);
    type  = 'skip';
    icon  = '🌧️';
    title = 'Skip Irrigation Tomorrow';
    text  = `${prob}% rain probability with ${mm} mm expected — that covers your crop's water need of ${iwr} mm/day.${
      deficit > 0 ? ` You may still need ${deficit} mm extra if rainfall is less than forecast.` : ' No irrigation required.'
    }`;
    rec   = '✅ Recommended: Skip or irrigate only if rainfall falls short';
    recStyle = { background: 'rgba(79,195,247,0.14)', color: '#4fc3f7' };
  } else if (prob >= 40) {
    const reduced = Math.max(0, iwr * (1 - prob / 100)).toFixed(1);
    type  = 'reduce';
    icon  = '⚠️';
    title = 'Reduce Irrigation Tomorrow';
    text  = `${prob}% chance of rain (${mm} mm expected) will partly satisfy the ${iwr} mm/day water demand. Apply reduced irrigation to avoid over-watering.`;
    rec   = `💧 Recommended: Apply ~${reduced} mm instead of full ${iwr} mm`;
    recStyle = { background: 'rgba(245,158,11,0.14)', color: '#f59e0b' };
  } else {
    type  = 'irrigate';
    icon  = '💧';
    title = 'Irrigate as Planned Tomorrow';
    text  = `Only ${prob}% chance of rain with ${mm} mm expected — not enough to meet the crop's ${iwr} mm/day water requirement. Proceed with your scheduled irrigation.`;
    rec   = `💧 Recommended: Apply the full ${iwr} mm`;
    recStyle = { background: 'rgba(0,212,170,0.14)', color: 'var(--teal)' };
  }

  return (
    <div className={`advice-banner ${type}`} style={{ marginBottom: 20 }}>
      <div className="advice-icon">{icon}</div>
      <div className="advice-body">
        <div className="advice-title">{title}</div>
        <div className="advice-text">{text}</div>
        <span className="advice-rec" style={recStyle}>{rec}</span>
      </div>
    </div>
  );
}
