import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  meteringEventsTable,
  usageAggregatesTable,
  rateCardsTable,
  rateCardTiersTable,
  rateCardAssignmentsTable,
  quotaConfigsTable,
  quotaViolationsTable,
  costAllocationsTable,
  billingLineItemsTable,
  organizationsTable,
  invoicesTable,
  subscriptionsTable,
  revenueEventsTable,
} from "@szl-holdings/db";
import {
  eq, desc, asc, and, gte, lte, sql, sum, count, avg, isNull, ne, inArray,
} from "drizzle-orm";
import {
  sendSuccess, sendNotFound, sendError, sendBadRequest, handleRouteError,
} from "../../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../../middlewares/auth";
import { tenantScope, assertTenantAccess } from "../../middlewares/tenant-scope";
import { logger } from "../../lib/logger";
import { periodBounds, computeCharge, recomputeAggregate, checkAndEnforceQuota, meteringRateLimit } from "./shared";
import {validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../../lib/validation";

const router: IRouter = Router();
const ADMIN_ROLES = ["admin", "super_admin", "ops"] as const;
const READ_ROLES = ["admin", "super_admin", "ops", "analyst"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. METERING EVENTS
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  "/metering/events",
  authMiddleware({ required: false }),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const {
        orgId,
        userId,
        eventType,
        featureKey,
        product,
        quantity,
        unitLabel,
        dimensions,
        idempotencyKey,
        occurredAt,
        metadata,
      } = req.body as {
        orgId: number;
        userId?: number;
        eventType: string;
        featureKey: string;
        product?: string;
        quantity?: number;
        unitLabel?: string;
        dimensions?: Record<string, unknown>;
        idempotencyKey?: string;
        occurredAt?: string;
        metadata?: Record<string, unknown>;
      };

      if (!orgId || !eventType || !featureKey) {
        sendBadRequest(res, "orgId, eventType, and featureKey are required");
        return;
      }

      const qty = quantity ?? 1;

      const quotaCheck = await checkAndEnforceQuota(orgId, featureKey, qty);
      if (!quotaCheck.allowed) {
        res.status(429).json({
          error: "quota_exceeded",
          message: quotaCheck.reason,
          violation: quotaCheck.violation,
          featureKey,
        });
        return;
      }

      const [event] = await db
        .insert(meteringEventsTable)
        .values({
          orgId,
          userId: userId ?? null,
          eventType,
          featureKey,
          product: product ?? "platform",
          quantity: String(qty),
          unitLabel: unitLabel ?? "unit",
          dimensions: dimensions ?? null,
          idempotencyKey: idempotencyKey ?? null,
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
          metadata: metadata ?? null,
        })
        .onConflictDoNothing()
        .returning();

      await recomputeAggregate(orgId, featureKey, product ?? "platform");

      if (!event) {
        sendSuccess(res, { status: "deduplicated", idempotencyKey });
        return;
      }

      sendSuccess(res, { status: "recorded", event });
    } catch (err) {
      handleRouteError(res, err, "Failed to record metering event");
    }
  },
);

router.post(
  "/metering/events/batch",
  authMiddleware({ required: false }),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const { events } = req.body as {
        events: Array<{
          orgId: number;
          userId?: number;
          eventType: string;
          featureKey: string;
          product?: string;
          quantity?: number;
          unitLabel?: string;
          dimensions?: Record<string, unknown>;
          idempotencyKey?: string;
          occurredAt?: string;
          metadata?: Record<string, unknown>;
        }>;
      };

      if (!Array.isArray(events) || events.length === 0) {
        sendBadRequest(res, "events array is required and must not be empty");
        return;
      }

      if (events.length > 500) {
        sendBadRequest(res, "Batch size exceeds maximum of 500 events");
        return;
      }

      const rows = events.map((e) => ({
        orgId: e.orgId,
        userId: e.userId ?? null,
        eventType: e.eventType,
        featureKey: e.featureKey,
        product: e.product ?? "platform",
        quantity: String(e.quantity ?? 1),
        unitLabel: e.unitLabel ?? "unit",
        dimensions: e.dimensions ?? null,
        idempotencyKey: e.idempotencyKey ?? null,
        occurredAt: e.occurredAt ? new Date(e.occurredAt) : new Date(),
        metadata: e.metadata ?? null,
      }));

      const inserted = await db
        .insert(meteringEventsTable)
        .values(rows)
        .onConflictDoNothing()
        .returning({ id: meteringEventsTable.id });

      const touched = new Set<string>();
      for (const e of events) {
        touched.add(`${e.orgId}:${e.featureKey}:${e.product ?? "platform"}`);
      }
      await Promise.all(
        [...touched].map((k) => {
          const [orgId, featureKey, product] = k.split(":");
          return recomputeAggregate(parseInt(orgId!, 10), featureKey!, product!);
        }),
      );

      sendSuccess(res, {
        recorded: inserted.length,
        deduplicated: events.length - inserted.length,
        total: events.length,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to batch record metering events");
    }
  },
);

router.get(
  "/metering/events",
  authMiddleware(),
  requireRole(...READ_ROLES),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const orgId = req.query.orgId ? parseInt(req.query.orgId as string, 10) : undefined;
      const featureKey = req.query.featureKey as string | undefined;
      const product = req.query.product as string | undefined;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;
      const until = req.query.until ? new Date(req.query.until as string) : undefined;
      const limit = Math.min(parseInt(String(req.query.limit ?? "100"), 10), 1000);

      const conditions = [];
      if (orgId) conditions.push(eq(meteringEventsTable.orgId, orgId));
      if (featureKey) conditions.push(eq(meteringEventsTable.featureKey, featureKey));
      if (product) conditions.push(eq(meteringEventsTable.product, product));
      if (since) conditions.push(gte(meteringEventsTable.occurredAt, since));
      if (until) conditions.push(lte(meteringEventsTable.occurredAt, until));

      const events = await db
        .select()
        .from(meteringEventsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(meteringEventsTable.occurredAt))
        .limit(limit);

      sendSuccess(res, events);
    } catch (err) {
      handleRouteError(res, err, "Failed to list metering events");
    }
  },
);


export function register(r: IRouter): void { r.use(router); }
