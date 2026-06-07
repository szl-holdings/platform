/**
 * Agent Gateway — Authentication Tests
 * Phase 11 — Agent Gateway
 *
 * Tests: token issuance, valid token verification, missing token,
 * invalid signature, expired token.
 */

import { describe, it, expect } from 'vitest';
import { issueToken, verifyToken, authenticateCaller, extractBearerToken, AuthError } from '../src/auth.js';
import type { CallerIdentity } from '../src/types.js';

const TEST_SECRET = 'test-secret-do-not-use-in-prod';

const BASE_IDENTITY: Omit<CallerIdentity, 'iat' | 'exp'> = {
  sub: 'test-user@szl.io',
  role: 'platform-engineer',
  groups: ['platform-team'],
  orgId: 'szl-holdings',
};

// ---------------------------------------------------------------------------
// Token issuance and verification
// ---------------------------------------------------------------------------

describe('issueToken / verifyToken', () => {
  it('issues a valid JWT and verifies it', () => {
    const token = issueToken(BASE_IDENTITY, TEST_SECRET);
    const identity = verifyToken(token, TEST_SECRET);

    expect(identity.sub).toBe('test-user@szl.io');
    expect(identity.role).toBe('platform-engineer');
    expect(identity.groups).toContain('platform-team');
    expect(identity.orgId).toBe('szl-holdings');
    expect(identity.iat).toBeGreaterThan(0);
    expect(identity.exp).toBeGreaterThan(identity.iat);
  });

  it('rejects a token signed with a different secret', () => {
    const token = issueToken(BASE_IDENTITY, TEST_SECRET);
    expect(() => verifyToken(token, 'wrong-secret')).toThrow(AuthError);
  });

  it('rejects an expired token', () => {
    // TTL of 0 ms means it expires in the same second
    const token = issueToken(BASE_IDENTITY, TEST_SECRET, 0);
    // Wait 1100ms to ensure exp < now
    const pastToken = token.split('.');
    const header = pastToken[0]!;
    const payload = JSON.parse(Buffer.from(pastToken[1]! + '==', 'base64').toString('utf8'));
    payload.exp = Math.floor(Date.now() / 1000) - 60; // expired 60 seconds ago
    const newPayload = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const badToken = `${header}.${newPayload}.invalidsig`;
    expect(() => verifyToken(badToken, TEST_SECRET)).toThrow(AuthError);
  });

  it('rejects a malformed JWT (only 2 segments)', () => {
    expect(() => verifyToken('header.payload', TEST_SECRET)).toThrow(AuthError);
  });

  it('rejects a token with tampered payload', () => {
    const token = issueToken(BASE_IDENTITY, TEST_SECRET);
    const parts = token.split('.');
    // Tamper payload: decode, change role, re-encode
    const tampered = JSON.parse(Buffer.from(parts[1]! + '==', 'base64').toString('utf8'));
    tampered.role = 'admin'; // escalation attempt
    const tamperedPayload = Buffer.from(JSON.stringify(tampered)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    expect(() => verifyToken(tamperedToken, TEST_SECRET)).toThrow(AuthError);
  });
});

// ---------------------------------------------------------------------------
// Bearer token extraction
// ---------------------------------------------------------------------------

describe('extractBearerToken', () => {
  it('extracts token from valid Authorization header', () => {
    const token = issueToken(BASE_IDENTITY, TEST_SECRET);
    const extracted = extractBearerToken(`Bearer ${token}`);
    expect(extracted).toBe(token);
  });

  it('throws MISSING_TOKEN when header is undefined', () => {
    expect(() => extractBearerToken(undefined)).toThrow(AuthError);
    try {
      extractBearerToken(undefined);
    } catch (err) {
      expect((err as AuthError).code).toBe('MISSING_TOKEN');
    }
  });

  it('throws MISSING_TOKEN when scheme is not Bearer', () => {
    expect(() => extractBearerToken('Basic dXNlcjpwYXNz')).toThrow(AuthError);
  });
});

// ---------------------------------------------------------------------------
// authenticateCaller integration
// ---------------------------------------------------------------------------

describe('authenticateCaller', () => {
  it('returns CallerIdentity for a valid bearer token', () => {
    const token = issueToken(BASE_IDENTITY, TEST_SECRET);
    const identity = authenticateCaller(`Bearer ${token}`, TEST_SECRET);
    expect(identity.sub).toBe(BASE_IDENTITY.sub);
  });

  it('throws for missing Authorization header', () => {
    expect(() => authenticateCaller(undefined, TEST_SECRET)).toThrow(AuthError);
  });

  it('throws for wrong secret', () => {
    const token = issueToken(BASE_IDENTITY, TEST_SECRET);
    expect(() => authenticateCaller(`Bearer ${token}`, 'bad-secret')).toThrow(AuthError);
  });
});
