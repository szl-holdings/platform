/**
 * HOURLY_MARKET_DATA_REFRESH scheduled job — unit tests (Task #3449)
 *
 * Covers:
 *  - Success path: runCount increments, lastStatus="completed", telemetry emitted
 *  - Failure path: failCount increments, lastStatus="failed", error rethrown
 *  - Health / registry: job exists in registry with expected metadata
 *  - lastRunAt is set when the job executes
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted handler registry — captured during durableJobQueue.register() calls
// which happen at module load time.
// ---------------------------------------------------------------------------

const { handlerMap, recordBusinessEventSpy } = vi.hoisted(() => {
  const handlerMap = new Map<string, (job: { id: string }) => Promise<void>>();
  const recordBusinessEventSpy = vi.fn();
  return { handlerMap, recordBusinessEventSpy };
});

// ---------------------------------------------------------------------------
// Module mocks — declared before any import so vitest hoists them correctly
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/forge-runtime', () => ({
  durableJobQueue: {
    register: (type: string, handler: (job: { id: string }) => Promise<void>) => {
      handlerMap.set(type, handler);
    },
    enqueue: vi.fn(async () => ({ id: 'mock-queued-job' })),
  },
  enqueueNamedJob: vi.fn(async () => ({ id: 'mock-queued-job' })),
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordBusinessEvent: recordBusinessEventSpy,
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
    recordMutation: vi.fn(),
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// ---------------------------------------------------------------------------
// market-data-adapter mock — controlled per test via mockAdapterImpl
// ---------------------------------------------------------------------------

const mockAdapterImpl = {
  getMarketData: vi.fn(),
  invalidateMarketCache: vi.fn(),
  validateMarketDataConfig: vi.fn(() => false),
};

vi.mock('../lib/market-data-adapter', () => mockAdapterImpl);

// ---------------------------------------------------------------------------
// Helper — build a minimal seed-like snapshot
// ---------------------------------------------------------------------------

function makeSeedSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    provider: 'seed',
    providerConfigured: false,
    refreshedAt: new Date().toISOString(),
    nextRefreshAt: new Date(Date.now() + 3_600_000).toISOString(),
    indicators: [
      {
        id: 'spy',
        label: 'S&P 500 ETF',
        category: 'equity',
        provider: 'seed',
        delayWindow: 'seed',
        asOf: new Date().toISOString(),
        dataQuality: 'seed',
        isStale: true,
        value: 500,
        formattedValue: '500.00',
        staleThresholdHours: 2,
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Import the module under test AFTER mocks are declared — this triggers all
// durableJobQueue.register() calls at the top level of scheduled-jobs.ts,
// populating handlerMap.
// ---------------------------------------------------------------------------

let scheduledJobs: typeof import('../lib/scheduled-jobs.js');

const HOURLY_MARKET_DATA_REFRESH = 'hourly_market_data_refresh';

describe('HOURLY_MARKET_DATA_REFRESH scheduled job', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockAdapterImpl.invalidateMarketCache.mockReturnValue(undefined);
    vi.resetModules();
    scheduledJobs = await import('../lib/scheduled-jobs.js');
  });

  afterEach(() => {
    vi.resetModules();
  });

  // -------------------------------------------------------------------------
  // Registry presence
  // -------------------------------------------------------------------------

  describe('job registry', () => {
    it('HOURLY_MARKET_DATA_REFRESH is present in the named job registry', () => {
      const registry = scheduledJobs.getJobRegistry();
      const entry = registry.find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(entry, 'job entry should exist in registry').toBeDefined();
    });

    it('registry entry has schedule=hourly', () => {
      const registry = scheduledJobs.getJobRegistry();
      const entry = registry.find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(entry?.schedule).toBe('hourly');
    });

    it('registry entry starts with runCount=0 and failCount=0', () => {
      const registry = scheduledJobs.getJobRegistry();
      const entry = registry.find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(entry?.runCount).toBe(0);
      expect(entry?.failCount).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Success path
  // -------------------------------------------------------------------------

  describe('success path', () => {
    it('handler is registered with durableJobQueue', () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      expect(handler, 'handler should be registered').toBeDefined();
      expect(typeof handler).toBe('function');
    });

    it('runCount increments by 1 after successful execution', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      const snapshot = makeSeedSnapshot();
      mockAdapterImpl.getMarketData.mockResolvedValue(snapshot);

      const before = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH)?.runCount ?? 0;
      await handler({ id: 'test-job-success-1' });
      const after = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH)?.runCount ?? -1;

      expect(after).toBe(before + 1);
    });

    it('lastStatus is "completed" after successful execution', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockResolvedValue(makeSeedSnapshot());
      await handler({ id: 'test-job-success-2' });

      const entry = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(entry?.lastStatus).toBe('completed');
    });

    it('lastDurationMs is set after successful execution', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockResolvedValue(makeSeedSnapshot());
      await handler({ id: 'test-job-success-3' });

      const entry = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(typeof entry?.lastDurationMs).toBe('number');
      expect(entry?.lastDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('lastRunAt is populated after successful execution', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      const before = Date.now();
      mockAdapterImpl.getMarketData.mockResolvedValue(makeSeedSnapshot());
      await handler({ id: 'test-job-success-4' });

      const entry = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(entry?.lastRunAt).toBeGreaterThanOrEqual(before);
    });

    it('recordBusinessEvent is called with type=hourly_market_data_refresh_completed', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockResolvedValue(makeSeedSnapshot());
      await handler({ id: 'test-job-success-5' });

      expect(recordBusinessEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'hourly_market_data_refresh_completed', success: true }),
      );
    });

    it('telemetry event carries indicator count and provider', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      const snapshot = makeSeedSnapshot();
      mockAdapterImpl.getMarketData.mockResolvedValue(snapshot);
      await handler({ id: 'test-job-success-6' });

      const [call] = recordBusinessEventSpy.mock.calls as Array<[Record<string, unknown>]>;
      const meta = call[0].metadata as Record<string, unknown>;
      expect(meta.count).toBe(snapshot.indicators.length);
      expect(meta.provider).toBe('seed');
    });

    it('failCount stays at 0 after a successful execution', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockResolvedValue(makeSeedSnapshot());
      await handler({ id: 'test-job-success-7' });

      const entry = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(entry?.failCount).toBe(0);
    });

    it('invalidateMarketCache is called before getMarketData', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      const callOrder: string[] = [];
      mockAdapterImpl.invalidateMarketCache.mockImplementation(() => { callOrder.push('invalidate'); });
      mockAdapterImpl.getMarketData.mockImplementation(async () => { callOrder.push('getMarketData'); return makeSeedSnapshot(); });

      await handler({ id: 'test-job-success-8' });

      expect(callOrder[0]).toBe('invalidate');
      expect(callOrder[1]).toBe('getMarketData');
    });
  });

  // -------------------------------------------------------------------------
  // Failure path
  // -------------------------------------------------------------------------

  describe('failure path', () => {
    it('failCount increments by 1 when getMarketData throws', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockRejectedValue(new Error('Simulated provider failure'));

      const before = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH)?.failCount ?? 0;
      await expect(handler({ id: 'test-job-fail-1' })).rejects.toThrow('Simulated provider failure');
      const after = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH)?.failCount ?? -1;

      expect(after).toBe(before + 1);
    });

    it('lastStatus is "failed" when getMarketData throws', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockRejectedValue(new Error('Simulated provider failure'));
      await expect(handler({ id: 'test-job-fail-2' })).rejects.toThrow();

      const entry = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(entry?.lastStatus).toBe('failed');
    });

    it('error is rethrown so the durable queue can apply backoff', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      const boom = new Error('Network timeout: alpha vantage unreachable');
      mockAdapterImpl.getMarketData.mockRejectedValue(boom);

      await expect(handler({ id: 'test-job-fail-3' })).rejects.toThrow('Network timeout: alpha vantage unreachable');
    });

    it('runCount does NOT increment when the handler fails', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockRejectedValue(new Error('Simulated provider failure'));
      const before = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH)?.runCount ?? 0;

      await expect(handler({ id: 'test-job-fail-4' })).rejects.toThrow();

      const after = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH)?.runCount ?? -1;
      expect(after).toBe(before);
    });

    it('lastDurationMs is set even on failure', async () => {
      const handler = handlerMap.get(HOURLY_MARKET_DATA_REFRESH);
      if (!handler) throw new Error('handler not registered');

      mockAdapterImpl.getMarketData.mockRejectedValue(new Error('Simulated provider failure'));
      await expect(handler({ id: 'test-job-fail-5' })).rejects.toThrow();

      const entry = scheduledJobs.getJobRegistry().find((e) => e.type === HOURLY_MARKET_DATA_REFRESH);
      expect(typeof entry?.lastDurationMs).toBe('number');
      expect(entry?.lastDurationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
