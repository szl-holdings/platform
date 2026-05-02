/**
 * Remediation workflow unit tests — rollback success, exhausted attempts,
 * policy-blocked, and human-abort paths.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { remediationWorkflow, humanDecisionSignal } from "../workflows/remediation-workflow.ts";
import type { RemediationWorkflowInput } from "../types/workflow-types.js";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const mockActivities = {
  evaluatePolicyActivity: async () => ({
    allowed: true,
    denialMessages: [],
    warnMessages: [],
    evaluationId: "eval-rem-001",
  }),

  recordEvidenceActivity: async () => ({ evidenceId: "evidence-rem-001" }),

  emitLyteVisibilityActivity: async () => undefined,

  deployServiceActivity: async () => ({
    deployedAt: new Date().toISOString(),
    deploymentId: "deploy-rem-001",
  }),

  checkServiceHealthActivity: async () => ({
    healthy: true,
    uptimeMinutes: 3,
    details: { db: "ok" },
  }),

  requestApprovalActivity: async () => ({
    approvalRequestId: "req-rem-001",
    notificationsSent: 1,
  }),
};

const unhealthyMockActivities = {
  ...mockActivities,
  checkServiceHealthActivity: async () => ({
    healthy: false,
    uptimeMinutes: 0,
    details: { db: "error: connection refused" },
  }),
};

const policyBlockedMockActivities = {
  ...mockActivities,
  evaluatePolicyActivity: async () => ({
    allowed: false,
    denialMessages: ["Direct writes to production require break-glass approval"],
    warnMessages: [],
    evaluationId: "eval-rem-002",
  }),
};

const baseInput: RemediationWorkflowInput = {
  incidentId: "INC-001",
  violationType: "health-degradation",
  affectedService: "api-server",
  environment: "production",
  strategy: "rollback",
  initiatedBy: "user-oncall",
  policyId: "szl.environment",
  evidenceLedgerId: null,
  autoRemediate: true,
  maxAttempts: 3,
};

let testEnv: TestWorkflowEnvironment;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
});

afterAll(async () => {
  await testEnv.teardown();
});

it("happy path — rollback succeeds and service becomes healthy", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-remediation-happy",
    workflowsPath: new URL("../workflows/remediation-workflow.ts", import.meta.url).pathname,
    activities: mockActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(remediationWorkflow, {
      taskQueue: "test-remediation-happy",
      workflowId: "test-remediation-happy",
      args: [baseInput],
    });

    expect(result.status).toBe("resolved");
    expect(result.attemptsCount).toBeGreaterThan(0);
    expect(result.resolvedAt).not.toBeNull();
    expect(result.evidenceLedgerId).toBe("evidence-rem-001");
    expect(result.timeline.length).toBeGreaterThan(0);
  });
});

it("failure path — all attempts exhausted, status is failed", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-remediation-failure",
    workflowsPath: new URL("../workflows/remediation-workflow.ts", import.meta.url).pathname,
    activities: unhealthyMockActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(remediationWorkflow, {
      taskQueue: "test-remediation-failure",
      workflowId: "test-remediation-failure",
      args: [{ ...baseInput, maxAttempts: 2 }],
    });

    expect(result.status).toBe("failed");
    expect(result.attemptsCount).toBe(2);
    expect(result.resolvedAt).toBeNull();
  });
});

it("policy-blocked path — remediation blocked when policy denies", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-remediation-policy",
    workflowsPath: new URL("../workflows/remediation-workflow.ts", import.meta.url).pathname,
    activities: policyBlockedMockActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(remediationWorkflow, {
      taskQueue: "test-remediation-policy",
      workflowId: "test-remediation-policy",
      args: [baseInput],
    });

    expect(result.status).toBe("failed");
    expect(result.timeline[0].step).toBe("policy-check");
    expect(result.timeline[0].outcome).toBe("failure");
  });
});

it("human-abort path — workflow escalated when human aborts manual remediation", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-remediation-manual",
    workflowsPath: new URL("../workflows/remediation-workflow.ts", import.meta.url).pathname,
    activities: mockActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    const handle = await client.workflow.start(remediationWorkflow, {
      taskQueue: "test-remediation-manual",
      workflowId: "test-remediation-manual",
      args: [{ ...baseInput, autoRemediate: false }],
    });

    // Abort via human signal
    await handle.signal(humanDecisionSignal, {
      decision: "abort",
      notes: "Too risky at this time",
    });

    const result = await handle.result();
    expect(result.status).toBe("escalated");
  });
});
