import { APPROVALS, WORKFLOWS, EVENTS, formatCurrency, getSeverityColor, getStateColor, type Severity } from "@workspace/shared-ui/core-observability-data";
import { cn } from "@workspace/shared-ui/utils";
import { Inbox, AlertTriangle, Clock, User, ArrowRight, Zap, ExternalLink, TrendingUp, Activity, ChevronRight, RefreshCw } from "lucide-react";
import { CommandModeSurface, type CommandModeSignal, DataStateBadge } from "@workspace/shared-ui";
import { useState, useEffect } from "react";

type ActionPriority = "urgent" | "high" | "medium";

interface ActionItem {
  id: string;
  type: "approval" | "escalation" | "ownership" | "exception";
  title: string;
  subtitle: string;
  priority: ActionPriority;
  impact: number;
  owner?: string;
  age_hours?: number;
  action_label: string;
  action_href: string;
  correlation_id: string;
  linked_product?: string;
  linked_href?: string;
}

const ACTIONS: ActionItem[] = [
  {
    id: "act-001",
    type: "approval",
    title: "Northgate Contract — Legal Review Stalled",
    subtitle: "48h past SLA · $840K ARR at risk · Escalation recommended",
    priority: "urgent",
    impact: 840000,
    owner: "Jordan Alvarez",
    age_hours: 48,
    action_label: "Escalate Approval",
    action_href: "/approvals",
    correlation_id: "gf-2026-q1-001",
    linked_product: "Beacon detected",
    linked_href: "/terra/",
  },
  {
    id: "act-002",
    type: "escalation",
    title: "TechCorp Churn Risk — Executive Outreach Required",
    subtitle: "24h to act · $480K ARR · Alloy predicts 88% churn if no contact",
    priority: "urgent",
    impact: 480000,
    owner: "Marcus Webb",
    age_hours: 24,
    action_label: "Open Escalation",
    action_href: "/escalation",
    correlation_id: "corr-churn-techcorp",
    linked_product: "Alloy modeled",
    linked_href: "/alloy/",
  },
  {
    id: "act-003",
    type: "ownership",
    title: "Apex Logistics Onboarding — No Owner on Compliance Step",
    subtitle: "6 days unresolved · Blocking 6 vendor onboardings downstream",
    priority: "high",
    impact: 320000,
    owner: undefined,
    age_hours: 144,
    action_label: "Assign Owner",
    action_href: "/ownership",
    correlation_id: "corr-vendor-apex",
    linked_product: "Beacon flagged",
    linked_href: "/terra/",
  },
  {
    id: "act-004",
    type: "approval",
    title: "SEC Filing Q1 — CFO Sign-off Pending",
    subtitle: "36h pending · Regulatory deadline risk · $2.1M filing impact",
    priority: "high",
    impact: 2100000,
    owner: "Thomas Nguyen",
    age_hours: 36,
    action_label: "Review Approval",
    action_href: "/approvals",
    correlation_id: "corr-sec-filing",
  },
  {
    id: "act-005",
    type: "exception",
    title: "AlloyScape Run Failed — Contract Workflow Step 4",
    subtitle: "No approver assigned · Retry available · Reroute recommended",
    priority: "high",
    impact: 840000,
    action_label: "View in AlloyScape",
    action_href: "/alloy/",
    correlation_id: "gf-2026-q1-001",
    linked_product: "AlloyScape exception",
    linked_href: "/alloy/",
  },
  {
    id: "act-006",
    type: "approval",
    title: "Q1 Budget CapEx Authorization — Infrastructure Upgrade",
    subtitle: "72h aging · $450K authorization · Cross-department sign-off needed",
    priority: "medium",
    impact: 450000,
    owner: "Priya Mehta",
    age_hours: 72,
    action_label: "Review Approval",
    action_href: "/approvals",
    correlation_id: "corr-q1-budget",
  },
];

