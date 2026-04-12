import { useState } from "react";
import {
  Scale, BarChart3, Clock, TrendingUp, TrendingDown, FileText,
  AlertTriangle, CheckCircle, ChevronRight, Eye, Activity,
  BookOpen, Target, Users, Building2
} from "lucide-react";

const ACCENT = "#c8a96e";
const BG = "#080c14";
const CARD = "#0c1220";
const BORDER = "rgba(255,255,255,0.06)";

interface JudgeProfile {
  id: string;
  name: string;
  court: string;
  appointedBy: string;
  yearsOnBench: number;
  activeCaseload: number;
  avgTimeToDecision: number;
  settlementPressureBehavior: string;
  motionTendencies: Array<{ motion: string; grantRate: number; trend: "up" | "down" | "flat" }>;
  rulingPatterns: Array<{ category: string; plaintiff: number; defendant: number }>;
  notableOpinions: Array<{ year: number; case: string; significance: string; ruledFor: "plaintiff" | "defendant" }>;
  settlementPressureScore: number;
  mandatoryMediationRate: number;
  avgTrialLength: number;
  summaryJudgmentGrantRate: number;
  jurisdictions: string[];
  personalityProfile: string;
  strategicNotes: string[];
  lastUpdated: string;
}

const JUDGES: JudgeProfile[] = [
  {
    id: "moreno",
    name: "Hon. Patricia L. Moreno",
    court: "U.S. District Court, S.D. Fla.",
    appointedBy: "President Biden (2022)",
    yearsOnBench: 3,
    activeCaseload: 412,
    avgTimeToDecision: 8.2,
    settlementPressureBehavior: "High pressure. Orders mandatory mediation in 89% of PI cases, typically at 6-month mark. Known to express settlement preferences from the bench during status conferences.",
    motionTendencies: [
      { motion: "Summary Judgment", grantRate: 34, trend: "down" },
      { motion: "Motion to Dismiss", grantRate: 28, trend: "flat" },
      { motion: "Motion in Limine", grantRate: 61, trend: "up" },
      { motion: "Discovery Motions", grantRate: 52, trend: "flat" },
      { motion: "Class Certification", grantRate: 19, trend: "down" },
    ],
    rulingPatterns: [
      { category: "Personal Injury", plaintiff: 68, defendant: 32 },
      { category: "Employment", plaintiff: 55, defendant: 45 },
      { category: "Contract", plaintiff: 49, defendant: 51 },
      { category: "Insurance", plaintiff: 62, defendant: 38 },
    ],
    notableOpinions: [
      { year: 2024, case: "Delgado v. Nationwide, No. 2024-CV-1122", significance: "Established local rule on expert disclosure timing; 90-day standard now applied across her docket", ruledFor: "plaintiff" },
      { year: 2023, case: "Chen v. Bristol-Myers, No. 2023-CV-8834", significance: "Denied class certification on ascertainability grounds — landmark for mass tort defense bar", ruledFor: "defendant" },
      { year: 2023, case: "Williams v. State Farm, No. 2023-CV-4411", significance: "Full plaintiff verdict; strongly criticized delay tactics in jury charge", ruledFor: "plaintiff" },
    ],
    settlementPressureScore: 88,
    mandatoryMediationRate: 89,
    avgTrialLength: 5.2,
    summaryJudgmentGrantRate: 34,
    jurisdictions: ["S.D. Fla.", "11th Circuit"],
    personalityProfile: "Former plaintiff's attorney with 18 years in PI litigation before appointment. Impatient with delay tactics. Values efficiency. Particularly skeptical of boilerplate discovery objections. Appreciated by plaintiff's bar; defense bar views as slightly plaintiff-favorable.",
    strategicNotes: [
      "File any summary judgment motion within 30 days of close of discovery — she rejects late-filed motions routinely",
      "Avoid excessive continuance requests — she tracks continuance history and penalizes repeat requesters",
      "Her law clerk (Emilia Torres) specializes in evidence law — well-cited Daubert motions get attention",
      "Status conferences are substantive — come with a prepared case schedule or risk losing control of your timeline",
    ],
    lastUpdated: "2026-04-08",
  },
  {
    id: "rodriguez-j",
    name: "Hon. James Rodriguez",
    court: "Miami-Dade Circuit Court",
    appointedBy: "Governor DeSantis (2021)",
    yearsOnBench: 5,
    activeCaseload: 891,
    avgTimeToDecision: 14.7,
    settlementPressureBehavior: "Low-moderate pressure. Rarely speaks to settlement from the bench. Prefers parties to use the court-annexed mediation program but doesn't mandate it early. Will push harder if case is approaching trial slot.",
    motionTendencies: [
      { motion: "Summary Judgment", grantRate: 47, trend: "up" },
      { motion: "Motion to Dismiss", grantRate: 41, trend: "up" },
      { motion: "Motion in Limine", grantRate: 55, trend: "flat" },
      { motion: "Discovery Motions", grantRate: 38, trend: "down" },
    ],
    rulingPatterns: [
      { category: "Personal Injury", plaintiff: 51, defendant: 49 },
      { category: "Employment", plaintiff: 44, defendant: 56 },
      { category: "Contract", plaintiff: 53, defendant: 47 },
      { category: "Insurance", plaintiff: 48, defendant: 52 },
    ],
    notableOpinions: [
      { year: 2024, case: "Ramirez v. General Dynamics, No. 2024-CA-7231", significance: "Granted summary judgment on causation grounds — strict evidentiary standard applied to expert testimony", ruledFor: "defendant" },
      { year: 2022, case: "Park v. Sears Holdings, No. 2022-CA-1890", significance: "Plaintiff verdict after complex products liability trial; awarded treble damages for willful conduct", ruledFor: "plaintiff" },
    ],
    settlementPressureScore: 42,
    mandatoryMediationRate: 55,
    avgTrialLength: 7.8,
    summaryJudgmentGrantRate: 47,
    jurisdictions: ["Miami-Dade Circuit Court", "Fla. 3rd DCA"],
    personalityProfile: "Defense-side firm background with government service. Methodical and reserved. Heavy emphasis on procedural compliance. Will dismiss cases for discovery violations. Fair but exacting.",
    strategicNotes: [
      "Strict on case management orders — never miss a deadline without a motion for extension filed in advance",
      "His summary judgment rate is rising — consider whether your case has a strong enough damages record before relying on settlement",
      "Trial preparation conferences are heavily scrutinized — have your witness list, exhibit list, and jury instructions ready 45 days before trial",
      "Be precise in discovery requests — overly broad requests draw sanctions referrals in his courtroom",
    ],
    lastUpdated: "2026-03-29",
  },
];

