import type { KeyLike } from 'node:crypto';

export type EvidenceTier = 'MEASURED' | 'REPORTED' | 'MODELED' | 'CONJECTURE' | 'UNKNOWN';

export type StateType =
  | 'prompt'
  | 'kv_cache'
  | 'hidden_state'
  | 'embedding'
  | 'verifier_trace'
  | 'adapter'
  | 'tool_output'
  | 'reasoning_state'
  | 'structured_memory'
  | 'custom';

export type PortabilityTier = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
export type StateSensitivity = 'public' | 'internal' | 'confidential' | 'restricted';
export type StateReusePolicy = 'never' | 'same_action' | 'same_session' | 'same_tenant' | 'explicit';
export type RevocationStatus = 'ACTIVE' | 'REVOKED' | 'QUARANTINED' | 'SHREDDED';

export interface CompatibilityFingerprint {
  readonly modelId?: string;
  readonly modelRevision?: string;
  readonly engineId?: string;
  readonly engineVersion?: string;
  readonly tokenizerDigest?: string;
  readonly layoutDigest?: string;
  readonly adapterSetDigest?: string;
  readonly semanticSpaceDigest?: string;
  readonly schemaDigest?: string;
  readonly policyDigest: string;
  readonly cognitiveEpoch: string;
  readonly providerSessionId?: string;
}

export interface StateGovernance {
  readonly sensitivity: StateSensitivity;
  readonly retentionClass: 'ephemeral' | 'session' | 'short' | 'regulated' | 'custom';
  readonly reusePolicy: StateReusePolicy;
  readonly evidenceTier: EvidenceTier;
  readonly explicitGrantId?: string;
}

export interface StateCapsuleProvenance {
  readonly sourceActionId: string;
  readonly parentCapsuleIds: readonly string[];
  readonly producerKernelId?: string;
  readonly producerKernelVersion?: string;
  readonly sourceReceiptId?: string;
}

export interface StateCapsule {
  readonly schema: 'szl.state-capsule/v1';
  readonly capsuleId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly stateType: StateType;
  readonly portability: PortabilityTier;
  readonly contentDigest: string;
  readonly byteLength: number;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly compatibility: CompatibilityFingerprint;
  readonly governance: StateGovernance;
  readonly provenance: StateCapsuleProvenance;
  readonly revocationStatus: RevocationStatus;
  readonly transitionDigest?: string;
}

export interface PutStateRequest {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly stateType: StateType;
  readonly portability: PortabilityTier;
  readonly payload: Uint8Array;
  readonly compatibility: CompatibilityFingerprint;
  readonly governance: StateGovernance;
  readonly provenance: StateCapsuleProvenance;
  readonly expiresAt?: string;
  readonly idempotencyKey?: string;
}

export interface StateReadContext {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly actionId: string;
  readonly compatibility: CompatibilityFingerprint;
  readonly explicitGrantId?: string;
  readonly allowedSensitivities: readonly StateSensitivity[];
  readonly now?: Date;
}

export interface StateReadResult {
  readonly capsule: StateCapsule;
  readonly payload: Uint8Array;
}

export type StateTransitionType = 'CREATED' | 'REVOKED' | 'QUARANTINED' | 'SHREDDED';

export interface StateTransitionReceipt {
  readonly schema: 'szl.state-transition/v1';
  readonly transitionId: string;
  readonly capsuleId: string;
  readonly tenantId: string;
  readonly transition: StateTransitionType;
  readonly reason: string;
  readonly occurredAt: string;
  readonly priorTransitionDigest?: string;
  readonly transitionDigest: string;
}

export interface PortableStateObject {
  readonly capsule: StateCapsule;
  readonly payload: Uint8Array;
}

export interface StateTransportAdapter {
  readonly name: string;
  put(object: PortableStateObject): Promise<void>;
  get(capsuleId: string): Promise<PortableStateObject | undefined>;
  delete(capsuleId: string): Promise<void>;
}

export interface StateTransferReceipt {
  readonly schema: 'szl.state-transfer/v1';
  readonly transferId: string;
  readonly capsuleId: string;
  readonly tenantId: string;
  readonly adapter: string;
  readonly direction: 'EXPORT' | 'IMPORT';
  readonly occurredAt: string;
  readonly contentDigest: string;
  readonly receiptDigest: string;
}

export type CognitiveEpochState =
  | 'PREPARED'
  | 'VALIDATED'
  | 'ACTIVE'
  | 'DRAINING'
  | 'RETIRED'
  | 'REJECTED'
  | 'ROLLED_BACK';

export interface CognitiveEpochSpec {
  readonly epochId: string;
  readonly tenantId: string;
  readonly route: string;
  readonly modelId: string;
  readonly modelRevision: string;
  readonly engineId: string;
  readonly engineVersion: string;
  readonly tokenizerDigest: string;
  readonly layoutDigest: string;
  readonly adapterSetDigest: string;
  readonly verifierSetDigest: string;
  readonly promptBundleDigest: string;
  readonly policyDigest: string;
  readonly toolManifestDigest: string;
  readonly createdAt: string;
}

export interface EpochValidationCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface CognitiveEpochRecord extends CognitiveEpochSpec {
  readonly state: CognitiveEpochState;
  readonly validationChecks: readonly EpochValidationCheck[];
  readonly activatedAt?: string;
  readonly retiredAt?: string;
  readonly rollbackReason?: string;
  readonly leaseCount: number;
}

export interface CognitiveEpochLease {
  readonly leaseId: string;
  readonly epoch: CognitiveEpochRecord;
  release(): void;
}

export type KernelKind =
  | 'context_build'
  | 'prefill'
  | 'decode'
  | 'planning'
  | 'tool'
  | 'multimodal_encode'
  | 'policy'
  | 'verification'
  | 'custom';

