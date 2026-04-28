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

const LYTE_FORECAST_DATA: ForecastHead[] = [
  {
    headName: 'lyte:bottlenecks',
    label: 'Workflow Bottleneck Risk',
    intervals: [
      { horizon: '7d', point: 0.58, lower: 0.43, upper: 0.73, confidence: 0.81, unit: 'score' },
      { horizon: '14d', point: 0.62, lower: 0.45, upper: 0.79, confidence: 0.77, unit: 'score' },
      { horizon: '30d', point: 0.71, lower: 0.52, upper: 0.88, confidence: 0.72, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-lyte:bottlenecks', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.75,
    thresholdBreached: true,
  },
  {
    headName: 'lyte:margin-risk',
    label: 'Margin Risk Score',
    intervals: [
      { horizon: '7d', point: 0.44, lower: 0.29, upper: 0.59, confidence: 0.84, unit: 'score' },
      { horizon: '30d', point: 0.51, lower: 0.34, upper: 0.68, confidence: 0.79, unit: 'score' },
      { horizon: '90d', point: 0.59, lower: 0.39, upper: 0.77, confidence: 0.71, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-lyte:margin-risk', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.7,
  },
  {
    headName: 'lyte:ownership-drift',
    label: 'Ownership Drift Velocity',
    intervals: [
      { horizon: '7d', point: 0.38, lower: 0.23, upper: 0.53, confidence: 0.86, unit: 'score' },
      { horizon: '30d', point: 0.47, lower: 0.30, upper: 0.64, confidence: 0.80, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-lyte:ownership-drift', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.6,
  },
  {
    headName: 'lyte:escalation-risk',
    label: 'Escalation Risk',
    intervals: [
      { horizon: '1d', point: 0.31, lower: 0.18, upper: 0.46, confidence: 0.88, unit: 'score' },
      { horizon: '7d', point: 0.42, lower: 0.27, upper: 0.57, confidence: 0.83, unit: 'score' },
      { horizon: '14d', point: 0.55, lower: 0.37, upper: 0.72, confidence: 0.76, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-lyte:escalation-risk', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.65,
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
          <span className="text-muted-foreground">
            [{(iv.lower * 100).toFixed(0)}–{(iv.upper * 100).toFixed(0)}]
          </span>
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary/20 rounded-full"
          style={{ left: `${iv.lower * 100}%`, width: `${(iv.upper - iv.lower) * 100}%` }}
        />
        <div
          className={`absolute h-full w-0.5 rounded-full ${breached ? 'bg-red-400' : 'bg-primary'}`}
          style={{ left: `${iv.point * 100}%` }}
        />
        {threshold !== undefined && (
          <div
            className="absolute h-full w-px bg-amber-400/60"
            style={{ left: `${threshold * 100}%` }}
          />
        )}
      </div>
      <div className="text-[9px] text-muted-foreground font-mono">
        conf: {(iv.confidence * 100).toFixed(0)}%
      </div>
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
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {head.headName}
          </p>
          <p className="text-sm font-medium text-foreground leading-tight">{head.label}</p>
        </div>
        {head.thresholdBreached ? (
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
      </div>

      {latest && (
        <IntervalBar iv={latest} threshold={head.alertThreshold} />
      )}

      {expanded && head.intervals.slice(0, -1).map((iv) => (
        <IntervalBar key={iv.horizon} iv={iv} threshold={head.alertThreshold} />
      ))}

      {expanded && (
        <div className="pt-1 border-t border-border space-y-1">
          <p className="text-[9px] font-mono text-muted-foreground">
            model: {head.provenance.modelId} v{head.provenance.modelVersion}
          </p>
          <p className="text-[9px] font-mono text-muted-foreground">
            adapter: {head.provenance.adapterId}
          </p>
          <p className="text-[9px] font-mono text-muted-foreground">
            generated: {new Date(head.provenance.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export function ForecastPanel() {
  const breachedCount = LYTE_FORECAST_DATA.filter((h) => h.thresholdBreached).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Forecast Fabric — KORA Heads</h2>
        </div>
        <div className="flex items-center gap-2">
          {breachedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 rounded px-2 py-0.5">
              <Activity className="w-3 h-3" />
              {breachedCount} threshold{breachedCount > 1 ? 's' : ''} breached
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            {LYTE_FORECAST_DATA.length} heads · safe-default adapter
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Calibrated forecast intervals for all KORA decision-intelligence heads. Click any card to expand all horizons and view provenance.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LYTE_FORECAST_DATA.map((head) => (
          <HeadCard key={head.headName} head={head} />
        ))}
      </div>
      <p className="text-[10px] font-mono text-muted-foreground">
        source: @workspace/forecast-fabric · interval bars show [lower–upper] with confidence · amber line = alert threshold
      </p>
    </div>
  );
}
