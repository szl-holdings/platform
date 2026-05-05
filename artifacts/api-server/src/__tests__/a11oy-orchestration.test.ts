/**
 * A11oy Orchestration backbone — end-to-end test.
 *
 * Mounts ONLY the orchestration router into a fresh express app so the test
 * does not pull in the full server's db/schema bootstrap (which is broken
 * for any test in this monorepo today — see e.g. stress.test.ts failing
 * with the same `lib/db/src/index.ts/schema` ENOTDIR).
 *
 * Covers (post-rejection #2 hardening):
 *   - The bootstrap endpoint is GONE — tokens are signed server-side or
 *     mutating calls go through the cookie + Referer path.
 *   - GET /fabric/products always returns ALL 6 products with status
 *     (unregistered ones marked as `health: 'unregistered'`), not the
 *     subset of live registrations.
 *   - Mutating endpoints reject calls with neither a Bearer token nor a
 *     valid fabric session cookie (401).
 *   - The cookie path requires both a server-issued HttpOnly cookie AND a
 *     Referer that maps to a known product basePath; principal is derived
 *     server-side from Referer.
 *   - The decoded principal is server-authoritative — a Sentra token
 *     cannot poison Counsel's row in the ledger.
 *   - All six products can register through their respective tokens.
 *   - The Sentra → Counsel → Amaru demo chain produces 4 linked proofs
 *     across 3 distinct products and is restricted to the hub principal.
 *   - Governed model routing emits a proof.
 *   - Cross-product handoff records under the verified principal.
 */

import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import a11oyRouter from '../routes/a11oy-orchestration-api';
import {
  __resetForTests,
  A11OY_PRODUCT_IDS,
  KNOWN_PRODUCT_META,
  listProducts,
  listProofs,
  type A11oyProductId,
} from '../services/orchestration-store';
import {
  signProductToken,
  A11OY_HUB_PRINCIPAL,
  type FabricPrincipal,
} from '@workspace/a11oy-orchestration';

const SECRET = 'test-a11oy-fabric-secret-must-be-long-enough';

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use('/api/a11oy', a11oyRouter);

beforeAll(() => {
  process.env.A11OY_FABRIC_SECRET = SECRET;
  process.env.A11OY_ALLOWED_ORIGINS = 'example.test';
});

beforeEach(() => {
  __resetForTests();
});

afterEach(() => {
  __resetForTests();
});

function tokenFor(principal: FabricPrincipal): string {
  return signProductToken(principal, SECRET);
}

