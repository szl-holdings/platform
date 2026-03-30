import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, CheckSquare, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Circle, Clock, Loader2, Calendar, TrendingUp, FileSearch, Users, AlertCircle,
  ArrowRight, ChevronRight, Building2, Globe, Map,
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts?.headers ?? {}) },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return (json.data ?? json) as T;
}

interface CertProgram {
  id: number; slug: string; name: string; shortName?: string;
  programType: string; description?: string;
  requiresAttorneyReview: boolean; requiresCpaReview: boolean;
  status?: CertStatus | null;
  openTasks?: number; completedTasks?: number; totalTasks?: number;
}
interface CertStatus {
  id: number; programId: number; overallStatus: string; readinessScore: number;
  appliedAt?: string; approvedAt?: string; expiresAt?: string; notes?: string;
}
interface CertTask {
  id: number; programId: number; title: string; description?: string;
  taskType: string; priority: string; status: string;
  dueDate?: string; flagsReview: boolean; reviewType?: string; notes?: string;
}
interface CertRequirement {
  id: number; title: string; description?: string; category: string;
  isRequired: boolean; requiresReview: boolean; reviewType: string;
}
interface OwnershipScenario {
  id: number; scenarioName: string; description?: string;
  requiresAttorneyReview: boolean; requiresCpaReview: boolean;
  status: string; legalDisclaimerAcknowledged: boolean;
  flaggedIssues?: unknown; programEligibilityJson?: unknown;
}
interface Opportunity {
  id: number; title: string; opportunityType: string; source: string;
  agencyName?: string; estimatedValue?: string; dueDate?: string;
  status: string; fitScore?: number; naicsCodes?: unknown;
  setAsideType?: string; requiredCertifications?: unknown;
}
interface CalendarEvent {
  id: number; programId?: number; title: string; eventType: string;
  eventDate: string; status: string; reminderDays: number; notes?: string;
}
interface CertDashboard {
  programs: CertProgram[];
  upcomingDeadlines: CalendarEvent[];
  overdueTasks: CertTask[];
  trackingOpportunities: number;
  totalOpenTasks: number;
  flaggedForReview: number;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "#6b7280", assessing: "#f59e0b", preparing: "#3b82f6",
  applied: "#6366f1", in_review: "#8b5cf6", approved: "#10b981",
  denied: "#ef4444", renewal_due: "#f97316", expired: "#ef4444", withdrawn: "#6b7280",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#6b7280",
};

