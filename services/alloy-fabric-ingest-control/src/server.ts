import { randomUUID } from 'node:crypto';
import {
  EvalRunRequestSchema,
  IndexRebuildRequestSchema,
  IndexVerifyRequestSchema,
  IngestRequestSchema,
} from '@workspace/aef-contracts';
import { type AuditEmitter, type WorkflowContext, createWorkflowMachine, FileApprovalStore, FileCheckpointStore } from '@workspace/aef-workflow-runtime';
import express from 'express';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '20mb' }));

const DATA_DIR = process.env.AEF_DATA_DIR ?? '/tmp/aef-ingest-control';
const checkpointStore = new FileCheckpointStore(`${DATA_DIR}/checkpoints.json`);
const approvalStore = new FileApprovalStore(`${DATA_DIR}/approvals.json`);

const BEARER = process.env.AEF_S2S_SECRET;
if (!BEARER) {
  throw new Error('AEF_S2S_SECRET env var is required — refusing to start without an auth secret');
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (token !== BEARER) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

function makeStepLogger(workflowId: string): AuditEmitter {
  return (event) => {
    process.stdout.write(
      `${JSON.stringify({
        level: 'info',
        ts: new Date().toISOString(),
        service: 'alloy-fabric-ingest-control',
        msg: 'workflow_step',
        workflowId,
        stepId: event.stepId,
        outcome: event.outcome,
      })}\n`,
    );
  };
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'alloy-fabric-ingest-control',
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Standard Kubernetes probe aliases
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', (_req, res) => {
  res.status(200).json({ ready: true });
});

app.post('/control/ingest', authMiddleware, async (req, res) => {
  const parsed = IngestRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
    return;
  }

  const { requestId, tenantId, documents } = parsed.data;
  const results: Array<{ workflowId: string; sourceId: string; status: string }> = [];

  for (const doc of documents) {
    const workflowId = `ingest-${randomUUID()}`;
    const ctx: WorkflowContext = {
      workflowId,
      tenantId: String(tenantId),
      requestedBy: requestId,
      input: {
        sourceId: doc.sourceId,
        content: doc.content,
        contentType: doc.contentType,
        chunkSize: parsed.data.chunkSize,
        chunkOverlap: parsed.data.chunkOverlap,
        metadata: doc.metadata,
      },
      approvalRequired: false,
    };

    const machine = createWorkflowMachine('ingest_document');
    const result = await machine.run(ctx, {
      checkpointStore,
      approvalStore,
      auditEmitter: makeStepLogger(workflowId),
    });
    results.push({ workflowId, sourceId: doc.sourceId, status: result.status });
  }

  res.status(202).json({ requestId, tenantId, results });
});

app.post('/control/rebuild', authMiddleware, async (req, res) => {
  const parsed = IndexRebuildRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
    return;
  }

  const { requestId, tenantId, fullRebuild, sourceIds } = parsed.data;
  const workflowId = `rebuild-${randomUUID()}`;

  const ctx: WorkflowContext = {
    workflowId,
    tenantId: String(tenantId),
    requestedBy: requestId,
    input: { fullRebuild, ...(sourceIds ? { sourceIds } : {}) },
    approvalRequired: fullRebuild,
  };

  const machine = createWorkflowMachine('rebuild_index');
  const result = await machine.run(ctx, {
    checkpointStore,
    approvalStore,
    auditEmitter: makeStepLogger(workflowId),
  });

  res.status(result.status === 'waiting_approval' ? 202 : 200).json({
    requestId,
    tenantId,
    workflowId,
    status: result.status,
    approvalRequestId: result.approvalRequestId ?? null,
  });
});

app.post('/control/verify', authMiddleware, async (req, res) => {
  const parsed = IndexVerifyRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
    return;
  }

  const { requestId, tenantId, sourceIds } = parsed.data;
  const workflowId = `verify-${randomUUID()}`;

  const ctx: WorkflowContext = {
    workflowId,
    tenantId: String(tenantId),
    requestedBy: requestId,
    input: { sourceIds },
    approvalRequired: false,
  };

  const machine = createWorkflowMachine('verify_index_health');
  const result = await machine.run(ctx, {
    checkpointStore,
    approvalStore,
    auditEmitter: makeStepLogger(workflowId),
  });
  res.json({
    requestId,
    tenantId,
    workflowId,
    status: result.status,
    steps: result.completedSteps.length,
  });
});

