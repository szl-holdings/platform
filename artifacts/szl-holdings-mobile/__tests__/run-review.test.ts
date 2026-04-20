/**
 * End-to-end logic tests for the Run Review screen.
 *
 * Imports the production logic module used at runtime by
 * `app/(shell)/intelligence/run-review.tsx`, particularly `loadRunDetail`
 * (the exact code path the screen uses for its parallel detail+steps fetch
 * with graceful degradation) and `buildReplayUrl` for the web replay link.
 */
import {
  buildReplayUrl,
  computeRunStats,
  filterByState,
  formatDuration,
  formatRelative,
  loadRunDetail,
  normalizeRuns,
  RUNS_LIST_PATH,
  runDetailPath,
  runStepsPath,
  type WorkflowRunLike,
} from '../app/(shell)/intelligence/run-review.logic';

const baseRun: WorkflowRunLike = {
  id: 7,
  workflowId: 1,
  state: 'failed',
  startedAt: '2026-04-20T11:00:00.000Z',
  completedAt: '2026-04-20T11:01:00.000Z',
  errorMessage: 'boom',
  retryCount: 1,
  maxRetries: 3,
  durationMs: 60_000,
  createdAt: '2026-04-20T11:00:00.000Z',
};

describe('run-review endpoints', () => {
  it('lists runs from the alloy runs endpoint with a limit', () => {
    expect(RUNS_LIST_PATH).toBe('/api/alloy/runs?limit=30');
  });

  it('exposes per-run detail and steps endpoints', () => {
    expect(runDetailPath(42)).toBe('/api/alloy/runs/42');
    expect(runStepsPath(42)).toBe('/api/alloy/runs/42/steps');
  });
});

describe('run-review list normalization', () => {
  it('unwraps { data: [...] } envelope from the runs endpoint', () => {
    expect(normalizeRuns<WorkflowRunLike>({ data: [baseRun] })).toEqual([baseRun]);
  });

  it('accepts plain arrays and empty responses', () => {
    expect(normalizeRuns<WorkflowRunLike>([baseRun])).toEqual([baseRun]);
    expect(normalizeRuns(undefined)).toEqual([]);
  });
});

describe('run-review filter + stats', () => {
  const runs: WorkflowRunLike[] = [
    { ...baseRun, id: 1, state: 'running' },
    { ...baseRun, id: 2, state: 'running' },
    { ...baseRun, id: 3, state: 'failed' },
    { ...baseRun, id: 4, state: 'completed' },
    { ...baseRun, id: 5, state: 'completed' },
    { ...baseRun, id: 6, state: 'completed' },
  ];

  it("returns all runs for the 'all' filter", () => {
    expect(filterByState(runs, 'all')).toHaveLength(6);
  });

  it('narrows to the requested state for each filter chip', () => {
    expect(filterByState(runs, 'running').map((r) => r.id)).toEqual([1, 2]);
    expect(filterByState(runs, 'failed').map((r) => r.id)).toEqual([3]);
    expect(filterByState(runs, 'completed').map((r) => r.id)).toEqual([4, 5, 6]);
  });

  it('computes aggregate stats for the run-review header', () => {
    expect(computeRunStats(runs)).toEqual({ total: 6, running: 2, failed: 1, completed: 3 });
  });
});

