/**
 * CSRF Round-Trip POST Tests — Full Domain Coverage
 *
 * Verifies the double-submit cookie CSRF pattern across every major
 * API domain.  Each test follows the same round-trip:
 *
 *   1. GET /api/csrf-token  → extract the `csrf_token` cookie
 *   2. POST /api/<domain>/* with X-CSRF-Token header set → expect non-403
 *   3. POST the same route WITHOUT the header → expect 403 CSRF_TOKEN_MISSING
 *   4. POST with a mismatched token → expect 403 CSRF_TOKEN_MISMATCH
 *
 * The tests DO NOT require a live database.  The CSRF middleware runs before
 * auth and before any DB I/O, so the test app only needs to mount the CSRF
 * middleware and a stub responder.
 *
 * Domains covered (extending existing auth.test.ts partial coverage):
 *   - Verifier                (pre-existing partial coverage)
 *   - Vessels                 (new)
 *   - Terra                   (new — consolidates #1281)
 *   - PRISM Counsel           (new — consolidates #1281)
 *   - Firestorm               (new)
 *   - Lyte                    (new)
 *   - Alloy                   (new)
 *   - Aegis                   (new)
 *   - SZL Holdings analytics  (new)
 *   - Agents / AI surface     (new)
 *
 * Note: Routes exempted in `csrf.ts` (health, auth login/logout, webhooks,
 * mobile token exchange, etc.) are NOT tested here — they intentionally bypass
 * CSRF.  This test suite only targets state-mutating routes that ARE
 * protected.
 */

import cookieParser from 'cookie-parser';
import express, { type Express, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ── Module mocks ─────────────────────────────────────────────────────────────
// The CSRF middleware imports from logger, api-response, and internal-tokens.
// api-response in turn imports InvalidIdError from auth.ts which chains to
// @szl-holdings/db → @szl-holdings/env. Mock those layers here so the test
// runs without a live database or environment variables.

vi.mock('../../artifacts/api-server/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  },
}));

vi.mock('../../artifacts/api-server/src/lib/internal-tokens', () => ({
  verifyInternalHeader: vi.fn().mockReturnValue(null),
}));

vi.mock('../../artifacts/api-server/src/lib/api-response', () => {
  const sendError = (
    res: { status: (s: number) => { json: (b: unknown) => void } },
    message: string,
    status = 403,
    code?: string,
  ) => res.status(status).json({ error: message, code });
  return { sendError };
});

import { csrfMiddleware } from '../../artifacts/api-server/src/middlewares/csrf.js';

// ── Test app factory ─────────────────────────────────────────────────────────

/**
 * Builds a minimal Express app that:
 *  - Parses cookies (required by csrfMiddleware)
 *  - Mounts the real CSRF middleware
 *  - Has a GET /api/csrf-token endpoint that issues the cookie
 *  - Has stub POST/DELETE/PATCH responders under each domain path so we
 *    can test the CSRF gate without real route handlers
 */
