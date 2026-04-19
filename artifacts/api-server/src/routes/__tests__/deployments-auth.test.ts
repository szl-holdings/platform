/**
 * Deployments routes — auth + data integration tests (#1164)
 *
 * Locks the contract that authenticated GETs return 200 JSON, that the
 * "no active deployment" 404 is the route's own legitimate response (not a
 * routing/auth misconfiguration), and that POST rollback succeeds for users
 * with an ops-class role and is rejected otherwise.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import request from "supertest";

interface DeploymentRow {
  id: number;
  appId: string;
  appName: string;
  version: string;
  environment: "production" | "staging" | "development";
  status: "active" | "deploying" | "rolled-back" | "failed" | "inactive";
  deployedAt: Date;
  deployedBy: string;
  commitSha: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

const store: { rows: DeploymentRow[]; nextId: number } = { rows: [], nextId: 1 };

function resetStore(seed: Partial<DeploymentRow>[] = []): void {
  store.rows = [];
  store.nextId = 1;
  for (const r of seed) {
    store.rows.push({
      id: store.nextId++,
      appId: r.appId ?? "pulse",
      appName: r.appName ?? "Pulse",
      version: r.version ?? "v1.0.0",
      environment: r.environment ?? "production",
      status: r.status ?? "active",
      deployedAt: r.deployedAt ?? new Date(),
      deployedBy: r.deployedBy ?? "system",
      commitSha: r.commitSha ?? null,
      notes: r.notes ?? null,
      metadata: r.metadata ?? null,
    });
  }
}

vi.mock("drizzle-orm", () => {
  const tag = (kind: string) => (..._args: unknown[]) => ({ _kind: kind, _args });
  return {
    and: tag("and"),
    or: tag("or"),
    eq: (col: { _colName?: string }, val: unknown) => ({ _kind: "eq", col: col?._colName, val }),
    asc: tag("asc"),
    desc: tag("desc"),
    inArray: (col: { _colName?: string }, vals: unknown[]) => ({ _kind: "inArray", col: col?._colName, vals }),
    sql: tag("sql"),
  };
});

vi.mock("@szl-holdings/db", () => {
  const col = (name: string) => ({ _colName: name });
  const deploymentsTable = new Proxy({} as Record<string, unknown>, {
    get: (_t, p) => col(String(p)),
  });
  const usersTable = new Proxy({} as Record<string, unknown>, {
    get: (_t, p) => col(String(p)),
  });
  const notificationsTable = new Proxy({} as Record<string, unknown>, {
    get: (_t, p) => col(String(p)),
  });
  const notificationPreferencesTable = new Proxy({} as Record<string, unknown>, {
    get: (_t, p) => col(String(p)),
  });

  function makeSelectChain(table: unknown) {
    const state: { conds: unknown[]; orderRows?: DeploymentRow[] } = { conds: [] };
    const chain: Record<string, unknown> = {
      from(_t: unknown) { (state as { table: unknown }).table = _t; return chain; },
      where(cond: unknown) { state.conds.push(cond); return chain; },
      orderBy() { return chain; },
      groupBy() { return chain; },
      innerJoin() { return chain; },
      limit(_n: number) {
        const rows = runQuery(table, state.conds);
        return Promise.resolve(rows.slice(0, _n));
      },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        const rows = runQuery(table, state.conds);
        return Promise.resolve(rows).then(resolve, reject);
      },
    };
    return chain;
  }

  function runQuery(table: unknown, conds: unknown[]): unknown[] {
    if (table === deploymentsTable) {
      return store.rows.filter((r) => matches(r, conds));
    }
    // usersTable / notification* tables — return empty for these tests.
    return [];
  }

  function matches(row: DeploymentRow, conds: unknown[]): boolean {
    return conds.every((c) => evalCond(row, c));
  }

  function evalCond(row: DeploymentRow, c: unknown): boolean {
    if (!c || typeof c !== "object") return true;
    const k = (c as { _kind?: string })._kind;
    if (k === "and") return ((c as { _args: unknown[] })._args).every((a) => evalCond(row, a));
    if (k === "or") return ((c as { _args: unknown[] })._args).some((a) => evalCond(row, a));
    if (k === "eq") {
      const { col, val } = c as { col: string; val: unknown };
      return (row as unknown as Record<string, unknown>)[col] === val;
    }
    if (k === "inArray") {
      const { col, vals } = c as { col: string; vals: unknown[] };
      return vals.includes((row as unknown as Record<string, unknown>)[col]);
    }
    return true;
  }

  function makeUpdateChain(table: unknown) {
    let setVals: Record<string, unknown> = {};
    const chain: Record<string, unknown> = {
      set(v: Record<string, unknown>) { setVals = v; return chain; },
      where(cond: unknown) {
        if (table === deploymentsTable) {
          for (const r of store.rows) {
            if (matches(r, [cond])) Object.assign(r, setVals);
          }
        }
        return Promise.resolve([]);
      },
    };
    return chain;
  }

  function makeInsertChain(table: unknown) {
    let inserted: DeploymentRow | null = null;
    const chain: Record<string, unknown> = {
      values(v: Partial<DeploymentRow>) {
        if (table === deploymentsTable) {
          inserted = {
            id: store.nextId++,
            appId: v.appId!,
            appName: v.appName ?? v.appId!,
            version: v.version!,
            environment: v.environment ?? "production",
            status: v.status ?? "active",
            deployedAt: v.deployedAt ?? new Date(),
            deployedBy: v.deployedBy ?? "system",
            commitSha: v.commitSha ?? null,
            notes: v.notes ?? null,
            metadata: v.metadata ?? null,
          };
          store.rows.push(inserted);
        }
        return chain;
      },
      returning() { return Promise.resolve(inserted ? [inserted] : []); },
    };
    return chain;
  }

  const db = {
    select: (_fields?: unknown) => ({
      from: (table: unknown) => makeSelectChain(table),
    }),
    update: (table: unknown) => makeUpdateChain(table),
    insert: (table: unknown) => makeInsertChain(table),
    transaction: async <T,>(fn: (tx: typeof db) => Promise<T>): Promise<T> => fn(db),
  };

  return {
    db,
    deploymentsTable,
    usersTable,
    notificationsTable,
    notificationPreferencesTable,
  };
});

vi.mock("../../lib/websocket", () => ({
  publish: vi.fn(),
  WS_CHANNELS: { NOTIFICATIONS: "notifications" },
}));

vi.mock("../notifications", () => ({
  dispatchToExternalChannels: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../middlewares/sliding-window-limiter", () => ({
  perUserApiSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
  perUserWriteSlidingLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock("../../lib/validation", () => ({
  validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  jsonObjectBodySchema: {},
  listQuerySchema: {},
}));

let authUser: { id: number; email: string; displayName: string; roles: string[]; isReadOnly?: boolean } | null = null;

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: (opts: { required?: boolean } = {}) => (req: Request, res: Response, next: NextFunction): void => {
    if (authUser) {
      (req as Request & { user: typeof authUser }).user = authUser;
      next();
      return;
    }
    if (opts.required) {
      res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
      return;
    }
    next();
  },
  denyIfReadOnly: () => (req: Request, res: Response, next: NextFunction): void => {
    const u = (req as Request & { user?: { isReadOnly?: boolean } }).user;
    if (u?.isReadOnly) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN_READ_ONLY" });
      return;
    }
    next();
  },
  requireRole: (...allowed: string[]) => (req: Request, res: Response, next: NextFunction): void => {
    const u = (req as Request & { user?: { roles: string[] } }).user;
    if (!u) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (!u.roles.some((r) => allowed.includes(r))) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }
    next();
  },
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

let app: ReturnType<typeof express>;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  const { default: deploymentsRouter } = await import("../deployments");
  app.use("/api", deploymentsRouter);
});

beforeEach(() => {
  authUser = null;
  resetStore();
});

const ADMIN = { id: 72, email: "ops@example.com", displayName: "Ops User", roles: ["admin"] };
const VIEWER = { id: 73, email: "viewer@example.com", displayName: "Viewer", roles: ["analyst"] };

describe("Deployments routes — authenticated reads return 200 JSON (#1164)", () => {
  it("GET /api/deployments returns 200 with the active rows for an authenticated user", async () => {
    resetStore([
      { appId: "pulse", appName: "Pulse", version: "v1.1.0", status: "active" },
      { appId: "pulse", appName: "Pulse", version: "v1.0.0", status: "inactive" },
      { appId: "command", appName: "Command", version: "v2.0.0", status: "active" },
    ]);
    authUser = ADMIN;
    const res = await request(app).get("/api/deployments");
    expect(res.status).toBe(200);
    expect(res.body.environment).toBe("production");
    expect(res.body.count).toBe(2);
    expect(res.body.deployments.map((d: { appId: string }) => d.appId).sort()).toEqual(["command", "pulse"]);
  });

  it("GET /api/deployments/:appId returns 200 when an active row exists", async () => {
    resetStore([{ appId: "pulse", appName: "Pulse", version: "v1.1.0", status: "active" }]);
    authUser = ADMIN;
    const res = await request(app).get("/api/deployments/pulse");
    expect(res.status).toBe(200);
    expect(res.body.appId).toBe("pulse");
    expect(res.body.version).toBe("v1.1.0");
    expect(res.body.status).toBe("active");
  });

  it("GET /api/deployments/:appId returns 404 — the route's own 'no active deployment' response, not a routing miss", async () => {
    authUser = ADMIN;
    const res = await request(app).get("/api/deployments/pulse");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/No active deployment for app 'pulse'/);
  });

  it("GET /api/deployments/:appId/history returns 200 with the full version chain", async () => {
    resetStore([
      { appId: "pulse", appName: "Pulse", version: "v1.0.0", status: "inactive", deployedAt: new Date("2026-04-18T00:00:00Z") },
      { appId: "pulse", appName: "Pulse", version: "v1.1.0", status: "active", deployedAt: new Date("2026-04-19T00:00:00Z") },
    ]);
    authUser = ADMIN;
    const res = await request(app).get("/api/deployments/pulse/history");
    expect(res.status).toBe(200);
    expect(res.body.appId).toBe("pulse");
    expect(res.body.count).toBe(2);
    expect(res.body.history.map((h: { version: string }) => h.version)).toEqual(["v1.0.0", "v1.1.0"]);
  });

  it("GET /api/deployments/:appId/history returns 200 with an empty array when no history exists (not a 404)", async () => {
    authUser = ADMIN;
    const res = await request(app).get("/api/deployments/pulse/history");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.history).toEqual([]);
  });
});

describe("Deployments rollback — authorization + happy path (#1164)", () => {
  it("POST /api/deployments/:appId/rollback requires authentication", async () => {
    authUser = null;
    const res = await request(app)
      .post("/api/deployments/pulse/rollback")
      .send({ environment: "production" });
    expect(res.status).toBe(401);
  });

  it("POST /api/deployments/:appId/rollback rejects users without an ops-class role", async () => {
    resetStore([
      { appId: "pulse", appName: "Pulse", version: "v1.0.0", status: "inactive", deployedAt: new Date("2026-04-18T00:00:00Z") },
      { appId: "pulse", appName: "Pulse", version: "v1.1.0", status: "active", deployedAt: new Date("2026-04-19T00:00:00Z") },
    ]);
    authUser = VIEWER;
    const res = await request(app)
      .post("/api/deployments/pulse/rollback")
      .send({ environment: "production" });
    expect(res.status).toBe(403);
  });

  it("POST /api/deployments/:appId/rollback succeeds for an admin and flips the active version", async () => {
    resetStore([
      { appId: "pulse", appName: "Pulse", version: "v1.0.0", status: "inactive", deployedAt: new Date("2026-04-18T00:00:00Z") },
      { appId: "pulse", appName: "Pulse", version: "v1.1.0", status: "active", deployedAt: new Date("2026-04-19T00:00:00Z") },
    ]);
    authUser = ADMIN;
    const res = await request(app)
      .post("/api/deployments/pulse/rollback")
      .send({ environment: "production" });
    expect(res.status).toBe(200);
    expect(res.body.rolledBack).toBe(true);
    expect(res.body.previous.version).toBe("v1.1.0");
    expect(res.body.previous.status).toBe("rolled-back");
    expect(res.body.current.version).toBe("v1.0.0");
    expect(res.body.current.status).toBe("active");
    expect(res.body.current.deployedBy).toBe(ADMIN.email);

    const followUp = await request(app).get("/api/deployments/pulse");
    expect(followUp.status).toBe(200);
    expect(followUp.body.version).toBe("v1.0.0");
  });
});
