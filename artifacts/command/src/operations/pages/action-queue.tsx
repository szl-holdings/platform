import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import { OperationalEvidencePanel, OperationalAuditTimeline } from "@szl-holdings/shared-ui";
import type { OperationalEvidenceItem as EvidenceItem, AuditHistoryEntry } from "@szl-holdings/shared-ui";
import { Card, CardContent } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { Button } from "@szl-holdings/shared-ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@szl-holdings/shared-ui/ui/select";
import {
  CheckSquare, User, AlertOctagon, TrendingDown, GitBranch, Clock, AlertTriangle,
  ArrowRight, Filter, Zap, Users, BarChart3, Package, Calendar, ChevronDown, ChevronRight, FileSearch
} from "lucide-react";
import { useState } from "react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { cn } from "@szl-holdings/shared-ui/utils";

type Role = "executive" | "operations" | "delivery";
type ActionState = "new" | "acknowledged" | "assigned" | "escalated" | "resolved" | "dismissed";

const SIGNAL_CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  approval_latency: { label: "Approval Latency", icon: Clock, color: "text-[#d4a054]" },
  ownership_gap: { label: "Ownership Gap", icon: User, color: "text-[#c8953c]" },
  forecast_drift: { label: "Forecast Drift", icon: TrendingDown, color: "text-[#c45a4a]" },
  stalled_workflow: { label: "Stalled Workflow", icon: GitBranch, color: "text-[#8b7ac8]" },
  handoff_failure: { label: "Handoff Failure", icon: AlertTriangle, color: "text-rose-400" },
  status_conflict: { label: "Status Conflict", icon: AlertOctagon, color: "text-yellow-400" },
  readiness_blocker: { label: "Readiness Blocker", icon: Package, color: "text-[#4a90b8]" },
  pipeline_hygiene: { label: "Pipeline Hygiene", icon: Filter, color: "text-cyan-400" },
};

const STATE_TRANSITIONS: Record<ActionState, ActionState[]> = {
  new: ["acknowledged", "dismissed"],
  acknowledged: ["assigned", "escalated"],
  assigned: ["escalated", "resolved"],
  escalated: ["resolved"],
  resolved: [],
  dismissed: [],
};

