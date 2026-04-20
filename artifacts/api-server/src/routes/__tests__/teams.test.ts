/**
 * Teams routes — directory + page (#2301)
 *
 * Locks the contract that:
 *   - GET /teams/:team returns members, deterministic on-call, escalation,
 *     and owned apps for a team derived from `users.team`.
 *   - GET /teams/:team for a team with no users and no owned apps is 404.
 *   - POST /teams/:team/page requires auth, deny-if-readonly, picks the
 *     on-call as the recipient, refuses to page yourself, and inserts an
 *     in-app notification when the recipient hasn't opted out.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import request from "supertest";

interface UserRow {
  id: number;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  platformRole: string | null;
  isActive: boolean;
  team: string | null;
}
interface AppRow { slug: string; name: string; ownerTeam: string | null }
interface NotifRow {
  id: number; userId: number; type: string; channel: string;
  title: string; message: string; actionUrl: string | null;
}
interface PrefRow { userId: number; inAppEnabled: boolean }

const store: {
  users: UserRow[];
  apps: AppRow[];
  notifs: NotifRow[];
  prefs: PrefRow[];
  nextNotifId: number;
} = { users: [], apps: [], notifs: [], prefs: [], nextNotifId: 1 };

vi.mock("drizzle-orm", () => {
  const tag = (kind: string) => (..._args: unknown[]) => ({ _kind: kind, _args });
  return {
    and: tag("and"), or: tag("or"),
    eq: (col: { _colName?: string }, val: unknown) => ({ _kind: "eq", col: col?._colName, val }),
    asc: tag("asc"), desc: tag("desc"),
    inArray: (col: { _colName?: string }, vals: unknown[]) => ({ _kind: "inArray", col: col?._colName, vals }),
    sql: tag("sql"),
  };
});

vi.mock("@szl-holdings/db", () => {
  const col = (table: string, name: string) => ({ _tableName: table, _colName: name });
  const makeTable = (name: string) =>
    new Proxy({} as Record<string, unknown>, {
      get: (_t, p) => (p === "_tableName" ? name : col(name, String(p))),
    });
  const usersTable = makeTable("users");
  const appsRegistryTable = makeTable("apps_registry");
  const notificationsTable = makeTable("notifications");
  const notificationPreferencesTable = makeTable("notification_preferences");
  const tableName = (t: unknown): string | null => {
    if (t && typeof t === "object") {
      const tn = (t as { _tableName?: unknown })._tableName;
      if (typeof tn === "string") return tn;
    }
    return null;
  };

  function evalCond(row: Record<string, unknown>, c: unknown): boolean {
    if (!c || typeof c !== "object") return true;
    const k = (c as { _kind?: string })._kind;
    if (k === "and") return ((c as { _args: unknown[] })._args).every((a) => evalCond(row, a));
    if (k === "or") return ((c as { _args: unknown[] })._args).some((a) => evalCond(row, a));
    if (k === "eq") {
      const { col: cn, val } = c as { col: { _colName: string } | string; val: unknown };
      const name = typeof cn === "string" ? cn : cn._colName;
      return row[name] === val;
    }
    if (k === "inArray") {
      const { col: cn, vals } = c as { col: { _colName: string } | string; vals: unknown[] };
      const name = typeof cn === "string" ? cn : cn._colName;
      return vals.includes(row[name]);
    }
    return true;
  }

  function rowsFor(table: unknown): Record<string, unknown>[] {
    const n = tableName(table);
    if (n === "users") return store.users as unknown as Record<string, unknown>[];
    if (n === "apps_registry") return store.apps as unknown as Record<string, unknown>[];
    if (n === "notification_preferences") return store.prefs as unknown as Record<string, unknown>[];
    if (n === "notifications") return store.notifs as unknown as Record<string, unknown>[];
    return [];
  }

  function makeSelectChain(initialTable: unknown) {
    let table: unknown = initialTable;
    const conds: unknown[] = [];
    const run = (n?: number): unknown[] => {
      const rows = rowsFor(table).filter((r) => conds.every((c) => evalCond(r, c)));
      return n != null ? rows.slice(0, n) : rows;
    };
    const chain: Record<string, unknown> = {
      from(t: unknown) { table = t; return chain; },
      where(c: unknown) { conds.push(c); return chain; },
      orderBy() { return chain; },
      limit(n: number) { return Promise.resolve(run(n)); },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve(run()).then(resolve, reject);
      },
    };
    return chain;
  }

  function makeInsertChain(table: unknown) {
    let inserted: NotifRow | null = null;
    const chain: Record<string, unknown> = {
      values(v: Partial<NotifRow>) {
        if (table === notificationsTable) {
          inserted = {
            id: store.nextNotifId++,
            userId: v.userId!,
            type: v.type ?? "info",
            channel: v.channel ?? "in_app",
            title: v.title ?? "",
            message: v.message ?? "",
            actionUrl: v.actionUrl ?? null,
          };
          store.notifs.push(inserted);
        }
        return chain;
      },
      returning() { return Promise.resolve(inserted ? [inserted] : []); },
    };
    return chain;
  }

  const db = {
    select: (_f?: unknown) => ({ from: (t: unknown) => makeSelectChain(t) }),
    insert: (table: unknown) => makeInsertChain(table),
    transaction: async <T,>(fn: (tx: typeof db) => Promise<T>): Promise<T> => fn(db),
  };

  return {
    db,
    usersTable,
    appsRegistryTable,
    notificationsTable,
    notificationPreferencesTable,
    PLATFORM_ROLE_HIERARCHY: {
      anonymous_visitor: 0, executive_viewer: 2, analyst: 3, operator: 5,
      ops_manager: 6, platform_admin: 8, founder_admin: 10,
    },
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
  jsonObjectBodySchema: {},
}));
vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

let authUser: { id: number; email: string; displayName: string; isReadOnly?: boolean } | null = null;

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: (opts: { required?: boolean } = {}) => (req: Request, res: Response, next: NextFunction): void => {
    if (authUser) {
      (req as Request & { user: typeof authUser }).user = authUser;
      next();
      return;
    }
    if (opts.required) { res.status(401).json({ error: "Unauthorized" }); return; }
    next();
  },
  denyIfReadOnly: () => (req: Request, res: Response, next: NextFunction): void => {
    const u = (req as Request & { user?: { isReadOnly?: boolean } }).user;
    if (u?.isReadOnly) { res.status(403).json({ error: "ReadOnly" }); return; }
    next();
  },
}));

async function makeApp() {
  const app = express();
  app.use(express.json());
  const router = (await import("../teams")).default;
  app.use(router);
  return app;
}

beforeEach(() => {
  store.users = [];
  store.apps = [];
  store.notifs = [];
  store.prefs = [];
  store.nextNotifId = 1;
  authUser = null;
});

describe("GET /teams/:team", () => {
  it("returns 404 for an unknown team with no members and no owned apps", async () => {
    const app = await makeApp();
    const r = await request(app).get("/teams/Phantom");
    expect(r.status).toBe(404);
  });

  it("returns members, deterministic on-call, escalation, and owned apps", async () => {
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
      { id: 2, displayName: "Bob",   email: "b@x", avatarUrl: null, platformRole: "platform_admin", isActive: true, team: "Platform" },
      { id: 3, displayName: "Cara",  email: "c@x", avatarUrl: null, platformRole: "operator", isActive: false, team: "Platform" },
    ];
    store.apps = [
      { slug: "pulse", name: "Pulse", ownerTeam: "Platform" },
      { slug: "terra", name: "Terra", ownerTeam: "Other" },
    ];
    const app = await makeApp();
    const r = await request(app).get("/teams/Platform");
    expect(r.status).toBe(200);
    expect(r.body.team).toBe("Platform");
    expect(r.body.members).toHaveLength(3);
    // Inactive user is never picked
    expect(r.body.onCall.id).not.toBe(3);
    expect([1, 2]).toContain(r.body.onCall.id);
    // Escalation goes to highest-privilege active member (Bob: platform_admin)
    expect(r.body.escalation.id).toBe(2);
    expect(r.body.ownedApps).toEqual([{ slug: "pulse", name: "Pulse" }]);
  });
});

describe("POST /teams/:team/page", () => {
  it("requires authentication", async () => {
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();
    const r = await request(app).post("/teams/Platform/page").send({ message: "fire" });
    expect(r.status).toBe(401);
  });

  it("rejects read-only users", async () => {
    authUser = { id: 9, email: "viewer@x", displayName: "Viewer", isReadOnly: true };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();
    const r = await request(app).post("/teams/Platform/page").send({ message: "fire" });
    expect(r.status).toBe(403);
  });

  it("inserts a notification for the on-call and reports paged=true", async () => {
    authUser = { id: 9, email: "ops@x", displayName: "Ops Caller" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();
    const r = await request(app)
      .post("/teams/Platform/page")
      .send({ message: "Pulse is down", urgency: "critical" });
    expect(r.status).toBe(200);
    expect(r.body.paged).toBe(true);
    expect(r.body.onCall.id).toBe(1);
    expect(r.body.urgency).toBe("critical");
    expect(store.notifs).toHaveLength(1);
    expect(store.notifs[0]!.userId).toBe(1);
    // "critical" maps to "error" on the notification type enum
    expect(store.notifs[0]!.type).toBe("error");
    expect(store.notifs[0]!.message).toContain("Pulse is down");
  });

  it("does not page yourself when the actor IS the on-call", async () => {
    // Single active member → guaranteed on-call regardless of week rotation
    authUser = { id: 1, email: "a@x", displayName: "Alice" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();
    const r = await request(app).post("/teams/Platform/page").send({ message: "self" });
    expect(r.status).toBe(200);
    expect(r.body.paged).toBe(false);
    expect(r.body.reason).toBe("actor_is_oncall");
    expect(store.notifs).toHaveLength(0);
  });

  it("skips in-app insert when recipient has opted out, but still returns paged=true", async () => {
    authUser = { id: 9, email: "ops@x", displayName: "Ops Caller" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    store.prefs = [{ userId: 1, inAppEnabled: false }];
    const app = await makeApp();
    const r = await request(app).post("/teams/Platform/page").send({});
    expect(r.status).toBe(200);
    expect(r.body.paged).toBe(true);
    expect(r.body.inAppDelivered).toBe(false);
    expect(store.notifs).toHaveLength(0);
  });
});
