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
interface TeamPageRow {
  id: number; team: string; actorId: number; recipientId: number;
  urgency: string; message: string | null; inAppDelivered: boolean;
  mutedAsDuplicate: boolean; duplicateOfPageId: number | null;
  createdAt: Date;
}

const store: {
  users: UserRow[];
  apps: AppRow[];
  notifs: NotifRow[];
  prefs: PrefRow[];
  teamPages: TeamPageRow[];
  nextNotifId: number;
  nextTeamPageId: number;
} = { users: [], apps: [], notifs: [], prefs: [], teamPages: [], nextNotifId: 1, nextTeamPageId: 1 };

vi.mock("drizzle-orm", () => {
  const tag = (kind: string) => (..._args: unknown[]) => ({ _kind: kind, _args });
  return {
    and: tag("and"), or: tag("or"),
    eq: (col: { _colName?: string }, val: unknown) => ({ _kind: "eq", col: col?._colName, val }),
    gte: (col: { _colName?: string }, val: unknown) => ({ _kind: "gte", col: col?._colName, val }),
    lte: (col: { _colName?: string }, val: unknown) => ({ _kind: "lte", col: col?._colName, val }),
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
  const teamPagesTable = makeTable("team_pages");
  const onCallSchedulesTable = makeTable("on_call_schedules");
  const onCallShiftsTable = makeTable("on_call_shifts");
  const auditLogsTable = makeTable("audit_logs");
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
    if (k === "gte") {
      const { col: cn, val } = c as { col: { _colName: string } | string; val: unknown };
      const name = typeof cn === "string" ? cn : cn._colName;
      const rv = row[name];
      const a = rv instanceof Date ? rv.getTime() : Number(rv);
      const b = val instanceof Date ? val.getTime() : Number(val);
      return a >= b;
    }
    if (k === "lte") {
      const { col: cn, val } = c as { col: { _colName: string } | string; val: unknown };
      const name = typeof cn === "string" ? cn : cn._colName;
      const rv = row[name];
      const a = rv instanceof Date ? rv.getTime() : Number(rv);
      const b = val instanceof Date ? val.getTime() : Number(val);
      return a <= b;
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
    if (n === "team_pages") return store.teamPages as unknown as Record<string, unknown>[];
    if (n === "on_call_schedules") return [];
    if (n === "on_call_shifts") return [];
    if (n === "audit_logs") return [];
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
    let inserted: NotifRow | TeamPageRow | null = null;
    const chain: Record<string, unknown> = {
      values(v: Record<string, unknown>) {
        if (table === notificationsTable) {
          const nv = v as Partial<NotifRow>;
          const row: NotifRow = {
            id: store.nextNotifId++,
            userId: nv.userId!,
            type: nv.type ?? "info",
            channel: nv.channel ?? "in_app",
            title: nv.title ?? "",
            message: nv.message ?? "",
            actionUrl: nv.actionUrl ?? null,
          };
          store.notifs.push(row);
          inserted = row;
        } else if (table === teamPagesTable) {
          const pv = v as Partial<TeamPageRow>;
          const row: TeamPageRow = {
            id: store.nextTeamPageId++,
            team: pv.team!,
            actorId: pv.actorId!,
            recipientId: pv.recipientId!,
            urgency: pv.urgency ?? "warning",
            message: pv.message ?? null,
            inAppDelivered: pv.inAppDelivered ?? true,
            mutedAsDuplicate: pv.mutedAsDuplicate ?? false,
            duplicateOfPageId: pv.duplicateOfPageId ?? null,
            createdAt: new Date(),
          };
          store.teamPages.push(row);
          inserted = row;
        } else if (tableName(table) === "audit_logs") {
          inserted = null;
        }
        return chain;
      },
      returning() { return Promise.resolve(inserted ? [inserted] : []); },
      then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
        // Allow `await db.insert(...).values(...)` without `.returning()`.
        return Promise.resolve(inserted ? [inserted] : []).then(resolve, reject);
      },
    };
    return chain;
  }

  const db = {
    select: (_f?: unknown) => ({ from: (t: unknown) => makeSelectChain(t) }),
    selectDistinct: (_f?: unknown) => ({ from: (t: unknown) => makeSelectChain(t) }),
    insert: (table: unknown) => makeInsertChain(table),
    transaction: async <T,>(fn: (tx: typeof db) => Promise<T>): Promise<T> => fn(db),
  };

  return {
    db,
    usersTable,
    appsRegistryTable,
    notificationsTable,
    notificationPreferencesTable,
    teamPagesTable,
    onCallSchedulesTable,
    onCallShiftsTable,
    auditLogsTable,
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
  requireRole: (..._roles: string[]) => (_req: Request, _res: Response, next: NextFunction): void => { next(); },
  parseIdParam: (raw: string | string[]): number => {
    const id = Number(Array.isArray(raw) ? raw[0] : raw);
    if (isNaN(id) || id < 1) throw new Error("InvalidIdError");
    return id;
  },
  InvalidIdError: class InvalidIdError extends Error {
    constructor() { super("Invalid ID"); this.name = "InvalidIdError"; }
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
  store.teamPages = [];
  store.nextNotifId = 1;
  store.nextTeamPageId = 1;
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

  it("appends a team_pages audit row capturing actor, recipient, urgency, and message", async () => {
    authUser = { id: 9, email: "ops@x", displayName: "Ops Caller" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();
    const r = await request(app)
      .post("/teams/Platform/page")
      .send({ message: "Pulse is on fire", urgency: "critical" });
    expect(r.status).toBe(200);
    expect(store.teamPages).toHaveLength(1);
    const page = store.teamPages[0]!;
    expect(page.team).toBe("Platform");
    expect(page.actorId).toBe(9);
    expect(page.recipientId).toBe(1);
    expect(page.urgency).toBe("critical");
    expect(page.message).toBe("Pulse is on fire");
    expect(page.inAppDelivered).toBe(true);
  });

  it("does NOT write an audit row when actor IS the on-call (self-paged no-op)", async () => {
    authUser = { id: 1, email: "a@x", displayName: "Alice" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();
    const r = await request(app).post("/teams/Platform/page").send({ message: "self" });
    expect(r.status).toBe(200);
    expect(r.body.paged).toBe(false);
    expect(store.teamPages).toHaveLength(0);
  });

  it("records inAppDelivered=false on the audit row when recipient opted out", async () => {
    authUser = { id: 9, email: "ops@x", displayName: "Ops Caller" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    store.prefs = [{ userId: 1, inAppEnabled: false }];
    const app = await makeApp();
    const r = await request(app).post("/teams/Platform/page").send({ urgency: "info" });
    expect(r.status).toBe(200);
    expect(store.teamPages).toHaveLength(1);
    expect(store.teamPages[0]!.inAppDelivered).toBe(false);
    expect(store.teamPages[0]!.urgency).toBe("info");
    expect(store.teamPages[0]!.message).toBeNull();
  });

  it("mutes a duplicate page (same actor → recipient → urgency within 5 min) and skips the in-app insert", async () => {
    authUser = { id: 9, email: "ops@x", displayName: "Ops Caller" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();

    // First page goes through normally.
    const r1 = await request(app)
      .post("/teams/Platform/page")
      .send({ message: "Pulse down", urgency: "critical" });
    expect(r1.status).toBe(200);
    expect(r1.body.paged).toBe(true);
    expect(r1.body.mutedAsDuplicate).toBe(false);
    expect(store.notifs).toHaveLength(1);
    expect(store.teamPages).toHaveLength(1);
    expect(store.teamPages[0]!.mutedAsDuplicate).toBe(false);

    // Second identical page within the window collapses.
    const r2 = await request(app)
      .post("/teams/Platform/page")
      .send({ message: "still down", urgency: "critical" });
    expect(r2.status).toBe(200);
    expect(r2.body.paged).toBe(false);
    expect(r2.body.reason).toBe("muted_duplicate");
    expect(r2.body.mutedAsDuplicate).toBe(true);
    expect(r2.body.duplicateOfPageId).toBe(store.teamPages[0]!.id);
    expect(r2.body.inAppDelivered).toBe(false);
    // No new notification, but the audit row is still appended.
    expect(store.notifs).toHaveLength(1);
    expect(store.teamPages).toHaveLength(2);
    const dup = store.teamPages[1]!;
    expect(dup.mutedAsDuplicate).toBe(true);
    expect(dup.duplicateOfPageId).toBe(store.teamPages[0]!.id);
    expect(dup.inAppDelivered).toBe(false);
    expect(dup.message).toBe("still down");
  });

  it("does NOT mute when the urgency differs (warning vs critical from same actor)", async () => {
    authUser = { id: 9, email: "ops@x", displayName: "Ops Caller" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    const app = await makeApp();

    const r1 = await request(app).post("/teams/Platform/page").send({ urgency: "warning" });
    expect(r1.status).toBe(200);
    expect(r1.body.paged).toBe(true);

    const r2 = await request(app).post("/teams/Platform/page").send({ urgency: "critical" });
    expect(r2.status).toBe(200);
    expect(r2.body.paged).toBe(true);
    expect(r2.body.mutedAsDuplicate).toBe(false);
    expect(store.notifs).toHaveLength(2);
    expect(store.teamPages).toHaveLength(2);
    expect(store.teamPages.every((p) => !p.mutedAsDuplicate)).toBe(true);
  });

  it("does NOT mute when the prior page is older than the 5-minute window", async () => {
    authUser = { id: 9, email: "ops@x", displayName: "Ops Caller" };
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
    ];
    // Pre-seed an old page from the same actor → recipient at the same urgency.
    store.teamPages = [
      {
        id: 1, team: "Platform", actorId: 9, recipientId: 1,
        urgency: "warning", message: "old", inAppDelivered: true,
        mutedAsDuplicate: false, duplicateOfPageId: null,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ];
    store.nextTeamPageId = 2;

    const app = await makeApp();
    const r = await request(app).post("/teams/Platform/page").send({ urgency: "warning" });
    expect(r.status).toBe(200);
    expect(r.body.paged).toBe(true);
    expect(r.body.mutedAsDuplicate).toBe(false);
    expect(store.notifs).toHaveLength(1);
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

describe("GET /teams/:team/pages", () => {
  it("returns the team's recent pages with actor and recipient summaries", async () => {
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
      { id: 9, displayName: "Ops Caller", email: "ops@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Other" },
    ];
    store.teamPages = [
      {
        id: 1, team: "Platform", actorId: 9, recipientId: 1,
        urgency: "critical", message: "Pulse down", inAppDelivered: true,
        createdAt: new Date("2026-04-19T10:00:00Z"),
      },
      {
        id: 2, team: "Platform", actorId: 9, recipientId: 1,
        urgency: "warning", message: null, inAppDelivered: false,
        createdAt: new Date("2026-04-20T11:00:00Z"),
      },
      {
        id: 3, team: "Other", actorId: 1, recipientId: 9,
        urgency: "info", message: "fyi", inAppDelivered: true,
        createdAt: new Date("2026-04-20T12:00:00Z"),
      },
    ];
    store.nextTeamPageId = 4;
    const app = await makeApp();
    const r = await request(app).get("/teams/Platform/pages");
    expect(r.status).toBe(200);
    expect(r.body.team).toBe("Platform");
    expect(r.body.count).toBe(2);
    const ids = r.body.pages.map((p: { id: number }) => p.id).sort();
    expect(ids).toEqual([1, 2]);
    const byId = new Map<number, { actor: { displayName: string }; recipient: { displayName: string }; message: string | null; urgency: string; inAppDelivered: boolean }>(
      r.body.pages.map((p: { id: number }) => [p.id, p]),
    );
    const p1 = byId.get(1)!;
    expect(p1.actor.displayName).toBe("Ops Caller");
    expect(p1.recipient.displayName).toBe("Alice");
    expect(p1.urgency).toBe("critical");
    expect(p1.message).toBe("Pulse down");
    const p2 = byId.get(2)!;
    expect(p2.message).toBeNull();
    expect(p2.inAppDelivered).toBe(false);
  });

  it("returns an empty list for a team with no recorded pages", async () => {
    const app = await makeApp();
    const r = await request(app).get("/teams/Phantom/pages");
    expect(r.status).toBe(200);
    expect(r.body.count).toBe(0);
    expect(r.body.pages).toEqual([]);
  });
});

describe("GET /users/:id/pages", () => {
  it("404s for an unknown user id", async () => {
    const app = await makeApp();
    const r = await request(app).get("/users/999/pages");
    expect(r.status).toBe(404);
  });

  it("400s for a non-numeric id", async () => {
    const app = await makeApp();
    const r = await request(app).get("/users/abc/pages");
    expect(r.status).toBe(400);
  });

  it("returns pages received by the user by default with role=received", async () => {
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
      { id: 9, displayName: "Ops Caller", email: "ops@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Other" },
    ];
    store.teamPages = [
      { id: 1, team: "Platform", actorId: 9, recipientId: 1, urgency: "critical", message: "Pulse down", inAppDelivered: true, createdAt: new Date("2026-04-19T10:00:00Z") },
      { id: 2, team: "Platform", actorId: 9, recipientId: 1, urgency: "warning", message: null, inAppDelivered: false, createdAt: new Date("2026-04-20T11:00:00Z") },
      // Page Alice fired against Ops Caller — should NOT appear when role defaults to recipient
      { id: 3, team: "Other", actorId: 1, recipientId: 9, urgency: "info", message: "fyi", inAppDelivered: true, createdAt: new Date("2026-04-20T12:00:00Z") },
    ];
    const app = await makeApp();
    const r = await request(app).get("/users/1/pages");
    expect(r.status).toBe(200);
    expect(r.body.user.id).toBe(1);
    expect(r.body.role).toBe("recipient");
    expect(r.body.count).toBe(2);
    const ids = r.body.pages.map((p: { id: number }) => p.id).sort();
    expect(ids).toEqual([1, 2]);
    for (const p of r.body.pages) {
      expect(p.role).toBe("received");
      expect(p.recipient.id).toBe(1);
    }
  });

  it("returns pages the user fired when role=actor", async () => {
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
      { id: 9, displayName: "Ops Caller", email: "ops@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Other" },
    ];
    store.teamPages = [
      { id: 1, team: "Platform", actorId: 9, recipientId: 1, urgency: "critical", message: "Pulse down", inAppDelivered: true, createdAt: new Date("2026-04-19T10:00:00Z") },
      { id: 3, team: "Other", actorId: 1, recipientId: 9, urgency: "info", message: "fyi", inAppDelivered: true, createdAt: new Date("2026-04-20T12:00:00Z") },
    ];
    const app = await makeApp();
    const r = await request(app).get("/users/1/pages?role=actor");
    expect(r.status).toBe(200);
    expect(r.body.role).toBe("actor");
    expect(r.body.count).toBe(1);
    expect(r.body.pages[0].id).toBe(3);
    expect(r.body.pages[0].role).toBe("sent");
    expect(r.body.pages[0].actor.id).toBe(1);
  });

  it("returns both sides deduped when role=both", async () => {
    store.users = [
      { id: 1, displayName: "Alice", email: "a@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Platform" },
      { id: 9, displayName: "Ops Caller", email: "ops@x", avatarUrl: null, platformRole: "operator", isActive: true, team: "Other" },
    ];
    store.teamPages = [
      { id: 1, team: "Platform", actorId: 9, recipientId: 1, urgency: "critical", message: "down", inAppDelivered: true, createdAt: new Date("2026-04-19T10:00:00Z") },
      { id: 3, team: "Other", actorId: 1, recipientId: 9, urgency: "info", message: "fyi", inAppDelivered: true, createdAt: new Date("2026-04-20T12:00:00Z") },
    ];
    const app = await makeApp();
    const r = await request(app).get("/users/1/pages?role=both");
    expect(r.status).toBe(200);
    expect(r.body.role).toBe("both");
    expect(r.body.count).toBe(2);
    const byId = new Map<number, { role: string }>(
      r.body.pages.map((p: { id: number; role: string }) => [p.id, p]),
    );
    expect(byId.get(1)!.role).toBe("received");
    expect(byId.get(3)!.role).toBe("sent");
  });
});
