/**
 * Ingestion sync workflow unit tests — single batch, multi-batch, fetch failure,
 * and Lyte visibility emission.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { ingestionSyncWorkflow } from "../workflows/ingestion-sync-workflow.ts";
import type { IngestionSyncWorkflowInput } from "../types/workflow-types.js";
import { it, expect, beforeAll, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Mock activities
// ---------------------------------------------------------------------------

const singleBatchMockActivities = {
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-ing-001" }),
  emitLyteVisibilityActivity: async () => undefined,
  fetchIngestBatchActivity: async () => ({
    recordsIngested: 50,
    recordsFailed: 0,
    continuationToken: null,
    hasMore: false,
  }),
};

let batchCallCount = 0;
const multiBatchMockActivities = {
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-ing-multi" }),
  emitLyteVisibilityActivity: async () => undefined,
  fetchIngestBatchActivity: async () => {
    batchCallCount++;
    if (batchCallCount < 3) {
      return {
        recordsIngested: 100,
        recordsFailed: 0,
        continuationToken: `token-${batchCallCount}`,
        hasMore: true,
      };
    }
    return {
      recordsIngested: 25,
      recordsFailed: 5,
      continuationToken: null,
      hasMore: false,
    };
  },
};

const failingBatchMockActivities = {
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-ing-fail" }),
  emitLyteVisibilityActivity: async () => undefined,
  fetchIngestBatchActivity: async () => {
    throw new Error("Batch fetch failed: connector unavailable");
  },
};

const baseInput: IngestionSyncWorkflowInput = {
  connectorId: "alloy-connector-001",
  sourceType: "azure-blob",
  targetDomain: "financial-transactions",
  batchSize: 100,
  continuationToken: null,
  tenantId: "tenant-szl-001",
  maxRecordsPerRun: 10_000,
  retryPolicy: {
    maxAttempts: 3,
    initialIntervalMs: 1_000,
    backoffCoefficient: 2,
    maxIntervalMs: 30_000,
  },
};

let testEnv: TestWorkflowEnvironment;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  batchCallCount = 0;
});

afterAll(async () => {
  await testEnv.teardown();
});

// ---------------------------------------------------------------------------
// Happy path: single batch, hasMore=false
// ---------------------------------------------------------------------------

it("happy path — ingests a single batch and completes when hasMore=false", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-ingestion-happy",
    workflowsPath: new URL(
      "../workflows/ingestion-sync-workflow.ts",
      import.meta.url
    ).pathname,
    activities: singleBatchMockActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(ingestionSyncWorkflow, {
      taskQueue: "test-ingestion-happy",
      workflowId: "test-ingestion-happy",
      args: [baseInput],
    });

    expect(result.connectorId).toBe("alloy-connector-001");
    expect(result.recordsIngested).toBe(50);
    expect(result.recordsFailed).toBe(0);
    expect(result.hasMore).toBe(false);
    expect(result.continuationToken).toBeNull();
    expect(result.completedAt).toBeDefined();
    expect(result.nextScheduledAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Multi-batch path: hasMore=true for first 2 batches, false on 3rd
// ---------------------------------------------------------------------------

it("multi-batch path — iterates batches until hasMore=false and accumulates totals", async () => {
  batchCallCount = 0;

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-ingestion-multi",
    workflowsPath: new URL(
      "../workflows/ingestion-sync-workflow.ts",
      import.meta.url
    ).pathname,
    activities: multiBatchMockActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(ingestionSyncWorkflow, {
      taskQueue: "test-ingestion-multi",
      workflowId: "test-ingestion-multi",
      args: [{ ...baseInput, maxRecordsPerRun: 10_000 }],
    });

    // 2 batches × 100 + 1 batch × 25 = 225 ingested, 5 failed
    expect(result.recordsIngested).toBe(225);
    expect(result.recordsFailed).toBe(5);
    expect(result.hasMore).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Failure path: fetchIngestBatchActivity throws
// ---------------------------------------------------------------------------

it("failure path — records evidence and re-throws when batch fetch fails", async () => {
  const evidenceRecorded: string[] = [];
  const failActivitiesWithTracking = {
    ...failingBatchMockActivities,
    recordEvidenceActivity: async (input: { action: string }) => {
      evidenceRecorded.push(input.action);
      return { evidenceId: "evidence-ing-fail-tracked" };
    },
  };

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-ingestion-fail",
    workflowsPath: new URL(
      "../workflows/ingestion-sync-workflow.ts",
      import.meta.url
    ).pathname,
    activities: failActivitiesWithTracking,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;

    await expect(
      client.workflow.execute(ingestionSyncWorkflow, {
        taskQueue: "test-ingestion-fail",
        workflowId: "test-ingestion-fail",
        args: [baseInput],
      })
    ).rejects.toThrow();

    // Failure evidence must be recorded before re-throwing
    expect(evidenceRecorded).toContain("ingestion-batch-failed");
  });
});
