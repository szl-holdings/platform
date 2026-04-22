import { bodyShape } from '@szl-holdings/contracts/common';
import { changeEventsTable, db, insertChangeEventSchema } from '@szl-holdings/db';
import { and, eq, gt, lte } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { publish } from '../lib/websocket';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const CRDT_SYNC_CHANNEL = 'crdt-sync';
const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 100;

router.get(
  '/changes',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const cursor = req.query.cursor ? Number(req.query.cursor) : 0;
      const entityType = req.query.entity as string | undefined;
      const entityId = req.query.entityId as string | undefined;
      const limit = Math.min(Number(req.query.limit ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

      const conditions = [gt(changeEventsTable.cursor, cursor)];
      if (entityType) conditions.push(eq(changeEventsTable.entityType, entityType));
      if (entityId) conditions.push(eq(changeEventsTable.entityId, entityId));

      const events = await db
        .select()
        .from(changeEventsTable)
        .where(and(...conditions))
        .orderBy(changeEventsTable.cursor)
        .limit(limit);

      const nextCursor = events.length > 0 ? events[events.length - 1]?.cursor : cursor;

      sendSuccess(res, {
        events,
        cursor: nextCursor,
        hasMore: events.length === limit,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch change events');
    }
  },
);

router.post(
  '/changes',
  authMiddleware(),
  validateBody(
    bodyShape({
      appSource: z.unknown().optional(),
      crdtClock: z.unknown().optional(),
      delta: z.unknown().optional(),
      entityId: z.unknown().optional(),
      entityType: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const parsed = insertChangeEventSchema.safeParse({
        entityType: body.entityType,
        entityId: body.entityId,
        actorId: String((req as { user?: { id?: unknown } }).user?.id ?? 'anonymous'),
        delta: body.delta,
        crdtClock: body.crdtClock ?? {},
        appSource: body.appSource,
      });

      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
      }

      const [inserted] = await db.insert(changeEventsTable).values(parsed.data).returning();

      if (inserted) {
        publish(CRDT_SYNC_CHANNEL, 'delta', {
          cursor: inserted.cursor,
          entityType: inserted.entityType,
          entityId: inserted.entityId,
          actorId: inserted.actorId,
          timestamp: inserted.timestamp.toISOString(),
          delta: inserted.delta,
          crdtClock: inserted.crdtClock,
          appSource: inserted.appSource,
        });
      }

      sendSuccess(res, { cursor: inserted?.cursor, ok: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to record change event');
    }
  },
);

router.get(
  '/changes/replay',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const entityType = req.query.entity as string | undefined;
      const entityId = req.query.entityId as string | undefined;
      const fromCursor = req.query.from ? Number(req.query.from) : 0;
      const toCursor = req.query.to ? Number(req.query.to) : undefined;

      if (!entityType || !entityId) {
        res.status(400).json({ error: 'entity and entityId are required' });
        return;
      }

      const conditions = [
        eq(changeEventsTable.entityType, entityType),
        eq(changeEventsTable.entityId, entityId),
        gt(changeEventsTable.cursor, fromCursor),
      ];
      if (toCursor) conditions.push(lte(changeEventsTable.cursor, toCursor));

      const events = await db
        .select()
        .from(changeEventsTable)
        .where(and(...conditions))
        .orderBy(changeEventsTable.cursor)
        .limit(MAX_PAGE_SIZE);

      sendSuccess(res, { events, count: events.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to replay change feed');
    }
  },
);

export async function recordChangeEvent(opts: {
  entityType: string;
  entityId: string;
  actorId: string;
  delta: Record<string, unknown>;
  crdtClock?: Record<string, number>;
  appSource?: string;
}): Promise<void> {
  try {
    const [inserted] = await db
      .insert(changeEventsTable)
      .values({
        entityType: opts.entityType,
        entityId: opts.entityId,
        actorId: opts.actorId,
        delta: opts.delta,
        crdtClock: opts.crdtClock ?? {},
        appSource: opts.appSource,
      })
      .returning();

    if (inserted) {
      publish(CRDT_SYNC_CHANNEL, 'delta', {
        cursor: inserted.cursor,
        entityType: inserted.entityType,
        entityId: inserted.entityId,
        actorId: inserted.actorId,
        timestamp: inserted.timestamp.toISOString(),
        delta: inserted.delta,
        crdtClock: inserted.crdtClock,
        appSource: inserted.appSource,
      });
      logger.debug(
        { cursor: inserted.cursor, entityType: opts.entityType, entityId: opts.entityId },
        '[crdt] Change event recorded and broadcast',
      );
    }
  } catch (err) {
    logger.error({ err }, '[crdt] Failed to record change event');
  }
}

export default router;
