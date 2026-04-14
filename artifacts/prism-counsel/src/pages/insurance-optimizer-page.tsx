import { useState } from "react";
import { Shield, DollarSign, TrendingDown, Target, AlertTriangle, BarChart3, CheckCircle, Clock } from "lucide-react";

const PRISM_GOLD = "#c8a96e";

interface DefenseCase {
  id: string;
  matter: string;
  carrier: string;
  reserveAmount: number;
  defenseCostToDate: number;
  estimatedRemainingCost: number;
  claimantDemand: number;
  liabilityScore: number;
  damageScore: number;
  phase: string;
  inflectionPoint: number;
  recommendedReserve: number;
  optimalSettlementWindow: string;
  economicVerdict: "fight" | "settle" | "evaluate";
}

const DEFENSE_CASES: DefenseCase[] = [
  {
    id: "1",
    matter: "Hernandez v. Meridian Logistics Group",
    carrier: "National Indemnity Corp.",
    reserveAmount: 650_000,
    defenseCostToDate: 78_000,
    estimatedRemainingCost: 145_000,
    claimantDemand: 875_000,
    liabilityScore: 62,
    damageScore: 74,
    phase: "Post-Discovery",
    inflectionPoint: 185_000,
    recommendedReserve: 420_000,
    optimalSettlementWindow: "Next 60 days — before expert disclosure deadline",
    economicVerdict: "settle",
  },
  {
    id: "2",
    matter: "Patel v. Consolidated Transport Inc.",
    carrier: "Atlantic Casualty Insurance",
    reserveAmount: 280_000,
    defenseCostToDate: 22_000,
    estimatedRemainingCost: 95_000,
    claimantDemand: 320_000,
    liabilityScore: 35,
    damageScore: 41,
    phase: "Early Discovery",
    inflectionPoint: 220_000,
    recommendedReserve: 150_000,
    optimalSettlementWindow: "Post-depositions — leverage will peak after plaintiff's depo",
    economicVerdict: "fight",
  },
  {
    id: "3",
    matter: "Washington v. Apex Property Services",
    carrier: "Paramount Mutual Insurance",
    reserveAmount: 1_200_000,
    defenseCostToDate: 215_000,
    estimatedRemainingCost: 285_000,
    claimantDemand: 2_800_000,
    liabilityScore: 78,
    damageScore: 88,
    phase: "Pre-Trial",
    inflectionPoint: 380_000,
    recommendedReserve: 980_000,
    optimalSettlementWindow: "IMMEDIATE — inflection point already reached, every day increases exposure",
    economicVerdict: "settle",
  },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function EconomicMeter({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-slate-500">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{fmt(value)}</span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const VERDICT_CONFIG = {
  fight: { color: "#4a90b8", label: "FIGHT — ECONOMICS FAVOR DEFENSE", bg: "#4a90b808", border: "#4a90b820" },
  settle: { color: "#c45a4a", label: "SETTLE — DEFENSE COST EXCEEDS VALUE", bg: "#c45a4a08", border: "#c45a4a20" },
  evaluate: { color: "#d4a054", label: "EVALUATE — BORDERLINE CASE", bg: "#d4a05408", border: "#d4a05420" },
};

export default function InsuranceOptimizerPage() {
  const [selected, setSelected] = useState<DefenseCase>(DEFENSE_CASES[0]!);

  const totalProjectedCost = selected.defenseCostToDate + selected.estimatedRemainingCost;
  const inflectionReached = selected.defenseCostToDate >= selected.inflectionPoint * 0.75;
  const reserveVariance = selected.reserveAmount - selected.recommendedReserve;
  const isOverReserved = reserveVariance > 0;

  const verdict = VERDICT_CONFIG[selected.economicVerdict];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: PRISM_GOLD }} />
          <h1 className="text-lg font-semibold text-slate-100">Insurance Defense Optimizer</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium border" style={{ background: `${PRISM_GOLD}15`, color: PRISM_GOLD, borderColor: `${PRISM_GOLD}30` }}>
            RESERVE INTELLIGENCE
          </span>
        </div>
        <p className="text-xs text-slate-500">Optimal reserve calculation and economic settlement inflection point analysis — identify when continued defense becomes more costly than resolution</p>
      </div>

      {/* Case Selector */}
      <div className="grid grid-cols-3 gap-3">
        {DEFENSE_CASES.map((c) => {
          const cfg = VERDICT_CONFIG[c.economicVerdict];
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`text-left rounded-lg border p-4 transition-all ${
                selected.id === c.id ? "border-[#c8a96e]/40 bg-[#c8a96e]/5" : "border-white/[0.06] hover:border-white/[0.12]"
              }`}
              style={{ background: "#0c1220" }}
            >
              <div className="text-[11px] font-medium text-slate-200 mb-1 truncate">{c.matter}</div>
              <div className="text-[9px] text-slate-500 mb-2">{c.carrier} · {c.phase}</div>
              <span className="text-[8px] px-1.5 py-0.5 rounded border font-semibold" style={{
                background: cfg.bg, color: cfg.color, borderColor: cfg.border,
              }}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Economic Verdict Banner */}
      <div className="rounded-lg border p-4" style={{ background: verdict.bg, borderColor: verdict.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selected.economicVerdict === "settle" ? (
              <AlertTriangle className="w-5 h-5" style={{ color: verdict.color }} />
            ) : selected.economicVerdict === "fight" ? (
              <CheckCircle className="w-5 h-5" style={{ color: verdict.color }} />
            ) : (
              <Target className="w-5 h-5" style={{ color: verdict.color }} />
            )}
            <div>
              <div className="text-sm font-semibold" style={{ color: verdict.color }}>{verdict.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{selected.matter}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-500">Optimal Settlement Window</div>
            <div className="text-[10px] font-medium text-slate-300 mt-0.5 max-w-64 text-right">{selected.optimalSettlementWindow}</div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Current Reserve", value: fmt(selected.reserveAmount), sub: isOverReserved ? `Over by ${fmt(Math.abs(reserveVariance))}` : `Under by ${fmt(Math.abs(reserveVariance))}`, color: isOverReserved ? "#d4a054" : "#c45a4a" },
          { label: "Recommended Reserve", value: fmt(selected.recommendedReserve), sub: "AI-calculated optimal", color: PRISM_GOLD },
          { label: "Inflection Point", value: fmt(selected.inflectionPoint), sub: inflectionReached ? "⚠ Approaching — evaluate now" : "Not yet reached", color: inflectionReached ? "#c45a4a" : "#4a90b8" },
          { label: "Projected Total Defense", value: fmt(totalProjectedCost), sub: `${fmt(selected.defenseCostToDate)} spent + ${fmt(selected.estimatedRemainingCost)} remaining`, color: "#c45a4a" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-xl font-semibold font-mono" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Analysis */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cost Waterfall */}
        <div className="rounded-lg border border-white/[0.06] p-5 space-y-4" style={{ background: "#0c1220" }}>
          <div className="text-xs font-semibold text-slate-200">Defense Cost vs. Exposure Analysis</div>

          <EconomicMeter value={selected.claimantDemand} max={selected.claimantDemand * 1.1} color="#c45a4a" label="Claimant Demand" />
          <EconomicMeter value={selected.recommendedReserve} max={selected.claimantDemand * 1.1} color={PRISM_GOLD} label="Recommended Reserve" />
          <EconomicMeter value={selected.reserveAmount} max={selected.claimantDemand * 1.1} color="#d4a054" label="Current Reserve Set" />
          <EconomicMeter value={totalProjectedCost} max={selected.claimantDemand * 1.1} color="#4a90b8" label="Projected Total Defense Cost" />
          <EconomicMeter value={selected.inflectionPoint} max={selected.claimantDemand * 1.1} color="#9b6b3a" label="Economic Inflection Point" />

          <div className="rounded border border-white/[0.04] p-3 mt-2" style={{ background: "#080c14" }}>
            <div className="text-[9px] font-medium text-slate-500 uppercase mb-2">Economic Logic</div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {selected.economicVerdict === "settle"
                ? `Total projected defense cost (${fmt(totalProjectedCost)}) plus case exposure risk exceeds the recommended settlement range. Continued defense erodes financial position.`
                : selected.economicVerdict === "fight"
                ? `Defense economics are favorable. Projected total cost (${fmt(totalProjectedCost)}) is well below inflection point (${fmt(selected.inflectionPoint)}). Liability score of ${selected.liabilityScore}/100 supports continued defense.`
                : `Case sits near the inflection point. Ongoing cost trajectory requires close monitoring — a shift in discovery or expert opinions could change the optimal strategy.`
              }
            </p>
          </div>
        </div>

        {/* Liability & Damages Risk */}
        <div className="rounded-lg border border-white/[0.06] p-5 space-y-5" style={{ background: "#0c1220" }}>
          <div className="text-xs font-semibold text-slate-200">Liability & Damages Risk Profile</div>

          <div className="space-y-3">
            {[
              { label: "Liability Exposure Score", value: selected.liabilityScore, desc: selected.liabilityScore > 60 ? "Plaintiff can likely establish liability — settle leverage high" : "Liability contested — defense position tenable" },
              { label: "Damages Severity Score", value: selected.damageScore, desc: selected.damageScore > 70 ? "Severe documented damages — high jury sympathy risk" : "Damages limited or disputed — trial risk manageable" },
            ].map((item) => {
              const color = item.value >= 70 ? "#c45a4a" : item.value >= 50 ? "#d4a054" : "#4a90b8";
              return (
                <div key={item.label} className="rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-slate-300">{item.label}</span>
                    <span className="text-sm font-bold font-mono" style={{ color }}>{item.value}/100</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: color }} />
                  </div>
                  <p className="text-[9px] text-slate-500">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div>
            <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">Phase Status</div>
            <div className="flex items-center gap-2 rounded border border-white/[0.04] p-3" style={{ background: "#080c14" }}>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-300">{selected.phase}</span>
            </div>
          </div>

          <div className="rounded border border-[#c8a96e]/20 p-3" style={{ background: "#c8a96e08" }}>
            <div className="text-[9px] font-medium uppercase tracking-wider mb-2" style={{ color: PRISM_GOLD }}>Reserve Adjustment Recommendation</div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {isOverReserved
                ? `Reserve is set ${fmt(reserveVariance)} above the AI-recommended level. Consider releasing ${fmt(reserveVariance * 0.6)} if upcoming discovery supports current trajectory.`
                : `Reserve is set ${fmt(Math.abs(reserveVariance))} below the AI recommendation. Increase reserve to ${fmt(selected.recommendedReserve)} to accurately reflect exposure based on current case posture.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
