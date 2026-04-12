import { useState, useCallback } from "react";
import {
  Workflow, Play, Pause, Plus, Edit3, Trash2, CheckCircle2,
  Clock, AlertCircle, Zap, Activity, ChevronRight, RefreshCw,
  Eye, Settings, ToggleLeft, ToggleRight, Filter, Calendar,
  Users, Bell, ArrowRight, Database, Globe, Code2
} from "lucide-react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

const LYTE_ACCENT = LANE_ACCENT_HEX.lyte.primary;
const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.07)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.3)" };

type TriggerType = "event" | "scheduled" | "manual" | "webhook" | "ai-signal";
type WorkflowStatus = "active" | "paused" | "error" | "draft";
type ExecutionStatus = "completed" | "failed" | "running" | "awaiting_approval" | "cancelled";

interface WorkflowTrigger {
  id: string;
  name: string;
  description: string;
  triggerType: TriggerType;
  domain: string;
  status: WorkflowStatus;
  lastRun?: string;
  nextRun?: string;
  runsToday: number;
  totalRuns: number;
  successRate: number;
  pendingApprovals: number;
  steps: string[];
  tags: string[];
  requiresApproval: boolean;
}

interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startedAt: string;
  duration?: string;
  triggeredBy: string;
  output?: string;
  approvedBy?: string;
}

const TRIGGER_ICONS: Record<TriggerType, string> = {
  event: "⚡",
  scheduled: "🕐",
  manual: "👤",
  webhook: "🔗",
  "ai-signal": "🤖",
};

const STATUS_COLORS: Record<WorkflowStatus, string> = {
  active: "#6b8f71",
  paused: "#d4a054",
  error: "#c45a4a",
  draft: "rgba(255,255,255,0.3)",
};

const EXEC_COLORS: Record<ExecutionStatus, string> = {
  completed: "#6b8f71",
  failed: "#c45a4a",
  running: LYTE_ACCENT,
  awaiting_approval: "#8b7ac8",
  cancelled: "rgba(255,255,255,0.3)",
};

const EXEC_ICONS: Record<ExecutionStatus, string> = {
  completed: "✓",
  failed: "✗",
  running: "⚡",
  awaiting_approval: "👤",
  cancelled: "○",
};

