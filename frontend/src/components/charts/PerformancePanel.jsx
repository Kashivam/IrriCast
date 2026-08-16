import { Bar } from 'react-chartjs-2';

const MODELS = ['LinearRegression', 'XGBoost', 'ARIMA'];
const COLORS = {
  LinearRegression: { bg: 'rgba(79,195,247,0.7)',  border: '#4fc3f7' },
  XGBoost:          { bg: 'rgba(0,212,170,0.7)',   border: '#00d4aa' },
  ARIMA:            { bg: 'rgba(124,106,247,0.7)', border: '#7c6af7' },
};
const TICK = { color: '#94a3b8' };
const GRID = { color: 'rgba(255,255,255,0.05)' };

function barOpts(title) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: TICK, grid: GRID },
      y: { beginAtZero: true, title: { display: true, text: title, color: '#94a3b8' }, ticks: TICK, grid: GRID },
    },
  };
}

export default function PerformancePanel({ metricsData, selectedState, selectedCrop, onStateChange, onCropChange }) {
  const STATES = ['Punjab', 'Telangana', 'TamilNadu'];
  const CROPS  = ['rice', 'wheat'];

  const key = `${selectedState}_${selectedCrop}`;
  const d   = metricsData[key];

  const mkDataset = (metric) => ({
    label: metric,
    data:   MODELS.map(m => d?.[m]?.[metric] ?? 0),
    backgroundColor: MODELS.map(m => COLORS[m].bg),
    borderColor:     MODELS.map(m => COLORS[m].border),
    borderWidth: 1.5, borderRadius: 8,
  });

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

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-title">MAE Comparison</div>
          <div className="chart-subtitle">Mean Absolute Error — lower is better</div>
          <div className="chart-wrap">
            {d && <Bar data={{ labels: MODELS, datasets: [mkDataset('MAE')] }} options={barOpts('MAE (mm)')} />}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">RMSE Comparison</div>
          <div className="chart-subtitle">Root Mean Squared Error — lower is better</div>
          <div className="chart-wrap">
            {d && <Bar data={{ labels: MODELS, datasets: [mkDataset('RMSE')] }} options={barOpts('RMSE (mm)')} />}
          </div>
        </div>

        {/* Full table */}
        <div className="chart-card full">
          <div className="chart-title">All Regions — Full Metrics Table</div>
          <div className="chart-subtitle">MAE · RMSE · R² for Linear Regression, XGBoost & ARIMA across all 6 state+crop combinations</div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Region + Crop</th><th>Model</th><th>MAE ↓</th><th>RMSE ↓</th><th>R² ↑</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metricsData).map(([k, models]) => {
                  const [st, cr] = k.split('_');
                  return MODELS.map((m, mi) => (
                    <tr key={`${k}-${m}`}>
                      <td>{mi === 0 ? <><strong>{st}</strong> — {cr}</> : ''}</td>
                      <td>
                        <span className={`chip chip-${m === 'XGBoost' ? 'xgb' : m === 'LinearRegression' ? 'lr' : 'ar'}`}>
                          {m === 'LinearRegression' ? 'Lin. Reg.' : m}
                        </span>
                      </td>
                      <td className={models[m].MAE <= Math.min(...MODELS.map(mm => models[mm]?.MAE ?? 99)) ? 'good' : ''}>
                        {models[m].MAE}
                      </td>
                      <td>{models[m].RMSE}</td>
                      <td className={models[m].R2 >= 0.7 ? 'good' : models[m].R2 < 0 ? 'bad' : ''}>
                        {models[m].R2}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
