/**
 * AEEP v1 Workflow Routes
 *
 * All endpoints are tenant-isolated: runs created by one tenant are never
 * visible or accessible to another tenant. The tenantId is sourced from
 * req.tenantCtx (populated by apiKeyGuard via X-Tenant-Id header) and is
 * enforced at the store layer via key namespacing.
 *
 * POST   /v1/workflows/start              — start a governed workflow run
 * GET    /v1/workflows                    — list runs for the current tenant
 * GET    /v1/workflows/:runId             — get a tenant-owned run + step trace
 * POST   /v1/workflows/:runId/resume      — resume a checkpointed run
 * POST   /v1/workflows/:runId/approve     — operator approval decision (approved|rejected)
 * DELETE /v1/workflows/:runId             — cancel a queued/running run
 */

import type { WorkflowDescriptor } from '@szl-holdings/shared-contracts';
import { createWorkflowRun, executeWorkflowRun } from '@szl-holdings/workflow-runtime';
import type { Request, Response } from 'express';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { runStore } from '../../store.js';

const router: IRouter = Router();

const StartWorkflowSchema = z.object({
  workflowId: z.string().min(1),
  workflowName: z.string().min(1),
  steps: z.array(
    z.object({
      stepId: z.string(),
      name: z.string(),
      agentRole: z.string(),
      toolIds: z.array(z.string()).default([]),
      policyCheck: z.boolean().default(true),
      evidenceRequired: z.boolean().default(true),
      requiresApproval: z.boolean().optional(),
    }),
  ),
  description: z.string().optional(),
  profileId: z.string().optional(),
  triggeredBy: z.string().optional(),
  policyTier: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const ApproveSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  actorId: z.string().optional(),
  note: z.string().optional(),
});

function tenantId(req: Request): string {
  return req.tenantCtx?.tenantId ?? 'default';
}

router.post('/start', async (req: Request, res: Response): Promise<void> => {
  const parse = StartWorkflowSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { workflowId, workflowName, steps, description, profileId, triggeredBy, policyTier } =
    parse.data;
  const tid = tenantId(req);

  const descriptor: WorkflowDescriptor = {
    id: workflowId as WorkflowDescriptor['id'],
    name: workflowName,
    description: description ?? workflowName,
    category: 'operational',
    triggerTypes: ['api'],
    steps: steps.map((s) => ({
      stepId: s.stepId,
      name: s.name,
      agentRole: s.agentRole as WorkflowDescriptor['steps'][number]['agentRole'],
      toolIds: s.toolIds,
      policyCheck: s.policyCheck,
      evidenceRequired: s.evidenceRequired,
      requiresApproval: s.requiresApproval,
    })),
    policyTier: policyTier ?? 'medium',
  };

  const run = createWorkflowRun(descriptor, { profileId, triggeredBy: triggeredBy ?? tid });
  runStore.set(run, tid);

  executeWorkflowRun(run, {
    onStateChange: (updated) => {
      runStore.set(updated, tid);
    },
  })
    .then((final) => {
      runStore.set(final, tid);
    })
    .catch(() => {
      const stale = runStore.get(run.runId, tid);
      if (stale && stale.state === 'running') {
        runStore.set({ ...stale, state: 'failed', completedAt: new Date().toISOString() }, tid);
      }
    });

  res.status(202).json({
    runId: run.runId,
    workflowId: run.workflowId,
    tenantId: tid,
    state: run.state,
    startedAt: run.startedAt,
    statusUrl: `/v1/workflows/${run.runId}`,
  });
});

router.get('/', (req: Request, res: Response): void => {
  const tid = tenantId(req);
  res.status(200).json({ runs: runStore.list(tid), tenantId: tid });
});

router.get('/:runId', (req: Request, res: Response): void => {
  const tid = tenantId(req);
  const run = runStore.get(req.params['runId'] as string, tid);
  if (!run) {
    res.status(404).json({ error: `Run not found: ${req.params['runId']}` });
    return;
  }
  res.status(200).json(run);
});

router.post('/:runId/resume', async (req: Request, res: Response): Promise<void> => {
  const tid = tenantId(req);
  const run = runStore.get(req.params['runId'] as string, tid);
  if (!run) {
    res.status(404).json({ error: `Run not found: ${req.params['runId']}` });
    return;
  }

  const resumableStates = ['approval-required', 'approved', 'failed'] as const;
  if (!resumableStates.some((s) => s === run.state)) {
    res.status(409).json({
      error: `Run cannot be resumed from state=${run.state}`,
      runId: run.runId,
      resumableFrom: resumableStates,
    });
    return;
  }

  const resumed = { ...run, state: 'queued' as const, completedAt: undefined };
  runStore.set(resumed, tid);

  executeWorkflowRun(resumed, {
    onStateChange: (updated) => runStore.set(updated, tid),
  })
    .then((final) => runStore.set(final, tid))
    .catch(() => {
      const stale = runStore.get(run.runId, tid);
      if (stale && stale.state === 'running') {
        runStore.set({ ...stale, state: 'failed', completedAt: new Date().toISOString() }, tid);
      }
    });

  res.status(202).json({
    runId: resumed.runId,
    state: resumed.state,
    statusUrl: `/v1/workflows/${resumed.runId}`,
  });
});

router.post('/:runId/approve', async (req: Request, res: Response): Promise<void> => {
  const tid = tenantId(req);
  const run = runStore.get(req.params['runId'] as string, tid);
  if (!run) {
    res.status(404).json({ error: `Run not found: ${req.params['runId']}` });
    return;
  }
  if (run.state !== 'approval-required') {
    res.status(409).json({
      error: `Run is not in approval-required state (state=${run.state})`,
      runId: run.runId,
    });
    return;
  }

  const parse = ApproveSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Validation failed', issues: parse.error.issues });
    return;
  }

  const { decision, actorId, note } = parse.data;
  const updated: typeof run = {
    ...run,
    state: decision === 'approved' ? 'approved' : 'rejected',
    completedAt: new Date().toISOString(),
  };
  runStore.set(updated, tid);
  res.status(200).json({
    ...updated,
    actorId,
    note,
  });
});

router.delete('/:runId', (req: Request, res: Response): void => {
  const tid = tenantId(req);
  const run = runStore.get(req.params['runId'] as string, tid);
  if (!run) {
    res.status(404).json({ error: `Run not found: ${req.params['runId']}` });
    return;
  }
  const cancelled = { ...run, state: 'cancelled' as const, completedAt: new Date().toISOString() };
  runStore.set(cancelled, tid);
  res.status(200).json({ runId: cancelled.runId, state: cancelled.state });
});

export default router;
