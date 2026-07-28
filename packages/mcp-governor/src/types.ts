import type { KeyLike } from 'node:crypto';

export type ActionRisk = 'read_only' | 'low' | 'medium' | 'high' | 'critical';

export const ACTION_RISK_RANK: Readonly<Record<ActionRisk, number>> = {
  read_only: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface CapabilityClaims {
  version: 'szl.capability/v1';
  tokenId: string;
  issuer: string;
  subject: string;
  tenantId: string;
  tools: string[];
  maxRisk: ActionRisk;
  notBefore: number;
  expiresAt: number;
  nonce: string;
}

export interface VerifiedCapability {
  claims: CapabilityClaims;
  keyId: string;
}

export type AttestationType = 'nvidia-cc' | 'amd-sev-snp' | 'intel-tdx' | 'tpm2';

export type AttestationVerifier =
  | 'nvidia-nras'
  | 'amd-vcek'
  | 'intel-trust-authority'
  | 'intel-dcap'
  | 'tpm2-quote';

export type AttestationResultAlgorithm = 'EdDSA' | 'ES256' | 'PS384';

export interface AttestationResultClaims {
  version: 'szl.attestation-result/v1';
  resultId: string;
  issuer: string;
  actionId: string;
  actorId: string;
  tenantId: string;
  workloadId: string;
  attestationType: AttestationType;
  verifier: AttestationVerifier;
  hardwareVerified: true;
  eatNonce: string;
  quoteDigest: string;
  measurement: string;
  referencePolicyDigest: string;
  verifiedAt: number;
  expiresAt: number;
}

export interface VerifiedAttestationResult {
  readonly claims: Readonly<AttestationResultClaims>;
  readonly keyId: string;
  readonly algorithm: AttestationResultAlgorithm;
}

export type AttestationPublicKeyResolver = (
  keyId: string,
  issuer: string,
  verifier: AttestationVerifier,
) => Promise<KeyLike> | KeyLike;

export interface AttestationReferenceValue {
  readonly attestationType: AttestationType;
  readonly verifier: AttestationVerifier;
  readonly workloadId: string;
  readonly issuers: readonly string[];
  readonly measurements: readonly string[];
  readonly referencePolicyDigests: readonly string[];
}

export interface AttestationAdmissionConfig {
  readonly requiredRisks: readonly ActionRisk[];
  readonly references: readonly AttestationReferenceValue[];
  readonly publicKeyResolver: AttestationPublicKeyResolver;
  readonly replayStore?: ReplayStore;
  readonly maxResultAgeSeconds?: number;
  readonly maxTokenLifetimeSeconds?: number;
  readonly allowedClockSkewSeconds?: number;
}

export interface GovernedActionEnvelope {
  schema: 'szl.governed-action/v1';
  actionId: string;
  toolName: string;
  actorId: string;
  tenantId: string;
  risk: ActionRisk;
  mutatesState: boolean;
  requestedAt: string;
  argsDigest: string;
}

export interface GovernedActionRequest {
  actionId?: string;
  toolName: string;
  actorId: string;
  tenantId: string;
  risk: ActionRisk;
  mutatesState: boolean;
  args: unknown;
  capabilityToken?: string;
  attestationResultToken?: string;
}

export type PolicyEffect = 'allow' | 'block' | 'approval_required';

export interface PolicyDecision {
  effect: PolicyEffect;
  reason: string;
  policyVersion?: string;
}

export type PolicyEvaluator = (
  envelope: GovernedActionEnvelope,
  args: unknown,
) => Promise<PolicyDecision>;

export type ReceiptPhase = 'before' | 'after' | 'blocked';
export type ReceiptOutcome = 'pending' | 'success' | 'error' | 'blocked';

export interface GovernanceReceipt {
  readonly schema: 'szl.governance-receipt/v1';
  readonly receiptId: string;
  readonly actionId: string;
  readonly phase: ReceiptPhase;
  readonly outcome: ReceiptOutcome;
  readonly toolName: string;
  readonly actorId: string;
  readonly tenantId: string;
  readonly risk: ActionRisk;
  readonly mutatesState: boolean;
  readonly decision: PolicyEffect;
  readonly reason: string;
  readonly policyVersion?: string;
  readonly occurredAt: string;
  readonly argsDigest: string;
  readonly resultDigest?: string;
  readonly priorReceiptDigest?: string;
  readonly attestation?: VerifiedAttestationResult;
  readonly receiptDigest: string;
  readonly signature: {
    readonly algorithm: 'Ed25519';
    readonly keyId: string;
    readonly value: string;
  };
}

export interface ReceiptSigner {
  keyId: string;
  privateKey: KeyLike;
}

export type ReceiptWriter = (receipt: GovernanceReceipt) => Promise<void>;

export type GovernedToolExecutor = (toolName: string, args: unknown) => Promise<unknown>;

export type CapabilityPublicKeyResolver = (
  keyId: string,
  issuer: string,
) => Promise<KeyLike> | KeyLike;

export interface ReplayStore {
  consume(tokenId: string, expiresAt: number, nowSeconds: number): Promise<boolean>;
}

export interface McpGovernorConfig {
  policyEvaluator: PolicyEvaluator;
  capabilityPublicKeyResolver: CapabilityPublicKeyResolver;
  toolExecutor: GovernedToolExecutor;
  receiptSigner: ReceiptSigner;
  receiptWriter: ReceiptWriter;
  replayStore?: ReplayStore;
  requireCapabilityForReadOnly?: boolean;
  expectedCapabilityIssuer?: string;
  attestation?: AttestationAdmissionConfig;
  clock?: () => Date;
}

export interface GovernedActionResult<T> {
  result: T;
  envelope: GovernedActionEnvelope;
  decision: PolicyDecision;
  capability?: VerifiedCapability;
  attestation?: VerifiedAttestationResult;
  receipts: GovernanceReceipt[];
}
