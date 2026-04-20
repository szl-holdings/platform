import { bodyShape } from '@szl-holdings/contracts/common';
import { db, platformSettingsTable } from '@szl-holdings/db';
import { and, eq } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  handleRouteError,
  sendBadRequest,
  sendCreated,
  sendError,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { adminGuard } from '../middlewares/admin-guard';
import { authMiddleware } from '../middlewares/auth';
import {
  createLinearIssue,
  isLinearConfigured,
  type LinearPriority,
  listLinearTeams,
} from '../services/linear-connector';

const router: IRouter = Router();

const VALID_PRIORITIES = new Set<number>([0, 1, 2, 3, 4]);
const SETTINGS_NAMESPACE = 'szl.linear';
const DEFAULT_TEAM_KEY = 'defaultTeamKey';
const AUTO_CREATE_LABELS_KEY = 'autoCreateLabels';

interface LinearSettings {
  defaultTeamKey: string | null;
  autoCreateLabels: boolean;
}

async function loadSetting(key: string): Promise<unknown> {
  const [row] = await db
    .select()
    .from(platformSettingsTable)
    .where(
      and(
        eq(platformSettingsTable.namespace, SETTINGS_NAMESPACE),
        eq(platformSettingsTable.key, key),
      ),
    )
    .limit(1);
  return row?.value;
}

async function loadSettings(): Promise<LinearSettings> {
  try {
    const teamRaw = await loadSetting(DEFAULT_TEAM_KEY);
    let defaultTeamKey: string | null = null;
    if (typeof teamRaw === 'string' && teamRaw.trim().length > 0) {
      defaultTeamKey = teamRaw;
    } else if (teamRaw && typeof teamRaw === 'object' && 'defaultTeamKey' in teamRaw) {
      const v = (teamRaw as { defaultTeamKey?: unknown }).defaultTeamKey;
      defaultTeamKey = typeof v === 'string' && v.trim().length > 0 ? v : null;
    }

    const autoRaw = await loadSetting(AUTO_CREATE_LABELS_KEY);
    let autoCreateLabels = true; // default on — restores closed-loop behaviour
    if (typeof autoRaw === 'boolean') {
      autoCreateLabels = autoRaw;
    } else if (typeof autoRaw === 'string') {
      autoCreateLabels = autoRaw === 'true';
    } else if (autoRaw && typeof autoRaw === 'object' && 'autoCreateLabels' in autoRaw) {
      const v = (autoRaw as { autoCreateLabels?: unknown }).autoCreateLabels;
      if (typeof v === 'boolean') autoCreateLabels = v;
    }

    return { defaultTeamKey, autoCreateLabels };
  } catch (err) {
    logger.warn({ err }, 'linear: failed to load settings');
    return { defaultTeamKey: null, autoCreateLabels: true };
  }
}

async function upsertSetting(
  key: string,
  value: unknown,
  valueType: 'string' | 'boolean',
  meta: { label: string; description: string },
): Promise<void> {
  const [existing] = await db
    .select({ id: platformSettingsTable.id })
    .from(platformSettingsTable)
    .where(
      and(
        eq(platformSettingsTable.namespace, SETTINGS_NAMESPACE),
        eq(platformSettingsTable.key, key),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(platformSettingsTable)
      .set({ value: value as never, valueType, updatedAt: new Date() })
      .where(eq(platformSettingsTable.id, existing.id));
  } else {
    await db.insert(platformSettingsTable).values({
      namespace: SETTINGS_NAMESPACE,
      key,
      value: value as never,
      valueType,
      category: 'integration',
      label: meta.label,
      description: meta.description,
      isPublic: true,
    });
  }
}

async function saveDefaultTeamKey(teamKey: string | null): Promise<void> {
  await upsertSetting(DEFAULT_TEAM_KEY, teamKey, 'string', {
    label: 'Linear default team key',
    description:
      'Linear team key (e.g. ENG) where new risk tickets land when the caller does not specify one.',
  });
}

async function saveAutoCreateLabels(enabled: boolean): Promise<void> {
  await upsertSetting(AUTO_CREATE_LABELS_KEY, enabled, 'boolean', {
    label: 'Linear auto-create missing labels',
    description:
      "When enabled, labels referenced on a risk ticket that don't exist in the Linear team are created automatically with a deterministic colour. When disabled, missing labels are returned in the create-ticket response as `skippedLabels` and surfaced as a warning in the operator UI.",
  });
}

router.get('/linear/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await loadSettings();
    sendSuccess(res, settings);
  } catch (err) {
    handleRouteError(res, err, 'Failed to load Linear settings');
  }
});

