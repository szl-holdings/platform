import { bodyShape } from '@szl-holdings/contracts/common';
import {
  type CognitiveContext,
  defaultCheckpointStore,
  loadCheckpoint,
  run,
} from '@workspace/cognitive-runtime';
import { defaultMemoryStore } from '@workspace/memory-fabric';
import { defaultTraceStore } from '@workspace/trace-graph';
import { randomUUID } from 'crypto';
import { Router } from 'express';
import { z } from 'zod';
import { sendError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();

// Roles that may trigger/resume cognitive loops
const ALLOWED_ROLES = ['admin', 'super_admin', 'operator'] as const;

// Admins/super_admins see all checkpoints; operators see only their own
function isAdminLevel(roles: string[]): boolean {
  return roles.some((r) => r === 'admin' || r === 'super_admin');
}

// Express req.user.id is numeric — coerce to string for all agentId / ownership uses
function toAgentId(userId: number | string | undefined): string {
  if (userId === undefined || userId === null) return 'api-agent';
  return String(userId);
}

router.post(
  '/cognitive-runtime/run',
  authMiddleware(),
  requireRole(...ALLOWED_ROLES),
  validateBody(bodyShape({})),
  async (req, res) => {
    const { objective, context = {} }: { objective?: string; context?: CognitiveContext } =
      req.body ?? {};

    if (!objective || typeof objective !== 'string' || !objective.trim()) {
      sendError(res, 'objective is required', 400);
      return;
    }

    const requestingAgentId = toAgentId(req.user?.id);
    const userRoles: string[] = (req.user as unknown as { roles?: string[] })?.roles ?? [];

    // Only admins can run on behalf of another agentId; operators are bound
    // to their own authenticated identity to prevent cross-agent impersonation.
    const effectiveAgentId =
      isAdminLevel(userRoles) && context.agentId ? context.agentId : requestingAgentId;

    const ctx: CognitiveContext = {
      ...context,
      agentId: effectiveAgentId,
      sessionId: context.sessionId ?? randomUUID(),
      traceId: context.traceId ?? randomUUID(),
      tenantId: context.tenantId ?? (req as unknown as { tenantId?: string }).tenantId,
    };

    logger.info(
      { objective: objective.slice(0, 100), agentId: ctx.agentId },
      'Cognitive loop triggered via API',
    );

    try {
      const result = await run(objective, ctx, {
        traceStore: defaultTraceStore,
        memoryStore: defaultMemoryStore,
        checkpointStore: defaultCheckpointStore,
      });

      sendSuccess(res, {
        runId: result.run.runId,
        traceId: result.run.traceId,
        status: result.run.status,
        success: result.success,
        summary: result.summary,
        durationMs: result.run.durationMs,
        phases: result.run.phases.map((p) => ({
          phase: p.phase,
          status: p.status,
          durationMs: p.durationMs,
        })),
        planId: result.run.planId,
        planRevisions: result.run.planRevisions,
        verifyRevisions: result.run.verifyRevisions,
        reflectionId: result.run.reflectionId,
        memoryIds: result.run.memoryIds,
        worldModelUpdate: result.run.worldModelUpdate,
        error: result.run.error,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ err, objective: objective.slice(0, 100) }, 'Cognitive loop error');
      sendError(res, `Cognitive loop error: ${msg}`, 500);
    }
  },
);

router.get(
  '/cognitive-runtime/checkpoint/:ref',
  authMiddleware(),
  requireRole(...ALLOWED_ROLES),
  (req, res) => {
    const ref = req.params.ref as string;
    if (!ref) {
      sendError(res, 'checkpoint ref required', 400);
      return;
    }

    let entry: ReturnType<typeof loadCheckpoint>;
    try {
      entry = loadCheckpoint(ref, defaultCheckpointStore);
    } catch {
      sendError(res, `Checkpoint not found: ${ref}`, 404);
      return;
    }

    // Ownership: admins see all; operators can only read their own checkpoints
    const requesterId = toAgentId(req.user?.id);
    const userRoles: string[] = (req.user as unknown as { roles?: string[] })?.roles ?? [];
    if (!isAdminLevel(userRoles) && entry.agentId !== requesterId) {
      sendError(res, 'Forbidden: checkpoint belongs to a different agent', 403);
      return;
    }

    sendSuccess(res, {
      ref: entry.ref,
      runId: entry.runId,
      agentId: entry.agentId,
      objective: entry.objective,
      phase: entry.phase,
      stepIndex: entry.stepIndex,
      createdAt: new Date(entry.createdAt).toISOString(),
      expiresAt: entry.expiresAt ? new Date(entry.expiresAt).toISOString() : undefined,
      snapshotPhases: entry.snapshot.phases.map((p) => p.phase),
    });
  },
);

router.get(
  '/cognitive-runtime/checkpoints',
  authMiddleware(),
  requireRole(...ALLOWED_ROLES),
  validateQuery(listQuerySchema),
  (req, res) => {
    const { runId } = req.query;
    const requesterId = toAgentId(req.user?.id);
    const userRoles: string[] = (req.user as unknown as { roles?: string[] })?.roles ?? [];

    // Admins see all checkpoints; operators see only their own
    const entries = isAdminLevel(userRoles)
      ? defaultCheckpointStore.list(runId as string | undefined)
      : defaultCheckpointStore.listByAgent(requesterId, runId as string | undefined);

    sendSuccess(res, {
      checkpoints: entries.map((e) => ({
        ref: e.ref,
        runId: e.runId,
        agentId: e.agentId,
        phase: e.phase,
        stepIndex: e.stepIndex,
        createdAt: new Date(e.createdAt).toISOString(),
        expiresAt: e.expiresAt ? new Date(e.expiresAt).toISOString() : undefined,
      })),
      total: entries.length,
    });
  },
);

router.post(
  '/cognitive-runtime/resume',
  authMiddleware(),
  requireRole(...ALLOWED_ROLES),
  validateBody(bodyShape({})),
  validateQuery(listQuerySchema),
  async (req, res) => {
    const {
      checkpointRef,
      objective,
      context = {},
    }: { checkpointRef?: string; objective?: string; context?: CognitiveContext } = req.body ?? {};

    if (!checkpointRef) {
      sendError(res, 'checkpointRef is required', 400);
      return;
    }

    let entry: ReturnType<typeof loadCheckpoint>;
    try {
      entry = loadCheckpoint(checkpointRef, defaultCheckpointStore);
    } catch {
      sendError(res, `Checkpoint not found: ${checkpointRef}`, 404);
      return;
    }

    // Ownership: admins may resume any checkpoint; operators only their own
    const requesterId = toAgentId(req.user?.id);
    const userRoles: string[] = (req.user as unknown as { roles?: string[] })?.roles ?? [];
    if (!isAdminLevel(userRoles) && entry.agentId !== requesterId) {
      sendError(res, 'Forbidden: checkpoint belongs to a different agent', 403);
      return;
    }

    const resolvedObjective = objective ?? entry.objective;

    // Non-admins must resume under the checkpoint's original agent identity to prevent
    // cross-agent attribution via a caller-supplied context.agentId override.
    // Admins may explicitly supply a different agentId for on-behalf operations.
    const effectiveAgentId =
      isAdminLevel(userRoles) && context.agentId ? context.agentId : (entry.agentId ?? requesterId);

    const ctx: CognitiveContext = {
      ...context,
      agentId: effectiveAgentId,
      sessionId: context.sessionId ?? randomUUID(),
      traceId: randomUUID(),
      resumeFromCheckpoint: checkpointRef,
    };

    try {
      const result = await run(resolvedObjective, ctx, {
        traceStore: defaultTraceStore,
        memoryStore: defaultMemoryStore,
        checkpointStore: defaultCheckpointStore,
      });

      sendSuccess(res, {
        runId: result.run.runId,
        traceId: result.run.traceId,
        status: result.run.status,
        success: result.success,
        summary: result.summary,
        resumedFromCheckpoint: checkpointRef,
        resumedFromStepIndex: entry.stepIndex,
        durationMs: result.run.durationMs,
        phases: result.run.phases.map((p) => ({
          phase: p.phase,
          status: p.status,
          durationMs: p.durationMs,
        })),
        planRevisions: result.run.planRevisions,
        error: result.run.error,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      sendError(res, `Resume failed: ${msg}`, 500);
    }
  },
);

export default router;
