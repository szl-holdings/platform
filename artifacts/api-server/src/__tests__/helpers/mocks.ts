/**
 * Shared mock factories for API integration tests.
 *
 * These factories return module-shaped objects suitable for use inside
 * `vi.mock(..., async () => { const m = await import("./helpers/mocks.js"); return m.createXxxMock(); })`.
 *
 * Centralizing these mocks means adding a new DB table, telemetry method, or
 * websocket channel only needs to be updated in one place.
 */

import type { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// @szl-holdings/observability
// ---------------------------------------------------------------------------

export function createObservabilityMock() {
  return {
    serverTelemetry: {
      recordAuthFailure: vi.fn(),
      recordRequest: vi.fn(),
      recordError: vi.fn(),
      recordLatency: vi.fn(),
      recordMutation: vi.fn(),
    },
  };
}

// ---------------------------------------------------------------------------
// @szl-holdings/db
//
// A universal DB mock. The exported module is wrapped in a Proxy so that any
// table/symbol the production code imports is auto-stubbed — so adding a new
// table to the schema does NOT require updating this helper.
//
// The query chain uses a recursive Proxy that:
//   - returns itself for any chained method (.from, .where, .orderBy, ...)
//   - is awaitable (`then`) and resolves to []
// This satisfies every drizzle-style call pattern used by the routes under
// test (where 401/400 fires before any handler actually consumes results).
// ---------------------------------------------------------------------------

function makeDbChain(): unknown {
  const target: unknown = () => makeDbChain();
  return new Proxy(target as object, {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) =>
          Promise.resolve([]).then(resolve, reject);
      }
      if (prop === Symbol.toPrimitive) return undefined;
      return () => makeDbChain();
    },
    apply() {
      return makeDbChain();
    },
  });
}

export function createDbMock() {
  const db: Record<string, unknown> = {
    select: () => makeDbChain(),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: 1 }]),
        onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
      }),
    }),
    update: () => ({
      set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }),
    }),
    delete: () => ({ where: () => Promise.resolve([]) }),
    transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(db),
  };

  const stubTable = {};
  return new Proxy(
    {
      db,
      ROLE_HIERARCHY: {},
      isReadOnlyRole: () => false,
      toCanonicalRole: (r: string) => r,
    } as Record<string, unknown>,
    {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        // Default any unknown export (e.g. drizzle table objects) to a stub.
        // This is what makes adding a new table to the schema a no-op for
        // these test helpers — the proxy auto-stubs whatever the route
        // imports.
        return stubTable;
      },
      has() {
        // Tell vitest's export-validation wrapper that every named export
        // exists on this mock module.
        return true;
      },
    },
  );
}

// ---------------------------------------------------------------------------
// drizzle-orm operator mock
// ---------------------------------------------------------------------------

export function createDrizzleOrmMock() {
  const noop = (..._args: unknown[]) => ({});
  return {
    eq: noop,
    ne: noop,
    and: noop,
    or: noop,
    desc: noop,
    asc: noop,
    isNull: noop,
    isNotNull: noop,
    inArray: noop,
    notInArray: noop,
    sql: noop,
    count: noop,
    gt: noop,
    gte: noop,
    lt: noop,
    lte: noop,
    like: noop,
    ilike: noop,
    not: noop,
    relations: noop,
  };
}

// ---------------------------------------------------------------------------
// ../lib/logger.js
// ---------------------------------------------------------------------------

export function createLoggerMock() {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(() => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// ../middlewares/auth.js
//
// Pass a custom user object to inject for routes that require auth.
// ---------------------------------------------------------------------------

export interface MockAuthUser {
  id: number;
  email: string;
  roles: string[];
  orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }>;
}

export const DEFAULT_MOCK_AUTH_USER: MockAuthUser = {
  id: 99,
  email: 'tester@example.com',
  roles: ['member'],
  orgs: [{ orgId: 1, orgSlug: 'test-org', orgName: 'Test Org', role: 'member' }],
};

export function createAuthMiddlewareMock(user: MockAuthUser = DEFAULT_MOCK_AUTH_USER) {
  return {
    authMiddleware: (_opts?: unknown) => (req: Request, _res: Response, next: NextFunction) => {
      (req as unknown as { user: MockAuthUser }).user = user;
      next();
    },
    parseIdParam: (paramName: string) => (req: Request, res: Response, next: NextFunction) => {
      const val = req.params[paramName];
      if (!val || Number.isNaN(Number(val))) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }
      next();
    },
    requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
    requireOrgMembership: () => (_req: Request, _res: Response, next: NextFunction) => next(),
    denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
    InvalidIdError: class extends Error {},
  };
}

// ---------------------------------------------------------------------------
// ../lib/websocket.js
//
// WS_CHANNELS is a Proxy returning the snake-cased key as the channel value
// for any property accessed (so adding a new channel to production code does
// not break tests).
// ---------------------------------------------------------------------------

/**
 * Known production channel values. Mirrors the real `WS_CHANNELS` in
 * `artifacts/api-server/src/lib/websocket.ts` for the keys that tests
 * currently rely on. Any unknown channel falls through to a derived default
 * (lowercased, underscores → hyphens), which is sufficient for tests that
 * only need a unique opaque string.
 *
 * Add to this map (or pass `overrides`) when production introduces a new
 * channel that tests need to assert against.
 */
const KNOWN_WS_CHANNELS: Record<string, string> = {
  GENERAL: 'general',
  NOTIFICATIONS: 'notifications',
  MONTE_CARLO_PROGRESS: 'monte-carlo:progress',
};

export function createWebsocketMock(overrides: Record<string, string> = {}) {
  const channels = { ...KNOWN_WS_CHANNELS, ...overrides };
  const WS_CHANNELS = new Proxy(channels, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (prop in target) return target[prop];
      return prop.toLowerCase().replace(/_/g, '-');
    },
  });
  return {
    WS_CHANNELS,
    publish: vi.fn(),
    getMessagesSince: vi.fn(() => []),
    getPresence: vi.fn(() => []),
    issueWsTicket: vi.fn(() => 'ticket-mock'),
  };
}

// ---------------------------------------------------------------------------
// @szl-holdings/forge-runtime
// ---------------------------------------------------------------------------

export function createForgeRuntimeMock() {
  return {
    forgeRuntime: { execute: vi.fn(async () => ({})), isAvailable: () => false },
    durableJobQueue: {
      enqueue: vi.fn(async () => ({ id: 'job-1' })),
    },
  };
}
