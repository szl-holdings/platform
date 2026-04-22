/**
 * PKCE (Proof Key for Code Exchange) helpers for mobile OAuth2 flows.
 *
 * The mobile OIDC flow uses PKCE to protect the authorization code exchange
 * against interception attacks.  These utilities generate the verifier and
 * challenge so both can be used consistently in the mobile artifact and
 * in tests.
 *
 * Reference: RFC 7636 §4.1–4.2
 */

import { createHash, randomBytes } from 'node:crypto';

/** Length of the PKCE code verifier in bytes (43–128 chars after base64url). */
const VERIFIER_BYTES = 32;

/**
 * Generates a cryptographically random PKCE code verifier string.
 * Returns a base64url-encoded value (no `+`, `/`, or `=` padding).
 */
export function generateCodeVerifier(): string {
  return randomBytes(VERIFIER_BYTES).toString('base64url');
}

/**
 * Derives the S256 code challenge from a verifier.
 *
 * `challenge = BASE64URL(SHA256(ASCII(verifier)))`
 */
export function deriveCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export interface PkceChallenge {
  verifier: string;
  challenge: string;
  method: 'S256';
}

/** Generates a fresh PKCE verifier + challenge pair. */
export function generatePkceChallenge(): PkceChallenge {
  const verifier = generateCodeVerifier();
  return {
    verifier,
    challenge: deriveCodeChallenge(verifier),
    method: 'S256',
  };
}
