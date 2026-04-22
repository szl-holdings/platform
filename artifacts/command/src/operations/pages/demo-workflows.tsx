import { demoRuns, demoWorkflows } from '@lyte/lib/demo-seed';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Play,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';

const BG = { surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

const WF_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  running: {
    label: 'Running',
    color: '#6b8f71',
    bg: 'rgba(107,143,113,0.08)',
    border: 'rgba(107,143,113,0.2)',
  },
  stalled: {
    label: 'Stalled',
    color: '#c45a4a',
    bg: 'rgba(196,90,74,0.08)',
    border: 'rgba(196,90,74,0.2)',
  },
  completed: {
    label: 'Completed',
    color: '#4a90b8',
    bg: 'rgba(74,144,184,0.08)',
    border: 'rgba(74,144,184,0.2)',
  },
  failed: {
    label: 'Failed',
    color: '#c45a4a',
    bg: 'rgba(196,90,74,0.08)',
    border: 'rgba(196,90,74,0.2)',
  },
  paused: {
    label: 'Paused',
    color: '#d4a054',
    bg: 'rgba(212,160,84,0.08)',
    border: 'rgba(212,160,84,0.2)',
  },
};

const STAGE_STATUS: Record<string, { color: string; bg: string }> = {
  done: { color: '#6b8f71', bg: 'rgba(107,143,113,0.12)' },
  active: { color: '#d4a054', bg: 'rgba(212,160,84,0.12)' },
  blocked: { color: '#c45a4a', bg: 'rgba(196,90,74,0.12)' },
  pending: { color: TEXT.muted as string, bg: 'rgba(255,255,255,0.04)' },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StageTimeline({ stages }: { stages: (typeof demoWorkflows)[0]['stages'] }) {
  return (
    <div className="flex items-start gap-0 mt-3">
      {stages.map((stage, i) => {
        const sc = STAGE_STATUS[stage.status];
        const isLast = i === stages.length - 1;
        const overrun = stage.daysSpent > stage.expectedDays;
        return (
          <div key={i} className="flex-1 flex flex-col">
            <div className="flex items-center">
              <div
                className="flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[7px] font-bold"
                style={{ background: sc.bg, borderColor: sc.color, color: sc.color }}
              >
                {stage.status === 'done' ? '✓' : stage.status === 'blocked' ? '!' : i + 1}
              </div>
              {!isLast && (
                <div
                  className="flex-1 h-px"
                  style={{
                    background: stage.status === 'done' ? '#6b8f71' : 'rgba(255,255,255,0.08)',
                  }}
                />
              )}
            </div>
            <div className="mt-1 pr-2">
              <div
                className="text-[8px] font-medium leading-tight"
                style={{ color: TEXT.secondary }}
              >
                {stage.name}
              </div>
              <div
                className="text-[7px] mt-0.5"
                style={{ color: overrun && stage.daysSpent > 0 ? '#c45a4a' : TEXT.muted }}
              >
                {stage.daysSpent > 0 ? `${stage.daysSpent}d` : '—'} / {stage.expectedDays}d expected
              </div>
              <div className="text-[7px]" style={{ color: TEXT.muted }}>
                {stage.owner}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorkflowCard({ wf }: { wf: (typeof demoWorkflows)[0] }) {
  const [open, setOpen] = useState(false);
  const st = WF_STATUS[wf.status];
  const isStalled = wf.status === 'stalled';
  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        background: BG.surface,
        border: `1px solid ${isStalled ? 'rgba(196,90,74,0.15)' : BORDER.subtle}`,
      }}
    >
      {isStalled && (
        <div className="h-px" style={{ background: 'linear-gradient(90deg, #c45a4a, #c8953c)' }} />
      )}
      <div className="px-4 py-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[12px] font-semibold" style={{ color: TEXT.primary }}>
                {wf.name}
              </span>
              <span
                className="text-[8px] px-1.5 py-px rounded font-mono uppercase"
                style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
              >
                {st.label}
              </span>
            </div>
            <div className="text-[9px]" style={{ color: TEXT.muted }}>
              {wf.function} · {wf.team}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div
              className="text-[10px] font-mono font-bold"
              style={{ color: isStalled ? '#c45a4a' : TEXT.secondary }}
            >
              {fmt(wf.valueAtRisk)}
            </div>
            <div className="text-[8px]" style={{ color: TEXT.muted }}>
              at risk
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>
              {timeAgo(wf.lastActivityAt)}
            </div>
            <div className="text-[8px]" style={{ color: TEXT.muted }}>
              last activity
            </div>
          </div>
          <ChevronDown
            className="w-3.5 h-3.5 shrink-0 transition-transform"
            style={{ color: TEXT.muted, transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </div>
      </div>
      {open && (
        <div
          className="px-4 pb-4 border-t space-y-3"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <p className="text-[10px] leading-relaxed pt-3" style={{ color: TEXT.secondary }}>
            {wf.description}
          </p>
          {wf.stallReason && (
            <div
              className="rounded px-3 py-2"
              style={{
                background: 'rgba(196,90,74,0.06)',
                border: '1px solid rgba(196,90,74,0.15)',
              }}
            >
              <div
                className="text-[8px] uppercase tracking-wider mb-0.5"
                style={{ color: '#c45a4a' }}
              >
                Stall Root Cause
              </div>
              <div className="text-[10px]" style={{ color: TEXT.secondary }}>
                {wf.stallReason}
              </div>
            </div>
          )}
          <div>
            <div
              className="text-[8px] uppercase tracking-widest mb-2"
              style={{ color: TEXT.muted }}
            >
              Stage Progress
            </div>
            <StageTimeline stages={wf.stages} />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Owner', value: wf.owner },
              { label: 'Started', value: timeAgo(wf.startedAt) },
              {
                label: 'Expected',
                value:
                  new Date(wf.expectedCompletionAt).getTime() < Date.now()
                    ? 'Overdue'
                    : timeAgo(wf.expectedCompletionAt),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  className="text-[8px] uppercase tracking-wider mb-0.5"
                  style={{ color: TEXT.muted }}
                >
                  {label}
                </div>
                <div
                  className="text-[10px] font-medium"
                  style={{
                    color:
                      new Date(wf.expectedCompletionAt).getTime() < Date.now() &&
                      label === 'Expected'
                        ? '#c45a4a'
                        : TEXT.primary,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoWorkflowsPage() {
  const [location] = useLocation();
  const [tab, setTab] = useState<'workflows' | 'runs'>(location === '/runs' ? 'runs' : 'workflows');
  const stalled = demoWorkflows.filter((w) => w.status === 'stalled');
  const running = demoWorkflows.filter((w) => w.status === 'running');
  const completed = demoWorkflows.filter((w) => w.status === 'completed');

  return (
    <div className="p-4 max-w-[1100px] space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Workflow className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: '#d4a054' }}
            >
              Command · Workflows
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>
            Workflow Command Center
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Active workflow health with status, stall detection, and execution history
          </p>
        </div>
        <div
          className="flex items-center gap-0 rounded overflow-hidden"
          style={{ border: `1px solid ${BORDER.subtle}` }}
        >
          {[
            { key: 'workflows', label: 'Workflows' },
            { key: 'runs', label: 'Run History' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'workflows' | 'runs')}
              className="text-[10px] px-3 py-1.5 transition-all"
              style={{
                color: tab === t.key ? '#d4a054' : TEXT.muted,
                background: tab === t.key ? 'rgba(212,160,84,0.1)' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'workflows' && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Workflows', value: demoWorkflows.length, color: TEXT.secondary },
              { label: 'Stalled', value: stalled.length, color: '#c45a4a' },
              { label: 'Running', value: running.length, color: '#6b8f71' },
              {
                label: 'Stall VAR',
                value: `$${(stalled.reduce((a, w) => a + w.valueAtRisk, 0) / 1_000_000).toFixed(1)}M`,
                color: '#c45a4a',
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-md p-3"
                style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
              >
                <div
                  className="text-[8px] uppercase tracking-wider mb-1"
                  style={{ color: TEXT.muted }}
                >
                  {c.label}
                </div>
                <div className="text-xl font-bold font-mono" style={{ color: c.color }}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          {stalled.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3 h-3" style={{ color: '#c45a4a' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#c45a4a' }}
                >
                  Stalled — Immediate Attention Required
                </span>
              </div>
              <div className="space-y-2">
                {stalled.map((wf) => (
                  <WorkflowCard key={wf.id} wf={wf} />
                ))}
              </div>
            </div>
          )}

          {running.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3 h-3" style={{ color: '#6b8f71' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#6b8f71' }}
                >
                  Active & Running
                </span>
              </div>
              <div className="space-y-2">
                {running.map((wf) => (
                  <WorkflowCard key={wf.id} wf={wf} />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-3 h-3" style={{ color: '#4a90b8' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#4a90b8' }}
                >
                  Completed
                </span>
              </div>
              <div className="space-y-2">
                {completed.map((wf) => (
                  <WorkflowCard key={wf.id} wf={wf} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'runs' && (
        <div className="space-y-3">
          {demoRuns.map((run) => {
            const runStatusColor: Record<string, string> = {
              running: '#d4a054',
              completed: '#6b8f71',
              failed: '#c45a4a',
              timed_out: '#c8953c',
            };
            const c = runStatusColor[run.status];
            return (
              <div
                key={run.id}
                className="rounded-md overflow-hidden"
                style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Play className="w-3 h-3 shrink-0" style={{ color: c }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                        {run.workflowName}
                      </div>
                      <div className="text-[9px]" style={{ color: TEXT.muted }}>
                        Triggered by: {run.triggeredBy}
                      </div>
                    </div>
                    <span
                      className="text-[8px] px-1.5 py-px rounded font-mono uppercase"
                      style={{ color: c, background: `${c}14`, border: `1px solid ${c}25` }}
                    >
                      {run.status}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
                      {timeAgo(run.startedAt)}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {run.steps.map((step, i) => {
                      const sc: Record<string, string> = {
                        done: '#6b8f71',
                        running: '#d4a054',
                        failed: '#c45a4a',
                        skipped: TEXT.muted as string,
                        pending: 'rgba(255,255,255,0.15)',
                      };
                      return (
                        <div key={i} className="flex items-center gap-1 text-[9px]">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: sc[step.status] }}
                          />
                          <span
                            style={{
                              color:
                                step.status === 'running'
                                  ? '#d4a054'
                                  : step.status === 'failed'
                                    ? '#c45a4a'
                                    : TEXT.muted,
                            }}
                          >
                            {step.step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {run.outputSummary && (
                    <div
                      className="text-[9px] rounded px-2 py-1.5"
                      style={{
                        color: TEXT.secondary,
                        background: 'rgba(107,143,113,0.06)',
                        border: '1px solid rgba(107,143,113,0.12)',
                      }}
                    >
                      {run.outputSummary}
                    </div>
                  )}
                  {run.steps.find((s) => s.status === 'running') && (
                    <div
                      className="text-[9px] rounded px-2 py-1.5"
                      style={{
                        color: '#d4a054',
                        background: 'rgba(212,160,84,0.06)',
                        border: '1px solid rgba(212,160,84,0.12)',
                      }}
                    >
                      Running: {run.steps.find((s) => s.status === 'running')?.step}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
