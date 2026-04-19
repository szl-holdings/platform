/**
 * Effective tier resolver — single source of truth for runtime tier
 * metadata (controls, risk level, description, tier number).
 *
 * Resolution order (matches GET /policies/tiers):
 *   1. Org-specific row in `guardian_tiers` for the given orgId.
 *   2. Global default row (`org_id IS NULL`).
 *   3. In-process constants from `@workspace/guardian/tiers.ts`.
 *
 * A small TTL cache keeps middleware hot-path calls cheap. Mutations to
 * `guardian_tiers` MUST call `invalidateEffectiveTierCache()` so changes
 * land everywhere immediately.
 */

import { and, eq, isNull, or } from "drizzle-orm";
import {
  POLICY_TIER_DESCRIPTIONS,
  TIER_CONTROLS,
  TIER_NUMBER,
  TIER_RISK_LEVEL,
  type PolicyTier,
  type TierControlSet,
} from "@workspace/guardian";
import { db, guardianTiersTable, type GuardianTier } from "@szl-holdings/db";
import { logger } from "./logger";

export interface EffectiveTier {
  tier: PolicyTier;
  tierNumber: number;
  description: string;
  riskLevel: number;
  /**
   * Persisted controls verbatim (or the constant default when nothing is
   * persisted). Surfaced through GET /policies/tiers so admins see exactly
   * what they configured.
   */
  controls: Record<string, unknown>;
  /**
   * Same shape as `TIER_CONTROLS[tier]`. Built by layering persisted
   * fields on top of the in-process constant set, so the decision engine
   * always has a complete `TierControlSet` even when admins persist only
   * a partial override.
   */
  effectiveControls: TierControlSet;
  enabled: boolean;
  source: "org-override" | "global-override" | "constant-default";
}

const CACHE_TTL_MS = parseInt(
  process.env.GUARDIAN_TIER_CACHE_TTL_MS ?? "30000",
  10,
);

interface CacheEntry {
  expiresAt: number;
  tiers: Map<PolicyTier, EffectiveTier>;
}

// Keyed by orgId (or "global" when no orgId).
const cache = new Map<string, CacheEntry>();

function cacheKey(orgId: number | null | undefined): string {
  return orgId == null ? "global" : `org:${orgId}`;
}

function constantTier(tier: PolicyTier): EffectiveTier {
  return {
    tier,
    tierNumber: TIER_NUMBER[tier],
    description: POLICY_TIER_DESCRIPTIONS[tier],
    riskLevel: TIER_RISK_LEVEL[tier],
    controls: TIER_CONTROLS[tier] as unknown as Record<string, unknown>,
    effectiveControls: TIER_CONTROLS[tier],
    enabled: true,
    source: "constant-default",
  };
}

function rowToEffective(row: GuardianTier): EffectiveTier {
  const tier = row.tier as PolicyTier;
  // Persisted controls are JSONB. We surface them verbatim through the
  // public API (so admins see exactly what they configured), but layer
  // them on top of the constant defaults to build a complete
  // TierControlSet for the decision engine — partial overrides must
  // still produce a safe, fully-populated control set.
  const persistedControls = (row.controls as Partial<TierControlSet> | null) ?? null;
  const effectiveControls: TierControlSet = persistedControls
    ? { ...TIER_CONTROLS[tier], ...persistedControls, tier }
    : TIER_CONTROLS[tier];
  return {
    tier,
    tierNumber: row.tierNumber,
    description: row.description,
    riskLevel: row.riskLevel,
    controls: (row.controls as Record<string, unknown> | null) ?? (TIER_CONTROLS[tier] as unknown as Record<string, unknown>),
    effectiveControls,
    enabled: row.enabled,
    source: row.orgId == null ? "global-override" : "org-override",
  };
}

async function loadEffectiveTiers(
  orgId: number | null | undefined,
): Promise<Map<PolicyTier, EffectiveTier>> {
  const result = new Map<PolicyTier, EffectiveTier>();

  if (!process.env.DATABASE_URL) {
    return result;
  }

  try {
    const orgFilter =
      orgId != null
        ? or(isNull(guardianTiersTable.orgId), eq(guardianTiersTable.orgId, orgId))
        : isNull(guardianTiersTable.orgId);

    const rows = await db
      .select()
      .from(guardianTiersTable)
      .where(and(eq(guardianTiersTable.enabled, true), orgFilter));

    for (const row of rows) {
      const tier = row.tier as PolicyTier;
      const existing = result.get(tier);
      // Org override beats global default for the same tier name.
      if (!existing || (existing.source === "global-override" && row.orgId != null)) {
        result.set(tier, rowToEffective(row));
      }
    }
  } catch (err) {
    logger.warn(
      { err, orgId },
      "[effective-tiers] Failed to load tier overrides — falling back to constants",
    );
  }

  return result;
}

async function getCacheEntry(orgId: number | null | undefined): Promise<CacheEntry> {
  const key = cacheKey(orgId);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached;

  const tiers = await loadEffectiveTiers(orgId);
  const entry: CacheEntry = { expiresAt: now + CACHE_TTL_MS, tiers };
  cache.set(key, entry);
  return entry;
}

/**
 * Resolve the effective definition for a single tier in the context of a
 * given organization. Org override → global override → in-process constant.
 */
export async function getEffectiveTier(
  orgId: number | null | undefined,
  tier: PolicyTier,
): Promise<EffectiveTier> {
  const entry = await getCacheEntry(orgId);
  const persisted = entry.tiers.get(tier);
  return persisted ?? constantTier(tier);
}

/**
 * Resolve only the runtime control set for a tier. Convenience wrapper used
 * by the decision engine override path.
 */
export async function getEffectiveTierControls(
  orgId: number | null | undefined,
  tier: PolicyTier,
): Promise<TierControlSet> {
  const t = await getEffectiveTier(orgId, tier);
  return t.effectiveControls;
}

/**
 * Resolve the per-call decision-engine override for a tier in a given org.
 * Returned object is safe to pass straight into `engine.decide(req, override)`.
 */
export async function getEffectiveTierOverride(
  orgId: number | null | undefined,
  tier: PolicyTier,
): Promise<{ controls: TierControlSet; riskLevel: number }> {
  const t = await getEffectiveTier(orgId, tier);
  return { controls: t.effectiveControls, riskLevel: t.riskLevel };
}

/**
 * Resolve every tier in the canonical taxonomy at once. Used by GET
 * /policies/tiers and by any dashboard that renders the full tier list.
 */
export async function getAllEffectiveTiers(
  orgId: number | null | undefined,
): Promise<EffectiveTier[]> {
  const entry = await getCacheEntry(orgId);
  const tiers: PolicyTier[] = [
    "advisory",
    "supervised",
    "operator-approved",
    "dual-approved",
    "regulated",
    "sovereign",
  ];
  return tiers.map((t) => entry.tiers.get(t) ?? constantTier(t));
}

/**
 * Drop cached tier definitions. Call after any mutation to
 * `guardian_tiers`. Pass an orgId to invalidate just one tenant; omit it
 * to invalidate everything (used after global-default writes).
 */
export function invalidateEffectiveTierCache(
  orgId?: number | null,
): void {
  if (orgId === undefined) {
    cache.clear();
    return;
  }
  cache.delete(cacheKey(orgId));
  // Org-scoped writes can also affect callers that requested the global
  // view (because we union them). Be conservative and clear the global
  // bucket too.
  if (orgId !== null) cache.delete(cacheKey(null));
}
