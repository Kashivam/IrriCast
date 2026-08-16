import { useState } from 'react';

const STATES = ['Punjab', 'Telangana', 'TamilNadu'];
const CROPS  = [{ v: 'rice', l: '🌾 Rice' }, { v: 'wheat', l: '🌿 Wheat' }];

export default function PredictPanel({
  selectedState, selectedCrop, onStateChange, onCropChange, onPredict, predicting, result,
}) {
  const [fieldHa, setFieldHa] = useState('');

  // Water savings calculator
  const savedLitres = (() => {
    if (!result || !fieldHa || isNaN(fieldHa)) return null;
    const ha = parseFloat(fieldHa);
    const saved_mm = Math.max(0, 10 - result.predicted_iwr_mm);
    return (saved_mm * ha * 10000 / 1000).toFixed(0); // mm × ha → litres
  })();

  return (
    <div className="card accent-border predict-panel">
      <div>
        <div className="predict-title">Tomorrow's Water Forecast</div>
        <div className="predict-sub">AI prediction via XGBoost + NASA POWER real-time data</div>
      </div>

      <div className="predict-controls">
        <select className="sel" value={selectedState} onChange={e => onStateChange(e.target.value)}>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="sel" value={selectedCrop} onChange={e => onCropChange(e.target.value)}>
          {CROPS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
        </select>
        <button className="btn" onClick={onPredict} disabled={predicting}>
          {predicting
            ? <><div className="spinner" /> Fetching…</>
            : <>⚡ Predict Now</>}
        </button>
      </div>

      {result && (
        <>
          <div className="result-row">
            <div className="result-chip teal-chip">
              <div className="chip-label">Predicted IWR</div>
              <div className="chip-val">{result.predicted_iwr_mm}</div>
              <div className="chip-unit">mm / day</div>
            </div>
            <div className="result-chip">
              <div className="chip-label">Water Saved</div>
              <div className="chip-val" style={{ color: 'var(--blue)' }}>{result.water_saved_pct_vs_traditional}%</div>
              <div className="chip-unit">vs 10 mm traditional</div>
            </div>
            <div className="result-chip">
              <div className="chip-label">As of Date</div>
              <div className="chip-val" style={{ fontSize: '16px', color: 'var(--text)', marginTop: '4px' }}>{result.as_of_date}</div>
              <div className="chip-unit">NASA data timestamp</div>
            </div>
          </div>

          {/* Field size calculator */}
          <div className="field-calc">
            <span className="field-label">💡 Field size:</span>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="Hectares"
              value={fieldHa}
              onChange={e => setFieldHa(e.target.value)}
            />
            <span className="field-label">ha →</span>
            {savedLitres !== null
              ? <span className="field-result">💧 Save ~{parseInt(savedLitres).toLocaleString()} litres today</span>
              : <span className="field-label" style={{ color: 'var(--text-f)' }}>enter field size to see savings</span>}
          </div>
        </>
      )}
    </div>
  );
}
