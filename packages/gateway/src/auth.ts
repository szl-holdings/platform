/**
 * SZL Holdings — Agent Gateway: Authentication Layer
 * Phase 11 — Agent Gateway
 *
 * Verifies caller identity from a signed JWT (HS256 for local dev).
 * In production this is replaced with Azure AD / Entra ID JWT validation.
 *
 * Every inbound request MUST carry a valid bearer token. No token = hard reject.
 */

import type { CallerIdentity } from './types.js';
import { createHmac, timingSafeEqual } from 'crypto';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ---------------------------------------------------------------------------
// JWT helpers (HS256, base64url safe) — no external deps for portability
// ---------------------------------------------------------------------------

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(s: string): Buffer {
  // Pad to multiple of 4
  const padded = s + '='.repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function signHs256(headerDotPayload: string, secret: string): string {
  return base64urlEncode(createHmac('sha256', secret).update(headerDotPayload).digest());
}

// ---------------------------------------------------------------------------
// Token issuance (used in tests and local dev bootstrap)
// ---------------------------------------------------------------------------

export function issueToken(identity: Omit<CallerIdentity, 'iat' | 'exp'>, secret: string, ttlMs = 3_600_000): string {
  const header = base64urlEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlEncode(
    Buffer.from(
      JSON.stringify({
        ...identity,
        iat: now,
        exp: now + Math.floor(ttlMs / 1000),
      }),
    ),
  );
  const sig = signHs256(`${header}.${payload}`, secret);
  return `${header}.${payload}.${sig}`;
}

// ---------------------------------------------------------------------------
// Token verification
// ---------------------------------------------------------------------------

export function verifyToken(token: string, secret: string): CallerIdentity {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AuthError('Malformed JWT: expected 3 segments', 'INVALID_TOKEN');
  }
  const [header, payload, sig] = parts as [string, string, string];

  // Verify algorithm
  let headerJson: { alg: string; typ: string };
  try {
    headerJson = JSON.parse(base64urlDecode(header).toString('utf8'));
  } catch {
    throw new AuthError('Malformed JWT header', 'INVALID_TOKEN');
  }
  if (headerJson.alg !== 'HS256') {
    throw new AuthError(`Unsupported algorithm: ${headerJson.alg}`, 'INVALID_TOKEN');
  }

  // Verify signature (timing-safe)
  const expectedSig = signHs256(`${header}.${payload}`, secret);
  const expected = Buffer.from(expectedSig);
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AuthError('JWT signature verification failed', 'INVALID_TOKEN');
  }

  // Decode payload
  let claims: CallerIdentity;
  try {
    claims = JSON.parse(base64urlDecode(payload).toString('utf8')) as CallerIdentity;
  } catch {
    throw new AuthError('Malformed JWT payload', 'INVALID_TOKEN');
  }

  // Check expiry
  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.exp < nowSec) {
    throw new AuthError('JWT token has expired', 'EXPIRED_TOKEN');
  }

  return claims;
}

// ---------------------------------------------------------------------------
// Request-level extraction
// ---------------------------------------------------------------------------

export function extractBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new AuthError('Missing Authorization header', 'MISSING_TOKEN');
  }
  // Linear, backtracking-free parse: match only the bounded scheme + separator
  // (avoids the \s+\S polynomial-ReDoS on the Authorization header), then take
  // the remainder as the token.
  const header = authorizationHeader.trim();
  const scheme = /^Bearer(\s+)/i.exec(header);
  if (!scheme) {
    throw new AuthError('Authorization header must use Bearer scheme', 'MISSING_TOKEN');
  }
  const token = header.slice(scheme[0].length);
  if (!token) {
    throw new AuthError('Authorization header must use Bearer scheme', 'MISSING_TOKEN');
  }
  return token;
}

export function authenticateCaller(authorizationHeader: string | undefined, secret: string): CallerIdentity {
  const token = extractBearerToken(authorizationHeader);
  return verifyToken(token, secret);
}