describe('run-review loadRunDetail — happy path', () => {
  it('merges parallel detail + steps responses (envelope style)', async () => {
    const steps = [{ id: 's1', name: 'ingest', state: 'completed', durationMs: 100 }];
    const api = jest.fn(async (path: string) => {
      if (path === runDetailPath(baseRun.id))
        return { data: { ...baseRun, errorMessage: 'details' } };
      if (path === runStepsPath(baseRun.id))
        return { data: { steps, workflow: { name: 'Ingest Pipeline' } } };
      throw new Error('unexpected path: ' + path);
    });

    const detail = await loadRunDetail(baseRun, api);

    expect(api).toHaveBeenCalledTimes(2);
    expect(api).toHaveBeenCalledWith('/api/alloy/runs/7');
    expect(api).toHaveBeenCalledWith('/api/alloy/runs/7/steps');

    expect(detail.errorMessage).toBe('details');
    expect(detail.steps).toEqual(steps);
    expect(detail.workflowName).toBe('Ingest Pipeline');
  });

  it('accepts direct (non-enveloped) payload shapes too', async () => {
    const steps = [{ id: 's1', name: 'step-1', state: 'completed' }];
    const api = jest.fn(async (path: string) => {
      if (path === runDetailPath(baseRun.id)) return { ...baseRun };
      if (path === runStepsPath(baseRun.id))
        return { run: baseRun, workflow: { name: 'W' }, steps };
      throw new Error();
    });
    const detail = await loadRunDetail(baseRun, api);
    expect(detail.steps).toEqual(steps);
    expect(detail.workflowName).toBe('W');
  });

  it('fires the detail and steps requests in parallel (not sequential)', async () => {
    let inflight = 0;
    let maxInflight = 0;
    const api = jest.fn(async () => {
      inflight++;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((r) => setTimeout(r, 10));
      inflight--;
      return { data: { steps: [] } };
    });
    await loadRunDetail(baseRun, api);
    expect(maxInflight).toBe(2);
  });
});

describe('run-review loadRunDetail — graceful degradation', () => {
  it('returns the base run when the detail request fails', async () => {
    const api = jest.fn(async (path: string) => {
      if (path === runDetailPath(baseRun.id)) throw new Error('detail 500');
      return { data: { steps: [{ id: 's1', name: 'n', state: 'completed' }] } };
    });
    const detail = await loadRunDetail(baseRun, api);
    expect(detail.id).toBe(baseRun.id);
    expect(detail.state).toBe(baseRun.state);
    expect(detail.steps).toHaveLength(1);
  });

  it('omits steps when the steps request fails', async () => {
    const api = jest.fn(async (path: string) => {
      if (path === runStepsPath(baseRun.id)) throw new Error('steps 500');
      return { data: { ...baseRun, errorMessage: 'ok' } };
    });
    const detail = await loadRunDetail(baseRun, api);
    expect(detail.errorMessage).toBe('ok');
    expect(detail.steps).toBeUndefined();
    expect(detail.workflowName).toBeUndefined();
  });

  it('returns a usable detail object when both requests fail', async () => {
    const api = jest.fn(async () => {
      throw new Error('offline');
    });
    const detail = await loadRunDetail(baseRun, api);
    expect(detail.id).toBe(baseRun.id);
    expect(detail.steps).toBeUndefined();
  });
});

describe('run-review replay URL', () => {
  it('points at /command/#run/:id on the same origin (strips trailing /api)', () => {
    expect(buildReplayUrl('https://app.example.com/api', 42)).toBe(
      'https://app.example.com/command/#run/42',
    );
    expect(buildReplayUrl('https://app.example.com', 42)).toBe(
      'https://app.example.com/command/#run/42',
    );
  });

  it('falls back to a relative URL when no API base is configured', () => {
    expect(buildReplayUrl(null, 42)).toBe('/command/#run/42');
    expect(buildReplayUrl('', 42)).toBe('/command/#run/42');
  });
});

describe('run-review formatters', () => {
  it('formats durations with appropriate units', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(250)).toBe('250ms');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(90_000)).toBe('1.5m');
  });

  it("formats relative time from a fixed 'now' reference", () => {
    const now = new Date('2026-04-20T12:00:00.000Z').getTime();
    expect(formatRelative(null, now)).toBe('—');
    expect(formatRelative('2026-04-20T11:59:45.000Z', now)).toBe('just now');
    expect(formatRelative('2026-04-20T11:45:00.000Z', now)).toBe('15m ago');
    expect(formatRelative('2026-04-20T09:00:00.000Z', now)).toBe('3h ago');
    expect(formatRelative('2026-04-18T12:00:00.000Z', now)).toBe('2d ago');
  });
});
