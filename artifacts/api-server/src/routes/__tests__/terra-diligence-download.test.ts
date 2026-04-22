/**
 * Terra Diligence Evidence — authenticated download route tests
 *
 * Verifies the contract for:
 *   GET /terra/cognitive/diligence-room/evidence/:evidenceId/download
 *
 * Scenarios covered:
 *   - 401 when neither session nor internal token is present (+ warn log)
 *   - 401 when an internal token fails verifyInternalHeader
 *   - 401 when token passes header check but scope is wrong
 *   - 403 when a session user is not the matter owner and has no privileged role (+ warn log)
 *   - 200 for the matter owner (session)
 *   - 200 for privileged roles (admin / super_admin / editor) — skips ownership check
 *   - 200 for a valid scoped internal token — skips ownership check entirely
 *   - 404 when the evidence record does not exist
 *   - 404 when the evidence has no /objects/ documentUrl (sha256: hash or null)
 *   - 404 when the object is missing from storage
 *   - 200 + Content-Disposition attachment + Content-Type passthrough + body streaming
 */

import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mutable test state ─────────────────────────────────────────────────────────

let _selectQueue: unknown[][] = [];
let _authUser: { id: number | string; roles: string[]; orgs?: unknown[] } | null = null;

// Internal-token mock state — tests can flip these per scenario.
let _tokenMatchResult: { context: string } | null = null;
let _tokenHasScopeResult = false;

// ── DB helpers ─────────────────────────────────────────────────────────────────

function makeCol(name: string) {
  return { _colName: name };
}
function makeTable(cols: string[]): Record<string, ReturnType<typeof makeCol>> {
  return Object.fromEntries(cols.map((c) => [c, makeCol(c)]));
}
function makeDbChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    groupBy: () => chain,
    innerJoin: () => chain,
    set: () => chain,
    values: () => chain,
    onConflictDoNothing: () => Promise.resolve(),
    returning: () => Promise.resolve(_selectQueue.shift() ?? []),
    limit: () => Promise.resolve(_selectQueue.shift() ?? []),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(_selectQueue.shift() ?? []).then(resolve, reject),
  };
  return chain;
}

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/constellation', () => ({
  queryNodes: vi.fn().mockResolvedValue({ nodes: [] }),
  queryEdges: vi.fn().mockResolvedValue({ edges: [] }),
}));

vi.mock('@workspace/guardian', () => ({
  computeApprovalExpiresAt: vi.fn().mockReturnValue(new Date()),
}));

vi.mock('@szl-holdings/db', () => {
  const db = {
    select: (_proj?: unknown) => makeDbChain(),
    insert: () => makeDbChain(),
    update: () => makeDbChain(),
    delete: () => makeDbChain(),
    transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(db),
  };
  return {
    db,
    terraDiligenceEvidenceTable: makeTable([
      'id', 'matterId', 'documentUrl', 'documentName', 'documentMimeType',
      'documentSize', 'category', 'label', 'source', 'summary', 'status',
      'confidence', 'evidenceDate', 'citations', 'documentSha256',
      'reviewedByName', 'reviewedByUserId', 'reviewedAt', 'createdAt', 'updatedAt',
    ]),
    terraDiligenceMattersTable: makeTable([
      'id', 'title', 'ownerUserId', 'status', 'stage', 'completionPct',
      'openedAt', 'updatedAt', 'isActive', 'propertyId', 'propertyExternalId',
      'borough', 'ownerName', 'targetCloseDate', 'notes',
    ]),
    guardianActionsTable: makeTable(['id', 'orgId', 'status']),
    guardianApprovalRequestsTable: makeTable(['id', 'orgId', 'status', 'requestId', 'expiresAt']),
    terraCovenantsTable: makeTable(['id', 'orgId']),
    terraDistressPropertiesTable: makeTable([
      'id', 'externalId', 'isActive', 'opportunityScore', 'address',
      'ownerName', 'ownerType', 'debtAmount', 'lienAmount', 'estimatedValue',
      'confidenceLevel', 'connectorSource', 'distressType', 'stage', 'borough', 'zipCode',
    ]),
    terraPropertiesTable: makeTable([
      'id', 'externalId', 'address', 'assessedValue', 'ownerName', 'ownerType', 'isActive', 'isDemo',
    ]),
    terraTransactionsTable: makeTable(['id']),
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ op: 'eq', col, val }),
  and: (...conds: unknown[]) => ({ op: 'and', conds }),
  or: (...conds: unknown[]) => ({ op: 'or', conds }),
  desc: (_col: unknown) => ({ op: 'desc' }),
  asc: (_col: unknown) => ({ op: 'asc' }),
  inArray: (col: unknown, vals: unknown[]) => ({ op: 'inArray', col, vals }),
  isNotNull: (_col: unknown) => ({ op: 'isNotNull' }),
  sql: (_parts: TemplateStringsArray, ..._vals: unknown[]) => ({ op: 'sql' }),
}));

