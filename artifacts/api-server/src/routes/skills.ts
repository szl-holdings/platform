import { Router, type IRouter } from "express";
import {
  defaultSkillRegistry,
  defaultSkillRunStore,
  type SkillRegistryQuery,
} from "@workspace/skill-library/registry";
import {
  runSkill,
  SkillNotFoundError,
  SkillDisabledError,
  type SkillCategory,
} from "@workspace/skill-library";
import { authMiddleware } from "../middlewares/auth";
import {
  sendSuccess,
  sendCreated,
  handleRouteError,
  sendNotFound,
  sendBadRequest,
} from "../lib/api-response";

const router: IRouter = Router();

router.get("/skills", authMiddleware(), async (req, res) => {
  try {
    const query: SkillRegistryQuery = {};

    if (req.query.category) query.category = req.query.category as SkillCategory;
    if (req.query.enabled !== undefined)
      query.enabled = req.query.enabled === "true";
    if (req.query.isBuiltin !== undefined)
      query.isBuiltin = req.query.isBuiltin === "true";
    if (req.query.tag) query.tag = req.query.tag as string;

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

    const items = defaultSkillRegistry.listSkills(query);
    const total = defaultSkillRegistry.count({
      category: query.category,
      enabled: query.enabled,
      isBuiltin: query.isBuiltin,
      tag: query.tag,
    });

    sendSuccess(res, { items, total, limit: rawLimit, offset: rawOffset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list skills");
  }
});

router.get("/skills/:id", authMiddleware(), async (req, res) => {
  try {
    const skill = defaultSkillRegistry.getSkill(req.params.id);
    if (!skill) {
      sendNotFound(res, `Skill '${req.params.id}' not found`);
      return;
    }
    sendSuccess(res, skill);
  } catch (err) {
    handleRouteError(res, err, "Failed to get skill");
  }
});

router.post("/skills/:id/run", authMiddleware(), async (req, res) => {
  try {
    const { inputs = {} } = req.body as { inputs?: Record<string, unknown> };

    const run = await runSkill(req.params.id, inputs, {
      registry: defaultSkillRegistry,
      runStore: defaultSkillRunStore,
    });

    sendCreated(res, run);
  } catch (err) {
    if (err instanceof SkillNotFoundError) {
      sendNotFound(res, err.message);
      return;
    }
    if (err instanceof SkillDisabledError) {
      sendBadRequest(res, err.message);
      return;
    }
    handleRouteError(res, err, "Failed to run skill");
  }
});

router.get("/skills/:id/runs", authMiddleware(), async (req, res) => {
  try {
    const skill = defaultSkillRegistry.getSkill(req.params.id);
    if (!skill) {
      sendNotFound(res, `Skill '${req.params.id}' not found`);
      return;
    }

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

    const runs = defaultSkillRunStore.listRuns({
      skillId: req.params.id,
      limit: rawLimit,
      offset: rawOffset,
    });

    const total = defaultSkillRunStore.countRuns({ skillId: req.params.id });
    sendSuccess(res, { items: runs, total, limit: rawLimit, offset: rawOffset });
  } catch (err) {
    handleRouteError(res, err, "Failed to list skill runs");
  }
});

router.get("/skill-runs/:runId", authMiddleware(), async (req, res) => {
  try {
    const run = defaultSkillRunStore.getRun(req.params.runId);
    if (!run) {
      sendNotFound(res, `Skill run '${req.params.runId}' not found`);
      return;
    }
    sendSuccess(res, run);
  } catch (err) {
    handleRouteError(res, err, "Failed to get skill run");
  }
});

export default router;
