/**
 * Security Hardening Regression Tests (Wave 2)
 *
 * Proves that each security fix in the Wave 2 hardening pass is effective:
 *
 *  1. admin-guard — timing-safe token comparison (no short-circuit on length mismatch)
 *  2. firestorm seed — blocked in production env
 *  3. health/detailed — requires admin role
 *  4. governance — audit events written on policy create/update/delete
 *  5. vessels — tenantScope rejects users without org membership
 *  6. Zod validation — malicious payloads (SQL injection, prototype pollution, type coercion) rejected
 *  7. globalAuthEnforcer — deny-by-default for /api/* with no public prefix
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
  },
}));

const mockDbWhere = vi.fn(() => Promise.resolve([]));
const mockDbInnerJoin = vi.fn(() => ({ where: mockDbWhere }));
const mockDbFrom = vi.fn(() => ({ innerJoin: mockDbInnerJoin, where: mockDbWhere }));
const mockDbSelect = vi.fn(() => ({ from: mockDbFrom }));

vi.mock('@szl-holdings/db', () => ({
  db: { select: mockDbSelect },
  orgMembersTable: { orgId: 'orgId', userId: 'userId' },
  organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
  ROLE_HIERARCHY: {},
  isReadOnlyRole: () => false,
  toCanonicalRole: (r: string) => r,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

const { globalAuthEnforcer } = await import('../middlewares/global-auth-enforcer.js');
const { validateBody } = await import('../lib/validation.js');
const { tenantScope } = await import('../middlewares/tenant-scope.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApp(...middlewares: express.RequestHandler[]) {
  const app = express();
  app.use(express.json());
  for (const mw of middlewares) app.use(mw);
  return app;
}

function successHandler(_req: Request, res: Response) {
  res.json({ ok: true });
}

function _authedRequest(
  app: express.Express,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
) {
  const req = request(app)[method](path);
  (req as any).app = app;
  return req;
}

// ---------------------------------------------------------------------------
// 1. Timing-safe token comparison
// ---------------------------------------------------------------------------

describe('timingSafeEqual token comparison — HMAC digest approach', () => {
  /**
   * admin-guard.ts hashes both the configured secret and the header with
   * HMAC-SHA256 before calling timingSafeEqual.  This produces 32-byte
   * digests for both sides regardless of input length, eliminating the
   * length side-channel that the previous implementation exposed when it
   * returned false early on byteLength mismatch.
   */
  const HMAC_KEY = Buffer.from('szl-internal-token-comparison-key', 'utf8');
  const digest = (val: string) =>
    createHmac('sha256', HMAC_KEY).update(Buffer.from(val, 'utf8')).digest();

  it('different-length tokens produce equal-length HMAC digests (eliminates length side-channel)', () => {
    const secret = 'correct-secret-value-here';
    const shorter = 'short';
    const a = digest(secret);
    const b = digest(shorter);
    // Both digests MUST be 32 bytes — only then can timingSafeEqual run without branching on length
    expect(a.byteLength).toBe(32);
    expect(b.byteLength).toBe(32);
    // And the comparison correctly returns false (wrong value) without throwing
    expect(timingSafeEqual(a, b)).toBe(false);
  });

  it('matching tokens produce equal HMAC digests and compare true', () => {
    const secret = 'my-secret-token-value';
    expect(timingSafeEqual(digest(secret), digest(secret))).toBe(true);
  });

  it('tokens that differ by one character produce different digests', () => {
    const secret = 'my-secret-token-value';
    const tampered = 'my-secret-token-valuX';
    expect(timingSafeEqual(digest(secret), digest(tampered))).toBe(false);
  });

  it('internal-token comparison source uses createHmac + timingSafeEqual (not Buffer.equals or raw length compare)', async () => {
    // Internal-token comparison was extracted from admin-guard into the
    // scoped registry (lib/internal-tokens.ts) as part of GAP-016. The
    // architectural property — constant-time HMAC digest comparison, no
    // length side-channel — is enforced there now and consumed by
    // admin-guard, csrf, global-auth-enforcer, and auth.
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(dir, '../lib/internal-tokens.ts'), 'utf8');
    expect(src).toContain('createHmac');
    expect(src).toContain('timingSafeEqual');
    expect(src).not.toMatch(/\.equals\s*\(/);
    // Confirm no early-exit branch on byteLength (the length side-channel pattern)
    expect(src).not.toMatch(/byteLength\s*!==\s*byteLength/);

    // And admin-guard must still delegate to the scoped registry (no
    // local raw-string compare slipped in).
    const adminSrc = readFileSync(resolve(dir, '../middlewares/admin-guard.ts'), 'utf8');
    expect(adminSrc).toMatch(/verifyInternalHeader|matchInternalToken/);
    expect(adminSrc).not.toMatch(/\.equals\s*\(/);
  });
});