vi.mock('../../middlewares/auth', () => ({
  authMiddleware:
    (opts: { required?: boolean } = {}) =>
    (req: Request, res: Response, next: NextFunction): void => {
      if (_authUser) {
        (req as Request & { user: typeof _authUser }).user = _authUser;
        next();
        return;
      }
      if (opts?.required) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
      }
      next();
    },
}));

const warnSpy = vi.fn();

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: warnSpy, debug: vi.fn() },
}));

vi.mock('../../lib/validation', () => ({
  validateBody: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  validateQuery: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  listQuerySchema: {},
  jsonObjectBodySchema: {},
}));

// Internal-token mock — reads from test-controlled state variables.
vi.mock('../../lib/internal-tokens', () => ({
  verifyInternalHeader: vi.fn((_token: string | undefined, _url: string) => _tokenMatchResult),
  tokenHasScope: vi.fn((_ctx: string, _scope: string) => _tokenHasScopeResult),
}));

vi.mock('../../lib/objectStorage', () => {
  class ObjectNotFoundError extends Error {
    constructor() {
      super('Object not found');
      this.name = 'ObjectNotFoundError';
    }
  }
  class ObjectStorageService {
    getPrivateObjectDir() { return '/bucket/.private'; }
    getPublicObjectSearchPaths() { return ['/bucket/public']; }
    normalizeObjectEntityPath(p: string) { return p; }
    async uploadBuffer(_buf: Buffer, subPath: string) { return `/objects/${subPath}`; }
    async getPresignedDownloadUrl() { return 'https://example.com/presigned'; }
    async downloadObjectToBuffer() { return Buffer.from(''); }
    async canAccessObjectEntity() { return true; }
    async trySetObjectEntityAclPolicy(p: string) { return p; }
    async searchPublicObject() { return null; }
    async getObjectEntityUploadURL() { return 'https://example.com/upload'; }

    async getObjectEntityFile(path: string) {
      if (path === '/objects/not-found') throw new ObjectNotFoundError();
      return { _path: path };
    }
    async downloadObject(_file: unknown, _ttl: number) {
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('PDF-CONTENT'));
          controller.close();
        },
      });
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'application/pdf', 'Content-Length': '11' },
      });
    }
  }
  return { ObjectStorageService, ObjectNotFoundError };
});

vi.mock('../../lib/agent-scheduler', () => ({
  dispatchCovenantBreaches: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/guardian-engine', () => ({
  publishGuardianDecisionEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/seed-guard', () => ({
  guardSeedInProduction: vi.fn(),
}));

vi.mock('../../lib/terra-covenant-store', () => ({
  evaluateAllCovenants: vi.fn().mockResolvedValue([]),
  ingestLoanFinancials: vi.fn().mockResolvedValue(undefined),
  seedCovenantsFromDistress: vi.fn().mockResolvedValue(undefined),
  syncLoanFinancialsFromDistress: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../lib/terra-distress-service', () => ({
  searchDistressedProperties: vi.fn().mockResolvedValue([]),
}));

