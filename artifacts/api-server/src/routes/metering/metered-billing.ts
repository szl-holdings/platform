/**
 * Metered Billing Routes
 *
 * Implements the usage-based / metered billing layer on top of existing
 * seat and flat-tier billing. Covers:
 *
 *  1. Meter CRUD (admin)                — GET/POST/PUT/DELETE /metering/meters
 *  2. High-level usage event ingestion  — POST /metering/ingest
 *  3. Real-time usage dashboard         — GET  /metering/dashboard
 *  4. Usage corrections (admin)         — POST/GET /metering/corrections
 *  5. Meter allotments                  — GET/POST /metering/allotments
 *  6. Stripe usage record submission    — POST /metering/stripe/submit-usage
 *  7. Demo usage generation             — POST /metering/demo/generate
 */

import {
  billingMeterAllotmentsTable,
  billingMetersTable,
  db,
  meteringCorrectionsTable,
  meteringEventsTable,
  organizationsTable,
  subscriptionsTable,
  usageAggregatesTable,
  usageThresholdNotificationsTable,
} from '@szl-holdings/db';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../../lib/api-response';
import { logger } from '../../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../../lib/validation';
import { authMiddleware, parseIdParam, requireRole } from '../../middlewares/auth';
import { computeBillableQty, meteringRateLimit, periodBounds, recomputeAggregate } from './shared';