const PRIORITY_CONFIG: Record<ActionPriority, { label: string; color: string; bg: string; border: string; ringColor: string }> = {
  urgent: { label: "URGENT", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", ringColor: "rgba(239,68,68,0.15)" },
  high: { label: "HIGH", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", ringColor: "rgba(249,115,22,0.1)" },
  medium: { label: "MEDIUM", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", ringColor: "rgba(245,158,11,0.08)" },
};

const TYPE_CONFIG: Record<ActionItem["type"], { icon: React.ReactNode; label: string; color: string }> = {
  approval: { icon: <Clock className="w-3 h-3" />, label: "Approval", color: "#60a5fa" },
  escalation: { icon: <AlertTriangle className="w-3 h-3" />, label: "Escalation", color: "#f87171" },
  ownership: { icon: <User className="w-3 h-3" />, label: "Ownership", color: "#a78bfa" },
  exception: { icon: <Zap className="w-3 h-3" />, label: "Exception", color: "#fb923c" },
};

function AgePill({ hours }: { hours: number }) {
  const isOverdue = hours >= 48;
  const isWarning = hours >= 24;
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{
      color: isOverdue ? "#ef4444" : isWarning ? "#f97316" : "rgba(255,255,255,0.35)",
      background: isOverdue ? "rgba(239,68,68,0.08)" : isWarning ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isOverdue ? "rgba(239,68,68,0.2)" : isWarning ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}`,
    }}>
      {hours}h
    </span>
  );
}

function LiveTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <span key={tick} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
  );
}

function ActionCard({ action, compact = false }: { action: ActionItem; compact?: boolean }) {
  const p = PRIORITY_CONFIG[action.priority];
  const t = TYPE_CONFIG[action.type];

  return (
    <div className="group rounded-xl border transition-all hover:border-opacity-60" style={{ borderColor: p.border, background: `rgba(255,255,255,0.012)` }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Type indicator */}
          <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" style={{ background: `${t.color}12`, border: `1px solid ${t.color}20`, color: t.color }}>
            {t.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: p.color, background: p.bg, border: `1px solid ${p.border}` }}>
                {p.label}
              </span>
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ color: t.color, background: `${t.color}08`, border: `1px solid ${t.color}18` }}>
                {t.label}
              </span>
              {action.age_hours && <AgePill hours={action.age_hours} />}
            </div>
            <p className="text-sm font-semibold text-white leading-tight">{action.title}</p>
            <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{action.subtitle}</p>

            {/* Owner row */}
            {(action.owner || action.linked_product) && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {action.owner ? (
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <User className="w-2.5 h-2.5" /> {action.owner}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-red-400/70">
                    <User className="w-2.5 h-2.5" /> No owner assigned
                  </span>
                )}
                {action.linked_product && action.linked_href && (
                  <a href={action.linked_href} className="flex items-center gap-1 text-[10px] hover:opacity-80 transition-opacity" style={{ color: "rgba(255,255,255,0.25)" }} onClick={e => e.stopPropagation()}>
                    <ExternalLink className="w-2.5 h-2.5" />{action.linked_product}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Impact + CTA */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: "#f59e0b" }}>{formatCurrency(action.impact)}</div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>exposure</div>
            </div>
            <a
              href={action.action_href}
              className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80 whitespace-nowrap"
              style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              {action.action_label} <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommandInbox() {
  const urgent = ACTIONS.filter(a => a.priority === "urgent");
  const high = ACTIONS.filter(a => a.priority === "high");
  const medium = ACTIONS.filter(a => a.priority === "medium");
  const totalExposure = ACTIONS.reduce((s, a) => s + a.impact, 0);
  const agingApprovals = APPROVALS.filter(a => a.age_hours > 24).length;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#f59e0b" }}>Lyte · Command Inbox</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Command Inbox</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Prioritized actions requiring human decision — approvals, escalations, ownership gaps, and exception interventions.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <DataStateBadge state="demo" label="Demo Data" />
          <div className="flex items-center gap-2">
            <LiveTick />
            <span className="text-[9px] font-mono" style={{ color: "rgba(245,158,11,0.5)" }}>live</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-stretch">
          {[
            { label: "Urgent Actions", value: urgent.length.toString(), color: "#ef4444", sub: "act now", pulse: urgent.length > 0 },
            { label: "High Priority", value: high.length.toString(), color: "#f97316", sub: "require review" },
            { label: "Aging Approvals", value: agingApprovals.toString(), color: "#f59e0b", sub: ">24h without action" },
            { label: "Total Exposure", value: formatCurrency(totalExposure), color: "#10b981", sub: "value at stake" },
            { label: "Active Signals", value: ACTIONS.length.toString(), color: "rgba(255,255,255,0.5)", sub: "in inbox" },
          ].map((c, i) => (
            <div key={c.label} className="flex-1 px-4 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-lg font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: c.color }} />}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              {c.sub && <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Priority groups */}
      {[
        { label: "Urgent — Act Now", labelColor: "#ef4444", items: urgent, borderAccent: "rgba(239,68,68,0.12)", dot: "#ef4444" },
        { label: "High Priority", labelColor: "#f97316", items: high, borderAccent: "rgba(249,115,22,0.08)", dot: "#f97316" },
        { label: "Medium Priority", labelColor: "#f59e0b", items: medium, borderAccent: "rgba(245,158,11,0.06)", dot: "#f59e0b" },
      ].filter(g => g.items.length > 0).map(group => (
        <div key={group.label} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: group.dot }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: group.labelColor }}>{group.label}</span>
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>({group.items.length})</span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${group.dot}30, transparent)` }} />
          </div>
          {group.items.map(action => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      ))}

      {/* Command mode surface */}
      <CommandModeSurface
        title="Command Mode — Active Signals"
        accentColor="#f59e0b"
        signals={COMMAND_SIGNALS}
      />
    </div>
  );
}

const COMMAND_SIGNALS: CommandModeSignal[] = [
  {
    id: "cs-001",
    level: "critical",
    what: "Northgate contract approval stalled — 48h past SLA",
    why: "Legal review has no assigned owner. $840K ARR at risk if contract lapses without renewal signature by Friday.",
    owner: "Jordan Alvarez",
    next: "Escalate to VP Legal with 24h deadline",
    valueAtRisk: "$840K",
    category: "Approval",
  },
  {
    id: "cs-002",
    level: "high",
    what: "TechCorp churn probability at 88% — no executive outreach in 14 days",
    why: "Alloy model predicts churn based on declining usage, 3 unresolved support tickets, and zero executive contact since renewal discussion.",
    owner: "Marcus Webb",
    next: "Schedule executive call within 24h",
    valueAtRisk: "$480K",
    category: "Retention",
  },
  {
    id: "cs-003",
    level: "high",
    what: "Apex Logistics onboarding compliance step has no owner",
    why: "6 vendor onboardings blocked downstream. Compliance review step was created without owner assignment — likely a workflow configuration gap.",
    next: "Assign compliance owner and unblock pipeline",
    valueAtRisk: "$320K",
    category: "Ownership",
  },
  {
    id: "cs-004",
    level: "medium",
    what: "Q1 CapEx budget authorization aging at 72h",
    why: "Infrastructure upgrade requires cross-department sign-off. Two of four approvers have not responded.",
    owner: "Priya Mehta",
    next: "Send reminder with 48h escalation trigger",
    valueAtRisk: "$450K",
    category: "Approval",
  },
];
