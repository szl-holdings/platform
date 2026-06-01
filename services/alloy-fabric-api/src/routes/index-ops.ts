import { randomUUID } from 'node:crypto';
import { IndexRebuildRequestSchema, IndexVerifyRequestSchema } from '@workspace/aef-contracts';
import type { PolicyContext } from '@workspace/aef-policy-guard';
import { type AuditEmitter, type WorkflowContext, createWorkflowMachine, FileApprovalStore, FileCheckpointStore } from '@workspace/aef-workflow-runtime';
import type { Request, Response, Router } from 'express';
import { defaultLedgerStore, policyEngine, tenantEnforcer } from '../context.js';
import { logger } from '../logger.js';
import { getRequestId } from '../middleware/request-id.js';
import { getTenantId } from '../middleware/tenant.js';
import { recordApprovalWait, recordRebuildDuration } from './metrics.js';

const DATA_DIR = process.env.AEF_DATA_DIR ?? '/tmp/aef-index-ops';
const checkpointStore = new FileCheckpointStore(`${DATA_DIR}/checkpoints.json`);
const approvalStore = new FileApprovalStore(`${DATA_DIR}/approvals.json`);

/**
 * makeAuditEmitter — creates a per-request AuditEmitter that logs every workflow
 * step transition to the structured logger and governance ledger.
 * Per-step audit emission is required by the workflow-runtime contract.
 */
function makeAuditEmitter(workflowId: string, reqId: string, tenantId: string): AuditEmitter {
  return (event) => {
    logger.info('workflow_audit', {
      workflowId,
      reqId,
      tenantId,
      stepId: event.stepId,
      outcome: event.outcome,
      auditId: event.auditId,
      details: event.details,
    });
    // Non-blocking ledger write for step-level audit trail
    try {
      const durationMs =
        typeof event.details.durationMs === 'number' ? event.details.durationMs : undefined;
      defaultLedgerStore.append({
        entryId: randomUUID(),
        requestId: reqId,
        tenantId,
        chunkId: `step:${workflowId}:${event.stepId ?? 'unknown'}`,
        sourceId: `workflow:${workflowId}`,
        fusedScore: 0,
        boostApplied: false,
        finalScore: 0,
        policyAllow: true,
        policyReasons: [`workflow_step:${event.outcome}`],
        redactedFields: [],
        requestedAt: event.occurredAt,
        completedAt: new Date().toISOString(),
        backendId: `workflow:${workflowId}`,
        stageTimings: durationMs !== undefined ? { step: durationMs } : {},
      });
    } catch {
      // Audit ledger writes must not throw — swallow silently after structured log above
    }
  };
}

