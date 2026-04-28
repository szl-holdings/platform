import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  experimentAssignmentsTable,
  experimentEventsTable,
  experimentsTable,
  experimentVariantsTable,
  experimentSnapshotsTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { logActivity } from '../lib/activity-logger';
import {
  handleRouteError,
  parsePagination,
  sendBadRequest,
  sendCreated,
  sendNoContent,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import {
  analyzeExperiment,
  checkAndEnforceGuardRails,
  resolveVariant,
  trackConversion,
  trackExposure,
  trackMetric,
} from '../lib/experiment-engine';
import { validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../middlewares/auth';

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createVariantSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(300),
  isControl: z.boolean().optional().default(false),
  trafficWeight: z.number().int().min(1).max(10000).optional().default(50),
  config: z.record(z.unknown()).optional(),
  mlModelVersionId: z.string().max(200).optional(),
});

const createExperimentSchema = z.object({
  key: z.string().min(1).max(200).regex(/^[a-z0-9_-]+$/, 'Key must be lowercase alphanumeric with underscores/hyphens'),
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  hypothesis: z.string().max(2000).optional(),
  type: z.enum(['product', 'ml_model', 'content', 'pricing', 'workflow']).optional().default('product'),
  primaryMetric: z.string().min(1).max(200).optional().default('conversion_rate'),
  trafficAllocation: z.number().int().min(1).max(100).optional().default(100),
  isBandit: z.boolean().optional().default(false),
  minSampleSize: z.number().int().min(1).max(1_000_000).optional().default(100),
  significanceThreshold: z.number().min(0.001).max(0.5).optional().default(0.05),
  guardRailMetrics: z
    .array(
      z.object({
        metric: z.string().min(1).max(100),
        maxAllowedRelativeDrop: z.number().min(0).max(1).optional(),
      }),
    )
    .optional(),
  variants: z
    .array(createVariantSchema)
    .min(2)
    .max(10)
    .refine((vs) => vs.filter((v) => v.isControl).length <= 1, {
      message: 'At most one variant can be the control',
    }),
  metadata: z.record(z.unknown()).optional(),
});

const updateExperimentSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  hypothesis: z.string().max(2000).optional(),
  trafficAllocation: z.number().int().min(1).max(100).optional(),
  minSampleSize: z.number().int().min(1).max(1_000_000).optional(),
  significanceThreshold: z.number().min(0.001).max(0.5).optional(),
  guardRailMetrics: z
    .array(
      z.object({
        metric: z.string().min(1).max(100),
        maxAllowedRelativeDrop: z.number().min(0).max(1).optional(),
      }),
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

const assignVariantSchema = z.object({
  experimentKey: z.string().min(1).max(200),
  entityId: z.string().min(1).max(500),
  entityType: z.enum(['user', 'org', 'session', 'device']).optional().default('user'),
  trackExposure: z.boolean().optional().default(true),
});

const trackEventSchema = z.object({
  experimentId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  entityId: z.string().min(1).max(500),
  eventType: z.enum(['exposure', 'conversion', 'metric', 'error']),
  metricKey: z.string().max(200).optional(),
  metricValue: z.number().optional(),
});

const promoteWinnerSchema = z.object({
  winnerId: z.number().int().positive(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.string().optional(),
  type: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Experiment CRUD
// ---------------------------------------------------------------------------

router.get(
  '/experiments',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { limit, offset, page } = parsePagination(req.query as Record<string, unknown>);
      const { status, type } = req.query as { status?: string; type?: string };

      const conditions = [];
      if (status) conditions.push(eq(experimentsTable.status, status as never));
      if (type) conditions.push(eq(experimentsTable.type, type as never));

      const experiments = await db
        .select()
        .from(experimentsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(experimentsTable.createdAt))
        .limit(limit)
        .offset(offset);

      const withVariants = await Promise.all(
        experiments.map(async (exp) => {
          const variants = await db
            .select()
            .from(experimentVariantsTable)
            .where(eq(experimentVariantsTable.experimentId, exp.id));
          return { ...exp, variants };
        }),
      );

      sendSuccess(res, withVariants);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list experiments');
    }
  },
);

router.get(
  '/experiments/summary',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (_req, res) => {
    try {
      const experiments = await db.select().from(experimentsTable);
      sendSuccess(res, {
        total: experiments.length,
        running: experiments.filter((e) => e.status === 'running').length,
        concluded: experiments.filter((e) => e.status === 'concluded').length,
        paused: experiments.filter((e) => e.status === 'paused').length,
        draft: experiments.filter((e) => e.status === 'draft').length,
        stopped: experiments.filter((e) => e.status === 'stopped').length,
        bandit: experiments.filter((e) => e.isBandit).length,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get experiment summary');
    }
  },
);

router.get(
  '/experiments/:id',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [experiment] = await db
        .select()
        .from(experimentsTable)
        .where(eq(experimentsTable.id, id))
        .limit(1);
      if (!experiment) {
        sendNotFound(res, 'Experiment');
        return;
      }
      const variants = await db
        .select()
        .from(experimentVariantsTable)
        .where(eq(experimentVariantsTable.experimentId, id));
      sendSuccess(res, { ...experiment, variants });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get experiment');
    }
  },
);

router.post(
  '/experiments',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(createExperimentSchema),
  async (req, res) => {
    try {
      const { variants: variantInputs, ...experimentData } = req.body;

      const [experiment] = await db
        .insert(experimentsTable)
        .values({
          ...experimentData,
          significanceThreshold: String(experimentData.significanceThreshold ?? 0.05),
          status: 'draft',
        })
        .returning();

      if (!experiment) {
        sendBadRequest(res, 'Failed to create experiment');
        return;
      }

      const createdVariants = await db
        .insert(experimentVariantsTable)
        .values(
          variantInputs.map((v: z.infer<typeof createVariantSchema>) => ({
            experimentId: experiment.id,
            key: v.key,
            name: v.name,
            isControl: v.isControl ?? false,
            trafficWeight: v.trafficWeight ?? 50,
            config: v.config ?? null,
            mlModelVersionId: v.mlModelVersionId ?? null,
          })),
        )
        .returning();

      await logActivity(
        req,
        'create',
        'experiment',
        String(experiment.id),
        `Created experiment: ${experiment.key}`,
      );

      sendCreated(res, { ...experiment, variants: createdVariants });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create experiment');
    }
  },
);

router.patch(
  '/experiments/:id',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(updateExperimentSchema),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const updateData = { ...req.body, updatedAt: new Date() };
      if (updateData.significanceThreshold !== undefined) {
        updateData.significanceThreshold = String(updateData.significanceThreshold);
      }

      const [experiment] = await db
        .update(experimentsTable)
        .set(updateData)
        .where(eq(experimentsTable.id, id))
        .returning();

      if (!experiment) {
        sendNotFound(res, 'Experiment');
        return;
      }

      await logActivity(
        req,
        'update',
        'experiment',
        String(id),
        `Updated experiment: ${experiment.key}`,
      );
      sendSuccess(res, experiment);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update experiment');
    }
  },
);

// ---------------------------------------------------------------------------
// Lifecycle: start, pause, conclude, stop
// ---------------------------------------------------------------------------

router.post(
  '/experiments/:id/start',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [experiment] = await db
        .update(experimentsTable)
        .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(experimentsTable.id, id), inArray(experimentsTable.status, ['draft', 'paused'])))
        .returning();
      if (!experiment) {
        sendNotFound(res, 'Experiment (must be in draft or paused state)');
        return;
      }
      await logActivity(req, 'update', 'experiment', String(id), `Started experiment: ${experiment.key}`);
      sendSuccess(res, experiment);
    } catch (err) {
      handleRouteError(res, err, 'Failed to start experiment');
    }
  },
);

