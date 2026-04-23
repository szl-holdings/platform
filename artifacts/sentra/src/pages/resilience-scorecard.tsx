import { analytics } from '@szl-holdings/analytics';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileCheck,
  Lock,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = '#ef4444';

const CONTROL_CATEGORIES = [
  {
    id: 'detection',
    label: 'Threat Detection',
    icon: Eye,
    color: '#ef4444',
    controls: [
      'Endpoint EDR coverage',
      'Network NDR baseline',
      'Identity behavioral analytics',
      'Log ingestion completeness',
    ],
  },
  {
    id: 'response',
    label: 'Incident Response',
    icon: Zap,
    color: '#f97316',
    controls: [
      'Playbook activation time',
      'Escalation chain clarity',
      'Containment execution speed',
      'SOAR automation coverage',
    ],
  },
  {
    id: 'identity',
    label: 'Identity & Access',
    icon: Lock,
    color: '#f59e0b',
    controls: [
      'Privileged access monitoring',
      'MFA enforcement rate',
      'Anomalous login detection',
      'Account lifecycle governance',
    ],
  },
  {
    id: 'governance',
    label: 'Governance & Audit',
    icon: FileCheck,
    color: '#10b981',
    controls: [
      'SOC 2 control evidence',
      'Audit trail completeness',
      'Policy exception management',
      'Board risk reporting cadence',
    ],
  },
];

const DRIFT_SCENARIOS = [
  {
    id: 'mfa_drift',
    label: 'MFA Policy Drift',
    color: '#ef4444',
    severity: 'Critical',
    control: 'Identity · MFA Enforcement',
    detected: 'MFA bypass exceptions: 23 accounts · Policy drift from 98.1% → 84.3% enforcement',
    loop: [
      {
        step: 'Signal',
        text: 'TENAX control-drift monitor detects MFA enforcement rate drop from 98.1% to 84.3% over 14 days — 23 accounts with active bypass exceptions.',
      },
      {
        step: 'Context',
        text: 'Cross-reference with HR system: 8 accounts belong to departing employees. 15 are IT admins with manually-granted exceptions not tracked in policy system.',
      },
      {
        step: 'Recommendation',
        text: 'AI recommends: immediate revocation of 8 departing employee exceptions, governance review of 15 admin exceptions, policy exception approval process reinstated.',
      },
      {
        step: 'Policy',
        text: 'Covenant Policy routes to CISO for approval — no exceptions can be granted outside the governed exception workflow going forward.',
      },
      {
        step: 'Proof',
        text: 'Proof Chain: drift detection timestamp, accounts list, context enrichment, CISO approval, remediation actions with outcome verification.',
      },
    ],
  },
  {
    id: 'log_gap',
    label: 'Log Ingestion Gap',
    color: '#f59e0b',
    severity: 'High',
    control: 'Detection · Log Coverage',
    detected: '3 production subnets not ingesting to SIEM — 11-day blind spot identified',
    loop: [
      {
        step: 'Signal',
        text: 'TENAX coverage map detects 3 production subnets (172.16.24.0/24, 172.16.25.0/24, 172.16.30.0/24) not reporting to SIEM — 11-day gap confirmed.',
      },
      {
        step: 'Context',
        text: 'Asset inventory cross-reference: subnets contain 4 tier-1 systems including primary database cluster. No compensating controls documented.',
      },
      {
        step: 'Recommendation',
        text: 'AI recommends: emergency log forwarding configuration, manual audit of 11-day window for IOCs, compensating control documented pending fix.',
      },
      {
        step: 'Simulation',
        text: 'Decision Simulation: probability of undetected lateral movement in 11-day window — P50: 18%, P90: 47% given current threat landscape.',
      },
      {
        step: 'Proof',
        text: 'Proof Chain: gap detection, subnet inventory, risk simulation, remediation approval, and verification of log ingestion resumption.',
      },
    ],
  },
];

