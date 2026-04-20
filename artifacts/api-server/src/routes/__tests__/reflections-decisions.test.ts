import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../middlewares/auth.js", () => ({
  authMiddleware: () => (req: Record<string, unknown>, _res: unknown, next: () => void) => {
    req.user = {
      id: 42,
      roles: ["operator"],
      orgs: [{ orgId: 7 }],
    };
    next();
  },
  isElevatedUser: (u: { roles?: string[] }) =>
    Boolean(u?.roles?.some((r) => r === "super_admin" || r === "admin")),
}));

vi.mock("../../lib/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import reflectionsRouter, { reflectionDecisions } from "../reflections";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", reflectionsRouter);
  return app;
}

describe("reflections decision routes", () => {
  beforeEach(() => {
    reflectionDecisions.clear();
  });

  it("adopts a skill and records the decision with actor metadata", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/reflections/ref-001/skills/retrieval_v2/adopt")
      .send({ note: "adds citations" })
      .expect(200);

    const data = res.body.data ?? res.body;
    expect(data.reflectionId).toBe("ref-001");
    expect(data.skillName).toBe("retrieval_v2");
    expect(data.audit.decision).toBe("adopted");
    expect(data.audit.note).toBe("adds citations");
    expect(data.audit.actorId).toBe(42);
  });

  it("rejects a skill and keeps the most recent decision per skill", async () => {
    const app = buildApp();
    await request(app)
      .post("/api/reflections/ref-001/skills/sk1/adopt")
      .send({})
      .expect(200);
    const res = await request(app)
      .post("/api/reflections/ref-001/skills/sk1/reject")
      .send({ note: "prefer baseline" })
      .expect(200);

    const data = res.body.data ?? res.body;
    expect(data.audit.decision).toBe("rejected");
    const bucket = reflectionDecisions.get("ref-001");
    expect(bucket?.skills["sk1"]?.decision).toBe("rejected");
  });

  it("applies a strategy by index", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/reflections/ref-002/strategy/0/apply")
      .send({})
      .expect(200);

    const data = res.body.data ?? res.body;
    expect(data.strategyIndex).toBe(0);
    expect(data.audit.decision).toBe("applied");
  });

  it("defers a strategy by index", async () => {
    const app = buildApp();
    const res = await request(app)
      .post("/api/reflections/ref-002/strategy/2/defer")
      .send({ note: "not now" })
      .expect(200);

    const data = res.body.data ?? res.body;
    expect(data.audit.decision).toBe("deferred");
    expect(data.audit.note).toBe("not now");
  });

  it("rejects invalid strategy indices", async () => {
    const app = buildApp();
    await request(app)
      .post("/api/reflections/ref-002/strategy/-1/apply")
      .send({})
      .expect(400);

    await request(app)
      .post("/api/reflections/ref-002/strategy/notanumber/apply")
      .send({})
      .expect(400);

    await request(app)
      .post("/api/reflections/ref-002/strategy/9999/apply")
      .send({})
      .expect(400);
  });

  it("rejects empty skill names via the route (returns 404 since route won't match)", async () => {
    const app = buildApp();
    // Missing skill segment -> Express returns 404 (no matching route).
    await request(app)
      .post("/api/reflections/ref-001/skills//adopt")
      .send({})
      .expect(404);
  });
});
