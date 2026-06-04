/**
 * SZL Holdings — Agent Gateway: Capability Enforcement
 * Phase 11 — Agent Gateway
 *
 * This module enforces allowed vs forbidden agent capabilities at the code
 * level — BEFORE auth, BEFORE OPA, BEFORE any SDK call. Defense in depth.
 *
 * If a caller requests a forbidden capability, the request is rejected
 * immediately with a CapabilityViolation error. This is not configurable
 * at runtime; it is a hard-coded policy boundary.
 */

import {
  ALLOWED_CAPABILITIES,
  FORBIDDEN_CAPABILITIES,
  type AllowedCapability,
  type ForbiddenCapability,
} from '../types.js';

export class CapabilityViolation extends Error {
  constructor(
    public readonly requestedCapability: string,
    public readonly violationType: 'forbidden' | 'unknown',
  ) {
    const msg =
      violationType === 'forbidden'
        ? `Capability '${requestedCapability}' is categorically forbidden and cannot be granted by any policy or approval. This violation has been logged.`
        : `Capability '${requestedCapability}' is not in the allowed capability set. Agent requests must specify a recognized capability.`;
    super(msg);
    this.name = 'CapabilityViolation';
  }
}

/**
 * Check whether a capability string is a known forbidden capability.
 * This check runs synchronously before any async I/O.
 */
export function isForbidden(capability: string): capability is ForbiddenCapability {
  return (FORBIDDEN_CAPABILITIES as ReadonlySet<string>).has(capability);
}

/**
 * Check whether a capability string is in the allowed set.
 */
export function isAllowed(capability: string): capability is AllowedCapability {
  return (ALLOWED_CAPABILITIES as ReadonlySet<string>).has(capability);
}

/**
 * Enforce capability. Throws CapabilityViolation on any rejection.
 * Returns the validated AllowedCapability on success.
 */
export function enforceCapability(capability: string): AllowedCapability {
  if (isForbidden(capability)) {
    throw new CapabilityViolation(capability, 'forbidden');
  }
  if (!isAllowed(capability)) {
    throw new CapabilityViolation(capability, 'unknown');
  }
  return capability as AllowedCapability;
}

/**
 * Return a manifest of all capabilities for documentation / introspection.
 */
export function listCapabilities(): {
  allowed: AllowedCapability[];
  forbidden: ForbiddenCapability[];
} {
  return {
    allowed: [...ALLOWED_CAPABILITIES] as AllowedCapability[],
    forbidden: [...FORBIDDEN_CAPABILITIES] as ForbiddenCapability[],
  };
}
