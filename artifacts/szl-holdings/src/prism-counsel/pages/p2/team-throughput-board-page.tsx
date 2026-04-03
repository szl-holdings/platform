import { Users, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const DEMO_TEAMS = [
  {
    team: "Chen / Williams",
    members: ["S. Chen (Partner)", "M. Williams (Associate)"],
    matters: 12,
    clearRate: 0.91,
    avgClearDays: 2.1,
    pressureCleared7d: 5,
    topActionTypes: ["demand_finalization", "insurer_escalation", "mediation_prep"],
    movementsAchieved: 3,
    bottlenecks: [],
    trend: "improving",
  },
  {
    team: "Patel / Cruz",
    members: ["R. Patel (Associate)", "A. Cruz (Paralegal)"],
    matters: 9,
    clearRate: 0.78,
    avgClearDays: 3.4,
    pressureCleared7d: 3,
    topActionTypes: ["discovery_response", "expert_coordination"],
    movementsAchieved: 2,
    bottlenecks: ["Lien resolution lag"],
    trend: "stable",
  },
  {
    team: "Roberts Team",
    members: ["K. Roberts (Associate)", "J. Kim (Paralegal)"],
    matters: 14,
    clearRate: 0.65,
    avgClearDays: 4.8,
    pressureCleared7d: 2,
    topActionTypes: ["coverage_review", "settlement_draft"],
    movementsAchieved: 1,
    bottlenecks: ["Approval lag", "Unassigned reviews"],
    trend: "declining",
  },
  {
    team: "Nguyen / Davis",
    members: ["T. Nguyen (Associate)", "L. Davis (Paralegal)"],
    matters: 12,
    clearRate: 0.52,
    avgClearDays: 6.2,
    pressureCleared7d: 1,
    topActionTypes: ["record_requests", "communication_follow_up"],
    movementsAchieved: 0,
    bottlenecks: ["Quiet risk matters", "Low review throughput"],
    trend: "declining",
  },
];

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: "#4a90b8" },
  stable: { icon: Minus, color: "#d4a054" },
  declining: { icon: TrendingDown, color: "#c45a4a" },
};

const ACTION_LABELS: Record<string, string> = {
  demand_finalization: "Demand Finalization",
  insurer_escalation: "Insurer Escalation",
  mediation_prep: "Mediation Prep",
  discovery_response: "Discovery Response",
  expert_coordination: "Expert Coordination",
  coverage_review: "Coverage Review",
  settlement_draft: "Settlement Draft",
  record_requests: "Record Requests",
  communication_follow_up: "Communication Follow-Up",
};

export default function TeamThroughputBoardPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#4a90b8]" />
          <h1 className="text-lg font-semibold text-slate-100">Team Throughput Board</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Which teams are clearing pressure fastest — throughput rate, action type effectiveness, bottlenecks</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Teams", count: DEMO_TEAMS.length, color: "#4a90b8" },
          { label: "Improving", count: DEMO_TEAMS.filter(t => t.trend === "improving").length, color: "#4a90b8" },
          { label: "Declining", count: DEMO_TEAMS.filter(t => t.trend === "declining").length, color: "#c45a4a" },
          { label: "Movements 7d", count: DEMO_TEAMS.reduce((s, t) => s + t.movementsAchieved, 0), color: "#d4a054" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {DEMO_TEAMS.map(team => {
          const tc = TREND_CONFIG[team.trend as keyof typeof TREND_CONFIG];
          const TrendIcon = tc.icon;
          const rateColor = team.clearRate >= 0.8 ? "#4a90b8" : team.clearRate >= 0.65 ? "#d4a054" : "#c45a4a";

          return (
            <div key={team.team} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-200">{team.team}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendIcon className="w-3.5 h-3.5" style={{ color: tc.color }} />
                  <span className="text-[10px] font-mono" style={{ color: tc.color }}>{team.trend}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-3">
                <div>
                  <div className="text-2xl font-bold" style={{ color: rateColor }}>{Math.round(team.clearRate * 100)}%</div>
                  <div className="text-[9px] text-slate-500">clear rate</div>
                </div>
                <div className="flex-1">
                  <div className="w-full h-2 bg-white/[0.06] rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${team.clearRate * 100}%`, background: rateColor }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-slate-300">{team.matters}</div>
                  <div className="text-[9px] text-slate-500">matters</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded p-2 bg-white/[0.02]">
                  <div className="text-[9px] text-slate-600">Avg Clear</div>
                  <div className="text-xs font-mono text-slate-300">{team.avgClearDays}d</div>
                </div>
                <div className="rounded p-2 bg-white/[0.02]">
                  <div className="text-[9px] text-slate-600">Cleared 7d</div>
                  <div className="text-xs font-mono text-slate-300">{team.pressureCleared7d}</div>
                </div>
                <div className="rounded p-2 bg-white/[0.02]">
                  <div className="text-[9px] text-slate-600">Movements</div>
                  <div className="text-xs font-mono text-slate-300">{team.movementsAchieved}</div>
                </div>
              </div>

              <div className="mb-2">
                <div className="text-[9px] text-slate-600 mb-1">Top Action Types</div>
                <div className="flex flex-wrap gap-1">
                  {team.topActionTypes.map(a => (
                    <span key={a} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500">{ACTION_LABELS[a] || a}</span>
                  ))}
                </div>
              </div>

              {team.bottlenecks.length > 0 && (
                <div>
                  <div className="text-[9px] text-slate-600 mb-1">Bottlenecks</div>
                  <div className="flex flex-wrap gap-1">
                    {team.bottlenecks.map(b => (
                      <span key={b} className="text-[8px] px-1.5 py-0.5 rounded bg-[#c8953c]/10 text-[#c8953c]">{b}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-1 text-[9px] text-slate-500">
                {team.members.map((m, i) => <span key={m}>{m}{i < team.members.length - 1 ? " · " : ""}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
