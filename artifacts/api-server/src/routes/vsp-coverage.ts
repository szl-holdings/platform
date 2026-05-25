/**
 * GET /vsp/coverage — public read-only Verifiable Span Protocol health.
 *
 * Returns the in-process VSP emission counters surfaced by
 * `@szl-holdings/vsp-otel`'s `getVspCoverageSnapshot()`. Mounted at the
 * public `/api/vsp` prefix so A11oy / Sentra (and external dashboards)
 * can render real throughput, coverage %, and OTLP export health
 * without authentication.
 *
 * No request body, no parameters — single-process snapshot is the
 * right granularity for the MVP. Cross-process aggregation lives in a
 * follow-up.
 */

import { type IRouter, type Request, type Response, Router } from 'express';

import { getVspCoverageSnapshot } from '@szl-holdings/vsp-otel';

import { handleRouteError, sendSuccess } from '../lib/api-response';

const router: IRouter = Router();

router.get('/vsp/coverage', async (_req: Request, res: Response) => {
  try {
    const snapshot = getVspCoverageSnapshot();
    sendSuccess(res, snapshot);
  } catch (err) {
    handleRouteError(res, err, 'vsp_coverage_failed');
  }
});

export default router;