router.post(
  '/experiments/:id/pause',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [experiment] = await db
        .update(experimentsTable)
        .set({ status: 'paused', updatedAt: new Date() })
        .where(and(eq(experimentsTable.id, id), eq(experimentsTable.status, 'running')))
        .returning();
      if (!experiment) {
        sendNotFound(res, 'Experiment (must be running)');
        return;
      }
      await logActivity(req, 'update', 'experiment', String(id), `Paused experiment: ${experiment.key}`);
      sendSuccess(res, experiment);
    } catch (err) {
      handleRouteError(res, err, 'Failed to pause experiment');
    }
  },
);

router.post(
  '/experiments/:id/conclude',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [experiment] = await db
        .update(experimentsTable)
        .set({ status: 'concluded', concludedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(experimentsTable.id, id), inArray(experimentsTable.status, ['running', 'paused'])))
        .returning();
      if (!experiment) {
        sendNotFound(res, 'Experiment (must be running or paused)');
        return;
      }
      await logActivity(req, 'update', 'experiment', String(id), `Concluded experiment: ${experiment.key}`);
      sendSuccess(res, experiment);
    } catch (err) {
      handleRouteError(res, err, 'Failed to conclude experiment');
    }
  },
);

router.post(
  '/experiments/:id/promote',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(promoteWinnerSchema),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const { winnerId } = req.body;

      const [variant] = await db
        .select()
        .from(experimentVariantsTable)
        .where(and(eq(experimentVariantsTable.id, winnerId), eq(experimentVariantsTable.experimentId, id)))
        .limit(1);

      if (!variant) {
        sendNotFound(res, 'Variant');
        return;
      }

      const [experiment] = await db
        .update(experimentsTable)
        .set({
          status: 'concluded',
          concludedAt: new Date(),
          winnerId,
          updatedAt: new Date(),
        })
        .where(eq(experimentsTable.id, id))
        .returning();

      if (!experiment) {
        sendNotFound(res, 'Experiment');
        return;
      }

      await logActivity(
        req,
        'update',
        'experiment',
        String(id),
        `Promoted winner variant ${variant.key} for experiment: ${experiment.key}`,
      );
      sendSuccess(res, { experiment, winnerVariant: variant });
    } catch (err) {
      handleRouteError(res, err, 'Failed to promote experiment winner');
    }
  },
);

router.delete(
  '/experiments/:id',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const [experiment] = await db
        .delete(experimentsTable)
        .where(and(eq(experimentsTable.id, id), inArray(experimentsTable.status, ['draft', 'concluded', 'stopped'])))
        .returning();
      if (!experiment) {
        sendNotFound(res, 'Experiment (only draft/concluded/stopped experiments can be deleted)');
        return;
      }
      await logActivity(req, 'delete', 'experiment', String(id), `Deleted experiment: ${experiment.key}`);
      sendNoContent(res);
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete experiment');
    }
  },
);

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

router.get(
  '/experiments/:id/analysis',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const analysis = await analyzeExperiment(id);
      if (!analysis) {
        sendNotFound(res, 'Experiment');
        return;
      }
      sendSuccess(res, analysis);
    } catch (err) {
      handleRouteError(res, err, 'Failed to analyze experiment');
    }
  },
);

router.post(
  '/experiments/:id/check-guard-rails',
  authMiddleware(),
  requireRole('ops', 'admin'),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      await checkAndEnforceGuardRails(id);
      const analysis = await analyzeExperiment(id);
      sendSuccess(res, { checked: true, analysis });
    } catch (err) {
      handleRouteError(res, err, 'Failed to check guard rails');
    }
  },
);

// ---------------------------------------------------------------------------
// Assignment (client SDK endpoint)
// ---------------------------------------------------------------------------

