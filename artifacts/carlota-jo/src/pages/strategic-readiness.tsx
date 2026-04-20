import { analytics } from '@szl-holdings/analytics';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  Layers,
  Lightbulb,
  Target,
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
const ACCENT = 'hsl(320,65%,62%)';

const SERVICE_ORCHESTRATION_STAGES = [
  {
    phase: '01',
    label: 'Discovery',
    color: '#8b5cf6',
    icon: Lightbulb,
    duration: 'Week 1–2',
    activities: [
      'Strategic diagnostic and maturity assessment',
      'Stakeholder mapping and decision authority review',
      'Current state documentation and gap analysis',
    ],
    deliverable: 'Situation brief with prioritized opportunity map',
  },
  {
    phase: '02',
    label: 'Framework Design',
    color: '#ec4899',
    icon: Layers,
    duration: 'Week 3–4',
    activities: [
      'Governance structure design for identified domains',
      'Decision workflow architecture and approval chain design',
      'Evidence requirements and accountability structure',
    ],
    deliverable: 'Governance framework and decision workflow specifications',
  },
  {
    phase: '03',
    label: 'Implementation',
    color: '#f59e0b',
    icon: Target,
    duration: 'Month 2–3',
    activities: [
      'Pilot rollout with selected decision domain',
      'Operator enablement and stakeholder coaching',
      'Real-time monitoring and iteration',
    ],
    deliverable: 'Live pilot with accountability metrics and outcome tracking',
  },
  {
    phase: '04',
    label: 'Scale',
    color: '#10b981',
    icon: TrendingUp,
    duration: 'Month 4+',
    activities: [
      'Cross-domain governance expansion',
      'Decision intelligence integration and pattern recognition',
      'Board-level reporting and outcome review cadence',
    ],
    deliverable: 'Enterprise governance operating model with measurable outcomes',
  },
];

const ROLE_VIEWS = [
  {
    id: 'ceo',
    label: 'CEO / Founder',
    icon: Briefcase,
    headline: 'Decisions that scale with the organization.',
    body: 'As organizations grow, decision quality degrades and accountability becomes diffuse. Carlota Jo installs the governance architecture that ensures consequential decisions remain traceable, attributed, and outcome-measured — regardless of organizational scale.',
    outcomes: [
      'Governance architecture that scales from 10 to 10,000 employees',
      'Decision attribution at every organizational level',
      'Board-ready governance posture without manual preparation',
      'Outcome tracking that connects strategic intent to operational results',
    ],
  },
  {
    id: 'coo',
    label: 'COO / Operations',
    icon: Target,
    headline: 'Operational decisions with accountability built in.',
    body: 'Operational complexity creates accountability gaps — decisions made in Slack threads with no audit trail, AI recommendations acted on without governance structure. Carlota Jo installs the decision infrastructure that closes those gaps systematically.',
    outcomes: [
      'Structured decision workflow for all consequential operational actions',
      'Cross-function signal correlation — no more siloed incident response',
      'Human-in-the-loop governance on AI-assisted recommendations',
      'Real-time operational posture with attribution on every data point',
    ],
  },
  {
    id: 'board',
    label: 'Board / Investor',
    icon: BarChart3,
    headline: 'Governance posture you can defend.',
    body: "Board members and investors need to know that the governance structure matches the organization's risk profile. Carlota Jo provides the architecture review, gap assessment, and implementation roadmap — with a defensible record of governance investment.",
    outcomes: [
      'Independent governance maturity assessment against industry benchmarks',
      'Documented decision authority matrix with accountability mapping',
      'AI governance posture review — advisory-only with mandatory approval gates',
      'Proof of governance investment — deliverable for regulatory and investor review',
    ],
  },
];

