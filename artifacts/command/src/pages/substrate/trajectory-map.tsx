import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Filter,
  Loader2,
  Pause,
  RefreshCw,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'wouter';
import { formatAge } from './layout';
import type { RiskLevel, RunStatus, SubstrateRun, Vertical } from './types';
import { useRuns } from './use-substrate';

const ACCENT = '#22d3ee';
const SUB = '/substrate';

const VERTICAL_LABELS: Record<Vertical, string> = {
  firestorm: 'PARAGON',
  vessels: 'SEXTANT',
  terra: 'DOMAINE',
  lyte: 'KORA',
  prism: 'PRAXIS',
  alloy: 'FORGE',
  'carlota-jo': 'Carlota Jo',
};

const VERTICAL_COLORS: Record<Vertical, string> = {
  firestorm: '#f97316',
  vessels: '#38bdf8',
  terra: '#c87941',
  lyte: '#22d3ee',
  prism: '#a78bfa',
  alloy: '#60a5fa',
  'carlota-jo': '#d4b896',
};

const STATUS_CONFIG: Record<RunStatus, { color: string; icon: React.ElementType; label: string }> =
  {
    running: { color: '#22d3ee', icon: Loader2, label: 'Running' },
    'awaiting-approval': { color: '#f59e0b', icon: Pause, label: 'Awaiting Approval' },
    completed: { color: '#22c55e', icon: CheckCircle2, label: 'Completed' },
    failed: { color: '#ef4444', icon: XCircle, label: 'Failed' },
    paused: { color: '#f59e0b', icon: Pause, label: 'Paused' },
  };

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-16 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function StageProgress({ run }: { run: SubstrateRun }) {
  const stageOrder = [
    'signal',
    'context',
    'recommendation',
    'simulation',
    'policy',
    'execution',
    'proof',
    'outcome',
    'learning',
  ];
  const completedCount = run.stages.filter((s) => s.status === 'completed').length;
  const total = run.stages.length;
  return (
    <div className="flex items-center gap-1">
      {stageOrder.map((kind, _i) => {
        const stage = run.stages.find((s) => s.kind === kind);
        const color = !stage
          ? 'transparent'
          : stage.status === 'completed'
            ? '#22c55e'
            : stage.status === 'running'
              ? ACCENT
              : stage.status === 'failed'
                ? '#ef4444'
                : 'rgba(255,255,255,0.1)';
        return (
          <div
            key={kind}
            className="w-2 h-2 rounded-sm"
            style={{ background: color }}
            title={kind}
          />
        );
      })}
      <span className="ml-1 text-[9px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
        {completedCount}/{total}
      </span>
    </div>
  );
}

