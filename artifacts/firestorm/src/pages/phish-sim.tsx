import { useState } from "react";
import { Mail, Play, Plus, BookOpen } from "lucide-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const RISK_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

interface Campaign {
  id: string;
  name: string;
  template: string;
  status: "active" | "completed" | "scheduled" | "draft";
  targetCount: number;
  sent: number;
  opened: number;
  clicked: number;
  reported: number;
  startDate: string;
  endDate?: string;
  riskCategory: "credential-harvest" | "malware-delivery" | "pretexting" | "vishing-prep";
}

interface Department {
  name: string;
  headcount: number;
  avgRiskScore: number;
  clickRate: number;
  trainingCompletion: number;
  trend: "improving" | "worsening" | "stable";
}

const CAMPAIGNS: Campaign[] = [
  { id: "C-001", name: "Q2 IT Help Desk Pretexting", template: "IT Support Password Reset", status: "active", targetCount: 340, sent: 340, opened: 198, clicked: 67, reported: 31, startDate: "Apr 10", riskCategory: "credential-harvest" },
  { id: "C-002", name: "Finance — DocuSign Spear Phish", template: "Urgent Wire Transfer Approval", status: "completed", targetCount: 42, sent: 42, opened: 39, clicked: 22, reported: 5, startDate: "Mar 15", endDate: "Mar 22", riskCategory: "pretexting" },
  { id: "C-003", name: "Executive — CEO Fraud Simulation", template: "Board Meeting Confidential", status: "completed", targetCount: 18, sent: 18, opened: 14, clicked: 3, reported: 9, startDate: "Feb 28", endDate: "Mar 7", riskCategory: "pretexting" },
  { id: "C-004", name: "All Staff — Malware Attachment", template: "Q1 Salary Review Spreadsheet", status: "scheduled", targetCount: 892, sent: 0, opened: 0, clicked: 0, reported: 0, startDate: "Apr 22", riskCategory: "malware-delivery" },
  { id: "C-005", name: "Engineering — OAuth App Consent", template: "GitHub Integration Request", status: "draft", targetCount: 156, sent: 0, opened: 0, clicked: 0, reported: 0, startDate: "TBD", riskCategory: "credential-harvest" },
];

const DEPARTMENTS: Department[] = [
  { name: "Finance", headcount: 42, avgRiskScore: 82, clickRate: 52, trainingCompletion: 61, trend: "worsening" },
  { name: "HR", headcount: 28, avgRiskScore: 74, clickRate: 44, trainingCompletion: 71, trend: "stable" },
  { name: "Sales", headcount: 134, avgRiskScore: 68, clickRate: 38, trainingCompletion: 78, trend: "improving" },
  { name: "Engineering", headcount: 156, avgRiskScore: 34, clickRate: 12, trainingCompletion: 94, trend: "improving" },
  { name: "Executive", headcount: 18, avgRiskScore: 29, clickRate: 17, trainingCompletion: 89, trend: "improving" },
  { name: "Operations", headcount: 89, avgRiskScore: 55, clickRate: 31, trainingCompletion: 82, trend: "stable" },
  { name: "Legal", headcount: 21, avgRiskScore: 47, clickRate: 24, trainingCompletion: 86, trend: "improving" },
];

const STATUS_COLOR: Record<string, string> = { active: "#22c55e", completed: "#94a3b8", scheduled: "#3b82f6", draft: "#f59e0b" };
const STATUS_BG: Record<string, string> = { active: "rgba(34,197,94,0.1)", completed: "rgba(148,163,184,0.1)", scheduled: "rgba(59,130,246,0.1)", draft: "rgba(245,158,11,0.1)" };

function clickRate(c: Campaign) {
  return c.sent > 0 ? Math.round((c.clicked / c.sent) * 100) : 0;
}
function reportRate(c: Campaign) {
  return c.sent > 0 ? Math.round((c.reported / c.sent) * 100) : 0;
}

