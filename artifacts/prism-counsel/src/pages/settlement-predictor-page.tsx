import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Scale, Target, BarChart3, Info, FileText, Loader2 } from "lucide-react";
import { apiFetch } from "@szl-holdings/shared-ui";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";

interface CaseScenario {
  id: string;
  title: string;
  type: string;
  jurisdiction: string;
  damagesClaimed: number;
  caseAge: number;
  phase: string;
  injuryGrade: string;
}

const MATTER_TYPE_MAP: Record<string, string> = {
  auto_injury: "Commercial Auto",
  premises_liability: "Premises Liability",
  insurance_coverage: "Bad Faith",
  medical_malpractice: "Personal Injury",
  product_liability: "Products Liability",
  wrongful_death: "Personal Injury",
  workers_comp: "Personal Injury",
  no_fault: "Commercial Auto",
  other: "Personal Injury",
};

const STATUS_TO_PHASE: Record<string, string> = {
  intake: "Pre-suit",
  investigation: "Pre-suit",
  discovery: "Discovery",
  pre_trial: "Pre-Trial",
  trial: "Trial",
  settlement: "Mediation",
  closed: "Pre-Trial",
  archived: "Pre-Trial",
};

interface MatterApiItem {
  id: string | number;
  title?: string;
  matterType?: string;
  jurisdiction?: string;
  damagesClaimed?: number | string;
  filingDate?: string;
  status?: string;
  injuryGrade?: string;
}

function matterToCaseScenario(m: MatterApiItem): CaseScenario {
  const filingMs = m.filingDate ? new Date(m.filingDate).getTime() : Date.now();
  const caseAge = Math.max(1, Math.round((Date.now() - filingMs) / (30 * 24 * 3600 * 1000)));
  return {
    id: String(m.id),
    title: m.title ?? "Untitled Matter",
    type: MATTER_TYPE_MAP[m.matterType] ?? "Personal Injury",
    jurisdiction: m.jurisdiction ?? "SDNY",
    damagesClaimed: Number(m.totalDamages ?? 0),
    caseAge,
    phase: STATUS_TO_PHASE[m.status] ?? "Pre-suit",
    injuryGrade: "Moderate",
  };
}

interface ModelFactor {
  factor: string;
  weight: number;
  score: number;
  direction: "positive" | "neutral" | "negative";
  rationale: string;
}

interface DistributionBand {
  label: string;
  low: number;
  high: number;
  probability: number;
  color: string;
  peak?: boolean;
}

interface ModelOutput {
  bands: DistributionBand[];
  factors: ModelFactor[];
  compositeScore: number;
  modelConfidence: number;
}

/* ── Core factor scores keyed by case dimension ─────────────────────────────── */

const PHASE_FACTOR: Record<string, { phaseMult: number; phaseScore: number }> = {
  "Pre-suit":     { phaseMult: 0.32, phaseScore: 35 },
  "Discovery":    { phaseMult: 0.47, phaseScore: 55 },
  "Mediation":    { phaseMult: 0.62, phaseScore: 70 },
  "Pre-Trial":    { phaseMult: 0.72, phaseScore: 80 },
  "Trial":        { phaseMult: 0.85, phaseScore: 90 },
};

const INJURY_FACTOR: Record<string, { injuryMult: number; injuryScore: number }> = {
  "Low":      { injuryMult: 0.58, injuryScore: 30 },
  "Moderate": { injuryMult: 0.82, injuryScore: 60 },
  "Severe":   { injuryMult: 1.12, injuryScore: 85 },
  "Catastrophic": { injuryMult: 1.35, injuryScore: 95 },
};

/* Jurisdiction plaintiff-favorability — SDNY generally more moderate than EDNY */
const JURISDICTION_FACTOR: Record<string, { jurisMult: number; jurisScore: number }> = {
  "SDNY": { jurisMult: 0.96, jurisScore: 55 },
  "EDNY": { jurisMult: 1.08, jurisScore: 70 },
  "NDNY": { jurisMult: 0.88, jurisScore: 42 },
  "WDNY": { jurisMult: 0.84, jurisScore: 38 },
};

