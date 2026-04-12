import { useState } from "react";
import {
  Brain, Scale, TrendingUp, DollarSign, Clock, BarChart3,
  BookOpen, AlertTriangle, CheckCircle, ChevronRight, ChevronDown,
  Target, FileText, Activity, Eye, Loader2, RefreshCw
} from "lucide-react";

const ACCENT = "#c8a96e";
const BG = "#080c14";
const CARD = "#0c1220";
const BORDER = "rgba(255,255,255,0.06)";

interface ComparableCase {
  citation: string;
  court: string;
  year: number;
  similarity: number;
  outcome: "plaintiff" | "defendant" | "settlement";
  amount?: number;
  notes: string;
}

interface OraclePrediction {
  winProbability: number;
  settlementRangeLow: number;
  settlementRangeHigh: number;
  settlementMedian: number;
  timelineMonths: number;
  timelineRange: [number, number];
  confidenceScore: number;
  keyFactors: Array<{ label: string; impact: "positive" | "negative" | "neutral"; weight: number; description: string }>;
  comparableCases: ComparableCase[];
  riskFactors: string[];
  narrative: string;
}

interface MatterInput {
  matterType: string;
  jurisdiction: string;
  judge: string;
  opposingCounsel: string;
  damages: string;
}

const DEMO_INPUTS: MatterInput = {
  matterType: "Personal Injury — Motor Vehicle",
  jurisdiction: "Southern District of Florida",
  judge: "Hon. Patricia L. Moreno",
  opposingCounsel: "Nationwide Insurance / Davis & Hayes LLP",
  damages: "$180,000 claimed",
};

const DEMO_PREDICTION: OraclePrediction = {
  winProbability: 74,
  settlementRangeLow: 65000,
  settlementRangeHigh: 145000,
  settlementMedian: 92000,
  timelineMonths: 14,
  timelineRange: [9, 22],
  confidenceScore: 81,
  keyFactors: [
    { label: "Liability clarity", impact: "positive", weight: 0.28, description: "Police report assigns 100% fault to defendant. No contributory negligence arguments available to opposing counsel." },
    { label: "Medical documentation", impact: "positive", weight: 0.22, description: "Continuous treatment chain. No gaps. IME report from defense will face strong rebuttal from treating physicians." },
    { label: "Judge Moreno's settlement pressure", impact: "positive", weight: 0.18, description: "Judge Moreno has ordered mandatory mediation in 89% of her PI docket. Median time to mediation: 6 months. Her courtroom strongly incentivizes settlement." },
    { label: "Nationwide friction score", impact: "negative", weight: 0.15, description: "Nationwide is currently in a reserve tightening cycle. Their average offer/demand ratio has dropped from 0.68 to 0.54 in the last 6 months. Expect low initial offers." },
    { label: "Davis & Hayes opposing counsel", impact: "neutral", weight: 0.10, description: "Davis & Hayes settles 78% of cases they handle in this district. Aggressive at discovery but pragmatic at mediation. Average settlement timeline with them: 13 months." },
    { label: "Missing expert witness", impact: "negative", weight: 0.07, description: "No accident reconstruction expert retained. May weaken damages argument if liability is contested. Recommend engaging within 60 days." },
  ],
  comparableCases: [
    {
      citation: "Rodriguez v. Progressive Corp., No. 2024-CV-08821",
      court: "S.D. Fla.",
      year: 2024,
      similarity: 94,
      outcome: "settlement",
      amount: 87500,
      notes: "Similar injuries, same judge, same defense counsel firm. Settled at 9-month mark after mandatory mediation order.",
    },
    {
      citation: "Martinez v. GEICO, No. 2023-CV-04412",
      court: "S.D. Fla.",
      year: 2023,
      similarity: 87,
      outcome: "settlement",
      amount: 110000,
      notes: "Stronger soft tissue injuries, higher medical specials. Nationwide-equivalent reserve policy. Settled at mediation.",
    },
    {
      citation: "Williams v. State Farm, No. 2023-CV-07734",
      court: "S.D. Fla.",
      year: 2023,
      similarity: 81,
      outcome: "plaintiff",
      amount: 145000,
      notes: "Went to trial after breakdown in mediation. Jury verdict for plaintiff. Comparable vehicle speeds and mechanism of injury.",
    },
    {
      citation: "Chen v. Allstate, No. 2022-CV-03211",
      court: "S.D. Fla.",
      year: 2022,
      similarity: 75,
      outcome: "settlement",
      amount: 68000,
      notes: "Plaintiff had pre-existing conditions admitted at deposition — suppressed value. Gap in treatment reduced credibility.",
    },
  ],
  riskFactors: [
    "Nationwide currently appealing similar verdict in 11th Circuit — outcome may affect settlement posture",
    "Discovery cutoff in 90 days — depositions not yet scheduled",
    "Missing accident reconstruction expert could expose liability argument at trial",
    "Statute of limitations on any additional defendants expires in 45 days",
  ],
  narrative: "Based on 94 comparable matters in the S.D. Fla. over 36 months, this matter presents a strong liability posture with meaningful upside. The primary risk is Nationwide's current reserve-tightening cycle — they are offering 15% below historical averages for similar claims. Judge Moreno's mandatory mediation practice creates a natural forcing function at the 6-month mark. Optimal strategy: build the record aggressively in discovery, retain the accident reconstruction expert within 60 days, and prepare for a mediation demand in the $125,000 range that leaves room to settle at the $92,000 median. Trial exposure is estimated at $145,000+ if mediation fails.",
};

