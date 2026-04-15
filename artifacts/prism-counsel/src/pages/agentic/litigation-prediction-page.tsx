import { useState, useMemo } from "react";
import { TrendingUp, Scale, Target, BarChart3, Clock, DollarSign, Users, AlertTriangle, ChevronDown, Gavel, Brain, ArrowRight, Shield, Percent } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface JudgeProfile {
  name: string;
  court: string;
  casesAnalyzed: number;
  plaintiffWinRate: number;
  avgSettlement: number;
  medianTimeToTrial: number;
  temperament: string;
  notablePreferences: string[];
}

interface CasePredictor {
  id: string;
  title: string;
  type: string;
  jurisdiction: string;
  judge: JudgeProfile;
  opposingCounsel: { name: string; firm: string; winRate: number; style: string };
  damagesClaimed: number;
  prediction: {
    plaintiffWinProb: number;
    settlementRange: [number, number];
    recommendedSettlement: number;
    trialCostEstimate: number;
    settlementCostEstimate: number;
    timeToResolution: { settlement: number; trial: number };
    confidenceInterval: number;
    modelVersion: string;
  };
  factors: { name: string; score: number; weight: number; direction: "favorable" | "neutral" | "unfavorable" }[];
}

const CASES: CasePredictor[] = [
  {
    id: "LIT-2024-0087",
    title: "Martinez v. Pinnacle Freight LLC",
    type: "Commercial Auto — Personal Injury",
    jurisdiction: "SDNY",
    judge: { name: "Hon. Margaret A. Kessler", court: "SDNY", casesAnalyzed: 342, plaintiffWinRate: 58, avgSettlement: 820_000, medianTimeToTrial: 24, temperament: "Methodical", notablePreferences: ["Strong on discovery compliance", "Prefers stipulated facts", "Limits expert testimony scope"] },
    opposingCounsel: { name: "David Chen", firm: "Morrison & Associates", winRate: 64, style: "Aggressive — early motion practice" },
    damagesClaimed: 1_200_000,
    prediction: {
      plaintiffWinProb: 62,
      settlementRange: [380_000, 720_000],
      recommendedSettlement: 545_000,
      trialCostEstimate: 285_000,
      settlementCostEstimate: 48_000,
      timeToResolution: { settlement: 6, trial: 22 },
      confidenceInterval: 78,
      modelVersion: "PRISM-LPE-v4.2",
    },
    factors: [
      { name: "Liability Strength", score: 72, weight: 0.25, direction: "unfavorable" },
      { name: "Damages Quantum", score: 65, weight: 0.20, direction: "neutral" },
      { name: "Judge History", score: 58, weight: 0.15, direction: "unfavorable" },
      { name: "Jurisdiction Favorability", score: 55, weight: 0.12, direction: "neutral" },
      { name: "Opposing Counsel Track Record", score: 64, weight: 0.10, direction: "unfavorable" },
      { name: "Evidentiary Completeness", score: 81, weight: 0.10, direction: "favorable" },
      { name: "Comparable Verdicts", score: 68, weight: 0.08, direction: "neutral" },
    ],
  },
  {
    id: "LIT-2024-0122",
    title: "Chen v. Harbor Point Insurance",
    type: "Bad Faith — Coverage Denial",
    jurisdiction: "EDNY",
    judge: { name: "Hon. Robert T. Franklin", court: "EDNY", casesAnalyzed: 218, plaintiffWinRate: 67, avgSettlement: 1_150_000, medianTimeToTrial: 18, temperament: "Plaintiff-Sympathetic", notablePreferences: ["Awards generous discovery periods", "Skeptical of delay tactics", "Encourages mediation"] },
    opposingCounsel: { name: "Sarah Blackwell", firm: "Blackwell & Rodriguez", winRate: 71, style: "Meticulous — paper-heavy strategy" },
    damagesClaimed: 850_000,
    prediction: {
      plaintiffWinProb: 71,
      settlementRange: [520_000, 940_000],
      recommendedSettlement: 680_000,
      trialCostEstimate: 340_000,
      settlementCostEstimate: 62_000,
      timeToResolution: { settlement: 4, trial: 16 },
      confidenceInterval: 82,
      modelVersion: "PRISM-LPE-v4.2",
    },
    factors: [
      { name: "Liability Strength", score: 78, weight: 0.25, direction: "unfavorable" },
      { name: "Damages Quantum", score: 72, weight: 0.20, direction: "unfavorable" },
      { name: "Judge History", score: 67, weight: 0.15, direction: "unfavorable" },
      { name: "Jurisdiction Favorability", score: 70, weight: 0.12, direction: "unfavorable" },
      { name: "Opposing Counsel Track Record", score: 71, weight: 0.10, direction: "unfavorable" },
      { name: "Evidentiary Completeness", score: 55, weight: 0.10, direction: "favorable" },
      { name: "Comparable Verdicts", score: 74, weight: 0.08, direction: "unfavorable" },
    ],
  },
];

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;
const dirColor = (d: string) => d === "favorable" ? "#22c55e" : d === "unfavorable" ? "#ef4444" : PRISM_BLUE;

