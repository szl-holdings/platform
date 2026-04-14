import { useState } from "react";
import { DollarSign, TrendingUp, BarChart3, Target, Clock, AlertTriangle, ChevronDown } from "lucide-react";

const PRISM_GOLD = "#c8a96e";

interface PhaseEstimate {
  phase: string;
  lowCost: number;
  highCost: number;
  duration: number;
  keyActivities: string[];
  settlementOdds: number;
}

const PHASES: PhaseEstimate[] = [
  {
    phase: "Pre-Litigation / Demand",
    lowCost: 8_000,
    highCost: 18_000,
    duration: 2,
    keyActivities: ["Demand letter response", "Initial investigation", "Coverage analysis", "Early settlement evaluation"],
    settlementOdds: 22,
  },
  {
    phase: "Pleadings & Early Motion Practice",
    lowCost: 12_000,
    highCost: 28_000,
    duration: 3,
    keyActivities: ["Answer & affirmative defenses", "Rule 12 motions", "Venue challenges", "Third-party practice"],
    settlementOdds: 34,
  },
  {
    phase: "Discovery",
    lowCost: 45_000,
    highCost: 110_000,
    duration: 9,
    keyActivities: ["Document production", "Interrogatories", "Depositions (fact)", "ESI review", "Subpoenas"],
    settlementOdds: 58,
  },
  {
    phase: "Expert Designation & Reports",
    lowCost: 30_000,
    highCost: 75_000,
    duration: 4,
    keyActivities: ["Expert witness retention", "Expert report prep", "Daubert preparation", "Counter-expert review"],
    settlementOdds: 65,
  },
  {
    phase: "Dispositive Motions",
    lowCost: 18_000,
    highCost: 42_000,
    duration: 4,
    keyActivities: ["Summary judgment briefing", "Opposition & reply", "Oral argument prep", "Post-motion strategy"],
    settlementOdds: 72,
  },
  {
    phase: "Pre-Trial",
    lowCost: 22_000,
    highCost: 55_000,
    duration: 3,
    keyActivities: ["Joint pre-trial order", "Motions in limine", "Jury charge", "Exhibit prep", "Witness outlines"],
    settlementOdds: 84,
  },
  {
    phase: "Trial",
    lowCost: 65_000,
    highCost: 180_000,
    duration: 2,
    keyActivities: ["Voir dire", "Opening/closing", "Examination of witnesses", "Daily trial team support"],
    settlementOdds: 0,
  },
];

