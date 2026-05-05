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
  provenance: { modelId: string; modelVersion: string; adapterId: string; generatedAt: string };
  alertThreshold?: number;
  thresholdBreached?: boolean;
}

const IMPERIUM_FORECAST_DATA: ForecastHead[] = [
  {
    headName: 'imperium:cost-drift',
    label: 'Cost Drift Score',
    intervals: [
      { horizon: '7d', point: 0.38, lower: 0.23, upper: 0.55, confidence: 0.85, unit: 'score' },
      { horizon: '30d', point: 0.49, lower: 0.32, upper: 0.68, confidence: 0.79, unit: 'score' },
      { horizon: '90d', point: 0.61, lower: 0.43, upper: 0.79, confidence: 0.72, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-imperium:cost-drift', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.6,
    thresholdBreached: true,
  },
  {
    headName: 'imperium:policy-drift',
    label: 'Policy Drift Score',
    intervals: [
      { horizon: '7d', point: 0.29, lower: 0.15, upper: 0.45, confidence: 0.88, unit: 'score' },
      { horizon: '30d', point: 0.41, lower: 0.26, upper: 0.58, confidence: 0.81, unit: 'score' },
      { horizon: '90d', point: 0.53, lower: 0.36, upper: 0.70, confidence: 0.74, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-imperium:policy-drift', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.55,
  },
  {
    headName: 'imperium:tenant-saturation',
    label: 'Tenant Saturation Risk',
    intervals: [
      { horizon: '7d', point: 0.52, lower: 0.37, upper: 0.69, confidence: 0.83, unit: 'score' },
      { horizon: '30d', point: 0.64, lower: 0.47, upper: 0.81, confidence: 0.77, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-imperium:tenant-saturation', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.75,
  },
  {
    headName: 'imperium:infra-health',
    label: 'Infrastructure Health Score',
    intervals: [
      { horizon: '24h', point: 0.22, lower: 0.10, upper: 0.37, confidence: 0.91, unit: 'score' },
      { horizon: '7d', point: 0.33, lower: 0.19, upper: 0.50, confidence: 0.85, unit: 'score' },
      { horizon: '30d', point: 0.45, lower: 0.29, upper: 0.63, confidence: 0.78, unit: 'score' },
    ],
    provenance: { modelId: 'safe-default-imperium:infra-health', modelVersion: '0.1.0', adapterId: 'safe-default', generatedAt: new Date().toISOString() },
    alertThreshold: 0.4,
    thresholdBreached: true,
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
    <div className={`rounded-lg border p-4 space-y-3 cursor-pointer transition-all ${head.thresholdBreached ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-card hover:bg-accent/30'}`} onClick={() => setExpanded((v) => !v)}>
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

export default function ImperiumForecastPage() {
  const breachedCount = IMPERIUM_FORECAST_DATA.filter((h) => h.thresholdBreached).length;
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Forecast Fabric — Imperium Heads</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-horizon interval forecasts with calibrated confidence bounds across all Imperium infrastructure heads.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Forecast Fabric — Imperium Heads</h2>
          </div>
          <div className="flex items-center gap-2">
            {breachedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 rounded px-2 py-0.5">
                <Activity className="w-3 h-3" />{breachedCount} threshold{breachedCount > 1 ? 's' : ''} breached
              </span>
            )}
            <span className="text-[10px] font-mono text-muted-foreground">{IMPERIUM_FORECAST_DATA.length} heads · safe-default adapter</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Calibrated forecast intervals for all Imperium infrastructure heads. Click any card to expand all horizons and view provenance.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IMPERIUM_FORECAST_DATA.map((head) => <HeadCard key={head.headName} head={head} />)}
        </div>
        <p className="text-[10px] font-mono text-muted-foreground">source: @workspace/forecast-fabric · interval bars show [lower–upper] with confidence · amber line = alert threshold</p>
      </div>
    </div>
  );
}