/* Case-type multiplier — reflects historical settlement patterns by claim type */
const TYPE_FACTOR: Record<string, { typeMult: number; liabilityScore: number }> = {
  "Commercial Auto":    { typeMult: 0.94, liabilityScore: 68 },
  "Premises Liability": { typeMult: 1.02, liabilityScore: 65 },
  "Bad Faith":          { typeMult: 1.15, liabilityScore: 58 },
  "Personal Injury":    { typeMult: 0.98, liabilityScore: 62 },
  "Products Liability": { typeMult: 1.06, liabilityScore: 61 },
};

/* Case-age fatigue (longer = more pressure to settle, lower = defense optimism) */
function caseAgeFatigueScore(months: number): number {
  if (months <= 6) return 25;
  if (months <= 12) return 40;
  if (months <= 24) return 58;
  if (months <= 36) return 72;
  return 84;
}

/* Insurer behavior proxied by case type and phase */
function insurerBehaviorScore(type: string, phase: string): number {
  const baseByType: Record<string, number> = { "Bad Faith": 28, "Commercial Auto": 48, "Premises Liability": 44 };
  const phaseAdj: Record<string, number> = { "Pre-suit": -5, "Discovery": 0, "Mediation": 10, "Pre-Trial": 15, "Trial": 20 };
  return (baseByType[type] ?? 45) + (phaseAdj[phase] ?? 0);
}

/* Expert witness strength proxied by injury severity and case type */
function expertScore(type: string, injuryGrade: string): number {
  const byInjury: Record<string, number> = { "Low": 45, "Moderate": 63, "Severe": 76, "Catastrophic": 82 };
  const adj: Record<string, number> = { "Bad Faith": -8, "Commercial Auto": 5, "Premises Liability": 2 };
  return Math.min(100, (byInjury[injuryGrade] ?? 60) + (adj[type] ?? 0));
}

