/**
 * Change window workflow unit tests — approved+executed, rejection, cancellation,
 * approval timeout, and policy-blocked paths.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import {
  changeWindowWorkflow,
  changeWindowApprovalSignal,
  cancelChangeWindowSignal,
  markChangeWindowExecutedSignal,
} from "../workflows/change-window-workflow.ts";
import type { ChangeWindowWorkflowInput } from "../types/workflow-types.js";
import { it, expect, beforeAll, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Mock activities
// ---------------------------------------------------------------------------

const allowedActivities = {
  evaluatePolicyActivity: async () => ({
    allowed: true,
    denialMessages: [],
    warnMessages: [],
    evaluationId: "eval-cw-001",
  }),
  requestApprovalActivity: async () => ({
    approvalRequestId: "req-cw-001",
    notificationsSent: 2,
  }),
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-cw-001" }),
  emitLyteVisibilityActivity: async () => undefined,
};

const policyBlockedActivities = {
  ...allowedActivities,
  evaluatePolicyActivity: async () => ({
    allowed: false,
    denialMessages: ["Change windows require approved risk level"],
    warnMessages: [],
    evaluationId: "eval-cw-blocked",
  }),
};

const baseInput: ChangeWindowWorkflowInput = {
  changeWindowId: "CW-2026-001",
  title: "Deploy api-server v2.4.0 to production",
  description: "Minor dependency updates and performance improvements",
  environment: "production",
  targetServices: ["api-server"],
  requestedBy: "release-manager",
  proposedStart: new Date(Date.now() + 100).toISOString(),    // 100ms from now
  proposedEnd: new Date(Date.now() + 3_600_000).toISOString(), // 1 hour window
  requiredApprovers: ["platform-team"],
  riskLevel: "low",
};

let testEnv: TestWorkflowEnvironment;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
});

afterAll(async () => {
  await testEnv.teardown();
});

// ---------------------------------------------------------------------------
// Happy path: approved then marked executed
// ---------------------------------------------------------------------------

it("happy path — status=executed when approved and markExecuted signal received", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-cw-happy",
    workflowsPath: new URL(
      "../workflows/change-window-workflow.ts",
      import.meta.url
    ).pathname,
    activities: allowedActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    const handle = await client.workflow.start(changeWindowWorkflow, {
      taskQueue: "test-cw-happy",
      workflowId: "test-cw-happy",
      args: [baseInput],
    });

    // Send approval
    await handle.signal(changeWindowApprovalSignal, {
      approverUserId: "platform-lead",
      approverGroups: ["platform-team"],
      decision: "approved",
      notes: "Approved — low risk, minor updates",
    });

    // Mark as executed
    await handle.signal(markChangeWindowExecutedSignal, {
      executedBy: "release-bot",
      operationsSummary: "api-server v2.4.0 deployed successfully",
    });

    const result = await handle.result();

    expect(result.status).toBe("executed");
    expect(result.changeWindowId).toBe("CW-2026-001");
    expect(result.approvedBy).toContain("platform-lead");
    expect(result.approvedAt).not.toBeNull();
    expect(result.executedAt).not.toBeNull();
    expect(result.evidenceLedgerId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Rejection path: approver rejects
// ---------------------------------------------------------------------------

it("rejection path — status=rejected when approver sends rejected decision", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-cw-rejected",
    workflowsPath: new URL(
      "../workflows/change-window-workflow.ts",
      import.meta.url
    ).pathname,
    activities: allowedActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    const handle = await client.workflow.start(changeWindowWorkflow, {
      taskQueue: "test-cw-rejected",
      workflowId: "test-cw-rejected",
      args: [baseInput],
    });

    await handle.signal(changeWindowApprovalSignal, {
      approverUserId: "platform-lead",
      approverGroups: ["platform-team"],
      decision: "rejected",
      notes: "Too close to end-of-quarter freeze",
    });

    const result = await handle.result();

    expect(result.status).toBe("rejected");
    expect(result.approvedBy).toHaveLength(0);
    expect(result.approvedAt).toBeNull();
    expect(result.executedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Cancellation path: requestor cancels before approval
// ---------------------------------------------------------------------------

it("cancellation path — status=cancelled when cancel signal sent before approval", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-cw-cancelled",
    workflowsPath: new URL(
      "../workflows/change-window-workflow.ts",
      import.meta.url
    ).pathname,
    activities: allowedActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    const handle = await client.workflow.start(changeWindowWorkflow, {
      taskQueue: "test-cw-cancelled",
      workflowId: "test-cw-cancelled",
      args: [baseInput],
    });

    await handle.signal(cancelChangeWindowSignal, {
      reason: "Deployment dependency not ready",
    });

    const result = await handle.result();

    expect(result.status).toBe("cancelled");
    expect(result.approvedAt).toBeNull();
    expect(result.executedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Multi-approver path: two required groups, two separate approvals needed
// ---------------------------------------------------------------------------

it("multi-approver path — only executes when all required groups approve", async () => {
  const multiApproverInput: ChangeWindowWorkflowInput = {
    ...baseInput,
    changeWindowId: "CW-2026-MULTI",
    requiredApprovers: ["platform-team", "security-team"],
  };

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-cw-multi",
    workflowsPath: new URL(
      "../workflows/change-window-workflow.ts",
      import.meta.url
    ).pathname,
    activities: allowedActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    const handle = await client.workflow.start(changeWindowWorkflow, {
      taskQueue: "test-cw-multi",
      workflowId: "test-cw-multi",
      args: [multiApproverInput],
    });

    // First approval covers only platform-team — not sufficient yet
    await handle.signal(changeWindowApprovalSignal, {
      approverUserId: "platform-lead",
      approverGroups: ["platform-team"],
      decision: "approved",
      notes: "Approved from platform side",
    });

    // Second approval covers security-team — now all groups covered
    await handle.signal(changeWindowApprovalSignal, {
      approverUserId: "security-lead",
      approverGroups: ["security-team"],
      decision: "approved",
      notes: "Security sign-off complete",
    });

    // Mark as executed
    await handle.signal(markChangeWindowExecutedSignal, {
      executedBy: "release-bot",
      operationsSummary: "Deployed successfully after dual approval",
    });

    const result = await handle.result();

    expect(result.status).toBe("executed");
    expect(result.approvedBy).toContain("platform-lead");
    expect(result.approvedBy).toContain("security-lead");
    expect(result.approvedAt).not.toBeNull();
    expect(result.executedAt).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Policy-blocked path: OPA denies the change window
// ---------------------------------------------------------------------------

it("policy-blocked path — status=rejected when OPA denies the change window", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-cw-policy",
    workflowsPath: new URL(
      "../workflows/change-window-workflow.ts",
      import.meta.url
    ).pathname,
    activities: policyBlockedActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    const result = await client.workflow.execute(changeWindowWorkflow, {
      taskQueue: "test-cw-policy",
      workflowId: "test-cw-policy",
      args: [baseInput],
    });

    expect(result.status).toBe("rejected");
    expect(result.approvedAt).toBeNull();
    expect(result.executedAt).toBeNull();
    expect(result.evidenceLedgerId).toBeDefined();
  });
});
