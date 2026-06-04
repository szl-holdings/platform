import { MicroFeedbackWidget } from '@szl-holdings/shared-ui/micro-feedback-widget';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Building2,
  ChevronDown,
  Info,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

type PropertyType = 'office' | 'industrial' | 'multifamily' | 'retail';

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  office: 'Office',
  industrial: 'Industrial',
  multifamily: 'Multifamily',
  retail: 'Retail',
};

const SUBMARKETS = ['Midtown', 'Brickell', 'East Austin', 'DFW Industrial', 'Loop', 'Del Mar', 'LoDo', 'Buckhead'];

interface CapRateFeature {
  name: string;
  weight: number;
  currentValue: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface HistoricalCapRate {
  date: string;
  capRate: number;
  tenYearYield: number;
  spread: number;
  vacancyPct: number;
  noiGrowthPct: number;
  transactionVolume: number;
}

interface CapRatePrediction {
  propertyType: string;
  submarket: string;
  currentCapRate: number;
  predictedCapRate3m: number;
  predictedCapRate6m: number;
  predictedCapRate12m: number;
  confidenceInterval: { low: number; high: number };
  directionProbability: { compression: number; stable: number; expansion: number };
  modelAccuracy: number;
  features: CapRateFeature[];
  historicalSeries: HistoricalCapRate[];
  rSquared: number;
  maeBasePts: number;
}

function DirectionBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.05) return <span className="text-[10px] text-white/30 font-mono">STABLE</span>;
  return delta < 0 ? (
    <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
      <TrendingDown className="w-3 h-3" /> COMPRESSION
    </span>
  ) : (
    <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-mono">
      <TrendingUp className="w-3 h-3" /> EXPANSION
    </span>
  );
}

function FeatureBar({ feature }: { feature: CapRateFeature }) {
  const barWidth = `${Math.round(feature.weight * 100)}%`;
  const impactColor = feature.impact === 'positive' ? 'bg-emerald-500/60' : feature.impact === 'negative' ? 'bg-red-500/60' : 'bg-white/20';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/70">{feature.name}</span>
        <span className="text-white/40 font-mono">{(feature.weight * 100).toFixed(0)}% weight</span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', impactColor)} style={{ width: barWidth }} />
      </div>
    </div>
  );
}

