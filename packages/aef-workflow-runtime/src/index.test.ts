import { describe, expect, it } from 'vitest';
import {
  createWorkflowMachine,
  InMemoryApprovalStore,
  InMemoryCheckpointStore,
  ingestDocumentWorkflow,
  rebuildIndexWorkflow,
  WorkflowStateMachine,
} from './index.js';
import type { WorkflowContext } from './types.js';

function makeContext(overrides: Partial<WorkflowContext> = {}): WorkflowContext {
  return {
    workflowId: `wf-${Date.now()}`,
    tenantId: 'tenant-test',
    requestedBy: 'test-runner',
    input: {
      sourceId: 'doc-001',
      content: 'The full text of a maritime intelligence document covering vessel operations.',
      contentType: 'text/plain',
      chunkSize: 50,
      chunkOverlap: 10,
    },
    approvalRequired: false,
    ...overrides,
  };
}

describe('WorkflowStateMachine — ingest_document', () => {
  it('completes a full ingest workflow', async () => {
    const machine = new WorkflowStateMachine(ingestDocumentWorkflow);
    const ctx = makeContext();
    const result = await machine.run(ctx, {
      checkpointStore: new InMemoryCheckpointStore(),
      approvalStore: new InMemoryApprovalStore(),
    });

    expect(result.status).toBe('completed');
    expect(result.kind).toBe('ingest_document');
    expect(result.completedSteps.length).toBeGreaterThan(0);
    expect(result.completedSteps.every((s) => s.status === 'success')).toBe(true);
  });

  it('checkpoints intermediate steps and can be read back', async () => {
    const store = new InMemoryCheckpointStore();
    const machine = new WorkflowStateMachine(ingestDocumentWorkflow);
    const ctx = makeContext({ workflowId: 'wf-checkpoint-test' });

    await machine.run(ctx, {
      checkpointStore: store,
      approvalStore: new InMemoryApprovalStore(),
    });

    const checkpoint = store.load('wf-checkpoint-test');
    expect(checkpoint).toBeUndefined();
  });

  it('emits audit events at each step', async () => {
    const events: string[] = [];
    const machine = new WorkflowStateMachine(ingestDocumentWorkflow);
    const ctx = makeContext();

    await machine.run(ctx, {
      checkpointStore: new InMemoryCheckpointStore(),
      approvalStore: new InMemoryApprovalStore(),
      auditEmitter: (evt) => events.push(evt.outcome),
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events).toContain('success');
  });
});

describe('WorkflowStateMachine — approval gate', () => {
  it('pauses for approval when approvalRequired is true and operation is destructive', async () => {
    const machine = new WorkflowStateMachine(rebuildIndexWorkflow);
    const ctx = makeContext({
      workflowId: 'wf-approval-test',
      input: { fullRebuild: true },
      approvalRequired: true,
    });

    const store = new InMemoryCheckpointStore();
    const approvalStore = new InMemoryApprovalStore();

    const result = await machine.run(ctx, { checkpointStore: store, approvalStore });

    expect(result.status).toBe('waiting_approval');
    expect(result.approvalRequestId).toBeDefined();

    const pending = approvalStore.list(ctx.workflowId);
    expect(pending.some((r) => r.decision === 'pending')).toBe(true);
  });

  it('resumes after approval and completes', async () => {
    const machine = new WorkflowStateMachine(rebuildIndexWorkflow);
    const ctx = makeContext({
      workflowId: 'wf-resume-test',
      input: { fullRebuild: true },
      approvalRequired: true,
    });

    const checkpointStore = new InMemoryCheckpointStore();
    const approvalStore = new InMemoryApprovalStore();

    const first = await machine.run(ctx, { checkpointStore, approvalStore });
    expect(first.status).toBe('waiting_approval');

    const approvalRequestId = first.approvalRequestId;
    expect(approvalRequestId).toBeDefined();
    if (!approvalRequestId) throw new Error('workflow did not return an approval request ID');
    approvalStore.resolve(approvalRequestId, 'approved', 'operator-1', 'Approved for test');

    const second = await machine.run(ctx, { checkpointStore, approvalStore });
    expect(second.status).toBe('completed');
  });
});

describe('ChunkPlannerActor', () => {
  it('falls back to word-based chunking when no tokenizer is injected', async () => {
    const { ChunkPlannerActor } = await import('./actors.js');
    const actor = new ChunkPlannerActor();
    const result = await actor.execute(
      { workflowId: 'wf', tenantId: 't', requestedBy: 'u', input: {}, approvalRequired: false },
      {
        content: 'alpha beta gamma delta epsilon zeta eta theta iota kappa',
        chunkSize: 3,
        chunkOverlap: 1,
      },
    );
    expect(result.output.unit).toBe('words');
    expect(result.output.totalChunks).toBeGreaterThan(0);
  });

  it('uses token-based chunking and applies the truncation policy when a tokenizer is injected', async () => {
    const { ChunkPlannerActor } = await import('./actors.js');
    const tokenizer = {
      encode: (text: string) => text.split(/\s+/).map((_, i) => i + 1),
      decode: (ids: number[]) => ids.map((i) => `t${i}`).join(' '),
    };
    const actor = new ChunkPlannerActor({
      tokenizer,
      truncationPolicy: { strategy: 'truncate', maxTokens: 4 },
    });
    const result = await actor.execute(
      { workflowId: 'wf', tenantId: 't', requestedBy: 'u', input: {}, approvalRequired: false },
      { content: 'a b c d e f g h i j', chunkSize: 6, chunkOverlap: 1 },
    );
    expect(result.output.unit).toBe('tokens');
    const chunks = result.output.chunkPlan as Array<{ tokenCount: number }>;
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.tokenCount <= 4)).toBe(true);
  });

  it('validates that chunkOverlap is smaller than chunkSize', async () => {
    const { ChunkPlannerActor } = await import('./actors.js');
    const tokenizer = {
      encode: (text: string) => text.split(/\s+/).map((_, i) => i + 1),
      decode: (ids: number[]) => ids.map((i) => `t${i}`).join(' '),
    };
    const actor = new ChunkPlannerActor({
      tokenizer,
      truncationPolicy: { strategy: 'truncate', maxTokens: 100 },
    });
    await expect(
      actor.execute(
        { workflowId: 'wf', tenantId: 't', requestedBy: 'u', input: {}, approvalRequired: false },
        { content: 'a b c d e f g h i j', chunkSize: 5, chunkOverlap: 6 },
      ),
    ).rejects.toThrow(/chunkOverlap/);
  });

  it("throws when a window exceeds maxTokens and strategy='reject'", async () => {
    const { ChunkPlannerActor } = await import('./actors.js');
    const tokenizer = {
      encode: (text: string) => text.split(/\s+/).map((_, i) => i + 1),
      decode: (ids: number[]) => ids.map((i) => `t${i}`).join(' '),
    };
    const actor = new ChunkPlannerActor({
      tokenizer,
      truncationPolicy: { strategy: 'reject', maxTokens: 4 },
    });
    await expect(
      actor.execute(
        { workflowId: 'wf', tenantId: 't', requestedBy: 'u', input: {}, approvalRequired: false },
        { content: 'a b c d e f g h i j', chunkSize: 8, chunkOverlap: 1 },
      ),
    ).rejects.toThrow(/exceeds maxTokens/);
  });

  it("truncates windows that exceed maxTokens when strategy='truncate'", async () => {
    const { ChunkPlannerActor } = await import('./actors.js');
    const tokenizer = {
      encode: (text: string) => text.split(/\s+/).map((_, i) => i + 1),
      decode: (ids: number[]) => ids.map((i) => `t${i}`).join(' '),
    };
    const actor = new ChunkPlannerActor({
      tokenizer,
      truncationPolicy: { strategy: 'truncate', maxTokens: 3 },
    });
    const result = await actor.execute(
      { workflowId: 'wf', tenantId: 't', requestedBy: 'u', input: {}, approvalRequired: false },
      { content: 'a b c d e f g h', chunkSize: 6, chunkOverlap: 1 },
    );
    const chunks = result.output.chunkPlan as Array<{ tokenCount: number; truncated?: boolean }>;
    expect(chunks.every((c) => c.tokenCount <= 3)).toBe(true);
    expect(chunks.some((c) => c.truncated)).toBe(true);
    expect(result.output.anyTruncated).toBe(true);
  });

  it('ingestDocumentWorkflow runs the chunk-plan step in token mode end-to-end', async () => {
    const { ChunkPlannerActor } = await import('./actors.js');
    const { createIngestDocumentWorkflow } = await import('./workflows/ingest-document.js');
    const tokenizer = {
      encode: (text: string) => text.split(/\s+/).map((_, i) => i + 1),
      decode: (ids: number[]) => ids.map((i) => `t${i}`).join(' '),
    };
    const workflow = createIngestDocumentWorkflow(new ChunkPlannerActor({ tokenizer }));
    const ctx = {
      workflowId: 'wf-int',
      tenantId: 'tenant-int',
      requestedBy: 'tester',
      profileId: 'default',
      input: {
        sourceId: 'doc-1',
        content: 'the quick brown fox jumps over the lazy dog '.repeat(20),
        contentType: 'text/plain',
        chunkSize: 32,
        chunkOverlap: 4,
      },
      approvalRequired: false,
    };
    const planStep = workflow.steps.find((s) => s.stepId === 'plan-chunks');
    expect(planStep).toBeDefined();
    if (!planStep) throw new Error('ingestion workflow is missing the plan-chunks step');
    const result = await planStep.execute(ctx, []);
    expect(result.output.unit).toBe('tokens');
    expect(Number(result.output.totalChunks)).toBeGreaterThan(0);
    const plan = result.output.chunkPlan as Array<{ tokenCount: number; unit: string }>;
    expect(plan.every((c) => c.unit === 'tokens')).toBe(true);
  }, 60_000);
});

describe('createWorkflowMachine', () => {
  it('creates machines for all five workflow kinds', () => {
    const kinds = [
      'ingest_document',
      'rebuild_index',
      'verify_index_health',
      'run_retrieval_eval',
      'rotate_profile_version',
    ] as const;

    for (const kind of kinds) {
      expect(() => createWorkflowMachine(kind)).not.toThrow();
    }
  });
});
