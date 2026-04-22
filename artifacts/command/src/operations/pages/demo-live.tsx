import {
  DEMO_SCENARIOS,
  type DemoScenarioKey,
  type LiveRecommendation,
  type PrismPhase,
  useDemoMode,
  type WorkflowStep,
} from '@lyte/lib/demo-mode';
import {
  Activity,
  Anchor,
  ArrowRight,
  Brain,
  Building2,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Loader2,
  Play,
  Radio,
  RotateCcw,
  Shield,
  Target,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e', panel: '#0e1219' };
const BORDER = {
  subtle: 'rgba(255,255,255,0.04)',
  muted: 'rgba(255,255,255,0.06)',
  accent: 'rgba(212,160,84,0.12)',
};
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const GOLD = '#d4a054';

const PHASE_LABELS: Record<PrismPhase, string> = {
  detect: 'Detect',
  interpret: 'Interpret',
  decide: 'Decide',
  execute: 'Execute',
  verify: 'Verify',
};

const PHASE_DESCRIPTIONS: Record<PrismPhase, string> = {
  detect: 'Signal ingested and normalized from source system',
  interpret: 'Classifying signal, scoring severity, mapping blast radius',
  decide: 'Generating AI recommendation with evidence trail',
  execute: 'Executing approved action across connected systems',
  verify: 'Confirming remediation complete, closing the loop',
};

const PHASE_ICONS: Record<PrismPhase, React.ElementType> = {
  detect: Radio,
  interpret: Brain,
  decide: Target,
  execute: Zap,
  verify: CheckCheck,
};

const PHASE_COLORS: Record<PrismPhase, string> = {
  detect: '#c8953c',
  interpret: '#8b7ac8',
  decide: '#d4a054',
  execute: '#c45a4a',
  verify: '#4ab87a',
};

const SEV_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  critical: { text: '#c45a4a', bg: 'rgba(196,90,74,0.08)', border: 'rgba(196,90,74,0.2)' },
  high: { text: '#c8953c', bg: 'rgba(200,149,60,0.08)', border: 'rgba(200,149,60,0.2)' },
  medium: { text: '#d4a054', bg: 'rgba(212,160,84,0.08)', border: 'rgba(212,160,84,0.2)' },
};

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  aegis: Shield,
  vessels: Anchor,
  terra: Building2,
};

const PHASE_ORDER: PrismPhase[] = ['detect', 'interpret', 'decide', 'execute', 'verify'];

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: color }}
      />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
    </span>
  );
}

