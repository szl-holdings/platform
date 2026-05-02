/**
 * Temporal workflow replay tests — Phase 10 (Operability & Governance)
 *
 * Validates determinism: runs each workflow to completion, fetches the event
 * history, then re-replays it via Worker.runReplayHistory(). A
 * DeterminismViolationError would surface if workflow code diverges from a
 * recorded history (e.g., after refactoring).
 *
 * Date.now() inside workflow bodies returns logical workflow time (Temporal
 * sandbox-patches the global Date object), so it is deterministic by design.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import type { WorkflowHandle } from "@temporalio/client";
import {
  approvalWorkflow,
  approvalDecisionSignal,
} from "../workflows/approval-workflow.ts";
import { promotionWorkflow } from "../workflows/promotion-workflow.ts";
import { remediationWorkflow } from "../workflows/remediation-workflow.ts";
import type {
  ApprovalWorkflowInput,
  ApprovalRecord,
  PromotionWorkflowInput,
  RemediationWorkflowInput,
} from "../types/workflow-types.js";
import { it, expect, beforeAll, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Infer history type from the SDK — avoids `any` while staying SDK-portable
// ---------------------------------------------------------------------------

type WorkflowHistory = Awaited<ReturnType<WorkflowHandle<unknown>["fetchHistory"]>>;

// ---------------------------------------------------------------------------
// Shared mock activities covering all three workflows
// ---------------------------------------------------------------------------

const mockActivities = {
  evaluatePolicyActivity: async () => ({
    allowed: false,
    denialMessages: ["approval required"],
    warnMessages: [],
    evaluationId: "eval-replay-001",
  }),
  requestApprovalActivity: async () => ({
    approvalRequestId: "req-replay-001",
    notificationsSent: 1,
  }),
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-replay-001" }),
  emitLyteVisibilityActivity: async () => undefined,
  deployServiceActivity: async () => ({
    deployedAt: "2026-01-01T00:00:00.000Z",
    deploymentId: "deploy-replay-001",
  }),
  checkServiceHealthActivity: async () => ({
    healthy: true,
    uptimeMinutes: 10,
    details: { version: "2.0.0", db: "ok" },
  }),
  scaleServiceActivity: async () => ({
    scaledAt: "2026-01-01T00:00:00.000Z",
    previousReplicas: 3,
    targetReplicas: 0,
  }),
  toggleCircuitBreakerActivity: async () => ({
    toggledAt: "2026-01-01T00:00:00.000Z",
    previousState: "closed",
    newState: "open",
  }),
};

const promotionMockActivities = {
  ...mockActivities,
  evaluatePolicyActivity: async () => ({
    allowed: true,
    denialMessages: [],
    warnMessages: [],
    evaluationId: "eval-replay-promo",
  }),
};

// ---------------------------------------------------------------------------
// Test environment setup
// ---------------------------------------------------------------------------

let testEnv: TestWorkflowEnvironment;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
});

afterAll(async () => {
  await testEnv.teardown();
});

// ---------------------------------------------------------------------------
// Replay test: approval-workflow (approved path)
// ---------------------------------------------------------------------------

it("approval-workflow — approved path replays deterministically", async () => {
  const input: ApprovalWorkflowInput = {
    operationType: "deploy",
    targetService: "api-server",
    targetEnvironment: "production",
    targetVersion: "2.0.0",
    requestedApproverGroups: ["platform-team"],
    requiredApprovalCount: 1,
    timeoutMs: 60_000,
    initiatedBy: "release-manager",
    policyId: "PLT-deploy-production",
    context: {},
  };

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-replay-approval",
    workflowsPath: new URL("../workflows/approval-workflow.ts", import.meta.url).pathname,
    activities: mockActivities,
  });

  let history: WorkflowHistory | undefined;
  const handle = await testEnv.client.workflow.start(approvalWorkflow, {
    taskQueue: "test-replay-approval",
    workflowId: "test-replay-approval-approved",
    args: [input],
  });

  await worker.runUntil(async () => {
    // ApprovalRecord has no approvalId field — see workflow-types.ts
    const approvalRecord: ApprovalRecord = {
      approverUserId: "platform-lead",
      approverGroups: ["platform-team"],
      decision: "approved",
      decidedAt: "2026-01-01T00:01:00.000Z",
      notes: "Approved for replay test",
    };
    await handle.signal(approvalDecisionSignal, approvalRecord);

    const result = await handle.result();
    expect(result.outcome).toBe("approved");

    history = await handle.fetchHistory();
  });

  // Worker.runReplayHistory replays the event history against current workflow code.
  // Throws DeterminismViolationError if the code is no longer compatible.
  await expect(
    Worker.runReplayHistory(
      { workflowsPath: new URL("../workflows/approval-workflow.ts", import.meta.url).pathname },
      history!,
    )
  ).resolves.not.toThrow();
});

// ---------------------------------------------------------------------------
// Replay test: approval-workflow (rejected path)
// Specifically validates the rejection short-circuit fix: a rejected signal
// must produce outcome="rejected", not "expired" (the pre-fix behavior).
// ---------------------------------------------------------------------------

it("approval-workflow — rejected path replays deterministically", async () => {
  const input: ApprovalWorkflowInput = {
    operationType: "deploy",
    targetService: "api-server",
    targetEnvironment: "production",
    targetVersion: "2.0.0",
    requestedApproverGroups: ["platform-team"],
    requiredApprovalCount: 1,
    timeoutMs: 60_000,
    initiatedBy: "release-manager",
    policyId: "PLT-deploy-production",
    context: {},
  };

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-replay-approval-rejected",
    workflowsPath: new URL("../workflows/approval-workflow.ts", import.meta.url).pathname,
    activities: mockActivities,
  });

  let history: WorkflowHistory | undefined;
  const handle = await testEnv.client.workflow.start(approvalWorkflow, {
    taskQueue: "test-replay-approval-rejected",
    workflowId: "test-replay-approval-rejected",
    args: [input],
  });

  await worker.runUntil(async () => {
    const approvalRecord: ApprovalRecord = {
      approverUserId: "platform-lead",
      approverGroups: ["platform-team"],
      decision: "rejected",
      decidedAt: "2026-01-01T00:01:00.000Z",
      notes: "Rejected — freeze window active",
    };
    await handle.signal(approvalDecisionSignal, approvalRecord);

    const result = await handle.result();
    // Rejection signal must produce "rejected" immediately, NOT "expired".
    expect(result.outcome).toBe("rejected");

    history = await handle.fetchHistory();
  });

  await expect(
    Worker.runReplayHistory(
      { workflowsPath: new URL("../workflows/approval-workflow.ts", import.meta.url).pathname },
      history!,
    )
  ).resolves.not.toThrow();
});

// ---------------------------------------------------------------------------
// Replay test: promotion-workflow (dependency check passes + deployed)
// ---------------------------------------------------------------------------

it("promotion-workflow — approved path replays deterministically", async () => {
  // PromotionWorkflowInput: gitCommitSha and changeWindowId are required
  const input: PromotionWorkflowInput = {
    service: "api-server",
    imageTag: "sha256:abc123",
    fromEnvironment: "staging",
    toEnvironment: "production",
    gitCommitSha: "abc123def456abc123def456abc123def456abc123",
    initiatedBy: "release-manager",
    dependencies: [{ service: "auth-service", minimumVersion: "1.0.0", environment: "production" }],
    approvalRequired: false,
    changeWindowId: null,
  };

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-replay-promotion",
    workflowsPath: new URL("../workflows/promotion-workflow.ts", import.meta.url).pathname,
    activities: promotionMockActivities,
  });

  let history: WorkflowHistory | undefined;

  await worker.runUntil(async () => {
    await testEnv.client.workflow.execute(promotionWorkflow, {
      taskQueue: "test-replay-promotion",
      workflowId: "test-replay-promotion-approved",
      args: [input],
    });

    const promoHandle = testEnv.client.workflow.getHandle("test-replay-promotion-approved");
    history = await promoHandle.fetchHistory();
  });

  await expect(
    Worker.runReplayHistory(
      { workflowsPath: new URL("../workflows/promotion-workflow.ts", import.meta.url).pathname },
      history!,
    )
  ).resolves.not.toThrow();
});

// ---------------------------------------------------------------------------
// Replay test: remediation-workflow (rollback strategy, auto-remediate)
// ---------------------------------------------------------------------------

it("remediation-workflow — rollback path replays deterministically", async () => {
  // RemediationWorkflowInput: use correct field names from workflow-types.ts
  const input: RemediationWorkflowInput = {
    incidentId: "INC-replay-001",
    violationType: "health-degradation",
    affectedService: "api-server",
    environment: "production",
    strategy: "rollback",
    initiatedBy: "alert-manager",
    policyId: "szl.environment",
    evidenceLedgerId: null,
    autoRemediate: true,
    maxAttempts: 1,
  };

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-replay-remediation",
    workflowsPath: new URL("../workflows/remediation-workflow.ts", import.meta.url).pathname,
    activities: {
      ...mockActivities,
      evaluatePolicyActivity: async () => ({
        allowed: true,
        denialMessages: [],
        warnMessages: [],
        evaluationId: "eval-remediation-replay",
      }),
    },
  });

  let history: WorkflowHistory | undefined;

  await worker.runUntil(async () => {
    const result = await testEnv.client.workflow.execute(remediationWorkflow, {
      taskQueue: "test-replay-remediation",
      workflowId: "test-replay-remediation-rollback",
      args: [input],
    });

    // RemediationWorkflowResult.status is "resolved" | "escalated" | "failed" | ...
    expect(result.status).toBe("resolved");

    const remHandle = testEnv.client.workflow.getHandle("test-replay-remediation-rollback");
    history = await remHandle.fetchHistory();
  });

  await expect(
    Worker.runReplayHistory(
      { workflowsPath: new URL("../workflows/remediation-workflow.ts", import.meta.url).pathname },
      history!,
    )
  ).resolves.not.toThrow();
});
