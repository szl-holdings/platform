/**
 * Worker smoke test — boots an ephemeral Temporal dev server via
 * `TestWorkflowEnvironment.createLocal()`, registers all platform workflows
 * and (mocked) activities through the SAME `bootstrapTemporalWorker()` path
 * the production worker uses, then starts and awaits a simple
 * `approvalWorkflow` to verify end-to-end execution.
 *
 * Exits 0 on success, 1 on failure. Designed to run in CI/local dev without
 * any external Temporal cluster.
 *
 *   pnpm --filter @szl-holdings/temporal-tests run worker:smoke
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Client } from "@temporalio/client";
import {
  approvalWorkflow,
  approvalDecisionSignal,
} from "../workflows/approval-workflow.js";
import type { ApprovalRecord, ApprovalWorkflowInput } from "../types/workflow-types.js";
import { bootstrapTemporalWorker, buildActivityRegistry } from "../worker.js";

const TASK_QUEUE = "smoke-szl-platform";

/**
 * Activity drift guard — if a new activity is added to the registry, it
 * should be acknowledged here so the smoke test surfaces silent drift
 * between worker registration and what workflows actually expect.
 */
const EXPECTED_ACTIVITIES = new Set<string>([
  // approval-activities
  "evaluatePolicyActivity",
  "requestApprovalActivity",
  "recordEvidenceActivity",
  "emitLyteVisibilityActivity",
  "deployServiceActivity",
  "scaleServiceActivity",
  "toggleCircuitBreakerActivity",
  "checkServiceHealthActivity",
  // evidence-activities
  "collectEvidenceItemActivity",
  // ingestion-activities
  "fetchIngestBatchActivity",
  // frontier-ingest-activities
  "pullFrontierSourceActivity",
  "listFrontierSourcesActivity",
]);

function assertActivityRegistry(): void {
  const registered = new Set(
    Object.entries(buildActivityRegistry())
      .filter(([, v]) => typeof v === "function")
      .map(([k]) => k),
  );
  const missing = [...EXPECTED_ACTIVITIES].filter((n) => !registered.has(n));
  const extra = [...registered].filter((n) => !EXPECTED_ACTIVITIES.has(n));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Activity registry drift detected. missing=[${missing.join(",")}] ` +
        `extra=[${extra.join(",")}] — update EXPECTED_ACTIVITIES in smoke-test.ts ` +
        `and the workflows that consume them.`,
    );
  }
}

async function main() {
  console.log("[smoke] verifying activity registry against expected set …");
  assertActivityRegistry();

  console.log("[smoke] starting ephemeral Temporal dev server …");
  const env = await TestWorkflowEnvironment.createLocal();

  // Mock activities that satisfy the workflow shape. Real implementations call
  // OPA / api-server which aren't reachable in a smoke test; what we want to
  // verify is that the worker registration path bootstraps workflows correctly
  // and a workflow can run to completion.
  const mockActivities: Record<string, (...args: unknown[]) => unknown> = {
    evaluatePolicyActivity: async () => ({
      allowed: false, // force the human-approval branch
      denialMessages: ["smoke-test: approval required"],
      warnMessages: [],
      evaluationId: "smoke-eval",
    }),
    requestApprovalActivity: async () => ({
      approvalRequestId: "smoke-req",
      notificationsSent: 0,
    }),
    recordEvidenceActivity: async () => ({ evidenceId: "smoke-evidence" }),
    emitLyteVisibilityActivity: async () => undefined,
    deployServiceActivity: async () => ({
      deployedAt: new Date().toISOString(),
      deploymentId: "smoke-deploy",
    }),
    scaleServiceActivity: async () => ({ scaledAt: new Date().toISOString() }),
    toggleCircuitBreakerActivity: async () => ({ toggledAt: new Date().toISOString() }),
    checkServiceHealthActivity: async () => ({
      healthy: true,
      uptimeMinutes: 1,
      details: {},
    }),
    collectEvidenceItemActivity: async () => ({}),
    fetchIngestBatchActivity: async () => ({
      recordsIngested: 0,
      recordsFailed: 0,
      continuationToken: null,
      hasMore: false,
    }),
    pullFrontierSourceActivity: async () => ({
      artifactsDiscovered: 0,
      costUsd: 0,
      capReached: false,
    }),
    listFrontierSourcesActivity: async () => [],
  };

  console.log("[smoke] bootstrapping worker via production path …");
  const bootstrapped = await bootstrapTemporalWorker({
    namespace: env.client.options.namespace,
    taskQueue: TASK_QUEUE,
    workflowsPath: new URL("../workflows/index.ts", import.meta.url).pathname,
    workerOptions: {
      // Override the gRPC connection with the test env's in-memory connection
      // and override activities with mocks that don't perform external I/O.
      connection: env.nativeConnection,
      activities: mockActivities,
    },
  });

  const workerRun = bootstrapped.run();

  try {
    const input: ApprovalWorkflowInput = {
      operationType: "deploy",
      targetService: "api-server",
      targetEnvironment: "production",
      targetVersion: "v0.0.0-smoke",
      policyId: "szl.approval",
      initiatedBy: "smoke@szl.io",
      requestedApproverGroups: ["platform-team"],
      requiredApprovalCount: 1,
      timeoutMs: 60_000,
      context: { smoke: true },
    };

    // Use a separate Client targeting the same test env so we exercise the
    // standard client→worker round trip rather than the env's bundled client.
    const client = new Client({
      connection: env.connection,
      namespace: env.client.options.namespace,
    });

    console.log("[smoke] starting approvalWorkflow …");
    const handle = await client.workflow.start(approvalWorkflow, {
      args: [input],
      workflowId: `smoke-${Date.now()}`,
      taskQueue: TASK_QUEUE,
    });

    // Send an approval signal shaped exactly like the domain ApprovalRecord
    // contract — no `as` cast — so the smoke test validates the real type.
    const decision: ApprovalRecord = {
      approverUserId: "smoke-approver",
      approverGroups: ["platform-team"],
      decision: "approved",
      decidedAt: new Date().toISOString(),
      notes: "smoke-test auto-approve",
    };
    await handle.signal(approvalDecisionSignal, decision);

    const result = await handle.result();
    console.log("[smoke] workflow completed:", JSON.stringify(result));
    if (result.outcome !== "approved") {
      throw new Error(`expected outcome="approved", got "${result.outcome}"`);
    }
  } finally {
    bootstrapped.shutdown();
    await workerRun;
    await env.teardown();
  }

  console.log("[smoke] OK — worker can register and execute platform workflows");
}

main().catch((err) => {
  console.error("[smoke] FAILED", err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
