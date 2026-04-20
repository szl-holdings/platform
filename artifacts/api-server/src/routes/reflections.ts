import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import {
  reflect,
  defaultReflectionStore,
  defaultCandidateSkillLibrary,
  TraceNotFoundError,
  type ReflectionStoreQuery,
} from "@workspace/reflection-engine";
import { authMiddleware } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  handleRouteError,
  sendNotFound,
  sendBadRequest,
} from "../lib/api-response";
import { validateBody, validateQuery, listQuerySchema } from "../lib/validation";

const router: IRouter = Router();

router.get("/reflections", authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const query: ReflectionStoreQuery = {};

    if (req.query.traceId) query.traceId = req.query.traceId as string;
    if (req.query.failureMode) query.failureMode = req.query.failureMode as string;

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

    const items = defaultReflectionStore.list(query);
    const filterQuery = { traceId: query.traceId, failureMode: query.failureMode };
    sendSuccess(res, {
      items,
      total: defaultReflectionStore.count(filterQuery),
      limit: rawLimit,
      offset: rawOffset,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to list reflections");
  }
});

router.get("/reflections/:id", authMiddleware(), async (req, res) => {
  try {
    const reflection = defaultReflectionStore.get(req.params.id as string);
    if (!reflection) {
      sendNotFound(res, "Reflection not found");
      return;
    }
    sendSuccess(res, reflection);
  } catch (err) {
    handleRouteError(res, err, "Failed to get reflection");
  }
});

router.post("/reflections", authMiddleware(), validateBody(bodyShape({
      "traceId": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const { traceId } = req.body as { traceId?: string };
    if (!traceId) {
      sendBadRequest(res, "traceId is required");
      return;
    }

    const reflection = await reflect(traceId);
    sendCreated(res, reflection);
  } catch (err) {
    if (err instanceof TraceNotFoundError) {
      sendNotFound(res, err.message);
      return;
    }
    handleRouteError(res, err, "Failed to run reflection");
  }
});

router.get("/reflections/by-trace/:traceId", authMiddleware(), async (req, res) => {
  try {
    const reflection = defaultReflectionStore.getByTrace(req.params.traceId as string);
    if (!reflection) {
      sendNotFound(res, "No reflection found for this trace");
      return;
    }
    sendSuccess(res, reflection);
  } catch (err) {
    handleRouteError(res, err, "Failed to get reflection by trace");
  }
});

export default router;