export interface GovernedActionEnvelopeV1 {
  readonly schema: 'szl.governed-action/v1';
  readonly actionId: string;
  readonly toolName: string;
  readonly actorId: string;
  readonly tenantId: string;
  readonly risk: 'read_only' | 'low' | 'medium' | 'high' | 'critical';
  readonly mutatesState: boolean;
  readonly requestedAt: string;
  readonly argsDigest: string;
}

export interface KernelPolicyDecision {
  readonly effect: 'allow' | 'block' | 'approval_required';
  readonly reason: string;
  readonly policyVersion?: string;
}

export interface ApprovalEvidence {
  readonly approvalId: string;
  readonly actionId: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly scopeDigest: string;
}

export interface GovernedKernelAuthorization {
  readonly envelope: GovernedActionEnvelopeV1;
  readonly decision: KernelPolicyDecision;
  readonly allowedSensitivities: readonly StateSensitivity[];
  readonly approval?: ApprovalEvidence;
}

export interface KernelBudget {
  readonly maxRuntimeMs: number;
  readonly maxInputBytes: number;
  readonly maxOutputBytes: number;
  readonly maxStateWrites: number;
}

export interface KernelExecutionInput {
  readonly capsules: readonly StateReadResult[];
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface KernelProducedState {
  readonly stateType: StateType;
  readonly portability: PortabilityTier;
  readonly payload: Uint8Array;
  readonly compatibility?: CompatibilityFingerprint;
  readonly governance?: StateGovernance;
  readonly expiresAt?: string;
}

export interface KernelExecutionContext {
  readonly actionId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly epoch: CognitiveEpochRecord;
  readonly budget: KernelBudget;
  readonly signal: AbortSignal;
}

export interface KernelVerifierResult {
  readonly passed: boolean;
  readonly reason: string;
  readonly evidenceDigests: readonly string[];
}

export interface KernelDefinition {
  readonly kernelId: string;
  readonly version: string;
  readonly kind: KernelKind;
  readonly route: string;
  readonly requiresVerification: boolean;
  execute(input: KernelExecutionInput, context: KernelExecutionContext): Promise<readonly KernelProducedState[]>;
  verify?: (
    output: readonly KernelProducedState[],
    input: KernelExecutionInput,
    context: KernelExecutionContext,
  ) => Promise<KernelVerifierResult>;
}

export interface KernelExecutionRequest {
  readonly authorization: GovernedKernelAuthorization;
  readonly kernelId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly inputCapsuleIds: readonly string[];
  readonly inputCompatibility: CompatibilityFingerprint;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly budget: KernelBudget;
  readonly epochId?: string;
  readonly stateGrantId?: string;
  readonly idempotencyKey?: string;
}

export interface KernelReceiptUnsigned {
  readonly schema: 'szl.kernel-execution-receipt/v1';
  readonly receiptId: string;
  readonly actionId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly kernelId: string;
  readonly kernelVersion: string;
  readonly kernelKind: KernelKind;
  readonly epochId: string;
  readonly policyEffect: KernelPolicyDecision['effect'];
  readonly policyReason: string;
  readonly policyVersion?: string;
  readonly approvalId?: string;
  readonly outcome: 'success' | 'blocked' | 'error';
  readonly reason: string;
  readonly inputCapsuleIds: readonly string[];
  readonly inputDigests: readonly string[];
  readonly outputCapsuleIds: readonly string[];
  readonly outputDigests: readonly string[];
  readonly verifier?: KernelVerifierResult;
  readonly budget: KernelBudget;
  readonly runtimeMs: number;
  readonly occurredAt: string;
  readonly priorReceiptDigest?: string;
}

export interface KernelExecutionReceipt extends KernelReceiptUnsigned {
  readonly receiptDigest: string;
  readonly signature: {
    readonly algorithm: 'Ed25519';
    readonly keyId: string;
    readonly value: string;
  };
}

export interface ReceiptSigner {
  readonly keyId: string;
  readonly privateKey: KeyLike;
}

export type ReceiptWriter = (receipt: KernelExecutionReceipt) => Promise<void>;

export interface KernelRuntimeConfig {
  readonly receiptSigner: ReceiptSigner;
  readonly receiptWriter: ReceiptWriter;
  readonly clock?: () => Date;
}

export interface KernelExecutionResult {
  readonly outputs: readonly StateCapsule[];
  readonly receipt: KernelExecutionReceipt;
}

export type ReasoningVaultState =
  | 'PREPARED'
  | 'IN_FLIGHT'
  | 'COMPLETE'
  | 'REJECTED'
  | 'INDETERMINATE'
  | 'SHREDDED';

export interface ReasoningVaultEntry {
  readonly schema: 'szl.reasoning-vault-entry/v1';
  readonly entryId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly modelId: string;
  readonly modelRevision: string;
  readonly cognitiveEpoch: string;
  readonly providerRequestId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly byteLength: number;
  readonly contentDigest: string;
  readonly state: ReasoningVaultState;
  readonly stateReason?: string;
}

export interface StoreReasoningStateRequest {
  readonly tenantId: string;
  readonly sessionId: string;
  readonly modelId: string;
  readonly modelRevision: string;
  readonly cognitiveEpoch: string;
  readonly providerRequestId: string;
  readonly payload: Uint8Array;
  readonly ttlMs: number;
  readonly idempotencyKey?: string;
}

export interface ReasoningCheckoutRequest {
  readonly entryId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly modelId: string;
  readonly modelRevision: string;
  readonly cognitiveEpoch: string;
  readonly now?: Date;
}

export interface ReasoningCheckout {
  readonly entry: ReasoningVaultEntry;
  readonly payload: Uint8Array;
}
