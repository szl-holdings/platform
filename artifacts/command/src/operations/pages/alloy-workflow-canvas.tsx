// @ts-nocheck

import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  GitBranch,
  Network,
  Play,
  Plug,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  StopCircle,
  UserCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ACCENT = '#d4a054';

type RunStatus = 'running' | 'completed' | 'failed' | 'pending' | 'cancelled' | 'awaiting_approval';
type NodeType = 'trigger' | 'condition' | 'action' | 'approval' | 'notification' | 'branch' | 'end';
type TabView = 'canvas' | 'runs' | 'connectors' | 'policy' | 'log';

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  status?: 'done' | 'active' | 'pending' | 'failed' | 'awaiting';
  actor?: string;
}

interface WorkflowDAG {
  nodes: WorkflowNode[];
  edges: Array<{ from: string; to: string; label?: string }>;
}

interface AlloyWorkflow {
  id: number;
  name: string;
  description?: string;
  status: string;
  triggerType?: string;
  stepCount?: number;
  lastRunAt?: string;
  createdAt?: string;
  dag?: WorkflowDAG;
}

interface AlloyRun {
  id: number;
  workflowId?: number;
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  actor?: string;
  stepResults?: Record<string, unknown>[];
}

interface AlloyDashboard {
  totalWorkflows?: number;
  totalRuns?: number;
  runningRuns?: number;
  successRate?: number;
  avgDurationMs?: number;
  recentWorkflows?: AlloyWorkflow[];
  recentRuns?: AlloyRun[];
}

interface WorkflowsResponse {
  data: { workflows: AlloyWorkflow[]; total?: number; fetchedAt?: string };
}
interface RunsResponse {
  data: { runs: AlloyRun[]; total?: number; fetchedAt?: string };
}
interface DashboardResponse {
  data: AlloyDashboard;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  running: { label: 'Running', color: '#d4a054', bg: 'rgba(212,160,84,0.12)', icon: Activity },
  completed: {
    label: 'Completed',
    color: '#6b8f71',
    bg: 'rgba(107,143,113,0.12)',
    icon: CheckCircle,
  },
  failed: { label: 'Failed', color: '#c45a4a', bg: 'rgba(196,90,74,0.12)', icon: AlertTriangle },
  pending: { label: 'Pending', color: '#7c85a0', bg: 'rgba(124,133,160,0.1)', icon: Clock },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.08)',
    icon: StopCircle,
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    color: '#8b7ac8',
    bg: 'rgba(139,122,200,0.12)',
    icon: UserCheck,
  },
};

const NODE_TYPE_CONFIG: Record<
  NodeType,
  { color: string; bg: string; icon: React.ElementType; shape: string }
> = {
  trigger: { color: '#d4a054', bg: 'rgba(212,160,84,0.12)', icon: Zap, shape: 'rounded-lg' },
  condition: { color: '#4a90b8', bg: 'rgba(74,144,184,0.12)', icon: GitBranch, shape: 'rotate-45' },
  action: { color: '#6b8f71', bg: 'rgba(107,143,113,0.12)', icon: Play, shape: 'rounded' },
  approval: {
    color: '#8b7ac8',
    bg: 'rgba(139,122,200,0.12)',
    icon: UserCheck,
    shape: 'rounded-lg',
  },
  notification: { color: '#c8953c', bg: 'rgba(200,149,60,0.12)', icon: Activity, shape: 'rounded' },
  branch: { color: '#4a90b8', bg: 'rgba(74,144,184,0.08)', icon: GitBranch, shape: 'rounded' },
  end: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', icon: CheckCircle, shape: 'rounded-full' },
};

const STATUS_NODE_COLORS: Record<string, string> = {
  done: '#6b8f71',
  active: '#d4a054',
  awaiting: '#8b7ac8',
  failed: '#c45a4a',
  pending: 'rgba(255,255,255,0.2)',
};

