import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@szl-holdings/db";
import {
  webhookEndpointsTable,
  webhookDeliveriesTable,
} from "@szl-holdings/db";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendBadRequest, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";

const webhookEndpointSchema = z.object({
  url: z.string().url("url must be a valid URL"),
  eventTypes: z.union([z.literal("*"), z.array(z.string())]).optional().default("*"),
  description: z.string().optional(),
});

const webhookEndpointUpdateSchema = z.object({
  url: z.string().url("url must be a valid URL").optional(),
  eventTypes: z.union([z.literal("*"), z.array(z.string())]).optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
});

const router: IRouter = Router();

export const SZL_EVENT_TYPES = [
  "payment.succeeded",
  "payment.failed",
  "subscription.created",
  "subscription.updated",
  "subscription.cancelled",
  "alert.raised",
  "alert.resolved",
  "workflow.started",
  "workflow.completed",
  "workflow.failed",
  "user.created",
  "user.updated",
  "deal.created",
  "deal.updated",
  "vulnerability.detected",
  "vessel.anomaly",
  "health.degraded",
  "health.restored",
  "ingestion.completed",
  "api.error_spike",
] as const;

export type SzlEventType = typeof SZL_EVENT_TYPES[number];

function generateWebhookSecret(): string {
  return "whsec_" + crypto.randomBytes(24).toString("hex");
}

function signPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = `${timestamp}.${payload}`;
  const sig = crypto.createHmac("sha256", secret).update(signed).digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

