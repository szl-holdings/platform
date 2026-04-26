import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { useState } from 'react';

const predictions = [
  {
    id: 'PRED-001',
    model: 'DeepForecaster v3.2',
    target: 'Revenue Q2',
    confidence: 0.94,
    prediction: '$2.4M',
    actual: null,
    status: 'active',
    drift: 0.02,
    trend: 'up' as const,
    category: 'financial',
  },
  {
    id: 'PRED-002',
    model: 'NeuralSentiment v2.1',
    target: 'Market Sentiment',
    confidence: 0.87,
    prediction: 'Bullish',
    actual: 'Bullish',
    status: 'validated',
    drift: 0.05,
    trend: 'up' as const,
    category: 'market',
  },
  {
    id: 'PRED-003',
    model: 'TimeSeriesNet v4.0',
    target: 'User Growth',
    confidence: 0.91,
    prediction: '+18%',
    actual: '+15%',
    status: 'validated',
    drift: 0.03,
    trend: 'up' as const,
    category: 'growth',
  },
  {
    id: 'PRED-004',
    model: 'RiskAnalyzer v1.8',
    target: 'Churn Rate',
    confidence: 0.82,
    prediction: '3.2%',
    actual: null,
    status: 'active',
    drift: 0.08,
    trend: 'down' as const,
    category: 'risk',
  },
  {
    id: 'PRED-005',
    model: 'AnomalyDetector v2.5',
    target: 'Infrastructure Load',
    confidence: 0.89,
    prediction: 'Normal',
    actual: 'Normal',
    status: 'validated',
    drift: 0.01,
    trend: 'neutral' as const,
    category: 'operations',
  },
  {
    id: 'PRED-006',
    model: 'DeepForecaster v3.2',
    target: 'Revenue Q3',
    confidence: 0.78,
    prediction: '$2.8M',
    actual: null,
    status: 'pending',
    drift: 0.12,
    trend: 'up' as const,
    category: 'financial',
  },
  {
    id: 'PRED-007',
    model: 'CausalInference v1.3',
    target: 'Feature Adoption',
    confidence: 0.85,
    prediction: '62%',
    actual: null,
    status: 'active',
    drift: 0.04,
    trend: 'up' as const,
    category: 'product',
  },
  {
    id: 'PRED-008',
    model: 'EnsembleStack v2.0',
    target: 'Cost Optimization',
    confidence: 0.92,
    prediction: '-12%',
    actual: '-14%',
    status: 'validated',
    drift: 0.02,
    trend: 'down' as const,
    category: 'financial',
  },
];

const categories = ['all', 'financial', 'market', 'growth', 'risk', 'operations', 'product'];

export default function Predictions() {
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = predictions.filter(
    (p) =>
      (filter === 'all' || p.category === filter) &&
      (statusFilter === 'all' || p.status === statusFilter),
  );

  const avgConfidence = (
    (predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length) *
    100
  ).toFixed(1);
  const activeCount = predictions.filter((p) => p.status === 'active').length;
  const validatedCount = predictions.filter((p) => p.status === 'validated').length;
  const avgDrift = (
    (predictions.reduce((s, p) => s + p.drift, 0) / predictions.length) *
    100
  ).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Predictions Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inference outputs, accuracy scoring, and ground-truth validation across deployed models
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
          <span>{predictions.length} models active</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Avg Confidence
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgConfidence}%</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#8a8a8a]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#c9b787]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Validated
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{validatedCount}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#c9b787]" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Avg Drift
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgDrift}%</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                filter === c
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {['all', 'active', 'validated', 'pending'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                statusFilter === s
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-card/60 border border-border rounded-xl p-5 hover:border-primary/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-muted-foreground">{p.id}</span>
                  <span className="text-sm font-semibold text-foreground">{p.target}</span>
                  <span className="text-xs text-muted-foreground">{p.model}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{p.prediction}</p>
                  {p.actual && <p className="text-xs text-muted-foreground">Actual: {p.actual}</p>}
                </div>
                <div className="w-24">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <span className="text-xs font-mono text-foreground">
                      {(p.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        p.confidence >= 0.9
                          ? 'bg-[#c9b787]'
                          : p.confidence >= 0.8
                            ? 'bg-[#8a8a8a]'
                            : 'bg-[#c9b787]',
                      )}
                      style={{ width: `${p.confidence * 100}%` }}
                    />
                  </div>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    p.drift <= 0.03
                      ? 'text-[#c9b787] bg-[#c9b787]/10'
                      : p.drift <= 0.06
                        ? 'text-[#c9b787] bg-[#c9b787]/10'
                        : 'text-[#f5f5f5] bg-[#f5f5f5]/10',
                  )}
                >
                  {p.drift <= 0.03 ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {(p.drift * 100).toFixed(1)}% drift
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium capitalize',
                    p.status === 'active'
                      ? 'bg-[#8a8a8a]/10 text-[#8a8a8a]'
                      : p.status === 'validated'
                        ? 'bg-[#c9b787]/10 text-[#c9b787]'
                        : 'bg-[#c9b787]/10 text-[#c9b787]',
                  )}
                >
                  {p.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
