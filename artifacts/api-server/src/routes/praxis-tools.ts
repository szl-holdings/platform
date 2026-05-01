/** Stub for /praxis-tools — placeholder until full implementation lands. */
import express from 'express';

const router = express.Router();
router.all('*', (_req, res) => {
  res.status(501).json({
    error: 'not_implemented',
    message: 'praxis-tools not yet wired',
  });
});

export default router;
