import { PREDICTIONS, KPI_METRICS, formatCurrency } from "@workspace/shared-ui/core-observability-data";
import { Target, TrendingUp, ArrowRight, Zap, Star } from "lucide-react";

const OPPORTUNITIES = [
  {
    id: "opp-001",
    title: "Fast-track Northgate Contract — Q1 Revenue Capture",
    category: "Revenue",
    confidence: 91,
    effort: "low",
    expected_impact: 840000,
    time_horizon: "6 days",
    steps: ["CFO backup approval path", "Alloy contract execution", "Billing activation"],
    correlation_id: "gf-2026-q1-001",
    status: "immediate",
  },
  {
    id: "opp-002",
    title: "Retain TechCorp — CEO Relationship Close",
    category: "Retention",
    confidence: 78,
    effort: "medium",
    expected_impact: 480000,
    time_horizon: "30 days",
    steps: ["CEO outreach within 12h", "Approve 30% retention offer", "Dedicated CSM assigned"],
    correlation_id: "corr-churn-techcorp",
    status: "immediate",
  },
  {
    id: "opp-003",
    title: "Unblock 6 Vendor Onboardings — Procurement Gap Resolved",
    category: "Operations",
    confidence: 84,
    effort: "medium",
    expected_impact: 780000,
    time_horizon: "14 days",
    steps: ["Assign compliance temp resource", "Fast-track low-risk vendors", "Automate via Alloy"],
    correlation_id: "corr-vendor-apex",
    status: "high",
  },
  {
    id: "opp-004",
    title: "Q1 Pipeline Acceleration — 4 Near-Close Deals",
    category: "Revenue",
    confidence: 66,
    effort: "high",
    expected_impact: 1200000,
    time_horizon: "30 days",
    steps: ["Identify bottleneck deal steps", "Assign dedicated RevOps resource", "Alloy automation of admin steps"],
    correlation_id: "corr-q1-pipeline",
    status: "planned",
  },
];

const EFFORT_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  immediate: { color: "#ef4444", label: "Act Now" },
  high: { color: "#f97316", label: "High Priority" },
  planned: { color: "#8b5cf6", label: "Planned" },
};

export default function OpportunityEngine() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#6366f1" }}>Alloy · Opportunity Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Opportunity Engine</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>What to do next — revenue and recovery opportunities ranked by Alloy confidence, effort, and expected impact.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Opportunities", value: OPPORTUNITIES.length, color: "#8b5cf6" },
          { label: "Immediate Actions", value: OPPORTUNITIES.filter(o => o.status === "immediate").length, color: "#ef4444" },
          { label: "Avg Confidence", value: `${Math.round(OPPORTUNITIES.reduce((s, o) => s + o.confidence, 0) / OPPORTUNITIES.length)}%`, color: "#10b981" },
          { label: "Total Expected Impact", value: formatCurrency(OPPORTUNITIES.reduce((s, o) => s + o.expected_impact, 0)), color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {OPPORTUNITIES.sort((a, b) => {
          const order = { immediate: 0, high: 1, planned: 2 };
          return order[a.status as keyof typeof order] - order[b.status as keyof typeof order];
        }).map(opp => {
          const statusStyle = STATUS_COLORS[opp.status];
          return (
            <div key={opp.id} className="rounded-xl border p-5" style={{ borderColor: "rgba(139,92,246,0.12)", background: "rgba(139,92,246,0.02)" }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
                      color: statusStyle.color,
                      background: `${statusStyle.color}15`,
                      border: `1px solid ${statusStyle.color}30`,
                    }}>{statusStyle.label}</span>
                    <span className="text-[9px] font-medium uppercase px-1 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}>{opp.category}</span>
                    <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Effort: <span style={{ color: EFFORT_COLORS[opp.effort] }}>{opp.effort}</span></span>
                    <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Horizon: {opp.time_horizon}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-3">{opp.title}</div>
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Execution Steps</div>
                    <div className="flex flex-wrap gap-2">
                      {opp.steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)" }}>{i + 1}</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-center">
                  <div className="text-2xl font-bold mb-0.5" style={{ color: "#f59e0b" }}>{formatCurrency(opp.expected_impact)}</div>
                  <div className="text-[9px] mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>expected impact</div>
                  <div className="text-sm font-bold" style={{ color: opp.confidence >= 80 ? "#10b981" : "#f59e0b" }}>{opp.confidence}%</div>
                  <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>confidence</div>
                </div>
              </div>

              <div className="flex gap-2">
                <a href="/lyte-command-center/" className="text-[9px] px-2.5 py-1.5 rounded-lg font-medium hover:opacity-80 flex items-center gap-1" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  Assign in Lyte <ArrowRight className="w-3 h-3" />
                </a>
                <a href="/alloy/" className="text-[9px] px-2.5 py-1.5 rounded-lg font-medium hover:opacity-80 flex items-center gap-1" style={{ color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                  <Zap className="w-3 h-3" /> Execute Now
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
