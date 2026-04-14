import { useState } from "react";
import { Shield, TrendingUp, AlertTriangle, CheckCircle, XCircle, Target, BarChart3, FileText, Clock } from "lucide-react";

const PRISM_GOLD = "#c8a96e";

interface StrengthDimension {
  label: string;
  score: number;
  weight: number;
  evidence: string;
  trend: "up" | "down" | "flat";
}

interface CaseStrengthProfile {
  id: string;
  matter: string;
  type: string;
  overallScore: number;
  trend: "improving" | "declining" | "stable";
  lastUpdated: string;
  dimensions: StrengthDimension[];
  keyRisks: string[];
  keyStrengths: string[];
  strategicRecommendations: string[];
}

const CASES: CaseStrengthProfile[] = [
  {
    id: "1",
    matter: "Martinez v. Pinnacle Freight LLC",
    type: "Commercial Auto",
    overallScore: 61,
    trend: "declining",
    lastUpdated: "2 days ago",
    dimensions: [
      { label: "Evidence Quality", score: 72, weight: 25, evidence: "Police report favorable; dashcam footage partially obstructed", trend: "flat" },
      { label: "Witness Credibility", score: 55, weight: 20, evidence: "3 eyewitnesses — 1 recanted, 1 inconsistent", trend: "down" },
      { label: "Legal Precedent Alignment", score: 68, weight: 20, evidence: "SDNY precedent moderately favorable on commercial auto negligence", trend: "flat" },
      { label: "Damages Documentation", score: 74, weight: 15, evidence: "Medical records complete; lost wages documented", trend: "up" },
      { label: "Procedural Posture", score: 48, weight: 10, evidence: "Motion to dismiss pending — outcome uncertain", trend: "down" },
      { label: "Expert Witness Strength", score: 62, weight: 10, evidence: "Liability expert retained; accident reconstruction solid", trend: "flat" },
    ],
    keyRisks: ["Witness inconsistency creates credibility vulnerability at trial", "Pending motion to dismiss could narrow viable claims", "Opposing expert (biomechanics) has strong jury track record"],
    keyStrengths: ["Clear liability photos and police report", "Documented economic damages well-supported", "Favorable SDNY precedent on employer negligent entrustment"],
    strategicRecommendations: ["Shore up witness inconsistencies with supplemental affidavits before discovery closes", "Depose plaintiff's treating physicians early to lock in testimony", "Consider settlement window before SJ motion is decided"],
  },
  {
    id: "2",
    matter: "Okonkwo v. Metropolitan Transit",
    type: "Premises Liability",
    overallScore: 78,
    trend: "improving",
    lastUpdated: "1 day ago",
    dimensions: [
      { label: "Evidence Quality", score: 85, weight: 25, evidence: "Surveillance footage shows exact hazard — compelling visual evidence", trend: "up" },
      { label: "Witness Credibility", score: 82, weight: 20, evidence: "4 consistent eyewitnesses; incident report confirms hazard knew", trend: "up" },
      { label: "Legal Precedent Alignment", score: 71, weight: 20, evidence: "MTA premises liability well-litigated; notice element strong", trend: "flat" },
      { label: "Damages Documentation", score: 88, weight: 15, evidence: "Severe TBI — extensive medical records, life care plan drafted", trend: "flat" },
      { label: "Procedural Posture", score: 66, weight: 10, evidence: "Discovery largely complete; no pending dispositive motions", trend: "up" },
      { label: "Expert Witness Strength", score: 70, weight: 10, evidence: "Premises safety expert strong; medical expert well-credentialed", trend: "flat" },
    ],
    keyRisks: ["MTA has deep appellate resources — will fight verdict", "Life care plan figures may be challenged as speculative", "Long trial expected — jury fatigue risk"],
    keyStrengths: ["Surveillance footage is damning — plaintiff sympathy very high", "Constructive notice established via prior incident reports", "Severe injury = high damages ceiling creates settlement leverage"],
    strategicRecommendations: ["Push for mediation while liability evidence is strongest", "Protect life care plan expert from Daubert challenge with supplemental disclosure", "File early settlement demand to reset reserve"],
  },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#c45a4a" : score >= 50 ? "#d4a054" : "#4a90b8";
  const label = score >= 70 ? "STRONG" : score >= 50 ? "MODERATE" : "WEAK";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff08" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${2 * Math.PI * 40 * score / 100} ${2 * Math.PI * 40 * (1 - score / 100)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-lg font-bold font-mono text-slate-100">{score}</div>
        <div className="text-[8px] font-semibold" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

export default function CaseStrengthPage() {
  const [selected, setSelected] = useState<CaseStrengthProfile>(CASES[0]!);

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5" style={{ color: PRISM_GOLD }} />
          <h1 className="text-lg font-semibold text-slate-100">Case Strength Score</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium border" style={{ background: `${PRISM_GOLD}15`, color: PRISM_GOLD, borderColor: `${PRISM_GOLD}30` }}>
            DYNAMIC AI ASSESSMENT
          </span>
        </div>
        <p className="text-xs text-slate-500">Composite AI assessment of case strength based on evidence quality, witness credibility, legal precedent alignment, and procedural posture — updated dynamically as the case evolves</p>
      </div>

      {/* Case Selector */}
      <div className="flex gap-3">
        {CASES.map((c) => {
          const color = c.overallScore >= 70 ? "#c45a4a" : c.overallScore >= 50 ? "#d4a054" : "#4a90b8";
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`flex-1 text-left rounded-lg border p-4 transition-all ${
                selected.id === c.id ? "border-[#c8a96e]/40 bg-[#c8a96e]/5" : "border-white/[0.06] hover:border-white/[0.12]"
              }`}
              style={{ background: "#0c1220" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-medium text-slate-200">{c.matter}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{c.type} · Updated {c.lastUpdated}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono" style={{ color }}>{c.overallScore}</div>
                  <div className="text-[8px]" style={{ color }}>
                    {c.trend === "improving" ? "↑ IMPROVING" : c.trend === "declining" ? "↓ DECLINING" : "→ STABLE"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail View */}
      <div className="grid grid-cols-3 gap-4">
        {/* Gauge + Summary */}
        <div className="rounded-lg border border-white/[0.06] p-5 flex flex-col items-center justify-center gap-4" style={{ background: "#0c1220" }}>
          <ScoreGauge score={selected.overallScore} />
          <div className="text-center">
            <div className="text-[10px] text-slate-500">Composite Case Strength</div>
            <div className="text-[9px] mt-1" style={{
              color: selected.trend === "improving" ? "#4a90b8" : selected.trend === "declining" ? "#c45a4a" : "#d4a054"
            }}>
              {selected.trend === "improving" ? "↑ Trending stronger" : selected.trend === "declining" ? "↓ Trending weaker" : "→ Holding steady"}
            </div>
          </div>
          <div className="w-full space-y-2">
            {[
              { label: "Evidence", value: selected.dimensions[0]!.score },
              { label: "Witnesses", value: selected.dimensions[1]!.score },
              { label: "Precedent", value: selected.dimensions[2]!.score },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 w-16">{d.label}</span>
                <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${d.value}%`,
                    background: d.value >= 70 ? "#c45a4a" : d.value >= 50 ? "#d4a054" : "#4a90b8",
                  }} />
                </div>
                <span className="text-[9px] font-mono text-slate-400 w-6 text-right">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dimensions */}
        <div className="col-span-2 rounded-lg border border-white/[0.06] p-5 space-y-4" style={{ background: "#0c1220" }}>
          <div className="text-xs font-semibold text-slate-200">Strength Dimensions</div>
          {selected.dimensions.map((dim) => (
            <div key={dim.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-300 font-medium">{dim.label}</span>
                  <span className="text-[8px] text-slate-600">wt {dim.weight}%</span>
                  <span className="text-[9px]" style={{
                    color: dim.trend === "up" ? "#4a90b8" : dim.trend === "down" ? "#c45a4a" : "#d4a054"
                  }}>
                    {dim.trend === "up" ? "↑" : dim.trend === "down" ? "↓" : "→"}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-slate-200">{dim.score}/100</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${dim.score}%`,
                  background: dim.score >= 70 ? "#c45a4a" : dim.score >= 50 ? "#d4a054" : "#4a90b8",
                }} />
              </div>
              <div className="text-[9px] text-slate-500">{dim.evidence}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SWOT-style Analysis */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#4a90b8]/20 p-4" style={{ background: "#4a90b808" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-[#4a90b8]" />
            <span className="text-[9px] font-semibold text-[#4a90b8] uppercase tracking-wider">Key Strengths</span>
          </div>
          {selected.keyStrengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-[#4a90b8]" />
              <span className="text-[10px] text-slate-300">{s}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#c45a4a]/20 p-4" style={{ background: "#c45a4a08" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-[#c45a4a]" />
            <span className="text-[9px] font-semibold text-[#c45a4a] uppercase tracking-wider">Key Risks</span>
          </div>
          {selected.keyRisks.map((r, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-[#c45a4a]" />
              <span className="text-[10px] text-slate-300">{r}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#c8a96e]/20 p-4" style={{ background: "#c8a96e08" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Target className="w-3.5 h-3.5" style={{ color: PRISM_GOLD }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: PRISM_GOLD }}>Strategic Recommendations</span>
          </div>
          {selected.strategicRecommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: PRISM_GOLD }} />
              <span className="text-[10px] text-slate-300">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
