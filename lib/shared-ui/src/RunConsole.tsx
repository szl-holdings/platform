/**
 * RunConsole — full run history with status, tools, latency, eval score, replay.
 * Evals strip shows pass-rate trend from eval-forge per skill + variant.
 */
import * as React from "react";
import type { Run, RunStatus, RunEffort } from "./os-layer";
import { cn } from "./utils";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BG = { surface: "#0c1018", elevated: "#10141e", card: "#0f1420" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.16)" };

const STATUS_STYLE: Record<RunStatus, { color: string; bg: string; label: string }> = {
  running:   { color: "#4a90b8", bg: "rgba(74,144,184,0.12)", label: "Running" },
  completed: { color: "#6b8f71", bg: "rgba(107,143,113,0.12)", label: "Completed" },
  failed:    { color: "#c45a4a", bg: "rgba(196,90,74,0.12)", label: "Failed" },
  cancelled: { color: "#7c85a0", bg: "rgba(124,133,160,0.12)", label: "Cancelled" },
  pending:   { color: "#c8953c", bg: "rgba(200,149,60,0.12)", label: "Pending" },
};

const EFFORT_STYLE: Record<RunEffort, { color: string; label: string }> = {
  low:   { color: "#6b8f71", label: "Low" },
  medium:{ color: "#c8953c", label: "Medium" },
  high:  { color: "#c45a4a", label: "High" },
  deep:  { color: "#8b7ac8", label: "Deep" },
};

