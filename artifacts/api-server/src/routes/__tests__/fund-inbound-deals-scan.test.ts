import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const mockRow = {
  pipelineId: 'DF-SCAN1234',
  submittedAt: new Date('2026-04-22T12:00:00Z'),
  company: 'SecureCo',
  founderEmail: 'founder@secure.co',
  founderName: 'Alice Test',
  sector: 'SaaS',
  stage: 'Series A',
  convictionScore: 75,
  scoreTeam: 80,
  scoreMarket: 70,
  scoreProduct: 75,
  scoreTraction: 65,
  scoreCompetitive: 70,
  scoreFinancials: 60,
  status: 'screening',
  strengths: [],
  risks: [],
  attachments: [
    {
      kind: 'deck',
      name: 'pitch.pdf',
      size: 1234,
      contentType: 'application/pdf',
      objectPath: '/objects/uploads/abc/pitch.pdf',
      scanStatus: 'clean',
    },
    {
      kind: 'data-room',
      name: 'legacy.xlsx',
      size: 5678,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      objectPath: '/objects/uploads/def/legacy.xlsx',
    },
  ],
  source: 'inbound',
  notes: null,
  updatedAt: null,
  deckUrl: null,
  website: null,
  askSize: '$5M',
  valuation: '$25M',
  arr: null,
  growth: null,
  founderBackground: null,
  founderEducation: null,
  founderPriorExits: null,
  summary: 'Test company',
};

vi.mock('@szl-holdings/db', () => {
  const mockDb = {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([mockRow]),
      }),
    }),
    select: () => ({
      from: () => ({
        orderBy: () => ({
          limit: () => Promise.resolve([mockRow]),
        }),
        where: () => ({
          limit: () => Promise.resolve([mockRow]),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([mockRow]),
        }),
      }),
    }),
  };

  return {
    db: mockDb,
    fundInboundDealsTable: {
      pipelineId: 'pipelineId',
      submittedAt: 'submittedAt',
    },
  };
});

vi.mock('../../lib/objectStorage', () => ({
  ObjectStorageService: class MockObjectStorageService {
    uploadBuffer = vi.fn().mockResolvedValue('/objects/test/file.pdf');
    getObjectEntityFile = vi.fn().mockResolvedValue({
      getMetadata: () =>
        Promise.resolve([
          { size: 1234, contentType: 'application/pdf' },
        ]),
      createReadStream: () => {
        const { Readable } = require('node:stream');
        return Readable.from(Buffer.from('file content'));
      },
    });
    downloadObject = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/pdf' }),
      body: null,
    });
  },
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
}));

vi.mock('../../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildDealSubmissionAckEmail: vi.fn().mockReturnValue({
    subject: 'Received',
    html: '<p>ok</p>',
    text: 'ok',
  }),
}));

vi.mock('../../lib/platform-flags', () => ({
  isFlagEnabled: vi.fn().mockResolvedValue(true),
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

const { default: dealRouter } = await import('../fund-inbound-deals.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(dealRouter);
  return app;
}

describe('fund-inbound-deals — malware scan gate', () => {
  describe('POST /public/fund-inbound-deals/upload', () => {
    it('accepts a clean PDF upload and returns scanStatus: clean', async () => {
      const app = buildApp();
      const pdfContent = Buffer.from('%PDF-1.5 This is a test PDF document');

      const res = await request(app)
        .post('/public/fund-inbound-deals/upload')
        .attach('file', pdfContent, { filename: 'pitch.pdf', contentType: 'application/pdf' })
        .field('kind', 'deck');

      expect(res.status).toBe(200);
      expect(res.body.scanStatus).toBe('clean');
      expect(res.body.objectPath).toBeDefined();
    });

    it('rejects an EICAR test file upload with a clear error', async () => {
      const app = buildApp();
      const eicar = Buffer.from(
        'WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=',
        'base64',
      );

      const res = await request(app)
        .post('/public/fund-inbound-deals/upload')
        .attach('file', eicar, { filename: 'test.txt', contentType: 'text/plain' })
        .field('kind', 'deck');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('security scanner');
    });

    it('rejects a renamed executable uploaded as text/plain', async () => {
      const app = buildApp();
      const pe = Buffer.alloc(100);
      pe[0] = 0x4d;
      pe[1] = 0x5a;
      pe[2] = 0x90;

      const res = await request(app)
        .post('/public/fund-inbound-deals/upload')
        .attach('file', pe, { filename: 'readme.txt', contentType: 'text/plain' })
        .field('kind', 'deck');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('security scanner');
    });

    it('rejects a text file containing null bytes', async () => {
      const app = buildApp();
      const binary = Buffer.from('Hello\x00World');

      const res = await request(app)
        .post('/public/fund-inbound-deals/upload')
        .attach('file', binary, { filename: 'data.csv', contentType: 'text/csv' })
        .field('kind', 'data-room');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('security scanner');
    });
  });

  describe('GET /fund-inbound-deals (list)', () => {
    it('includes scanStatus for each attachment', async () => {
      const app = buildApp();
      const res = await request(app).get('/fund-inbound-deals');

      expect(res.status).toBe(200);
      const deal = res.body[0];
      expect(deal.attachments).toHaveLength(2);
      expect(deal.attachments[0].scanStatus).toBe('clean');
      expect(deal.attachments[1].scanStatus).toBe('pending');
    });
  });

  describe('GET /fund-inbound-deals/:pipelineId/attachments/:idx (download)', () => {
    it('allows download of a clean attachment', async () => {
      const app = buildApp();
      const res = await request(app).get('/fund-inbound-deals/DF-SCAN1234/attachments/0');

      expect(res.status).toBe(200);
    });

    it('blocks download of an attachment without scanStatus (defaults to pending)', async () => {
      const app = buildApp();
      const res = await request(app).get('/fund-inbound-deals/DF-SCAN1234/attachments/1');

      expect(res.status).toBe(451);
      expect(res.body.error).toContain('not yet been scanned');
    });
  });
});
