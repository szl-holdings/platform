import { cn } from '@szl-holdings/shared-ui/utils';
import {
  BarChart3,
  Brain,
  GitBranch,
  Layers,
} from 'lucide-react';
import { useState } from 'react';

const ensembles = [
  {
    id: 'ENS-001',
    name: 'Revenue Forecast Ensemble',
    status: 'active',
    models: [
      {
        name: 'DeepForecaster v3.2',
        weight: 0.35,
        accuracy: 94.2,
        contribution: 'Primary forecaster',
      },
      {
        name: 'TimeSeriesNet v4.0',
        weight: 0.3,
        accuracy: 91.8,
        contribution: 'Seasonal patterns',
      },
      { name: 'CausalInference v1.3', weight: 0.2, accuracy: 85.4, contribution: 'Causal factors' },
      {
        name: 'EnsembleAvg Baseline',
        weight: 0.15,
        accuracy: 88.1,
        contribution: 'Stability anchor',
      },
    ],
    combinedAccuracy: 96.1,
    agreement: 92.3,
    lastRun: '5 min ago',
  },
  {
    id: 'ENS-002',
    name: 'Anomaly Detection Stack',
    status: 'active',
    models: [
      {
        name: 'AnomalyDetector v2.5',
        weight: 0.4,
        accuracy: 89.3,
        contribution: 'Primary detector',
      },
      {
        name: 'IsolationForest v1.2',
        weight: 0.3,
        accuracy: 86.7,
        contribution: 'Outlier isolation',
      },
      {
        name: 'AutoEncoder v3.0',
        weight: 0.3,
        accuracy: 84.9,
        contribution: 'Reconstruction error',
      },
    ],
    combinedAccuracy: 93.8,
    agreement: 88.7,
    lastRun: '12 min ago',
  },
  {
    id: 'ENS-003',
    name: 'Sentiment Analysis Ensemble',
    status: 'training',
    models: [
      {
        name: 'NeuralSentiment v2.1',
        weight: 0.45,
        accuracy: 87.2,
        contribution: 'Deep sentiment',
      },
      {
        name: 'BERT-Finance v1.0',
        weight: 0.35,
        accuracy: 85.6,
        contribution: 'Financial context',
      },
      {
        name: 'LexiconModel v2.3',
        weight: 0.2,
        accuracy: 79.8,
        contribution: 'Rule-based baseline',
      },
    ],
    combinedAccuracy: 91.4,
    agreement: 85.1,
    lastRun: '1 hr ago',
  },
];

export default function EnsembleStudio() {
  const [selected, setSelected] = useState(ensembles[0].id);
  const activeEnsemble = ensembles.find((e) => e.id === selected)!;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
            <Layers className="w-6 h-6 text-primary" />
            Ensemble Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build, manage, and monitor model ensembles for superior accuracy
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {ensembles.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelected(e.id)}
            className={cn(
              'bg-card/60 border rounded-xl p-4 text-left transition-all',
              selected === e.id
                ? 'border-primary/40 bg-primary/5'
                : 'border-border hover:border-primary/20',
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground">{e.id}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
                  e.status === 'active'
                    ? 'bg-[#c9b787]/10 text-[#c9b787]'
                    : 'bg-[#c9b787]/10 text-[#c9b787]',
                )}
              >
                {e.status}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">{e.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {e.models.length} models · {e.combinedAccuracy}% combined
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Combined Accuracy
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{activeEnsemble.combinedAccuracy}%</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-[#8a8a8a]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Model Agreement
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{activeEnsemble.agreement}%</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-[#c9b787]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Models</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{activeEnsemble.models.length}</p>
        </div>
      </div>

      <div className="bg-card/60 border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Model Weights & Contributions
        </h3>
        <div className="space-y-4">
          {activeEnsemble.models.map((m, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-48 shrink-0">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.contribution}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Weight: {(m.weight * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs font-mono text-foreground">{m.accuracy}% acc</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all"
                    style={{ width: `${m.weight * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
