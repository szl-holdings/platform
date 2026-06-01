/**
 * Unit tests for the shared CSRF helpers in `@szl-holdings/auth-shared/server`.
 *
 * Tests the pure logic: token generation, timing-safe comparison, validation,
 * and cookie option factories without any HTTP layer.
 */

import { describe, expect, it } from 'vitest';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  csrfCookieOptions,
  csrfTimingSafeEqual,
  generateCsrfToken,
  isSafeMethod,
  validateCsrfPair,
} from '../../packages/auth-shared/src/server/csrf.js';

describe('generateCsrfToken', () => {
  it('produces a 64-character hex string', () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces unique tokens each call', () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(20);
  });
});

describe('csrfTimingSafeEqual', () => {
  it('returns true for identical strings', () => {
    expect(csrfTimingSafeEqual('abc', 'abc')).toBe(true);
  });

  it('returns false for different strings of same length', () => {
    expect(csrfTimingSafeEqual('abc', 'xyz')).toBe(false);
  });

  it('returns false for strings of different lengths', () => {
    expect(csrfTimingSafeEqual('abc', 'abcd')).toBe(false);
  });

  it('returns false for empty vs non-empty', () => {
    expect(csrfTimingSafeEqual('', 'x')).toBe(false);
    expect(csrfTimingSafeEqual('x', '')).toBe(false);
  });

  it('handles long token strings correctly', () => {
    const t = 'a'.repeat(64);
    expect(csrfTimingSafeEqual(t, t)).toBe(true);
    expect(csrfTimingSafeEqual(t, t.replace(/a$/, 'b'))).toBe(false);
  });
});

describe('validateCsrfPair', () => {
  const token = 'test-token-abc123';

  it('returns ok when cookie and header match', () => {
    expect(validateCsrfPair(token, token)).toEqual({ ok: true });
  });

  it('returns missing_cookie when cookie is absent', () => {
    expect(validateCsrfPair(undefined, token)).toEqual({
      ok: false,
      reason: 'missing_cookie',
    });
  });

  it('returns missing_header when header is absent', () => {
    expect(validateCsrfPair(token, undefined)).toEqual({
      ok: false,
      reason: 'missing_header',
    });
  });

  it('returns mismatch when values differ', () => {
    expect(validateCsrfPair(token, 'wrong-token')).toEqual({
      ok: false,
      reason: 'mismatch',
    });
  });

  it('returns missing_cookie when both are absent', () => {
    const result = validateCsrfPair(undefined, undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('missing_cookie');
  });
});

describe('isSafeMethod', () => {
  it.each([
    'GET',
    'HEAD',
    'OPTIONS',
    'get',
    'head',
    'options',
  ])('returns true for safe method %s', (method) => {
    expect(isSafeMethod(method)).toBe(true);
  });

  it.each([
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'post',
    'patch',
  ])('returns false for mutating method %s', (method) => {
    expect(isSafeMethod(method)).toBe(false);
  });
});

describe('csrfCookieOptions', () => {
  it('sets secure=true in production', () => {
    const opts = csrfCookieOptions({ isProduction: true });
    expect(opts.secure).toBe(true);
  });

  it('sets secure=false in development', () => {
    const opts = csrfCookieOptions({ isProduction: false });
    expect(opts.secure).toBe(false);
  });

  it('always sets httpOnly=false (SPA-readable)', () => {
    expect(csrfCookieOptions({ isProduction: true }).httpOnly).toBe(false);
  });

  it('always sets sameSite=strict', () => {
    expect(csrfCookieOptions({ isProduction: false }).sameSite).toBe('strict');
  });
});

describe('CSRF_COOKIE_NAME and CSRF_HEADER_NAME constants', () => {
  it('exports the expected cookie name', () => {
    expect(CSRF_COOKIE_NAME).toBe('csrf_token');
  });

  it('exports the expected header name', () => {
    expect(CSRF_HEADER_NAME).toBe('x-csrf-token');
  });
});
