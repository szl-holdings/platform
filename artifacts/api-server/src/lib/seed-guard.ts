import type { NextFunction, Request, Response } from 'express';

/**
 * Centralized production guard for seed/demo-data endpoints.
 *
 * ANY new route that mounts under a `/seed` path (or otherwise loads demo data)
 * MUST be protected by this guard. Either:
 *   1. Call `guardSeedInProduction(res)` at the top of the handler and
 *      `return` early when it returns `true`, OR
 *   2. Mount the `seedProductionGuard` Express middleware on the route.
 *
 * The guard treats either `NODE_ENV === "production"` or
 * `APP_ENV === "production"` as production and responds with HTTP 404 and
 * `{ error: "Not found", code: "SEED_DISABLED_IN_PRODUCTION" }` to avoid
 * advertising the existence of demo endpoints in production environments.
 */

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
}

/**
 * Inline guard. Returns `true` when the request was blocked (response sent).
 * Callers MUST `return` immediately when this returns `true`.
 *
 * Example:
 *   router.post("/foo/seed", ..., async (_req, res) => {
 *     if (guardSeedInProduction(res)) return;
 *     // ...seed work...
 *   });
 */
export function guardSeedInProduction(res: Response): boolean {
  if (isProductionEnvironment()) {
    res.status(404).json({ error: 'Not found', code: 'SEED_DISABLED_IN_PRODUCTION' });
    return true;
  }
  return false;
}

/**
 * Express middleware variant. Useful when registering routes declaratively.
 *
 * Example:
 *   router.post("/foo/seed", seedProductionGuard, handler);
 */
export function seedProductionGuard(_req: Request, res: Response, next: NextFunction): void {
  if (isProductionEnvironment()) {
    res.status(404).json({ error: 'Not found', code: 'SEED_DISABLED_IN_PRODUCTION' });
    return;
  }
  next();
}
