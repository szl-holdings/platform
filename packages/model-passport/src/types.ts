export type PassportLifecycleState =
  | 'draft'
  | 'proposed'
  | 'approved'
  | 'active'
  | 'deprecated'
  | 'revoked';

export type QuantTier = 'fp32' | 'fp16' | 'bf16' | 'int8' | 'int4' | 'gguf-q4' | 'gguf-q5' | 'gguf-q8' | 'hosted';

export type RouteClass =
  | 'classification'
  | 'triage'
  | 'reasoning'
  | 'planning'
  | 'tool_calling'
  | 'vision_understanding'
  | 'background_batch'
  | 'extraction'
  | 'summarization';

export type AutonomyTier = 'read_only' | 'advisory' | 'supervised' | 'autonomous';

export interface PassportIdentity {
  id: string;
  displayName: string;
  version: string;
  provider: string;
  providerModelId: string;
  createdAt: string;
}

export interface PassportQuantProfile {
  tier: QuantTier;
  bitsPerWeight?: number;
  contextWindow: number;
  modality: Array<'text' | 'vision' | 'audio' | 'code'>;
}

export interface PassportCapabilitySurface {
  lanes: RouteClass[];
  skills: string[];
  supportedTools: string[];
}

export interface PassportCostProfile {
  costPer1kTokensUsd: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  evalPassRate: number;
  benchmarks?: Record<string, number>;
}

export interface PassportPolicyEnvelope {
  autonomyTier: AutonomyTier;
  allowedDomains: string[];
  piiHandling: 'blocked' | 'redacted' | 'allowed';
  escalationRules: string[];
  jurisdictions: string[];
  maxBudgetUsdPerCall?: number;
}

export interface PassportSigner {
  keyId: string;
  publicKey: string;
  role: string;
  signedAt: string;
  signature: string;
}

export interface PassportRevocation {
  revokedAt: string;
  revokedBy: string;
  reason: string;
}

export interface PassportApprovals {
  signers: PassportSigner[];
  requiredSigners: number;
  revocation?: PassportRevocation;
}

export interface PassportProvenance {
  sourceRegistryHash: string;
  promptRegistryPins: string[];
  datasetHashes: string[];
  evalRunId?: string;
  parentPassportId?: string;
}

export interface EvalGates {
  minGoldenSetPassRate: number;
  maxP95LatencyMs: number;
  maxCostPerCallUsd: number;
}

export interface PassportDowngradeEntry {
  passportId: string;
  displayName: string;
  reason: string;
}

export interface ModelPassport {
  schemaVersion: '1.0';
  identity: PassportIdentity;
  quantProfile: PassportQuantProfile;
  capabilitySurface: PassportCapabilitySurface;
  costProfile: PassportCostProfile;
  policyEnvelope: PassportPolicyEnvelope;
  approvals: PassportApprovals;
  provenance: PassportProvenance;
  downgradeTo: PassportDowngradeEntry[];
  state: PassportLifecycleState;
  tenantId?: number;
  evalGates?: EvalGates;
}

export interface SignedModelPassportMetadata {
  pinnedEvalRunId?: string;
}

export interface SignedModelPassport {
  passport: ModelPassport;
  signature: string;
  signerPublicKey: string;
  provenanceHash: string;
  signedAt: string;
  metadata?: SignedModelPassportMetadata;
}

export interface PassportResolverQuery {
  lane: RouteClass;
  budgetUsdPerCall?: number;
  slaP95Ms?: number;
  tenantId?: number;
  requiredCapabilities?: string[];
}

export interface PassportResolverResult {
  passport: SignedModelPassport;
  passportId: string;
  signatureDigest: string;
  downgradeLadder: PassportDowngradeEntry[];
}

export interface PassportVerifyResult {
  valid: boolean;
  signatureOk: boolean;
  hashOk: boolean;
  stateOk: boolean;
  errors: string[];
}

export interface PassportLifecycleTransition {
  from: PassportLifecycleState;
  to: PassportLifecycleState;
  allowedRoles: string[];
  requiresApproval: boolean;
  isHighRisk: boolean;
}

export const PASSPORT_TRANSITIONS: PassportLifecycleTransition[] = [
  { from: 'draft', to: 'proposed', allowedRoles: ['operator', 'admin'], requiresApproval: false, isHighRisk: false },
  { from: 'proposed', to: 'approved', allowedRoles: ['approver', 'admin', 'super_admin'], requiresApproval: true, isHighRisk: false },
  { from: 'approved', to: 'active', allowedRoles: ['operator', 'admin', 'super_admin'], requiresApproval: false, isHighRisk: true },
  { from: 'active', to: 'deprecated', allowedRoles: ['operator', 'admin', 'super_admin'], requiresApproval: false, isHighRisk: false },
  { from: 'active', to: 'revoked', allowedRoles: ['approver', 'admin', 'super_admin'], requiresApproval: true, isHighRisk: true },
  { from: 'proposed', to: 'draft', allowedRoles: ['operator', 'admin'], requiresApproval: false, isHighRisk: false },
  { from: 'approved', to: 'draft', allowedRoles: ['approver', 'admin'], requiresApproval: false, isHighRisk: false },
  { from: 'deprecated', to: 'revoked', allowedRoles: ['approver', 'admin', 'super_admin'], requiresApproval: true, isHighRisk: false },
];
