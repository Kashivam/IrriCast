import { Bar } from 'react-chartjs-2';

export default function ImportanceChart({ importanceData, selectedState, selectedCrop, onStateChange, onCropChange }) {
  const STATES = ['Punjab', 'Telangana', 'TamilNadu'];
  const CROPS  = ['rice', 'wheat'];

  const key  = `${selectedState}_${selectedCrop}`;
  const data = importanceData[key];

  const chartData = (() => {
    if (!data) return null;
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const labels = sorted.map(([k]) => k.replace(/_/g, ' ').replace('7day', '7d'));
    const values = sorted.map(([, v]) => v);
    return {
      labels,
      datasets: [{
        label: 'Feature Importance',
        data: values,
        backgroundColor: values.map((_, i) => `hsla(${170 - i * 10},70%,50%,0.7)`),
        borderColor:     values.map((_, i) => `hsl(${170 - i * 10},70%,55%)`),
        borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
      }],
    };
  })();

  return (
    <>
      <div className="combo-row">
        <label>Model:</label>
        <select className="sel" value={selectedState} onChange={e => onStateChange(e.target.value)}>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="sel" value={selectedCrop} onChange={e => onCropChange(e.target.value)}>
          {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="chart-card full">
        <div className="chart-title">XGBoost Feature Importances</div>
        <div className="chart-subtitle">Top drivers of irrigation water requirement — gain score from the trained XGBoost model</div>
        <div className="chart-wrap tall">
          {chartData && (
            <Bar
              data={chartData}
              options={{
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, title: { display: true, text: 'Gain Score', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  y: { ticks: { color: '#94a3b8', font: { size: 12 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                },
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
