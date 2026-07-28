import { constants, type KeyLike, type KeyObject, sign, verify } from 'node:crypto';

import { canonicalJson, sha256 } from './canonical.js';
import type {
  AttestationPublicKeyResolver,
  AttestationReferenceValue,
  AttestationResultAlgorithm,
  AttestationResultClaims,
  AttestationType,
  AttestationVerifier,
  GovernedActionEnvelope,
  VerifiedAttestationResult,
  VerifiedCapability,
} from './types.js';

const HEADER_TYPE = 'SZL-AR';
const MAX_TOKEN_BYTES = 131_072;
const DEFAULT_MAX_RESULT_AGE_SECONDS = 300;
const DEFAULT_MAX_TOKEN_LIFETIME_SECONDS = 600;
const DEFAULT_ALLOWED_CLOCK_SKEW_SECONDS = 30;

const ATTESTATION_TYPES: readonly AttestationType[] = [
  'nvidia-cc',
  'amd-sev-snp',
  'intel-tdx',
  'tpm2',
];

const ATTESTATION_VERIFIERS: readonly AttestationVerifier[] = [
  'nvidia-nras',
  'amd-vcek',
  'intel-trust-authority',
  'intel-dcap',
  'tpm2-quote',
];

const ATTESTATION_ALGORITHMS: readonly AttestationResultAlgorithm[] = ['EdDSA', 'ES256', 'PS384'];

export type AttestationTokenErrorCode =
  | 'malformed'
  | 'invalid_signature'
  | 'invalid_claims'
  | 'not_yet_valid'
  | 'expired'
  | 'stale'
  | 'lifetime_exceeded'
  | 'issuer_mismatch'
  | 'action_mismatch'
  | 'actor_mismatch'
  | 'tenant_mismatch'
  | 'nonce_mismatch'
  | 'type_mismatch'
  | 'verifier_mismatch'
  | 'workload_mismatch'
  | 'measurement_not_allowed'
  | 'policy_not_allowed';

export class AttestationTokenError extends Error {
  constructor(
    readonly code: AttestationTokenErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AttestationTokenError';
  }
}

function encodeJson(value: unknown): string {
  return Buffer.from(canonicalJson(value), 'utf8').toString('base64url');
}

function decodeJson(value: string, field: string): unknown {
  if (value.length === 0 || value.length > MAX_TOKEN_BYTES || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new AttestationTokenError('malformed', `${field} is not valid base64url`);
  }
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    throw new AttestationTokenError('malformed', `${field} contains invalid JSON`);
  }
}

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 31 || codePoint === 127) return true;
  }
  return false;
}

function requireText(value: unknown, field: string, maxLength = 256): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maxLength ||
    hasControlCharacters(value)
  ) {
    throw new AttestationTokenError(
      'invalid_claims',
      `${field} must be a non-empty bounded string without control characters`,
    );
  }
  return value;
}

function requireIdentifier(value: unknown, field: string): string {
  const normalized = requireText(value, field, 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(normalized)) {
    throw new AttestationTokenError('invalid_claims', `${field} has an invalid format`);
  }
  return normalized;
}

function requireDigest(value: unknown, field: string): string {
  const normalized = requireText(value, field, 104);
  const [algorithm, digest, ...remainder] = normalized.split(':');
  const expectedLength = algorithm === 'sha256' ? 64 : algorithm === 'sha384' ? 96 : 0;
  if (
    remainder.length > 0 ||
    expectedLength === 0 ||
    digest?.length !== expectedLength ||
    !/^[0-9a-f]+$/.test(digest)
  ) {
    throw new AttestationTokenError(
      'invalid_claims',
      `${field} must be a lowercase sha256 or sha384 digest with its algorithm prefix`,
    );
  }
  return normalized;
}

function requireTimestamp(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new AttestationTokenError(
      'invalid_claims',
      `${field} must be a positive integer Unix timestamp`,
    );
  }
  return value as number;
}

