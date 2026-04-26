import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Shield,
  SkipForward,
  User,
  UserCheck,
  UserCog,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'wouter';
import { useDecisionReplay } from '@/data/api';
import { useMarketIndicators } from '@/data/market-api';
import { MarketTicker } from '@/components/MarketTicker';
import {
  bootstrapInterventions,
  formatTimestamp,
  type Intervention,
  useInterventions,
} from '@/data/interventions';
import {
  effectiveRevealed,
  isReplayMode as computeIsReplayMode,
  pauseReplay as pureReplayPause,
  resetReplay as pureReplayReset,
  startReplay as pureReplayStart,
  stepBack as pureReplayStepBack,
  stepForward as pureReplayStepForward,
  tick as pureReplayTick,
} from '@/data/replay-state';
import type { ReplayEvent, ReplayScenario } from '@/data/seed';

const INTERVENTION_ICON: Record<Intervention['type'], React.ReactNode> = {
  claim: <UserCheck className="w-3 h-3 text-amber-300" />,
  resolve: <CheckCircle2 className="w-3 h-3 text-emerald-300" />,
  reassign: <UserCog className="w-3 h-3 text-sky-300" />,
  address: <CheckCircle2 className="w-3 h-3 text-emerald-300" />,
  acknowledge: <CheckCircle2 className="w-3 h-3 text-emerald-300" />,
};

const INTERVENTION_LABEL: Record<Intervention['type'], string> = {
  claim: 'Claimed ownership',
  resolve: 'Resolved drift item',
  reassign: 'Reassigned owner',
  address: 'Flagged as addressed',
  acknowledge: 'Acknowledged pressure signal',
};

const INTERVENTION_TONE: Record<Intervention['type'], string> = {
  claim: 'border-amber-500/30 bg-amber-500/5',
  resolve: 'border-emerald-500/30 bg-emerald-500/5',
  reassign: 'border-sky-500/30 bg-sky-500/5',
  address: 'border-emerald-500/30 bg-emerald-500/5',
  acknowledge: 'border-emerald-500/30 bg-emerald-500/5',
};

const EVIDENCE_ICONS: Record<ReplayEvent['evidenceType'], React.ReactNode> = {
  alloy: <Zap className="w-3 h-3 text-amber-400" />,
  human: <User className="w-3 h-3 text-sky-400" />,
  system: <Brain className="w-3 h-3 text-violet-400" />,
  escalation: <AlertTriangle className="w-3 h-3 text-red-400" />,
};

const EVIDENCE_COLORS: Record<ReplayEvent['evidenceType'], string> = {
  alloy: 'border-amber-500/30 bg-amber-500/5',
  human: 'border-sky-500/30 bg-sky-500/5',
  system: 'border-violet-500/30 bg-violet-500/5',
  escalation: 'border-red-500/30 bg-red-500/5',
};

const CONNECTOR_COLORS: Record<ReplayEvent['evidenceType'], string> = {
  alloy: 'bg-amber-500/30',
  human: 'bg-sky-500/30',
  system: 'bg-violet-500/30',
  escalation: 'bg-red-500/30',
};

const EVIDENCE_BORDER_COLOR: Record<ReplayEvent['evidenceType'], string> = {
  alloy: 'rgba(245,158,11,0.4)',
  human: 'rgba(77,143,204,0.4)',
  system: 'rgba(167,139,250,0.4)',
  escalation: 'rgba(239,68,68,0.4)',
};

const EVIDENCE_TEXT_COLOR: Record<ReplayEvent['evidenceType'], string> = {
  alloy: '#f59e0b',
  human: '#38bdf8',
  system: '#c4b5fd',
  escalation: '#f87171',
};

