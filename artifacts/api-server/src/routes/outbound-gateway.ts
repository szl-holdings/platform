import { randomUUID } from 'node:crypto';
import { desc, eq, and, sql, inArray } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import {
  db,
  outboundDeliveriesTable,
  outboundChannelConfigsTable,
  outboundAuditLogTable,
} from '@szl-holdings/db';
import { submitDelivery, retryFailedDeliveries, getDeliveryStats } from '../services/outbound-gateway';
import { handleRouteError, sendBadRequest, sendSuccess, sendCreated, sendNotFound } from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';

const router = Router();

const AUTH_PATHS = [
  '/deliveries',
  '/channels',
  '/stats',
  '/audit',
  '/submit',
  '/retry',
];
router.use(AUTH_PATHS, authMiddleware());

function getCallerOrgId(req: Request): string | undefined {
  const orgIds = getUserOrgIds(req.user!);
  if (orgIds !== null && orgIds.size > 0) return String([...orgIds][0]!);
  return undefined;
}

function getCallerUserId(req: Request): string | undefined {
  return req.user?.id ? String(req.user.id) : undefined;
}

function buildOrgFilter(orgIds: Set<number> | null, column: typeof outboundDeliveriesTable.orgId | typeof outboundChannelConfigsTable.orgId | typeof outboundAuditLogTable.orgId) {
  if (orgIds === null) return undefined;
  if (orgIds.size === 0) return eq(column, '__no_org_match__');
  return inArray(column, [...orgIds].map(String));
}

const submitDeliverySchema = z.object({
  channel: z.enum(['webhook', 'email', 'sms', 'slack', 'teams', 'discord', 'siem', 'custom']),
  sourceDomain: z.string().min(1),
  sourceEvent: z.string().min(1),
  sourceSignalId: z.string().optional(),
  recipient: z.string().optional(),
  payload: z.record(z.unknown()),
  channelConfig: z.record(z.unknown()).optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
});

router.post(
  '/submit',
  validateBody(submitDeliverySchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof submitDeliverySchema>;
      const orgId = getCallerOrgId(req);
      const userId = getCallerUserId(req);

      const result = await submitDelivery({
        ...body,
        orgId,
        createdBy: userId,
      });

      res.status(result.status === 'delivered' ? 200 : 202).json({ delivery: result });
    } catch (err) {
      handleRouteError(res, err, 'Failed to submit delivery');
    }
  },
);

router.get('/deliveries', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 200);
    const offset = parseInt(String(req.query.offset ?? '0'), 10);
    const statusFilter = req.query.status as string | undefined;
    const channelFilter = req.query.channel as string | undefined;

    const conditions = [];
    const orgFilter = buildOrgFilter(orgIds, outboundDeliveriesTable.orgId);
    if (orgFilter) conditions.push(orgFilter);
    if (statusFilter) {
      conditions.push(eq(outboundDeliveriesTable.status, statusFilter));
    }
    if (channelFilter) {
      conditions.push(eq(outboundDeliveriesTable.channel, channelFilter));
    }

    const rows = await db
      .select()
      .from(outboundDeliveriesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(outboundDeliveriesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(outboundDeliveriesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    sendSuccess(res, { deliveries: rows, total: count, limit, offset });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list deliveries');
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const orgId = getCallerOrgId(req);
    const stats = await getDeliveryStats(orgId);
    sendSuccess(res, stats);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get delivery stats');
  }
});

router.post('/retry', async (req: Request, res: Response) => {
  try {
    const orgId = getCallerOrgId(req);
    const retried = await retryFailedDeliveries(orgId);
    sendSuccess(res, { retried });
  } catch (err) {
    handleRouteError(res, err, 'Failed to retry deliveries');
  }
});

const channelConfigSchema = z.object({
  channel: z.enum(['webhook', 'email', 'sms', 'slack', 'teams', 'discord', 'siem', 'custom']),
  name: z.string().min(1).max(100),
  config: z.record(z.unknown()),
});

router.post(
  '/channels',
  validateBody(channelConfigSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof channelConfigSchema>;
      const orgId = getCallerOrgId(req) ?? null;
      const userId = getCallerUserId(req) ?? null;

      const configId = randomUUID();
      await db.insert(outboundChannelConfigsTable).values({
        configId,
        orgId,
        channel: body.channel,
        name: body.name,
        config: body.config,
        createdBy: userId,
      });

      const [created] = await db
        .select()
        .from(outboundChannelConfigsTable)
        .where(eq(outboundChannelConfigsTable.configId, configId));

      sendCreated(res, created);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create channel config');
    }
  },
);

router.get('/channels', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const orgFilter = buildOrgFilter(orgIds, outboundChannelConfigsTable.orgId);

    const channels = await db
      .select()
      .from(outboundChannelConfigsTable)
      .where(orgFilter)
      .orderBy(desc(outboundChannelConfigsTable.createdAt));

    sendSuccess(res, { channels });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list channel configs');
  }
});

router.delete('/channels/:configId', async (req: Request, res: Response) => {
  try {
    const { configId } = req.params;
    const orgIds = getUserOrgIds(req.user!);

    const conditions = [eq(outboundChannelConfigsTable.configId, configId!)];
    const orgFilter = buildOrgFilter(orgIds, outboundChannelConfigsTable.orgId);
    if (orgFilter) conditions.push(orgFilter);

    const deleted = await db
      .delete(outboundChannelConfigsTable)
      .where(and(...conditions))
      .returning();

    if (deleted.length === 0) {
      sendNotFound(res, 'Channel config');
      return;
    }
    sendSuccess(res, { deleted: deleted[0] });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete channel config');
  }
});

router.get('/audit', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10), 200);
    const orgFilter = buildOrgFilter(orgIds, outboundAuditLogTable.orgId);

    const logs = await db
      .select()
      .from(outboundAuditLogTable)
      .where(orgFilter)
      .orderBy(desc(outboundAuditLogTable.createdAt))
      .limit(limit);

    sendSuccess(res, { auditLog: logs });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list audit log');
  }
});

export default router;
