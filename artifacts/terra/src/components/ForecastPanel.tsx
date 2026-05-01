import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

const API = '/api';

interface ForecastInterval {
  horizon: string;
  point: number;
  lower: number;
  upper: number;
  confidence: number;
  unit?: string;
}

interface FeatureAttribution {
  feature: string;
  value: number;
  direction: 'increases_risk' | 'decreases_risk';
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
    scenario?: string;
    propertyId?: string;
    featureKeys?: string[];
  };
  alertThreshold?: number;
  thresholdBreached?: boolean;
  topFeatureAttributions?: FeatureAttribution[];
}

interface ForecastResponse {
  ok: boolean;
  data: {
    scenario: string;
    propertyId: string;
    headCount: number;
    heads: ForecastHead[];
    dataMode: string;
    generatedAt: string;
    modelRegistry: string;
    monteCarloScenarios: string[];
  };
}

const DEMO_FORECAST_DATA: ForecastHead[] = [
  {
    headName: 'terra:distress_propagation',
    label: 'Distress Propagation Cascade Risk',
    intervals: [
      { horizon: '30d', point: 0.38, lower: 0.24, upper: 0.54, confidence: 0.82, unit: 'cascade_prob' },
      { horizon: '60d', point: 0.51, lower: 0.35, upper: 0.68, confidence: 0.76, unit: 'cascade_prob' },
      { horizon: '90d', point: 0.67, lower: 0.49, upper: 0.82, confidence: 0.70, unit: 'cascade_prob' },
    ],
    provenance: { modelId: 'terra:distress_propagation', modelVersion: '1.0.0', adapterId: 'demo-fallback', generatedAt: new Date().toISOString() },
    alertThreshold: 0.55,
    thresholdBreached: true,
  },
  {
    headName: 'terra:climate_adjusted_cap_rate',
    label: 'Climate-Adjusted 5-yr Cap Rate',
    intervals: [
      { horizon: '30d', point: 0.0601, lower: 0.0572, upper: 0.0634, confidence: 0.84, unit: 'cap_rate' },
      { horizon: '60d', point: 0.0618, lower: 0.0585, upper: 0.0655, confidence: 0.79, unit: 'cap_rate' },
      { horizon: '90d', point: 0.0641, lower: 0.0602, upper: 0.0682, confidence: 0.73, unit: 'cap_rate' },
    ],
    provenance: { modelId: 'terra:climate_adjusted_cap_rate', modelVersion: '1.0.0', adapterId: 'demo-fallback', generatedAt: new Date().toISOString() },
  },
  {
    headName: 'terra:owner_intent',
    label: 'Owner Intent — 12-mo Sale/Refi Probability',
    intervals: [
      { horizon: '30d', point: 0.51, lower: 0.34, upper: 0.68, confidence: 0.85, unit: 'intent_prob' },
      { horizon: '60d', point: 0.63, lower: 0.44, upper: 0.79, confidence: 0.79, unit: 'intent_prob' },
      { horizon: '90d', point: 0.74, lower: 0.55, upper: 0.88, confidence: 0.72, unit: 'intent_prob' },
    ],
    provenance: { modelId: 'terra:owner_intent', modelVersion: '1.0.0', adapterId: 'demo-fallback', generatedAt: new Date().toISOString() },
    alertThreshold: 0.65,
    thresholdBreached: true,
  },
];

function formatPoint(point: number, unit?: string): string {
  if (unit === 'cap_rate') return `${(point * 100).toFixed(2)}%`;
  return `${(point * 100).toFixed(1)}%`;
}

