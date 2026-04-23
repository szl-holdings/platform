/**
 * Tests for the LP upload flow in the lp-portal router.
 *
 * Verifies:
 *  - GET /lp-portal/lps/:id/uploads returns uploads scoped to the LP
 *  - POST /lp-portal/lps/:id/uploads creates a record and logs activity
 *  - POST verifies GCS object existence when objectPath is provided
 *  - POST falls back to placeholder key in demo mode (no objectPath)
 *  - PATCH /lp-portal/uploads/:uploadId/review requires GP role
 *  - PATCH /lp-portal/uploads/:uploadId/review updates status
 *  - Unauthorised LP returns 403
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const _dbState: {
  lps: Array<Record<string, unknown>>;
  uploads: Array<Record<string, unknown>>;
  insertedUploads: Array<Record<string, unknown>>;
  insertedActivity: Array<Record<string, unknown>>;
  updatedUploads: Array<Record<string, unknown>>;
} = {
  lps: [],
  uploads: [],
  insertedUploads: [],
  insertedActivity: [],
  updatedUploads: [],
};

let _mockUser: { id: number; email: string; roles: string[] } | null = null;

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (ip: unknown) => `hashed_${ip}`,
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: (shape: Record<string, unknown>) => {
    const { z } = require('zod') as typeof import('zod');
    return z.object(shape);
  },
}));

vi.mock('../../lib/logger.js', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createLoggerMock();
});

vi.mock('../../lib/email.js', () => ({
  buildLpGpMessageEmail: vi.fn(),
  buildLpReportPublishedEmail: vi.fn(),
  generateUnsubscribeToken: vi.fn(),
  logNotificationAudit: vi.fn(),
  sendEmail: vi.fn(),
}));

const _objectStorageMock = {
  getObjectEntityFile: vi.fn(async (key: string) => {
    if (key.includes('missing')) {
      const err = new Error('not found');
      err.name = 'ObjectNotFoundError';
      (err as Record<string, unknown>).__isObjectNotFound = true;
      throw err;
    }
    return { key, size: 1024 };
  }),
};

vi.mock('../../lib/objectStorage.js', () => {
  class ObjectNotFoundError extends Error {
    name = 'ObjectNotFoundError';
    __isObjectNotFound = true;
  }
  return {
    ObjectStorageService: class {
      getObjectEntityFile = _objectStorageMock.getObjectEntityFile;
    },
    ObjectNotFoundError,
  };
});

vi.mock('../../lib/validation.js', () => ({
  listQuerySchema: {},
  validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  validateQuery: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware: (_opts?: { required?: boolean }) => {
    return (req: Record<string, unknown>, _res: unknown, next: () => void) => {
      if (_mockUser) req.user = _mockUser;
      next();
    };
  },
  parseIdParam: (val: string) => {
    const n = Number(val);
    if (Number.isNaN(n) || n < 1) throw new Error('Invalid ID');
    return n;
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('@szl-holdings/db', () => {
  function makeSelectChain(initialTable?: { _name?: string }) {
    let _table = initialTable ?? {};
    const chain: Record<string, unknown> = {};
    chain.from = (t: { _name?: string }) => {
      _table = t;
      return chain;
    };
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => {
      return resolveRows();
    };
    function resolveRows() {
      const name = _table?._name;
      if (name === 'fund_accredited_investors') return Promise.resolve(_dbState.lps);
      if (name === 'fund_lp_uploads') return Promise.resolve(_dbState.uploads);
      return Promise.resolve([]);
    }
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      resolveRows().then(resolve, reject);
    chain.catch = (rej: (e: unknown) => void) => resolveRows().catch(rej);
    return chain;
  }

  function makeInsertChain(table: { _name?: string }) {
    return {
      values: (vals: Record<string, unknown>) => ({
        returning: () => {
          const name = table?._name;
          const record = { id: Math.floor(Math.random() * 10000), ...vals, createdAt: new Date() };
          if (name === 'fund_lp_uploads') {
            _dbState.insertedUploads.push(record);
          } else if (name === 'fund_lp_activity_events') {
            _dbState.insertedActivity.push(record);
          }
          return Promise.resolve([record]);
        },
        onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
        catch: () => Promise.resolve([]),
      }),
    };
  }

  function makeUpdateChain(table: { _name?: string }) {
    return {
      set: (vals: Record<string, unknown>) => ({
        where: () => ({
          returning: () => {
            if (table?._name === 'fund_lp_uploads' && _dbState.uploads.length > 0) {
              const updated = { ..._dbState.uploads[0], ...vals };
              _dbState.updatedUploads.push(updated);
              return Promise.resolve([updated]);
            }
            return Promise.resolve([]);
          },
        }),
      }),
    };
  }

  const fundAccreditedInvestorsTable = {
    _name: 'fund_accredited_investors',
    id: { _col: 'id' },
    lpName: { _col: 'lp_name' },
    contactEmail: { _col: 'contact_email' },
  };
  const fundLpUploadsTable = {
    _name: 'fund_lp_uploads',
    id: { _col: 'id' },
    lpId: { _col: 'lp_id' },
    createdAt: { _col: 'created_at' },
    status: { _col: 'status' },
    docType: { _col: 'doc_type' },
    isDemo: { _col: 'is_demo' },
  };
  const fundLpActivityEventsTable = { _name: 'fund_lp_activity_events' };

  const db = {
    select: () => makeSelectChain(),
    insert: (table: { _name?: string }) => makeInsertChain(table),
    update: (table: { _name?: string }) => makeUpdateChain(table),
    delete: () => ({ where: () => Promise.resolve([]) }),
  };

  const stubTable = {};
  return new Proxy(
    {
      db,
      fundAccreditedInvestorsTable,
      fundLpUploadsTable,
      fundLpActivityEventsTable,
    } as Record<string, unknown>,
    {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        return stubTable;
      },
      has() {
        return true;
      },
    },
  );
});

vi.mock('drizzle-orm', async () => {
  const m = await import('../../__tests__/helpers/mocks.js');
  return m.createDrizzleOrmMock();
});

async function buildApp() {
  const mod = await import('../lp-portal.js');
  const app = express();
  app.use(express.json());
  app.use('/api', mod.default);
  return app;
}

const DEMO_LP = {
  id: 1,
  lpName: 'Acme Capital',
  contactEmail: 'lp@acme.com',
  qualifiedEligiblePerson: false,
  metadata: { is_demo: true },
};

const GP_USER = { id: 10, email: 'admin@szl.com', roles: ['admin'] };
const LP_USER = { id: 20, email: 'lp@acme.com', roles: ['member'] };

describe('LP upload flow', () => {
  beforeEach(() => {
    _dbState.lps = [DEMO_LP];
    _dbState.uploads = [];
    _dbState.insertedUploads = [];
    _dbState.insertedActivity = [];
    _dbState.updatedUploads = [];
    _mockUser = null;
    vi.clearAllMocks();
  });

  describe('GET /api/lp-portal/lps/:id/uploads', () => {
    it('returns empty array when LP has no uploads', async () => {
      const app = await buildApp();
      const res = await request(app).get('/api/lp-portal/lps/1/uploads');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns upload records for the LP', async () => {
      _dbState.uploads = [
        {
          id: 101,
          lpId: 1,
          originalName: 'signed-sub-agreement.pdf',
          mimeType: 'application/pdf',
          size: 204800,
          docType: 'signed_agreement',
          status: 'received',
          notes: 'Fund II subscription',
          createdAt: new Date('2026-01-15'),
          reviewedAt: null,
        },
      ];
      const app = await buildApp();
      const res = await request(app).get('/api/lp-portal/lps/1/uploads');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: 101,
        originalName: 'signed-sub-agreement.pdf',
        docType: 'signed_agreement',
        status: 'received',
      });
    });

    it('returns 403 for unauthorized LP', async () => {
      _dbState.lps = [];
      const app = await buildApp();
      const res = await request(app).get('/api/lp-portal/lps/999/uploads');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/lp-portal/lps/:id/uploads', () => {
    it('creates an upload record with activity log', async () => {
      const app = await buildApp();
      const res = await request(app)
        .post('/api/lp-portal/lps/1/uploads')
        .send({
          originalName: 'wire-confirm.pdf',
          docType: 'wire_confirmation',
          notes: 'Capital call #3 wire',
          mimeType: 'application/pdf',
          size: 51200,
        });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        originalName: 'wire-confirm.pdf',
        docType: 'wire_confirmation',
        status: 'received',
      });
      expect(_dbState.insertedUploads).toHaveLength(1);
      expect(_dbState.insertedUploads[0]).toMatchObject({
        lpId: 1,
        docType: 'wire_confirmation',
        status: 'received',
      });
    });

    it('generates placeholder storageKey when no objectPath provided (demo mode)', async () => {
      const app = await buildApp();
      await request(app)
        .post('/api/lp-portal/lps/1/uploads')
        .send({
          originalName: 'kyc-docs.pdf',
          docType: 'kyc_document',
          mimeType: 'application/pdf',
          size: 10240,
        });
      expect(_dbState.insertedUploads).toHaveLength(1);
      expect(_dbState.insertedUploads[0].storageKey).toMatch(/^lp_uploads\/1\//);
    });

    it('uses provided objectPath when GCS object exists', async () => {
      const app = await buildApp();
      const res = await request(app)
        .post('/api/lp-portal/lps/1/uploads')
        .send({
          objectPath: 'lp_uploads/1/existing-file.pdf',
          originalName: 'agreement.pdf',
          docType: 'signed_agreement',
          mimeType: 'application/pdf',
          size: 102400,
        });
      expect(res.status).toBe(201);
      expect(_dbState.insertedUploads[0].storageKey).toBe('lp_uploads/1/existing-file.pdf');
    });

    it('calls GCS verification when objectPath is provided', async () => {
      const app = await buildApp();
      await request(app)
        .post('/api/lp-portal/lps/1/uploads')
        .send({
          objectPath: 'lp_uploads/1/some-file.pdf',
          originalName: 'agreement.pdf',
          docType: 'signed_agreement',
          mimeType: 'application/pdf',
          size: 102400,
        });
      expect(_objectStorageMock.getObjectEntityFile).toHaveBeenCalledWith(
        'lp_uploads/1/some-file.pdf',
      );
    });

    it('returns 403 when LP not found', async () => {
      _dbState.lps = [];
      const app = await buildApp();
      const res = await request(app)
        .post('/api/lp-portal/lps/999/uploads')
        .send({ originalName: 'test.pdf' });
      expect(res.status).toBe(403);
    });

    it('marks upload as demo when LP is demo', async () => {
      const app = await buildApp();
      await request(app)
        .post('/api/lp-portal/lps/1/uploads')
        .send({
          originalName: 'demo-file.pdf',
          docType: 'other',
          mimeType: 'application/pdf',
          size: 1024,
        });
      expect(_dbState.insertedUploads[0].isDemo).toBe(true);
    });
  });

  describe('PATCH /api/lp-portal/uploads/:uploadId/review', () => {
    beforeEach(() => {
      _dbState.uploads = [
        {
          id: 200,
          lpId: 1,
          originalName: 'sub-agreement.pdf',
          status: 'received',
          docType: 'signed_agreement',
          reviewedAt: null,
          reviewedByUserId: null,
        },
      ];
    });

    it('allows GP user to accept an upload', async () => {
      _mockUser = GP_USER;
      const app = await buildApp();
      const res = await request(app)
        .patch('/api/lp-portal/uploads/200/review')
        .send({ status: 'accepted', notes: 'Verified signature' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'accepted' });
    });

    it('allows GP user to reject an upload', async () => {
      _mockUser = GP_USER;
      const app = await buildApp();
      const res = await request(app)
        .patch('/api/lp-portal/uploads/200/review')
        .send({ status: 'rejected', notes: 'Missing signature on page 3' });
      expect(res.status).toBe(200);
      expect(_dbState.updatedUploads).toHaveLength(1);
      expect(_dbState.updatedUploads[0].status).toBe('rejected');
    });

    it('forbids non-GP user from reviewing', async () => {
      _mockUser = LP_USER;
      const app = await buildApp();
      const res = await request(app)
        .patch('/api/lp-portal/uploads/200/review')
        .send({ status: 'accepted' });
      expect(res.status).toBe(403);
    });

    it('returns 404 when upload not found', async () => {
      _dbState.uploads = [];
      _mockUser = GP_USER;
      const app = await buildApp();
      const res = await request(app)
        .patch('/api/lp-portal/uploads/9999/review')
        .send({ status: 'reviewed' });
      expect(res.status).toBe(404);
    });
  });
});
