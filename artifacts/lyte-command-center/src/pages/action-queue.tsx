import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/shared-ui";
import { Card, CardContent } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Button } from "@workspace/shared-ui/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shared-ui/ui/select";
import {
  CheckSquare, User, AlertOctagon, TrendingDown, GitBranch, Clock, AlertTriangle,
  ArrowRight, Filter, Zap, Users, BarChart3, Package
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@workspace/shared-ui/utils";

type Role = "executive" | "operations" | "delivery";
type ActionState = "new" | "acknowledged" | "assigned" | "escalated" | "resolved" | "dismissed";

const SIGNAL_CATEGORY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  approval_latency: { label: "Approval Latency", icon: Clock, color: "text-amber-400" },
  ownership_gap: { label: "Ownership Gap", icon: User, color: "text-orange-400" },
  forecast_drift: { label: "Forecast Drift", icon: TrendingDown, color: "text-red-400" },
  stalled_workflow: { label: "Stalled Workflow", icon: GitBranch, color: "text-purple-400" },
  handoff_failure: { label: "Handoff Failure", icon: AlertTriangle, color: "text-rose-400" },
  status_conflict: { label: "Status Conflict", icon: AlertOctagon, color: "text-yellow-400" },
  readiness_blocker: { label: "Readiness Blocker", icon: Package, color: "text-blue-400" },
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
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  acknowledged: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  assigned: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  escalated: "bg-red-500/15 text-red-400 border-red-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  dismissed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const ROLE_KPI_CONFIG: Record<Role, { kpis: string[]; defaultSort: string; label: string; accent: string }> = {
  executive: {
    kpis: ["Value at Risk", "Escalations", "SLA Breaches", "Resolution Rate"],
    defaultSort: "valueAtRisk",
    label: "Executive View",
    accent: "text-amber-400",
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
    accent: "text-emerald-400",
  },
};

const DEMO_ACTIONS = [
  {
    id: 1, title: "Northgate Contract — Legal Review Stalled", description: "Contract stuck in legal queue 48h past SLA. $840K ARR at risk.",
    signalCategory: "approval_latency", state: "new", priority: "urgent", owner: "Jordan Alvarez", valueAtRisk: "840000",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(), roleVisibility: { executive: true, operations: true },
  },
  {
    id: 2, title: "TechCorp Onboarding — No Owner Assigned", description: "Critical onboarding step has been unassigned for 6 days.",
    signalCategory: "ownership_gap", state: "acknowledged", priority: "high", owner: "Marcus Webb", valueAtRisk: "320000",
    createdAt: new Date(Date.now() - 144 * 3600000).toISOString(), roleVisibility: { operations: true, delivery: true },
  },
  {
    id: 3, title: "Q2 Revenue Forecast — 18% Drift Detected", description: "Forecast model shows significant deviation from plan.",
    signalCategory: "forecast_drift", state: "new", priority: "urgent", owner: "Sarah Kim", valueAtRisk: "2100000",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), roleVisibility: { executive: true },
  },
  {
    id: 4, title: "Vendor Onboarding Pipeline — 3 Stalled", description: "Three vendor workflows stuck at compliance check for 5+ days.",
    signalCategory: "stalled_workflow", state: "assigned", priority: "high", owner: "Riley Torres", assignedTo: "Compliance Team", valueAtRisk: "180000",
    createdAt: new Date(Date.now() - 120 * 3600000).toISOString(), roleVisibility: { operations: true, delivery: true },
  },
  {
    id: 5, title: "Apex Logistics — Handoff Failure at Delivery", description: "Customer success handoff failed; no confirmation from delivery lead.",
    signalCategory: "handoff_failure", state: "escalated", priority: "urgent", owner: "Alex Chen", valueAtRisk: "560000",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), roleVisibility: { executive: true, operations: true, delivery: true },
  },
  {
    id: 6, title: "Enterprise Deal Status Conflict", description: "CRM shows 'Closed Won' but finance hasn't received PO. $1.2M at stake.",
    signalCategory: "status_conflict", state: "new", priority: "high", owner: "Morgan Lee", valueAtRisk: "1200000",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), roleVisibility: { executive: true, operations: true },
  },
  {
    id: 7, title: "Platform Launch — 3 Gates Not Cleared", description: "Missing security review, load test sign-off, and legal clearance.",
    signalCategory: "readiness_blocker", state: "assigned", priority: "high", owner: "Sam Park", assignedTo: "Launch Team", valueAtRisk: "450000",
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), roleVisibility: { operations: true, delivery: true },
  },
  {
    id: 8, title: "Pipeline Hygiene — 47 Stale Opportunities", description: "Deals last touched >30 days consuming forecast capacity.",
    signalCategory: "pipeline_hygiene", state: "new", priority: "medium", owner: "Jordan Alvarez", valueAtRisk: "890000",
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(), roleVisibility: { executive: true, operations: true },
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

  const { data: rawActions } = useQuery({
    queryKey: ["lyte-actions", role],
    queryFn: () => apiFetch<any[]>(`/lyte/actions?role=${role}`),
    placeholderData: DEMO_ACTIONS as any,
  });

  const actions: any[] = (rawActions && Array.isArray(rawActions) && rawActions.length > 0) ? rawActions : DEMO_ACTIONS;

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
            <CheckSquare className="w-5 h-5 text-amber-400" />
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
                  role === r ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
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
          { label: "Value at Risk", value: formatCurrency(totalVAR), color: "text-red-400", bg: "bg-red-500/5 border-red-500/20" },
          { label: "Escalated", value: escalated, color: "text-orange-400", bg: "bg-orange-500/5 border-orange-500/20" },
          { label: "SLA Breached", value: slaBreached, color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/20" },
          { label: "Resolved", value: resolved, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/20" },
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

          return (
            <Card key={action.id} className={cn(
              "border transition-all",
              action.priority === "urgent" ? "border-red-500/30 bg-red-500/3" :
              action.priority === "high" ? "border-orange-500/20 bg-orange-500/3" :
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
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-[10px]">
                          ⚠ SLA BREACHED ({ageHours}h)
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{action.title}</div>
                    <div className="text-xs text-zinc-400 mb-2">{action.description}</div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{action.owner}</span>
                      {action.assignedTo && <span className="flex items-center gap-1"><Users className="w-3 h-3" />→ {action.assignedTo}</span>}
                      {action.valueAtRisk && <span className="flex items-center gap-1 text-amber-400"><BarChart3 className="w-3 h-3" />{formatCurrency(action.valueAtRisk)} VAR</span>}
                      <span>{ageHours}h old</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {nextStates.map((nextState) => (
                      <Button
                        key={nextState}
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-7 px-2.5 text-[10px] capitalize",
                          nextState === "escalated" ? "border-red-500/30 text-red-400 hover:bg-red-500/10" :
                          nextState === "resolved" ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" :
                          "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
