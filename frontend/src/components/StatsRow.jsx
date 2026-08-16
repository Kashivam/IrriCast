export default function StatsRow({ avgSavings }) {
  const stats = [
    { icon: '📍', val: '3',          color: 'var(--teal)',   label: 'States Covered',   sub: 'Punjab · Telangana · TamilNadu' },
    { icon: '🌱', val: '2',          color: 'var(--blue)',   label: 'Crop Types',        sub: 'Rice & Wheat' },
    { icon: '🤖', val: '6',          color: 'var(--purple)', label: 'XGBoost Models',    sub: 'Trained on 2020–2024 data' },
    { icon: '💧', val: avgSavings || '—', color: 'var(--orange)', label: 'Avg Water Saved', sub: 'vs traditional 10 mm/day' },
  ];

  return (
    <div className="stats-row" style={{ marginBottom: 28 }}>
      {stats.map(s => (
        <div key={s.label} className="card stat-card" style={{ borderColor: 'transparent' }}>
          <div className="stat-icon">{s.icon}</div>
          <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
          <div className="stat-label">{s.label}</div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
