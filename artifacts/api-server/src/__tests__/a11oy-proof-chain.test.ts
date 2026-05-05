/**
 * Unit tests for the A11oy Proof Chain in-memory store.
 *
 * Covers:
 *   - computeNodeHash determinism (same input → same output every time)
 *   - computeRootHash determinism
 *   - POST /a11oy/proof-chains/:chainId/verify returns PASS for unmodified chains
 *   - PATCH /a11oy/routing-weights/:id validates weight bounds [0, 1]
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeNodeHash,
  computeRootHash,
  _testOnly_injectChain,
  _testOnly_resetChainStore,
  type FabricProofChain,
  type FabricProofNode,
} from '../routes/a11oy-fabric-api.js';

// ---------------------------------------------------------------------------
// Lightweight mocks — the fabric API route only needs logger + seed data
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/observability', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../middlewares/auth.js', () => ({
  authMiddleware:
    () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      (req as unknown as { user: unknown }).user = {
        id: 1,
        email: 'test@szl.test',
        displayName: 'Test',
        roles: ['operator'],
        orgs: [{ orgId: 1, orgSlug: 'test', orgName: 'Test Org', role: 'operator' }],
      };
      next();
    },
  requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  parseIdParam: (raw: string | string[]) => {
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('Invalid ID');
    return n;
  },
  InvalidIdError: class extends Error {},
}));

vi.mock('../middlewares/platform-auth.js', () => ({
  platformAuth: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
  logPlatformEvent: vi.fn(),
}));

vi.mock('@szl-holdings/db', () => {
  const db = {
    select: () => {
      const chain: Record<string, () => unknown> = {};
      const fn = () => chain;
      ['from', 'where', 'orderBy', 'limit', 'leftJoin'].forEach(k => (chain[k] = fn));
      (chain as { then: unknown }).then = (resolve: (v: unknown[]) => void) =>
        Promise.resolve([]).then(resolve);
      return chain;
    },
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };
  return new Proxy({ db } as Record<string, unknown>, {
    get(t, p) { return p in t ? t[p as string] : {}; },
    has() { return true; },
  });
}
);

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ _tag: 'eq', a, b })),
  and: vi.fn((...args: unknown[]) => ({ _tag: 'and', args })),
  or: vi.fn((...args: unknown[]) => ({ _tag: 'or', args })),
  desc: vi.fn((c: unknown) => ({ _tag: 'desc', c })),
  asc: vi.fn((c: unknown) => ({ _tag: 'asc', c })),
  isNull: vi.fn((c: unknown) => ({ _tag: 'isNull', c })),
  isNotNull: vi.fn((c: unknown) => ({ _tag: 'isNotNull', c })),
  gte: vi.fn((a: unknown, b: unknown) => ({ _tag: 'gte', a, b })),
  lte: vi.fn((a: unknown, b: unknown) => ({ _tag: 'lte', a, b })),
  sql: vi.fn((s: unknown) => ({ _tag: 'sql', s })),
  count: vi.fn(() => ({ _tag: 'count' })),
}));

vi.mock('../middlewares/telemetry.js', () => ({
  withDbSpan: (_req: unknown, fn: () => unknown) => fn(),
}));

vi.mock('../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn(async () => false),
}));

vi.mock('../lib/pubsub-bridge.js', () => ({
  broadcastWs: vi.fn(),
  pubsub: { publish: vi.fn() },
  ALLOY_EVENTS: {},
}));

// ---------------------------------------------------------------------------
// Import router AFTER mocks are hoisted
// ---------------------------------------------------------------------------

const { default: fabricRouter } = await import('../routes/a11oy-fabric-api.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', fabricRouter as unknown as ExpressRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Pure function tests — no HTTP
// ---------------------------------------------------------------------------

describe('computeNodeHash — determinism', () => {
  const node = {
    id: 'n1',
    kind: 'SIGNAL',
    label: 'Signal Detected',
    actor: 'Signal Mesh',
    ts: '2026-04-25T03:48:00Z',
    detail: 'MV Cascade 18h delay detected from AIS stream — Tanjung Pelepas congestion',
    evidenceRefs: ['ais-feed-cascade', 'port-api-tpp'],
    status: 'verified',
  };

  it('returns the same hash on repeated calls (determinism)', () => {
    const h1 = computeNodeHash(node);
    const h2 = computeNodeHash(node);
    const h3 = computeNodeHash(node);
    expect(h1).toBe(h2);
    expect(h2).toBe(h3);
  });

  it('returns a SHA-256 prefixed hex string', () => {
    const h = computeNodeHash(node);
    expect(h).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('produces a different hash when any field changes', () => {
    const modified = { ...node, detail: 'TAMPERED detail' };
    expect(computeNodeHash(node)).not.toBe(computeNodeHash(modified));
  });

  it('hash is order-independent for evidenceRefs (canonical sort)', () => {
    const reversed = { ...node, evidenceRefs: ['port-api-tpp', 'ais-feed-cascade'] };
    expect(computeNodeHash(node)).toBe(computeNodeHash(reversed));
  });
});

describe('computeRootHash — determinism', () => {
  it('produces the same root hash given the same ordered node hashes', () => {
    const hashes = ['sha256:aaa', 'sha256:bbb', 'sha256:ccc'];
    expect(computeRootHash(hashes)).toBe(computeRootHash(hashes));
  });

  it('produces a different root when node hashes change', () => {
    const h1 = computeRootHash(['sha256:aaa', 'sha256:bbb']);
    const h2 = computeRootHash(['sha256:aaa', 'sha256:xxx']);
    expect(h1).not.toBe(h2);
  });

  it('returns a SHA-256 prefixed hex string', () => {
    const h = computeRootHash(['sha256:aaa']);
    expect(h).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

// ---------------------------------------------------------------------------
// HTTP integration tests
// ---------------------------------------------------------------------------

describe('GET /api/a11oy/ledger/chains', () => {
  it('returns 3 seeded chains with nodes and attestation envelopes', async () => {
    const res = await request(buildApp()).get('/api/a11oy/ledger/chains');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const { chains, totalNodes, totalReasoningTraces } = res.body.data as {
      chains: unknown[];
      totalNodes: number;
      totalReasoningTraces: number;
    };
    expect(chains).toHaveLength(3);
    expect(totalNodes).toBeGreaterThan(0);
    expect(totalReasoningTraces).toBeGreaterThan(0);
  });

  it('each chain carries a structural attestation envelope', async () => {
    const res = await request(buildApp()).get('/api/a11oy/ledger/chains');
    const { chains } = res.body.data as { chains: Array<{ attestation: { structural: boolean; rootHash: string; terminalHash: string } }> };
    for (const chain of chains) {
      expect(chain.attestation.structural).toBe(true);
      expect(chain.attestation.rootHash).toMatch(/^sha256:/);
      expect(chain.attestation.terminalHash).toMatch(/^sha256:/);
    }
  });
});

describe('GET /api/a11oy/ledger/chains/:chainId', () => {
  it('returns 404 for unknown chain', async () => {
    const res = await request(buildApp()).get('/api/a11oy/ledger/chains/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns chain-001 with all 8 nodes', async () => {
    const res = await request(buildApp()).get('/api/a11oy/ledger/chains/chain-001');
    expect(res.status).toBe(200);
    const chain = res.body.data as { id: string; nodes: unknown[] };
    expect(chain.id).toBe('chain-001');
    expect(chain.nodes).toHaveLength(8);
  });
});

describe('GET /api/a11oy/ledger/chains/:chainId/packets/:nodeId', () => {
  it('returns 404 for unknown node in valid chain', async () => {
    const res = await request(buildApp()).get('/api/a11oy/ledger/chains/chain-001/packets/no-such-node');
    expect(res.status).toBe(404);
  });

  it('returns packet n3 from chain-001 with reasoning trace', async () => {
    const res = await request(buildApp()).get('/api/a11oy/ledger/chains/chain-001/packets/n3');
    expect(res.status).toBe(200);
    const { node } = res.body.data as { node: { id: string; reasoningTrace?: unknown[] } };
    expect(node.id).toBe('n3');
    expect(Array.isArray(node.reasoningTrace)).toBe(true);
    expect((node.reasoningTrace ?? []).length).toBeGreaterThan(0);
  });
});

describe('POST /api/a11oy/ledger/chains/:chainId/verify — FAIL path (tampered chain)', () => {
  // Restore the pristine store after each test in this block
  afterEach(() => {
    _testOnly_resetChainStore();
  });

  it('returns chainOk: false and identifies the offending node when a stored hash is corrupted', async () => {
    // Build a copy of chain-001 from the real store
    const chainRes = await request(buildApp()).get('/api/a11oy/ledger/chains/chain-001');
    expect(chainRes.status).toBe(200);
    const pristine = chainRes.body.data as FabricProofChain;

    // Corrupt the stored hash of the first node AND the attestation rootHash to simulate
    // a realistic tamper: stored node.hash is stale → verify recomputes and detects mismatch;
    // attestation.rootHash is also poisoned → rootHashOk is additionally false.
    const badHash = 'sha256:' + 'deadbeef'.repeat(8);
    const tamperedNodes: FabricProofNode[] = pristine.nodes.map((n, i) =>
      i === 0 ? { ...n, hash: badHash } : n,
    );
    const tampered: FabricProofChain = {
      ...pristine,
      nodes: tamperedNodes,
      attestation: { ...pristine.attestation, rootHash: badHash },
    };
    _testOnly_injectChain(tampered);

    const app = buildApp();
    const res = await request(app).post('/api/a11oy/ledger/chains/chain-001/verify').send();
    expect(res.status).toBe(200);

    const result = res.body.data as {
      chainOk: boolean;
      rootHashOk: boolean;
      nodes: Array<{ id: string; label: string; ok: boolean; expected: string; actual: string }>;
    };

    // The overall chain must be flagged as invalid
    expect(result.chainOk).toBe(false);
    // Stored attestation rootHash is poisoned; fresh recompute from field data won't match it
    expect(result.rootHashOk).toBe(false);

    // The corrupted node must be identified as failing
    const offending = result.nodes.find(n => !n.ok);
    expect(offending).toBeDefined();
    expect(offending!.id).toBe(pristine.nodes[0].id);
    // Route semantics: expected = stored hash; actual = freshly recomputed from field data
    expect(offending!.expected).toBe('sha256:' + 'deadbeef'.repeat(8)); // stored (corrupted)
    expect(offending!.actual).toMatch(/^sha256:[0-9a-f]{64}$/);         // real recomputed value
    expect(offending!.expected).not.toBe(offending!.actual);

    // All other nodes are still intact
    const clean = result.nodes.filter(n => n.ok);
    expect(clean.length).toBe(pristine.nodes.length - 1);
  });

  it('identifies multiple corrupted nodes independently', async () => {
    const chainRes = await request(buildApp()).get('/api/a11oy/ledger/chains/chain-002');
    expect(chainRes.status).toBe(200);
    const pristine = chainRes.body.data as FabricProofChain;

    // Corrupt nodes at index 0 and 2
    const tamperedNodes: FabricProofNode[] = pristine.nodes.map((n, i) =>
      i === 0 || i === 2 ? { ...n, hash: 'sha256:' + 'cafebabe'.repeat(8) } : n,
    );
    _testOnly_injectChain({ ...pristine, nodes: tamperedNodes });

    const res = await request(buildApp()).post('/api/a11oy/ledger/chains/chain-002/verify').send();
    expect(res.status).toBe(200);

    const result = res.body.data as {
      chainOk: boolean;
      nodes: Array<{ id: string; ok: boolean }>;
    };

    expect(result.chainOk).toBe(false);
    const failing = result.nodes.filter(n => !n.ok);
    expect(failing.length).toBe(2);
    expect(failing.map(n => n.id)).toContain(pristine.nodes[0].id);
    expect(failing.map(n => n.id)).toContain(pristine.nodes[2].id);
  });

  it('verify result includes node-level expected vs actual hashes for auditability (clean chain)', async () => {
    const res = await request(buildApp())
      .post('/api/a11oy/ledger/chains/chain-002/verify')
      .send();
    expect(res.status).toBe(200);
    const { nodes } = res.body.data as {
      nodes: Array<{ id: string; label: string; ok: boolean; expected: string; actual: string }>;
    };
    for (const n of nodes) {
      expect(n).toHaveProperty('id');
      expect(n).toHaveProperty('label');
      expect(n.expected).toMatch(/^sha256:/);
      expect(n.actual).toMatch(/^sha256:/);
      expect(n.actual).toBe(n.expected);
    }
  });
});

describe('POST /api/a11oy/ledger/chains/:chainId/verify — PASS path', () => {
  it('verifies chain-001 as fully intact (chainOk: true)', async () => {
    const res = await request(buildApp())
      .post('/api/a11oy/ledger/chains/chain-001/verify')
      .send();
    expect(res.status).toBe(200);
    const result = res.body.data as { chainOk: boolean; rootHashOk: boolean; nodes: Array<{ ok: boolean }> };
    expect(result.chainOk).toBe(true);
    expect(result.rootHashOk).toBe(true);
    expect(result.nodes.every(n => n.ok)).toBe(true);
  });

  it('verifies chain-002 (Defense) as fully intact', async () => {
    const res = await request(buildApp())
      .post('/api/a11oy/ledger/chains/chain-002/verify')
      .send();
    expect(res.status).toBe(200);
    expect((res.body.data as { chainOk: boolean }).chainOk).toBe(true);
  });

  it('returns 404 when chain does not exist', async () => {
    const res = await request(buildApp())
      .post('/api/a11oy/ledger/chains/chain-999/verify')
      .send();
    expect(res.status).toBe(404);
  });
});

describe('Routing Weights — PATCH validation', () => {
  beforeEach(() => {
    // Reset weights between tests by calling the reset endpoint
  });

  it('PATCH with valid weight 0.75 returns 200 and the updated record', async () => {
    const res = await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-fast-triage')
      .send({ weight: 0.75, updatedBy: 'test-operator' });
    expect(res.status).toBe(200);
    const record = res.body.data as { weight: number; updatedBy: string; updatedAt: string };
    expect(record.weight).toBe(0.75);
    expect(record.updatedBy).toBe('test-operator');
    expect(record.updatedAt).toBeTruthy();
  });

  it('PATCH with weight 0 is valid (disable route)', async () => {
    const res = await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-deep-reasoning')
      .send({ weight: 0 });
    expect(res.status).toBe(200);
    expect((res.body.data as { weight: number }).weight).toBe(0);
  });

  it('PATCH with weight 1.0 is valid (full priority)', async () => {
    const res = await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-long-context')
      .send({ weight: 1.0 });
    expect(res.status).toBe(200);
    expect((res.body.data as { weight: number }).weight).toBe(1.0);
  });

  it('PATCH with weight -0.1 returns 400', async () => {
    const res = await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-fast-triage')
      .send({ weight: -0.1 });
    expect(res.status).toBe(400);
  });

  it('PATCH with weight 1.1 returns 400', async () => {
    const res = await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-fast-triage')
      .send({ weight: 1.1 });
    expect(res.status).toBe(400);
  });

  it('PATCH with non-numeric weight returns 400', async () => {
    const res = await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-fast-triage')
      .send({ weight: 'high' });
    expect(res.status).toBe(400);
  });

  it('PATCH on unknown id returns 404', async () => {
    const res = await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-does-not-exist')
      .send({ weight: 0.5 });
    expect(res.status).toBe(404);
  });

  it('POST /reset restores all weights to 1.0 defaults', async () => {
    // First modify one
    await request(buildApp())
      .patch('/api/a11oy/routing-weights/rw-eval-judge')
      .send({ weight: 0.2 });

    // Then reset (fresh app instance resets in-memory state)
    const res = await request(buildApp()).post('/api/a11oy/routing-weights/reset');
    expect(res.status).toBe(200);
    const { weights } = res.body.data as { weights: Array<{ weight: number }> };
    expect(weights.every(w => w.weight === 1.0)).toBe(true);
  });
});
