import { Router, type IRouter } from "express";
import {
  createPlan,
  replayPlan,
  defaultPlanStore,
  PlanContextSchema,
  PlanNotFoundError,
  type PlanStoreQuery,
} from "@workspace/planner";
import { authMiddleware } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  handleRouteError,
  sendNotFound,
  sendBadRequest,
} from "../lib/api-response";

const router: IRouter = Router();

router.get("/plans", authMiddleware(), async (req, res) => {
  try {
    const query: PlanStoreQuery = {};
    if (req.query.objective) query.objective = req.query.objective as string;
    if (req.query.status) query.status = req.query.status as PlanStoreQuery["status"];
    if (req.query.agentId) query.agentId = req.query.agentId as string;
    if (req.query.sessionId) query.sessionId = req.query.sessionId as string;

    const rawLimit = parseInt((req.query.limit as string) ?? "50", 10);
    const rawOffset = parseInt((req.query.offset as string) ?? "0", 10);
    if (isNaN(rawLimit) || rawLimit < 1 || rawLimit > 500) {
      sendBadRequest(res, "limit must be between 1 and 500");
      return;
    }
    if (isNaN(rawOffset) || rawOffset < 0) {
      sendBadRequest(res, "offset must be >= 0");
      return;
    }
    query.limit = rawLimit;
    query.offset = rawOffset;

    const items = await defaultPlanStore.list(query);
    const total = await defaultPlanStore.count({
      objective: query.objective,
      status: query.status,
      agentId: query.agentId,
      sessionId: query.sessionId,
    });
    sendSuccess(res, { items, total, limit: rawLimit, offset: rawOffset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list plans");
  }
});

router.get("/plans/:id", authMiddleware(), async (req, res) => {
  try {
    const plan = await defaultPlanStore.get(req.params.id);
    if (!plan) {
      sendNotFound(res, "Plan not found");
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    handleRouteError(res, err, "Failed to get plan");
  }
});

router.post("/plans", authMiddleware(), async (req, res) => {
  try {
    const { objective, context } = req.body as {
      objective?: string;
      context?: unknown;
    };
    if (!objective || typeof objective !== "string" || !objective.trim()) {
      sendBadRequest(res, "objective is required");
      return;
    }
    const ctxParse = PlanContextSchema.safeParse(context ?? {});
    if (!ctxParse.success) {
      sendBadRequest(res, `Invalid context: ${ctxParse.error.message}`);
      return;
    }
    const result = await createPlan(objective, ctxParse.data);
    sendCreated(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to create plan");
  }
});

router.post("/plans/:id/replay", authMiddleware(), async (req, res) => {
  try {
    const result = await replayPlan(req.params.id);
    sendSuccess(res, result);
  } catch (err) {
    if (err instanceof PlanNotFoundError) {
      sendNotFound(res, err.message);
      return;
    }
    handleRouteError(res, err, "Failed to replay plan");
  }
});

export default router;