router.put(
  '/linear/settings',
  adminGuard,
  validateBody(
    bodyShape({
      autoCreateLabels: z.unknown().optional(),
      defaultTeamKey: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as { defaultTeamKey?: unknown; autoCreateLabels?: unknown };

      // defaultTeamKey: optional in PATCH-style updates, only validated when present.
      let nextTeam: string | null | undefined;
      if (body.defaultTeamKey !== undefined) {
        if (
          body.defaultTeamKey !== null &&
          (typeof body.defaultTeamKey !== 'string' || body.defaultTeamKey.length > 64)
        ) {
          sendBadRequest(res, 'defaultTeamKey must be a string (≤64 chars) or null');
          return;
        }
        nextTeam =
          typeof body.defaultTeamKey === 'string' && body.defaultTeamKey.trim().length > 0
            ? body.defaultTeamKey.trim()
            : null;
      }

      let nextAuto: boolean | undefined;
      if (body.autoCreateLabels !== undefined) {
        if (typeof body.autoCreateLabels !== 'boolean') {
          sendBadRequest(res, 'autoCreateLabels must be a boolean');
          return;
        }
        nextAuto = body.autoCreateLabels;
      }

      if (nextTeam !== undefined) await saveDefaultTeamKey(nextTeam);
      if (nextAuto !== undefined) await saveAutoCreateLabels(nextAuto);

      const settings = await loadSettings();
      sendSuccess(res, settings);
    } catch (err) {
      handleRouteError(res, err, 'Failed to update Linear settings');
    }
  },
);

router.get('/linear/teams', async (_req: Request, res: Response) => {
  try {
    if (!isLinearConfigured()) {
      sendError(
        res,
        'Linear connector is not configured in this environment',
        503,
        'LINEAR_NOT_CONFIGURED',
      );
      return;
    }
    const teams = await listLinearTeams();
    sendSuccess(res, { teams });
  } catch (err) {
    const message = (err as Error).message ?? '';
    if (message.includes('not authorized') || message.includes('not available')) {
      sendError(res, message, 503, 'LINEAR_NOT_CONNECTED');
      return;
    }
    handleRouteError(res, err, 'Failed to list Linear teams');
  }
});

router.post(
  '/linear/create-ticket',
  authMiddleware({ required: false }),
  validateBody(
    bodyShape({
      assigneeName: z.unknown().optional(),
      description: z.unknown().optional(),
      labels: z.unknown().optional(),
      priority: z.unknown().optional(),
      teamKey: z.unknown().optional(),
      title: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      if (!isLinearConfigured()) {
        sendError(
          res,
          'Linear connector is not configured in this environment',
          503,
          'LINEAR_NOT_CONFIGURED',
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

      if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
        sendBadRequest(res, 'title is required');
        return;
      }

      const priority =
        typeof body.priority === 'number' && VALID_PRIORITIES.has(body.priority)
          ? (body.priority as LinearPriority)
          : undefined;

      let labels: string[] | undefined;
      if (Array.isArray(body.labels)) {
        labels = body.labels
          .filter((l): l is string => typeof l === 'string' && l.trim().length > 0)
          .map((l) => l.trim())
          .slice(0, 20);
        if (labels.length === 0) labels = undefined;
      } else if (body.labels !== undefined && body.labels !== null) {
        sendBadRequest(res, 'labels must be an array of strings');
        return;
      }

      const settings = await loadSettings();
      let teamKey = body.teamKey;
      if (!teamKey || typeof teamKey !== 'string' || teamKey.trim().length === 0) {
        teamKey = settings.defaultTeamKey ?? undefined;
      }

      const issue = await createLinearIssue({
        title: body.title.trim(),
        description: body.description,
        priority,
        assigneeName: body.assigneeName,
        teamKey,
        labels,
        autoCreateLabels: settings.autoCreateLabels,
      });

      logger.info(
        {
          identifier: issue.identifier,
          url: issue.url,
          team: issue.team.key,
          requestedLabels: labels,
          appliedLabels: issue.appliedLabels,
          createdLabels: issue.createdLabels,
          skippedLabels: issue.skippedLabels,
          autoCreateLabels: settings.autoCreateLabels,
        },
        'linear: issue created',
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
        appliedLabels: issue.appliedLabels,
        createdLabels: issue.createdLabels,
        skippedLabels: issue.skippedLabels,
      });
    } catch (err) {
      const message = (err as Error).message ?? '';
      if (message.includes('not authorized') || message.includes('not available')) {
        sendError(res, message, 503, 'LINEAR_NOT_CONNECTED');
        return;
      }
      handleRouteError(res, err, 'Failed to create Linear issue');
    }
  },
);

export default router;
