import { db, pushNotificationHistoryTable, pushReceiptsTable } from '@szl-holdings/db';
import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router: IRouter = Router();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// /push-history/me — returns all history rows the authenticated user is a
// recipient of: both direct user sends (userId = me) and app/broadcast sends
// where the user's device had a receipt.
router.get(
  '/push-history/me',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { appId, page, pageSize, since, until } = req.query as Record<
        string,
        string | undefined
      >;

      if (since && Number.isNaN(new Date(since).getTime())) {
        sendBadRequest(res, 'since must be a valid ISO date string');
        return;
      }
      if (until && Number.isNaN(new Date(until).getTime())) {
        sendBadRequest(res, 'until must be a valid ISO date string');
        return;
      }

      const rawPage = Math.max(Number(page ?? 1), 1);
      const rawPageSize = Number(pageSize ?? DEFAULT_PAGE_SIZE);
      if (Number.isNaN(rawPage) || Number.isNaN(rawPageSize) || rawPageSize < 1) {
        sendBadRequest(res, 'page and pageSize must be valid positive numbers');
        return;
      }
      const limit = Math.min(rawPageSize, MAX_PAGE_SIZE);
      const offset = (rawPage - 1) * limit;

      // Include rows where the user was a direct recipient OR where a receipt
      // links this history record to the user's device (app/broadcast sends).
      const recipientFilter = or(
        eq(pushNotificationHistoryTable.userId, userId),
        sql`EXISTS (
        SELECT 1 FROM ${pushReceiptsTable}
        WHERE ${pushReceiptsTable.historyId} = ${pushNotificationHistoryTable.id}
          AND ${pushReceiptsTable.userId} = ${userId}
      )`,
      );

      const extraConditions = [];
      if (appId) extraConditions.push(eq(pushNotificationHistoryTable.appId, appId));
      if (since) extraConditions.push(gte(pushNotificationHistoryTable.createdAt, new Date(since)));
      if (until) extraConditions.push(lte(pushNotificationHistoryTable.createdAt, new Date(until)));

      const whereClause =
        extraConditions.length > 0 ? and(recipientFilter, ...extraConditions) : recipientFilter;

      const rows = await db
        .select()
        .from(pushNotificationHistoryTable)
        .where(whereClause)
        .orderBy(desc(pushNotificationHistoryTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, { items: rows, page: Number(page ?? 1), pageSize: limit });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch push history');
    }
  },
);

// /push-history — ops-only full history view with optional filters
router.get(
  '/push-history',
  authMiddleware(),
  requireRole('ops'),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { userId, appId, templateId, page, pageSize, since, until } = req.query as Record<
        string,
        string | undefined
      >;

      if (since && Number.isNaN(new Date(since).getTime())) {
        sendBadRequest(res, 'since must be a valid ISO date string');
        return;
      }
      if (until && Number.isNaN(new Date(until).getTime())) {
        sendBadRequest(res, 'until must be a valid ISO date string');
        return;
      }

      const rawPage = Math.max(Number(page ?? 1), 1);
      const rawPageSize = Number(pageSize ?? DEFAULT_PAGE_SIZE);
      const limit =
        Number.
        isNaN(rawPageSize) || rawPageSize < 1
          ? DEFAULT_PAGE_SIZE
          : Math.min(rawPageSize, MAX_PAGE_SIZE);
      const offset = (Number.isNaN(rawPage) ? 0 : rawPage - 1) * limit;

      const conditions = [];
      if (userId) conditions.push(eq(pushNotificationHistoryTable.userId, Number(userId)));
      if (appId) conditions.push(eq(pushNotificationHistoryTable.appId, appId));
      if (templateId) conditions.push(eq(pushNotificationHistoryTable.templateId, templateId));
      if (since) conditions.push(gte(pushNotificationHistoryTable.createdAt, new Date(since)));
      if (until) conditions.push(lte(pushNotificationHistoryTable.createdAt, new Date(until)));

      const rows = await db
        .select()
        .from(pushNotificationHistoryTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pushNotificationHistoryTable.createdAt))
        .limit(limit)
        .offset(offset);

      sendSuccess(res, { items: rows, page: Number(page ?? 1), pageSize: limit });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch push history');
    }
  },
);

export default router;
