import { useState } from "react";
import { Shield, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { evalRuns, type EvalRun, type EvalRunStatus } from "@/data/seed";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAutoEvalSuites } from "@/data/api";

const STATUS_CONFIG: Record<EvalRunStatus, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  passed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/20", label: "PASSED" },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/25", label: "FAILED" },
  partial: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/20", label: "PARTIAL" },
  running: { icon: <Clock className="w-3.5 h-3.5 animate-pulse" />, color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/20", label: "RUNNING" },
  queued: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-sky-400", bg: "bg-sky-500/8", border: "border-sky-500/20", label: "QUEUED" },
};

const METRIC_LABELS: Record<string, string> = {
  accuracy: "Accuracy",
  evidenceCoverage: "Evidence Coverage",
  policyCompliance: "Policy Compliance",
  recommendationQuality: "Rec. Quality",
  latencyMs: "Latency",
  tokenEfficiency: "Token Efficiency",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "text-emerald-400" : score >= 75 ? "text-amber-400" : score >= 60 ? "text-orange-400" : "text-red-400";
  return <span className={`text-xl font-mono font-bold ${color}`}>{score}</span>;
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = label === "latencyMs" ? Math.max(0, 100 - value / 40) : Math.round(value * 100);
  const color = pct >= 90 ? "#34d399" : pct >= 75 ? "#f59e0b" : pct >= 60 ? "#fb923c" : "#f87171";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-amber-400/50 w-28 shrink-0">{METRIC_LABELS[label] ?? label}</span>
      <div className="flex-1 h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono text-amber-300/70 w-10 text-right shrink-0">
        {label === "latencyMs" ? `${value}ms` : `${pct}%`}
      </span>
    </div>
  );
}

