import { canonicalSerialize, sha256Hex } from './proofweave-canonical.js';
import {
  type AtelierProofweaveApiResponse,
  type AtelierProofweaveHashPayload,
  AtelierProofweaveRequestSchema,
  createAtelierProofweaveHashPayload,
  deniedProofweaveCapabilities,
  PROOFWEAVE_POLICY_RULES,
  PROOFWEAVE_POLICY_VERSION,
} from './proofweave-contract.js';

export type {
  AtelierProofweaveApiResponse,
  AtelierProofweaveRequest,
} from './proofweave-contract.js';

const HASH_PAYLOAD_FIELDS = [
  'schemaVersion',
  'objective',
  'outputFormat',
  'mode',
  'evidenceClass',
  'operationalState',
  'executionState',
  'persistenceState',
  'requestedCapabilities',
  'budget',
  'stages',
  'claims',
  'claimGraph',
  'materials',
  'review',
  'policy',
  'limitations',
] as const satisfies readonly (keyof AtelierProofweaveHashPayload)[];

const RESPONSE_FIELDS = Object.freeze([
  ...HASH_PAYLOAD_FIELDS,
  'weaveId',
  'planId',
  'planSha256',
  'compiledAt',
  'tenantId',
  'tenantAttributionEvidenceClass',
  'ledger',
] as const);

const LEDGER_ENTRY_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export interface VerifyAtelierProofweaveResponseOptions {
  readonly request: unknown;
  readonly tenantId: string;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function fail(detail: string): never {
  throw new Error(
    `Proofweave response failed request-bound truth-contract checks [ATELIER_RESPONSE_INVALID] (${detail}).`,
  );
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function hasCanonicalArrayOrder(actual: unknown, expected: readonly unknown[]): boolean {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((item, index) => canonicalSerialize(item) === canonicalSerialize(expected[index]))
  );
}

function isCanonicalIsoInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function extractHashPayload(candidate: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(HASH_PAYLOAD_FIELDS.map((field) => [field, candidate[field]]));
}

export async function verifyAtelierProofweaveResponse(
  value: unknown,
  options: VerifyAtelierProofweaveResponseOptions,
): Promise<AtelierProofweaveApiResponse> {
  const candidate = record(value);
  if (!candidate || !hasExactKeys(candidate, RESPONSE_FIELDS)) {
    fail('response shape');
  }

  if (typeof options.tenantId !== 'string' || options.tenantId.length === 0) {
    fail('expected tenant');
  }

  const parsedRequest = AtelierProofweaveRequestSchema.safeParse(options.request);
  if (!parsedRequest.success || deniedProofweaveCapabilities(parsedRequest.data).length > 0) {
    fail('submitted request');
  }

  const policyDigestSha256 = await sha256Hex(
    canonicalSerialize({
      version: PROOFWEAVE_POLICY_VERSION,
      ruleIds: PROOFWEAVE_POLICY_RULES,
    }),
  );
  const expectedPayload = createAtelierProofweaveHashPayload(
    parsedRequest.data,
    policyDigestSha256,
  );
  const actualPayload = extractHashPayload(candidate);

  if (canonicalSerialize(actualPayload) !== canonicalSerialize(expectedPayload)) {
    fail('request, plan, or policy binding');
  }

  if (
    !hasCanonicalArrayOrder(candidate.stages, expectedPayload.stages) ||
    !hasCanonicalArrayOrder(candidate.claims, expectedPayload.claims) ||
    !hasCanonicalArrayOrder(candidate.materials, expectedPayload.materials) ||
    !hasCanonicalArrayOrder(record(candidate.claimGraph)?.nodes, expectedPayload.claimGraph.nodes)
  ) {
    fail('canonical array order');
  }

  const planSha256 = await sha256Hex(canonicalSerialize(actualPayload));
  if (
    candidate.planSha256 !== planSha256 ||
    candidate.weaveId !== `proofweave_${planSha256}` ||
    candidate.planId !== `proofweave_${planSha256}`
  ) {
    fail('plan digest or identifier');
  }

  if (!isCanonicalIsoInstant(candidate.compiledAt)) {
    fail('compile timestamp');
  }
  if (
    candidate.tenantId !== options.tenantId ||
    candidate.tenantAttributionEvidenceClass !== 'DECLARED'
  ) {
    fail('tenant attribution');
  }

  const ledger = record(candidate.ledger);
  if (
    !ledger ||
    !hasExactKeys(ledger, [
      'entryId',
      'appendState',
      'backendState',
      'durablePersistenceEvidenceClass',
    ]) ||
    typeof ledger.entryId !== 'string' ||
    !LEDGER_ENTRY_ID_PATTERN.test(ledger.entryId) ||
    ledger.appendState !== 'IN_PROCESS_APPEND_ACCEPTED' ||
    ledger.backendState !== 'CONFIGURATION_DEPENDENT' ||
    ledger.durablePersistenceEvidenceClass !== 'UNKNOWN'
  ) {
    fail('ledger boundary');
  }

  return candidate as unknown as AtelierProofweaveApiResponse;
}
