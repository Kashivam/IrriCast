import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

import Header            from './components/Header';
import PredictPanel      from './components/PredictPanel';
import RainCard          from './components/RainCard';
import SmartAdvice       from './components/SmartAdvice';
import StatsRow          from './components/StatsRow';
import Dashboard         from './components/Dashboard';
import PredictionHistory from './components/PredictionHistory';

export default function App() {
  // ── Selections ────────────────────────────────────────────────────────────
  const [selectedState, setSelectedState] = useState('Punjab');
  const [selectedCrop,  setSelectedCrop]  = useState('rice');

  // ── Static ML result data ─────────────────────────────────────────────────
  const [staticData, setStaticData] = useState({ metrics: {}, historical: {}, importance: {}, savings: {} });
  const [loaded,     setLoaded]     = useState(false);

  // ── Live data ─────────────────────────────────────────────────────────────
  const [rainData,    setRainData]    = useState(null);
  const [rainLoading, setRainLoading] = useState(true);
  const [predResult,  setPredResult]  = useState(null);
  const [predicting,  setPredicting]  = useState(false);
  const [history,     setHistory]     = useState([]);
  const [activeTab,   setActiveTab]   = useState('historical');
  const [toast,       setToast]       = useState('');

  // ── Load static data once ─────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get('/api/results/metrics'),
      axios.get('/api/results/historical'),
      axios.get('/api/results/feature_importance'),
      axios.get('/api/results/water_savings'),
      axios.get('/api/history').catch(() => ({ data: [] })),
    ]).then(([metrics, historical, importance, savings, hist]) => {
      setStaticData({
        metrics:    metrics.data,
        historical: historical.data,
        importance: importance.data,
        savings:    savings.data,
      });
      setHistory(hist.data || []);
      setLoaded(true);
    }).catch(e => showToast('Failed to load data: ' + e.message));
  }, []);

  // ── Fetch rain whenever state changes ────────────────────────────────────
  const fetchRain = useCallback(async (state) => {
    setRainLoading(true);
    try {
      const { data } = await axios.get(`/api/rain/${state}`);
      setRainData(data);
    } catch (e) {
      showToast('Weather data unavailable: ' + e.message);
      setRainData(null);
    } finally {
      setRainLoading(false);
    }
  }, []);

  useEffect(() => { fetchRain(selectedState); }, [selectedState, fetchRain]);

  // ── Handle state change (also resets prediction) ─────────────────────────
  const handleStateChange = (s) => {
    setSelectedState(s);
    setPredResult(null);
  };

  // ── Live prediction ───────────────────────────────────────────────────────
  const handlePredict = async () => {
    setPredicting(true);
    try {
      const { data } = await axios.get(`/api/predict/${selectedState}/${selectedCrop}`);
      setPredResult(data);
      // Refresh MongoDB history
      axios.get('/api/history')
        .then(r => setHistory(r.data || []))
        .catch(() => {});
    } catch (e) {
      showToast('Prediction failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setPredicting(false);
    }
  };

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const avgSavings = (() => {
    const vals = Object.values(staticData.savings);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) + '%' : '—';
  })();

  return (
    <div className="app">
      {/* Background orbs */}
      <div className="bg-orbs">
        <div className="orb orb1" /><div className="orb orb2" /><div className="orb orb3" />
      </div>

      <Header />

      <main className="main-content">
        {/* ── Top: Predict + Rain ── */}
        <p className="sec-label">Live Forecast</p>
        <div className="top-grid">
          <PredictPanel
            selectedState={selectedState}
            selectedCrop={selectedCrop}
            onStateChange={handleStateChange}
            onCropChange={setSelectedCrop}
            onPredict={handlePredict}
            predicting={predicting}
            result={predResult}
          />
          <RainCard data={rainData} loading={rainLoading} state={selectedState} />
        </div>

        {/* ── Smart Advice (only after prediction) ── */}
        {predResult && rainData && (
          <SmartAdvice prediction={predResult} rain={rainData} />
        )}

        {/* ── Stats ── */}
        <p className="sec-label" style={{ marginTop: 28 }}>Overview</p>
        <StatsRow avgSavings={avgSavings} />

        {/* ── Analytics Dashboard ── */}
        {loaded ? (
          <Dashboard
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedState={selectedState}
            selectedCrop={selectedCrop}
            onStateChange={setSelectedState}
            onCropChange={setSelectedCrop}
            staticData={staticData}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-f)' }}>
            Loading analytics data…
          </div>
        )}

        {/* ── MongoDB History ── */}
        {history.length > 0 && <PredictionHistory history={history} />}
      </main>

      <footer className="footer">
        IrriCast.in &nbsp;·&nbsp; MERN Stack (MongoDB · Express · React · Node)
        &nbsp;·&nbsp; NASA POWER + XGBoost + Open-Meteo &nbsp;·&nbsp; {new Date().getFullYear()}
      </footer>

      {/* Toast */}
      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  );
}
