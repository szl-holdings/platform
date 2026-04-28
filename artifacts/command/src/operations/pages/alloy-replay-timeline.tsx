import { type AlloyWorkflowRun, api } from '@lyte/lib/api';
import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle,
  ChevronRight,
  Cpu,
  FileText,
  Lock,
  Play,
  RefreshCw,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ACCENT = '#d4a054';

type StepEvent =
  | 'tool_call'
  | 'approval'
  | 'block'
  | 'screenshot'
  | 'decision'
  | 'output'
  | 'error'
  | 'start'
  | 'end';

interface ReplayStep {
  ts: string;
  offsetMs: number;
  event: StepEvent;
  title: string;
  detail?: string;
  tool?: string;
  evidence?: string[];
  approved?: boolean;
  blocked?: boolean;
  approver?: string;
  confidence?: number;
}

interface ReplayRun {
  runId: string;
  workflowName: string;
  pack: string;
  packColor: string;
  status: 'completed' | 'failed';
  startedAt: string;
  duration: string;
  triggeredBy: string;
  steps: ReplayStep[];
}

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
const EVENT_CFG: Record<StepEvent, { color: string; bg: string; icon: LucideIcon; label: string }> =
  {
    start: { color: '#d4a054', bg: 'rgba(212,160,84,0.1)', icon: Play, label: 'Started' },
    tool_call: { color: '#4a90b8', bg: 'rgba(74,144,184,0.1)', icon: Cpu, label: 'Tool Call' },
    approval: { color: '#8b7ac8', bg: 'rgba(139,122,200,0.1)', icon: Shield, label: 'Approval' },
    block: { color: '#c45a4a', bg: 'rgba(196,90,74,0.1)', icon: Lock, label: 'Blocked' },
    screenshot: {
      color: '#6b8f71',
      bg: 'rgba(107,143,113,0.1)',
      icon: Camera,
      label: 'Screenshot',
    },
    decision: { color: '#c8953c', bg: 'rgba(200,149,60,0.1)', icon: Zap, label: 'Decision' },
    output: { color: '#6b8f71', bg: 'rgba(107,143,113,0.1)', icon: FileText, label: 'Output' },
    error: { color: '#c45a4a', bg: 'rgba(196,90,74,0.1)', icon: XCircle, label: 'Error' },
    end: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', icon: CheckCircle, label: 'Completed' },
  };

