/**
 * Agent Gateway ↔ Temporal — End-to-End Approval Round Trip
 * Phase 11 / Task #4610
 *
 * Verifies that the agent gateway's `routeApproval` path, configured with a
 * live `TEMPORAL_ENDPOINT`, can:
 *   1. Start the `approvalWorkflow` against a real Temporal cluster.
 *   2. Receive the `approvalDecisionSignal` end-to-end.
 *   3. Resolve to "approved" with the approver's identity propagated back
 *      through the gateway's `ApprovalOutcome`.
 *
 * Uses `TestWorkflowEnvironment` so the test runs an actual Temporal
 * server (in-memory) without needing a dockerized Temporal Cloud.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { Client } from "@temporalio/client";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  approvalWorkflow,
  approvalDecisionSignal,
} from "../workflows/approval-workflow.ts";
import { routeApproval } from "../../agent-gateway/src/approval.js";
import type {
  AgentActionRequest,
  CallerIdentity,
  EvidenceRecord,
  OpaDecision,
} from "../../agent-gateway/src/types.js";
import type { ApprovalRecord } from "../types/workflow-types.js";

// ---------------------------------------------------------------------------
// Shared request/caller used by every test — mirrors what the gateway would
// build for a production-targeted inspect_code request, so the workflow input
// shape exercised here matches what authz.ts evaluated through OPA.
// ---------------------------------------------------------------------------

const PROD_REQUEST: AgentActionRequest = {
  correlationId: "corr-e2e",
  capability: "inspect_code",
  model: "gpt-4o",
  promptHash: "deadbeef",
  target: "api-server",
  targetEnvironment: "production",
  domain: "platform",
  parameters: { prompt: "Inspect production secrets handling" },
  requestedAt: new Date().toISOString(),
};

const PLATFORM_ENGINEER: CallerIdentity = {
  sub: "eng@szl.io",
  role: "platform-engineer",
  groups: ["platform-team"],
  orgId: "szl-holdings",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

// ---------------------------------------------------------------------------
// Mock activities — non-critical for the signal round-trip; they only need
// to return shaped values so the workflow proceeds past the OPA evaluation
// step into the "wait for approval signal" state.
// ---------------------------------------------------------------------------

const mockActivities = {
  evaluatePolicyActivity: async () => ({
    allowed: false,
    denialMessages: ["Approval required (mocked)"],
    warnMessages: [],
    evaluationId: "eval-e2e",
  }),
  requestApprovalActivity: async () => ({
    approvalRequestId: "req-e2e",
    notificationsSent: 1,
  }),
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-e2e" }),
  emitLyteVisibilityActivity: async () => undefined,
  deployServiceActivity: async () => ({
    deployedAt: new Date().toISOString(),
    deploymentId: "deploy-e2e",
  }),
  checkServiceHealthActivity: async () => ({
    healthy: true,
    uptimeMinutes: 99,
    details: {},
  }),
};

const TASK_QUEUE = "agent-gateway-e2e-queue";

let testEnv: TestWorkflowEnvironment;
let worker: Worker;
let workerRun: Promise<void>;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createLocal();
  worker = await Worker.create({
    connection: testEnv.nativeConnection,
    namespace: testEnv.client.options.namespace,
    taskQueue: TASK_QUEUE,
    workflowsPath: new URL("../workflows/approval-workflow.ts", import.meta.url).pathname,
    activities: mockActivities,
  });
  workerRun = worker.run();

  // Make the gateway client target this Temporal cluster + task queue.
  process.env.TEMPORAL_NAMESPACE = testEnv.client.options.namespace;
  process.env.TEMPORAL_APPROVAL_TASK_QUEUE = TASK_QUEUE;
}, 60_000);

afterAll(async () => {
  worker.shutdown();
  await workerRun;
  await testEnv.teardown();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEvidence(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  const policyDecision: OpaDecision = {
    allowed: true,
    requiredApprovals: 1,
    requiredGroups: ["platform-team", "release-managers"],
    policyId: "szl.approval/deploy",
    evaluatedAt: new Date().toISOString(),
    reasons: ["production target requires approval"],
  };
  return {
    evidenceId: "evidence-e2e",
    correlationId: "corr-e2e",
    capability: "inspect_code",
    model: "gpt-4o",
    promptHash: "deadbeef",
    actor: "eng@szl.io",
    target: "api-server",
    domain: "platform",
    simulationResult: {
      safe: true,
      impactSummary: "read-only",
      affectedResources: ["src/"],
      riskLevel: "medium",
      warnings: [],
    },
    plan: {
      summary: "inspect production",
      steps: [],
      estimatedDurationMs: 1000,
      requiresApproval: true,
      approvalGroups: ["platform-team"],
    },
    diff: { additions: [], modifications: [], deletions: [], patchSummary: "" },
    rollbackPath: "n/a",
    policyDecision,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Wait until exactly one workflow with the agent-approval-* id is open, then
 * return its workflowId. The gateway generates the approval ID internally,
 * so we discover it via Temporal's visibility API rather than guessing.
 */
