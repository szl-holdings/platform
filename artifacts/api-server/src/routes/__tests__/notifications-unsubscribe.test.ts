/**
 * GET /api/notifications/unsubscribe
 *
 * Covers the digest unsubscribe flow:
 *   1. Missing query params           → 400
 *   2. Invalid HMAC token             → 400
 *   3. Valid token, user found        → sets email_enabled=false, returns 200 HTML
 *   4. Valid token, user not found    → logs warning, still returns 200 HTML
 *   5. DB error during upsert         → returns 500
 */

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockOnConflictDoUpdate = vi.fn();
const mockInsertValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }));
const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
  notificationPreferencesTable: { userId: 'user_id' },
  usersTable: { email: 'email', id: 'id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}));

const mockVerify = vi.fn();
vi.mock('../../lib/email', () => ({
  verifyUnsubscribeToken: mockVerify,
  addEmailSuppression: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

async function buildApp() {
  const { default: router } = await import('../email-webhooks');
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

describe('GET /api/notifications/unsubscribe', () => {
  beforeEach(() => {
    vi.resetModules();
    mockVerify.mockReset();
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
    mockLimit.mockResolvedValue([{ id: 1 }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when email param is missing', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/notifications/unsubscribe?t=sometoken');
    expect(res.status).toBe(400);
    expect(res.text).toContain('Invalid unsubscribe link');
  });

  it('returns 400 when token param is missing', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/notifications/unsubscribe?e=user@example.com');
    expect(res.status).toBe(400);
    expect(res.text).toContain('Invalid unsubscribe link');
  });

  it('returns 400 when HMAC token is invalid', async () => {
    mockVerify.mockReturnValue(false);
    const app = await buildApp();
    const res = await request(app).get(
      '/api/notifications/unsubscribe?e=user@example.com&t=badtoken',
    );
    expect(res.status).toBe(400);
    expect(res.text).toContain('Invalid or expired');
  });

  it('sets email_enabled=false and returns 200 when user is found', async () => {
    mockVerify.mockReturnValue(true);
    const app = await buildApp();
    const res = await request(app).get(
      '/api/notifications/unsubscribe?e=user@example.com&t=validtoken',
    );
    expect(res.status).toBe(200);
    expect(res.text).toContain('unsubscribed from notification emails');
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockOnConflictDoUpdate).toHaveBeenCalledOnce();
  });

  it('still returns 200 when no matching user is found (email not in system)', async () => {
    mockVerify.mockReturnValue(true);
    mockLimit.mockResolvedValue([]);
    const app = await buildApp();
    const res = await request(app).get(
      '/api/notifications/unsubscribe?e=ghost@example.com&t=validtoken',
    );
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns 500 when the DB upsert throws', async () => {
    mockVerify.mockReturnValue(true);
    mockOnConflictDoUpdate.mockRejectedValue(new Error('DB connection lost'));
    const app = await buildApp();
    const res = await request(app).get(
      '/api/notifications/unsubscribe?e=user@example.com&t=validtoken',
    );
    expect(res.status).toBe(500);
  });
});
