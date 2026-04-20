import { analytics } from '@szl-holdings/analytics';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  FileSearch,
  Layers,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = 'hsl(152,70%,45%)';

const DISTRESS_SIGNALS = [
  {
    id: 'tax_lien',
    type: 'Tax Lien',
    severity: 'High',
    color: 'hsl(0,84%,60%)',
    address: '147 E 57th St, Manhattan',
    detail: 'City tax lien filed — $284,000 outstanding, 18-month delinquency',
    timing: 'Detected 47 days before appearing in commercial data aggregators',
    loop: [
      {
        step: 'Signal',
        text: 'NYC Department of Finance lien filing detected from primary county records — ACRIS ingestion pipeline.',
      },
      {
        step: 'Context',
        text: 'Ownership graph: 3-entity LLC structure, principal with 4 prior lien events. Cross-reference with PACER filings reveals active litigation.',
      },
      {
        step: 'Recommendation',
        text: 'AI underwriting: estimated distress opportunity — forced sale probability 68% within 9 months. Recommended bid range with evidence citations.',
      },
      {
        step: 'Policy',
        text: 'Deal workflow gates: underwriting requires senior analyst sign-off. Approval chain pre-staged with simulation output attached.',
      },
      {
        step: 'Proof',
        text: 'Proof Chain: lien source citation, ownership graph snapshot, AI underwriting version, analyst approval, and offer submission recorded immutably.',
      },
    ],
  },
  {
    id: 'lis_pendens',
    type: 'Lis Pendens',
    severity: 'Critical',
    color: 'hsl(45,90%,55%)',
    address: '2890 Broadway, Upper West Side',
    detail: 'Foreclosure lis pendens filed — 90-day auction timeline initiated',
    timing: 'Detected 61 days before MLS listing or broker notification',
    loop: [
      {
        step: 'Signal',
        text: 'New York County Clerk lis pendens filing detected — foreclosure action by JPMorgan Chase, commercial property.',
      },
      {
        step: 'Context',
        text: 'Distress pipeline: property has $2.1M outstanding debt, last assessed at $3.4M. Cap rate compression analysis shows 8.2% yield opportunity.',
      },
      {
        step: 'Recommendation',
        text: 'AI underwriting: acquisition opportunity — distressed commercial. Recommended approach: direct outreach to borrower pre-auction.',
      },
      {
        step: 'Simulation',
        text: 'Decision Simulation: 3 acquisition scenarios modeled — auction bid, pre-auction negotiation, post-foreclosure purchase. P50 returns: 22%, 34%, 18%.',
      },
      {
        step: 'Proof',
        text: 'Proof Chain: lis pendens citation, distress analysis, simulation scenarios, approval chain, and offer strategy logged with full provenance.',
      },
    ],
  },
];

