/**
 * Verifies that the notifications router publishes a `notifications_read`
 * WebSocket event whenever notifications are marked as read:
 *
 *   1. PATCH /notifications/:id/read  — single notification
 *   2. PATCH /notifications/read-all  — bulk mark-all-read
 *
 * This ensures badge counts in the NotificationBell and the mobile
 * useNotificationCount hook update in real time rather than waiting for the
 * 60-second polling interval.
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPublish = vi.fn();

vi.mock('../../lib/websocket', () => ({
  publish: mockPublish,
  WS_CHANNELS: { NOTIFICATIONS: 'notifications' },
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/platform-jobs', () => ({
  PLATFORM_JOB_TYPES: { NOTIFICATION_DISPATCH: 'notification_dispatch' },
}));

vi.mock('@szl-holdings/forge-runtime', () => ({
  durableJobQueue: { enqueue: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    (_opts?: unknown) =>
    (req: Record<string, unknown>, _res: unknown, next: () => void) => {
      req.user = { id: 7, platformRole: 'member' };
      next();
    },
  requireRole:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
  parseIdParam: (v: string) => {
    const n = parseInt(v, 10);
    if (isNaN(n)) throw new Error('Invalid id');
    return n;
  },
}));

// DB mock — each DB call path has its own terminal mock.
// PATCH /:id/read: db.select().from().where() → [existing]
// db.update().set().where().returning() → [updated]
// PATCH /read-all: db.update().set().where() → void

const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

const mockReturning = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdate = vi.fn();

const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => mockSelect(),
    update: () => mockUpdate(),
    delete: () => mockDelete(),
  },
  notificationsTable: { id: 'id', userId: 'userId', isRead: 'isRead' },
  notificationPreferencesTable: { userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => args),
  desc: vi.fn((col: unknown) => ({ desc: col })),
  count: vi.fn(() => 'count(*)'),
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: () => ({
    safeParse: () => ({ success: true, data: {} }),
  }),
}));

// ---------------------------------------------------------------------------
// App builder
// ---------------------------------------------------------------------------

let app: express.Express;

beforeEach(async () => {
  vi.resetModules();
  mockPublish.mockClear();

  const FAKE_NOTIFICATION = {
    id: 42,
    userId: 7,
    type: 'info',
    title: 'Test',
    message: 'Hello',
    isRead: false,
    readAt: null,
    actionUrl: null,
    channel: 'in_app',
    createdAt: new Date().toISOString(),
  };

  // select chain for :id/read existence check — .where() is terminal
  mockSelectWhere.mockResolvedValue([FAKE_NOTIFICATION]);
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere });
  mockSelect.mockReturnValue({ from: mockSelectFrom });

  // update chain for :id/read — .set().where().returning()
  mockReturning.mockResolvedValue([{ ...FAKE_NOTIFICATION, isRead: true, readAt: new Date() }]);
  mockUpdateWhere.mockReturnValue({ returning: mockReturning });
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
  mockUpdate.mockReturnValue({ set: mockUpdateSet });

  const { default: notificationsRouter } = await import('../notifications');
  app = express();
  app.use(express.json());
  app.use('/api', notificationsRouter);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('notifications read routes: WS publish', () => {
  it('PATCH /notifications/:id/read publishes notifications_read over the WS channel', async () => {
    const res = await request(app).patch('/api/notifications/42/read').send({});

    expect(res.status).toBe(200);
    expect(mockPublish).toHaveBeenCalledOnce();
    const [channel, event, payload] = mockPublish.mock.calls[0] as [string, string, unknown];
    expect(channel).toBe('notifications');
    expect(event).toBe('notifications_read');
    expect(payload).toMatchObject({ userId: 7, notificationId: 42 });
  });

  it('PATCH /notifications/:id/read returns 404 and does NOT publish when notification is not found', async () => {
    mockSelectWhere.mockResolvedValue([]);
    const res = await request(app).patch('/api/notifications/99/read').send({});

    expect(res.status).toBe(404);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('PATCH /notifications/read-all publishes notifications_read over the WS channel', async () => {
    // read-all: db.update().set().where() — no .returning()
    mockUpdateWhere.mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockUpdateSet });

    const res = await request(app).patch('/api/notifications/read-all').send({});

    expect(res.status).toBe(204);
    expect(mockPublish).toHaveBeenCalledOnce();
    const [channel, event, payload] = mockPublish.mock.calls[0] as [string, string, unknown];
    expect(channel).toBe('notifications');
    expect(event).toBe('notifications_read');
    expect(payload).toMatchObject({ userId: 7 });
  });

  it('PATCH /notifications/read-all payload does not include a notificationId (bulk operation)', async () => {
    mockUpdateWhere.mockResolvedValue(undefined);
    mockUpdateSet.mockReturnValue({ where: mockUpdateWhere });
    mockUpdate.mockReturnValue({ set: mockUpdateSet });

    await request(app).patch('/api/notifications/read-all').send({});

    expect(mockPublish).toHaveBeenCalledOnce();
    const payload = mockPublish.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(payload.notificationId).toBeUndefined();
  });
});
