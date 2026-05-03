/**
 * MCP Gateway Control Plane — Security Regression Tests (Task #3585)
 *
 * Proves that the MCP gateway control-plane routes are protected against:
 *
 *  1. Unauthenticated access — globalAuthEnforcer blocks /api/mcp-gateway/*
 *     and /api/agent-mesh/gateway* before any handler runs (401).
 *
 *  2. Low-privilege access — requireRole('super_admin', 'ops') blocks ordinary
 *     'member' users from reading containment policy or firing enforcement-mode
 *     changes (403).
 *
 *  3. Broad public-prefix bypass — /api/agent-mesh/ is NO longer a blanket
 *     entry in PUBLIC_PREFIXES; only the three genuinely-public paths
 *     (state, index, scan) are allowlisted, so the gateway telemetry
 *     sub-paths are not inadvertently exposed to anonymous callers.
 *
 *  4. Source-level invariant — every /api/mcp-gateway/* handler carries
 *     both authMiddleware() and requireRole('super_admin', 'ops') in its
 *     argument list, verified by reading the route source.
 *
 *  5. Agent-mesh gateway routes carry the same operator-only guard.
 *
 *  6. Sidecar auth — substrate-mcp-gateway only permits GET / and /health
 *     without authentication; /tools, /resources, /prompts, /sse require
 *     a Bearer token.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — required before any production imports
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
    recordLatency: vi.fn(),
  },
}));

vi.mock('@szl-holdings/db', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createDbMock();
});

vi.mock('../lib/logger.js', async () => {
  const m = await import('./helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../lib/gateway-event-bus.js', () => ({
  gatewayEventBus: { emitEvent: vi.fn(), onEvent: vi.fn(() => vi.fn()) },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

const { globalAuthEnforcer } = await import('../middlewares/global-auth-enforcer.js');
const { requireRole } = await import('../middlewares/auth.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __dir = dirname(fileURLToPath(import.meta.url));

function readSrc(relPath: string): string {
  return readFileSync(resolve(__dir, '..', relPath), 'utf8');
}

function readServiceSrc(relPath: string): string {
  return readFileSync(resolve(__dir, '../../../../services', relPath), 'utf8');
}

function successHandler(_req: Request, res: Response) {
  res.json({ ok: true });
}

function injectUser(
  roles: string[],
): (req: Request, _res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    (req as Request & { user: unknown }).user = {
      id: 42,
      displayName: 'Test User',
      email: 'user@example.com',
      roles,
      orgs: [],
    };
    next();
  };
}

// ===========================================================================
// 1. globalAuthEnforcer blocks /api/mcp-gateway/* unauthenticated
// ===========================================================================

describe('globalAuthEnforcer — /api/mcp-gateway/* unauthenticated → 401', () => {
  const MCPGatewayPaths = [
    { method: 'get' as const, path: '/api/mcp-gateway/config' },
    { method: 'get' as const, path: '/api/mcp-gateway/events' },
    { method: 'get' as const, path: '/api/mcp-gateway/latency' },
    { method: 'post' as const, path: '/api/mcp-gateway/proxy' },
    { method: 'patch' as const, path: '/api/mcp-gateway/rules/rule-cursor-elevated/enforcement-mode' },
  ];

  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer as express.RequestHandler);
  for (const { method, path } of MCPGatewayPaths) {
    app[method](path, successHandler);
  }

  for (const { method, path } of MCPGatewayPaths) {
    it(`${method.toUpperCase()} ${path} → 401 without session`, async () => {
      const res = await (request(app)[method](path) as ReturnType<typeof request.agent>).send({});
      expect(res.status).toBe(401);
      expect((res.body as { code?: string }).code).toBe('UNAUTHORIZED');
    });
  }
});

// ===========================================================================
// 2. globalAuthEnforcer blocks /api/agent-mesh/gateway* unauthenticated
// ===========================================================================

describe('globalAuthEnforcer — /api/agent-mesh/gateway* unauthenticated → 401', () => {
  const AgentMeshGatewayPaths = [
    { method: 'get' as const, path: '/api/agent-mesh/gateway' },
    { method: 'get' as const, path: '/api/agent-mesh/gateway/stream' },
    { method: 'get' as const, path: '/api/agent-mesh/gateway/export.csv' },
    { method: 'get' as const, path: '/api/agent-mesh/gateway/latency' },
  ];

  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer as express.RequestHandler);
  for (const { method, path } of AgentMeshGatewayPaths) {
    app[method](path, successHandler);
  }

  for (const { method, path } of AgentMeshGatewayPaths) {
    it(`${method.toUpperCase()} ${path} → 401 without session`, async () => {
      const res = await (request(app)[method](path) as ReturnType<typeof request.agent>).send({});
      expect(res.status).toBe(401);
      expect((res.body as { code?: string }).code).toBe('UNAUTHORIZED');
    });
  }
});

// ===========================================================================
// 3. Public agent-mesh paths still pass through the enforcer
// ===========================================================================

describe('globalAuthEnforcer — /api/agent-mesh/state|index|scan pass through unauthenticated', () => {
  const publicPaths = [
    { method: 'get' as const, path: '/api/agent-mesh/state' },
    { method: 'get' as const, path: '/api/agent-mesh/index' },
    { method: 'post' as const, path: '/api/agent-mesh/scan' },
  ];

  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer as express.RequestHandler);
  for (const { method, path } of publicPaths) {
    app[method](path, successHandler);
  }

  for (const { method, path } of publicPaths) {
    it(`${method.toUpperCase()} ${path} passes through without session (genuinely public)`, async () => {
      const res = await (request(app)[method](path) as ReturnType<typeof request.agent>).send({});
      expect(res.status).toBe(200);
    });
  }
});

// ===========================================================================
// 4. requireRole('super_admin', 'ops') blocks low-privilege 'member' users
// ===========================================================================

describe("requireRole('super_admin', 'ops') — 'member' role → 403", () => {
  const MutationRoutes = [
    { method: 'get' as const, path: '/config' },
    { method: 'get' as const, path: '/events' },
    { method: 'get' as const, path: '/latency' },
    { method: 'post' as const, path: '/proxy' },
    { method: 'patch' as const, path: '/rules/rule-cursor-elevated/enforcement-mode' },
  ];

  const app = express();
  app.use(express.json());
  app.use(injectUser(['member']));
  app.use(requireRole('super_admin', 'ops'));
  app.use(successHandler);

  for (const { method, path } of MutationRoutes) {
    it(`member user on ${method.toUpperCase()} /mcp-gateway${path} → 403`, async () => {
      const res = await (request(app)[method](`/mcp-gateway${path}`) as ReturnType<typeof request.agent>).send({});
      expect(res.status).toBe(403);
    });
  }

  it('super_admin user passes requireRole check (fast-path bypass)', async () => {
    const adminApp = express();
    adminApp.use(express.json());
    adminApp.use(injectUser(['super_admin']));
    adminApp.use(requireRole('super_admin', 'ops'));
    adminApp.use(successHandler);

    const res = await request(adminApp).get('/mcp-gateway/config');
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 5. Source-level invariant: all mcp-gateway route handlers carry auth guards
// ===========================================================================

describe('mcp-gateway route source — every handler has authMiddleware + requireRole', () => {
  const src = readSrc('routes/mcp-gateway.ts');

  const protectedRoutes = [
    "router.get('/mcp-gateway/config', authMiddleware(), requireRole('super_admin', 'ops')",
    "router.get('/mcp-gateway/events', authMiddleware(), requireRole('super_admin', 'ops')",
    "router.get('/mcp-gateway/latency', authMiddleware(), requireRole('super_admin', 'ops')",
    "router.post('/mcp-gateway/proxy', authMiddleware(), requireRole('super_admin', 'ops')",
    "router.patch('/mcp-gateway/rules/:ruleId/enforcement-mode', authMiddleware(), requireRole('super_admin', 'ops')",
  ];

  for (const guard of protectedRoutes) {
    it(`source contains: ${guard.slice(0, 80)}...`, () => {
      expect(src).toContain(guard);
    });
  }
});

// ===========================================================================
// 6. Source-level invariant: agent-mesh gateway routes carry operator auth
// ===========================================================================

describe('agent-mesh route source — gateway handlers have operator-only auth', () => {
  const src = readSrc('routes/agent-mesh.ts');

  const protectedRoutes = [
    "router.get('/agent-mesh/gateway', authMiddleware({ required: true }), requireRole('super_admin', 'ops')",
    "router.get('/agent-mesh/gateway/stream', authMiddleware({ required: true }), requireRole('super_admin', 'ops')",
    "router.get('/agent-mesh/gateway/export.csv', authMiddleware({ required: true }), requireRole('super_admin', 'ops')",
    "router.get('/agent-mesh/gateway/latency', authMiddleware({ required: true }), requireRole('super_admin', 'ops')",
  ];

  for (const guard of protectedRoutes) {
    it(`source contains: ${guard.slice(0, 80)}...`, () => {
      expect(src).toContain(guard);
    });
  }
});

// ===========================================================================
// 7. global-auth-enforcer: /api/agent-mesh/ is NOT a blanket public prefix
// ===========================================================================

describe('global-auth-enforcer — /api/agent-mesh/ is NOT a blanket public prefix', () => {
  const src = readSrc('middlewares/global-auth-enforcer.ts');

  it('does NOT contain the broad "/api/agent-mesh/" prefix in PUBLIC_PREFIXES', () => {
    const lines = src.split('\n');
    const inPublicPrefixes = (() => {
      let inArray = false;
      for (const line of lines) {
        if (line.includes('const PUBLIC_PREFIXES')) inArray = true;
        if (inArray && line.includes('];')) break;
        if (inArray && line.trim() === '"/api/agent-mesh/",') return true;
      }
      return false;
    })();
    expect(inPublicPrefixes).toBe(false);
  });

  it('contains "/api/agent-mesh/state" (genuinely public GET state route)', () => {
    expect(src).toContain('"/api/agent-mesh/state"');
  });

  it('contains "/api/agent-mesh/index" (genuinely public GET index route)', () => {
    expect(src).toContain('"/api/agent-mesh/index"');
  });

  it('contains "/api/agent-mesh/scan" (genuinely public POST scan route)', () => {
    expect(src).toContain('"/api/agent-mesh/scan"');
  });
});

// ===========================================================================
// 8. Sidecar auth: only /health and / are public GET paths; /tools, /resources,
//    /prompts, /sse are NOT in the public allowlist
// ===========================================================================

describe('substrate-mcp-gateway auth.ts — public surface is narrow', () => {
  const src = readServiceSrc('substrate-mcp-gateway/src/auth.ts');

  it("PUBLIC_GET_PATHS contains only '/' and '/health'", () => {
    expect(src).toContain("const PUBLIC_GET_PATHS = new Set(['/', '/health'])");
  });

  it("PUBLIC_METHODS does NOT include 'initialize'", () => {
    const methodsMatch = src.match(/const PUBLIC_METHODS\s*=\s*new Set\(\[([^\]]*)\]\)/s);
    const methodsContent = methodsMatch?.[1] ?? '';
    expect(methodsContent).not.toContain("'initialize'");
  });

  it("PUBLIC_METHODS does NOT include 'resources/list'", () => {
    const methodsMatch = src.match(/const PUBLIC_METHODS\s*=\s*new Set\(\[([^\]]*)\]\)/s);
    const methodsContent = methodsMatch?.[1] ?? '';
    expect(methodsContent).not.toContain("'resources/list'");
  });

  it("PUBLIC_METHODS does NOT include 'prompts/list'", () => {
    const methodsMatch = src.match(/const PUBLIC_METHODS\s*=\s*new Set\(\[([^\]]*)\]\)/s);
    const methodsContent = methodsMatch?.[1] ?? '';
    expect(methodsContent).not.toContain("'prompts/list'");
  });

  it('authMiddleware is applied at the router level before route handlers', () => {
    const transportSrc = readServiceSrc('substrate-mcp-gateway/src/transport/http.ts');
    expect(transportSrc).toContain('router.use(authMiddleware)');
  });
});