function parseClaims(value: unknown): AttestationResultClaims {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AttestationTokenError('invalid_claims', 'attestation claims must be an object');
  }
  const claims = value as Record<string, unknown>;
  if (claims.version !== 'szl.attestation-result/v1') {
    throw new AttestationTokenError('invalid_claims', 'unsupported attestation result version');
  }

  const attestationType = requireText(claims.attestationType, 'attestationType') as AttestationType;
  if (!ATTESTATION_TYPES.includes(attestationType)) {
    throw new AttestationTokenError('invalid_claims', 'attestationType is unsupported');
  }
  const verifier = requireText(claims.verifier, 'verifier') as AttestationVerifier;
  if (!ATTESTATION_VERIFIERS.includes(verifier)) {
    throw new AttestationTokenError('invalid_claims', 'verifier is unsupported');
  }
  if (claims.hardwareVerified !== true) {
    throw new AttestationTokenError(
      'invalid_claims',
      'hardwareVerified must be true in an admitted attestation result',
    );
  }

  const eatNonce = requireText(claims.eatNonce, 'eatNonce', 88);
  if (!/^[A-Za-z0-9_-]{11,88}$/.test(eatNonce)) {
    throw new AttestationTokenError(
      'invalid_claims',
      'eatNonce must be an unpadded base64url value with at least 64 bits of entropy',
    );
  }
  const verifiedAt = requireTimestamp(claims.verifiedAt, 'verifiedAt');
  const expiresAt = requireTimestamp(claims.expiresAt, 'expiresAt');
  if (expiresAt <= verifiedAt) {
    throw new AttestationTokenError('invalid_claims', 'expiresAt must be after verifiedAt');
  }

  return {
    version: 'szl.attestation-result/v1',
    resultId: requireIdentifier(claims.resultId, 'resultId'),
    issuer: requireText(claims.issuer, 'issuer', 512),
    actionId: requireText(claims.actionId, 'actionId', 128),
    actorId: requireText(claims.actorId, 'actorId', 256),
    tenantId: requireText(claims.tenantId, 'tenantId', 256),
    workloadId: requireText(claims.workloadId, 'workloadId', 256),
    attestationType,
    verifier,
    hardwareVerified: true,
    eatNonce,
    quoteDigest: requireDigest(claims.quoteDigest, 'quoteDigest'),
    measurement: requireDigest(claims.measurement, 'measurement'),
    referencePolicyDigest: requireDigest(claims.referencePolicyDigest, 'referencePolicyDigest'),
    verifiedAt,
    expiresAt,
  };
}

function signInput(
  algorithm: AttestationResultAlgorithm,
  input: Buffer,
  privateKey: KeyLike,
): Buffer {
  if (algorithm === 'EdDSA') return sign(null, input, privateKey);
  if (algorithm === 'ES256') {
    return sign('sha256', input, {
      key: privateKey as KeyObject,
      dsaEncoding: 'ieee-p1363',
    });
  }
  return sign('sha384', input, {
    key: privateKey as KeyObject,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 48,
  });
}

function verifyInput(
  algorithm: AttestationResultAlgorithm,
  input: Buffer,
  signature: Buffer,
  publicKey: KeyLike,
): boolean {
  if (algorithm === 'EdDSA') return verify(null, input, publicKey, signature);
  if (algorithm === 'ES256') {
    return verify(
      'sha256',
      input,
      {
        key: publicKey as KeyObject,
        dsaEncoding: 'ieee-p1363',
      },
      signature,
    );
  }
  return verify(
    'sha384',
    input,
    {
      key: publicKey as KeyObject,
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 48,
    },
    signature,
  );
}

function boundedNonNegativeInteger(
  value: number | undefined,
  fallback: number,
  field: string,
): number {
  const normalized = value ?? fallback;
  if (!Number.isSafeInteger(normalized) || normalized < 0 || normalized > 86_400) {
    throw new TypeError(`${field} must be an integer between 0 and 86400`);
  }
  return normalized;
}

