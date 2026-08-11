import { StateNativeError } from './errors.js';
import type { CompatibilityFingerprint, PortabilityTier } from './types.js';

export interface CompatibilityMismatch {
  readonly field: keyof CompatibilityFingerprint;
  readonly expected: string | undefined;
  readonly actual: string | undefined;
}

export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly tier: PortabilityTier;
  readonly mismatches: readonly CompatibilityMismatch[];
}

const REQUIRED_FIELDS: Readonly<Record<PortabilityTier, readonly (keyof CompatibilityFingerprint)[]>> = {
  P0: [
    'modelId',
    'modelRevision',
    'engineId',
    'engineVersion',
    'tokenizerDigest',
    'layoutDigest',
    'adapterSetDigest',
    'policyDigest',
    'cognitiveEpoch',
    'providerSessionId',
  ],
  P1: [
    'modelId',
    'modelRevision',
    'engineId',
    'engineVersion',
    'tokenizerDigest',
    'layoutDigest',
    'adapterSetDigest',
    'policyDigest',
    'cognitiveEpoch',
  ],
  P2: [
    'modelId',
    'modelRevision',
    'tokenizerDigest',
    'adapterSetDigest',
    'policyDigest',
    'cognitiveEpoch',
  ],
  P3: ['semanticSpaceDigest', 'schemaDigest', 'policyDigest', 'cognitiveEpoch'],
  P4: ['schemaDigest', 'policyDigest', 'cognitiveEpoch'],
  P5: ['policyDigest', 'cognitiveEpoch'],
};

const DIGEST_FIELDS: readonly (keyof CompatibilityFingerprint)[] = [
  'tokenizerDigest',
  'layoutDigest',
  'adapterSetDigest',
  'semanticSpaceDigest',
  'schemaDigest',
  'policyDigest',
];
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

export function missingCompatibilityFields(
  tier: PortabilityTier,
  fingerprint: CompatibilityFingerprint,
): readonly (keyof CompatibilityFingerprint)[] {
  return Object.freeze(
    REQUIRED_FIELDS[tier].filter((field) => {
      const value = fingerprint[field];
      return value === undefined || value.trim().length === 0;
    }),
  );
}

export function invalidCompatibilityDigestFields(
  fingerprint: CompatibilityFingerprint,
): readonly (keyof CompatibilityFingerprint)[] {
  return Object.freeze(
    DIGEST_FIELDS.filter((field) => {
      const value = fingerprint[field];
      return value !== undefined && !DIGEST_PATTERN.test(value);
    }),
  );
}

export function assertCompatibilityFingerprint(
  tier: PortabilityTier,
  fingerprint: CompatibilityFingerprint,
): void {
  const missing = missingCompatibilityFields(tier, fingerprint);
  if (missing.length > 0) {
    throw new StateNativeError(
      'COMPATIBILITY_MISMATCH',
      `Compatibility fingerprint is incomplete for portability tier ${tier}.`,
      { missing },
    );
  }

  const invalidDigests = invalidCompatibilityDigestFields(fingerprint);
  if (invalidDigests.length > 0) {
    throw new StateNativeError(
      'COMPATIBILITY_MISMATCH',
      'Compatibility digest fields must contain 64 lowercase hexadecimal characters.',
      { invalidDigests },
    );
  }
}

export function evaluateCompatibility(
  tier: PortabilityTier,
  stored: CompatibilityFingerprint,
  requested: CompatibilityFingerprint,
): CompatibilityResult {
  const mismatches: CompatibilityMismatch[] = [];
  for (const field of REQUIRED_FIELDS[tier]) {
    const expected = stored[field];
    const actual = requested[field];
    if (expected === undefined || actual === undefined || expected !== actual) {
      mismatches.push({ field, expected, actual });
    }
  }

  return {
    compatible: mismatches.length === 0,
    tier,
    mismatches,
  };
}

export function assertCompatibility(
  tier: PortabilityTier,
  stored: CompatibilityFingerprint,
  requested: CompatibilityFingerprint,
): void {
  const result = evaluateCompatibility(tier, stored, requested);
  if (!result.compatible) {
    throw new StateNativeError(
      'COMPATIBILITY_MISMATCH',
      `State compatibility check failed for portability tier ${tier}.`,
      { mismatches: result.mismatches },
    );
  }
}
