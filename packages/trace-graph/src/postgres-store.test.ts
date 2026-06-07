import { describe, expect, it } from 'vitest';
import { TraceQueryEngine } from './query.js';
import type { TraceRecord } from './schema.js';
import { InMemoryTraceStore, MutableTraceStore } from './store.js';

function makeTrace(
  id: string,
  startedAt: string,
  overrides: Partial<TraceRecord> = {},
): TraceRecord {
  return {
    traceId: id,
    runId: id,
    status: 'completed',
    startedAt,
    completedAt: startedAt,
    objective: `objective-${id}`,
    spans: [],
    toolCalls: [],
    retrieval: [],
    memoryIO: [],
    guardrailResults: [],
    verifierDecisions: [],
    reflections: [],
    rollbackPoints: [],
    errors: [],
    metadata: {},
    modelsUsed: [],
    promptVersions: {},
    ...overrides,
  } as TraceRecord;
}

describe('TraceQueryEngine.queryAsync', () => {
  it('falls back to synchronous in-memory query when no historical backend is registered', async () => {
    const store = new MutableTraceStore(new InMemoryTraceStore());
    store.save(makeTrace('t1', '2026-04-15T00:00:00Z'));
    store.save(makeTrace('t2', '2026-04-16T00:00:00Z'));
    const engine = new TraceQueryEngine(store);

    const result = await engine.queryAsync({ limit: 10 });
    expect(result.total).toBe(2);
    expect(result.traces.map((t) => t.traceId)).toEqual(['t2', 't1']);
  });

  it('delegates to a historical backend when one is registered (pagination beyond cache)', async () => {
    // Simulate a Postgres-backed store with 1500 historical traces — only 100
    // are in cache, but queryHistory returns from "DB" with full pagination.
    const allTraces = Array.from({ length: 1500 }, (_, i) =>
      makeTrace(`hist-${i.toString().padStart(4, '0')}`, new Date(2026, 0, 1, 0, i).toISOString()),
    );

    const cache = new InMemoryTraceStore();
    for (const t of allTraces.slice(-100)) cache.save(t);

    class FakeHistoricalBackend extends InMemoryTraceStore {
      async queryHistory(filter: {
        limit?: number;
        offset?: number;
        after?: string;
        before?: string;
        agentId?: string;
      }): Promise<{ traces: TraceRecord[]; total: number; limit: number; offset: number }> {
        const limit = filter.limit ?? 50;
        const offset = filter.offset ?? 0;
        let pool = [...allTraces];
        if (filter.after) {
          const a = new Date(filter.after).getTime();
          pool = pool.filter((t) => new Date(t.startedAt).getTime() >= a);
        }
        if (filter.before) {
          const b = new Date(filter.before).getTime();
          pool = pool.filter((t) => new Date(t.startedAt).getTime() <= b);
        }
        pool.sort((x, y) => new Date(y.startedAt).getTime() - new Date(x.startedAt).getTime());
        return { traces: pool.slice(offset, offset + limit), total: pool.length, limit, offset };
      }
    }

    const store = new MutableTraceStore(new FakeHistoricalBackend());
    for (const t of allTraces.slice(-100)) store.save(t);
    const engine = new TraceQueryEngine(store);

    // First page: 50 newest
    const page1 = await engine.queryAsync({ limit: 50, offset: 0 });
    expect(page1.total).toBe(1500);
    expect(page1.traces).toHaveLength(50);
    expect(page1.traces[0]?.traceId).toBe('hist-1499');

    // Page 25 (offset 1250): historical, beyond cache window
    const pageDeep = await engine.queryAsync({ limit: 50, offset: 1250 });
    expect(pageDeep.total).toBe(1500);
    expect(pageDeep.traces).toHaveLength(50);
    // The last page should reach traces in the historical range — well beyond
    // the 100-trace in-memory cache.
    expect(pageDeep.traces[0]?.traceId).toBe('hist-0249');
  });
});
