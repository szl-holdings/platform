/**
 * User Preferences API — thin wrapper over the user settings tier
 *
 * Endpoints:
 *   GET  /preferences          — return the current user's UI preferences
 *   PATCH /preferences         — batch-upsert one or more preference keys
 *
 * Namespace: szl.ui.preferences
 * Supported keys: sidebar_collapsed (boolean), notification_sound (boolean)
 *
 * UI preferences are stored with orgId = null so they are truly user-global
 * and apply consistently across all workspaces regardless of which org the
 * user is currently operating under.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db, userSettingsTable } from "@szl-holdings/db";
import { and, eq, isNull } from "drizzle-orm";
import {
  sendSuccess,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { validateBody, jsonObjectBodySchema } from "../lib/validation";

const router: IRouter = Router();

const NAMESPACE = "szl.ui.preferences";

const ALLOWED_KEYS = new Set(["sidebar_collapsed", "notification_sound"]);

type PrefKey = "sidebar_collapsed" | "notification_sound";

const DEFAULTS: Record<PrefKey, boolean> = {
  sidebar_collapsed: false,
  notification_sound: true,
};

/**
 * Load all user preferences for a given userId.
 * Reads only rows where orgId IS NULL (user-global scope).
 */
async function loadPreferences(userId: number): Promise<Record<PrefKey, boolean>> {
  const rows = await db
    .select()
    .from(userSettingsTable)
    .where(
      and(
        eq(userSettingsTable.userId, userId),
        isNull(userSettingsTable.orgId),
        eq(userSettingsTable.namespace, NAMESPACE),
      ),
    );

  const result = { ...DEFAULTS };
  for (const row of rows) {
    if (ALLOWED_KEYS.has(row.key)) {
      (result as Record<string, boolean>)[row.key] = row.value as boolean;
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /preferences
// ─────────────────────────────────────────────────────────────────────────────

router.get("/preferences", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const prefs = await loadPreferences(req.user!.id);
    sendSuccess(res, prefs);
  } catch (err) {
    handleRouteError(res, err, "Failed to load preferences");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /preferences
// ─────────────────────────────────────────────────────────────────────────────

router.patch(
  "/preferences",
  authMiddleware(),
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const body = req.body as Record<string, unknown>;

      const updates: Array<{ key: PrefKey; value: boolean }> = [];

      for (const [key, raw] of Object.entries(body)) {
        if (!ALLOWED_KEYS.has(key)) continue;
        if (typeof raw !== "boolean") {
          sendBadRequest(res, `Value for "${key}" must be a boolean`);
          return;
        }
        updates.push({ key: key as PrefKey, value: raw });
      }

      if (updates.length === 0) {
        sendBadRequest(
          res,
          "No valid preference keys provided. Allowed: " + [...ALLOWED_KEYS].join(", "),
        );
        return;
      }

      for (const { key, value } of updates) {
        // Look up existing row scoped to this user + null org (user-global)
        const [existing] = await db
          .select()
          .from(userSettingsTable)
          .where(
            and(
              eq(userSettingsTable.userId, userId),
              isNull(userSettingsTable.orgId),
              eq(userSettingsTable.namespace, NAMESPACE),
              eq(userSettingsTable.key, key),
            ),
          )
          .limit(1);

        if (existing) {
          await db
            .update(userSettingsTable)
            .set({ value: value as never, valueType: "boolean", updatedAt: new Date() })
            .where(eq(userSettingsTable.id, existing.id));
        } else {
          await db.insert(userSettingsTable).values({
            userId,
            orgId: null,
            namespace: NAMESPACE,
            key,
            value: value as never,
            valueType: "boolean",
          });
        }
      }

      const prefs = await loadPreferences(userId);
      sendSuccess(res, prefs);
    } catch (err) {
      handleRouteError(res, err, "Failed to save preferences");
    }
  },
);

export default router;