const DEMO_WORKFLOWS: WorkflowTrigger[] = [
  {
    id: "wf-1",
    name: "Weekly Executive Digest",
    description: "Aggregates portfolio signals, generates AI narrative, and routes to exec team for approval before distribution.",
    triggerType: "scheduled",
    domain: "Lyte",
    status: "active",
    lastRun: "2h ago",
    nextRun: "in 5d",
    runsToday: 0,
    totalRuns: 48,
    successRate: 97,
    pendingApprovals: 0,
    steps: ["Aggregate signals", "Score & rank", "AI narrative", "Route for approval", "Distribute"],
    tags: ["executive", "digest", "ai"],
    requiresApproval: true,
  },
  {
    id: "wf-2",
    name: "Anomaly Auto-Triage",
    description: "Detects performance anomalies in real-time, runs AI root cause analysis, and creates prioritized blocker tickets automatically.",
    triggerType: "ai-signal",
    domain: "Aegis",
    status: "active",
    lastRun: "14m ago",
    nextRun: "continuous",
    runsToday: 12,
    totalRuns: 634,
    successRate: 91,
    pendingApprovals: 2,
    steps: ["Detect anomaly", "RCA analysis", "Risk score", "Create blocker", "Notify owner"],
    tags: ["anomaly", "auto", "triage"],
    requiresApproval: false,
  },
  {
    id: "wf-3",
    name: "Legal Document Intelligence",
    description: "Triggers on new matter uploads, extracts entities, classifies documents, and surfaces risk flags to the assigned attorney.",
    triggerType: "event",
    domain: "Prism",
    status: "active",
    lastRun: "1h ago",
    nextRun: "on upload",
    runsToday: 4,
    totalRuns: 215,
    successRate: 99,
    pendingApprovals: 1,
    steps: ["Detect upload", "Extract entities", "Classify", "Flag risks", "Notify attorney"],
    tags: ["legal", "document", "ner"],
    requiresApproval: false,
  },
  {
    id: "wf-4",
    name: "Vessel Sanctions Screening",
    description: "Runs nightly OFAC/UN sanctions checks on all tracked vessels and flags any matches for compliance review.",
    triggerType: "scheduled",
    domain: "Vessels",
    status: "active",
    lastRun: "6h ago",
    nextRun: "tonight 00:00",
    runsToday: 1,
    totalRuns: 89,
    successRate: 100,
    pendingApprovals: 0,
    steps: ["Pull vessel list", "OFAC check", "UN check", "Score risk", "Create review queue"],
    tags: ["sanctions", "compliance", "maritime"],
    requiresApproval: true,
  },
  {
    id: "wf-5",
    name: "Property Alert Distribution",
    description: "Monitors market conditions and sends personalized alerts when properties matching client criteria become available.",
    triggerType: "event",
    domain: "Terra",
    status: "paused",
    lastRun: "3d ago",
    nextRun: "paused",
    runsToday: 0,
    totalRuns: 156,
    successRate: 88,
    pendingApprovals: 0,
    steps: ["Monitor listings", "Match criteria", "Score relevance", "Personalize alert", "Multi-channel send"],
    tags: ["property", "alerts", "personalization"],
    requiresApproval: false,
  },
  {
    id: "wf-6",
    name: "Human-in-Loop Approval Router",
    description: "Routes high-risk AI decisions to the appropriate human approver based on domain, severity, and role matrix.",
    triggerType: "ai-signal",
    domain: "All Domains",
    status: "active",
    lastRun: "4m ago",
    nextRun: "continuous",
    runsToday: 7,
    totalRuns: 302,
    successRate: 95,
    pendingApprovals: 3,
    steps: ["Classify risk", "Identify approver", "Route request", "Track response", "Audit log"],
    tags: ["hitl", "approval", "governance"],
    requiresApproval: false,
  },
];

const DEMO_EXECUTIONS: ExecutionRecord[] = [
  { id: "ex-1", workflowId: "wf-6", workflowName: "Human-in-Loop Approval Router", status: "awaiting_approval", startedAt: "4m ago", triggeredBy: "AI Signal", output: "Awaiting approval from J. Mercer for anomaly containment action." },
  { id: "ex-2", workflowId: "wf-2", workflowName: "Anomaly Auto-Triage", status: "running", startedAt: "2m ago", triggeredBy: "AI Signal" },
  { id: "ex-3", workflowId: "wf-3", workflowName: "Legal Document Intelligence", status: "completed", startedAt: "1h ago", duration: "12s", triggeredBy: "File Upload", output: "4 entities extracted, 1 risk flag raised. Notified Atty. Vásquez." },
  { id: "ex-4", workflowId: "wf-6", workflowName: "Human-in-Loop Approval Router", status: "awaiting_approval", startedAt: "22m ago", triggeredBy: "AI Signal", output: "Containment action pending approval from security team." },
  { id: "ex-5", workflowId: "wf-4", workflowName: "Vessel Sanctions Screening", status: "completed", startedAt: "6h ago", duration: "3m 42s", triggeredBy: "Scheduled", output: "847 vessels screened. 0 sanctions matches. 2 watchlist additions." },
  { id: "ex-6", workflowId: "wf-2", workflowName: "Anomaly Auto-Triage", status: "failed", startedAt: "45m ago", duration: "8s", triggeredBy: "AI Signal", output: "RCA API timeout. Retry queued." },
  { id: "ex-7", workflowId: "wf-1", workflowName: "Weekly Executive Digest", status: "completed", startedAt: "2h ago", duration: "1m 15s", triggeredBy: "Scheduled", output: "Digest sent to 6 executives. Approved by C. Oduya.", approvedBy: "C. Oduya" },
];

function TriggerTypeBadge({ type }: { type: TriggerType }) {
  const colors: Record<TriggerType, string> = {
    event: LYTE_ACCENT,
    scheduled: "#8b7ac8",
    manual: "rgba(255,255,255,0.5)",
    webhook: "#4a90b8",
    "ai-signal": "#06b6d4",
  };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
      padding: "2px 6px", borderRadius: "4px",
      background: `${colors[type]}15`, color: colors[type], border: `1px solid ${colors[type]}25`,
    }}>
      {TRIGGER_ICONS[type]} {type.replace("-", " ")}
    </span>
  );
}