const STATE_COLORS: Record<ActionState, string> = {
  new: "bg-[#4a90b8]/15 text-[#4a90b8] border-[#4a90b8]/30",
  acknowledged: "bg-[#d4a054]/15 text-[#d4a054] border-[#d4a054]/30",
  assigned: "bg-[#8b7ac8]/15 text-[#8b7ac8] border-purple-500/30",
  escalated: "bg-[#c45a4a]/15 text-[#c45a4a] border-[#c45a4a]/30",
  resolved: "bg-[#6b8f71]/15 text-[#6b8f71] border-[#6b8f71]/30",
  dismissed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const ROLE_KPI_CONFIG: Record<Role, { kpis: string[]; defaultSort: string; label: string; accent: string }> = {
  executive: {
    kpis: ["Value at Risk", "Escalations", "SLA Breaches", "Resolution Rate"],
    defaultSort: "valueAtRisk",
    label: "Executive View",
    accent: "text-[#d4a054]",
  },
  operations: {
    kpis: ["Open Actions", "Avg Age (hrs)", "Assigned", "Stalled Workflows"],
    defaultSort: "createdAt",
    label: "Operations View",
    accent: "text-sky-400",
  },
  delivery: {
    kpis: ["Readiness Blockers", "Ownership Gaps", "Pipeline Issues", "Pending Handoffs"],
    defaultSort: "priority",
    label: "Delivery View",
    accent: "text-[#6b8f71]",
  },
};

interface DemoAction {
  id: number;
  title: string;
  description: string;
  signalCategory: string;
  state: ActionState;
  priority: string;
  owner: string;
  assignedTo?: string;
  valueAtRisk?: string;
  createdAt: string;
  dueDate: string;
  workflowStage: string;
  roleVisibility: Partial<Record<Role, boolean>>;
  evidence: EvidenceItem[];
  auditHistory: AuditHistoryEntry[];
}

const DEMO_ACTIONS: DemoAction[] = [
  {
    id: 1, title: "Northgate Contract — Legal Review Stalled", description: "Contract stuck in legal queue 48h past SLA. $840K ARR at risk.",
    signalCategory: "approval_latency", state: "new", priority: "urgent", owner: "Jordan Alvarez", valueAtRisk: "840000",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 4 * 3600000).toISOString(),
    workflowStage: "Legal Review",
    roleVisibility: { executive: true, operations: true },
    evidence: [
      { id: "e1a", label: "Queue Dwell Time", value: "48h 12m", source: "workflow-engine / approval-svc", confidence: 0.98 },
      { id: "e1b", label: "SLA Threshold", value: "24h", source: "ops-policy/contracts-v2", confidence: 1.0 },
      { id: "e1c", label: "Last Reviewer Action", value: "Opened — 48h ago", source: "legal-portal audit log" },
      { id: "e1d", label: "ARR at Risk", value: "$840,000", source: "crm/opportunity #NG-2241", confidence: 0.95 },
    ],
    auditHistory: [
      { id: "ah1a", action: "Signal surfaced", actor: "alloy-signal-engine", actorType: "agent", timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
      { id: "ah1b", action: "Routed to Jordan Alvarez", actor: "routing-policy/contracts", actorType: "agent", timestamp: new Date(Date.now() - 47 * 3600000).toISOString() },
      { id: "ah1c", action: "Viewed", actor: "jordan.alvarez@szl.com", actorType: "user", timestamp: new Date(Date.now() - 46 * 3600000).toISOString() },
    ],
  },
  {
    id: 2, title: "TechCorp Onboarding — No Owner Assigned", description: "Critical onboarding step has been unassigned for 6 days.",
    signalCategory: "ownership_gap", state: "acknowledged", priority: "high", owner: "Marcus Webb", valueAtRisk: "320000",
    createdAt: new Date(Date.now() - 144 * 3600000).toISOString(),
    dueDate: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    workflowStage: "Onboarding",
    roleVisibility: { operations: true, delivery: true },
    evidence: [
      { id: "e2a", label: "Step Unassigned Since", value: "6d 2h", source: "onboarding-orchestrator", confidence: 1.0 },
      { id: "e2b", label: "Milestone Blocked", value: "Integration Config", source: "project-tracker #TC-891" },
      { id: "e2c", label: "Customer Health Risk", value: "High — NPS drop expected", source: "cs-health-model v3", confidence: 0.81 },
    ],
    auditHistory: [
      { id: "ah2a", action: "Ownership gap detected", actor: "ownership-watcher", actorType: "agent", timestamp: new Date(Date.now() - 144 * 3600000).toISOString() },
      { id: "ah2b", action: "Acknowledged", actor: "marcus.webb@szl.com", actorType: "user", timestamp: new Date(Date.now() - 96 * 3600000).toISOString(), notes: "Investigating re-assignment options" },
    ],
  },
  {
    id: 3, title: "Q2 Revenue Forecast — 18% Drift Detected", description: "Forecast model shows significant deviation from plan.",
    signalCategory: "forecast_drift", state: "new", priority: "urgent", owner: "Sarah Kim", valueAtRisk: "2100000",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 12 * 3600000).toISOString(),
    workflowStage: "Finance Review",
    roleVisibility: { executive: true },
    evidence: [
      { id: "e3a", label: "Plan vs Forecast Delta", value: "-18.3%", source: "finance-model/q2-2026-v14", confidence: 0.91 },
      { id: "e3b", label: "Primary Driver", value: "Northgate + 3 mid-market slips", source: "revenue-attribution-engine" },
      { id: "e3c", label: "ARR Impact", value: "$2.1M", source: "crm-pipeline rollup", confidence: 0.87 },
    ],
    auditHistory: [
      { id: "ah3a", action: "Drift threshold exceeded (>15%)", actor: "forecast-monitor", actorType: "agent", timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
      { id: "ah3b", action: "Escalated to Sarah Kim", actor: "routing-policy/finance", actorType: "agent", timestamp: new Date(Date.now() - 11 * 3600000).toISOString() },
    ],
  },
  {
    id: 4, title: "Vendor Onboarding Pipeline — 3 Stalled", description: "Three vendor workflows stuck at compliance check for 5+ days.",
    signalCategory: "stalled_workflow", state: "assigned", priority: "high", owner: "Riley Torres", assignedTo: "Compliance Team", valueAtRisk: "180000",
    createdAt: new Date(Date.now() - 120 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 24 * 3600000).toISOString(),
    workflowStage: "Compliance Check",
    roleVisibility: { operations: true, delivery: true },
    evidence: [
      { id: "e4a", label: "Stalled Vendors", value: "Nexus Corp, Dataplex, Orion Supply", source: "vendor-pipeline-tracker" },
      { id: "e4b", label: "Average Stall Duration", value: "5.4 days", source: "workflow-analytics", confidence: 0.99 },
      { id: "e4c", label: "Blocker", value: "Missing SOC 2 attestation", source: "compliance-gate-engine" },
    ],
    auditHistory: [
      { id: "ah4a", action: "Stall detected (>4d threshold)", actor: "workflow-watchdog", actorType: "agent", timestamp: new Date(Date.now() - 120 * 3600000).toISOString() },
      { id: "ah4b", action: "Assigned to Compliance Team", actor: "riley.torres@szl.com", actorType: "user", timestamp: new Date(Date.now() - 100 * 3600000).toISOString() },
      { id: "ah4c", action: "Compliance review initiated", actor: "compliance@szl.com", actorType: "user", timestamp: new Date(Date.now() - 80 * 3600000).toISOString(), notes: "Requested docs from vendors" },
    ],
  },
  {
    id: 5, title: "Apex Logistics — Handoff Failure at Delivery", description: "Customer success handoff failed; no confirmation from delivery lead.",
    signalCategory: "handoff_failure", state: "escalated", priority: "urgent", owner: "Alex Chen", valueAtRisk: "560000",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    dueDate: new Date(Date.now() - 4 * 3600000).toISOString(),
    workflowStage: "Customer Handoff",
    roleVisibility: { executive: true, operations: true, delivery: true },
    evidence: [
      { id: "e5a", label: "Handoff Trigger", value: "Deal closed 2026-04-15", source: "crm/opportunity #APX-1104" },
      { id: "e5b", label: "Confirmation Status", value: "No ACK from delivery lead", source: "handoff-orchestrator" },
      { id: "e5c", label: "Customer Tenure", value: "Enterprise — 3 years", source: "account-db", confidence: 1.0 },
    ],
    auditHistory: [
      { id: "ah5a", action: "Handoff initiated", actor: "crm-trigger/deal-closed", actorType: "agent", timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
      { id: "ah5b", action: "ACK timeout (4h)", actor: "handoff-orchestrator", actorType: "agent", timestamp: new Date(Date.now() - 20 * 3600000).toISOString() },
      { id: "ah5c", action: "Escalated", actor: "alex.chen@szl.com", actorType: "user", timestamp: new Date(Date.now() - 18 * 3600000).toISOString(), notes: "No response from delivery lead; escalating to VP" },
    ],
  },
  {
    id: 6, title: "Enterprise Deal Status Conflict", description: "CRM shows 'Closed Won' but finance hasn't received PO. $1.2M at stake.",
    signalCategory: "status_conflict", state: "new", priority: "high", owner: "Morgan Lee", valueAtRisk: "1200000",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 48 * 3600000).toISOString(),
    workflowStage: "Finance Reconciliation",
    roleVisibility: { executive: true, operations: true },
    evidence: [
      { id: "e6a", label: "CRM Status", value: "Closed Won (2026-04-16)", source: "salesforce/opp #ENT-7721" },
      { id: "e6b", label: "Finance PO Status", value: "Not received", source: "finance-erp/payables" },
      { id: "e6c", label: "Contract Value", value: "$1,200,000 ARR", source: "contracts-db #CTR-2241" },
      { id: "e6d", label: "Conflict Duration", value: "4h 12m", source: "reconciliation-engine", confidence: 0.99 },
    ],
    auditHistory: [
      { id: "ah6a", action: "Status discrepancy detected", actor: "reconciliation-cron", actorType: "agent", timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
      { id: "ah6b", action: "Assigned to Morgan Lee", actor: "ops-routing", actorType: "agent", timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString() },
    ],
  },
  {
    id: 7, title: "Platform Launch — 3 Gates Not Cleared", description: "Missing security review, load test sign-off, and legal clearance.",
    signalCategory: "readiness_blocker", state: "assigned", priority: "high", owner: "Sam Park", assignedTo: "Launch Team", valueAtRisk: "450000",
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 72 * 3600000).toISOString(),
    workflowStage: "Launch Gate Review",
    roleVisibility: { operations: true, delivery: true },
    evidence: [
      { id: "e7a", label: "Pending Gates", value: "Security Review, Load Test, Legal", source: "launch-gate-engine" },
      { id: "e7b", label: "Launch Target", value: "2026-04-19", source: "project-tracker/launch-v3" },
      { id: "e7c", label: "Impacted ARR", value: "$450K (first-month)", source: "finance-model", confidence: 0.82 },
    ],
    auditHistory: [
      { id: "ah7a", action: "Gate blockers flagged", actor: "launch-readiness-engine", actorType: "agent", timestamp: new Date(Date.now() - 36 * 3600000).toISOString() },
      { id: "ah7b", action: "Assigned to Launch Team", actor: "sam.park@szl.com", actorType: "user", timestamp: new Date(Date.now() - 30 * 3600000).toISOString() },
      { id: "ah7c", action: "Security review scheduled", actor: "security@szl.com", actorType: "user", timestamp: new Date(Date.now() - 20 * 3600000).toISOString() },
    ],
  },
  {
    id: 8, title: "Pipeline Hygiene — 47 Stale Opportunities", description: "Deals last touched >30 days consuming forecast capacity.",
    signalCategory: "pipeline_hygiene", state: "new", priority: "medium", owner: "Jordan Alvarez", valueAtRisk: "890000",
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    dueDate: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
    workflowStage: "Sales Ops Review",
    roleVisibility: { executive: true, operations: true },
    evidence: [
      { id: "e8a", label: "Stale Opportunity Count", value: "47", source: "crm-hygiene-scanner", confidence: 1.0 },
      { id: "e8b", label: "Avg Days Since Touch", value: "38.4 days", source: "crm-analytics" },
      { id: "e8c", label: "Forecast Distortion", value: "$890K inflated pipeline", source: "forecast-quality-engine", confidence: 0.88 },
    ],
    auditHistory: [
      { id: "ah8a", action: "Hygiene scan completed", actor: "crm-hygiene-scanner", actorType: "agent", timestamp: new Date(Date.now() - 72 * 3600000).toISOString() },
      { id: "ah8b", action: "Report generated and queued", actor: "ops-reporting", actorType: "agent", timestamp: new Date(Date.now() - 71 * 3600000).toISOString() },
    ],
  },
];

function formatCurrency(val: string | number | null | undefined): string {
  if (!val) return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

function getAgeHours(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000);
}

export default function ActionQueuePage() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role>("operations");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const IS_DEMO = import.meta.env.VITE_IS_DEMO === "true";

  const { data: rawActions } = useQuery<any[]>({
    queryKey: ["lyte-actions", role],
    queryFn: async () => {
      const json = await apiFetch<{ data: any[] } | any[]>(`/lyte/actions?role=${role}`);
      return Array.isArray(json) ? json : ((json as { data: any[] }).data ?? []);
    },
    placeholderData: IS_DEMO ? DEMO_ACTIONS : undefined,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const actions: any[] = rawActions && rawActions.length > 0
    ? rawActions
    : (IS_DEMO ? DEMO_ACTIONS : []);

  const transition = useMutation({
    mutationFn: ({ id, state, assignedTo }: { id: number; state: string; assignedTo?: string }) =>
      apiFetch(`/lyte/actions/${id}`, { method: "PATCH", body: JSON.stringify({ state, assignedTo }) }),
    onSuccess: (_data, vars) => {
      toast.success(`Action transitioned to ${vars.state}`);
      queryClient.invalidateQueries({ queryKey: ["lyte-actions"] });
    },
    onError: () => toast.error("Failed to transition action"),
  });

  const cfg = ROLE_KPI_CONFIG[role];

  const filtered = actions.filter((a: any) => {
    if (stateFilter !== "all" && a.state !== stateFilter) return false;
    if (categoryFilter !== "all" && a.signalCategory !== categoryFilter) return false;
    const rv = a.roleVisibility as Record<string, boolean> | null | undefined;
    if (rv && !rv[role]) return false;
    return true;
  });

  const totalVAR = filtered.reduce((s: number, a: any) => s + (parseFloat(a.valueAtRisk) || 0), 0);
  const escalated = filtered.filter((a: any) => a.state === "escalated").length;
  const slaBreached = filtered.filter((a: any) => getAgeHours(a.createdAt) > 48 && !["resolved", "dismissed"].includes(a.state)).length;
  const resolved = filtered.filter((a: any) => a.state === "resolved").length;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#d4a054]" />
            Action Queue
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Business signals → state transitions → resolution</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            {(["executive", "operations", "delivery"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  role === r ? "bg-[#d4a054]/20 text-[#d4a054]" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                )}
              >
                {r === "executive" ? "Exec" : r === "operations" ? "Ops" : "Delivery"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Value at Risk", value: formatCurrency(totalVAR), color: "text-[#c45a4a]", bg: "bg-[#c45a4a]/5 border-[#c45a4a]/20" },
          { label: "Escalated", value: escalated, color: "text-[#c8953c]", bg: "bg-[#c8953c]/5 border-[#c8953c]/20" },
          { label: "SLA Breached", value: slaBreached, color: "text-[#d4a054]", bg: "bg-[#d4a054]/5 border-[#d4a054]/20" },
          { label: "Resolved", value: resolved, color: "text-[#6b8f71]", bg: "bg-[#6b8f71]/5 border-[#6b8f71]/20" },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={bg}>
            <CardContent className="p-4">
              <div className={`text-xs font-medium mb-1 ${color}`}>{label}</div>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{cfg.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-36 h-8 bg-zinc-900 border-zinc-700 text-zinc-300 text-sm">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All States</SelectItem>
            {["new", "acknowledged", "assigned", "escalated", "resolved"].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 h-8 bg-zinc-900 border-zinc-700 text-zinc-300 text-sm">
            <SelectValue placeholder="Signal Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(SIGNAL_CATEGORY_LABELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-500">
          <Filter className="w-3 h-3" />
          {filtered.length} actions
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
            No actions match the current filters.
          </div>
        )}
        {filtered.map((action: any) => {
          const catInfo = SIGNAL_CATEGORY_LABELS[action.signalCategory] || { label: action.signalCategory, icon: Zap, color: "text-zinc-400" };
          const CatIcon = catInfo.icon;
          const ageHours = getAgeHours(action.createdAt);
          const isOverdue = ageHours > 48 && !["resolved", "dismissed"].includes(action.state);
          const nextStates = STATE_TRANSITIONS[action.state as ActionState] || [];
          const isExpanded = expandedId === action.id;
          const evidence: EvidenceItem[] = action.evidence ?? [];
          const auditHistory: AuditHistoryEntry[] = action.auditHistory ?? [];

          return (
            <Card key={action.id} className={cn(
              "border transition-all",
              action.priority === "urgent" ? "border-[#c45a4a]/30 bg-[#c45a4a]/3" :
              action.priority === "high" ? "border-[#c8953c]/20 bg-[#c8953c]/3" :
              "border-zinc-800 bg-zinc-900/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={STATE_COLORS[action.state as ActionState] || ""}>
                        {action.state}
                      </Badge>
                      <div className={`flex items-center gap-1 text-[10px] font-medium ${catInfo.color}`}>
                        <CatIcon className="w-3 h-3" />
                        {catInfo.label}
                      </div>
                      {isOverdue && (
                        <Badge variant="outline" className="bg-[#c45a4a]/10 text-[#c45a4a] border-[#c45a4a]/30 text-[10px]">
                          ⚠ SLA BREACHED ({ageHours}h)
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{action.title}</div>
                    <div className="text-xs text-zinc-400 mb-2">{action.description}</div>
                    <div className="flex items-center flex-wrap gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{action.owner}</span>
                      {action.assignedTo && <span className="flex items-center gap-1"><Users className="w-3 h-3" />→ {action.assignedTo}</span>}
                      {action.valueAtRisk && <span className="flex items-center gap-1 text-[#d4a054]"><BarChart3 className="w-3 h-3" />{formatCurrency(action.valueAtRisk)} VAR</span>}
                      {action.workflowStage && (
                        <span className="flex items-center gap-1 px-1.5 py-px rounded font-mono text-[9px]" style={{ color: "#8b7ac8", background: "rgba(139,122,200,0.08)", border: "1px solid rgba(139,122,200,0.18)" }}>
                          {action.workflowStage}
                        </span>
                      )}
                      {action.dueDate && (() => {
                        const due = new Date(action.dueDate);
                        const isPast = due < new Date();
                        const hoursUntil = Math.round((due.getTime() - Date.now()) / 3600000);
                        const label = isPast
                          ? `Overdue ${Math.abs(hoursUntil)}h`
                          : hoursUntil < 24
                            ? `Due in ${hoursUntil}h`
                            : `Due ${due.toLocaleDateString([], { month: "short", day: "numeric" })}`;
                        return (
                          <span className={`flex items-center gap-1 ${isPast ? "text-[#c45a4a]" : hoursUntil < 12 ? "text-[#c8953c]" : "text-zinc-500"}`}>
                            <Calendar className="w-3 h-3" />
                            {label}
                          </span>
                        );
                      })()}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ageHours}h old</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(evidence.length > 0 || auditHistory.length > 0) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                        onClick={() => setExpandedId(isExpanded ? null : action.id)}
                        title={isExpanded ? "Hide evidence" : "Show evidence & audit trail"}
                      >
                        <FileSearch className="w-3 h-3 mr-1" />
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </Button>
                    )}
                    {nextStates.map((nextState) => (
                      <Button
                        key={nextState}
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-7 px-2.5 text-[10px] capitalize",
                          nextState === "escalated" ? "border-[#c45a4a]/30 text-[#c45a4a] hover:bg-[#c45a4a]/10" :
                          nextState === "resolved" ? "border-[#6b8f71]/30 text-[#6b8f71] hover:bg-[#6b8f71]/10" :
                          "border-[#d4a054]/30 text-[#d4a054] hover:bg-[#d4a054]/10"
                        )}
                        onClick={() => transition.mutate({ id: action.id, state: nextState })}
                        disabled={transition.isPending}
                      >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        {nextState}
                      </Button>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="mt-4 pt-4 grid gap-4"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      gridTemplateColumns: evidence.length > 0 && auditHistory.length > 0 ? "1fr 1fr" : "1fr",
                    }}
                  >
                    {evidence.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Signal Provenance</p>
                        <OperationalEvidencePanel items={evidence} compact />
                      </div>
                    )}
                    {auditHistory.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Audit Trail</p>
                        <OperationalAuditTimeline entries={auditHistory} compact maxEntries={5} />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
