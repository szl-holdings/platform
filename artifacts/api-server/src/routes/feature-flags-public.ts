/**
 * Public feature-flag evaluation endpoint.
 *
 * Frontends and internal services call this to resolve one or more flags
 * for a given tenant context. The endpoint is accessible without authentication
 * (auth middleware runs globally with required: false), but the evaluation
 * context is always derived from the authenticated session:
 *
 *  - Authenticated callers: flags are evaluated with their userId + primary orgId,
 *    enabling per-user and per-org overrides and correct rollout bucketing.
 *  - Anonymous callers: only global on/off flag state is returned. Rollout
 *    evaluation is skipped (`skipRollout: true`) so these callers always receive
 *    `enabled: false` for partial rollouts rather than a deterministic bucket-0
 *    result that does not represent their actual cohort membership.
 *
 * POST /api/flags/evaluate
 * Body: { keys: string[]; callerTag?: string }
 * Response: { results: Record<string, { enabled: boolean; source: string }>, authenticated: boolean }
 *
 * GET /api/flags/:key?callerTag=<string>
 * Response: { key: string; enabled: boolean; source: string; authenticated: boolean }
 */

import { evaluateFlags } from '../lib/platform-flags.js';
import type { IRouter } from 'express';
import { z } from 'zod';
import { sendError } from '../lib/api-response.js';

const evaluateBodySchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(50),
  callerTag: z.string().max(100).optional(),
});

export function register(router: IRouter): void {
  router.post('/flags/evaluate', async (req, res) => {
    const parsed = evaluateBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Invalid request body', 400, 'VALIDATION_ERROR');
      return;
    }
    const { keys, callerTag } = parsed.data;

    const authenticated = !!req.user;
    const userId: number | undefined = req.user?.id;
    const orgId: number | undefined = req.user?.orgs?.[0]?.orgId;

    try {
      const raw = await evaluateFlags(keys, {
        userId,
        orgId,
        callerTag,
        skipRollout: !authenticated,
      });
      const results = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, { enabled: v.enabled, source: v.source }]),
      );
      res.json({ results, authenticated });
    } catch {
      sendError(res, 'Flag evaluation failed', 500, 'INTERNAL_ERROR');
    }
  });

  router.get('/flags/:key', async (req, res) => {
    const key = req.params.key as string;
    const callerTag = (req.query.callerTag as string | undefined) ?? undefined;

    const authenticated = !!req.user;
    const userId: number | undefined = req.user?.id;
    const orgId: number | undefined = req.user?.orgs?.[0]?.orgId;

    try {
      const raw = await evaluateFlags([key], {
        userId,
        orgId,
        callerTag,
        skipRollout: !authenticated,
      });
      const r = raw[key];
      res.json({
        key,
        enabled: r?.enabled ?? false,
        source: r?.source ?? 'default',
        authenticated,
      });
    } catch {
      sendError(res, 'Flag evaluation failed', 500, 'INTERNAL_ERROR');
    }
  });
}