const STATIC_WORKFLOWS: AlloyWorkflow[] = [
  {
    id: 1,
    name: 'Incident Triage Pipeline',
    description: 'Ingest alert → classify → route → page on-call',
    status: 'active',
    triggerType: 'event',
    stepCount: 7,
    lastRunAt: '2026-04-01T03:22:41Z',
    dag: {
      nodes: [
        { id: 't1', type: 'trigger', label: 'Alert Ingested', status: 'done' },
        { id: 'c1', type: 'condition', label: 'Severity ≥ High?', status: 'done' },
        { id: 'a1', type: 'action', label: 'Enrich Context', status: 'done' },
        {
          id: 'ap1',
          type: 'approval',
          label: 'Ops Approval',
          status: 'awaiting',
          actor: 'J. Martinez',
        },
        { id: 'a2', type: 'action', label: 'Page On-Call', status: 'pending' },
        { id: 'n1', type: 'notification', label: 'Slack Alert', status: 'pending' },
        { id: 'e1', type: 'end', label: 'Resolved', status: 'pending' },
      ],
      edges: [
        { from: 't1', to: 'c1' },
        { from: 'c1', to: 'a1', label: 'yes' },
        { from: 'a1', to: 'ap1' },
        { from: 'ap1', to: 'a2' },
        { from: 'a2', to: 'n1' },
        { from: 'n1', to: 'e1' },
      ],
    },
  },
  {
    id: 2,
    name: 'SLO Burn-Rate Response',
    description: 'Monitor SLO budget → auto-scale → notify SRE',
    status: 'active',
    triggerType: 'metric',
    stepCount: 5,
    lastRunAt: '2026-04-01T02:55:18Z',
    dag: {
      nodes: [
        { id: 't1', type: 'trigger', label: 'SLO Budget < 20%', status: 'done' },
        { id: 'a1', type: 'action', label: 'Analyze Burn Rate', status: 'done' },
        { id: 'c1', type: 'condition', label: 'Auto-scale OK?', status: 'done' },
        { id: 'a2', type: 'action', label: 'Scale Infrastructure', status: 'done' },
        { id: 'n1', type: 'notification', label: 'SRE Notified', status: 'active' },
      ],
      edges: [
        { from: 't1', to: 'a1' },
        { from: 'a1', to: 'c1' },
        { from: 'c1', to: 'a2', label: 'yes' },
        { from: 'a2', to: 'n1' },
      ],
    },
  },
  {
    id: 3,
    name: 'Compliance Evidence Collector',
    description: 'Pull audit trails → compile artifacts → push to GRC',
    status: 'active',
    triggerType: 'schedule',
    stepCount: 6,
    lastRunAt: '2026-03-31T23:00:00Z',
  },
  {
    id: 4,
    name: 'Entity Resolution Engine',
    description: 'Cross-ref vendor data → deduplicate → enrich CRM',
    status: 'active',
    triggerType: 'api',
    stepCount: 8,
    lastRunAt: '2026-04-01T01:04:22Z',
  },
  {
    id: 5,
    name: 'Capital Readiness Briefing',
    description: 'Aggregate KPIs → format exec brief → route for approval',
    status: 'draft',
    triggerType: 'schedule',
    stepCount: 6,
    lastRunAt: undefined,
  },
];

const STATIC_RUNS: AlloyRun[] = [
  {
    id: 101,
    workflowId: 1,
    status: 'awaiting_approval',
    startedAt: '2026-04-01T03:22:41Z',
    actor: 'system',
  },
  { id: 102, workflowId: 2, status: 'running', startedAt: '2026-04-01T03:21:00Z', actor: 'system' },
  {
    id: 103,
    workflowId: 3,
    status: 'completed',
    startedAt: '2026-03-31T23:00:00Z',
    completedAt: '2026-03-31T23:01:42Z',
    actor: 'scheduler',
  },
  {
    id: 104,
    workflowId: 1,
    status: 'failed',
    startedAt: '2026-04-01T02:10:00Z',
    completedAt: '2026-04-01T02:10:04Z',
    errorMessage: 'Step 4: API timeout — retrying',
    actor: 'system',
  },
  {
    id: 105,
    workflowId: 4,
    status: 'completed',
    startedAt: '2026-04-01T01:04:22Z',
    completedAt: '2026-04-01T01:04:38Z',
    actor: 'api',
  },
  {
    id: 106,
    workflowId: 2,
    status: 'completed',
    startedAt: '2026-04-01T00:15:00Z',
    completedAt: '2026-04-01T00:15:11Z',
    actor: 'scheduler',
  },
];

const CONNECTORS = [
  {
    id: 'sf',
    name: 'Salesforce',
    category: 'CRM',
    status: 'connected',
    events: 142,
    lastSync: '2m ago',
    icon: '🔷',
  },
  {
    id: 'sn',
    name: 'ServiceNow',
    category: 'ITSM',
    status: 'connected',
    events: 87,
    lastSync: '5m ago',
    icon: '🟢',
  },
  {
    id: 'jira',
    name: 'Jira',
    category: 'Projects',
    status: 'connected',
    events: 63,
    lastSync: '1m ago',
    icon: '🔵',
  },
  {
    id: 'gh',
    name: 'GitHub',
    category: 'Engineering',
    status: 'connected',
    events: 211,
    lastSync: '30s ago',
    icon: '⚫',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Comms',
    status: 'connected',
    events: 39,
    lastSync: '10s ago',
    icon: '🟣',
  },
  {
    id: 'wd',
    name: 'Workday',
    category: 'HR/Finance',
    status: 'connected',
    events: 22,
    lastSync: '15m ago',
    icon: '🟠',
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    category: 'Alerting',
    status: 'connected',
    events: 18,
    lastSync: '2m ago',
    icon: '🔴',
  },
  {
    id: 'okta',
    name: 'Okta',
    category: 'Identity',
    status: 'degraded',
    events: 5,
    lastSync: '45m ago',
    icon: '🔵',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    status: 'connected',
    events: 91,
    lastSync: '1m ago',
    icon: '🟣',
  },
  {
    id: 'grc',
    name: 'GRC Platform',
    category: 'Compliance',
    status: 'pending',
    events: 0,
    lastSync: 'Never',
    icon: '🟡',
  },
];

