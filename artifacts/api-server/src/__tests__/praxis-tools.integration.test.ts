/**
 * PRAXIS Tool Bridge — Integration Tests
 *
 * Tests the HTTP route handlers defined in routes/praxis-tools.ts.
 * Verifies that each route:
 *   - returns 400 on invalid/missing required fields
 *   - returns 200 with the correct response schema on valid input
 *   - marketing-audit: detects generic CTA and produces findings array
 *   - seo-audit: validates URL format and returns keyword gaps
 *   - finance-terminal: returns non-empty entity data with AGPL isolation notice
 *
 * Routes under test:
 *   POST /praxis-tools/marketing-audit
 *   POST /praxis-tools/seo-audit
 *   POST /praxis-tools/finance-terminal
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => ({ db: {}, eq: vi.fn(), and: vi.fn() }));

vi.mock('drizzle-orm', async () => {
  const noop = () => ({});
  return { eq: noop, and: noop, or: noop, desc: noop, sql: noop };
});

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Stub api-response helpers so we don't need a full Express setup
vi.mock('../lib/api-response', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../lib/api-response')>();
  return {
    ...orig,
    handleRouteError: (_res: Response, err: unknown, _ctx: string) => {
      throw err;
    },
  };
});

// Stub thirdPartyCall so tests bypass policy enforcement and leaderStore
// The stub always returns ok:true, simulating an allowed policy gate.
vi.mock('../routes/nexus', () => ({
  thirdPartyCall: async (_leaderId: string, _ctx: unknown, fn: () => Promise<unknown>) => {
    const result = await fn();
    return {
      ok: true,
      policyDecision: 'allowed' as const,
      result,
      error: undefined,
      durationMs: 1,
      requestHash: 'test-hash-0000000000000000',
      tokensEstimate: 0,
      costEstimateUsd: 0,
    };
  },
}));

// ─── App setup ────────────────────────────────────────────────────────────────

let app: express.Express;

beforeAll(async () => {
  const { default: praxisToolsRouter } = await import('../routes/praxis-tools');

  app = express();
  app.use(express.json());
  // Mount at root — lazyMatch in routes/index.ts does NOT strip the prefix before
  // delegating to the router, so req.path still contains '/praxis-tools/...' when
  // the handler fires. Mounting without a prefix here replicates that behaviour.
  app.use(praxisToolsRouter);

  // Generic error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: String(err) });
  });
});

// ─── Marketing Audit ─────────────────────────────────────────────────────────

describe('POST /praxis-tools/marketing-audit', () => {
  it('returns 400 when creative is missing', async () => {
    const res = await request(app).post('/praxis-tools/marketing-audit').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when creative is empty', async () => {
    const res = await request(app)
      .post('/praxis-tools/marketing-audit')
      .send({ creative: '' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid ad creative and detects generic CTA', async () => {
    const res = await request(app)
      .post('/praxis-tools/marketing-audit')
      .send({
        creative: 'Comprehensive Marketing Solutions for Growing Teams. Learn More.',
        platform: 'google_ads',
      });

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;

    // Schema checks
    expect(typeof body.audit_id).toBe('string');
    expect(body.audit_id).toMatch(/^mkt_/);
    expect(body.platform).toBe('google_ads');
    expect(typeof body.total_checks).toBe('number');
    expect(Array.isArray(body.findings)).toBe(true);
    expect(typeof body.duration_ms).toBe('number');
    expect(body.skill_pack).toContain('claude-ads');

    // "Learn More" is a generic CTA — CTA-001 should fire
    const findings = body.findings as Array<{ check_id: string; severity: string }>;
    const ctaFinding = findings.find((f) => f.check_id === 'CTA-001');
    expect(ctaFinding).toBeDefined();
    expect(ctaFinding?.severity).toBe('critical');
  });

  it('returns 200 for generic platform with valid creative', async () => {
    const res = await request(app)
      .post('/praxis-tools/marketing-audit')
      .send({ creative: 'Stop wasting ad budget. Book a free strategy call today.' });

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.platform).toBe('generic');
    // No generic CTA and has loss framing — CTA-001 and EMO-003 should not fire
    const findings = body.findings as Array<{ check_id: string }>;
    const ctaFinding = findings.find((f) => f.check_id === 'CTA-001');
    const emoFinding = findings.find((f) => f.check_id === 'EMO-003');
    expect(ctaFinding).toBeUndefined();
    expect(emoFinding).toBeUndefined();
  });
});

// ─── SEO Audit ───────────────────────────────────────────────────────────────

describe('POST /praxis-tools/seo-audit', () => {
  it('returns 400 when url is missing', async () => {
    const res = await request(app).post('/praxis-tools/seo-audit').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when url is not a valid URL', async () => {
    const res = await request(app)
      .post('/praxis-tools/seo-audit')
      .send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with a valid URL and keywords', async () => {
    const res = await request(app)
      .post('/praxis-tools/seo-audit')
      .send({
        url: 'https://szlholdings.com/carlota-jo/',
        keywords: ['fractional cmo services', 'b2b marketing consultant'],
      });

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;

    // Schema checks
    expect(typeof body.audit_id).toBe('string');
    expect(body.audit_id).toMatch(/^seo_/);
    expect(body.url).toBe('https://szlholdings.com/carlota-jo/');
    expect(typeof body.overall_score).toBe('number');
    expect(body.skill_pack).toContain('toprank');

    // Keyword gaps present
    const coverage = body.keyword_coverage as { top_gaps: unknown[] };
    expect(Array.isArray(coverage.top_gaps)).toBe(true);
    expect(coverage.top_gaps.length).toBeGreaterThan(0);

    // Recommendations present
    const recs = body.recommendations as Array<{ priority: number; impact: string }>;
    expect(Array.isArray(recs)).toBe(true);
    expect(recs[0]?.priority).toBe(1);
  });

  it('returns 200 with no keywords and produces top_gaps from domain', async () => {
    const res = await request(app)
      .post('/praxis-tools/seo-audit')
      .send({ url: 'https://example.com/page' });

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    const coverage = body.keyword_coverage as { top_gaps: Array<{ keyword: string }> };
    // Should still include the branded domain gap
    const domainGap = coverage.top_gaps.find((g) => g.keyword.includes('example.com'));
    expect(domainGap).toBeDefined();
  });
});

// ─── Finance Terminal ─────────────────────────────────────────────────────────

describe('POST /praxis-tools/finance-terminal', () => {
  it('returns 400 when entity is missing', async () => {
    const res = await request(app).post('/praxis-tools/finance-terminal').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when entity is empty', async () => {
    const res = await request(app)
      .post('/praxis-tools/finance-terminal')
      .send({ entity: '' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with entity data and AGPL isolation notice in fallback mode', async () => {
    // FINCEPT_MCP_ENDPOINT is not set in test env → fallback mode
    const res = await request(app)
      .post('/praxis-tools/finance-terminal')
      .send({ entity: 'SZL Holdings LLC', include_filings: true, include_ownership: true });

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;

    // Schema checks
    expect(typeof body.entity_id).toBe('string');
    expect(body.entity_id).toMatch(/^ent_/);
    expect(typeof body.name).toBe('string');
    expect(body.mcp_source).toBe('fallback');
    expect(body.skill_pack).toContain('Fincept');
    expect(body.agpl_isolation).toBeDefined();

    // Ownership and filings present when requested
    expect(Array.isArray(body.ownership)).toBe(true);
    expect((body.ownership as unknown[]).length).toBeGreaterThan(0);
    expect(Array.isArray(body.filings)).toBe(true);
    expect((body.filings as unknown[]).length).toBeGreaterThan(0);

    // Risk flags present
    expect(Array.isArray(body.risk_flags)).toBe(true);
    expect((body.risk_flags as unknown[]).length).toBeGreaterThan(0);

    // AI narrative present
    expect(typeof body.ai_narrative).toBe('string');
    expect((body.ai_narrative as string).length).toBeGreaterThan(50);
  });

  it('returns 200 with empty ownership and filings when not requested', async () => {
    const res = await request(app)
      .post('/praxis-tools/finance-terminal')
      .send({ entity: 'NEXUS Platform Inc.', include_filings: false, include_ownership: false });

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(Array.isArray(body.ownership)).toBe(true);
    expect((body.ownership as unknown[]).length).toBe(0);
    expect(Array.isArray(body.filings)).toBe(true);
    expect((body.filings as unknown[]).length).toBe(0);
  });
});

// ─── Tool Bridge Published Schema Contract ────────────────────────────────────
//
// These tests send the EXACT payload shape documented in the nexus-seed-data.ts
// inputSchema definitions for each tool. If any of these fail, it indicates a
// contract drift between the published Tool Bridge descriptor and the route handler.

describe('Tool Bridge published schema contract', () => {
  it('marketing.audit: accepts {creative, platform, context} and returns 200', async () => {
    const res = await request(app)
      .post('/praxis-tools/marketing-audit')
      .send({
        creative: 'Unlock peak productivity with our AI-powered platform. Try it free.',
        platform: 'linkedin',
        context: 'B2B SaaS targeting VP-level buyers',
      });
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.audit_id).toBe('string');
    expect(Array.isArray(body.findings)).toBe(true);
    expect(body.policy_decision).toBe('allowed');
  });

  it('marketing.audit: rejects payload with {input} (old field name) with 400', async () => {
    const res = await request(app)
      .post('/praxis-tools/marketing-audit')
      .send({ input: 'Some ad copy', platform: 'google_ads' });
    expect(res.status).toBe(400);
  });

  it('seo.audit: accepts {url, keywords} and returns 200', async () => {
    const res = await request(app)
      .post('/praxis-tools/seo-audit')
      .send({
        url: 'https://example.com/landing-page',
        keywords: ['AI productivity', 'workflow automation'],
      });
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.audit_id).toBe('string');
    expect(body.policy_decision).toBe('allowed');
  });

  it('seo.audit: rejects payload with {targetKeywords} (old field name) without url with 400', async () => {
    const res = await request(app)
      .post('/praxis-tools/seo-audit')
      .send({ targetKeywords: ['AI'], content: 'some page text' });
    expect(res.status).toBe(400);
  });

  it('finance.terminal: accepts {entity, include_filings, include_ownership} and returns 200', async () => {
    const res = await request(app)
      .post('/praxis-tools/finance-terminal')
      .send({
        entity: 'AAPL',
        include_filings: true,
        include_ownership: true,
      });
    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(typeof body.entity_id).toBe('string');
    expect(body.policy_decision).toBe('allowed');
  });

  it('finance.terminal: rejects payload with {ticker} (old field name) with 400', async () => {
    const res = await request(app)
      .post('/praxis-tools/finance-terminal')
      .send({ ticker: 'AAPL' });
    expect(res.status).toBe(400);
  });
});