export default function LitigationPredictionPage() {
  const [selected, setSelected] = useState(CASES[0]);
  const [scenarioAdjustment, setScenarioAdjustment] = useState(0);
  const [strategyNotes, setStrategyNotes] = useState("");

  const adjustedPrediction = useMemo(() => {
    const base = selected.prediction;
    const adj = scenarioAdjustment;
    const winProb = Math.max(5, Math.min(95, base.plaintiffWinProb + adj));
    const factor = 1 + (adj / 100);
    return {
      ...base,
      plaintiffWinProb: winProb,
      recommendedSettlement: Math.round(base.recommendedSettlement * factor),
      settlementCostEstimate: Math.round(base.settlementCostEstimate * factor),
      settlementRange: [Math.round(base.settlementRange[0] * factor), Math.round(base.settlementRange[1] * factor)] as [number, number],
    };
  }, [selected, scenarioAdjustment]);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white tracking-tight">Litigation Prediction Engine</h1>
          <p className="text-[11px] text-white/30 mt-1">ML-powered outcome prediction with judge analysis, counsel profiling, and cost modeling</p>
        </div>

        <div className="flex gap-3 mb-8">
          {CASES.map(c => (
            <button key={c.id} onClick={() => setSelected(c)} aria-label={`Select case ${c.title}`}
              className={`flex-1 text-left rounded-xl border p-4 transition ${selected.id === c.id ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"}`}>
              <span className="text-[9px] font-mono text-white/20">{c.id}</span>
              <p className="text-sm font-medium text-white mt-0.5">{c.title}</p>
              <p className="text-[10px] text-white/30">{c.type}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[10px] text-white/20">Win Prob: <span className="font-semibold" style={{ color: c.prediction.plaintiffWinProb > 60 ? "#ef4444" : "#22c55e" }}>{c.prediction.plaintiffWinProb}%</span></span>
                <span className="text-[10px] text-white/20">Settle: <span className="font-semibold" style={{ color: PRISM_GOLD }}>{fmt(c.prediction.recommendedSettlement)}</span></span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Outcome Prediction</h3>
                <span className="text-[9px] font-mono text-white/20">{selected.prediction.modelVersion} · Confidence: {selected.prediction.confidenceInterval}%</span>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Plaintiff Win Probability", value: `${adjustedPrediction.plaintiffWinProb}%`, icon: Target, color: adjustedPrediction.plaintiffWinProb > 60 ? "#ef4444" : "#22c55e" },
                  { label: "Recommended Settlement", value: fmt(adjustedPrediction.recommendedSettlement), icon: DollarSign, color: PRISM_GOLD },
                  { label: "Trial Cost Estimate", value: fmt(adjustedPrediction.trialCostEstimate), icon: Scale, color: PRISM_RED },
                  { label: "Settlement Cost", value: fmt(adjustedPrediction.settlementCostEstimate), icon: BarChart3, color: PRISM_BLUE },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <s.icon className="h-3 w-3" style={{ color: s.color }} />
                      <span className="text-[8px] uppercase tracking-wider text-white/25">{s.label}</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-4 mb-4">
                <h4 className="text-[9px] uppercase tracking-wider text-white/25 mb-3">Settlement Range Distribution</h4>
                <div className="relative h-10 rounded-lg overflow-hidden bg-white/[0.03]">
                  {(() => {
                    const lo = adjustedPrediction.settlementRange[0];
                    const hi = adjustedPrediction.settlementRange[1];
                    const rec = adjustedPrediction.recommendedSettlement;
                    const max = hi * 1.3;
                    return (
                      <>
                        <div className="absolute top-0 bottom-0 rounded-lg" style={{ left: `${(lo / max) * 100}%`, width: `${((hi - lo) / max) * 100}%`, background: `linear-gradient(90deg, ${PRISM_BLUE}30, ${PRISM_GOLD}30)` }} />
                        <div className="absolute top-0 bottom-0 w-0.5" style={{ left: `${(rec / max) * 100}%`, background: PRISM_GOLD }} />
                        <div className="absolute top-full mt-1 text-[8px] font-mono" style={{ left: `${(lo / max) * 100}%`, color: PRISM_BLUE }}>{fmt(lo)}</div>
                        <div className="absolute text-[8px] font-mono font-bold" style={{ left: `${(rec / max) * 100}%`, top: "-14px", color: PRISM_GOLD, transform: "translateX(-50%)" }}>{fmt(rec)}</div>
                        <div className="absolute top-full mt-1 text-[8px] font-mono" style={{ left: `${(hi / max) * 100}%`, color: PRISM_BLUE, transform: "translateX(-100%)" }}>{fmt(hi)}</div>
                      </>
                    );
                  })()}
                </div>
                <div className="h-6" />
              </div>

              <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[9px] uppercase tracking-wider text-white/25">Scenario Modeling</h4>
                  {scenarioAdjustment !== 0 && (
                    <button onClick={() => setScenarioAdjustment(0)} aria-label="Reset scenario" className="text-[8px] text-white/20 hover:text-white/35 transition">Reset</button>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <label htmlFor="scenario-slider" className="text-[9px] text-white/30 whitespace-nowrap">Adjust Win Probability</label>
                  <input id="scenario-slider" type="range" min={-30} max={30} value={scenarioAdjustment} onChange={e => setScenarioAdjustment(Number(e.target.value))}
                    aria-label="Scenario win probability adjustment"
                    className="flex-1 h-1 appearance-none rounded-full bg-white/[0.08] accent-[#c8a96e] cursor-pointer" />
                  <span className="text-[10px] font-mono font-semibold w-10 text-right" style={{ color: scenarioAdjustment > 0 ? "#ef4444" : scenarioAdjustment < 0 ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                    {scenarioAdjustment > 0 ? "+" : ""}{scenarioAdjustment}%
                  </span>
                </div>
                <textarea value={strategyNotes} onChange={e => setStrategyNotes(e.target.value)}
                  aria-label="Strategy notes"
                  placeholder="Add strategy notes for this scenario..."
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-[10px] text-white/50 placeholder:text-white/15 focus:outline-none focus:border-white/[0.12] resize-none h-14" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                  <h4 className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Settlement Path</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] text-white/40">{selected.prediction.timeToResolution.settlement} months</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] text-white/40">Total exposure: {fmt(selected.prediction.recommendedSettlement + selected.prediction.settlementCostEstimate)}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                  <h4 className="text-[9px] uppercase tracking-wider text-white/25 mb-2">Trial Path</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] text-white/40">{selected.prediction.timeToResolution.trial} months</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] text-white/40">Total exposure: {fmt(selected.prediction.trialCostEstimate + selected.prediction.settlementRange[1])}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Prediction Factors ({selected.factors.length})</h3>
              <div className="space-y-2">
                {selected.factors.map(f => (
                  <div key={f.name} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                    <div className="w-32">
                      <p className="text-[10px] font-medium text-white">{f.name}</p>
                      <p className="text-[8px] uppercase tracking-wider" style={{ color: dirColor(f.direction) }}>{f.direction}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${f.score}%`, background: dirColor(f.direction) }} />
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-white w-10 text-right">{f.score}</span>
                    <span className="text-[9px] text-white/20 w-12 text-right">{(f.weight * 100).toFixed(0)}% wt</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gavel className="h-3.5 w-3.5" style={{ color: PRISM_GOLD }} />
                <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Judge Profile</h3>
              </div>
              <p className="text-sm font-medium text-white mb-0.5">{selected.judge.name}</p>
              <p className="text-[10px] text-white/30 mb-3">{selected.judge.court} · {selected.judge.casesAnalyzed} cases analyzed</p>
              {[
                { label: "Plaintiff Win Rate", value: `${selected.judge.plaintiffWinRate}%` },
                { label: "Avg Settlement", value: fmt(selected.judge.avgSettlement) },
                { label: "Median Time to Trial", value: `${selected.judge.medianTimeToTrial} mo` },
                { label: "Temperament", value: selected.judge.temperament },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <span className="text-[10px] text-white/30">{s.label}</span>
                  <span className="text-[10px] font-semibold text-white">{s.value}</span>
                </div>
              ))}
              <div className="mt-3">
                <p className="text-[8px] uppercase tracking-wider text-white/20 mb-1.5">Notable Preferences</p>
                {selected.judge.notablePreferences.map(p => (
                  <p key={p} className="text-[9px] text-white/35 flex items-center gap-1.5 mb-1">
                    <span className="h-1 w-1 rounded-full" style={{ background: PRISM_GOLD }} />
                    {p}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-3.5 w-3.5" style={{ color: PRISM_BLUE }} />
                <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Opposing Counsel</h3>
              </div>
              <p className="text-sm font-medium text-white">{selected.opposingCounsel.name}</p>
              <p className="text-[10px] text-white/30 mb-3">{selected.opposingCounsel.firm}</p>
              {[
                { label: "Win Rate", value: `${selected.opposingCounsel.winRate}%` },
                { label: "Style", value: selected.opposingCounsel.style },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <span className="text-[10px] text-white/30">{s.label}</span>
                  <span className="text-[10px] font-semibold text-white">{s.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">AI Recommendation</h3>
              <div className="rounded-lg p-3" style={{ background: PRISM_GOLD + "08", borderLeft: `2px solid ${PRISM_GOLD}` }}>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Based on analysis of {selected.judge.casesAnalyzed} comparable cases under {selected.judge.name}, opposing counsel's {selected.opposingCounsel.style.toLowerCase()} approach, and current evidentiary position, PRISM recommends <strong className="text-white">settlement at {fmt(selected.prediction.recommendedSettlement)}</strong> within {selected.prediction.timeToResolution.settlement} months. Trial path yields net-negative expected value of {fmt(selected.prediction.trialCostEstimate + selected.prediction.settlementRange[1] * selected.prediction.plaintiffWinProb / 100)} after cost adjustment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
