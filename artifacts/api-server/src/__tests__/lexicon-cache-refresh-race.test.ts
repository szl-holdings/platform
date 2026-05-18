/**
 * Race-condition tests for the Lexicon approval cache (task #5004).
 *
 * The inference gate reads the in-memory `approvedCache` / `statusCache`
 * synchronously via `isLexiconApprovedSync` / `getLexiconStatusSync`. Those
 * caches are mutated from two concurrent paths:
 *
 *   1. `refreshApprovedCache` — periodic background rebuild from the DB.
 *   2. `applyDecision` (approve/deny handlers) — direct mutation after the
 *      DB row update commits, via `recordCacheMutation`.
 *
 * The race window: a refresh issues `await db.select(...)`, gets back a
 * snapshot that still shows a target as `approved`, then a deny commits and
 * mutates the cache to `denied`. Without coordination, the refresh's
 * synchronous repopulate step would clobber the deny by reinstating
 * `approved` from the stale snapshot — meaning a denied model could pass
 * the `license_approved` gate for the few milliseconds until the next
 * refresh.
 *
 * These tests reproduce that interleaving and assert the gate never
 * returns `allowed: true` for a denied target during the race.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeRow {
  targetId: string;
  status: 'approved' | 'denied' | 'pending_review' | 'risk_flagged';
}

let dbRows: FakeRow[] = [];
let pendingSelect: { resolve: (rows: FakeRow[]) => void; promise: Promise<FakeRow[]> } | null =
  null;
let blockNextSelect = false;

function makeDeferredSelect(): Promise<FakeRow[]> {
  let resolve!: (rows: FakeRow[]) => void;
  const promise = new Promise<FakeRow[]>((r) => {
    resolve = r;
  });
  pendingSelect = { resolve, promise };
  return promise;
}

vi.mock('@szl-holdings/db', () => {
  const lexiconEntriesTable = {
    targetId: 'lexiconEntriesTable.targetId',
    status: 'lexiconEntriesTable.status',
    id: 'lexiconEntriesTable.id',
  } as const;
  return {
    db: {
      select: () => ({
        from: (_t: unknown) => {
          if (blockNextSelect) {
            blockNextSelect = false;
            return makeDeferredSelect();
          }
          return Promise.resolve([...dbRows]);
        },
      }),
      insert: () => ({
        values: () => ({
          onConflictDoNothing: async () => undefined,
          returning: async () => [],
        }),
      }),
      update: () => ({
        set: () => ({
          where: async () => undefined,
        }),
      }),
    },
    lexiconEntriesTable,
    lexiconDecisionsTable: {},
    lexiconReviewRequestsTable: {},
  };
});

vi.mock('drizzle-orm', () => ({
  and: (...a: unknown[]) => ({ _kind: 'and', a }),
  eq: (l: unknown, r: unknown) => ({ _kind: 'eq', l, r }),
  desc: (x: unknown) => ({ _kind: 'desc', x }),
  sql: () => ({ _kind: 'sql' }),
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../lib/lexicon-notifications', () => ({
  notifyLexiconReviewers: vi.fn(async () => ({ recipientCount: 0 })),
}));

vi.mock('../services/orchestration-store', () => ({
  addProductCapability: vi.fn(),
  appendProof: vi.fn(),
}));

describe('Lexicon approval cache — refresh/mutation race (task #5004)', () => {
  beforeEach(async () => {
    vi.resetModules();
    dbRows = [];
    pendingSelect = null;
    blockNextSelect = false;
    const mod = await import('../routes/a11oy-lexicon-api');
    mod.__testing.resetCaches();
  });

  afterEach(() => {
    pendingSelect = null;
    blockNextSelect = false;
  });

  it('does not reinstate a denied target when a deny commits during an in-flight refresh', async () => {
    const target = 'meta-llama/Llama-Race-7B';
    dbRows = [{ targetId: target, status: 'approved' }];

    const { __testing, isLexiconApprovedSync, getLexiconStatusSync } = await import(
      '../routes/a11oy-lexicon-api'
    );

    // 1. Warm the cache: target is currently approved.
    await __testing.refreshApprovedCache();
    expect(isLexiconApprovedSync(target)).toBe(true);
    expect(getLexiconStatusSync(target)).toBe('approved');

    // 2. Start a second refresh that will block in the middle of its
    //    `await db.select(...)`. This simulates the slow DB round trip
    //    during which a deny can race in.
    blockNextSelect = true;
    const refreshPromise = __testing.refreshApprovedCache();
    // Yield once so the refresh kicks off its db.select() and parks on
    // the deferred promise.
    await Promise.resolve();
    expect(pendingSelect).not.toBeNull();

    // 3. While the refresh is parked, simulate the approve/deny handler:
    //    the row commits as 'denied' and the handler updates the in-memory
    //    cache synchronously via recordCacheMutation. The inference gate
    //    must immediately observe `denied` and `allowed=false`.
    dbRows = [{ targetId: target, status: 'denied' }];
    __testing.recordCacheMutation(target, 'denied');
    expect(isLexiconApprovedSync(target)).toBe(false);
    expect(getLexiconStatusSync(target)).toBe('denied');

    // 4. Now let the (stale) refresh complete. Its db snapshot still shows
    //    the target as `approved` — without the overlay fix it would
    //    clobber the deny here, reopening the race window. The refresh
    //    must overlay the concurrent mutation and keep the deny.
    pendingSelect!.resolve([{ targetId: target, status: 'approved' }]);
    await refreshPromise;

    // 5. The invariant: at NO point — and especially not after the stale
    //    refresh resolves — does the cache report the denied target as
    //    approved. This is the assertion that fails on the regression.
    expect(isLexiconApprovedSync(target)).toBe(false);
    expect(getLexiconStatusSync(target)).toBe('denied');
  });

  it('keeps the deny durable even after subsequent fresh refreshes', async () => {
    const target = 'meta-llama/Llama-Race-7B';
    dbRows = [{ targetId: target, status: 'approved' }];

    const { __testing, isLexiconApprovedSync, getLexiconStatusSync } = await import(
      '../routes/a11oy-lexicon-api'
    );

    await __testing.refreshApprovedCache();
    expect(isLexiconApprovedSync(target)).toBe(true);

    // Race a refresh against the deny (same setup as above).
    blockNextSelect = true;
    const refreshPromise = __testing.refreshApprovedCache();
    await Promise.resolve();
    dbRows = [{ targetId: target, status: 'denied' }];
    __testing.recordCacheMutation(target, 'denied');
    pendingSelect!.resolve([{ targetId: target, status: 'approved' }]);
    await refreshPromise;

    expect(isLexiconApprovedSync(target)).toBe(false);

    // A subsequent fresh refresh — now reading the post-deny DB state —
    // must also keep the target denied.
    await __testing.refreshApprovedCache();
    expect(isLexiconApprovedSync(target)).toBe(false);
    expect(getLexiconStatusSync(target)).toBe('denied');
  });

  it('still reflects an approve mutation when it races with a stale "pending" snapshot', async () => {
    const target = 'BAAI/bge-new-model';
    dbRows = [{ targetId: target, status: 'pending_review' }];

    const { __testing, isLexiconApprovedSync, getLexiconStatusSync } = await import(
      '../routes/a11oy-lexicon-api'
    );

    await __testing.refreshApprovedCache();
    expect(isLexiconApprovedSync(target)).toBe(false);
    expect(getLexiconStatusSync(target)).toBe('pending_review');

    blockNextSelect = true;
    const refreshPromise = __testing.refreshApprovedCache();
    await Promise.resolve();

    // Concurrent approve commits and mutates the cache.
    __testing.recordCacheMutation(target, 'approved');
    expect(isLexiconApprovedSync(target)).toBe(true);

    // Stale refresh resolves with the pre-approve snapshot.
    pendingSelect!.resolve([{ targetId: target, status: 'pending_review' }]);
    await refreshPromise;

    // The approve must survive — the overlay is bidirectional, so any
    // racing mutation (approve or deny) beats a stale snapshot.
    expect(isLexiconApprovedSync(target)).toBe(true);
    expect(getLexiconStatusSync(target)).toBe('approved');
  });
});