function IntervalBar({ iv, threshold }: { iv: ForecastInterval; threshold?: number }) {
  const isCapRate = iv.unit === 'cap_rate';
  const scale = isCapRate ? (v: number) => (v - 0.04) / 0.06 : (v: number) => v;
  const breached = threshold !== undefined && iv.point > threshold;
  const pctPoint = Math.min(100, Math.max(0, scale(iv.point) * 100));
  const pctLower = Math.min(100, Math.max(0, scale(iv.lower) * 100));
  const pctWidth = Math.min(100, Math.max(0, (scale(iv.upper) - scale(iv.lower)) * 100));
  const pctThresh = threshold !== undefined ? Math.min(100, Math.max(0, scale(threshold) * 100)) : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-muted-foreground">{iv.horizon}</span>
        <span className={breached ? 'text-red-400' : 'text-foreground'}>
          {formatPoint(iv.point, iv.unit)}{' '}
          <span className="text-muted-foreground">
            [{formatPoint(iv.lower, iv.unit)}–{formatPoint(iv.upper, iv.unit)}]
          </span>
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-primary/20 rounded-full"
          style={{ left: `${pctLower}%`, width: `${pctWidth}%` }}
        />
        <div
          className={`absolute h-full w-0.5 rounded-full ${breached ? 'bg-red-400' : 'bg-primary'}`}
          style={{ left: `${pctPoint}%` }}
        />
        {pctThresh !== null && (
          <div className="absolute h-full w-px bg-amber-400/60" style={{ left: `${pctThresh}%` }} />
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
          {head.provenance.scenario && (
            <p className="text-[9px] font-mono text-muted-foreground">
              scenario: {head.provenance.scenario}
            </p>
          )}
          <p className="text-[9px] font-mono text-muted-foreground">
            generated: {new Date(head.provenance.generatedAt).toLocaleString()}
          </p>
          {head.topFeatureAttributions && head.topFeatureAttributions.length > 0 && (
            <div className="pt-1 space-y-0.5">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                top features
              </p>
              {head.topFeatureAttributions.map((f) => (
                <div key={f.feature} className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      f.direction === 'increases_risk' ? 'bg-red-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {f.feature}: {typeof f.value === 'number' ? f.value.toFixed(3) : f.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForecastPanel({ scenario = 'sunbelt-multifamily-2026', propertyId = 'portfolio' }: { scenario?: string; propertyId?: string }) {
  const {
    data: raw,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery<ForecastResponse>({
    queryKey: ['terra-forecasts', scenario, propertyId],
    queryFn: async () => {
      const r = await fetch(
        `${API}/terra/live/forecasts?scenario=${encodeURIComponent(scenario)}&propertyId=${encodeURIComponent(propertyId)}`,
        { credentials: 'include' },
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const forecastData: ForecastHead[] = raw?.data?.heads ?? (isError ? DEMO_FORECAST_DATA : DEMO_FORECAST_DATA);
  const isLive = raw?.data?.dataMode === 'live';
  const generatedAt = raw?.data?.generatedAt ? new Date(raw.data.generatedAt).toLocaleString() : null;
  const breachedCount = forecastData.filter((h) => h.thresholdBreached).length;
  const monteCarloScenarios = raw?.data?.monteCarloScenarios ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Forecast Fabric — TERRA Heads</h2>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : isError ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded px-2 py-0.5">
              <WifiOff className="w-3 h-3" /> Demo
            </span>
          ) : null}
          {breachedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 rounded px-2 py-0.5">
              <Activity className="w-3 h-3" />
              {breachedCount} threshold{breachedCount > 1 ? 's' : ''} breached
            </span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-1 rounded hover:bg-accent/30 transition-colors"
            title="Refresh forecasts"
          >
            <RefreshCw className={`w-3 h-3 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Calibrated forecast intervals for TERRA real estate intelligence heads. Distress propagation,
        climate-adjusted cap rate, and owner intent — each with Monte Carlo confidence intervals.
        {monteCarloScenarios.length > 0 && (
          <span className="ml-1 text-[10px] font-mono text-muted-foreground/60">
            [{monteCarloScenarios.join(', ')}]
          </span>
        )}
      </p>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Loading forecast heads from inference service…
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forecastData.map((head) => (
          <HeadCard key={head.headName} head={head} />
        ))}
      </div>

      <p className="text-[10px] font-mono text-muted-foreground">
        source: terra-ml-registry v1 · scenario: {scenario} ·{' '}
        {generatedAt ? `generated ${generatedAt}` : 'interval bars show [lower–upper] with confidence'} ·
        amber line = alert threshold
      </p>

      {dataUpdatedAt > 0 && (
        <p className="text-[9px] font-mono text-muted-foreground/50">
          last fetched: {new Date(dataUpdatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
