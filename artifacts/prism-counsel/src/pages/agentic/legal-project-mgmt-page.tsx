import { useState } from "react";
import { Layers, Clock, Users, BarChart3, CheckCircle, AlertTriangle, DollarSign, TrendingUp, Calendar, ChevronRight, ArrowRight } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface WBSItem {
  id: string;
  task: string;
  phase: string;
  assignee: string;
  hours: { estimated: number; actual: number };
  status: "complete" | "in-progress" | "pending" | "blocked";
  dueDate: string;
  budget: number;
  spent: number;
}

interface TeamMember {
  name: string;
  role: string;
  utilization: number;
  capacity: number;
  activMatters: number;
  billableTarget: number;
  billableActual: number;
}

const WBS: WBSItem[] = [
  { id: "WBS-001", task: "Document collection & preservation", phase: "Discovery", assignee: "James Whitfield", hours: { estimated: 40, actual: 32 }, status: "complete", dueDate: "2024-02-28", budget: 12_000, spent: 9_600 },
  { id: "WBS-002", task: "First-pass document review", phase: "Discovery", assignee: "Maria Rodriguez", hours: { estimated: 120, actual: 85 }, status: "in-progress", dueDate: "2024-03-15", budget: 36_000, spent: 25_500 },
  { id: "WBS-003", task: "Expert witness retention", phase: "Expert", assignee: "Sarah Chen", hours: { estimated: 20, actual: 12 }, status: "in-progress", dueDate: "2024-03-18", budget: 6_000, spent: 3_600 },
  { id: "WBS-004", task: "Deposition preparation — Plaintiff", phase: "Depositions", assignee: "Sarah Chen", hours: { estimated: 35, actual: 0 }, status: "pending", dueDate: "2024-03-25", budget: 10_500, spent: 0 },
  { id: "WBS-005", task: "Motion for Summary Judgment — Draft", phase: "Motions", assignee: "David Park", hours: { estimated: 60, actual: 15 }, status: "in-progress", dueDate: "2024-03-25", budget: 18_000, spent: 4_500 },
  { id: "WBS-006", task: "Mediation brief preparation", phase: "Settlement", assignee: "Sarah Chen", hours: { estimated: 25, actual: 0 }, status: "blocked", dueDate: "2024-04-05", budget: 7_500, spent: 0 },
  { id: "WBS-007", task: "Pre-trial statement & exhibit list", phase: "Trial Prep", assignee: "James Whitfield", hours: { estimated: 30, actual: 0 }, status: "pending", dueDate: "2024-04-15", budget: 9_000, spent: 0 },
  { id: "WBS-008", task: "Trial witness preparation", phase: "Trial Prep", assignee: "David Park", hours: { estimated: 45, actual: 0 }, status: "pending", dueDate: "2024-04-20", budget: 13_500, spent: 0 },
];

const TEAM: TeamMember[] = [
  { name: "Sarah Chen", role: "Senior Associate", utilization: 87, capacity: 160, activMatters: 8, billableTarget: 1_850, billableActual: 1_620 },
  { name: "David Park", role: "Associate", utilization: 92, capacity: 160, activMatters: 6, billableTarget: 1_950, billableActual: 1_780 },
  { name: "James Whitfield", role: "Senior Associate", utilization: 78, capacity: 160, activMatters: 7, billableTarget: 1_850, billableActual: 1_410 },
  { name: "Maria Rodriguez", role: "Associate", utilization: 95, capacity: 160, activMatters: 5, billableTarget: 1_950, billableActual: 1_880 },
  { name: "Alex Turner", role: "Paralegal", utilization: 82, capacity: 160, activMatters: 12, billableTarget: 1_600, billableActual: 1_350 },
];

const statusColor = (s: string) => s === "complete" ? "#22c55e" : s === "in-progress" ? PRISM_BLUE : s === "blocked" ? "#ef4444" : "rgba(255,255,255,0.2)";