function EventNode({
  event,
  isLast,
  revealed,
  active,
}: {
  event: ReplayEvent;
  isLast: boolean;
  revealed: boolean;
  active: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  if (!revealed) {
    return (
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 rounded-full border-2 border-amber-500/10 bg-amber-500/5 flex items-center justify-center shrink-0 z-10">
            <div className="w-2 h-2 rounded-full bg-amber-500/20" />
          </div>
          {!isLast && <div className="w-px flex-1 mt-1 min-h-[24px] bg-amber-500/10" />}
        </div>
        <div className="flex-1 pb-5 border rounded-lg p-3 mb-3 border-amber-500/8 bg-amber-500/3">
          <div className="w-24 h-2 bg-amber-500/10 rounded animate-pulse" />
          <div className="w-16 h-2 bg-amber-500/8 rounded mt-2 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 transition-all duration-300 ${active ? 'scale-[1.01]' : ''}`}>
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${EVIDENCE_COLORS[event.evidenceType].replace('bg-', 'bg-').replace('/5', '/15')} ${active ? 'ring-2 ring-amber-400/40' : ''}`}
          style={{ borderColor: EVIDENCE_BORDER_COLOR[event.evidenceType] }}
        >
          {EVIDENCE_ICONS[event.evidenceType]}
        </div>
        {!isLast && (
          <div
            className={`w-px flex-1 mt-1 min-h-[24px] ${CONNECTOR_COLORS[event.evidenceType]}`}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 pb-5 border rounded-lg p-3 mb-3 cursor-pointer hover:opacity-90 transition-all ${EVIDENCE_COLORS[event.evidenceType]} ${active ? 'shadow-lg shadow-amber-500/5' : ''}`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono text-amber-400/50">{event.timestamp}</span>
              {event.signal && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {event.signal}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-amber-100">{event.actor}</p>
            <p className="text-[10px] text-amber-400/55">
              {event.role} · {event.action}
            </p>
          </div>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${EVIDENCE_COLORS[event.evidenceType]} uppercase`}
            style={{ color: EVIDENCE_TEXT_COLOR[event.evidenceType] }}
          >
            {event.evidenceType}
          </span>
        </div>

        {expanded && (
          <div
            className="mt-2 pt-2 border-t space-y-2"
            style={{
              borderColor:
                event.evidenceType === 'alloy'
                  ? 'rgba(245,158,11,0.15)'
                  : event.evidenceType === 'human'
                    ? 'rgba(77,143,204,0.15)'
                    : 'rgba(239,68,68,0.15)',
            }}
          >
            <p className="text-xs text-amber-100/70 leading-relaxed">{event.detail}</p>
            <div className="flex items-center gap-2">
              <span className="proof-badge text-[9px]">
                <Shield className="w-2 h-2" />
                {event.proofRef}
              </span>
              <span className="text-[9px] font-mono text-amber-400/35">LEDGER-ANCHORED</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioCard({
  scenario,
  selected,
  onClick,
}: {
  scenario: ReplayScenario;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left cockpit-panel p-4 hover:border-amber-500/30 transition-all ${selected ? 'border-amber-500/40 bg-amber-500/5' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-amber-100">{scenario.title}</p>
          <p className="text-[10px] font-mono text-amber-400/45 mt-0.5">{scenario.dateRange}</p>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-transform ${selected ? 'rotate-90 text-amber-400' : 'text-amber-400/30'}`}
        />
      </div>
      <p className="text-[11px] text-amber-100/55 mt-2 leading-snug">{scenario.decision}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[9px] font-mono text-amber-400/40">
          {scenario.events.length} events
        </span>
        <span className="text-[9px] font-mono text-amber-400/30">·</span>
        <span className="proof-badge text-[9px]">
          <Shield className="w-2 h-2" />
          {scenario.events.at(-1)?.proofRef}
        </span>
      </div>
    </button>
  );
}

const REPLAY_INTERVAL_MS = 1200;

export default function DecisionReplayPage() {
  useEffect(() => {
    void bootstrapInterventions();
  }, []);

  const params = useParams<{ id?: string }>();
  const { data, isLoading, error } = useDecisionReplay();
  const [activeScenario, setActiveScenario] = useState<ReplayScenario | null>(null);
  const { log: interventionLog } = useInterventions();

  // Replay state
  const [revealedCount, setRevealedCount] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalEvents = activeScenario?.events.length ?? 0;
  const currentRevealed = effectiveRevealed({ revealedCount, playing }, totalEvents);

  useEffect(() => {
    if (!data?.scenarios?.length) return;
    const initial = params.id
      ? (data.scenarios.find((s) => s.id === params.id) ?? data.scenarios[0]!)
      : data.scenarios[0]!;
    setActiveScenario((prev) => {
      if (prev?.id === initial.id) return prev;
      setRevealedCount(null);
      setPlaying(false);
      return initial;
    });
  }, [data, params.id]);

  function handleScenarioSelect(s: ReplayScenario) {
    if (s.id === activeScenario?.id) return;
    setActiveScenario(s);
    setRevealedCount(null);
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function startReplay() {
    const next = pureReplayStart();
    setRevealedCount(next.revealedCount);
    setPlaying(next.playing);
  }

  function pauseReplay() {
    const next = pureReplayPause({ revealedCount, playing });
    setPlaying(next.playing);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function stepForward() {
    setRevealedCount((c) => pureReplayStepForward({ revealedCount: c, playing }, totalEvents).revealedCount);
  }

  function stepBack() {
    setRevealedCount((c) => pureReplayStepBack({ revealedCount: c, playing }).revealedCount);
  }

  function resetReplay() {
    const next = pureReplayReset();
    setRevealedCount(next.revealedCount);
    setPlaying(next.playing);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setRevealedCount((c) => {
          const next = pureReplayTick({ revealedCount: c, playing }, totalEvents);
          if (!next.playing) {
            setPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          return next.revealedCount;
        });
      }, REPLAY_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, totalEvents]);

  const isReplayMode = computeIsReplayMode({ revealedCount, playing });
  const { data: marketSnapshot } = useMarketIndicators();

  if (isLoading) {
    return <div className="p-6 text-xs font-mono text-amber-400/50">Loading decision replay…</div>;
  }
  if (error || !data || !activeScenario) {
    return (
      <div className="p-6 text-xs font-mono text-red-400/70">
        Failed to load decision replay data.
      </div>
    );
  }
  const replayScenarios = data.scenarios;
  const alloyEvents = activeScenario.events.filter((e) => e.evidenceType === 'alloy').length;
  const humanEvents = activeScenario.events.filter((e) => e.evidenceType === 'human').length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-amber-400" />
          <h1 className="text-xl font-display font-bold text-amber-50">Decision Replay</h1>
          <span className="text-[9px] font-mono text-amber-400/30 bg-amber-500/5 border border-amber-500/15 px-1.5 py-0.5 rounded">
            REAL TIMELINE · LEDGER ANCHORED
          </span>
        </div>
        <p className="text-sm text-amber-100/50">
          Reconstruct who knew what, when — with the full proof chain anchored to the Counsel ledger.
          Use Replay mode to step through events sequentially.
        </p>
      </div>

      {/* Market context strip */}
      {marketSnapshot && <MarketTicker snapshot={marketSnapshot} compact />}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[10px] font-mono text-amber-400/40">EVENT TYPES:</span>
        {[
          { type: 'alloy', label: 'Counsel Signal / System', color: '#f59e0b' },
          { type: 'human', label: 'Human Actor', color: '#38bdf8' },
          { type: 'escalation', label: 'Escalation', color: '#f87171' },
        ].map((l) => (
          <div key={l.type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full border-2"
              style={{ borderColor: l.color, background: `${l.color}30` }}
            />
            <span className="text-[10px] font-mono" style={{ color: l.color }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Scenario list */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-3">Scenarios</p>
          {replayScenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              selected={activeScenario.id === s.id}
              onClick={() => handleScenarioSelect(s)}
            />
          ))}

          {/* Operator interventions */}
          <div className="cockpit-panel p-4 mt-4 space-y-2" data-testid="panel-intervention-log">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-amber-400/40 uppercase">
                Operator Interventions
              </p>
              <span className="text-[9px] font-mono text-amber-400/40">
                {interventionLog.length} logged
              </span>
            </div>
            {interventionLog.length === 0 ? (
              <p className="text-[10px] text-amber-100/40 italic">
                Claim, reassign, or close items from the Drift / Debt surfaces — entries land here,
                ledger-anchored.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {interventionLog.slice(0, 8).map((entry) => (
                  <li
                    key={entry.id}
                    data-testid={`intervention-${entry.type}-${entry.itemId}`}
                    className={`rounded border px-2.5 py-2 ${INTERVENTION_TONE[entry.type]}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{INTERVENTION_ICON[entry.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-amber-400/55">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                        <p className="text-[11px] text-amber-100/80 leading-snug">
                          <span className="text-amber-200">{entry.actor}</span> ·{' '}
                          {INTERVENTION_LABEL[entry.type]}
                          {entry.newOwner && (
                            <>
                              {' '}
                              → <span className="text-sky-300">{entry.newOwner}</span>
                            </>
                          )}
                        </p>
                        <p className="text-[10px] text-amber-100/45 truncate">{entry.itemTitle}</p>
                        {entry.notes && (
                          <p className="text-[10px] text-amber-100/55 mt-0.5 italic">
                            "{entry.notes}"
                          </p>
                        )}
                        <span className="proof-badge text-[9px] mt-1">
                          <Shield className="w-2 h-2" />
                          {entry.proofRef}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Proof stats for active */}
          <div className="cockpit-panel p-4 mt-4 space-y-2">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase">Proof Coverage</p>
            <div className="space-y-2">
              {[
                { label: 'Counsel Signals', value: alloyEvents, color: '#f59e0b' },
                { label: 'Human Actions', value: humanEvents, color: '#38bdf8' },
                { label: 'Total Events', value: totalEvents, color: '#a78bfa' },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-400/55">{m.label}</span>
                  <span className="text-sm font-mono font-bold" style={{ color: m.color }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="proof-badge mt-1">
              <Shield className="w-2.5 h-2.5" />
              FULLY ANCHORED
            </div>
          </div>
        </div>

        {/* Replay timeline */}
        <div className="md:col-span-2">
          {/* Scenario header */}
          <div className="cockpit-panel p-4 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-amber-400/50 mb-1">
                  {activeScenario.dateRange}
                </p>
                <p className="text-sm font-semibold text-amber-100">{activeScenario.title}</p>
                <p className="text-xs text-amber-100/55 mt-1">{activeScenario.decision}</p>
              </div>
              <span className="proof-badge shrink-0">
                <Shield className="w-2.5 h-2.5" />
                {activeScenario.events.at(-1)?.proofRef}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60" />
              <p className="text-[11px] text-amber-100/55">
                <span className="text-amber-300 font-medium">Outcome:</span>{' '}
                {activeScenario.outcome}
              </p>
            </div>
          </div>

          {/* Replay controls */}
          <div className="cockpit-panel p-3 mb-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {!isReplayMode ? (
                <button
                  onClick={startReplay}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Replay
                </button>
              ) : (
                <>
                  <button
                    onClick={stepBack}
                    disabled={currentRevealed === 0}
                    className="p-1.5 rounded border border-amber-500/20 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/8 transition-colors disabled:opacity-30"
                    aria-label="Step back"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {playing ? (
                    <button
                      onClick={pauseReplay}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-colors"
                    >
                      <Pause className="w-3 h-3" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => setPlaying(true)}
                      disabled={currentRevealed >= totalEvents}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-40"
                    >
                      <Play className="w-3 h-3" />
                      Play
                    </button>
                  )}
                  <button
                    onClick={stepForward}
                    disabled={currentRevealed >= totalEvents}
                    className="p-1.5 rounded border border-amber-500/20 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/8 transition-colors disabled:opacity-30"
                    aria-label="Step forward"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRevealedCount(totalEvents)}
                    disabled={currentRevealed >= totalEvents}
                    className="p-1.5 rounded border border-amber-500/20 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/8 transition-colors disabled:opacity-30"
                    aria-label="Skip to end"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={resetReplay}
                    className="p-1.5 rounded border border-amber-500/20 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/8 transition-colors"
                    aria-label="Reset replay"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {isReplayMode && (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400/60 rounded-full transition-all duration-300"
                    style={{ width: `${(currentRevealed / totalEvents) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-amber-400/50 shrink-0">
                  {currentRevealed}/{totalEvents}
                </span>
              </div>
            )}

            {!isReplayMode && (
              <p className="text-[10px] text-amber-400/35 font-mono">
                Step through {totalEvents} events sequentially
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="px-2">
            <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-4">
              Proof Chain — {totalEvents} events ·{' '}
              {isReplayMode
                ? `Step ${currentRevealed} of ${totalEvents}`
                : 'Click any event to expand'}
            </p>
            {activeScenario.events.map((event, i) => (
              <EventNode
                key={event.id}
                event={event}
                isLast={i === totalEvents - 1}
                revealed={!isReplayMode || i < currentRevealed}
                active={isReplayMode && i === currentRevealed - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
