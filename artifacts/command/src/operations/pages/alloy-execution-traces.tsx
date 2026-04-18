import { useState } from "react";
import {
  AlertTriangle, Search, GitBranch, ChevronRight, ChevronDown,
} from "lucide-react";
import { EnvironmentLabel } from "@szl-holdings/shared-ui/alloy-decision-card";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" } as const;
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" } as const;
const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.55)",
  tertiary: "rgba(255,255,255,0.28)",
  muted: "rgba(255,255,255,0.14)",
} as const;
const ACCENT = "#d4a054";

type TraceStatus = "completed" | "failed" | "running";
type StepStatus = "ok" | "warn" | "error";

interface TraceStep {
  step: string;
  label: string;
  status: StepStatus;
  duration: string;
  output: string;
}

interface Trace {
  id: string;
  traceId: string;
  agent: string;
  trigger: string;
  status: TraceStatus;
  startedAt: string;
  duration: string;
  tokens: number;
  model: string;
  findings: number;
  steps: TraceStep[];
  alert?: string;
}

const TRACES: Trace[] = [
  {
    id: "trace-001",
    traceId: "trc-lyte-4f8a2b",
    agent: "Lyte Autonomous Agent",
    trigger: "scheduled_run",
    status: "completed",
    startedAt: "2 min ago",
    duration: "1,412ms",
    tokens: 3840,
    model: "gpt-4o",
    findings: 1,
    steps: [
      { step: "01", label: "Signal Ingestion", status: "ok", duration: "28ms", output: "263 signals normalized from 8 sources" },
      { step: "02", label: "Context Assembly", status: "ok", duration: "112ms", output: "Workspace state assembled — 14 owners, 31 active workflows" },
      { step: "03", label: "Risk Scoring", status: "ok", duration: "344ms", output: "5 high-risk signals identified, 2 critical ownership gaps" },
      { step: "04", label: "Intelligence Synthesis", status: "ok", duration: "788ms", output: "3,840 tokens — 1 finding generated with evidence chain" },
      { step: "05", label: "Action Routing", status: "ok", duration: "86ms", output: "1 action routed to Command Inbox — awaiting approval" },
      { step: "06", label: "Audit Recording", status: "ok", duration: "54ms", output: "Trace archived to Proof Chain — immutable record created" },
    ],
  },
  {
    id: "trace-002",
    traceId: "trc-corr-7c1d9e",
    agent: "Correlation Engine",
    trigger: "event_stream",
    status: "completed",
    startedAt: "12s ago",
    duration: "812ms",
    tokens: 0,
    model: "internal",
    findings: 3,
    steps: [
      { step: "01", label: "Event Ingestion", status: "ok", duration: "8ms", output: "47 events ingested from 3 sources" },
      { step: "02", label: "Pattern Matching", status: "ok", duration: "214ms", output: "12 correlation rules applied" },
      { step: "03", label: "Cluster Formation", status: "ok", duration: "388ms", output: "3 correlated clusters identified" },
      { step: "04", label: "Severity Assignment", status: "ok", duration: "72ms", output: "1 critical, 1 high, 1 medium cluster" },
      { step: "05", label: "Signal Emission", status: "ok", duration: "130ms", output: "3 correlated signals published to event fabric" },
    ],
  },
  {
    id: "trace-003",
    traceId: "trc-act-2b6f4a",
    agent: "Action Router",
    trigger: "action_request",
    status: "failed",
    startedAt: "2m ago",
    duration: "1,842ms",
    tokens: 1280,
    model: "gpt-4o",
    findings: 0,
    alert: "Webhook timeout — Slack connector unreachable",
    steps: [
      { step: "01", label: "Action Validation", status: "ok", duration: "42ms", output: "Action type: notify — approved by governance policy" },
      { step: "02", label: "Connector Resolution", status: "ok", duration: "28ms", output: "Slack connector selected — workspace: @acme" },
      { step: "03", label: "Message Rendering", status: "ok", duration: "764ms", output: "1,280 tokens — message rendered with context" },
      { step: "04", label: "Delivery Attempt 1", status: "warn", duration: "504ms", output: "Timeout (500ms) — connector unreachable" },
      { step: "05", label: "Delivery Attempt 2", status: "warn", duration: "504ms", output: "Timeout (500ms) — connector unreachable" },
      { step: "06", label: "Fallback: Email", status: "ok", duration: "0ms", output: "Fallback queued — email delivery pending" },
      { step: "07", label: "Audit Recording", status: "ok", duration: "0ms", output: "Failure recorded — alert surfaced to Agent Monitor" },
    ],
  },
  {
    id: "trace-004",
    traceId: "trc-own-8d3c5f",
    agent: "Ownership Validator",
    trigger: "scheduled_run",
    status: "completed",
    startedAt: "5m ago",
    duration: "2,104ms",
    tokens: 2100,
    model: "gpt-4o-mini",
    findings: 7,
    steps: [
      { step: "01", label: "Ownership Scan", status: "ok", duration: "188ms", output: "94 resources scanned — 12 unassigned" },
      { step: "02", label: "Gap Analysis", status: "ok", duration: "412ms", output: "7 ownership gaps exceeding 7-day threshold" },
      { step: "03", label: "Attribution Inference", status: "ok", duration: "1,204ms", output: "2,100 tokens — attribution suggested for 5 gaps" },
      { step: "04", label: "Finding Generation", status: "ok", duration: "244ms", output: "7 findings queued — prioritised by impact" },
      { step: "05", label: "Routing", status: "ok", duration: "56ms", output: "2 actions routed to Command Inbox" },
    ],
  },
];

