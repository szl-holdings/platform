import { useQuery } from '@tanstack/react-query';
import type {
  BoardMetric,
  BoardRisk,
  DebtItem,
  DriftItem,
  PressureCell,
  ReplayScenario,
} from './seed';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  return res.json() as Promise<T>;
}

export interface DriftHistoryPoint {
  date: string;
  count: number;
}
export interface DebtHistoryPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
}

// Polling intervals (ms) — critical surfaces refresh within seconds so operators
// see new signals/workflow events as Continuum emits them; secondary surfaces poll
// less aggressively to limit network churn.
const LIVE_REFRESH_CRITICAL_MS = 5_000;
const LIVE_REFRESH_STANDARD_MS = 15_000;
const LIVE_REFRESH_SLOW_MS = 30_000;

export function useOwnershipDrift() {
  return useQuery({
    queryKey: ['kora', 'ownership-drift'],
    queryFn: () =>
      getJson<{ items: DriftItem[]; history: DriftHistoryPoint[] }>('/api/lyte/ownership-drift'),
    refetchInterval: LIVE_REFRESH_STANDARD_MS,
    refetchOnWindowFocus: true,
  });
}

export function usePressureMap() {
  return useQuery({
    queryKey: ['kora', 'pressure-map'],
    queryFn: () => getJson<{ cells: PressureCell[] }>('/api/lyte/pressure-map'),
    refetchInterval: LIVE_REFRESH_CRITICAL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useActionDebt() {
  return useQuery({
    queryKey: ['kora', 'action-debt'],
    queryFn: () =>
      getJson<{ items: DebtItem[]; history: DebtHistoryPoint[] }>('/api/lyte/action-debt'),
    refetchInterval: LIVE_REFRESH_CRITICAL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useDecisionReplay() {
  return useQuery({
    queryKey: ['kora', 'decision-replay'],
    queryFn: () => getJson<{ scenarios: ReplayScenario[] }>('/api/lyte/decision-replay'),
    refetchInterval: LIVE_REFRESH_SLOW_MS,
    refetchOnWindowFocus: true,
  });
}

export function useBoardView() {
  return useQuery({
    queryKey: ['kora', 'board-view'],
    queryFn: () => getJson<{ metrics: BoardMetric[]; risks: BoardRisk[] }>('/api/lyte/board-view'),
    refetchInterval: LIVE_REFRESH_STANDARD_MS,
    refetchOnWindowFocus: true,
  });
}

export interface WorkflowHealthItem {
  id: string;
  name: string;
  type: string;
  owner: string;
  status: 'on_track' | 'at_risk' | 'stalled' | 'blocked' | 'complete';
  progress: number;
  stalledDays?: number;
  blockerCount: number;
  valueAtRiskUsd?: number;
  bottleneckStep?: string | null;
  bottleneckOwner?: string | null;
  linkedEntityId?: string | null;
  linkedEntityLabel?: string | null;
  slaDeadline?: string;
  slaBreach: boolean;
  proofRef: string;
  lastActivity: string;
  lastReviewedAt?: string;
  driftDays?: number;
}

export interface WorkflowHealthSummary {
  total: number;
  slaBreaches: number;
  blocked: number;
  stalled: number;
  totalValueAtRiskUsd: number;
  openDriftItems: number;
  openDebtItems: number;
}

export function useWorkflowHealth() {
  return useQuery({
    queryKey: ['kora', 'workflow-health'],
    queryFn: () =>
      getJson<{ workflows: WorkflowHealthItem[]; summary: WorkflowHealthSummary }>(
        '/api/lyte/workflow-health',
      ),
    refetchInterval: 60_000,
  });
}

export interface EntityGraphNode {
  id: string;
  label: string;
  type: string;
  status: string;
  sublabel?: string | null;
  policyState: string;
  confidence: number;
  freshness: string;
  x: number;
  y: number;
  metadata: Record<string, unknown>;
}

export interface EntityGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  status: string;
  strength: string;
  proofRef?: string | null;
}

export interface EntityGraphProvenance {
  source: string;
  fetchedAt: string;
  nodeCount: number;
  edgeCount: number;
}

export function useEntityGraph() {
  return useQuery({
    queryKey: ['kora', 'entity-graph'],
    queryFn: () =>
      getJson<{
        nodes: EntityGraphNode[];
        edges: EntityGraphEdge[];
        provenance: EntityGraphProvenance;
      }>('/api/lyte/entity-graph'),
    staleTime: 30_000,
  });
}

// ─── agents-* package surfaces ───────────────────────────────────────────────
// These hooks read from the new /api/agents/* endpoints backed by
// agents-core/step-log, approvals-inbox, and agents-evals suite builders.

export interface StepLogEntryDTO {
  runId: string;
  stepId: string;
  stepName: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  durationMs?: number;
  data?: Record<string, unknown>;
  timestamp: number;
}

export function useAgentRunStepLog(runId: string | undefined, opts?: { intervalMs?: number }) {
  return useQuery({
    queryKey: ['agents', 'step-log', runId ?? ''],
    enabled: Boolean(runId),
    refetchInterval: opts?.intervalMs ?? 4000,
    queryFn: () =>
      getJson<{ runId: string; count: number; entries: StepLogEntryDTO[] }>(
        `/api/agents/runs/${encodeURIComponent(runId ?? '')}/step-log`,
      ),
  });
}

export interface PendingApprovalDTO {
  id: string;
  runId: string;
  stepId: string;
  stepName: string;
  toolId?: string;
  action: string;
  justification: string;
  projectedImpact: string;
  projectedRisk: string;
  requestedBy: string;
  domain: string;
  surface: string;
  submittedAt: number;
  expiresAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'timed_out' | 'escalated';
}

export function usePendingApprovals(filter?: {
  runId?: string;
  domain?: string;
  intervalMs?: number;
}) {
  const params = new URLSearchParams();
  if (filter?.runId) params.set('runId', filter.runId);
  if (filter?.domain) params.set('domain', filter.domain);
  const qs = params.toString();
  return useQuery({
    queryKey: ['agents', 'approvals', filter?.runId ?? '', filter?.domain ?? ''],
    refetchInterval: filter?.intervalMs ?? 5000,
    queryFn: () =>
      getJson<{ count: number; pending: PendingApprovalDTO[] }>(
        `/api/agents/approvals/pending${qs ? `?${qs}` : ''}`,
      ),
  });
}

export interface AutoSuiteDTO {
  suiteId: string;
  name: string;
  description?: string;
  domain: string;
  evalType: string;
  cases: Array<{ id: string; label: string; tags?: string[] }>;
  tags?: string[];
  version: number;
}

export function useAutoEvalSuites() {
  return useQuery({
    queryKey: ['agents', 'auto-suites'],
    queryFn: () =>
      getJson<{
        toolSuites: AutoSuiteDTO[];
        promptSuites: AutoSuiteDTO[];
        totals: { tools: number; prompts: number; cases: number };
      }>('/api/agents/evals/auto-suites'),
  });
}
