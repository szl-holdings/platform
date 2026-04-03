import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

const FORECAST_TYPES = [
  { key: "recovery_lien_drag_risk", label: "Recovery / Lien Drag Risk", description: "Probability that unresolved liens will delay settlement by >30 days", color: "#c45a4a" },
  { key: "review_bottleneck_risk", label: "Review Bottleneck Risk", description: "Probability of review queue growing to critical backlog this week", color: "#c8953c" },
  { key: "approval_lag_risk", label: "Approval Lag Risk", description: "Probability that pending approvals expire or cause material deadline risk", color: "#8b7ac8" },
  { key: "partner_intervention_leverage", label: "Partner Intervention Leverage", description: "Expected impact of partner intervention on matter movement in next 14 days", color: "#4a90b8" },
  { key: "settlement_blocker_severity", label: "Settlement Blocker Severity", description: "Composite score of all active blockers weighted by severity and time sensitivity", color: "#d4a054" },
  { key: "export_readiness_score", label: "Export Readiness Score", description: "How ready a matter is for export packet generation — privilege, review, completeness", color: "#4a90b8" },
];

const DEMO_FORECAST_DATA: Record<string, {
  current: number; prior: number; trend: string; confidence: number;
  drivers: string[]; sourceClasses: string[]; nextAction: string;
  whoShouldAct: string; approvalRequired: boolean;
  matters: { id: number; title: string; score: number; trend: string }[];
}> = {
  recovery_lien_drag_risk: {
    current: 0.71, prior: 0.65, trend: "declining",
    confidence: 0.80, drivers: ["Medicare lien $62K outstanding", "ERISA dispute active", "Thompson: 41d pending"],
    sourceClasses: ["lien_recovery", "internal_firm"], nextAction: "Prioritize Medicare lien negotiation on Thompson",
    whoShouldAct: "Partner", approvalRequired: false,
    matters: [
      { id: 2, title: "Thompson v. Westfield", score: 0.85, trend: "declining" },
      { id: 1, title: "Rodriguez v. National General", score: 0.72, trend: "declining" },
      { id: 3, title: "Martinez v. Allstate", score: 0.68, trend: "stable" },
    ],
  },
  review_bottleneck_risk: {
    current: 0.58, prior: 0.52, trend: "declining",
    confidence: 0.75, drivers: ["23 items in backlog", "Avg age 3.8d", "2 unassigned reviews"],
    sourceClasses: ["internal_firm"], nextAction: "Assign unreviewed items; reassign Rodriguez demand",
    whoShouldAct: "Managing Attorney", approvalRequired: false,
    matters: [
      { id: 1, title: "Rodriguez v. National General", score: 0.82, trend: "declining" },
      { id: 3, title: "Martinez v. Allstate", score: 0.61, trend: "stable" },
    ],
  },
  approval_lag_risk: {
    current: 0.62, prior: 0.70, trend: "improving",
    confidence: 0.82, drivers: ["Rodriguez settlement approval 5d pending", "Demand send approval 3d"],
    sourceClasses: ["internal_firm"], nextAction: "Partner review Rodriguez settlement today",
    whoShouldAct: "Partner", approvalRequired: true,
    matters: [
      { id: 1, title: "Rodriguez v. National General", score: 0.90, trend: "improving" },
      { id: 2, title: "Thompson v. Westfield", score: 0.72, trend: "stable" },
    ],
  },
  partner_intervention_leverage: {
    current: 0.84, prior: 0.79, trend: "improving",
    confidence: 0.78, drivers: ["Rodriguez: carrier offer window open", "Thompson: mediation 22d", "3 high-opportunity matters"],
    sourceClasses: ["internal_firm", "regulatory_insurance"], nextAction: "Intervene on Rodriguez settlement acceptance; initiate Thompson demand",
    whoShouldAct: "Partner", approvalRequired: false,
    matters: [
      { id: 1, title: "Rodriguez v. National General", score: 0.91, trend: "improving" },
      { id: 2, title: "Thompson v. Westfield", score: 0.82, trend: "improving" },
      { id: 4, title: "Chen v. GEICO Direct", score: 0.76, trend: "improving" },
    ],
  },
  settlement_blocker_severity: {
    current: 0.67, prior: 0.71, trend: "improving",
    confidence: 0.77, drivers: ["Lien drag on 3 matters", "Coverage dispute on Martinez", "Insurer silence on Rodriguez"],
    sourceClasses: ["lien_recovery", "regulatory_insurance", "internal_firm"], nextAction: "Clear lien + coverage blockers for top 2 matters",
    whoShouldAct: "Associate + Partner", approvalRequired: false,
    matters: [
      { id: 2, title: "Thompson v. Westfield", score: 0.85, trend: "declining" },
      { id: 1, title: "Rodriguez v. National General", score: 0.81, trend: "declining" },
      { id: 3, title: "Martinez v. Allstate", score: 0.64, trend: "stable" },
    ],
  },
  export_readiness_score: {
    current: 0.58, prior: 0.50, trend: "improving",
    confidence: 0.85, drivers: ["Review backlog clearing", "Privilege reviews pending on 3 matters", "Damages 94% complete on Rodriguez"],
    sourceClasses: ["internal_firm"], nextAction: "Complete privilege review on Rodriguez; generate export packet",
    whoShouldAct: "Paralegal + Attorney", approvalRequired: true,
    matters: [
      { id: 1, title: "Rodriguez v. National General", score: 0.88, trend: "improving" },
      { id: 4, title: "Chen v. GEICO Direct", score: 0.71, trend: "stable" },
    ],
  },
};

