/**
 * Eval Harness Proxy Routes
 *
 * Thin authenticated proxy from the API server to the eval runner service.
 * Fronts the runner's endpoints so the Rosie Evidence Bench UI and the
 * validation gate can reach it through the standard API server auth stack.
 *
 * All write endpoints require the 'ops' or 'admin' role.
 * Read endpoints require authentication only.
 *
 * NOTE ON ROUTE PATHS: All routes retain the /eval-harness/ prefix because
 * this module is loaded via lazyMatch("/eval-harness", ...) which does NOT
 * strip the prefix from req.url before forwarding to the sub-router.
 * See lib/lazy-router.ts lazyMatch() for the rationale.
 *
 * Endpoints:
 *   GET  /eval-harness/health               — runner liveness
 *   GET  /eval-harness/suites               — list benchmark suites
 *   POST /eval-harness/runs                 — submit an eval run
 *   GET  /eval-harness/runs                 — list recent runs
 *   GET  /eval-harness/runs/:runId          — get run report
 *   POST /eval-harness/runs/:runId/reproduce — manifest-verified re-run
 *   POST /eval-harness/runs/:runId/verify    — verify HMAC signature
 *   GET  /eval-harness/regression/:runId/:baselineId — compare two runs
 *   GET  /eval-harness/gate-status          — promotion gate thresholds
 */

import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from '../middlewares/sliding-window-limiter';
import { logger } from '../lib/logger';
import {
  STANDARD_SUITE_ID,
  DOMAIN_SUITE_IDS,
  MIN_PASS_RATE_STANDARD,
  MIN_PASS_RATE_DOMAIN,
  REGRESSION_THRESHOLD,
} from '@workspace/eval-harness';
import type { EvalRunReport } from '@workspace/eval-harness';

const router: IRouter = Router();

// ── Runner URL ─────────────────────────────────────────────────────────────────

function getRunnerUrl(): string {
  const url = process.env['EVAL_RUNNER_URL'] ?? 'http://localhost:8001';
  return url.replace(/\/$/, '');
}

async function proxyGet(path: string): Promise<unknown> {
  const resp = await fetch(`${getRunnerUrl()}${path}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    const err: NodeJS.ErrnoException = new Error(`Eval runner ${resp.status}: ${body}`);
    (err as NodeJS.ErrnoException & { statusCode?: number }).statusCode = resp.status;
    throw err;
  }
  return resp.json();
}

async function proxyPost(path: string, body: unknown): Promise<{ status: number; data: unknown }> {
  const resp = await fetch(`${getRunnerUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, data };
}

// ── Auth helpers ───────────────────────────────────────────────────────────────

const readAuth = authMiddleware();
const writeAuth = [authMiddleware(), requireRole(['admin', 'ops', 'super_admin'])];

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /eval-harness/health
 */
router.get('/eval-harness/health', async (_req: Request, res: Response) => {
  try {
    const data = await proxyGet('/health');
    sendSuccess(res, data);
  } catch (err) {
    logger.warn({ err }, '[eval-harness] runner health check failed');
    res.status(503).json({ status: 'error', detail: 'Eval runner unreachable' });
  }
});

/**
 * GET /eval-harness/suites
 */
router.get('/eval-harness/suites', readAuth, perUserApiSlidingLimiter, async (_req: Request, res: Response) => {
  try {
    const data = await proxyGet('/suites');
    sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list eval suites');
  }
});

/**
 * POST /eval-harness/runs
 */
const submitRunSchema = z.object({
  suite_id: z.string().min(1).max(100),
  model_id: z.string().min(1).max(200),
  provider: z.enum(['openai', 'anthropic', 'gemini', 'huggingface', 'substrate']),
  triggered_by: z.string().max(100).default('api'),
  baseline_run_id: z.string().uuid().nullable().optional(),
  seed: z.number().int().nullable().optional(),
});

router.post(
  '/eval-harness/runs',
  ...writeAuth,
  perUserWriteSlidingLimiter,
  validateBody(submitRunSchema),
  async (req: Request, res: Response) => {
    try {
      const { status, data } = await proxyPost('/runs', req.body);
      if (status === 202 || status === 200) {
        sendCreated(res, data);
      } else {
        res.status(status).json(data);
      }
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit eval run');
    }
  },
);

/**
 * GET /eval-harness/runs
 */
router.get('/eval-harness/runs', readAuth, perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query['limit'] ?? 50), 100);
    const data = await proxyGet(`/runs?limit=${limit}`);
    sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list eval runs');
  }
});

