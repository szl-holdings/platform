/**
 * Promotion workflow unit tests — happy path, policy-blocked, source-unhealthy,
 * and deploy-failure paths.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { promotionWorkflow } from "../workflows/promotion-workflow.ts";
import type { PromotionWorkflowInput } from "../types/workflow-types.js";
import { it, expect, beforeAll, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Mock activities
// ---------------------------------------------------------------------------

const happyPathActivities = {
  evaluatePolicyActivity: async () => ({
    allowed: true,
    denialMessages: [],
    warnMessages: [],
    evaluationId: "eval-promo-001",
  }),

  checkServiceHealthActivity: async () => ({
    healthy: true,
    uptimeMinutes: 120,
    details: { db: "ok", cache: "ok", version: "1.3.0" },
  }),

  recordEvidenceActivity: async () => ({ evidenceId: "evidence-promo-001" }),

  emitLyteVisibilityActivity: async () => undefined,

  deployServiceActivity: async () => ({
    deployedAt: new Date().toISOString(),
    deploymentId: "deploy-promo-001",
  }),

  requestApprovalActivity: async () => ({
    approvalRequestId: "req-promo-001",
    notificationsSent: 2,
  }),
};

const policyBlockedActivities = {
  ...happyPathActivities,
  evaluatePolicyActivity: async () => ({
    allowed: false,
    denialMessages: ["Production promotion outside of approved change window"],
    warnMessages: [],
    evaluationId: "eval-promo-blocked",
  }),
};

const unhealthySourceActivities = {
  ...happyPathActivities,
  checkServiceHealthActivity: async () => ({
    healthy: false,
    uptimeMinutes: 0,
    details: { db: "error: timeout" },
  }),
};

const deployFailsActivities = {
  ...happyPathActivities,
  deployServiceActivity: async () => {
    throw new Error("Argo CD sync failed: manifest rejected by OPA gate");
  },
};

const baseInput: PromotionWorkflowInput = {
  service: "api-server",
  fromEnvironment: "staging",
  toEnvironment: "production",
  imageTag: "2.3.0",
  gitCommitSha: "abc123def456",
  initiatedBy: "release-bot",
  dependencies: [
    { service: "alloy-fabric-api", minimumVersion: "1.2.0", environment: "production" },
  ],
  approvalRequired: false,
  changeWindowId: null,
};

let testEnv: TestWorkflowEnvironment;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
});

afterAll(async () => {
  await testEnv.teardown();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

it("happy path — promoted=true when policy allows and deployment succeeds", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-promotion-happy",
    workflowsPath: new URL(
      "../workflows/promotion-workflow.ts",
      import.meta.url
    ).pathname,
    activities: happyPathActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(promotionWorkflow, {
      taskQueue: "test-promotion-happy",
      workflowId: "test-promotion-happy",
      args: [baseInput],
    });

    expect(result.promoted).toBe(true);
    expect(result.service).toBe("api-server");
    expect(result.toEnvironment).toBe("production");
    expect(result.imageTag).toBe("2.3.0");
    expect(result.deployedAt).not.toBeNull();
    expect(result.evidenceLedgerId).toBe("evidence-promo-001");
  });
});

// ---------------------------------------------------------------------------
// Policy-blocked path
// ---------------------------------------------------------------------------

it("policy-blocked path — promoted=false when OPA denies the promotion operation", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-promotion-policy",
    workflowsPath: new URL(
      "../workflows/promotion-workflow.ts",
      import.meta.url
    ).pathname,
    activities: policyBlockedActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(promotionWorkflow, {
      taskQueue: "test-promotion-policy",
      workflowId: "test-promotion-policy",
      args: [baseInput],
    });

    expect(result.promoted).toBe(false);
    expect(result.deployedAt).toBeNull();
    expect(result.evidenceLedgerId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Source-unhealthy path
// ---------------------------------------------------------------------------

it("source-unhealthy path — promoted=false when source environment health check fails", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-promotion-unhealthy",
    workflowsPath: new URL(
      "../workflows/promotion-workflow.ts",
      import.meta.url
    ).pathname,
    activities: unhealthySourceActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(promotionWorkflow, {
      taskQueue: "test-promotion-unhealthy",
      workflowId: "test-promotion-unhealthy",
      args: [baseInput],
    });

    expect(result.promoted).toBe(false);
    expect(result.deployedAt).toBeNull();
    expect(result.evidenceLedgerId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Deploy failure path: deployServiceActivity throws — workflow re-throws
// ---------------------------------------------------------------------------

it("deploy-failure path — workflow rejects when Argo CD sync fails", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-promotion-deploy-fail",
    workflowsPath: new URL(
      "../workflows/promotion-workflow.ts",
      import.meta.url
    ).pathname,
    activities: deployFailsActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    // Temporal wraps activity errors in ActivityFailure — the original message
    // is nested in the cause chain, not in the top-level error message.
    // We verify the workflow rejects (does not resolve promoted=true|false).
    await expect(
      client.workflow.execute(promotionWorkflow, {
        taskQueue: "test-promotion-deploy-fail",
        workflowId: "test-promotion-deploy-fail",
        args: [baseInput],
      })
    ).rejects.toThrow();
  });
});
