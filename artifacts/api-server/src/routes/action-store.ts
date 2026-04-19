/**
 * Shared Action Store — server-persisted store for risk owner assignments,
 * risk action state, opportunity decisions, and recommendation decisions.
 *
 * Both the SZL Holdings Business State page and the Unified Command
 * Enterprise State page used to persist this data only to localStorage,
 * which meant assignments and decisions were per-browser and never visible
 * to other team members. This endpoint backs both pages so the whole team
 * sees the same synchronized state. localStorage is now used only as a
 * client-side cache.
 *
 * Endpoints (public, unauthenticated — same model as the rest of the
 * Business State / Enterprise State demo surfaces):
 *   GET   /api/action-store   — return the current shared store
 *   PATCH /api/action-store   — merge a partial update into the store and
 *                                return the resulting full store
 *
 * Storage: a single JSONB row in platform_settings
 *   namespace = "szl.actionStore"
 *   key       = "default"
 *
 * Merge semantics for PATCH:
 *   - Top-level keys present in the body are merged (per-id) into the
 *     existing store; unspecified top-level keys are left untouched.
 *   - Within a top-level key, an entry whose value is `null` is removed.
 *     This lets the client express "undo a decision" without having to
 *     send the whole store.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { db, platformSettingsTable } from "@szl-holdings/db";
import { and, eq } from "drizzle-orm";
import {
  sendSuccess,
  sendBadRequest,
  handleRouteError,
} from "../lib/api-response";
import { jsonObjectBodySchema, validateBody } from "../lib/validation";

const NAMESPACE = "szl.actionStore";
const KEY = "default";

const TOP_LEVEL_KEYS = ["riskOwners", "riskActions", "oppDecisions", "recDecisions"] as const;
type TopLevelKey = typeof TOP_LEVEL_KEYS[number];

type ActionStore = Record<TopLevelKey, Record<string, unknown>>;

const EMPTY_STORE: ActionStore = {
  riskOwners: {},
  riskActions: {},
  oppDecisions: {},
  recDecisions: {},
};

function normalize(raw: unknown): ActionStore {
  const out: ActionStore = { riskOwners: {}, riskActions: {}, oppDecisions: {}, recDecisions: {} };
  if (raw && typeof raw === "object") {
    for (const k of TOP_LEVEL_KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        out[k] = { ...(v as Record<string, unknown>) };
      }
    }
  }
  return out;
}

async function loadStore(): Promise<ActionStore> {
  try {
    const [row] = await db
      .select()
      .from(platformSettingsTable)
      .where(and(eq(platformSettingsTable.namespace, NAMESPACE), eq(platformSettingsTable.key, KEY)))
      .limit(1);
    if (!row) return { ...EMPTY_STORE, riskOwners: {}, riskActions: {}, oppDecisions: {}, recDecisions: {} };
    return normalize(row.value);
  } catch {
    return { riskOwners: {}, riskActions: {}, oppDecisions: {}, recDecisions: {} };
  }
}

async function saveStore(store: ActionStore): Promise<void> {
  const [existing] = await db
    .select({ id: platformSettingsTable.id })
    .from(platformSettingsTable)
    .where(and(eq(platformSettingsTable.namespace, NAMESPACE), eq(platformSettingsTable.key, KEY)))
    .limit(1);

  if (existing) {
    await db
      .update(platformSettingsTable)
      .set({ value: store as never, valueType: "json", updatedAt: new Date() })
      .where(eq(platformSettingsTable.id, existing.id));
  } else {
    await db.insert(platformSettingsTable).values({
      namespace: NAMESPACE,
      key: KEY,
      value: store as never,
      valueType: "json",
      category: "shared-state",
      isPublic: true,
    });
  }
}

function mergePatch(current: ActionStore, patch: Record<string, unknown>): ActionStore {
  const next: ActionStore = {
    riskOwners: { ...current.riskOwners },
    riskActions: { ...current.riskActions },
    oppDecisions: { ...current.oppDecisions },
    recDecisions: { ...current.recDecisions },
  };
  for (const key of TOP_LEVEL_KEYS) {
    const slice = patch[key];
    if (slice === undefined) continue;
    if (slice === null || typeof slice !== "object" || Array.isArray(slice)) continue;
    for (const [id, value] of Object.entries(slice as Record<string, unknown>)) {
      if (value === null) {
        delete next[key][id];
      } else {
        next[key][id] = value;
      }
    }
  }
  return next;
}

const router: IRouter = Router();

router.get("/action-store", async (_req: Request, res: Response) => {
  try {
    const store = await loadStore();
    sendSuccess(res, store);
  } catch (err) {
    handleRouteError(res, err, "Failed to load action store");
  }
});

router.patch(
  "/action-store",
  validateBody(jsonObjectBodySchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const hasAnyKnownKey = TOP_LEVEL_KEYS.some((k) => k in body);
      if (!hasAnyKnownKey) {
        sendBadRequest(
          res,
          `Body must include at least one of: ${TOP_LEVEL_KEYS.join(", ")}`,
        );
        return;
      }
      const current = await loadStore();
      const next = mergePatch(current, body);
      await saveStore(next);
      sendSuccess(res, next);
    } catch (err) {
      handleRouteError(res, err, "Failed to update action store");
    }
  },
);

export default router;
