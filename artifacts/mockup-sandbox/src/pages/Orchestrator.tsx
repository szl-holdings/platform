import { useState, useEffect, useRef } from "react";
import { nexusApi } from "../lib/api";
import type { OrchestrationPlan, OrchestrationStep } from "../lib/types";
import {
  Workflow,
  Send,
  Loader,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Play,
} from "lucide-react";

const EXAMPLE_INTENTS = [
  {
    label: "Risk Brief",
    intent:
      "Summarize today's threat risk across Aegis and Vessels, then draft an executive brief in Pulse format.",
  },
  {
    label: "Portfolio Snapshot",
    intent:
      "Pull the latest KPIs from SZL Holdings, Terra, and Vessels, and compile a cross-portfolio snapshot.",
  },
  {
    label: "Compliance Check",
    intent:
      "Cross-reference Prism Counsel open matters against Aegis threat intel and flag any intersecting risk vectors.",
  },
];

const APP_COLORS: Record<string, string> = {
  aegis: "#ff4455",
  vessels: "#00d4ff",
  terra: "#00ff88",
  pulse: "#ffb700",
  command: "#a855f7",
  "szl-holdings": "#22d3ee",
  "carlota-jo": "#f472b6",
  "prism-counsel": "#818cf8",
  lyte: "#fb923c",
  imperium: "#34d399",
};

function StepCard({ step }: { step: OrchestrationStep }) {
  const color = APP_COLORS[step.appSlug] ?? "#8896aa";
  return (
    <div className={`rounded-lg border p-3 ${
      step.status === "running"
        ? "border-[#00d4ff]/40 bg-[#00d4ff]/05"
        : step.status === "done"
        ? "border-[#00ff88]/30 bg-[#00ff88]/04"
        : step.status === "error"
        ? "border-[#ff4455]/30"
        : "border-nexus"
    } bg-nexus-surface`}>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {step.appSlug.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold" style={{ color }}>{step.app}</div>
          <div className="text-[10px] text-muted-foreground/70 font-mono truncate">{step.action}</div>
        </div>
        <div className="shrink-0">
          {step.status === "running" ? (
            <Loader className="w-3.5 h-3.5 animate-spin text-nexus-cyan" />
          ) : step.status === "done" ? (
            <CheckCircle className="w-3.5 h-3.5 text-nexus-green" />
          ) : step.status === "error" ? (
            <XCircle className="w-3.5 h-3.5 text-nexus-red" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
        </div>
      </div>
      <div className="text-[9px] font-mono text-muted-foreground/40 mb-1">{step.endpoint}</div>
      {step.output && (
        <div className="text-[10px] text-muted-foreground bg-nexus-bg rounded px-2 py-1.5 leading-relaxed mt-1">
          {step.output}
        </div>
      )}
      {step.durationMs !== undefined && step.status === "done" && (
        <div className="text-[9px] font-mono text-muted-foreground/40 mt-1">{step.durationMs}ms</div>
      )}
    </div>
  );
}

export default function Orchestrator() {
  const [intent, setIntent] = useState("");
  const [plan, setPlan] = useState<OrchestrationPlan | null>(null);
  const [history, setHistory] = useState<OrchestrationPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    nexusApi.listOrchestrations().then(setHistory).catch(() => {});
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const updated = await nexusApi.getOrchestration(id);
        setPlan(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setLoading(false);
          nexusApi.listOrchestrations().then(setHistory).catch(() => {});
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setLoading(false);
      }
    }, 1200);
  }

  async function handleRun(i?: string) {
    const finalIntent = i ?? intent;
    if (!finalIntent.trim()) return;
    setError(null);
    setLoading(true);
    setPlan(null);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const { id } = await nexusApi.orchestrate(finalIntent.trim());
      const initial = await nexusApi.getOrchestration(id);
      setPlan(initial);
      startPolling(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Orchestration failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-nexus-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Workflow className="w-5 h-5 text-[#ffb700]" />
          <div>
            <h1 className="text-lg font-semibold">Cross-App Orchestrator</h1>
            <p className="text-xs text-muted-foreground">
              Agent of agents · Routes to 10 SZL artifacts · Stitches results
            </p>
          </div>
        </div>

        <div className="bg-nexus-surface border border-[#ffb700]/20 rounded-xl p-4 mb-6">
          <div className="flex gap-3 mb-3">
            <textarea
              className="flex-1 bg-nexus-bg border border-nexus rounded-lg px-3 py-2.5 text-sm font-mono resize-none focus:outline-none focus:border-[#ffb700]/50 text-foreground placeholder:text-muted-foreground/40"
              rows={2}
              placeholder="Describe what you want across the SZL portfolio…"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun();
              }}
            />
            <button
              onClick={() => handleRun()}
              disabled={loading || !intent.trim()}
              className="px-4 py-2 rounded-lg bg-[#ffb700]/10 border border-[#ffb700]/30 text-[#ffb700] text-sm font-medium hover:bg-[#ffb700]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] text-muted-foreground/50 self-center">Try:</span>
            {EXAMPLE_INTENTS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => {
                  setIntent(ex.intent);
                  handleRun(ex.intent);
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-nexus-bg border border-nexus text-muted-foreground/60 hover:text-muted-foreground hover:border-[#ffb700]/20 transition-colors flex items-center gap-1"
              >
                <Zap className="w-2.5 h-2.5 text-[#ffb700]/60" />
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-[#ff4455]/10 border border-[#ff4455]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-nexus-red shrink-0" />
            <p className="text-xs text-nexus-red">{error}</p>
          </div>
        )}

        {plan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Orchestration Plan</h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  plan.status === "completed"
                    ? "bg-[#00ff88]/10 text-nexus-green"
                    : plan.status === "running" || plan.status === "planning"
                    ? "bg-[#00d4ff]/10 text-nexus-cyan"
                    : plan.status === "failed"
                    ? "bg-[#ff4455]/10 text-nexus-red"
                    : "bg-nexus-surface text-muted-foreground"
                }`}
              >
                {plan.status.toUpperCase()}
              </span>
            </div>

            <div className="bg-nexus-surface border border-[#ffb700]/20 rounded-lg px-4 py-2 text-sm font-mono text-[#ffb700]">
              {plan.intent}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {plan.steps.map((step) => (
                <StepCard key={step.id} step={step} />
              ))}
            </div>

            {plan.stitchedOutput && (
              <div className="bg-nexus-surface border border-[#00ff88]/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-nexus-green" />
                  <h3 className="text-sm font-semibold text-nexus-green">Stitched Output</h3>
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {plan.stitchedOutput}
                </div>
              </div>
            )}
          </div>
        )}

        {!plan && history.length > 0 && (
          <div>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Recent Orchestrations
            </h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((h) => (
                <button
                  key={h.id}
                  className="w-full text-left bg-nexus-surface border border-nexus rounded-lg px-4 py-3 hover:border-[#ffb700]/20 transition-colors"
                  onClick={async () => {
                    const p = await nexusApi.getOrchestration(h.id);
                    setPlan(p);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground/50">{h.id}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        h.status === "completed" ? "text-nexus-green" : h.status === "failed" ? "text-nexus-red" : "text-nexus-cyan"
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{h.intent}</p>
                  <div className="text-[10px] font-mono text-muted-foreground/40 mt-1">
                    {h.steps.length} steps
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!plan && history.length === 0 && !loading && (
          <div className="text-center py-16 text-muted-foreground/40">
            <Workflow className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No orchestrations yet.</p>
            <p className="text-xs mt-1">Try one of the example intents above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
