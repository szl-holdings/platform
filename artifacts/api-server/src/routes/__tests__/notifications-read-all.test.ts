/**
 * PATCH /notifications/read-all — bell-dropdown "Mark all read" action
 *
 * Verifies the endpoint that powers the "Mark all read" button in the
 * notification bell dropdown:
 *   1. Authenticated user → marks all unread notifications as read → 204
 *   2. Unauthenticated request → 401 (auth middleware blocks it)
 *   3. DB error during update → 500
 *   4. Publishes a WS notifications_read event with the caller's userId
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// DB mock state
// ---------------------------------------------------------------------------

let dbUpdateShouldThrow = false;
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();

vi.mock('@szl-holdings/db', () => {
  const makeUpdateChain = () => ({
    set: (vals: unknown) => {
      updateSetMock(vals);
      return {
        where: (cond: unknown) => {
          updateWhereMock(cond);
          if (dbUpdateShouldThrow) return Promise.reject(new Error('DB write error'));
          return Promise.resolve([]);
        },
      };
    },
  });

  return {
    db: { update: () => makeUpdateChain() },
    notificationsTable: { userId: 'userId', isRead: 'isRead' },
  };
});

// ---------------------------------------------------------------------------
// drizzle-orm operators — simple identity stubs
// ---------------------------------------------------------------------------

vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, val: unknown) => ({ op: 'eq', val }),
  and: (...args: unknown[]) => ({ op: 'and', args }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  count: () => ({ op: 'count' }),
}));

// ---------------------------------------------------------------------------
// WebSocket publish spy
// ---------------------------------------------------------------------------

const publishMock = vi.fn();
vi.mock('../../lib/websocket', () => ({
  publish: (...args: unknown[]) => publishMock(...args),
  WS_CHANNELS: { NOTIFICATIONS: 'notifications' },
}));

// ---------------------------------------------------------------------------
// Shared deps — logger, api-response, validation, contracts
// ---------------------------------------------------------------------------

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/api-response', () => ({
  sendSuccess: (res: Response, data: unknown, status = 200) => res.status(status).json(data),
  sendCreated: (res: Response, data: unknown) => res.status(201).json(data),
  sendNoContent: (res: Response) => res.status(204).send(),
  sendNotFound: (res: Response, entity: string) =>
    res.status(404).json({ error: `${entity} not found` }),
  sendBadRequest: (res: Response, msg: string) => res.status(400).json({ error: msg }),
  handleRouteError: (res: Response, _err: unknown, msg: string) =>
    res.status(500).json({ error: msg }),
  parsePagination: (_q: unknown) => ({ limit: 20, offset: 0, page: 1 }),
}));

vi.mock('../../lib/validation', () => ({
  validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  listQuerySchema: {},
  createNotificationSchema: {},
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: () => ({ parse: (v: unknown) => v }),
}));

vi.mock('../../lib/platform-jobs', () => ({ PLATFORM_JOB_TYPES: { NOTIFICATION_DISPATCH: 'nd' } }));
vi.mock('@szl-holdings/forge-runtime', () => ({
  durableJobQueue: { enqueue: vi.fn().mockResolvedValue(undefined) },
}));

// ---------------------------------------------------------------------------
// Auth middleware mock — controls currentUser
// ---------------------------------------------------------------------------

type MockUser = { id: number; email: string; roles: string[] };
let currentUser: MockUser | null = { id: 42, email: 'user@szlholdings.com', roles: ['member'] };

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (opts?: { required?: boolean }) => {
    const required = opts?.required ?? true;
    return (req: Request, res: Response, next: NextFunction) => {
      if (!currentUser && required) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (currentUser) (req as Request & { user?: MockUser }).user = currentUser;
      next();
    };
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  parseIdParam: (s: string) => parseInt(s, 10),
}));

// ---------------------------------------------------------------------------
// Build the Express app with the real notifications router
// ---------------------------------------------------------------------------

const { default: notificationsRouter } = await import('../notifications.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', notificationsRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PATCH /api/notifications/read-all — mark all as read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbUpdateShouldThrow = false;
    currentUser = { id: 42, email: 'user@szlholdings.com', roles: ['member'] };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 204 and updates all unread notifications for the authenticated user', async () => {
    const app = buildApp();
    const res = await request(app).patch('/api/notifications/read-all').send();

    expect(res.status).toBe(204);
    expect(updateSetMock).toHaveBeenCalledOnce();
    const setArgs = updateSetMock.mock.calls[0][0] as { isRead: boolean };
    expect(setArgs.isRead).toBe(true);
    expect(setArgs).toHaveProperty('readAt');
    expect(updateWhereMock).toHaveBeenCalledOnce();
  });

  it('publishes a notifications_read WS event with the caller userId', async () => {
    const app = buildApp();
    await request(app).patch('/api/notifications/read-all').send();

    expect(publishMock).toHaveBeenCalledOnce();
    const [channel, event, payload] = publishMock.mock.calls[0] as [string, string, { userId: number }];
    expect(channel).toBe('notifications');
    expect(event).toBe('notifications_read');
    expect(payload.userId).toBe(42);
  });

  it('returns 401 when the request is unauthenticated', async () => {
    currentUser = null;
    const app = buildApp();
    const res = await request(app).patch('/api/notifications/read-all').send();

    expect(res.status).toBe(401);
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the DB update throws', async () => {
    dbUpdateShouldThrow = true;
    const app = buildApp();
    const res = await request(app).patch('/api/notifications/read-all').send();

    expect(res.status).toBe(500);
  });
});