const RUNS: ReplayRun[] = [
  {
    runId: 'RUN-3038',
    workflowName: 'Security Posture Audit',
    pack: 'Aegis',
    packColor: '#4f6ef7',
    status: 'completed',
    startedAt: '2026-04-01 06:14:22Z',
    duration: '2.8s',
    triggeredBy: 'Lisa Monroe',
    steps: [
      {
        ts: '06:14:22.000',
        offsetMs: 0,
        event: 'start',
        title: 'Run started',
        detail: 'Triggered by Lisa Monroe · Manual execution',
      },
      {
        ts: '06:14:22.084',
        offsetMs: 84,
        event: 'tool_call',
        title: 'enumerate_security_controls()',
        detail: 'Scanning 47 controls across 6 domains',
        tool: 'security_scanner',
        evidence: [
          'Digital perimeter controls',
          'Physical access controls',
          'Personnel compliance records',
        ],
      },
      {
        ts: '06:14:22.621',
        offsetMs: 621,
        event: 'screenshot',
        title: 'Context captured',
        detail: 'Control inventory snapshot at T+0.6s',
      },
      {
        ts: '06:14:22.840',
        offsetMs: 840,
        event: 'tool_call',
        title: "score_controls(framework='NIST')",
        detail: 'Scoring 47 controls against NIST CSF',
        tool: 'scoring_engine',
      },
      {
        ts: '06:14:23.210',
        offsetMs: 1210,
        event: 'decision',
        title: 'Severity classification',
        detail: '0 critical · 3 medium · 44 passing',
        confidence: 0.97,
      },
      {
        ts: '06:14:23.390',
        offsetMs: 1390,
        event: 'approval',
        title: 'Compliance Officer gate',
        detail: 'CISO review required for findings report',
        approver: 'Lisa Monroe',
        approved: true,
      },
      {
        ts: '06:14:23.510',
        offsetMs: 1510,
        event: 'tool_call',
        title: 'compile_audit_report()',
        detail: 'Generating structured report with evidence chain',
        tool: 'report_engine',
      },
      {
        ts: '06:14:24.018',
        offsetMs: 2018,
        event: 'tool_call',
        title: 'push_to_grc_platform()',
        detail: 'Exporting audit evidence to GRC',
        tool: 'grc_connector',
      },
      {
        ts: '06:14:24.801',
        offsetMs: 2801,
        event: 'output',
        title: 'Audit report delivered',
        detail:
          '94% score · 0 critical findings · 3 recommendations. Report pushed to GRC platform.',
      },
      {
        ts: '06:14:24.820',
        offsetMs: 2820,
        event: 'end',
        title: 'Run completed',
        detail: 'Duration: 2.8s · All steps passed · Trust receipt generated',
      },
    ],
  },
  {
    runId: 'RUN-3041',
    workflowName: 'Q1 Financial Report Generation',
    pack: 'PRAXIS',
    packColor: '#d4a054',
    status: 'completed',
    startedAt: '2026-04-01 04:02:11Z',
    duration: '1.2s',
    triggeredBy: 'Stephen Lutar',
    steps: [
      {
        ts: '04:02:11.000',
        offsetMs: 0,
        event: 'start',
        title: 'Run started',
        detail: 'Triggered by Stephen Lutar · Scheduled',
      },
      {
        ts: '04:02:11.112',
        offsetMs: 112,
        event: 'tool_call',
        title: 'aggregate_portfolio_kpis()',
        detail: 'Fetching KPIs from PRISM, Terra, Vessels, Aegis',
        tool: 'data_aggregator',
        evidence: ['Q1 revenue: $14.2M', 'Asset NAV: $127M', 'Fleet utilization: 87%'],
      },
      {
        ts: '04:02:11.440',
        offsetMs: 440,
        event: 'decision',
        title: 'Data completeness check',
        detail: '93% KPI coverage · Missing: 2 early-stage metrics',
        confidence: 0.93,
      },
      {
        ts: '04:02:11.611',
        offsetMs: 611,
        event: 'tool_call',
        title: 'generate_report_narrative()',
        detail: 'AI narrative generation for exec report',
        tool: 'narrative_engine',
      },
      {
        ts: '04:02:11.901',
        offsetMs: 901,
        event: 'screenshot',
        title: 'Draft captured',
        detail: 'Report draft preview at T+0.9s',
      },
      {
        ts: '04:02:12.010',
        offsetMs: 1010,
        event: 'approval',
        title: 'Executive review gate',
        detail: 'CFO sign-off required before distribution',
        approver: 'Finance',
        approved: true,
      },
      {
        ts: '04:02:12.201',
        offsetMs: 1201,
        event: 'output',
        title: 'Report queued for distribution',
        detail: '47 pages · 14 exhibits · Pending exec review before final send',
      },
      {
        ts: '04:02:12.210',
        offsetMs: 1210,
        event: 'end',
        title: 'Run completed',
        detail: 'Duration: 1.2s · Awaiting approval · Trust receipt generated',
      },
    ],
  },
  {
    runId: 'RUN-3039',
    workflowName: 'Fuel Surcharge Rate Calculator',
    pack: 'Vessels',
    packColor: '#38bdf8',
    status: 'failed',
    startedAt: '2026-03-31 06:44:18Z',
    duration: '0.3s',
    triggeredBy: 'System',
    steps: [
      {
        ts: '06:44:18.000',
        offsetMs: 0,
        event: 'start',
        title: 'Run started',
        detail: 'Triggered by system · Signal: Brent crude update',
      },
      {
        ts: '06:44:18.088',
        offsetMs: 88,
        event: 'tool_call',
        title: 'fetch_brent_crude_price()',
        detail: 'Fetching latest Brent crude index',
        tool: 'market_data',
      },
      {
        ts: '06:44:18.190',
        offsetMs: 190,
        event: 'tool_call',
        title: 'apply_surcharge_formula()',
        detail: 'Calculating fleet-wide surcharge impact',
        tool: 'rate_calculator',
      },
      {
        ts: '06:44:18.241',
        offsetMs: 241,
        event: 'approval',
        title: 'Finance approval gate',
        detail: 'Rate change > 5% requires Finance sign-off',
        approver: 'Finance',
        approved: false,
        blocked: true,
      },
      {
        ts: '06:44:18.300',
        offsetMs: 300,
        event: 'block',
        title: 'SLA timeout — approval chain',
        detail: 'No approver responded within 24h SLA window. Action blocked.',
      },
      {
        ts: '06:44:18.312',
        offsetMs: 312,
        event: 'error',
        title: 'Run failed',
        detail: 'Approval chain timeout · Rates NOT updated · Retry available',
      },
    ],
  },
  {
    runId: 'RUN-3037',
    workflowName: 'Asset Valuation Batch',
    pack: 'Terra',
    packColor: '#a07848',
    status: 'completed',
    startedAt: '2026-03-31 20:00:00Z',
    duration: '4.1s',
    triggeredBy: 'Finance',
    steps: [
      {
        ts: '20:00:00.000',
        offsetMs: 0,
        event: 'start',
        title: 'Run started',
        detail: 'Triggered by Finance · Scheduled quarterly batch',
      },
      {
        ts: '20:00:00.220',
        offsetMs: 220,
        event: 'tool_call',
        title: 'load_asset_records(count=6)',
        detail: 'Loading 6 real estate assets for valuation',
        tool: 'asset_db',
        evidence: ['Asset IDs: TA-001 through TA-006', 'Prior NAV: $84.2M combined'],
      },
      {
        ts: '20:00:00.980',
        offsetMs: 980,
        event: 'tool_call',
        title: 'fetch_market_comps()',
        detail: 'Pulling current market comparables',
        tool: 'market_data_connector',
      },
      {
        ts: '20:00:01.811',
        offsetMs: 1811,
        event: 'tool_call',
        title: 'run_dcf_models(assets=6)',
        detail: 'Running DCF + cap rate models per asset',
        tool: 'valuation_engine',
      },
      {
        ts: '20:00:02.890',
        offsetMs: 2890,
        event: 'decision',
        title: 'Valuation confidence',
        detail: 'All 6 assets within 5% variance of prior NAV',
        confidence: 0.91,
      },
      {
        ts: '20:00:03.411',
        offsetMs: 3411,
        event: 'tool_call',
        title: 'update_nav_records()',
        detail: 'Writing updated NAV to asset management system',
        tool: 'asset_writer',
      },
      {
        ts: '20:00:04.011',
        offsetMs: 4011,
        event: 'output',
        title: 'NAV updated',
        detail: '6 assets valued · Total NAV: $89.7M (+6.5%) · Full report published',
      },
      {
        ts: '20:00:04.100',
        offsetMs: 4100,
        event: 'end',
        title: 'Run completed',
        detail: 'Duration: 4.1s · All valuations applied · Trust receipt generated',
      },
    ],
  },
];

