/**
 * User Preferences API — thin wrapper over the user settings tier
 *
 * Endpoints:
 *   GET  /preferences          — return the current user's UI preferences
 *   PATCH /preferences         — batch-upsert one or more preference keys
 *
 * Namespace: szl.ui.preferences
 * Supported keys:
 *   sidebar_collapsed  (boolean)               — start with sidebar collapsed
 *   notification_sound (boolean)               — play audio cue on new notifications
 *   accent_color       (string | null)         — override the workspace accent (#RRGGBB) or null for default
 *   density            ("comfortable"|"compact") — global UI density
 *   time_zone          (string | null)         — IANA time zone for timestamp formatting, null = browser default
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

type PrefValue = boolean | string | null;
type PrefValueType = "boolean" | "string";

interface KeyDef {
  default: PrefValue;
  valueType: PrefValueType;
  /** Returns the canonicalized value, or `undefined` to signal an invalid input. */
  validate: (raw: unknown) => PrefValue | undefined;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const KEY_DEFS: Record<string, KeyDef> = {
  sidebar_collapsed: {
    default: false,
    valueType: "boolean",
    validate: (v) => (typeof v === "boolean" ? v : undefined),
  },
  notification_sound: {
    default: true,
    valueType: "boolean",
    validate: (v) => (typeof v === "boolean" ? v : undefined),
  },
  accent_color: {
    default: null,
    valueType: "string",
    validate: (v) => {
      if (v === null) return null;
      if (typeof v === "string" && HEX_COLOR_RE.test(v)) return v.toLowerCase();
      return undefined;
    },
  },
  density: {
    default: "comfortable",
    valueType: "string",
    validate: (v) => (v === "comfortable" || v === "compact" ? v : undefined),
  },
  time_zone: {
    default: null,
    valueType: "string",
    validate: (v) => {
      if (v === null) return null;
      if (typeof v !== "string" || v.length === 0 || v.length > 64) return undefined;
      try {
        // Throws RangeError for unknown / malformed IANA identifiers.
        new Intl.DateTimeFormat("en-US", { timeZone: v });
        return v;
      } catch {
        return undefined;
      }
    },
  },
};

const ALLOWED_KEYS = new Set(Object.keys(KEY_DEFS));

type Preferences = Record<string, PrefValue>;

function buildDefaults(): Preferences {
  const out: Preferences = {};
  for (const [k, def] of Object.entries(KEY_DEFS)) out[k] = def.default;
  return out;
}

/**
 * Load all user preferences for a given userId.
 * Reads only rows where orgId IS NULL (user-global scope).
 */
async function loadPreferences(userId: number): Promise<Preferences> {
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

  const result = buildDefaults();
  for (const row of rows) {
    const def = KEY_DEFS[row.key];
    if (!def) continue;
    const validated = def.validate(row.value as unknown);
    if (validated !== undefined) {
      result[row.key] = validated;
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

      const updates: Array<{ key: string; value: PrefValue; valueType: PrefValueType }> = [];

      for (const [key, raw] of Object.entries(body)) {
        const def = KEY_DEFS[key];
        if (!def) continue;
        const validated = def.validate(raw);
        if (validated === undefined) {
          sendBadRequest(res, `Invalid value for "${key}"`);
          return;
        }
        updates.push({ key, value: validated, valueType: def.valueType });
      }

      if (updates.length === 0) {
        sendBadRequest(
          res,
          "No valid preference keys provided. Allowed: " + [...ALLOWED_KEYS].join(", "),
        );
        return;
      }

      for (const { key, value, valueType } of updates) {
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
            .set({ value: value as never, valueType, updatedAt: new Date() })
            .where(eq(userSettingsTable.id, existing.id));
        } else {
          await db.insert(userSettingsTable).values({
            userId,
            orgId: null,
            namespace: NAMESPACE,
            key,
            value: value as never,
            valueType,
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