const SCENARIOS = [
  { id: "early", label: "Settle in Discovery", phases: 3, description: "Settlement reached during fact discovery — typical for moderate-severity cases with clear liability" },
  { id: "post-sj", label: "Settle Post-SJ", phases: 5, description: "Survives summary judgment but settles on courthouse steps — common in contested liability matters" },
  { id: "full-trial", label: "Full Trial", phases: 7, description: "Case goes through verdict — highest cost but sometimes necessary for coverage or precedent reasons" },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function CumulativeCostBar({ phases, selected }: { phases: PhaseEstimate[]; selected: number }) {
  const totalLow = phases.slice(0, selected).reduce((s, p) => s + p.lowCost, 0);
  const totalHigh = phases.slice(0, selected).reduce((s, p) => s + p.highCost, 0);
  const fullLow = phases.reduce((s, p) => s + p.lowCost, 0);
  const fullHigh = phases.reduce((s, p) => s + p.highCost, 0);
  const pctLow = (totalLow / fullHigh) * 100;
  const pctHigh = (totalHigh / fullHigh) * 100;

  return (
    <div className="space-y-2">
      <div className="relative h-3 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="absolute h-full rounded-full" style={{ width: `${pctHigh}%`, background: "#c45a4a55" }} />
        <div className="absolute h-full rounded-full" style={{ width: `${pctLow}%`, background: "#c45a4acc" }} />
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500">Defense cost through selected scenario</span>
        <span className="font-mono text-slate-200">{fmt(totalLow)} – {fmt(totalHigh)}</span>
      </div>
    </div>
  );
}

export default function LitigationCostPage() {
  const [activeScenario, setActiveScenario] = useState("early");
  const scenario = SCENARIOS.find(s => s.id === activeScenario)!;
  const activePhases = PHASES.slice(0, scenario.phases);

  const totalLow = activePhases.reduce((s, p) => s + p.lowCost, 0);
  const totalHigh = activePhases.reduce((s, p) => s + p.highCost, 0);
  const totalMonths = activePhases.reduce((s, p) => s + p.duration, 0);
  const settlementOdds = activePhases.length > 0 ? activePhases[activePhases.length - 1]!.settlementOdds : 0;

  const fullTrialLow = PHASES.reduce((s, p) => s + p.lowCost, 0);
  const fullTrialHigh = PHASES.reduce((s, p) => s + p.highCost, 0);
  const savingsLow = fullTrialLow - totalLow;
  const savingsHigh = fullTrialHigh - totalHigh;

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-5 h-5" style={{ color: PRISM_GOLD }} />
          <h1 className="text-lg font-semibold text-slate-100">Litigation Cost Forecaster</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium border" style={{ background: `${PRISM_GOLD}15`, color: PRISM_GOLD, borderColor: `${PRISM_GOLD}30` }}>
            PHASE-BY-PHASE MODEL
          </span>
        </div>
        <p className="text-xs text-slate-500">Total litigation cost through each phase with settlement-vs-trial scenario modeling — helping clients make informed business decisions about when to fight versus settle</p>
      </div>

      {/* Scenario Selector */}
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-3">Settlement Scenario</div>
        <div className="grid grid-cols-3 gap-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                activeScenario === s.id
                  ? "border-[#c8a96e]/40 bg-[#c8a96e]/5"
                  : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-200 mb-1">{s.label}</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Projected Defense Cost", value: `${fmt(totalLow)}–${fmt(totalHigh)}`, sub: "Low–high range", color: "#c45a4a" },
          { label: "Timeline", value: `${totalMonths}mo`, sub: "Estimated duration", color: PRISM_GOLD },
          { label: "Settlement Probability", value: `${settlementOdds}%`, sub: "At this phase", color: "#4a90b8" },
          { label: "Cost vs Full Trial", value: activeScenario === "full-trial" ? "—" : `Save ${fmt((savingsLow + savingsHigh)/2)}`, sub: "vs going to verdict", color: "#4a90b8" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="text-[9px] font-medium text-slate-500 uppercase tracking-wider mb-2">{stat.label}</div>
            <div className="text-base font-semibold font-mono text-slate-100" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Cost Progress Bar */}
      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <div className="text-xs font-semibold text-slate-200 mb-3">Cumulative Cost vs. Full Trial</div>
        <CumulativeCostBar phases={PHASES} selected={scenario.phases} />
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
          <span>Full trial estimate: {fmt(fullTrialLow)} – {fmt(fullTrialHigh)}</span>
          <span>Selected scenario: {Math.round((totalHigh/fullTrialHigh)*100)}% of max trial cost</span>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <div className="text-xs font-semibold text-slate-200 mb-4">Phase-by-Phase Breakdown</div>
        <div className="space-y-3">
          {PHASES.map((phase, i) => {
            const isActive = i < scenario.phases;
            const isCurrent = i === scenario.phases - 1;
            return (
              <div key={phase.phase} className={`rounded-lg border p-4 transition-all ${
                isCurrent ? "border-[#c8a96e]/30" : isActive ? "border-white/[0.06]" : "border-white/[0.03] opacity-40"
              }`} style={{ background: isCurrent ? `${PRISM_GOLD}08` : "#080c14" }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                      isCurrent ? "bg-[#c8a96e] text-black" : isActive ? "bg-white/[0.08] text-slate-400" : "bg-white/[0.04] text-slate-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-200">{phase.phase}</div>
                      <div className="text-[9px] text-slate-500">{phase.duration} months · Settlement odds: {phase.settlementOdds}%</div>
                    </div>
                    {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#c8a96e]/30 text-[#c8a96e] bg-[#c8a96e]/10">SCENARIO END</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-semibold text-slate-200">{fmt(phase.lowCost)} – {fmt(phase.highCost)}</div>
                    <div className="text-[9px] text-slate-600 mt-0.5">phase cost estimate</div>
                  </div>
                </div>
                {isActive && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {phase.keyActivities.map((a, j) => (
                      <span key={j} className="px-1.5 py-0.5 rounded text-[8px] text-slate-400 border border-white/[0.06]" style={{ background: "#0c1220" }}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Framework */}
      <div className="rounded-lg border border-[#d4a054]/20 p-5" style={{ background: "#d4a05408" }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-[#d4a054]" />
          <div className="text-xs font-semibold text-slate-200">Economic Decision Framework</div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-[10px]">
          <div>
            <div className="text-[9px] font-medium text-[#4a90b8] uppercase mb-1.5">Fight Case If</div>
            <ul className="space-y-1 text-slate-400">
              <li>• Coverage dispute creates precedent risk</li>
              <li>• Liability genuinely contested</li>
              <li>• Damages are speculative</li>
              <li>• Claimant demand exceeds model ceiling</li>
            </ul>
          </div>
          <div>
            <div className="text-[9px] font-medium text-[#d4a054] uppercase mb-1.5">Evaluate Settlement If</div>
            <ul className="space-y-1 text-slate-400">
              <li>• Defense cost &gt; 40% of demand</li>
              <li>• Expert witness risk is high</li>
              <li>• Judge has high plaintiff verdict rate</li>
              <li>• Opposing counsel is elite-tier threat</li>
            </ul>
          </div>
          <div>
            <div className="text-[9px] font-medium text-[#c45a4a] uppercase mb-1.5">Settle Immediately If</div>
            <ul className="space-y-1 text-slate-400">
              <li>• Liability is clear and documented</li>
              <li>• Injuries are severe and sympathetic</li>
              <li>• Case in high-plaintiff-verdict venue</li>
              <li>• Reserve exceeds post-SJ cost threshold</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
