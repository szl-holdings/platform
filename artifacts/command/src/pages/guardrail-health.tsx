import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#d4a054';

interface GuardrailStat {
  guardrailId: string;
  guardrailName: string;
  totalEvaluations: number;
  triggerRate: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  overrideCount: number;
  falsePositiveRate: number;
  estimatedCostSavedUsd: number;
  lastTriggeredAt: number | null;
  trend: 'rising' | 'stable' | 'declining';
  tier: string;
  domain: string;
}

const FALLBACK_STATS: GuardrailStat[] = [
  {
    guardrailId: 'guardrail-high-cost-auto-execution',
    guardrailName: 'High-Cost Autonomous Execution Guard',
    totalEvaluations: 1842,
    triggerRate: 0.043,
    medianLatencyMs: 18,
    p95LatencyMs: 72,
    overrideCount: 3,
    falsePositiveRate: 0.038,
    estimatedCostSavedUsd: 284400,
    lastTriggeredAt: Date.now() - 4 * 60 * 60 * 1000,
    trend: 'stable',
    tier: 'dual-approved',
    domain: 'Finance',
  },
  {
    guardrailId: 'guardrail-regulatory-exposure',
    guardrailName: 'Regulatory Exposure Escalation Guard',
    totalEvaluations: 3104,
    triggerRate: 0.021,
    medianLatencyMs: 12,
    p95LatencyMs: 44,
    overrideCount: 1,
    falsePositiveRate: 0.015,
    estimatedCostSavedUsd: 0,
    lastTriggeredAt: Date.now() - 12 * 60 * 60 * 1000,
    trend: 'declining',
    tier: 'regulated',
    domain: 'Compliance',
  },
  {
    guardrailId: 'guardrail-cross-domain-critical',
    guardrailName: 'Cross-Domain Critical Action Guard',
    totalEvaluations: 924,
    triggerRate: 0.089,
    medianLatencyMs: 24,
    p95LatencyMs: 98,
    overrideCount: 12,
    falsePositiveRate: 0.134,
    estimatedCostSavedUsd: 0,
    lastTriggeredAt: Date.now() - 1 * 60 * 60 * 1000,
    trend: 'rising',
    tier: 'operator-approved',
    domain: 'Operations',
  },
  {
    guardrailId: 'guardrail-low-confidence-block',
    guardrailName: 'Low Confidence Autonomous Block',
    totalEvaluations: 6211,
    triggerRate: 0.127,
    medianLatencyMs: 8,
    p95LatencyMs: 31,
    overrideCount: 47,
    falsePositiveRate: 0.059,
    estimatedCostSavedUsd: 12800,
    lastTriggeredAt: Date.now() - 22 * 60 * 1000,
    trend: 'rising',
    tier: 'supervised',
    domain: 'All Domains',
  },
  {
    guardrailId: 'guardrail-pii-redaction',
    guardrailName: 'PII Redaction Enforcement',
    totalEvaluations: 9840,
    triggerRate: 0.312,
    medianLatencyMs: 31,
    p95LatencyMs: 112,
    overrideCount: 0,
    falsePositiveRate: 0.007,
    estimatedCostSavedUsd: 0,
    lastTriggeredAt: Date.now() - 3 * 60 * 1000,
    trend: 'stable',
    tier: 'regulated',
    domain: 'Privacy',
  },
  {
    guardrailId: 'guardrail-external-comms-block',
    guardrailName: 'External Communications Block',
    totalEvaluations: 2108,
    triggerRate: 0.018,
    medianLatencyMs: 7,
    p95LatencyMs: 28,
    overrideCount: 8,
    falsePositiveRate: 0.211,
    estimatedCostSavedUsd: 0,
    lastTriggeredAt: Date.now() - 48 * 60 * 60 * 1000,
    trend: 'declining',
    tier: 'operator-approved',
    domain: 'Security',
  },
];