const ASSESSMENT_QUESTIONS = [
  {
    id: 'control_drift',
    label:
      'Do you have automated monitoring that alerts when security controls drift from their configured baseline?',
    options: [
      {
        value: 'no',
        label: 'No — we rely on periodic manual audits to catch configuration drift',
        score: 0,
      },
      { value: 'some', label: 'For some controls — but coverage is inconsistent', score: 1 },
      {
        value: 'manual',
        label: 'We have tools that report drift but no automated alerting workflow',
        score: 2,
      },
      {
        value: 'yes',
        label: 'Yes — automated drift detection with governed alerting and remediation workflow',
        score: 4,
      },
    ],
  },
  {
    id: 'incident_proof',
    label:
      'After a security incident is resolved, can you produce a complete, attributed audit trail of every response action?',
    options: [
      {
        value: 'no',
        label: 'No — we reconstruct from analyst notes and tool logs after the fact',
        score: 0,
      },
      {
        value: 'partial',
        label: 'Partially — some actions are logged but the trail is incomplete',
        score: 1,
      },
      {
        value: 'manual',
        label: 'Yes, but it requires significant manual reconstruction',
        score: 2,
      },
      {
        value: 'yes',
        label: 'Yes — every response action is attributed and recorded in an immutable trail',
        score: 4,
      },
    ],
  },
  {
    id: 'governance_gates',
    label:
      'Before a security action executes — containment, isolation, playbook activation — is there a mandatory human approval gate?',
    options: [
      {
        value: 'no',
        label: 'No — most security actions execute automatically without approval gates',
        score: 0,
      },
      {
        value: 'critical',
        label: 'Only for critical actions — most routine responses are automated without approval',
        score: 1,
      },
      {
        value: 'some',
        label: 'For defined playbooks — but ad hoc responses often skip the approval step',
        score: 2,
      },
      {
        value: 'yes',
        label:
          'Yes — all consequential security actions require explicit approval before execution',
        score: 4,
      },
    ],
  },
  {
    id: 'resilience_posture',
    label:
      "If a board member asked for your organization's current cyber resilience posture right now, how quickly could you produce an accurate answer?",
    options: [
      {
        value: 'days',
        label: "Days — we'd need to manually compile from multiple tools and team reports",
        score: 0,
      },
      {
        value: 'hours',
        label: 'Hours — our security team could produce a summary but it would be manual',
        score: 1,
      },
      {
        value: 'fast',
        label: "Under an hour — we have a dashboard but it's not fully current",
        score: 2,
      },
      {
        value: 'instant',
        label:
          'Instantly — real-time posture dashboard with attributed controls and drift indicators',
        score: 4,
      },
    ],
  },
];

const RESULTS = [
  {
    min: 0,
    max: 4,
    label: 'Critical Resilience Gap',
    severity: 'critical' as const,
    desc: 'Your organization has significant gaps in control governance, incident attribution, and resilience posture visibility. A regulatory inquiry or board question about cyber resilience would expose an accountability gap that is difficult to defend.',
    cta: 'Request a Resilience Briefing',
  },
  {
    min: 5,
    max: 9,
    label: 'Governance Gaps',
    severity: 'moderate' as const,
    desc: 'You have security tooling but significant governance gaps remain — control drift is detected reactively, incident trails are incomplete, and resilience posture requires manual compilation. A governed resilience infrastructure would close these gaps.',
    cta: 'See a TENAX Demo',
  },
  {
    min: 10,
    max: 13,
    label: 'Security-Mature',
    severity: 'ready' as const,
    desc: 'Your security operations have good coverage but rely on manual integration for governance, audit trails, and posture reporting. The opportunity is systematic control governance and Proof Chain-backed incident records.',
    cta: 'Explore TENAX Features',
  },
  {
    min: 14,
    max: 16,
    label: 'Resilience-Grade',
    severity: 'ready' as const,
    desc: 'Your cyber resilience posture is strong. The conversation is about real-time control-drift detection, cross-domain threat correlation, and board-level posture reporting at scale.',
    cta: 'Talk to a Security Expert',
  },
];

const SEVERITY_MAP = {
  critical: { color: 'hsl(0,84%,60%)', bg: 'hsla(0,84%,60%,0.08)', icon: AlertTriangle },
  moderate: { color: 'hsl(45,90%,55%)', bg: 'hsla(45,90%,55%,0.08)', icon: TrendingUp },
  ready: { color: 'hsl(152,70%,50%)', bg: 'hsla(152,70%,50%,0.08)', icon: CheckCircle2 },
};

