import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../../middlewares/auth.js", () => ({
  authMiddleware: () => (req: Record<string, unknown>, _res: unknown, next: () => void) => {
    req.user = {
      id: 42,
      roles: ["admin"],
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

import plansRouter from "../plans";
import { defaultPlanStore, createPlan } from "@workspace/planner";
import type { PlanGraph, PlanStep } from "@workspace/planner";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", plansRouter);
  return app;
}

async function seedPlan(overrides: {
  approvalThreshold?: "low" | "medium" | "high" | "critical";
  fallbackCount?: number;
}): Promise<PlanGraph> {
  const plan = await createPlan(
    "Triage exception",
    {
      orgId: "7",
      fallbackCount: overrides.fallbackCount ?? 0,
      approvalThreshold: overrides.approvalThreshold ?? "critical",
    },
    { store: defaultPlanStore },
  );
  // Ensure fallbacks are also tenant-scoped so callerOwnsPlan works on resume.
  for (const fbId of plan.fallbacks) {
    const fb = await defaultPlanStore.get(fbId);
    if (fb) {
      await defaultPlanStore.put({
        ...fb,
        context: { ...fb.context, orgId: "7" },
      });
    }
  }
  return plan;
}

async function clearStore(): Promise<void> {
  const all = await defaultPlanStore.list({ limit: 1000 });
  for (const p of all.items) await defaultPlanStore.delete(p.planId);
}

describe("POST /api/plans/:id/execute", () => {
  beforeEach(async () => {
    await clearStore();
  });

  it("runs the plan to completion and returns run + persisted plan", async () => {
    const plan = await seedPlan({ approvalThreshold: "critical" });
    const app = buildApp();

    const res = await request(app)
      .post(`/api/plans/${plan.planId}/execute`)
      .send({})
      .expect(200);

    const data = res.body.data ?? res.body;
    expect(data.run.status).toBe("completed");
    expect(data.run.rootPlanId).toBe(plan.planId);
    expect(data.run.executedSteps.length).toBe(plan.executionOrder.length);
    expect(data.plan.status).toBe("completed");
    for (const step of data.plan.steps as PlanStep[]) {
      expect(step.status).toBe("completed");
    }
  });

  it("returns awaiting-approval when a gated step blocks the run, then resumes after step approval", async () => {
    const plan = await seedPlan({ approvalThreshold: "high" });
    const app = buildApp();

    const first = await request(app)
      .post(`/api/plans/${plan.planId}/execute`)
      .send({})
      .expect(200);

    const firstData = first.body.data ?? first.body;
    expect(firstData.run.status).toBe("awaiting-approval");
    expect(firstData.run.awaitingApproval).toBeDefined();
    const gatedStepId = firstData.run.awaitingApproval.stepId;

    // Operator approves the gated step via the existing step-approval route.
    await request(app)
      .post(`/api/plans/${plan.planId}/steps/${gatedStepId}/approve`)
      .send({ note: "ok" })
      .expect(200);

    const resumed = await request(app)
      .post(`/api/plans/${plan.planId}/execute`)
      .send({})
      .expect(200);

    const resumedData = resumed.body.data ?? resumed.body;
    expect(resumedData.run.status).toBe("completed");
    expect(resumedData.plan.status).toBe("completed");
  });

  it("returns 404 for unknown plans", async () => {
    const app = buildApp();
    await request(app)
      .post("/api/plans/does-not-exist/execute")
      .send({})
      .expect(404);
  });

  it("accepts approvedStepIds in the request body to satisfy gates without store mutation", async () => {
    const plan = await seedPlan({ approvalThreshold: "high" });
    const gated = plan.steps.find((s) => s.requiredApproval);
    expect(gated).toBeDefined();
    const app = buildApp();

    const res = await request(app)
      .post(`/api/plans/${plan.planId}/execute`)
      .send({ approvedStepIds: [gated!.stepId] })
      .expect(200);

    const data = res.body.data ?? res.body;
    expect(data.run.status).toBe("completed");
  });
});

describe("GET /api/plans/:id (live status)", () => {
  beforeEach(async () => {
    await clearStore();
  });

  it("reflects step statuses updated by an execute run", async () => {
    const plan = await seedPlan({ approvalThreshold: "critical" });
    const app = buildApp();

    await request(app).post(`/api/plans/${plan.planId}/execute`).send({}).expect(200);

    const res = await request(app).get(`/api/plans/${plan.planId}`).expect(200);
    const data = res.body.data ?? res.body;
    expect(data.status).toBe("completed");
    expect((data.steps as PlanStep[]).every((s) => s.status === "completed")).toBe(true);
  });
});