/**
 * GET /eval-harness/runs/:runId
 */
router.get('/eval-harness/runs/:runId', readAuth, perUserApiSlidingLimiter, async (req: Request, res: Response) => {
  try {
    const { runId } = req.params;
    const data = await proxyGet(`/runs/${runId}`);
    sendSuccess(res, data);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get eval run');
  }
});

/**
 * POST /eval-harness/runs/:runId/reproduce
 */
router.post(
  '/eval-harness/runs/:runId/reproduce',
  ...writeAuth,
  async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      const seed = Number(req.body?.seed ?? 42);
      const { status, data } = await proxyPost(`/runs/${runId}/reproduce`, { seed });
      res.status(status).json(data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to reproduce eval run');
    }
  },
);

/**
 * POST /eval-harness/runs/:runId/verify
 */
router.post(
  '/eval-harness/runs/:runId/verify',
  ...writeAuth,
  async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      const { status, data } = await proxyPost(`/runs/${runId}/verify`, {});
      res.status(status).json(data);
    } catch (err) {
      handleRouteError(res, err, 'Failed to verify eval run signature');
    }
  },
);

/**
 * GET /eval-harness/regression/:runId/:baselineId
 * Compare two runs and return a regression analysis.
 */
router.get(
  '/eval-harness/regression/:runId/:baselineId',
  readAuth,
  perUserApiSlidingLimiter,
  async (req: Request, res: Response) => {
    try {
      const { runId, baselineId } = req.params;
      const [run, baseline] = await Promise.all([
        proxyGet(`/runs/${runId}`) as Promise<EvalRunReport>,
        proxyGet(`/runs/${baselineId}`) as Promise<EvalRunReport>,
      ]);

      const regressionCategories: string[] = [];
      for (const [cat, data] of Object.entries(run.categories ?? {})) {
        const baseData = baseline.categories?.[cat];
        if (!baseData) continue;
        if ((data.pass_rate ?? 0) < (baseData.pass_rate ?? 0) - REGRESSION_THRESHOLD) {
          regressionCategories.push(cat);
        }
      }

      const passRateDelta = (run.pass_rate ?? 0) - (baseline.pass_rate ?? 0);
      const scoreDelta = (run.aggregate_score ?? 0) - (baseline.aggregate_score ?? 0);
      const regressed = passRateDelta < -REGRESSION_THRESHOLD || regressionCategories.length > 0;

      sendSuccess(res, {
        run_id: runId,
        baseline_run_id: baselineId,
        suite_id: run.suite_id,
        model_id: run.model_id,
        regressed,
        regression_categories: regressionCategories,
        pass_rate_delta: passRateDelta,
        aggregate_score_delta: scoreDelta,
        baseline_pass_rate: baseline.pass_rate,
        current_pass_rate: run.pass_rate,
        baseline_aggregate_score: baseline.aggregate_score,
        current_aggregate_score: run.aggregate_score,
        analysed_at: Date.now(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to analyse regression');
    }
  },
);

/**
 * GET /eval-harness/gate-status
 * Returns the gate thresholds for display in the Evidence Bench UI.
 */
router.get('/eval-harness/gate-status', readAuth, (_req: Request, res: Response) => {
  sendSuccess(res, {
    standard_suite_id: STANDARD_SUITE_ID,
    domain_suite_ids: DOMAIN_SUITE_IDS,
    min_pass_rate_standard: MIN_PASS_RATE_STANDARD,
    min_pass_rate_domain: MIN_PASS_RATE_DOMAIN,
    regression_threshold: REGRESSION_THRESHOLD,
  });
});

export default router;
