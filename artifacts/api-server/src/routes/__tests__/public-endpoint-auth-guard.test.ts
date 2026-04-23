import express, { type NextFunction, type Request, type Response, Router } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => {
  const chain: Record<string, unknown> = {};
  Object.assign(chain, {
    from: () => chain,
    where: () => chain,
    innerJoin: () => chain,
    leftJoin: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve([]),
    set: () => chain,
    values: () => chain,
    returning: () => Promise.resolve([]),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve([]).then(resolve, reject),
  });
  return {
    db: {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
    },
    pool: { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) },
    orgMembersTable: { orgId: 'org_id', userId: 'user_id' },
    organizationsTable: { id: 'id', slug: 'slug', name: 'name' },
    carlotaInvoiceEmailLogTable: {},
    carlotaInvoicesTable: { id: 'id' },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  desc: (_c: unknown) => ({ op: 'desc' }),
}));

vi.mock('../../lib/api-response', () => ({
  sendUnauthorized: (res: Response, msg?: string) =>
    res.status(401).json({ error: msg ?? 'Unauthorized' }),
  sendBadRequest: (res: Response, msg: string) => res.status(400).json({ error: msg }),
  sendNotFound: (res: Response, entity: string) =>
    res.status(404).json({ error: `${entity} not found` }),
  sendSuccess: (res: Response, data: unknown) => res.status(200).json(data),
  sendError: (res: Response, msg: string, status: number) =>
    res.status(status).json({ error: msg }),
  handleRouteError: (res: Response, _err: unknown, msg: string) =>
    res.status(500).json({ error: msg }),
}));

vi.mock('../../lib/email', () => ({
  buildCarlotaInvoiceEmail: () => '<html>test</html>',
  CARLOTA_ADMIN_EMAIL: 'admin@test.example',
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg-id' }),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../lib/internal-tokens', () => ({
  verifyInternalHeader: () => null,
  tokenHasScope: () => false,
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: {
    recordAuthFailure: vi.fn(),
    recordTenantIsolationViolation: vi.fn(),
  },
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (_shape: unknown) => ({ parse: (v: unknown) => v }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware: (opts?: { required?: boolean }) => {
    const required = opts?.required ?? true;
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user && required) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    };
  },
  requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAnyAuth: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  denyIfReadOnly: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('../../lib/validation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/validation')>();
  return {
    ...actual,
    validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  };
});

vi.mock('express-rate-limit', () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@szl-holdings/ai-engine/providers/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'hello from test' } }],
        }),
      },
    },
  },
}));

vi.mock('@szl-holdings/ai-engine/providers/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'hello from test' }],
      }),
      stream: vi.fn(),
    },
  },
}));

import { globalAuthEnforcer, isAllowlistedPublicPath } from '../../middlewares/global-auth-enforcer';
import { tenantScope } from '../../middlewares/tenant-scope';

async function buildFullApp() {
  const { default: invoiceEmailRouter } = await import('../carlota-jo-invoice-email');
  const { default: copilotRouter } = await import('../copilot');

  const app = express();
  app.use(express.json());
  app.use(globalAuthEnforcer);

  const apiRouter = Router();
  apiRouter.use(invoiceEmailRouter);
  apiRouter.use('/copilot', tenantScope({ required: true }));
  apiRouter.use(copilotRouter);
  app.use('/api', apiRouter);

  return app;
}

describe('Public endpoint auth guard — integration tests (task #1367 regression)', () => {
  describe('POST /api/booking/invoices/email — public endpoint, no auth required', () => {
    it('returns non-401 for unauthenticated requests (reaches validation)', async () => {
      const app = await buildFullApp();

      const res = await request(app)
        .post('/api/booking/invoices/email')
        .send({ recipientEmail: 'test@example.com' });

      expect(res.status).not.toBe(401);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invoiceId|clientName|engagement|amount/i);
    });

    it('returns 400 with a validation message for a valid email but missing invoice fields', async () => {
      const app = await buildFullApp();

      const res = await request(app)
        .post('/api/booking/invoices/email')
        .send({
          recipientEmail: 'client@example.com',
          invoiceId: 'INV-001',
        });

      expect(res.status).not.toBe(401);
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing/invalid recipientEmail', async () => {
      const app = await buildFullApp();

      const res = await request(app)
        .post('/api/booking/invoices/email')
        .send({ recipientEmail: 'not-an-email' });

      expect(res.status).not.toBe(401);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/recipientEmail/i);
    });

    it('is listed in the global auth enforcer public allowlist', () => {
      expect(isAllowlistedPublicPath('/api/booking/invoices/email')).toBe(true);
    });
  });

  describe('GET /api/booking/invoices/email-log/:invoiceId — public endpoint', () => {
    it('returns non-401 for unauthenticated requests', async () => {
      const app = await buildFullApp();

      const res = await request(app)
        .get('/api/booking/invoices/email-log/INV-001');

      expect(res.status).not.toBe(401);
    });

    it('is listed in the global auth enforcer public allowlist as a prefix', () => {
      expect(isAllowlistedPublicPath('/api/booking/invoices/email-log/INV-001')).toBe(true);
    });
  });

  describe('POST /api/copilot/chat — protected endpoint, auth required', () => {
    it('returns 401 through globalAuthEnforcer when unauthenticated', async () => {
      const app = await buildFullApp();

      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ messages: [{ role: 'user', content: 'hi' }], stream: false });

      expect(res.status).toBe(401);
    });

    it('returns 401 via tenantScope when no user is present (bypassing globalAuthEnforcer)', async () => {
      const { default: copilotRouter } = await import('../copilot');

      const app = express();
      app.use(express.json());

      const apiRouter = Router();
      apiRouter.use('/copilot', tenantScope({ required: true }));
      apiRouter.use(copilotRouter);
      app.use('/api', apiRouter);

      const res = await request(app)
        .post('/api/copilot/chat')
        .send({ messages: [{ role: 'user', content: 'hi' }], stream: false });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it('is NOT listed in the global auth enforcer public allowlist', () => {
      expect(isAllowlistedPublicPath('/api/copilot/chat')).toBe(false);
    });
  });

  describe('allowlist boundary: invoice email vs email-log path distinction', () => {
    it('/api/booking/invoices/email is an exact public path', () => {
      expect(isAllowlistedPublicPath('/api/booking/invoices/email')).toBe(true);
    });

    it('/api/booking/invoices/email-log/ is a prefix-matched public path', () => {
      expect(isAllowlistedPublicPath('/api/booking/invoices/email-log/INV-001')).toBe(true);
      expect(isAllowlistedPublicPath('/api/booking/invoices/email-log/INV-999')).toBe(true);
    });

    it('other Carlota Jo booking paths remain public', () => {
      expect(isAllowlistedPublicPath('/api/booking/time-entries')).toBe(true);
      expect(isAllowlistedPublicPath('/api/booking/time-invoices')).toBe(true);
      expect(isAllowlistedPublicPath('/api/booking/services')).toBe(true);
      expect(isAllowlistedPublicPath('/api/booking/health')).toBe(true);
    });
  });
});
