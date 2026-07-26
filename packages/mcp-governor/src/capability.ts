import { type KeyLike, sign, verify } from 'node:crypto';

import { canonicalJson } from './canonical.js';
import {
  ACTION_RISK_RANK,
  type ActionRisk,
  type CapabilityClaims,
  type CapabilityPublicKeyResolver,
  type VerifiedCapability,
} from './types.js';

const HEADER_TYPE = 'SZL-CAP';

export class CapabilityTokenError extends Error {
  constructor(
    readonly code:
      | 'malformed'
      | 'invalid_signature'
      | 'invalid_claims'
      | 'not_yet_valid'
      | 'expired'
      | 'issuer_mismatch'
      | 'subject_mismatch'
      | 'tenant_mismatch'
      | 'tool_not_allowed'
      | 'risk_exceeded',
    message: string,
  ) {
    super(message);
    this.name = 'CapabilityTokenError';
  }
}

function encodeJson(value: unknown): string {
  return Buffer.from(canonicalJson(value), 'utf8').toString('base64url');
}

function decodeJson(value: string): unknown {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    throw new CapabilityTokenError('malformed', 'capability token contains invalid JSON');
  }
}

function isRisk(value: unknown): value is ActionRisk {
  return typeof value === 'string' && value in ACTION_RISK_RANK;
}

function parseClaims(value: unknown): CapabilityClaims {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CapabilityTokenError('invalid_claims', 'capability claims must be an object');
  }
  const claims = value as Record<string, unknown>;
  const strings = ['tokenId', 'issuer', 'subject', 'tenantId', 'nonce'] as const;
  if (claims.version !== 'szl.capability/v1') {
    throw new CapabilityTokenError('invalid_claims', 'unsupported capability version');
  }
  for (const name of strings) {
    if (typeof claims[name] !== 'string' || claims[name].length === 0) {
      throw new CapabilityTokenError('invalid_claims', `${name} must be a non-empty string`);
    }
  }
  if (
    !Array.isArray(claims.tools) ||
    claims.tools.length === 0 ||
    !claims.tools.every((tool) => typeof tool === 'string' && tool.length > 0)
  ) {
    throw new CapabilityTokenError('invalid_claims', 'tools must contain non-empty tool names');
  }
  if (!isRisk(claims.maxRisk)) {
    throw new CapabilityTokenError('invalid_claims', 'maxRisk is invalid');
  }
  if (!Number.isInteger(claims.notBefore) || !Number.isInteger(claims.expiresAt)) {
    throw new CapabilityTokenError('invalid_claims', 'validity timestamps must be integers');
  }
  if ((claims.expiresAt as number) <= (claims.notBefore as number)) {
    throw new CapabilityTokenError('invalid_claims', 'expiresAt must be after notBefore');
  }
  return claims as unknown as CapabilityClaims;
}

export function signCapabilityToken(
  claims: CapabilityClaims,
  privateKey: KeyLike,
  keyId: string,
): string {
  if (!keyId) throw new CapabilityTokenError('invalid_claims', 'keyId is required');
  parseClaims(claims);
  const header = encodeJson({ algorithm: 'Ed25519', keyId, type: HEADER_TYPE });
  const payload = encodeJson(claims);
  const signingInput = `${header}.${payload}`;
  const signature = sign(null, Buffer.from(signingInput, 'utf8'), privateKey).toString('base64url');
  return `${signingInput}.${signature}`;
}

export async function verifyCapabilityToken(
  token: string,
  resolvePublicKey: CapabilityPublicKeyResolver,
  options: {
    now?: Date;
    expectedIssuer?: string;
    actorId: string;
    tenantId: string;
    toolName: string;
    risk: ActionRisk;
  },
): Promise<VerifiedCapability> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new CapabilityTokenError('malformed', 'capability token must have three segments');
  }
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJson(headerPart);
  if (!header || typeof header !== 'object' || Array.isArray(header)) {
    throw new CapabilityTokenError('malformed', 'capability header must be an object');
  }
  const fields = header as Record<string, unknown>;
  if (
    fields.algorithm !== 'Ed25519' ||
    fields.type !== HEADER_TYPE ||
    typeof fields.keyId !== 'string' ||
    fields.keyId.length === 0
  ) {
    throw new CapabilityTokenError('malformed', 'capability header is invalid');
  }

  const claims = parseClaims(decodeJson(payloadPart));
  const publicKey = await resolvePublicKey(fields.keyId, claims.issuer);
  const signingInput = `${headerPart}.${payloadPart}`;
  const valid = verify(
    null,
    Buffer.from(signingInput, 'utf8'),
    publicKey,
    Buffer.from(signaturePart, 'base64url'),
  );
  if (!valid)
    throw new CapabilityTokenError('invalid_signature', 'capability signature is invalid');

  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  if (nowSeconds < claims.notBefore) {
    throw new CapabilityTokenError('not_yet_valid', 'capability is not yet valid');
  }
  if (nowSeconds >= claims.expiresAt) {
    throw new CapabilityTokenError('expired', 'capability has expired');
  }
  if (options.expectedIssuer && claims.issuer !== options.expectedIssuer) {
    throw new CapabilityTokenError('issuer_mismatch', 'capability issuer does not match');
  }
  if (claims.subject !== options.actorId) {
    throw new CapabilityTokenError('subject_mismatch', 'capability subject does not match actor');
  }
  if (claims.tenantId !== options.tenantId) {
    throw new CapabilityTokenError('tenant_mismatch', 'capability tenant does not match');
  }
  if (!claims.tools.includes(options.toolName)) {
    throw new CapabilityTokenError('tool_not_allowed', 'capability does not allow this tool');
  }
  if (ACTION_RISK_RANK[options.risk] > ACTION_RISK_RANK[claims.maxRisk]) {
    throw new CapabilityTokenError('risk_exceeded', 'action risk exceeds capability ceiling');
  }
  return { claims, keyId: fields.keyId };
}
