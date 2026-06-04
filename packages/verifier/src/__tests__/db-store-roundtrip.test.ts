import { describe, expect, it } from 'vitest';
import { DbVerifierStore, type VerifierResultsTableLike } from '../db-store.js';
import { type VerifierTarget, verify } from '../index.js';

/**
 * Minimal in-memory drizzle stub that records the row passed to .insert()
 * and replays it back through .select() so we can verify the
 * `metadata.__verifier` round-trip without needing a live database.
 */
function makeFakeDb() {
  let stored: Record<string, unknown> | null = null;
  let nextId = 1;

  const select = () => ({
    from: () => ({
      where: () => {
        const limit = (_n: number) => {
          if (!stored) return Promise.resolve([]);
          // Always return the single stored row.
          return Promise.resolve([stored]);
        };
        const orderBy = () => ({ limit });
        return Object.assign(Promise.resolve(stored ? [stored] : []), {
          limit,
          orderBy,
        });
      },
    }),
  });

  const db = {
    insert: (_table: unknown) => ({
      values: (row: Record<string, unknown>) => {
        stored = {
          id: nextId++,
          ...row,
          createdAt: new Date(row.createdAt instanceof Date ? row.createdAt : Date.now()),
        };
        return Promise.resolve();
      },
    }),
    select,
    delete: (_table: unknown) => ({
      where: () => Promise.resolve({ rowCount: stored ? 1 : 0 }),
    }),
  };

  return { db, getStored: () => stored };
}

// Fake table — we only use it as an opaque marker; the stub does not
// actually inspect column references.
const fakeTable = new Proxy({}, { get: () => 'col' }) as unknown as VerifierResultsTableLike;

const target: VerifierTarget = { targetType: 'output', targetId: 'round-trip-target' };

describe('DbVerifierStore — metadata.__verifier round-trip', () => {
  it('persists action / failCount / evaluatedAt / orgId under metadata.__verifier', async () => {
    const { db, getStored } = makeFakeDb();
    const store = new DbVerifierStore({
      db: db as never,
      verifierResultsTable: fakeTable,
    });

    const decision = verify({ text: 'hello' }, target, { orgId: 42 });
    decision.evaluatedAt = 123456;
    await store.save(decision);

    const stored = getStored();
    expect(stored).toBeTruthy();
    const meta = stored?.metadata as Record<string, unknown>;
    expect(meta).toBeTruthy();
    const planner = meta.__verifier as Record<string, unknown>;
    expect(planner).toMatchObject({
      action: decision.action,
      failCount: decision.failCount,
      evaluatedAt: 123456,
      orgId: 42,
    });
  });

  it('round-trips action, failCount, evaluatedAt, and orgId via get()', async () => {
    const { db } = makeFakeDb();
    const store = new DbVerifierStore({
      db: db as never,
      verifierResultsTable: fakeTable,
    });

    const decision = verify({ text: 'world' }, target, { orgId: 7 });
    decision.evaluatedAt = 777;
    decision.failCount = 3;
    await store.save(decision);

    const got = await store.get(decision.verifierId);
    expect(got).toBeDefined();
    expect(got?.action).toBe(decision.action);
    expect(got?.failCount).toBe(3);
    expect(got?.evaluatedAt).toBe(777);
    expect(got?.orgId).toBe(7);
    // user-facing metadata must not contain the private __verifier sub-key.
    expect(got?.metadata?.__verifier).toBeUndefined();
  });

  it('preserves null orgId when no org is supplied', async () => {
    const { db } = makeFakeDb();
    const store = new DbVerifierStore({
      db: db as never,
      verifierResultsTable: fakeTable,
    });

    const decision = verify({ text: 'x' }, target);
    await store.save(decision);

    const got = await store.get(decision.verifierId);
    expect(got?.orgId).toBeNull();
  });
});
