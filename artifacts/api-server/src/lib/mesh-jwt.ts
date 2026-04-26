/**
 * Lightweight HS256 JWT implementation for OAuth 2.0 client_credentials tokens.
 * Uses Node.js built-in crypto — no external JWT dependency required.
 *
 * These JWTs are short-lived (15 min) and issued only to registered OAuth clients.
 * The signing key is derived from SESSION_SECRET to avoid an extra secret.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface MeshTokenPayload {
  sub: string;
  name: string;
  clientId: string;
  orgId: number | null;
  scopes: string[];
  type: 'oauth_client';
  iat: number;
  exp: number;
}

function signingKey(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Fail closed: do not issue or accept tokens when the signing secret is absent.
    // This prevents forged tokens in misconfigured environments.
    throw new Error(
      '[mesh-jwt] SESSION_SECRET is not set — cannot sign or verify OAuth mesh tokens. ' +
      'Configure SESSION_SECRET in the environment before issuing client_credentials tokens.',
    );
  }
  return `${secret}:mesh-jwt-v1`;
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padding), 'base64');
}

export function signMeshToken(payload: Omit<MeshTokenPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: MeshTokenPayload = {
    ...payload,
    iat: now,
    exp: now + 15 * 60,
  };

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(fullPayload));
  const signingInput = `${header}.${body}`;

  const sig = createHmac('sha256', signingKey())
    .update(signingInput, 'utf8')
    .digest();

  return `${signingInput}.${base64url(sig)}`;
}

export function verifyMeshToken(token: string): MeshTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, bodyB64, sigB64] = parts;
    const signingInput = `${headerB64}.${bodyB64}`;

    const expectedSig = createHmac('sha256', signingKey())
      .update(signingInput, 'utf8')
      .digest();

    const presentedSig = base64urlDecode(sigB64!);
    if (expectedSig.length !== presentedSig.length) return null;
    if (!timingSafeEqual(expectedSig, presentedSig)) return null;

    const payload = JSON.parse(base64urlDecode(bodyB64!).toString('utf8')) as MeshTokenPayload;

    if (payload.type !== 'oauth_client') return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}
