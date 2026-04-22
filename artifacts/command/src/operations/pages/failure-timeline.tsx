import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type FailureCategory = 'memory' | 'disk' | 'latency' | 'error_rate' | 'dependency' | 'capacity';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface PredictedFailure {
  id: string;
  service: string;
  category: FailureCategory;
  prediction: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  etaHours: number;
  etaRange: [number, number];
  signals: string[];
  recommendations: string[];
  revenueAtRisk: number;
  severity: 'critical' | 'high' | 'medium';
}

const CAT_COLOR: Record<FailureCategory, string> = {
  memory: '#ef4444',
  disk: '#f97316',
  latency: '#f59e0b',
  error_rate: '#dc2626',
  dependency: '#8b5cf6',
  capacity: '#3b82f6',
};

const CONF_COLOR: Record<ConfidenceLevel, string> = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#6b7280',
};

const FAILURES: PredictedFailure[] = [
  {
    id: 'PF-001',
    service: 'postgres-primary',
    category: 'disk',
    prediction: 'Disk capacity exhaustion — write failures expected',
    confidence: 92,
    confidenceLevel: 'high',
    etaHours: 4.5,
    etaRange: [3, 6],
    signals: [
      'Disk utilization at 87% — growing 0.3%/hour',
      'WAL archiving lag increasing: 14GB behind',
      'Vacuum not keeping pace with write volume',
    ],
    recommendations: [
      'Expand disk volume by 500GB immediately',
      'Run VACUUM FULL on top 5 tables',
      'Archive and rotate old WAL segments',
    ],
    revenueAtRisk: 340000,
    severity: 'critical',
  },
  {
    id: 'PF-002',
    service: 'api-gateway',
    category: 'memory',
    prediction: 'Memory pressure leading to OOM restart cascade',
    confidence: 84,
    confidenceLevel: 'high',
    etaHours: 8.2,
    etaRange: [6, 11],
    signals: [
      'Memory usage trending from 62% → 81% over 6h',
      'GC pause time increasing: +220ms P99 this hour',
      'Connection pool holding 2.3x normal open connections',
    ],
    recommendations: [
      'Increase pod memory limit from 2Gi to 4Gi',
      'Investigate connection leak in request middleware',
      'Enable memory profiling on current deployment',
    ],
    revenueAtRisk: 182000,
    severity: 'high',
  },
  {
    id: 'PF-003',
    service: 'ml-inference',
    category: 'capacity',
    prediction: 'GPU saturation — batch queue will stall',
    confidence: 76,
    confidenceLevel: 'medium',
    etaHours: 13.8,
    etaRange: [10, 18],
    signals: [
      'Request volume +34% WoW with no capacity increase',
      'Batch queue depth averaging 22k (baseline: 8k)',
      'GPU utilization sustained above 88% for 4h',
    ],
    recommendations: [
      'Provision 2 additional GPU nodes',
      'Implement request prioritization for high-value clients',
      'Enable auto-scaling policy for weekend traffic spike',
    ],
    revenueAtRisk: 94000,
    severity: 'high',
  },
  {
    id: 'PF-004',
    service: 'auth-service',
    category: 'dependency',
    prediction: 'Redis session cache degradation — auth latency spike',
    confidence: 61,
    confidenceLevel: 'medium',
    etaHours: 19.5,
    etaRange: [14, 26],
    signals: [
      'Redis eviction rate elevated: 340 keys/min vs baseline 40',
      'maxmemory-policy set to allkeys-lru — aggressive',
      'Session cache hit rate declining: 94% → 87% over 12h',
    ],
    recommendations: [
      'Increase Redis maxmemory from 4GB to 8GB',
      'Review session TTL — reduce from 48h to 24h',
      'Add Redis replica for read offloading',
    ],
    revenueAtRisk: 48000,
    severity: 'medium',
  },
  {
    id: 'PF-005',
    service: 'data-pipeline',
    category: 'error_rate',
    prediction: 'Schema drift will cause pipeline failures',
    confidence: 44,
    confidenceLevel: 'low',
    etaHours: 23.1,
    etaRange: [18, 30],
    signals: [
      'Upstream data format change detected in 2 of 8 feeds',
      'Schema validation warnings increasing: 12 → 89 today',
      'New vendor API version deployment scheduled tomorrow',
    ],
    recommendations: [
      'Update schema validators before vendor deployment',
      'Add schema compatibility layer',
      'Set pipeline circuit breaker thresholds',
    ],
    revenueAtRisk: 22000,
    severity: 'medium',
  },
];

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function _TimelineMarker({ hours, label }: { hours: number; label: string }) {
  const _now = 0;
  const maxHours = 30;
  const pct = Math.min(100, (hours / maxHours) * 100);
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full border-2"
        style={{ borderColor: GOLD, background: '#080c14' }}
      />
      <div
        className="text-[8px] mt-1 text-center whitespace-nowrap"
        style={{ color: DS.text.muted }}
      >
        {label}
      </div>
    </div>
  );
}