const ASSESSMENT_QUESTIONS = [
  {
    id: 'decision_attribution',
    label:
      'If a board member asks who made a specific consequential decision six months ago, and why, can your team produce that record in under an hour?',
    options: [
      {
        value: 'no',
        label: 'No — we would need to reconstruct it from emails and meetings',
        score: 0,
      },
      {
        value: 'partial',
        label: "Partially — some decisions are documented, most aren't",
        score: 1,
      },
      { value: 'slow', label: 'Yes, but it takes significant manual effort', score: 2 },
      { value: 'yes', label: 'Yes — we have structured, attributed decision records', score: 4 },
    ],
  },
  {
    id: 'ai_governance',
    label:
      'When AI tools generate recommendations that your team acts on, is there a governance structure ensuring human approval before execution?',
    options: [
      {
        value: 'no',
        label: 'No — AI recommendations are often acted on without explicit approval gates',
        score: 0,
      },
      {
        value: 'informal',
        label: "Informally — experienced team members review, but there's no structure",
        score: 1,
      },
      {
        value: 'some',
        label: 'For some decisions — but not consistently across the organization',
        score: 2,
      },
      {
        value: 'yes',
        label: 'Yes — all AI-assisted decisions have mandatory approval gates',
        score: 4,
      },
    ],
  },
  {
    id: 'cross_function',
    label:
      'When a decision in one department has downstream effects on another (legal, finance, operations), are those teams automatically alerted and involved?',
    options: [
      { value: 'no', label: 'No — each department makes decisions in its own lane', score: 0 },
      { value: 'meetings', label: 'Through regular meetings, but not in real-time', score: 1 },
      { value: 'manual', label: 'Only if someone remembers to loop them in', score: 2 },
      {
        value: 'yes',
        label: 'Yes — cross-function signals are automatically correlated and routed',
        score: 4,
      },
    ],
  },
  {
    id: 'outcome_tracking',
    label:
      'Does your organization systematically track whether consequential decisions achieved their intended outcomes?',
    options: [
      {
        value: 'no',
        label: 'No — we measure business results but not decision outcomes',
        score: 0,
      },
      {
        value: 'some',
        label: "For major initiatives only — most decisions aren't tracked",
        score: 1,
      },
      {
        value: 'partial',
        label: "We track outcomes but don't connect them back to specific decisions",
        score: 2,
      },
      {
        value: 'yes',
        label: 'Yes — every consequential decision is tracked to its measured outcome',
        score: 4,
      },
    ],
  },
];

const RESULTS = [
  {
    min: 0,
    max: 4,
    label: 'Critical Governance Gap',
    severity: 'critical' as const,
    desc: 'Your organization has significant accountability exposure. Without governance infrastructure, AI tools are operating without approval gates, decisions are undocumented, and outcome tracking is absent. A regulatory inquiry or litigation event would reveal this gap immediately.',
    cta: 'Request a Governance Briefing',
  },
  {
    min: 5,
    max: 9,
    label: 'Structural Gaps',
    severity: 'moderate' as const,
    desc: 'You have some governance structure but significant gaps remain. Decision accountability is inconsistent, AI governance is informal, and cross-function coordination is manual. A structured governance program would close these gaps systematically.',
    cta: 'Book a Discovery Session',
  },
  {
    min: 10,
    max: 13,
    label: 'Governance-Aware',
    severity: 'ready' as const,
    desc: 'Your organization has awareness of governance requirements and some implementation. The opportunity is making governance systematic — replacing manual oversight with structured decision infrastructure.',
    cta: 'Explore an Engagement',
  },
  {
    min: 14,
    max: 16,
    label: 'Governance-Mature',
    severity: 'ready' as const,
    desc: 'Your organization has strong governance foundations. The conversation is about scaling governance infrastructure across new domains and integrating outcome tracking at the portfolio level.',
    cta: 'Talk to Carlota Jo',
  },
];

const SEVERITY_MAP = {
  critical: { color: 'hsl(0,84%,60%)', bg: 'hsla(0,84%,60%,0.08)', icon: AlertTriangle },
  moderate: { color: 'hsl(45,90%,55%)', bg: 'hsla(45,90%,55%,0.08)', icon: TrendingUp },
  ready: { color: 'hsl(152,70%,50%)', bg: 'hsla(152,70%,50%,0.08)', icon: CheckCircle2 },
};

