import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  EvalRunRequestSchema,
  IndexRebuildRequestSchema,
  IndexVerifyRequestSchema,
  IngestRequestSchema,
  isProductionRuntime,
} from '@workspace/aef-contracts';
import {
  type AuditEmitter,
  createWorkflowMachine,
  FileApprovalStore,
  FileCheckpointStore,
  type WorkflowContext,
} from '@workspace/aef-workflow-runtime';
import express from 'express';

const app: express.Express = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '20mb' }));

const DATA_DIR = process.env.AEF_DATA_DIR ?? '/tmp/aef-ingest-control';
const checkpointStore = new FileCheckpointStore(`${DATA_DIR}/checkpoints.json`);
const approvalStore = new FileApprovalStore(`${DATA_DIR}/approvals.json`);
const IS_PRODUCTION = isProductionRuntime(process.env, ['AEF_ENV', 'AEF_INGEST_CONTROL_ENV']);

const BEARER = process.env.AEF_S2S_SECRET?.trim() ?? '';
if (!BEARER) {
  throw new Error('AEF_S2S_SECRET env var is required — refusing to start without an auth secret');
}
const CREDENTIAL_TENANT_ID = process.env.AEF_S2S_TENANT_ID?.trim();
if (IS_PRODUCTION && !CREDENTIAL_TENANT_ID) {
  throw new Error(
    'AEF_S2S_TENANT_ID is required in production — refusing to start without a credential tenant binding',
  );
}

type TenantBoundRequest = express.Request & { credentialTenantId?: string };

function secretsEqual(candidate: string, expected: string): boolean {
  const candidateDigest = createHash('sha256').update(candidate).digest();
  const expectedDigest = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers.authorization;
  const match = typeof header === 'string' ? /^Bearer\s+(\S+)$/i.exec(header) : null;
  const token = match?.[1];
  if (!token || !secretsEqual(token, BEARER)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  (req as TenantBoundRequest).credentialTenantId = CREDENTIAL_TENANT_ID;
  next();
}

function tenantBodyMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const credentialTenant = (req as TenantBoundRequest).credentialTenantId;
  const rawTenant =
    req.body && typeof req.body === 'object'
      ? (req.body as Record<string, unknown>).tenantId
      : undefined;
  const requestedTenant = typeof rawTenant === 'string' ? rawTenant.trim() : undefined;
  if (typeof rawTenant === 'string' && rawTenant.trim().length === 0) {
    res.status(400).json({ error: 'invalid_tenant_id' });
    return;
  }
  if (credentialTenant && requestedTenant && requestedTenant !== credentialTenant) {
    res.status(403).json({ error: 'credential_tenant_mismatch' });
    return;
  }
  if (requestedTenant) {
    (req.body as Record<string, unknown>).tenantId = requestedTenant;
  }
  next();
}

function checkpointTenantId(checkpoint: unknown): string | undefined {
  if (!checkpoint || typeof checkpoint !== 'object') return undefined;
  const tenantId = (checkpoint as { tenantId?: unknown }).tenantId;
  return typeof tenantId === 'string' && tenantId.length > 0 ? tenantId : undefined;
}

function workflowOwnerMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const credentialTenant = (req as TenantBoundRequest).credentialTenantId;
  const workflowIdParam = req.params.workflowId;
  const workflowId = typeof workflowIdParam === 'string' ? workflowIdParam : undefined;
  if (!credentialTenant || !workflowId) {
    next();
    return;
  }
  const checkpoint = checkpointStore.load(workflowId);
  if (!checkpoint || checkpointTenantId(checkpoint) !== credentialTenant) {
    res.status(404).json({ error: 'workflow_not_found', workflowId });
    return;
  }
  next();
}

function approvalOwnerMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const credentialTenant = (req as TenantBoundRequest).credentialTenantId;
  const approvalIdParam = req.params.approvalId;
  const approvalId = typeof approvalIdParam === 'string' ? approvalIdParam : undefined;
  if (!credentialTenant || !approvalId) {
    next();
    return;
  }
  const approval = approvalStore.get(approvalId);
  const checkpoint = approval ? checkpointStore.load(approval.workflowId) : undefined;
  if (!approval || !checkpoint || checkpointTenantId(checkpoint) !== credentialTenant) {
    res.status(404).json({ error: 'approval_not_found', approvalId });
    return;
  }
  next();
}

const PRODUCTION_HOLDS = [
  'Checkpoint and approval state use a single-process JSON file store without durable transactional guarantees.',
  'No qualified evidence ledger is wired to prove workflow side effects.',
  'No tenant-scoped durable workflow backend is available.',
] as const;

function productionUnavailablePayload(): Record<string, unknown> {
  return {
    ready: false,
    status: 'HOLD',
    code: 'INGEST_CONTROL_PRODUCTION_UNAVAILABLE',
    evidenceState: 'UNAVAILABLE',
    holds: [...PRODUCTION_HOLDS],
  };
}

function productionHoldMiddleware(
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!IS_PRODUCTION) {
    next();
    return;
  }
  res.setHeader('Retry-After', '60');
  res.status(503).json(productionUnavailablePayload());
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
    status: 'alive',
    service: 'alloy-fabric-ingest-control',
    productionReady: !IS_PRODUCTION,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Standard Kubernetes probe aliases
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'alive', productionReady: !IS_PRODUCTION });
});

app.get('/readyz', (_req, res) => {
  if (IS_PRODUCTION) {
    res.setHeader('Retry-After', '60');
    res.status(503).json(productionUnavailablePayload());
    return;
  }
  res.status(200).json({ ready: true, status: 'development-only' });
});

app.post(
  '/control/ingest',
  authMiddleware,
  tenantBodyMiddleware,
  productionHoldMiddleware,
  async (req, res) => {
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
  },
);

app.post(
  '/control/rebuild',
  authMiddleware,
  tenantBodyMiddleware,
  productionHoldMiddleware,
  async (req, res) => {
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
  },
);

app.post(
  '/control/verify',
  authMiddleware,
  tenantBodyMiddleware,
  productionHoldMiddleware,
  async (req, res) => {
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
  },
);

app.post(
  '/control/eval',
  authMiddleware,
  tenantBodyMiddleware,
  productionHoldMiddleware,
  async (req, res) => {
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
  },
);

app.post(
  '/control/rotate-profile',
  authMiddleware,
  tenantBodyMiddleware,
  productionHoldMiddleware,
  async (req, res) => {
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
  },
);

app.post(
  '/control/workflows/:workflowId/resume',
  authMiddleware,
  tenantBodyMiddleware,
  workflowOwnerMiddleware,
  productionHoldMiddleware,
  async (req, res) => {
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
      tenantId: checkpointTenantId(checkpoint) ?? tenantId,
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
  },
);

app.post(
  '/control/approvals/:approvalId/resolve',
  authMiddleware,
  approvalOwnerMiddleware,
  productionHoldMiddleware,
  (req, res) => {
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
  },
);

app.get(
  '/control/approvals/:workflowId',
  authMiddleware,
  workflowOwnerMiddleware,
  productionHoldMiddleware,
  (req, res) => {
    const { workflowId } = req.params as { workflowId: string };
    const pending = approvalStore.list(workflowId);
    res.json({ workflowId, approvals: pending });
  },
);

const PORT = Number(process.env.AEF_INGEST_CONTROL_PORT ?? process.env.PORT ?? 4201);

app.listen(PORT, '0.0.0.0', () => {});

export default app;
