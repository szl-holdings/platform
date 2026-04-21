import {
  narrativeInsights,
  ownershipMap,
  type SignalType,
  severityColors,
  signals,
  signalTypeLabels,
  workflowLatencies,
} from '@lyte/lib/business-data';
import { cn } from '@lyte/lib/utils';
import { AlertTriangle, BarChart3, CheckCircle2, Clock, TrendingDown, Users } from 'lucide-react';
import { useState } from 'react';

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const USE_CASES = [
  {
    id: 'approval-latency',
    label: 'Approval Latency',
    icon: Clock,
    color: 'text-[#c45a4a]',
    border: 'border-[#c45a4a]/20',
    bg: 'bg-[#c45a4a]/5',
    dot: 'bg-[#c45a4a]',
    description:
      'Every approval day over target costs you close rate. Command surfaces approval bottlenecks before deals slip.',
    signalType: 'approval_latency' as SignalType,
  },
  {
    id: 'stalled-workflows',
    label: 'Stalled Workflows',
    icon: AlertTriangle,
    color: 'text-[#c8953c]',
    border: 'border-[#c8953c]/20',
    bg: 'bg-[#c8953c]/5',
    dot: 'bg-[#c8953c]',
    description:
      'Work stops. No alert fires. Command detects stagnation across implementation queues, SOWs, and handoff stages.',
    signalType: 'stalled_workflow' as SignalType,
  },
  {
    id: 'forecast-drift',
    label: 'Forecast Drift',
    icon: TrendingDown,
    color: 'text-[#d4a054]',
    border: 'border-[#d4a054]/20',
    bg: 'bg-[#d4a054]/5',
    dot: 'bg-[#d4a054]',
    description:
      'Forecast credibility erodes quietly. Command tracks reclassification rates, coverage ratios, and drift velocity.',
    signalType: 'forecast_drift' as SignalType,
  },
  {
    id: 'handoff-failures',
    label: 'Handoff Failures',
    icon: Users,
    color: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/5',
    dot: 'bg-violet-500',
    description:
      'Sales-to-CS, CS-to-delivery, SE-to-account — every handoff is a churn risk. Command tracks all of them.',
    signalType: 'handoff_failure' as SignalType,
  },
  {
    id: 'pipeline-hygiene',
    label: 'Pipeline Hygiene',
    icon: BarChart3,
    color: 'text-[#4a90b8]',
    border: 'border-[#4a90b8]/20',
    bg: 'bg-[#4a90b8]/5',
    dot: 'bg-[#4a90b8]',
    description:
      'Stale pipeline corrupts forecast models and wastes capacity. Command identifies and ages out ghost opportunities.',
    signalType: 'pipeline_hygiene' as SignalType,
  },
];

