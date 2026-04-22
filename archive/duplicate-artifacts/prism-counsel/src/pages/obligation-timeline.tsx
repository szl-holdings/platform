import { analytics } from '@szl-holdings/analytics';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Scale,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = 'hsl(261,55%,65%)';

const TIMELINE_OBLIGATIONS = [
  {
    id: 'contract_renewal',
    label: 'Contract Renewal',
    matter: 'Software License Agreement — Salesforce',
    color: '#f59e0b',
    daysUntil: 47,
    status: 'Due Soon',
    obligations: [
      {
        deadline: '47 days',
        event: 'Renewal election window opens',
        action: 'Procurement review of usage data and pricing',
        governed: false,
      },
      {
        deadline: '32 days',
        event: 'Legal review of updated T&Cs required',
        action: 'Contract counsel review and redline submission',
        governed: true,
      },
      {
        deadline: '18 days',
        event: 'Approval chain to execute renewal or terminate',
        action: 'CFO approval for spend authorization',
        governed: true,
      },
      {
        deadline: '7 days',
        event: 'Final execution deadline',
        action: 'E-signature with audit trail',
        governed: true,
      },
    ],
  },
  {
    id: 'regulatory',
    label: 'Regulatory Filing',
    matter: 'GDPR Data Processing Agreement — EU Operations',
    color: '#ef4444',
    daysUntil: 12,
    status: 'Urgent',
    obligations: [
      {
        deadline: '12 days',
        event: 'DPA update required — new EU AI Act provisions',
        action: 'Privacy counsel review and update of DPA schedules',
        governed: true,
      },
      {
        deadline: '8 days',
        event: 'Counterparty notification required',
        action: 'Legal sign-off on counterparty notice language',
        governed: true,
      },
      {
        deadline: '5 days',
        event: 'Updated DPA execution',
        action: 'Dual signature with Proof Chain record',
        governed: true,
      },
      {
        deadline: '0 days',
        event: 'Regulatory submission deadline',
        action: 'DPA filed with supervisory authority',
        governed: true,
      },
    ],
  },
  {
    id: 'litigation',
    label: 'Litigation Hold',
    matter: 'Commercial Dispute — Counterparty v. Company',
    color: '#8b5cf6',
    daysUntil: 0,
    status: 'Active',
    obligations: [
      {
        deadline: 'Active',
        event: 'Litigation hold in effect — all related communications and documents preserved',
        action: 'IT and Legal enforce hold protocol',
        governed: true,
      },
      {
        deadline: '14 days',
        event: 'Initial disclosure deadline',
        action: 'Discovery team produces initial document set',
        governed: true,
      },
      {
        deadline: '21 days',
        event: 'Expert witness designation',
        action: 'Counsel identifies and retains experts',
        governed: true,
      },
      {
        deadline: '45 days',
        event: 'Deposition scheduling window',
        action: 'Scheduling order compliance confirmation',
        governed: true,
      },
    ],
  },
];