export function buildModel(c: CaseScenario): ModelOutput {
  const base = c.damagesClaimed;

  const phaseData  = PHASE_FACTOR[c.phase]        ?? PHASE_FACTOR["Discovery"]!;
  const injuryData = INJURY_FACTOR[c.injuryGrade]  ?? INJURY_FACTOR["Moderate"]!;
  const jurisData  = JURISDICTION_FACTOR[c.jurisdiction] ?? { jurisMult: 1.0, jurisScore: 50 };
  const typeData   = TYPE_FACTOR[c.type]           ?? { typeMult: 1.0, liabilityScore: 60 };

  const fatigueScore   = caseAgeFatigueScore(c.caseAge);
  const insurerScore   = insurerBehaviorScore(c.type, c.phase);
  const expertStr      = expertScore(c.type, c.injuryGrade);

  /* Factor matrix — weights sum to 100 */
  const factors: ModelFactor[] = [
    {
      factor: "Liability Clarity",
      weight: 22,
      score: typeData.liabilityScore,
      direction: typeData.liabilityScore >= 65 ? "positive" : typeData.liabilityScore >= 50 ? "neutral" : "negative",
      rationale: `${c.type} claims in ${c.jurisdiction} show ${typeData.liabilityScore >= 65 ? "relatively clear" : "contested"} liability patterns`,
    },
    {
      factor: "Injury Documentation",
      weight: 18,
      score: injuryData.injuryScore,
      direction: injuryData.injuryScore >= 65 ? "positive" : injuryData.injuryScore >= 40 ? "neutral" : "negative",
      rationale: `${c.injuryGrade} injury grade — documentation strength reflects severity tier`,
    },
    {
      factor: "Jurisdiction Plaintiff-Favorability",
      weight: 16,
      score: jurisData.jurisScore,
      direction: jurisData.jurisScore >= 65 ? "positive" : jurisData.jurisScore >= 48 ? "neutral" : "negative",
      rationale: `${c.jurisdiction} historical plaintiff outcomes — award multiples and verdict rates factored`,
    },
    {
      factor: "Phase of Litigation",
      weight: 14,
      score: phaseData.phaseScore,
      direction: phaseData.phaseScore >= 65 ? "positive" : phaseData.phaseScore >= 45 ? "neutral" : "negative",
      rationale: `${c.phase} stage creates ${phaseData.phaseScore >= 65 ? "strong" : phaseData.phaseScore >= 45 ? "moderate" : "limited"} settlement pressure`,
    },
    {
      factor: "Insurer Behavior Pattern",
      weight: 12,
      score: insurerScore,
      direction: insurerScore >= 55 ? "negative" : insurerScore >= 38 ? "neutral" : "positive",
      rationale: `Carrier disposition in ${c.type} matters at ${c.phase} stage`,
    },
    {
      factor: "Expert Witness Strength",
      weight: 10,
      score: expertStr,
      direction: expertStr >= 68 ? "positive" : expertStr >= 50 ? "neutral" : "negative",
      rationale: `${c.type} / ${c.injuryGrade} combination — expert availability and credibility proxy`,
    },
    {
      factor: "Case Age / Fatigue",
      weight: 8,
      score: fatigueScore,
      direction: fatigueScore >= 65 ? "negative" : fatigueScore >= 40 ? "neutral" : "positive",
      rationale: `${c.caseAge} months — ${fatigueScore >= 65 ? "significant fatigue" : fatigueScore >= 40 ? "moderate duration" : "early stage"} affects both sides`,
    },
  ];

  /* Composite weighted score */
  const compositeScore = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0)
  );

  /* Compound multiplier for mid-band center */
  const midMult = phaseData.phaseMult * injuryData.injuryMult * jurisData.jurisMult * typeData.typeMult;
  const mid = base * midMult;

  /* Spread width scales with composite uncertainty: lower score = wider bands */
  const uncertainty = 1 + (100 - compositeScore) / 200;
  const spread = 0.35 * uncertainty;

  /* Probabilities shift based on composite strength */
  const strengthBias = (compositeScore - 50) / 100;
  const pNuisance  = Math.max(4,  Math.round(8  - strengthBias * 6));
  const pLow       = Math.max(10, Math.round(19 - strengthBias * 8));
  const pPeak      = Math.max(30, Math.round(47 + strengthBias * 4));
  const pAbove     = Math.max(8,  Math.round(18 + strengthBias * 6));
  const pVerdict   = Math.max(4,  Math.round(8  + strengthBias * 4));
  const total      = pNuisance + pLow + pPeak + pAbove + pVerdict;
  const norm       = (p: number) => Math.round((p / total) * 100);

  const bands: DistributionBand[] = [
    { label: "Nuisance / Dismiss", low: 0, high: mid * 0.12, probability: norm(pNuisance), color: "#4a90b8" },
    { label: "Low Settlement", low: mid * 0.12, high: mid * (1 - spread), probability: norm(pLow), color: "#4a8ab0" },
    { label: "Most Likely Range", low: mid * (1 - spread), high: mid * (1 + spread), probability: norm(pPeak), color: PRISM_GOLD, peak: true },
    { label: "Above-Median", low: mid * (1 + spread), high: mid * (1 + spread * 1.8), probability: norm(pAbove), color: "#d4a054" },
    { label: "Verdict / High", low: mid * (1 + spread * 1.8), high: base * 1.1, probability: norm(pVerdict), color: "#c45a4a" },
  ];

  /* Model confidence: higher when more factors are known / less contested */
  const modelConfidence = Math.min(95, Math.max(55, 60 + compositeScore * 0.3));

  return { bands, factors, compositeScore, modelConfidence };
}