function KpiRow({ runs }: { runs: SubstrateRun[] }) {
  const inFlight = runs.filter(
    (r) => r.status === 'running' || r.status === 'awaiting-approval',
  ).length;
  const awaitingApproval = runs.filter((r) => r.status === 'awaiting-approval').length;
  const completed = runs.filter((r) => r.status === 'completed').length;
  const failed = runs.filter((r) => r.status === 'failed').length;
  const avgConfidence = runs.length ? runs.reduce((s, r) => s + r.confidence, 0) / runs.length : 0;

  const kpis = [
    {
      label: 'In-Flight Runs',
      value: String(inFlight),
      trend: 'up',
      color: ACCENT,
      icon: Activity,
    },
    {
      label: 'Awaiting Approval',
      value: String(awaitingApproval),
      trend: awaitingApproval > 0 ? 'up' : 'neutral',
      color: awaitingApproval > 0 ? '#f59e0b' : '#22c55e',
      icon: Pause,
    },
    {
      label: 'Completed (session)',
      value: String(completed),
      trend: 'neutral',
      color: '#22c55e',
      icon: CheckCircle2,
    },
    {
      label: 'Failed',
      value: String(failed),
      trend: failed > 0 ? 'down' : 'neutral',
      color: failed > 0 ? '#ef4444' : '#22c55e',
      icon: XCircle,
    },
    {
      label: 'Avg Confidence',
      value: `${Math.round(avgConfidence * 100)}%`,
      trend: avgConfidence >= 0.85 ? 'up' : 'down',
      color: avgConfidence >= 0.85 ? '#22c55e' : '#f59e0b',
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="rounded-lg p-3 border"
            style={{ background: 'hsl(214,12%,8%)', borderColor: 'hsla(0,0%,100%,0.08)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px]" style={{ color: 'hsl(214,7%,55%)' }}>
                {kpi.label}
              </p>
              <Icon className="w-3 h-3" style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>
              {kpi.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function TrajectoryMap() {
  const { runs, gatewayStatus } = useRuns();
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [filterVertical, setFilterVertical] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterApproval, setFilterApproval] = useState<string>('all');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLastUpdate(Date.now());
  }, []);

  const tenants = Array.from(new Set(runs.map((r) => r.tenant)));

  const filtered = runs.filter((r) => {
    if (filterVertical !== 'all' && r.vertical !== filterVertical) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterRisk !== 'all' && r.riskLevel !== filterRisk) return false;
    if (filterApproval !== 'all') {
      if (filterApproval === 'requires' && r.status !== 'awaiting-approval') return false;
      if (filterApproval === 'none' && r.status === 'awaiting-approval') return false;
    }
    if (filterTenant !== 'all' && r.tenant !== filterTenant) return false;
    return true;
  });

  const selectClass = 'text-[11px] rounded px-2 py-1 border outline-none';
  const selectStyle = {
    background: 'hsl(214,12%,8%)',
    borderColor: 'hsla(0,0%,100%,0.12)',
    color: 'hsl(38,8%,92%)',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'hsl(38,8%,92%)' }}>
            Trajectory Map
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(214,7%,55%)' }}>
            Live in-flight runs across all verticals — updates every 5s
          </p>
        </div>
        <div className="flex items-center gap-2">
          {gatewayStatus === 'live' ? (
            <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#22c55e' }}>
              <Wifi className="w-3 h-3" />
              <span className="font-mono">Gateway live</span>
            </div>
          ) : gatewayStatus === 'offline' ? (
            <div
              className="flex items-center gap-1.5 text-[10px]"
              style={{ color: 'hsl(214,7%,35%)' }}
            >
              <WifiOff className="w-3 h-3" />
              <span className="font-mono">Offline — simulation</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 text-[10px] animate-pulse"
              style={{ color: ACCENT }}
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="font-mono">Connecting…</span>
            </div>
          )}
          <span className="text-[10px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
            Updated {Math.round((Date.now() - lastUpdate) / 1000)}s ago
          </span>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/5"
            style={{ border: '1px solid hsla(0,0%,100%,0.12)', color: 'hsl(38,8%,92%)' }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      <KpiRow runs={runs} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(214,7%,55%)' }}>
          <Filter className="w-3 h-3" />
          Filters
        </div>
        <select
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="all">All tenants</option>
          {tenants.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filterVertical}
          onChange={(e) => setFilterVertical(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="all">All verticals</option>
          {Object.entries(VERTICAL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="all">All statuses</option>
          <option value="running">Running</option>
          <option value="awaiting-approval">Awaiting approval</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="all">All risk levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={filterApproval}
          onChange={(e) => setFilterApproval(e.target.value)}
          className={selectClass}
          style={selectStyle}
        >
          <option value="all">Any approval state</option>
          <option value="requires">Requires approval</option>
          <option value="none">No approval needed</option>
        </select>
        {(filterVertical !== 'all' ||
          filterStatus !== 'all' ||
          filterRisk !== 'all' ||
          filterApproval !== 'all' ||
          filterTenant !== 'all') && (
          <button
            onClick={() => {
              setFilterVertical('all');
              setFilterStatus('all');
              setFilterRisk('all');
              setFilterApproval('all');
              setFilterTenant('all');
            }}
            className="text-[11px] px-2 py-1 rounded transition-colors hover:bg-white/5"
            style={{ color: ACCENT }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <Filter className="w-10 h-10 opacity-20" style={{ color: ACCENT }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No runs match these filters
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Adjust or reset filters to see in-flight runs
            </p>
          </div>
          <button
            onClick={() => {
              setFilterVertical('all');
              setFilterStatus('all');
              setFilterRisk('all');
              setFilterApproval('all');
              setFilterTenant('all');
            }}
            className="text-xs px-3 py-1.5 rounded border transition-colors hover:bg-white/5"
            style={{ borderColor: 'hsla(0,0%,100%,0.12)', color: 'hsl(38,8%,92%)' }}
          >
            Show all runs
          </button>
        </div>
      ) : (
        <div
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  background: 'hsl(214,12%,8%)',
                  borderBottom: '1px solid hsla(0,0%,100%,0.08)',
                }}
              >
                {[
                  'Workflow',
                  'Vertical',
                  'Tenant',
                  'Stage Progress',
                  'Confidence',
                  'Risk',
                  'Policy',
                  'Approver',
                  'Age',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: 'hsl(214,7%,35%)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => {
                const statusCfg = STATUS_CONFIG[run.status];
                const StatusIcon = statusCfg.icon;
                const vertColor = VERTICAL_COLORS[run.vertical] || ACCENT;
                return (
                  <tr
                    key={run.id}
                    onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid hsla(0,0%,100%,0.04)',
                      background: selectedRun === run.id ? `${ACCENT}08` : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedRun !== run.id)
                        (e.currentTarget as HTMLElement).style.background =
                          'rgba(255,255,255,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRun !== run.id)
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`w-3.5 h-3.5 flex-shrink-0 ${run.status === 'running' ? 'animate-spin' : ''}`}
                          style={{ color: statusCfg.color }}
                        />
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'hsl(38,8%,92%)' }}>
                            {run.workflow}
                          </p>
                          <p className="text-[10px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
                            {run.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded"
                        style={{ background: `${vertColor}15`, color: vertColor }}
                      >
                        {VERTICAL_LABELS[run.vertical]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: 'hsl(214,7%,55%)' }}>
                        {run.tenant}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StageProgress run={run} />
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBar value={run.confidence} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: `${RISK_COLORS[run.riskLevel]}15`,
                          color: RISK_COLORS[run.riskLevel],
                        }}
                      >
                        {run.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px]"
                        style={{
                          color:
                            run.policyStatus === 'compliant'
                              ? '#22c55e'
                              : run.policyStatus === 'violated'
                                ? '#ef4444'
                                : '#f59e0b',
                        }}
                      >
                        {run.policyStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px]"
                        style={{ color: run.approver ? 'hsl(38,8%,92%)' : 'hsl(214,7%,35%)' }}
                      >
                        {run.approver ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono" style={{ color: 'hsl(214,7%,55%)' }}>
                        {formatAge(run.ageMs)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`${SUB}/runs/${run.id}`}>
                        <a
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-80"
                          style={{ color: ACCENT }}
                        >
                          Detail <ChevronRight className="w-3 h-3" />
                        </a>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