function MotionTendencyBar({ motion, rate, trend }: { motion: string; rate: number; trend: "up" | "down" | "flat" }) {
  const color = rate >= 50 ? "#ef4444" : rate >= 35 ? "#f59e0b" : "#22c55e";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Activity;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-400">{motion}</span>
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-2.5 h-2.5" style={{ color: trend === "up" ? "#ef4444" : trend === "down" ? "#22c55e" : "#64748b" }} />
          <span className="text-[10px] font-mono font-semibold" style={{ color }}>{rate}% grant rate</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, background: color }} />
      </div>
    </div>
  );
}

function ScoreMeter({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="text-center">
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}

export default function JudgeIntelligencePage() {
  const [selected, setSelected] = useState("moreno");
  const judge = JUDGES.find((j) => j.id === selected) ?? JUDGES[0];

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5" style={{ color: ACCENT }} />
          <h1 className="text-lg font-semibold text-slate-100">Judge Intelligence Profiles</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium ml-1" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
            INTERNAL STRATEGY ONLY
          </span>
        </div>
        <p className="text-xs text-slate-500">Ruling patterns, motion tendencies, settlement pressure behavior, and strategic intelligence per judge</p>
      </div>

      <div className="flex gap-2">
        {JUDGES.map((j) => (
          <button
            key={j.id}
            onClick={() => setSelected(j.id)}
            className="px-3 py-2 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: selected === j.id ? `${ACCENT}15` : "rgba(255,255,255,0.04)",
              color: selected === j.id ? ACCENT : "#64748b",
              border: `1px solid ${selected === j.id ? `${ACCENT}30` : BORDER}`,
            }}
          >
            {j.name}
          </button>
        ))}
      </div>

      <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">{judge.name}</h2>
            <div className="text-[10px] text-slate-500 mt-0.5">{judge.court} · {judge.appointedBy}</div>
            <div className="text-[10px] text-slate-500">{judge.yearsOnBench} years on bench · {judge.activeCaseload} active cases</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ScoreMeter value={judge.settlementPressureScore} label="Settlement Pressure" />
            <ScoreMeter value={judge.mandatoryMediationRate} label="Mediation Rate %" />
            <ScoreMeter value={judge.summaryJudgmentGrantRate} label="SJ Grant Rate %" />
          </div>
        </div>

        <div className="mt-4 p-3 rounded-md text-[11px] text-slate-300 leading-relaxed" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Settlement Pressure Behavior</span>
          {judge.settlementPressureBehavior}
        </div>
        <div className="mt-3 p-3 rounded-md text-[11px] text-slate-300 leading-relaxed" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Judicial Personality</span>
          {judge.personalityProfile}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-100">Motion Grant Rates</span>
          </div>
          <div className="space-y-3">
            {judge.motionTendencies.map((m) => <MotionTendencyBar key={m.motion} {...m} />)}
          </div>
        </div>

        <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-sm font-semibold text-slate-100">Ruling Patterns by Case Type</span>
          </div>
          <div className="space-y-3">
            {judge.rulingPatterns.map((r) => (
              <div key={r.category}>
                <div className="flex items-center justify-between mb-1 text-[10px]">
                  <span className="text-slate-400">{r.category}</span>
                  <span className="text-green-400 font-mono">{r.plaintiff}% P</span>
                </div>
                <div className="h-2 rounded-full flex overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="h-full" style={{ width: `${r.plaintiff}%`, background: "rgba(34,197,94,0.6)" }} />
                  <div className="h-full" style={{ width: `${r.defendant}%`, background: "rgba(239,68,68,0.4)" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 text-[9px]">
            <span className="flex items-center gap-1 text-green-400"><span className="w-2 h-1.5 rounded bg-green-400 opacity-60" /> Plaintiff</span>
            <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-1.5 rounded bg-red-400 opacity-40" /> Defendant</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-5" style={{ background: CARD, borderColor: BORDER }}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-sm font-semibold text-slate-100">Notable Opinions</span>
        </div>
        <div className="space-y-3">
          {judge.notableOpinions.map((op, idx) => (
            <div key={idx} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-mono font-semibold text-slate-200">{op.case}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{op.year}</div>
                </div>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ color: op.ruledFor === "plaintiff" ? "#22c55e" : "#ef4444", background: op.ruledFor === "plaintiff" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                  For {op.ruledFor}
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400 leading-relaxed">{op.significance}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-5" style={{ background: `${ACCENT}06`, borderColor: `${ACCENT}20` }}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-sm font-semibold text-slate-100">Strategic Notes — Internal Use Only</span>
        </div>
        <div className="space-y-2.5">
          {judge.strategicNotes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <span className="text-[11px] text-slate-300">{note}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-[9px] text-slate-600">Last updated: {judge.lastUpdated} · Avg trial length: {judge.avgTrialLength} days</div>
      </div>
    </div>
  );
}
