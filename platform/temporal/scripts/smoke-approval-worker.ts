/**
 * Smoke test for the agent-gateway approval worker.
 *
 * Verifies the end-to-end approval round trip that the production
 * `temporal-approval-worker` service is responsible for:
 *
 *   1. Boots an ephemeral Temporal dev server via `TestWorkflowEnvironment`.
 *   2. Bootstraps a worker through the SAME `bootstrapTemporalWorker()` path
 *      `start-approval-worker.ts` uses, configured to poll the
 *      `TEMPORAL_APPROVAL_TASK_QUEUE` (default `approval-task-queue`).
 *   3. Drives the agent-gateway's `routeApproval()` against that worker —
 *      exactly mirroring the production code path — and signals an
 *      approval decision.
 *   4. Asserts the gateway resolves to outcome="approved" with the
 *      approver identity propagated back.
 *
 * Exits 0 on success, 1 on failure. Designed to run in CI/local dev with
 * no external Temporal cluster.
 *
 *   pnpm --filter @szl-holdings/temporal-tests run worker:approval:smoke
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Client, Connection } from "@temporalio/client";
import { bootstrapTemporalWorker } from "../worker.js";
import { approvalDecisionSignal } from "../workflows/approval-workflow.js";
import type { ApprovalRecord } from "../types/workflow-types.js";
import { routeApproval } from "../../agent-gateway/src/approval.js";
import type {
  AgentActionRequest,
  CallerIdentity,
  EvidenceRecord,
  OpaDecision,
} from "../../agent-gateway/src/types.js";

const APPROVAL_TASK_QUEUE = "approval-task-queue";

const PROD_REQUEST: AgentActionRequest = {
  correlationId: "corr-smoke",
  capability: "inspect_code",
  model: "gpt-4o",
  promptHash: "deadbeef",
  target: "api-server",
  targetEnvironment: "production",
  domain: "platform",
  parameters: { prompt: "Smoke: production approval round-trip" },
  requestedAt: new Date().toISOString(),
};

const PLATFORM_ENGINEER: CallerIdentity = {
  sub: "smoke@szl.io",
  role: "platform-engineer",
  groups: ["platform-team"],
  orgId: "szl-holdings",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const DECISION: OpaDecision = {
  allowed: false,
  requiredApprovals: 1,
  requiredGroups: ["platform-team"],
  policyId: "szl.approval",
  evaluatedAt: new Date().toISOString(),
  reasons: ["smoke: production target requires approval"],
};

const EVIDENCE: EvidenceRecord = {
  evidenceId: "evidence-smoke",
  correlationId: PROD_REQUEST.correlationId,
  capability: PROD_REQUEST.capability,
  model: PROD_REQUEST.model,
  promptHash: PROD_REQUEST.promptHash,
  actor: PLATFORM_ENGINEER.sub,
  target: PROD_REQUEST.target,
  domain: PROD_REQUEST.domain,
  simulationResult: {
    safe: true,
    impactSummary: "smoke: no real impact",
    affectedResources: [],
    riskLevel: "low",
    warnings: [],
  },
  plan: {
    summary: "smoke: no plan steps",
    steps: [],
    estimatedDurationMs: 0,
    requiresApproval: true,
    approvalGroups: ["platform-team"],
  },
  diff: {
    additions: [],
    modifications: [],
    deletions: [],
    patchSummary: "smoke: no changes",
  },
  rollbackPath: "smoke://noop",
  policyDecision: DECISION,
  createdAt: new Date().toISOString(),
};

const mockActivities: Record<string, (...args: unknown[]) => unknown> = {
  evaluatePolicyActivity: async () => ({
    allowed: false,
    denialMessages: ["smoke: approval required"],
    warnMessages: [],
    evaluationId: "eval-smoke",
  }),
  requestApprovalActivity: async () => ({
    approvalRequestId: "req-smoke",
    notificationsSent: 1,
  }),
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-smoke" }),
  emitLyteVisibilityActivity: async () => undefined,
  deployServiceActivity: async () => ({
    deployedAt: new Date().toISOString(),
    deploymentId: "deploy-smoke",
  }),
  scaleServiceActivity: async () => ({ scaledAt: new Date().toISOString() }),
  toggleCircuitBreakerActivity: async () => ({
    toggledAt: new Date().toISOString(),
  }),
  checkServiceHealthActivity: async () => ({
    healthy: true,
    uptimeMinutes: 99,
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

async function main() {
  console.log("[smoke-approval] starting ephemeral Temporal dev server …");
  const env = await TestWorkflowEnvironment.createLocal();

  console.log(
    `[smoke-approval] bootstrapping worker via production path on taskQueue="${APPROVAL_TASK_QUEUE}" …`,
  );
  const bootstrapped = await bootstrapTemporalWorker({
    namespace: env.client.options.namespace,
    taskQueue: APPROVAL_TASK_QUEUE,
    workerOptions: {
      connection: env.nativeConnection,
      activities: mockActivities,
    },
  });

  const workerRun = bootstrapped.run();

  // Point the gateway client at the ephemeral Temporal env. We can't use the
  // env's gRPC address directly (TEMPORAL_ENDPOINT) because the gateway opens
  // its own Connection from the address string, so we override the loader
  // path: TEMPORAL_NAMESPACE + TEMPORAL_APPROVAL_TASK_QUEUE are read by the
  // gateway, and we hand it the test env's bound address.
  process.env.TEMPORAL_NAMESPACE = env.client.options.namespace;
  process.env.TEMPORAL_APPROVAL_TASK_QUEUE = APPROVAL_TASK_QUEUE;
  const temporalAddress = env.connection.options.address ?? "localhost:7233";

  // Background task: poll for the workflow to appear, then signal it.
  const signaller = (async () => {
    const client = new Client({
      connection: env.connection,
      namespace: env.client.options.namespace,
    });
    // The gateway names the workflow `agent-approval-<approvalId>`; we don't
    // know the approvalId in advance (randomUUID), so list executions on the
    // task queue and signal the first running one.
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      for await (const wf of client.workflow.list({
        query: `TaskQueue="${APPROVAL_TASK_QUEUE}" AND ExecutionStatus="Running"`,
      })) {
        const handle = client.workflow.getHandle(wf.workflowId);
        const decision: ApprovalRecord = {
          approverUserId: "smoke-approver",
          approverGroups: ["platform-team"],
          decision: "approved",
          decidedAt: new Date().toISOString(),
          notes: "smoke approval",
        };
        await handle.signal(approvalDecisionSignal, decision);
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error("smoke-approval: timed out waiting for workflow to start");
  })();

  let outcome: Awaited<ReturnType<typeof routeApproval>>;
  try {
    [outcome] = await Promise.all([
      routeApproval(
        DECISION,
        EVIDENCE,
        PROD_REQUEST,
        PLATFORM_ENGINEER,
        temporalAddress,
        30_000,
      ),
      signaller,
    ]);
  } finally {
    bootstrapped.shutdown();
    await workerRun.catch(() => undefined);
    await env.teardown();
  }

  console.log("[smoke-approval] gateway outcome:", JSON.stringify(outcome));
  if (outcome.outcome !== "approved") {
    throw new Error(
      `expected outcome="approved", got "${outcome.outcome}" — gateway↔worker round trip is broken`,
    );
  }
  if (outcome.approvedBy !== "smoke-approver") {
    throw new Error(
      `expected approvedBy="smoke-approver", got "${outcome.approvedBy}"`,
    );
  }

  console.log(
    "[smoke-approval] OK — agent-gateway end-to-end approval round trip works",
  );
}

main().catch((err) => {
  console.error(
    "[smoke-approval] FAILED",
    err instanceof Error ? (err.stack ?? err.message) : err,
  );
  process.exit(1);
});