const POLICY_RULES = [
  {
    id: 'p1',
    name: 'High-severity signals → require human approval',
    scope: 'All workflows',
    active: true,
    condition: 'severity >= high',
    action: 'Insert approval gate',
    priority: 1,
  },
  {
    id: 'p2',
    name: 'Financial actions > $50K → Finance review',
    scope: 'Finance workflows',
    active: true,
    condition: 'impact_estimate > 50000',
    action: 'Route to Finance approver',
    priority: 2,
  },
  {
    id: 'p3',
    name: 'Compliance events → immutable audit log',
    scope: 'Compliance workflows',
    active: true,
    condition: 'category = compliance',
    action: 'Append to audit trail',
    priority: 3,
  },
  {
    id: 'p4',
    name: 'Auto-remediation for known patterns',
    scope: 'Ops workflows',
    active: false,
    condition: 'pattern_match = known',
    action: 'Execute remediation playbook',
    priority: 4,
  },
  {
    id: 'p5',
    name: 'Off-hours actions → defer or escalate',
    scope: 'All workflows',
    active: true,
    condition: 'time NOT BETWEEN 08:00-18:00',
    action: 'Escalate or defer',
    priority: 5,
  },
];

const AUDIT_LOG = [
  {
    id: 'al1',
    ts: '2026-04-01T03:22:48Z',
    level: 'info',
    actor: 'alloy-engine',
    event: 'Run #101 started',
    workflow: 'Incident Triage Pipeline',
    runId: 101,
  },
  {
    id: 'al2',
    ts: '2026-04-01T03:22:49Z',
    level: 'info',
    actor: 'alloy-engine',
    event: 'Step 1 completed — Alert Ingested',
    workflow: 'Incident Triage Pipeline',
    runId: 101,
  },
  {
    id: 'al3',
    ts: '2026-04-01T03:22:50Z',
    level: 'info',
    actor: 'alloy-engine',
    event: 'Step 3 completed — Context Enriched',
    workflow: 'Incident Triage Pipeline',
    runId: 101,
  },
  {
    id: 'al4',
    ts: '2026-04-01T03:22:51Z',
    level: 'warn',
    actor: 'alloy-engine',
    event: 'Approval gate triggered — awaiting J. Martinez',
    workflow: 'Incident Triage Pipeline',
    runId: 101,
  },
  {
    id: 'al5',
    ts: '2026-04-01T03:21:00Z',
    level: 'info',
    actor: 'scheduler',
    event: 'Run #102 started — SLO threshold crossed',
    workflow: 'SLO Burn-Rate Response',
    runId: 102,
  },
  {
    id: 'al6',
    ts: '2026-04-01T02:10:04Z',
    level: 'error',
    actor: 'alloy-engine',
    event: 'Run #104 failed — API timeout at Step 4',
    workflow: 'Incident Triage Pipeline',
    runId: 104,
  },
  {
    id: 'al7',
    ts: '2026-04-01T01:04:38Z',
    level: 'info',
    actor: 'api',
    event: 'Run #105 completed — 16s duration',
    workflow: 'Entity Resolution Engine',
    runId: 105,
  },
  {
    id: 'al8',
    ts: '2026-03-31T23:01:42Z',
    level: 'info',
    actor: 'scheduler',
    event: 'Run #103 completed — 102s duration',
    workflow: 'Compliance Evidence Collector',
    runId: 103,
  },
];

function RunBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold font-mono"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}25` }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function fmtAgo(iso?: string) {
  if (!iso) return '—';
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

function fmtDuration(startedAt?: string, completedAt?: string): string {
  if (!startedAt) return '—';
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function DAGNode({ node }: { node: WorkflowNode }) {
  const cfg = NODE_TYPE_CONFIG[node.type];
  const statusColor = node.status ? STATUS_NODE_COLORS[node.status] : STATUS_NODE_COLORS.pending;
  const Icon = cfg.icon;
  const isApproval = node.type === 'approval';
  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <div
        className={`w-14 h-14 flex flex-col items-center justify-center relative ${node.type === 'end' ? 'rounded-full' : 'rounded-lg'}`}
        style={{
          background:
            node.status === 'done'
              ? `${statusColor}15`
              : node.status === 'active'
                ? `${statusColor}20`
                : node.status === 'awaiting'
                  ? `${statusColor}18`
                  : 'rgba(255,255,255,0.02)',
          border: `2px solid ${node.status ? statusColor : 'rgba(255,255,255,0.08)'}`,
          opacity: node.status === 'pending' ? 0.4 : 1,
        }}
      >
        {node.status === 'active' && (
          <div
            className="absolute inset-0 rounded-lg animate-pulse"
            style={{ background: `${statusColor}10` }}
          />
        )}
        <Icon className="w-5 h-5" style={{ color: node.status ? statusColor : TEXT.muted }} />
        {isApproval && node.status === 'awaiting' && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
            style={{ background: '#8b7ac8' }}
          />
        )}
      </div>
      <div className="mt-1.5 text-center px-1">
        <div
          className="text-[8px] font-medium leading-tight"
          style={{ color: node.status === 'pending' ? TEXT.muted : TEXT.secondary, maxWidth: 80 }}
        >
          {node.label}
        </div>
        {node.actor && node.status === 'awaiting' && (
          <div className="text-[7px] mt-0.5 font-mono" style={{ color: '#8b7ac8' }}>
            {node.actor}
          </div>
        )}
        {node.status === 'active' && (
          <div className="text-[7px] mt-0.5 font-mono" style={{ color: '#d4a054' }}>
            running
          </div>
        )}
      </div>
    </div>
  );
}

