import { Router, type IRouter } from "express";
import { db, activityLogTable } from "@szl-holdings/db";
import { desc, eq } from "drizzle-orm";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { readLimiter, writeLimiter } from "../middlewares/rate-limiters";

const router: IRouter = Router();

const DOCTRINE_ACTION_PREFIX = "doctrine:";

function isDoctrineAction(action: string): boolean {
  return action.startsWith(DOCTRINE_ACTION_PREFIX);
}

router.post("/doctrine/events", writeLimiter, async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.type || !body.sourceApp || !body.layer || !body.title) {
      sendError(res, "Missing required fields: type, sourceApp, layer, title", 400);
      return;
    }

    const action = `${DOCTRINE_ACTION_PREFIX}${body.layer}:${body.type}`;
    const resource = body.sourceApp;
    const resourceId = body.id ?? `${body.sourceApp}-${Date.now()}`;
    const description = body.description ?? body.title;
    const metadata = {
      doctrineLayer: body.layer,
      eventType: body.type,
      severity: body.severity ?? "info",
      title: body.title,
      entitiesInvolved: body.entitiesInvolved ?? [],
      context: body.context ?? null,
      explainability: body.explainability ?? null,
      emittedAt: body.timestamp ?? Date.now(),
    };

    const [inserted] = await db.insert(activityLogTable).values({
      action,
      resource,
      resourceId: String(resourceId),
      description,
      metadata,
    }).returning();

    sendSuccess(res, { id: inserted.id, action, resource, resourceId: inserted.resourceId });
  } catch (err) {
    handleRouteError(res, err, "Failed to persist doctrine event");
  }
});

router.get("/doctrine/events", readLimiter, authMiddleware({ required: false }), async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const layer = typeof req.query.layer === "string" ? req.query.layer : undefined;

    const rows = await db
      .select()
      .from(activityLogTable)
      .orderBy(desc(activityLogTable.createdAt))
      .limit(limit);

    const doctrineRows = rows.filter((r) => isDoctrineAction(r.action));

    const events = (layer
      ? doctrineRows.filter((r) => (r.metadata as { doctrineLayer?: string } | null)?.doctrineLayer === layer)
      : doctrineRows
    ).map((r) => {
      const meta = r.metadata as Record<string, unknown> | null ?? {};
      return {
        id: r.id,
        sourceApp: r.resource,
        layer: meta.doctrineLayer ?? "OBSERVE",
        type: meta.eventType ?? "observation",
        severity: meta.severity ?? "info",
        title: meta.title ?? r.description ?? r.action,
        description: r.description,
        entitiesInvolved: meta.entitiesInvolved ?? [],
        context: meta.context ?? null,
        timestamp: r.createdAt,
        metadata: meta,
      };
    });

    sendSuccess(res, { events, total: events.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch doctrine events");
  }
});

export default router;
