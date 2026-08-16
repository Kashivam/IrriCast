import { Bar } from 'react-chartjs-2';

export default function SavingsPanel({ savingsData }) {
  const entries = Object.entries(savingsData);
  if (!entries.length) return null;

  const labels = entries.map(([k]) => k.replace('_', ' '));
  const values = entries.map(([, v]) => v);
  const colors = entries.map(([k]) =>
    k.includes('wheat') ? 'rgba(245,158,11,0.75)' : 'rgba(0,212,170,0.75)'
  );
  const borders = entries.map(([k]) =>
    k.includes('wheat') ? '#f59e0b' : '#00d4aa'
  );

  return (
    <div className="chart-grid">
      <div className="chart-card">
        <div className="chart-title">Water Savings by Region</div>
        <div className="chart-subtitle">% reduction vs fixed 10 mm/day traditional irrigation baseline</div>
        <div className="chart-wrap tall">
          <Bar
            data={{
              labels,
              datasets: [{
                label: 'Water Saved %',
                data: values,
                backgroundColor: colors,
                borderColor: borders,
                borderWidth: 1.5, borderRadius: 8,
              }],
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}% saved` } },
              },
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: {
                  beginAtZero: true, max: 100,
                  title: { display: true, text: '% Water Saved', color: '#94a3b8' },
                  ticks: { color: '#94a3b8', callback: v => v + '%' },
                  grid: { color: 'rgba(255,255,255,0.05)' },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Savings Breakdown</div>
        <div className="chart-subtitle">Per state + crop combination (animated bars)</div>
        <div style={{ paddingTop: 12 }} className="savings-rows">
          {entries.map(([k, pct]) => {
            const [state, crop] = k.split('_');
            return (
              <div key={k} className="sav-row">
                <div className="sav-label">{state} <span style={{ color: 'var(--text-f)' }}>{crop}</span></div>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${crop === 'wheat' ? 'bar-wheat' : 'bar-rice'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="sav-pct" style={{ color: crop === 'wheat' ? 'var(--orange)' : 'var(--teal)' }}>
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