function DAGEdge({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1" style={{ minWidth: 24 }}>
      <ArrowRight className="w-4 h-4" style={{ color: TEXT.muted }} />
      {label && (
        <div className="text-[7px] font-mono mt-0.5" style={{ color: TEXT.muted }}>
          {label}
        </div>
      )}
    </div>
  );
}

function WorkflowDAGView({ wf }: { wf: AlloyWorkflow }) {
  const dag = wf.dag;
  if (!dag) {
    return (
      <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
        {Array.from({ length: wf.stepCount ?? 5 }).map((_, si) => (
          <div key={si} className="flex items-center gap-1 shrink-0">
            <div
              className="h-5 w-5 rounded flex items-center justify-center text-[8px] font-mono font-bold"
              style={{
                background:
                  si < 3
                    ? 'rgba(107,143,113,0.15)'
                    : si === 3
                      ? 'rgba(212,160,84,0.15)'
                      : 'rgba(255,255,255,0.03)',
                border: `1px solid ${si < 3 ? 'rgba(107,143,113,0.25)' : si === 3 ? 'rgba(212,160,84,0.25)' : BORDER.subtle}`,
                color: si < 3 ? '#6b8f71' : si === 3 ? ACCENT : TEXT.muted,
              }}
            >
              {si + 1}
            </div>
            {si < (wf.stepCount ?? 5) - 1 && (
              <ArrowRight className="w-2 h-2 shrink-0" style={{ color: TEXT.muted }} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const nodeMap = Object.fromEntries(dag.nodes.map((n) => [n.id, n]));
  const ordered: WorkflowNode[] = [];
  const visited = new Set<string>();
  const starts = dag.nodes.filter((n) => !dag.edges.find((e) => e.to === n.id));

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap[id];
    if (node) ordered.push(node);
    const outgoing = dag.edges.filter((e) => e.from === id);
    outgoing.forEach((e) => walk(e.to));
  }
  starts.forEach((s) => walk(s.id));

  return (
    <div className="mt-3 overflow-x-auto pb-2">
      <div className="flex items-start gap-0 min-w-max">
        {ordered.map((node, i) => {
          const incomingEdge = dag.edges.find(
            (e) => e.to === node.id && ordered[i - 1]?.id === e.from,
          );
          return (
            <div key={node.id} className="flex items-center">
              {i > 0 && <DAGEdge label={incomingEdge?.label} />}
              <DAGNode node={node} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AlloyWorkflowCanvas() {
  const [location] = useLocation();
  const [tab, setTab] = useState<TabView>(location.includes('/alloy/runs') ? 'runs' : 'canvas');
  const [searchQ, setSearchQ] = useState('');
  const [expandedWf, setExpandedWf] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: dashData, isError: isDashError } = useStandardQuery<DashboardResponse>({
    queryKey: ['alloy-dashboard'],
    queryFn: () => apiFetch<DashboardResponse>('/alloy/dashboard'),
    refetchInterval: 20000,
    retry: 1,
  });

  const { data: workflowsData } = useStandardQuery<WorkflowsResponse>({
    queryKey: ['alloy-workflows'],
    queryFn: () => apiFetch<WorkflowsResponse>('/alloy/workflows'),
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: runsData } = useStandardQuery<RunsResponse>({
    queryKey: ['alloy-runs'],
    queryFn: () => apiFetch<RunsResponse>('/alloy/runs'),
    refetchInterval: 10000,
    retry: 1,
  });

  const triggerMutation = useStandardMutation({
    mutationFn: (workflowId: number) =>
      apiFetch(`/alloy/workflows/${workflowId}/run`, { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alloy-runs'] });
      qc.invalidateQueries({ queryKey: ['alloy-dashboard'] });
    },
  });

  const retryMutation = useStandardMutation({
    mutationFn: (runId: number) => apiFetch(`/alloy/runs/${runId}/retry`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alloy-runs'] }),
  });

  const cancelMutation = useStandardMutation({
    mutationFn: (runId: number) => apiFetch(`/alloy/runs/${runId}/cancel`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alloy-runs'] }),
  });

  const dash = dashData?.data;
  const isLive = !isDashError && !!dash;

  const liveWorkflows = workflowsData?.data?.workflows ?? [];
  const liveRuns = runsData?.data?.runs ?? [];

  const workflows = liveWorkflows.length > 0 ? liveWorkflows : STATIC_WORKFLOWS;
  const runs = liveRuns.length > 0 ? liveRuns : STATIC_RUNS;

  const filteredWorkflows = searchQ
    ? workflows.filter((w) => w.name.toLowerCase().includes(searchQ.toLowerCase()))
    : workflows;

  const running = runs.filter((r) => r.status === 'running').length;
  const failed = runs.filter((r) => r.status === 'failed').length;
  const awaiting = runs.filter((r) => r.status === 'awaiting_approval').length;
  const completed = runs.filter((r) => r.status === 'completed').length;
  const successRate =
    dash?.successRate ?? (runs.length > 0 ? Math.round((completed / runs.length) * 100) : 100);

  const TABS: { id: TabView; label: string; icon: React.ElementType }[] = [
    { id: 'canvas', label: 'Workflow Canvas', icon: GitBranch },
    { id: 'runs', label: 'Run Monitor', icon: Activity },
    { id: 'connectors', label: 'Connectors', icon: Plug },
    { id: 'policy', label: 'Policy Rules', icon: Shield },
    { id: 'log', label: 'Event Log', icon: FileText },
  ];

  return (
    <div
      className="p-4 space-y-4"
      style={{ background: BG.page, minHeight: '100vh', color: TEXT.primary }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(212,160,84,0.12)',
              border: '1px solid rgba(212,160,84,0.2)',
            }}
          >
            <Brain className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Alloy Execution Fabric
            </h1>
            <p className="text-[10px] mt-0.5" style={{ color: TEXT.tertiary }}>
              Governed orchestration engine — signal → decision → action → audit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {awaiting > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded"
              style={{
                background: 'rgba(139,122,200,0.1)',
                border: '1px solid rgba(139,122,200,0.2)',
              }}
            >
              <UserCheck className="w-3 h-3" style={{ color: '#8b7ac8' }} />
              <span className="text-[10px] font-mono" style={{ color: '#8b7ac8' }}>
                {awaiting} awaiting approval
              </span>
            </div>
          )}
          {isLive ? (
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" style={{ color: ACCENT }} />
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: ACCENT }}
              />
              <span className="text-[10px] font-mono" style={{ color: ACCENT }}>
                Live
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <WifiOff className="w-3 h-3" style={{ color: TEXT.tertiary }} />
              <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>
                Simulation
              </span>
            </div>
          )}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium"
            style={{
              background: 'rgba(212,160,84,0.1)',
              border: '1px solid rgba(212,160,84,0.2)',
              color: ACCENT,
            }}
          >
            <Plus className="w-3 h-3" />
            New Workflow
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div
        className="grid grid-cols-6 gap-px rounded overflow-hidden"
        style={{ background: BORDER.subtle }}
      >
        {(
          [
            {
              label: 'Workflows',
              value: dash?.totalWorkflows ?? workflows.length,
              color: TEXT.primary,
              sub: 'total',
            },
            {
              label: 'Total Runs',
              value: dash?.totalRuns ?? runs.length,
              color: TEXT.primary,
              sub: 'all time',
            },
            {
              label: 'Running',
              value: dash?.runningRuns ?? running,
              color: running > 0 ? ACCENT : TEXT.secondary,
              sub: 'active',
            },
            {
              label: 'Awaiting Approval',
              value: awaiting,
              color: awaiting > 0 ? '#8b7ac8' : TEXT.secondary,
              sub: 'HITL gates',
              pulse: awaiting > 0,
            },
            {
              label: 'Failed',
              value: failed,
              color: failed > 0 ? '#c45a4a' : '#6b8f71',
              sub: 'recent',
            },
            {
              label: 'Success Rate',
              value: `${successRate}%`,
              color: successRate >= 95 ? '#6b8f71' : successRate >= 80 ? '#c8953c' : '#c45a4a',
              sub: '7d avg',
            },
          ] as Array<{
            label: string;
            value: number | string;
            color: string;
            sub: string;
            pulse?: boolean;
          }>
        ).map((kpi) => (
          <div key={kpi.label} className="px-3 py-2.5 relative" style={{ background: BG.surface }}>
            <p
              className="text-[8px] uppercase tracking-widest font-medium mb-1"
              style={{ color: TEXT.muted }}
            >
              {kpi.label}
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-bold font-mono leading-none" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
              {kpi.pulse && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                  style={{ background: '#8b7ac8' }}
                />
              )}
            </div>
            <p className="text-[8px] font-mono mt-0.5" style={{ color: TEXT.muted }}>
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div
        className="flex items-center gap-0.5 p-1 rounded w-fit"
        style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors"
              style={{
                background: tab === t.id ? 'rgba(212,160,84,0.12)' : 'transparent',
                color: tab === t.id ? ACCENT : TEXT.secondary,
                border: tab === t.id ? '1px solid rgba(212,160,84,0.2)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Canvas tab — workflow DAG view */}
      {tab === 'canvas' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3"
                style={{ color: TEXT.tertiary }}
              />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search workflows..."
                className="w-full pl-7 pr-3 py-1.5 text-[11px] rounded outline-none"
                style={{
                  background: BG.surface,
                  border: `1px solid ${BORDER.muted}`,
                  color: TEXT.primary,
                }}
              />
            </div>
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px]"
              style={{
                background: BG.surface,
                border: `1px solid ${BORDER.muted}`,
                color: TEXT.secondary,
              }}
            >
              <Filter className="w-3 h-3" />
              Filter
            </button>
          </div>

          <div className="space-y-2">
            {filteredWorkflows.map((wf) => {
              const isExpanded = expandedWf === wf.id;
              const wfRuns = runs.filter((r) => r.workflowId === wf.id);
              const latestRun = wfRuns[0];
              return (
                <div
                  key={wf.id}
                  className="rounded-lg overflow-hidden"
                  style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-7 h-7 rounded shrink-0 flex items-center justify-center mt-0.5"
                          style={{
                            background: 'rgba(212,160,84,0.08)',
                            border: '1px solid rgba(212,160,84,0.15)',
                          }}
                        >
                          <GitBranch className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[12px] font-semibold text-white truncate">
                              {wf.name}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                              style={{
                                color: wf.status === 'active' ? '#6b8f71' : '#7c85a0',
                                background:
                                  wf.status === 'active'
                                    ? 'rgba(107,143,113,0.1)'
                                    : 'rgba(124,133,160,0.08)',
                                border: `1px solid ${wf.status === 'active' ? 'rgba(107,143,113,0.2)' : 'rgba(124,133,160,0.15)'}`,
                              }}
                            >
                              {wf.status?.toUpperCase()}
                            </span>
                            {wf.triggerType && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                style={{
                                  color: 'rgba(255,255,255,0.3)',
                                  background: 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${BORDER.subtle}`,
                                }}
                              >
                                ⚡ {wf.triggerType}
                              </span>
                            )}
                            {latestRun && <RunBadge status={latestRun.status} />}
                          </div>
                          {wf.description && (
                            <p className="text-[10px] truncate" style={{ color: TEXT.secondary }}>
                              {wf.description}
                            </p>
                          )}
                          <div
                            className="flex items-center gap-3 mt-1.5 text-[9px] font-mono"
                            style={{ color: TEXT.muted }}
                          >
                            {wf.stepCount && <span>{wf.stepCount} steps</span>}
                            {wf.lastRunAt && <span>Last run {fmtAgo(wf.lastRunAt)}</span>}
                            {wfRuns.length > 0 && <span>{wfRuns.length} runs</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExpandedWf(isExpanded ? null : wf.id)}
                          className="p-1.5 rounded text-[10px] transition-colors hover:bg-white/[0.03]"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            color: TEXT.secondary,
                            border: `1px solid ${BORDER.subtle}`,
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => triggerMutation.mutate(wf.id)}
                          disabled={triggerMutation.isPending || wf.status === 'draft'}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium transition-opacity disabled:opacity-40"
                          style={{
                            background: 'rgba(212,160,84,0.1)',
                            border: '1px solid rgba(212,160,84,0.2)',
                            color: ACCENT,
                          }}
                        >
                          <Play className="w-3 h-3" />
                          Run
                        </button>
                      </div>
                    </div>

                    {/* DAG visualization */}
                    {isExpanded && <WorkflowDAGView wf={wf} />}
                  </div>
                </div>
              );
            })}
            {filteredWorkflows.length === 0 && (
              <div
                className="text-center py-10 rounded-lg border"
                style={{
                  color: TEXT.tertiary,
                  borderColor: BORDER.muted,
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                No workflows match "{searchQ}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Run Monitor tab */}
      {tab === 'runs' && (
        <div className="space-y-3">
          <p
            className="text-[9px] uppercase tracking-wider font-semibold"
            style={{ color: TEXT.tertiary }}
          >
            Run History — {runs.length} total · {awaiting} awaiting approval
          </p>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${BORDER.muted}` }}
          >
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ background: BG.elevated, borderBottom: `1px solid ${BORDER.muted}` }}>
                  {['Run ID', 'Workflow', 'Status', 'Actor', 'Started', 'Duration', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 text-[9px] uppercase tracking-wider font-semibold"
                        style={{ color: TEXT.tertiary }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {runs.map((run, idx) => {
                  const wf = workflows.find((w) => w.id === run.workflowId);
                  const dur = fmtDuration(run.startedAt, run.completedAt);
                  const isApproving = run.status === 'awaiting_approval';
                  return (
                    <tr
                      key={run.id}
                      style={{
                        borderBottom:
                          idx < runs.length - 1 ? `1px solid ${BORDER.subtle}` : undefined,
                        background: isApproving
                          ? 'rgba(139,122,200,0.04)'
                          : idx % 2 === 0
                            ? BG.surface
                            : BG.elevated,
                      }}
                    >
                      <td
                        className="px-3 py-2 font-mono text-[10px]"
                        style={{ color: TEXT.tertiary }}
                      >
                        #{run.id}
                      </td>
                      <td className="px-3 py-2 font-medium" style={{ color: TEXT.primary }}>
                        {wf?.name ?? `Workflow #${run.workflowId}`}
                      </td>
                      <td className="px-3 py-2">
                        <RunBadge status={run.status} />
                      </td>
                      <td
                        className="px-3 py-2 font-mono text-[10px]"
                        style={{ color: TEXT.secondary }}
                      >
                        {run.actor ?? 'system'}
                      </td>
                      <td
                        className="px-3 py-2 font-mono text-[10px]"
                        style={{ color: TEXT.secondary }}
                      >
                        {fmtAgo(run.startedAt)}
                      </td>
                      <td
                        className="px-3 py-2 font-mono text-[10px]"
                        style={{ color: TEXT.secondary }}
                      >
                        {dur}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {run.status === 'awaiting_approval' && (
                            <button
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px]"
                              style={{
                                color: '#8b7ac8',
                                background: 'rgba(139,122,200,0.08)',
                                border: '1px solid rgba(139,122,200,0.2)',
                              }}
                            >
                              <UserCheck className="w-2.5 h-2.5" />
                              Approve
                            </button>
                          )}
                          {run.status === 'failed' && (
                            <button
                              onClick={() => retryMutation.mutate(run.id)}
                              disabled={retryMutation.isPending}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] disabled:opacity-50"
                              style={{
                                color: ACCENT,
                                background: 'rgba(212,160,84,0.08)',
                                border: '1px solid rgba(212,160,84,0.2)',
                              }}
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              Retry
                            </button>
                          )}
                          {run.status === 'running' && (
                            <button
                              onClick={() => cancelMutation.mutate(run.id)}
                              disabled={cancelMutation.isPending}
                              className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] disabled:opacity-50"
                              style={{
                                color: '#c45a4a',
                                background: 'rgba(196,90,74,0.08)',
                                border: '1px solid rgba(196,90,74,0.2)',
                              }}
                            >
                              <StopCircle className="w-2.5 h-2.5" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {runs.some((r) => r.errorMessage) && (
            <div className="space-y-2">
              <p
                className="text-[9px] uppercase tracking-wider font-semibold"
                style={{ color: TEXT.tertiary }}
              >
                Error Details
              </p>
              {runs
                .filter((r) => r.errorMessage)
                .map((run) => (
                  <div
                    key={run.id}
                    className="rounded px-3 py-2.5 flex items-start gap-2"
                    style={{
                      background: 'rgba(196,90,74,0.06)',
                      border: '1px solid rgba(196,90,74,0.15)',
                    }}
                  >
                    <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono" style={{ color: '#c45a4a' }}>
                        Run #{run.id}
                      </span>
                      <span className="text-[10px] ml-2" style={{ color: TEXT.secondary }}>
                        {run.errorMessage}
                      </span>
                    </div>
                    <button
                      className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[9px]"
                      style={{
                        color: ACCENT,
                        background: 'rgba(212,160,84,0.08)',
                        border: '1px solid rgba(212,160,84,0.15)',
                      }}
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Retry
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Connectors tab */}
      {tab === 'connectors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Connector Inventory</h2>
              <p className="text-[10px] mt-0.5" style={{ color: TEXT.tertiary }}>
                Active integrations feeding signals into the Alloy orchestration layer
              </p>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium"
              style={{
                background: 'rgba(212,160,84,0.1)',
                border: '1px solid rgba(212,160,84,0.2)',
                color: ACCENT,
              }}
            >
              <Plus className="w-3 h-3" />
              Add Connector
            </button>
          </div>

          <div
            className="grid grid-cols-2 gap-px rounded overflow-hidden"
            style={{ background: BORDER.subtle }}
          >
            {CONNECTORS.map((c) => (
              <div key={c.id} className="p-3 relative" style={{ background: BG.surface }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="text-xl">{c.icon}</div>
                    <div>
                      <div className="text-[11px] font-semibold text-white">{c.name}</div>
                      <div
                        className="text-[8px] font-mono uppercase tracking-wider mt-0.5"
                        style={{ color: TEXT.muted }}
                      >
                        {c.category}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-[8px] font-mono px-1.5 py-px rounded shrink-0"
                    style={{
                      color:
                        c.status === 'connected'
                          ? '#6b8f71'
                          : c.status === 'degraded'
                            ? '#c8953c'
                            : '#7c85a0',
                      background:
                        c.status === 'connected'
                          ? 'rgba(107,143,113,0.08)'
                          : c.status === 'degraded'
                            ? 'rgba(200,149,60,0.08)'
                            : 'rgba(124,133,160,0.08)',
                      border: `1px solid ${c.status === 'connected' ? 'rgba(107,143,113,0.2)' : c.status === 'degraded' ? 'rgba(200,149,60,0.2)' : 'rgba(124,133,160,0.15)'}`,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <div
                  className="mt-2 flex items-center gap-3 text-[8px]"
                  style={{ color: TEXT.muted }}
                >
                  <span className="font-mono">{c.events} events</span>
                  <span>·</span>
                  <span>Last sync {c.lastSync}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg p-4"
            style={{
              background: 'rgba(212,160,84,0.04)',
              border: '1px solid rgba(212,160,84,0.1)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[10px] font-semibold" style={{ color: ACCENT }}>
                Signal Routing
              </span>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
              All connector signals are ingested → normalized → scored by PRISM → routed to relevant
              workflows via policy rules. High-severity signals trigger HITL approval gates before
              any action is taken.
            </p>
          </div>
        </div>
      )}

      {/* Policy Rules tab */}
      {tab === 'policy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Policy Rules</h2>
              <p className="text-[10px] mt-0.5" style={{ color: TEXT.tertiary }}>
                Routing and governance rules that control how signals flow through Alloy
              </p>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium"
              style={{
                background: 'rgba(212,160,84,0.1)',
                border: '1px solid rgba(212,160,84,0.2)',
                color: ACCENT,
              }}
            >
              <Plus className="w-3 h-3" />
              New Rule
            </button>
          </div>

          <div className="space-y-2">
            {POLICY_RULES.map((rule, i) => (
              <div
                key={rule.id}
                className="rounded-lg p-3"
                style={{
                  background: BG.surface,
                  border: `1px solid ${rule.active ? BORDER.muted : BORDER.subtle}`,
                  opacity: rule.active ? 1 : 0.6,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-5 h-5 rounded font-mono text-[9px] font-bold shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(212,160,84,0.08)',
                      color: ACCENT,
                      border: '1px solid rgba(212,160,84,0.15)',
                    }}
                  >
                    {rule.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-medium text-white">{rule.name}</span>
                      <span
                        className="text-[8px] px-1.5 py-px rounded font-mono shrink-0"
                        style={{
                          color: rule.active ? '#6b8f71' : TEXT.muted,
                          background: rule.active
                            ? 'rgba(107,143,113,0.08)'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${rule.active ? 'rgba(107,143,113,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {rule.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[9px]">
                      <div>
                        <div
                          className="font-mono uppercase tracking-wider mb-0.5"
                          style={{ color: TEXT.muted }}
                        >
                          Scope
                        </div>
                        <div style={{ color: TEXT.secondary }}>{rule.scope}</div>
                      </div>
                      <div>
                        <div
                          className="font-mono uppercase tracking-wider mb-0.5"
                          style={{ color: TEXT.muted }}
                        >
                          Condition
                        </div>
                        <div className="font-mono" style={{ color: '#d4a054' }}>
                          {rule.condition}
                        </div>
                      </div>
                      <div>
                        <div
                          className="font-mono uppercase tracking-wider mb-0.5"
                          style={{ color: TEXT.muted }}
                        >
                          Action
                        </div>
                        <div style={{ color: TEXT.secondary }}>{rule.action}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    className="shrink-0 text-[9px] px-2.5 py-1.5 rounded font-medium hover:opacity-80"
                    style={{
                      color: TEXT.tertiary,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immutable Event Log tab */}
      {tab === 'log' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Immutable Event Log</h2>
              <p className="text-[10px] mt-0.5" style={{ color: TEXT.tertiary }}>
                Append-only audit trail of all orchestration events — tamper-evident
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1.5 rounded"
              style={{
                color: '#6b8f71',
                background: 'rgba(107,143,113,0.06)',
                border: '1px solid rgba(107,143,113,0.15)',
              }}
            >
              <Shield className="w-3 h-3" />
              Tamper-evident
            </div>
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${BORDER.muted}` }}
          >
            <div
              className="px-3 py-2"
              style={{ background: BG.elevated, borderBottom: `1px solid ${BORDER.muted}` }}
            >
              <div
                className="grid grid-cols-5 gap-3 text-[9px] uppercase tracking-wider font-semibold"
                style={{ color: TEXT.tertiary }}
              >
                <span>Timestamp</span>
                <span>Level</span>
                <span>Actor</span>
                <span className="col-span-2">Event</span>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {AUDIT_LOG.map((entry, i) => {
                const levelColor =
                  entry.level === 'error'
                    ? '#c45a4a'
                    : entry.level === 'warn'
                      ? '#c8953c'
                      : TEXT.tertiary;
                return (
                  <div key={entry.id} className="px-3 py-2 hover:bg-white/[0.01] transition-colors">
                    <div className="grid grid-cols-5 gap-3 text-[10px]">
                      <span className="font-mono" style={{ color: TEXT.muted }}>
                        {new Date(entry.ts).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <span
                        className="font-mono uppercase text-[8px] font-bold"
                        style={{ color: levelColor }}
                      >
                        {entry.level}
                      </span>
                      <span className="font-mono" style={{ color: TEXT.tertiary }}>
                        {entry.actor}
                      </span>
                      <div className="col-span-2">
                        <span style={{ color: TEXT.secondary }}>{entry.event}</span>
                        <div className="text-[8px] mt-0.5 font-mono" style={{ color: TEXT.muted }}>
                          {entry.workflow} · Run #{entry.runId}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[9px] font-mono text-center py-2" style={{ color: TEXT.muted }}>
            {AUDIT_LOG.length} entries · Last updated {fmtAgo(AUDIT_LOG[0]?.ts)} · Append-only ·
            Cryptographically signed
          </div>
        </div>
      )}
    </div>
  );
}
