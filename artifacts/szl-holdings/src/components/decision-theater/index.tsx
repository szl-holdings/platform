import { AnimatePresence, m } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Loader2,
  MessageSquare,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Wifi,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ProofDrawer } from '@/components/ProofDrawer';
import type { DecisionCase } from '@/data/decision-theater-cases';
import { type EngineState, useDecisionEngine } from '@/hooks/useDecisionEngine';
import { type LiveAuditRecord, type LiveMetrics, type LiveRecommendation, useLiveTheaterData } from '@/hooks/useLiveTheaterData';
import { cn } from '@/lib/utils';
import { LiveDataBanner } from './helpers';
import { type StageId, DEMO_SCENARIO, LOOP_STAGES } from './scenarios';
import { ContextStage, LiveContextStage } from './stages/context';
import { ExecutionStage } from './stages/execution';
import { LearningStage } from './stages/learning';
import { OutcomeStage } from './stages/outcome';
import { PolicyStage } from './stages/policy';
import { LiveProofStage, ProofStage } from './stages/proof';
import { LiveRecommendationStage, RecommendationStage } from './stages/recommendation';
import { LiveSignalStage, SignalStage } from './stages/signal';
import { SimulationStage } from './stages/simulation';

type DataMode = 'demo' | 'live';

function StageProgressBar({
  currentStage,
  stages,
  onStageClick,
}: {
  currentStage: number;
  stages: typeof LOOP_STAGES;
  onStageClick: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-2">
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const isActive = idx === currentStage;
        const isCompleted = idx < currentStage;
        return (
          <button
            key={stage.id}
            data-testid={`stage-btn-${stage.id}`}
            onClick={() => onStageClick(idx)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 border',
              isActive
                ? 'border-current bg-current/10 text-foreground'
                : isCompleted
                  ? 'border-transparent bg-muted/20 text-muted-foreground'
                  : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground',
            )}
            style={
              isActive
                ? {
                    borderColor: `${stage.color}40`,
                    background: `${stage.color}12`,
                    color: stage.color,
                  }
                : undefined
            }
          >
            <Icon
              className="w-3.5 h-3.5"
              style={isActive || isCompleted ? { color: stage.color } : undefined}
            />
            <span className="hidden sm:inline">{stage.label}</span>
            {idx < stages.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function LiveGenericStage({ stageId, metrics }: { stageId: StageId; metrics: LiveMetrics | null }) {
  if (!metrics) return <p className="text-sm text-muted-foreground">Loading live data…</p>;
  const metricItems = [
    {
      label: 'AI Recommendations',
      value: metrics.alloy.total_recommendations.toLocaleString(),
      color: '#ec4899',
    },
    {
      label: 'Workflow Runs (30d)',
      value: metrics.alloy.workflow_runs_30d.toLocaleString(),
      color: '#8b5cf6',
    },
    {
      label: 'Distress Properties',
      value: metrics.beacon.total_distress_properties.toLocaleString(),
      color: '#10b981',
    },
    {
      label: 'Open Vulnerabilities',
      value: metrics.firestorm.open_vulnerabilities.toLocaleString(),
      color: '#ef4444',
    },
    {
      label: 'Audit Events (30d)',
      value: metrics.platform.audit_events_30d.toLocaleString(),
      color: '#14b8a6',
    },
    { label: 'Active Leads', value: metrics.beacon.total_leads.toLocaleString(), color: '#f59e0b' },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground capitalize">
        Live platform telemetry for {stageId} stage — real metrics from the SZL Holdings platform.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metricItems.map((item, i) => (
          <m.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
            className="rounded-xl border border-border/40 bg-card/60 p-4 text-center"
          >
            <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
            <p className="text-xl font-bold font-display" style={{ color: item.color }}>
              {item.value}
            </p>
          </m.div>
        ))}
      </div>
    </div>
  );
}

const STAGE_COMPONENTS: Record<StageId, React.FC<{ engine: EngineState }>> = {
  signal: SignalStage,
  context: ContextStage,
  recommendation: RecommendationStage,
  simulation: SimulationStage,
  policy: PolicyStage,
  execution: ExecutionStage,
  proof: ProofStage,
  outcome: OutcomeStage,
  learning: LearningStage,
};

function LiveStageRouter({
  stageId,
  metrics,
  recommendations,
  auditRecords,
  auditTotal,
  engine,
}: {
  stageId: StageId;
  metrics: LiveMetrics | null;
  recommendations: LiveRecommendation[];
  auditRecords: LiveAuditRecord[];
  auditTotal: number;
  engine: EngineState;
}) {
  switch (stageId) {
    case 'signal':
      return <LiveSignalStage metrics={metrics} />;
    case 'context':
      return <LiveContextStage metrics={metrics} recommendations={recommendations} />;
    case 'recommendation':
      return <LiveRecommendationStage recommendations={recommendations} />;
    case 'proof':
      return (
        <LiveProofStage auditRecords={auditRecords} auditTotal={auditTotal} metrics={metrics} />
      );
    default: {
      if (metrics) return <LiveGenericStage stageId={stageId} metrics={metrics} />;
      const FallbackStage = STAGE_COMPONENTS[stageId];
      return <FallbackStage engine={engine} />;
    }
  }
}

interface DecisionTheaterProps {
  activeCase?: DecisionCase;
}

function ConfidenceMeter({ value, color = '#ec4899' }: { value: number; color?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <m.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[11px] font-mono font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function CaseStageRenderer({
  activeCase,
  stageId,
}: {
  activeCase: DecisionCase;
  stageId: StageId;
}) {
  const c = activeCase;
  switch (stageId) {
    case 'signal':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{c.signal.label}</p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">{c.signal.sourceSystem}</h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                {c.signal.receivedAt}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(c.signal.raw).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {k.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] font-mono text-foreground">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'context':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cross-domain correlation across the SZL Holdings platform.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-bold text-foreground mb-2">{c.title}</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{c.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Domain</p>
                <p className="text-[11px] font-semibold text-foreground">{c.domain}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Severity
                </p>
                <p className="text-[11px] font-semibold text-foreground capitalize">{c.severity}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Owner</p>
                <p className="text-[11px] font-semibold text-foreground">{c.owner}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Opened</p>
                <p className="text-[11px] font-mono text-foreground">{c.openedAt}</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'recommendation':
      return (
        <div className="space-y-3" data-testid="case-recommendation">
          <p className="text-sm text-muted-foreground">
            AI-generated advisory with full source attribution and provenance.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <h3 className="text-sm font-bold text-foreground mb-2">{c.recommendation.title}</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
              {c.recommendation.body}
            </p>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Model confidence
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {c.recommendation.model}
                </span>
              </div>
              <ConfidenceMeter value={c.recommendation.confidence} />
            </div>
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Recommended actions
              </p>
              <ul className="space-y-1.5">
                {c.recommendation.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Source citations · provenance
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {c.recommendation.sources.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2 flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">{s.label}</p>
                      <p className="text-[9px] text-muted-foreground font-mono">
                        {s.type}:{s.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    case 'simulation':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Monte Carlo simulation results across {c.simulation.runs.toLocaleString()} runs.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <p className="text-sm font-bold text-foreground mb-3">{c.simulation.expectedOutcome}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'P10', value: c.simulation.p10, color: '#10b981' },
                { label: 'P50', value: c.simulation.p50, color: '#f59e0b' },
                { label: 'P90', value: c.simulation.p90, color: '#ef4444' },
              ].map((p) => (
                <div
                  key={p.label}
                  className="rounded-lg border border-border/30 bg-muted/10 px-3 py-3"
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: p.color }}
                  >
                    {p.label}
                  </p>
                  <p className="text-[12px] font-semibold text-foreground mt-1">{p.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {c.simulation.notes}
            </p>
          </div>
        </div>
      );
    case 'policy':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Covenant Policy gate evaluating the recommendation against organizational rules.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Policy verdict</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400">
                Approval required
              </span>
            </div>
            <ul className="space-y-2">
              {c.proof.policyChecks.map((check, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2',
                    check.passed
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-amber-500/20 bg-amber-500/5',
                  )}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{check.label}</p>
                    {check.note && (
                      <p className="text-[11px] text-muted-foreground">{check.note}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    case 'execution':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Governed workflow{' '}
            <span className="font-mono text-foreground">{c.execution.workflowId}</span> dispatched
            after approval.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <ul className="space-y-2">
              {c.execution.steps.map((step, i) => {
                const color =
                  step.status === 'complete'
                    ? '#10b981'
                    : step.status === 'running'
                      ? '#f59e0b'
                      : '#64748b';
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: `${color}20` }}
                      >
                        {step.status === 'complete' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color }} />
                        ) : step.status === 'running' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />
                        ) : (
                          <Clock className="w-3.5 h-3.5" style={{ color }} />
                        )}
                      </div>
                      <span className="text-[12px] font-semibold text-foreground">
                        {step.label}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider"
                      style={{ color }}
                    >
                      {step.status}
                      {step.durationMs ? ` · ${step.durationMs}ms` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      );
    case 'proof':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Immutable proof envelope — open the drawer below for the full attribution chain.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Chain ID', value: c.proof.id },
                { label: 'Source system', value: c.proof.sourceSystem },
                {
                  label: 'Model',
                  value: `${c.proof.model ?? '—'}${c.proof.modelVersion ? ` / ${c.proof.modelVersion}` : ''}`,
                },
                { label: 'Review state', value: c.proof.reviewState.replace(/_/g, ' ') },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2"
                >
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {row.label}
                  </p>
                  <p className="text-[11px] font-mono text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'outcome':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Measured outcome compared to the simulation prediction.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <p className="text-sm font-bold text-foreground mb-2">{c.outcome.actual}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Δ vs prediction
                </p>
                <p className="text-[11px] font-semibold text-foreground">
                  {c.outcome.predictionDelta}
                </p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Measured at
                </p>
                <p className="text-[11px] font-mono text-foreground">{c.outcome.measuredAt}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Success criteria
                </p>
                <p className="text-[11px] text-foreground">{c.outcome.successCriteria}</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'learning':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Decision indexed into the calibration memory for future recommendations.
          </p>
          <div className="rounded-xl border border-border/40 bg-card/60 p-5">
            <p className="text-[12px] text-foreground leading-relaxed mb-3">{c.learning.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Calibration
                </p>
                <p className="text-[11px] text-foreground">{c.learning.calibrationNote}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  Indexed at
                </p>
                <p className="text-[11px] font-mono text-foreground">{c.learning.indexedAt}</p>
              </div>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'changes_requested';

function ApprovalActionPanel({ activeCase }: { activeCase: DecisionCase }) {
  const [decision, setDecision] = useState<ApprovalDecision>('pending');
  const [note, setNote] = useState('');
  const ap = activeCase.approval;

  return (
    <div
      data-testid="approval-action-panel"
      className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 mt-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <h4 className="text-sm font-bold text-foreground">Covenant Policy · {ap.policyName}</h4>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">{ap.policyId}</span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">{ap.covenantText}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Risk class</p>
          <p className="text-[11px] font-semibold text-foreground capitalize">
            {ap.riskClass.replace('-', ' ')}
          </p>
        </div>
        <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">SLA window</p>
          <p className="text-[11px] font-semibold text-foreground">{ap.slaWindow}</p>
        </div>
        <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Required roles
          </p>
          <p className="text-[11px] font-semibold text-foreground">{ap.requiredRoles.join(', ')}</p>
        </div>
        <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Escalation</p>
          <p className="text-[11px] font-semibold text-foreground">{ap.escalationPath}</p>
        </div>
      </div>

      {decision === 'pending' ? (
        <>
          <textarea
            data-testid="approval-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an approval note (optional)…"
            className="w-full text-[12px] bg-card/40 border border-border/30 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/40 resize-none"
            rows={2}
          />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              data-testid="approve-action"
              onClick={() => setDecision('approved')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & continue
            </button>
            <button
              data-testid="request-changes-action"
              onClick={() => setDecision('changes_requested')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Request changes
            </button>
            <button
              data-testid="reject-action"
              onClick={() => setDecision('rejected')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Decision logged to proof chain
            </span>
          </div>
        </>
      ) : (
        <div
          data-testid="approval-decision-result"
          className={cn(
            'rounded-lg border px-3 py-2.5 flex items-start gap-2',
            decision === 'approved' && 'border-emerald-500/30 bg-emerald-500/10',
            decision === 'rejected' && 'border-red-500/30 bg-red-500/10',
            decision === 'changes_requested' && 'border-amber-500/30 bg-amber-500/10',
          )}
        >
          {decision === 'approved' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          )}
          {decision === 'rejected' && (
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          {decision === 'changes_requested' && (
            <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-foreground">
              {decision === 'approved' && 'Approved — workflow released to execution'}
              {decision === 'rejected' && 'Rejected — recommendation will not execute'}
              {decision === 'changes_requested' &&
                'Changes requested — sent back to recommendation stage'}
            </p>
            {note && <p className="text-[11px] text-muted-foreground mt-1">Note: {note}</p>}
            <button
              onClick={() => {
                setDecision('pending');
                setNote('');
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground underline mt-1.5"
            >
              Reset decision
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DecisionTheater({ activeCase }: DecisionTheaterProps = {}) {
  const [currentStage, setCurrentStage] = useState(activeCase?.currentStage ?? 0);
  const [demoMode, setDemoMode] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>(activeCase ? 'demo' : 'live');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const engine = useDecisionEngine();
  const liveData = useLiveTheaterData(dataMode === 'live');

  useEffect(() => {
    if (activeCase) {
      setCurrentStage(activeCase.currentStage);
      setDataMode('demo');
    }
  }, [activeCase?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stage = LOOP_STAGES[currentStage]!;
  const StageComponent = STAGE_COMPONENTS[stage.id];

  const goNext = useCallback(() => {
    setCurrentStage((prev) => (prev < LOOP_STAGES.length - 1 ? prev + 1 : prev));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentStage((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const resetDemo = useCallback(() => {
    setCurrentStage(0);
    setDemoMode(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (demoMode) {
      intervalRef.current = setInterval(() => {
        setCurrentStage((prev) => {
          if (prev >= LOOP_STAGES.length - 1) {
            setDemoMode(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 6000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [demoMode]);

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-bold font-display">Decision Theater</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              The canonical governed decision loop — Signal to Learning, nine steps, every domain
            </p>
          </div>
          <div className="flex items-center gap-2">
            {engine.status === 'running' && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Initializing engines...
              </span>
            )}

            {activeCase ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                <Database className="w-3 h-3" />
                Case mode · {activeCase.id}
              </span>
            ) : (
              <div className="flex items-center rounded-lg border border-border/30 bg-muted/10 p-0.5 gap-0.5">
                <button
                  onClick={() => setDataMode('demo')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all',
                    dataMode === 'demo'
                      ? 'bg-muted/40 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Database className="w-3 h-3" />
                  Demo
                </button>
                <button
                  onClick={() => setDataMode('live')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all',
                    dataMode === 'live'
                      ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Wifi className="w-3 h-3" />
                  Live
                </button>
              </div>
            )}

            <button
              onClick={() => {
                if (demoMode) {
                  setDemoMode(false);
                } else {
                  setCurrentStage(0);
                  setDemoMode(true);
                }
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all',
                demoMode
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                  : 'bg-muted/20 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50',
              )}
              title={demoMode ? 'Pause guided demo' : 'Start guided demo'}
            >
              {demoMode ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {demoMode ? 'Pause' : 'Guided Demo'}
            </button>
            <button
              onClick={resetDemo}
              className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {dataMode === 'demo' && (
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 mb-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">{DEMO_SCENARIO.title}</p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {DEMO_SCENARIO.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {dataMode === 'live' && (
          <LiveDataBanner
            status={liveData.status}
            lastFetchedAt={liveData.lastFetchedAt}
            onRefresh={liveData.refetch}
          />
        )}

        <StageProgressBar
          currentStage={currentStage}
          stages={LOOP_STAGES}
          onStageClick={setCurrentStage}
        />
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={`${stage.id}-${dataMode}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${stage.color}20` }}
            >
              <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: stage.color }}
                >
                  Step {currentStage + 1} of 9
                </span>
                {demoMode && (
                  <span className="text-[9px] text-muted-foreground animate-pulse">
                    Auto-advancing in 6s…
                  </span>
                )}
                {dataMode === 'live' && liveData.status === 'success' && (
                  <m.span
                    className="flex items-center gap-1 text-[9px] font-bold text-emerald-400"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    ● LIVE
                  </m.span>
                )}
              </div>
              <h3 className="text-lg font-bold font-display text-foreground">{stage.label}</h3>
            </div>
          </div>

          {dataMode === 'live' ? (
            <LiveStageRouter
              stageId={stage.id}
              metrics={liveData.metrics}
              recommendations={liveData.recommendations}
              auditRecords={liveData.auditRecords}
              auditTotal={liveData.auditTotal}
              engine={engine}
            />
          ) : activeCase ? (
            <CaseStageRenderer activeCase={activeCase} stageId={stage.id} />
          ) : (
            <StageComponent engine={engine} />
          )}

          {activeCase && stage.id === 'policy' && <ApprovalActionPanel activeCase={activeCase} />}
          {activeCase && stage.id === 'proof' && (
            <div data-testid="proof-drawer-inline" className="mt-4">
              <ProofDrawer proof={activeCase.proof} defaultOpen />
            </div>
          )}
        </m.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
        <button
          data-testid="nav-prev"
          onClick={goPrev}
          disabled={currentStage === 0}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all',
            currentStage === 0
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/20',
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          {currentStage > 0 ? LOOP_STAGES[currentStage - 1]?.label : 'Previous'}
        </button>

        <div className="flex items-center gap-1">
          {LOOP_STAGES.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all',
                idx === currentStage
                  ? 'bg-foreground w-3'
                  : idx < currentStage
                    ? 'bg-muted-foreground/50'
                    : 'bg-muted-foreground/20',
              )}
            />
          ))}
        </div>

        <button
          data-testid="nav-next"
          onClick={goNext}
          disabled={currentStage === LOOP_STAGES.length - 1}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all',
            currentStage === LOOP_STAGES.length - 1
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-foreground bg-muted/20 hover:bg-muted/30',
          )}
        >
          {currentStage < LOOP_STAGES.length - 1
            ? LOOP_STAGES[currentStage + 1]?.label
            : 'Complete'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </m.div>
  );
}