export async function deliverWebhookEvent(
  eventType: string,
  payload: Record<string, unknown>,
  options: { correlationId?: string } = {},
): Promise<void> {
  const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const wrappedPayload = {
    id: eventId,
    type: eventType,
    created: Math.floor(Date.now() / 1000),
    data: payload,
    ...(options.correlationId ? { correlation_id: options.correlationId } : {}),
  };

  let endpoints: Array<typeof webhookEndpointsTable.$inferSelect>;
  try {
    endpoints = await db.select().from(webhookEndpointsTable).where(eq(webhookEndpointsTable.isActive, true));
  } catch (err) {
    logger.error({ err }, "Failed to load webhook endpoints from DB");
    return;
  }

  for (const endpoint of endpoints) {
    const eventTypes = endpoint.eventTypes as string[] | "*";
    const eventMatches =
      eventTypes === "*" ||
      (Array.isArray(eventTypes) && eventTypes.includes(eventType));

    if (!eventMatches) continue;

    const deliveryId = `del_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    try {
      await db.insert(webhookDeliveriesTable).values({
        deliveryId,
        endpointId: endpoint.endpointId,
        eventType,
        payload: wrappedPayload as Record<string, unknown>,
        status: "pending",
        attempt: 1,
      });
    } catch (err) {
      logger.error({ err, endpointId: endpoint.endpointId }, "Failed to insert webhook delivery record");
    }

    setImmediate(async () => {
      await attemptWebhookDeliveryDb(deliveryId, endpoint, wrappedPayload, 1);
    });
  }
}

async function attemptWebhookDeliveryDb(
  deliveryId: string,
  endpoint: typeof webhookEndpointsTable.$inferSelect,
  wrappedPayload: Record<string, unknown>,
  attempt: number,
): Promise<void> {
  const bodyStr = JSON.stringify(wrappedPayload);
  const signature = signPayload(bodyStr, endpoint.secret);
  const eventType = (wrappedPayload.type as string) ?? "unknown";

  const maxRetries = 3;
  const retryDelays = [0, 30_000, 300_000];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SZL-Event": eventType,
        "X-SZL-Signature": signature,
        "X-SZL-Delivery": deliveryId,
        "User-Agent": "SZL-Webhooks/1.0",
      },
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      await db.update(webhookDeliveriesTable)
        .set({ status: "delivered", statusCode: res.status, attempt, deliveredAt: new Date() })
        .where(eq(webhookDeliveriesTable.deliveryId, deliveryId))
        .catch(() => {});

      await db.update(webhookEndpointsTable)
        .set({ lastDeliveredAt: new Date(), failureCount: 0, updatedAt: new Date() })
        .where(eq(webhookEndpointsTable.endpointId, endpoint.endpointId))
        .catch(() => {});

      logger.info({ endpointId: endpoint.endpointId, eventType, deliveryId }, "Webhook delivered");
    } else {
      await db.update(webhookEndpointsTable)
        .set({ failureCount: (endpoint.failureCount ?? 0) + 1, updatedAt: new Date() })
        .where(eq(webhookEndpointsTable.endpointId, endpoint.endpointId))
        .catch(() => {});

      logger.warn({ endpointId: endpoint.endpointId, status: res.status, attempt }, "Webhook delivery failed");

      if (attempt < maxRetries) {
        const delay = retryDelays[attempt] ?? 300_000;
        setTimeout(() => attemptWebhookDeliveryDb(deliveryId, endpoint, wrappedPayload, attempt + 1), delay);
      } else {
        await db.update(webhookDeliveriesTable)
          .set({ status: "failed", statusCode: res.status, attempt })
          .where(eq(webhookDeliveriesTable.deliveryId, deliveryId))
          .catch(() => {});
      }
    }
  } catch (err) {
    const errorMsg = (err as Error).message;
    await db.update(webhookEndpointsTable)
      .set({ failureCount: (endpoint.failureCount ?? 0) + 1, updatedAt: new Date() })
      .where(eq(webhookEndpointsTable.endpointId, endpoint.endpointId))
      .catch(() => {});

    logger.error({ err, endpointId: endpoint.endpointId, attempt }, "Webhook delivery error");

    if (attempt < maxRetries) {
      const delay = retryDelays[attempt] ?? 300_000;
      setTimeout(() => attemptWebhookDeliveryDb(deliveryId, endpoint, wrappedPayload, attempt + 1), delay);
    } else {
      await db.update(webhookDeliveriesTable)
        .set({ status: "failed", error: errorMsg, attempt })
        .where(eq(webhookDeliveriesTable.deliveryId, deliveryId))
        .catch(() => {});
    }
  }
}

router.get("/webhooks/endpoints", authMiddleware(), async (_req, res) => {
  try {
    const endpoints = await db.select().from(webhookEndpointsTable)
      .orderBy(desc(webhookEndpointsTable.createdAt));
    sendSuccess(res, endpoints.map((e) => ({
      id: e.endpointId,
      url: e.url,
      eventTypes: e.eventTypes,
      active: e.isActive,
      description: e.description,
      createdAt: e.createdAt.getTime(),
      lastDeliveredAt: e.lastDeliveredAt?.getTime(),
      failureCount: e.failureCount,
    })));
  } catch (err) {
    handleRouteError(res, err, "Failed to list webhook endpoints");
  }
});

router.post("/webhooks/endpoints", authMiddleware(), async (req: Request, res: Response) => {
  const parsed = webhookEndpointSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  try {
    const { url, eventTypes, description } = parsed.data;

    const endpointId = `whe_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const secret = generateWebhookSecret();

    await db.insert(webhookEndpointsTable).values({
      endpointId,
      url,
      secret,
      eventTypes: (eventTypes ?? "*") as unknown as Record<string, unknown>,
      description,
      isActive: true,
      failureCount: 0,
    });

    logger.info({ endpointId, url }, "Webhook endpoint registered");

    res.status(201).json({
      success: true,
      data: {
        id: endpointId,
        url,
        secret,
        eventTypes: eventTypes ?? "*",
        active: true,
        description,
        createdAt: Date.now(),
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create webhook endpoint");
  }
});

router.patch("/webhooks/endpoints/:id", authMiddleware(), async (req: Request, res: Response) => {
  const parsed = webhookEndpointUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, parsed.error.errors.map(e => e.message).join(", "), 400);
    return;
  }
  try {
    const [endpoint] = await db.select().from(webhookEndpointsTable)
      .where(eq(webhookEndpointsTable.endpointId, String(req.params.id))).limit(1);

    if (!endpoint) {
      sendNotFound(res, "Webhook endpoint");
      return;
    }

    const { url, eventTypes, active, description } = parsed.data;
    const updates: Partial<typeof webhookEndpointsTable.$inferInsert> = { updatedAt: new Date() };

    if (url !== undefined) updates.url = url;
    if (eventTypes !== undefined) updates.eventTypes = eventTypes as unknown as Record<string, unknown>;
    if (active !== undefined) updates.isActive = active;
    if (description !== undefined) updates.description = description;

    await db.update(webhookEndpointsTable)
      .set(updates)
      .where(eq(webhookEndpointsTable.endpointId, String(req.params.id)));

    sendSuccess(res, {
      id: endpoint.endpointId,
      url: url ?? endpoint.url,
      eventTypes: eventTypes ?? endpoint.eventTypes,
      active: active ?? endpoint.isActive,
      description: description ?? endpoint.description,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to update webhook endpoint");
  }
});

router.delete("/webhooks/endpoints/:id", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await db.delete(webhookEndpointsTable)
      .where(eq(webhookEndpointsTable.endpointId, String(req.params.id)));

    if (!result) {
      sendNotFound(res, "Webhook endpoint");
      return;
    }
    res.status(204).send();
  } catch (err) {
    handleRouteError(res, err, "Failed to delete webhook endpoint");
  }
});

