/**
 * Multiplayer Command Sessions
 *
 * DB-backed session management with WebSocket presence integration.
 * Sessions are persisted to `command_sessions`; participant presence
 * is tracked via the existing WebSocket pub/sub infrastructure.
 *
 * Routes:
 *   POST /sessions/command            — create or join a session
 *   GET  /sessions/command/:sessionId — get session info + presence
 *   GET  /sessions/command            — list active sessions
 *   DELETE /sessions/command/:id      — end a session
 *   POST /sessions/command/:sessionId/comments — post a session comment
 *   GET  /sessions/command/:sessionId/comments — list session comments
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import { commandSessionCommentsTable, commandSessionsTable, db } from '@szl-holdings/db';
import { randomUUID } from 'node:crypto';
import { type SQL, and, desc, eq, inArray } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import {
  handleRouteError,
  sendBadRequest,
  sendNotFound,
  sendSuccess,
  sendCreated,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import {
  commandSessionCreateSchema,
  listQuerySchema,
  sessionCommentCreateSchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { publish } from '../lib/websocket';
import { authMiddleware } from '../middlewares/auth';
import { assertTenantAccess, getUserOrgIds } from '../middlewares/tenant-scope';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const router: IRouter = Router();

router.get(
  '/sessions/command',
  authMiddleware(),
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const orgIds = getUserOrgIds(req.user!);
      if (orgIds !== null && orgIds.size === 0) {
        return sendSuccess(res, { sessions: [], count: 0 });
      }
      const orgFilter = orgIds !== null ? inArray(commandSessionsTable.orgId, [...orgIds]) : undefined;
      const appId = req.query.appId as string | undefined;
      const conditions: (SQL | undefined)[] = [eq(commandSessionsTable.isActive, true)];
      if (appId) conditions.push(eq(commandSessionsTable.appId, appId));
      if (orgFilter) conditions.push(orgFilter);

      const sessions = await db
        .select()
        .from(commandSessionsTable)
        .where(and(...conditions))
        .orderBy(desc(commandSessionsTable.lastActivityAt))
        .limit(20);

      sendSuccess(res, { sessions, count: sessions.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to list sessions');
    }
  },
);

router.post(
  '/sessions/command',
  authMiddleware(),
  perUserWriteSlidingLimiter,
  validateBody(commandSessionCreateSchema),
  async (req, res) => {
    const { sessionId: requestedId, title, appId } = req.body;

    try {
      const sessionId = requestedId ?? `cmd-${randomUUID().slice(0, 8)}`;
      const orgId = (req.user?.orgs?.[0]?.orgId as number | undefined) ?? null;
      const userId = req.user?.id ?? null;

      const existing = await db
        .select()
        .from(commandSessionsTable)
        .where(eq(commandSessionsTable.sessionId, sessionId))
        .limit(1);

      if (existing.length > 0) {
        if (!assertTenantAccess(req, res, existing[0].orgId)) return;
        sendSuccess(res, { session: existing[0], joined: true });
        return;
      }

      const [session] = await db
        .insert(commandSessionsTable)
        .values({
          sessionId,
          orgId,
          createdByUserId: userId,
          title: title ?? 'Command Session',
          appId: appId ?? 'command',
          participantUserIds: userId ? [userId] : [],
          isActive: true,
        })
        .returning();

      logger.info({ sessionId, appId, orgId }, '[Session] Command session created');

      publish('command-sessions', 'session:created', {
        sessionId,
        title: session.title,
        appId: session.appId,
        createdAt: session.createdAt,
      });

      sendCreated(res, { session, joined: false });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create session');
    }
  },
);

router.get(
  '/sessions/command/:sessionId',
  authMiddleware(),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const { sessionId } = req.params as { sessionId: string };

      const [session] = await db
        .select()
        .from(commandSessionsTable)
        .where(eq(commandSessionsTable.sessionId, sessionId))
        .limit(1);

      if (!session) {
        sendNotFound(res, `Session ${sessionId} not found`);
        return;
      }

      if (!assertTenantAccess(req, res, session.orgId)) return;

      sendSuccess(res, { session });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get session');
    }
  },
);

router.delete(
  '/sessions/command/:id',
  validateBody(bodyShape({})),
  authMiddleware(),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        sendBadRequest(res, 'Invalid id');
        return;
      }

      const orgIds = getUserOrgIds(req.user!);
      const orgFilter = orgIds !== null ? inArray(commandSessionsTable.orgId, [...orgIds]) : undefined;
      await db
        .update(commandSessionsTable)
        .set({ isActive: false, endedAt: new Date() })
        .where(and(eq(commandSessionsTable.id, id), orgFilter));

      publish('command-sessions', 'session:ended', { sessionId: id });
      sendSuccess(res, { ended: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to end session');
    }
  },
);

router.post(
  '/sessions/command/:sessionId/comments',
  authMiddleware(),
  perUserWriteSlidingLimiter,
  validateBody(sessionCommentCreateSchema),
  async (req, res) => {
    const { sessionId } = req.params as { sessionId: string };
    const { body, authorLabel, entityId, entityType } = req.body;

    try {
      const [session] = await db
        .select({ orgId: commandSessionsTable.orgId })
        .from(commandSessionsTable)
        .where(eq(commandSessionsTable.sessionId, sessionId))
        .limit(1);

      if (!session) {
        sendNotFound(res, `Session ${sessionId} not found`);
        return;
      }

      if (!assertTenantAccess(req, res, session.orgId)) return;

      const [comment] = await db
        .insert(commandSessionCommentsTable)
        .values({
          sessionId,
          authorUserId: req.user?.id ?? null,
          authorLabel: authorLabel ?? req.user?.displayName ?? 'Anonymous',
          entityId: entityId ?? null,
          entityType: entityType ?? null,
          body: body.trim(),
          resolved: false,
        })
        .returning();

      await db
        .update(commandSessionsTable)
        .set({ lastActivityAt: new Date() })
        .where(eq(commandSessionsTable.sessionId, sessionId));

      publish(`session:${sessionId}`, 'comment:added', comment);
      sendCreated(res, comment);
    } catch (err) {
      handleRouteError(res, err, 'Failed to post comment');
    }
  },
);

router.get(
  '/sessions/command/:sessionId/comments',
  authMiddleware(),
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { sessionId } = req.params as { sessionId: string };

      const [session] = await db
        .select({ orgId: commandSessionsTable.orgId })
        .from(commandSessionsTable)
        .where(eq(commandSessionsTable.sessionId, sessionId))
        .limit(1);

      if (!session) {
        sendNotFound(res, `Session ${sessionId} not found`);
        return;
      }

      if (!assertTenantAccess(req, res, session.orgId)) return;

      const limit = Math.min(Number(req.query.limit ?? 50), 200);

      const comments = await db
        .select()
        .from(commandSessionCommentsTable)
        .where(eq(commandSessionCommentsTable.sessionId, sessionId))
        .orderBy(desc(commandSessionCommentsTable.createdAt))
        .limit(limit);

      sendSuccess(res, { comments, count: comments.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch comments');
    }
  },
);

export default router;