const ROLE_VIEWS = [
  {
    id: 'acquisitions',
    label: 'Acquisitions',
    icon: Building2,
    headline: 'See distress signals weeks before the market does.',
    body: 'Terra ingests primary county records — ACRIS tax liens, lis pendens, foreclosure filings, code violations — weeks before they appear in commercial data aggregators. Every distress signal is enriched with ownership graph, debt stack, and AI-powered underwriting with source citations.',
    outcomes: [
      'Primary record ingestion — tax liens, lis pendens, foreclosures weeks early',
      'Ownership graph with beneficial owner tracing and entity structure',
      'AI underwriting with evidence citations and forced-sale probability scoring',
      'Deal workflow governance — approval gates before any offer is submitted',
    ],
  },
  {
    id: 'underwriting',
    label: 'Underwriting',
    icon: BarChart3,
    headline: 'Defensible underwriting with full evidence citations.',
    body: "Terra's AI underwriting model generates valuations with source-cited evidence — comparable sales, cap rate analysis, debt stack, and condition assessment. Every recommendation carries a confidence score and full provenance. Human approval required before any offer action executes.",
    outcomes: [
      'AI underwriting with source citations and confidence scoring',
      'Comparable sales analysis from primary records — not aggregated data',
      'Decision Simulation: probabilistic return modeling for every acquisition scenario',
      'Covenant Policy: approval gate before any offer action executes',
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance / Legal',
    icon: ShieldCheck,
    headline: 'Investment decisions with a defensible audit trail.',
    body: 'Every Terra deal decision is recorded in the Proof Chain — from distress signal detection to underwriting approval to offer submission. When a regulator or counterparty asks what you did and why, you have an answer with source citations and approval records.',
    outcomes: [
      'Immutable Proof Chain on every deal decision — source, approval, outcome',
      'Deal workflow with mandatory approval gates before execution',
      'Full audit trail: signal citation, AI model version, analyst approval timestamp',
      'Covenant Policy enforcement — no offer executes without compliance sign-off',
    ],
  },
];

const ASSESSMENT_QUESTIONS = [
  {
    id: 'distress_timing',
    label: 'How do you currently discover distressed real estate opportunities?',
    options: [
      {
        value: 'broker',
        label: 'Brokers, MLS, and commercial data subscriptions — after the market already knows',
        score: 0,
      },
      {
        value: 'network',
        label: 'Professional network and some direct outreach — inconsistent sourcing',
        score: 1,
      },
      {
        value: 'some_records',
        label: 'We monitor some primary records but without systematic coverage',
        score: 2,
      },
      {
        value: 'primary',
        label: 'Primary county records — we see filings weeks before commercial aggregators',
        score: 4,
      },
    ],
  },
  {
    id: 'underwriting_attribution',
    label:
      "When an AI model or analyst provides an underwriting recommendation, can you trace exactly what data sources and assumptions it's based on?",
    options: [
      {
        value: 'no',
        label: 'No — the model output arrives without source documentation',
        score: 0,
      },
      {
        value: 'partial',
        label: "Partially — we can reconstruct it but it's not documented automatically",
        score: 1,
      },
      { value: 'documented', label: "We document manually but it's not systematic", score: 2 },
      {
        value: 'cited',
        label: 'Yes — every recommendation carries full source citations automatically',
        score: 4,
      },
    ],
  },
  {
    id: 'deal_governance',
    label:
      'Before an offer is submitted on a distressed asset, is there a structured approval chain with a documented record?',
    options: [
      {
        value: 'no',
        label: 'No — offers are often submitted based on informal team agreement',
        score: 0,
      },
      {
        value: 'verbal',
        label: 'We have informal verbal approval but no documented record',
        score: 1,
      },
      {
        value: 'email',
        label: 'Email approvals — documented but not structured or queryable',
        score: 2,
      },
      {
        value: 'governed',
        label: 'Structured approval chain with immutable record before any offer executes',
        score: 4,
      },
    ],
  },
  {
    id: 'outcome_tracking',
    label:
      'Do you systematically track whether your underwriting predictions matched actual outcomes?',
    options: [
      {
        value: 'no',
        label:
          "No — we track deal performance but don't connect it back to underwriting assumptions",
        score: 0,
      },
      { value: 'manual', label: 'Manually for major deals — not systematic', score: 1 },
      {
        value: 'partial',
        label: 'Partially — we track some metrics but not full underwriting accuracy',
        score: 2,
      },
      {
        value: 'yes',
        label:
          'Yes — every underwriting prediction is tracked to actual outcome for model calibration',
        score: 4,
      },
    ],
  },
];

const RESULTS = [
  {
    min: 0,
    max: 4,
    label: 'Significant Intelligence Gap',
    severity: 'critical' as const,
    desc: "Your investment sourcing is operating on lagged data and your underwriting lacks documented provenance. You're competing with investors who see distress signals weeks earlier and can reconstruct every investment decision for regulatory or legal review.",
    cta: 'Request a Terra Briefing',
  },
  {
    min: 5,
    max: 9,
    label: 'Partial Coverage',
    severity: 'moderate' as const,
    desc: 'You have some primary source access and deal documentation but the gaps are significant — underwriting attribution is manual, approval chains are informal, and outcome tracking is inconsistent. A scoped Terra pilot could close these gaps systematically.',
    cta: 'See a Terra Demo',
  },
  {
    min: 10,
    max: 13,
    label: 'Process-Mature',
    severity: 'ready' as const,
    desc: 'Your investment process has good structure but relies on manual integration and inconsistent documentation. The opportunity is systematic primary record coverage and AI underwriting with automatic provenance.',
    cta: 'Explore Terra Features',
  },
  {
    min: 14,
    max: 16,
    label: 'Infrastructure-Grade',
    severity: 'ready' as const,
    desc: 'Your investment operation has strong infrastructure. The conversation is about scale — expanding primary record coverage, cross-market distress intelligence, and portfolio-level outcome tracking.',
    cta: 'Talk to a Terra Expert',
  },
];

const SEVERITY_MAP = {
  critical: { color: 'hsl(0,84%,60%)', bg: 'hsla(0,84%,60%,0.08)', icon: AlertTriangle },
  moderate: { color: 'hsl(45,90%,55%)', bg: 'hsla(45,90%,55%,0.08)', icon: TrendingUp },
  ready: { color: 'hsl(152,70%,50%)', bg: 'hsla(152,70%,50%,0.08)', icon: CheckCircle2 },
};

function DistressProof() {
  const [active, setActive] = useState(0);
  const [playStep, setPlayStep] = useState(-1);
  const scenario = DISTRESS_SIGNALS[active];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    setPlayStep(-1);
    if (!inView) return;
    const t = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i >= scenario.loop.length) {
          clearInterval(interval);
          return;
        }
        setPlayStep(i);
        i++;
      }, 550);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(t);
  }, [active, inView]);

  return (
    <section ref={ref} style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: ACCENT }}
          >
            Live Proof · Synthetic Data
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            NYC distress signals — weeks before the market sees them.
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            Primary county records ingested directly. Every signal enriched with ownership graph,
            debt stack, and AI underwriting before it reaches your deal pipeline.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {DISTRESS_SIGNALS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: i === active ? s.color : SURFACE,
                color: i === active ? BG : TEXT_SEC,
                border: `1px solid ${i === active ? s.color : BORDER}`,
              }}
            >
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: i === active ? `${BG}30` : `${s.color}20`,
                  color: i === active ? BG : s.color,
                }}
              >
                {s.severity}
              </span>
              {s.type}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="p-5 border-b flex items-center gap-3 flex-wrap"
              style={{ borderColor: BORDER }}
            >
              <MapPin className="w-4 h-4" style={{ color: scenario.color }} />
              <span className="text-sm font-semibold" style={{ color: TEXT }}>
                {scenario.address}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${scenario.color}15`, color: scenario.color }}
              >
                {scenario.severity}
              </span>
              <div className="flex items-center gap-1.5 ml-auto" style={{ color: ACCENT }}>
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{scenario.timing}</span>
              </div>
            </div>
            <div
              className="p-4 border-b"
              style={{ borderColor: BORDER, background: `${scenario.color}05` }}
            >
              <p className="text-sm" style={{ color: TEXT_SEC }}>
                {scenario.detail}
              </p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              {scenario.loop.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: playStep >= i ? 1 : 0.2, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="shrink-0 px-2 py-1 rounded text-xs font-bold font-mono"
                    style={{
                      background: playStep >= i ? `${scenario.color}15` : SURFACE,
                      color: playStep >= i ? scenario.color : TEXT_SEC,
                      border: `1px solid ${playStep >= i ? `${scenario.color}30` : BORDER}`,
                    }}
                  >
                    {r.step}
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: playStep >= i ? TEXT : TEXT_SEC }}
                  >
                    {r.text}
                  </p>
                  {playStep >= i && i === scenario.loop.length - 1 && (
                    <CheckCircle2
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: 'hsl(152,70%,50%)' }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => {
                  setPlayStep(-1);
                  setTimeout(() => {
                    let i = 0;
                    const iv = setInterval(() => {
                      if (i >= scenario.loop.length) {
                        clearInterval(iv);
                        return;
                      }
                      setPlayStep(i);
                      i++;
                    }, 500);
                  }, 50);
                }}
                className="text-xs font-medium hover:opacity-80"
                style={{ color: ACCENT }}
              >
                ↺ Replay
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function RoleSection() {
  const [active, setActive] = useState(0);
  const tab = ROLE_VIEWS[active];
  return (
    <section style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            Built for every real estate stakeholder.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_SEC }}>
            Primary record sourcing, AI underwriting, and deal governance — for every role in the
            investment lifecycle.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {ROLE_VIEWS.map((r, i) => {
            const Icon = r.icon;
            const isA = i === active;
            return (
              <button
                key={r.id}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: isA ? ACCENT : SURFACE,
                  color: isA ? BG : TEXT_SEC,
                  border: `1px solid ${isA ? ACCENT : BORDER}`,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {r.label}
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
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${ACCENT}15`, border: `1px solid ${ACCENT}30` }}
                    >
                      <tab.icon className="w-5 h-5" style={{ color: ACCENT }} />
                    </div>
                    <span
                      className="text-xs font-semibold tracking-widest uppercase"
                      style={{ color: ACCENT }}
                    >
                      {tab.label}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: TEXT }}>
                    {tab.headline}
                  </h3>
                  <p className="text-base leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
                    {tab.body}
                  </p>
                </div>
                <div className="flex-1">
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-4"
                    style={{ color: TEXT_SEC }}
                  >
                    Key outcomes
                  </p>
                  <div className="flex flex-col gap-3">
                    {tab.outcomes.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-xl"
                        style={{ background: `${ACCENT}06`, border: `1px solid ${ACCENT}15` }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${ACCENT}20` }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: ACCENT }}
                          />
                        </div>
                        <p className="text-sm" style={{ color: TEXT }}>
                          {point}
                        </p>
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

function InvestmentReadinessFunnel() {
  const [step, setStep] = useState<'intro' | number | 'result'>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxPossible = ASSESSMENT_QUESTIONS.length * 4;
  const pct = Math.round((totalScore / maxPossible) * 100);
  const result =
    RESULTS.find((r) => totalScore >= r.min && totalScore <= r.max) ?? RESULTS[RESULTS.length - 1];
  const sevStyles = result ? SEVERITY_MAP[result.severity] : SEVERITY_MAP.critical;
  const SevIcon = sevStyles.icon;

  const handleAnswer = async (qId: string, value: string, score: number) => {
    const newScores = { ...scores, [qId]: score };
    const newAnswers = { ...answers, [qId]: value };
    setScores(newScores);
    setAnswers(newAnswers);
    const nextStep = typeof step === 'number' ? step + 1 : 0;
    if (nextStep >= ASSESSMENT_QUESTIONS.length) {
      const fs = Object.values(newScores).reduce((a, b) => a + b, 0);
      const fr = RESULTS.find((r) => fs >= r.min && fs <= r.max) ?? RESULTS[RESULTS.length - 1];
      setStep('result');
      analytics.formSubmit({
        form_name: 'investment-readiness-assessment',
        form_type: 'diagnostic_assessment',
      });
      try {
        await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'diagnostic_assessment',
            app: 'terra',
            name: 'Investment Readiness Assessment',
            email: 'noreply@assessment.szlholdings.com',
            message: `Investment readiness assessment. Score: ${fs}/${maxPossible}. Result: ${fr?.label}`,
            metadata: {
              assessment: 'investment-readiness',
              score: fs,
              result: fr?.label,
              answers: newAnswers,
            },
          }),
        });
      } catch (_) {}
    } else {
      setStep(nextStep);
    }
  };

  const currentQ = typeof step === 'number' ? ASSESSMENT_QUESTIONS[step] : null;

  return (
    <section style={{ background: BG }} className="py-24 px-4" id="assessment">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: ACCENT }}
          >
            Investment Readiness Assessment
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            How ahead of the market is your distress intelligence?
          </h2>
          <p className="text-base" style={{ color: TEXT_SEC }}>
            4 questions · ~2 minutes · Instant readiness score
          </p>
        </div>
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <p className="text-sm mb-6" style={{ color: TEXT_SEC }}>
                4 questions · ~2 minutes · Instant result
              </p>
              <button
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold hover:opacity-90"
                style={{ background: ACCENT, color: BG }}
              >
                Start Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {typeof step === 'number' && currentQ && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl p-8"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-3 mb-6">
                {step > 0 && (
                  <button
                    onClick={() => setStep((step as number) - 1)}
                    className="p-1.5 rounded-lg hover:bg-white/5"
                    style={{ color: TEXT_SEC }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex gap-1.5 flex-1">
                  {ASSESSMENT_QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      className="h-1 rounded-full flex-1 transition-all"
                      style={{ background: i <= step ? ACCENT : BORDER }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono" style={{ color: TEXT_SEC }}>
                  {step + 1}/{ASSESSMENT_QUESTIONS.length}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-6" style={{ color: TEXT }}>
                {currentQ.label}
              </h3>
              <div className="flex flex-col gap-3">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(currentQ.id, opt.value, opt.score)}
                    className="flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:bg-white/5 border"
                    style={{
                      border: `1px solid ${answers[currentQ.id] === opt.value ? `${ACCENT}50` : BORDER}`,
                      background:
                        answers[currentQ.id] === opt.value ? `${ACCENT}08` : 'transparent',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: answers[currentQ.id] === opt.value ? ACCENT : `${TEXT_SEC}60`,
                        background: answers[currentQ.id] === opt.value ? ACCENT : 'transparent',
                      }}
                    >
                      {answers[currentQ.id] === opt.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <p className="text-sm font-medium" style={{ color: TEXT }}>
                      {opt.label}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="rounded-2xl p-8"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <button
                onClick={() => setStep((ASSESSMENT_QUESTIONS.length - 1) as number)}
                className="flex items-center gap-2 mb-6 text-xs hover:opacity-80"
                style={{ color: TEXT_SEC }}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <div
                className="flex items-center gap-3 p-4 rounded-xl mb-5"
                style={{ background: sevStyles.bg, border: `1px solid ${sevStyles.color}30` }}
              >
                <SevIcon className="w-6 h-6 shrink-0" style={{ color: sevStyles.color }} />
                <p className="text-base font-bold" style={{ color: sevStyles.color }}>
                  {result.label}
                </p>
                <div className="ml-auto">
                  <span className="text-2xl font-bold font-mono" style={{ color: sevStyles.color }}>
                    {pct}
                  </span>
                  <span className="text-xs ml-0.5" style={{ color: sevStyles.color }}>
                    /100
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: TEXT_SEC }}>
                {result.desc}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard" className="flex-1">
                  <button
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold hover:opacity-90"
                    style={{ background: ACCENT, color: BG }}
                  >
                    {result.cta} <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setAnswers({});
                    setScores({});
                    setStep('intro');
                  }}
                  className="px-5 py-3 rounded-lg text-sm font-medium border hover:bg-white/5"
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

export default function InvestmentReadinessPage() {
  useEffect(() => {
    analytics.pageView({ path: '/market-assessment' });
  }, []);
  return (
    <div style={{ background: BG, minHeight: '100dvh' }}>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: `${BG}ee`,
          borderBottom: `1px solid ${BORDER}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/dashboard">
          <span className="text-sm font-bold" style={{ color: TEXT }}>
            Terra
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm" style={{ color: TEXT_SEC }}>
            Platform
          </Link>
          <Link href="/dashboard/distress-pipeline" className="text-sm" style={{ color: TEXT_SEC }}>
            Distress Pipeline
          </Link>
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
            style={{ background: ACCENT, color: BG }}
          >
            Request Demo
          </button>
        </div>
      </nav>

      <section className="pt-28 pb-16 px-4 text-center" style={{ background: BG }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-6"
            style={{ background: `${ACCENT}12`, borderColor: `${ACCENT}30`, color: ACCENT }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: ACCENT }}
            />
            Real Estate Intelligence · Terra
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
            style={{ color: TEXT }}
          >
            NYC distress signals — weeks before the market sees them.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="text-lg mb-8"
            style={{ color: TEXT_SEC }}
          >
            Primary county record ingestion, AI underwriting with source citations, and governed
            deal workflows — for investment teams that compete on information advantage.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <a href="#assessment">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold hover:opacity-90"
                style={{ background: ACCENT, color: BG }}
              >
                Take Investment Readiness Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </a>
            <Link href="/dashboard">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border hover:bg-white/5"
                style={{ borderColor: `${ACCENT}30`, color: TEXT }}
              >
                Explore Platform <Building2 className="w-4 h-4" style={{ color: ACCENT }} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <DistressProof />
      <RoleSection />
      <div id="assessment">
        <InvestmentReadinessFunnel />
      </div>

      <footer className="py-12 px-4 text-center border-t" style={{ borderColor: BORDER }}>
        <p className="text-sm" style={{ color: TEXT_SEC }}>
          Terra — Real Estate Intelligence · SZL Holdings Platform
        </p>
        <p className="text-xs mt-2" style={{ color: TEXT_SEC }}>
          © 2026 SZL Holdings. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