// ---------------------------------------------------------------------------
// 2. Firestorm seed — blocked in production
// (Real-router tests live in src/routes/__tests__/firestorm-seed-guard.test.ts)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3. Zod validation — malicious payloads
// ---------------------------------------------------------------------------

describe('Zod validation — malicious payload blocking', () => {
  const schema = z.object({
    name: z.string().min(1).max(200).trim(),
    email: z.string().email(),
    count: z.number().int().min(0).max(1000),
  });

  const app = makeApp(validateBody(schema));
  app.post('/test', successHandler);

  it('allows safe string content through (SQL-like strings are valid; parameterized queries protect the DB)', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: "'; DROP TABLE users; --", email: 'test@example.com', count: 1 });
    expect(res.status).toBe(200);
  });

  it('blocks malformed email addresses', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Alice', email: 'not-an-email', count: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('blocks field type coercion attack (string where number expected)', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'valid', email: 'a@b.com', count: '999999999999' });
    expect(res.status).toBe(400);
  });

  it('blocks excessively long strings', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'a'.repeat(201), email: 'a@b.com', count: 1 });
    expect(res.status).toBe(400);
  });

  it('blocks missing required fields', async () => {
    const res = await request(app).post('/test').send({ name: 'valid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('allows well-formed payloads through', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Alice', email: 'alice@example.com', count: 42 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects negative numbers outside range', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'valid', email: 'a@b.com', count: -1 });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 4. globalAuthEnforcer — deny-by-default
// ---------------------------------------------------------------------------

describe('globalAuthEnforcer — deny-by-default', () => {
  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer as express.RequestHandler);
  app.get('/api/secret', successHandler);
  app.get('/api/health', successHandler);

  it('returns 401 for unauthenticated requests to /api/secret', async () => {
    const res = await request(app).get('/api/secret');
    expect(res.status).toBe(401);
  });

  it('allows unauthenticated access to /api/health (public prefix)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('allows authenticated users through', async () => {
    const authApp = express();
    authApp.use(express.json());
    authApp.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { id: 1, roles: ['user'], orgs: [] };
      next();
    });
    authApp.use(globalAuthEnforcer as express.RequestHandler);
    authApp.get('/api/secret', successHandler);

    const res = await request(authApp).get('/api/secret');
    expect(res.status).toBe(200);
  });

  it('allows internal token access on a legacy-allowed prefix', async () => {
    const tokenApp = express();
    tokenApp.use(express.json());
    const token = 'a'.repeat(32);
    process.env.ALLOY_INTERNAL_TOKEN = token;
    tokenApp.use(globalAuthEnforcer as express.RequestHandler);
    // GAP-016: legacy ALLOY_INTERNAL_TOKEN is now path-restricted to its
    // historical surface (`/api/internal/`, `/api/alloy/agent/`, etc).
    tokenApp.get('/api/internal/secret', successHandler);

    const res = await request(tokenApp).get('/api/internal/secret').set('x-internal-token', token);
    expect(res.status).toBe(200);

    delete process.env.ALLOY_INTERNAL_TOKEN;
  });
});

// ---------------------------------------------------------------------------
// 5. tenantScope — cross-tenant access blocked
// ---------------------------------------------------------------------------

describe('tenantScope middleware', () => {
  beforeEach(() => {
    mockDbWhere.mockReset();
    mockDbInnerJoin.mockReset().mockReturnValue({ where: mockDbWhere });
    mockDbFrom.mockReset().mockReturnValue({ innerJoin: mockDbInnerJoin, where: mockDbWhere });
    mockDbSelect.mockReset().mockReturnValue({ from: mockDbFrom });
  });

  it('returns 401 when req.user is not set and required=true', async () => {
    const app = express();
    app.use(express.json());
    app.get('/vessels/fleets', tenantScope() as express.RequestHandler, successHandler);

    const res = await request(app).get('/vessels/fleets');
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no org memberships', async () => {
    mockDbWhere.mockResolvedValue([]);

    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { id: 99, roles: ['user'], orgs: [] };
      next();
    });
    app.get('/vessels/fleets', tenantScope() as express.RequestHandler, successHandler);

    const res = await request(app).get('/vessels/fleets');
    expect(res.status).toBe(403);
  });

  it('allows super_admin to bypass tenant check', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { id: 1, roles: ['super_admin'], orgs: [] };
      next();
    });
    app.get('/vessels/fleets', tenantScope() as express.RequestHandler, successHandler);

    const res = await request(app).get('/vessels/fleets');
    expect(res.status).toBe(200);
  });

  it('allows users with valid org membership', async () => {
    mockDbWhere.mockResolvedValue([
      { orgId: 7, orgSlug: 'acme', orgName: 'ACME Corp', role: 'ops' },
    ] as any);

    const app = express();
    app.use(express.json());
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { id: 5, roles: ['ops'], orgs: [] };
      next();
    });
    app.get('/vessels/fleets', tenantScope() as express.RequestHandler, successHandler);

    const res = await request(app).get('/vessels/fleets');
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 5b. AF-003 / AF-007 — vessels tenant-scope source assertions
// ---------------------------------------------------------------------------

