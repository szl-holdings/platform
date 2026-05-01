/** Stub for /continuum/policy-compiler — placeholder until full implementation lands. */
import express from 'express';

const router = express.Router();
router.all('*', (_req, res) => {
  res.status(501).json({
    error: 'not_implemented',
    message: 'continuum-policy-compiler not yet wired',
  });
});

export default router;
