import { useState } from "react";
import { Calculator, Clock, DollarSign, TrendingUp, BarChart3, Download, Zap } from "lucide-react";

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

interface AutomationAction {
  id: string;
  type: string;
  description: string;
  count: number;
  avgMinsPerManual: number;
  hourlyRate: number;
  totalHoursSaved: number;
  totalDollarsSaved: number;
  mttrReductionMins: number;
  category: "remediation" | "detection" | "routing" | "reporting" | "ticketing";
}

interface MonthlyReport {
  month: string;
  laborSaved: number;
  incidentCostSaved: number;
  downtimeSaved: number;
  totalValue: number;
  automationActions: number;
}

const CATEGORY_COLOR: Record<AutomationAction["category"], string> = {
  remediation: "#10b981",
  detection: "#3b82f6",
  routing: "#f59e0b",
  reporting: "#8b5cf6",
  ticketing: GOLD,
};

const ACTIONS: AutomationAction[] = [
  {
    id: "a1",
    type: "Service Restart",
    description: "Automated OOM & crash recovery via runbook execution",
    count: 142,
    avgMinsPerManual: 34,
    hourlyRate: 185,
    totalHoursSaved: 80.5,
    totalDollarsSaved: 14892,
    mttrReductionMins: 32,
    category: "remediation",
  },
  {
    id: "a2",
    type: "Alert Triage & Routing",
    description: "Alloy auto-classifies and routes alerts to correct owner",
    count: 2840,
    avgMinsPerManual: 4.5,
    hourlyRate: 140,
    totalHoursSaved: 213,
    totalDollarsSaved: 29820,
    mttrReductionMins: 8,
    category: "routing",
  },
  {
    id: "a3",
    type: "Queue Drain & Backlog Clear",
    description: "Automated queue management preventing manual intervention",
    count: 204,
    avgMinsPerManual: 12,
    hourlyRate: 185,
    totalHoursSaved: 40.8,
    totalDollarsSaved: 7548,
    mttrReductionMins: 10,
    category: "remediation",
  },
  {
    id: "a4",
    type: "Anomaly Detection",
    description: "Proactive signal correlation replacing manual log review",
    count: 8420,
    avgMinsPerManual: 8,
    hourlyRate: 140,
    totalHoursSaved: 1123,
    totalDollarsSaved: 157220,
    mttrReductionMins: 45,
    category: "detection",
  },
  {
    id: "a5",
    type: "Incident Ticket Creation",
    description: "Automated ticket generation with full context package",
    count: 1840,
    avgMinsPerManual: 6,
    hourlyRate: 120,
    totalHoursSaved: 184,
    totalDollarsSaved: 22080,
    mttrReductionMins: 5,
    category: "ticketing",
  },
  {
    id: "a6",
    type: "Executive Reporting",
    description: "Automated weekly ops reports and stakeholder digests",
    count: 52,
    avgMinsPerManual: 120,
    hourlyRate: 220,
    totalHoursSaved: 104,
    totalDollarsSaved: 22880,
    mttrReductionMins: 0,
    category: "reporting",
  },
  {
    id: "a7",
    type: "Auto-Scale Orchestration",
    description: "HPA triggers and scale-up events without manual review",
    count: 89,
    avgMinsPerManual: 18,
    hourlyRate: 185,
    totalHoursSaved: 26.7,
    totalDollarsSaved: 4939,
    mttrReductionMins: 15,
    category: "remediation",
  },
  {
    id: "a8",
    type: "SLA Compliance Reporting",
    description: "Automated SLA tracking, breach detection, and client reports",
    count: 740,
    avgMinsPerManual: 15,
    hourlyRate: 140,
    totalHoursSaved: 185,
    totalDollarsSaved: 25900,
    mttrReductionMins: 0,
    category: "reporting",
  },
];