function OffsetBar({ offsetMs, maxMs }: { offsetMs: number; maxMs: number }) {
  const pct = Math.round((offsetMs / maxMs) * 100);
  return (
    <div
      className="relative h-1 rounded-full mt-1"
      style={{ background: 'rgba(255,255,255,0.04)', width: 48 }}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{ width: `${pct}%`, background: ACCENT, opacity: 0.7 }}
      />
    </div>
  );
}

function StepRow({ step, maxMs, isLast }: { step: ReplayStep; maxMs: number; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const cfg = EVENT_CFG[step.event];
  const Icon = cfg.icon;
  return (
    <div className="relative pl-6">
      {!isLast && (
        <div
          className="absolute left-2.5 top-6 bottom-0 w-px"
          style={{ background: BORDER.muted }}
        />
      )}
      <div
        className="absolute left-0 top-3 w-5 h-5 rounded-full flex items-center justify-center"
        style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}40` }}
      >
        <Icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
      </div>

      <button
        className="w-full text-left px-3 py-2.5 rounded-md hover:bg-white/[0.015] transition-colors"
        onClick={() => (step.tool || step.evidence || step.approver ? setOpen(!open) : undefined)}
        style={{ cursor: step.tool || step.evidence || step.approver ? 'pointer' : 'default' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
            {step.ts}
          </span>
          <span
            className="text-[8px] font-mono px-1.5 py-0.5 rounded"
            style={{ color: cfg.color, background: cfg.bg }}
          >
            {cfg.label}
          </span>
          {step.approved === true && (
            <span
              className="text-[7px] font-mono px-1 py-0.5 rounded"
              style={{ color: '#6b8f71', background: 'rgba(107,143,113,0.08)' }}
            >
              Approved
            </span>
          )}
          {step.blocked && (
            <span
              className="text-[7px] font-mono px-1 py-0.5 rounded"
              style={{ color: '#c45a4a', background: 'rgba(196,90,74,0.08)' }}
            >
              Blocked
            </span>
          )}
          {step.confidence !== undefined && (
            <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>
              {Math.round(step.confidence * 100)}% conf
            </span>
          )}
          <div className="ml-auto">
            <OffsetBar offsetMs={step.offsetMs} maxMs={maxMs} />
          </div>
        </div>
        <div className="mt-1 text-[10px] font-medium" style={{ color: TEXT.primary }}>
          {step.tool ? <span className="font-mono">{step.title}</span> : step.title}
        </div>
        {step.detail && (
          <p className="text-[9px] mt-0.5" style={{ color: TEXT.secondary }}>
            {step.detail}
          </p>
        )}
      </button>

      {open && (step.evidence || step.approver) && (
        <div
          className="ml-3 mb-2 rounded-md p-2.5"
          style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
        >
          {step.evidence && (
            <div className="space-y-1">
              <div
                className="text-[8px] uppercase tracking-widest mb-1"
                style={{ color: TEXT.muted }}
              >
                Evidence
              </div>
              {step.evidence.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[9px]"
                  style={{ color: TEXT.secondary }}
                >
                  <ArrowRight className="w-2.5 h-2.5 shrink-0" style={{ color: TEXT.muted }} />
                  {e}
                </div>
              ))}
            </div>
          )}
          {step.approver && (
            <div className="mt-2 flex items-center gap-2 text-[9px]">
              <Shield className="w-3 h-3" style={{ color: '#8b7ac8' }} />
              <span style={{ color: TEXT.secondary }}>Approver: {step.approver}</span>
              {step.approved === true && <span style={{ color: '#6b8f71' }}>· Approved</span>}
              {step.blocked && <span style={{ color: '#c45a4a' }}>· Timed out</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function mapRealRunToReplay(run: AlloyWorkflowRun): ReplayRun {
  const steps: ReplayStep[] = [];
  const baseTs = run.startedAt ?? run.queuedAt ?? run.createdAt;
  const baseTime = new Date(baseTs).getTime();

  steps.push({
    ts: new Date(baseTs).toISOString().slice(11, 23),
    offsetMs: 0,
    event: 'start',
    title: 'Run started',
    detail: `Workflow ID ${run.workflowId} · State: ${run.state}`,
  });

  (run.stateHistory ?? []).forEach((h, _i) => {
    const ts = new Date(h.at).getTime();
    const offset = Math.max(0, ts - baseTime);
    const event: StepEvent =
      h.state === 'running'
        ? 'tool_call'
        : h.state === 'waiting_approval'
          ? 'approval'
          : h.state === 'completed'
            ? 'end'
            : h.state === 'failed'
              ? 'error'
              : 'decision';
    steps.push({
      ts: new Date(h.at).toISOString().slice(11, 23),
      offsetMs: offset,
      event,
      title: `State → ${h.state}`,
      detail: h.reason ?? `Transitioned by ${h.by}`,
      approved: h.state === 'completed',
      blocked: h.state === 'failed',
    });
  });

  if (run.output) {
    const completedAt = run.completedAt ?? run.queuedAt;
    const offset = Math.max(0, new Date(completedAt).getTime() - baseTime);
    steps.push({
      ts: new Date(completedAt).toISOString().slice(11, 23),
      offsetMs: offset + 100,
      event: 'output',
      title: 'Output delivered',
      detail:
        typeof run.output?.summary === 'string'
          ? run.output.summary
          : JSON.stringify(run.output).slice(0, 100),
    });
  }

  return {
    runId: `RUN-${run.id}`,
    workflowName: `Workflow #${run.workflowId}`,
    pack: 'Counsel',
    packColor: '#d4a054',
    status: run.state === 'failed' ? 'failed' : 'completed',
    startedAt: baseTs,
    duration: run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : '—',
    triggeredBy: `Workflow ${run.workflowId}`,
    steps,
  };
}

