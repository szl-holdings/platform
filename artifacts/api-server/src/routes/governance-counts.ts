import { approvalRequestsTable, db } from '@szl-holdings/db';
import { and, eq, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { requireAnyAuth } from '../middlewares/auth';

const router = Router();

/**
 * GET /api/governance/pending
 *
 * Lightweight count of pending governance approval requests scoped to
 * policy resources. Used by the Command Ops nav badge.
 */
router.get('/pending', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    // Match the scoping used by /api/command/governance — only policy
    // approvals contribute to the Governance nav badge.
    const [row] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(approvalRequestsTable)
      .where(
        and(
          eq(approvalRequestsTable.status, 'pending'),
          eq(approvalRequestsTable.resourceType, 'policy'),
        ),
      );
    const count = Number(row?.count ?? 0);
    sendSuccess(res, { count, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, 'governance/pending error');
    handleRouteError(res, err, 'Failed to load governance pending count');
  }
});

export default router;