export function createAttestationChallenge(
  envelope: GovernedActionEnvelope,
  capability?: VerifiedCapability,
): string {
  const digest = sha256(
    canonicalJson({
      schema: 'szl.attestation-challenge/v1',
      actionId: envelope.actionId,
      toolName: envelope.toolName,
      actorId: envelope.actorId,
      tenantId: envelope.tenantId,
      risk: envelope.risk,
      mutatesState: envelope.mutatesState,
      argsDigest: envelope.argsDigest,
      capabilityTokenId: capability?.claims.tokenId ?? null,
      capabilityNonce: capability?.claims.nonce ?? null,
    }),
  );
  return Buffer.from(digest, 'hex').toString('base64url');
}

export function signAttestationResultToken(
  claims: AttestationResultClaims,
  privateKey: KeyLike,
  keyId: string,
  algorithm: AttestationResultAlgorithm = 'EdDSA',
): string {
  const normalizedClaims = parseClaims(claims);
  const normalizedKeyId = requireIdentifier(keyId, 'keyId');
  if (!ATTESTATION_ALGORITHMS.includes(algorithm)) {
    throw new AttestationTokenError('invalid_claims', 'attestation algorithm is unsupported');
  }
  const header = encodeJson({ alg: algorithm, kid: normalizedKeyId, typ: HEADER_TYPE });
  const payload = encodeJson(normalizedClaims);
  const signingInput = `${header}.${payload}`;
  const signature = signInput(algorithm, Buffer.from(signingInput, 'utf8'), privateKey).toString(
    'base64url',
  );
  return `${signingInput}.${signature}`;
}

