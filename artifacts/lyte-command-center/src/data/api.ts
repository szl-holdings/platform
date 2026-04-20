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

export function useOwnershipDrift() {
  return useQuery({
    queryKey: ['lyte', 'ownership-drift'],
    queryFn: () =>
      getJson<{ items: DriftItem[]; history: DriftHistoryPoint[] }>('/api/lyte/ownership-drift'),
  });
}

export function usePressureMap() {
  return useQuery({
    queryKey: ['lyte', 'pressure-map'],
    queryFn: () => getJson<{ cells: PressureCell[] }>('/api/lyte/pressure-map'),
  });
}

export function useActionDebt() {
  return useQuery({
    queryKey: ['lyte', 'action-debt'],
    queryFn: () =>
      getJson<{ items: DebtItem[]; history: DebtHistoryPoint[] }>('/api/lyte/action-debt'),
  });
}

export function useDecisionReplay() {
  return useQuery({
    queryKey: ['lyte', 'decision-replay'],
    queryFn: () => getJson<{ scenarios: ReplayScenario[] }>('/api/lyte/decision-replay'),
  });
}

export function useBoardView() {
  return useQuery({
    queryKey: ['lyte', 'board-view'],
    queryFn: () => getJson<{ metrics: BoardMetric[]; risks: BoardRisk[] }>('/api/lyte/board-view'),
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