export default function AlloyReplayTimelinePage() {
  const [selectedRun, setSelectedRun] = useState<ReplayRun | null>(null);
  const [playheadIdx, setPlayheadIdx] = useState<number | null>(null);

  const { data: runsData, isLoading: runsLoading } = useStandardQuery({
    queryKey: ['continuum-runs-replay'],
    queryFn: () => api.alloyRuns.list({ limit: 10 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const realRuns: ReplayRun[] = (runsData?.data ?? []).map(mapRealRunToReplay);
  const allRuns = realRuns.length > 0 ? [...realRuns, ...RUNS] : RUNS;

  function openReplay(run: ReplayRun) {
    setSelectedRun(run);
    setPlayheadIdx(null);
    setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setPlayheadIdx(i);
        if (i >= run.steps.length - 1) clearInterval(interval);
      }, 300);
    }, 200);
  }

  const maxMs = selectedRun ? Math.max(...selectedRun.steps.map((s) => s.offsetMs), 1) : 1;

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page, minHeight: '100vh' }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: ACCENT }}
          >
            Counsel · Execution Replay
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
          Execution Replay Timeline
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Step-by-step replay of completed runs — tool calls, approvals, blocks, evidence, and
          timestamps.
        </p>
      </div>

      {!selectedRun ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[9px] font-semibold uppercase tracking-widest"
              style={{ color: TEXT.muted }}
            >
              Completed Runs
            </span>
            {runsLoading && (
              <RefreshCw className="w-3 h-3 animate-spin" style={{ color: TEXT.muted }} />
            )}
            {realRuns.length > 0 && (
              <span
                className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{ color: '#6b8f71', background: 'rgba(107,143,113,0.08)' }}
              >
                {realRuns.length} live
              </span>
            )}
          </div>
          {allRuns.map((run) => (
            <div
              key={run.runId}
              className="rounded-md p-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
              style={{
                background: BG.surface,
                border: `1px solid ${run.status === 'failed' ? 'rgba(196,90,74,0.15)' : BORDER.subtle}`,
              }}
              onClick={() => openReplay(run)}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                  style={{ color: run.packColor, background: `${run.packColor}14` }}
                >
                  {run.pack}
                </span>
                <span
                  className={`text-[8px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1`}
                  style={{
                    color: run.status === 'completed' ? '#6b8f71' : '#c45a4a',
                    background:
                      run.status === 'completed'
                        ? 'rgba(107,143,113,0.08)'
                        : 'rgba(196,90,74,0.08)',
                  }}
                >
                  {run.status === 'completed' ? (
                    <CheckCircle className="w-2.5 h-2.5" />
                  ) : (
                    <XCircle className="w-2.5 h-2.5" />
                  )}
                  {run.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[11px] font-medium" style={{ color: TEXT.primary }}>
                    {run.workflowName}
                  </div>
                  <div
                    className="flex items-center gap-3 mt-0.5 text-[8px]"
                    style={{ color: TEXT.muted }}
                  >
                    <span className="font-mono">{run.runId}</span>
                    <span>·</span>
                    <span>By {run.triggeredBy}</span>
                    <span>·</span>
                    <span>{run.startedAt}</span>
                    <span>·</span>
                    <span>{run.duration}</span>
                    <span>·</span>
                    <span>{run.steps.length} steps</span>
                  </div>
                </div>
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[9px] font-medium shrink-0"
                  style={{
                    background: 'rgba(212,160,84,0.1)',
                    border: '1px solid rgba(212,160,84,0.2)',
                    color: ACCENT,
                  }}
                >
                  <Play className="w-2.5 h-2.5" /> Replay
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSelectedRun(null)}
              className="flex items-center gap-1 text-[9px] hover:opacity-75 transition-opacity"
              style={{ color: TEXT.tertiary }}
            >
              <ChevronRight className="w-3 h-3 rotate-180" /> All Runs
            </button>
            <ChevronRight className="w-3 h-3" style={{ color: TEXT.muted }} />
            <span className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>
              {selectedRun.runId}
            </span>
            <span className="text-[9px]" style={{ color: TEXT.primary }}>
              {selectedRun.workflowName}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Run ID', value: selectedRun.runId, color: TEXT.secondary },
              { label: 'Duration', value: selectedRun.duration, color: TEXT.primary },
              { label: 'Steps', value: selectedRun.steps.length, color: TEXT.primary },
              {
                label: 'Status',
                value: selectedRun.status,
                color: selectedRun.status === 'completed' ? '#6b8f71' : '#c45a4a',
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-md p-3"
                style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
              >
                <div
                  className="text-[8px] uppercase tracking-widest mb-1"
                  style={{ color: TEXT.muted }}
                >
                  {m.label}
                </div>
                <div className="text-sm font-bold font-mono" style={{ color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-md p-4"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                Replay Timeline
              </span>
              <div className="flex items-center gap-2">
                {playheadIdx !== null && playheadIdx < selectedRun.steps.length - 1 && (
                  <span
                    className="flex items-center gap-1 text-[8px] font-mono"
                    style={{ color: ACCENT }}
                  >
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Playing…
                  </span>
                )}
                <button
                  onClick={() => openReplay(selectedRun)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[9px]"
                  style={{
                    background: 'rgba(212,160,84,0.08)',
                    border: '1px solid rgba(212,160,84,0.15)',
                    color: ACCENT,
                  }}
                >
                  <Play className="w-2.5 h-2.5" /> Replay
                </button>
              </div>
            </div>

            <div className="space-y-0">
              {selectedRun.steps.map((step, i) => {
                const visible = playheadIdx === null || i <= playheadIdx;
                if (!visible) return null;
                return (
                  <StepRow
                    key={i}
                    step={step}
                    maxMs={maxMs}
                    isLast={i === selectedRun.steps.length - 1}
                  />
                );
              })}
            </div>
          </div>

          <div
            className="rounded-md p-3 flex items-start gap-2.5"
            style={{
              background: 'rgba(107,143,113,0.04)',
              border: '1px solid rgba(107,143,113,0.12)',
            }}
          >
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#6b8f71' }} />
            <div>
              <div className="text-[9px] font-semibold" style={{ color: '#6b8f71' }}>
                Trust Receipt Available
              </div>
              <p className="text-[9px] mt-0.5" style={{ color: TEXT.secondary }}>
                A signed trust receipt for this run captures all inputs, outputs, policy decisions,
                evidence, and confidence levels.
                <button className="ml-1 underline" style={{ color: '#6b8f71' }}>
                  View receipt →
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
