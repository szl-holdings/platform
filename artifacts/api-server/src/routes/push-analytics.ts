import { db, pushNotificationHistoryTable } from '@szl-holdings/db';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

router.get(
  '/push-analytics',
  authMiddleware(),
  requireRole('ops'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { appId, templateId, since, until } = req.query as Record<string, string | undefined>;

      const defaultSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      if (since && isNaN(new Date(since).getTime())) {
        sendBadRequest(res, 'since must be a valid ISO date string');
        return;
      }
      if (until && isNaN(new Date(until).getTime())) {
        sendBadRequest(res, 'until must be a valid ISO date string');
        return;
      }

      const sinceDate = since ? new Date(since) : defaultSince;
      const untilDate = until ? new Date(until) : new Date();

      const conditions = [
        gte(pushNotificationHistoryTable.createdAt, sinceDate),
        lte(pushNotificationHistoryTable.createdAt, untilDate),
      ];
      if (appId) conditions.push(eq(pushNotificationHistoryTable.appId, appId));
      if (templateId) conditions.push(eq(pushNotificationHistoryTable.templateId, templateId));

      const summaryRows = await db
        .select({
          appId: pushNotificationHistoryTable.appId,
          templateId: pushNotificationHistoryTable.templateId,
          totalSent: sql<number>`sum(${pushNotificationHistoryTable.tokensSent})`,
          totalFailed: sql<number>`sum(${pushNotificationHistoryTable.tokensFailed})`,
          totalDelivered: sql<number>`sum(${pushNotificationHistoryTable.tokensDelivered})`,
          totalNotifications: sql<number>`count(*)`,
          deliveryStatusSent: sql<number>`count(*) filter (where ${pushNotificationHistoryTable.deliveryStatus} = 'sent')`,
          deliveryStatusPartial: sql<number>`count(*) filter (where ${pushNotificationHistoryTable.deliveryStatus} = 'partial')`,
          deliveryStatusFailed: sql<number>`count(*) filter (where ${pushNotificationHistoryTable.deliveryStatus} = 'failed')`,
        })
        .from(pushNotificationHistoryTable)
        .where(and(...conditions))
        .groupBy(pushNotificationHistoryTable.appId, pushNotificationHistoryTable.templateId);

      const totals = summaryRows.reduce(
        (acc, row) => {
          acc.totalSent += Number(row.totalSent ?? 0);
          acc.totalFailed += Number(row.totalFailed ?? 0);
          acc.totalDelivered += Number(row.totalDelivered ?? 0);
          acc.totalNotifications += Number(row.totalNotifications ?? 0);
          return acc;
        },
        { totalSent: 0, totalFailed: 0, totalDelivered: 0, totalNotifications: 0 },
      );

      const deliveryRate =
        totals.totalSent + totals.totalFailed > 0
          ? Math.round((totals.totalSent / (totals.totalSent + totals.totalFailed)) * 10000) / 100
          : null;

      const confirmedDeliveryRate =
        totals.totalSent > 0
          ? Math.round((totals.totalDelivered / totals.totalSent) * 10000) / 100
          : null;

      sendSuccess(res, {
        window: {
          since: sinceDate.toISOString(),
          until: untilDate.toISOString(),
        },
        totals: {
          ...totals,
          deliveryRatePercent: deliveryRate,
          confirmedDeliveryRatePercent: confirmedDeliveryRate,
        },
        breakdown: summaryRows.map((r) => ({
          appId: r.appId,
          templateId: r.templateId,
          sent: Number(r.totalSent ?? 0),
          failed: Number(r.totalFailed ?? 0),
          delivered: Number(r.totalDelivered ?? 0),
          notifications: Number(r.totalNotifications ?? 0),
          deliveryStatus: {
            sent: Number(r.deliveryStatusSent ?? 0),
            partial: Number(r.deliveryStatusPartial ?? 0),
            failed: Number(r.deliveryStatusFailed ?? 0),
          },
        })),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch push analytics');
    }
  },
);

export default router;
