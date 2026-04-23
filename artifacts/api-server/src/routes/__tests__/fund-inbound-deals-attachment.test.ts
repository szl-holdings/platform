/**
 * fund-inbound-deals — attachment download & preview tests
 *
 * Verifies the contract for:
 *   GET /fund-inbound-deals/:pipelineId/attachments/:idx
 *   GET /fund-inbound-deals/:pipelineId/attachments/:idx?preview=1
 *
 * Scenarios covered:
 *   - Default path: Content-Disposition is "attachment", Cache-Control is "no-store"
 *   - Preview path (?preview=1): Content-Disposition is "inline", Cache-Control allows caching
 *   - Content-Type from storage is passed through on both paths
 *   - File body is streamed on both paths
 *   - 400 on a non-integer or negative attachment index
 *   - 404 when the deal (pipelineId) is not found
 *   - 404 when the attachment index is out of bounds
 *   - 404 when the object no longer exists in storage
 */

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Shared mutable test state
// ---------------------------------------------------------------------------

const PIPELINE_ID = 'DF-TESTABCD';
const ATTACHMENT_NAME = 'pitch-deck.pdf';
const ATTACHMENT_CONTENT_TYPE = 'application/pdf';

const dealRow = {
  pipelineId: PIPELINE_ID,
  company: 'Acme Corp',
  sector: 'SaaS',
  stage: 'Series A',
  submittedAt: new Date('2026-04-01T10:00:00Z'),
  attachments: [
    {
      kind: 'deck' as const,
      name: ATTACHMENT_NAME,
      size: 204800,
      contentType: ATTACHMENT_CONTENT_TYPE,
      objectPath: '/objects/uploads/uuid/pitch-deck.pdf',
    },
  ],
};

// Allows individual tests to override the DB rows returned.
let _dealRows: typeof dealRow[] = [];

// ---------------------------------------------------------------------------
// Mock: @szl-holdings/db
// ---------------------------------------------------------------------------

vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(_dealRows),
        }),
        orderBy: () => ({
          limit: () => Promise.resolve(_dealRows),
        }),
      }),
    }),
  },
  fundInboundDealsTable: {
    pipelineId: 'pipelineId',
    submittedAt: 'submittedAt',
  },
}));

// ---------------------------------------------------------------------------
// Mock: object storage
// ---------------------------------------------------------------------------

const PDF_BODY = 'PDF-BYTES-CONTENT';

vi.mock('../../lib/objectStorage', () => {
  class ObjectNotFoundError extends Error {
    constructor(msg = 'Object not found') {
      super(msg);
      this.name = 'ObjectNotFoundError';
    }
  }

  class ObjectStorageService {
    uploadBuffer = vi.fn().mockResolvedValue('/objects/test/file.pdf');

    getObjectEntityFile(path: string) {
      if (path === '/objects/not-found') throw new ObjectNotFoundError();
      return Promise.resolve({ _path: path });
    }

    downloadObject(_file: unknown) {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(PDF_BODY));
          controller.close();
        },
      });
      return Promise.resolve(
        new Response(body, {
          status: 200,
          headers: {
            'Content-Type': ATTACHMENT_CONTENT_TYPE,
            'Content-Length': String(PDF_BODY.length),
          },
        }),
      );
    }
  }

  return { ObjectStorageService, ObjectNotFoundError };
});

// ---------------------------------------------------------------------------
// Mock: email, rate-limiters, validation, logger, contracts
// ---------------------------------------------------------------------------

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildDealSubmissionAckEmail: vi.fn().mockReturnValue({ subject: '', html: '', text: '' }),
}));

vi.mock('../../middlewares/rate-limiters', () => ({
  publicSubmitLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  publicUploadLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../lib/validation', () => ({
  validateBody: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  validateQuery: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@szl-holdings/contracts/common', () => ({
  bodyShape: () => ({ parse: (v: unknown) => v }),
}));

// ---------------------------------------------------------------------------
// Build app
// ---------------------------------------------------------------------------

const { default: dealRouter } = await import('../fund-inbound-deals.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(dealRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /fund-inbound-deals/:pipelineId/attachments/:idx', () => {
  beforeEach(() => {
    _dealRows = [{ ...dealRow, attachments: [...dealRow.attachments] }];
  });

  // ── Default download disposition ────────────────────────────────────────────

  describe('default download (no ?preview param)', () => {
    it('returns 200 for a valid deal and attachment index', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0`,
      );
      expect(res.status).toBe(200);
    });

    it('sets Content-Disposition: attachment', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0`,
      );
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('includes the filename in Content-Disposition', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0`,
      );
      expect(res.headers['content-disposition']).toContain('pitch-deck.pdf');
    });

    it('sets Cache-Control: no-store for the default download path', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0`,
      );
      expect(res.headers['cache-control']).toContain('no-store');
    });

    it('passes through the Content-Type from storage', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0`,
      );
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('streams the file body', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0`,
      );
      const bodyStr = Buffer.isBuffer(res.body) ? res.body.toString() : (res.text ?? '');
      expect(bodyStr).toBe(PDF_BODY);
    });
  });

  // ── Preview disposition (?preview=1) ────────────────────────────────────────

  describe('inline preview (?preview=1)', () => {
    it('returns 200 with ?preview=1', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0?preview=1`,
      );
      expect(res.status).toBe(200);
    });

    it('sets Content-Disposition: inline (not attachment) for preview', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0?preview=1`,
      );
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('inline');
      expect(res.headers['content-disposition']).not.toContain('attachment');
    });

    it('includes the filename in the inline Content-Disposition', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0?preview=1`,
      );
      expect(res.headers['content-disposition']).toContain('pitch-deck.pdf');
    });

    it('sets a private Cache-Control header for preview (allows browser caching)', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0?preview=1`,
      );
      expect(res.headers['cache-control']).toContain('private');
      expect(res.headers['cache-control']).not.toBe('no-store');
    });

    it('passes through the Content-Type from storage on preview', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0?preview=1`,
      );
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('streams the file body on the preview path', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0?preview=1`,
      );
      const bodyStr = Buffer.isBuffer(res.body) ? res.body.toString() : (res.text ?? '');
      expect(bodyStr).toBe(PDF_BODY);
    });

    it('does NOT treat ?preview=0 as a preview request', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0?preview=0`,
      );
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toContain('attachment');
    });
  });

  // ── Validation errors ────────────────────────────────────────────────────────

  describe('input validation', () => {
    it('returns 400 for a non-integer index', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/abc`,
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for a negative index', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/-1`,
      );
      expect(res.status).toBe(400);
    });
  });

  // ── Not-found cases ──────────────────────────────────────────────────────────

  describe('not-found cases', () => {
    it('returns 404 when the deal (pipelineId) is not found', async () => {
      _dealRows = [];
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/DF-NOTEXIST/attachments/0`,
      );
      expect(res.status).toBe(404);
    });

    it('returns 404 when the attachment index is out of bounds', async () => {
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/99`,
      );
      expect(res.status).toBe(404);
    });

    it('returns 404 when the object is missing from storage', async () => {
      _dealRows = [
        {
          ...dealRow,
          attachments: [
            {
              kind: 'deck',
              name: 'missing.pdf',
              size: 1024,
              contentType: 'application/pdf',
              objectPath: '/objects/not-found',
            },
          ],
        },
      ];
      const res = await request(buildApp()).get(
        `/fund-inbound-deals/${PIPELINE_ID}/attachments/0`,
      );
      expect(res.status).toBe(404);
    });
  });
});
