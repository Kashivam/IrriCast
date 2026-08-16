export default function PredictionHistory({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="card history-card" style={{ marginTop: 20 }}>
      <div className="history-title">🕑 Prediction History</div>
      <div className="history-sub">Last {history.length} predictions stored in MongoDB</div>
      <div className="history-grid">
        {history.map(h => (
          <div key={h._id} className="hist-chip">
            <span className="hist-state">{h.state}</span>
            <span className="hist-crop">{h.crop}</span>
            <span className="hist-iwr">{h.predicted_iwr_mm} mm</span>
            <span className="hist-saved">−{h.water_saved_pct}%</span>
            <span className="hist-date">{h.as_of_date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