router.post(
  '/experiments/assign',
  authMiddleware({ required: false }),
  validateBody(assignVariantSchema),
  async (req, res) => {
    try {
      const { experimentKey, entityId, entityType, trackExposure: shouldTrack } = req.body;

      const assignment = await resolveVariant(experimentKey, entityId, entityType);
      if (!assignment) {
        sendSuccess(res, { assigned: false, variantKey: null });
        return;
      }

      if (shouldTrack) {
        await trackExposure(assignment.experimentId, assignment.variantId, entityId);
      }

      sendSuccess(res, {
        assigned: true,
        experimentKey,
        variantKey: assignment.variantKey,
        variantId: assignment.variantId,
        experimentId: assignment.experimentId,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to assign experiment variant');
    }
  },
);

router.post(
  '/experiments/batch-assign',
  authMiddleware({ required: false }),
  validateBody(
    z.object({
      experimentKeys: z.array(z.string().min(1).max(200)).min(1).max(20),
      entityId: z.string().min(1).max(500),
      entityType: z.enum(['user', 'org', 'session', 'device']).optional().default('user'),
      trackExposure: z.boolean().optional().default(true),
    }),
  ),
  async (req, res) => {
    try {
      const { experimentKeys, entityId, entityType, trackExposure: shouldTrack } = req.body;
      const assignments: Record<string, { variantKey: string; variantId: number; experimentId: number } | null> = {};

      await Promise.all(
        experimentKeys.map(async (key: string) => {
          const assignment = await resolveVariant(key, entityId, entityType);
          assignments[key] = assignment;
          if (assignment && shouldTrack) {
            await trackExposure(assignment.experimentId, assignment.variantId, entityId);
          }
        }),
      );

      sendSuccess(res, { entityId, assignments });
    } catch (err) {
      handleRouteError(res, err, 'Failed to batch-assign experiment variants');
    }
  },
);

// ---------------------------------------------------------------------------
// Event tracking
// ---------------------------------------------------------------------------

router.post(
  '/experiments/track',
  authMiddleware({ required: false }),
  validateBody(trackEventSchema),
  async (req, res) => {
    try {
      const { experimentId, variantId, entityId, eventType, metricKey, metricValue } = req.body;

      const [variant] = await db
        .select({ id: experimentVariantsTable.id })
        .from(experimentVariantsTable)
        .where(
          and(
            eq(experimentVariantsTable.id, variantId),
            eq(experimentVariantsTable.experimentId, experimentId),
          ),
        )
        .limit(1);

      if (!variant) {
        sendBadRequest(res, 'variantId does not belong to the specified experimentId');
        return;
      }

      if (eventType === 'exposure') {
        await trackExposure(experimentId, variantId, entityId);
      } else if (eventType === 'conversion') {
        await trackConversion(experimentId, variantId, entityId, metricKey, metricValue);
        checkAndEnforceGuardRails(experimentId).catch(() => {});
      } else if (eventType === 'metric' && metricKey && metricValue !== undefined) {
        await trackMetric(experimentId, variantId, entityId, metricKey, metricValue);
      } else if (eventType === 'error') {
        await db.insert(experimentEventsTable).values({
          experimentId,
          variantId,
          entityId,
          eventType: 'error',
          metricKey: metricKey ?? null,
          metricValue: metricValue !== undefined ? String(metricValue) : null,
        });
        checkAndEnforceGuardRails(experimentId).catch(() => {});
      }

      sendSuccess(res, { tracked: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to track experiment event');
    }
  },
);

// ---------------------------------------------------------------------------
// Snapshots & history
// ---------------------------------------------------------------------------

router.get(
  '/experiments/:id/snapshots',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const snapshots = await db
        .select()
        .from(experimentSnapshotsTable)
        .where(eq(experimentSnapshotsTable.experimentId, id))
        .orderBy(desc(experimentSnapshotsTable.createdAt))
        .limit(20);
      sendSuccess(res, snapshots);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get experiment snapshots');
    }
  },
);

router.get(
  '/experiments/:id/assignments',
  authMiddleware(),
  requireRole('ops', 'admin'),
  async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      const assignments = await db
        .select()
        .from(experimentAssignmentsTable)
        .where(eq(experimentAssignmentsTable.experimentId, id))
        .orderBy(desc(experimentAssignmentsTable.assignedAt))
        .limit(100);
      sendSuccess(res, assignments);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get experiment assignments');
    }
  },
);

export default router;