function FailurePin({
  failure,
  onClick,
  selected,
}: {
  failure: PredictedFailure;
  onClick: () => void;
  selected: boolean;
}) {
  const cc = CAT_COLOR[failure.category];
  const maxHours = 30;
  const pct = Math.min(98, Math.max(2, (failure.etaHours / maxHours) * 100));
  const [minPct, maxPct] = failure.etaRange.map((h) => Math.min(100, (h / maxHours) * 100));

  return (
    <div
      className="absolute"
      style={{ left: `${pct}%`, transform: 'translateX(-50%)', top: 0, bottom: 0 }}
    >
      <div
        className="absolute"
        style={{
          left: `${minPct - pct}%`,
          right: `${pct - maxPct}%`,
          top: '35%',
          height: '3px',
          background: `${cc}20`,
          borderRadius: '2px',
        }}
      />
      <button
        onClick={onClick}
        className="absolute flex flex-col items-center"
        style={{ transform: 'translateX(-50%)', top: '20%' }}
      >
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all"
          style={{
            background: selected ? cc : `${cc}20`,
            borderColor: cc,
            boxShadow: selected ? `0 0 8px ${cc}60` : 'none',
          }}
        >
          <AlertTriangle className="w-2 h-2" style={{ color: selected ? '#fff' : cc }} />
        </div>
        <div className="text-[7px] mt-1 font-mono whitespace-nowrap" style={{ color: cc }}>
          {failure.service}
        </div>
      </button>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#6b7280';
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

export default function FailureTimelinePage() {
  const [selected, setSelected] = useState<PredictedFailure | null>(FAILURES[0] ?? null);

  const sortedByEta = [...FAILURES].sort((a, b) => a.etaHours - b.etaHours);
  const totalRevAtRisk = FAILURES.reduce((s, f) => s + f.revenueAtRisk, 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>
              Predictive Failure Timeline
            </h1>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider"
              style={{
                background: 'rgba(139,92,246,0.1)',
                color: '#8b5cf6',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              AI FORECAST
            </span>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            AI analysis predicts failures 4–24 hours out with confidence scores. Prevent outages
            before they happen.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[18px] font-bold font-mono" style={{ color: '#ef4444' }}>
            {fmt$(totalRevAtRisk)}
          </div>
          <div className="text-[9px]" style={{ color: DS.text.muted }}>
            Revenue at risk
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: DS.border, background: DS.surface }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-medium" style={{ color: DS.text.secondary }}>
            Failure Forecast Timeline — Next 30 Hours
          </div>
          <div className="flex items-center gap-3 text-[9px]" style={{ color: DS.text.muted }}>
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: '#10b981' }}
              />
              High confidence
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: '#f59e0b' }}
              />
              Medium
            </span>
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: '#6b7280' }}
              />
              Low
            </span>
          </div>
        </div>

        <div className="relative h-20 mx-2">
          <div
            className="absolute inset-x-0 top-1/2 h-px"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          {[0, 6, 12, 18, 24, 30].map((h, _i) => (
            <div
              key={h}
              className="absolute"
              style={{ left: `${(h / 30) * 100}%`, top: 0, bottom: 0 }}
            >
              <div className="h-full w-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div
                className="absolute bottom-0 text-[7px] font-mono"
                style={{ color: DS.text.muted, transform: 'translateX(-50%)' }}
              >
                {h === 0 ? 'Now' : `+${h}h`}
              </div>
            </div>
          ))}
          {FAILURES.map((f) => (
            <FailurePin
              key={f.id}
              failure={f}
              onClick={() => setSelected(selected?.id === f.id ? null : f)}
              selected={selected?.id === f.id}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-[10px] font-medium mb-2" style={{ color: DS.text.secondary }}>
            Predicted Failures by ETA
          </div>
          {sortedByEta.map((f) => {
            const cc = CAT_COLOR[f.category];
            const isSelected = selected?.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelected(isSelected ? null : f)}
                className="w-full text-left rounded-xl border p-3 transition-all"
                style={{
                  borderColor: isSelected ? `${cc}40` : DS.border,
                  background: isSelected ? `${cc}06` : DS.surface,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0"
                    style={{ background: `${cc}12`, border: `1px solid ${cc}25` }}
                  >
                    <span
                      className="text-[11px] font-bold font-mono leading-none"
                      style={{ color: cc }}
                    >
                      {f.etaHours < 10 ? f.etaHours.toFixed(1) : Math.round(f.etaHours)}
                    </span>
                    <span className="text-[6px]" style={{ color: `${cc}80` }}>
                      hrs
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[11px] font-semibold leading-tight"
                      style={{ color: DS.text.primary }}
                    >
                      {f.service}
                    </div>
                    <div className="text-[9px] mt-0.5 truncate" style={{ color: DS.text.muted }}>
                      {f.prediction}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className="text-[10px] font-mono"
                      style={{ color: CONF_COLOR[f.confidenceLevel] }}
                    >
                      {f.confidence}%
                    </div>
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      confidence
                    </div>
                  </div>
                  <ChevronRight
                    className="w-3 h-3 shrink-0"
                    style={{
                      color: DS.text.muted,
                      transform: isSelected ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s',
                    }}
                  />
                </div>
                {isSelected && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                    <ConfidenceBar value={f.confidence} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div>
          {selected ? (
            <div
              className="rounded-xl border p-4 sticky top-4"
              style={{
                borderColor: `${CAT_COLOR[selected.category]}30`,
                background: `${CAT_COLOR[selected.category]}04`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                  style={{
                    background: `${CAT_COLOR[selected.category]}15`,
                    color: CAT_COLOR[selected.category],
                  }}
                >
                  {selected.category.replace('_', ' ')}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    background: `${CONF_COLOR[selected.confidenceLevel]}12`,
                    color: CONF_COLOR[selected.confidenceLevel],
                  }}
                >
                  {selected.confidenceLevel} confidence
                </span>
                <span className="ml-auto text-[9px] font-mono" style={{ color: '#ef4444' }}>
                  {fmt$(selected.revenueAtRisk)} at risk
                </span>
              </div>
              <div className="text-[13px] font-semibold mb-1" style={{ color: DS.text.primary }}>
                {selected.prediction}
              </div>
              <div className="text-[10px] mb-3" style={{ color: DS.text.muted }}>
                <strong style={{ color: DS.text.secondary }}>{selected.service}</strong> — ETA:{' '}
                {selected.etaRange[0]}–{selected.etaRange[1]}h from now ({selected.confidence}%
                confidence)
              </div>

              <div className="mb-3">
                <div
                  className="text-[9px] uppercase tracking-widest font-medium mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Telemetry Signals
                </div>
                <div className="space-y-1.5">
                  {selected.signals.map((sig, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <Activity
                        className="w-3 h-3 shrink-0 mt-0.5"
                        style={{ color: CAT_COLOR[selected.category] }}
                      />
                      <span style={{ color: DS.text.secondary }}>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div
                  className="text-[9px] uppercase tracking-widest font-medium mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Prevention Recommendations
                </div>
                <div className="space-y-1.5">
                  {selected.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-[10px] p-2 rounded-lg"
                      style={{
                        background: 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.1)',
                      }}
                    >
                      <Shield className="w-3 h-3 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                      <span style={{ color: DS.text.secondary }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                <button
                  className="flex-1 py-2 rounded-lg text-[10px] font-medium transition-all hover:opacity-90"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  Execute Prevention Runbook
                </button>
                <button
                  className="flex-1 py-2 rounded-lg text-[10px] font-medium transition-all hover:opacity-90"
                  style={{
                    background: DS.surface,
                    color: DS.text.secondary,
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  Schedule Review
                </button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl border p-8 flex flex-col items-center justify-center text-center"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <TrendingUp className="w-8 h-8 mb-3" style={{ color: DS.text.muted }} />
              <div className="text-[12px]" style={{ color: DS.text.muted }}>
                Select a predicted failure to view signals and prevention recommendations
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