function ControlDriftDiagnostic() {
  const [active, setActive] = useState(0);
  const [playStep, setPlayStep] = useState(-1);
  const scenario = DRIFT_SCENARIOS[active];
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
      }, 600);
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
            Control-Drift Diagnostic · Synthetic Data
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            Security control drift detected. Governed response initiated.
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            TENAX monitors your security control baseline continuously — detecting drift before it
            becomes an incident, and routing remediation through a governed approval workflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {DRIFT_SCENARIOS.map((s, i) => (
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
              {s.label}
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
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: scenario.color }}
              />
              <span className="text-sm font-semibold" style={{ color: TEXT }}>
                {scenario.control}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${scenario.color}15`, color: scenario.color }}
              >
                {scenario.severity}
              </span>
            </div>
            <div
              className="p-4 border-b"
              style={{ borderColor: BORDER, background: `${scenario.color}05` }}
            >
              <p className="text-sm" style={{ color: TEXT_SEC }}>
                {scenario.detected}
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
                    }, 550);
                  }, 50);
                }}
                className="text-xs font-medium hover:opacity-80"
                style={{ color: ACCENT }}
              >
                ↺ Replay diagnostic
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {CONTROL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="p-5 rounded-2xl"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: cat.color }}>
                    {cat.label}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {cat.controls.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ background: cat.color }}
                      />
                      <span className="text-xs" style={{ color: TEXT_SEC }}>
                        {c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ResilienceScorecard() {
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
        form_name: 'cyber-resilience-scorecard',
        form_type: 'diagnostic_assessment',
      });
      try {
        await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'diagnostic_assessment',
            app: 'sentra',
            name: 'Resilience Scorecard',
            email: 'noreply@assessment.szlholdings.com',
            message: `Cyber resilience scorecard. Score: ${fs}/${maxPossible}. Result: ${fr?.label}`,
            metadata: {
              assessment: 'cyber-resilience-scorecard',
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
    <section style={{ background: BG }} className="py-24 px-4" id="scorecard">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: ACCENT }}
          >
            Cyber Resilience Scorecard
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            Where does your cyber resilience governance stand?
          </h2>
          <p className="text-base" style={{ color: TEXT_SEC }}>
            4 questions · ~2 minutes · Instant resilience score
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
                Start Scorecard <ChevronRight className="w-4 h-4" />
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

export default function ResilienceScorecardPage() {
  useEffect(() => {
    analytics.pageView({ path: '/resilience' });
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
            TENAX
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm" style={{ color: TEXT_SEC }}>
            Dashboard
          </Link>
          <a href="#scorecard">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: ACCENT, color: BG }}
            >
              Run Scorecard
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
            Cyber Resilience · TENAX
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
            style={{ color: TEXT }}
          >
            Resilience scorecard. Control-drift diagnostic. Governed response.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="text-lg mb-8"
            style={{ color: TEXT_SEC }}
          >
            TENAX monitors your security control baseline, detects drift before it becomes an
            incident, and routes every remediation through a governed approval workflow with an
            immutable Proof Chain.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <a href="#scorecard">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold hover:opacity-90"
                style={{ background: ACCENT, color: BG }}
              >
                Run Your Resilience Scorecard <ChevronRight className="w-4 h-4" />
              </button>
            </a>
            <Link href="/dashboard">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border hover:bg-white/5"
                style={{ borderColor: `${ACCENT}30`, color: TEXT }}
              >
                Explore Platform <Shield className="w-4 h-4" style={{ color: ACCENT }} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <ControlDriftDiagnostic />
      <div id="scorecard">
        <ResilienceScorecard />
      </div>

      <footer className="py-12 px-4 text-center border-t" style={{ borderColor: BORDER }}>
        <p className="text-sm" style={{ color: TEXT_SEC }}>
          TENAX — Cyber Resilience Command · SZL Holdings Platform
        </p>
        <p className="text-xs mt-2" style={{ color: TEXT_SEC }}>
          © 2026 SZL Holdings. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
