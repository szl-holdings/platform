import { Router, type IRouter, type Request, type Response } from "express";
import { db, platformSettingsTable } from "@szl-holdings/db";
import { and, eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { adminGuard } from "../middlewares/admin-guard";
import {
  sendCreated,
  sendSuccess,
  sendBadRequest,
  sendError,
  handleRouteError,
} from "../lib/api-response";
import { jsonObjectBodySchema, validateBody } from "../lib/validation";
import { logger } from "../lib/logger";
import {
  createLinearIssue,
  isLinearConfigured,
  listLinearTeams,
  type LinearPriority,
} from "../services/linear-connector";

const router: IRouter = Router();

const VALID_PRIORITIES = new Set<number>([0, 1, 2, 3, 4]);
const SETTINGS_NAMESPACE = "szl.linear";
const DEFAULT_TEAM_KEY = "defaultTeamKey";

interface LinearSettings {
  defaultTeamKey: string | null;
}

async function loadSettings(): Promise<LinearSettings> {
  try {
    const [row] = await db
      .select()
      .from(platformSettingsTable)
      .where(
        and(
          eq(platformSettingsTable.namespace, SETTINGS_NAMESPACE),
          eq(platformSettingsTable.key, DEFAULT_TEAM_KEY),
        ),
      )
      .limit(1);
    const value = row?.value;
    if (typeof value === "string" && value.trim().length > 0) {
      return { defaultTeamKey: value };
    }
    if (value && typeof value === "object" && "defaultTeamKey" in value) {
      const v = (value as { defaultTeamKey?: unknown }).defaultTeamKey;
      return { defaultTeamKey: typeof v === "string" && v.trim().length > 0 ? v : null };
    }
    return { defaultTeamKey: null };
  } catch (err) {
    logger.warn({ err }, "linear: failed to load settings");
    return { defaultTeamKey: null };
  }
}

async function saveDefaultTeamKey(teamKey: string | null): Promise<void> {
  const [existing] = await db
    .select({ id: platformSettingsTable.id })
    .from(platformSettingsTable)
    .where(
      and(
        eq(platformSettingsTable.namespace, SETTINGS_NAMESPACE),
        eq(platformSettingsTable.key, DEFAULT_TEAM_KEY),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(platformSettingsTable)
      .set({ value: teamKey as never, valueType: "string", updatedAt: new Date() })
      .where(eq(platformSettingsTable.id, existing.id));
  } else {
    await db.insert(platformSettingsTable).values({
      namespace: SETTINGS_NAMESPACE,
      key: DEFAULT_TEAM_KEY,
      value: teamKey as never,
      valueType: "string",
      category: "integration",
      label: "Linear default team key",
      description:
        "Linear team key (e.g. ENG) where new risk tickets land when the caller does not specify one.",
      isPublic: true,
    });
  }
}

router.get("/linear/settings", async (_req: Request, res: Response) => {
  try {
    const settings = await loadSettings();
    sendSuccess(res, settings);
  } catch (err) {
    handleRouteError(res, err, "Failed to load Linear settings");
  }
});

router.put(
  "/linear/settings",
  adminGuard,
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as { defaultTeamKey?: unknown };
      if (
        body.defaultTeamKey !== null &&
        body.defaultTeamKey !== undefined &&
        (typeof body.defaultTeamKey !== "string" || body.defaultTeamKey.length > 64)
      ) {
        sendBadRequest(res, "defaultTeamKey must be a string (≤64 chars) or null");
        return;
      }
      const next =
        typeof body.defaultTeamKey === "string" && body.defaultTeamKey.trim().length > 0
          ? body.defaultTeamKey.trim()
          : null;
      await saveDefaultTeamKey(next);
      sendSuccess(res, { defaultTeamKey: next });
    } catch (err) {
      handleRouteError(res, err, "Failed to update Linear settings");
    }
  },
);

router.get("/linear/teams", async (_req: Request, res: Response) => {
  try {
    if (!isLinearConfigured()) {
      sendError(
        res,
        "Linear connector is not configured in this environment",
        503,
        "LINEAR_NOT_CONFIGURED",
      );
      return;
    }
    const teams = await listLinearTeams();
    sendSuccess(res, { teams });
  } catch (err) {
    const message = (err as Error).message ?? "";
    if (message.includes("not authorized") || message.includes("not available")) {
      sendError(res, message, 503, "LINEAR_NOT_CONNECTED");
      return;
    }
    handleRouteError(res, err, "Failed to list Linear teams");
  }
});

router.post(
  "/linear/create-ticket",
  authMiddleware({ required: false }),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      if (!isLinearConfigured()) {
        sendError(
          res,
          "Linear connector is not configured in this environment",
          503,
          "LINEAR_NOT_CONFIGURED",
        );
        return;
      }

      const body = req.body as {
        title?: string;
        description?: string;
        priority?: number;
        assigneeName?: string;
        teamKey?: string;
        labels?: unknown;
      };

      if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
        sendBadRequest(res, "title is required");
        return;
      }

      const priority =
        typeof body.priority === "number" && VALID_PRIORITIES.has(body.priority)
          ? (body.priority as LinearPriority)
          : undefined;

      let labels: string[] | undefined;
      if (Array.isArray(body.labels)) {
        labels = body.labels
          .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
          .map((l) => l.trim())
          .slice(0, 20);
        if (labels.length === 0) labels = undefined;
      } else if (body.labels !== undefined && body.labels !== null) {
        sendBadRequest(res, "labels must be an array of strings");
        return;
      }

      let teamKey = body.teamKey;
      if (!teamKey || typeof teamKey !== "string" || teamKey.trim().length === 0) {
        const settings = await loadSettings();
        teamKey = settings.defaultTeamKey ?? undefined;
      }

      const issue = await createLinearIssue({
        title: body.title.trim(),
        description: body.description,
        priority,
        assigneeName: body.assigneeName,
        teamKey,
        labels,
      });

      logger.info(
        { identifier: issue.identifier, url: issue.url, team: issue.team.key, labels },
        "linear: issue created",
      );

      sendCreated(res, {
        id: issue.id,
        identifier: issue.identifier,
        url: issue.url,
        title: issue.title,
        priority: issue.priority,
        team: issue.team,
        assignee: issue.assignee,
        createdAt: issue.createdAt,
      });
    } catch (err) {
      const message = (err as Error).message ?? "";
      if (message.includes("not authorized") || message.includes("not available")) {
        sendError(res, message, 503, "LINEAR_NOT_CONNECTED");
        return;
      }
      handleRouteError(res, err, "Failed to create Linear issue");
    }
  },
);

export default router;