function HistoryChart({ series }: { series: HistoricalCapRate[] }) {
  if (!series.length) return null;
  const maxCap = Math.max(...series.map((s) => s.capRate));
  const minCap = Math.min(...series.map((s) => s.capRate));
  const range = maxCap - minCap || 1;
  const chartH = 120;

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Historical Cap Rate Trend</p>
      <div className="flex items-end gap-1" style={{ height: chartH }}>
        {series.map((s) => {
          const pct = ((s.capRate - minCap) / range);
          const h = Math.max(8, pct * (chartH - 16) + 16);
          return (
            <div key={s.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-white/40 font-mono">{s.capRate.toFixed(1)}%</span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-[#2d6a4f]/40 to-[#2d6a4f]/80 min-w-[20px]"
                style={{ height: h }}
              />
              <span className="text-[8px] text-white/30 font-mono">{s.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProbabilityGauge({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-white/50 w-24">{label}</span>
      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${(pct * 100).toFixed(0)}%` }} />
      </div>
      <span className="text-[11px] font-mono text-white/60 w-10 text-right">{(pct * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function CapRateModelPage() {
  const [propertyType, setPropertyType] = useState<PropertyType>('office');
  const [submarket, setSubmarket] = useState('Midtown');
  const [rateChangeBps, setRateChangeBps] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['cap-rate-prediction', propertyType, submarket, rateChangeBps],
    queryFn: async () => {
      const params = new URLSearchParams({
        propertyType,
        submarket,
        rateChangeBps: String(rateChangeBps),
      });
      const r = await fetch(`${BASE}/api/terra/cap-rate/predict?${params}`);
      if (!r.ok) throw new Error('Failed to load cap rate prediction');
      const json = await r.json();
      return json.data as { prediction: CapRatePrediction; modelVersion: string };
    },
    staleTime: 60_000,
  });

  const prediction = data?.prediction;
  const delta12m = prediction ? prediction.predictedCapRate12m - prediction.currentCapRate : 0;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#2d6a4f]" />
            Predictive Cap Rate Model
          </h1>
          <p className="text-[11px] text-white/30 mt-0.5">
            ML-driven cap rate forecasting across property types and submarkets
          </p>
        </div>
        <MicroFeedbackWidget featureId="terra-cap-rate-model" featureName="Predictive Cap Rate Model" app="terra" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Model Inputs</p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50">Property Type</label>
              <div className="relative">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full h-8 rounded bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/80 px-2 appearance-none cursor-pointer"
                >
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50">Submarket</label>
              <div className="relative">
                <select
                  value={submarket}
                  onChange={(e) => setSubmarket(e.target.value)}
                  className="w-full h-8 rounded bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/80 px-2 appearance-none cursor-pointer"
                >
                  {SUBMARKETS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50">Rate Change Scenario (bps)</label>
              <input
                type="range"
                min={-200}
                max={200}
                step={25}
                value={rateChangeBps}
                onChange={(e) => setRateChangeBps(Number(e.target.value))}
                className="w-full accent-[#2d6a4f]"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>-200 bps</span>
                <span className={cn('font-semibold', rateChangeBps === 0 ? 'text-white/40' : rateChangeBps < 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {rateChangeBps >= 0 ? '+' : ''}{rateChangeBps} bps
                </span>
                <span>+200 bps</span>
              </div>
            </div>
          </div>

          {prediction && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Model Stats</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-white/30">R²</p>
                  <p className="text-sm font-mono text-white/70">{prediction.rSquared.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30">MAE</p>
                  <p className="text-sm font-mono text-white/70">{prediction.maeBasePts} bps</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30">Accuracy</p>
                  <p className="text-sm font-mono text-white/70">{(prediction.modelAccuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30">Version</p>
                  <p className="text-sm font-mono text-white/70">{data?.modelVersion}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Loader2 className="w-5 h-5 text-[#2d6a4f] animate-spin" />
            </div>
          )}

          {prediction && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] text-white/30 font-mono">CURRENT</p>
                  <p className="text-xl font-mono text-white/90 mt-1">{prediction.currentCapRate.toFixed(2)}%</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{PROPERTY_TYPE_LABELS[propertyType]} · {submarket}</p>
                </div>
                {[
                  { label: '3-MONTH', value: prediction.predictedCapRate3m },
                  { label: '6-MONTH', value: prediction.predictedCapRate6m },
                  { label: '12-MONTH', value: prediction.predictedCapRate12m },
                ].map((item) => {
                  const d = item.value - prediction.currentCapRate;
                  return (
                    <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-[10px] text-white/30 font-mono">{item.label}</p>
                      <p className="text-xl font-mono text-white/90 mt-1">{item.value.toFixed(2)}%</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {d < -0.05 ? <ArrowDown className="w-3 h-3 text-emerald-400" /> : d > 0.05 ? <ArrowUp className="w-3 h-3 text-red-400" /> : <ArrowRight className="w-3 h-3 text-white/30" />}
                        <span className={cn('text-[10px] font-mono', d < -0.05 ? 'text-emerald-400' : d > 0.05 ? 'text-red-400' : 'text-white/30')}>
                          {d >= 0 ? '+' : ''}{(d * 100).toFixed(0)} bps
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">12-Month Outlook</p>
                    <DirectionBadge delta={delta12m} />
                  </div>
                  <div className="space-y-2">
                    <ProbabilityGauge label="Compression" pct={prediction.directionProbability.compression} color="bg-emerald-500/70" />
                    <ProbabilityGauge label="Stable" pct={prediction.directionProbability.stable} color="bg-white/20" />
                    <ProbabilityGauge label="Expansion" pct={prediction.directionProbability.expansion} color="bg-red-500/70" />
                  </div>
                  <div className="pt-2 border-t border-white/[0.04] flex items-center gap-1.5 text-[10px] text-white/30">
                    <Info className="w-3 h-3" />
                    <span>
                      95% CI: {prediction.confidenceInterval.low.toFixed(2)}% – {prediction.confidenceInterval.high.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Feature Importance</p>
                  <div className="space-y-2.5">
                    {prediction.features.map((f) => (
                      <FeatureBar key={f.name} feature={f} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <HistoryChart series={prediction.historicalSeries} />
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-3">Historical Detail</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-white/30 text-left">
                        <th className="pb-2 font-medium">Period</th>
                        <th className="pb-2 font-medium">Cap Rate</th>
                        <th className="pb-2 font-medium">10Y Yield</th>
                        <th className="pb-2 font-medium">Spread</th>
                        <th className="pb-2 font-medium">Vacancy</th>
                        <th className="pb-2 font-medium">NOI Growth</th>
                        <th className="pb-2 font-medium">Txn Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prediction.historicalSeries.map((s) => (
                        <tr key={s.date} className="border-b border-white/[0.03] text-white/60">
                          <td className="py-1.5 font-mono">{s.date}</td>
                          <td className="py-1.5 font-mono">{s.capRate.toFixed(2)}%</td>
                          <td className="py-1.5 font-mono">{s.tenYearYield.toFixed(2)}%</td>
                          <td className="py-1.5 font-mono">{s.spread} bps</td>
                          <td className="py-1.5 font-mono">{s.vacancyPct.toFixed(1)}%</td>
                          <td className={cn('py-1.5 font-mono', s.noiGrowthPct >= 0 ? 'text-emerald-400/70' : 'text-red-400/70')}>
                            {s.noiGrowthPct >= 0 ? '+' : ''}{s.noiGrowthPct.toFixed(1)}%
                          </td>
                          <td className="py-1.5 font-mono">{s.transactionVolume.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