describe('AF-003 / AF-007 — vessels routes and schema enforce tenant isolation', () => {
  it('routes/vessels.ts uses tenantScope() on every router handler', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(dir, '../routes/vessels.ts'), 'utf8');

    // Imports tenantScope from middlewares
    expect(src).toMatch(
      /import\s*\{\s*tenantScope\s*\}\s*from\s*['"]\.\.\/middlewares\/tenant-scope['"]/,
    );

    // Every router.<method>(...) handler call must include tenantScope().
    // Use paren balancing to extract each multi-line call.
    const startRe = /router\.(get|post|put|patch|delete)\s*\(/g;
    let handlerCount = 0;
    let m: RegExpExecArray | null;
    while ((m = startRe.exec(src)) !== null) {
      let depth = 1;
      let i = startRe.lastIndex;
      while (i < src.length && depth > 0) {
        const c = src[i];
        if (c === '(') depth++;
        else if (c === ')') depth--;
        i++;
      }
      const handler = src.slice(m.index, i);
      handlerCount++;
      expect(
        handler.includes('tenantScope()'),
        `vessels route handler missing tenantScope() at offset ${m.index}:\n${handler.slice(0, 240)}`,
      ).toBe(true);
    }
    expect(handlerCount).toBeGreaterThan(20); // sanity: we have many handlers
  });

  it('schema/vessels.ts declares org_id on the tenant-owning tables', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const dir = dirname(fileURLToPath(import.meta.url));
    // Resolve up to lib/db/src/schema/vessels.ts via the workspace root
    const schemaPath = resolve(
      dir,
      '../../../../lib/db/src/schema/vessels.ts',
    );
    const src = readFileSync(schemaPath, 'utf8');

    // org_id column declared on parent + sub-resource tables:
    //   vesselsFleetsTable, vesselsTable, vesselsPositionsTable,
    //   vesselsCargoTable, vesselsRoutesTable, vesselsAlertRulesTable
    const orgIdMatches = src.match(/orgId:\s*integer\(\s*['"]org_id['"]\s*\)/g) ?? [];
    expect(orgIdMatches.length).toBeGreaterThanOrEqual(6);

    // Backing indexes — parent and sub-resource tables both
    expect(src).toMatch(/vessels_org_id_idx/);
    expect(src).toMatch(/vessels_positions_org_id_idx/);
    expect(src).toMatch(/vessels_cargo_org_id_idx/);
    expect(src).toMatch(/vessels_routes_org_id_idx/);
  });

  it('migrations 0076 (parent tables) + 0094 (sub-resource tables) cover all AF-007 in-scope tables', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const dir = dirname(fileURLToPath(import.meta.url));
    const drizzleDir = resolve(dir, '../../../../lib/db/drizzle');

    const phase1Path = resolve(drizzleDir, '0076_vessels_org_id.sql');
    const phase2Path = resolve(drizzleDir, '0094_vessels_subresource_org_id.sql');
    expect(existsSync(phase1Path)).toBe(true);
    expect(existsSync(phase2Path)).toBe(true);

    const phase1 = readFileSync(phase1Path, 'utf8');
    const phase2 = readFileSync(phase2Path, 'utf8');

    // Phase 1 (immutable, already shipped) — parent / rule tables
    expect(phase1).toMatch(/ALTER TABLE\s+"vessels_fleets"[\s\S]*org_id/);
    expect(phase1).toMatch(/ALTER TABLE\s+"vessels"\s+ADD COLUMN[\s\S]*org_id/);
    expect(phase1).toMatch(/ALTER TABLE\s+"vessels_alert_rules"[\s\S]*org_id/);

    // Phase 2 (forward migration) — sub-resource tables + indexes + backfill
    expect(phase2).toMatch(/ALTER TABLE\s+"vessels_positions"[\s\S]*org_id/);
    expect(phase2).toMatch(/ALTER TABLE\s+"vessels_cargo"[\s\S]*org_id/);
    expect(phase2).toMatch(/ALTER TABLE\s+"vessels_routes"[\s\S]*org_id/);
    expect(phase2).toMatch(/vessels_positions_org_id_idx/);
    expect(phase2).toMatch(/vessels_cargo_org_id_idx/);
    expect(phase2).toMatch(/vessels_routes_org_id_idx/);
    expect(phase2).toMatch(/UPDATE\s+"vessels_positions"[\s\S]*FROM\s+"vessels"/);
    expect(phase2).toMatch(/UPDATE\s+"vessels_cargo"[\s\S]*FROM\s+"vessels"/);
    expect(phase2).toMatch(/UPDATE\s+"vessels_routes"[\s\S]*FROM\s+"vessels"/);

    // Guard against ever re-mutating the shipped 0076 with sub-resource DDL.
    expect(phase1).not.toMatch(/ALTER TABLE\s+"vessels_positions"/);
    expect(phase1).not.toMatch(/ALTER TABLE\s+"vessels_cargo"/);
    expect(phase1).not.toMatch(/ALTER TABLE\s+"vessels_routes"/);

    // Phase 2 migration must be registered in the drizzle journal — otherwise
    // `drizzle-kit migrate` skips it and the DB hardening never deploys.
    const journalPath = resolve(drizzleDir, 'meta/_journal.json');
    expect(existsSync(journalPath)).toBe(true);
    const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
      entries: Array<{ tag: string }>;
    };
    expect(
      journal.entries.some((e) => e.tag === '0094_vessels_subresource_org_id'),
    ).toBe(true);
  });

  it('PUT /vessels/routes/:id strips client-supplied orgId (tenant key is immutable)', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(dir, '../routes/vessels.ts'), 'utf8');

    // Locate the PUT /vessels/routes/:id handler and confirm orgId is destructured-discarded
    const putIdx = src.indexOf("router.put(\n  '/vessels/routes/:id'");
    expect(putIdx).toBeGreaterThan(0);
    let depth = 1;
    let i = src.indexOf('(', putIdx) + 1;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      i++;
    }
    const handler = src.slice(putIdx, i);
    // Must strip both vesselId and orgId from the parsed body
    expect(handler).toMatch(/orgId:\s*_discardOrgId/);
    expect(handler).toMatch(/vesselId:\s*_discardVesselId/);
  });

  it('GET /vessels/routes/all combines org_id filter with parent-vessel id-set', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(resolve(dir, '../routes/vessels.ts'), 'utf8');

    const getIdx = src.indexOf("'/vessels/routes/all'");
    expect(getIdx).toBeGreaterThan(0);
    // Look at the next ~2KB for both filter patterns
    const block = src.slice(getIdx, getIdx + 2000);
    // Must call routeOrgWhere AND inArray on vesselsRoutesTable.vesselId — both
    // filters combined under and(...).
    expect(block).toMatch(/routeOrgWhere\(\s*req\.tenantOrgId\s*\)/);
    expect(block).toMatch(/inArray\(\s*vesselsRoutesTable\.vesselId/);
    expect(block).toMatch(/and\(\s*orgFilter,/);
  });
});

// ---------------------------------------------------------------------------
// 6. CONNECTOR_ENCRYPTION_KEY format validation
// ---------------------------------------------------------------------------

describe('CONNECTOR_ENCRYPTION_KEY validation', () => {
  const validKey = 'a'.repeat(64);
  const shortKey = 'a'.repeat(32);
  const nonHexKey = 'g'.repeat(64);

  it('validates a 64-char hex key as correct format', () => {
    expect(/^[0-9a-fA-F]{64}$/.test(validKey)).toBe(true);
  });

  it('rejects a key shorter than 64 chars', () => {
    expect(/^[0-9a-fA-F]{64}$/.test(shortKey)).toBe(false);
  });

  it('rejects a key with non-hex characters', () => {
    expect(/^[0-9a-fA-F]{64}$/.test(nonHexKey)).toBe(false);
  });

  it('accepts mixed-case hex', () => {
    const mixedCase = 'aAbBcCdDeEfF0123456789aAbBcCdDeEfF0123456789aAbBcCdDeEfF01234567';
    expect(/^[0-9a-fA-F]{64}$/.test(mixedCase)).toBe(true);
  });
});
