/**
 * boot-orchestrator.ts
 *
 * OBS-007 root-cause mitigation.
 *
 * Cold-start used to fan out ~11 seed* helpers as concurrent
 * fire-and-forget promises (`seedPlatformData`, `seedMspData`,
 * `seedDreamscapeData`, `seedConstellationData`, `seedLyteActions`,
 * `seedLyteSurfaces`, `seedTerraPortfolioModules`, `seedGuardianDefaults`,
 * `seedGuardianTiers`, `seedKnowledgeBase`, `initIngestionFramework`)
 * plus an additional `runOpsMgmtBootInit` chain on a 60-second
 * setTimeout. Each helper opens many short-lived pool checkouts; together
 * they exceeded `DB_POOL_MAX=10` and produced ~30 long-checkout
 * (>30 s) warnings per cold start.
 *
 * This module replaces both patterns with one **serialised** chain:
 *
 *   1) Each seed runs `await`-style, one at a time, behind try/catch so a
 *      single failure cannot abort the chain.
 *   2) `runOpsMgmtBootInit` runs at the end, replacing the previous
 *      stand-alone 60 s setTimeout in `routes/ops-management.ts`.
 *   3) Once the chain finishes, `markOpsReady()` flips an internal flag
 *      and admin `/ops/*` routes that depend on the seeded schema stop
 *      returning 503.
 *
 * The 503 gate (`requireOpsReady`) addresses the prior design's
 * regression: a 60 s blanket deferral made `/ops` endpoints silently
 * read pre-seed state for the first minute. With the gate, callers get
 * an explicit 503 + Retry-After header until the seed chain completes
 * (typically a few hundred ms).
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { logger } from './logger';

export interface SeedTask {
  /** Short identifier used in logs (e.g. 'seedPlatformData'). */
  name: string;
  /** The seed function to await; thrown errors are caught and logged. */
  fn: () => Promise<unknown> | unknown;
}

let opsReady = false;
const opsReadyWaiters: Array<() => void> = [];

/** Returns true once `markOpsReady()` has been called at least once. */
export function isOpsReady(): boolean {
  return opsReady;
}

/** Idempotently flip the ops-ready flag and wake any waiters. */
export function markOpsReady(): void {
  if (opsReady) return;
  opsReady = true;
  const waiters = opsReadyWaiters.splice(0, opsReadyWaiters.length);
  for (const w of waiters) {
    try {
      w();
    } catch {
      /* ignore */
    }
  }
}

/** Test-only — reset the gate so subsequent assertions start from "not ready". */
export function _resetOpsReadyForTests(): void {
  opsReady = false;
  opsReadyWaiters.length = 0;
}

/** Resolve when ops becomes ready (or immediately if already ready). */
export function whenOpsReady(): Promise<void> {
  if (opsReady) return Promise.resolve();
  return new Promise<void>((resolve) => {
    opsReadyWaiters.push(resolve);
  });
}

/**
 * Express middleware: 503 with Retry-After until `markOpsReady()` is called.
 *
 * Use only for routes that depend on schema/seed state produced by the
 * boot chain (e.g. `/ops/*` admin endpoints). Read-only public endpoints
 * should remain accessible during boot.
 */
export const requireOpsReady: RequestHandler = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (opsReady) {
    next();
    return;
  }
  res.setHeader('Retry-After', '5');
  res.status(503).json({
    error: 'service_initializing',
    message:
      'Ops management subsystem is still initialising. Retry shortly. Use /api/health for liveness probes.',
    retryAfterSeconds: 5,
  });
};

/**
 * Run an array of seed tasks one at a time. Each task is awaited, with
 * thrown errors caught and logged so a single failing seed cannot abort
 * the rest of the chain.
 *
 * Returns a summary of which tasks succeeded vs. failed for tests and
 * observability.
 */
export async function runBootSeedSequence(
  tasks: SeedTask[],
): Promise<{ ok: string[]; failed: Array<{ name: string; err: unknown }>; durationMs: number }> {
  const start = Date.now();
  const ok: string[] = [];
  const failed: Array<{ name: string; err: unknown }> = [];

  for (const task of tasks) {
    const taskStart = Date.now();
    try {
      await task.fn();
      ok.push(task.name);
      logger.debug(
        { task: task.name, durationMs: Date.now() - taskStart },
        '[boot-seed] task complete',
      );
    } catch (err) {
      failed.push({ name: task.name, err });
      logger.warn(
        { err, task: task.name, durationMs: Date.now() - taskStart },
        '[boot-seed] task failed (non-fatal, continuing chain)',
      );
    }
  }

  const durationMs = Date.now() - start;
  logger.info(
    { ok: ok.length, failed: failed.length, durationMs },
    '[boot-seed] sequenced chain complete',
  );
  return { ok, failed, durationMs };
}