function WorkflowCard({
  wf,
  isSelected,
  onSelect,
  onToggle,
}: {
  wf: WorkflowTrigger;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: (id: string) => void;
}) {
  const statusColor = STATUS_COLORS[wf.status];
  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? `${LYTE_ACCENT}08` : BG.surface,
        border: `1px solid ${isSelected ? `${LYTE_ACCENT}30` : BORDER.muted}`,
        borderRadius: "10px",
        padding: "14px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = BORDER.muted; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: TEXT.primary }}>{wf.name}</span>
            <TriggerTypeBadge type={wf.triggerType} />
            {wf.pendingApprovals > 0 && (
              <span style={{ fontSize: "9px", fontWeight: 800, background: "#8b7ac820", color: "#8b7ac8", border: "1px solid #8b7ac830", borderRadius: "4px", padding: "1px 6px" }}>
                {wf.pendingApprovals} pending
              </span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: TEXT.secondary, lineHeight: 1.5, marginBottom: "8px" }}>
            {wf.description}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", color: TEXT.muted }}>
              <span style={{ color: statusColor, fontWeight: 700 }}>●</span> {wf.status}
            </span>
            {wf.lastRun && (
              <span style={{ fontSize: "10px", color: TEXT.muted }}>Last: {wf.lastRun}</span>
            )}
            <span style={{ fontSize: "10px", color: TEXT.muted }}>{wf.runsToday} runs today</span>
            <span style={{ fontSize: "10px", color: wf.successRate >= 95 ? "#6b8f71" : wf.successRate >= 80 ? "#d4a054" : "#c45a4a", fontWeight: 600 }}>
              {wf.successRate}% success
            </span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggle(wf.id); }}
          style={{
            flexShrink: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: wf.status === "active" ? "#6b8f71" : "rgba(255,255,255,0.3)",
            padding: "2px",
            transition: "color 0.15s",
          }}
          title={wf.status === "active" ? "Pause workflow" : "Activate workflow"}
        >
          {wf.status === "active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
      </div>
    </div>
  );
}

function ExecutionRow({ exec, onApprove }: { exec: ExecutionRecord; onApprove?: (id: string) => void }) {
  const color = EXEC_COLORS[exec.status];
  const icon = EXEC_ICONS[exec.status];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "10px 0",
      borderBottom: `1px solid ${BORDER.subtle}`,
    }}>
      <span style={{ fontSize: "13px", flexShrink: 0, color, marginTop: "2px" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: TEXT.primary, marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {exec.workflowName}
        </div>
        <div style={{ fontSize: "10px", color: TEXT.muted }}>
          {exec.triggeredBy} · {exec.startedAt}{exec.duration ? ` · ${exec.duration}` : ""}
          {exec.approvedBy && ` · Approved by ${exec.approvedBy}`}
        </div>
        {exec.output && (
          <div style={{ fontSize: "10px", color: TEXT.secondary, marginTop: "3px", lineHeight: 1.4 }}>
            {exec.output}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color, letterSpacing: "0.3px" }}>
          {exec.status.replace("_", " ")}
        </span>
        {exec.status === "awaiting_approval" && onApprove && (
          <button
            onClick={() => onApprove(exec.id)}
            style={{
              fontSize: "9px", fontWeight: 700, padding: "3px 8px",
              background: "#8b7ac820", border: "1px solid #8b7ac840",
              borderRadius: "4px", color: "#8b7ac8", cursor: "pointer",
            }}
          >
            Approve
          </button>
        )}
      </div>
    </div>
  );
}

