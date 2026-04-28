import { useStandardQuery } from '@szl-holdings/api-client-react';
import { color } from '@szl-holdings/design-system';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  RefreshCw,
  Shield,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#40856a';
const API = '/api';

function fetchDistressForecast() {
  return fetch(`${API}/terra/cognitive/distress-forecast`)
    .then((r) => r.json())
    .then((d) => d.data ?? d);
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#c04a2a' : score >= 50 ? '#c8a060' : '#40856a';
  return (
    <div
      className="flex flex-col items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}40` }}
    >
      <span className="text-sm font-bold font-mono" style={{ color }}>
        {score}
      </span>
      <span className="text-[8px]" style={{ color: `${color}80` }}>
        risk
      </span>
    </div>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const color = value >= 0.85 ? '#40856a' : value >= 0.65 ? '#c8a060' : '#c04a2a';
  const label = value >= 0.85 ? 'High' : value >= 0.65 ? 'Medium' : 'Low';
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
    >
      {label} {(value * 100).toFixed(0)}%
    </span>
  );
}

const SIGNAL_COLORS: Record<string, string> = {
  critical: color.accent.red,
  high: color.accent.amber,
  medium: color.accent.amber,
  low: color.accent.slate,
};

function ForecastCard({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const rankColor = item.rank === 1 ? '#c04a2a' : item.rank === 2 ? '#c8a060' : '#4a6070';

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${item.distressScore >= 70 ? 'rgba(192,74,42,0.25)' : item.distressScore >= 50 ? 'rgba(200,160,96,0.2)' : 'rgba(255,255,255,0.06)'}`,
      }}
    >
      <div
        className="p-4"
        style={{
          background: item.distressScore >= 70 ? 'rgba(192,74,42,0.04)' : 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: `${rankColor}20`, color: rankColor }}
            >
              #{item.rank}
            </div>
            <ScoreBadge score={item.distressScore} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#e8edf8' }}>
                  {item.address}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <ConfidencePill value={item.confidence} />
                  <span
                    className="text-[9px] flex items-center gap-1"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    Horizon: {item.horizon}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {item.signals.map((sig: any, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: SIGNAL_COLORS[sig.severity] ?? 'var(--gi-text-muted)' }}
                  />
                  <div>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {sig.label}
                    </span>
                    <span className="ml-1.5 text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {(sig.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-3 p-2.5 rounded-lg"
              style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}15` }}
            >
              <div
                className="text-[9px] uppercase tracking-wider font-semibold mb-1"
                style={{ color: `${ACCENT}80` }}
              >
                Suggested Action
              </div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {item.suggestedAction}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-[10px] transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Evidence chain ({item.evidence?.length ?? 0})
        </button>
      </div>

      {expanded && item.evidence?.length > 0 && (
        <div
          className="p-4 space-y-2"
          style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          {item.evidence.map((ev: any, i: number) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium" style={{ color: '#e8edf8' }}>
                    {ev.source}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    {ev.freshness} old
                  </span>
                </div>
                <div
                  className="text-[10px] mt-0.5 italic"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {ev.excerpt}
                </div>
              </div>
            </div>
          ))}
          <div
            className="flex items-center gap-1 text-[9px] mt-1"
            style={{ color: 'rgba(64,133,106,0.6)' }}
          >
            <Tag className="w-2.5 h-2.5" />
            Trace: {item.traceRef}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DistressForecastPage() {
  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ['terra-distress-forecast'],
    queryFn: fetchDistressForecast,
  });

  const ranked: any[] = data?.ranked ?? [];
  const forecast = data?.forecast;
  const methodology = data?.methodology;
  const prov = data?.provenance;

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4" style={{ color: '#c04a2a' }} />
            <h1 className="text-xl font-semibold" style={{ color: '#e8edf8' }}>
              Distress Forecast
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            AI-ranked at-risk properties with evidence chain, confidence scoring, and recommended
            actions — powered by planner+verifier.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: 'rgba(192,74,42,0.12)',
            border: '1px solid rgba(192,74,42,0.25)',
            color: '#c04a2a',
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Forecast
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: `${ACCENT}30`, borderTopColor: ACCENT }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {forecast && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Forecast Horizon', value: forecast.horizon, color: ACCENT },
                { label: 'At-Risk Count', value: forecast.atRiskCount, color: '#c04a2a' },
                { label: 'Watch Count', value: forecast.watchCount, color: '#c8a060' },
                { label: 'Total Assessed', value: ranked.length, color: 'var(--gi-text-muted)' },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl p-4"
                  style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}
                >
                  <div className="text-xl font-bold font-mono" style={{ color: m.color }}>
                    {m.value}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {ranked.map((item) => (
                <ForecastCard key={item.rank} item={item} />
              ))}
            </div>

            <div className="space-y-4">
              {methodology && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-xs font-semibold mb-3 uppercase tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Model Methodology
                  </div>
                  <div className="space-y-2 text-xs">
                    <div
                      className="flex justify-between py-1"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Version</span>
                      <span className="font-mono" style={{ color: '#e8edf8' }}>
                        {methodology.modelVersion}
                      </span>
                    </div>
                    <div
                      className="flex justify-between py-1"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Planner steps</span>
                      <span className="font-mono" style={{ color: '#e8edf8' }}>
                        {methodology.plannerSteps}
                      </span>
                    </div>
                    <div
                      className="flex justify-between py-1"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Verifier passes</span>
                      <span className="font-mono" style={{ color: '#e8edf8' }}>
                        {methodology.verifierPasses}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div
                      className="text-[10px] font-semibold mb-2 uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      Signal Factors
                    </div>
                    {methodology.signals.map((s: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="text-xs font-semibold mb-3 uppercase tracking-wider"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Score Legend
                </div>
                {[
                  { range: '70–100', label: 'At Risk', color: '#c04a2a', Icon: AlertTriangle },
                  { range: '50–69', label: 'Watch', color: '#c8a060', Icon: Clock },
                  { range: '0–49', label: 'Stable', color: '#40856a', Icon: CheckCircle },
                ].map((l) => (
                  <div
                    key={l.range}
                    className="flex items-center gap-2 py-1.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <l.Icon className="w-3 h-3" style={{ color: l.color }} />
                    <span className="text-[10px] font-mono" style={{ color: l.color }}>
                      {l.range}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>

              {prov && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      Provenance
                    </span>
                    <div className="ml-auto">
                      <ConfidencePill value={prov.confidence} />
                    </div>
                  </div>
                  <div
                    className="text-[10px] font-mono mb-1"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {prov.source}
                  </div>
                  <div className="text-[9px]" style={{ color: 'rgba(64,133,106,0.5)' }}>
                    {prov.traceRef}
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {prov.runtime} · {new Date(prov.generatedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
