import { approvalRequestsTable, db } from '@szl-holdings/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { requireAnyAuth } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router = Router();

router.get('/pending', requireAnyAuth(), async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      return sendSuccess(res, { count: 0, generatedAt: new Date().toISOString() });
    }
    const orgFilter = orgIds !== null ? inArray(approvalRequestsTable.orgId, [...orgIds]) : undefined;
    const [row] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(approvalRequestsTable)
      .where(
        and(
          eq(approvalRequestsTable.status, 'pending'),
          eq(approvalRequestsTable.resourceType, 'policy'),
          orgFilter,
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
