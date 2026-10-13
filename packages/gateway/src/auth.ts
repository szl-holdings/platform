/**
 * SZL Holdings — Agent Gateway: Authentication Layer
 * Phase 11 — Agent Gateway
 *
 * HS256 is intentionally limited to the explicit local/test stub. Live
 * deployments use a fixed RS256 public key plus exact issuer and audience
 * checks. Every inbound request MUST carry a valid bearer token.
 */

import { createHmac, timingSafeEqual, verify as verifySignature } from 'node:crypto';
import type {
  CallerIdentity,
  CallerRole,
  JwtVerificationConfig,
  Rs256JwtVerificationConfig,
} from './types.js';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN',
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

const CALLER_ROLES: ReadonlySet<string> = new Set<CallerRole>([
  'platform-engineer',
  'operator',
  'agent-service',
  'ai-model',
]);
const JWT_CLOCK_SKEW_SECONDS = 60;

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64url');
}

function base64urlDecode(segment: string, label: string): Buffer {
  if (!segment || !/^[A-Za-z0-9_-]+$/.test(segment) || segment.length % 4 === 1) {
    throw new AuthError(`Malformed JWT ${label}`, 'INVALID_TOKEN');
  }

  const decoded = Buffer.from(segment, 'base64url');
  if (base64urlEncode(decoded) !== segment) {
    throw new AuthError(`Malformed JWT ${label}`, 'INVALID_TOKEN');
  }
  return decoded;
}

function parseJsonObject(segment: string, label: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(base64urlDecode(segment, label).toString('utf8'));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(`Malformed JWT ${label}`, 'INVALID_TOKEN');
  }
}

function splitToken(token: string): [string, string, string] {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new AuthError('Malformed JWT: expected 3 non-empty segments', 'INVALID_TOKEN');
  }
  return parts as [string, string, string];
}

function validateHeader(headerSegment: string, expectedAlgorithm: 'HS256' | 'RS256'): void {
  const header = parseJsonObject(headerSegment, 'header');
  const keys = Object.keys(header).sort();
  if (keys.length !== 2 || keys[0] !== 'alg' || keys[1] !== 'typ') {
    throw new AuthError('JWT header contains unsupported parameters', 'INVALID_TOKEN');
  }
  if (header.alg !== expectedAlgorithm || header.typ !== 'JWT') {
    throw new AuthError('JWT algorithm or type is not permitted', 'INVALID_TOKEN');
  }
}

function requireNonEmptyString(value: unknown, claim: string): string {
  if (typeof value !== 'string' || value.length === 0 || value !== value.trim()) {
    throw new AuthError(`JWT claim '${claim}' must be a non-empty string`, 'INVALID_TOKEN');
  }
  return value;
}

function requireNumericDate(value: unknown, claim: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new AuthError(`JWT claim '${claim}' must be a non-negative integer`, 'INVALID_TOKEN');
  }
  return value;
}

