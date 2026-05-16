/**
 * Restart-semantics test for the durable proof ledger (task #4879).
 *
 * Verifies the contract documented on `hydrateProofsFromDb`:
 *   1. `appendProof` writes to the in-memory ring AND persists to the
 *      `proof_ledger` table via the `@szl-holdings/db` module.
 *   2. After a simulated restart (`__resetForTests` clears the in-memory
 *      ring), calling `hydrateProofsFromDb` rebuilds the ring from the
 *      persisted rows so `listProofs` / `totalProofs` return the historical
 *      audit trail.
 *
 * The DB module is mocked with a tiny in-memory shim so the test does not
 * require DATABASE_URL — same approach used by runtime-config.test.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface ProofRow {
  id: string;
  product: string;
  kind: string;
  summary: string;
  deepLink: string | null;
  relatedProduct: string | null;
  modelUsed: string | null;
  payload: Record<string, unknown>;
  ts: Date;
}

const proofRows: ProofRow[] = [];

function resetRows(): void {
  proofRows.length = 0;
}

const proofLedgerTable = { __name: 'proof_ledger' } as const;

function makeInsert() {
  return {
    values(row: ProofRow) {
      const stored: ProofRow = {
        id: row.id,
        product: row.product,
        kind: row.kind,
        summary: row.summary,
        deepLink: row.deepLink ?? null,
        relatedProduct: row.relatedProduct ?? null,
        modelUsed: row.modelUsed ?? null,
        payload: row.payload ?? {},
        ts: row.ts instanceof Date ? row.ts : new Date(row.ts),
      };
      return {
        async onConflictDoNothing() {
          if (!proofRows.some((r) => r.id === stored.id)) proofRows.push(stored);
        },
      };
    },
  };
}

function makeSelect() {
  return {
    from(_table: unknown) {
      const chain = {
        orderBy(_col: unknown) {
          return chain;
        },
        async limit(n: number): Promise<ProofRow[]> {
          return [...proofRows].sort((a, b) => b.ts.getTime() - a.ts.getTime()).slice(0, n);
        },
      };
      return chain;
    },
  };
}

vi.mock('@szl-holdings/db', () => ({
  db: {
    insert: () => makeInsert(),
    select: () => makeSelect(),
  },
  proofLedgerTable,
}));

describe('orchestration-store proof ledger persistence (task #4879)', () => {
  beforeEach(async () => {
    resetRows();
    const store = await import('../services/orchestration-store');
    store.__resetForTests();
  });

  afterEach(async () => {
    const store = await import('../services/orchestration-store');
    store.__resetForTests();
    resetRows();
  });

  it('persists proofs to the ledger and rehydrates them after a simulated restart', async () => {
    const store = await import('../services/orchestration-store');

    const a = store.appendProof({
      product: 'sentra',
      kind: 'signal_ingested',
      summary: 'first proof',
    });
    // Yield so the first fire-and-forget persistProof (which awaits a
    // dynamic `import('@szl-holdings/db')` and then `db.insert(...)`) can
    // settle before we issue the second appendProof.
    for (let i = 0; i < 20 && proofRows.length < 1; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    const b = store.appendProof({
      product: 'counsel',
      kind: 'recommendation_emitted',
      summary: 'second proof',
      modelUsed: 'gpt-4o',
    });
    for (let i = 0; i < 20 && proofRows.length < 2; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }

    expect(proofRows).toHaveLength(2);
    expect(proofRows.map((r) => r.id).sort()).toEqual([a.id, b.id].sort());

    // Simulate a restart: clear in-memory state, then hydrate.
    store.__resetForTests();
    expect(store.totalProofs()).toBe(0);

    const hydrated = await store.hydrateProofsFromDb();
    expect(hydrated).toBe(2);
    expect(store.totalProofs()).toBe(2);

    const restored = store.listProofs({ limit: 10 });
    expect(restored.map((p) => p.id).sort()).toEqual([a.id, b.id].sort());
    const counsel = store.listProofs({ product: 'counsel' });
    expect(counsel).toHaveLength(1);
    expect(counsel[0].summary).toBe('second proof');
  });

  it('replays per-product aggregates when a product registers AFTER hydrate', async () => {
    const store = await import('../services/orchestration-store');

    // Pre-load the mock DB with two historical rows for `counsel` so we can
    // exercise the post-hydrate registration path: this mirrors a cold boot
    // where the api-server hydrates before child apps call /register.
    const olderTs = new Date(Date.now() - 60_000);
    const newerTs = new Date(Date.now() - 30_000);
    proofRows.push(
      {
        id: 'pf-historic1',
        product: 'counsel',
        kind: 'recommendation_emitted',
        summary: 'historic proof one',
        deepLink: null,
        relatedProduct: null,
        modelUsed: 'gpt-4o',
        payload: {},
        ts: olderTs,
      },
      {
        id: 'pf-historic2',
        product: 'counsel',
        kind: 'action_approved',
        summary: 'historic proof two',
        deepLink: null,
        relatedProduct: null,
        modelUsed: 'deepseek-reasoner',
        payload: {},
        ts: newerTs,
      },
    );

    const hydrated = await store.hydrateProofsFromDb();
    expect(hydrated).toBe(2);
    expect(store.getProduct('counsel')).toBeUndefined();

    const registered = store.registerProduct({
      product: 'counsel',
      displayName: 'Counsel — Legal Matter Command',
      basePath: '/counsel/',
      accentColor: '#8b5cf6',
      capabilities: [],
    });

    expect(registered.recentProofCount).toBe(2);
    expect(registered.lastAction).toBe('action_approved: historic proof two');
    expect(registered.lastProofAt).toBe(newerTs.toISOString());
    expect(registered.modelsUsed.sort()).toEqual(['deepseek-reasoner', 'gpt-4o']);
  });
});