vi.mock('multer', () => {
  const multerFn = () => ({
    single: () => (_req: Request, _res: Response, next: NextFunction) => next(),
  });
  (multerFn as unknown as { memoryStorage: () => Record<string, unknown> }).memoryStorage = () => ({});
  return { default: multerFn };
});

vi.mock('express-rate-limit', () => ({
  default: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

const EVIDENCE_ID = 'ev_abc12345';
const MATTER_ID = 'matter_ab1234';

const evidenceRow = {
  id: EVIDENCE_ID,
  matterId: MATTER_ID,
  documentUrl: '/objects/terra/diligence/matter_ab1234/uuid-report.pdf',
  documentName: 'title-commitment.pdf',
  documentMimeType: 'application/pdf',
  documentSize: 204800,
  category: 'title',
  label: 'Title Commitment',
  source: 'First American',
  summary: 'Clean title, no encumbrances',
  status: 'pending',
  confidence: '0.9',
  evidenceDate: '2026-04-01',
  citations: [],
  documentSha256: null,
  reviewedByName: null,
  reviewedByUserId: null,
  reviewedAt: null,
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-01'),
};

const matterRow = { ownerUserId: 42 };

/** Simulate a valid internal token with agent:write scope. */
function enableValidToken() {
  _tokenMatchResult = { context: 'agent:write' };
  _tokenHasScopeResult = true;
}

/** Simulate a token that fails header verification (wrong HMAC / path). */
function enableInvalidToken() {
  _tokenMatchResult = null;
  _tokenHasScopeResult = false;
}

/** Simulate a token that passes header verification but has insufficient scope. */
function enableWrongScopeToken() {
  _tokenMatchResult = { context: 'agent:read' };
  _tokenHasScopeResult = false;
}

// ── App builder ────────────────────────────────────────────────────────────────

async function buildApp(): Promise<Express> {
  const { default: router } = await import('../terra-cognitive');
  const application = express();
  application.use(express.json());
  application.use('/api', router);
  return application;
}

let app: Express;

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('GET /api/terra/cognitive/diligence-room/evidence/:id/download', () => {
  beforeEach(async () => {
    _selectQueue = [];
    _authUser = null;
    _tokenMatchResult = null;
    _tokenHasScopeResult = false;
    warnSpy.mockClear();
    app = await buildApp();
  });

  // ── Authentication ──────────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when neither session nor internal token is present', async () => {
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('emits a warn log for unauthenticated download attempts', async () => {
      await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({ evidenceId: EVIDENCE_ID }),
        expect.stringContaining('unauthenticated'),
      );
    });

    it('returns 401 when the internal token fails header verification', async () => {
      enableInvalidToken();
      const res = await request(app)
        .get(`/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`)
        .set('x-internal-token', 'bad-token');
      expect(res.status).toBe(401);
    });

    it('returns 401 when the token passes header check but lacks agent:write scope', async () => {
      enableWrongScopeToken();
      const res = await request(app)
        .get(`/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`)
        .set('x-internal-token', 'wrong-scope-token');
      expect(res.status).toBe(401);
    });
  });

  // ── Internal-token path ─────────────────────────────────────────────────────

  describe('internal-token authorization', () => {
    it('returns 200 for a valid agent:write scoped token (bypasses ownership check)', async () => {
      enableValidToken();
      _selectQueue = [[evidenceRow]]; // only evidence row needed — no matter lookup
      const res = await request(app)
        .get(`/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`)
        .set('x-internal-token', 'valid-agent-token');
      expect(res.status).toBe(200);
    });

    it('does not perform a matter owner lookup when a valid token is used', async () => {
      enableValidToken();
      // Only one DB call (evidence lookup) should be consumed.
      // If the ownership query were made it would consume the second entry and
      // the test would still pass, but we verify by providing only one row.
      _selectQueue = [[evidenceRow]];
      const res = await request(app)
        .get(`/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`)
        .set('x-internal-token', 'valid-agent-token');
      expect(res.status).toBe(200);
      // Queue should be empty — no extra DB call was made.
      expect(_selectQueue.length).toBe(0);
    });
  });

  // ── Session-user ownership ──────────────────────────────────────────────────

  describe('ownership / authorization (session users)', () => {
    it('returns 403 when caller is authenticated but is not the matter owner', async () => {
      _authUser = { id: 99, roles: ['member'] };
      _selectQueue = [[evidenceRow], [matterRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('emits a warn log when a forbidden download is attempted', async () => {
      _authUser = { id: 99, roles: ['member'] };
      _selectQueue = [[evidenceRow], [matterRow]];
      await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.objectContaining({ evidenceId: EVIDENCE_ID, userId: 99 }),
        expect.stringContaining('forbidden'),
      );
    });

    it('allows the matter owner (ownerUserId match) to download', async () => {
      _authUser = { id: 42, roles: ['member'] };
      _selectQueue = [[evidenceRow], [matterRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(200);
    });

    it('allows admin role without an ownership check', async () => {
      _authUser = { id: 999, roles: ['admin'] };
      _selectQueue = [[evidenceRow]]; // no matter row needed
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(200);
    });

    it('allows super_admin role', async () => {
      _authUser = { id: 888, roles: ['super_admin'] };
      _selectQueue = [[evidenceRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(200);
    });

    it('allows editor role', async () => {
      _authUser = { id: 777, roles: ['editor'] };
      _selectQueue = [[evidenceRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(200);
    });
  });

  // ── Not-found cases ─────────────────────────────────────────────────────────

  describe('not-found cases', () => {
    it('returns 404 when the evidence record does not exist', async () => {
      _authUser = { id: 42, roles: ['admin'] };
      _selectQueue = [[]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/ev_ghost/download`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Evidence not found/);
    });

    it('returns 404 when the evidence has a sha256: documentUrl', async () => {
      _authUser = { id: 42, roles: ['admin'] };
      _selectQueue = [[{ ...evidenceRow, documentUrl: 'sha256:abc123' }]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/No downloadable document/);
    });

    it('returns 404 when the evidence has a null documentUrl', async () => {
      _authUser = { id: 42, roles: ['admin'] };
      _selectQueue = [[{ ...evidenceRow, documentUrl: null }]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(404);
    });

    it('returns 404 when the object is missing from storage', async () => {
      _authUser = { id: 42, roles: ['admin'] };
      _selectQueue = [[{ ...evidenceRow, documentUrl: '/objects/not-found' }]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found in storage/);
    });
  });

  // ── Successful download ─────────────────────────────────────────────────────

  describe('successful download', () => {
    it('returns 200 for the matter owner', async () => {
      _authUser = { id: 42, roles: ['member'] };
      _selectQueue = [[evidenceRow], [matterRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(200);
    });

    it('sets Content-Disposition: attachment with the document filename', async () => {
      _authUser = { id: 42, roles: ['admin'] };
      _selectQueue = [[evidenceRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('title-commitment.pdf');
    });

    it('passes through the Content-Type from storage metadata', async () => {
      _authUser = { id: 42, roles: ['admin'] };
      _selectQueue = [[evidenceRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('streams the file body', async () => {
      _authUser = { id: 42, roles: ['admin'] };
      _selectQueue = [[evidenceRow]];
      const res = await request(app).get(
        `/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`,
      );
      // For binary Content-Type responses supertest exposes the body as a Buffer.
      const bodyStr = Buffer.isBuffer(res.body) ? res.body.toString() : res.text ?? '';
      expect(bodyStr).toBe('PDF-CONTENT');
    });

    it('returns 200 via internal token + streams correctly', async () => {
      enableValidToken();
      _selectQueue = [[evidenceRow]];
      const res = await request(app)
        .get(`/api/terra/cognitive/diligence-room/evidence/${EVIDENCE_ID}/download`)
        .set('x-internal-token', 'valid-agent-token');
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
      const bodyStr = Buffer.isBuffer(res.body) ? res.body.toString() : res.text ?? '';
      expect(bodyStr).toBe('PDF-CONTENT');
    });
  });
});