const router: IRouter = Router();
const ADMIN_ROLES = ['admin', 'super_admin', 'ops'] as const;
const READ_ROLES = ['admin', 'super_admin', 'ops', 'analyst'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────────────────────

const meterCreateSchema = z.object({
  key: z.string().min(1).max(200).regex(/^[a-z0-9._-]+$/, 'key must be lowercase alphanumeric with dots, hyphens, or underscores'),
  displayName: z.string().min(1).max(200).trim(),
  unit: z.string().min(1).max(100).default('unit'),
  aggregation: z.enum(['sum', 'last', 'unique_count']).default('sum'),
  billingWindow: z.enum(['day', 'month', 'billing_cycle']).default('month'),
  pricingModel: z.enum(['per_unit', 'graduated', 'volume', 'package']).default('per_unit'),
  includedUnits: z.number().min(0).default(0),
  unitAmount: z.number().min(0).optional(),
  stripePriceId: z.string().max(200).optional(),
  stripeMeterId: z.string().max(200).optional(),
  product: z.string().max(100).default('platform'),
  isActive: z.boolean().default(true),
  description: z.string().max(1000).optional(),
});

const meterUpdateSchema = meterCreateSchema.partial().omit({ key: true });

const ingestUsageEventSchema = z.object({
  tenantId: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  meterKey: z.string().min(1).max(200),
  quantity: z.number().positive().default(1),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  idempotencyKey: z.string().max(500).optional(),
  dimensions: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const correctionCreateSchema = z.object({
  orgId: z.number().int().positive(),
  meterKey: z.string().min(1).max(200),
  quantity: z.number(),
  reasonCode: z.enum(['data_correction', 'customer_request', 'system_error', 'promotional', 'other']).default('other'),
  reason: z.string().max(2000).optional(),
  appliedToPeriodStart: z.string().datetime({ offset: true }).optional(),
  appliedToPeriodEnd: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const allotmentCreateSchema = z.object({
  planId: z.number().int().positive(),
  meterId: z.number().int().positive(),
  includedUnits: z.number().min(0).default(0),
  stripePriceId: z.string().max(200).optional(),
  overageUnitAmount: z.number().min(0).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. METER CRUD (admin)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/metering/meters',
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const product = req.query.product as string | undefined;
      const isActive = req.query.isActive !== undefined
        ? req.query.isActive === 'true'
        : undefined;

      const conditions = [];
      if (product) conditions.push(eq(billingMetersTable.product, product));
      if (isActive !== undefined) conditions.push(eq(billingMetersTable.isActive, isActive));

      const meters = await db
        .select()
        .from(billingMetersTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(billingMetersTable.displayName);

      sendSuccess(res, meters);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list billing meters');
    }
  },
);

router.get(
  '/metering/meters/:id',
  authMiddleware(),
  requireRole(...READ_ROLES),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const [meter] = await db
        .select()
        .from(billingMetersTable)
        .where(eq(billingMetersTable.id, id))
        .limit(1);

      if (!meter) {
        sendNotFound(res, 'Billing meter');
        return;
      }

      const allotments = await db
        .select()
        .from(billingMeterAllotmentsTable)
        .where(eq(billingMeterAllotmentsTable.meterId, id));

      sendSuccess(res, { ...meter, allotments });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get billing meter');
    }
  },
);

router.post(
  '/metering/meters',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  validateBody(meterCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof meterCreateSchema>;

      const [meter] = await db
        .insert(billingMetersTable)
        .values({
          key: body.key,
          displayName: body.displayName,
          unit: body.unit,
          aggregation: body.aggregation,
          billingWindow: body.billingWindow,
          pricingModel: body.pricingModel,
          includedUnits: String(body.includedUnits),
          unitAmount: body.unitAmount != null ? String(body.unitAmount) : null,
          stripePriceId: body.stripePriceId ?? null,
          stripeMeterId: body.stripeMeterId ?? null,
          product: body.product,
          isActive: body.isActive,
          description: body.description ?? null,
        })
        .returning();

      logger.info({ meterId: meter?.id, key: body.key }, '[metered-billing] Meter created');
      sendSuccess(res, meter, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create billing meter');
    }
  },
);

router.put(
  '/metering/meters/:id',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  validateBody(meterUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);
      const body = req.body as z.infer<typeof meterUpdateSchema>;

      const existing = await db
        .select({ id: billingMetersTable.id })
        .from(billingMetersTable)
        .where(eq(billingMetersTable.id, id))
        .limit(1);

      if (!existing.length) {
        sendNotFound(res, 'Billing meter');
        return;
      }

      const updates: Partial<typeof billingMetersTable.$inferInsert> = { updatedAt: new Date() };
      if (body.displayName !== undefined) updates.displayName = body.displayName;
      if (body.unit !== undefined) updates.unit = body.unit;
      if (body.aggregation !== undefined) updates.aggregation = body.aggregation;
      if (body.billingWindow !== undefined) updates.billingWindow = body.billingWindow;
      if (body.pricingModel !== undefined) updates.pricingModel = body.pricingModel;
      if (body.includedUnits !== undefined) updates.includedUnits = String(body.includedUnits);
      if (body.unitAmount !== undefined) updates.unitAmount = body.unitAmount != null ? String(body.unitAmount) : null;
      if (body.stripePriceId !== undefined) updates.stripePriceId = body.stripePriceId ?? null;
      if (body.stripeMeterId !== undefined) updates.stripeMeterId = body.stripeMeterId ?? null;
      if (body.product !== undefined) updates.product = body.product;
      if (body.isActive !== undefined) updates.isActive = body.isActive;
      if (body.description !== undefined) updates.description = body.description ?? null;

      const [updated] = await db
        .update(billingMetersTable)
        .set(updates)
        .where(eq(billingMetersTable.id, id))
        .returning();

      sendSuccess(res, updated);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update billing meter');
    }
  },
);

router.delete(
  '/metering/meters/:id',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id);

      const [existing] = await db
        .select({ id: billingMetersTable.id, key: billingMetersTable.key })
        .from(billingMetersTable)
        .where(eq(billingMetersTable.id, id))
        .limit(1);

      if (!existing) {
        sendNotFound(res, 'Billing meter');
        return;
      }

      await db
        .update(billingMetersTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(billingMetersTable.id, id));

      sendSuccess(res, { deleted: true, id, key: existing.key, note: 'Meter deactivated (soft delete)' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete billing meter');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. HIGH-LEVEL USAGE EVENT INGESTION
// ─────────────────────────────────────────────────────────────────────────────
// Validates the meter key against billing_meters, deduplicates by idempotency
// key, recomputes the aggregate, and back-pressure-protects via 429 on quota
// violations.

router.post(
  '/metering/ingest',
  authMiddleware(),
  meteringRateLimit,
  validateBody(ingestUsageEventSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof ingestUsageEventSchema>;
      const { tenantId, meterKey, quantity, occurredAt, idempotencyKey, dimensions, metadata } = body;

      // Tenant authorization: authenticated user must belong to the org they are reporting for,
      // unless they have an admin role or are an internal service agent.
      const isAdmin = req.user?.roles?.some((r) => ADMIN_ROLES.includes(r as typeof ADMIN_ROLES[number]));
      const isInternalAgent = req.isInternalAgent;
      if (!isAdmin && !isInternalAgent) {
        const callerOrgs = req.user?.orgs?.map((o) => o.orgId) ?? [];
        if (!callerOrgs.includes(tenantId)) {
          sendBadRequest(res, `Tenant authorization failed: caller does not belong to org ${tenantId}.`);
          return;
        }
      }

      // Validate the meter exists and is active
      const [meter] = await db
        .select()
        .from(billingMetersTable)
        .where(and(eq(billingMetersTable.key, meterKey), eq(billingMetersTable.isActive, true)))
        .limit(1);

      if (!meter) {
        sendBadRequest(res, `Unknown or inactive meter key: '${meterKey}'. Register the meter first via POST /metering/meters.`);
        return;
      }

      // Deduplicate via idempotency key
      const [event] = await db
        .insert(meteringEventsTable)
        .values({
          orgId: tenantId,
          eventType: `meter.${meterKey}`,
          featureKey: meterKey,
          product: meter.product,
          quantity: String(quantity),
          unitLabel: meter.unit,
          dimensions: dimensions ?? null,
          idempotencyKey: idempotencyKey ?? null,
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
          metadata: metadata ?? null,
        })
        .onConflictDoNothing()
        .returning();

      if (!event) {
        sendSuccess(res, {
          status: 'deduplicated',
          meterKey,
          idempotencyKey,
          tenantId,
        });
        return;
      }

      // Recompute aggregate in the background (non-blocking for hot path)
      void recomputeAggregate(tenantId, meterKey, meter.product, meter.aggregation);

      sendSuccess(res, {
        status: 'recorded',
        eventId: event.id,
        meterKey,
        quantity,
        tenantId,
        occurredAt: event.occurredAt,
      }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest usage event');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. REAL-TIME USAGE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
// Returns current-period usage per meter per tenant with progress against
// included allotments. Falls back to demo data when no events exist.

router.get(
  '/metering/dashboard',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const isAdmin = req.user?.roles?.some((r) => ADMIN_ROLES.includes(r as typeof ADMIN_ROLES[number]));
      const isInternal = req.isInternalAgent;

      const orgIdParam = req.query.orgId
        ? parseInt(req.query.orgId as string, 10)
        : req.tenantOrgId ?? undefined;

      // Non-admin callers can only view their own org's dashboard
      if (!isAdmin && !isInternal && orgIdParam) {
        const callerOrgs = req.user?.orgs?.map((o) => o.orgId) ?? [];
        if (!callerOrgs.includes(orgIdParam)) {
          sendBadRequest(res, 'Unauthorized: cannot view billing dashboard for another org.');
          return;
        }
      }

      const demoMode = req.query.demo === 'true' || !orgIdParam;
      const now = new Date();
      const { start: periodStart, end: periodEnd } = periodBounds('month', now);

      const meters = await db
        .select()
        .from(billingMetersTable)
        .where(eq(billingMetersTable.isActive, true))
        .orderBy(billingMetersTable.displayName);

      if (demoMode || !orgIdParam) {
        const demoData = meters.map((m) => buildDemoMeterUsage(m, periodStart, now));
        sendSuccess(res, {
          orgId: null,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          generatedAt: now.toISOString(),
          demoMode: true,
          meters: demoData,
        });
        return;
      }

      // Resolve org's active subscription plan to scope allotment lookup
      const [activeSub] = await db
        .select({ planId: subscriptionsTable.planId })
        .from(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.orgId, orgIdParam),
            eq(subscriptionsTable.status, 'active'),
          ),
        )
        .limit(1);

      // Real data: fetch usage aggregates + plan-scoped allotments for this org
      const [aggregates, allotments] = await Promise.all([
        db
          .select()
          .from(usageAggregatesTable)
          .where(
            and(
              eq(usageAggregatesTable.orgId, orgIdParam),
              eq(usageAggregatesTable.periodType, 'month'),
              gte(usageAggregatesTable.periodStart, periodStart),
              lte(usageAggregatesTable.periodEnd, periodEnd),
            ),
          ),
        activeSub
          ? db
              .select({
                allotment: billingMeterAllotmentsTable,
                meter: billingMetersTable,
              })
              .from(billingMeterAllotmentsTable)
              .innerJoin(
                billingMetersTable,
                eq(billingMeterAllotmentsTable.meterId, billingMetersTable.id),
              )
              .where(eq(billingMeterAllotmentsTable.planId, activeSub.planId))
          : Promise.resolve([]),
      ]);

      const aggByFeature = Object.fromEntries(
        aggregates.map((a) => [a.featureKey, a]),
      );

      const allotmentByMeterKey = Object.fromEntries(
        allotments.map((a) => [a.meter.key, a]),
      );

      const meterUsage = await Promise.all(
        meters.map(async (meter) => {
          const agg = aggByFeature[meter.key];
          const allotmentEntry = allotmentByMeterKey[meter.key];
          const currentQty = agg ? parseFloat(agg.totalQuantity) : 0;

          const includedUnits = allotmentEntry
            ? parseFloat(allotmentEntry.allotment.includedUnits)
            : parseFloat(meter.includedUnits);

          const overage = Math.max(0, currentQty - includedUnits);
          const pctOfAllotment = includedUnits > 0 ? Math.min(999, (currentQty / includedUnits) * 100) : null;

          // Projection: linear extrapolation over billing period
          const daysElapsed = Math.max(1, (now.getTime() - periodStart.getTime()) / 86400000);
          const daysInPeriod = (periodEnd.getTime() - periodStart.getTime()) / 86400000;
          const projectedEop = daysInPeriod > 0
            ? Math.round((currentQty / daysElapsed) * daysInPeriod)
            : currentQty;

          const overageUnitAmount = allotmentEntry?.allotment.overageUnitAmount
            ? parseFloat(allotmentEntry.allotment.overageUnitAmount)
            : meter.unitAmount
              ? parseFloat(meter.unitAmount)
              : 0;

          const projectedOverageCost = Math.max(0, projectedEop - includedUnits) * overageUnitAmount;

          return {
            meterKey: meter.key,
            displayName: meter.displayName,
            unit: meter.unit,
            aggregation: meter.aggregation,
            billingWindow: meter.billingWindow,
            currentUsage: currentQty,
            includedUnits,
            overage,
            pctOfAllotment: pctOfAllotment != null ? Math.round(pctOfAllotment * 10) / 10 : null,
            projectedEop,
            projectedOverageCost: Math.round(projectedOverageCost * 100) / 100,
            overageUnitAmount,
            eventCount: agg?.eventCount ?? 0,
            lastComputedAt: agg?.computedAt
              ? (typeof agg.computedAt === 'string' ? agg.computedAt : (agg.computedAt as Date).toISOString())
              : null,
            stripePriceId: allotmentEntry?.allotment.stripePriceId ?? meter.stripePriceId ?? null,
          };
        }),
      );

      // Include recent corrections for this org in current period
      const corrections = await db
        .select()
        .from(meteringCorrectionsTable)
        .where(
          and(
            eq(meteringCorrectionsTable.orgId, orgIdParam),
            gte(meteringCorrectionsTable.appliedAt, periodStart),
          ),
        )
        .orderBy(desc(meteringCorrectionsTable.appliedAt))
        .limit(20);

      sendSuccess(res, {
        orgId: orgIdParam,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        generatedAt: now.toISOString(),
        demoMode: false,
        meters: meterUsage,
        corrections,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get usage dashboard');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. USAGE CORRECTIONS (admin)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/metering/corrections',
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
      const meterKey = req.query.meterKey as string | undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? '100'), 10), 500);

      const conditions = [];
      if (orgId) conditions.push(eq(meteringCorrectionsTable.orgId, orgId));
      if (meterKey) conditions.push(eq(meteringCorrectionsTable.meterKey, meterKey));

      const corrections = await db
        .select({
          correction: meteringCorrectionsTable,
          orgName: organizationsTable.name,
        })
        .from(meteringCorrectionsTable)
        .innerJoin(organizationsTable, eq(meteringCorrectionsTable.orgId, organizationsTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(meteringCorrectionsTable.appliedAt))
        .limit(limit);

      sendSuccess(res, corrections);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list usage corrections');
    }
  },
);

router.post(
  '/metering/corrections',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  validateBody(correctionCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof correctionCreateSchema>;

      // Validate meter exists
      const [meter] = await db
        .select({
          id: billingMetersTable.id,
          key: billingMetersTable.key,
          product: billingMetersTable.product,
          aggregation: billingMetersTable.aggregation,
        })
        .from(billingMetersTable)
        .where(eq(billingMetersTable.key, body.meterKey))
        .limit(1);

      if (!meter) {
        sendBadRequest(res, `Unknown meter key: '${body.meterKey}'`);
        return;
      }

      const [correction] = await db
        .insert(meteringCorrectionsTable)
        .values({
          orgId: body.orgId,
          meterKey: body.meterKey,
          quantity: String(body.quantity),
          reasonCode: body.reasonCode,
          reason: body.reason ?? null,
          appliedToPeriodStart: body.appliedToPeriodStart ? new Date(body.appliedToPeriodStart) : null,
          appliedToPeriodEnd: body.appliedToPeriodEnd ? new Date(body.appliedToPeriodEnd) : null,
          createdBy: req.user?.id ?? null,
          metadata: body.metadata ?? null,
        })
        .returning();

      // Apply correction by injecting a synthetic metering event
      // so aggregates reflect it automatically on next recompute
      await db.insert(meteringEventsTable).values({
        orgId: body.orgId,
        eventType: `meter.correction.${body.reasonCode}`,
        featureKey: body.meterKey,
        product: meter.product,
        quantity: String(body.quantity),
        unitLabel: 'correction',
        idempotencyKey: `correction-${correction!.id}`,
        occurredAt: new Date(),
        metadata: {
          correctionId: correction!.id,
          reasonCode: body.reasonCode,
          reason: body.reason,
          appliedBy: req.user?.id,
        },
      }).onConflictDoNothing();

      void recomputeAggregate(body.orgId, body.meterKey, meter.product, meter.aggregation);

      logger.info(
        { correctionId: correction!.id, orgId: body.orgId, meterKey: body.meterKey, quantity: body.quantity },
        '[metered-billing] Correction applied',
      );

      sendSuccess(res, correction, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to apply usage correction');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. METER ALLOTMENTS (plan ↔ meter mapping)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/metering/allotments',
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const planId = req.query.planId ? parseInt(req.query.planId as string, 10) : undefined;
      const meterId = req.query.meterId ? parseInt(req.query.meterId as string, 10) : undefined;

      const conditions = [];
      if (planId) conditions.push(eq(billingMeterAllotmentsTable.planId, planId));
      if (meterId) conditions.push(eq(billingMeterAllotmentsTable.meterId, meterId));

      const allotments = await db
        .select({
          allotment: billingMeterAllotmentsTable,
          meter: billingMetersTable,
        })
        .from(billingMeterAllotmentsTable)
        .innerJoin(billingMetersTable, eq(billingMeterAllotmentsTable.meterId, billingMetersTable.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(billingMetersTable.displayName);

      sendSuccess(res, allotments);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list meter allotments');
    }
  },
);

router.post(
  '/metering/allotments',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  validateBody(allotmentCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof allotmentCreateSchema>;

      const [allotment] = await db
        .insert(billingMeterAllotmentsTable)
        .values({
          planId: body.planId,
          meterId: body.meterId,
          includedUnits: String(body.includedUnits),
          stripePriceId: body.stripePriceId ?? null,
          overageUnitAmount: body.overageUnitAmount != null ? String(body.overageUnitAmount) : null,
        })
        .onConflictDoUpdate({
          target: [billingMeterAllotmentsTable.planId, billingMeterAllotmentsTable.meterId],
          set: {
            includedUnits: String(body.includedUnits),
            stripePriceId: body.stripePriceId ?? null,
            overageUnitAmount: body.overageUnitAmount != null ? String(body.overageUnitAmount) : null,
          },
        })
        .returning();

      sendSuccess(res, allotment, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to upsert meter allotment');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. STRIPE USAGE RECORD SUBMISSION (admin / scheduled)
// ─────────────────────────────────────────────────────────────────────────────
// Manually trigger or test Stripe usage record reporting for an org.
// The scheduled job calls the underlying logic on the configured cadence.

router.post(
  '/metering/stripe/submit-usage',
  authMiddleware(),
  requireRole(...ADMIN_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { orgId, meterKey, dryRun } = req.body as {
        orgId?: number;
        meterKey?: string;
        dryRun?: boolean;
      };

      if (!orgId) {
        sendBadRequest(res, 'orgId is required');
        return;
      }

      const now = new Date();
      const { start: periodStart, end: periodEnd } = periodBounds('month', now);

      const meterConditions = [
        eq(billingMetersTable.isActive, true),
        ...(meterKey ? [eq(billingMetersTable.key, meterKey)] : []),
      ];

      const meters = await db
        .select()
        .from(billingMetersTable)
        .where(and(...meterConditions));

      const [org] = await db
        .select({ billingCustomerId: organizationsTable.billingCustomerId })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, orgId))
        .limit(1);

      const results: Array<{
        meterKey: string;
        currentUsage: number;
        stripeSubmitted: boolean;
        dryRun: boolean;
        error?: string;
      }> = [];

      for (const meter of meters) {
        const currentUsage = await computeBillableQty(
          orgId,
          meter.key,
          periodStart,
          periodEnd,
          (meter.aggregation as 'sum' | 'last' | 'unique_count') ?? 'sum',
        );

        if (dryRun || !org?.billingCustomerId || !meter.stripePriceId) {
          results.push({ meterKey: meter.key, currentUsage, stripeSubmitted: false, dryRun: true });
          continue;
        }

        try {
          const { services } = await import('@szl-holdings/services');
          if (services.stripe.isLive && meter.stripePriceId) {
            const subs = await db
              .select({ stripeSubscriptionId: subscriptionsTable.stripeSubscriptionId })
              .from(subscriptionsTable)
              .where(
                and(
                  eq(subscriptionsTable.orgId, orgId),
                  eq(subscriptionsTable.status, 'active'),
                ),
              )
              .limit(1);

            if (subs[0]?.stripeSubscriptionId) {
              await services.stripe.createMeteredUsageRecord(
                meter.stripePriceId,
                Math.round(currentUsage),
                'set',
                Math.floor(Date.now() / 1000),
              );
              results.push({ meterKey: meter.key, currentUsage, stripeSubmitted: true, dryRun: false });
              continue;
            }
          }
          results.push({ meterKey: meter.key, currentUsage, stripeSubmitted: false, dryRun: false, error: 'No active Stripe subscription found' });
        } catch (stripeErr) {
          const errMsg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
          results.push({ meterKey: meter.key, currentUsage, stripeSubmitted: false, dryRun: false, error: errMsg });
        }
      }

      sendSuccess(res, {
        orgId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        results,
        dryRun: !!dryRun,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit Stripe usage records');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. DEMO USAGE GENERATION
// ─────────────────────────────────────────────────────────────────────────────
// Generates plausible usage curves for well-known meter keys so dashboards
// render without real traffic. Only usable in non-production environments.

router.post(
  '/metering/demo/generate',
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        sendBadRequest(res, 'Demo usage generation is not available in production');
        return;
      }

      const { orgId, daysBack = 30 } = req.body as { orgId?: number; daysBack?: number };
      const targetOrgId = orgId ?? 1;

      const generated = await generateDemoUsage(targetOrgId, daysBack);

      sendSuccess(res, {
        generated,
        orgId: targetOrgId,
        daysBack,
        message: `Generated ${generated} demo usage events across platform meters`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate demo usage');
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildDemoMeterUsage(
  meter: typeof billingMetersTable.$inferSelect,
  periodStart: Date,
  now: Date,
) {
  const DEMO_PROFILES: Record<string, { current: number; allotment: number }> = {
    'lyte.decision_runs':  { current: 847,  allotment: 1000 },
    'sentra.scans':        { current: 412,  allotment: 500  },
    'vessels.alert_evals': { current: 1638, allotment: 2000 },
    'pulse.briefings':     { current: 22,   allotment: 30   },
    'agent.compute_mins':  { current: 489,  allotment: 600  },
    'api.calls':           { current: 8234, allotment: 10000 },
    'storage.gb':          { current: 3.4,  allotment: 5    },
  };

  const profile = DEMO_PROFILES[meter.key] ?? {
    current: Math.floor(parseFloat(meter.includedUnits) * 0.6),
    allotment: parseFloat(meter.includedUnits),
  };

  const daysElapsed = Math.max(1, (now.getTime() - periodStart.getTime()) / 86400000);
  const daysInMonth = 30;
  const projectedEop = Math.round((profile.current / daysElapsed) * daysInMonth);
  const overage = Math.max(0, profile.current - profile.allotment);
  const overageUnitAmount = meter.unitAmount ? parseFloat(meter.unitAmount) : 0;

  return {
    meterKey: meter.key,
    displayName: meter.displayName,
    unit: meter.unit,
    aggregation: meter.aggregation,
    billingWindow: meter.billingWindow,
    currentUsage: profile.current,
    includedUnits: profile.allotment,
    overage,
    pctOfAllotment: profile.allotment > 0
      ? Math.round((profile.current / profile.allotment) * 1000) / 10
      : null,
    projectedEop,
    projectedOverageCost: Math.round(Math.max(0, projectedEop - profile.allotment) * overageUnitAmount * 100) / 100,
    overageUnitAmount,
    eventCount: Math.floor(profile.current * 1.1),
    lastComputedAt: now.toISOString(),
    stripePriceId: meter.stripePriceId ?? null,
  };
}

export async function generateDemoUsage(orgId: number, daysBack: number): Promise<number> {
  const DEMO_METERS: Array<{ key: string; product: string; dailyRange: [number, number]; unit: string }> = [
    { key: 'lyte.decision_runs',  product: 'lyte',     dailyRange: [20, 60],   unit: 'run'      },
    { key: 'sentra.scans',        product: 'sentra',   dailyRange: [10, 30],   unit: 'scan'     },
    { key: 'vessels.alert_evals', product: 'vessels',  dailyRange: [40, 120],  unit: 'eval'     },
    { key: 'pulse.briefings',     product: 'pulse',    dailyRange: [0, 3],     unit: 'briefing' },
    { key: 'agent.compute_mins',  product: 'platform', dailyRange: [10, 40],   unit: 'min'      },
    { key: 'api.calls',           product: 'platform', dailyRange: [200, 600], unit: 'call'     },
  ];

  let totalGenerated = 0;

  for (const meterDef of DEMO_METERS) {
    const now = new Date();

    for (let dayOffset = daysBack; dayOffset >= 0; dayOffset--) {
      const dayStart = new Date(now);
      dayStart.setUTCDate(dayStart.getUTCDate() - dayOffset);
      dayStart.setUTCHours(0, 0, 0, 0);

      const [min, max] = meterDef.dailyRange;
      const dayQuantity = min + Math.floor(Math.random() * (max - min + 1));
      if (dayQuantity === 0) continue;

      // Spread across 1-5 events per day for realistic distribution
      const eventCount = 1 + Math.floor(Math.random() * 4);
      const quantities = distributeQuantity(dayQuantity, eventCount);

      for (let i = 0; i < quantities.length; i++) {
        const eventTime = new Date(dayStart);
        eventTime.setUTCHours(Math.floor(Math.random() * 24));
        eventTime.setUTCMinutes(Math.floor(Math.random() * 60));

        const idempotencyKey = `demo-${meterDef.key}-${orgId}-${dayOffset}-${i}`;

        await db
          .insert(meteringEventsTable)
          .values({
            orgId,
            eventType: `meter.${meterDef.key}`,
            featureKey: meterDef.key,
            product: meterDef.product,
            quantity: String(quantities[i]),
            unitLabel: meterDef.unit,
            idempotencyKey,
            occurredAt: eventTime,
            metadata: { demo: true, dayOffset },
          })
          .onConflictDoNothing();

        totalGenerated++;
      }

      void recomputeAggregate(orgId, meterDef.key, meterDef.product, 'sum');
    }
  }

  return totalGenerated;
}

function distributeQuantity(total: number, parts: number): number[] {
  if (parts <= 1) return [total];
  const result: number[] = [];
  let remaining = total;
  for (let i = 0; i < parts - 1; i++) {
    const chunk = Math.floor(Math.random() * (remaining / (parts - i)));
    result.push(chunk);
    remaining -= chunk;
  }
  result.push(remaining);
  return result;
}

export function register(r: IRouter): void {
  r.use(router);
}
