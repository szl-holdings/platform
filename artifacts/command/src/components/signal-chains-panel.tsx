import { useState, useEffect } from "react";
import { Zap, CheckCircle, AlertCircle, Clock, Play, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface SignalChainStep {
  id: string;
  domain: string;
  action: string;
  status: "pending" | "executed" | "skipped" | "failed";
  executedAt?: number;
  explainability: string;
  resultSummary?: string;
}

interface SignalChainExecution {
  executionId: string;
  chainId: string;
  triggeredAt: number;
  triggerReason: string;
  triggerValue: number;
  threshold: number;
  steps: SignalChainStep[];
  status: "running" | "completed" | "failed";
}

interface SignalChain {
  id: string;
  name: string;
  description: string;
  triggerDomain: string;
  triggerSignal: string;
  triggerThreshold: number;
  targetDomains: string[];
  severity: "critical" | "high" | "medium" | "low";
  enabled: boolean;
  executionCount: number;
  lastExecuted?: number;
  stepCount: number;
  lastExecution?: SignalChainExecution;
}

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "#0ea5e9",
  aegis: "#ef4444",
  terra: "#22c55e",
  prism: "#8b5cf6",
  lyte: "#f59e0b",
  "szl-holdings": "#8b7ac8",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#6b7280",
};

function timeAgo(ts?: number) {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  return `${Math.round(diff / 86400000)}d ago`;
}

interface SignalChainsPanelProps {
  apiBase?: string;
}

export function SignalChainsPanel({ apiBase = "" }: SignalChainsPanelProps) {
  const [chains, setChains] = useState<SignalChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchChains() {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/signal-chains`);
      const data = await res.json();
      if (data.success) setChains(data.chains);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function triggerChain(chainId: string) {
    setTriggering(chainId);
    try {
      const res = await fetch(`${apiBase}/api/signal-chains/${chainId}/trigger`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setChains((prev) =>
          prev.map((c) =>
            c.id === chainId
              ? { ...c, executionCount: c.executionCount + 1, lastExecuted: Date.now(), lastExecution: data.execution }
              : c
          )
        );
        setExpanded(chainId);
      }
    } catch {
      /* ignore */
    } finally {
      setTriggering(null);
    }
  }

  useEffect(() => {
    fetchChains();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: "#8b7ac8" }} />
          <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--color-fg-muted)" }}>
            Autonomous Signal Chains
          </h2>
          {chains.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "var(--color-surface-base)", color: "var(--color-fg-muted)" }}>
              {chains.filter((c) => c.enabled).length} active
            </span>
          )}
        </div>
        <button
          onClick={fetchChains}
          disabled={loading}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded"
          style={{ backgroundColor: "var(--color-surface-base)", border: "1px solid var(--color-surface-border)", color: "var(--color-fg-muted)" }}
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="text-xs text-center py-8" style={{ color: "var(--color-fg-muted)" }}>
          Loading signal chains…
        </div>
      )}

      <div className="flex flex-col gap-3">
        {chains.map((chain) => {
          const severityColor = SEVERITY_COLORS[chain.severity] ?? "#6b7280";
          const domainColor = DOMAIN_COLORS[chain.triggerDomain] ?? "#6b7280";
          const isExpanded = expanded === chain.id;

          return (
            <div
              key={chain.id}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-surface-border)", borderLeftWidth: "3px", borderLeftColor: severityColor }}
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ color: domainColor, backgroundColor: `color-mix(in srgb, ${domainColor} 12%, transparent)` }}
                      >
                        {chain.triggerDomain}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--color-fg-muted)" }}>→</span>
                      {chain.targetDomains.map((td) => (
                        <span
                          key={td}
                          className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ color: DOMAIN_COLORS[td] ?? "#6b7280", backgroundColor: `color-mix(in srgb, ${DOMAIN_COLORS[td] ?? "#6b7280"} 12%, transparent)` }}
                        >
                          {td}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--color-fg-primary)" }}>{chain.name}</h3>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>{chain.description}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: severityColor, backgroundColor: `color-mix(in srgb, ${severityColor} 12%, transparent)` }}
                      >
                        {chain.severity}
                      </span>
                      <div
                        className="flex items-center gap-1 text-[10px]"
                        style={{ color: chain.enabled ? "#22c55e" : "var(--color-fg-muted)" }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${chain.enabled ? "animate-pulse" : ""}`} style={{ backgroundColor: "currentColor" }} />
                        {chain.enabled ? "Active" : "Paused"}
                      </div>
                    </div>
                    <button
                      onClick={() => triggerChain(chain.id)}
                      disabled={!!triggering || !chain.enabled}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
                      style={{ backgroundColor: "#8b7ac8", color: "#fff" }}
                    >
                      {triggering === chain.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Running…
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Trigger
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-[10px]" style={{ color: "var(--color-fg-muted)" }}>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{chain.stepCount} steps · {chain.executionCount} executions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Last: {timeAgo(chain.lastExecuted)}</span>
                  </div>
                  {chain.lastExecution && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : chain.id)}
                      className="flex items-center gap-1 ml-auto hover:opacity-80"
                      style={{ color: "#8b7ac8" }}
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? "Hide" : "View"} last execution
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && chain.lastExecution && (
                <div
                  className="px-4 pb-4 pt-0"
                  style={{ borderTop: "1px solid var(--color-surface-border)" }}
                >
                  <div className="pt-3 flex flex-col gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-fg-muted)" }}>
                      Execution Audit Trail · {chain.lastExecution.executionId}
                    </div>
                    <div className="text-[11px] mb-3 p-2 rounded" style={{ backgroundColor: "var(--color-surface-base)", color: "var(--color-fg-secondary)" }}>
                      <span className="font-bold">Trigger: </span>{chain.lastExecution.triggerReason}
                      <span className="ml-2" style={{ color: "var(--color-fg-muted)" }}>
                        (value: {chain.lastExecution.triggerValue} vs threshold: {chain.lastExecution.threshold})
                      </span>
                    </div>
                    {chain.lastExecution.steps.map((step, i) => (
                      <div
                        key={step.id}
                        className="flex items-start gap-3 py-2"
                        style={{ borderTop: i > 0 ? "1px solid var(--color-surface-border)" : undefined }}
                      >
                        <div className="flex items-center gap-2 shrink-0 mt-0.5">
                          {step.status === "executed" ? (
                            <CheckCircle className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                          ) : step.status === "failed" ? (
                            <AlertCircle className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                          ) : (
                            <Clock className="w-3.5 h-3.5" style={{ color: "var(--color-fg-muted)" }} />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{ color: DOMAIN_COLORS[step.domain] ?? "#6b7280", backgroundColor: `color-mix(in srgb, ${DOMAIN_COLORS[step.domain] ?? "#6b7280"} 12%, transparent)` }}
                            >
                              {step.domain}
                            </span>
                            <span className="text-[11px] font-medium" style={{ color: "var(--color-fg-primary)" }}>{step.action}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-fg-muted)" }}>{step.explainability}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