interface StatusStyle { color: string; label: string; bg: string }

const TRACE_STATUS_CONFIG: Record<TraceStatus, StatusStyle> = {
  completed: { color: "#22c55e", label: "Completed", bg: "rgba(34,197,94,0.1)" },
  failed: { color: "#ef4444", label: "Failed", bg: "rgba(239,68,68,0.1)" },
  running: { color: "#d4a054", label: "Running", bg: "rgba(212,160,84,0.1)" },
};

const STEP_STATUS_COLOR: Record<StepStatus, string> = {
  ok: "#22c55e",
  warn: "#f97316",
  error: "#ef4444",
};

function TraceRow({ trace, selected, onClick }: { trace: Trace; selected: boolean; onClick: () => void }) {
  const s = TRACE_STATUS_CONFIG[trace.status];
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 transition-all hover:bg-white/[0.02]"
      style={{
        borderBottom: `1px solid ${BORDER.subtle}`,
        background: selected ? "rgba(212,160,84,0.04)" : undefined,
        borderLeft: selected ? `2px solid ${ACCENT}` : "2px solid transparent",
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-mono mb-0.5" style={{ color: ACCENT }}>{trace.traceId}</p>
          <p className="text-[12px] font-semibold truncate" style={{ color: TEXT.primary }}>{trace.agent}</p>
          <p className="text-[10px]" style={{ color: TEXT.tertiary }}>{trace.trigger} · {trace.startedAt}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-mono" style={{ color: TEXT.secondary }}>{trace.duration}</span>
          {trace.findings > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: `${ACCENT}18`, color: ACCENT }}>
              {trace.findings}
            </span>
          )}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: s.bg, color: s.color }}>
            {s.label}
          </span>
        </div>
      </div>
      {trace.alert && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px]" style={{ color: "#f97316" }}>
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {trace.alert}
        </div>
      )}
    </button>
  );
}

interface TraceSummaryMetric { label: string; value: string }

function TraceDetail({ trace }: { trace: Trace }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const s = TRACE_STATUS_CONFIG[trace.status];

  const summaryMetrics: TraceSummaryMetric[] = [
    { label: "Duration", value: trace.duration },
    { label: "Model", value: trace.model },
    { label: "Tokens", value: trace.tokens > 0 ? trace.tokens.toLocaleString() : "N/A" },
    { label: "Findings", value: String(trace.findings) },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: BG.surface }}>
      <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] font-mono mb-1" style={{ color: ACCENT }}>{trace.traceId}</p>
            <p className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>{trace.agent}</p>
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>Triggered by: {trace.trigger}</p>
          </div>
          <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: s.bg, color: s.color }}>
            {s.label}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {summaryMetrics.map((m) => (
            <div key={m.label} className="rounded px-3 py-2" style={{ background: BG.elevated }}>
              <p className="text-[10px] mb-0.5" style={{ color: TEXT.muted }}>{m.label}</p>
              <p className="text-[12px] font-mono" style={{ color: TEXT.secondary }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {trace.alert && (
        <div className="mx-4 mt-4 rounded-lg px-4 py-3 flex items-start gap-2.5" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#f97316" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "#f97316" }}>{trace.alert}</p>
        </div>
      )}

      <div className="px-4 py-4">
        <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>Execution Steps</p>
        <div className="space-y-1.5">
          {trace.steps.map((step) => {
            const isExpanded = expandedStep === step.step;
            return (
              <div key={step.step} className="rounded-md overflow-hidden" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                  className="w-full text-left px-3 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>{step.step}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: STEP_STATUS_COLOR[step.status] }} />
                    <span className="text-[11px] font-medium" style={{ color: TEXT.primary }}>{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>{step.duration}</span>
                    {isExpanded
                      ? <ChevronDown className="w-3 h-3" style={{ color: TEXT.muted }} />
                      : <ChevronRight className="w-3 h-3" style={{ color: TEXT.muted }} />
                    }
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t" style={{ borderColor: BORDER.subtle }}>
                    <p className="text-[11px] leading-relaxed pt-2" style={{ color: TEXT.secondary }}>{step.output}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AlloyExecutionTracesPage() {
  const [selected, setSelected] = useState<string>("trace-001");
  const [search, setSearch] = useState("");
  const selectedTrace = TRACES.find((t) => t.id === selected);
  const filtered = TRACES.filter(
    (t) => search === "" || t.agent.toLowerCase().includes(search.toLowerCase()) || t.traceId.includes(search)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>Execution Traces</span>
          <EnvironmentLabel environment="demo" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: TEXT.muted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search traces…"
              className="rounded-lg pl-8 pr-3 py-1.5 text-[11px] outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER.muted}`, color: TEXT.primary, width: 180 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[340px_1fr] overflow-hidden">
        <div className="overflow-y-auto" style={{ borderRight: `1px solid ${BORDER.subtle}` }}>
          <div className="px-4 py-2" style={{ borderBottom: `1px solid ${BORDER.subtle}`, background: BG.elevated }}>
            <p className="text-[10px]" style={{ color: TEXT.muted }}>{filtered.length} traces · last 15 min</p>
          </div>
          {filtered.map((trace) => (
            <TraceRow
              key={trace.id}
              trace={trace}
              selected={selected === trace.id}
              onClick={() => setSelected(trace.id)}
            />
          ))}
        </div>
        {selectedTrace && <TraceDetail trace={selectedTrace} />}
      </div>
    </div>
  );
}
