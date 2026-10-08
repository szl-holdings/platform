import { createHash } from 'node:crypto';
import { canonicalSerialize } from './proofweave-canonical.js';
import {
  type AtelierProofweavePlan,
  AtelierProofweavePolicyDeniedError,
  AtelierProofweaveRequestSchema,
  createAtelierProofweaveHashPayload,
  deniedProofweaveCapabilities,
  PROOFWEAVE_POLICY_RULES,
  PROOFWEAVE_POLICY_VERSION,
} from './proofweave-contract.js';

export * from './proofweave-contract.js';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nestedValue);
    }
  }
  return value;
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function compileAtelierProofweave(
  input: unknown,
  now: () => Date = () => new Date(),
): AtelierProofweavePlan {
  const request = AtelierProofweaveRequestSchema.parse(input);
  const deniedCapabilities = deniedProofweaveCapabilities(request);

  if (deniedCapabilities.length > 0) {
    throw new AtelierProofweavePolicyDeniedError(deniedCapabilities);
  }

  const policyDigestSha256 = sha256(
    canonicalSerialize({
      version: PROOFWEAVE_POLICY_VERSION,
      ruleIds: PROOFWEAVE_POLICY_RULES,
    }),
  );
  const hashPayload = createAtelierProofweaveHashPayload(request, policyDigestSha256);
  const planSha256 = sha256(canonicalSerialize(hashPayload));

  return deepFreeze({
    ...hashPayload,
    weaveId: `proofweave_${planSha256}`,
    planId: `proofweave_${planSha256}`,
    planSha256,
    compiledAt: now().toISOString(),
  });
}
