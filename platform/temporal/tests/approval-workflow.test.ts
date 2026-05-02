/**
 * Approval workflow unit tests — happy path, rejection, timeout, cancellation,
 * and policy-allows short-circuit.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import {
  approvalWorkflow,
  approvalDecisionSignal,
  cancelApprovalSignal,
} from "../workflows/approval-workflow.ts";
import type { ApprovalWorkflowInput, ApprovalRecord } from "../types/workflow-types.js";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Mock activities — unit tests do not hit real services
// ---------------------------------------------------------------------------

const allowedMockActivities = {
  evaluatePolicyActivity: async () => ({
    allowed: true,
    denialMessages: [],
    warnMessages: [],
    evaluationId: "eval-test-allowed",
  }),
  requestApprovalActivity: async () => ({
    approvalRequestId: "req-test-001",
    notificationsSent: 2,
  }),
  recordEvidenceActivity: async () => ({
    evidenceId: "evidence-test-001",
  }),
  emitLyteVisibilityActivity: async () => undefined,
  deployServiceActivity: async () => ({
    deployedAt: new Date().toISOString(),
    deploymentId: "deploy-test-001",
  }),
  checkServiceHealthActivity: async () => ({
    healthy: true,
    uptimeMinutes: 15,
    details: { db: "ok", cache: "ok" },
  }),
};

const requiresApprovalMockActivities = {
  ...allowedMockActivities,
  evaluatePolicyActivity: async () => ({
    allowed: false,
    denialMessages: ["Approval required for production deploy"],
    warnMessages: [],
    evaluationId: "eval-test-blocked",
  }),
};

const baseInput: ApprovalWorkflowInput = {
  operationType: "deploy",
  targetService: "api-server",
  targetEnvironment: "production",
  targetVersion: "2.1.0",
  policyId: "szl.approval",
  initiatedBy: "user-123",
  requestedApproverGroups: ["platform-team"],
  requiredApprovalCount: 1,
  timeoutMs: 200,
  context: { gitCommitSha: "abc123" },
};

let testEnv: TestWorkflowEnvironment;
let worker: Worker;
let runPromise: Promise<void>;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-approval",
    workflowsPath: new URL("../workflows/approval-workflow.ts", import.meta.url).pathname,
    activities: requiresApprovalMockActivities,
  });
  // Do NOT await worker.run() — it blocks until shutdown(). Store the promise for afterAll.
  runPromise = worker.run();
});

afterAll(async () => {
  worker.shutdown();
  await runPromise;
  await testEnv.teardown();
});

// ---------------------------------------------------------------------------
// Happy path: approval received before timeout
// ---------------------------------------------------------------------------

it("happy path — resolves approved when signal received before timeout", async () => {
  const { client } = testEnv;

  const handle = await client.workflow.start(approvalWorkflow, {
    taskQueue: "test-approval",
    workflowId: "test-approval-happy-path",
    args: [baseInput],
  });

  const approvalRecord: ApprovalRecord = {
    approverUserId: "approver-001",
    approverGroups: ["platform-team"],
    decision: "approved",
    decidedAt: new Date().toISOString(),
    notes: "LGTM",
  };
  await handle.signal(approvalDecisionSignal, approvalRecord);

  const result = await handle.result();

  expect(result.outcome).toBe("approved");
  expect(result.approvals).toHaveLength(1);
  expect(result.approvals[0].approverUserId).toBe("approver-001");
  expect(result.approvals[0].decision).toBe("approved");
  expect(result.evidenceLedgerId).toBe("evidence-test-001");
});

// ---------------------------------------------------------------------------
// Rejection path: approver rejects
// ---------------------------------------------------------------------------

it("rejection path — resolves rejected when approver sends rejected decision", async () => {
  const { client } = testEnv;

  const handle = await client.workflow.start(approvalWorkflow, {
    taskQueue: "test-approval",
    workflowId: "test-approval-rejected",
    args: [baseInput],
  });

  const rejectionRecord: ApprovalRecord = {
    approverUserId: "approver-002",
    approverGroups: ["platform-team"],
    decision: "rejected",
    decidedAt: new Date().toISOString(),
    notes: "Not enough test coverage",
  };
  await handle.signal(approvalDecisionSignal, rejectionRecord);

  const result = await handle.result();

  expect(result.outcome).toBe("rejected");
  expect(result.approvals).toHaveLength(1);
  expect(result.approvals[0].decision).toBe("rejected");
  expect(result.evidenceLedgerId).toBeDefined();
});

// ---------------------------------------------------------------------------
// Timeout path: no signal within timeoutMs
// ---------------------------------------------------------------------------

it("timeout path — resolves expired when no signal received within timeoutMs", async () => {
  const { client } = testEnv;

  const handle = await client.workflow.start(approvalWorkflow, {
    taskQueue: "test-approval",
    workflowId: "test-approval-timeout",
    args: [{ ...baseInput, timeoutMs: 50 }],
  });

  await testEnv.sleep("200ms");

  const result = await handle.result();

  expect(result.outcome).toBe("expired");
  expect(result.approvals).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Cancellation path: explicit cancel signal
// ---------------------------------------------------------------------------

it("cancellation path — resolves rejected when cancel signal sent", async () => {
  const { client } = testEnv;

  const handle = await client.workflow.start(approvalWorkflow, {
    taskQueue: "test-approval",
    workflowId: "test-approval-cancelled",
    args: [baseInput],
  });

  await handle.signal(cancelApprovalSignal, { reason: "Cancelled by requester" });

  const result = await handle.result();

  expect(result.outcome).toBe("rejected");
  expect(result.evidenceLedgerId).toBeDefined();
});

// ---------------------------------------------------------------------------
// Policy-allows short-circuit: when policy returns allowed=true, workflow
// should complete without waiting for a human approval signal.
// This test uses a separate worker configured with the allowedMockActivities.
// ---------------------------------------------------------------------------

describe("policy-allows short-circuit", () => {
  let allowedWorker: Worker;
  let allowedRunPromise: Promise<void>;

  beforeAll(async () => {
    allowedWorker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue: "test-approval-policy-allows",
      workflowsPath: new URL("../workflows/approval-workflow.ts", import.meta.url).pathname,
      activities: allowedMockActivities,
    });
    allowedRunPromise = allowedWorker.run();
  });

  afterAll(async () => {
    allowedWorker.shutdown();
    await allowedRunPromise;
  });

  it("skips human approval and resolves approved when policy allows the operation", async () => {
    const { client } = testEnv;

    const handle = await client.workflow.start(approvalWorkflow, {
      taskQueue: "test-approval-policy-allows",
      workflowId: "test-approval-policy-allows",
      args: [{ ...baseInput, targetEnvironment: "development" }],
    });

    const result = await handle.result();

    // With policy returning allowed=true and no deny messages,
    // the workflow should short-circuit and resolve without a human signal
    expect(result.outcome).toBe("approved");
    expect(result.approvals).toHaveLength(0);
    expect(result.evidenceLedgerId).toBeDefined();
  });
});
