export default function Header() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon">💧</div>
        <div className="logo-text">Irri<span>Cast.in</span></div>
      </div>
      <div className="header-right">
        <div className="live-badge">
          <div className="live-dot" />
          LIVE FORECASTS
        </div>
        <span className="hdr-date">{today}</span>
      </div>
    </header>
  );
}
