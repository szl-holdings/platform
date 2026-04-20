import { analytics } from '@szl-holdings/analytics';
import { ContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Eye,
  Globe,
  Layers,
  Lock,
  Navigation,
  ShieldAlert,
  Ship,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

const BG = 'hsl(214,16%,4%)';
const SURFACE = 'hsla(0,0%,100%,0.035)';
const BORDER = 'hsla(0,0%,100%,0.07)';
const TEXT = 'hsl(38,8%,92%)';
const TEXT_SEC = 'hsl(214,7%,55%)';
const ACCENT = 'hsl(199,80%,50%)';

const EXCEPTION_SCENARIOS = [
  {
    id: 'dark_vessel',
    label: 'Dark Vessel Detection',
    color: 'hsl(0,84%,60%)',
    severity: 'Critical',
    vessel: 'MV Horizon',
    event: 'AIS transponder signal lost — 47-minute blackout in high-risk corridor',
    response: [
      {
        step: 'Signal',
        text: 'AIS feed detects 47-minute blackout on MV Horizon at 08:14 UTC. Last known position: Gulf of Aden corridor.',
      },
      {
        step: 'Context',
        text: 'Cross-domain enrichment: vessel history shows 2 prior dark events in OFAC-flagged waters. Cargo manifest flagged by counterparty risk model.',
      },
      {
        step: 'Recommendation',
        text: 'AI recommends: initiate satellite position verification, flag to compliance officer, hold cargo release pending investigation.',
      },
      {
        step: 'Policy',
        text: 'Covenant Policy routes to compliance officer for approval — automatic hold on cargo release enforced at platform layer.',
      },
      {
        step: 'Proof',
        text: 'Proof Chain records full event: AIS loss timestamp, enrichment data, recommendation, policy trigger, and approval action.',
      },
    ],
  },
  {
    id: 'sanctions',
    label: 'Sanctions Alert',
    color: 'hsl(45,90%,55%)',
    severity: 'High',
    vessel: 'MT Pacific Star',
    event: 'Counterparty entity flagged on OFAC SDN list — 3 hours before port clearance',
    response: [
      {
        step: 'Signal',
        text: "Sanctions screening detects MT Pacific Star's new charterer appears on OFAC SDN list update — 3 hours before port entry.",
      },
      {
        step: 'Context',
        text: 'PRISM Counsel cross-domain: existing charter party contains no sanctions clause — legal team alerted automatically.',
      },
      {
        step: 'Recommendation',
        text: 'AI recommends: halt port clearance, initiate sanctions review workflow, engage legal counsel within 30 minutes.',
      },
      {
        step: 'Policy',
        text: 'Covenant Policy enforces mandatory legal review — port clearance cannot proceed without legal sign-off.',
      },
      {
        step: 'Proof',
        text: 'Proof Chain sealed: sanctions match timestamp, legal review record, decision rationale, and outcome attribution.',
      },
    ],
  },
  {
    id: 'voyage_deviation',
    label: 'ETA Deviation',
    color: 'hsl(191,80%,50%)',
    severity: 'Medium',
    vessel: 'MV Atlas',
    event: 'Weather routing deviation adds 18 hours — SLA breach threshold at risk',
    response: [
      {
        step: 'Signal',
        text: 'Voyage telemetry: MV Atlas on weather-avoidance route — ETA deviation of +18 hours detected against SLA commitment.',
      },
      {
        step: 'Context',
        text: 'Voyage P&L model: 18-hour delay triggers $42,000 demurrage clause. Freight rate benchmark shows spot alternative available.',
      },
      {
        step: 'Simulation',
        text: 'Decision Simulation models 3 options: accept delay (P50 cost: $42K), reroute (P50 cost: $18K), spot charter (P50 cost: $67K).',
      },
      {
        step: 'Policy',
        text: 'Operator reviews simulation, selects reroute option — Covenant Policy routes to operations manager for approval.',
      },
      {
        step: 'Proof',
        text: 'Decision recorded: simulation data, operator selection, approval, and revised ETA committed to Proof Chain.',
      },
    ],
  },
];

const ROLE_VIEWS = [
  {
    id: 'fleet-ops',
    label: 'Fleet Operations',
    icon: Ship,
    headline: 'Every exception has a governed response — not just an alert.',
    body: 'Fleet operators see correlated AIS telemetry, sanctions screening, and voyage economics in one governed surface. When an exception fires, the governed response workflow is pre-staged — not waiting for manual escalation.',
    outcomes: [
      'Real-time AIS feed with dark vessel and deviation detection',
      'Sanctions screening against OFAC, UN, and EU lists — with governed response workflow',
      'Voyage P&L integration — demurrage and freight benchmarking in every exception',
      'Cross-domain enrichment: legal flags tied to operational alerts',
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: ShieldAlert,
    headline: 'Regulatory readiness is built into the operation.',
    body: 'Every Vessels action passes through Covenant Policy and lands in the Proof Chain. When a regulatory inquiry arrives, the audit trail is complete — from signal to approval to execution to outcome — without manual reconstruction.',
    outcomes: [
      'Immutable Proof Chain on every sanctions check and exception response',
      'Full actor attribution — who approved what, when, with what evidence',
      'Covenant Policy ensures mandatory review before any regulated action executes',
      'OFAC/UN/EU sanctions screening with deterministic compliance record',
    ],
  },
  {
    id: 'executive',
    label: 'Executive',
    icon: BarChart3,
    headline: 'Fleet risk posture without the manual consolidation.',
    body: 'Executives get a real-time risk posture dashboard across the fleet — dark vessel incidents, sanctions flags, voyage P&L deviation, and crew risk — without waiting for analyst reports.',
    outcomes: [
      'Portfolio-level voyage economics and deviation tracking',
      'Risk posture dashboard with trend analysis',
      'Defensible decision record for board and regulatory reporting',
      'No manual consolidation — cross-domain signals are automatically correlated',
    ],
  },
];

const ASSESSMENT_QUESTIONS = [
  {
    id: 'exception_response',
    label:
      'When a vessel goes dark or a sanctions flag fires, how does your team coordinate a response?',
    options: [
      {
        value: 'manual',
        label: 'Manually — calls, emails, and Slack threads across teams',
        score: 0,
      },
      { value: 'alert', label: 'We get an alert, but the response workflow is manual', score: 1 },
      {
        value: 'partial',
        label: 'We have documented playbooks, but execution is still manual',
        score: 2,
      },
      {
        value: 'governed',
        label: 'Governed workflow — the exception triggers a structured, approved response',
        score: 4,
      },
    ],
  },
  {
    id: 'sanctions_audit',
    label:
      'If a regulator asks for your sanctions screening audit trail from the past 12 months, how quickly can you produce it?',
    options: [
      { value: 'days', label: 'Days to weeks — it requires manual reconstruction', score: 0 },
      { value: 'hours', label: 'Hours — we have logs but need to format and validate', score: 1 },
      {
        value: 'fast',
        label: "Under an hour — our screening tool has records but they're incomplete",
        score: 2,
      },
      {
        value: 'instant',
        label: 'Instantly — our audit trail is complete, attributed, and queryable',
        score: 4,
      },
    ],
  },
  {
    id: 'voyage_pnl',
    label:
      'When an ETA deviation or demurrage risk emerges, do operators see the P&L impact before making a routing decision?',
    options: [
      { value: 'no', label: 'No — P&L is calculated post-voyage by finance', score: 0 },
      { value: 'manual', label: 'Sometimes — only if someone runs a manual calculation', score: 1 },
      {
        value: 'estimate',
        label: 'We have rough estimates, but not integrated into the decision workflow',
        score: 2,
      },
      {
        value: 'integrated',
        label: 'Yes — voyage P&L is integrated into every exception workflow',
        score: 4,
      },
    ],
  },
  {
    id: 'cross_domain',
    label:
      'When a vessel is involved in both an AIS anomaly and a legal/sanctions issue, do your operations and compliance teams see the same correlated picture?',
    options: [
      { value: 'no', label: 'No — each team has separate tools with no correlation', score: 0 },
      { value: 'manual', label: 'Only if someone manually connects the signals', score: 1 },
      {
        value: 'meetings',
        label: 'We have cross-team meetings but no shared intelligence layer',
        score: 2,
      },
      {
        value: 'yes',
        label: 'Yes — signals are correlated and both teams see the same governed picture',
        score: 4,
      },
    ],
  },
];

const RESULTS = [
  {
    min: 0,
    max: 4,
    label: 'High Exposure',
    severity: 'critical' as const,
    desc: 'Your maritime operations have significant gaps in exception governance, sanctions audit trail, and cross-domain intelligence. A dark vessel or sanctions flag could trigger a regulatory investigation with no defensible record.',
    cta: 'Request a Risk Briefing',
  },
  {
    min: 5,
    max: 9,
    label: 'Partial Coverage',
    severity: 'moderate' as const,
    desc: 'You have some tools in place but significant workflow gaps remain. Exception responses are manual, audit trails are incomplete, and cross-domain correlation depends on individual coordination.',
    cta: 'See a Vessels Demo',
  },
  {
    min: 10,
    max: 13,
    label: 'Operationally Sound',
    severity: 'ready' as const,
    desc: 'Your operations have good coverage but are still relying on manual integration across exception response, compliance, and voyage economics. The opportunity is systematic governance and P&L integration.',
    cta: 'Talk to a Maritime Expert',
  },
  {
    min: 14,
    max: 16,
    label: 'Governance-Grade',
    severity: 'ready' as const,
    desc: 'Your fleet operations are at or near governance-grade. The conversation is about cross-domain intelligence, outcome tracking at scale, and Proof Chain-backed regulatory readiness.',
    cta: 'See Advanced Features',
  },
];

const SEVERITY_MAP = {
  critical: { color: 'hsl(0,84%,60%)', bg: 'hsla(0,84%,60%,0.08)', icon: AlertTriangle },
  moderate: { color: 'hsl(45,90%,55%)', bg: 'hsla(45,90%,55%,0.08)', icon: TrendingUp },
  ready: { color: 'hsl(152,70%,50%)', bg: 'hsla(152,70%,50%,0.08)', icon: CheckCircle2 },
};

function ExceptionPlayback() {
  const [active, setActive] = useState(0);
  const [playStep, setPlayStep] = useState(-1);
  const scenario = EXCEPTION_SCENARIOS[active];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    setPlayStep(-1);
    if (!inView) return;
    const t = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i >= scenario.response.length) {
          clearInterval(interval);
          return;
        }
        setPlayStep(i);
        i++;
      }, 600);
      return () => clearInterval(interval);
    }, 200);
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
            Every maritime exception has a governed loop.
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            Not just an alert. A recommendation, a risk simulation, an approved response, and an
            immutable record.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {EXCEPTION_SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
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
            <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: BORDER }}>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: scenario.color }}
              />
              <span className="text-sm font-semibold" style={{ color: TEXT }}>
                {scenario.vessel}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${scenario.color}15`, color: scenario.color }}
              >
                {scenario.severity}
              </span>
              <span className="text-xs ml-auto" style={{ color: TEXT_SEC }}>
                {scenario.event}
              </span>
            </div>

            <div className="p-6 flex flex-col gap-3">
              {scenario.response.map((r, i) => (
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
                  {playStep >= i && i === scenario.response.length - 1 && (
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
                      if (i >= scenario.response.length) {
                        clearInterval(iv);
                        return;
                      }
                      setPlayStep(i);
                      i++;
                    }, 500);
                  }, 50);
                }}
                className="text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ color: ACCENT }}
              >
                ↺ Replay scenario
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function RoleViews() {
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
            Who Vessels serves.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_SEC }}>
            The same governed loop — different signal surfaces for different roles.
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
                  <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: TEXT }}>
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

function FleetAssessment() {
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
      const finalScore = Object.values(newScores).reduce((a, b) => a + b, 0);
      const finalResult =
        RESULTS.find((r) => finalScore >= r.min && finalScore <= r.max) ??
        RESULTS[RESULTS.length - 1];
      setStep('result');
      analytics.formSubmit({
        form_name: 'fleet-governance-assessment',
        form_type: 'diagnostic_assessment',
      });
      try {
        await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'diagnostic_assessment',
            app: 'vessels',
            name: 'Fleet Assessment Submission',
            email: 'noreply@assessment.szlholdings.com',
            message: `Fleet governance readiness assessment. Score: ${finalScore}/${maxPossible}. Result: ${finalResult?.label}`,
            metadata: {
              assessment: 'fleet-governance-readiness',
              score: finalScore,
              result: finalResult?.label,
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
            Fleet Governance Assessment
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            How governed is your maritime operation?
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
              <div className="flex justify-center gap-2 mb-6">
                {ASSESSMENT_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full"
                    style={{ background: BORDER, width: 40 }}
                  />
                ))}
              </div>
              <button
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
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
                      className="h-1 rounded-full flex-1 transition-all duration-300"
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
                <Link href="/marketing" className="flex-1">
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

export default function FleetAssessmentPage() {
  useEffect(() => {
    analytics.pageView({ path: '/fleet-assessment' });
  }, []);
  return (
    <div style={{ background: BG, minHeight: '100dvh' }}>
      <MarketingNav />

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
            Maritime Governance · Fleet Assessment
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
            style={{ color: TEXT }}
          >
            Maritime risk, governed.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="text-lg md:text-xl mb-8"
            style={{ color: TEXT_SEC }}
          >
            When a vessel goes dark, a sanctions flag fires, or an ETA deviation threatens your SLA
            — you need a recommendation, a risk simulation, and an approved response. Not just an
            alert.
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
                Take Fleet Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </a>
            <Link href="/marketing">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border hover:bg-white/5"
                style={{ borderColor: `${ACCENT}30`, color: TEXT }}
              >
                See Vessels Demo <Ship className="w-4 h-4" style={{ color: ACCENT }} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <ExceptionPlayback />
      <RoleViews />
      <FleetAssessment />
      <MarketingFooter />
    </div>
  );
}