function PhaseTrack({ currentPhase, running }: { currentPhase: PrismPhase; running: boolean }) {
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  return (
    <div className="flex items-center gap-0">
      {PHASE_ORDER.map((phase, idx) => {
        const Icon = PHASE_ICONS[phase];
        const color = PHASE_COLORS[phase];
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        const isPending = idx > currentIdx;
        return (
          <div key={phase} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                style={{
                  background: isDone
                    ? `${color}20`
                    : isActive
                      ? `${color}18`
                      : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isDone ? `${color}40` : isActive ? `${color}60` : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: isActive && running ? `0 0 12px ${color}30` : 'none',
                }}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color }} />
                ) : isActive && running ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />
                ) : (
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: isPending ? TEXT.muted : color, opacity: isPending ? 0.4 : 1 }}
                  />
                )}
              </div>
              <span
                className="text-[8px] font-mono uppercase tracking-wider"
                style={{ color: isActive ? color : isDone ? `${color}80` : TEXT.muted }}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>
            {idx < PHASE_ORDER.length - 1 && (
              <div
                className="w-8 h-px mx-1 mb-3"
                style={{
                  background: isDone
                    ? `${PHASE_COLORS[PHASE_ORDER[idx + 1]]}30`
                    : 'rgba(255,255,255,0.06)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LiveSignalCard({
  signal,
  index,
}: {
  signal: ReturnType<typeof useDemoMode>['state']['signals'][0];
  index: number;
}) {
  const c = SEV_COLORS[signal.severity];
  const DomainIcon = DOMAIN_ICONS[signal.domain] ?? Shield;
  return (
    <div
      className="rounded-md p-3 transition-all duration-500"
      style={{
        background: BG.surface,
        border: `1px solid ${c.border}`,
        animation: index === 0 ? 'none' : 'fadeSlideIn 0.4s ease-out',
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex-shrink-0">
          <PulsingDot color={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[8px] font-mono px-1.5 py-px rounded uppercase tracking-wider"
              style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
            >
              {signal.severity}
            </span>
            <div className="flex items-center gap-1">
              <DomainIcon className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
              <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                {signal.source}
              </span>
            </div>
            <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
              LIVE
            </span>
          </div>
          <p
            className="text-[11px] font-medium leading-snug mb-1.5"
            style={{ color: TEXT.primary }}
          >
            {signal.title}
          </p>
          <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
            {signal.summary}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <div>
              <span className="text-[8px] uppercase tracking-wider" style={{ color: TEXT.muted }}>
                Classified
              </span>
              <span className="text-[8px] font-mono ml-1.5" style={{ color: GOLD }}>
                {signal.classifiedAs.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-[8px] uppercase tracking-wider" style={{ color: TEXT.muted }}>
                Confidence
              </span>
              <span className="text-[8px] font-mono ml-1.5" style={{ color: '#4ab87a' }}>
                {Math.round(signal.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowStepList({ steps, phase }: { steps: WorkflowStep[]; phase: PrismPhase }) {
  if (!steps) return null;
  return (
    <div className="space-y-1.5">
      {steps.map((step, idx) => {
        const isDone = step.status === 'done';
        const isRunning = step.status === 'running';
        const isFailed = step.status === 'failed';
        const phaseColor = PHASE_COLORS[PHASE_ORDER[idx] as PrismPhase] ?? GOLD;
        return (
          <div
            key={step.id}
            className="flex items-start gap-2.5 p-2 rounded transition-all duration-300"
            style={{
              background: isRunning ? `${phaseColor}08` : 'transparent',
              border: `1px solid ${isRunning ? `${phaseColor}20` : 'transparent'}`,
            }}
          >
            <div className="mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: phaseColor }} />
              ) : isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: phaseColor }} />
              ) : isFailed ? (
                <XCircle className="w-3.5 h-3.5" style={{ color: '#c45a4a' }} />
              ) : (
                <CircleDot className="w-3.5 h-3.5" style={{ color: TEXT.muted, opacity: 0.3 }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] leading-snug"
                style={{ color: isDone ? TEXT.secondary : isRunning ? TEXT.primary : TEXT.muted }}
              >
                {step.label}
              </p>
              {step.durationMs && isDone && (
                <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                  {(step.durationMs / 1000).toFixed(1)}s
                </span>
              )}
              {step.output && (
                <p className="text-[9px] mt-0.5" style={{ color: TEXT.tertiary }}>
                  {step.output}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApprovalGate({
  rec,
  onApprove,
  onReject,
}: {
  rec: LiveRecommendation;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const isPending = rec.approvalState === 'pending';
  const isApproved =
    rec.approvalState === 'approved' ||
    rec.approvalState === 'executing' ||
    rec.approvalState === 'done';
  const isRejected = rec.approvalState === 'rejected';
  const isExecuting = rec.approvalState === 'executing';
  const isDone = rec.approvalState === 'done';

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
    >
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: `1px solid ${BORDER.subtle}`, background: 'rgba(212,160,84,0.04)' }}
      >
        <Target className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
          AI Recommendation — Approval Gate
        </span>
        {isPending && (
          <span
            className="ml-auto text-[8px] px-2 py-px rounded font-mono uppercase tracking-wider animate-pulse"
            style={{
              color: '#d4a054',
              background: 'rgba(212,160,84,0.08)',
              border: '1px solid rgba(212,160,84,0.2)',
            }}
          >
            Awaiting Decision
          </span>
        )}
        {isApproved && (
          <span
            className="ml-auto text-[8px] px-2 py-px rounded font-mono uppercase tracking-wider"
            style={{
              color: '#4ab87a',
              background: 'rgba(74,184,122,0.08)',
              border: '1px solid rgba(74,184,122,0.2)',
            }}
          >
            {isDone ? 'Executed' : isExecuting ? 'Executing...' : 'Approved'}
          </span>
        )}
        {isRejected && (
          <span
            className="ml-auto text-[8px] px-2 py-px rounded font-mono uppercase tracking-wider"
            style={{
              color: '#c45a4a',
              background: 'rgba(196,90,74,0.08)',
              border: '1px solid rgba(196,90,74,0.2)',
            }}
          >
            Rejected
          </span>
        )}
      </div>
      <div className="p-3 space-y-3">
        <div>
          <h4 className="text-[11px] font-semibold mb-1" style={{ color: TEXT.primary }}>
            {rec.title}
          </h4>
          <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
            {rec.reasoning}
          </p>
        </div>

        <div>
          <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: TEXT.muted }}>
            Evidence Trail
          </div>
          <div className="space-y-1">
            {rec.evidence.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight
                  className="w-3 h-3 shrink-0 mt-px"
                  style={{ color: GOLD, opacity: 0.6 }}
                />
                <span className="text-[10px]" style={{ color: TEXT.secondary }}>
                  {e}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>
              Confidence Score
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${rec.confidenceScore * 100}%`,
                    background: `linear-gradient(90deg, #d4a054, #4ab87a)`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono" style={{ color: '#4ab87a' }}>
                {Math.round(rec.confidenceScore * 100)}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>
              Impact Estimate
            </div>
            <p className="text-[9px] font-medium" style={{ color: TEXT.primary }}>
              {rec.impactEstimate}
            </p>
          </div>
        </div>

        <div>
          <div className="text-[8px] uppercase tracking-wider mb-1.5" style={{ color: TEXT.muted }}>
            Suggested Action
          </div>
          <pre
            className="text-[9px] leading-relaxed whitespace-pre-wrap font-mono p-2 rounded"
            style={{
              color: TEXT.secondary,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${BORDER.subtle}`,
            }}
          >
            {rec.suggestedAction}
          </pre>
        </div>

        {isExecuting && rec.executionLog && (
          <div>
            <div
              className="text-[8px] uppercase tracking-wider mb-1.5"
              style={{ color: TEXT.muted }}
            >
              Execution Log
            </div>
            <div
              className="space-y-1 p-2 rounded"
              style={{
                background: 'rgba(74,184,122,0.03)',
                border: '1px solid rgba(74,184,122,0.1)',
              }}
            >
              {rec.executionLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i === (rec.executionLog?.length ?? 0) - 1 ? (
                    <Loader2
                      className="w-2.5 h-2.5 animate-spin shrink-0"
                      style={{ color: '#4ab87a' }}
                    />
                  ) : (
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" style={{ color: '#4ab87a' }} />
                  )}
                  <span className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isDone && (
          <div
            className="flex items-center gap-2 p-2 rounded"
            style={{
              background: 'rgba(74,184,122,0.06)',
              border: '1px solid rgba(74,184,122,0.15)',
            }}
          >
            <CheckCheck className="w-4 h-4" style={{ color: '#4ab87a' }} />
            <span className="text-[10px] font-medium" style={{ color: '#4ab87a' }}>
              Execution complete — loop closed, audit trail written
            </span>
          </div>
        )}

        {isPending && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setApproving(true);
                onApprove();
              }}
              disabled={approving}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded text-[10px] font-semibold transition-all"
              style={{
                background: 'rgba(74,184,122,0.1)',
                border: '1px solid rgba(74,184,122,0.3)',
                color: '#4ab87a',
              }}
            >
              {approving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Approve & Execute
            </button>
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded text-[10px] font-medium transition-all"
              style={{
                background: 'rgba(196,90,74,0.06)',
                border: '1px solid rgba(196,90,74,0.2)',
                color: '#c45a4a',
              }}
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioSelector({
  current,
  onSelect,
  disabled,
}: {
  current: DemoScenarioKey;
  onSelect: (k: DemoScenarioKey) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {DEMO_SCENARIOS.map((s) => {
        const Icon = DOMAIN_ICONS[s.key] ?? Shield;
        const isActive = s.key === current;
        return (
          <button
            key={s.key}
            onClick={() => !disabled && onSelect(s.key)}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-[10px] font-medium transition-all"
            style={{
              background: isActive ? `${s.color}12` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isActive ? `${s.color}40` : 'rgba(255,255,255,0.06)'}`,
              color: isActive ? s.color : TEXT.secondary,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled && !isActive ? 0.5 : 1,
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function ElapsedTimer({ ms }: { ms: number }) {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return (
    <span className="font-mono text-[10px]" style={{ color: TEXT.tertiary }}>
      {mins > 0 ? `${mins}m ` : ''}
      {s}s
    </span>
  );
}

export default function DemoLive() {
  const {
    state,
    activate,
    deactivate,
    selectScenario,
    approveRecommendation,
    rejectRecommendation,
  } = useDemoMode();
  const scenario = DEMO_SCENARIOS.find((s) => s.key === state.currentScenario) ?? DEMO_SCENARIOS[0];
  const DomainIcon = DOMAIN_ICONS[state.currentScenario] ?? Shield;
  const phaseColor = PHASE_COLORS[state.phase];
  const currentPhaseIdx = PHASE_ORDER.indexOf(state.phase);

  const handleStart = () => activate(state.currentScenario);
  const handleReset = () => {
    deactivate();
  };

  const showApprovalGate = state.phase === 'decide' && state.recommendation && !state.running;
  const postApproval =
    state.recommendation &&
    (state.recommendation.approvalState === 'approved' ||
      state.recommendation.approvalState === 'executing' ||
      state.recommendation.approvalState === 'done' ||
      state.recommendation.approvalState === 'rejected');

  return (
    <div className="h-full overflow-auto" style={{ background: BG.page }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: GOLD }} />
              <h1 className="text-sm font-bold tracking-wide" style={{ color: TEXT.primary }}>
                Command Live Demo
              </h1>
              <span
                className="text-[8px] px-2 py-px rounded font-mono uppercase tracking-wider"
                style={{
                  color: GOLD,
                  background: 'rgba(212,160,84,0.08)',
                  border: '1px solid rgba(212,160,84,0.12)',
                }}
              >
                DEMO MODE
              </span>
            </div>
            <p className="text-[11px]" style={{ color: TEXT.secondary }}>
              Watch Command detect a live signal, classify it, run the Alloy workflow engine through
              PRISM phases, generate an AI recommendation, and execute — end to end.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {state.active && <ElapsedTimer ms={state.elapsedMs} />}
            {!state.active ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-semibold transition-all"
                style={{
                  background: 'rgba(212,160,84,0.12)',
                  border: '1px solid rgba(212,160,84,0.3)',
                  color: GOLD,
                }}
              >
                <Play className="w-3.5 h-3.5" />
                Start Demo
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-[10px] font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: TEXT.secondary,
                }}
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="text-[8px] uppercase tracking-wider mb-2" style={{ color: TEXT.muted }}>
            Demo Scenario
          </div>
          <ScenarioSelector
            current={state.currentScenario}
            onSelect={selectScenario}
            disabled={state.active}
          />
        </div>

        {!state.active && (
          <div
            className="rounded-md p-4"
            style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                style={{
                  background: `${scenario.color}10`,
                  border: `1px solid ${scenario.color}30`,
                }}
              >
                {scenario.icon}
              </div>
              <div>
                <div className="text-[10px] font-mono mb-0.5" style={{ color: scenario.color }}>
                  {scenario.domainLabel}
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: TEXT.primary }}>
                  {scenario.name}
                </h3>
                <p className="text-[11px] mb-1.5" style={{ color: TEXT.secondary }}>
                  {scenario.description}
                </p>
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3" style={{ color: TEXT.muted }} />
                  <span className="text-[9px] italic" style={{ color: TEXT.tertiary }}>
                    {scenario.tagline}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {state.active && (
          <>
            <div
              className="rounded-md p-3"
              style={{ background: BG.surface, border: `1px solid rgba(212,160,84,0.08)` }}
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <DomainIcon className="w-3.5 h-3.5" style={{ color: scenario.color }} />
                  <span
                    className="text-[10px] font-mono font-semibold"
                    style={{ color: scenario.color }}
                  >
                    {scenario.domainLabel}
                  </span>
                </div>
                <div className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                  Phase {currentPhaseIdx + 1} of {PHASE_ORDER.length}
                </div>
              </div>
              <div className="flex justify-center">
                <PhaseTrack currentPhase={state.phase} running={state.running} />
              </div>
              <div className="mt-3 text-center">
                <div className="text-[10px] font-semibold" style={{ color: phaseColor }}>
                  {PHASE_LABELS[state.phase]}
                </div>
                <div className="text-[9px] mt-0.5" style={{ color: TEXT.secondary }}>
                  {PHASE_DESCRIPTIONS[state.phase]}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div
                  className="rounded-md overflow-hidden"
                  style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
                >
                  <div
                    className="px-3 py-2 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
                  >
                    <Radio className="w-3.5 h-3.5" style={{ color: '#c8953c' }} />
                    <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                      Live Signal Feed
                    </span>
                    <span className="ml-auto flex items-center gap-1.5">
                      <PulsingDot color="#c8953c" />
                      <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                        {state.signalCount} ingested
                      </span>
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    {state.signals.map((sig, i) => (
                      <LiveSignalCard key={sig.id} signal={sig} index={i} />
                    ))}
                  </div>
                </div>

                {state.workflowRun && (
                  <div
                    className="rounded-md overflow-hidden"
                    style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
                  >
                    <div
                      className="px-3 py-2 flex items-center gap-2"
                      style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
                    >
                      <Activity className="w-3.5 h-3.5" style={{ color: GOLD }} />
                      <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                        Alloy Workflow Engine
                      </span>
                      {state.running && (
                        <Loader2
                          className="w-3 h-3 animate-spin ml-auto"
                          style={{ color: TEXT.muted }}
                        />
                      )}
                      {state.workflowRun.completedAt && (
                        <CheckCircle2 className="w-3 h-3 ml-auto" style={{ color: '#4ab87a' }} />
                      )}
                    </div>
                    <div className="p-3">
                      <div
                        className="text-[9px] font-mono mb-2.5 truncate"
                        style={{ color: TEXT.muted }}
                      >
                        {state.workflowRun.name}
                      </div>
                      <WorkflowStepList steps={state.workflowRun.steps} phase={state.phase} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {state.recommendation && (showApprovalGate || postApproval) && (
                  <ApprovalGate
                    rec={state.recommendation}
                    onApprove={approveRecommendation}
                    onReject={rejectRecommendation}
                  />
                )}

                {!state.recommendation && (
                  <div
                    className="rounded-md p-4 flex flex-col items-center justify-center gap-2 min-h-[160px]"
                    style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
                  >
                    <Brain className="w-6 h-6" style={{ color: TEXT.muted, opacity: 0.3 }} />
                    <p className="text-[10px]" style={{ color: TEXT.muted }}>
                      AI recommendation will appear after the Decide phase
                    </p>
                    {state.running && (
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: TEXT.muted }} />
                    )}
                  </div>
                )}

                {state.workflowRun?.completedAt &&
                  state.recommendation?.approvalState === 'done' && (
                    <div
                      className="rounded-md p-4"
                      style={{
                        background: 'rgba(74,184,122,0.04)',
                        border: '1px solid rgba(74,184,122,0.15)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCheck className="w-4 h-4" style={{ color: '#4ab87a' }} />
                        <span className="text-[11px] font-semibold" style={{ color: '#4ab87a' }}>
                          Demo Complete — Full Loop Executed
                        </span>
                      </div>
                      <p className="text-[10px]" style={{ color: TEXT.secondary }}>
                        Command detected the signal, classified it, ran the Alloy workflow engine
                        through all 5 PRISM phases (Detect → Interpret → Decide → Execute → Verify),
                        generated an AI recommendation with evidence, received your approval, and
                        executed — in real-time.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-1.5 text-[9px] px-3 py-1.5 rounded transition-all"
                          style={{
                            background: 'rgba(74,184,122,0.08)',
                            border: '1px solid rgba(74,184,122,0.2)',
                            color: '#4ab87a',
                          }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Run Another Scenario
                        </button>
                      </div>
                    </div>
                  )}

                {state.recommendation?.approvalState === 'rejected' && (
                  <div
                    className="rounded-md p-4"
                    style={{
                      background: 'rgba(196,90,74,0.04)',
                      border: '1px solid rgba(196,90,74,0.15)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="w-4 h-4" style={{ color: '#c45a4a' }} />
                      <span className="text-[11px] font-semibold" style={{ color: '#c45a4a' }}>
                        Recommendation Rejected
                      </span>
                    </div>
                    <p className="text-[10px] mb-3" style={{ color: TEXT.secondary }}>
                      The recommendation was rejected. No action was taken. Command logged the decision
                      in the audit trail.
                    </p>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 text-[9px] px-3 py-1.5 rounded"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${BORDER.muted}`,
                        color: TEXT.secondary,
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Try Again
                    </button>
                  </div>
                )}

                <div
                  className="rounded-md p-3"
                  style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
                >
                  <div
                    className="text-[8px] uppercase tracking-wider mb-2"
                    style={{ color: TEXT.muted }}
                  >
                    PRISM Method Demonstrated
                  </div>
                  <div className="space-y-1.5">
                    {(['detect', 'interpret', 'decide', 'execute', 'verify'] as PrismPhase[]).map(
                      (p, i) => {
                        const Icon = PHASE_ICONS[p];
                        const color = PHASE_COLORS[p];
                        const isDone = PHASE_ORDER.indexOf(state.phase) > i;
                        const isActive = state.phase === p;
                        const descriptions: Record<PrismPhase, string> = {
                          detect: 'P — Predict: Ingest and normalize signals',
                          interpret: 'R — Respond: Classify and score the signal',
                          decide: 'I — Investigate: Generate evidence-backed recommendation',
                          execute: 'S — Stabilize: Execute approved action',
                          verify: 'M — Monitor: Confirm resolution and close loop',
                        };
                        return (
                          <div key={p} className="flex items-center gap-2">
                            <Icon
                              className="w-3 h-3 shrink-0"
                              style={{
                                color: isDone || isActive ? color : TEXT.muted,
                                opacity: isDone || isActive ? 1 : 0.3,
                              }}
                            />
                            <span
                              className="text-[9px]"
                              style={{
                                color: isDone || isActive ? TEXT.secondary : TEXT.muted,
                                opacity: isDone || isActive ? 1 : 0.4,
                              }}
                            >
                              {descriptions[p]}
                            </span>
                            {isDone && (
                              <CheckCircle2
                                className="w-2.5 h-2.5 ml-auto shrink-0"
                                style={{ color }}
                              />
                            )}
                            {isActive && state.running && (
                              <Loader2
                                className="w-2.5 h-2.5 ml-auto shrink-0 animate-spin"
                                style={{ color }}
                              />
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
