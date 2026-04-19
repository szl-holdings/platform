/**
 * Audit Routes — role authorization tests
 *
 * Verifies that the /audit/events and /audit/activity endpoints accept the
 * compliance role (in addition to ops and analyst). This is required so
 * compliance staff can review the ATLAS export audit trail without needing
 * an analyst or ops role.
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import request from "supertest";

vi.mock("drizzle-orm", async () => {
  const noop = (..._args: unknown[]) => ({});
  return { eq: noop, and: noop, or: noop, desc: noop, sql: noop, ilike: noop };
});

vi.mock("@szl-holdings/db", () => {
  const stubTable = {};
  const db = {
    select: () => ({
      from: () => ({
        orderBy: () => ({ limit: () => Promise.resolve([]) }),
      }),
    }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };
  return new Proxy(
    {
      db,
      activityLogTable: stubTable,
      auditEventsTable: stubTable,
    } as Record<string, unknown>,
    { get(t, p) { return p in t ? t[p as string] : {}; } },
  );
});

vi.mock("@szl-holdings/observability", () => ({
  serverTelemetry: { recordAuthFailure: vi.fn(), recordRequest: vi.fn(), recordError: vi.fn() },
  initializeOpenTelemetry: () => Promise.resolve(),
}));

vi.mock("@szl-holdings/audit", () => ({ hashIp: (ip: string) => `hashed-${ip}` }));
vi.mock("@szl-holdings/config", () => ({ resolveRuntimeMode: () => "standard" }));

vi.mock("../../lib/platform-flags", () => ({
  isFlagEnabled: vi.fn(() => Promise.resolve(true)),
}));

let authUser: { id: number; role: string } | null = null;

vi.mock("../../middlewares/auth", () => ({
  authMiddleware: () => (req: Request, res: Response, next: NextFunction): void => {
    if (!authUser) { res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" }); return; }
    (req as Request & { user: { id: number; role: string } }).user = authUser;
    next();
  },
  requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { role: string } }).user;
    if (!user) { res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" }); return; }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" }); return;
    }
    next();
  },
}));

let app: ReturnType<typeof express>;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  const { default: auditRouter } = await import("../audit");
  app.use(auditRouter);
});

describe("Audit routes — role authorization", () => {
  it("/audit/events permits the compliance role", async () => {
    authUser = { id: 1, role: "compliance" };
    const res = await request(app).get("/audit/events");
    expect(res.status).toBe(200);
  });

  it("/audit/events permits the ops role", async () => {
    authUser = { id: 1, role: "ops" };
    const res = await request(app).get("/audit/events");
    expect(res.status).toBe(200);
  });

  it("/audit/events permits the analyst role", async () => {
    authUser = { id: 1, role: "analyst" };
    const res = await request(app).get("/audit/events");
    expect(res.status).toBe(200);
  });

  it("/audit/events forbids the operator role", async () => {
    authUser = { id: 1, role: "operator" };
    const res = await request(app).get("/audit/events");
    expect(res.status).toBe(403);
  });

  it("/audit/activity permits the compliance role", async () => {
    authUser = { id: 1, role: "compliance" };
    const res = await request(app).get("/audit/activity");
    expect(res.status).toBe(200);
  });
});
