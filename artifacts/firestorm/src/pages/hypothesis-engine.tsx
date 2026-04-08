import { useState } from "react";
import {
  Brain, Plus, ChevronRight, CheckCircle2, XCircle, AlertTriangle,
  Minus, BarChart3, Lightbulb, Eye, Shield, Target, TrendingUp,
  Lock, Package, Users, Zap, X
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BG = "#070A10";

interface Evidence {
  id: string;
  label: string;
  consistent: -1 | 0 | 1;
}

interface Hypothesis {
  id: string;
  title: string;
  description: string;
  probability: "high" | "medium" | "low" | "eliminated";
  evidenceMatrix: Record<string, -1 | 0 | 1>;
  analystNotes?: string;
  assumptions: string[];
  mirrorQuestion?: string;
  color: string;
}

const INITIAL_SCENARIOS: Record<string, { title: string; description: string; hypotheses: Hypothesis[]; evidence: Evidence[] }> = {
  ransomware_origin: {
    title: "Ransomware Patient Zero: Source of Initial Compromise",
    description: "Ransomware detected across 12 endpoints. Patient zero is unknown. Multiple plausible intrusion vectors exist.",
    evidence: [
      { id: "e1", label: "Phishing email with macro attachment received by finance dept (T-72h)", consistent: 1 },
      { id: "e2", label: "RDP exposed on WKST-0012 (no MFA) since last quarter", consistent: 1 },
      { id: "e3", label: "Vendor VPN token rotated 3 days ago — vendor claims normal", consistent: 0 },
      { id: "e4", label: "USB drive plugged into WKST-0041 at T-48h (unmanaged device)", consistent: 1 },
      { id: "e5", label: "No external email gateway alert for phishing", consistent: -1 },
      { id: "e6", label: "Encrypted files appeared simultaneously on RDP-connected and non-RDP hosts", consistent: -1 },
    ],
    hypotheses: [
      {
        id: "h1",
        title: "Phishing Email — Finance User",
        description: "A spear-phishing email with a malicious macro enabled by a finance department user was the initial access vector.",
        probability: "high",
        color: "#ef4444",
        assumptions: ["Finance user had macro execution enabled", "Email bypassed gateway filters", "No multi-stage lure needed"],
        mirrorQuestion: "What would you see if phishing was NOT the vector?",
        evidenceMatrix: { e1: 1, e2: 0, e3: -1, e4: -1, e5: -1, e6: 0 },
      },
      {
        id: "h2",
        title: "Exposed RDP Exploitation",
        description: "Threat actor brute-forced or used credential stuffing on the exposed RDP port on WKST-0012.",
        probability: "medium",
        color: "#f59e0b",
        assumptions: ["Attacker had credential list targeting this org", "No alerting on repeated RDP failures"],
        mirrorQuestion: "Would all non-RDP hosts also be encrypted via lateral movement?",
        evidenceMatrix: { e1: -1, e2: 1, e3: -1, e4: -1, e5: 0, e6: -1 },
      },
      {
        id: "h3",
        title: "Supply Chain / Vendor Compromise",
        description: "Compromised vendor VPN credentials or malicious update delivered ransomware payload.",
        probability: "low",
        color: "#8b5cf6",
        assumptions: ["Vendor has network access to affected systems", "Token rotation was evasive, not legitimate"],
        mirrorQuestion: "Does vendor access scope include all 12 affected endpoints?",
        evidenceMatrix: { e1: -1, e2: -1, e3: 1, e4: -1, e5: 0, e6: 0 },
      },
      {
        id: "h4",
        title: "Physical Media (USB Insertion)",
        description: "Malicious USB drive inserted on WKST-0041 auto-executed ransomware payload.",
        probability: "low",
        color: "#3b82f6",
        assumptions: ["Autorun not disabled on WKST-0041", "Attacker had physical access or inside knowledge"],
        mirrorQuestion: "Why would USB infect 12 remote endpoints, not just WKST-0041?",
        evidenceMatrix: { e1: -1, e2: -1, e3: -1, e4: 1, e5: 0, e6: -1 },
      },
    ],
  },
  insider_threat: {
    title: "Data Exfiltration: Malicious Insider vs. Automated Sync",
    description: "4.2GB transferred to external storage. Employee gave notice. UEBA flagged anomaly.",
    evidence: [
      { id: "e1", label: "Employee gave 2-week notice previous day", consistent: 1 },
      { id: "e2", label: "Transfer started at 23:47 outside business hours", consistent: 1 },
      { id: "e3", label: "Dropbox sync client installed 6 months ago — never flagged", consistent: -1 },
      { id: "e4", label: "Source code and customer PII in transferred files", consistent: 1 },
      { id: "e5", label: "No DLP alert triggered on the transfer", consistent: -1 },
      { id: "e6", label: "Employee's Dropbox shows same files shared with personal device 3 months ago", consistent: 0 },
    ],
    hypotheses: [
      {
        id: "h1",
        title: "Deliberate Insider Exfiltration",
        description: "Employee intentionally exfiltrating source code and PII ahead of departure.",
        probability: "high",
        color: "#ef4444",
        assumptions: ["Employee knew DLP would not alert", "Timing is deliberate — post-notice announcement"],
        mirrorQuestion: "Would an innocent employee transfer 4.2GB at midnight after giving notice?",
        evidenceMatrix: { e1: 1, e2: 1, e3: -1, e4: 1, e5: 0, e6: 0 },
      },
      {
        id: "h2",
        title: "Routine Automated Sync (No Malicious Intent)",
        description: "Dropbox background sync auto-uploaded files on scheduled sync run.",
        probability: "low",
        color: "#3b82f6",
        assumptions: ["Dropbox sync has been running passively for months", "Volume spike explains backlog"],
        mirrorQuestion: "Why did this sync only trigger UEBA alert now if Dropbox was installed 6 months ago?",
        evidenceMatrix: { e1: -1, e2: 0, e3: 1, e4: 0, e5: -1, e6: 1 },
      },
      {
        id: "h3",
        title: "Third-Party Compromise of Employee Account",
        description: "Adversary compromised the employee's Dropbox and pulled files via their credentials.",
        probability: "low",
        color: "#8b5cf6",
        assumptions: ["Employee's cloud credentials were phished", "Adversary accessed after hours to avoid detection"],
        mirrorQuestion: "Would a compromised account know which files contain source code and PII to target them specifically?",
        evidenceMatrix: { e1: -1, e2: 1, e3: 0, e4: 0, e5: 0, e6: -1 },
      },
    ],
  },
};

const PROBABILITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  high: { color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle },
  medium: { color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Minus },
  low: { color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: CheckCircle2 },
  eliminated: { color: "#374151", bg: "bg-zinc-800/30", border: "border-zinc-700/30", icon: XCircle },
};

