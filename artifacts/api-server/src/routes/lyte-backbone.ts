/**
 * Lyte — Alloy Backbone Reference Integration
 *
 * This route wires the Lyte decision-intelligence lane through the new
 * multi-agent Alloy backbone end-to-end. It is the Phase 2 reference
 * integration and demonstrates the full envelope → coordinator → specialist
 * → ledger → jury pipeline.
 *
 * Endpoints:
 *   POST /lyte/backbone/analyze  — submit an objective, get a governed response
 *   GET  /lyte/backbone/health   — backbone readiness check
 *   GET  /lyte/backbone/tools    — list specialist tools available to this lane
 */
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../lib/validation';

const router: IRouter = Router();

// ─── Request schema ───────────────────────────────────────────────────────────

const LyteBackboneAnalyzeSchema = z.object({
  objective: z.string().min(1).max(2000).trim(),
  domain: z.string().default('lyte'),
  autonomyMode: z
    .enum(['observe', 'recommend', 'draft', 'ask-to-act', 'approved-act'])
    .optional()
    .default('recommend'),
  context: z.record(z.string(), z.unknown()).optional().default({}),
  runJury: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

type LyteBackboneAnalyzeBody = z.infer<typeof LyteBackboneAnalyzeSchema>;

// ─── POST /lyte/backbone/analyze ──────────────────────────────────────────────

router.post(
  '/lyte/backbone/analyze',
  authMiddleware(),
  validateBody(LyteBackboneAnalyzeSchema),
  async (req, res) => {
    try {
      const body = req.body as LyteBackboneAnalyzeBody;
      const user = (req as unknown as { user?: { id?: string; tenantId?: string } }).user;

      const { coordinate } = await import('@workspace/alloy');

      const response = await coordinate(
        {
          objective: body.objective,
          surface: 'lyte',
          domain: body.domain,
          autonomyMode: body.autonomyMode,
          context: body.context,
          tenantId: user?.tenantId ?? undefined,
          traceId: (req.headers['x-trace-id'] as string | undefined) ?? undefined,
          metadata: {
            ...body.metadata,
            initiatedBy: user?.id ?? 'unknown',
            route: '/lyte/backbone/analyze',
          },
        },
        { runJury: body.runJury },
      );

      logger.info(
        { runId: response.runId, status: response.status, durationMs: response.durationMs },
        'lyte backbone analysis complete',
      );

      return sendSuccess(res, {
        runId: response.runId,
        traceId: response.traceId,
        ledgerId: response.ledgerId,
        status: response.status,
        recommendation: response.recommendation,
        policyGate: response.policyGate,
        approvalRequest: response.approvalRequest,
        toolCallCount: response.toolCalls.length,
        juryScores: response.recommendation?.juryScores ?? null,
        warnings: response.warnings,
        durationMs: response.durationMs,
      });
    } catch (err) {
      return handleRouteError(res, err, 'lyte-backbone.analyze');
    }
  },
);

// ─── GET /lyte/backbone/health ────────────────────────────────────────────────

router.get('/lyte/backbone/health', authMiddleware(), async (_req, res) => {
  try {
    const { listSpecialists } = await import('@workspace/alloy');
    const specialists = listSpecialists().map((s) => ({
      id: s.id,
      displayName: s.displayName,
    }));

    return sendSuccess(res, {
      status: 'healthy',
      version: '1.0.0',
      surface: 'lyte',
      specialists,
      specialistCount: specialists.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    return handleRouteError(res, err, 'lyte-backbone.health');
  }
});

// ─── GET /lyte/backbone/tools ─────────────────────────────────────────────────

router.get('/lyte/backbone/tools', authMiddleware(), async (_req, res) => {
  try {
    const { listTools } = await import('@workspace/tool-registry');
    const tools = listTools();

    return sendSuccess(res, {
      tools: tools.map((t) => ({
        id: t.id,
        displayName: t.displayName,
        specialistId: t.specialistId,
        category: t.category,
        description: t.description,
        hasSideEffects: t.hasSideEffects,
        requiresApproval: t.requiresApproval,
        version: t.version,
      })),
      total: tools.length,
    });
  } catch (err) {
    return handleRouteError(res, err, 'lyte-backbone.tools');
  }
});

export default router;