function ProbabilityGauge({ value, color }: { value: number; color: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="72" cy="72" r="54" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="text-center">
        <div className="text-3xl font-bold font-mono" style={{ color }}>{value}%</div>
        <div className="text-[8px] text-slate-500">Win Probability</div>
      </div>
    </div>
  );
}

function FactorBar({ factor }: { factor: OraclePrediction["keyFactors"][0] }) {
  const colors = { positive: "#22c55e", negative: "#ef4444", neutral: "#64748b" };
  const c = colors[factor.impact];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 rounded-lg border cursor-pointer transition-colors" style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }} onClick={() => setExpanded(!expanded)}>
      <div className="flex items-center gap-3">
        <div className="w-24 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full" style={{ width: `${factor.weight * 100 * 3.33}%`, background: c }} />
        </div>
        <span className="text-[10px] font-medium text-slate-300 flex-1">{factor.label}</span>
        <span className="text-[9px] font-bold" style={{ color: c }}>
          {factor.impact === "positive" ? "↑" : factor.impact === "negative" ? "↓" : "→"}
          {Math.round(factor.weight * 100)}%
        </span>
      </div>
      {expanded && (
        <p className="mt-2 text-[10px] text-slate-400 leading-relaxed pl-27">{factor.description}</p>
      )}
    </div>
  );
}

