import { useState, useEffect } from "react";
import { Zap, CheckCircle, Clock, AlertTriangle, Play, Pause, ChevronRight, Shield, RefreshCw, Activity, RotateCcw } from "lucide-react";

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

type RemediationStatus = "executing" | "pending_approval" | "completed" | "failed" | "queued";
type PatternType = "restart" | "scale" | "failover" | "clear_queue" | "rollback";

interface RemediationStep {
  id: string;
  action: string;
  status: "done" | "running" | "pending" | "failed";
  durationMs?: number;
}

interface RemediationRun {
  id: string;
  patternId: string;
  patternName: string;
  patternType: PatternType;
  triggerSignal: string;
  service: string;
  detectedAt: number;
  startedAt?: number;
  completedAt?: number;
  status: RemediationStatus;
  steps: RemediationStep[];
  mttrSavedMins: number;
  approver?: string;
  auditRef: string;
}

interface FailurePattern {
  id: string;
  name: string;
  type: PatternType;
  matchCount: number;
  successRate: number;
  avgMttrSavedMins: number;
  enabled: boolean;
  trigger: string;
  runbook: string;
}

const TYPE_COLOR: Record<PatternType, string> = {
  restart: "#3b82f6",
  scale: "#10b981",
  failover: "#f97316",
  clear_queue: "#8b5cf6",
  rollback: "#ef4444",
};

const STATUS_COLOR: Record<RemediationStatus, string> = {
  executing: "#f59e0b",
  pending_approval: "#8b5cf6",
  completed: "#10b981",
  failed: "#ef4444",
  queued: "#6b7280",
};

const PATTERNS: FailurePattern[] = [
  { id: "p1", name: "Service Restart on OOM", type: "restart", matchCount: 142, successRate: 97.2, avgMttrSavedMins: 34, enabled: true, trigger: "OOM kill detected on pod", runbook: "RUNBOOK-001: Drain → Restart → Health-check → Reroute" },
  { id: "p2", name: "Auto-Scale on CPU Saturation", type: "scale", matchCount: 89, successRate: 94.4, avgMttrSavedMins: 18, enabled: true, trigger: "CPU > 85% for 5 consecutive minutes", runbook: "RUNBOOK-002: Scale +2 replicas → Verify HPA → Alert" },
  { id: "p3", name: "DB Failover on Primary Failure", type: "failover", matchCount: 12, successRate: 100, avgMttrSavedMins: 87, enabled: true, trigger: "Primary DB health check failures > 3", runbook: "RUNBOOK-003: Promote replica → Update DNS → Validate" },
  { id: "p4", name: "Queue Drain on Backlog Overflow", type: "clear_queue", matchCount: 204, successRate: 88.7, avgMttrSavedMins: 12, enabled: true, trigger: "Queue depth > 50k messages for 3 min", runbook: "RUNBOOK-004: Pause producers → Drain → Flush DLQ → Resume" },
  { id: "p5", name: "Canary Rollback on Error Spike", type: "rollback", matchCount: 28, successRate: 92.9, avgMttrSavedMins: 55, enabled: false, trigger: "Error rate delta > 5% vs baseline on new deploy", runbook: "RUNBOOK-005: Halt canary → Shift traffic → Rollback image" },
];

