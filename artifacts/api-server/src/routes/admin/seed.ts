/**
 * Demo Seed Routes — Admin
 *
 * POST /admin/seed/reset-demo  — Resets the in-memory demo fixture store
 *   back to initial seeded state. Safe in all environments because it only
 *   touches the server-side demo fixture cache, never the live database.
 *
 * GET /admin/seed/demo-status  — Returns the current APP_MODE and fixture
 *   store stats (fixture count, last reset time).
 */

import type { IRouter } from "express";
import { logger } from "../../lib/logger.js";
import { demoFixtureStore } from "../../lib/demo-fixture-store.js";
import { validateBody, jsonObjectBodySchema } from "../../lib/validation";
import { guardSeedInProduction, isProductionEnvironment } from "../../lib/seed-guard.js";

let resetCount = 0;
let lastResetAt: string | null = null;

function isProductionMode(): boolean {
  // Honor RUNTIME_MODE explicitly (audit P0-001) in addition to NODE_ENV/APP_ENV.
  if ((process.env["RUNTIME_MODE"] ?? "").toLowerCase() === "production") {
    return true;
  }
  return isProductionEnvironment();
}

export function register(router: IRouter): void {
  router.post("/admin/seed/reset-demo", validateBody(jsonObjectBodySchema), (_req, res) => {
    if (isProductionMode()) {
      logger.warn(
        { runtimeMode: process.env["RUNTIME_MODE"], nodeEnv: process.env["NODE_ENV"] },
        "[demo-seed] Refused reset request — production guard active",
      );
      res.status(403).json({
        ok: false,
        error: "Forbidden",
        code: "SEED_DISABLED_IN_PRODUCTION",
        message: "Demo seed reset is disabled when RUNTIME_MODE or NODE_ENV is production.",
      });
      return;
    }
    if (guardSeedInProduction(res)) return;

    const appMode = (process.env["APP_MODE"] ?? "sandbox").toLowerCase();

    demoFixtureStore.reset();
    resetCount += 1;
    lastResetAt = new Date().toISOString();

    logger.info({ resetCount, at: lastResetAt, appMode }, "[demo-seed] Demo fixture store reset");

    res.status(200).json({
      ok: true,
      message: "Demo fixture store reset to initial seeded state.",
      appMode,
      fixtureCount: demoFixtureStore.size,
      resetCount,
      resetAt: lastResetAt,
    });
  });

  router.get("/admin/seed/demo-status", (_req, res) => {
    const appMode = (process.env["APP_MODE"] ?? "sandbox").toLowerCase();
    res.status(200).json({
      appMode,
      demoActive: appMode === "demo",
      fixtureCount: demoFixtureStore.size,
      resetCount,
      lastResetAt,
    });
  });
}
