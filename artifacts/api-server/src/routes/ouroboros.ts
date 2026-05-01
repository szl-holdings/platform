/** Stub for /ouroboros — primary ouroboros routes are mounted via the guardrails SKU
 *  in services/ouroboros-guardrails. This stub is referenced by routes/index.ts
 *  for additional routes that have not landed yet. */
import express from 'express';

const router = express.Router();
router.all('*', (_req, res) => {
  res.status(501).json({
    error: 'not_implemented',
    message: 'ouroboros routes here are placeholders. Live endpoints are at /api/ouroboros/guardrails/*.',
  });
});

export default router;
