import { APPROVALS, WORKFLOWS, EVENTS, formatCurrency, getSeverityColor, getStateColor, type Severity } from "@workspace/shared-ui/core-observability-data";
import { cn } from "@workspace/shared-ui/utils";
import { Inbox, AlertTriangle, Clock, User, ArrowRight, Zap, ExternalLink } from "lucide-react";
import { CommandModeSurface, type CommandModeSignal } from "@workspace/shared-ui";

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

const PRIORITY_COLORS: Record<ActionPriority, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: "URGENT", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
  high: { label: "HIGH", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.25)" },
  medium: { label: "MEDIUM", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
};

const TYPE_ICONS: Record<ActionItem["type"], React.ReactNode> = {
  approval: <Clock className="w-3.5 h-3.5" />,
  escalation: <AlertTriangle className="w-3.5 h-3.5" />,
  ownership: <User className="w-3.5 h-3.5" />,
  exception: <Zap className="w-3.5 h-3.5" />,
};

export default function CommandInbox() {
  const urgent = ACTIONS.filter(a => a.priority === "urgent");
  const high = ACTIONS.filter(a => a.priority === "high");
  const medium = ACTIONS.filter(a => a.priority === "medium");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Inbox className="w-4 h-4" style={{ color: "#f59e0b" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#f59e0b" }}>Lyte · Command Inbox</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Command Inbox</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Prioritized actions requiring human decisions — approvals, escalations, ownership gaps, and exception interventions.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Urgent Actions", value: urgent.length, color: "#ef4444" },
          { label: "High Priority", value: high.length, color: "#f97316" },
          { label: "Approvals Aging", value: APPROVALS.filter(a => a.age_hours > 24).length, color: "#f59e0b" },
          { label: "Value at Stake", value: formatCurrency(ACTIONS.reduce((s, a) => s + a.impact, 0)), color: "#10b981" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {[
        { label: "Urgent — Act Now", items: urgent, border: "rgba(239,68,68,0.15)" },
        { label: "High Priority", items: high, border: "rgba(249,115,22,0.1)" },
        { label: "Medium Priority", items: medium, border: "rgba(255,255,255,0.06)" },
      ].filter(g => g.items.length > 0).map(group => (
        <div key={group.label}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>{group.label}</div>
          <div className="space-y-2">
            {group.items.map(action => {
              const p = PRIORITY_COLORS[action.priority];
              return (
                <div key={action.id} className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: group.border, background: "rgba(255,255,255,0.015)" }}>
                  <div className="shrink-0" style={{ color: p.color }}>
                    {TYPE_ICONS[action.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: p.color, background: p.bg, border: `1px solid ${p.border}` }}>{p.label}</span>
                      <span className="text-[9px] font-medium uppercase tracking-wider px-1 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}>{action.type}</span>
                    </div>
                    <div className="text-sm font-medium text-white">{action.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{action.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {action.linked_product && action.linked_href && (
                      <a href={action.linked_href} className="text-[9px] flex items-center gap-1 hover:opacity-80" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <ExternalLink className="w-3 h-3" />{action.linked_product}
                      </a>
                    )}
                    <div className="text-right mr-2">
                      <div className="text-sm font-bold" style={{ color: "#f59e0b" }}>{formatCurrency(action.impact)}</div>
                      {action.age_hours && <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{action.age_hours}h old</div>}
                    </div>
                    <a href={action.action_href} className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                      {action.action_label} <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

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