app.post('/control/eval', authMiddleware, async (req, res) => {
  const parsed = EvalRunRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
    return;
  }

  const { requestId, tenantId, profileId, datasetId } = parsed.data;
  const workflowId = `eval-${randomUUID()}`;

  const ctx: WorkflowContext = {
    workflowId,
    tenantId: String(tenantId),
    requestedBy: requestId,
    input: { profileId, datasetId },
    approvalRequired: false,
  };

  const machine = createWorkflowMachine('run_retrieval_eval');
  const result = await machine.run(ctx, {
    checkpointStore,
    approvalStore,
    auditEmitter: makeStepLogger(workflowId),
  });
  res.json({ requestId, tenantId, workflowId, status: result.status });
});

app.post('/control/rotate-profile', authMiddleware, async (req, res) => {
  const { requestId, tenantId, profileId, targetVersion } = req.body as {
    requestId?: string;
    tenantId: string;
    profileId: string;
    targetVersion?: string;
  };

  if (!tenantId || !profileId) {
    res
      .status(400)
      .json({ error: 'validation_error', message: 'tenantId and profileId are required' });
    return;
  }

  const reqId = requestId ?? randomUUID();
  const workflowId = `rotate-${randomUUID()}`;

  const ctx: WorkflowContext = {
    workflowId,
    tenantId,
    requestedBy: reqId,
    input: { profileId, ...(targetVersion ? { targetVersion } : {}) },
    approvalRequired: true,
  };

  const machine = createWorkflowMachine('rotate_profile_version');
  const result = await machine.run(ctx, {
    checkpointStore,
    approvalStore,
    auditEmitter: makeStepLogger(workflowId),
  });

  res.status(result.status === 'waiting_approval' ? 202 : 200).json({
    requestId: reqId,
    tenantId,
    workflowId,
    profileId,
    status: result.status,
    approvalRequestId: result.approvalRequestId ?? null,
  });
});

app.post('/control/workflows/:workflowId/resume', authMiddleware, async (req, res) => {
  const { workflowId } = req.params as { workflowId: string };
  const { requestId, tenantId, input } = req.body as {
    requestId?: string;
    tenantId: string;
    input?: Record<string, unknown>;
  };

  if (!tenantId) {
    res.status(400).json({ error: 'validation_error', message: 'tenantId is required' });
    return;
  }

  const checkpoint = checkpointStore.load(workflowId);
  if (!checkpoint) {
    res.status(404).json({ error: 'workflow_not_found', workflowId });
    return;
  }

  if (checkpoint.status !== 'waiting_approval') {
    res.status(409).json({ error: 'workflow_not_paused', workflowId, status: checkpoint.status });
    return;
  }

  const reqId = requestId ?? randomUUID();
  const resumeCtx: WorkflowContext = {
    workflowId,
    tenantId,
    requestedBy: reqId,
    input: input ?? {},
    approvalRequired: false,
  };

  const machine = createWorkflowMachine(
    checkpoint.kind as Parameters<typeof createWorkflowMachine>[0],
  );
  const result = await machine.run(resumeCtx, {
    checkpointStore,
    approvalStore,
    auditEmitter: makeStepLogger(workflowId),
  });

  res.json({
    requestId: reqId,
    workflowId,
    status: result.status,
    completedSteps: result.completedSteps.length,
    resumedAt: new Date().toISOString(),
  });
});

app.post('/control/approvals/:approvalId/resolve', authMiddleware, (req, res) => {
  const { approvalId } = req.params as { approvalId: string };
  const { decision, resolvedBy, comment } = req.body as {
    decision: 'approved' | 'rejected';
    resolvedBy: string;
    comment?: string;
  };

  try {
    approvalStore.resolve(approvalId, decision, resolvedBy, comment);
    res.json({ approvalId, decision, resolvedAt: new Date().toISOString() });
  } catch {
    res.status(404).json({ error: 'approval_not_found', approvalId });
  }
});

app.get('/control/approvals/:workflowId', authMiddleware, (req, res) => {
  const { workflowId } = req.params as { workflowId: string };
  const pending = approvalStore.list(workflowId);
  res.json({ workflowId, approvals: pending });
});

const PORT = Number(process.env.AEF_INGEST_CONTROL_PORT ?? process.env.PORT ?? 4201);

app.listen(PORT, '0.0.0.0', () => {
});

export default app;