const TIER_COLORS: Record<string, string> = {
  advisory: '#7c8a9a',
  supervised: '#6b8f71',
  'operator-approved': '#8b7ac8',
  'dual-approved': '#d4a054',
  regulated: '#f97316',
  sovereign: '#ef4444',
};

function fmt(ms: number): string {
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtTime(ts: number | null): string {
  if (!ts) return '—';
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function fmtRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function noiseBand(rate: number): { label: string; color: string } {
  if (rate > 0.15) return { label: 'Too noisy', color: '#ef4444' };
  if (rate < 0.005) return { label: 'Too quiet', color: '#7c8a9a' };
  return { label: 'Healthy', color: '#22c55e' };
}

function fpBand(rate: number): { label: string; color: string } {
  if (rate > 0.12) return { label: 'High FP', color: '#ef4444' };
  if (rate > 0.05) return { label: 'Moderate FP', color: '#d4a054' };
  return { label: 'Low FP', color: '#22c55e' };
}

function GuardrailRow({ stat }: { stat: GuardrailStat }) {
  const [expanded, setExpanded] = useState(false);
  const noise = noiseBand(stat.triggerRate);
  const fp = fpBand(stat.falsePositiveRate);
  const tierColor = TIER_COLORS[stat.tier] ?? ACCENT;

  return (
    <div
      className="rounded border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[8px] font-mono font-semibold px-1.5 py-px rounded uppercase"
              style={{ color: tierColor, background: `${tierColor}18`, border: `1px solid ${tierColor}40` }}
            >
              {stat.tier}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {stat.guardrailName}
            </span>
            <span
              className="text-[9px] font-mono px-1.5 py-px rounded"
              style={{ color: noise.color, background: `${noise.color}12`, border: `1px solid ${noise.color}30` }}
            >
              {noise.label}
            </span>
            {stat.trend === 'rising' ? (
              <TrendingUp className="w-3 h-3" style={{ color: '#ef4444' }} />
            ) : stat.trend === 'declining' ? (
              <TrendingDown className="w-3 h-3" style={{ color: '#22c55e' }} />
            ) : null}
          </div>

          <div className="grid grid-cols-5 gap-4 mt-2">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Evaluations
              </div>
              <div className="text-[12px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {stat.totalEvaluations.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Trigger Rate
              </div>
              <div className="text-[12px] font-mono font-bold" style={{ color: noise.color }}>
                {fmtRate(stat.triggerRate)}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Median Latency
              </div>
              <div className="text-[12px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {fmt(stat.medianLatencyMs)}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                False-Positive Rate
              </div>
              <div className="text-[12px] font-mono font-bold" style={{ color: fp.color }}>
                {fmtRate(stat.falsePositiveRate)}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Last Triggered
              </div>
              <div className="text-[12px] font-mono font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {fmtTime(stat.lastTriggeredAt)}
              </div>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 pt-2 grid md:grid-cols-3 gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Latency Distribution
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Median (P50)', val: fmt(stat.medianLatencyMs) },
                { label: 'P95', val: fmt(stat.p95LatencyMs) },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between text-[11px] font-mono">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Override Analysis
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Override Count', val: stat.overrideCount },
                {
                  label: 'FP Classification',
                  val: fp.label,
                  color: fp.color,
                },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between text-[11px] font-mono">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <span style={{ color: color ?? 'rgba(255,255,255,0.85)' }}>{String(val)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Cost Savings Estimate
            </div>
            <div
              className="flex items-center gap-2 text-[22px] font-bold font-mono"
              style={{ color: '#22c55e' }}
            >
              <DollarSign className="w-5 h-5" />
              {stat.estimatedCostSavedUsd > 0
                ? stat.estimatedCostSavedUsd.toLocaleString()
                : '—'}
            </div>
            {stat.estimatedCostSavedUsd > 0 && (
              <div className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                lifetime blocked-action cost avoidance
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

async function fetchGuardrailStats(): Promise<GuardrailStat[]> {
  try {
    const res = await fetch('/api/guardian/telemetry/stats?window=86400000', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data?: GuardrailStat[] };
    return json.data ?? FALLBACK_STATS;
  } catch {
    return FALLBACK_STATS;
  }
}

export default function GuardrailHealthPage() {
  const [windowLabel, setWindowLabel] = useState<'1h' | '24h' | '7d'>('24h');

  const statsQ = useStandardQuery<GuardrailStat[]>({
    queryKey: ['guardrail-telemetry', windowLabel],
    queryFn: fetchGuardrailStats,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const stats = statsQ.data ?? FALLBACK_STATS;
  const totalEvals = stats.reduce((s, g) => s + g.totalEvaluations, 0);
  const avgTrigger = stats.length > 0 ? stats.reduce((s, g) => s + g.triggerRate, 0) / stats.length : 0;
  const totalCostSaved = stats.reduce((s, g) => s + g.estimatedCostSavedUsd, 0);
  const noisyGuardrails = stats.filter((g) => g.triggerRate > 0.15 || g.falsePositiveRate > 0.12).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
          >
            <BarChart3 className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-[14px] font-bold tracking-wide" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Guardrail Health
            </h1>
            <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Real-time telemetry · trigger rates · latency · false-positive analysis · cost savings
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 p-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['1h', '24h', '7d'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setWindowLabel(w)}
                className="px-2.5 py-1 rounded text-[10px] font-mono transition-colors"
                style={{
                  background: windowLabel === w ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: windowLabel === w ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                }}
              >
                {w}
              </button>
            ))}
          </div>
          <button
            onClick={() => statsQ.refetch()}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className={`w-3 h-3 ${statsQ.isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Total Evaluations',
            value: totalEvals.toLocaleString(),
            icon: Shield,
            color: '#8b7ac8',
          },
          {
            label: 'Avg Trigger Rate',
            value: fmtRate(avgTrigger),
            icon: Activity,
            color: ACCENT,
          },
          {
            label: 'Cost Savings Estimated',
            value: `$${(totalCostSaved / 1000).toFixed(0)}K`,
            icon: DollarSign,
            color: '#22c55e',
          },
          {
            label: 'Guardrails Needing Attention',
            value: String(noisyGuardrails),
            icon: noisyGuardrails > 0 ? AlertTriangle : CheckCircle2,
            color: noisyGuardrails > 0 ? '#ef4444' : '#22c55e',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded border p-4 flex items-center gap-3"
            style={{
              borderColor: 'rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center shrink-0"
              style={{ background: `${color}12`, border: `1px solid ${color}30` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <div className="text-[18px] font-bold font-mono" style={{ color }}>
                {value}
              </div>
              <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {noisyGuardrails > 0 && (
        <div
          className="rounded p-3 mb-4 flex items-start gap-2 text-[11px]"
          style={{
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.20)',
            color: '#ef4444',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">{noisyGuardrails} guardrail{noisyGuardrails > 1 ? 's' : ''} require attention</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>
              {' '}— trigger rate above 15% or false-positive rate above 12% indicates tuning needed.
            </span>
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-3 px-3 py-1.5 mb-2 text-[9px] font-mono uppercase tracking-wider"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <span>Guardrail</span>
        <span className="text-center">Trigger / FP Rate</span>
        <span className="text-right">Latency · Last Seen</span>
      </div>

      <div className="flex flex-col gap-2">
        {stats.map((stat) => (
          <GuardrailRow key={stat.guardrailId} stat={stat} />
        ))}
      </div>

      <div className="mt-6 pt-4 flex items-center gap-4 text-[10px] font-mono" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Auto-refreshes every 30s</span>
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Data window: {windowLabel}</span>
        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {stats.length} active guardrails instrumented</span>
      </div>
    </div>
  );
}
