/** Stub for /alloy-forge — placeholder until full implementation lands. */
import express from 'express';

const router = express.Router();
router.all('*', (_req, res) => {
  res.status(501).json({
    error: 'not_implemented',
    message: 'alloy-forge not yet wired',
  });
});

export default router;
