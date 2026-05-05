import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'wouter';
import { REMEDIATION_PLANS as fallbackPlans, type RemediationPlan, type RemediationStep } from '@/data/hunt-data';
import { listRemediationPlans } from '@/lib/sentra-api';
import { SourceBadge, useApiQuery } from '@/lib/use-api-query';
import { approveRemediation } from '@/lib/sentra-api';

const STATUS_CONFIG: Record<RemediationPlan['status'], { label: string; color: string; bg: string; border: string }> = {
  draft: {
    label: 'Draft',
    color: 'text-[#c9b787]',
    bg: 'bg-[#c9b787]/5',
    border: 'border-[#c9b787]/20',
  },
  approved: {
    label: 'Approved',
    color: 'text-sky-400',
    bg: 'bg-sky-400/5',
    border: 'border-sky-400/20',
  },
  executing: {
    label: 'Executing',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/5',
    border: 'border-emerald-400/20',
  },
  complete: {
    label: 'Complete',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/5',
    border: 'border-emerald-400/20',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-slate-500',
    bg: 'bg-slate-800/30',
    border: 'border-slate-700',
  },
};

const STEP_STATUS_ICON: Record<RemediationStep['status'], typeof CheckCircle2 | null> = {
  done: CheckCircle2,
  executing: Activity,
  approved: CheckCircle2,
  pending: null,
  skipped: null,
};