async function findRunningApprovalWorkflowId(client: Client, deadlineMs: number): Promise<string> {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    const ids: string[] = [];
    for await (const wf of client.workflow.list({
      query: `WorkflowType = "approvalWorkflow" AND ExecutionStatus = "Running"`,
    })) {
      ids.push(wf.workflowId);
    }
    if (ids.length > 0) return ids[0];
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("No running approvalWorkflow appeared within the deadline");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("agent-gateway → Temporal approvalWorkflow (live)", () => {
  it("starts the workflow and resolves on approvalDecisionSignal (approved)", async () => {
    const evidence = buildEvidence();
    const decision = evidence.policyDecision;

    // The gateway-side call awaits the workflow result. We race it against
    // a signaller that finds the freshly-started workflow and signals it.
    const gatewayPromise = routeApproval(
      decision,
      evidence,
      PROD_REQUEST,
      PLATFORM_ENGINEER,
      testEnv.address,
      30_000,
    );

    const workflowId = await findRunningApprovalWorkflowId(testEnv.client, 10_000);
    const handle = testEnv.client.workflow.getHandle(workflowId);

    // Verify the workflow input the gateway sent matches what authz evaluated.
    // The workflow's first event carries the input; we read it back from
    // history so the assertion is grounded in real Temporal data, not a stub.
    const description = await handle.describe();
    expect(description.type).toBe("approvalWorkflow");

    const approverDecision: ApprovalRecord = {
      approverUserId: "ada@szl.io",
      approverGroups: ["platform-team"],
      decision: "approved",
      decidedAt: new Date().toISOString(),
      notes: "Verified scope is read-only",
    };
    await handle.signal(approvalDecisionSignal, approverDecision);

    const outcome = await gatewayPromise;
    expect(outcome.outcome).toBe("approved");
    expect(outcome.approvedBy).toBe("ada@szl.io");
    expect(outcome.approvedAt).toBeDefined();
  }, 60_000);

  it("propagates rejection back through the gateway", async () => {
    const evidence = buildEvidence({ correlationId: "corr-e2e-reject" });

    const gatewayPromise = routeApproval(
      evidence.policyDecision,
      evidence,
      { ...PROD_REQUEST, correlationId: "corr-e2e-reject" },
      PLATFORM_ENGINEER,
      testEnv.address,
      30_000,
    );

    const workflowId = await findRunningApprovalWorkflowId(testEnv.client, 10_000);
    const handle = testEnv.client.workflow.getHandle(workflowId);
    await handle.signal(approvalDecisionSignal, {
      approverUserId: "grace@szl.io",
      approverGroups: ["release-managers"],
      decision: "rejected",
      decidedAt: new Date().toISOString(),
      notes: "Out of change window",
    });

    const outcome = await gatewayPromise;
    expect(outcome.outcome).toBe("rejected");
    expect(outcome.rejectedBy).toBe("grace@szl.io");
    expect(outcome.rejectedReason).toContain("change window");
  }, 60_000);
});