function buildTestApp(extraExemptPaths: string[] = []): Express {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  app.use(csrfMiddleware);

  app.get('/api/csrf-token', (_req: Request, res: Response) => {
    res.json({ csrfToken: _req.cookies?.['csrf_token'] ?? null });
  });

  const protectedPaths = [
    '/api/vessels/alerts',
    '/api/vessels/orders',
    '/api/terra/properties',
    '/api/terra/leases',
    '/api/terra/pro-forma',
    '/api/prism/matters',
    '/api/prism/documents',
    '/api/firestorm/findings',
    '/api/firestorm/assessments',
    '/api/lyte/scenarios',
    '/api/lyte/decisions',
    '/api/alloy/channels',
    '/api/alloy/chat',
    '/api/aegis/portfolios',
    '/api/analytics/events',
    '/api/agents/runs',
    '/api/verifier',
    '/api/audit/records',
    '/api/approvals/votes',
    '/api/signals',
    '/api/szl-holdings/ventures',
  ];

  for (const path of protectedPaths) {
    if (!extraExemptPaths.includes(path)) {
      app.post(path, (_req: Request, res: Response) => res.status(201).json({ ok: true }));
      app.patch(`${path}/:id`, (_req: Request, res: Response) =>
        res.status(200).json({ ok: true }),
      );
      app.delete(`${path}/:id`, (_req: Request, res: Response) =>
        res.status(200).json({ ok: true }),
      );
    }
  }

  return app;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchCsrfToken(app: Express): Promise<{ token: string; cookieHeader: string }> {
  const res = await request(app).get('/api/csrf-token');
  expect(res.status).toBe(200);
  const cookieHeader = (res.headers['set-cookie'] as string[] | string | undefined) ?? '';
  const cookieStr = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
  const match = cookieStr.match(/csrf_token=([^;]+)/);
  expect(match).not.toBeNull();
  const token = match![1]!;
  return { token, cookieHeader: cookieStr };
}

// ── Domain test factory ──────────────────────────────────────────────────────

function describecsrfDomain(
  domainLabel: string,
  paths: string[],
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
) {
  describe(`CSRF round-trip — ${domainLabel}`, () => {
    let app: Express;
    let csrfToken: string;
    let cookieHeader: string;

    beforeAll(async () => {
      app = buildTestApp();
      const fetched = await fetchCsrfToken(app);
      csrfToken = fetched.token;
      cookieHeader = fetched.cookieHeader;
    });

    for (const path of paths) {
      const testPath = method === 'POST' ? path : `${path}/1`;

      it(`[${method}] ${path} — passes with valid CSRF token`, async () => {
        const res = await request(app)
          [method.toLowerCase() as 'post' | 'patch' | 'delete'](testPath)
          .set('Cookie', cookieHeader)
          .set('x-csrf-token', csrfToken)
          .send({});
        expect(res.status).not.toBe(403);
      });

      it(`[${method}] ${path} — rejects without CSRF token header`, async () => {
        const res = await request(app)
          [method.toLowerCase() as 'post' | 'patch' | 'delete'](testPath)
          .set('Cookie', cookieHeader)
          .send({});
        expect(res.status).toBe(403);
        expect(res.body?.code).toMatch(/CSRF_TOKEN_MISSING|CSRF_TOKEN_MISMATCH/);
      });

      it(`[${method}] ${path} — rejects with mismatched CSRF token`, async () => {
        const res = await request(app)
          [method.toLowerCase() as 'post' | 'patch' | 'delete'](testPath)
          .set('Cookie', cookieHeader)
          .set('x-csrf-token', 'deadbeef'.repeat(8))
          .send({});
        expect(res.status).toBe(403);
        expect(res.body?.code).toBe('CSRF_TOKEN_MISMATCH');
      });

      it(`[${method}] ${path} — rejects when cookie is absent`, async () => {
        const res = await request(app)
          [method.toLowerCase() as 'post' | 'patch' | 'delete'](testPath)
          .set('x-csrf-token', csrfToken)
          .send({});
        expect(res.status).toBe(403);
      });

      it(`[${method}] ${path} — Bearer token bypasses CSRF (API client flow)`, async () => {
        const res = await request(app)
          [method.toLowerCase() as 'post' | 'patch' | 'delete'](testPath)
          .set('Authorization', 'Bearer some-api-client-token')
          .send({});
        expect(res.status).not.toBe(403);
      });
    }
  });
}

// ── Run CSRF tests across all domains ────────────────────────────────────────

describecsrfDomain('Vessels — alerts', ['/api/vessels/alerts']);
describecsrfDomain('Vessels — orders', ['/api/vessels/orders']);
describecsrfDomain('Terra — properties & leases', ['/api/terra/properties', '/api/terra/leases']);
describecsrfDomain('Terra — pro-forma', ['/api/terra/pro-forma']);
describecsrfDomain('PRISM Counsel — matters', ['/api/prism/matters']);
describecsrfDomain('PRISM Counsel — documents', ['/api/prism/documents']);
describecsrfDomain('Firestorm — findings', ['/api/firestorm/findings']);
describecsrfDomain('Firestorm — assessments', ['/api/firestorm/assessments']);
describecsrfDomain('Lyte — scenarios', ['/api/lyte/scenarios']);
describecsrfDomain('Lyte — decisions', ['/api/lyte/decisions']);
describecsrfDomain('Alloy — channels', ['/api/alloy/channels']);
describecsrfDomain('Alloy — chat', ['/api/alloy/chat']);
describecsrfDomain('Aegis — portfolios', ['/api/aegis/portfolios']);
describecsrfDomain('SZL Holdings — ventures', ['/api/szl-holdings/ventures']);
describecsrfDomain('Agents — runs', ['/api/agents/runs']);
describecsrfDomain('Verifier', ['/api/verifier']);
describecsrfDomain('Audit — records', ['/api/audit/records']);
describecsrfDomain('Approvals — votes', ['/api/approvals/votes']);
describecsrfDomain('Signals', ['/api/signals']);

// ── PATCH / DELETE round-trips ────────────────────────────────────────────────

describecsrfDomain('Vessels — alerts (PATCH)', ['/api/vessels/alerts'], 'PATCH');
describecsrfDomain('Terra — properties (PATCH)', ['/api/terra/properties'], 'PATCH');
describecsrfDomain('PRISM Counsel — matters (DELETE)', ['/api/prism/matters'], 'DELETE');
describecsrfDomain('Firestorm — findings (DELETE)', ['/api/firestorm/findings'], 'DELETE');

// ── CSRF token endpoint itself ─────────────────────────────────────────────────

describe('CSRF token endpoint', () => {
  it('GET /api/csrf-token sets the csrf_token cookie on first request', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/csrf-token');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'] as string[] | undefined;
    expect(cookies).toBeDefined();
    const csrfCookie = (cookies ?? []).find((c) => c.includes('csrf_token='));
    expect(csrfCookie).toBeTruthy();
    expect(csrfCookie).toMatch(/SameSite=Strict/i);
  });

  it('CSRF token is 64 hex characters (256-bit entropy)', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/api/csrf-token');
    const cookieStr = ((res.headers['set-cookie'] as string[]) ?? []).join('; ');
    const match = cookieStr.match(/csrf_token=([a-f0-9]+)/i);
    expect(match).not.toBeNull();
    expect(match![1]!.length).toBe(64);
  });
});
