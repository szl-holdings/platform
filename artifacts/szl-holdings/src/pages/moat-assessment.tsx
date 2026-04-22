import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ChevronRight, ArrowLeft, ArrowRight, ShieldCheck, FileCheck, BarChart3,
  Users, Zap, Radio, Brain, Target, BookOpen, AlertTriangle, TrendingUp,
  CheckCircle2, Layers, 
} from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

const BG = "hsl(214,16%,4%)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const BORDER = "hsla(0,0%,100%,0.07)";
const TEXT = "hsl(38,8%,92%)";
const TEXT_SEC = "hsl(214,7%,55%)";
const ACCENT = "hsl(191,92%,44%)";

const LOOP_STEPS = [
  { n: "01", label: "Signal", icon: Radio, color: "#0ea5e9", body: "Risk indicators, anomalies, and threshold breaches are detected, normalized, and routed by the Event Fabric — cross-domain context and correlation ID attached." },
  { n: "02", label: "Context", icon: Layers, color: "#8b5cf6", body: "Cross-domain enrichment via Prism Bus. A sanctions alert in Vessels triggers a legal flag in Counsel, a risk entry in Lyte." },
  { n: "03", label: "Recommendation", icon: Brain, color: "#ec4899", body: "An AI agent proposes an action with source citations, confidence score, and full provenance. No opaque verdicts. Every output traceable." },
  { n: "04", label: "Simulation", icon: BarChart3, color: "#f59e0b", body: "Decision Simulation models risk before action. Operators see expected outcomes, confidence intervals, and the variables that matter most." },
  { n: "05", label: "Policy", icon: ShieldCheck, color: "#10b981", body: "Covenant Policy enforces who can approve and what conditions apply — at the platform layer, not the UI. Non-delegatable." },
  { n: "06", label: "Execution", icon: Zap, color: "#6366f1", body: "FORGE orchestrates the approved action as a durable, multi-step process with checkpoint recovery and agent coordination." },
  { n: "07", label: "Proof", icon: FileCheck, color: "#14b8a6", body: "The Proof Chain records the complete trail: signal, recommendation, simulation, policy decision, approval, execution. Immutable and queryable." },
  { n: "08", label: "Outcome", icon: Target, color: "#ef4444", body: "The Outcome Graph records the real-world result. Was the action effective? The data calibrates future AI confidence scores." },
  { n: "09", label: "Learning", icon: BookOpen, color: "#f97316", body: "Historical outcomes feed back into simulation models and agent confidence calibration. The platform improves with every governed decision." },
];

const ROLE_VIEWS = [
  {
    id: "operator",
    label: "Operator",
    icon: Users,
    headline: "You decide. The platform governs.",
    body: "Operators get a clear signal-to-action pipeline with complete context. No more switching between tools to understand what happened, what to do, and who approved it. Every recommendation is sourced, every action is approved, every decision is recorded.",
    outcomes: [
      "Single decision surface across all domains — no tool fragmentation",
      "Advisory-only AI with mandatory approval before any action executes",
      "Full audit trail on every action — sourced recommendation, simulation, approval, outcome",
      "Cross-domain alerts correlated before they reach your queue",
    ],
  },
  {
    id: "executive",
    label: "Executive",
    icon: Target,
    headline: "Accountability without ambiguity.",
    body: "Executives need to know what decisions were made, who made them, and what happened. SZL Holdings turns every operational decision into a governed, attributable record — ready for board review, regulatory audit, or litigation response.",
    outcomes: [
      "Complete decision history with actor attribution on every entry",
      "Immutable Proof Chain — defensible in regulatory and legal contexts",
      "Cross-domain risk posture dashboard without manual consolidation",
      "AI governance built in — no post-hoc explanation required",
    ],
  },
  {
    id: "technical",
    label: "Technical Buyer",
    icon: Layers,
    headline: "Platform-native governance. Not a plugin.",
    body: "Covenant Policy, Proof Chain, and the Workflow Engine are architectural primitives — not middleware layers or configuration options. They run at the platform layer for every domain pack, with no per-domain reimplementation required.",
    outcomes: [
      "Six shared governance primitives across all domain packs",
      "Event Fabric with cross-domain signal routing and correlation",
      "SOC 2 controls, OIDC/PKCE auth, SCIM 2.0 provisioning",
      "Org-scoped tenant isolation — architectural, not query-level",
    ],
  },
];

