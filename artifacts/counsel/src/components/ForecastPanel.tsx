import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
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
      className={`rounded-lg border p-4 space-y-3 cursor-pointer transition-all ${
        head.thresholdBreached
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-border bg-card hover:bg-accent/30'
      }`}
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
      {latest && <IntervalBar iv={latest} threshold={head.alertThreshold} />}
      {expanded &&
        head.intervals.slice(0, -1).map((iv) => (
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
  const { data, isLoading, isError } = useQuery<{ heads: ForecastHead[]; generatedAt: string }>({
    queryKey: ['counsel-forecast'],
    queryFn: () => apiFetch<{ heads: ForecastHead[]; generatedAt: string }>('/counsel/forecast'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-sm text-red-300">Failed to load forecast data. Please try again.</p>
      </div>
    );
  }

  const heads = data?.heads ?? [];
  const breachedCount = heads.filter((h) => h.thresholdBreached).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Forecast Fabric — Counsel Heads</h2>
        </div>
        <div className="flex items-center gap-2">
          {breachedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 rounded px-2 py-0.5">
              <Activity className="w-3 h-3" />
              {breachedCount} threshold{breachedCount > 1 ? 's' : ''} breached
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            {heads.length} heads · safe-default adapter
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Calibrated forecast intervals for all Counsel legal matter heads. Click any card to expand
        all horizons and view provenance.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {heads.map((head) => (
          <HeadCard key={head.headName} head={head} />
        ))}
      </div>
      {data?.generatedAt && (
        <p className="text-[10px] font-mono text-muted-foreground">
          source: /api/counsel/forecast · generated{' '}
          {new Date(data.generatedAt).toLocaleString()} · interval bars show [lower–upper] with
          confidence · amber line = alert threshold
        </p>
      )}
    </div>
  );
}
