/**
 * Audit Chain Verify Route — Integration Tests (Task #4263)
 *
 * Exercises the full production code path through GET /audit-chain/verify
 * using supertest.  The real route handler runs against mocked DB rows and
 * the real verifyAuditRow / computeEventHash logic, so classification
 * decisions (hybrid_verified, legacy_unsigned, broken) are exercised end-to-end.
 *
 * Covers acceptance gates G3–G5:
 *   G4: empty chain → intact, no events
 *   G4: legacy_unsigned row (no sigs) → classified correctly in summary
 *   G3: signed row (hybrid_verified) → classified correctly in summary
 *   G5: tampered row (action mutated after signing) → broken in summary
 *   G5: hash-chain broken (prevHash mismatch) → intact=false, brokenAt set
 *
 * Auth is bypassed by mocking authMiddleware / requireRole (no DB or session
 * needed).  Rate limiter is bypassed via vi.mock.
 */

import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ── ML-DSA mock (HMAC-SHA256 stand-in) ─────────────────────────────────────
// Must appear before any pqc-identity import.
vi.mock('@noble/post-quantum/ml-dsa.js', async () => {
  const { createHmac } = await import('node:crypto');
  const sign = (sk: Uint8Array, msg: Uint8Array) =>
    new Uint8Array(createHmac('sha256', sk).update(msg).digest());
  const verify = (pk: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean => {
    const expected = new Uint8Array(createHmac('sha256', pk).update(msg).digest());
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= sig[i]! ^ expected[i]!;
    return diff === 0;
  };
  return {
    ml_dsa65: {
      keygen: (seed?: Uint8Array) => {
        const key = seed?.slice(0, 32) ?? new Uint8Array(32);
        return { secretKey: key, publicKey: key };
      },
      sign,
      verify,
    },
  };
});

// ── Auth bypass ─────────────────────────────────────────────────────────────
vi.mock('../middlewares/auth', () => ({
  authMiddleware: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = {
      id: 1,
      displayName: 'Test Admin',
      email: 'admin@test.com',
      roles: ['admin'],
      orgs: [],
      actorKind: 'human',
    } as express.Request['user'];
    next();
  },
  requireRole: () => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

// ── Rate-limiter bypass ─────────────────────────────────────────────────────
vi.mock('../middlewares/sliding-window-limiter', () => ({
  perUserApiSlidingLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

// ── DB mock ─────────────────────────────────────────────────────────────────
// The verify route uses:  db.select().from(table).where(...).orderBy(table.id)
// We intercept at the top level and return rows set per-test.
let _mockRows: unknown[] = [];

vi.mock('@szl-holdings/db', async () => {
  const makeChain = (): unknown => {
    const chain: Record<string, () => unknown> = {
      from: () => chain,
      where: () => chain,
      orderBy: () => Promise.resolve(_mockRows),
      limit: () => Promise.resolve([]),
      set: () => chain,
      values: () => Promise.resolve([]),
      returning: () => Promise.resolve([]),
      innerJoin: () => chain,
    };
    return chain;
  };
  const db = {
    select: makeChain,
    insert: () => makeChain(),
    update: () => makeChain(),
  };
  return {
    db,
    auditChainEventsTable: { id: 'id', orgId: 'orgId' },
    // Drizzle operators — no-ops in the mock; chain ignores them
    and: (..._args: unknown[]) => undefined,
    eq: () => undefined,
    count: () => undefined,
    desc: () => undefined,
    gte: () => undefined,
    ilike: () => undefined,
    or: () => undefined,
  };
});

// ── Helpers ─────────────────────────────────────────────────────────────────
import { createHash } from 'node:crypto';

function computeHash(prevHash: string, ev: { action: string; actor: string; domain: string; actionType: string; entityId?: string | null; createdAt: string }): string {
  const data = [prevHash, ev.action, ev.actor, ev.domain, ev.actionType, ev.entityId ?? '', ev.createdAt].join('|');
  return createHash('sha256').update(data).digest('hex');
}

function makeUnsignedRow(id: number, prevHash: string) {
  const createdAt = new Date(`2026-01-0${id}T00:00:00.000Z`);
  const eventHash = computeHash(prevHash, {
    action: `action-${id}`,
    actor: 'alice',
    domain: 'platform',
    actionType: 'create',
    entityId: null,
    createdAt: createdAt.toISOString(),
  });
  return {
    id,
    prevHash,
    eventHash,
    action: `action-${id}`,
    actorLabel: 'alice',
    domain: 'platform',
    actionType: 'create',
    entityId: null,
    createdAt,
    orgId: null,
    ed25519Sig: null,
    mldsa65Sig: null,
    sigPublicKeyEd25519: null,
    sigPublicKeyMldsa65: null,
    signingDid: null,
    keyId: null,
    schemeVersion: null,
  };
}

// ── App setup ────────────────────────────────────────────────────────────────
let app: express.Express;

beforeAll(async () => {
  // Import the router AFTER vi.mock calls are hoisted
  const { default: auditChainRouter } = await import('../routes/audit-chain');
  app = express();
  app.use(express.json());
  app.use('/', auditChainRouter);
});

beforeEach(() => {
  _mockRows = [];
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe('GET /audit-chain/verify — production route (G3–G5)', () => {
  it('G4: empty chain → intact=true, chainLength=0, all counters zero', async () => {
    _mockRows = [];
    const res = await request(app).get('/audit-chain/verify');
    expect(res.status).toBe(200);
    const body = res.body.data ?? res.body;
    expect(body.intact).toBe(true);
    expect(body.chainLength).toBe(0);
    expect(body.brokenAt).toBeNull();
    expect(body.summary.hybrid_verified).toBe(0);
    expect(body.summary.legacy_unsigned).toBe(0);
    expect(body.summary.broken).toBe(0);
  });

  it('G4: two legacy_unsigned rows → classified in summary, chain intact', async () => {
    const r1 = makeUnsignedRow(1, 'genesis');
    const r2 = makeUnsignedRow(2, r1.eventHash);
    _mockRows = [r1, r2];

    const res = await request(app).get('/audit-chain/verify');
    expect(res.status).toBe(200);
    const body = res.body.data ?? res.body;
    expect(body.intact).toBe(true);
    expect(body.chainLength).toBe(2);
    expect(body.summary.legacy_unsigned).toBe(2);
    expect(body.summary.hybrid_verified).toBe(0);
    expect(body.summary.broken).toBe(0);
    expect(body.brokenAt).toBeNull();
  });

  it('G5: prevHash mismatch on row 2 → intact=false, brokenAt=2, broken counter=1', async () => {
    const r1 = makeUnsignedRow(1, 'genesis');
    const r2bad = makeUnsignedRow(2, 'wrong-prev-hash');  // prevHash intentionally wrong
    _mockRows = [r1, r2bad];

    const res = await request(app).get('/audit-chain/verify');
    expect(res.status).toBe(200);
    const body = res.body.data ?? res.body;
    expect(body.intact).toBe(false);
    expect(body.brokenAt).toBe(2);
    expect(body.summary.broken).toBeGreaterThanOrEqual(1);
    expect(body.brokenReasons).toBeDefined();
    expect(body.brokenReasons.some((r: { reason: string }) => r.reason === 'prev_hash_mismatch')).toBe(true);
  });

  it('G3: signed row (hybrid_verified) → counted in summary', async () => {
    // Build a signed row using the same helpers as audit-chain-signer.test.ts.
    // buildCanonicalPayload returns a Uint8Array; createHybridSigner.sign() takes Uint8Array.
    const { generateHybridKeyPair, createHybridSigner } = await import('@szl-holdings/pqc-identity');
    const { buildCanonicalPayload } = await import('../lib/audit-chain-signer');
    const r1 = makeUnsignedRow(1, 'genesis');
    const signingDid = 'did:plat:agent:verify-route-test';

    const keyPair = generateHybridKeyPair();
    const signer = createHybridSigner(keyPair, 'hybrid');
    const canonicalBytes = buildCanonicalPayload({
      prevHash: r1.prevHash,
      action: r1.action,
      actor: r1.actorLabel,
      domain: r1.domain,
      actionType: r1.actionType,
      entityId: r1.entityId ?? '',
      createdAt: r1.createdAt.toISOString(),
      signingDid,
    });
    const sig = signer.sign(canonicalBytes);

    const signedRow = {
      ...r1,
      signingDid,
      keyId: 'test-key-g3',
      schemeVersion: 'hybrid-v1',
      ed25519Sig: sig.ed25519 ?? '',
      mldsa65Sig: sig.mldsa65 ?? '',
      sigPublicKeyEd25519: sig.publicKeys?.ed25519 ?? '',
      sigPublicKeyMldsa65: sig.publicKeys?.mldsa65 ?? '',
    };
    _mockRows = [signedRow];

    const res = await request(app).get('/audit-chain/verify');
    expect(res.status).toBe(200);
    const body = res.body.data ?? res.body;
    expect(body.intact).toBe(true);
    expect(body.summary.hybrid_verified).toBe(1);
    expect(body.summary.broken).toBe(0);
    expect(body.summary.legacy_unsigned).toBe(0);
  });

  it('G5: signed row with mutated action → broken in summary', async () => {
    const { generateHybridKeyPair, createHybridSigner } = await import('@szl-holdings/pqc-identity');
    const { buildCanonicalPayload } = await import('../lib/audit-chain-signer');
    const r1 = makeUnsignedRow(1, 'genesis');
    const signingDid = 'did:plat:agent:tamper-route-test';

    const keyPair = generateHybridKeyPair();
    const signer = createHybridSigner(keyPair, 'hybrid');
    const canonicalBytes = buildCanonicalPayload({
      prevHash: r1.prevHash,
      action: r1.action,
      actor: r1.actorLabel,
      domain: r1.domain,
      actionType: r1.actionType,
      entityId: r1.entityId ?? '',
      createdAt: r1.createdAt.toISOString(),
      signingDid,
    });
    const sig = signer.sign(canonicalBytes);

    // Tamper: mutate action AFTER signing (sig remains from original action).
    // Recompute eventHash from tampered action so the hash-chain check passes;
    // the signature check then fires and finds the action mismatch → broken.
    const tamperedAction = 'TAMPERED-ACTION';
    const tamperedHash = computeHash(r1.prevHash, {
      action: tamperedAction,
      actor: r1.actorLabel,
      domain: r1.domain,
      actionType: r1.actionType,
      entityId: r1.entityId,
      createdAt: r1.createdAt.toISOString(),
    });
    const tamperedRow = {
      ...r1,
      action: tamperedAction,
      eventHash: tamperedHash,
      signingDid,
      keyId: 'test-key-g5',
      schemeVersion: 'hybrid-v1',
      ed25519Sig: sig.ed25519 ?? '',
      mldsa65Sig: sig.mldsa65 ?? '',
      sigPublicKeyEd25519: sig.publicKeys?.ed25519 ?? '',
      sigPublicKeyMldsa65: sig.publicKeys?.mldsa65 ?? '',
    };
    _mockRows = [tamperedRow];

    const res = await request(app).get('/audit-chain/verify');
    expect(res.status).toBe(200);
    const body = res.body.data ?? res.body;
    expect(body.summary.broken).toBe(1);
    expect(body.summary.hybrid_verified).toBe(0);
    expect(body.brokenAt).toBe(1);
  });
});
