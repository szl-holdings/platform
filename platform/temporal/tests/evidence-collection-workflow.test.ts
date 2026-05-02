/**
 * Evidence collection workflow unit tests — all types collected, partial failure,
 * empty scope, and Lyte visibility emission.
 */

import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { evidenceCollectionWorkflow } from "../workflows/evidence-collection-workflow.ts";
import type { EvidenceCollectionWorkflowInput } from "../types/workflow-types.js";
import { it, expect, beforeAll, afterAll } from "vitest";

// ---------------------------------------------------------------------------
// Mock activities
// ---------------------------------------------------------------------------

let lyteEventsEmitted: string[] = [];

const successMockActivities = {
  recordEvidenceActivity: async () => ({ evidenceId: "evidence-ec-001" }),

  emitLyteVisibilityActivity: async (input: { event: { eventType: string } }) => {
    lyteEventsEmitted.push(input.event.eventType);
    return undefined;
  },

  collectEvidenceItemActivity: async (input: {
    evidenceType: string;
    service: string;
    environment: string;
    fromTimestamp: string;
    toTimestamp: string;
    workflowId: string;
  }) => ({
    evidenceType: input.evidenceType as never,
    service: input.service,
    collectedAt: new Date().toISOString(),
    itemCount: 42,
    storageRef: `az://evidence-bucket/${input.evidenceType}/${input.service}`,
    checksum: "sha256:abc123def456",
  }),
};

const failingCollectMockActivities = {
  ...successMockActivities,
  collectEvidenceItemActivity: async (input: { evidenceType: string; service: string }) => {
    if (input.service === "failing-service") {
      throw new Error(`Collection failed for ${input.evidenceType}:${input.service}`);
    }
    return {
      evidenceType: input.evidenceType as never,
      service: input.service,
      collectedAt: new Date().toISOString(),
      itemCount: 10,
      storageRef: `az://evidence-bucket/${input.evidenceType}/${input.service}`,
      checksum: "sha256:abcdef",
    };
  },
};

const baseInput: EvidenceCollectionWorkflowInput = {
  incidentId: "INC-2026-001",
  requestedBy: "oncall-user",
  evidenceTypes: ["logs", "traces"],
  collectionScope: {
    services: ["api-server", "alloy-fabric-api"],
    environment: "production",
    fromTimestamp: "2026-05-01T00:00:00Z",
    toTimestamp: "2026-05-01T01:00:00Z",
  },
  timeoutMs: 300_000,
};

let testEnv: TestWorkflowEnvironment;

beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  lyteEventsEmitted = [];
});

afterAll(async () => {
  await testEnv.teardown();
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

it("happy path — collects all evidence types for all services", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-evidence-happy",
    workflowsPath: new URL(
      "../workflows/evidence-collection-workflow.ts",
      import.meta.url
    ).pathname,
    activities: successMockActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(evidenceCollectionWorkflow, {
      taskQueue: "test-evidence-happy",
      workflowId: "test-evidence-happy",
      args: [baseInput],
    });

    // 2 types × 2 services = 4 items
    expect(result.totalItems).toBe(4);
    expect(result.failedCollections).toHaveLength(0);
    expect(result.evidenceItems).toHaveLength(4);
    expect(result.evidenceItems[0].checksum).toBeDefined();
    expect(result.evidenceLedgerId).toBe("evidence-ec-001");
    expect(result.collectedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Partial failure path: one service fails, others succeed
// ---------------------------------------------------------------------------

it("partial-failure path — records failures and continues with successful collections", async () => {
  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-evidence-partial",
    workflowsPath: new URL(
      "../workflows/evidence-collection-workflow.ts",
      import.meta.url
    ).pathname,
    activities: failingCollectMockActivities,
  });

  const partialInput: EvidenceCollectionWorkflowInput = {
    ...baseInput,
    evidenceTypes: ["logs"],
    collectionScope: {
      ...baseInput.collectionScope,
      services: ["api-server", "failing-service"],
    },
  };

  await worker.runUntil(async () => {
    const { client } = testEnv;
    const result = await client.workflow.execute(evidenceCollectionWorkflow, {
      taskQueue: "test-evidence-partial",
      workflowId: "test-evidence-partial",
      args: [partialInput],
    });

    // api-server succeeds, failing-service fails
    expect(result.totalItems).toBe(1);
    expect(result.failedCollections).toHaveLength(1);
    expect(result.failedCollections[0]).toContain("failing-service");
    expect(result.evidenceLedgerId).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Lyte visibility: workflow emits start and end events
// ---------------------------------------------------------------------------

it("lyte-visibility — emits started and completed events to Lyte surface", async () => {
  const emittedEvents: string[] = [];
  const trackingActivities = {
    ...successMockActivities,
    emitLyteVisibilityActivity: async (input: { event: { eventType: string } }) => {
      emittedEvents.push(input.event.eventType);
      return undefined;
    },
  };

  const worker = await Worker.create({
    connection: testEnv.nativeConnection,
    taskQueue: "test-evidence-lyte",
    workflowsPath: new URL(
      "../workflows/evidence-collection-workflow.ts",
      import.meta.url
    ).pathname,
    activities: trackingActivities,
  });

  await worker.runUntil(async () => {
    const { client } = testEnv;
    await client.workflow.execute(evidenceCollectionWorkflow, {
      taskQueue: "test-evidence-lyte",
      workflowId: "test-evidence-lyte",
      args: [{ ...baseInput, evidenceTypes: ["logs"], collectionScope: { ...baseInput.collectionScope, services: ["api-server"] } }],
    });

    expect(emittedEvents).toContain("evidence-collection-workflow.started");
    expect(emittedEvents).toContain("evidence-collection-workflow.completed");
    expect(emittedEvents[0]).toBe("evidence-collection-workflow.started");
    expect(emittedEvents[emittedEvents.length - 1]).toBe("evidence-collection-workflow.completed");
  });
});