function TrendIcon({ t }: { t: string }) {
  if (t === "improving" || t === "rising") return <TrendingUp className="w-3 h-3 text-[#4a90b8]" />;
  if (t === "declining" || t === "falling") return <TrendingDown className="w-3 h-3 text-[#c45a4a]" />;
  return <Minus className="w-3 h-3 text-slate-500" />;
}

function ForecastCard({ ft, data }: { ft: typeof FORECAST_TYPES[0]; data: typeof DEMO_FORECAST_DATA[string] }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(data.current * 100);
  const priorPct = Math.round(data.prior * 100);
  const change = pct - priorPct;

  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden" style={{ background: "#0c1220" }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-slate-200">{ft.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{ft.description}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendIcon t={data.trend} />
            <span className={`text-[10px] font-mono ${change > 0 ? "text-[#c45a4a]" : change < 0 ? "text-[#4a90b8]" : "text-slate-500"}`}>
              {change > 0 ? "+" : ""}{change}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl font-bold" style={{ color: ft.color }}>{pct}%</div>
          <div className="flex-1">
            <div className="w-full h-2 bg-white/[0.06] rounded-full">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ft.color }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-slate-600">Prior: {priorPct}%</span>
              <span className="text-[9px] text-slate-600">Conf: {Math.round(data.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="text-[9px] text-slate-600 uppercase mb-1">Next Action</div>
        <div className="text-[10px] text-slate-300 mb-2">{data.nextAction}</div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-slate-500">→ {data.whoShouldAct}</span>
          {data.approvalRequired && <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#8b7ac8]/10 text-[#8b7ac8]">Approval Required</span>}
        </div>
      </div>

      <div className="px-4 pb-2">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-300">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Matter detail
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.04] p-3 space-y-3">
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Drivers</div>
            {data.drivers.map((d, i) => <div key={i} className="text-[10px] text-slate-400">• {d}</div>)}
          </div>
          <div>
            <div className="text-[9px] text-slate-600 uppercase mb-1">Affected Matters</div>
            <div className="space-y-1">
              {data.matters.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <TrendIcon t={m.trend} />
                  <Link href={`/prism-counsel/matters/${m.id}`}><span className="text-[10px] text-slate-300 hover:text-[#d4a054] cursor-pointer">{m.title}</span></Link>
                  <span className="text-[10px] font-mono text-slate-500 ml-auto">{Math.round(m.score * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {data.sourceClasses.map(sc => <span key={sc} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-600">{sc.replace(/_/g, " ")}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortfolioForecastPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Portfolio Forecasts</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#c8953c]/10 text-[#c8953c]">DEMO DATA</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">6 portfolio-level forecast dimensions — each with current/prior score, trend, drivers, source classes, and next action</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {FORECAST_TYPES.map(ft => (
          <ForecastCard key={ft.key} ft={ft} data={DEMO_FORECAST_DATA[ft.key]} />
        ))}
      </div>
    </div>
  );
}
