/**
 * Validation Array-Body Regression Test
 *
 * This test exists to lock in the runtime behaviour that the
 * route-security-matrix.ts --strict gate is meant to protect: any mutating
 * route file (POST/PUT/PATCH/DELETE) wired through validateBody MUST reject
 * a JSON-array request body with a 400 — never a 500 from undefined fields
 * inside the handler, and never a 200 from accidentally accepting an array.
 *
 * If this test starts to fail it means a route was either (a) re-wired to
 * accept arrays (intentional — update the schema and the test together), or
 * (b) had its validateBody safety net removed. The CI gate
 * `pnpm --filter @workspace/api-server run audit:route-security:strict`
 * should catch case (b) before this test does, but this test is the runtime
 * proof that the static gate maps to actual 400s on the wire.
 *
 * Routes covered (representative sample):
 *   POST /api/billing/checkout    — billing.ts (validateBody first in chain)
 *   POST /api/lyte/workspaces     — lyte.ts    (auth → denyIfReadOnly → validateBody)
 */

import express, { type Router as ExpressRouter } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any dynamic imports.
// We reuse the shared mock factories used by security-routes.test.ts so
// adding a new DB table / channel does not require updating this file.
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/observability', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createObservabilityMock();
});

vi.mock('@szl-holdings/db', async () => {
  const m = await import('./helpers/mocks.js');
  const { z } = await import('zod');
  const base = m.createDbMock();
  // Routes import drizzle-zod insertXxxSchema objects from @szl-holdings/db.
  // The default Proxy-based stub returns `{}` for unknown exports, but
  // validateBody requires a real Zod schema with .safeParse — so we wrap
  // the mock and route insertLyte*Schema accesses to a permissive
  // z.object().passthrough() that still rejects non-object bodies (e.g.
  // arrays) which is exactly what this test asserts.
  const objectSchema = z.object({}).passthrough();
  return new Proxy(base as object, {
    get(target, prop) {
      if (typeof prop === 'string' && /^insertLyte.*Schema$/.test(prop)) {
        return objectSchema;
      }
      return Reflect.get(target, prop);
    },
    has() {
      return true;
    },
  });
});

vi.mock('@szl-holdings/forge-runtime', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createForgeRuntimeMock();
});

vi.mock('@szl-holdings/services', () => ({
  services: new Proxy({}, { get: () => () => ({}) }),
}));

vi.mock('@szl-holdings/constellation', () => ({
  lyteAdapter: { upsertEntity: vi.fn(async () => ({})) },
}));

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/platform-flags.js', () => ({
  isFlagEnabled: vi.fn(async () => false),
}));

vi.mock('../lib/stripe-gate.js', () => ({
  // Pass through — validateBody runs before this in /billing/checkout, so
  // the array-body test never reaches it. Implementation kept to satisfy
  // the import surface.
  requireStripeLive: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
    next(),
}));

vi.mock('../lib/websocket.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createWebsocketMock();
});

vi.mock('../middlewares/auth.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createAuthMiddlewareMock();
});

// ---------------------------------------------------------------------------
// Dynamic imports after all mocks are in place
// ---------------------------------------------------------------------------

const { default: billingRouter } = await import('../routes/billing.js');
const { default: lyteRouter } = await import('../routes/lyte.js');

interface ValidationErrorBody {
  error: string;
  code?: string;
  details?: {
    issues: Array<{ path: (string | number)[]; message: string; code: string }>;
  };
}

function buildApp(router: ExpressRouter, mountPrefix = '') {
  const app = express();
  app.use(express.json());
  if (mountPrefix) {
    app.use(mountPrefix, router);
  } else {
    app.use(router);
  }
  return app;
}

// ===========================================================================
// billing.ts — POST /billing/checkout
// ===========================================================================

describe('validateBody rejects array body — POST /billing/checkout (billing.ts)', () => {
  const app = buildApp(billingRouter as unknown as ExpressRouter);

  it('returns 400 when body is a JSON array, not an object', async () => {
    const res = await request(app)
      .post('/billing/checkout')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ planId: 'starter' }, { planId: 'pro' }]));

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(body.error).toMatch(/Validation error/i);
    expect(body.details?.issues).toBeDefined();
    expect(Array.isArray(body.details?.issues)).toBe(true);
    expect(body.details?.issues.length).toBeGreaterThan(0);
  });

  it('returns 400 when body is an empty array', async () => {
    const res = await request(app)
      .post('/billing/checkout')
      .set('Content-Type', 'application/json')
      .send('[]');

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(body.error).toMatch(/Validation error/i);
  });
});

// ===========================================================================
// lyte.ts — POST /lyte/workspaces
// ===========================================================================

describe('validateBody rejects array body — POST /lyte/workspaces (lyte.ts)', () => {
  const app = buildApp(lyteRouter as unknown as ExpressRouter);

  it('returns 400 when body is a JSON array, not an object', async () => {
    const res = await request(app)
      .post('/lyte/workspaces')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify([{ name: 'ws-a' }, { name: 'ws-b' }]));

    expect(res.status).toBe(400);
    const body = res.body as ValidationErrorBody;
    expect(body.error).toMatch(/Validation error/i);
    expect(body.details?.issues).toBeDefined();
    expect(body.details?.issues.length).toBeGreaterThan(0);
  });
});
