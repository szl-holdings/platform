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
  receiptSigner: ReceiptSigner;
  receiptWriter: ReceiptWriter;
  replayStore?: ReplayStore;
  requireCapabilityForReadOnly?: boolean;
  expectedCapabilityIssuer?: string;
  clock?: () => Date;
}

export interface GovernedActionResult<T> {
  result: T;
  envelope: GovernedActionEnvelope;
  decision: PolicyDecision;
  capability?: VerifiedCapability;
  receipts: GovernanceReceipt[];
}
