import type { Request, Response, NextFunction } from "express";
import { db, featureFlagsTable } from "@szl-holdings/db";
import { eq } from "drizzle-orm";

const flagCache = new Map<string, { value: boolean; expiresAt: number }>();
const CACHE_TTL = 30_000;

async function isFlagEnabled(key: string): Promise<boolean> {
  const cached = flagCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const [flag] = await db
    .select({ isEnabled: featureFlagsTable.isEnabled })
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.key, key));

  const value = flag?.isEnabled ?? false;
  flagCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
}

export function requireFeatureFlag(flagKey: string, opts?: { disabledMessage?: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enabled = await isFlagEnabled(flagKey);
      if (!enabled) {
        res.status(403).json({
          error: "Feature not available",
          message: opts?.disabledMessage ?? `Feature '${flagKey}' is not enabled`,
          flagKey,
        });
        return;
      }
      next();
    } catch (err) {
      req.log?.warn({ err, flagKey }, "Feature flag check error — denying access (fail-closed)");
      res.status(503).json({
        error: "Feature flag evaluation failed",
        message: "Unable to evaluate feature flag. Access denied for safety.",
        flagKey,
      });
    }
  };
}

export async function getFeatureFlags(keys: string[]): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  for (const key of keys) {
    result[key] = await isFlagEnabled(key);
  }
  return result;
}
