/**
 * Pure logic extracted from the Run Review screen.
 * Imported by both the screen and its tests so regressions are caught.
 */

export type RunState = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowRunLike {
  id: number;
  workflowId: number | null;
  state: RunState | string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  durationMs?: number | null;
  createdAt: string;
}

export interface RunStepLike {
  id: number | string;
  name: string;
  state: string;
  durationMs?: number | null;
  output?: Record<string, unknown> | null;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface RunStepsResponseLike {
  run: WorkflowRunLike;
  workflow?: { name?: string; id?: number };
  steps: RunStepLike[];
}

export interface RunDetailLike extends WorkflowRunLike {
  steps?: RunStepLike[];
  workflowName?: string;
}

export type FilterState = 'all' | 'running' | 'failed' | 'completed';

export const RUNS_LIST_PATH = '/api/alloy/runs?limit=30';

export function runDetailPath(runId: number): string {
  return `/api/alloy/runs/${runId}`;
}

export function runStepsPath(runId: number): string {
  return `/api/alloy/runs/${runId}/steps`;
}

export function normalizeRuns<T>(raw: { data: T[] } | T[] | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return (raw as { data: T[] }).data ?? [];
}

export function filterByState<T extends { state: string }>(runs: T[], f: FilterState): T[] {
  return f === 'all' ? runs : runs.filter((r) => r.state === f);
}

export function computeRunStats(runs: ReadonlyArray<{ state: string }>) {
  return {
    total: runs.length,
    running: runs.filter((r) => r.state === 'running').length,
    failed: runs.filter((r) => r.state === 'failed').length,
    completed: runs.filter((r) => r.state === 'completed').length,
  };
}

/**
 * Loads the run detail + step trace in parallel and merges them. Degrades
 * gracefully: if either request fails, returns the best-available base run
 * and omits unavailable fields.
 */
export async function loadRunDetail(
  run: WorkflowRunLike,
  apiFetch: (path: string) => Promise<unknown>,
): Promise<RunDetailLike> {
  const [detailRaw, stepsRaw] = await Promise.allSettled([
    apiFetch(runDetailPath(run.id)),
    apiFetch(runStepsPath(run.id)),
  ]);

  const baseRun: WorkflowRunLike =
    detailRaw.status === 'fulfilled'
      ? ((detailRaw.value as { data: WorkflowRunLike })?.data ??
        (detailRaw.value as WorkflowRunLike))
      : { ...run };

  let steps: RunStepLike[] | undefined;
  let workflowName: string | undefined;
  if (stepsRaw.status === 'fulfilled') {
    const stepsData =
      (stepsRaw.value as { data: RunStepsResponseLike })?.data ??
      (stepsRaw.value as RunStepsResponseLike);
    steps = Array.isArray(stepsData?.steps) ? stepsData.steps : undefined;
    workflowName = stepsData?.workflow?.name;
  }

  return { ...baseRun, steps, workflowName };
}

export function buildReplayUrl(apiBase: string | null | undefined, runId: number): string {
  if (!apiBase) return `/command/#run/${runId}`;
  return `${apiBase.replace(/\/api\/?$/, '')}/command/#run/${runId}`;
}

export function formatDuration(ms?: number | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  const secs = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${secs}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatRelative(iso?: string | null, now: number = Date.now()): string {
  if (!iso) return '—';
  const ms = now - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