const ASSESSMENT_QUESTIONS = [
  {
    id: "accountability_gap",
    label: "When an AI-generated recommendation leads to a bad outcome, can your team reconstruct the full decision chain?",
    options: [
      { value: "no", label: "No — we have logs but no structured decision trail", score: 0 },
      { value: "partial", label: "Partially — some decisions have records, most don't", score: 1 },
      { value: "manual", label: "Yes, but it takes hours of manual investigation", score: 2 },
      { value: "yes", label: "Yes — we have structured, attributed, queryable audit trails", score: 4 },
    ],
  },
  {
    id: "approval_gates",
    label: "Do all consequential AI-recommended actions require explicit human approval before execution?",
    options: [
      { value: "no", label: "No — AI can execute autonomously in most workflows", score: 0 },
      { value: "some", label: "Only for high-severity actions — most AI actions run automatically", score: 1 },
      { value: "config", label: "It depends on how each team configures their tools", score: 2 },
      { value: "yes", label: "Yes — all AI recommendations require approval before execution", score: 4 },
    ],
  },
  {
    id: "cross_domain",
    label: "When a security alert correlates with a legal risk or an operational anomaly, do your teams see the connection before escalation?",
    options: [
      { value: "no", label: "No — each domain team works in its own tool set", score: 0 },
      { value: "manual", label: "Sometimes — only if someone manually connects the signals", score: 1 },
      { value: "alert", label: "We get cross-domain alerts but no governed response workflow", score: 2 },
      { value: "yes", label: "Yes — cross-domain signals are correlated and routed automatically", score: 4 },
    ],
  },
  {
    id: "decision_simulation",
    label: "Before a consequential decision is approved, do operators see a probabilistic model of what could happen?",
    options: [
      { value: "no", label: "No — decisions are made on expert judgment alone", score: 0 },
      { value: "spreadsheet", label: "Sometimes — we run manual analysis in spreadsheets or BI tools", score: 1 },
      { value: "partial", label: "For some decisions, we have scenario models — but not systematically", score: 2 },
      { value: "yes", label: "Yes — every consequential decision goes through Decision Simulation", score: 4 },
    ],
  },
];

const RESULTS = [
  {
    min: 0, max: 4, label: "Critical Gap",
    desc: "Your organization has significant exposure to AI accountability failures. Without governed decision infrastructure, a regulatory inquiry, litigation, or audit could reveal a decision trail that doesn't exist. Request a focused briefing to understand your risk.",
    severity: "critical" as const,
    cta: "Request a Risk Briefing",
  },
  {
    min: 5, max: 9, label: "Partial Coverage",
    desc: "You have some governance structures but significant gaps remain — particularly in cross-domain correlation and systematic human-in-the-loop enforcement. A scoped pilot could close the gaps without disrupting existing operations.",
    severity: "moderate" as const,
    cta: "Explore a Scoped Pilot",
  },
  {
    min: 10, max: 13, label: "Governance-Ready",
    desc: "Your organization has most of the governance building blocks in place. The opportunity is systematic enforcement and cross-domain intelligence sharing — replacing manual overhead with governed infrastructure.",
    severity: "ready" as const,
    cta: "See the Platform Demo",
  },
  {
    min: 14, max: 16, label: "Infrastructure-Grade",
    desc: "You're operating at or near the governance standard SZL Holdings enforces. The conversation is now about efficiency, cross-domain intelligence, and outcome tracking at scale.",
    severity: "ready" as const,
    cta: "Talk to an Engineer",
  },
];

const SEVERITY_MAP = {
  critical: { color: "hsl(0,84%,60%)", bg: "hsla(0,84%,60%,0.08)", icon: AlertTriangle },
  moderate: { color: "hsl(45,90%,55%)", bg: "hsla(45,90%,55%,0.08)", icon: TrendingUp },
  ready: { color: "hsl(152,70%,50%)", bg: "hsla(152,70%,50%,0.08)", icon: CheckCircle2 },
};

