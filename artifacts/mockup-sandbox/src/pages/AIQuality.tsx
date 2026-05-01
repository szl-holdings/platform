import {
  Activity,
  AlertCircle,
  BarChart2,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Loader,
  RefreshCw,
  Shield,
  ThumbsDown,
  ThumbsUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// NEXUS scope: scripted demo data only — no live /api/ai/ops calls. The
// previous transitional `apiFetch` helper has been removed. See
// docs/demos/nexus-scope.md.

interface CircuitBreakerStatus {
  provider: string;
  state: 'closed' | 'open' | 'half-open';
  consecutiveFailures: number;
  openedAt: number | null;
  lastTestedAt: number | null;
  totalTripped: number;
}

interface OpsTrace {
  traceId: string;
  model: string;
  modelProvider: string;
  domain: string;
  confidence: number;
  latencyMs: number;
  costEstimateUsd: number;
  status: string;
  requiresReview: boolean;
  capturedAt: string;
  inputSummary?: string;
  outputSummary?: string;
  evalScore?: number;
}

interface OpsSummary {
  period: string;
  traces: {
    total: number;
    reviewRequired: number;
    reviewRate: number;
    avgLatencyMs: number;
    avgConfidence: number;
    totalCostUsd: number;
    evalPassRate: number | null;
  };
  reviewQueue: {
    total: number;
    pending: number;
    inReview: number;
    escalated: number;
    criticalPending: number;
    highPending: number;
  };
}

function StateChip({ state }: { state: string }) {
  const cfg = {
    closed: { color: 'text-praxis-green border-praxis-green/30 bg-praxis-green/10', label: 'CLOSED' },
    open: { color: 'text-praxis-red border-red-500/30 bg-red-500/10', label: 'OPEN' },
    'half-open': {
      color: 'text-praxis-amber border-praxis-amber/30 bg-praxis-amber/10',
      label: 'HALF-OPEN',
    },
  }[state] ?? { color: 'text-muted-foreground border-praxis', label: state.toUpperCase() };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function FeedbackWidget({ traceId: _traceId }: { traceId: string }) {
  const [sent, setSent] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendFeedback(sentiment: 'up' | 'down') {
    // NEXUS scope: scripted feedback only — no live /api call. The thumb
    // is recorded in local state and surfaces a confirmation chip.
    if (sent || loading) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 250));
    setSent(sentiment);
    setLoading(false);
  }

  if (sent) {
    return (
      <span
        className={`text-[10px] font-mono ${sent === 'up' ? 'text-praxis-green' : 'text-praxis-red'}`}
      >
        {sent === 'up' ? '👍 rated' : '👎 flagged'}
      </span>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => sendFeedback('up')}
        disabled={loading}
        className="p-1 rounded hover:bg-praxis-green/10 text-muted-foreground hover:text-praxis-green transition-colors"
        title="Thumbs up"
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        onClick={() => sendFeedback('down')}
        disabled={loading}
        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-praxis-red transition-colors"
        title="Thumbs down — flags for review"
      >
        <ThumbsDown className="w-3 h-3" />
      </button>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'cyan' | 'green' | 'amber' | 'red' | 'default';
}) {
  const colorClass = {
    cyan: 'text-praxis-cyan',
    green: 'text-praxis-green',
    amber: 'text-praxis-amber',
    red: 'text-praxis-red',
    default: 'text-foreground',
  }[color];
  return (
    <div className="rounded-lg bg-praxis-surface border border-praxis p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-mono font-bold ${colorClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scripted demo data (NEXUS scope: no live /api/ai/ops calls)
// ---------------------------------------------------------------------------

const SCRIPTED_SUMMARY: OpsSummary = {
  period: 'last_24h',
  traces: {
    total: 1487,
    reviewRequired: 42,
    reviewRate: 0.028,
    avgLatencyMs: 638,
    avgConfidence: 0.91,
    totalCostUsd: 12.84,
    evalPassRate: 0.94,
  },
  reviewQueue: {
    total: 42,
    pending: 31,
    inReview: 8,
    escalated: 3,
    criticalPending: 2,
    highPending: 9,
  },
};

const SCRIPTED_CIRCUITS: CircuitBreakerStatus[] = [
  {
    provider: 'openai-gpt-4o',
    state: 'closed',
    consecutiveFailures: 0,
    openedAt: null,
    lastTestedAt: Date.now() - 1000 * 60 * 4,
    totalTripped: 2,
  },
  {
    provider: 'anthropic-claude-3.5-sonnet',
    state: 'closed',
    consecutiveFailures: 0,
    openedAt: null,
    lastTestedAt: Date.now() - 1000 * 60 * 2,
    totalTripped: 0,
  },
  {
    provider: 'anthropic-claude-3-opus',
    state: 'half-open',
    consecutiveFailures: 1,
    openedAt: Date.now() - 1000 * 60 * 12,
    lastTestedAt: Date.now() - 1000 * 60 * 1,
    totalTripped: 4,
  },
  {
    provider: 'gemini-1.5-pro',
    state: 'open',
    consecutiveFailures: 7,
    openedAt: Date.now() - 1000 * 60 * 6,
    lastTestedAt: Date.now() - 1000 * 60 * 6,
    totalTripped: 9,
  },
];

const SCRIPTED_TRACES: OpsTrace[] = [
  {
    traceId: 'trc_01HX9P1A',
    model: 'gpt-4o-2024-08-06',
    modelProvider: 'openai',
    domain: 'maritime.bunkering',
    confidence: 0.96,
    latencyMs: 612,
    costEstimateUsd: 0.014,
    status: 'completed',
    requiresReview: false,
    capturedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    inputSummary: 'Compute optimal bunker port for VLSFO + scrubber pivot',
    outputSummary: 'Singapore at +0.4d delay, $32k savings vs Rotterdam baseline.',
    evalScore: 0.97,
  },
  {
    traceId: 'trc_01HX9P22',
    model: 'claude-3-5-sonnet-20241022',
    modelProvider: 'anthropic',
    domain: 'aegis.compliance',
    confidence: 0.74,
    latencyMs: 1184,
    costEstimateUsd: 0.022,
    status: 'completed',
    requiresReview: true,
    capturedAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    inputSummary: 'Map MAS Notice 626 changes to active KYC playbook',
    outputSummary: 'Section 4.2 — beneficial-owner refresh needs operator review.',
    evalScore: 0.81,
  },
  {
    traceId: 'trc_01HX9P3M',
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    domain: 'terra.appraisal',
    confidence: 0.93,
    latencyMs: 414,
    costEstimateUsd: 0.003,
    status: 'completed',
    requiresReview: false,
    capturedAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
    inputSummary: 'Comp set for 8 Battery Rd refresh',
    outputSummary: '6-comp set assembled, weighted price/sf range $1,820–$2,240.',
    evalScore: 0.94,
  },
  {
    traceId: 'trc_01HX9P5Q',
    model: 'claude-3-5-sonnet-20241022',
    modelProvider: 'anthropic',
    domain: 'counsel.matter',
    confidence: 0.62,
    latencyMs: 1742,
    costEstimateUsd: 0.031,
    status: 'completed',
    requiresReview: true,
    capturedAt: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
    inputSummary: 'Cross-reference NDA clause 7 against state-of-the-art carve-outs',
    outputSummary: 'Clause 7(b) conflicts with Annex C definition — escalate to partner.',
    evalScore: 0.69,
  },
  {
    traceId: 'trc_01HX9P7Z',
    model: 'gpt-4o-2024-08-06',
    modelProvider: 'openai',
    domain: 'sentra.detection',
    confidence: 0.88,
    latencyMs: 522,
    costEstimateUsd: 0.011,
    status: 'completed',
    requiresReview: false,
    capturedAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    inputSummary: 'Triage 3 SOC alerts (auth-anomaly cluster)',
    outputSummary: '2 alerts auto-suppressed (known maintenance window); 1 escalated.',
    evalScore: 0.91,
  },
];

export default function AIQuality() {
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [circuits, setCircuits] = useState<CircuitBreakerStatus[]>([]);
  const [traces, setTraces] = useState<OpsTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<OpsTrace | null>(null);

  const load = useCallback(async () => {
    // NEXUS scope: scripted demo data only — no live /api/ai/ops calls.
    setLoading(true);
    // brief artificial delay so the refresh interaction still feels live
    await new Promise((r) => setTimeout(r, 180));
    setSummary(SCRIPTED_SUMMARY);
    setCircuits(SCRIPTED_CIRCUITS);
    setTraces(SCRIPTED_TRACES);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCount = circuits.filter((c) => c.state === 'open').length;
  const halfOpenCount = circuits.filter((c) => c.state === 'half-open').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-praxis-cyan font-mono tracking-wide">
            AI QUALITY DASHBOARD
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control plane health · circuit breakers · trace feedback
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-praxis-surface border border-praxis text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-praxis-red flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error} — some data may be unavailable without authentication
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<Activity className="w-3 h-3" />}
            label="Traces (24h)"
            value={summary.traces.total}
            sub={`${summary.traces.reviewRequired} requiring review`}
            color="cyan"
          />
          <MetricCard
            icon={<Clock className="w-3 h-3" />}
            label="Avg Latency"
            value={`${summary.traces.avgLatencyMs}ms`}
            sub="p50 inference latency"
            color="default"
          />
          <MetricCard
            icon={<DollarSign className="w-3 h-3" />}
            label="AI Cost (24h)"
            value={`$${summary.traces.totalCostUsd.toFixed(3)}`}
            sub="estimated provider cost"
            color="amber"
          />
          <MetricCard
            icon={<BarChart2 className="w-3 h-3" />}
            label="Eval Pass Rate"
            value={
              summary.traces.evalPassRate != null
                ? `${(summary.traces.evalPassRate * 100).toFixed(1)}%`
                : '—'
            }
            sub={`avg confidence ${(summary.traces.avgConfidence * 100).toFixed(0)}%`}
            color={
              summary.traces.evalPassRate != null && summary.traces.evalPassRate >= 0.8
                ? 'green'
                : 'amber'
            }
          />
        </div>
      )}

      <div className="rounded-lg bg-praxis-surface border border-praxis p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-praxis-cyan" />
          <h2 className="text-sm font-semibold text-praxis-cyan font-mono">CIRCUIT BREAKERS</h2>
          {openCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-praxis-red">
              {openCount} OPEN
            </span>
          )}
          {halfOpenCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-praxis-amber/40 bg-praxis-amber/10 text-praxis-amber">
              {halfOpenCount} HALF-OPEN
            </span>
          )}
        </div>
        {loading && circuits.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader className="w-3 h-3 animate-spin" /> Loading circuit breaker status…
          </div>
        ) : circuits.length === 0 ? (
          <div className="text-xs text-muted-foreground/60">No circuit breaker data available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {circuits.map((cb) => (
              <div
                key={cb.provider}
                className="rounded border border-praxis bg-praxis-bg px-3 py-2 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-mono font-semibold">{cb.provider}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {cb.consecutiveFailures} failures · {cb.totalTripped} trips
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StateChip state={cb.state} />
                  {cb.state === 'closed' ? (
                    <CheckCircle className="w-3 h-3 text-praxis-green" />
                  ) : cb.state === 'open' ? (
                    <XCircle className="w-3 h-3 text-praxis-red" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-praxis-amber" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {summary && (
        <div className="rounded-lg bg-praxis-surface border border-praxis p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-praxis-amber" />
            <h2 className="text-sm font-semibold text-praxis-amber font-mono">REVIEW QUEUE</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {[
              { label: 'Total', value: summary.reviewQueue.total, color: 'text-foreground' },
              { label: 'Pending', value: summary.reviewQueue.pending, color: 'text-praxis-amber' },
              { label: 'In Review', value: summary.reviewQueue.inReview, color: 'text-praxis-cyan' },
              { label: 'Escalated', value: summary.reviewQueue.escalated, color: 'text-praxis-red' },
              {
                label: 'Critical',
                value: summary.reviewQueue.criticalPending,
                color: 'text-praxis-red',
              },
              { label: 'High', value: summary.reviewQueue.highPending, color: 'text-praxis-amber' },
            ].map((item) => (
              <div key={item.label} className="rounded border border-praxis bg-praxis-bg py-2 px-1">
                <div className={`text-xl font-mono font-bold ${item.color}`}>{item.value}</div>
                <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-praxis-surface border border-praxis p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-praxis-cyan" />
          <h2 className="text-sm font-semibold text-praxis-cyan font-mono">RECENT TRACES</h2>
          <span className="text-[10px] text-muted-foreground/60 ml-auto">
            thumbs-up/down sends feedback to review queue
          </span>
        </div>
        {loading && traces.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader className="w-3 h-3 animate-spin" /> Loading traces…
          </div>
        ) : traces.length === 0 ? (
          <div className="text-xs text-muted-foreground/60">
            No traces yet — inference calls will appear here
          </div>
        ) : (
          <div className="space-y-1.5">
            {traces.map((t) => (
              <div
                key={t.traceId}
                className="rounded border border-praxis bg-praxis-bg px-3 py-2 flex items-center gap-3 hover:border-praxis-cyan/30 transition-colors cursor-pointer"
                onClick={() => setSelectedTrace(selectedTrace?.traceId === t.traceId ? null : t)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-praxis-cyan truncate">{t.domain}</span>
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                    <span className="text-[10px] font-mono text-muted-foreground/70 truncate">
                      {t.model}
                    </span>
                    {t.requiresReview && (
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-praxis-amber/30 bg-praxis-amber/10 text-praxis-amber">
                        REVIEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground/60">
                    <span>{t.latencyMs}ms</span>
                    <span>${t.costEstimateUsd.toFixed(5)}</span>
                    <span>conf {(t.confidence * 100).toFixed(0)}%</span>
                    {t.evalScore != null && <span>eval {(t.evalScore * 100).toFixed(0)}%</span>}
                    <span className="ml-auto">{new Date(t.capturedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
                <FeedbackWidget traceId={t.traceId} />
                <ChevronRight
                  className={`w-3 h-3 text-muted-foreground/30 transition-transform ${
                    selectedTrace?.traceId === t.traceId ? 'rotate-90' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        )}
        {selectedTrace && (
          <div className="rounded border border-praxis-cyan/20 bg-praxis-bg p-3 space-y-2">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono">
              Trace detail
            </div>
            <div className="font-mono text-[10px] text-muted-foreground/80 break-all">
              id: {selectedTrace.traceId}
            </div>
            {selectedTrace.inputSummary && (
              <div className="text-xs text-muted-foreground/70">
                <span className="text-praxis-cyan/60">input: </span>
                {selectedTrace.inputSummary}
              </div>
            )}
            {selectedTrace.outputSummary && (
              <div className="text-xs text-muted-foreground/70">
                <span className="text-praxis-cyan/60">output: </span>
                {selectedTrace.outputSummary}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