function ApprovalLatencyPanel() {
  const approvalSignals = signals.filter((s) => s.type === 'approval_latency');
  const workflows = workflowLatencies.filter(
    (w) => w.name.includes('Approval') || w.name.includes('Discount'),
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Active Approval Delays',
            value: approvalSignals.length,
            color: 'text-[#c45a4a]',
          },
          { label: 'Avg Latency', value: '14.2 days', color: 'text-[#c8953c]' },
          { label: 'Value at Risk', value: '$2.97M', color: 'text-[#d4a054]' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 border border-white/5 bg-white/[0.02]">
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className={cn('font-display font-bold text-lg', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>
      {approvalSignals.map((sig) => {
        const c = severityColors[sig.severity];
        return (
          <div key={sig.id} className={cn('p-4 rounded-xl border', c.border, c.bg)}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  c.dot,
                  sig.severity === 'critical' && 'animate-pulse',
                )}
              />
              <span className="text-[11px] font-semibold text-white/90">{sig.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">{sig.summary}</p>
            <div className="flex items-center gap-3 text-[10px]">
              <span className={cn('font-mono font-semibold', c.text)}>
                {formatCurrency(sig.valueAtRisk)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{sig.recommendedAction.slice(0, 80)}...</span>
            </div>
          </div>
        );
      })}
      {workflows.map((wf) => (
        <div key={wf.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="text-sm font-medium text-white mb-2">{wf.name}</div>
          <div className="space-y-2">
            {wf.stages.map((stage, i) => {
              const ratio = stage.avgDwellDays / Math.max(stage.expectedDays, 0.1);
              const color =
                ratio > 3 ? 'bg-[#c45a4a]' : ratio > 2 ? 'bg-[#c8953c]' : 'bg-[#d4a054]';
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">{stage.name}</span>
                    <span
                      className={cn('font-mono', ratio > 2 ? 'text-[#c45a4a]' : 'text-slate-300')}
                    >
                      {stage.avgDwellDays.toFixed(1)}d / {stage.expectedDays}d
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', color)}
                      style={{ width: `${Math.min((ratio / 6) * 100, 100)}%`, opacity: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StalledWorkflowsPanel() {
  const stalledSignals = signals.filter((s) => s.type === 'stalled_workflow');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Stalled Workflows', value: 26, color: 'text-[#c8953c]' },
          { label: 'Avg Days Stalled', value: '11.4', color: 'text-[#c45a4a]' },
          { label: 'Value at Risk', value: '$1.99M', color: 'text-[#d4a054]' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 border border-white/5 bg-white/[0.02]">
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className={cn('font-display font-bold text-lg', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>
      {stalledSignals.map((sig) => {
        const c = severityColors[sig.severity];
        return (
          <div key={sig.id} className={cn('p-4 rounded-xl border', c.border, c.bg)}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  c.dot,
                  sig.severity === 'critical' && 'animate-pulse',
                )}
              />
              <span className="text-[11px] font-semibold text-white/90">{sig.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">{sig.summary}</p>
            <div className="flex items-center gap-3 text-[10px]">
              <span className={cn('font-mono font-semibold', c.text)}>
                {formatCurrency(sig.valueAtRisk)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">Owner: {sig.owner}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ForecastDriftPanel() {
  const forecastSignals = signals.filter((s) => s.type === 'forecast_drift');
  const forecastInsight = narrativeInsights.find((i) => i.signalIds.includes('SIG-003'));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Forecast Drift', value: '-$3.8M', color: 'text-[#c45a4a]' },
          { label: 'Deals Reclassified', value: '22', color: 'text-[#c8953c]' },
          { label: 'Coverage Ratio', value: '0.94x', color: 'text-[#d4a054]' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 border border-white/5 bg-white/[0.02]">
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className={cn('font-display font-bold text-lg', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>
      {forecastInsight && (
        <div
          className={cn(
            'p-4 rounded-xl border',
            severityColors[forecastInsight.severity].border,
            severityColors[forecastInsight.severity].bg,
          )}
        >
          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
            Narrative Intelligence
          </div>
          <h3 className="text-sm font-semibold text-white mb-2">{forecastInsight.title}</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">{forecastInsight.body}</p>
        </div>
      )}
      {forecastSignals.map((sig) => {
        const c = severityColors[sig.severity];
        return (
          <div key={sig.id} className={cn('p-4 rounded-xl border', c.border, c.bg)}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
              <span className="text-[11px] font-semibold text-white/90">{sig.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">{sig.summary}</p>
            <div className="p-2 rounded bg-white/[0.02] border border-white/5 text-[10px] text-[#d4a054]/90 italic">
              {sig.anomaly}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HandoffFailuresPanel() {
  const handoffSignals = signals.filter((s) => s.type === 'handoff_failure');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Active Handoff Failures',
            value: handoffSignals.length,
            color: 'text-violet-400',
          },
          { label: 'SLA Breached', value: '14 accounts', color: 'text-[#c45a4a]' },
          { label: 'Value at Risk', value: '$2.22M', color: 'text-[#d4a054]' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 border border-white/5 bg-white/[0.02]">
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className={cn('font-display font-bold text-lg', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>
      {handoffSignals.map((sig) => {
        const c = severityColors[sig.severity];
        return (
          <div key={sig.id} className={cn('p-4 rounded-xl border', c.border, c.bg)}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
              <span className="text-[11px] font-semibold text-white/90">{sig.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">{sig.summary}</p>
            <div className="flex items-center gap-3 text-[10px]">
              <span className={cn('font-mono font-semibold', c.text)}>
                {formatCurrency(sig.valueAtRisk)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">{sig.whyItMatters.slice(0, 80)}...</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipelineHygienePanel() {
  const pipelineSignals = signals.filter((s) => s.type === 'pipeline_hygiene');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Stale Opportunities', value: '116 deals', color: 'text-[#4a90b8]' },
          { label: 'Staleness Rate', value: '41%', color: 'text-[#c8953c]' },
          { label: 'Phantom Pipeline', value: '$8.4M', color: 'text-[#c45a4a]' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 border border-white/5 bg-white/[0.02]">
            <div className="text-[10px] text-slate-500 mb-1">{s.label}</div>
            <div className={cn('font-display font-bold text-lg', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>
      {pipelineSignals.map((sig) => {
        const c = severityColors[sig.severity];
        return (
          <div key={sig.id} className={cn('p-4 rounded-xl border', c.border, c.bg)}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
              <span className="text-[11px] font-semibold text-white/90">{sig.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">{sig.summary}</p>
            <div className="p-2 rounded bg-white/[0.02] border border-white/5">
              <div className="text-[10px] text-cyan-400 mb-1">Recommended Action</div>
              <div className="text-[10px] text-slate-300">{sig.recommendedAction}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PANEL_MAP: Record<string, React.ComponentType> = {
  'approval-latency': ApprovalLatencyPanel,
  'stalled-workflows': StalledWorkflowsPanel,
  'forecast-drift': ForecastDriftPanel,
  'handoff-failures': HandoffFailuresPanel,
  'pipeline-hygiene': PipelineHygienePanel,
};

export default function UseCasesPage() {
  const [activeUseCase, setActiveUseCase] = useState('approval-latency');
  const uc = USE_CASES.find((u) => u.id === activeUseCase)!;
  const Panel = PANEL_MAP[activeUseCase];

  return (
    <div className="max-w-[1000px] space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-white tracking-tight">Use Cases</h1>
        <p className="text-sm text-slate-400 mt-1">
          Five business observability scenarios — each with its own signals, insights, and evidence
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {USE_CASES.map((u) => {
          const Icon = u.icon;
          return (
            <button
              key={u.id}
              onClick={() => setActiveUseCase(u.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                activeUseCase === u.id
                  ? cn('text-white', u.border, u.bg)
                  : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', activeUseCase === u.id ? u.color : '')} />
              {u.label}
            </button>
          );
        })}
      </div>

      <div className={cn('rounded-xl border p-5', uc.border, uc.bg)}>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn('w-2 h-2 rounded-full', uc.dot)} />
          <h2 className={cn('font-display font-semibold text-lg', uc.color)}>{uc.label}</h2>
        </div>
        <p className="text-sm text-slate-300">{uc.description}</p>
      </div>

      <Panel />
    </div>
  );
}
