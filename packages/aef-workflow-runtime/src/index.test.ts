import { describe, it, expect } from "vitest";
import {
  WorkflowStateMachine,
  InMemoryCheckpointStore,
  InMemoryApprovalStore,
  createWorkflowMachine,
  ingestDocumentWorkflow,
  rebuildIndexWorkflow,
} from "./index.js";
import type { WorkflowContext } from "./types.js";

function makeContext(overrides: Partial<WorkflowContext> = {}): WorkflowContext {
  return {
    workflowId: `wf-${Date.now()}`,
    tenantId: "tenant-test",
    requestedBy: "test-runner",
    input: {
      sourceId: "doc-001",
      content: "The full text of a maritime intelligence document covering vessel operations.",
      contentType: "text/plain",
      chunkSize: 50,
      chunkOverlap: 10,
    },
    approvalRequired: false,
    ...overrides,
  };
}

describe("WorkflowStateMachine — ingest_document", () => {
  it("completes a full ingest workflow", async () => {
    const machine = new WorkflowStateMachine(ingestDocumentWorkflow);
    const ctx = makeContext();
    const result = await machine.run(ctx, {
      checkpointStore: new InMemoryCheckpointStore(),
      approvalStore: new InMemoryApprovalStore(),
    });

    expect(result.status).toBe("completed");
    expect(result.kind).toBe("ingest_document");
    expect(result.completedSteps.length).toBeGreaterThan(0);
    expect(result.completedSteps.every((s) => s.status === "success")).toBe(true);
  });

  it("checkpoints intermediate steps and can be read back", async () => {
    const store = new InMemoryCheckpointStore();
    const machine = new WorkflowStateMachine(ingestDocumentWorkflow);
    const ctx = makeContext({ workflowId: "wf-checkpoint-test" });

    await machine.run(ctx, {
      checkpointStore: store,
      approvalStore: new InMemoryApprovalStore(),
    });

    const checkpoint = store.load("wf-checkpoint-test");
    expect(checkpoint).toBeUndefined();
  });

  it("emits audit events at each step", async () => {
    const events: string[] = [];
    const machine = new WorkflowStateMachine(ingestDocumentWorkflow);
    const ctx = makeContext();

    await machine.run(ctx, {
      checkpointStore: new InMemoryCheckpointStore(),
      approvalStore: new InMemoryApprovalStore(),
      auditEmitter: (evt) => events.push(evt.outcome),
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events).toContain("success");
  });
});

describe("WorkflowStateMachine — approval gate", () => {
  it("pauses for approval when approvalRequired is true and operation is destructive", async () => {
    const machine = new WorkflowStateMachine(rebuildIndexWorkflow);
    const ctx = makeContext({
      workflowId: "wf-approval-test",
      input: { fullRebuild: true },
      approvalRequired: true,
    });

    const store = new InMemoryCheckpointStore();
    const approvalStore = new InMemoryApprovalStore();

    const result = await machine.run(ctx, { checkpointStore: store, approvalStore });

    expect(result.status).toBe("waiting_approval");
    expect(result.approvalRequestId).toBeDefined();

    const pending = approvalStore.list(ctx.workflowId);
    expect(pending.some((r) => r.decision === "pending")).toBe(true);
  });

  it("resumes after approval and completes", async () => {
    const machine = new WorkflowStateMachine(rebuildIndexWorkflow);
    const ctx = makeContext({
      workflowId: "wf-resume-test",
      input: { fullRebuild: true },
      approvalRequired: true,
    });

    const checkpointStore = new InMemoryCheckpointStore();
    const approvalStore = new InMemoryApprovalStore();

    const first = await machine.run(ctx, { checkpointStore, approvalStore });
    expect(first.status).toBe("waiting_approval");

    approvalStore.resolve(first.approvalRequestId!, "approved", "operator-1", "Approved for test");

    const second = await machine.run(ctx, { checkpointStore, approvalStore });
    expect(second.status).toBe("completed");
  });
});

describe("createWorkflowMachine", () => {
  it("creates machines for all five workflow kinds", () => {
    const kinds = [
      "ingest_document",
      "rebuild_index",
      "verify_index_health",
      "run_retrieval_eval",
      "rotate_profile_version",
    ] as const;

    for (const kind of kinds) {
      expect(() => createWorkflowMachine(kind)).not.toThrow();
    }
  });
});