function EvalCard({ run }: { run: EvalRun }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[run.status];

  const radarData = [
    { metric: "Accuracy", value: Math.round(run.metrics.accuracy * 100) },
    { metric: "Evidence", value: Math.round(run.metrics.evidenceCoverage * 100) },
    { metric: "Policy", value: Math.round(run.metrics.policyCompliance * 100) },
    { metric: "Rec. Quality", value: Math.round(run.metrics.recommendationQuality * 100) },
    { metric: "Token Eff.", value: Math.round(run.metrics.tokenEfficiency * 100) },
  ];

  const passRate = Math.round((run.passed / run.testCases) * 100);

  return (
    <div className={`cockpit-panel border ${cfg.border}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors" onClick={() => setExpanded(v => !v)}>
        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}>
          <span className={cfg.color}>{cfg.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-100">{run.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-amber-400/40">{run.modelId}</span>
                <span className="text-[10px] font-mono text-amber-400/30">·</span>
                <span className="text-[10px] font-mono text-amber-400/40">{run.duration}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <ScoreBadge score={run.score} />
                <p className="text-[9px] font-mono text-amber-400/40">/100</p>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />}
            </div>
          </div>
          {/* Test summary bar */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 h-1.5 bg-amber-500/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400/60" style={{ width: `${(run.passed / run.testCases) * 100}%` }} />
              <div className="h-full bg-red-400/60" style={{ width: `${(run.failed / run.testCases) * 100}%` }} />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 shrink-0">{run.passed}p</span>
            <span className="text-[10px] font-mono text-red-400 shrink-0">{run.failed}f</span>
            <span className="text-[10px] font-mono text-amber-400/40 shrink-0">/ {run.testCases}</span>
            <span className="text-[10px] font-mono text-amber-400/40 shrink-0">({passRate}%)</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-amber-500/10 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Metric bars */}
            <div className="space-y-2">
              <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-2">METRICS</p>
              {Object.entries(run.metrics).map(([k, v]) => (
                <MetricBar key={k} label={k} value={typeof v === "number" ? v : 0} />
              ))}
            </div>
            {/* Radar chart */}
            <div>
              <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-2">QUALITY PROFILE</p>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#78350f" strokeOpacity={0.3} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "#92400e" }} />
                  <Radar dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} />
                  <Tooltip contentStyle={{ background: "#0c1117", border: "1px solid #78350f", borderRadius: 6, fontSize: 10 }} formatter={(v: number) => [`${v}%`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {run.notes && (
            <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
              <p className="text-[9px] font-mono text-amber-400/40 mb-1">NOTES & FAILURE ANALYSIS</p>
              <p className="text-xs text-amber-100/70 leading-relaxed">{run.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-400/30 font-mono">Run: {new Date(run.runAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            <span className="proof-badge">
              <Shield className="w-2 h-2" />
              {run.proofRef}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function AutoSuitesPanel() {
  // Renders auto-generated tool & prompt eval suites built via
  // createToolEvalSuite / createPromptEvalSuite from agents-evals.
  const { data, isLoading, isError } = useAutoEvalSuites();
  const tools = data?.toolSuites ?? [];
  const prompts = data?.promptSuites ?? [];
  return (
    <div className="cockpit-panel p-4 space-y-3 border border-amber-500/15">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-widest">
          Auto Suites <span className="text-amber-400/30">· agents-evals</span>
        </p>
        <span className="text-[9px] font-mono text-amber-400/30">
          {data ? `${data.totals.tools} tools · ${data.totals.prompts} prompts · ${data.totals.cases} cases` : ""}
        </span>
      </div>
      {isLoading && <p className="text-[10px] text-amber-400/40">Building suites…</p>}
      {isError && <p className="text-[10px] text-red-400/70">Failed to load auto suites.</p>}
      {!isLoading && !isError && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-2">Tool Reliability</p>
            <ul className="space-y-1">
              {tools.map((s) => (
                <li key={s.suiteId} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-200/70 truncate">{s.name}</span>
                  <span className="text-amber-400/40 shrink-0 ml-2">{s.cases.length} cases · v{s.version}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-2">Prompt Eval</p>
            <ul className="space-y-1">
              {prompts.map((s) => (
                <li key={s.suiteId} className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-200/70 truncate">{s.name}</span>
                  <span className="text-amber-400/40 shrink-0 ml-2">{s.cases.length} cases · v{s.version}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvalStudioPage() {
  const passing = evalRuns.filter(r => r.status === "passed");
  const partial = evalRuns.filter(r => r.status === "partial");
  const failing = evalRuns.filter(r => r.status === "failed");

  const avgScore = Math.round(evalRuns.reduce((sum, r) => sum + r.score, 0) / evalRuns.length);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Eval Studio</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">Agent and model evaluation results — {evalRuns.length} eval runs</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="cockpit-panel p-4">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Avg Score</p>
          <p className={`text-xl font-mono font-bold ${avgScore >= 85 ? "text-emerald-400" : avgScore >= 70 ? "text-amber-400" : "text-red-400"}`}>{avgScore}/100</p>
        </div>
        <div className="cockpit-panel p-4 border border-emerald-500/15">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Passing</p>
          <p className="text-xl font-mono font-bold text-emerald-400">{passing.length}</p>
        </div>
        <div className="cockpit-panel p-4 border border-orange-500/15">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Partial</p>
          <p className="text-xl font-mono font-bold text-orange-400">{partial.length}</p>
        </div>
        <div className="cockpit-panel p-4 border border-red-500/15">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Failing</p>
          <p className="text-xl font-mono font-bold text-red-400">{failing.length}</p>
        </div>
      </div>

      <AutoSuitesPanel />

      {failing.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-red-400/40 uppercase tracking-widest">Failing</p>
          {failing.map(r => <EvalCard key={r.id} run={r} />)}
        </div>
      )}

      {partial.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-orange-400/30 uppercase tracking-widest">Partial</p>
          {partial.map(r => <EvalCard key={r.id} run={r} />)}
        </div>
      )}

      {passing.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-emerald-400/20 uppercase tracking-widest">Passing</p>
          {passing.map(r => <EvalCard key={r.id} run={r} />)}
        </div>
      )}
    </div>
  );
}
