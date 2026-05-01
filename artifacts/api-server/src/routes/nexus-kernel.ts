/** Stub for /nexus (kernel) — placeholder. nexus.ts and nexus-v1.ts handle the live nexus routes. */
import express from 'express';

const router = express.Router();
router.all('*', (_req, res) => {
  res.status(501).json({
    error: 'not_implemented',
    message: 'nexus-kernel not yet wired',
  });
});

export default router;
