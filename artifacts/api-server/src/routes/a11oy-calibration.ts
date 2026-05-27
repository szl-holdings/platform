/**
 * A11oy Sotopia Operator Calibration — audit + reset surface.
 *
 * GET  /api/a11oy/calibration         → list every (operator, domain) entry
 * POST /api/a11oy/calibration/reset   → wipe the in-memory calibration store
 *
 * Backs the ApprovalCalibration audit panel. The store itself lives in
 * @workspace/agents-evals/operator-calibration and is appended to from
 * approvals-inbox.governed-store on every decideApproval call.
 */
import { Router, type Request, type Response } from 'express';
import {
  listCalibration,
  resetCalibration,
  CALIBRATION_BAND,
} from '@workspace/agents-evals/operator-calibration';

const router = Router();

router.get('/a11oy/calibration', (_req: Request, res: Response) => {
  const entries = listCalibration().sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  res.json({
    ok: true,
    data: {
      entries,
      band: CALIBRATION_BAND,
      count: entries.length,
    },
    meta: {
      formula: 'approve: +0.04·(1-w/1.20) · deny: -0.06·(w/0.80-1) · escalate: -0.02',
      timestamp: new Date().toISOString(),
    },
  });
});

router.post('/a11oy/calibration/reset', (_req: Request, res: Response) => {
  const previousCount = listCalibration().length;
  resetCalibration();
  res.json({
    ok: true,
    data: { cleared: previousCount, remaining: 0 },
    meta: { timestamp: new Date().toISOString() },
  });
});

export default router;
