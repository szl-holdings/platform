import { Router, type IRouter, type Request, type Response } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import {
  reflect,
  defaultReflectionStore,
  defaultCandidateSkillLibrary,
  TraceNotFoundError,
  type ReflectionStoreQuery,
} from "@workspace/reflection-engine";
import { authMiddleware, type AuthenticatedUser } from "../middlewares/auth";
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

/**
 * Audit log for skill / strategy decisions made on reflections via the
 * Reflection Console. Decisions are stored in-memory, keyed by reflection
 * id, with one bucket per skill name and one bucket per strategy index.
 * This mirrors the durability of the reflection store itself, which is
 * also in-memory today; persistence is tracked as a follow-up and will
 * land together with a DB-backed reflection store.
 */
interface ReflectionDecisionAudit {
  decision: string;
  actorId: number | string | null;
  actorRole: string | null;
  note?: string;
  at: number;
}

interface ReflectionDecisionBucket {
  skills: Record<string, ReflectionDecisionAudit>;
  strategy: Record<string, ReflectionDecisionAudit>;
}

export const reflectionDecisions = new Map<string, ReflectionDecisionBucket>();

function getBucket(reflectionId: string): ReflectionDecisionBucket {
  let bucket = reflectionDecisions.get(reflectionId);
  if (!bucket) {
    bucket = { skills: {}, strategy: {} };
    reflectionDecisions.set(reflectionId, bucket);
  }
  return bucket;
}

function buildAudit(req: Request, decision: string): ReflectionDecisionAudit {
  const user = req.user as AuthenticatedUser | undefined;
  const note =
    typeof (req.body as { note?: unknown })?.note === "string"
      ? ((req.body as { note?: string }).note ?? "").slice(0, 500)
      : "";
  const audit: ReflectionDecisionAudit = {
    decision,
    actorId: user?.id ?? null,
    actorRole: user?.roles?.[0] ?? null,
    at: Date.now(),
  };
  if (note) audit.note = note;
  return audit;
}

const MAX_SKILL_NAME = 200;
const MAX_STRATEGY_INDEX = 99;

function validateSkillName(res: Response, skillName: string): boolean {
  if (!skillName || skillName.length > MAX_SKILL_NAME) {
    sendBadRequest(res, `skillName must be 1-${MAX_SKILL_NAME} characters`);
    return false;
  }
  return true;
}

function validateStrategyIndex(res: Response, indexParam: string): number | null {
  const index = parseInt(indexParam, 10);
  if (isNaN(index) || index < 0 || index > MAX_STRATEGY_INDEX) {
    sendBadRequest(res, `strategy index must be between 0 and ${MAX_STRATEGY_INDEX}`);
    return null;
  }
  return index;
}

function recordSkillDecision(
  req: Request,
  res: Response,
  decision: "adopted" | "rejected",
): void {
  const reflectionId = req.params.id as string;
  const skillName = req.params.skillName as string;
  if (!reflectionId) {
    sendBadRequest(res, "reflectionId is required");
    return;
  }
  if (!validateSkillName(res, skillName)) return;
  const audit = buildAudit(req, decision);
  const bucket = getBucket(reflectionId);
  bucket.skills[skillName] = audit;
  sendSuccess(res, {
    reflectionId,
    skillName,
    audit,
  });
}

function recordStrategyDecision(
  req: Request,
  res: Response,
  decision: "applied" | "deferred",
): void {
  const reflectionId = req.params.id as string;
  const indexParam = req.params.index as string;
  if (!reflectionId) {
    sendBadRequest(res, "reflectionId is required");
    return;
  }
  const index = validateStrategyIndex(res, indexParam);
  if (index === null) return;
  const audit = buildAudit(req, decision);
  const bucket = getBucket(reflectionId);
  bucket.strategy[String(index)] = audit;
  sendSuccess(res, {
    reflectionId,
    strategyIndex: index,
    audit,
  });
}

router.post(
  "/reflections/:id/skills/:skillName/adopt",
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      recordSkillDecision(req, res, "adopted");
    } catch (err) {
      handleRouteError(res, err, "Failed to adopt candidate skill");
    }
  },
);

router.post(
  "/reflections/:id/skills/:skillName/reject",
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      recordSkillDecision(req, res, "rejected");
    } catch (err) {
      handleRouteError(res, err, "Failed to reject candidate skill");
    }
  },
);

router.post(
  "/reflections/:id/strategy/:index/apply",
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      recordStrategyDecision(req, res, "applied");
    } catch (err) {
      handleRouteError(res, err, "Failed to apply strategy update");
    }
  },
);

router.post(
  "/reflections/:id/strategy/:index/defer",
  authMiddleware(),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      recordStrategyDecision(req, res, "deferred");
    } catch (err) {
      handleRouteError(res, err, "Failed to defer strategy update");
    }
  },
);

export default router;
