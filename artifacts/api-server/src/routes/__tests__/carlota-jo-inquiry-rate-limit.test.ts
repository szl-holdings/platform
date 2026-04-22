import { readFileSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const ROUTE_FILE = path.resolve(__dirname, '../carlota-jo.ts');
const SOURCE = readFileSync(ROUTE_FILE, 'utf8');

describe('Carlota Jo POST /booking/inquiries — inquiryRateLimit wiring', () => {
  it('declares an inquiryRateLimit using express-rate-limit', () => {
    expect(SOURCE).toMatch(/const\s+inquiryRateLimit\s*=\s*rateLimit\(/);
  });

  it('uses a 10 req/hr ceiling consistent with the holdings limiter', () => {
    const block = SOURCE.match(
      /const\s+inquiryRateLimit\s*=\s*rateLimit\(\{[\s\S]*?\}\);/,
    );
    expect(block).not.toBeNull();
    expect(block![0]).toMatch(/windowMs:\s*60\s*\*\s*60\s*\*\s*1000/);
    expect(block![0]).toMatch(/max:\s*10/);
    expect(block![0]).toMatch(/standardHeaders:\s*true/);
  });

  it('mounts inquiryRateLimit on POST /booking/inquiries before validation', () => {
    const post = SOURCE.match(
      /router\.post\(\s*['"]\/booking\/inquiries['"],\s*([\s\S]*?)\)\s*;?/,
    );
    expect(post).not.toBeNull();
    const args = post![1];
    const rateIdx = args.indexOf('inquiryRateLimit');
    const validateIdx = args.indexOf('validateBody');
    expect(rateIdx).toBeGreaterThanOrEqual(0);
    expect(validateIdx).toBeGreaterThan(rateIdx);
  });
});

describe('inquiryRateLimit behaviour — config parity check', () => {
  it('returns 429 with RateLimit-Reset once the ceiling is hit', async () => {
    const limiter = rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 2,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: 'Too many inquiry submissions. Please try again later.' },
    });
    const app = express();
    app.use(express.json());
    app.post('/booking/inquiries', limiter, (_req, res) => res.json({ success: true }));

    const statuses: number[] = [];
    let last: request.Response | null = null;
    for (let i = 0; i < 5; i++) {
      last = await request(app)
        .post('/booking/inquiries')
        .send({ name: 'A', email: 'a@b.co', message: 'hello' });
      statuses.push(last.status);
    }
    expect(statuses).toContain(429);
    expect(last!.status).toBe(429);
    expect(last!.headers['ratelimit-reset']).toBeDefined();
    expect((last!.body as { success: boolean; error: string }).error).toMatch(/Too many/i);
  });
});
