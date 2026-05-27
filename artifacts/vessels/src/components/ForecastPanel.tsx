import { Activity, AlertTriangle, CheckCircle, Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ForecastInterval {
  horizon: string;
  point: number;
  lower80: number;
  upper80: number;
  lower95?: number;
  upper95?: number;
  confidence: number;
  unit?: string;
}

interface ForecastHead {
  headName: string;
  label: string;
  description?: string;
  intervals: ForecastInterval[];
  featureAttribution?: Record<string, number>;
  provenance: {
    modelId: string;
    modelName: string;
    modelVersion: string;
    adapterId: string;
    algorithmFamily?: string;
    calibrationMethod?: string;
    generatedAt: string;
  };
  alertThreshold?: number;
  thresholdBreached?: boolean;
  driftScore?: number;
  driftStatus?: string;
  tceDistribution?: {
    mean: number;
    p5: number;
    p25: number;
    p75: number;
    p95: number;
    stdDev: number;
    breakEvenProbability: number;
  };
}

interface ForecastApiResponse {
  heads: ForecastHead[];
  headsCount: number;
  breachedCount: number;
  generatedAt: string;
  modelRegistry: string;
  calibrationMethod: string;
  note: string;
}

function IntervalBar({ iv, threshold, unit }: { iv: ForecastInterval; threshold?: number; unit?: string }) {
  const isUsd = unit === 'USD/day';
  const scale = isUsd ? 1 / 50000 : 1;
  const pointPct = Math.min(Math.max(iv.point * scale * 100, 0), 100);
  const lowerPct = Math.min(Math.max((iv.lower80 ?? iv.point * 0.7) * scale * 100, 0), 100);
  const upperPct = Math.min(Math.max((iv.upper80 ?? iv.point * 1.3) * scale * 100, 0), 100);
  const thresholdPct = threshold ? Math.min(Math.max(threshold * scale * 100, 0), 100) : undefined;
  const breached = threshold !== undefined && (isUsd ? iv.point < threshold : iv.upper80 > threshold);

  const fmt = (v: number) =>
    isUsd ? `$${v.toLocaleString()}/d` : `${(v * 100).toFixed(1)}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground">{iv.horizon}</span>
        <span className={breached ? 'text-red-400' : 'text-foreground'}>
          {fmt(iv.point)}{' '}
          <span className="text-muted-foreground">[{fmt(iv.lower80 ?? iv.point * 0.7)}–{fmt(iv.upper80 ?? iv.point * 1.3)}]</span>
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary/20 rounded-full"
          style={{ left: `${lowerPct}%`, width: `${Math.max(0, upperPct - lowerPct)}%` }}
        />
        <div
          className={`absolute h-full w-0.5 rounded-full ${breached ? 'bg-red-400' : 'bg-primary'}`}
          style={{ left: `${pointPct}%` }}
        />
        {thresholdPct !== undefined && (
          <div className="absolute h-full w-px bg-amber-400/60" style={{ left: `${thresholdPct}%` }} />
        )}
      </div>
      <div className="text-[9px] text-muted-foreground font-mono">conf: {(iv.confidence * 100).toFixed(0)}%</div>
    </div>
  );
}

function FeatureAttribution({ attrs }: { attrs: Record<string, number> }) {
  const sorted = Object.entries(attrs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <div className="space-y-1 pt-1">
      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Feature Attribution</p>
      {sorted.map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-[#c9b787]/14 rounded-full" style={{ width: `${val * 100}%` }} />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{(val * 100).toFixed(0)}%</span>
          <span className="text-[9px] font-mono text-muted-foreground w-28 truncate">{key.replace(/_/g, ' ')}</span>
        </div>
      ))}
    </div>
  );
}

function TceCard({ dist }: { dist: NonNullable<ForecastHead['tceDistribution']> }) {
  return (
    <div className="pt-2 space-y-2 border-t border-border">
      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">TCE Distribution (Monte Carlo · 5k iter)</p>
      <div className="grid grid-cols-5 gap-1">
        {[
          { label: 'P5', val: dist.p5 },
          { label: 'P25', val: dist.p25 },
          { label: 'P50', val: dist.mean },
          { label: 'P75', val: dist.p75 },
          { label: 'P95', val: dist.p95 },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <p className="text-[8px] font-mono text-muted-foreground">{label}</p>
            <p className="text-[10px] font-mono text-foreground">${(val / 1000).toFixed(1)}k</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
        <span>Break-even prob:</span>
        <span className={dist.breakEvenProbability >= 0.75 ? 'text-emerald-400' : 'text-amber-400'}>
          {(dist.breakEvenProbability * 100).toFixed(0)}%
        </span>
        <span>· σ = ${(dist.stdDev / 1000).toFixed(1)}k/d</span>
      </div>
    </div>
  );
}

function HeadCard({ head }: { head: ForecastHead }) {
  const [expanded, setExpanded] = useState(false);
  const latest = head.intervals[head.intervals.length - 1];
  const isUsd = latest?.unit === 'USD/day';

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
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{head.headName}</p>
          <p className="text-sm font-medium text-foreground leading-tight">{head.label}</p>
          {head.description && (
            <p className="text-[10px] text-muted-foreground leading-relaxed hidden sm:block">{head.description}</p>
          )}
        </div>
        {head.thresholdBreached ? (
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        )}
      </div>

      {latest && (
        <IntervalBar iv={latest} threshold={head.alertThreshold} unit={latest.unit} />
      )}

      {expanded && head.intervals.slice(0, -1).map((iv) => (
        <IntervalBar key={iv.horizon} iv={iv} threshold={head.alertThreshold} unit={iv.unit} />
      ))}

      {expanded && head.tceDistribution && <TceCard dist={head.tceDistribution} />}

      {expanded && head.featureAttribution && (
        <FeatureAttribution attrs={head.featureAttribution} />
      )}

      {expanded && (
        <div className="pt-1 border-t border-border space-y-1">
          <p className="text-[9px] font-mono text-muted-foreground">model: {head.provenance.modelName} v{head.provenance.modelVersion}</p>
          <p className="text-[9px] font-mono text-muted-foreground">algorithm: {head.provenance.algorithmFamily ?? head.provenance.adapterId}</p>
          <p className="text-[9px] font-mono text-muted-foreground">calibration: {head.provenance.calibrationMethod ?? 'monte_carlo'}</p>
          {head.driftScore !== undefined && (
            <p className="text-[9px] font-mono text-muted-foreground">
              drift PSI: {head.driftScore.toFixed(4)} · status:{' '}
              <span className={head.driftStatus === 'nominal' ? 'text-emerald-400' : 'text-amber-400'}>
                {head.driftStatus ?? 'unknown'}
              </span>
            </p>
          )}
          <p className="text-[9px] font-mono text-muted-foreground">generated: {new Date(head.provenance.generatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export function ForecastPanel() {
  const [data, setData] = useState<ForecastApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vessels/forecasts/heads', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
      setLastFetchedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  const heads = data?.heads ?? [];
  const breachedCount = data?.breachedCount ?? heads.filter((h) => h.thresholdBreached).length;

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
              <Activity className="w-3 h-3" />
              {breachedCount} threshold{breachedCount > 1 ? 's' : ''} breached
            </span>
          )}
          <button
            onClick={fetchForecasts}
            disabled={loading}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          {data && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {heads.length} heads · {data.modelRegistry}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Calibrated ML forecast intervals for all Vessels maritime-intelligence heads. Monte Carlo calibration (≥2k iterations). Click any card to expand horizons, feature attribution, and drift report.
      </p>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
          Failed to load live forecasts: {error}
        </div>
      )}

      {loading && heads.length === 0 && (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading forecast heads…
        </div>
      )}

      {heads.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {heads.map((head) => <HeadCard key={head.headName} head={head} />)}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[10px] font-mono text-muted-foreground">
          source: vessels-ml-v2 · calibration: {data?.calibrationMethod ?? 'monte_carlo_isotonic'} · interval bars show [P10–P90] · amber line = alert threshold
        </p>
        {lastFetchedAt && (
          <p className="text-[9px] font-mono text-muted-foreground">
            last fetched: {new Date(lastFetchedAt).toLocaleTimeString()} · auto-refreshes every 5 min
          </p>
        )}
        {data?.note && (
          <p className="text-[9px] font-mono text-muted-foreground">{data.note}</p>
        )}
      </div>
    </div>
  );
}