const SEED_RUNS: RemediationRun[] = [
  {
    id: "REM-4821",
    patternId: "p1",
    patternName: "Service Restart on OOM",
    patternType: "restart",
    triggerSignal: "api-gateway pod OOM kill — 3 restarts in 10m",
    service: "api-gateway",
    detectedAt: Date.now() - 4 * 60000,
    startedAt: Date.now() - 3.5 * 60000,
    status: "executing",
    steps: [
      { id: "s1", action: "Drain existing connections", status: "done", durationMs: 1240 },
      { id: "s2", action: "Signal graceful shutdown", status: "done", durationMs: 890 },
      { id: "s3", action: "Restart pod & await ready state", status: "running" },
      { id: "s4", action: "Run health check suite", status: "pending" },
      { id: "s5", action: "Re-route traffic and verify", status: "pending" },
    ],
    mttrSavedMins: 34,
    auditRef: "AUD-2024-4821",
  },
  {
    id: "REM-4819",
    patternId: "p4",
    patternName: "Queue Drain on Backlog Overflow",
    patternType: "clear_queue",
    triggerSignal: "ml-inference queue depth 78k messages",
    service: "ml-inference",
    detectedAt: Date.now() - 22 * 60000,
    startedAt: Date.now() - 21 * 60000,
    completedAt: Date.now() - 14 * 60000,
    status: "completed",
    steps: [
      { id: "s1", action: "Pause message producers", status: "done", durationMs: 320 },
      { id: "s2", action: "Drain backlog queue", status: "done", durationMs: 4100 },
      { id: "s3", action: "Flush dead letter queue", status: "done", durationMs: 880 },
      { id: "s4", action: "Resume producers & validate", status: "done", durationMs: 540 },
    ],
    mttrSavedMins: 12,
    auditRef: "AUD-2024-4819",
  },
  {
    id: "REM-4817",
    patternId: "p2",
    patternName: "Auto-Scale on CPU Saturation",
    patternType: "scale",
    triggerSignal: "auth-service CPU at 91% for 6 consecutive minutes",
    service: "auth-service",
    detectedAt: Date.now() - 45 * 60000,
    status: "pending_approval",
    steps: [
      { id: "s1", action: "Scale +2 replicas via HPA", status: "pending" },
      { id: "s2", action: "Verify pod readiness", status: "pending" },
      { id: "s3", action: "Alert on-call engineer", status: "pending" },
    ],
    mttrSavedMins: 18,
    approver: "ops-manager",
    auditRef: "AUD-2024-4817",
  },
  {
    id: "REM-4815",
    patternId: "p1",
    patternName: "Service Restart on OOM",
    patternType: "restart",
    triggerSignal: "data-pipeline OOM kill",
    service: "data-pipeline",
    detectedAt: Date.now() - 3 * 3600000,
    startedAt: Date.now() - 3 * 3600000 + 30000,
    completedAt: Date.now() - 3 * 3600000 + 95000,
    status: "completed",
    steps: [
      { id: "s1", action: "Drain existing connections", status: "done", durationMs: 980 },
      { id: "s2", action: "Signal graceful shutdown", status: "done", durationMs: 720 },
      { id: "s3", action: "Restart pod & await ready state", status: "done", durationMs: 28000 },
      { id: "s4", action: "Run health check suite", status: "done", durationMs: 3200 },
      { id: "s5", action: "Re-route traffic and verify", status: "done", durationMs: 1100 },
    ],
    mttrSavedMins: 34,
    auditRef: "AUD-2024-4815",
  },
];

function fmtAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function StepRow({ step }: { step: RemediationStep }) {
  const colors = { done: "#10b981", running: "#f59e0b", pending: DS.text.muted, failed: "#ef4444" };
  const icons = { done: "✓", running: "⟳", pending: "○", failed: "✗" };
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-4 text-center font-mono font-bold shrink-0" style={{ color: colors[step.status] }}>{icons[step.status]}</span>
      <span style={{ color: step.status === "pending" ? DS.text.muted : DS.text.secondary }}>{step.action}</span>
      {step.durationMs && <span className="ml-auto font-mono text-[9px]" style={{ color: DS.text.muted }}>{(step.durationMs / 1000).toFixed(1)}s</span>}
      {step.status === "running" && <span className="ml-auto text-[8px] animate-pulse" style={{ color: "#f59e0b" }}>RUNNING</span>}
    </div>
  );
}

