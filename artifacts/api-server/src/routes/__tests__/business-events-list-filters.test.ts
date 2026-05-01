/**
 * Tests for the eventClass query filter contract on
 * GET /business-events/events (Task #1665).
 *
 * The route handler in `business-events-ingestion.ts` reads
 * `req.query.eventClass` and adds an `eq(analyticsEventsTable.eventName, …)`
 * predicate when present. Both the schema entry (so it's not stripped or
 * rejected by validateQuery) and the route's filter assembly are verified
 * here. Run-time DB integration is exercised by api-integration-tests.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { listQuerySchema } from '../../lib/validation';

const ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
const ROUTE_FILE = resolve(
  ROOT,
  'artifacts/api-server/src/routes/business-events-ingestion.ts',
);

describe('business-events list filters — schema contract', () => {
  it('listQuerySchema accepts eventClass alongside domain', () => {
    const parsed = listQuerySchema.parse({
      domain: 'risk',
      eventClass: 'business.risk.detected',
      limit: 25,
    });
    expect(parsed.eventClass).toBe('business.risk.detected');
    expect(parsed.domain).toBe('risk');
    expect(parsed.limit).toBe(25);
  });

  it('listQuerySchema enforces a max length on eventClass', () => {
    const tooLong = 'a'.repeat(151);
    expect(() =>
      listQuerySchema.parse({ eventClass: tooLong }),
    ).toThrow();
  });

  it('listQuerySchema treats eventClass as optional', () => {
    const parsed = listQuerySchema.parse({});
    expect(parsed.eventClass).toBeUndefined();
  });
});

describe('business-events list filters — route wiring', () => {
  const source = readFileSync(ROUTE_FILE, 'utf8');

  it('reads eventClass from req.query', () => {
    expect(source).toMatch(
      /req\.query\.eventClass\s+as\s+string\s*\|\s*undefined/,
    );
  });

  it('pushes an eq(analyticsEventsTable.eventName, eventClass) predicate', () => {
    expect(source).toMatch(
      /if\s*\(\s*eventClass\s*\)\s*\{[\s\S]*?eq\s*\(\s*analyticsEventsTable\.eventName\s*,\s*eventClass\s*\)/,
    );
  });

  it('still pushes the existing domain predicate', () => {
    expect(source).toMatch(
      /if\s*\(\s*domain\s*\)\s*\{[\s\S]*?eq\s*\(\s*analyticsEventsTable\.domain\s*,\s*domain\s*\)/,
    );
  });

  it('keeps the SOURCE_APP filter as the base condition', () => {
    expect(source).toMatch(
      /eq\s*\(\s*analyticsEventsTable\.sourceApp\s*,\s*SOURCE_APP\s*\)/,
    );
  });
});