function StepStatusDot({ status }: { status: RemediationStep['status'] }) {
  if (status === 'done')
    return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />;
  if (status === 'executing')
    return <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />;
  if (status === 'pending')
    return <span className="w-2 h-2 rounded-full border border-slate-600 shrink-0" />;
  if (status === 'skipped')
    return <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-[#c9b787] shrink-0" />;
}

function PlanCard({ plan }: { plan: RemediationPlan }) {
  const [expanded, setExpanded] = useState(plan.status === 'approved');
  const [approving, setApproving] = useState(false);
  const [localStatus, setLocalStatus] = useState(plan.status);
  const [signalsSent, setSignalsSent] = useState(plan.status === 'approved');
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const cfg = STATUS_CONFIG[localStatus];

  const completedSteps = plan.steps.filter((s) => s.status === 'done').length;
  const executingStep = plan.steps.find((s) => s.status === 'executing');
  const progress = Math.round((completedSteps / plan.steps.length) * 100);

  const relativeTime = (() => {
    const diffMs = Date.now() - new Date(plan.draftedAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  })();

  const handleApprove = async () => {
    setApproving(true);
    setApprovalError(null);
    try {
      const res = await approveRemediation(plan.id, {
        huntId: plan.huntId,
        huntTitle: plan.huntTitle,
        blastRadiusCost: plan.blastRadiusCost,
        stepCount: plan.steps.length,
        approvedBy: 'Analyst',
        signalsBroadcast: plan.signalsBroadcast,
      });
      if (!res.ok) throw new Error(res.error);
      setLocalStatus('approved');
      setTimeout(() => setSignalsSent(true), 800);
    } catch (err) {
      setApprovalError(err instanceof Error ? err.message : 'Approval failed — please retry');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className={cn('sentra-panel overflow-hidden', cfg.border)}>
      <button
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider',
                cfg.color,
                cfg.bg,
                cfg.border,
              )}
            >
              {cfg.label}
            </span>
            <span className="text-[10px] font-mono text-slate-600">{plan.id}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-100 mb-1">{plan.huntTitle}</h3>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {plan.steps.length} steps
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />~{plan.estimatedTotalMinutes}m
            </div>
            <div className="text-red-400 font-mono">
              ${(plan.blastRadiusCost / 1000000).toFixed(1)}M blast radius
            </div>
            <div className="ml-auto font-mono">{relativeTime}</div>
          </div>
        </div>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-slate-600 shrink-0 mt-1 transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-5 pb-5 pt-4 space-y-4">
          {plan.status === 'approved' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Execution Progress
                </span>
                <span className="text-[10px] font-mono text-sky-400">
                  {completedSteps}/{plan.steps.length} steps
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {executingStep && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-sky-400 font-mono">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Executing: {executingStep.action}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {plan.steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                  <StepStatusDot status={step.status} />
                  {idx < plan.steps.length - 1 && (
                    <div className="w-px h-4 bg-slate-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        step.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200',
                      )}
                    >
                      {step.action}
                    </span>
                    {step.requiredApproval && (
                      <span className="text-[9px] font-mono text-[#c9b787] border border-[#c9b787]/20 px-1 py-0.5 rounded uppercase">
                        Approval
                      </span>
                    )}
                    {!step.reversible && (
                      <span className="text-[9px] font-mono text-red-400 border border-red-400/20 px-1 py-0.5 rounded uppercase">
                        Irreversible
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono truncate">{step.target}</div>
                </div>
              </div>
            ))}
          </div>

          {plan.approvedBy && (
            <div className="text-[10px] text-slate-600 border-t border-slate-800 pt-3">
              Approved by{' '}
              <span className="text-slate-400">{plan.approvedBy}</span>
              {plan.approvedAt && (
                <>
                  {' '}·{' '}
                  {(() => {
                    const m = Math.floor((Date.now() - new Date(plan.approvedAt).getTime()) / 60000);
                    return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
                  })()}
                </>
              )}
            </div>
          )}

          {(localStatus === 'approved' || signalsSent) && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2">
                Signals Broadcast to Event Bus
              </div>
              <div className="space-y-1">
                {plan.signalsBroadcast.map((sig) => (
                  <div key={sig} className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {sig}
                  </div>
                ))}
              </div>
            </div>
          )}

          {localStatus === 'draft' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3">
              <button
                onClick={handleApprove}
                disabled={approving}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all',
                  approving
                    ? 'border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                )}
              >
                {approving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                {approving ? 'Submitting…' : 'Approve Plan'}
              </button>
              <Link href={`/hunt/${plan.huntId}`}>
                <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  View Hunt →
                </button>
              </Link>
              </div>
              {approvalError && (
                <p className="text-xs text-red-400">{approvalError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RemediationPlansPage() {
  const fetcher = useCallback(() => listRemediationPlans(), []);
  const { data: plans, source } = useApiQuery<RemediationPlan[]>(fetcher, 'plans', fallbackPlans);

  const draftCount = plans.filter((p) => p.status === 'draft').length;
  const approvedCount = plans.filter((p) => p.status === 'approved').length;
  const totalBlast = plans.reduce((s, p) => s + p.blastRadiusCost, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-5 h-5 text-[#f5f5f5]/60" />
          <h1 className="text-2xl font-display font-bold text-slate-100">Remediation Plans</h1>
          <SourceBadge source={source} />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
            Agentic Operator
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Auto-drafted plans from confirmed hunts. Approved plans execute through the agentic operator
          and broadcast signals to the ecosystem.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Approval', value: draftCount, color: 'text-[#c9b787]', icon: Clock },
          { label: 'Executing', value: approvedCount, color: 'text-sky-400', icon: Activity },
          {
            label: 'Total Blast Radius',
            value: `$${(totalBlast / 1000000).toFixed(1)}M`,
            color: 'text-red-400',
            icon: AlertTriangle,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="sentra-panel px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('w-3.5 h-3.5', color)} />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {label}
              </span>
            </div>
            <div className={cn('text-xl font-mono font-bold', color)}>{value}</div>
          </div>
        ))}
      </div>

      <div className="sentra-panel p-4 flex items-start gap-3">
        <Zap className="w-4 h-4 text-[#c9b787] shrink-0 mt-0.5" />
        <div>
          <div className="text-[11px] font-mono text-[#c9b787] uppercase tracking-wider mb-1">
            Agentic Operator — Event Bus Integration
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Approved plans are executed autonomously by the agentic operator. Each step that affects
            other business domains publishes a typed signal to the event bus. Downstream products —
            Counsel (regulatory obligation), SEXTANT (scheduling disruption), Pulse (exec briefing) —
            react automatically without manual coordination.
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="sentra-panel p-12 text-center">
          <RotateCcw className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No remediation plans drafted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
