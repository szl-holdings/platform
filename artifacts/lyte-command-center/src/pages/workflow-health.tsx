import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  TrendingDown,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { type WorkflowItem, workflowItems } from '@/data/seed';

const STATUS_CONFIG = {
  on_track: {
    label: 'ON TRACK',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
    bar: '#34d399',
  },
  at_risk: {
    label: 'AT RISK',
    color: 'text-orange-400',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/20',
    bar: '#fb923c',
  },
  stalled: {
    label: 'STALLED',
    color: 'text-red-400',
    bg: 'bg-red-500/8',
    border: 'border-red-500/25',
    bar: '#f87171',
  },
  blocked: {
    label: 'BLOCKED',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    bar: '#ef4444',
  },
  complete: {
    label: 'COMPLETE',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/10',
    bar: '#6ee7b7',
  },
};

const TYPE_LABELS: Record<string, string> = {
  approval: 'Approval',
  execution: 'Execution',
  review: 'Review',
  escalation: 'Escalation',
  onboarding: 'Onboarding',
  reporting: 'Reporting',
};

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

function WorkflowCard({ wf }: { wf: WorkflowItem }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[wf.status];

  return (
    <div
      className={`cockpit-panel border ${cfg.border} ${wf.status === 'blocked' || wf.status === 'stalled' ? 'border-l-2' : ''}`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-amber-500/3 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg} border ${cfg.border}`}
        >
          {wf.status === 'on_track' ? (
            <CheckCircle2 className={`w-4 h-4 ${cfg.color}`} />
          ) : wf.status === 'blocked' ? (
            <AlertTriangle className={`w-4 h-4 ${cfg.color}`} />
          ) : wf.status === 'stalled' ? (
            <Clock className={`w-4 h-4 ${cfg.color}`} />
          ) : (
            <TrendingDown className={`w-4 h-4 ${cfg.color}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-amber-100">{wf.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-amber-400/40 font-mono">
                  {TYPE_LABELS[wf.type]} · {wf.owner}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {wf.slaBreach && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-red-400 bg-red-500/8 border-red-500/20">
                  SLA BREACH
                </span>
              )}
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}
              >
                {cfg.label}
              </span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={wf.progress} color={cfg.bar} />
            </div>
            <span className="text-[10px] font-mono text-amber-400/50 shrink-0">{wf.progress}%</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {wf.stalledDays !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-orange-400">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{wf.stalledDays}d stalled</span>
              </div>
            )}
            {wf.blockerCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-mono">{wf.blockerCount} blockers</span>
              </div>
            )}
            {wf.valueAtRiskUsd !== undefined && (
              <div className="flex items-center gap-1 text-[10px] text-orange-400">
                <Zap className="w-3 h-3" />
                <span className="font-mono">${(wf.valueAtRiskUsd / 1e6).toFixed(1)}M at risk</span>
              </div>
            )}
            {wf.slaDeadline && (
              <div className="flex items-center gap-1 text-[10px] text-amber-400/50">
                <Clock className="w-3 h-3" />
                <span className="font-mono">SLA: {wf.slaDeadline}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-500/10 pt-3">
          {wf.bottleneckStep && (
            <div className="rounded bg-red-500/5 border border-red-500/15 p-3">
              <p className="text-[9px] font-mono text-red-400/50 mb-1">BOTTLENECK DETECTED</p>
              <p className="text-xs font-semibold text-amber-100">{wf.bottleneckStep}</p>
              {wf.bottleneckOwner && (
                <p className="text-[10px] text-amber-100/50 mt-0.5">Owner: {wf.bottleneckOwner}</p>
              )}
            </div>
          )}
          {wf.linkedEntityLabel && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-amber-400/40">Linked entity:</span>
              <span className="text-amber-200/70 font-mono">{wf.linkedEntityLabel}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-amber-400/40">
              <Clock className="w-3 h-3" />
              <span className="font-mono">Last activity: {wf.lastActivity}</span>
            </div>
            <span className="proof-badge">
              <Shield className="w-2 h-2" />
              {wf.proofRef}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowHealthPage() {
  const critical = workflowItems.filter((w) => w.status === 'blocked' || w.status === 'stalled');
  const atRisk = workflowItems.filter((w) => w.status === 'at_risk');
  const healthy = workflowItems.filter((w) => w.status === 'on_track' || w.status === 'complete');

  const totalAtRisk = workflowItems.reduce((sum, w) => sum + (w.valueAtRiskUsd ?? 0), 0);
  const totalBreachers = workflowItems.filter((w) => w.slaBreach).length;
  const totalBlockers = workflowItems.reduce((sum, w) => sum + w.blockerCount, 0);
  const healthScore = Math.round((healthy.length / workflowItems.length) * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-amber-100 font-display">Workflow Health</h1>
        <p className="text-xs text-amber-400/50 mt-0.5">
          Bottleneck detection, value-at-risk, and SLA breach status across all tracked workflows
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="cockpit-panel p-4">
          <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">Health Score</p>
          <p
            className={`text-2xl font-mono font-bold ${healthScore >= 70 ? 'text-emerald-400' : healthScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}
          >
            {healthScore}%
          </p>
          <p className="text-[10px] text-amber-400/40 mt-1">
            {healthy.length} of {workflowItems.length} on track
          </p>
        </div>
        <div className="cockpit-panel p-4 border border-orange-500/20">
          <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">Value at Risk</p>
          <p className="text-2xl font-mono font-bold text-orange-400">
            ${(totalAtRisk / 1e6).toFixed(1)}M
          </p>
          <p className="text-[10px] text-amber-400/40 mt-1">across stalled / blocked flows</p>
        </div>
        <div className="cockpit-panel p-4 border border-red-500/20">
          <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">SLA Breaches</p>
          <p className="text-2xl font-mono font-bold text-red-400">{totalBreachers}</p>
          <p className="text-[10px] text-amber-400/40 mt-1">workflows past deadline</p>
        </div>
        <div className="cockpit-panel p-4 border border-red-500/15">
          <p className="text-[10px] font-mono text-amber-400/40 uppercase mb-1">Active Blockers</p>
          <p className="text-2xl font-mono font-bold text-red-400">{totalBlockers}</p>
          <p className="text-[10px] text-amber-400/40 mt-1">bottlenecks across all workflows</p>
        </div>
      </div>

      {/* Critical / Blocked */}
      {critical.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-red-400/50 uppercase tracking-widest">
            Blocked / Stalled ({critical.length})
          </p>
          {critical.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf} />
          ))}
        </div>
      )}

      {/* At Risk */}
      {atRisk.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-orange-400/50 uppercase tracking-widest">
            At Risk ({atRisk.length})
          </p>
          {atRisk.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf} />
          ))}
        </div>
      )}

      {/* Healthy */}
      {healthy.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-emerald-400/30 uppercase tracking-widest">
            On Track ({healthy.length})
          </p>
          {healthy.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf} />
          ))}
        </div>
      )}
    </div>
  );
}