export default function LegalProjectMgmtPage() {
  const [view, setView] = useState<"wbs" | "team">("wbs");

  const totalBudget = WBS.reduce((s, w) => s + w.budget, 0);
  const totalSpent = WBS.reduce((s, w) => s + w.spent, 0);
  const totalHoursEst = WBS.reduce((s, w) => s + w.hours.estimated, 0);
  const totalHoursAct = WBS.reduce((s, w) => s + w.hours.actual, 0);
  const completeTasks = WBS.filter(w => w.status === "complete").length;
  const blockedTasks = WBS.filter(w => w.status === "blocked").length;

  const fmt = (n: number) => n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white tracking-tight">Legal Project Management</h1>
          <p className="text-[11px] text-white/30 mt-1">Work breakdown, resource allocation, time tracking, and capacity forecasting</p>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total Budget", value: fmt(totalBudget), icon: DollarSign, color: PRISM_GOLD },
            { label: "Spent", value: fmt(totalSpent), icon: TrendingUp, color: PRISM_BLUE },
            { label: "Budget Remaining", value: `${Math.round((1 - totalSpent / totalBudget) * 100)}%`, icon: BarChart3, color: "#22c55e" },
            { label: "Hours (Est/Act)", value: `${totalHoursEst}/${totalHoursAct}`, icon: Clock, color: "white" },
            { label: "Tasks Complete", value: `${completeTasks}/${WBS.length}`, icon: CheckCircle, color: "#22c55e" },
            { label: "Blocked", value: blockedTasks.toString(), icon: AlertTriangle, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className="h-3 w-3" style={{ color: s.color }} />
                <span className="text-[8px] uppercase tracking-wider text-white/25">{s.label}</span>
              </div>
              <p className="text-lg font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(["wbs", "team"] as const).map(t => (
            <button key={t} onClick={() => setView(t)}
              aria-label={`Show ${t === "wbs" ? "Work Breakdown" : "Team & Capacity"} view`}
              className={`text-[10px] font-semibold uppercase tracking-wider rounded-lg px-4 py-2 transition ${view === t ? "text-white" : "text-white/25 hover:text-white/40"}`}
              style={view === t ? { background: PRISM_GOLD + "15", color: PRISM_GOLD } : {}}>
              {t === "wbs" ? "Work Breakdown" : "Team & Capacity"}
            </button>
          ))}
        </div>

        {view === "wbs" ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-12 gap-0 p-3 border-b border-white/[0.04]">
              <span className="col-span-4 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Task</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Phase</span>
              <span className="col-span-2 text-[8px] uppercase tracking-wider text-white/20 font-semibold">Assignee</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold text-right">Hours</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold text-right">Budget</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold text-right">Spent</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold text-center">Status</span>
              <span className="col-span-1 text-[8px] uppercase tracking-wider text-white/20 font-semibold text-right">Due</span>
            </div>
            {WBS.map(w => (
              <div key={w.id} className="grid grid-cols-12 gap-0 p-3 border-b border-white/[0.02] hover:bg-white/[0.015] transition items-center">
                <div className="col-span-4">
                  <p className="text-[10px] font-medium text-white">{w.task}</p>
                  <p className="text-[8px] font-mono text-white/15">{w.id}</p>
                </div>
                <span className="col-span-1 text-[9px] text-white/30">{w.phase}</span>
                <span className="col-span-2 text-[10px] text-white/40">{w.assignee}</span>
                <span className="col-span-1 text-[10px] text-white/40 text-right">{w.hours.actual}/{w.hours.estimated}</span>
                <span className="col-span-1 text-[10px] text-white/40 text-right">{fmt(w.budget)}</span>
                <span className="col-span-1 text-[10px] font-semibold text-right" style={{ color: w.spent > w.budget * 0.9 ? "#ef4444" : "white" }}>{fmt(w.spent)}</span>
                <div className="col-span-1 flex justify-center">
                  <span className="text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5" style={{ background: statusColor(w.status) + "15", color: statusColor(w.status) }}>{w.status.replace("-", " ")}</span>
                </div>
                <span className="col-span-1 text-[9px] text-white/25 text-right">{w.dueDate.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {TEAM.map(m => (
              <div key={m.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{m.name}</p>
                    <p className="text-[10px] text-white/30">{m.role} · {m.activMatters} active matters</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[8px] uppercase tracking-wider text-white/20">Utilization</p>
                      <p className="text-lg font-semibold" style={{ color: m.utilization > 90 ? "#ef4444" : m.utilization > 80 ? PRISM_GOLD : "#22c55e" }}>{m.utilization}%</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                    <p className="text-[8px] uppercase tracking-wider text-white/20 mb-0.5">Monthly Capacity</p>
                    <p className="text-[11px] font-semibold text-white">{m.capacity}h</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                    <p className="text-[8px] uppercase tracking-wider text-white/20 mb-0.5">Available</p>
                    <p className="text-[11px] font-semibold" style={{ color: m.capacity * (1 - m.utilization / 100) < 20 ? "#ef4444" : "#22c55e" }}>{Math.round(m.capacity * (1 - m.utilization / 100))}h</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                    <p className="text-[8px] uppercase tracking-wider text-white/20 mb-0.5">Billable Target</p>
                    <p className="text-[11px] font-semibold text-white">{m.billableTarget.toLocaleString()}h</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                    <p className="text-[8px] uppercase tracking-wider text-white/20 mb-0.5">YTD Billable</p>
                    <p className="text-[11px] font-semibold" style={{ color: m.billableActual / m.billableTarget >= 0.85 ? "#22c55e" : m.billableActual / m.billableTarget >= 0.7 ? PRISM_GOLD : "#ef4444" }}>{m.billableActual.toLocaleString()}h</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.utilization}%`, background: m.utilization > 90 ? "#ef4444" : m.utilization > 80 ? PRISM_GOLD : "#22c55e" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