const ASSESSMENT_QUESTIONS = [
  {
    id: 'obligation_visibility',
    label:
      'Do you have a single view of all active legal obligations, contract deadlines, and regulatory filing dates across your organization?',
    options: [
      {
        value: 'no',
        label:
          'No — obligations are tracked in spreadsheets, email threads, and individual team notes',
        score: 0,
      },
      {
        value: 'partial',
        label: 'Some high-value contracts are tracked — but comprehensive coverage is missing',
        score: 1,
      },
      {
        value: 'tool',
        label:
          "We use a contract tool but it doesn't cover regulatory obligations or litigation holds",
        score: 2,
      },
      {
        value: 'yes',
        label: 'Yes — all obligations are in a single system with automated deadline tracking',
        score: 4,
      },
    ],
  },
  {
    id: 'approval_gates',
    label:
      'Before a contract is executed or a regulatory filing is submitted, is there a documented approval chain with attribution?',
    options: [
      {
        value: 'no',
        label: 'No — approvals happen via email or verbal sign-off with no structured record',
        score: 0,
      },
      {
        value: 'informal',
        label: 'Informally tracked — but the record is in email threads, not a governed system',
        score: 1,
      },
      {
        value: 'some',
        label: 'For major contracts — but routine matters often skip the formal approval step',
        score: 2,
      },
      {
        value: 'yes',
        label:
          'Yes — every legal action has a structured approval chain with attributed, immutable records',
        score: 4,
      },
    ],
  },
  {
    id: 'deadline_miss',
    label:
      'In the past 12 months, has your team missed or nearly missed a material legal deadline due to tracking or coordination failure?',
    options: [
      {
        value: 'yes_miss',
        label: 'Yes — we missed a deadline and had to manage the consequences',
        score: 0,
      },
      {
        value: 'near_miss',
        label: 'Near miss — we caught it in time but the process was stressful and manual',
        score: 1,
      },
      {
        value: 'risk',
        label: "Not yet, but our current tracking system has known gaps we're managing around",
        score: 2,
      },
      {
        value: 'no',
        label: 'No — our deadline management is systematic and we have reliable advance warning',
        score: 4,
      },
    ],
  },
  {
    id: 'litigation_hold',
    label:
      'When a litigation hold is initiated, how confident are you that all relevant materials are preserved and the hold is enforced systematically?',
    options: [
      {
        value: 'low',
        label:
          'Not confident — litigation holds are manually communicated with no systematic enforcement',
        score: 0,
      },
      {
        value: 'partial',
        label: 'Somewhat — we communicate holds but rely on individuals to comply',
        score: 1,
      },
      {
        value: 'monitored',
        label: 'Reasonably confident — we have IT support but enforcement tracking is manual',
        score: 2,
      },
      {
        value: 'governed',
        label:
          'Very confident — holds are enforced systematically with auditable compliance records',
        score: 4,
      },
    ],
  },
];

const RESULTS = [
  {
    min: 0,
    max: 4,
    label: 'Critical Legal Risk',
    severity: 'critical' as const,
    desc: 'Your legal obligation tracking has significant gaps that create material risk — missed deadlines, undocumented approvals, and informal litigation holds. A single deadline miss or enforcement failure could have serious regulatory or commercial consequences.',
    cta: 'Request a Legal Risk Briefing',
  },
  {
    min: 5,
    max: 9,
    label: 'Governance Gaps',
    severity: 'moderate' as const,
    desc: 'You have some tracking but significant gaps remain — particularly in approval attribution, regulatory obligation coverage, and litigation hold enforcement. A structured legal command surface would close these gaps.',
    cta: 'See a PRISM Counsel Demo',
  },
  {
    min: 10,
    max: 13,
    label: 'Process-Mature',
    severity: 'ready' as const,
    desc: 'Your legal operations have good structure but rely on manual coordination for deadline management, approval chains, and obligation visibility. The opportunity is systematic coverage with immutable approval records.',
    cta: 'Explore PRISM Counsel',
  },
  {
    min: 14,
    max: 16,
    label: 'Governance-Grade',
    severity: 'ready' as const,
    desc: 'Your legal governance is strong. The conversation is about cross-matter intelligence, obligation dependency tracking, and Proof Chain-backed records for enterprise-scale compliance.',
    cta: 'Talk to a Legal Expert',
  },
];

const SEVERITY_MAP = {
  critical: { color: 'hsl(0,84%,60%)', bg: 'hsla(0,84%,60%,0.08)', icon: AlertTriangle },
  moderate: { color: 'hsl(45,90%,55%)', bg: 'hsla(45,90%,55%,0.08)', icon: TrendingUp },
  ready: { color: 'hsl(152,70%,50%)', bg: 'hsla(152,70%,50%,0.08)', icon: CheckCircle2 },
};

