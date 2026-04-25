import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface ForecastInterval {
  horizon: string;
  point: number;
  lower: number;
  upper: number;
  confidence: number;
  unit?: string;
}

interface ForecastHead {
  headName: string;
  label: string;
  intervals: ForecastInterval[];
  provenance: {
    modelId: string;
    modelVersion: string;
    adapterId: string;
    generatedAt: string;
  };
  alertThreshold?: number;
  thresholdBreached?: boolean;
}

const VESSELS_FORECAST_DATA: ForecastHead[] = [
  {
    headName: 'vessels:route-anomaly',
    label: 'Route Anomaly Probability',
    intervals: [
      { horizon: '6h', point: 0.22, lower: 0.10, upper: 0.37, confidence: 0.91, unit: 'score' },
      { horizon: '24h', point: 0.35, lower: 0.20, upper: 0.52, confidence: 0.85, unit: 'score' },
      { horizon: '72h', point: 0.48, lower: 0.31, upper: 0.65, confidence: 0.78, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-vessels:route-anomaly', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.65,
  },
  {
    headName: 'vessels:sanctions-adjacency',
    label: 'Sanctions Adjacency Risk',
    intervals: [
      { horizon: '24h', point: 0.18, lower: 0.07, upper: 0.33, confidence: 0.89, unit: 'score' },
      { horizon: '72h', point: 0.27, lower: 0.14, upper: 0.42, confidence: 0.83, unit: 'score' },
      { horizon: '7d', point: 0.39, lower: 0.24, upper: 0.56, confidence: 0.76, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-vessels:sanctions-adjacency', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.5,
  },
  {
    headName: 'vessels:dark-activity',
    label: 'Dark Activity Likelihood',
    intervals: [
      { horizon: '6h', point: 0.29, lower: 0.15, upper: 0.45, confidence: 0.87, unit: 'score' },
      { horizon: '24h', point: 0.41, lower: 0.26, upper: 0.58, confidence: 0.81, unit: 'score' },
      { horizon: '72h', point: 0.53, lower: 0.36, upper: 0.70, confidence: 0.74, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-vessels:dark-activity', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.55,
    thresholdBreached: true,
  },
  {
    headName: 'vessels:insurance-exception',
    label: 'Insurance Exception Risk',
    intervals: [
      { horizon: '24h', point: 0.33, lower: 0.19, upper: 0.49, confidence: 0.86, unit: 'score' },
      { horizon: '7d', point: 0.44, lower: 0.28, upper: 0.61, confidence: 0.80, unit: 'score' },
      { horizon: '30d', point: 0.57, lower: 0.39, upper: 0.74, confidence: 0.73, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-vessels:insurance-exception', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.6,
  },
];

function IntervalBar({ iv, threshold }: { iv: ForecastInterval; threshold?: number }) {
  const breached = threshold !== undefined && iv.upper > threshold;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground">{iv.horizon}</span>
        <span className={breached ? 'text-red-400' : 'text-foreground'}>
          {(iv.point * 100).toFixed(1)}%{' '}
          <span className="text-muted-foreground">[{(iv.lower * 100).toFixed(0)}–{(iv.upper * 100).toFixed(0)}]</span>
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div className="absolute h-full bg-primary/20 rounded-full" style={{ left: `${iv.lower * 100}%`, width: `${(iv.upper - iv.lower) * 100}%` }} />
        <div className={`absolute h-full w-0.5 rounded-full ${breached ? 'bg-red-400' : 'bg-primary'}`} style={{ left: `${iv.point * 100}%` }} />
        {threshold !== undefined && <div className="absolute h-full w-px bg-amber-400/60" style={{ left: `${threshold * 100}%` }} />}
      </div>
      <div className="text-[9px] text-muted-foreground font-mono">conf: {(iv.confidence * 100).toFixed(0)}%</div>
    </div>
  );
}

function HeadCard({ head }: { head: ForecastHead }) {
  const [expanded, setExpanded] = useState(false);
  const latest = head.intervals[head.intervals.length - 1];
  return (
    <div
      className={`rounded-lg border p-4 space-y-3 cursor-pointer transition-all ${head.thresholdBreached ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-card hover:bg-accent/30'}`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{head.headName}</p>
          <p className="text-sm font-medium text-foreground leading-tight">{head.label}</p>
        </div>
        {head.thresholdBreached ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
      </div>
      {latest && <IntervalBar iv={latest} threshold={head.alertThreshold} />}
      {expanded && head.intervals.slice(0, -1).map((iv) => <IntervalBar key={iv.horizon} iv={iv} threshold={head.alertThreshold} />)}
      {expanded && (
        <div className="pt-1 border-t border-border space-y-1">
          <p className="text-[9px] font-mono text-muted-foreground">model: {head.provenance.modelId} v{head.provenance.modelVersion}</p>
          <p className="text-[9px] font-mono text-muted-foreground">adapter: {head.provenance.adapterId}</p>
          <p className="text-[9px] font-mono text-muted-foreground">generated: {new Date(head.provenance.generatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export function ForecastPanel() {
  const breachedCount = VESSELS_FORECAST_DATA.filter((h) => h.thresholdBreached).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Forecast Fabric — Vessels Heads</h2>
        </div>
        <div className="flex items-center gap-2">
          {breachedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 rounded px-2 py-0.5">
              <Activity className="w-3 h-3" />{breachedCount} threshold{breachedCount > 1 ? 's' : ''} breached
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">{VESSELS_FORECAST_DATA.length} heads · safe-default adapter</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Calibrated forecast intervals for all Vessels maritime-intelligence heads. Click any card to expand all horizons and view provenance.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VESSELS_FORECAST_DATA.map((head) => <HeadCard key={head.headName} head={head} />)}
      </div>
      <p className="text-[10px] font-mono text-muted-foreground">
        source: @workspace/forecast-fabric · interval bars show [lower–upper] with confidence · amber line = alert threshold
      </p>
    </div>
  );
}
