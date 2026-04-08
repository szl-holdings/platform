import { useState } from "react";
import {
  BarChart3, CheckCircle2, XCircle, AlertTriangle, ChevronRight,
  Brain, Shield, Eye, Target, Lightbulb, RefreshCw, Minus, Lock
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";

interface EvidenceItem {
  label: string;
  quality: "strong" | "moderate" | "weak" | "absent";
  relevant: boolean;
}

interface ConfidenceChallengeCase {
  id: string;
  title: string;
  analystStatement: string;
  reportedConfidence: number;
  evidence: EvidenceItem[];
  assumptions: string[];
  gaps: string[];
  alternativesConsidered: boolean;
  sourceCount: number;
  sourceDiversity: "high" | "medium" | "low";
  calibratedConfidence: number;
  explanation: string;
  category: string;
}

interface ConfidenceBasis {
  evidenceScore: number;
  sourceScore: number;
  gapPenalty: number;
  assumptionPenalty: number;
  alternativeBonus: number;
  calibrated: number;
}

function calibrateConfidence(c: Pick<ConfidenceChallengeCase,
  "evidence" | "sourceCount" | "sourceDiversity" | "gaps" | "assumptions" | "alternativesConsidered"
>): ConfidenceBasis {
  const QUALITY_WEIGHT: Record<EvidenceItem["quality"], number> = {
    strong: 1.0, moderate: 0.5, weak: 0.2, absent: -0.3,
  };
  const relevantEvidence = c.evidence.filter(e => e.relevant);
  const rawEvidenceScore = relevantEvidence.reduce((sum, e) => sum + QUALITY_WEIGHT[e.quality], 0);
  const maxPossible = relevantEvidence.length * 1.0 || 1;
  const evidenceScore = Math.max(0, Math.min(1, rawEvidenceScore / maxPossible));

  const diversityMultiplier: Record<typeof c.sourceDiversity, number> = { high: 1.0, medium: 0.7, low: 0.4 };
  const sourceScore = Math.min(1, (c.sourceCount / 6)) * diversityMultiplier[c.sourceDiversity];

  const gapPenalty = Math.min(0.4, c.gaps.length * 0.1);
  const assumptionPenalty = Math.min(0.3, c.assumptions.length * 0.08);
  const alternativeBonus = c.alternativesConsidered ? 0.05 : -0.05;

  const rawCalibrated = (evidenceScore * 0.5 + sourceScore * 0.3) * 100
    - gapPenalty * 100
    - assumptionPenalty * 100
    + alternativeBonus * 100;

  const calibrated = Math.round(Math.max(10, Math.min(95, rawCalibrated)));
  return {
    evidenceScore: Math.round(evidenceScore * 100),
    sourceScore: Math.round(sourceScore * 100),
    gapPenalty: Math.round(gapPenalty * 100),
    assumptionPenalty: Math.round(assumptionPenalty * 100),
    alternativeBonus: Math.round(alternativeBonus * 100),
    calibrated,
  };
}

const CHALLENGES: ConfidenceChallengeCase[] = [
  {
    id: "cc-1",
    title: "APT Attribution: China Nexus Assessment",
    category: "Threat Attribution",
    analystStatement: "With HIGH CONFIDENCE, we assess the threat actor is APT40 (China-nexus) based on observed TTPs and malware signatures.",
    reportedConfidence: 85,
    evidence: [
      { label: "AXIOM malware family identified (shared with APT40 historically)", quality: "strong", relevant: true },
      { label: "Target sector aligns with APT40 historical interests (maritime)", quality: "moderate", relevant: true },
      { label: "Infrastructure overlaps with previously attributed APT40 campaigns", quality: "moderate", relevant: true },
      { label: "No direct human intelligence (HUMINT) on operator identity", quality: "absent", relevant: true },
      { label: "Malware may be purchased/shared — not exclusive to APT40", quality: "weak", relevant: true },
      { label: "No C2 infrastructure directly attributed to APT40 in current intel", quality: "absent", relevant: true },
    ],
    assumptions: [
      "Malware signature exclusively indicates APT40 (false — shared toolkits exist)",
      "TTP overlap equals group identity (false — TTPs are mimicked and shared)",
      "No other nation-state operates in this sector (false — multiple actors active)",
    ],
    gaps: [
      "No direct infrastructure attribution to APT40 accounts",
      "Tradecraft overlap may be false flag or copycat",
      "No HUMINT or SIGINT corroborating APT40 operator presence",
    ],
    alternativesConsidered: false,
    sourceCount: 3,
    sourceDiversity: "low",
    calibratedConfidence: 45,
    explanation: "Attribution confidence is overestimated. Malware signatures and TTP overlap are insufficient for high-confidence attribution — toolkits are shared and mimicked. No direct infrastructure link, HUMINT, or SIGINT corroboration exists. Calibrated confidence should be LOW-MODERATE (35-50%). The 'high confidence' label risks anchoring decision-makers to a potentially incorrect attribution.",
  },
  {
    id: "cc-2",
    title: "Insider Threat: Data Exfiltration Intent",
    category: "Insider Risk",
    analystStatement: "With MODERATE CONFIDENCE, the anomalous file transfer by the departing employee constitutes deliberate data theft.",
    reportedConfidence: 60,
    evidence: [
      { label: "4.2GB transferred to personal Dropbox at 23:47 (after-hours)", quality: "strong", relevant: true },
      { label: "Employee submitted resignation previous day", quality: "moderate", relevant: true },
      { label: "Dropbox sync client has been installed for 6 months without prior alerts", quality: "moderate", relevant: false },
      { label: "Files include source code and customer PII", quality: "strong", relevant: true },
      { label: "No DLP alert triggered on transfer (policy gap)", quality: "weak", relevant: false },
      { label: "Employee accessed same Dropbox account from work for 3 months (routine sync)", quality: "moderate", relevant: true },
    ],
    assumptions: [
      "After-hours timing indicates malicious intent (uncertain — employee may have been working late)",
      "File type (source code, PII) indicates deliberate targeting (plausible but not confirmed)",
      "Dropbox sync was not automated/routine (unconfirmed)",
    ],
    gaps: [
      "Whether this was an automated sync or deliberate selection of files is unknown",
      "Prior Dropbox usage pattern not fully baselined before alerting",
      "Employee intent cannot be confirmed from technical evidence alone",
    ],
    alternativesConsidered: true,
    sourceCount: 4,
    sourceDiversity: "medium",
    calibratedConfidence: 62,
    explanation: "Confidence assessment is well-calibrated. The analyst appropriately used 'moderate' confidence. Strong evidence (after-hours transfer of sensitive data, recent resignation) is offset by legitimate alternative explanations (automated sync, 6-month usage history). Alternatives were considered. The 60% moderate label is appropriate given the gap in intent confirmation.",
  },
  {
    id: "cc-3",
    title: "Ransomware: Patient Zero Identification",
    category: "Incident Investigation",
    analystStatement: "With HIGH CONFIDENCE, the initial access vector was a phishing email received by a finance employee.",
    reportedConfidence: 80,
    evidence: [
      { label: "Finance employee received macro-laced email T-72h", quality: "moderate", relevant: true },
      { label: "Macro execution detected on finance employee workstation", quality: "strong", relevant: true },
      { label: "Email not flagged by gateway — possible bypass or internal spoofing", quality: "weak", relevant: true },
      { label: "Encryption appeared simultaneously on RDP and non-RDP hosts", quality: "moderate", relevant: true },
      { label: "Exposed RDP on WKST-0012 with no MFA", quality: "moderate", relevant: false },
      { label: "Forensic imaging of finance workstation shows pre-encryption PowerShell execution", quality: "strong", relevant: true },
    ],
    assumptions: [
      "Macro execution preceded lateral movement (supported by timeline)",
      "Email bypass means phishing was the vector (alternative: internal origin)",
      "No other simultaneous intrusion was active (cannot be confirmed)",
    ],
    gaps: [
      "Email gateway logs incomplete — possible internal origin not ruled out",
      "Second intrusion vector not fully ruled out (RDP attack concurrent possible)",
      "Timeline between macro execution and encryption onset not fully established",
    ],
    alternativesConsidered: false,
    sourceCount: 5,
    sourceDiversity: "medium",
    calibratedConfidence: 70,
    explanation: "Confidence is slightly overestimated. Strong forensic evidence (PowerShell execution on finance workstation, macro detection) supports phishing as likely vector, but the simultaneous encryption across RDP and non-RDP hosts is unexplained. Alternative vectors were not explicitly considered. Calibrated confidence should be MODERATE-HIGH (65-75%), not high confidence (80%+). Explicitly consider and document the RDP alternative.",
  },
];

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function ConfidenceSlider({ value, onChange, disabled }: SliderProps) {
  const color = value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : value >= 25 ? "#f97316" : "#ef4444";
  const label = value >= 75 ? "High" : value >= 50 ? "Moderate" : value >= 25 ? "Low" : "Insufficient";
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-2">
        <span className="text-white/30 font-mono">Your Calibrated Confidence</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border" style={{ color, borderColor: color + "30", backgroundColor: color + "10" }}>{label}</span>
          <span className="font-bold font-mono tabular-nums" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div className="relative">
        <div className="h-2 rounded-full bg-white/5">
          <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 opacity-0 w-full cursor-pointer"
        />
      </div>
      <div className="flex justify-between text-[8px] font-mono text-white/20 mt-1">
        <span>0% Insufficient</span>
        <span>25% Low</span>
        <span>50% Moderate</span>
        <span>75% High</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onStart }: { challenge: ConfidenceChallengeCase; onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="w-full text-left p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{challenge.category}</div>
          <h3 className="text-sm font-bold text-white mb-1">{challenge.title}</h3>
          <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2">{challenge.analystStatement}</p>
          <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-white/25">
            <span>{challenge.evidence.length} evidence items</span>
            <span>·</span>
            <span className={cn(challenge.alternativesConsidered ? "text-emerald-400/50" : "text-red-400/50")}>
              Alternatives: {challenge.alternativesConsidered ? "Considered" : "Not considered"}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] font-mono text-white/25 mb-1">Reported</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-400">{challenge.reportedConfidence}%</div>
        </div>
      </div>
    </button>
  );
}