function validateIdentityClaims(
  payloadSegment: string,
  rs256Config?: Rs256JwtVerificationConfig,
): CallerIdentity {
  const claims = parseJsonObject(payloadSegment, 'payload');
  const now = Math.floor(Date.now() / 1000);

  const sub = requireNonEmptyString(claims.sub, 'sub');
  const role = requireNonEmptyString(claims.role, 'role');
  if (!CALLER_ROLES.has(role)) {
    throw new AuthError("JWT claim 'role' is not permitted", 'INVALID_TOKEN');
  }

  if (
    !Array.isArray(claims.groups) ||
    claims.groups.length > 100 ||
    claims.groups.some(
      (group) => typeof group !== 'string' || group.length === 0 || group !== group.trim(),
    ) ||
    new Set(claims.groups).size !== claims.groups.length
  ) {
    throw new AuthError(
      "JWT claim 'groups' must be an array of unique non-empty strings",
      'INVALID_TOKEN',
    );
  }

  const orgId = requireNonEmptyString(claims.orgId, 'orgId');
  const iat = requireNumericDate(claims.iat, 'iat');
  const exp = requireNumericDate(claims.exp, 'exp');
  if (iat > now + JWT_CLOCK_SKEW_SECONDS) {
    throw new AuthError('JWT issued-at time is in the future', 'INVALID_TOKEN');
  }
  if (exp <= now) {
    throw new AuthError('JWT token has expired', 'EXPIRED_TOKEN');
  }
  if (exp <= iat) {
    throw new AuthError('JWT expiry must be later than issued-at time', 'INVALID_TOKEN');
  }

  if (claims.nbf !== undefined || rs256Config) {
    const nbf = requireNumericDate(claims.nbf, 'nbf');
    if (nbf > now + JWT_CLOCK_SKEW_SECONDS) {
      throw new AuthError('JWT token is not active yet', 'INVALID_TOKEN');
    }
    if (nbf > exp) {
      throw new AuthError('JWT not-before time must not exceed expiry', 'INVALID_TOKEN');
    }
  }

  if (rs256Config) {
    if (claims.iss !== rs256Config.issuer) {
      throw new AuthError("JWT claim 'iss' does not match the configured issuer", 'INVALID_TOKEN');
    }
    if (claims.aud !== rs256Config.audience) {
      throw new AuthError(
        "JWT claim 'aud' does not match the configured audience",
        'INVALID_TOKEN',
      );
    }
    if (orgId !== rs256Config.orgId) {
      throw new AuthError(
        "JWT claim 'orgId' does not match the configured organization",
        'INVALID_TOKEN',
      );
    }
  }

  return {
    sub,
    role: role as CallerRole,
    groups: claims.groups as string[],
    orgId,
    iat,
    exp,
  };
}

function signHs256(headerDotPayload: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(headerDotPayload).digest();
}

/** Token issuance is intentionally only for tests and the local stub. */
export function issueToken(
  identity: Omit<CallerIdentity, 'iat' | 'exp'>,
  secret: string,
  ttlMs = 3_600_000,
): string {
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
  const signature = base64urlEncode(signHs256(`${header}.${payload}`, secret));
  return `${header}.${payload}.${signature}`;
}

/** Verify a local/test-only HS256 token. */
export function verifyToken(token: string, secret: string): CallerIdentity {
  const [header, payload, signature] = splitToken(token);
  validateHeader(header, 'HS256');

  const expected = signHs256(`${header}.${payload}`, secret);
  const actual = base64urlDecode(signature, 'signature');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new AuthError('JWT signature verification failed', 'INVALID_TOKEN');
  }

  return validateIdentityClaims(payload);
}

/** Verify a live-mode RS256 token using native asymmetric cryptography. */
export function verifyRs256Token(
  token: string,
  config: Rs256JwtVerificationConfig,
): CallerIdentity {
  const [header, payload, signature] = splitToken(token);
  validateHeader(header, 'RS256');

  let verified = false;
  try {
    verified = verifySignature(
      'RSA-SHA256',
      Buffer.from(`${header}.${payload}`),
      config.publicKey,
      base64urlDecode(signature, 'signature'),
    );
  } catch {
    throw new AuthError('JWT signature verification failed', 'INVALID_TOKEN');
  }
  if (!verified) {
    throw new AuthError('JWT signature verification failed', 'INVALID_TOKEN');
  }

  return validateIdentityClaims(payload, config);
}

export function extractBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new AuthError('Missing Authorization header', 'MISSING_TOKEN');
  }
  const header = authorizationHeader.trim();
  const scheme = /^Bearer(\s+)/i.exec(header);
  if (!scheme) {
    throw new AuthError('Authorization header must use Bearer scheme', 'MISSING_TOKEN');
  }
  const token = header.slice(scheme[0].length);
  if (!token || /\s/.test(token)) {
    throw new AuthError('Authorization header must contain one bearer token', 'MISSING_TOKEN');
  }
  return token;
}

export function authenticateCaller(
  authorizationHeader: string | undefined,
  verification: JwtVerificationConfig | string,
): CallerIdentity {
  const token = extractBearerToken(authorizationHeader);
  if (typeof verification === 'string') {
    return verifyToken(token, verification);
  }
  return verification.algorithm === 'RS256'
    ? verifyRs256Token(token, verification)
    : verifyToken(token, verification.secret);
}
