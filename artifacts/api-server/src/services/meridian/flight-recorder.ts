/**
 * Alloy Meridian — Business Flight Recorder
 *
 * Logs model calls, forecasts, tool actions, sources, approvals,
 * outcomes, and rollback paths. Provides a tamper-evident audit
 * trail for all Meridian operations.
 */

export type FlightRecordType =
  | 'model_call'
  | 'forecast'
  | 'tool_action'
  | 'approval_request'
  | 'approval_decision'
  | 'outcome'
  | 'rollback';

export type FlightRecordStatus =
  | 'started'
  | 'completed'
  | 'failed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'rolled_back';

export interface FlightRecord {
  id: string;
  type: FlightRecordType;
  status: FlightRecordStatus;
  agent?: string;
  model?: string;
  lane?: string;
  tool?: string;
  action?: string;
  input?: unknown;
  output?: unknown;
  sources: string[];
  confidence?: number;
  latencyMs?: number;
  tokensUsed?: number;
  cost?: number;
  approvedBy?: string;
  rollbackPath?: string;
  outcome?: string;
  outcomeAt?: string;
  tenantId?: number;
  userId?: number;
  correlationId: string;
  recordedAt: string;
}

export interface FlightRecorderState {
  records: FlightRecord[];
  totalRecords: number;
  windowStart: string;
  windowEnd: string;
  summary: {
    modelCalls: number;
    forecasts: number;
    toolActions: number;
    approvalsPending: number;
    approvalsGranted: number;
    approvalsRejected: number;
    rollbacks: number;
    totalCost: number;
    avgLatencyMs: number;
  };
}

const SAMPLE_RECORDS: Omit<FlightRecord, 'id' | 'recordedAt' | 'correlationId'>[] = [
  {
    type: 'model_call',
    status: 'completed',
    agent: 'deepseek-strategist',
    model: 'deepseek-r1',
    lane: 'strategy',
    input: { prompt: 'Analyze Q3 pipeline velocity signals' },
    output: { analysis: 'Pipeline velocity down 12% vs plan...' },
    sources: ['analytics-engine', 'crm-signals'],
    confidence: 0.91,
    latencyMs: 2340,
    tokensUsed: 4200,
    cost: 0.012,
  },
  {
    type: 'forecast',
    status: 'completed',
    agent: 'forecast-council',
    model: 'chronos-2',
    lane: 'forecasting',
    input: { metric: 'revenue_pipeline_velocity', horizon: 30 },
    output: { winner: 'chronos-2', consensusPoints: 30 },
    sources: ['billing-api', 'crm-signals'],
    confidence: 0.88,
    latencyMs: 1850,
  },
  {
    type: 'tool_action',
    status: 'pending_approval',
    agent: 'operator-swarm',
    tool: 'linear',
    action: 'create_issue',
    input: { title: 'Patch critical CVEs — P0', team: 'security', priority: 'urgent' },
    sources: ['security-scanner', 'nvd-feed'],
    confidence: 0.95,
    rollbackPath: 'Delete created issue via Linear API.',
  },
  {
    type: 'approval_request',
    status: 'pending_approval',
    agent: 'governance-sentinel',
    tool: 'linear',
    action: 'create_issue',
    sources: ['mcp-governance'],
    rollbackPath: 'No action taken until approved.',
  },
  {
    type: 'model_call',
    status: 'completed',
    agent: 'signal-cartographer',
    model: 'deepseek-v4-flash',
    lane: 'fast-ops',
    input: { task: 'Build signal graph snapshot' },
    output: { nodes: 12, edges: 6, healthScore: 0.75 },
    sources: ['github', 'ci-cd', 'analytics', 'payments'],
    confidence: 0.87,
    latencyMs: 890,
    tokensUsed: 1800,
    cost: 0.003,
  },
  {
    type: 'tool_action',
    status: 'approved',
    agent: 'operator-swarm',
    tool: 'sentry',
    action: 'query_errors',
    input: { project: 'api-server', timeRange: '24h' },
    output: { errorCount: 47, topError: 'UnhandledPromiseRejection' },
    sources: ['sentry-mcp'],
    approvedBy: 'system',
    confidence: 0.99,
    latencyMs: 340,
  },
  {
    type: 'outcome',
    status: 'completed',
    agent: 'deepseek-strategist',
    input: { recommendation: 'rec-001', decision: 'execute_now' },
    outcome: 'Memory allocation upgraded. OOM risk eliminated. Latency improved 15%.',
    outcomeAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    sources: ['infra-metrics', 'incident-log'],
    confidence: 0.94,
  },
];

let _recordStore: FlightRecord[] = [];

function ensureBootstrapped() {
  if (_recordStore.length === 0) {
    const now = Date.now();
    _recordStore = SAMPLE_RECORDS.map((r, idx) => ({
      ...r,
      id: `fr-${String(idx + 1).padStart(4, '0')}`,
      correlationId: `cor-${Math.random().toString(36).slice(2, 10)}`,
      recordedAt: new Date(now - (SAMPLE_RECORDS.length - idx) * 600_000).toISOString(),
    }));
  }
}

export class BusinessFlightRecorder {
  getState(limit = 50, typeFilter?: FlightRecordType): FlightRecorderState {
    ensureBootstrapped();
    const filtered = typeFilter
      ? _recordStore.filter((r) => r.type === typeFilter)
      : _recordStore;

    const records = filtered.slice(-limit).reverse();

    const modelCalls = filtered.filter((r) => r.type === 'model_call').length;
    const forecasts = filtered.filter((r) => r.type === 'forecast').length;
    const toolActions = filtered.filter((r) => r.type === 'tool_action').length;
    const approvalsPending = filtered.filter(
      (r) => r.type === 'approval_request' && r.status === 'pending_approval',
    ).length;
    const approvalsGranted = filtered.filter(
      (r) => r.type === 'approval_decision' && r.status === 'approved',
    ).length;
    const approvalsRejected = filtered.filter(
      (r) => r.type === 'approval_decision' && r.status === 'rejected',
    ).length;
    const rollbacks = filtered.filter((r) => r.type === 'rollback').length;
    const totalCost = filtered.reduce((s, r) => s + (r.cost ?? 0), 0);
    const latencies = filtered.filter((r) => r.latencyMs).map((r) => r.latencyMs as number);
    const avgLatencyMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
        : 0;

    const sorted = [...filtered].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );

    return {
      records,
      totalRecords: filtered.length,
      windowStart: sorted[0]?.recordedAt ?? new Date().toISOString(),
      windowEnd: sorted[sorted.length - 1]?.recordedAt ?? new Date().toISOString(),
      summary: {
        modelCalls,
        forecasts,
        toolActions,
        approvalsPending,
        approvalsGranted,
        approvalsRejected,
        rollbacks,
        totalCost: Math.round(totalCost * 10_000) / 10_000,
        avgLatencyMs,
      },
    };
  }

  appendRecord(record: Omit<FlightRecord, 'id' | 'recordedAt' | 'correlationId'>): FlightRecord {
    ensureBootstrapped();
    const newRecord: FlightRecord = {
      ...record,
      id: `fr-${String(_recordStore.length + 1).padStart(4, '0')}`,
      correlationId: `cor-${Math.random().toString(36).slice(2, 10)}`,
      recordedAt: new Date().toISOString(),
    };
    _recordStore.push(newRecord);
    return newRecord;
  }
}

export const flightRecorder = new BusinessFlightRecorder();
