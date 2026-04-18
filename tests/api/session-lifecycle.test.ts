/**
 * E2E test for Session Lifecycle Hardening (Task #1914).
 *
 * Validates the headline acceptance criterion: when a user's role/membership
 * is revoked, the next request on an existing session must return 401 with
 * `code: SESSION_REVOKED`. Also exercises refresh-token rotation + replay
 * detection and verifies that every session transition writes an audit row.
 *
 * Wires the *real* `authMiddleware` and the *real* `session-policy` helpers
 * against an in-memory Drizzle-shaped db mock so the test exercises the
 * production code paths end-to-end without a Postgres dependency (the suite
 * excludes db-integration tests; see vitest.config.ts).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// In-memory db: minimal Drizzle-shape that satisfies the calls the auth
// middleware + session-policy module make. Each table is an array; we match
// rows by simple field equality recorded by the chained where() builder.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

interface Predicate {
  field: string;
  op: "eq" | "gt" | "isNull";
  value?: unknown;
}

const usersStore: Row[] = [];
const sessionsStore: Row[] = [];
const auditStore: Row[] = [];
const userRolesStore: Row[] = [];
const orgMembersStore: Row[] = [];

let nextSessionId = 1;
let nextAuditId = 1;

function tableName(t: unknown): string {
  if (t === usersTable) return "users";
  if (t === sessionsTable) return "sessions";
  if (t === auditEventsTable) return "audit_events";
  if (t === userRolesTable) return "user_roles";
  if (t === orgMembersTable) return "org_members";
  if (t === rolesTable) return "roles";
  if (t === organizationsTable) return "organizations";
  return "unknown";
}

function storeFor(name: string): Row[] {
  if (name === "users") return usersStore;
  if (name === "sessions") return sessionsStore;
  if (name === "audit_events") return auditStore;
  if (name === "user_roles") return userRolesStore;
  if (name === "org_members") return orgMembersStore;
  return [];
}

function applyPreds(rows: Row[], preds: Predicate[]): Row[] {
  return rows.filter((row) =>
    preds.every((p) => {
      const v = row[p.field];
      if (p.op === "eq") return v === p.value;
      if (p.op === "gt") return (v as Date | number) > (p.value as Date | number);
      if (p.op === "isNull") return v === null || v === undefined;
      return true;
    }),
  );
}

class SelectChain {
  private tableName = "";
  private preds: Predicate[] = [];
  constructor(private projection: Record<string, unknown> | undefined) {}
  from(t: unknown) {
    this.tableName = tableName(t);
    return this;
  }
  innerJoin(_t: unknown, _on: unknown) {
    // Simplified: only used for role/org lookups which the test seeds via
    // userRolesStore directly with denormalized roleName.
    return this;
  }
  leftJoin(_t: unknown, _on: unknown) {
    return this;
  }
  where(pred: Predicate | Predicate[]) {
    const arr = Array.isArray(pred) ? pred : [pred];
    this.preds.push(...arr);
    return this.execute();
  }
  limit(_n: number) {
    return this.execute();
  }
  orderBy(_x: unknown) {
    return this.execute();
  }
  private execute() {
    const rows = applyPreds(storeFor(this.tableName), this.preds);
    const out = this.projection
      ? rows.map((r) => {
          const o: Row = {};
          for (const k of Object.keys(this.projection!)) o[k] = r[k];
          return o;
        })
      : rows;
    // Returning a thenable so `await` AND `[x] = await` both work, while the
    // chain itself remains usable for follow-up calls (.limit, .orderBy).
    return Object.assign(Promise.resolve(out), {
      limit: () => Promise.resolve(out),
      orderBy: () => Promise.resolve(out),
      where: (p: Predicate | Predicate[]) => this.where(p),
      innerJoin: () => this,
      leftJoin: () => this,
    });
  }
}

class InsertChain {
  private tableName = "";
  private rows: Row[] = [];
  constructor(t: unknown) {
    this.tableName = tableName(t);
  }
  values(v: Row | Row[]) {
    const arr = Array.isArray(v) ? v : [v];
    for (const row of arr) {
      const stamped: Row = { ...row };
      if (this.tableName === "sessions") stamped["id"] = nextSessionId++;
      if (this.tableName === "audit_events") stamped["id"] = nextAuditId++;
      stamped["createdAt"] = new Date();
      // Apply schema defaults that the in-memory store doesn't auto-populate.
      if (this.tableName === "sessions" && stamped["sessionVersion"] === undefined) {
        stamped["sessionVersion"] = 1;
      }
      if (this.tableName === "sessions" && stamped["revokedAt"] === undefined) {
        stamped["revokedAt"] = null;
      }
      if (this.tableName === "sessions" && stamped["refreshTokenUsedAt"] === undefined) {
        stamped["refreshTokenUsedAt"] = null;
      }
      storeFor(this.tableName).push(stamped);
      this.rows.push(stamped);
    }
    return this;
  }
  returning(_proj?: unknown) {
    return Promise.resolve(this.rows);
  }
  then<T1, T2 = never>(
    onFulfilled?: ((v: Row[]) => T1) | null,
    onRejected?: ((r: unknown) => T2) | null,
  ): Promise<T1 | T2> {
    return Promise.resolve(this.rows).then(onFulfilled, onRejected);
  }
}

class UpdateChain {
  private tableName = "";
  private setVals: Row = {};
  private preds: Predicate[] = [];
  constructor(t: unknown) {
    this.tableName = tableName(t);
  }
  set(v: Row) {
    this.setVals = v;
    return this;
  }
  where(p: Predicate | Predicate[]) {
    const arr = Array.isArray(p) ? p : [p];
    this.preds.push(...arr);
    return this;
  }
  private apply(): Row[] {
    const matched = applyPreds(storeFor(this.tableName), this.preds);
    for (const row of matched) {
      for (const k of Object.keys(this.setVals)) {
        const v = this.setVals[k];
        // crude sql() handling: { __sqlIncrementField } ⇒ +1
        if (v && typeof v === "object" && (v as { __sqlIncrementField?: string }).__sqlIncrementField) {
          const field = (v as { __sqlIncrementField: string }).__sqlIncrementField;
          row[k] = ((row[field] as number) ?? 0) + 1;
        } else {
          row[k] = v;
        }
      }
    }
    return matched;
  }
  returning(_proj?: unknown) {
    return Promise.resolve(this.apply());
  }
  then<T1, T2 = never>(
    onFulfilled?: ((v: Row[]) => T1) | null,
    onRejected?: ((r: unknown) => T2) | null,
  ): Promise<T1 | T2> {
    return Promise.resolve(this.apply()).then(onFulfilled, onRejected);
  }
}

class DeleteChain {
  private tableName = "";
  private preds: Predicate[] = [];
  constructor(t: unknown) {
    this.tableName = tableName(t);
  }
  where(p: Predicate | Predicate[]) {
    const arr = Array.isArray(p) ? p : [p];
    this.preds.push(...arr);
    return this;
  }
  private apply(): Row[] {
    const tbl = storeFor(this.tableName);
    const remaining: Row[] = [];
    const removed: Row[] = [];
    for (const row of tbl) {
      const matches = this.preds.every((p) => {
        const v = row[p.field];
        if (p.op === "eq") return v === p.value;
        if (p.op === "gt") return (v as Date | number) > (p.value as Date | number);
        if (p.op === "isNull") return v === null || v === undefined;
        return true;
      });
      if (matches) removed.push(row);
      else remaining.push(row);
    }
    tbl.length = 0;
    tbl.push(...remaining);
    return removed;
  }
  then<T1, T2 = never>(
    onFulfilled?: ((v: Row[]) => T1) | null,
    onRejected?: ((r: unknown) => T2) | null,
  ): Promise<T1 | T2> {
    return Promise.resolve(this.apply()).then(onFulfilled, onRejected);
  }
}

const dbMock = {
  select: (proj?: Record<string, unknown>) => new SelectChain(proj),
  insert: (t: unknown) => new InsertChain(t),
  update: (t: unknown) => new UpdateChain(t),
  delete: (t: unknown) => new DeleteChain(t),
};

// Sentinel column refs — passed by identity from production code into our
// where-builder helpers; values themselves are unused.
const usersTable: Record<string, string> = {
  id: "id",
  sessionVersion: "sessionVersion",
  isActive: "isActive",
  updatedAt: "updatedAt",
};
const sessionsTable: Record<string, string> = {
  id: "id",
  userId: "userId",
  token: "token",
  expiresAt: "expiresAt",
  refreshToken: "refreshToken",
  revokedAt: "revokedAt",
  sessionVersion: "sessionVersion",
};
const auditEventsTable: Record<string, string> = { id: "id" };
const userRolesTable: Record<string, string> = { userId: "userId", roleId: "roleId" };
const rolesTable: Record<string, string> = { id: "id", name: "name" };
const orgMembersTable: Record<string, string> = { userId: "userId", orgId: "orgId", role: "role" };
const organizationsTable: Record<string, string> = { id: "id", slug: "slug", name: "name" };

vi.mock("@workspace/db", () => ({
  db: dbMock,
  usersTable,
  sessionsTable,
  auditEventsTable,
  userRolesTable,
  rolesTable,
  orgMembersTable,
  organizationsTable,
  ROLE_HIERARCHY: { super_admin: 100, ops: 80, admin: 60, analyst: 40, viewer: 20, anonymous_visitor: 0 },
  isReadOnlyRole: () => false,
  toCanonicalRole: (r: string) => r,
}));

vi.mock("@szl-holdings/db", () => ({
  db: dbMock,
  usersTable,
  sessionsTable,
  auditEventsTable,
  userRolesTable,
  rolesTable,
  orgMembersTable,
  organizationsTable,
  ROLE_HIERARCHY: { super_admin: 100, ops: 80, admin: 60, analyst: 40, viewer: 20, anonymous_visitor: 0 },
  isReadOnlyRole: () => false,
  toCanonicalRole: (r: string) => r,
}));

// drizzle-orm helpers — return predicate descriptors our chains understand.
vi.mock("drizzle-orm", () => ({
  eq: (col: { toString(): string } | string, value: unknown): Predicate => ({
    field: typeof col === "string" ? col : String(col),
    op: "eq",
    value,
  }),
  gt: (col: { toString(): string } | string, value: unknown): Predicate => ({
    field: typeof col === "string" ? col : String(col),
    op: "gt",
    value,
  }),
  isNull: (col: { toString(): string } | string): Predicate => ({
    field: typeof col === "string" ? col : String(col),
    op: "isNull",
  }),
  and: (...preds: Predicate[]): Predicate[] => preds,
  desc: (x: unknown) => x,
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => {
    // Recognize the bumpUserSessionVersion increment shape.
    const text = strings.join("?");
    if (text.includes("+ 1")) {
      const field = (values[0] as { toString(): string } | string)?.toString?.() ?? String(values[0]);
      return { __sqlIncrementField: field };
    }
    return { raw: text, values };
  },
}));

vi.mock("@szl-holdings/audit", () => ({
  hashIp: (ip: string | null | undefined) => (ip ? `hash:${ip}` : null),
}));

vi.mock("@workspace/audit", () => ({
  hashIp: (ip: string | null | undefined) => (ip ? `hash:${ip}` : null),
}));

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    startSpan: vi.fn().mockReturnValue({ end: vi.fn(), setStatus: vi.fn() }),
    recordError: vi.fn(),
  },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@workspace/observability", () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    startSpan: vi.fn().mockReturnValue({ end: vi.fn(), setStatus: vi.fn() }),
    recordError: vi.fn(),
  },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../artifacts/api-server/src/lib/auth", () => ({
  SESSION_COOKIE: "sid",
  SESSION_TTL: 30 * 24 * 60 * 60 * 1000,
  setSessionCookie: vi.fn(),
  getSessionToken: vi.fn().mockReturnValue(null),
  getSessionUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("../../artifacts/api-server/src/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers to seed the in-memory store and build a tiny app that mounts the
// real authMiddleware in front of a protected echo route.
// ---------------------------------------------------------------------------

interface SeedOpts {
  userId?: number;
  email?: string;
  isActive?: boolean;
  sessionVersion?: number;
}

function seedUser(opts: SeedOpts = {}): Row {
  const user: Row = {
    id: opts.userId ?? 100,
    displayName: "Test User",
    email: opts.email ?? "test@example.com",
    isActive: opts.isActive ?? true,
    sessionVersion: opts.sessionVersion ?? 1,
  };
  usersStore.push(user);
  return user;
}

function buildApp() {
  return import("../../artifacts/api-server/src/middlewares/auth").then(({ authMiddleware }) => {
    const app: Express = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as unknown as { log: object }).log = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      };
      next();
    });
    app.get("/protected", authMiddleware(), (req, res) => {
      res.status(200).json({ ok: true, userId: (req as unknown as { user?: { id: number } }).user?.id });
    });
    return app;
  });
}

beforeEach(() => {
  usersStore.length = 0;
  sessionsStore.length = 0;
  auditStore.length = 0;
  userRolesStore.length = 0;
  orgMembersStore.length = 0;
  nextSessionId = 1;
  nextAuditId = 1;
});

describe("Session lifecycle hardening (Task #1914)", () => {
  it("creates a session, audits it, and accepts the next protected request", async () => {
    seedUser();
    const { createSessionWithRefresh } = await import(
      "../../artifacts/api-server/src/middlewares/session-policy"
    );

    const created = await createSessionWithRefresh({
      userId: 100,
      ipAddress: "1.2.3.4",
      userAgent: "vitest/1",
    });

    expect(created.token).toMatch(/^[a-f0-9]{64}$/);
    expect(created.refreshToken).toMatch(/^rt_[a-f0-9]{64}$/);
    expect(created.sessionVersion).toBe(1);

    const audit = auditStore.find((r) => r["action"] === "session.create");
    expect(audit).toBeDefined();
    expect(audit?.["userId"]).toBe(100);
    expect(audit?.["ipAddress"]).toBe("hash:1.2.3.4");
    expect(audit?.["userAgent"]).toBe("vitest/1");

    const app = await buildApp();
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${created.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, userId: 100 });
  });

  it("returns 401 SESSION_REVOKED on the next request after a role revocation", async () => {
    seedUser();
    const { createSessionWithRefresh, revokeUserSessionsOnRoleChange } = await import(
      "../../artifacts/api-server/src/middlewares/session-policy"
    );

    const created = await createSessionWithRefresh({
      userId: 100,
      ipAddress: "1.2.3.4",
      userAgent: "vitest/1",
    });
    const app = await buildApp();

    // Sanity: session works pre-revocation.
    const okRes = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${created.token}`);
    expect(okRes.status).toBe(200);

    // Operator revokes the user's role.
    await revokeUserSessionsOnRoleChange({
      userId: 100,
      changedByUserId: 1,
      reason: "role_demoted",
    });

    // Next protected request must be rejected within ≤30s — here, immediately.
    const blocked = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${created.token}`);

    expect(blocked.status).toBe(401);
    expect(blocked.body).toMatchObject({ code: "SESSION_REVOKED" });

    // Audit row was written for the invalidation, attributed to the operator.
    const invalidation = auditStore.find((r) => r["action"] === "session.invalidate");
    expect(invalidation).toBeDefined();
    expect(invalidation?.["userId"]).toBe(1);
    expect((invalidation?.["newValues"] as Row)["targetUserId"]).toBe(100);
    expect((invalidation?.["newValues"] as Row)["reason"]).toBe("role_demoted");
  });

  it("rejects concurrent refresh rotations atomically (only one wins)", async () => {
    seedUser();
    const { createSessionWithRefresh, rotateRefreshToken, RefreshTokenReplayError } =
      await import("../../artifacts/api-server/src/middlewares/session-policy");

    const original = await createSessionWithRefresh({
      userId: 100,
      ipAddress: "1.2.3.4",
      userAgent: "vitest/1",
    });

    // Fire two rotations using the SAME refresh token in parallel. The
    // claim-then-mint update must let exactly one succeed; the loser should
    // raise RefreshTokenReplayError rather than minting a duplicate session.
    const results = await Promise.allSettled([
      rotateRefreshToken({
        refreshToken: original.refreshToken,
        ipAddress: "1.2.3.4",
        userAgent: "vitest/1",
      }),
      rotateRefreshToken({
        refreshToken: original.refreshToken,
        ipAddress: "1.2.3.4",
        userAgent: "vitest/1",
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(RefreshTokenReplayError);

    // Exactly one new session minted (in addition to the original).
    expect(sessionsStore).toHaveLength(2);
  });

  it("rotates refresh tokens single-use and detects replay", async () => {
    seedUser();
    const {
      createSessionWithRefresh,
      rotateRefreshToken,
      RefreshTokenReplayError,
    } = await import("../../artifacts/api-server/src/middlewares/session-policy");

    const original = await createSessionWithRefresh({
      userId: 100,
      ipAddress: "1.2.3.4",
      userAgent: "vitest/1",
    });

    const rotated = await rotateRefreshToken({
      refreshToken: original.refreshToken,
      ipAddress: "1.2.3.4",
      userAgent: "vitest/1",
    });

    expect(rotated.token).not.toBe(original.token);
    expect(rotated.refreshToken).not.toBe(original.refreshToken);

    // Audit: session.refresh
    expect(auditStore.find((r) => r["action"] === "session.refresh")).toBeDefined();

    // Old session is revoked, marked replaced_by, and refresh_token_used_at set.
    const oldSession = sessionsStore.find((s) => s["id"] === original.sessionId);
    expect(oldSession?.["revokedAt"]).toBeInstanceOf(Date);
    expect(oldSession?.["refreshTokenUsedAt"]).toBeInstanceOf(Date);
    expect(oldSession?.["replacedBySessionId"]).toBe(rotated.sessionId);

    // Replay the *original* refresh token — must throw and revoke ALL sessions.
    await expect(
      rotateRefreshToken({
        refreshToken: original.refreshToken,
        ipAddress: "9.9.9.9",
        userAgent: "attacker",
      }),
    ).rejects.toBeInstanceOf(RefreshTokenReplayError);

    expect(auditStore.find((r) => r["action"] === "session.refresh.replay")).toBeDefined();

    // Session_version was bumped — the rotated session should now also fail
    // the auth check on its next request.
    const user = usersStore.find((u) => u["id"] === 100);
    expect((user?.["sessionVersion"] as number) >= 2).toBe(true);

    const app = await buildApp();
    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${rotated.token}`);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: "SESSION_REVOKED" });
  });
});