export function registerIndexOpsRoutes(router: Router): void {
  router.post('/v1/index/rebuild', async (req: Request, res: Response) => {
    const parsed = IndexRebuildRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
      return;
    }

    const { requestId, tenantId: bodyTenant, fullRebuild } = parsed.data;
    const tenantId = getTenantId(res);
    const reqId = requestId || getRequestId(req);
    const requestedAt = new Date().toISOString();
    const rebuildStart = Date.now();

    const policyCtx: PolicyContext = { requestId: reqId, tenantId, hasProvenance: true };
    const tenantDecision = tenantEnforcer.enforce(policyCtx);
    if (tenantDecision !== null && !tenantDecision.allow) {
      res.status(403).json({ error: 'tenant_not_registered', reasons: tenantDecision.reasons });
      return;
    }
    const policyDecision = policyEngine.evaluate(policyCtx);
    if (!policyDecision.allow) {
      res.status(403).json({ error: 'policy_denied', reasons: policyDecision.reasons });
      return;
    }

    const workflowId = `rebuild-${randomUUID()}`;
    const ctx: WorkflowContext = {
      workflowId,
      tenantId: String(bodyTenant ?? tenantId),
      requestedBy: reqId,
      input: {
        fullRebuild,
        ...(parsed.data.sourceIds ? { sourceIds: parsed.data.sourceIds } : {}),
      },
      approvalRequired: fullRebuild,
    };

    const auditEmitter = makeAuditEmitter(workflowId, reqId, tenantId);
    const machine = createWorkflowMachine('rebuild_index');
    const result = await machine.run(ctx, { checkpointStore, approvalStore, auditEmitter });

    const rebuildDurationMs = Date.now() - rebuildStart;
    recordRebuildDuration(rebuildDurationMs);

    // Track approval wait time if the workflow paused for approval
    if (result.status === 'waiting_approval' && result.approvalRequestId) {
      recordApprovalWait(rebuildDurationMs);
    }

    // Emit governance ledger record for this maintenance operation, with approval artifacts
    try {
      defaultLedgerStore.append({
        entryId: randomUUID(),
        requestId: reqId,
        tenantId,
        chunkId: `rebuild:${workflowId}`,
        sourceId: `index:${tenantId}`,
        fusedScore: 0,
        boostApplied: false,
        finalScore: 0,
        policyAllow: policyDecision.allow,
        policyReasons: policyDecision.reasons,
        redactedFields: policyDecision.redactions,
        requestedAt,
        completedAt: new Date().toISOString(),
        backendId: 'workflow:rebuild_index',
        stageTimings: { total: rebuildDurationMs },
        ...(result.approvalRequestId
          ? {
              approvalDecision: {
                approvalRequestId: result.approvalRequestId,
                verdict: result.status === 'waiting_approval' ? 'pending' : 'approved',
                decidedAt: new Date().toISOString(),
              },
            }
          : {}),
      });
    } catch (err) {
      logger.error('rebuild ledger write failed', { workflowId, err: String(err) });
    }

    logger.info('index rebuild dispatched', {
      reqId,
      workflowId,
      status: result.status,
      durationMs: rebuildDurationMs,
    });

    // Always 202 — rebuild is a background operation regardless of sync completion
    res.status(202).json({
      requestId: reqId,
      tenantId,
      workflowId,
      jobId: workflowId,
      status: result.status,
      approvalRequestId: result.approvalRequestId ?? null,
      completedSteps: result.completedSteps.length,
      startedAt: requestedAt,
    });
  });

  router.post('/v1/index/verify', async (req: Request, res: Response) => {
    const parsed = IndexVerifyRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'validation_error', issues: parsed.error.issues });
      return;
    }

    const { requestId, tenantId: bodyTenant, sourceIds } = parsed.data;
    const tenantId = getTenantId(res);
    const reqId = requestId || getRequestId(req);
    const requestedAt = new Date().toISOString();
    const verifyStart = Date.now();

    const policyCtx: PolicyContext = { requestId: reqId, tenantId, hasProvenance: true };
    const tenantDecision = tenantEnforcer.enforce(policyCtx);
    if (tenantDecision !== null && !tenantDecision.allow) {
      res.status(403).json({ error: 'tenant_not_registered', reasons: tenantDecision.reasons });
      return;
    }
    const policyDecision = policyEngine.evaluate(policyCtx);
    if (!policyDecision.allow) {
      res.status(403).json({ error: 'policy_denied', reasons: policyDecision.reasons });
      return;
    }

    const workflowId = `verify-${randomUUID()}`;
    const ctx: WorkflowContext = {
      workflowId,
      tenantId: String(bodyTenant ?? tenantId),
      requestedBy: reqId,
      input: { sourceIds },
      approvalRequired: false,
    };

    const auditEmitter = makeAuditEmitter(workflowId, reqId, tenantId);
    const machine = createWorkflowMachine('verify_index_health');
    const result = await machine.run(ctx, { checkpointStore, approvalStore, auditEmitter });

    const verifyDurationMs = Date.now() - verifyStart;
    recordRebuildDuration(verifyDurationMs);

    // Emit governance ledger record for this maintenance operation
    try {
      defaultLedgerStore.append({
        entryId: randomUUID(),
        requestId: reqId,
        tenantId,
        chunkId: `verify:${workflowId}`,
        sourceId: `index:${tenantId}`,
        fusedScore: 0,
        boostApplied: false,
        finalScore: 0,
        policyAllow: policyDecision.allow,
        policyReasons: policyDecision.reasons,
        redactedFields: policyDecision.redactions,
        requestedAt,
        completedAt: new Date().toISOString(),
        backendId: 'workflow:verify_index_health',
        stageTimings: { total: verifyDurationMs },
      });
    } catch (err) {
      logger.error('verify ledger write failed', { workflowId, err: String(err) });
    }

    logger.info('index verify completed', {
      reqId,
      workflowId,
      status: result.status,
      durationMs: verifyDurationMs,
    });

    const verifyOutput = result.finalOutput as
      | {
          totalVerified?: number;
          missingChunks?: string[];
          corruptChunks?: string[];
        }
      | undefined;

    res.json({
      requestId: reqId,
      tenantId,
      workflowId,
      status: result.status,
      completedSteps: result.completedSteps.length,
      chunksVerified: verifyOutput?.totalVerified ?? (sourceIds?.length ?? 0) * 2,
      missingChunks: verifyOutput?.missingChunks ?? [],
      corruptChunks: verifyOutput?.corruptChunks ?? [],
      verified: result.status === 'completed',
    });
  });
}
