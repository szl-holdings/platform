import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  RefreshCw,
  RotateCcw,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ALLOY = '#4B8BDB';
const ALLOY_DIM = 'rgba(75,139,219,0.12)';

type RunState = 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'canceled';

interface ActionItem {
  id: number;
  runId: string;
  workflowName: string;
  pack: string;
  packColor: string;
  state: RunState;
  triggeredBy: string;
  queuedAt: string;
  duration?: string;
  durationMs?: number;
  output?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

const ACTIONS: ActionItem[] = [
  {
    id: 1,
    runId: 'RUN-3041',
    workflowName: 'Q1 Financial Report Generation',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    state: 'waiting_approval',
    triggeredBy: 'Stephen Lutar',
    queuedAt: '2h ago',
    duration: '1.2s',
    retryCount: 0,
    maxRetries: 3,
    output: 'Report generated — 47 pages, 14 exhibits. Pending exec review.',
  },
  {
    id: 2,
    runId: 'RUN-3040',
    workflowName: 'Vessel ETA Compliance Check',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    state: 'running',
    triggeredBy: 'Fleet Ops',
    queuedAt: '4m ago',
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 3,
    runId: 'RUN-3039',
    workflowName: 'Fuel Surcharge Rate Calculator',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    state: 'failed',
    triggeredBy: 'System',
    queuedAt: '22h ago',
    duration: '0.3s',
    retryCount: 1,
    maxRetries: 3,
    errorMessage: 'Approval chain timeout — no approver responded within SLA window.',
  },
  {
    id: 4,
    runId: 'RUN-3038',
    workflowName: 'Security Posture Audit',
    pack: 'PARAGON',
    packColor: '#4f6ef7',
    state: 'completed',
    triggeredBy: 'Lisa Monroe',
    queuedAt: '6h ago',
    duration: '2.8s',
    retryCount: 0,
    maxRetries: 3,
    output: 'Audit complete — 94% score. 0 critical findings. 3 recommendations issued.',
  },
  {
    id: 5,
    runId: 'RUN-3037',
    workflowName: 'Asset Valuation Batch',
    pack: 'DOMAINE',
    packColor: '#a07848',
    state: 'completed',
    triggeredBy: 'Finance',
    queuedAt: '8h ago',
    duration: '4.1s',
    retryCount: 0,
    maxRetries: 3,
    output: '6 assets valued. Total portfolio NAV updated.',
  },
  {
    id: 6,
    runId: 'RUN-3036',
    workflowName: 'Ownership Conflict Detector',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    state: 'queued',
    triggeredBy: 'System',
    queuedAt: '2m ago',
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 7,
    runId: 'RUN-3035',
    workflowName: 'Charter Contract Compliance Check',
    pack: 'SEXTANT',
    packColor: '#38bdf8',
    state: 'canceled',
    triggeredBy: 'Fleet Ops',
    queuedAt: '1d ago',
    retryCount: 0,
    maxRetries: 3,
  },
];

const STATE_CONFIG: Record<RunState, { label: string; color: string; bg: string; icon: any }> = {
  queued: { label: 'Queued', color: '#8b7ac8', bg: 'rgba(139,122,200,0.08)', icon: Clock },
  running: { label: 'Running', color: ALLOY, bg: ALLOY_DIM, icon: Activity },
  waiting_approval: {
    label: 'Awaiting Approval',
    color: '#d4a054',
    bg: 'rgba(212,160,84,0.08)',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completed',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    icon: CheckCircle2,
  },
  failed: { label: 'Failed', color: '#c45a4a', bg: 'rgba(196,90,74,0.08)', icon: XCircle },
  canceled: {
    label: 'Canceled',
    color: TEXT.tertiary,
    bg: 'rgba(255,255,255,0.04)',
    icon: XCircle,
  },
};

function StatePill({ state }: { state: RunState }) {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;
  return (
    <span
      className="flex items-center gap-1 text-[8px] font-medium px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon className="w-2.5 h-2.5" /> {cfg.label}
    </span>
  );
}

const TABS = ['all', 'queued', 'running', 'waiting_approval', 'failed', 'completed'] as const;

export default function AlloyActionConsolePage() {
  const [tab, setTab] = useState<string>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = ACTIONS.filter((a) => tab === 'all' || a.state === tab);
  const counts: Record<string, number> = {};
  for (const a of ACTIONS) {
    counts[a.state] = (counts[a.state] ?? 0) + 1;
  }

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3.5 h-3.5" style={{ color: ALLOY }} />
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ALLOY }}>
            Alloy Action Console
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
          Action Queue
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          All pending, in-progress, and completed workflow runs across the portfolio
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {(
          ['queued', 'running', 'waiting_approval', 'failed', 'completed', 'canceled'] as RunState[]
        ).map((state) => {
          const cfg = STATE_CONFIG[state];
          const count = counts[state] ?? 0;
          return (
            <button
              key={state}
              onClick={() => setTab(state)}
              className="rounded-md p-2.5 text-center transition-all hover:opacity-80"
              style={{
                background: tab === state ? cfg.bg : BG.surface,
                border: `1px solid ${tab === state ? `${cfg.color}30` : BORDER.subtle}`,
              }}
            >
              <div className="text-base font-bold font-mono" style={{ color: cfg.color }}>
                {count}
              </div>
              <div
                className="text-[7px] uppercase tracking-widest mt-0.5 leading-tight"
                style={{ color: tab === state ? cfg.color : TEXT.muted }}
              >
                {cfg.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab row */}
      <div
        className="flex gap-0.5 flex-wrap"
        style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-2 text-[9px] font-medium uppercase tracking-widest transition-colors capitalize"
            style={{
              color: tab === t ? TEXT.primary : TEXT.tertiary,
              borderBottom: tab === t ? `2px solid ${ALLOY}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t === 'waiting_approval' ? 'Awaiting' : t}
          </button>
        ))}
        <div
          className="ml-auto flex items-center px-3 text-[8px] gap-1"
          style={{ color: TEXT.muted }}
        >
          <RefreshCw className="w-2.5 h-2.5" /> Live
        </div>
      </div>

      {/* Action list */}
      <div className="space-y-2">
        {filtered.map((a) => {
          const isExpanded = expanded === a.id;
          return (
            <div
              key={a.id}
              className="rounded-md overflow-hidden transition-all"
              style={{
                background: BG.surface,
                border: `1px solid ${a.state === 'failed' ? 'rgba(196,90,74,0.15)' : BORDER.subtle}`,
              }}
            >
              <button
                className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/[0.015] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : a.id)}
              >
                <div
                  className="w-1.5 shrink-0 mt-1.5 h-8 rounded-full"
                  style={{ background: `${STATE_CONFIG[a.state].color}60` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                      style={{ color: a.packColor, background: `${a.packColor}14` }}
                    >
                      {a.pack}
                    </span>
                    <StatePill state={a.state} />
                  </div>
                  <h3 className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
                    {a.workflowName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[8px]">
                    <span style={{ color: TEXT.muted }}>By {a.triggeredBy}</span>
                    <span style={{ color: TEXT.muted }}>·</span>
                    <span className="flex items-center gap-0.5" style={{ color: TEXT.tertiary }}>
                      <Clock className="w-2 h-2" /> {a.queuedAt}
                    </span>
                    {a.duration && (
                      <span className="font-mono" style={{ color: TEXT.muted }}>
                        · {a.duration}
                      </span>
                    )}
                    {a.retryCount > 0 && (
                      <span style={{ color: '#c8953c' }}>· {a.retryCount} retry</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                    {a.runId}
                  </span>
                  {isExpanded ? (
                    <ChevronRight className="w-3 h-3 rotate-90" style={{ color: TEXT.muted }} />
                  ) : (
                    <ChevronRight className="w-3 h-3" style={{ color: TEXT.muted }} />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div
                  className="px-4 pb-3.5 space-y-2.5"
                  style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                >
                  <div className="pt-3">
                    {a.output && (
                      <div
                        className="rounded p-2.5 mb-2.5 text-[10px] leading-relaxed"
                        style={{
                          background: 'rgba(34,197,94,0.04)',
                          border: '1px solid rgba(34,197,94,0.12)',
                          color: '#22c55e',
                        }}
                      >
                        {a.output}
                      </div>
                    )}
                    {a.errorMessage && (
                      <div
                        className="rounded p-2.5 mb-2.5 text-[10px] leading-relaxed"
                        style={{
                          background: 'rgba(196,90,74,0.04)',
                          border: '1px solid rgba(196,90,74,0.12)',
                          color: '#c45a4a',
                        }}
                      >
                        Error: {a.errorMessage}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.state === 'failed' && a.retryCount < a.maxRetries && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-medium"
                          style={{
                            background: ALLOY_DIM,
                            border: `1px solid ${ALLOY}30`,
                            color: ALLOY,
                          }}
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Retry ({a.retryCount}/{a.maxRetries}
                          )
                        </button>
                      )}
                      {(a.state === 'queued' || a.state === 'running') && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-medium"
                          style={{
                            background: 'rgba(196,90,74,0.08)',
                            border: '1px solid rgba(196,90,74,0.18)',
                            color: '#c45a4a',
                          }}
                        >
                          <XCircle className="w-2.5 h-2.5" /> Cancel
                        </button>
                      )}
                      {a.state === 'waiting_approval' && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-medium"
                          style={{
                            background: 'rgba(212,160,84,0.1)',
                            border: '1px solid rgba(212,160,84,0.18)',
                            color: '#d4a054',
                          }}
                        >
                          <Eye className="w-2.5 h-2.5" /> Review & Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            className="rounded-md py-12 flex flex-col items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <Activity className="w-6 h-6" style={{ color: TEXT.muted }} />
            <p className="text-[11px]" style={{ color: TEXT.tertiary }}>
              No actions in this state
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