export async function verifyAttestationResultToken(
  token: string,
  resolvePublicKey: AttestationPublicKeyResolver,
  options: {
    now?: Date;
    expectedActionId: string;
    expectedActorId: string;
    expectedTenantId: string;
    expectedEatNonce: string;
    references: readonly AttestationReferenceValue[];
    maxResultAgeSeconds?: number;
    maxTokenLifetimeSeconds?: number;
    allowedClockSkewSeconds?: number;
  },
): Promise<VerifiedAttestationResult> {
  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    Buffer.byteLength(token, 'utf8') > MAX_TOKEN_BYTES
  ) {
    throw new AttestationTokenError('malformed', 'attestation result token is empty or too large');
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new AttestationTokenError(
      'malformed',
      'attestation result token must have three segments',
    );
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  if (
    signaturePart.length === 0 ||
    signaturePart.length > MAX_TOKEN_BYTES ||
    !/^[A-Za-z0-9_-]+$/.test(signaturePart)
  ) {
    throw new AttestationTokenError('malformed', 'attestation signature is not valid base64url');
  }
  const header = decodeJson(headerPart, 'attestation header');
  if (!header || typeof header !== 'object' || Array.isArray(header)) {
    throw new AttestationTokenError('malformed', 'attestation header must be an object');
  }
  const headerFields = header as Record<string, unknown>;
  const algorithm = headerFields.alg as AttestationResultAlgorithm;
  if (
    headerFields.typ !== HEADER_TYPE ||
    !ATTESTATION_ALGORITHMS.includes(algorithm) ||
    typeof headerFields.kid !== 'string'
  ) {
    throw new AttestationTokenError('malformed', 'attestation header is invalid');
  }
  const keyId = requireIdentifier(headerFields.kid, 'keyId');
  const claims = parseClaims(decodeJson(payloadPart, 'attestation payload'));

  let validSignature = false;
  try {
    const publicKey = await resolvePublicKey(keyId, claims.issuer, claims.verifier);
    validSignature = verifyInput(
      algorithm,
      Buffer.from(`${headerPart}.${payloadPart}`, 'utf8'),
      Buffer.from(signaturePart, 'base64url'),
      publicKey,
    );
  } catch {
    validSignature = false;
  }
  if (!validSignature) {
    throw new AttestationTokenError('invalid_signature', 'attestation result signature is invalid');
  }

  if (!options.references.some((item) => item.attestationType === claims.attestationType)) {
    throw new AttestationTokenError('type_mismatch', 'attestation type is not allowed');
  }
  if (
    !options.references.some(
      (item) =>
        item.attestationType === claims.attestationType && item.verifier === claims.verifier,
    )
  ) {
    throw new AttestationTokenError('verifier_mismatch', 'attestation verifier is not allowed');
  }
  if (
    !options.references.some(
      (item) =>
        item.attestationType === claims.attestationType &&
        item.verifier === claims.verifier &&
        item.workloadId === claims.workloadId,
    )
  ) {
    throw new AttestationTokenError('workload_mismatch', 'attested workload is not allowed');
  }
  const reference = options.references.find(
    (item) =>
      item.attestationType === claims.attestationType &&
      item.verifier === claims.verifier &&
      item.workloadId === claims.workloadId &&
      item.issuers.includes(claims.issuer),
  );
  if (!reference) {
    throw new AttestationTokenError('issuer_mismatch', 'attestation issuer is not trusted');
  }

  if (claims.actionId !== options.expectedActionId) {
    throw new AttestationTokenError('action_mismatch', 'attestation action does not match');
  }
  if (claims.actorId !== options.expectedActorId) {
    throw new AttestationTokenError('actor_mismatch', 'attestation actor does not match');
  }
  if (claims.tenantId !== options.expectedTenantId) {
    throw new AttestationTokenError('tenant_mismatch', 'attestation tenant does not match');
  }
  if (claims.eatNonce !== options.expectedEatNonce) {
    throw new AttestationTokenError('nonce_mismatch', 'attestation nonce does not match');
  }
  if (!reference.measurements.includes(claims.measurement)) {
    throw new AttestationTokenError(
      'measurement_not_allowed',
      'attested measurement is not an allowed reference value',
    );
  }
  if (!reference.referencePolicyDigests.includes(claims.referencePolicyDigest)) {
    throw new AttestationTokenError(
      'policy_not_allowed',
      'attestation reference policy is not allowed',
    );
  }

  const maxResultAgeSeconds = boundedNonNegativeInteger(
    options.maxResultAgeSeconds,
    DEFAULT_MAX_RESULT_AGE_SECONDS,
    'maxResultAgeSeconds',
  );
  const maxTokenLifetimeSeconds = boundedNonNegativeInteger(
    options.maxTokenLifetimeSeconds,
    DEFAULT_MAX_TOKEN_LIFETIME_SECONDS,
    'maxTokenLifetimeSeconds',
  );
  const allowedClockSkewSeconds = boundedNonNegativeInteger(
    options.allowedClockSkewSeconds,
    DEFAULT_ALLOWED_CLOCK_SKEW_SECONDS,
    'allowedClockSkewSeconds',
  );
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);

  if (claims.verifiedAt > nowSeconds + allowedClockSkewSeconds) {
    throw new AttestationTokenError(
      'not_yet_valid',
      'attestation verification time is in the future',
    );
  }
  if (claims.expiresAt <= nowSeconds - allowedClockSkewSeconds) {
    throw new AttestationTokenError('expired', 'attestation result has expired');
  }
  if (nowSeconds - claims.verifiedAt > maxResultAgeSeconds + allowedClockSkewSeconds) {
    throw new AttestationTokenError('stale', 'attestation result is too old');
  }
  if (claims.expiresAt - claims.verifiedAt > maxTokenLifetimeSeconds) {
    throw new AttestationTokenError(
      'lifetime_exceeded',
      'attestation token lifetime exceeds policy',
    );
  }

  return Object.freeze({
    claims: Object.freeze({ ...claims }),
    keyId,
    algorithm,
  });
}
