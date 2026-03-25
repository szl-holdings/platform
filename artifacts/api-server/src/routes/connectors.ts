import { Router, type IRouter } from "express";
import { db, connectorsTable, connectorLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, sendNoContent, sendError, handleRouteError } from "../lib/api-response";
import { logActivity } from "../lib/activity-logger";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

const validConnectorTypes = ["stripe", "slack", "twilio", "google", "notion", "github", "shopify", "custom"] as const;
const validStatuses = ["active", "inactive", "error", "pending"] as const;

router.get("/connectors", authMiddleware(), async (_req, res) => {
  try {
    const connectors = await db.select().from(connectorsTable).orderBy(desc(connectorsTable.createdAt));
    sendSuccess(res, connectors);
  } catch (err) {
    handleRouteError(res, err, "Failed to list connectors");
  }
});

router.post("/connectors", authMiddleware(), requireRole("operator", "super_admin"), async (req, res) => {
  try {
    const { name, type, config, orgId } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      sendBadRequest(res, "Name is required and must be a non-empty string");
      return;
    }
    if (!type || !validConnectorTypes.includes(type)) {
      sendBadRequest(res, `Type must be one of: ${validConnectorTypes.join(", ")}`);
      return;
    }
    const [connector] = await db.insert(connectorsTable).values({
      name: name.trim(),
      type: type as (typeof validConnectorTypes)[number],
      config: config ?? null,
      orgId: orgId ?? null,
    }).returning();

    await logActivity(req, "create", "connector", String(connector.id));
    sendCreated(res, connector);
  } catch (err) {
    req.log?.error({ err }, "Failed to create connector");
    handleRouteError(res, err, "Failed to create connector");
  }
});

router.get("/connectors/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [connector] = await db.select().from(connectorsTable).where(eq(connectorsTable.id, id));
    if (!connector) {
      sendNotFound(res, "Connector");
      return;
    }
    sendSuccess(res, connector);
  } catch (err) {
    handleRouteError(res, err, "Failed to get connector");
  }
});

router.patch("/connectors/:id", authMiddleware(), requireRole("operator", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const { name, status, config, isEnabled } = req.body;
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      sendBadRequest(res, "Name must be a non-empty string");
      return;
    }
    if (status !== undefined && !validStatuses.includes(status)) {
      sendBadRequest(res, `Status must be one of: ${validStatuses.join(", ")}`);
      return;
    }
    if (isEnabled !== undefined && typeof isEnabled !== "boolean") {
      sendBadRequest(res, "isEnabled must be a boolean");
      return;
    }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (status !== undefined) updateData.status = status;
    if (config !== undefined) updateData.config = config;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

    const [connector] = await db.update(connectorsTable).set(updateData).where(eq(connectorsTable.id, id)).returning();
    if (!connector) {
      sendNotFound(res, "Connector");
      return;
    }
    await logActivity(req, "update", "connector", String(connector.id));
    sendSuccess(res, connector);
  } catch (err) {
    req.log?.error({ err }, "Failed to update connector");
    handleRouteError(res, err, "Failed to update connector");
  }
});

router.delete("/connectors/:id", authMiddleware(), requireRole("operator", "super_admin"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [connector] = await db.delete(connectorsTable).where(eq(connectorsTable.id, id)).returning();
    if (!connector) {
      sendNotFound(res, "Connector");
      return;
    }
    await logActivity(req, "delete", "connector", String(connector.id));
    sendNoContent(res);
  } catch (err) {
    req.log?.error({ err }, "Failed to delete connector");
    handleRouteError(res, err, "Failed to delete connector");
  }
});

router.get("/connectors/:id/logs", authMiddleware(), requireRole("operator", "analyst"), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const logs = await db.select().from(connectorLogsTable).where(eq(connectorLogsTable.connectorId, id)).orderBy(desc(connectorLogsTable.createdAt));
    sendSuccess(res, logs);
  } catch (err) {
    handleRouteError(res, err, "Failed to get connector logs");
  }
});

export default router;