describe('A11oy Orchestration backbone', () => {
  it('always returns all 6 products with status (unregistered ones flagged)', async () => {
    const res = await request(app).get('/api/a11oy/fabric/products');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const products = res.body.data.products as Array<{
      product: string;
      health: string;
    }>;
    expect(products).toHaveLength(6);
    const ids = new Set(products.map((p) => p.product));
    for (const id of A11OY_PRODUCT_IDS) expect(ids.has(id)).toBe(true);
    for (const p of products) expect(p.health).toBe('unregistered');
    expect(res.body.data.totalProofs).toBe(0);
  });

  it('mints a fabric session cookie on GET /fabric/products', async () => {
    const res = await request(app).get('/api/a11oy/fabric/products');
    const sc = res.headers['set-cookie'];
    const cookies = Array.isArray(sc) ? sc : sc ? [sc] : [];
    const fab = cookies.find((c: string) => c.startsWith('_a11oy_fab='));
    expect(fab).toBeDefined();
    expect(fab).toMatch(/HttpOnly/);
    expect(fab).toMatch(/SameSite=Lax/i);
  });

  it('rejects mutating calls without bearer token and without cookie (401)', async () => {
    const res = await request(app)
      .post('/api/a11oy/fabric/products/register')
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.error?.code).toBe('unauthorized');
  });

  it('does NOT accept Referer alone — cookie is required', async () => {
    const res = await request(app)
      .post('/api/a11oy/fabric/products/register')
      .set('Referer', 'https://example.test/sentra/dashboard')
      .send({});
    expect(res.status).toBe(401);
  });

  it('accepts the cookie path with a Referer-derived principal', async () => {
    // Prime: GET to obtain a session cookie.
    const primed = await request(app).get('/api/a11oy/fabric/products');
    const sc = primed.headers['set-cookie'];
    const cookies = Array.isArray(sc) ? sc : sc ? [sc] : [];
    const cookieHeader = cookies.map((c: string) => c.split(';')[0]).join('; ');
    expect(cookieHeader).toContain('_a11oy_fab=');

    // Without Referer the cookie alone is not enough.
    const noRef = await request(app)
      .post('/api/a11oy/fabric/products/register')
      .set('Cookie', cookieHeader)
      .send({});
    expect(noRef.status).toBe(403);

    // Cookie + Referer pointing into Counsel's basePath registers Counsel.
    const ok = await request(app)
      .post('/api/a11oy/fabric/products/register')
      .set('Cookie', cookieHeader)
      .set('Referer', 'https://example.test/counsel/approvals')
      .send({ capabilities: [] });
    expect(ok.status).toBe(200);
    expect(ok.body.data.product).toBe('counsel');
  });

  it('rejects cookie + forged external Referer (host not in allowlist)', async () => {
    // Attacker grabs a public session cookie...
    const primed = await request(app).get('/api/a11oy/fabric/products');
    const sc = primed.headers['set-cookie'];
    const cookies = Array.isArray(sc) ? sc : sc ? [sc] : [];
    const cookieHeader = cookies.map((c: string) => c.split(';')[0]).join('; ');

    // ...then forges a Referer to a non-allowlisted host. Must be rejected.
    const res = await request(app)
      .post('/api/a11oy/fabric/products/register')
      .set('Cookie', cookieHeader)
      .set('Referer', 'https://attacker.example.com/sentra/')
      .send({});
    expect(res.status).toBe(403);
  });

  it('rejects cookie + Origin/Referer host mismatch', async () => {
    const primed = await request(app).get('/api/a11oy/fabric/products');
    const sc = primed.headers['set-cookie'];
    const cookies = Array.isArray(sc) ? sc : sc ? [sc] : [];
    const cookieHeader = cookies.map((c: string) => c.split(';')[0]).join('; ');

    const res = await request(app)
      .post('/api/a11oy/fabric/proofs/emit')
      .set('Cookie', cookieHeader)
      .set('Referer', 'https://example.test/sentra/')
      .set('Origin', 'https://attacker.example.com')
      .send({ kind: 'signal_ingested', summary: 'spoof' });
    expect(res.status).toBe(403);
  });

  it('rejects a forged session cookie', async () => {
    const res = await request(app)
      .post('/api/a11oy/fabric/products/register')
      .set('Cookie', '_a11oy_fab=evil.deadbeef')
      .set('Referer', 'https://example.test/sentra/')
      .send({});
    expect(res.status).toBe(401);
  });

  it('registers all 6 products via their respective bearer tokens', async () => {
    for (const id of A11OY_PRODUCT_IDS) {
      const res = await request(app)
        .post('/api/a11oy/fabric/products/register')
        .set('Authorization', `Bearer ${tokenFor(id)}`)
        .send({
          basePath: KNOWN_PRODUCT_META[id].basePath,
          displayName: KNOWN_PRODUCT_META[id].displayName,
          capabilities: [
            { id: 'demo', label: 'Demo cap', governanceClass: 'recommendation' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.data.product).toBe(id);
    }
    const live = listProducts().map((p) => p.product).sort();
    expect(live).toEqual([...A11OY_PRODUCT_IDS].sort());

    // Hub view now shows all 6 as registered (none unregistered).
    const view = await request(app).get('/api/a11oy/fabric/products');
    const products = view.body.data.products as Array<{
      product: string;
      health: string;
    }>;
    expect(products).toHaveLength(6);
    const unreg = products.filter((p) => p.health === 'unregistered');
    expect(unreg).toHaveLength(0);
  });

  it('refuses to let a Sentra token poison Counsel rows', async () => {
    const res = await request(app)
      .post('/api/a11oy/fabric/proofs/emit')
      .set('Authorization', `Bearer ${tokenFor('sentra')}`)
      .send({
        product: 'counsel' as A11oyProductId, // attempt to spoof
        kind: 'action_approved',
        summary: 'spoofed counsel action',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.product).toBe('sentra');
  });

  it('runs the Sentra → Counsel → Amaru demo chain only for the hub principal', async () => {
    const denied = await request(app)
      .post('/api/a11oy/fabric/demo-chain')
      .set('Authorization', `Bearer ${tokenFor('sentra')}`)
      .send({});
    expect(denied.status).toBe(403);

    const res = await request(app)
      .post('/api/a11oy/fabric/demo-chain')
      .set('Authorization', `Bearer ${tokenFor(A11OY_HUB_PRINCIPAL)}`)
      .send({});
    expect(res.status).toBe(200);
    const chain = res.body.data;
    expect(chain.proofs).toHaveLength(8);
    expect(chain.proofs.map((p: { product: string }) => p.product)).toEqual([
      'sentra',
      'sentra',
      'sentra',
      'counsel',
      'counsel',
      'counsel',
      'counsel',
      'amaru',
    ]);
    // The first and fifth proofs are real governance gate evaluations
    // (model_invocation or governance_block), not synthetic inserts.
    const gateKinds = [chain.proofs[0].kind, chain.proofs[4].kind];
    for (const k of gateKinds) {
      expect(['model_invocation', 'governance_block']).toContain(k);
    }
    const chainIds = new Set(
      chain.proofs.map((p: { payload?: { chainId?: string } }) => p.payload?.chainId),
    );
    expect(chainIds.size).toBe(1);
    expect([...chainIds][0]).toBe(chain.chainId);
  });

  it('fails closed when A11OY_FABRIC_SECRET is missing', async () => {
    const saved = process.env.A11OY_FABRIC_SECRET;
    delete process.env.A11OY_FABRIC_SECRET;
    try {
      const res = await request(app)
        .post('/api/a11oy/fabric/products/register')
        .set('Authorization', `Bearer anything.deadbeef`)
        .send({});
      expect(res.status).toBe(500);
      expect(res.body.error?.code).toBe('misconfigured');
    } finally {
      process.env.A11OY_FABRIC_SECRET = saved;
    }
  });

  it('fails closed when A11OY_FABRIC_SECRET is too short', async () => {
    const saved = process.env.A11OY_FABRIC_SECRET;
    process.env.A11OY_FABRIC_SECRET = 'tooshort';
    try {
      const res = await request(app)
        .post('/api/a11oy/fabric/proofs/emit')
        .set('Authorization', `Bearer sentra.deadbeef`)
        .send({ kind: 'signal_ingested', summary: 'x' });
      expect(res.status).toBe(500);
      expect(res.body.error?.code).toBe('misconfigured');
    } finally {
      process.env.A11OY_FABRIC_SECRET = saved;
    }
  });

  it('routes a model through the governance gate and emits a proof', async () => {
    const res = await request(app)
      .post('/api/a11oy/fabric/route-model')
      .set('Authorization', `Bearer ${tokenFor('counsel')}`)
      .send({ model: 'Qwen/Qwen3-8B', purpose: 'breach review' });
    expect(res.status).toBe(200);
    expect(typeof res.body.data.proofId).toBe('string');
    const proofs = listProofs({ product: 'counsel' });
    expect(proofs.length).toBeGreaterThan(0);
    expect(['model_invocation', 'governance_block']).toContain(proofs[0]?.kind);
  });

  it('records a cross-product handoff under the verified principal', async () => {
    const res = await request(app)
      .post('/api/a11oy/fabric/handoff')
      .set('Authorization', `Bearer ${tokenFor('sentra')}`)
      .send({ toProduct: 'counsel', reason: 'breach review', refId: 'inc-test' });
    expect(res.status).toBe(200);
    const sentraProofs = listProofs({ product: 'sentra' });
    const counselProofs = listProofs({ product: 'counsel' });
    expect(sentraProofs[0]?.kind).toBe('cross_product_handoff');
    expect(counselProofs[0]?.kind).toBe('signal_ingested');
  });

  it('does not expose the legacy /fabric/bootstrap endpoint', async () => {
    const res = await request(app).get('/api/a11oy/fabric/bootstrap?product=sentra');
    expect(res.status).toBe(404);
  });
});
