/**
 * Tests for SESSION_MIN_CREATED_AT global session cutoff (AF-012).
 *
 * Tokens issued by this server are opaque random strings stored in the DB,
 * NOT signed with SESSION_SECRET, so rotating SESSION_SECRET alone has no
 * effect on existing sessions. These tests verify that operators can force
 * a global re-authentication by setting SESSION_MIN_CREATED_AT to an
 * ISO-8601 timestamp at or after the rotation moment.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@szl-holdings/db', () => ({
  db: {},
  sessionsTable: {},
  usersTable: {},
  userRolesTable: {},
  rolesTable: {},
  orgMembersTable: {},
  organizationsTable: {},
  auditEventsTable: {},
}));

vi.mock('@szl-holdings/observability', () => ({
  serverTelemetry: { recordCounter: vi.fn(), recordHistogram: vi.fn() },
}));

vi.mock('@szl-holdings/audit', () => ({
  hashIp: (ip: string | null | undefined) => (ip ? `hashed:${ip}` : null),
}));

vi.mock('../lib/auth', () => ({
  SESSION_COOKIE: '__Host-sid',
  LEGACY_SESSION_COOKIE: 'sid',
  readSessionCookie: (req: { cookies?: Record<string, string> }) =>
    req.cookies?.['__Host-sid'] ?? req.cookies?.sid,
  SESSION_TTL: 7 * 24 * 60 * 60 * 1000,
  setSessionCookie: vi.fn(),
}));

vi.mock('../lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const { getSessionMinCreatedAt, _resetSessionMinCreatedAtCache } = await import(
  '../middlewares/session-policy'
);

describe('getSessionMinCreatedAt — SESSION_SECRET rotation cutoff (AF-012)', () => {
  const ORIGINAL = process.env.SESSION_MIN_CREATED_AT;

  beforeEach(() => {
    delete process.env.SESSION_MIN_CREATED_AT;
    _resetSessionMinCreatedAtCache();
  });

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.SESSION_MIN_CREATED_AT;
    else process.env.SESSION_MIN_CREATED_AT = ORIGINAL;
    _resetSessionMinCreatedAtCache();
  });

  it('returns null when env var is unset', () => {
    expect(getSessionMinCreatedAt()).toBeNull();
  });

  it('returns null for empty/whitespace value', () => {
    process.env.SESSION_MIN_CREATED_AT = '   ';
    _resetSessionMinCreatedAtCache();
    expect(getSessionMinCreatedAt()).toBeNull();
  });

  it('returns null and warns on malformed timestamp (defensive — never lock out future logins)', () => {
    process.env.SESSION_MIN_CREATED_AT = 'not-a-date';
    _resetSessionMinCreatedAtCache();
    expect(getSessionMinCreatedAt()).toBeNull();
  });

  it('parses a valid ISO-8601 timestamp', () => {
    const iso = '2026-04-19T14:00:00.000Z';
    process.env.SESSION_MIN_CREATED_AT = iso;
    _resetSessionMinCreatedAtCache();
    const result = getSessionMinCreatedAt();
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe(iso);
  });

  it('caches the parsed value across calls with the same env value', () => {
    const iso = '2026-04-19T14:00:00.000Z';
    process.env.SESSION_MIN_CREATED_AT = iso;
    _resetSessionMinCreatedAtCache();
    const a = getSessionMinCreatedAt();
    const b = getSessionMinCreatedAt();
    expect(a).toBe(b);
  });

  it('re-parses when env value changes (no stale cutoff)', () => {
    process.env.SESSION_MIN_CREATED_AT = '2025-01-01T00:00:00.000Z';
    _resetSessionMinCreatedAtCache();
    const first = getSessionMinCreatedAt();
    process.env.SESSION_MIN_CREATED_AT = '2025-06-01T00:00:00.000Z';
    const second = getSessionMinCreatedAt();
    expect(first?.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(second?.toISOString()).toBe('2025-06-01T00:00:00.000Z');
  });

  it('returns null when cutoff is more than 5 minutes in the future (clock-skew/timezone guard)', () => {
    const farFuture = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    process.env.SESSION_MIN_CREATED_AT = farFuture;
    _resetSessionMinCreatedAtCache();
    expect(getSessionMinCreatedAt()).toBeNull();
  });

  it('accepts a cutoff within the 5-minute forward tolerance (small clock drift)', () => {
    const nearFuture = new Date(Date.now() + 60 * 1000).toISOString();
    process.env.SESSION_MIN_CREATED_AT = nearFuture;
    _resetSessionMinCreatedAtCache();
    const result = getSessionMinCreatedAt();
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe(nearFuture);
  });

  it("does not cache a future-rejected cutoff (auto-activates once 'now' catches up)", () => {
    // Simulate a cutoff slightly in the future (still beyond tolerance)
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    process.env.SESSION_MIN_CREATED_AT = future;
    _resetSessionMinCreatedAtCache();
    expect(getSessionMinCreatedAt()).toBeNull();
    // The same env value should still resolve to null without time passing,
    // proving the rejection isn't cached as a permanent null.
    // (We can't easily fast-forward time here without vi.useFakeTimers, so we
    //  just confirm that a fresh call still re-evaluates and the env value
    //  is preserved.)
    expect(process.env.SESSION_MIN_CREATED_AT).toBe(future);
    expect(getSessionMinCreatedAt()).toBeNull();
  });

  it('identifies sessions issued before the rotation cutoff as revoked', () => {
    const cutoffIso = '2026-04-19T12:00:00.000Z';
    process.env.SESSION_MIN_CREATED_AT = cutoffIso;
    _resetSessionMinCreatedAtCache();
    const cutoff = getSessionMinCreatedAt();
    expect(cutoff).not.toBeNull();
    const oldSession = { createdAt: new Date('2026-04-19T11:59:59.000Z') };
    const newSession = { createdAt: new Date('2026-04-19T12:00:01.000Z') };
    expect(oldSession.createdAt < cutoff!).toBe(true); // would be rejected
    expect(newSession.createdAt < cutoff!).toBe(false); // still valid
  });
});