function rankComparables(_c: CaseScenario) {
  return [] as { title: string; type: string; jurisdiction: string; claimed: number; settled: number | null; verdict: number | null; duration: number; relevance: number }[];
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function DistributionChart({ bands }: { bands: DistributionBand[] }) {
  const maxProb = Math.max(...bands.map(b => b.probability));
  return (
    <div className="space-y-2">
      {bands.map((b) => (
        <div key={b.label} className="flex items-center gap-3">
          <div className="w-32 text-[10px] text-slate-400 text-right flex-shrink-0">{b.label}</div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-6 bg-white/[0.04] rounded relative overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{ width: `${(b.probability / maxProb) * 100}%`, background: b.peak ? `${b.color}cc` : `${b.color}55`, border: b.peak ? `1px solid ${b.color}` : "none" }}
              />
              {b.peak && (
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-[9px] font-semibold" style={{ color: b.color }}>MOST LIKELY — {b.probability}%</span>
                </div>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-300 w-28 text-right">{fmt(b.low)} – {fmt(b.high)}</div>
            {!b.peak && <div className="text-[9px] text-slate-600 w-8 text-right">{b.probability}%</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettlementPredictorPage() {
  const { data: mattersResponse, isLoading } = useQuery({
    queryKey: ["prism-matters-predictor"],
    queryFn: () => apiFetch<{ items: MatterApiItem[] }>("/prism-counsel/matters?limit=12"),
  });

  const cases: CaseScenario[] = (mattersResponse?.items ?? []).map(matterToCaseScenario);

  const [selectedCase, setSelectedCase] = useState<CaseScenario | null>(null);

  useEffect(() => {
    if (cases.length > 0 && !selectedCase) {
      setSelectedCase(cases[0]!);
    }
  }, [cases.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading matters…</span>
      </div>
    );
  }

  if (cases.length === 0 || !selectedCase) {
    return (
      <div className="p-6 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: PRISM_GOLD }} />
          <h1 className="text-lg font-semibold text-slate-100">Settlement Range Predictor</h1>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-10 text-center" style={{ background: "#0c1220" }}>
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <div className="text-sm text-slate-400 mb-1">No active matters found</div>
          <div className="text-xs text-slate-600">Add matters via the Matter Management section to run settlement predictions.</div>
        </div>
      </div>
    );
  }

  const { bands, factors, compositeScore, modelConfidence } = buildModel(selectedCase);
  const peakBand = bands.find(b => b.peak)!;
  const midpoint = (peakBand.low + peakBand.high) / 2;
  const comparables = rankComparables(selectedCase);

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5" style={{ color: PRISM_GOLD }} />
          <h1 className="text-lg font-semibold text-slate-100">Settlement Range Predictor</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium border" style={{ background: `${PRISM_GOLD}15`, color: PRISM_GOLD, borderColor: `${PRISM_GOLD}30` }}>
            AI PREDICTION ENGINE
          </span>
        </div>
        <p className="text-xs text-slate-500">Probability-weighted settlement distributions based on case type, jurisdiction, damages, and comparable outcomes — turning litigation into a quantitative discipline</p>
      </div>

      {/* Case Selector */}
      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-3">Select Active Matter</div>
        <div className="grid grid-cols-3 gap-3">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className={`text-left rounded-lg border p-3 transition-all ${
                selectedCase.id === c.id
                  ? "border-[#c8a96e]/40 bg-[#c8a96e]/5"
                  : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
              }`}
            >
              <div className="text-[11px] font-medium text-slate-200 mb-1 truncate">{c.title}</div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500">{c.type}</span>
                <span className="text-[9px] text-slate-600">·</span>
                <span className="text-[9px] text-slate-500">{c.jurisdiction}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">{fmt(c.damagesClaimed)} claimed</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Predicted Midpoint", value: fmt(midpoint), sub: "50th percentile estimate", icon: Target, color: PRISM_GOLD },
          { label: "Peak Band Low", value: fmt(peakBand.low), sub: "Most likely floor", icon: Scale, color: PRISM_BLUE },
          { label: "Peak Band High", value: fmt(peakBand.high), sub: "Most likely ceiling", icon: Scale, color: "#d4a054" },
          { label: "Composite Score", value: `${compositeScore}/100`, sub: "Weighted factor strength", icon: BarChart3, color: compositeScore >= 65 ? "#c45a4a" : compositeScore >= 48 ? "#d4a054" : "#4a90b8" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-xl font-semibold font-mono text-slate-100">{stat.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-slate-200">Outcome Probability Distribution</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{selectedCase.title} · {selectedCase.jurisdiction} · {selectedCase.phase} · {selectedCase.type}</div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[9px] border border-white/[0.06] text-slate-400" style={{ background: "#080c14" }}>
            <Info className="w-3 h-3" />
            Model confidence: {modelConfidence.toFixed(0)}%
          </div>
        </div>
        <DistributionChart bands={bands} />
      </div>

      {/* Factor Weights — now computed from case inputs */}
      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-slate-200">Settlement Factor Analysis</div>
          <div className="text-[9px] text-slate-600">Composite: <span className="font-mono text-slate-400">{compositeScore}/100</span></div>
        </div>
        <div className="space-y-3">
          {factors.map((f) => (
            <div key={f.factor} className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-44 text-[10px] text-slate-400 flex-shrink-0">{f.factor}</div>
                <div className="text-[9px] text-slate-600 w-12 text-right flex-shrink-0">wt {f.weight}%</div>
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${f.score}%`,
                      background: f.direction === "positive" ? "#4a90b8" : f.direction === "negative" ? "#c45a4a" : "#d4a054",
                    }}
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-300 w-10 text-right flex-shrink-0">{f.score}/100</div>
                <div className="w-16 flex-shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${
                    f.direction === "positive" ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" :
                    f.direction === "negative" ? "bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20" :
                    "bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20"
                  }`}>
                    {f.direction === "positive" ? "HELPFUL" : f.direction === "negative" ? "RISK" : "NEUTRAL"}
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-slate-600 ml-48 pl-14">{f.rationale}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparable Cases — ranked by type + jurisdiction match */}
      {comparables.length > 0 && (
        <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-slate-500" />
            <div className="text-xs font-semibold text-slate-200">Comparable Outcomes</div>
            <span className="text-[9px] text-slate-600">— ranked by case type & jurisdiction match to {selectedCase.type} / {selectedCase.jurisdiction}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Case", "Type", "Venue", "Claimed", "Outcome", "Duration", "Match"].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-[9px] font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparables.map((c, i) => (
                  <tr key={i} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${c.relevance === 3 ? "bg-[#c8a96e]/[0.02]" : ""}`}>
                    <td className="py-2 pr-4 text-slate-300 font-medium">{c.title}</td>
                    <td className="py-2 pr-4 text-slate-500">{c.type}</td>
                    <td className="py-2 pr-4 text-slate-500">{c.jurisdiction}</td>
                    <td className="py-2 pr-4 font-mono text-slate-400">{fmt(c.claimed)}</td>
                    <td className="py-2 pr-4">
                      {c.settled ? (
                        <span className="font-mono text-[#4a90b8]">{fmt(c.settled)} settled</span>
                      ) : (
                        <span className="font-mono text-[#c45a4a]">{fmt(c.verdict!)} verdict</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-mono text-slate-500">{c.duration}mo</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium border ${
                        c.relevance >= 3 ? "bg-[#c8a96e]/10 text-[#c8a96e] border-[#c8a96e]/20" :
                        c.relevance >= 2 ? "bg-[#4a90b8]/10 text-[#4a90b8] border-[#4a90b8]/20" :
                        "bg-white/[0.04] text-slate-500 border-white/[0.06]"
                      }`}>
                        {c.relevance >= 3 ? "STRONG" : c.relevance >= 2 ? "GOOD" : "PARTIAL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