function InteractiveLoop() {
  const [active, setActive] = useState(0);
  const step = LOOP_STEPS[active];
  return (
    <section style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>
            The Governed Decision Loop
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: TEXT }}>
            Every consequential decision follows one canonical loop.
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            Nine steps. Every domain. The governance does not change.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:min-w-[200px]">
            {LOOP_STEPS.map((s, i) => {
              const Icon = s.icon;
              const isA = i === active;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setActive(i);
                    analytics.domainPackViewed("governed-loop-step", `/assessment`);
                  }}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200 whitespace-nowrap lg:whitespace-normal"
                  style={{
                    background: isA ? `${s.color}15` : "transparent",
                    border: `1px solid ${isA ? `${s.color}40` : "transparent"}`,
                  }}
                >
                  <span className="text-[10px] font-mono font-bold shrink-0" style={{ color: isA ? s.color : TEXT_SEC }}>{s.n}</span>
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: isA ? s.color : TEXT_SEC }} />
                  <span className="text-xs font-medium" style={{ color: isA ? TEXT : TEXT_SEC }}>{s.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 rounded-2xl p-8 min-h-[200px] flex flex-col justify-center"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              {step && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                      <step.icon className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold block" style={{ color: step.color }}>Step {step.n}</span>
                      <span className="text-xl font-bold" style={{ color: TEXT }}>{step.label}</span>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: TEXT_SEC }}>{step.body}</p>
                  <div className="flex gap-1 mt-6">
                    {LOOP_STEPS.map((_, i) => (
                      <button key={i} onClick={() => setActive(i)} className="h-1 rounded-full flex-1 transition-all duration-200" style={{ background: i === active ? step.color : BORDER }} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function RoleSection() {
  const [active, setActive] = useState(0);
  const tab = ROLE_VIEWS[active];
  return (
    <section style={{ background: BG, borderColor: BORDER }} className="py-24 px-4 border-t">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Role views</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: TEXT }}>Built for every stakeholder.</h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_SEC }}>Same governed loop. Different signal surfaces for different roles.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {ROLE_VIEWS.map((r, i) => {
            const Icon = r.icon;
            const isA = i === active;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setActive(i);
                  analytics.audiencePathClick(r.label, "/assessment");
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={{ background: isA ? ACCENT : SURFACE, color: isA ? BG : TEXT_SEC, border: `1px solid ${isA ? ACCENT : BORDER}` }}
              >
                <Icon className="w-3.5 h-3.5" />{r.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab && (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="rounded-2xl p-8 md:p-10"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}>
                      <tab.icon className="w-5 h-5" style={{ color: ACCENT }} />
                    </div>
                    <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: ACCENT }}>{tab.label}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: TEXT }}>{tab.headline}</h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: TEXT_SEC }}>{tab.body}</p>
                  <Link href="/contact">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{ background: ACCENT, color: BG }}>
                      Request a Demo <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: TEXT_SEC }}>Key outcomes</p>
                  <div className="flex flex-col gap-3">
                    {tab.outcomes.map((point, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}15` }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${ACCENT}20` }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                        </div>
                        <p className="text-sm" style={{ color: TEXT }}>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function AssessmentFunnel() {
  const [step, setStep] = useState<"intro" | number | "result">("intro");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [_submitting, setSubmitting] = useState(false);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const result = RESULTS.find((r) => totalScore >= r.min && totalScore <= r.max) ?? RESULTS[RESULTS.length - 1];
  const maxPossible = ASSESSMENT_QUESTIONS.length * 4;
  const pct = Math.round((totalScore / maxPossible) * 100);

  const handleAnswer = async (qId: string, value: string, score: number) => {
    const newScores = { ...scores, [qId]: score };
    const newAnswers = { ...answers, [qId]: value };
    setScores(newScores);
    setAnswers(newAnswers);
    analytics.contactFunnelStart("governance-readiness");
    const nextStep = typeof step === "number" ? step + 1 : 0;
    if (nextStep >= ASSESSMENT_QUESTIONS.length) {
      const finalScore = Object.values(newScores).reduce((a, b) => a + b, 0);
      const finalResult = RESULTS.find((r) => finalScore >= r.min && finalScore <= r.max) ?? RESULTS[RESULTS.length - 1];
      setStep("result");
      analytics.ctaClick("assessment-complete", "/assessment", "funnel", "szl-holdings");
      try {
        setSubmitting(true);
        await fetch("/api/contact/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "diagnostic_assessment",
            app: "szl-holdings",
            name: "Assessment Submission",
            email: "noreply@assessment.szlholdings.com",
            message: `Governance readiness assessment completed. Score: ${finalScore}/${maxPossible} (${Math.round((finalScore / maxPossible) * 100)}%). Result: ${finalResult?.label}`,
            metadata: { assessment: "governance-readiness", score: finalScore, result: finalResult?.label, answers: newAnswers },
          }),
        });
      } catch (_) {} finally { setSubmitting(false); }
    } else {
      setStep(nextStep);
    }
  };

  const currentQ = typeof step === "number" ? ASSESSMENT_QUESTIONS[step] : null;
  const sevStyles = result ? SEVERITY_MAP[result.severity] : SEVERITY_MAP.critical;
  const SevIcon = sevStyles.icon;

  return (
    <section style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Governance Readiness Assessment</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: TEXT }}>
            Where does your organization stand on AI governance?
          </h2>
          <p className="text-base" style={{ color: TEXT_SEC }}>
            Four questions. Instant readiness score.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.25 }}
              className="rounded-2xl p-8 text-center" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex justify-center gap-2 mb-6">
                {ASSESSMENT_QUESTIONS.map((_, i) => (
                  <div key={i} className="h-1 rounded-full flex-1" style={{ background: BORDER, maxWidth: 48 }} />
                ))}
              </div>
              <p className="text-sm mb-6" style={{ color: TEXT_SEC }}>4 questions · ~2 minutes · Instant scored result</p>
              <button
                onClick={() => { setStep(0); analytics.ctaClick("start-assessment", "/assessment", "funnel"); }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: ACCENT, color: BG }}
              >
                Start Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {typeof step === "number" && currentQ && (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
              className="rounded-2xl p-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-3 mb-6">
                {step > 0 && (
                  <button onClick={() => setStep((step as number) - 1)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: TEXT_SEC }}>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex gap-1.5 flex-1">
                  {ASSESSMENT_QUESTIONS.map((_, i) => (
                    <div key={i} className="h-1 rounded-full flex-1 transition-all duration-300" style={{ background: i <= step ? ACCENT : BORDER }} />
                  ))}
                </div>
                <span className="text-xs font-mono" style={{ color: TEXT_SEC }}>{step + 1}/{ASSESSMENT_QUESTIONS.length}</span>
              </div>

              <h3 className="text-xl font-bold mb-6" style={{ color: TEXT }}>{currentQ.label}</h3>

              <div className="flex flex-col gap-3">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(currentQ.id, opt.value, opt.score)}
                    className="flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-150 hover:bg-white/5 border"
                    style={{ border: `1px solid ${answers[currentQ.id] === opt.value ? `${ACCENT}50` : BORDER}`, background: answers[currentQ.id] === opt.value ? `${ACCENT}08` : "transparent" }}
                  >
                    <div className="w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition-all"
                      style={{ borderColor: answers[currentQ.id] === opt.value ? ACCENT : `${TEXT_SEC}60`, background: answers[currentQ.id] === opt.value ? ACCENT : "transparent" }}>
                      {answers[currentQ.id] === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <p className="text-sm font-medium" style={{ color: TEXT }}>{opt.label}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }}
              className="rounded-2xl p-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <button onClick={() => setStep((ASSESSMENT_QUESTIONS.length - 1) as number)} className="flex items-center gap-2 mb-6 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: TEXT_SEC }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div className="flex items-center gap-3 p-4 rounded-xl mb-5" style={{ background: sevStyles.bg, border: `1px solid ${sevStyles.color}30` }}>
                <SevIcon className="w-6 h-6 shrink-0" style={{ color: sevStyles.color }} />
                <p className="text-base font-bold" style={{ color: sevStyles.color }}>{result.label}</p>
                <div className="ml-auto text-right">
                  <span className="text-2xl font-bold font-mono" style={{ color: sevStyles.color }}>{pct}</span>
                  <span className="text-xs ml-0.5" style={{ color: sevStyles.color }}>/100</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT_SEC }}>{result.desc}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact" className="flex-1">
                  <button
                    onClick={() => analytics.demoRequest("assessment-result")}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: ACCENT, color: BG }}
                  >
                    {result.cta} <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => { setAnswers({}); setScores({}); setStep("intro"); }}
                  className="px-5 py-3 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
                  style={{ borderColor: BORDER, color: TEXT_SEC }}
                >
                  Retake
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function PortfolioArchitecture() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const layers = [
    {
      tier: "Layer 01 — Command Surfaces",
      color: ACCENT,
      items: [
        { name: "KORA", desc: "Flagship command surface — signal stream, situation board, governed action panel" },
        { name: "APEX", desc: "Mobile command — all domains, biometric auth, iOS + Android" },
      ],
    },
    {
      tier: "Layer 02 — Execution Fabric + Primitives",
      color: "hsl(215,72%,58%)",
      items: [
        { name: "FORGE", desc: "Workflow orchestration and governed execution" },
        { name: "Covenant Policy", desc: "Human-in-the-loop governance at the platform layer" },
        { name: "Proof Chain", desc: "Immutable AI provenance and audit trail" },
        { name: "Decision Simulation", desc: "Probabilistic risk modeling before action" },
        { name: "Outcome Graph", desc: "Decision lifecycle and consequence measurement" },
        { name: "Event Fabric", desc: "Cross-domain signal backbone" },
      ],
    },
    {
      tier: "Layer 03 — Domain Packs",
      color: "hsl(260,60%,65%)",
      items: [
        { name: "PARAGON", desc: "Security & defense — SOC, XDR, MITRE ATT&CK" },
        { name: "SEXTANT", desc: "Maritime — fleet command, AIS, sanctions, voyage economics" },
        { name: "DOMAINE", desc: "Real estate — distress pipeline, underwriting, deal governance" },
        { name: "Counsel", desc: "Legal — obligation tracking, matter command" },
        { name: "Carlota Jo", desc: "Advisory — client intelligence, strategic diagnostics" },
      ],
    },
  ];

  return (
    <section ref={ref} style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ACCENT }}>Platform Architecture</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4" style={{ color: TEXT }}>One governance layer. Every domain.</h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            The governance infrastructure is shared. The intelligence is domain-specific. Every domain pack runs on the same six primitives — no per-domain reimplementation.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {layers.map((layer, li) => (
            <motion.div key={li} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: li * 0.1 }}
              className="rounded-2xl p-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: layer.color }}>{layer.tier}</p>
              <div className="flex flex-wrap gap-3">
                {layer.items.map((item, ii) => (
                  <div key={ii} className="px-3 py-2 rounded-lg" style={{ background: `${layer.color}08`, border: `1px solid ${layer.color}20` }}>
                    <p className="text-xs font-semibold" style={{ color: layer.color }}>{item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: TEXT_SEC }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 p-6 rounded-2xl text-center" style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}20` }}>
          <p className="text-sm" style={{ color: TEXT_SEC }}>
            Advisory-only AI with mandatory human approval gates. Immutable Proof Chain on every decision. SOC 2 controls built in — certification targeted for 2026.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default function MoatAssessmentPage() {
  const __pageMeta = usePageMeta({ title: "Governance Readiness Assessment — SZL Holdings", description: "Assess your organization's readiness for governed AI decision-making. Get an instant score and actionable next steps." });

  useEffect(() => {
    analytics.pageView("/assessment");
    const cleanup = initScrollDepth("/assessment");
    return cleanup;
  }, []);

  return (
    <>
      {__pageMeta}
      <div style={{ background: BG, minHeight: "100dvh" }}>
        <SiteNav />
  
        <section className="pt-28 pb-16 px-4 text-center" style={{ background: BG }}>
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-6"
              style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}30`, color: ACCENT }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
              Governance Readiness
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6" style={{ color: TEXT }}>
              Governed Decision Infrastructure
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.18 }}
              className="text-lg md:text-xl mb-8" style={{ color: TEXT_SEC }}>
              The structural layer between signal detection and action execution — enforcing governance, attribution, and outcome tracking on every consequential decision.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}
              className="flex flex-wrap gap-3 justify-center">
              <a href="#assessment">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{ background: ACCENT, color: BG }}>
                  Take the Assessment <ChevronRight className="w-4 h-4" />
                </button>
              </a>
              <Link href="/contact">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border transition-all hover:bg-white/5" style={{ borderColor: `${ACCENT}30`, color: TEXT }}>
                  Request a Demo <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} />
                </button>
              </Link>
            </motion.div>
          </div>
        </section>
  
        <InteractiveLoop />
        <PortfolioArchitecture />
        <RoleSection />
        <div id="assessment">
          <AssessmentFunnel />
        </div>
  
        <section style={{ background: BG, borderColor: BORDER }} className="py-16 px-4 text-center border-t">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4" style={{ color: TEXT }}>Build alongside us.</h2>
            <p className="text-sm mb-6" style={{ color: TEXT_SEC }}>
              We are selecting design partners in security, maritime, real estate, and legal. Design partners co-shape the product, receive preferred pricing, and are first to access new domain packs as they launch.
            </p>
            <Link href="/design-partners">
              <button
                onClick={() => analytics.designPartnerInterest("moat-assessment-cta", "/assessment")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border transition-all hover:bg-white/5"
                style={{ borderColor: `${ACCENT}30`, color: TEXT }}
              >
                Apply for Design Partner Program <ChevronRight className="w-4 h-4" style={{ color: ACCENT }} />
              </button>
            </Link>
          </div>
        </section>
  
        <SiteFooter />
      </div>
        </>
  );
}

function initScrollDepth(page: string): () => void {
  const thresholds = [25, 50, 75, 90];
  const tracked: number[] = [];
  const handler = () => {
    const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    for (const t of thresholds) {
      if (pct >= t && !tracked.includes(t)) {
        tracked.push(t);
        analytics.ctaClick(`scroll_${t}`, page, "scroll");
      }
    }
  };
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}
