/**
 * Sentra Threat Hunter — Hunt & Remediation Approval API
 *
 * POST /api/sentra/hunts/:huntId/approve   — mark a hunt as confirmed, emit domain event
 * POST /api/sentra/hunts/:huntId/dismiss   — dismiss a hunt (false positive)
 * POST /api/sentra/remediation/:planId/approve — approve a remediation plan, emit domain event
 */

import { randomUUID } from 'node:crypto';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response.js';
import { validateBody } from '../lib/validation.js';
import { domainEventBus } from '../lib/domain-events/index.js';
import { logger } from '../lib/logger.js';

/**
 * Gate signal-emitting mutations behind a session in production.
 * In development the Sentra demo surface runs without a session; in production
 * callers must be authenticated to prevent unauthenticated actors from
 * publishing cross-product domain events to the signal mesh.
 */
function requireAuthInProduction(req: Request, res: Response): boolean {
  if (process.env.NODE_ENV === 'production' && !req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    return false;
  }
  return true;
}

const router: IRouter = Router();

const approveHuntSchema = z.object({
  huntTitle: z.string().min(1).max(300),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  blastRadiusCost: z.number().nonnegative(),
  affectedBusinessEntities: z.array(z.string()).default([]),
  approvedBy: z.string().min(1).max(200).optional().default('Analyst'),
});

const dismissHuntSchema = z.object({
  reason: z.string().min(1).max(500).optional().default('False positive'),
  dismissedBy: z.string().min(1).max(200).optional().default('Analyst'),
});

const approveRemediationSchema = z.object({
  huntId: z.string().min(1).max(100),
  huntTitle: z.string().min(1).max(300),
  blastRadiusCost: z.number().nonnegative(),
  stepCount: z.number().int().nonnegative(),
  approvedBy: z.string().min(1).max(200).optional().default('Analyst'),
  signalsBroadcast: z.array(z.string()).default([]),
});

router.post(
  '/sentra/hunts/:huntId/approve',
  validateBody(approveHuntSchema),
  async (req: Request, res: Response) => {
    if (!requireAuthInProduction(req, res)) return;
    try {
      const huntId = req.params['huntId'] ?? 'unknown';
      const body = req.body as z.infer<typeof approveHuntSchema>;

      domainEventBus.publish('sentra.hunt-approved', {
        huntId,
        huntTitle: body.huntTitle,
        severity: body.severity,
        blastRadiusCost: body.blastRadiusCost,
        affectedBusinessEntities: body.affectedBusinessEntities,
        approvedBy: body.approvedBy,
      });

      logger.info({ huntId, approvedBy: body.approvedBy }, '[sentra-hunt] Hunt approved, domain event published');

      sendSuccess(res, {
        ok: true,
        huntId,
        approvedAt: new Date().toISOString(),
        approvedBy: body.approvedBy,
        signalPublished: true,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve hunt');
    }
  },
);

router.post(
  '/sentra/hunts/:huntId/dismiss',
  validateBody(dismissHuntSchema),
  async (req: Request, res: Response) => {
    if (!requireAuthInProduction(req, res)) return;
    try {
      const huntId = req.params['huntId'] ?? 'unknown';
      const body = req.body as z.infer<typeof dismissHuntSchema>;

      logger.info(
        { huntId, reason: body.reason, dismissedBy: body.dismissedBy },
        '[sentra-hunt] Hunt dismissed',
      );

      sendSuccess(res, {
        ok: true,
        huntId,
        dismissedAt: new Date().toISOString(),
        dismissedBy: body.dismissedBy,
        reason: body.reason,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to dismiss hunt');
    }
  },
);

router.post(
  '/sentra/remediation/:planId/approve',
  validateBody(approveRemediationSchema),
  async (req: Request, res: Response) => {
    if (!requireAuthInProduction(req, res)) return;
    try {
      const planId = req.params['planId'] ?? randomUUID();
      const body = req.body as z.infer<typeof approveRemediationSchema>;

      domainEventBus.publish('sentra.remediation-approved', {
        planId,
        huntId: body.huntId,
        huntTitle: body.huntTitle,
        blastRadiusCost: body.blastRadiusCost,
        stepCount: body.stepCount,
        approvedBy: body.approvedBy,
        signalsBroadcast: body.signalsBroadcast,
      });

      logger.info(
        { planId, huntId: body.huntId, approvedBy: body.approvedBy },
        '[sentra-hunt] Remediation plan approved, domain event published',
      );

      sendSuccess(res, {
        ok: true,
        planId,
        approvedAt: new Date().toISOString(),
        approvedBy: body.approvedBy,
        signalsBroadcast: body.signalsBroadcast,
        signalPublished: true,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve remediation plan');
    }
  },
);

export default router;
