import { type KeyLike, randomUUID, sign, verify } from 'node:crypto';

import { canonicalJson, sha256 } from './canonical.js';
import type {
  GovernanceReceipt,
  GovernedActionEnvelope,
  PolicyDecision,
  ReceiptOutcome,
  ReceiptPhase,
  ReceiptSigner,
} from './types.js';

export function createSignedReceipt(
  input: {
    envelope: GovernedActionEnvelope;
    decision: PolicyDecision;
    phase: ReceiptPhase;
    outcome: ReceiptOutcome;
    occurredAt: string;
    resultDigest?: string;
    priorReceiptDigest?: string;
  },
  signer: ReceiptSigner,
): GovernanceReceipt {
  const unsigned = {
    schema: 'szl.governance-receipt/v1' as const,
    receiptId: randomUUID(),
    actionId: input.envelope.actionId,
    phase: input.phase,
    outcome: input.outcome,
    toolName: input.envelope.toolName,
    actorId: input.envelope.actorId,
    tenantId: input.envelope.tenantId,
    risk: input.envelope.risk,
    mutatesState: input.envelope.mutatesState,
    decision: input.decision.effect,
    reason: input.decision.reason,
    policyVersion: input.decision.policyVersion,
    occurredAt: input.occurredAt,
    argsDigest: input.envelope.argsDigest,
    resultDigest: input.resultDigest,
    priorReceiptDigest: input.priorReceiptDigest,
  };
  const receiptDigest = sha256(canonicalJson(unsigned));
  const signature = sign(null, Buffer.from(receiptDigest, 'hex'), signer.privateKey).toString(
    'base64url',
  );
  return Object.freeze({
    ...unsigned,
    receiptDigest,
    signature: Object.freeze({
      algorithm: 'Ed25519',
      keyId: signer.keyId,
      value: signature,
    }),
  });
}

export function verifyGovernanceReceipt(receipt: GovernanceReceipt, publicKey: KeyLike): boolean {
  const { receiptDigest, signature, ...unsigned } = receipt;
  if (signature.algorithm !== 'Ed25519') return false;
  if (sha256(canonicalJson(unsigned)) !== receiptDigest) return false;
  return verify(
    null,
    Buffer.from(receiptDigest, 'hex'),
    publicKey,
    Buffer.from(signature.value, 'base64url'),
  );
}
