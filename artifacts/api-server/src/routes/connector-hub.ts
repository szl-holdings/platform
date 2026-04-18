import { Router } from "express";
import { connectorHub } from "@szl-holdings/services";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendSuccess, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

const router = Router();

router.get("/connector-hub/registry", authMiddleware(), async (_req, res) => {
  try {
    const registry = connectorHub.getRegistry();
    sendSuccess(res, {
      connectors: registry,
      total: registry.length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get connector registry");
  }
});

router.get("/connector-hub/registry/:connectorId", authMiddleware(), async (req, res) => {
  try {
    const entry = connectorHub.getRegistryEntry(req.params.connectorId as string);
    if (!entry) {
      sendNotFound(res, `Connector '${req.params.connectorId}' not found`);
      return;
    }
    sendSuccess(res, entry);
  } catch (err) {
    handleRouteError(res, err, "Failed to get connector registry entry");
  }
});

router.get("/connector-hub/capabilities", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { category, tags, connectorId, requiresAuth } = req.query;

    const results = connectorHub.discoverCapabilities({
      category: category as string | undefined,
      tags: tags ? String(tags).split(",").map((t) => t.trim()) : undefined,
      connectorId: connectorId as string | undefined,
      requiresAuth: requiresAuth !== undefined ? requiresAuth === "true" : undefined,
    });

    sendSuccess(res, {
      connectors: results,
      totalCapabilities: results.reduce((acc, c) => acc + c.capabilities.length, 0),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to discover capabilities");
  }
});

router.get("/connector-hub/agent-tools", authMiddleware(), async (_req, res) => {
  try {
    const tools = connectorHub.getAgentToolList();
    sendSuccess(res, {
      tools,
      total: tools.length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get agent tool list");
  }
});

router.get("/connector-hub/health", authMiddleware(), async (_req, res) => {
  try {
    const snapshot = await connectorHub.getSnapshot();
    sendSuccess(res, snapshot);
  } catch (err) {
    handleRouteError(res, err, "Failed to get connector hub health snapshot");
  }
});

router.get("/connector-hub/health/:connectorId", authMiddleware(), async (req, res) => {
  try {
    const connector = connectorHub.getConnector(req.params.connectorId as string);
    if (!connector) {
      sendNotFound(res, `Connector '${req.params.connectorId}' not found`);
      return;
    }
    const health = await connector.healthCheck();
    sendSuccess(res, health);
  } catch (err) {
    handleRouteError(res, err, "Failed to get connector health");
  }
});

router.post("/connector-hub/execute", authMiddleware(), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { connectorId, capabilityId, params } = req.body;

    if (!connectorId || typeof connectorId !== "string") {
      sendBadRequest(res, "connectorId is required");
      return;
    }
    if (!capabilityId || typeof capabilityId !== "string") {
      sendBadRequest(res, "capabilityId is required");
      return;
    }

    const connector = connectorHub.getConnector(connectorId);
    if (!connector) {
      sendNotFound(res, `Connector '${connectorId}' not found`);
      return;
    }

    const capability = connector.capabilities.find((c) => c.id === capabilityId);
    if (!capability) {
      sendBadRequest(res, `Capability '${capabilityId}' not found on connector '${connectorId}'`);
      return;
    }

    logger.info({ connectorId, capabilityId, params }, "Connector hub execute");
    const result = await connectorHub.execute(connectorId, capabilityId, params ?? {});
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to execute connector capability");
  }
});

router.patch("/connector-hub/connectors/:connectorId/toggle", authMiddleware(), requireRole("ops", "super_admin"), validateBody(jsonObjectBodySchema), async (req, res) => {
  try {
    const { connectorId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      sendBadRequest(res, "enabled must be a boolean");
      return;
    }

    const success = connectorHub.setConnectorEnabled(connectorId as string, enabled);
    if (!success) {
      sendNotFound(res, `Connector '${connectorId}' not found`);
      return;
    }

    logger.info({ connectorId, enabled }, "Connector hub toggle");
    sendSuccess(res, { connectorId, enabled, message: `Connector '${connectorId}' ${enabled ? "enabled" : "disabled"}` });
  } catch (err) {
    handleRouteError(res, err, "Failed to toggle connector");
  }
});

export default router;
