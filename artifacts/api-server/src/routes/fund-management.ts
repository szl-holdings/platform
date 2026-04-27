import { Router, type Request, type Response } from 'express';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  db,
  fundPortfolioFinancialsTable,
  fundPortfolioKpisTable,
  fundAccreditedInvestorsTable,
} from '@szl-holdings/db';
import {
  handleRouteError,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router = Router();

router.use(authMiddleware());
router.use(requireRole('ops', 'exec', 'admin'));
router.use(async (req: Request, res: Response, next) => {
  const orgIds = getUserOrgIds(req);
  if (!orgIds || orgIds.size === 0) {
    logger.warn({ userId: req.user?.id }, 'Fund management access denied — no org membership');
    res.status(403).json({ error: 'User has no organization membership' });
    return;
  }
  next();
});

router.get('/funds', async (req: Request, res: Response) => {
  try {
    const funds = await db
      .select({
        companySlug: fundPortfolioFinancialsTable.companySlug,
        companyName: fundPortfolioFinancialsTable.companyName,
      })
      .from(fundPortfolioFinancialsTable)
      .groupBy(fundPortfolioFinancialsTable.companySlug, fundPortfolioFinancialsTable.companyName)
      .orderBy(fundPortfolioFinancialsTable.companyName);

    sendSuccess(res, { funds, total: funds.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list funds');
  }
});

router.get('/funds/:slug/financials', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { period } = req.query;

    const conditions = [eq(fundPortfolioFinancialsTable.companySlug, slug)];
    if (period && typeof period === 'string') {
      conditions.push(eq(fundPortfolioFinancialsTable.periodType, period));
    }

    const financials = await db
      .select()
      .from(fundPortfolioFinancialsTable)
      .where(and(...conditions))
      .orderBy(desc(fundPortfolioFinancialsTable.periodEnd))
      .limit(50);

    if (financials.length === 0) {
      sendNotFound(res, 'Fund financials');
      return;
    }

    sendSuccess(res, { fund: slug, financials });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get fund financials');
  }
});

router.get('/funds/:slug/kpis', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const kpis = await db
      .select()
      .from(fundPortfolioKpisTable)
      .where(eq(fundPortfolioKpisTable.companySlug, slug))
      .orderBy(desc(fundPortfolioKpisTable.periodEnd))
      .limit(50);

    sendSuccess(res, { fund: slug, kpis });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get fund KPIs');
  }
});

router.get('/investors', async (req: Request, res: Response) => {
  try {
    const investors = await db
      .select()
      .from(fundAccreditedInvestorsTable)
      .orderBy(desc(fundAccreditedInvestorsTable.createdAt))
      .limit(200);

    sendSuccess(res, { investors, total: investors.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list investors');
  }
});

router.get('/cross-fund-rollup', async (req: Request, res: Response) => {
  try {
    const rollup = await db
      .select({
        companySlug: fundPortfolioFinancialsTable.companySlug,
        companyName: fundPortfolioFinancialsTable.companyName,
        totalRevenue: sql<string>`COALESCE(SUM(${fundPortfolioFinancialsTable.revenue}::numeric), 0)`,
        totalEbitda: sql<string>`COALESCE(SUM(${fundPortfolioFinancialsTable.ebitda}::numeric), 0)`,
        totalCash: sql<string>`COALESCE(SUM(${fundPortfolioFinancialsTable.cashAndEquivalents}::numeric), 0)`,
        periods: sql<number>`COUNT(DISTINCT ${fundPortfolioFinancialsTable.periodLabel})`,
      })
      .from(fundPortfolioFinancialsTable)
      .groupBy(fundPortfolioFinancialsTable.companySlug, fundPortfolioFinancialsTable.companyName)
      .orderBy(desc(sql`SUM(${fundPortfolioFinancialsTable.revenue}::numeric)`));

    sendSuccess(res, { rollup });
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute cross-fund rollup');
  }
});

export default router;