function msLabel(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Evals Strip ─────────────────────────────────────────────────────────────
export interface EvalResult {
  skillName: string;
  passRate: number;
  total: number;
  passed: number;
  regressions?: number;
  trend?: "up" | "down" | "stable";
  lastRunAt: string;
}

export interface EvalsStripProps {
  results: EvalResult[];
  variant?: string;
  className?: string;
}

export function EvalsStrip({ results, variant, className }: EvalsStripProps) {
  if (!results.length) return null;
  return (
    <div className={cn("px-6 py-3", className)} style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
      <div className="text-[9px] uppercase tracking-widest font-mono mb-2" style={{ color: TEXT.muted }}>
        Eval Suite{variant ? ` — ${variant}` : ""}
      </div>
      <div className="flex gap-3 flex-wrap">
        {results.map(r => {
          const pct = Math.round(r.passRate * 100);
          const color = pct >= 90 ? "#6b8f71" : pct >= 70 ? "#c8953c" : "#c45a4a";
          const trendIcon = r.trend === "up" ? "↑" : r.trend === "down" ? "↓" : "→";
          return (
            <div key={r.skillName} className="flex flex-col gap-1 min-w-[80px]">
              <div className="text-[9px] font-mono leading-tight" style={{ color: TEXT.tertiary }}>{r.skillName}</div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="text-[9px] font-mono" style={{ color }}>
                  {pct}% {r.trend && <span>{trendIcon}</span>}
                </span>
              </div>
              {r.regressions != null && r.regressions > 0 && (
                <div className="text-[8px] font-mono" style={{ color: "#c45a4a" }}>
                  {r.regressions} regression{r.regressions !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Run Detail Panel ─────────────────────────────────────────────────────────
export interface RunDetailProps {
  run: Run;
  onClose: () => void;
  onReplay?: (runId: string) => void | Promise<void>;
}

export function RunDetailPanel({ run, onClose, onReplay }: RunDetailProps) {
  const [replaying, setReplaying] = React.useState(false);
  const statusStyle = STATUS_STYLE[run.status];
  const effortStyle = EFFORT_STYLE[run.effort];

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleReplay() {
    if (!onReplay) return;
    setReplaying(true);
    try { await onReplay(run.id); } finally { setReplaying(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-sm" onClick={onClose}
        style={{ background: "rgba(12,16,24,0.75)" }} aria-hidden="true" />
      <aside className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg flex flex-col overflow-y-auto"
        style={{ background: BG.elevated, borderLeft: `1px solid ${BORDER.muted}` }}
        role="dialog" aria-label="Run detail" aria-modal="true">
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
          <div>
            <div className="text-sm font-semibold" style={{ color: TEXT.primary }}>{run.label}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{ background: statusStyle.bg, color: statusStyle.color }}>
                {statusStyle.label}
              </span>
              <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{run.variant}</span>
              {run.skillName && <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>{run.skillName}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/5" style={{ color: TEXT.tertiary }}>✕</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-px" style={{ background: BORDER.subtle, borderBottom: `1px solid ${BORDER.subtle}` }}>
          {[
            { label: "Latency", value: msLabel(run.latencyMs) },
            { label: "Effort", value: effortStyle.label, color: effortStyle.color },
            { label: "Eval score", value: run.evalScore != null ? `${Math.round(run.evalScore * 100)}%` : "—" },
          ].map(stat => (
            <div key={stat.label} className="px-4 py-3" style={{ background: BG.card }}>
              <div className="text-[9px] uppercase tracking-wider font-mono mb-1" style={{ color: TEXT.muted }}>{stat.label}</div>
              <div className="text-[13px] font-semibold font-mono" style={{ color: stat.color ?? TEXT.primary }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Token usage */}
        {run.tokenUsage && (
          <div className="px-5 py-3 flex items-center gap-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: TEXT.muted }}>Tokens</span>
            <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>
              in {run.tokenUsage.input.toLocaleString()} · out {run.tokenUsage.output.toLocaleString()} · total {run.tokenUsage.total.toLocaleString()}
            </span>
          </div>
        )}

        {/* Human override */}
        {run.humanOverride && (
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[9px] uppercase tracking-widest font-mono mb-1.5" style={{ color: TEXT.muted }}>Human override</div>
            <div className="text-[11px]" style={{ color: TEXT.secondary }}>
              {run.humanOverride} {run.humanOverrideNote && `— "${run.humanOverrideNote}"`}
            </div>
          </div>
        )}

        {/* Tool calls */}
        <div className="px-5 py-4 flex-1">
          <div className="text-[9px] uppercase tracking-widest font-mono mb-3" style={{ color: TEXT.muted }}>
            Tools called ({run.toolCalls.length})
          </div>
          <div className="space-y-2">
            {run.toolCalls.map((tc, i) => (
              <div key={i} className="rounded-lg px-3 py-2 flex items-center gap-3"
                style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}>
                <span className="text-[10px] font-mono font-medium" style={{ color: tc.success ? "#6b8f71" : "#c45a4a" }}>
                  {tc.success ? "✓" : "✕"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium font-mono" style={{ color: TEXT.primary }}>{tc.toolName}</div>
                  {tc.inputSummary && (
                    <div className="text-[10px] truncate" style={{ color: TEXT.tertiary }}>{tc.inputSummary}</div>
                  )}
                  {tc.outputSummary && (
                    <div className="text-[10px] truncate mt-0.5" style={{ color: TEXT.secondary }}>{tc.outputSummary}</div>
                  )}
                </div>
                <span className="text-[9px] font-mono shrink-0" style={{ color: TEXT.muted }}>{msLabel(tc.latencyMs)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Replay */}
        {run.replayable && onReplay && (
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
            <button
              type="button"
              onClick={handleReplay}
              disabled={replaying}
              className="w-full rounded-lg py-2.5 text-[12px] font-medium transition-opacity disabled:opacity-50"
              style={{ background: "rgba(74,144,184,0.10)", color: "#4a90b8", border: "1px solid rgba(74,144,184,0.22)" }}
            >
              {replaying ? "Replaying…" : "Replay from stored plan"}
            </button>
            <p className="text-[10px] text-center mt-2" style={{ color: TEXT.muted }}>
              Runs in dry-run mode. Results are audited and logged.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Run Row ──────────────────────────────────────────────────────────────────
function RunRow({ run, onClick }: { run: Run; onClick: () => void }) {
  const statusStyle = STATUS_STYLE[run.status];
  const effortStyle = EFFORT_STYLE[run.effort];
  const overrideColor = run.humanOverride === "approved" ? "#6b8f71" : run.humanOverride === "rejected" ? "#c45a4a" : "#c8953c";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-4 transition-colors hover:bg-white/[0.02]"
      style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}
    >
      {/* Status dot */}
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusStyle.color }} />

      {/* Label + variant */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium leading-snug truncate" style={{ color: TEXT.primary }}>{run.label}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>{run.variant}</span>
          {run.skillName && <span className="text-[9px] font-mono" style={{ color: TEXT.tertiary }}>{run.skillName}</span>}
          <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>{timeAgo(run.startedAt)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 shrink-0 text-right">
        <div>
          <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>Effort</div>
          <div className="text-[10px] font-mono" style={{ color: effortStyle.color }}>{effortStyle.label}</div>
        </div>
        <div>
          <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>Latency</div>
          <div className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>{msLabel(run.latencyMs)}</div>
        </div>
        {run.evalScore != null && (
          <div>
            <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>Eval</div>
            <div className="text-[10px] font-mono" style={{ color: run.evalScore >= 0.8 ? "#6b8f71" : run.evalScore >= 0.6 ? "#c8953c" : "#c45a4a" }}>
              {Math.round(run.evalScore * 100)}%
            </div>
          </div>
        )}
        {run.humanOverride && (
          <div>
            <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>Override</div>
            <div className="text-[10px] font-mono capitalize" style={{ color: overrideColor }}>{run.humanOverride}</div>
          </div>
        )}
        <span className="text-[10px] font-mono rounded-full px-2 py-0.5"
          style={{ background: statusStyle.bg, color: statusStyle.color }}>
          {statusStyle.label}
        </span>
      </div>
    </button>
  );
}

// ─── Run Console Page ─────────────────────────────────────────────────────────
export interface RunConsoleProps {
  variant: string;
  runs: Run[];
  evalResults?: EvalResult[];
  loading?: boolean;
  error?: string | null;
  onReplay?: (runId: string) => void | Promise<void>;
  onRefresh?: () => void;
  accentColor?: string;
  className?: string;
}

export function RunConsole({
  variant,
  runs,
  evalResults = [],
  loading = false,
  error,
  onReplay,
  onRefresh,
  accentColor,
  className,
}: RunConsoleProps) {
  const [selectedRun, setSelectedRun] = React.useState<Run | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<RunStatus | "all">("all");

  const filtered = statusFilter === "all" ? runs : runs.filter(r => r.status === statusFilter);

  return (
    <div className={cn("min-h-full flex flex-col", className)} style={{ background: BG.surface, color: TEXT.primary }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight" style={{ color: TEXT.primary }}>Run Console</h1>
            <p className="text-[12px] mt-0.5" style={{ color: TEXT.tertiary }}>
              {variant} · {runs.length} run{runs.length !== 1 ? "s" : ""} · every run is replayable
            </p>
          </div>
          {onRefresh && (
            <button type="button" onClick={onRefresh}
              className="rounded px-3 py-1.5 text-[11px] hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.04)", color: TEXT.tertiary, border: `1px solid ${BORDER.subtle}` }}>
              Refresh
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-1 mt-4">
          {(["all", "running", "completed", "failed", "cancelled", "pending"] as const).map(f => {
            const count = f === "all" ? runs.length : runs.filter(r => r.status === f).length;
            return (
              <button key={f} type="button" onClick={() => setStatusFilter(f)}
                className="rounded px-3 py-1 text-[11px] font-medium capitalize transition-colors"
                style={{
                  background: statusFilter === f ? (accentColor ? `${accentColor}18` : "rgba(255,255,255,0.07)") : "transparent",
                  color: statusFilter === f ? (accentColor ?? TEXT.primary) : TEXT.tertiary,
                  border: `1px solid ${statusFilter === f ? (accentColor ? `${accentColor}35` : BORDER.muted) : "transparent"}`,
                }}>
                {f} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Evals strip */}
      {evalResults.length > 0 && <EvalsStrip results={evalResults} variant={variant} />}

      {/* Run list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: BG.card }} />)}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl p-4 text-[12px]"
            style={{ background: "rgba(196,90,74,0.08)", color: "#c45a4a", border: "1px solid rgba(196,90,74,0.18)" }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-2xl mb-3" style={{ color: TEXT.muted }}>⊙</div>
            <div className="text-sm font-medium mb-1" style={{ color: TEXT.secondary }}>No runs</div>
            <div className="text-[12px]" style={{ color: TEXT.tertiary }}>
              Runs appear here when the decision engine evaluates signals and executes workflows.
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(run => (
              <RunRow key={run.id} run={run} onClick={() => setSelectedRun(run)} />
            ))}
          </div>
        )}
      </div>

      {/* Run detail panel */}
      {selectedRun && (
        <RunDetailPanel
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
          onReplay={onReplay}
        />
      )}
    </div>
  );
}