router.post("/webhooks/endpoints/:id/ping", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const [endpoint] = await db.select().from(webhookEndpointsTable)
      .where(eq(webhookEndpointsTable.endpointId, String(req.params.id))).limit(1);

    if (!endpoint) {
      sendNotFound(res, "Webhook endpoint");
      return;
    }

    const pingPayload = {
      id: `ping_${Date.now()}`,
      type: "ping",
      created: Math.floor(Date.now() / 1000),
      data: { message: "SZL webhook ping test" },
    };
    const pingDeliveryId = `ping_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    await db.insert(webhookDeliveriesTable).values({
      deliveryId: pingDeliveryId,
      endpointId: endpoint.endpointId,
      eventType: "ping",
      payload: pingPayload as unknown as Record<string, unknown>,
      status: "pending",
      attempt: 1,
    }).catch(() => {});

    await attemptWebhookDeliveryDb(pingDeliveryId, endpoint, pingPayload, 1);

    const [updatedDelivery] = await db.select().from(webhookDeliveriesTable)
      .where(eq(webhookDeliveriesTable.deliveryId, pingDeliveryId)).limit(1);

    sendSuccess(res, {
      delivered: updatedDelivery?.status === "delivered",
      statusCode: updatedDelivery?.statusCode,
      error: updatedDelivery?.error,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to ping webhook endpoint");
  }
});

router.get("/webhooks/deliveries", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const endpointId = req.query.endpointId as string | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) ?? "50", 10), 200);

    const conditions = [];
    if (endpointId) conditions.push(eq(webhookDeliveriesTable.endpointId, endpointId));

    const deliveries = await db.select().from(webhookDeliveriesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(webhookDeliveriesTable.createdAt))
      .limit(limit);

    sendSuccess(res, deliveries.map((d) => ({
      id: d.deliveryId,
      endpointId: d.endpointId,
      eventType: d.eventType,
      status: d.status,
      statusCode: d.statusCode,
      attempt: d.attempt,
      deliveredAt: d.deliveredAt?.getTime(),
      error: d.error,
    })));
  } catch (err) {
    handleRouteError(res, err, "Failed to list webhook deliveries");
  }
});

router.get("/webhooks/event-types", (_req, res) => {
  sendSuccess(res, { eventTypes: SZL_EVENT_TYPES });
});

export default router;
