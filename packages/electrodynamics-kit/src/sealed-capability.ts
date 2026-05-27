/**
 * Sealed-capability envelope — re-expressed from CHERI's *hardware*
 * capability discipline as a *software* envelope. See
 * docs/research/electrodynamics-synthesis-2026.md §10.6.
 *
 *   "Does NOT market itself as hardware-capability enforcement."
 *
 * The envelope is an opaque token bound to a permission set, sealed
 * with an HMAC. Presented at every action site; verified before use.
 * Revocation is a typed event that the consumer journals.
 */

export interface SealedCapability {
  readonly capabilityId: string;
  readonly permissions: readonly string[];
  readonly boundActorId: string;
  /** ISO-8601. */
  readonly sealedAt: string;
  /** ISO-8601. */
  readonly expiresAt: string;
  readonly sealHex: string;
}

export type SealFn = (canonicalPayload: string) => string;

function canonical(cap: Omit<SealedCapability, 'sealHex'>): string {
  return JSON.stringify({
    capabilityId: cap.capabilityId,
    permissions: [...cap.permissions].sort(),
    boundActorId: cap.boundActorId,
    sealedAt: cap.sealedAt,
    expiresAt: cap.expiresAt,
  });
}

/** Pure: seal an unsealed capability with the provided MAC function. */
export function sealCapability(
  unsealed: Omit<SealedCapability, 'sealHex'>,
  sealer: SealFn,
): SealedCapability {
  if (!Number.isFinite(Date.parse(unsealed.sealedAt))) {
    throw new Error(`sealed-capability: sealedAt is unparseable: ${unsealed.sealedAt}`);
  }
  if (!Number.isFinite(Date.parse(unsealed.expiresAt))) {
    throw new Error(`sealed-capability: expiresAt is unparseable: ${unsealed.expiresAt}`);
  }
  if (Date.parse(unsealed.expiresAt) <= Date.parse(unsealed.sealedAt)) {
    throw new Error('sealed-capability: expiresAt must be strictly after sealedAt');
  }
  if (unsealed.permissions.length === 0) {
    throw new Error('sealed-capability: permissions[] must be non-empty');
  }
  return { ...unsealed, sealHex: sealer(canonical(unsealed)) };
}

export type CapabilityVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'expired' | 'revoked' | 'seal-mismatch' | 'permission-missing' | 'actor-mismatch'; readonly detail: string };

export interface CapabilityVerifyInput {
  readonly cap: SealedCapability;
  readonly actorId: string;
  readonly requiredPermission: string;
  /** Set of revoked capabilityIds. */
  readonly revoked: ReadonlySet<string>;
  /** Wall-clock millis at verification. */
  readonly now: number;
  /** Same sealer used at seal time. */
  readonly sealer: SealFn;
}

/** Pure verification — caller decides what to do on failure. */
export function verifyCapability(input: CapabilityVerifyInput): CapabilityVerdict {
  const { cap, actorId, requiredPermission, revoked, now, sealer } = input;
  if (revoked.has(cap.capabilityId)) {
    return { ok: false, reason: 'revoked', detail: `capability ${cap.capabilityId} is revoked` };
  }
  const exp = Date.parse(cap.expiresAt);
  if (!Number.isFinite(exp) || exp <= now) {
    return { ok: false, reason: 'expired', detail: `capability expired at ${cap.expiresAt}` };
  }
  if (cap.boundActorId !== actorId) {
    return {
      ok: false,
      reason: 'actor-mismatch',
      detail: `capability bound to ${cap.boundActorId}, actor is ${actorId}`,
    };
  }
  if (!cap.permissions.includes(requiredPermission)) {
    return {
      ok: false,
      reason: 'permission-missing',
      detail: `capability lacks permission '${requiredPermission}'`,
    };
  }
  const expectedSeal = sealer(canonical(cap));
  if (expectedSeal !== cap.sealHex) {
    return { ok: false, reason: 'seal-mismatch', detail: 'capability seal does not verify' };
  }
  return { ok: true };
}
