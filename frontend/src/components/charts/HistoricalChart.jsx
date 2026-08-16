import { Line } from 'react-chartjs-2';

const CHART_OPTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { labels: { usePointStyle: true, pointStyle: 'line', padding: 18, color: '#94a3b8' } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: { ticks: { maxTicksLimit: 12, maxRotation: 0, color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: {
      title: { display: true, text: 'IWR (mm/day)', color: '#94a3b8' },
      beginAtZero: true,
      ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
  interaction: { mode: 'nearest', axis: 'x', intersect: false },
};

export default function HistoricalChart({ historicalData, selectedState, selectedCrop, onStateChange, onCropChange }) {
  const STATES = ['Punjab', 'Telangana', 'TamilNadu'];
  const CROPS  = ['rice', 'wheat'];

  const key = `${selectedState}_${selectedCrop}`;
  const d   = historicalData[key];

  const chartData = (() => {
    if (!d) return null;
    const n      = Math.min(d.dates.length, 120);
    const labels = d.dates.slice(-n).map(dt => { const [,m,dy] = dt.split('-'); return `${dy}/${m}`; });
    return {
      labels,
      datasets: [
        { label: 'Actual IWR',       data: d.actual.slice(-n),    borderColor: '#4fc3f7', backgroundColor: 'rgba(79,195,247,0.07)',  borderWidth: 1.5, pointRadius: 0, fill: true, tension: 0.3 },
        { label: 'XGBoost Predicted',data: d.predicted.slice(-n), borderColor: '#00d4aa', backgroundColor: 'rgba(0,212,170,0.07)', borderWidth: 2,   pointRadius: 0, fill: true, tension: 0.3, borderDash: [5,3] },
      ],
    };
  })();

  return (
    <>
      <div className="combo-row">
        <label>Region:</label>
        <select className="sel" value={selectedState} onChange={e => onStateChange(e.target.value)}>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="sel" value={selectedCrop} onChange={e => onCropChange(e.target.value)}>
          {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="chart-card full">
        <div className="chart-title">Actual vs Predicted IWR</div>
        <div className="chart-subtitle">XGBoost predictions on the test set (last 20% of 2020–2024 data) — 120-day window shown</div>
        <div className="chart-wrap tall">
          {chartData ? <Line data={chartData} options={CHART_OPTS} /> : <p style={{ color: 'var(--text-f)', paddingTop: 20 }}>Loading…</p>}
        </div>
      </div>
    </>
  );
}
