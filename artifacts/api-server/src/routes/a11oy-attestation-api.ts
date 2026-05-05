import { Router, type Request, type Response } from 'express';
import { logger } from '../lib/logger.js';
import {
  getEnvelope,
  listEnvelopes,
  regenerateEnvelope,
  listRoutingWeights,
  updateRoutingWeight,
  resetRoutingWeights,
} from '../a11oy/runtime/governance/attestation-store.js';

const publicRouter = Router();
const protectedRouter = Router();
const now = () => new Date().toISOString();

function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({
    ok: true,
    data,
    meta: { ...meta, timestamp: now(), structural: true },
  });
}

function err(res: Response, status: number, type: string, message: string) {
  res.status(status).json({ ok: false, error: { type, message, retryable: false } });
}

// ─── Public reads (mounted before guardianPolicyCheck) ───────────────────────
publicRouter.get('/a11oy/proof/envelopes', (_req: Request, res: Response) => {
  const items = listEnvelopes();
  ok(res, items, { total: items.length });
});

publicRouter.get('/a11oy/proof/envelope/:envelopeId', (req: Request, res: Response) => {
  const env = getEnvelope(req.params.envelopeId);
  if (!env) {
    return err(res, 404, 'not_found', `Rationale envelope "${req.params.envelopeId}" not found.`);
  }
  ok(res, env);
});

publicRouter.get('/a11oy/routing-weights', (_req: Request, res: Response) => {
  const weights = listRoutingWeights();
  const total = weights.reduce((s, w) => s + w.weight, 0);
  const normalizedTotal = weights.length > 0 ? total / weights.length : 0;
  ok(res, { weights, total, normalizedTotal, count: weights.length });
});

// ─── Protected mutations (mounted after guardianPolicyCheck) ─────────────────
protectedRouter.post('/a11oy/proof/envelope/:envelopeId/regenerate', (req: Request, res: Response) => {
  const env = regenerateEnvelope(req.params.envelopeId);
  if (!env) {
    return err(res, 404, 'not_found', `Rationale envelope "${req.params.envelopeId}" not found.`);
  }
  ok(res, env, { regenerated: true });
});

protectedRouter.put('/a11oy/routing-weights/:dimension', (req: Request, res: Response) => {
  try {
    const { weight, updatedBy } = req.body as { weight?: number; updatedBy?: string };
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0 || weight > 1) {
      return err(res, 400, 'validation', 'weight must be a finite number between 0 and 1.');
    }
    const updated = updateRoutingWeight(req.params.dimension, weight, updatedBy ?? 'operator');
    if (!updated) {
      return err(res, 404, 'not_found', `Routing dimension "${req.params.dimension}" not found.`);
    }
    ok(res, updated, { updated: true });
  } catch (e) {
    logger.error({ err: e }, '[a11oy-attestation] PUT /routing-weights/:dimension');
    err(res, 500, 'execution', 'Failed to update routing weight.');
  }
});

protectedRouter.post('/a11oy/routing-weights/reset', (req: Request, res: Response) => {
  const { updatedBy } = (req.body ?? {}) as { updatedBy?: string };
  const weights = resetRoutingWeights(updatedBy ?? 'operator');
  ok(res, { weights, count: weights.length }, { reset: true });
});

logger.debug('[a11oy-attestation-api] routes registered — rationale envelopes + routing weights (split public/protected)');

export { publicRouter as a11oyAttestationPublicRouter, protectedRouter as a11oyAttestationProtectedRouter };
export default publicRouter;
