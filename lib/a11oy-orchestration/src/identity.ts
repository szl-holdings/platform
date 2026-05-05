/**
 * A11oy Fabric identity helpers. Used server-side to sign and verify
 * Bearer tokens of the form `<principal>.<hmac256(principal, secret)>`.
 * Browser callers never sign tokens; they use the cookie session minted
 * by the api-server on GET /fabric/*.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { A11oyProductId } from './types.js';

/** Special hub identifier used by the A11oy hub UI for orchestration calls. */
export const A11OY_HUB_PRINCIPAL = 'a11oy-hub' as const;
export type FabricPrincipal = A11oyProductId | typeof A11OY_HUB_PRINCIPAL;

const VALID_PRINCIPALS: ReadonlySet<string> = new Set<string>([
  'amaru',
  'sentra',
  'counsel',
  'terra',
  'carlota-jo',
  'vessels',
  A11OY_HUB_PRINCIPAL,
]);

function hmac(secret: string, principal: string): string {
  return createHmac('sha256', secret).update(principal).digest('hex');
}

export function signProductToken(principal: FabricPrincipal, secret: string): string {
  return `${principal}.${hmac(secret, principal)}`;
}

export interface VerifiedFabricToken {
  principal: FabricPrincipal;
}

export function verifyProductToken(
  token: string | undefined,
  secret: string,
): VerifiedFabricToken | null {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const principal = token.slice(0, dot);
  const presented = token.slice(dot + 1);
  if (!VALID_PRINCIPALS.has(principal)) return null;
  const expected = hmac(secret, principal);
  if (expected.length !== presented.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(presented, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }
  return { principal: principal as FabricPrincipal };
}

export function isValidPrincipal(value: unknown): value is FabricPrincipal {
  return typeof value === 'string' && VALID_PRINCIPALS.has(value);
}