function ObligationTimelineDemo() {
  const [active, setActive] = useState(0);
  const obligation = TIMELINE_OBLIGATIONS[active];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: ACCENT }}
          >
            Obligation Timeline Demo · Synthetic Data
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            Every legal obligation — visible, governed, and attributable.
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            Contract renewals, regulatory filings, litigation holds — every obligation tracked with
            dependency mapping, advance alerting, and a governed approval chain before any action
            executes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {TIMELINE_OBLIGATIONS.map((o, i) => (
            <button
              key={o.id}
              onClick={() => setActive(i)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: i === active ? o.color : SURFACE,
                color: i === active ? BG : TEXT_SEC,
                border: `1px solid ${i === active ? o.color : BORDER}`,
              }}
            >
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  background: i === active ? `${BG}30` : `${o.color}20`,
                  color: i === active ? BG : o.color,
                }}
              >
                {o.status}
              </span>
              {o.label}
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
              <Scale className="w-4 h-4" style={{ color: obligation.color }} />
              <span className="text-sm font-semibold" style={{ color: TEXT }}>
                {obligation.matter}
              </span>
              {obligation.daysUntil > 0 && (
                <div
                  className="flex items-center gap-1.5 ml-auto"
                  style={{ color: obligation.color }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{obligation.daysUntil} days</span>
                </div>
              )}
              {obligation.daysUntil === 0 && (
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${obligation.color}15`, color: obligation.color }}
                >
                  Active Hold
                </span>
              )}
            </div>

            <div className="p-6">
              <div className="relative pl-6">
                <div
                  className="absolute left-2 top-0 bottom-0 w-px"
                  style={{ background: BORDER }}
                />
                <div className="flex flex-col gap-5">
                  {obligation.obligations.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="relative"
                    >
                      <div
                        className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                        style={{
                          borderColor: item.governed ? obligation.color : BORDER,
                          background: item.governed ? obligation.color : BG,
                        }}
                      />
                      <div className="pl-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-mono font-bold"
                            style={{ color: obligation.color }}
                          >
                            {item.deadline}
                          </span>
                          {item.governed && (
                            <span
                              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{
                                background: `${obligation.color}12`,
                                color: obligation.color,
                              }}
                            >
                              <ShieldCheck className="w-2.5 h-2.5" /> Governed
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-0.5" style={{ color: TEXT }}>
                          {item.event}
                        </p>
                        <p className="text-xs" style={{ color: TEXT_SEC }}>
                          {item.action}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function LegalReadinessFunnel() {
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
        form_name: 'legal-governance-readiness',
        form_type: 'diagnostic_assessment',
      });
      try {
        await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'diagnostic_assessment',
            app: 'prism-counsel',
            name: 'Legal Readiness Assessment',
            email: 'noreply@assessment.szlholdings.com',
            message: `Legal governance readiness. Score: ${fs}/${maxPossible}. Result: ${fr?.label}`,
            metadata: {
              assessment: 'legal-governance-readiness',
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
            Legal Governance Assessment
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            How governed is your legal obligation management?
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
                <Link href="/matters" className="flex-1">
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

export default function ObligationTimelinePage() {
  useEffect(() => {
    analytics.pageView({ path: '/obligation-timeline' });
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
        <Link href="/matters">
          <span className="text-sm font-bold" style={{ color: TEXT }}>
            PRISM Counsel
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/matters" className="text-sm" style={{ color: TEXT_SEC }}>
            Platform
          </Link>
          <a href="#assessment">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: ACCENT, color: BG }}
            >
              Run Assessment
            </button>
          </a>
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
            Legal Governance · PRISM Counsel
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
            style={{ color: TEXT }}
          >
            Obligation and dependency timeline — governed.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="text-lg mb-8"
            style={{ color: TEXT_SEC }}
          >
            Every contract renewal, regulatory filing, and litigation hold — visible in one command
            surface, with dependency mapping, advance alerting, and a governed approval chain before
            any legal action executes.
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
                Run Legal Governance Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </a>
            <Link href="/matters">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border hover:bg-white/5"
                style={{ borderColor: `${ACCENT}30`, color: TEXT }}
              >
                Explore Platform <Scale className="w-4 h-4" style={{ color: ACCENT }} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <ObligationTimelineDemo />
      <div id="assessment">
        <LegalReadinessFunnel />
      </div>

      <footer className="py-12 px-4 text-center border-t" style={{ borderColor: BORDER }}>
        <p className="text-sm" style={{ color: TEXT_SEC }}>
          PRISM Counsel — Legal Matter Command · SZL Holdings Platform
        </p>
        <p className="text-xs mt-2" style={{ color: TEXT_SEC }}>
          © 2026 SZL Holdings. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