const CONSISTENCY_CONFIG = {
  1: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Consistent" },
  0: { icon: Minus, color: "text-white/30", bg: "bg-white/5", label: "Neutral" },
  "-1": { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Inconsistent" },
};

function HypothesisStrengthBar({ hypothesis, evidence }: { hypothesis: Hypothesis; evidence: Evidence[] }) {
  const scores = evidence.map(e => hypothesis.evidenceMatrix[e.id] ?? 0);
  const positives = scores.filter(s => s === 1).length;
  const negatives = scores.filter(s => s === -1).length;
  const neutrals = scores.filter(s => s === 0).length;
  const strength = evidence.length > 0 ? Math.round(((positives - negatives) / evidence.length) * 100) : 0;
  const pct = Math.round(((positives + neutrals * 0.5) / evidence.length) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-[9px] font-mono mb-1">
        <span className="text-white/30">Evidence support</span>
        <span style={{ color: hypothesis.color }}>{positives}✓ {negatives}✗ {neutrals}—</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: hypothesis.color }} />
      </div>
      <div className="text-[8px] font-mono text-white/20 mt-0.5">Net strength: {strength > 0 ? "+" : ""}{strength}%</div>
    </div>
  );
}

export default function HypothesisEngine() {
  const [activeScenario, setActiveScenario] = useState<string>("ransomware_origin");
  const [selectedHyp, setSelectedHyp] = useState<string | null>(null);

  const scenario = INITIAL_SCENARIOS[activeScenario];
  const selectedH = scenario.hypotheses.find(h => h.id === selectedHyp);

  const getSortedHypotheses = () => {
    const order = { high: 0, medium: 1, low: 2, eliminated: 3 };
    return [...scenario.hypotheses].sort((a, b) => order[a.probability] - order[b.probability]);
  };

  const getMatrixScore = (hyp: Hypothesis) => {
    const vals = scenario.evidence.map(e => hyp.evidenceMatrix[e.id] ?? 0);
    const pos = vals.filter(v => v === 1).length;
    const neg = vals.filter(v => v === -1).length;
    return pos - neg;
  };

  const sorted = getSortedHypotheses();
  const maxScore = Math.max(...sorted.map(h => getMatrixScore(h)));
  const minScore = Math.min(...sorted.map(h => getMatrixScore(h)));

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: BG, color: "#e2e8f0" }}>
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" />
            <h1 className="text-sm font-bold text-white">Alternative Hypothesis Engine</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/5 text-blue-400/70">ACH</span>
          </div>
          <div className="flex gap-1">
            {Object.entries(INITIAL_SCENARIOS).map(([key, s]) => (
              <button
                key={key}
                onClick={() => { setActiveScenario(key); setSelectedHyp(null); }}
                className={cn("px-2.5 py-1 rounded text-[10px] font-mono transition-all truncate max-w-[160px]",
                  activeScenario === key ? "bg-blue-500/15 text-blue-300 border border-blue-500/20" : "text-white/40 hover:text-white/70")}
              >
                {s.title.slice(0, 24)}…
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* LEFT: Hypothesis list + Evidence matrix */}
        <div className="w-[55%] border-r border-white/5 overflow-y-auto flex flex-col">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Scenario</div>
            <h2 className="text-sm font-bold text-white mb-1">{scenario.title}</h2>
            <p className="text-[11px] text-white/45 leading-relaxed">{scenario.description}</p>
          </div>

          {/* Hypothesis cards */}
          <div className="px-5 py-4 border-b border-white/5 space-y-2.5">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">
              Hypotheses ({scenario.hypotheses.length}) — ranked by evidence support
            </div>
            {sorted.map((hyp, rank) => {
              const cfg = PROBABILITY_CONFIG[hyp.probability];
              const Icon = cfg.icon;
              const score = getMatrixScore(hyp);
              const isSelected = selectedHyp === hyp.id;
              return (
                <button
                  key={hyp.id}
                  onClick={() => setSelectedHyp(isSelected ? null : hyp.id)}
                  className={cn("w-full text-left rounded-xl border p-4 transition-all", isSelected ? "border-blue-500/30 bg-blue-500/5" : `${cfg.bg} ${cfg.border} hover:border-white/10`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5" style={{ background: hyp.color + "20", border: `1px solid ${hyp.color}30`, color: hyp.color }}>
                      {rank + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-white">{hyp.title}</span>
                        <span className={cn("text-[8px] font-mono px-1 py-0.5 rounded border uppercase", cfg.bg, cfg.border)} style={{ color: cfg.color }}>
                          {hyp.probability}
                        </span>
                        <span className={cn("text-[9px] font-mono ml-auto", score > 0 ? "text-emerald-400" : score < 0 ? "text-red-400" : "text-white/30")}>
                          {score > 0 ? "+" : ""}{score} net
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 leading-relaxed mb-2">{hyp.description}</p>
                      <HypothesisStrengthBar hypothesis={hyp} evidence={scenario.evidence} />
                    </div>
                    <ChevronRight size={13} className={cn("shrink-0 mt-1 transition-transform", isSelected && "rotate-90")} style={{ color: hyp.color + "80" }} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACH Matrix */}
          <div className="px-5 py-4 flex-1">
            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">
              Analysis of Competing Hypotheses (ACH) Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr>
                    <th className="text-left text-white/25 font-mono pb-2 pr-4 min-w-[180px]">Evidence</th>
                    {sorted.map(h => (
                      <th key={h.id} className="text-center pb-2 px-2 min-w-[60px]">
                        <span className="font-mono text-[8px] leading-tight" style={{ color: h.color + "90" }}>
                          H{sorted.indexOf(h) + 1}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenario.evidence.map(ev => (
                    <tr key={ev.id} className="border-t border-white/[0.04]">
                      <td className="py-1.5 pr-4 text-white/45 leading-tight">{ev.label.slice(0, 60)}{ev.label.length > 60 ? "…" : ""}</td>
                      {sorted.map(h => {
                        const v = h.evidenceMatrix[ev.id] ?? 0;
                        const k = String(v) as "1" | "0" | "-1";
                        const c = CONSISTENCY_CONFIG[k] || CONSISTENCY_CONFIG["0"];
                        const Icon = c.icon;
                        return (
                          <td key={h.id} className="py-1.5 px-2 text-center">
                            <div className={cn("w-5 h-5 rounded flex items-center justify-center mx-auto", c.bg)}>
                              <Icon size={10} className={c.color} />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t border-white/10">
                    <td className="py-2 pr-4 text-[9px] font-mono text-white/30 uppercase">Net Score</td>
                    {sorted.map(h => {
                      const score = getMatrixScore(h);
                      return (
                        <td key={h.id} className="py-2 px-2 text-center">
                          <span className={cn("text-[10px] font-bold font-mono", score > 0 ? "text-emerald-400" : score < 0 ? "text-red-400" : "text-white/30")}>
                            {score > 0 ? "+" : ""}{score}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Selected hypothesis deep dive */}
        <div className="w-[45%] overflow-y-auto">
          {selectedH ? (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedH.color }} />
                  <span className="text-xs font-bold text-white">{selectedH.title}</span>
                </div>
                <button onClick={() => setSelectedHyp(null)} className="text-white/30 hover:text-white/60">
                  <X size={13} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
                  <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Hypothesis Statement</div>
                  <p className="text-[12px] text-white/80 leading-relaxed">{selectedH.description}</p>
                </div>

                <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
                  <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">Key Assumptions</div>
                  <ul className="space-y-2">
                    {selectedH.assumptions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-white/60">
                        <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedH.mirrorQuestion && (
                  <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={12} className="text-blue-400" />
                      <span className="text-[9px] font-mono text-blue-400/70 uppercase tracking-widest">Mirror Test (Devil's Advocacy)</span>
                    </div>
                    <p className="text-[11px] text-blue-200/70 italic leading-relaxed">"{selectedH.mirrorQuestion}"</p>
                  </div>
                )}

                <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
                  <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">Evidence Assessment</div>
                  <div className="space-y-2">
                    {scenario.evidence.map(ev => {
                      const v = selectedH.evidenceMatrix[ev.id] ?? 0;
                      const k = String(v) as "1" | "0" | "-1";
                      const c = CONSISTENCY_CONFIG[k];
                      const Icon = c.icon;
                      return (
                        <div key={ev.id} className={cn("flex items-start gap-2 p-2.5 rounded-lg border", c.bg, k === "1" ? "border-emerald-500/20" : k === "-1" ? "border-red-500/15" : "border-white/5")}>
                          <Icon size={11} className={cn("shrink-0 mt-0.5", c.color)} />
                          <p className="text-[10px] text-white/60 leading-relaxed">{ev.label}</p>
                          <span className={cn("text-[8px] font-mono ml-auto shrink-0", c.color)}>{c.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
                  <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Confidence Assessment</div>
                  <div className="flex items-center gap-3">
                    <div className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize", PROBABILITY_CONFIG[selectedH.probability].bg, PROBABILITY_CONFIG[selectedH.probability].border)} style={{ color: PROBABILITY_CONFIG[selectedH.probability].color }}>
                      {selectedH.probability} probability
                    </div>
                    <p className="text-[10px] text-white/35">
                      {selectedH.probability === "high" ? "Primary hypothesis — most consistent with evidence. Investigate first." 
                        : selectedH.probability === "medium" ? "Alternative hypothesis — not eliminated. Requires specific evidence to rule out."
                        : selectedH.probability === "low" ? "Minority hypothesis — most evidence inconsistent. Keep open for now."
                        : "Eliminated — evidence directly contradicts this hypothesis."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <Brain size={32} className="text-blue-500/30 mb-4" />
              <p className="text-sm text-white/30 mb-1">Select a hypothesis</p>
              <p className="text-[11px] text-white/20 leading-relaxed max-w-xs">
                Click any hypothesis card to see its deep dive — assumptions, mirror test, evidence breakdown, and confidence reasoning.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
