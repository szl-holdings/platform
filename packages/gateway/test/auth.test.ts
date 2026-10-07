/**
 * Agent Gateway — Authentication Tests
 * Phase 11 — Agent Gateway
 *
 * Tests: token issuance, valid token verification, missing token,
 * invalid signature, expired token.
 */

import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  AuthError,
  authenticateCaller,
  extractBearerToken,
  issueToken,
  verifyRs256Token,
  verifyToken,
} from '../src/auth.js';
import type { CallerIdentity } from '../src/types.js';

const TEST_SECRET = 'test-secret-do-not-use-in-prod';

const BASE_IDENTITY: Omit<CallerIdentity, 'iat' | 'exp'> = {
  sub: 'test-user@szl.io',
  role: 'platform-engineer',
  groups: ['platform-team'],
  orgId: 'szl-holdings',
};

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2_048 });
const RS256_CONFIG = {
  algorithm: 'RS256' as const,
  publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  issuer: 'https://identity.example.test',
  audience: 'szl-agent-gateway',
  orgId: 'szl-holdings',
};

function issueRs256Token(overrides: Record<string, unknown> = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      ...BASE_IDENTITY,
      iat: now,
      nbf: now - 1,
      exp: now + 3_600,
      iss: RS256_CONFIG.issuer,
      aud: RS256_CONFIG.audience,
      ...overrides,
    }),
  ).toString('base64url');
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString(
    'base64url',
  );
  return `${header}.${payload}.${signature}`;
}

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
    const token = issueToken(BASE_IDENTITY, TEST_SECRET, -60_000);
    expect(() => verifyToken(token, TEST_SECRET)).toThrow(/expired/);
  });

  it('rejects a malformed JWT (only 2 segments)', () => {
    expect(() => verifyToken('header.payload', TEST_SECRET)).toThrow(AuthError);
  });

  it('rejects a token with tampered payload', () => {
    const token = issueToken(BASE_IDENTITY, TEST_SECRET);
    const parts = token.split('.');
    const payloadSegment = parts[1];
    if (!payloadSegment) throw new Error('test token did not contain a payload');
    // Tamper payload: decode, change role, re-encode
    const tampered = JSON.parse(Buffer.from(`${payloadSegment}==`, 'base64').toString('utf8'));
    tampered.role = 'admin'; // escalation attempt
    const tamperedPayload = Buffer.from(JSON.stringify(tampered))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    expect(() => verifyToken(tamperedToken, TEST_SECRET)).toThrow(AuthError);
  });
});

describe('verifyRs256Token', () => {
  it('verifies native RS256 signatures and strict identity claims', () => {
    const identity = verifyRs256Token(issueRs256Token(), RS256_CONFIG);
    expect(identity).toMatchObject(BASE_IDENTITY);
  });

  it('rejects HS256 algorithm confusion and the wrong RSA key', () => {
    const hsToken = issueToken(BASE_IDENTITY, TEST_SECRET);
    expect(() => verifyRs256Token(hsToken, RS256_CONFIG)).toThrow(AuthError);

    const otherKey = generateKeyPairSync('rsa', { modulusLength: 2_048 }).publicKey;
    expect(() =>
      verifyRs256Token(issueRs256Token(), {
        ...RS256_CONFIG,
        publicKey: otherKey.export({ type: 'spki', format: 'pem' }).toString(),
      }),
    ).toThrow(/signature verification failed/);
  });

  it('rejects issuer, audience, and not-before mismatches', () => {
    expect(() => verifyRs256Token(issueRs256Token({ iss: 'attacker' }), RS256_CONFIG)).toThrow(
      /configured issuer/,
    );
    expect(() =>
      verifyRs256Token(issueRs256Token({ aud: ['szl-agent-gateway'] }), RS256_CONFIG),
    ).toThrow(/configured audience/);
    expect(() =>
      verifyRs256Token(
        issueRs256Token({ nbf: Math.floor(Date.now() / 1000) + 3_600 }),
        RS256_CONFIG,
      ),
    ).toThrow(/not active yet/);
    expect(() =>
      verifyRs256Token(issueRs256Token({ orgId: 'different-tenant' }), RS256_CONFIG),
    ).toThrow(/configured organization/);
  });

  it('rejects missing or wrongly typed required claims', () => {
    expect(() =>
      verifyRs256Token(issueRs256Token({ groups: 'platform-team' }), RS256_CONFIG),
    ).toThrow(/groups/);
    expect(() => verifyRs256Token(issueRs256Token({ exp: 'tomorrow' }), RS256_CONFIG)).toThrow(
      /exp/,
    );
    expect(() => verifyRs256Token(issueRs256Token({ role: 'admin' }), RS256_CONFIG)).toThrow(
      /role/,
    );
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
