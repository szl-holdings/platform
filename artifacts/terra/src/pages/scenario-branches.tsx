import { useState } from "react";
import { GitBranch, TrendingDown, TrendingUp, AlertTriangle, Droplets, DollarSign, Clock, Building2, CheckCircle2, XCircle, Shield, BarChart3 } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

type BranchId = "valuation-stress" | "tenant-churn" | "flood-risk" | "financing-pressure";

interface Branch {
  id: BranchId;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  description: string;
  trigger: string;
  probability: number;
  deltaValue: string;
  deltaIrr: string;
  deltaCashOnCash: string;
  outcomes: { label: string; value: string; positive: boolean }[];
  risks: string[];
  mitigations: string[];
}

const BASELINE = {
  value: "$3.80M",
  irr: "14.2%",
  cashOnCash: "7.4%",
  noi: "$228K",
  occupancy: "100%",
};

const BRANCHES: Branch[] = [
  {
    id: "valuation-stress",
    label: "Valuation Stress",
    subtitle: "Cap rate expansion + NOI compression",
    icon: TrendingDown,
    color: "#c45a4a",
    description: "Continued cap rate expansion (+150bps) driven by rate environment, combined with 10% NOI compression from vacancy and rent concessions.",
    trigger: "10-yr Treasury > 5.5% for 3+ months or regional supply surge",
    probability: 22,
    deltaValue: "−$640K",
    deltaIrr: "−4.8%",
    deltaCashOnCash: "−2.1%",
    outcomes: [
      { label: "Revised AVM", value: "$3.16M", positive: false },
      { label: "IRR (5-yr hold)", value: "9.4%", positive: false },
      { label: "Cash-on-Cash", value: "5.3%", positive: false },
      { label: "LTV After Stress", value: "74%", positive: false },
      { label: "Refi Risk", value: "Elevated (Q4 2025)", positive: false },
    ],
    risks: ["LTV breach on construction loan covenant", "NOI insufficient for DSCR at refi", "Portfolio-level impairment if across 3+ assets"],
    mitigations: ["Accelerate lease-up to defend NOI", "Pre-negotiate rate cap extension with lender", "Explore preferred equity injection to reduce LTV"],
  },
  {
    id: "tenant-churn",
    label: "Tenant Churn Scenario",
    subtitle: "3-unit vacancy + 6-month lease-up",
    icon: Building2,
    color: "#c8953c",
    description: "Three simultaneous vacancies on unit turnover, with 6-month re-leasing timeline. Impact on NOI and occupancy stabilization.",
    trigger: "Employer relocation, submarket oversupply, or rent concession mismatch",
    probability: 31,
    deltaValue: "−$220K",
    deltaIrr: "−2.4%",
    deltaCashOnCash: "−3.8%",
    outcomes: [
      { label: "Occupancy Drop", value: "75% (6 months)", positive: false },
      { label: "Lost NOI", value: "$42K over period", positive: false },
      { label: "Leasing Costs", value: "$18K est.", positive: false },
      { label: "Recovery Timeline", value: "Q3 2026 est.", positive: false },
      { label: "Net Value Impact", value: "−$220K AVM", positive: false },
    ],
    risks: ["Extended vacancy if submarket softens", "Rent concession pressure from competing supply", "Debt service coverage at risk below 85% occupancy"],
    mitigations: ["Pre-qualify 3 qualified tenant prospects now", "Build 2-month vacancy reserve fund", "Engage broker for proactive pre-leasing on any expiry"],
  },
  {
    id: "flood-risk",
    label: "Flood Risk Materialization",
    subtitle: "Climate event + insurance impact",
    icon: Droplets,
    color: "#4a90b8",
    description: "50-year flood event impacts subject property. Structural damage, unit downtime, and insurance claim process over 8–18 months.",
    trigger: "Category 2+ storm surge or FEMA 100-year flood zone reclassification",
    probability: 8,
    deltaValue: "−$480K",
    deltaIrr: "−6.1%",
    deltaCashOnCash: "−8.4%",
    outcomes: [
      { label: "Structural Damage", value: "$280–450K est.", positive: false },
      { label: "Unit Downtime", value: "12–18 months", positive: false },
      { label: "Insurance Deductible", value: "$40K", positive: false },
      { label: "Prem Increase (yr+1)", value: "+$12K/yr", positive: false },
      { label: "FEMA Zone Reclassify", value: "Possible", positive: false },
    ],
    risks: ["Insurance non-renewal after major claim", "FEMA flood zone upgrade increases premiums permanently", "Tenant relocation liability during remediation"],
    mitigations: ["Flood elevation certificate obtained", "Business interruption insurance in force", "Contractor relationships pre-qualified for rapid mobilization"],
  },
  {
    id: "financing-pressure",
    label: "Financing Pressure",
    subtitle: "Refinance gap at maturity",
    icon: DollarSign,
    color: "#8b7ac8",
    description: "Construction loan maturing in Q4 2025. Higher rate environment results in refinance shortfall — capital required to bridge gap.",
    trigger: "Loan maturity at elevated rates with value decline or NOI compression",
    probability: 18,
    deltaValue: "Neutral",
    deltaIrr: "−3.2%",
    deltaCashOnCash: "−2.9%",
    outcomes: [
      { label: "Refi Rate", value: "7.25% (est.)", positive: false },
      { label: "Capital Gap", value: "$180K", positive: false },
      { label: "New DSCR", value: "1.08x (tight)", positive: false },
      { label: "Monthly Cash Flow", value: "+$820/mo (vs $2,100)", positive: false },
      { label: "Equity Bridge Needed", value: "Yes", positive: false },
    ],
    risks: ["Lender declines refi at current LTV — forces partial paydown", "Personal guarantee called if DSCR < 1.0x", "Forced sale at depressed market conditions"],
    mitigations: ["Engage 3 lenders 6 months pre-maturity", "Explore bridge-to-permanent structure", "Preferred equity injection to reduce LTV to 55% target"],
  },
];

function ProbabilityBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct * 2)}%`, backgroundColor: color }} />
    </div>
  );
}

function BranchDetail({ branch }: { branch: Branch }) {
  const Icon = branch.icon;
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: `1px solid ${branch.color}25` }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" style={{ color: branch.color }} />
          <h3 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>{branch.label}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full border font-mono" style={{ color: branch.color, borderColor: `${branch.color}30`, background: `${branch.color}10` }}>{branch.probability}% probable</span>
        </div>
        <p className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{branch.description}</p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}><span style={{ color: "rgba(255,255,255,0.45)" }}>Trigger:</span> {branch.trigger}</p>
      </div>

      <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.88)" }}>Delta vs. Baseline</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Value Δ", value: branch.deltaValue },
            { label: "IRR Δ", value: branch.deltaIrr },
            { label: "CoC Δ", value: branch.deltaCashOnCash },
          ].map(d => {
            const isPositive = !d.value.startsWith("−") && d.value !== "Neutral";
            return (
              <div key={d.label} className={cn("p-2.5 rounded-lg border text-center", d.value === "Neutral" ? "border-sky-500/15 bg-sky-500/5" : isPositive ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5")}>
                <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{d.label}</p>
                <p className={cn("text-[11px] font-mono font-bold", d.value === "Neutral" ? "text-sky-400" : isPositive ? "text-emerald-400" : "text-amber-400")}>{d.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.88)" }}>Projected Outcomes</p>
        <div className="space-y-2">
          {branch.outcomes.map(o => (
            <div key={o.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {o.positive ? <CheckCircle2 className="w-3 h-3 text-emerald-400/60" /> : <XCircle className="w-3 h-3 text-amber-400/60" />}
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{o.label}</span>
              </div>
              <span className={cn("text-[11px] font-mono", o.positive ? "text-emerald-400" : "text-amber-400")}>{o.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(196,90,74,0.12)" }}>
          <p className="text-[11px] font-semibold mb-2 flex items-center gap-1.5 text-red-400/80"><AlertTriangle className="w-3 h-3" />Key Risks</p>
          <ul className="space-y-1.5">
            {branch.risks.map((r, i) => <li key={i} className="text-[10px] flex gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}><span className="text-red-400/40 mt-0.5">•</span>{r}</li>)}
          </ul>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.12)" }}>
          <p className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: "rgba(107,143,113,0.9)" }}><CheckCircle2 className="w-3 h-3" />Mitigations</p>
          <ul className="space-y-1.5">
            {branch.mitigations.map((m, i) => <li key={i} className="text-[10px] flex gap-1.5" style={{ color: "rgba(255,255,255,0.4)" }}><span className="mt-0.5" style={{ color: "rgba(45,106,79,0.5)" }}>•</span>{m}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function TerraScenarioBranchesPage() {
  const [selected, setSelected] = useState<BranchId>("valuation-stress");
  const branch = BRANCHES.find(b => b.id === selected)!;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4" style={{ color: "#2d6a4f" }} />
            <h1 className="font-display text-xl font-bold" style={{ color: "rgba(255,255,255,0.88)" }}>Scenario Branches</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border" style={{ color: "#2d6a4f", borderColor: "rgba(45,106,79,0.3)", background: "rgba(45,106,79,0.08)" }}>ATLAS RUNTIME</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>Simulate diverging property worldlines — compare branch outcomes against baseline</p>
        </div>
      </div>

      {/* Baseline */}
      <div className="rounded-xl p-4" style={{ background: "rgba(5,10,8,0.8)", border: "1px solid rgba(45,106,79,0.15)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2d6a4f" }} />
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>Baseline Worldline — 84 Grand St, Williamsburg</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(BASELINE).map(([k, v]) => {
            const labels: Record<string, string> = { value: "AVM Value", irr: "IRR (5-yr)", cashOnCash: "Cash-on-Cash", noi: "Annual NOI", occupancy: "Occupancy" };
            return (
              <div key={k}>
                <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{labels[k]}</p>
                <p className="text-[12px] font-mono font-semibold" style={{ color: "rgba(255,255,255,0.78)" }}>{v}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Branch selector */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.28)" }}>Scenario Branches</p>
          {BRANCHES.map(b => {
            const Icon = b.icon;
            const isSelected = b.id === selected;
            return (
              <div key={b.id} onClick={() => setSelected(b.id)} className="p-3 rounded-xl border cursor-pointer transition-all" style={isSelected ? { borderColor: `${b.color}35`, background: `${b.color}08` } : { borderColor: "rgba(45,106,79,0.1)", background: "rgba(5,10,8,0.6)" }}>
                <div className="flex items-start gap-2.5">
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: b.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.78)" }}>{b.label}</p>
                    <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{b.subtitle}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.28)" }}>Probability</span>
                        <span className="text-[9px] font-mono" style={{ color: b.color }}>{b.probability}%</span>
                      </div>
                      <ProbabilityBar pct={b.probability} color={b.color} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Branch detail */}
        <div className="lg:col-span-3">
          <BranchDetail branch={branch} />
        </div>
      </div>
    </div>
  );
}