export default function CaseOraclePage() {
  const [loading, setLoading] = useState(false);
  const [predicted, setPredicted] = useState(false);
  const p = DEMO_PREDICTION;

  function runPrediction() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setPredicted(true); }, 2000);
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-semibold text-slate-100">Case Outcome Oracle</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium ml-1" style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
            AI PREDICTION ENGINE
          </span>
        </div>
        <p className="text-xs text-slate-500">Settlement ranges, win probability, and timeline projections based on case characteristics, jurisdiction, and comparable cases</p>
      </div>

      <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Case Parameters</div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(DEMO_INPUTS).map(([k, v]) => (
            <div key={k}>
              <div className="text-[9px] text-slate-500 mb-0.5">{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</div>
              <div className="text-[11px] text-slate-200">{v}</div>
            </div>
          ))}
        </div>
        <button
          onClick={runPrediction}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {loading ? "Running prediction model…" : predicted ? "Re-run Oracle" : "Run Case Oracle"}
        </button>
      </div>

      {loading && (
        <div className="rounded-lg border p-8 flex flex-col items-center gap-3" style={{ background: CARD, borderColor: BORDER }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT }} />
          <div className="text-sm text-slate-400">Analyzing 94 comparable cases in S.D. Fla…</div>
          <div className="text-[10px] text-slate-600">Running settlement range model · Scoring judge history · Evaluating opposing counsel track record</div>
        </div>
      )}

      {predicted && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 rounded-lg border p-5 flex flex-col items-center justify-center" style={{ background: CARD, borderColor: BORDER }}>
              <ProbabilityGauge value={p.winProbability} color="#22c55e" />
              <div className="mt-3 text-center">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Confidence</div>
                <div className="text-sm font-semibold" style={{ color: ACCENT }}>{p.confidenceScore}% model confidence</div>
                <div className="text-[9px] text-slate-600 mt-0.5">±7% margin</div>
              </div>
            </div>
            <div className="col-span-2 rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-4">Settlement Range Estimate</div>
              <div className="flex items-end gap-2 mb-4">
                <div className="text-[11px] text-slate-500">Low</div>
                <div className="text-2xl font-bold font-mono text-slate-400">${p.settlementRangeLow.toLocaleString()}</div>
                <div className="text-slate-600 mb-1">–</div>
                <div className="text-2xl font-bold font-mono text-slate-200">${p.settlementRangeHigh.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 mb-1">High</div>
              </div>
              <div className="relative h-3 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    left: `${(p.settlementRangeLow / 180000) * 100}%`,
                    right: `${100 - (p.settlementRangeHigh / 180000) * 100}%`,
                    background: "linear-gradient(90deg, rgba(34,197,94,0.5), rgba(200,169,110,0.7))",
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2"
                  style={{
                    left: `${(p.settlementMedian / 180000) * 100}%`,
                    transform: "translateX(-50%) translateY(-50%)",
                    background: ACCENT,
                    borderColor: "#080c14",
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-3 h-3 rounded-full" style={{ background: ACCENT }} />
                <span className="text-slate-300">Median settlement: <span className="font-bold" style={{ color: ACCENT }}>${p.settlementMedian.toLocaleString()}</span></span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] text-slate-500 mb-0.5">Estimated Timeline</div>
                  <div className="text-base font-bold font-mono text-slate-200">{p.timelineMonths} months</div>
                  <div className="text-[9px] text-slate-600">Range: {p.timelineRange[0]}–{p.timelineRange[1]} months</div>
                </div>
                <div className="rounded-md p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] text-slate-500 mb-0.5">Comparable Cases</div>
                  <div className="text-base font-bold font-mono text-slate-200">{p.comparableCases.length} found</div>
                  <div className="text-[9px] text-slate-600">Top match: {p.comparableCases[0].similarity}% similar</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-slate-100">Predictive Factors</span>
            </div>
            <div className="space-y-2">
              {p.keyFactors.map((f) => <FactorBar key={f.label} factor={f} />)}
            </div>
          </div>

          <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold text-slate-100">Comparable Case Citations</span>
            </div>
            <div className="space-y-3">
              {p.comparableCases.map((c) => (
                <div key={c.citation} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-mono font-semibold text-slate-200">{c.citation}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{c.court} · {c.year} · {c.similarity}% similarity</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono" style={{ color: c.outcome === "settlement" ? ACCENT : c.outcome === "plaintiff" ? "#22c55e" : "#ef4444" }}>
                        {c.amount ? `$${c.amount.toLocaleString()}` : "N/A"}
                      </div>
                      <div className="text-[9px] capitalize" style={{ color: "#64748b" }}>{c.outcome}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">{c.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-5" style={{ background: "rgba(200,169,110,0.04)", borderColor: `${ACCENT}25` }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-semibold text-slate-100">Oracle Strategic Narrative</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{p.narrative}</p>
            <div className="mt-4">
              <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-2">Risk Flags</div>
              <div className="space-y-1.5">
                {p.riskFactors.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-slate-400">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
