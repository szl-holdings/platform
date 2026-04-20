/**
 * /alloy/policies/llm-assist — auth + behavior tests (#2145)
 *
 * Locks the contract that the LLM-assist endpoint:
 *  1. Rejects unauthenticated requests with 401.
 *  2. Rejects authenticated non-admin requests with 403.
 *  3. Returns a graceful "llmAvailable: false" payload for an admin when the
 *     OpenAI proxy env vars are unset (no upstream call is made).
 */

import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let authUser: { id: number; role: string } | null = null;

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    () =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      (req as Request & { user: { id: number; role: string } }).user = authUser;
      next();
    },
  requireRole:
    (...roles: string[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as Request & { user?: { role: string } }).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      if (!roles.includes(user.role)) {
        res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
        return;
      }
      next();
    },
}));

let app: ReturnType<typeof express>;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  const { default: router } = await import('../alloy-policy-llm');
  app.use(router);
});

beforeEach(() => {
  authUser = null;
  delete process.env['AI_INTEGRATIONS_OPENAI_BASE_URL'];
  delete process.env['AI_INTEGRATIONS_OPENAI_API_KEY'];
});

describe('/alloy/policies/llm-assist', () => {
  const validBody = {
    sentence: 'the counterparty situation should be handled appropriately',
    deterministic: { effect: 'audit_only' as const, confidence: 0.4 },
  };

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).post('/alloy/policies/llm-assist').send(validBody);
    expect(res.status).toBe(401);
  });

  it('rejects non-admin authenticated requests with 403', async () => {
    authUser = { id: 7, role: 'operator' };
    const res = await request(app).post('/alloy/policies/llm-assist').send(validBody);
    expect(res.status).toBe(403);
  });

  it('rejects bodies that fail validation with 400', async () => {
    authUser = { id: 1, role: 'admin' };
    const res = await request(app).post('/alloy/policies/llm-assist').send({ sentence: '' });
    expect(res.status).toBe(400);
  });

  it('returns llmAvailable: false for admins when the LLM is not configured', async () => {
    authUser = { id: 1, role: 'admin' };
    const res = await request(app).post('/alloy/policies/llm-assist').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body?.llmAvailable).toBe(false);
    expect(res.body?.result).toBeNull();
    expect(res.body?.fallbackReason).toMatch(/not configured/i);
  });
});