function ServiceOrchestrationDemo() {
  const [active, setActive] = useState(0);
  const stage = SERVICE_ORCHESTRATION_STAGES[active];
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
            Engagement Model
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            How a Carlota Jo engagement works.
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: TEXT_SEC }}>
            Not consulting in the traditional sense. Governance architecture installed, with
            accountability and outcome tracking built in from day one.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:min-w-[200px]">
            {SERVICE_ORCHESTRATION_STAGES.map((s, i) => {
              const Icon = s.icon;
              const isA = i === active;
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all whitespace-nowrap lg:whitespace-normal text-left"
                  style={{
                    background: isA ? `${s.color}15` : 'transparent',
                    border: `1px solid ${isA ? `${s.color}40` : 'transparent'}`,
                  }}
                >
                  <span
                    className="text-[10px] font-mono font-bold shrink-0"
                    style={{ color: isA ? s.color : TEXT_SEC }}
                  >
                    {s.phase}
                  </span>
                  <Icon
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: isA ? s.color : TEXT_SEC }}
                  />
                  <span className="text-xs font-medium" style={{ color: isA ? TEXT : TEXT_SEC }}>
                    {s.label}
                  </span>
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
              className="flex-1 rounded-2xl p-8"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              {stage && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: `${stage.color}15`,
                          border: `1px solid ${stage.color}30`,
                        }}
                      >
                        <stage.icon className="w-5 h-5" style={{ color: stage.color }} />
                      </div>
                      <div>
                        <span
                          className="text-[10px] font-mono font-bold block"
                          style={{ color: stage.color }}
                        >
                          Phase {stage.phase}
                        </span>
                        <span className="text-xl font-bold" style={{ color: TEXT }}>
                          {stage.label}
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                      style={{
                        background: `${stage.color}10`,
                        border: `1px solid ${stage.color}20`,
                      }}
                    >
                      <Clock className="w-3 h-3" style={{ color: stage.color }} />
                      <span className="text-xs font-medium" style={{ color: stage.color }}>
                        {stage.duration}
                      </span>
                    </div>
                  </div>

                  <div className="mb-5">
                    <p
                      className="text-xs font-semibold tracking-widest uppercase mb-3"
                      style={{ color: TEXT_SEC }}
                    >
                      Activities
                    </p>
                    <div className="flex flex-col gap-2">
                      {stage.activities.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `${stage.color}20` }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: stage.color }}
                            />
                          </div>
                          <p className="text-sm" style={{ color: TEXT }}>
                            {a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-xl"
                    style={{ background: `${stage.color}08`, border: `1px solid ${stage.color}20` }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: stage.color }}
                    >
                      Deliverable
                    </p>
                    <p className="text-sm" style={{ color: TEXT }}>
                      {stage.deliverable}
                    </p>
                  </div>

                  <div className="flex gap-1 mt-6">
                    {SERVICE_ORCHESTRATION_STAGES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className="h-1 rounded-full flex-1 transition-all duration-200"
                        style={{ background: i === active ? stage.color : BORDER }}
                      />
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
    <section style={{ background: BG }} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            Who we work with.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: TEXT_SEC }}>
            Strategic governance for leaders who need decisions to scale with accountability.
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
                  <Link href="/engage">
                    <button
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90"
                      style={{ background: ACCENT, color: BG }}
                    >
                      Book a Discovery Session <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
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

function ReadinessFunnel() {
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
        form_name: 'strategic-readiness-assessment',
        form_type: 'diagnostic_assessment',
      });
      try {
        await fetch('/api/contact/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'diagnostic_assessment',
            app: 'carlota-jo',
            name: 'Strategic Readiness Assessment',
            email: 'noreply@assessment.szlholdings.com',
            message: `Strategic governance readiness assessment. Score: ${finalScore}/${maxPossible}. Result: ${finalResult?.label}`,
            metadata: {
              assessment: 'strategic-governance-readiness',
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
            Governance Readiness
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: TEXT }}
          >
            Is your organization's decision governance where it needs to be?
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
                <Link href="/engage" className="flex-1">
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

export default function StrategicReadinessPage() {
  useEffect(() => {
    analytics.pageView({ path: '/readiness' });
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
        <Link href="/">
          <span className="text-sm font-bold" style={{ color: TEXT }}>
            Carlota Jo
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm" style={{ color: TEXT_SEC }}>
            Home
          </Link>
          <Link href="/services" className="text-sm" style={{ color: TEXT_SEC }}>
            Services
          </Link>
          <Link href="/engage">
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: ACCENT, color: BG }}
            >
              Engage
            </button>
          </Link>
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
            Strategic Governance · Carlota Jo
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
            style={{ color: TEXT }}
          >
            Governance architecture that scales.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="text-lg mb-8"
            style={{ color: TEXT_SEC }}
          >
            Decision accountability, AI governance, and cross-function intelligence — installed as
            structural architecture, not consulting deliverables that age on a shelf.
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
                Take the Readiness Assessment <ChevronRight className="w-4 h-4" />
              </button>
            </a>
            <Link href="/engage">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border hover:bg-white/5"
                style={{ borderColor: `${ACCENT}30`, color: TEXT }}
              >
                Book a Discovery Session{' '}
                <ArrowRight className="w-4 h-4" style={{ color: ACCENT }} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <ServiceOrchestrationDemo />
      <RoleSection />
      <div id="assessment">
        <ReadinessFunnel />
      </div>

      <footer className="py-12 px-4 text-center border-t" style={{ borderColor: BORDER }}>
        <p className="text-sm" style={{ color: TEXT_SEC }}>
          Carlota Jo Consulting · Strategic Governance Architecture
        </p>
        <p className="text-xs mt-2" style={{ color: TEXT_SEC }}>
          © 2026 SZL Holdings. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