function RunCard({ run }: { run: RemediationRun }) {
  const [expanded, setExpanded] = useState(run.status === "executing" || run.status === "pending_approval");
  const tc = TYPE_COLOR[run.patternType];
  const sc = STATUS_COLOR[run.status];
  const doneSteps = run.steps.filter(s => s.status === "done").length;
  const progress = Math.round((doneSteps / run.steps.length) * 100);

  return (
    <div className="rounded-xl border" style={{ borderColor: `${tc}20`, background: `${tc}03` }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${tc}15`, color: tc }}>{run.patternType}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: DS.surface, color: DS.text.muted }}>#{run.id}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${sc}12`, color: sc }}>{run.status.replace("_", " ")}</span>
            </div>
            <div className="text-[12px] font-semibold mb-0.5" style={{ color: DS.text.primary }}>{run.patternName}</div>
            <div className="text-[10px] mb-1" style={{ color: DS.text.muted }}>{run.triggerSignal}</div>
            <div className="flex items-center gap-3 text-[9px]" style={{ color: DS.text.muted }}>
              <span className="font-mono">{run.service}</span>
              <span>·</span>
              <span>Detected {fmtAgo(run.detectedAt)}</span>
              <span>·</span>
              <span>MTTR saved: <span style={{ color: "#10b981" }}>~{run.mttrSavedMins}m</span></span>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 p-1 rounded hover:bg-white/5 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 transition-transform" style={{ color: DS.text.muted, transform: expanded ? "rotate(90deg)" : "none" }} />
          </button>
        </div>

        {run.status === "executing" && (
          <div className="mt-3">
            <div className="flex justify-between text-[9px] mb-1" style={{ color: DS.text.muted }}>
              <span>Execution progress</span>
              <span className="font-mono">{doneSteps}/{run.steps.length} steps</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full animate-pulse" style={{ width: `${progress}%`, background: tc }} />
            </div>
          </div>
        )}

        {run.status === "pending_approval" && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <Shield className="w-3 h-3 shrink-0" style={{ color: "#8b5cf6" }} />
            <span className="text-[10px]" style={{ color: "#8b5cf6" }}>Awaiting approval from <strong>{run.approver}</strong> — Alloy governance gate active</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-1.5" style={{ borderColor: DS.border }}>
          <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: DS.text.muted }}>Execution Audit Trail</div>
          {run.steps.map(step => <StepRow key={step.id} step={step} />)}
          <div className="pt-2 flex items-center justify-between text-[8px] font-mono" style={{ color: DS.text.muted, borderTop: `1px solid ${DS.border}` }}>
            <span>Audit ref: {run.auditRef}</span>
            <span>Alloy Governance · Immutable log</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PatternRow({ p }: { p: FailurePattern }) {
  const tc = TYPE_COLOR[p.type];
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.enabled ? tc : DS.text.muted }} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium" style={{ color: DS.text.primary }}>{p.name}</div>
        <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{p.trigger}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] font-mono" style={{ color: "#10b981" }}>{p.successRate}%</div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>{p.matchCount} runs</div>
      </div>
      <div className="text-right shrink-0 hidden md:block">
        <div className="text-[10px] font-mono" style={{ color: GOLD }}>~{p.avgMttrSavedMins}m</div>
        <div className="text-[8px]" style={{ color: DS.text.muted }}>avg MTTR saved</div>
      </div>
    </div>
  );
}

export default function SelfHealingPage() {
  const [runs] = useState<RemediationRun[]>(SEED_RUNS);
  const [tab, setTab] = useState<"runs" | "patterns">("runs");
  const totalMttrSaved = runs.filter(r => r.status === "completed").reduce((s, r) => s + r.mttrSavedMins, 0);
  const successRate = runs.length > 0 ? Math.round((runs.filter(r => r.status === "completed").length / runs.filter(r => r.status !== "pending_approval" && r.status !== "queued").length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>Self-Healing Orchestrator</h1>
            <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider animate-pulse" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>ACTIVE</span>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>Pattern-matched auto-remediation with Alloy approval gates and immutable audit trails. MTTR: hours → seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "MTTR Saved Today", value: `${totalMttrSaved}m`, color: "#10b981", icon: Clock },
          { label: "Active Executions", value: String(runs.filter(r => r.status === "executing").length), color: "#f59e0b", icon: Activity },
          { label: "Pending Approval", value: String(runs.filter(r => r.status === "pending_approval").length), color: "#8b5cf6", icon: Shield },
          { label: "Success Rate", value: `${successRate}%`, color: GOLD, icon: CheckCircle },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>{k.label}</span>
              <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
            </div>
            <div className="text-[22px] font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: DS.border }}>
        {(["runs", "patterns"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="text-[11px] px-4 py-2 capitalize transition-all" style={{
            color: tab === t ? GOLD : DS.text.muted,
            borderBottom: `2px solid ${tab === t ? GOLD : "transparent"}`,
          }}>{t === "runs" ? "Remediation Runs" : "Pattern Library"}</button>
        ))}
      </div>

      {tab === "runs" && (
        <div className="space-y-3">
          {runs.map(r => <RunCard key={r.id} run={r} />)}
        </div>
      )}

      {tab === "patterns" && (
        <div className="space-y-2">
          <div className="text-[10px] mb-3" style={{ color: DS.text.muted }}>
            {PATTERNS.filter(p => p.enabled).length} patterns active · {PATTERNS.filter(p => !p.enabled).length} disabled
          </div>
          {PATTERNS.map(p => <PatternRow key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
