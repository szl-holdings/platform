import { Router, type IRouter } from "express";
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendBadRequest,
  handleRouteError,
  parsePagination,
} from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { pool } from "@szl-holdings/db";
import {
  defaultSelfModelStore,
  updateAfterRun,
  requestHelpIfBelowThreshold,
  CreateSelfModelSchema,
  RunOutcomeSchema,
  SELF_MODEL_VERSION,
} from "@workspace/self-model";
import { PoolSelfModelAdapter } from "../lib/self-model-db-adapter";
import { validateBody, jsonObjectBodySchema, validateQuery, listQuerySchema} from "../lib/validation";

/**
 * Wire the DB adapter into the store on first module import.
 * The NoOpPersistenceAdapter is replaced with the real pool-backed adapter
 * so that store.create / store.update automatically persist to self_models
 * and self_model_snapshots without any route-level DB logic.
 */
const dbAdapter = new PoolSelfModelAdapter(pool);
defaultSelfModelStore.setPersistenceAdapter(dbAdapter);

const router: IRouter = Router();

router.get("/self-model", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { agentId } = req.query;
    if (agentId) {
      const id = String(agentId);
      let model = defaultSelfModelStore.get(id);
      if (!model) {
        model = await defaultSelfModelStore.loadFromPersistence(id) ?? undefined;
      }
      if (!model) {
        sendNotFound(res, `No self-model found for agent: ${id}`);
        return;
      }
      sendSuccess(res, { model });
      return;
    }
    const inMemoryList = defaultSelfModelStore.list();
    if (inMemoryList.length > 0) {
      sendSuccess(res, { models: inMemoryList, total: inMemoryList.length });
      return;
    }
    const count = await defaultSelfModelStore.hydrateAll();
    const models = defaultSelfModelStore.list();
    sendSuccess(res, { models, total: count });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch self-model");
  }
});

router.get("/self-model/history", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { limit: parsedLimit, offset: parsedOffset } = parsePagination(req.query);
    const effectiveLimit = Math.min(parsedLimit, 200);
    const { agentId } = req.query;

    if (!agentId) {
      sendBadRequest(res, "agentId query parameter is required");
      return;
    }
    const id = String(agentId);

    const inMemoryHistory = defaultSelfModelStore.getHistory(id);
    if (inMemoryHistory.length > 0) {
      const page = inMemoryHistory.slice(parsedOffset, parsedOffset + effectiveLimit);
      sendSuccess(res, {
        snapshots: page,
        total: inMemoryHistory.length,
        limit: effectiveLimit,
        offset: parsedOffset,
      });
      return;
    }

    const snapshots = await dbAdapter.loadHistory(id, effectiveLimit, parsedOffset);
    sendSuccess(res, {
      snapshots,
      total: snapshots.length,
      limit: effectiveLimit,
      offset: parsedOffset,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch self-model history");
  }
});

router.post(
  "/self-model",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  validateBody(jsonObjectBodySchema), async (req, res) => {
    try {
      const parsed = CreateSelfModelSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.message);
        return;
      }
      const { agentId, ...rest } = parsed.data;

      if (defaultSelfModelStore.get(agentId)) {
        sendBadRequest(res, `A self-model already exists for agent: ${agentId}. Use PUT to update.`);
        return;
      }

      const model = defaultSelfModelStore.create({ agentId, ...rest });
      sendCreated(res, { model, agentId });
    } catch (err) {
      handleRouteError(res, err, "Failed to create self-model");
    }
  },
);

router.post(
  "/self-model/run-outcome",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  validateBody(jsonObjectBodySchema), async (req, res) => {
    try {
      const parsed = RunOutcomeSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, parsed.error.message);
        return;
      }
      const { agentId } = parsed.data;

      if (!defaultSelfModelStore.get(agentId)) {
        let restored = await defaultSelfModelStore.loadFromPersistence(agentId);
        if (!restored) {
          const identity = {
            runtimeId: agentId,
            name: `Auto-created for ${agentId}`,
            version: "0.0.0",
            environment: "production" as const,
            launchedAt: new Date().toISOString(),
          };
          defaultSelfModelStore.create({ agentId, identityProfile: identity });
        }
      }

      const result = updateAfterRun(agentId, parsed.data);
      sendSuccess(res, { result, agentId });
    } catch (err) {
      handleRouteError(res, err, "Failed to process run outcome");
    }
  },
);

router.post(
  "/self-model/check-threshold",
  authMiddleware(),
  requireRole("admin", "super_admin"),
  validateBody(jsonObjectBodySchema), async (req, res) => {
    try {
      const { agentId, metric } = req.body;
      if (!agentId || !metric) {
        sendBadRequest(res, "agentId and metric are required");
        return;
      }
      const helpRequest = requestHelpIfBelowThreshold(String(agentId), String(metric));
      sendSuccess(res, {
        helpRequest,
        thresholdBreached: helpRequest !== null,
        agentId,
        metric,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to check threshold");
    }
  },
);

router.get("/self-model/stats", authMiddleware(), (_req, res) => {
  try {
    const stats = defaultSelfModelStore.getStats();
    sendSuccess(res, {
      ...stats,
      packageVersion: SELF_MODEL_VERSION,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch self-model stats");
  }
});

export default router;