const MONTHLY_REPORTS: MonthlyReport[] = [
  { month: "Nov '24", laborSaved: 142800, incidentCostSaved: 88200, downtimeSaved: 34100, totalValue: 265100, automationActions: 14820 },
  { month: "Dec '24", laborSaved: 156400, incidentCostSaved: 92400, downtimeSaved: 38800, totalValue: 287600, automationActions: 16240 },
  { month: "Jan '25", laborSaved: 138200, incidentCostSaved: 78800, downtimeSaved: 29400, totalValue: 246400, automationActions: 13980 },
  { month: "Feb '25", laborSaved: 168400, incidentCostSaved: 104200, downtimeSaved: 44800, totalValue: 317400, automationActions: 17640 },
  { month: "Mar '25", laborSaved: 182800, incidentCostSaved: 118400, downtimeSaved: 52200, totalValue: 353400, automationActions: 19280 },
  { month: "Apr '25", laborSaved: 197400, incidentCostSaved: 132800, downtimeSaved: 58400, totalValue: 388600, automationActions: 21140 },
];

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

function fmtHrs(h: number): string {
  if (h >= 1000) return `${(h / 1000).toFixed(1)}k hrs`;
  return `${h.toFixed(0)} hrs`;
}

export default function OpsSavingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<AutomationAction["category"] | "all">("all");
  const [activeReport, setActiveReport] = useState<MonthlyReport>(MONTHLY_REPORTS[MONTHLY_REPORTS.length - 1]!);

  const filtered = ACTIONS.filter(a => selectedCategory === "all" || a.category === selectedCategory);
  const totalHours = ACTIONS.reduce((s, a) => s + a.totalHoursSaved, 0);
  const totalDollars = ACTIONS.reduce((s, a) => s + a.totalDollarsSaved, 0);
  const totalActions = ACTIONS.reduce((s, a) => s + a.count, 0);
  const avgMttrReduction = Math.round(ACTIONS.filter(a => a.mttrReductionMins > 0).reduce((s, a) => s + a.mttrReductionMins, 0) / ACTIONS.filter(a => a.mttrReductionMins > 0).length);

  const maxMonthlyValue = Math.max(...MONTHLY_REPORTS.map(r => r.totalValue));

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>Ops Savings Calculator</h1>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>Continuously tracking automation value — labor hours, incident costs, and downtime prevented. Your monthly ROI proof.</p>
        </div>
        <button className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ background: "rgba(212,160,84,0.1)", color: GOLD, border: "1px solid rgba(212,160,84,0.2)" }}>
          <Download className="w-3 h-3" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Labor Hours Saved (YTD)", value: fmtHrs(totalHours), color: GOLD, icon: Clock },
          { label: "Dollar Value Delivered", value: fmt$(totalDollars), color: "#10b981", icon: DollarSign },
          { label: "Automation Actions (YTD)", value: totalActions.toLocaleString(), color: "#3b82f6", icon: Zap },
          { label: "Avg MTTR Reduction", value: `${avgMttrReduction}m`, color: "#8b5cf6", icon: TrendingUp },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-widest" style={{ color: DS.text.muted }}>{k.label}</span>
              <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
            </div>
            <div className="text-[20px] font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-medium" style={{ color: DS.text.secondary }}>Monthly Value Delivered — Last 6 Months</div>
          <div className="flex gap-3 text-[8px]" style={{ color: DS.text.muted }}>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded inline-block" style={{ background: GOLD }} />Labor</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded inline-block" style={{ background: "#10b981" }} />Incident cost</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded inline-block" style={{ background: "#8b5cf6" }} />Downtime</span>
          </div>
        </div>
        <div className="flex gap-2 items-end h-28">
          {MONTHLY_REPORTS.map(r => {
            const maxVal = maxMonthlyValue;
            const totalPct = (r.totalValue / maxVal) * 100;
            const laborPct = (r.laborSaved / r.totalValue) * totalPct;
            const incidentPct = (r.incidentCostSaved / r.totalValue) * totalPct;
            const downtimePct = (r.downtimeSaved / r.totalValue) * totalPct;
            const isActive = activeReport.month === r.month;
            return (
              <button
                key={r.month}
                onClick={() => setActiveReport(r)}
                className="flex-1 flex flex-col-reverse rounded overflow-hidden transition-all"
                style={{
                  border: `1px solid ${isActive ? "rgba(212,160,84,0.3)" : DS.border}`,
                  height: `${totalPct}%`,
                  minHeight: 20,
                }}
              >
                <div style={{ height: `${(laborPct / totalPct) * 100}%`, background: `${GOLD}60`, minHeight: 4 }} />
                <div style={{ height: `${(incidentPct / totalPct) * 100}%`, background: "#10b98160", minHeight: 4 }} />
                <div style={{ height: `${(downtimePct / totalPct) * 100}%`, background: "#8b5cf660", minHeight: 4 }} />
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-1">
          {MONTHLY_REPORTS.map(r => (
            <div key={r.month} className="flex-1 text-center text-[8px] font-mono" style={{ color: activeReport.month === r.month ? GOLD : DS.text.muted }}>{r.month}</div>
          ))}
        </div>

        <div className="mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderTop: `1px solid ${DS.border}` }}>
          <div>
            <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: DS.text.muted }}>Labor Saved — {activeReport.month}</div>
            <div className="text-[16px] font-bold font-mono" style={{ color: GOLD }}>{fmt$(activeReport.laborSaved)}</div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: DS.text.muted }}>Incident Cost Saved</div>
            <div className="text-[16px] font-bold font-mono" style={{ color: "#10b981" }}>{fmt$(activeReport.incidentCostSaved)}</div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-widest mb-1" style={{ color: DS.text.muted }}>Downtime Value Saved</div>
            <div className="text-[16px] font-bold font-mono" style={{ color: "#8b5cf6" }}>{fmt$(activeReport.downtimeSaved)}</div>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg flex items-center justify-between" style={{ background: "rgba(212,160,84,0.05)", border: "1px solid rgba(212,160,84,0.12)" }}>
          <span className="text-[10px]" style={{ color: DS.text.secondary }}>Total Value Delivered — {activeReport.month}</span>
          <span className="text-[16px] font-bold font-mono" style={{ color: GOLD }}>{fmt$(activeReport.totalValue)}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>Automation Breakdown by Action Type</div>
          <div className="flex gap-1">
            {(["all", "remediation", "detection", "routing", "reporting", "ticketing"] as const).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className="text-[9px] px-2 py-1 rounded capitalize transition-all" style={{
                background: selectedCategory === cat ? "rgba(255,255,255,0.06)" : "transparent",
                color: selectedCategory === cat ? DS.text.primary : DS.text.muted,
                border: `1px solid ${selectedCategory === cat ? DS.border : "transparent"}`,
              }}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}`, background: DS.surface }}>
                {["Action Type", "Count", "Hrs/Event (Manual)", "Hours Saved", "Dollar Value", "MTTR Δ"].map(h => (
                  <th key={h} className="text-[8px] uppercase tracking-widest font-medium px-4 py-2.5 text-right first:text-left" style={{ color: DS.text.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const cc = CATEGORY_COLOR[a.category];
                return (
                  <tr key={a.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cc }} />
                        <div>
                          <div className="text-[11px] font-medium" style={{ color: DS.text.primary }}>{a.type}</div>
                          <div className="text-[9px]" style={{ color: DS.text.muted }}>{a.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-mono" style={{ color: DS.text.secondary }}>{a.count.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-mono" style={{ color: DS.text.muted }}>{a.avgMinsPerManual}m</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-mono font-semibold" style={{ color: GOLD }}>{fmtHrs(a.totalHoursSaved)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-mono font-semibold" style={{ color: "#10b981" }}>{fmt$(a.totalDollarsSaved)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-mono" style={{ color: a.mttrReductionMins > 0 ? "#10b981" : DS.text.muted }}>
                        {a.mttrReductionMins > 0 ? `-${a.mttrReductionMins}m` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `1px solid rgba(212,160,84,0.15)`, background: "rgba(212,160,84,0.02)" }}>
                <td className="py-2.5 px-4 text-[9px] font-medium uppercase tracking-widest" style={{ color: DS.text.muted }}>Total (YTD)</td>
                <td className="py-2.5 px-4 text-right text-[11px] font-mono" style={{ color: DS.text.secondary }}>{totalActions.toLocaleString()}</td>
                <td className="py-2.5 px-4" />
                <td className="py-2.5 px-4 text-right text-[12px] font-bold font-mono" style={{ color: GOLD }}>{fmtHrs(totalHours)}</td>
                <td className="py-2.5 px-4 text-right text-[12px] font-bold font-mono" style={{ color: "#10b981" }}>{fmt$(totalDollars)}</td>
                <td className="py-2.5 px-4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
