/**
 * Putnam-2025 harness — read-only result surface.
 *
 * Exposes the canonical leaderboard.json + gauge.json produced by
 * `packages/putnam-harness` (cli/eval-live.ts + cli/aggregate.ts) so the
 * agi-forecast dashboard and any operator inspecting the platform can
 * see the live numbers without re-running the eval.
 *
 * Honesty rules (Doctrine V6):
 *   - We serve the LATEST canonical-* directory only. No fabrication.
 *   - If no canonical run exists, we 200 with `present:false` (warming up).
 *   - The receipts themselves carry hashes, nonces, tokens, wall-ms and
 *     model/primitive rosters. We do not reformulate them.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

const HARNESS_DIST = join(
  process.cwd(),
  '..',
  '..',
  'packages',
  'putnam-harness',
  'dist',
  'eval',
);

function latestCanonicalDir(): string | null {
  if (!existsSync(HARNESS_DIST)) return null;
  const dirs = readdirSync(HARNESS_DIST)
    .filter((d) => d.startsWith('canonical-'))
    .map((d) => ({ d, m: statSync(join(HARNESS_DIST, d)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return dirs[0] ? join(HARNESS_DIST, dirs[0].d) : null;
}

/**
 * GET /api/putnam/leaderboard
 *
 * Returns the full canonical leaderboard for the latest aggregated run.
 */
router.get('/leaderboard', (_req: Request, res: Response) => {
  try {
    const dir = latestCanonicalDir();
    if (!dir) {
      return sendSuccess(res, {
        present: false,
        message: 'No canonical Putnam-2025 run has been aggregated yet.',
      });
    }
    const leaderboard = JSON.parse(readFileSync(join(dir, 'leaderboard.json'), 'utf8'));
    return sendSuccess(res, { present: true, leaderboard, source: dir });
  } catch (err) {
    return handleRouteError(res, err, 'putnam.leaderboard');
  }
});

/**
 * GET /api/putnam/gauge
 *
 * Returns just the `putnam.gauge.v1` receipt — the chain-head + score —
 * for cheap polling from dashboards.
 */
router.get('/gauge', (_req: Request, res: Response) => {
  try {
    const dir = latestCanonicalDir();
    if (!dir) {
      return sendSuccess(res, { present: false });
    }
    const gauge = JSON.parse(readFileSync(join(dir, 'gauge.json'), 'utf8'));
    return sendSuccess(res, { present: true, gauge });
  } catch (err) {
    return handleRouteError(res, err, 'putnam.gauge');
  }
});

export default router;
