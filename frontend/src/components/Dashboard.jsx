import { useState } from 'react';
import HistoricalChart  from './charts/HistoricalChart';
import PerformancePanel from './charts/PerformancePanel';
import ImportanceChart  from './charts/ImportanceChart';
import SavingsPanel     from './charts/SavingsPanel';

const TABS = [
  { id: 'historical',  label: '📈 Historical Forecast' },
  { id: 'performance', label: '🏆 Model Performance' },
  { id: 'importance',  label: '🔍 Feature Importance' },
  { id: 'savings',     label: '💧 Water Savings' },
];

export default function Dashboard({ activeTab, onTabChange, selectedState, selectedCrop, onStateChange, onCropChange, staticData }) {
  // Local state/crop overrides per tab (so changing chart selector doesn't change the main predict)
  const [hState, setHState] = useState(selectedState);
  const [hCrop,  setHCrop]  = useState(selectedCrop);
  const [pState, setPState] = useState(selectedState);
  const [pCrop,  setPCrop]  = useState(selectedCrop);
  const [iState, setIState] = useState(selectedState);
  const [iCrop,  setICrop]  = useState(selectedCrop);

  return (
    <div style={{ marginBottom: 6 }}>
      <p className="sec-label">Analytics Dashboard</p>
      <div className="tabs-row">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'historical' && (
        <HistoricalChart
          historicalData={staticData.historical}
          selectedState={hState} selectedCrop={hCrop}
          onStateChange={setHState} onCropChange={setHCrop}
        />
      )}
      {activeTab === 'performance' && (
        <PerformancePanel
          metricsData={staticData.metrics}
          selectedState={pState} selectedCrop={pCrop}
          onStateChange={setPState} onCropChange={setPCrop}
        />
      )}
      {activeTab === 'importance' && (
        <ImportanceChart
          importanceData={staticData.importance}
          selectedState={iState} selectedCrop={iCrop}
          onStateChange={setIState} onCropChange={setICrop}
        />
      )}
      {activeTab === 'savings' && (
        <SavingsPanel savingsData={staticData.savings} />
      )}
    </div>
  );
}
