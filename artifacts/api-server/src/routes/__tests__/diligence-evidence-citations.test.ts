import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { __evidenceCitationSchema } from '../terra-cognitive';

const ROUTE_FILE = path.resolve(__dirname, '../terra-cognitive.ts');
const SOURCE = readFileSync(ROUTE_FILE, 'utf8');

describe('Terra diligence evidence citation schema (task #1355)', () => {
  it('accepts a minimal { ref, excerpt } citation', () => {
    const r = __evidenceCitationSchema.safeParse({
      ref: 'Schedule B-II §4',
      excerpt: 'Subject to easement of record per Liber 1234, Page 56.',
    });
    expect(r.success).toBe(true);
  });

  it('accepts a full { ref, page, excerpt, url } citation', () => {
    const r = __evidenceCitationSchema.safeParse({
      ref: 'ESA Phase I Report',
      page: 12,
      excerpt: 'Recommended action: Phase II investigation in NW corner.',
      url: 'https://example.com/esa-report.pdf',
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty ref', () => {
    const r = __evidenceCitationSchema.safeParse({ ref: '', excerpt: 'something' });
    expect(r.success).toBe(false);
  });

  it('rejects empty excerpt', () => {
    const r = __evidenceCitationSchema.safeParse({ ref: 'Doc 1', excerpt: '' });
    expect(r.success).toBe(false);
  });

  it('rejects negative page numbers', () => {
    const r = __evidenceCitationSchema.safeParse({
      ref: 'Doc 1',
      excerpt: 'text',
      page: -3,
    });
    expect(r.success).toBe(false);
  });

  it('rejects non-integer page numbers', () => {
    const r = __evidenceCitationSchema.safeParse({
      ref: 'Doc 1',
      excerpt: 'text',
      page: 1.5,
    });
    expect(r.success).toBe(false);
  });

  it('rejects malformed url', () => {
    const r = __evidenceCitationSchema.safeParse({
      ref: 'Doc 1',
      excerpt: 'text',
      url: 'not-a-url',
    });
    expect(r.success).toBe(false);
  });

  it('rejects excerpt above 2000 chars', () => {
    const r = __evidenceCitationSchema.safeParse({
      ref: 'Doc 1',
      excerpt: 'x'.repeat(2001),
    });
    expect(r.success).toBe(false);
  });
});

describe('Terra diligence evidence citations — wiring (task #1355)', () => {
  it('PATCH /evidence/:evidenceId persists citations into JSONB column', () => {
    expect(SOURCE).toMatch(
      /router\.patch\(\s*['"]\/terra\/cognitive\/diligence-room\/evidence\/:evidenceId['"]/,
    );
    expect(SOURCE).toMatch(/parsed\.data\.citations !== undefined.*updates\.citations/s);
  });

  it('POST evidence accepts and persists citations on creation', () => {
    expect(SOURCE).toMatch(
      /router\.post\(\s*['"]\/terra\/cognitive\/diligence-room\/matters\/:matterId\/evidence['"]/,
    );
    expect(SOURCE).toMatch(/citations:\s*parsed\.data\.citations\s*\?\?\s*\[\]/);
  });

  it('uses the shared evidenceCitationSchema for both create and patch payloads', () => {
    const block = SOURCE.match(
      /const\s+createEvidenceSchema[\s\S]*?const\s+patchEvidenceSchema[\s\S]*?\}\);/,
    );
    expect(block).not.toBeNull();
    const matches = block![0].match(/citations:\s*z\.array\(evidenceCitationSchema\)/g) ?? [];
    expect(matches.length).toBe(2);
  });
});
