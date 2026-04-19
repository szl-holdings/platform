/**
 * Demo Reset Endpoint — DEMO_MODE gate, admin role enforcement, and
 * narrative-aware seeding behavior.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const seedNarrativeMock = vi.fn().mockResolvedValue(undefined);
const seedAllNarrativesMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@workspace/demo-seed", () => ({
  seedNarrative: seedNarrativeMock,
  seedAllNarratives: seedAllNarrativesMock,
}));

vi.mock("@workspace/memory-fabric/store", () => ({
  defaultMemoryStore: {
    list: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

let mockUser: { id: number; roles: string[] } | undefined;
vi.mock("../../middlewares/auth", () => ({
  authMiddleware: () => (req: any, _res: any, next: () => void) => {
    req.user = mockUser;
    next();
  },
  requireRole: () => (_req: any, _res: any, next: () => void) => next(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildApp(): Promise<express.Express> {
  const mod = await import("../demo-reset.js");
  const app = express();
  app.use(express.json());
  app.use(mod.default);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /demo/reset — DEMO_MODE gate + admin role + narrative seeding", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    delete (process.env as Record<string, string | undefined>).APP_ENV;
    process.env.DEMO_MODE = "true";
    seedNarrativeMock.mockClear();
    seedAllNarrativesMock.mockClear();
    mockUser = { id: 1, roles: ["admin"] };
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.APP_ENV = originalAppEnv;
    if (originalDemoMode === undefined) {
      delete (process.env as Record<string, string | undefined>).DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }
  });

  it("status endpoint reports enabled=true when DEMO_MODE=true and not production", async () => {
    const app = await buildApp();
    const res = await request(app).get("/demo/reset/status");
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(data.enabled).toBe(true);
    expect(Array.isArray(data.narratives)).toBe(true);
    expect(data.narratives.length).toBeGreaterThan(0);
  });

  it("status endpoint reports enabled=false when DEMO_MODE is unset", async () => {
    delete (process.env as Record<string, string | undefined>).DEMO_MODE;
    const app = await buildApp();
    const res = await request(app).get("/demo/reset/status");
    expect(res.status).toBe(200);
    const data = res.body.data ?? res.body;
    expect(data.enabled).toBe(false);
  });

  it("returns 404 in production regardless of DEMO_MODE", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEMO_MODE = "true";
    const app = await buildApp();
    const res = await request(app).post("/demo/reset").send({ narrative: "all" });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SEED_DISABLED_IN_PRODUCTION");
    expect(seedAllNarrativesMock).not.toHaveBeenCalled();
  });

  it("returns 404 with DEMO_MODE_DISABLED when flag is unset", async () => {
    delete (process.env as Record<string, string | undefined>).DEMO_MODE;
    const app = await buildApp();
    const res = await request(app).post("/demo/reset").send({ narrative: "all" });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("DEMO_MODE_DISABLED");
    expect(seedAllNarrativesMock).not.toHaveBeenCalled();
  });

  it("returns 403 when caller has no admin role", async () => {
    mockUser = { id: 5, roles: ["viewer"] };
    const app = await buildApp();
    const res = await request(app).post("/demo/reset").send({ narrative: "all" });
    expect(res.status).toBe(403);
    expect(seedAllNarrativesMock).not.toHaveBeenCalled();
  });

  it("returns 400 when narrative is invalid", async () => {
    const app = await buildApp();
    const res = await request(app).post("/demo/reset").send({ narrative: "bogus" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_NARRATIVE");
    expect(seedAllNarrativesMock).not.toHaveBeenCalled();
    expect(seedNarrativeMock).not.toHaveBeenCalled();
  });

  it("calls seedAllNarratives for narrative='all'", async () => {
    const app = await buildApp();
    const res = await request(app).post("/demo/reset").send({ narrative: "all" });
    expect(res.status).toBe(200);
    expect(seedAllNarrativesMock).toHaveBeenCalledTimes(1);
    expect(seedNarrativeMock).not.toHaveBeenCalled();
    const data = res.body.data ?? res.body;
    expect(data.narrative).toBe("all");
    expect(data.readyForDemo).toBe(true);
  });

  it("calls seedNarrative('security') for narrative='security'", async () => {
    const app = await buildApp();
    const res = await request(app).post("/demo/reset").send({ narrative: "security" });
    expect(res.status).toBe(200);
    expect(seedNarrativeMock).toHaveBeenCalledWith("security");
    expect(seedAllNarrativesMock).not.toHaveBeenCalled();
  });

  it("defaults narrative to 'all' when body omits it", async () => {
    const app = await buildApp();
    const res = await request(app).post("/demo/reset").send({});
    expect(res.status).toBe(200);
    expect(seedAllNarrativesMock).toHaveBeenCalledTimes(1);
  });
});