export default function PhishSim() {
  const [tab, setTab] = useState<"campaigns" | "departments" | "training">("campaigns");

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-400" />
            Security Awareness & Phishing Simulation
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Campaign builder · click-rate analytics · department risk scoring · automated training assignment</p>
        </div>
        <button onClick={() => toast.success("Campaign builder opened — choose from 200+ phishing templates")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Org Click Rate", value: "20%", sub: "↓ from 34% last quarter", color: "#f97316" },
          { label: "Report Rate", value: "12%", sub: "↑ improving awareness", color: "#22c55e" },
          { label: "Training Completion", value: "81%", sub: "11 pending assignments", color: "#3b82f6" },
          { label: "Campaigns Active", value: CAMPAIGNS.filter(c => c.status === "active").length, sub: "this quarter", color: "#8b5cf6" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="text-xs text-white/40 mb-1">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        {(["campaigns", "departments", "training"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all" style={tab === t ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" } : { color: "rgba(255,255,255,0.4)" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "campaigns" && (
        <div className="space-y-2">
          {CAMPAIGNS.map(c => {
            const cr = clickRate(c);
            const rr = reportRate(c);
            return (
              <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">{c.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold" style={{ color: STATUS_COLOR[c.status], background: STATUS_BG[c.status] }}>{c.status}</span>
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5">{c.template} · {c.startDate}{c.endDate ? ` → ${c.endDate}` : ""} · {c.targetCount} targets</div>
                  </div>
                  {c.status !== "draft" && c.status !== "scheduled" && (
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-sm font-bold" style={{ color: cr > 30 ? "#ef4444" : cr > 15 ? "#f97316" : "#22c55e" }}>{cr}%</div>
                        <div className="text-[9px] text-white/30">clicked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-emerald-400">{rr}%</div>
                        <div className="text-[9px] text-white/30">reported</div>
                      </div>
                    </div>
                  )}
                  {(c.status === "draft" || c.status === "scheduled") && (
                    <button onClick={() => toast.success(`Campaign "${c.name}" launched successfully`)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/15">
                      <Play className="w-3 h-3" /> Launch
                    </button>
                  )}
                </div>
                {c.sent > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[
                      { label: "Sent", value: c.sent, max: c.targetCount, color: "#3b82f6" },
                      { label: "Opened", value: c.opened, max: c.sent, color: "#f59e0b" },
                      { label: "Clicked", value: c.clicked, max: c.sent, color: "#ef4444" },
                      { label: "Reported", value: c.reported, max: c.sent, color: "#22c55e" },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-white/40">{s.label}</span>
                          <span className="text-[10px] font-mono" style={{ color: s.color }}>{s.value}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.05]">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (s.value / s.max) * 100)}%`, background: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "departments" && (
        <div className="space-y-2">
          {DEPARTMENTS.sort((a, b) => b.avgRiskScore - a.avgRiskScore).map(dept => {
            const riskLevel = dept.avgRiskScore >= 70 ? "high" : dept.avgRiskScore >= 40 ? "medium" : "low";
            return (
              <div key={dept.name} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{dept.name}</span>
                      <span className="text-[9px] text-white/30">{dept.headcount} employees</span>
                      <span className="text-[9px]" style={{ color: dept.trend === "improving" ? "#22c55e" : dept.trend === "worsening" ? "#ef4444" : "#94a3b8" }}>
                        {dept.trend === "improving" ? "↓" : dept.trend === "worsening" ? "↑" : "→"} {dept.trend}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: RISK_COLOR[riskLevel] }}>{dept.avgRiskScore}</div>
                      <div className="text-[9px] text-white/30">risk score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: dept.clickRate > 30 ? "#ef4444" : dept.clickRate > 15 ? "#f97316" : "#22c55e" }}>{dept.clickRate}%</div>
                      <div className="text-[9px] text-white/30">click rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: dept.trainingCompletion >= 80 ? "#22c55e" : "#f59e0b" }}>{dept.trainingCompletion}%</div>
                      <div className="text-[9px] text-white/30">training done</div>
                    </div>
                    {dept.avgRiskScore >= 60 && (
                      <button onClick={() => toast.success(`Training automatically assigned to ${dept.name} (${Math.round(dept.headcount * (1 - dept.trainingCompletion / 100))} pending)`)} className="px-2.5 py-1 rounded-lg text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/15 whitespace-nowrap">
                        <BookOpen className="w-3 h-3 inline mr-1" />Assign Training
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "training" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Phishing Recognition 101", duration: "15 min", assigned: 127, completed: 89, category: "Awareness" },
            { title: "Advanced Social Engineering Defense", duration: "32 min", assigned: 42, completed: 28, category: "Advanced" },
            { title: "Safe Credential Handling", duration: "20 min", assigned: 340, completed: 298, category: "Compliance" },
            { title: "Incident Reporting Workflow", duration: "10 min", assigned: 892, completed: 734, category: "Procedure" },
            { title: "Executive Cyber Risk Briefing", duration: "25 min", assigned: 18, completed: 16, category: "Executive" },
            { title: "Finance-Specific Fraud Patterns", duration: "18 min", assigned: 42, completed: 22, category: "Targeted" },
          ].map(course => {
            const pct = Math.round((course.completed / course.assigned) * 100);
            return (
              <div key={course.title} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-white">{course.title}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{course.duration} · {course.category}</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: pct >= 80 ? "#22c55e" : "#f59e0b" }}>{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? "#22c55e" : "#f59e0b" }} />
                </div>
                <div className="text-[10px] text-white/25 mt-1">{course.completed}/{course.assigned} completed</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
