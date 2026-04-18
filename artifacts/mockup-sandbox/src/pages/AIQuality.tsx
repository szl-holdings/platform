import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
  DollarSign,
  Clock,
  Shield,
  BarChart2,
  ChevronRight,
  Loader,
} from "lucide-react";

const API = "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status}`);
  const json = await r.json() as { data?: T; success?: boolean } & T;
  return (json as { data?: T }).data ?? json as T;
}

interface CircuitBreakerStatus {
  provider: string;
  state: "closed" | "open" | "half-open";
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
    closed: { color: "text-nexus-green border-nexus-green/30 bg-nexus-green/10", label: "CLOSED" },
    open: { color: "text-nexus-red border-red-500/30 bg-red-500/10", label: "OPEN" },
    "half-open": { color: "text-nexus-amber border-nexus-amber/30 bg-nexus-amber/10", label: "HALF-OPEN" },
  }[state] ?? { color: "text-muted-foreground border-nexus", label: state.toUpperCase() };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function FeedbackWidget({ traceId }: { traceId: string }) {
  const [sent, setSent] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendFeedback(sentiment: "up" | "down") {
    if (sent || loading) return;
    setLoading(true);
    try {
      await apiFetch(`/ai/ops/traces/${traceId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ sentiment }),
      });
      setSent(sentiment);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <span className={`text-[10px] font-mono ${sent === "up" ? "text-nexus-green" : "text-nexus-red"}`}>
        {sent === "up" ? "👍 rated" : "👎 flagged"}
      </span>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => sendFeedback("up")}
        disabled={loading}
        className="p-1 rounded hover:bg-nexus-green/10 text-muted-foreground hover:text-nexus-green transition-colors"
        title="Thumbs up"
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        onClick={() => sendFeedback("down")}
        disabled={loading}
        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-nexus-red transition-colors"
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
  color = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: "cyan" | "green" | "amber" | "red" | "default";
}) {
  const colorClass = {
    cyan: "text-nexus-cyan",
    green: "text-nexus-green",
    amber: "text-nexus-amber",
    red: "text-nexus-red",
    default: "text-foreground",
  }[color];
  return (
    <div className="rounded-lg bg-nexus-surface border border-nexus p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-mono font-bold ${colorClass}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60">{sub}</div>}
    </div>
  );
}

export default function AIQuality() {
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [circuits, setCircuits] = useState<CircuitBreakerStatus[]>([]);
  const [traces, setTraces] = useState<OpsTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<OpsTrace | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, cb, tr] = await Promise.all([
        apiFetch<OpsSummary>("/ai/ops/summary").catch(() => null),
        apiFetch<{ circuits: CircuitBreakerStatus[] }>("/ai/ops/circuit-breaker").catch(() => ({ circuits: [] })),
        apiFetch<{ traces: OpsTrace[] }>("/ai/ops/traces?limit=20").catch(() => ({ traces: [] })),
      ]);
      setSummary(sum);
      setCircuits(cb.circuits ?? []);
      setTraces(tr.traces ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const openCount = circuits.filter(c => c.state === "open").length;
  const halfOpenCount = circuits.filter(c => c.state === "half-open").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-nexus-cyan font-mono tracking-wide">
            AI QUALITY DASHBOARD
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control plane health · circuit breakers · trace feedback
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-nexus-surface border border-nexus text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-nexus-red flex items-center gap-2">
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
            value={summary.traces.evalPassRate != null ? `${(summary.traces.evalPassRate * 100).toFixed(1)}%` : "—"}
            sub={`avg confidence ${(summary.traces.avgConfidence * 100).toFixed(0)}%`}
            color={summary.traces.evalPassRate != null && summary.traces.evalPassRate >= 0.8 ? "green" : "amber"}
          />
        </div>
      )}

      <div className="rounded-lg bg-nexus-surface border border-nexus p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-nexus-cyan" />
          <h2 className="text-sm font-semibold text-nexus-cyan font-mono">CIRCUIT BREAKERS</h2>
          {openCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-nexus-red">
              {openCount} OPEN
            </span>
          )}
          {halfOpenCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-nexus-amber/40 bg-nexus-amber/10 text-nexus-amber">
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
            {circuits.map(cb => (
              <div
                key={cb.provider}
                className="rounded border border-nexus bg-nexus-bg px-3 py-2 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-mono font-semibold">{cb.provider}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {cb.consecutiveFailures} failures · {cb.totalTripped} trips
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StateChip state={cb.state} />
                  {cb.state === "closed" ? (
                    <CheckCircle className="w-3 h-3 text-nexus-green" />
                  ) : cb.state === "open" ? (
                    <XCircle className="w-3 h-3 text-nexus-red" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-nexus-amber" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {summary && (
        <div className="rounded-lg bg-nexus-surface border border-nexus p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-nexus-amber" />
            <h2 className="text-sm font-semibold text-nexus-amber font-mono">REVIEW QUEUE</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {[
              { label: "Total", value: summary.reviewQueue.total, color: "text-foreground" },
              { label: "Pending", value: summary.reviewQueue.pending, color: "text-nexus-amber" },
              { label: "In Review", value: summary.reviewQueue.inReview, color: "text-nexus-cyan" },
              { label: "Escalated", value: summary.reviewQueue.escalated, color: "text-nexus-red" },
              { label: "Critical", value: summary.reviewQueue.criticalPending, color: "text-nexus-red" },
              { label: "High", value: summary.reviewQueue.highPending, color: "text-nexus-amber" },
            ].map(item => (
              <div key={item.label} className="rounded border border-nexus bg-nexus-bg py-2 px-1">
                <div className={`text-xl font-mono font-bold ${item.color}`}>{item.value}</div>
                <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-nexus-surface border border-nexus p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-nexus-cyan" />
          <h2 className="text-sm font-semibold text-nexus-cyan font-mono">RECENT TRACES</h2>
          <span className="text-[10px] text-muted-foreground/60 ml-auto">thumbs-up/down sends feedback to review queue</span>
        </div>
        {loading && traces.length === 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Loader className="w-3 h-3 animate-spin" /> Loading traces…
          </div>
        ) : traces.length === 0 ? (
          <div className="text-xs text-muted-foreground/60">No traces yet — inference calls will appear here</div>
        ) : (
          <div className="space-y-1.5">
            {traces.map(t => (
              <div
                key={t.traceId}
                className="rounded border border-nexus bg-nexus-bg px-3 py-2 flex items-center gap-3 hover:border-nexus-cyan/30 transition-colors cursor-pointer"
                onClick={() => setSelectedTrace(selectedTrace?.traceId === t.traceId ? null : t)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-nexus-cyan truncate">{t.domain}</span>
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                    <span className="text-[10px] font-mono text-muted-foreground/70 truncate">{t.model}</span>
                    {t.requiresReview && (
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-nexus-amber/30 bg-nexus-amber/10 text-nexus-amber">
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
                    selectedTrace?.traceId === t.traceId ? "rotate-90" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        )}
        {selectedTrace && (
          <div className="rounded border border-nexus-cyan/20 bg-nexus-bg p-3 space-y-2">
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono">Trace detail</div>
            <div className="font-mono text-[10px] text-muted-foreground/80 break-all">
              id: {selectedTrace.traceId}
            </div>
            {selectedTrace.inputSummary && (
              <div className="text-xs text-muted-foreground/70">
                <span className="text-nexus-cyan/60">input: </span>{selectedTrace.inputSummary}
              </div>
            )}
            {selectedTrace.outputSummary && (
              <div className="text-xs text-muted-foreground/70">
                <span className="text-nexus-cyan/60">output: </span>{selectedTrace.outputSummary}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