interface ActiveChallengeProps {
  challenge: ConfidenceChallengeCase;
  onComplete: (userConf: number) => void;
}

function ActiveChallenge({ challenge, onComplete }: ActiveChallengeProps) {
  const [userConfidence, setUserConfidence] = useState(challenge.reportedConfidence);
  const [submitted, setSubmitted] = useState(false);

  const basis = calibrateConfidence(challenge);
  const expertCalibrated = basis.calibrated;

  const diff = Math.abs(userConfidence - expertCalibrated);
  const grade = diff <= 10 ? "Excellent" : diff <= 20 ? "Good" : diff <= 30 ? "Developing" : "Overestimated";
  const gradeColor = diff <= 10 ? "#10b981" : diff <= 20 ? "#3b82f6" : diff <= 30 ? "#f59e0b" : "#ef4444";

  const handleSubmit = () => { setSubmitted(true); onComplete(userConfidence); };

  return (
    <div className="max-w-2xl">
      <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">{challenge.category}</div>
      <h2 className="text-sm font-bold text-white mb-4">{challenge.title}</h2>

      {/* Analyst's statement */}
      <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4 mb-4">
        <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Analyst's Statement</div>
        <p className="text-[12px] text-white/80 italic leading-relaxed">"{challenge.analystStatement}"</p>
        <div className="mt-2 text-[10px] font-mono text-amber-400/70">Reported confidence: {challenge.reportedConfidence}%</div>
      </div>

      {/* Evidence */}
      <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4 mb-4">
        <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">Evidence Assessment</div>
        <div className="space-y-2">
          {challenge.evidence.map((ev, i) => {
            const q = { strong: { color: "text-emerald-400", icon: CheckCircle2 }, moderate: { color: "text-amber-400", icon: Minus }, weak: { color: "text-orange-400", icon: AlertTriangle }, absent: { color: "text-red-400", icon: XCircle } }[ev.quality];
            const Icon = q.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                <Icon size={11} className={cn("shrink-0 mt-0.5", q.color)} />
                <span className={cn("text-[11px] leading-relaxed", ev.relevant ? "text-white/65" : "text-white/30")}>{ev.label}</span>
                <span className={cn("text-[8px] font-mono uppercase ml-auto shrink-0 mt-0.5", q.color)}>{ev.quality}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assumptions & Gaps */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Stated Assumptions</div>
          <ul className="space-y-1.5">
            {challenge.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-white/50">
                <span className="text-amber-400 shrink-0">⚠</span>{a}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Gaps & Unknowns</div>
          <ul className="space-y-1.5">
            {challenge.gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-white/50">
                <span className="text-blue-400 shrink-0">?</span>{g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-[10px] text-white/35 mb-3 flex items-center gap-1.5">
        <Brain size={11} className="text-blue-400" />
        Alternatives considered: <span className={challenge.alternativesConsidered ? "text-emerald-400" : "text-red-400"}>{challenge.alternativesConsidered ? "Yes" : "No"}</span>
        <span className="mx-2">·</span>
        Source diversity: <span className={challenge.sourceDiversity === "high" ? "text-emerald-400" : challenge.sourceDiversity === "medium" ? "text-amber-400" : "text-red-400"}>{challenge.sourceDiversity}</span>
        <span className="mx-2">·</span>
        Source count: <span className="text-white/50">{challenge.sourceCount}</span>
      </div>

      {/* Slider */}
      {!submitted ? (
        <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4 mb-4">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">Your Calibration</div>
          <ConfidenceSlider value={userConfidence} onChange={setUserConfidence} />
          <button
            onClick={handleSubmit}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-blue-500/15 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 transition-colors"
          >
            <BarChart3 size={13} /> Submit Calibration
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Calibration Result</div>
              <span className="text-sm font-bold" style={{ color: gradeColor }}>{grade}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mb-3">
              <div>
                <div className="text-xl font-bold font-mono tabular-nums text-amber-400">{challenge.reportedConfidence}%</div>
                <div className="text-[9px] font-mono text-white/25">Analyst stated</div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono tabular-nums" style={{ color: "#3b82f6" }}>{userConfidence}%</div>
                <div className="text-[9px] font-mono text-white/25">Your calibration</div>
              </div>
              <div>
                <div className="text-xl font-bold font-mono tabular-nums" style={{ color: "#10b981" }}>{expertCalibrated}%</div>
                <div className="text-[9px] font-mono text-white/25">Computed calibration</div>
              </div>
            </div>
            <div className="h-1 bg-white/5 rounded-full mb-1">
              <div className="h-full rounded-full" style={{ width: `${expertCalibrated}%`, backgroundColor: "#10b981" }} />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-3">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2.5">Confidence Basis Breakdown</div>
            <div className="space-y-2 text-[10px] font-mono">
              {[
                { label: "Evidence quality score", value: basis.evidenceScore, color: "#10b981", sign: "+" },
                { label: "Source diversity/count score", value: basis.sourceScore, color: "#3b82f6", sign: "+" },
                { label: "Gap penalty", value: basis.gapPenalty, color: "#ef4444", sign: "−" },
                { label: "Assumption penalty", value: basis.assumptionPenalty, color: "#f59e0b", sign: "−" },
                { label: "Alternatives bonus", value: Math.abs(basis.alternativeBonus), color: basis.alternativeBonus >= 0 ? "#10b981" : "#f59e0b", sign: basis.alternativeBonus >= 0 ? "+" : "−" },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2">
                  <span className="text-white/30 w-4 text-right">{row.sign}</span>
                  <span className="flex-1 text-white/45">{row.label}</span>
                  <span className="tabular-nums font-bold" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
              <div className="border-t border-white/5 pt-2 flex items-center gap-2">
                <span className="text-white/30 w-4 text-right">=</span>
                <span className="flex-1 text-white/60">Calibrated confidence</span>
                <span className="tabular-nums font-bold text-emerald-400">{expertCalibrated}%</span>
              </div>
            </div>
          </div>

          <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={13} className="text-blue-400" />
              <span className="text-[10px] font-mono text-blue-400/70 uppercase tracking-widest">Calibration Rationale</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">{challenge.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConfidenceChallengePage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { userConf: number; calibratedConf: number }>>({});

  const activeChallenge = CHALLENGES.find(c => c.id === activeId);

  const handleComplete = (userConf: number) => {
    if (!activeId) return;
    const challenge = CHALLENGES.find(c => c.id === activeId);
    if (!challenge) return;
    const calibratedConf = calibrateConfidence(challenge).calibrated;
    setResults(prev => ({ ...prev, [activeId]: { userConf, calibratedConf } }));
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: BG, color: "#e2e8f0" }}>
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h1 className="text-sm font-bold text-white">Confidence Challenge Mode</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400/70">CALIBRATION</span>
          </div>
          {activeId && (
            <button onClick={() => setActiveId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors">
              <RefreshCw size={11} /> All Challenges
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!activeId ? (
          <div className="max-w-2xl">
            <div className="mb-5">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Independent Confidence Audit</p>
              <p className="text-[13px] text-white/45 leading-relaxed max-w-xl">
                Review analyst assessments, evaluate evidence quality, and submit your own calibrated confidence score. 
                Compare against the expert-calibrated baseline. Overconfidence is the most common analytic failure.
              </p>
            </div>

            {Object.keys(results).length > 0 && (
              <div className="mb-5 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Your Results So Far</div>
                <div className="flex gap-3">
                  {Object.entries(results).map(([id, r]) => {
                    const c = CHALLENGES.find(ch => ch.id === id);
                    const diff = Math.abs(r.userConf - r.calibratedConf);
                    const color = diff <= 10 ? "#10b981" : diff <= 20 ? "#3b82f6" : "#f59e0b";
                    return (
                      <div key={id} className="flex-1 text-center p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                        <div className="text-[8px] font-mono text-white/25 mb-1 truncate">{c?.title.slice(0, 20)}…</div>
                        <div className="text-base font-bold font-mono" style={{ color }}>{r.userConf}% → {r.calibratedConf}%</div>
                        <div className="text-[8px] font-mono text-white/20">Δ{diff}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {CHALLENGES.map(c => (
                <div key={c.id} className="relative">
                  <ChallengeCard challenge={c} onStart={() => setActiveId(c.id)} />
                  {results[c.id] && (
                    <div className="absolute top-3 right-4 text-[9px] font-mono text-emerald-400/70 flex items-center gap-1">
                      <CheckCircle2 size={9} /> Completed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : activeChallenge ? (
          <ActiveChallenge
            challenge={activeChallenge}
            onComplete={handleComplete}
          />
        ) : null}
      </div>
    </div>
  );
}