function WorkflowDetailPanel({ wf, onClose }: { wf: WorkflowTrigger; onClose: () => void }) {
  return (
    <div style={{
      background: BG.surface,
      border: `1px solid ${BORDER.muted}`,
      borderRadius: "12px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: TEXT.primary, marginBottom: "4px" }}>{wf.name}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <TriggerTypeBadge type={wf.triggerType} />
            <span style={{ fontSize: "9px", color: STATUS_COLORS[wf.status], fontWeight: 700, textTransform: "uppercase" }}>● {wf.status}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: TEXT.muted, cursor: "pointer", fontSize: "16px" }}>✕</button>
      </div>

      <div style={{ fontSize: "12px", color: TEXT.secondary, lineHeight: 1.6 }}>{wf.description}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {[
          { label: "Domain", value: wf.domain },
          { label: "Total Runs", value: wf.totalRuns.toString() },
          { label: "Success Rate", value: `${wf.successRate}%` },
          { label: "Pending Approvals", value: wf.pendingApprovals.toString() },
          { label: "Last Run", value: wf.lastRun ?? "Never" },
          { label: "Next Run", value: wf.nextRun ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: BG.elevated, borderRadius: "8px", padding: "10px" }}>
            <div style={{ fontSize: "9px", color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT.primary }}>{value}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: "10px", color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px", fontWeight: 700 }}>Execution Steps</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {wf.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: `${LYTE_ACCENT}20`, border: `1px solid ${LYTE_ACCENT}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "9px", fontWeight: 800, color: LYTE_ACCENT, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: "12px", color: TEXT.secondary }}>{step}</span>
              {i < wf.steps.length - 1 && (
                <ArrowRight size={10} style={{ color: TEXT.muted, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {wf.requiresApproval && (
        <div style={{
          background: "#8b7ac810", border: "1px solid #8b7ac825",
          borderRadius: "8px", padding: "10px 12px",
          display: "flex", alignItems: "center", gap: "8px",
          fontSize: "11px", color: "#8b7ac8",
        }}>
          <Users size={12} />
          Requires human approval before execution completes
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button style={{
          flex: 1, padding: "9px", borderRadius: "8px",
          background: `${LYTE_ACCENT}15`, border: `1px solid ${LYTE_ACCENT}35`,
          color: LYTE_ACCENT, fontSize: "11px", fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        }}>
          <Play size={12} /> Run Now
        </button>
        <button style={{
          flex: 1, padding: "9px", borderRadius: "8px",
          background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`,
          color: TEXT.secondary, fontSize: "11px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
        }}>
          <Edit3 size={12} /> Edit
        </button>
      </div>
    </div>
  );
}

export default function WorkflowAutomationDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowTrigger[]>(DEMO_WORKFLOWS);
  const [executions, setExecutions] = useState<ExecutionRecord[]>(DEMO_EXECUTIONS);
  const [selectedWfId, setSelectedWfId] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"workflows" | "executions" | "triggers">("workflows");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const selectedWf = workflows.find(w => w.id === selectedWfId) ?? null;

  const domains = ["all", ...Array.from(new Set(workflows.map(w => w.domain)))];
  const statuses = ["all", "active", "paused", "error", "draft"];

  const filteredWorkflows = workflows.filter(w => {
    if (filterDomain !== "all" && w.domain !== filterDomain) return false;
    if (filterStatus !== "all" && w.status !== filterStatus) return false;
    return true;
  });

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleToggle = useCallback((id: string) => {
    setWorkflows(ws => ws.map(w => w.id === id ? {
      ...w,
      status: w.status === "active" ? "paused" : "active",
    } : w));
    const wf = workflows.find(w => w.id === id);
    showNotification(`${wf?.name} ${wf?.status === "active" ? "paused" : "activated"}`);
  }, [workflows, showNotification]);

  const handleApprove = useCallback((execId: string) => {
    setExecutions(es => es.map(e => e.id === execId ? { ...e, status: "completed", approvedBy: "You", output: (e.output ?? "") + " Approved by you." } : e));
    showNotification("✓ Approval granted — execution resumed");
  }, [showNotification]);

  const pendingCount = executions.filter(e => e.status === "awaiting_approval").length;
  const activeCount = workflows.filter(w => w.status === "active").length;
  const todayRuns = workflows.reduce((s, w) => s + w.runsToday, 0);
  const avgSuccess = Math.round(workflows.reduce((s, w) => s + w.successRate, 0) / workflows.length);

  return (
    <div style={{ background: BG.page, minHeight: "100%", padding: "24px", fontFamily: "inherit", position: "relative" }}>
      {notification && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 999,
          background: "rgba(20,25,40,0.96)", border: `1px solid ${LYTE_ACCENT}40`,
          borderRadius: "10px", padding: "10px 16px",
          fontSize: "12px", color: "rgba(255,255,255,0.85)",
          boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px ${LYTE_ACCENT}20`,
        }}>
          {notification}
        </div>
      )}

      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: TEXT.primary, margin: 0 }}>
              Workflow Automation
            </h1>
            <p style={{ fontSize: "13px", color: TEXT.secondary, margin: "4px 0 0" }}>
              Event-driven triggers, human-in-the-loop approvals, and cross-domain AI automations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "8px",
              background: `${LYTE_ACCENT}20`, border: `1px solid ${LYTE_ACCENT}40`,
              color: LYTE_ACCENT, fontSize: "12px", fontWeight: 700, cursor: "pointer",
            }}
          >
            <Plus size={14} /> New Trigger
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Active Workflows", value: activeCount, icon: <Activity size={14} />, color: "#6b8f71" },
          { label: "Runs Today", value: todayRuns, icon: <Play size={14} />, color: LYTE_ACCENT },
          { label: "Avg Success Rate", value: `${avgSuccess}%`, icon: <CheckCircle2 size={14} />, color: "#4a90b8" },
          { label: "Pending Approvals", value: pendingCount, icon: <Users size={14} />, color: pendingCount > 0 ? "#8b7ac8" : TEXT.muted },
        ].map(stat => (
          <div key={stat.label} style={{ background: BG.surface, border: `1px solid ${BORDER.muted}`, borderRadius: "10px", padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: stat.color, marginBottom: "6px" }}>
              {stat.icon}
              <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: TEXT.primary }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {(["workflows", "executions", "triggers"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "7px 14px", borderRadius: "8px",
              background: activeTab === tab ? `${LYTE_ACCENT}20` : "transparent",
              border: `1px solid ${activeTab === tab ? `${LYTE_ACCENT}40` : "transparent"}`,
              color: activeTab === tab ? LYTE_ACCENT : TEXT.muted,
              fontSize: "12px", fontWeight: activeTab === tab ? 700 : 500,
              cursor: "pointer", textTransform: "capitalize",
            }}
          >
            {tab === "workflows" ? `Workflows (${filteredWorkflows.length})` : tab === "executions" ? `Execution History (${executions.length})` : "Trigger Config"}
          </button>
        ))}
      </div>

      {activeTab === "workflows" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedWf ? "1fr 380px" : "1fr", gap: "16px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={filterDomain}
                onChange={e => setFilterDomain(e.target.value)}
                style={{
                  padding: "6px 10px", borderRadius: "6px",
                  background: BG.elevated, border: `1px solid ${BORDER.muted}`,
                  color: TEXT.secondary, fontSize: "11px", cursor: "pointer",
                }}
              >
                {domains.map(d => <option key={d} value={d}>{d === "all" ? "All Domains" : d}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  padding: "6px 10px", borderRadius: "6px",
                  background: BG.elevated, border: `1px solid ${BORDER.muted}`,
                  color: TEXT.secondary, fontSize: "11px", cursor: "pointer",
                }}
              >
                {statuses.map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            {filteredWorkflows.map(wf => (
              <WorkflowCard
                key={wf.id}
                wf={wf}
                isSelected={selectedWfId === wf.id}
                onSelect={() => setSelectedWfId(selectedWfId === wf.id ? null : wf.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>

          {selectedWf && (
            <div style={{ position: "sticky", top: "16px" }}>
              <WorkflowDetailPanel wf={selectedWf} onClose={() => setSelectedWfId(null)} />
            </div>
          )}
        </div>
      )}

      {activeTab === "executions" && (
        <div style={{ background: BG.surface, border: `1px solid ${BORDER.muted}`, borderRadius: "12px", padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: TEXT.primary, marginBottom: "12px" }}>
            Execution Log
            {pendingCount > 0 && (
              <span style={{ marginLeft: "8px", fontSize: "10px", color: "#8b7ac8", background: "#8b7ac820", border: "1px solid #8b7ac830", borderRadius: "4px", padding: "1px 6px" }}>
                {pendingCount} awaiting approval
              </span>
            )}
          </div>
          {executions.map(exec => (
            <ExecutionRow key={exec.id} exec={exec} onApprove={handleApprove} />
          ))}
        </div>
      )}

      {activeTab === "triggers" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          {[
            { type: "event" as TriggerType, title: "Event Triggers", description: "Fire when specific events occur (file uploads, user actions, system events).", icon: <Zap size={20} />, color: LYTE_ACCENT, count: workflows.filter(w => w.triggerType === "event").length },
            { type: "scheduled" as TriggerType, title: "Scheduled Triggers", description: "Run on a cron schedule — daily, weekly, monthly, or custom intervals.", icon: <Calendar size={20} />, color: "#8b7ac8", count: workflows.filter(w => w.triggerType === "scheduled").length },
            { type: "webhook" as TriggerType, title: "Webhook Triggers", description: "Inbound HTTP hooks from external systems and third-party integrations.", icon: <Globe size={20} />, color: "#4a90b8", count: workflows.filter(w => w.triggerType === "webhook").length },
            { type: "ai-signal" as TriggerType, title: "AI Signal Triggers", description: "Fire when the AI engine detects anomalies, patterns, or threshold breaches.", icon: <Activity size={20} />, color: "#06b6d4", count: workflows.filter(w => w.triggerType === "ai-signal").length },
            { type: "manual" as TriggerType, title: "Manual Triggers", description: "User-initiated from the command palette, UI, or API call.", icon: <Users size={20} />, color: "rgba(255,255,255,0.5)", count: workflows.filter(w => w.triggerType === "manual").length },
          ].map(({ type, title, description, icon, color, count }) => (
            <div key={type} style={{
              background: BG.surface, border: `1px solid ${BORDER.muted}`,
              borderRadius: "12px", padding: "18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ color, background: `${color}15`, border: `1px solid ${color}20`, borderRadius: "8px", padding: "8px", display: "flex" }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT.primary }}>{title}</div>
                  <div style={{ fontSize: "10px", color, fontWeight: 700 }}>{count} workflow{count !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <p style={{ fontSize: "11px", color: TEXT.secondary, lineHeight: 1.6, margin: 0 }}>{description}</p>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
        }} onClick={() => setShowCreateModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: BG.surface, border: `1px solid ${BORDER.muted}`,
              borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "100%",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 800, color: TEXT.primary, marginBottom: "6px" }}>New Workflow Trigger</div>
            <p style={{ fontSize: "12px", color: TEXT.secondary, margin: "0 0 20px", lineHeight: 1.6 }}>
              Define a new event-driven automation for any domain. Triggers can fire on AI signals, schedules, webhooks, or user events.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Trigger Name", placeholder: "e.g. Anomaly Alert Router" },
                { label: "Domain", placeholder: "e.g. Aegis, Terra, Legal" },
              ].map(field => (
                <div key={field.label}>
                  <div style={{ fontSize: "10px", color: TEXT.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>{field.label}</div>
                  <input
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "9px 12px",
                      background: BG.elevated, border: `1px solid ${BORDER.muted}`,
                      borderRadius: "8px", color: TEXT.primary, fontSize: "12px",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontSize: "10px", color: TEXT.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>Trigger Type</div>
                <select style={{
                  width: "100%", padding: "9px 12px",
                  background: BG.elevated, border: `1px solid ${BORDER.muted}`,
                  borderRadius: "8px", color: TEXT.primary, fontSize: "12px",
                }}>
                  {(["event", "scheduled", "webhook", "ai-signal", "manual"] as TriggerType[]).map(t => (
                    <option key={t} value={t}>{TRIGGER_ICONS[t]} {t.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER.muted}`, color: TEXT.secondary, fontSize: "12px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowCreateModal(false); showNotification("Workflow trigger created (draft)"); }}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: `${LYTE_ACCENT}20`, border: `1px solid ${LYTE_ACCENT}40`, color: LYTE_ACCENT, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Create Trigger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
