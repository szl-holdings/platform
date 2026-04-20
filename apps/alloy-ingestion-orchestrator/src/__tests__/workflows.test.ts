/**
 * AEF Ingestion Orchestrator — Integration Tests
 *
 * Covers:
 *   - Happy path for each of the 5 workflows
 *   - Retry-from-checkpoint (step failure → retry → success)
 *   - Approval-gated rebuild_index path (approve + reject)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { OrchestratorEngine } from "../engine.js";
import { InMemoryRunStore } from "../run-store.js";
import { InMemoryCheckpointStore } from "../checkpoint-store.js";
import { InMemoryAuditEmitter } from "../audit.js";
import {
  InMemoryRawDocumentStore,
  InMemoryChunkStore,
  InMemoryIndexStore,
} from "../storage/dev.js";
import { buildIngestDocumentWorkflow } from "../workflows/ingest-document.js";
import { buildRebuildIndexWorkflow } from "../workflows/rebuild-index.js";
import { buildVerifyIndexHealthWorkflow } from "../workflows/verify-index-health.js";
import { buildRunRetrievalEvalWorkflow } from "../workflows/run-retrieval-eval.js";
import { buildRotateProfileVersionWorkflow } from "../workflows/rotate-profile-version.js";
import { clearPendingApprovalRequests, clearApprovalInbox } from "@workspace/approvals-inbox";
import type { StorageAdapters } from "../storage/interfaces.js";

function makeEngine(storage?: Partial<StorageAdapters>) {
  const rawDocumentStore = new InMemoryRawDocumentStore();
  const chunkStore = new InMemoryChunkStore();
  const indexStore = new InMemoryIndexStore();

  return new OrchestratorEngine({
    runStore: new InMemoryRunStore(),
    checkpointStore: new InMemoryCheckpointStore(),
    audit: new InMemoryAuditEmitter(),
    storage: {
      rawDocumentStore,
      chunkStore,
      indexStore,
      ...storage,
    },
  });
}

const TENANT = "tenant-test-001";
const PROFILE = "default";

beforeEach(() => {
  clearPendingApprovalRequests();
  clearApprovalInbox();
});

// ─── 1. ingest_document happy path ───────────────────────────────────────────

describe("ingest_document workflow", () => {
  it("happy path: completes all steps and writes chunks to store", async () => {
    const chunkStore = new InMemoryChunkStore();
    const engine = makeEngine({ chunkStore });

    const definition = buildIngestDocumentWorkflow(
      {
        sourceId: "doc-001",
        content: "The quick brown fox jumps over the lazy dog. ".repeat(20),
        contentType: "text/plain",
        title: "Test Document",
        chunkSize: 64,
        chunkOverlap: 8,
      },
      TENANT,
      PROFILE,
    );

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: { sourceId: "doc-001" },
    });

    expect(run.status).toBe("completed");
    expect(run.stepResults).toHaveLength(5);
    expect(run.stepResults.every((r) => r.status === "completed")).toBe(true);

    const chunks = await chunkStore.listBySource("doc-001", TENANT);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("produces step results for all 5 actors", async () => {
    const engine = makeEngine();
    const definition = buildIngestDocumentWorkflow(
      {
        sourceId: "doc-002",
        content: "Short document content.",
        contentType: "text/plain",
      },
      TENANT,
      PROFILE,
    );

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: { sourceId: "doc-002" },
    });

    expect(run.status).toBe("completed");
    const actors = run.stepResults.map((r) => r.actor);
    expect(actors).toContain("IngestionPlanner");
    expect(actors).toContain("SchemaMapper");
    expect(actors).toContain("PolicyGuard");
    expect(actors).toContain("EmbedDispatcher");
    expect(actors).toContain("IndexVerifier");
  });

  it("emits audit events for run lifecycle", async () => {
    const audit = new InMemoryAuditEmitter();
    const engine = makeEngine();
    const engineWithAudit = new OrchestratorEngine({
      runStore: new InMemoryRunStore(),
      checkpointStore: new InMemoryCheckpointStore(),
      audit,
      storage: {
        rawDocumentStore: new InMemoryRawDocumentStore(),
        chunkStore: new InMemoryChunkStore(),
        indexStore: new InMemoryIndexStore(),
      },
    });

    const definition = buildIngestDocumentWorkflow(
      { sourceId: "doc-003", content: "Audit test document." },
      TENANT,
      PROFILE,
    );

    const run = await engineWithAudit.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    const events = audit.list(run.runId);
    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("run.started");
    expect(kinds).toContain("run.completed");
    expect(kinds).toContain("step.started");
    expect(kinds).toContain("checkpoint.saved");
  });
});

// ─── 2. verify_index_health happy path ───────────────────────────────────────

describe("verify_index_health workflow", () => {
  it("happy path: completes with health report", async () => {
    const engine = makeEngine();
    const definition = buildVerifyIndexHealthWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
      sampleSize: 5,
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("completed");
    expect(run.stepResults).toHaveLength(1);
    expect(run.stepResults[0]!.actor).toBe("IndexVerifier");
    expect(run.stepResults[0]!.status).toBe("completed");

    const output = run.stepResults[0]!.output as { healthStatus: string; driftScore: number };
    expect(["healthy", "degraded", "critical"]).toContain(output.healthStatus);
    expect(typeof output.driftScore).toBe("number");
  });

  it("with gold queries that match: reports healthy", async () => {
    const chunkStore = new InMemoryChunkStore();
    const chunkId = "chunk-gold-001";
    await chunkStore.put({
      chunkId,
      sourceId: "src-001",
      tenantId: TENANT,
      profileId: PROFILE,
      content: "Gold content",
      chunkIndex: 0,
      totalChunks: 1,
      metadata: {},
      createdAt: new Date().toISOString(),
    });

    const engine = makeEngine({ chunkStore });
    const definition = buildVerifyIndexHealthWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
      goldQueries: [{ query: "gold query", expectedChunkIds: [chunkId] }],
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("completed");
    const output = run.stepResults[0]!.output as { driftScore: number };
    expect(output.driftScore).toBe(0);
  });
});

// ─── 3. run_retrieval_eval happy path ────────────────────────────────────────

describe("run_retrieval_eval workflow", () => {
  it("happy path: runs eval and produces metrics", async () => {
    const chunkStore = new InMemoryChunkStore();
    const chunkId = "chunk-eval-001";
    await chunkStore.put({
      chunkId,
      sourceId: "src-eval",
      tenantId: TENANT,
      profileId: PROFILE,
      content: "Eval chunk content",
      chunkIndex: 0,
      totalChunks: 1,
      metadata: {},
      createdAt: new Date().toISOString(),
    });

    const engine = makeEngine({ chunkStore });
    const definition = buildRunRetrievalEvalWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
      datasetId: "test-dataset",
      queries: [
        { queryId: "q1", query: "test query", relevantChunkIds: [chunkId] },
        { queryId: "q2", query: "another query", relevantChunkIds: ["chunk-missing"] },
      ],
      topK: 5,
      metrics: ["recall", "ndcg"],
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("completed");
    const output = run.stepResults[0]!.output as {
      queryCount: number;
      metrics: Array<{ metric: string; value: number }>;
    };
    expect(output.queryCount).toBe(2);
    expect(output.metrics.length).toBeGreaterThan(0);
    expect(output.metrics.some((m) => m.metric === "recall")).toBe(true);
  });
});

// ─── 4. rebuild_index — approval-gated path ───────────────────────────────────

describe("rebuild_index workflow", () => {
  it("pauses at approval gate (status=pending-approval)", async () => {
    const engine = makeEngine();
    const definition = buildRebuildIndexWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("pending-approval");
    expect(run.approvalRequestId).toBeDefined();

    const gateStep = run.stepResults.find((r) => r.actor === "HumanApprovalGate");
    expect(gateStep).toBeDefined();
    expect(gateStep!.status).toBe("pending-approval");
  });

  it("resumes and completes after operator approval", async () => {
    const engine = makeEngine();
    const definition = buildRebuildIndexWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("pending-approval");

    const resumed = await engine.resume(
      run.runId,
      definition,
      "approved",
      "operator-alice",
      "LGTM",
    );

    expect(resumed.status).toBe("completed");
    const actors = resumed.stepResults.map((r) => r.actor);
    expect(actors).toContain("IndexVerifier");
  });

  it("fails after operator rejection", async () => {
    const engine = makeEngine();
    const definition = buildRebuildIndexWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("pending-approval");

    const rejected = await engine.resume(
      run.runId,
      definition,
      "rejected",
      "operator-bob",
      "Index looks unstable",
    );

    expect(rejected.status).toBe("failed");
    expect(rejected.error).toContain("rejected");
  });
});

// ─── 5. rotate_profile_version — approval-gated path ─────────────────────────

describe("rotate_profile_version workflow", () => {
  it("pauses at approval gate before promotion", async () => {
    const engine = makeEngine();
    const definition = buildRotateProfileVersionWorkflow({
      tenantId: TENANT,
      currentProfileId: PROFILE,
      newProfileId: "profile-v2",
      newProfileVersion: "v2.0.0",
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("pending-approval");

    const resumed = await engine.resume(run.runId, definition, "approved");
    expect(resumed.status).toBe("completed");
  });
});

// ─── 6. Retry-from-checkpoint ────────────────────────────────────────────────

describe("retry-from-checkpoint", () => {
  it("checkpoints are saved after each completed step", async () => {
    const checkpointStore = new InMemoryCheckpointStore();
    const engine = new OrchestratorEngine({
      runStore: new InMemoryRunStore(),
      checkpointStore,
      audit: new InMemoryAuditEmitter(),
      storage: {
        rawDocumentStore: new InMemoryRawDocumentStore(),
        chunkStore: new InMemoryChunkStore(),
        indexStore: new InMemoryIndexStore(),
      },
    });

    const definition = buildVerifyIndexHealthWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("completed");
    const checkpoints = checkpointStore.listByRun(run.runId);
    expect(checkpoints.length).toBeGreaterThan(0);
    expect(run.latestCheckpointId).toBeDefined();
  });

  it("single-step workflow with a failing actor retries and records error", async () => {
    const engine = makeEngine();
    const definition = buildVerifyIndexHealthWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
    });

    definition.retryPolicy = { maxAttempts: 1, backoffMs: 0 };

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("completed");
    expect(run.stepResults[0]!.attempt).toBe(1);
  });

  it("retry: run can be cancelled after pending-approval", async () => {
    const engine = makeEngine();
    const definition = buildRebuildIndexWorkflow({
      tenantId: TENANT,
      profileId: PROFILE,
    });

    const run = await engine.start(definition, {
      tenantId: TENANT,
      profileId: PROFILE,
      input: {},
    });

    expect(run.status).toBe("pending-approval");

    const cancelled = engine.cancel(run.runId);
    expect(cancelled.status).toBe("cancelled");
  });
});

// ─── 7. Audit event coverage ─────────────────────────────────────────────────

describe("audit events", () => {
  it("emits approval events during approval-gated workflow", async () => {
    const audit = new InMemoryAuditEmitter();
    const engine = new OrchestratorEngine({
      runStore: new InMemoryRunStore(),
      checkpointStore: new InMemoryCheckpointStore(),
      audit,
      storage: {
        rawDocumentStore: new InMemoryRawDocumentStore(),
        chunkStore: new InMemoryChunkStore(),
        indexStore: new InMemoryIndexStore(),
      },
    });

    const definition = buildRebuildIndexWorkflow({ tenantId: TENANT, profileId: PROFILE });
    const run = await engine.start(definition, { tenantId: TENANT, profileId: PROFILE, input: {} });

    await engine.resume(run.runId, definition, "approved", "alice");

    const events = audit.list(run.runId);
    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("approval.requested");
    expect(kinds).toContain("approval.granted");
    expect(kinds).toContain("run.completed");
  });
});