const PROGRAM_COLORS: Record<string, string> = {
  "ny-mwbe": "#c9a96e", "wosb-edwosb": "#3b82f6", "vosb-sdvosb": "#10b981",
  "sba-8a": "#8b5cf6", "sam-registration": "#06b6d4",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0" style={{ background: `${color}18`, color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function TaskRow({ task }: { task: CertTask }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const priorityColor = PRIORITY_COLORS[task.priority] ?? "#6b7280";
  const statusIcon = task.status === "complete"
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
    : task.status === "in_progress"
    ? <Clock className="w-4 h-4 text-amber-500 shrink-0" />
    : task.status === "blocked"
    ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
    : <Circle className="w-4 h-4 text-border shrink-0" />;

  const mut = useMutation({
    mutationFn: (status: string) => apiFetch(`/certification/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cert-tasks"] }),
  });

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "complete";

  return (
    <div className={cn("border rounded-lg overflow-hidden", isOverdue ? "border-red-500/30" : "border-border")}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <button onClick={e => { e.stopPropagation(); const next = task.status === "open" ? "in_progress" : task.status === "in_progress" ? "complete" : "open"; mut.mutate(next); }}>
          {statusIcon}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn("text-xs font-medium", task.status === "complete" ? "line-through text-muted-foreground" : "text-foreground")}>{task.title}</p>
            {task.flagsReview && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
          </div>
          {task.dueDate && (
            <p className={cn("text-[10px] mt-0.5", isOverdue ? "text-red-500" : "text-muted-foreground")}>
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${priorityColor}18`, color: priorityColor }}>
            {task.priority}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 space-y-2 bg-muted/10 border-t border-border">
              {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
              {task.flagsReview && (
                <div className="flex items-start gap-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-600">Requires {task.reviewType ?? "professional"} review before proceeding. Not a legal or financial conclusion.</p>
                </div>
              )}
              {task.notes && <p className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5">{task.notes}</p>}
              <div className="flex gap-2">
                {["open", "in_progress", "blocked", "complete", "na"].map(s => (
                  <button
                    key={s}
                    onClick={() => mut.mutate(s)}
                    className={cn("text-[10px] px-2 py-1 rounded transition-colors", task.status === s ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground")}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgramCard({ program, onSelect }: { program: CertProgram; onSelect: () => void }) {
  const accentColor = PROGRAM_COLORS[program.slug] ?? "#6b7280";
  const statusColor = STATUS_COLORS[program.status?.overallStatus ?? "not_started"] ?? "#6b7280";
  const score = program.status?.readinessScore ?? 0;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:bg-muted/20 transition-colors space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
            <p className="text-sm font-semibold text-foreground">{program.name}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{program.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={program.status?.overallStatus ?? "not_started"} />
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Readiness</span>
          <span className="text-xs font-semibold" style={{ color: statusColor }}>{score}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: accentColor }} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {program.requiresAttorneyReview && (
          <span className="text-[10px] flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" /> Attorney Review</span>
        )}
        {program.requiresCpaReview && (
          <span className="text-[10px] flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" /> CPA Review</span>
        )}
        {program.totalTasks != null && program.totalTasks > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">{program.completedTasks}/{program.totalTasks} tasks</span>
        )}
      </div>
    </button>
  );
}

function ProgramDetail({ program }: { program: CertProgram }) {
  const { data: detail } = useQuery<CertProgram & { requirements: CertRequirement[]; tasks: CertTask[] }>({
    queryKey: ["cert-program-detail", program.id],
    queryFn: () => apiFetch(`/certification/programs/${program.id}`),
  });

  const qc = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: ({ status }: { status: string }) => apiFetch(`/certification/status/${program.status?.id}`, { method: "PATCH", body: JSON.stringify({ overallStatus: status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cert-dashboard"] }); qc.invalidateQueries({ queryKey: ["cert-program-detail", program.id] }); },
  });

  const [tab, setTab] = useState<"requirements" | "tasks">("requirements");
  const accentColor = PROGRAM_COLORS[program.slug] ?? "#6b7280";

  const STATUS_OPTIONS = ["not_started", "assessing", "preparing", "applied", "in_review", "approved", "denied", "renewal_due", "withdrawn"];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">{program.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{program.description}</p>
          </div>
          <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: accentColor }} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Status:</span>
          <select
            value={program.status?.overallStatus ?? "not_started"}
            onChange={e => program.status?.id && updateStatus.mutate({ status: e.target.value })}
            className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          {updateStatus.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>

        {(program.requiresAttorneyReview || program.requiresCpaReview) && (
          <div className="mt-3 flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600">
              This program requires {[program.requiresAttorneyReview && "attorney", program.requiresCpaReview && "CPA"].filter(Boolean).join(" and ")} review. Flagged items require professional consultation — this module does not auto-conclude eligibility.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {(["requirements", "tasks"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", tab === t ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground")}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "requirements" && (
        <div className="space-y-2">
          {(detail?.requirements ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No requirements configured.</p>
          ) : (detail?.requirements ?? []).map(req => (
            <div key={req.id} className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground">{req.title}</p>
                    {req.requiresReview && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                  </div>
                  {req.description && <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">{req.category}</span>
                    {req.isRequired && <span className="text-[10px] text-muted-foreground">Required</span>}
                    {req.requiresReview && <span className="text-[10px] text-amber-600">{req.reviewType} review required</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-2">
          {(detail?.tasks ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No tasks configured.</p>
          ) : (detail?.tasks ?? []).map(task => <TaskRow key={task.id} task={task} />)}
        </div>
      )}
    </div>
  );
}

function OwnershipScenarioPlanner() {
  const { data: scenarios = [], isLoading } = useQuery<OwnershipScenario[]>({
    queryKey: ["ownership-scenarios"],
    queryFn: () => apiFetch("/certification/ownership-scenarios"),
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Ownership / Control Scenario Planner</p>
        <p className="text-xs text-muted-foreground mt-0.5">Internal decision matrix for evaluating how ownership structures affect certification eligibility. Does not auto-conclude legal eligibility.</p>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">Legal Disclaimer: Ownership and control analysis for certification eligibility is a legal determination. This planner is for internal decision support only. All scenarios flagged for review require consultation with qualified legal counsel before any certification application is submitted.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Loading scenarios...</span></div>
      ) : scenarios.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Map className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No ownership scenarios yet</p>
          <p className="text-xs text-muted-foreground mt-1">Ownership scenarios are added via the API or admin panel when evaluating certification eligibility.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.scenarioName}</p>
                  {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                </div>
                <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded shrink-0", s.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground")}>
                  {s.status}
                </span>
              </div>
              {(s.requiresAttorneyReview || s.requiresCpaReview) && (
                <div className="flex items-center gap-2">
                  {s.requiresAttorneyReview && <span className="text-[10px] flex items-center gap-1 text-amber-600 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1"><AlertTriangle className="w-3 h-3" />Attorney review required</span>}
                  {s.requiresCpaReview && <span className="text-[10px] flex items-center gap-1 text-amber-600 bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1"><AlertTriangle className="w-3 h-3" />CPA review required</span>}
                </div>
              )}
              {!s.legalDisclaimerAcknowledged && (
                <p className="text-[10px] text-red-500">Legal disclaimer not yet acknowledged</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunityTracker() {
  const { data: opportunities = [], isLoading } = useQuery<Opportunity[]>({
    queryKey: ["cert-opportunities"],
    queryFn: () => apiFetch("/certification/opportunities"),
  });
  const [filter, setFilter] = useState("all");

  const statusColors: Record<string, string> = {
    tracking: "#3b82f6", qualifying: "#f59e0b", pursuing: "#8b5cf6",
    submitted: "#6366f1", awarded: "#10b981", lost: "#ef4444", no_bid: "#6b7280",
  };

  const filtered = filter === "all" ? opportunities : opportunities.filter(o => o.status === filter);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Procurement Opportunity Tracker</p>
        <p className="text-xs text-muted-foreground mt-0.5">NY state and federal procurement opportunities with fit scores</p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {["all", "tracking", "qualifying", "pursuing", "submitted"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-colors", filter === s ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground")}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No opportunities tracked</p>
          <p className="text-xs text-muted-foreground mt-1">Add procurement opportunities to track fit and deadlines.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(opp => {
            const color = statusColors[opp.status] ?? "#6b7280";
            const isOverdue = opp.dueDate && new Date(opp.dueDate) < new Date();
            return (
              <div key={opp.id} className={cn("bg-card border rounded-xl p-4", isOverdue ? "border-red-500/30" : "border-border")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{opp.title}</p>
                    {opp.agencyName && <p className="text-xs text-muted-foreground mt-0.5">{opp.agencyName}</p>}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{opp.source.replace(/_/g, " ").toUpperCase()}</span>
                      {opp.setAsideType && <span className="text-[10px] text-muted-foreground">{opp.setAsideType}</span>}
                      {opp.estimatedValue && <span className="text-[10px] text-muted-foreground">{opp.estimatedValue}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: `${color}18`, color }}>{opp.status}</span>
                    {opp.fitScore != null && (
                      <span className="text-xs font-semibold" style={{ color }}>Fit: {opp.fitScore}/10</span>
                    )}
                  </div>
                </div>
                {opp.dueDate && (
                  <p className={cn("text-xs mt-2", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                    Due: {new Date(opp.dueDate).toLocaleDateString()} {isOverdue ? "(OVERDUE)" : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type CertTab = "dashboard" | "programs" | "ownership" | "calendar" | "opportunities";

export function CertificationReadinessOS() {
  const [activeTab, setActiveTab] = useState<CertTab>("dashboard");
  const [selectedProgram, setSelectedProgram] = useState<CertProgram | null>(null);

  const { data: dashboard, isLoading: dashLoading } = useQuery<CertDashboard>({
    queryKey: ["cert-dashboard"],
    queryFn: () => apiFetch("/certification/dashboard"),
  });

  const { data: allTasks = [] } = useQuery<CertTask[]>({
    queryKey: ["cert-tasks"],
    queryFn: () => apiFetch("/certification/tasks"),
    enabled: activeTab === "dashboard" || activeTab === "programs",
  });

  const { data: calendar = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["cert-calendar"],
    queryFn: () => apiFetch("/certification/calendar"),
    enabled: activeTab === "calendar",
  });

  const TABS: { id: CertTab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: Shield },
    { id: "programs", label: "Programs", icon: CheckSquare },
    { id: "ownership", label: "Ownership", icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "opportunities", label: "Opportunities", icon: Globe },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Certification & Procurement Readiness OS
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">NY MWBE, WOSB/EDWOSB, VOSB/SDVOSB, 8(a), SAM — readiness and decision support only.</p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedProgram(null); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeTab === tab.id ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-5">
          {dashLoading ? (
            <div className="flex items-center gap-2 py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Open Tasks", value: dashboard?.totalOpenTasks ?? 0, color: "#3b82f6" },
                  { label: "Flagged for Review", value: dashboard?.flaggedForReview ?? 0, color: "#f59e0b" },
                  { label: "Tracking Opps", value: dashboard?.trackingOpportunities ?? 0, color: "#10b981" },
                ].map(m => (
                  <div key={m.label} className="bg-card border border-border rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {(dashboard?.overdueTasks ?? []).length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Overdue Tasks ({dashboard!.overdueTasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {dashboard!.overdueTasks.slice(0, 3).map(t => (
                      <p key={t.id} className="text-xs text-foreground">{t.title}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Certification Programs</p>
                {(dashboard?.programs ?? []).map(p => (
                  <ProgramCard key={p.id} program={p} onSelect={() => { setSelectedProgram(p); setActiveTab("programs"); }} />
                ))}
              </div>

              {(dashboard?.upcomingDeadlines ?? []).length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming Deadlines</p>
                  <div className="space-y-2.5">
                    {dashboard!.upcomingDeadlines.map(e => (
                      <div key={e.id} className="flex items-center gap-3">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{e.title}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(e.eventDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "programs" && (
        <div className="space-y-4">
          {selectedProgram ? (
            <div className="space-y-4">
              <button onClick={() => setSelectedProgram(null)} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                ← Back to programs
              </button>
              <ProgramDetail program={selectedProgram} />
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboard?.programs ?? []).map(p => (
                <ProgramCard key={p.id} program={p} onSelect={() => setSelectedProgram(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ownership" && <OwnershipScenarioPlanner />}

      {activeTab === "calendar" && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Certification Calendar</p>
          {calendar.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground">No calendar events yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calendar.map(e => {
                const isPast = new Date(e.eventDate) < new Date();
                return (
                  <div key={e.id} className={cn("bg-card border rounded-xl p-4 flex items-start gap-3", isPast ? "border-red-500/20" : "border-border")}>
                    <Calendar className={cn("w-4 h-4 shrink-0 mt-0.5", isPast ? "text-red-500" : "text-muted-foreground")} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(e.eventDate).toLocaleDateString()} · {e.eventType.replace(/_/g, " ")}</p>
                      {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                    </div>
                    <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded shrink-0", e.status === "complete" ? "bg-emerald-500/10 text-emerald-600" : e.status === "overdue" || isPast ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary")}>
                      {e.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "opportunities" && <OpportunityTracker />}
    </div>
  );
}
