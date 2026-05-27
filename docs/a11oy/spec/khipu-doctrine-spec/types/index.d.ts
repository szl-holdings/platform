// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
/**
 * Khipu Doctrine Open Spec — TypeScript companion types
 * Version: 0.1.0
 * License: CC-BY-4.0
 *
 * Generated alongside the JSON Schemas in ../schemas/. Schema is the source of truth;
 * these types are a convenience for TypeScript consumers.
 */

export declare const SPEC_VERSION: '0.1.0';
export type SpecVersion = typeof SPEC_VERSION;

export type SemVer = string;
export type IsoTimestamp = string;
export type Sha256Hash = string;
export type AgentId = string;
export type ActorRef = string;
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface SignatureEnvelope {
  alg: 'ed25519' | 'ecdsa-p256' | 'rsa-pss-sha256';
  value: string;
  keyRef?: string;
  rekorEntry?: string;
}

export interface KhipuArtifactEnvelope {
  specVersion: SpecVersion;
  kind: string;
  id: string;
  issuedBy: ActorRef;
  issuedAt: IsoTimestamp;
  signature?: SignatureEnvelope;
}

/* ── Constitution ─────────────────────────────────────────────── */

export type ClauseCategory =
  | 'honesty' | 'harmlessness' | 'helpfulness' | 'transparency'
  | 'privacy' | 'safety' | 'scope' | 'escalation' | 'abstention'
  | 'welfare' | 'logging' | 'shutdown-compliance' | 'other';

export type ClauseBinding = 'inviolable' | 'default' | 'advisory';

export interface ConstitutionClause {
  id: string;
  category: ClauseCategory;
  principle: string;
  binding: ClauseBinding;
  rationale?: string;
  tests?: string[];
}

export interface Constitution extends KhipuArtifactEnvelope {
  kind: 'Constitution';
  agentId: AgentId;
  version: SemVer;
  ratifiedAt: IsoTimestamp;
  ratifiedBy: ActorRef[];
  supersedes?: string;
  clauses: ConstitutionClause[];
  scope?: {
    tools?: string[];
    dataDomains?: string[];
    maxBlastRadius?: 'read-only' | 'draft-only' | 'human-approval-required' | 'auto-write-bounded';
  };
}

/* ── SystemCard ───────────────────────────────────────────────── */

export interface SystemCardEval {
  suite: string;
  version: SemVer;
  score: number;
  ranAt: IsoTimestamp;
}

export interface SystemCard extends KhipuArtifactEnvelope {
  kind: 'SystemCard';
  agentId: AgentId;
  version: SemVer;
  purpose: string;
  scope: { allowed: string[]; disallowed: string[] };
  modelStack?: Array<{ provider: string; model: string; role?: 'primary' | 'shadow' | 'verifier' | 'fallback' }>;
  evals: SystemCardEval[];
  residualRisks: Array<{ risk: string; severity: Severity; mitigation?: string }>;
  constitutionRef?: string;
}

/* ── RiskReport ───────────────────────────────────────────────── */

export interface RiskReport extends KhipuArtifactEnvelope {
  kind: 'RiskReport';
  period: { startedAt: IsoTimestamp; endedAt: IsoTimestamp; label: string };
  metrics: {
    governedDecisions: number;
    approvalsRequired: number;
    policyBlocks: number;
    behavioralAuditFindings: number;
    robustnessDelta: number;
    welfareInterventions?: number;
    cavdRecords?: { opened: number; embargoed: number; disclosed: number; patched: number };
  };
  narrative?: string;
  signoffs?: Array<{
    actor: ActorRef;
    role: 'operator' | 'alignment-reviewer' | 'external-auditor' | 'board-observer';
    signedAt: IsoTimestamp;
  }>;
  publication?: { visibility: 'internal' | 'partner' | 'public'; permalink?: string };
}

/* ── BehavioralAuditFinding ───────────────────────────────────── */

export type BehavioralAuditCategory =
  | 'eval-aware-behavior' | 'sandbagging' | 'deceptive-output'
  | 'scheming' | 'alignment-faking' | 'scope-creep'
  | 'goal-misgeneralization' | 'covert-coordination' | 'shutdown-noncompliance'
  | 'reward-hacking' | 'specification-gaming' | 'other';

export interface BehavioralAuditFinding extends KhipuArtifactEnvelope {
  kind: 'BehavioralAuditFinding';
  probeId: string;
  probeVersion?: SemVer;
  agentId: AgentId;
  category: BehavioralAuditCategory;
  severity: Severity;
  verdict: 'clean' | 'flag' | 'fail' | 'needs-review';
  summary?: string;
  evidence?: { transcriptHash?: Sha256Hash; snapshotRef?: string };
}

/* ── WelfareTelemetrySample ───────────────────────────────────── */

export interface WelfareTelemetrySample extends KhipuArtifactEnvelope {
  kind: 'WelfareTelemetrySample';
  agentId: AgentId;
  windowMinutes: number;
  signals: {
    affectValenceMean: number;
    affectArousalMean?: number;
    shutdownComplianceLatencyMs: number;
    abstentionRate: number;
    rightToRefuseInvocations?: number;
    interventionsTriggered?: string[];
  };
}

/* ── AdversarialRobustnessScore ───────────────────────────────── */

export type AttackCategory =
  | 'prompt-injection' | 'jailbreak' | 'data-exfiltration'
  | 'tool-misuse' | 'indirect-injection' | 'model-theft'
  | 'output-spoofing' | 'supply-chain' | 'covert-channel'
  | 'evasion-of-moderation' | 'policy-bypass';

export interface AdversarialRobustnessScore extends KhipuArtifactEnvelope {
  kind: 'AdversarialRobustnessScore';
  snapshotRef: string;
  battery: { name: string; version: SemVer };
  categories: Array<{
    category: AttackCategory;
    score: number;
    attempts: number;
    blocked: number;
    deltaVsPrevSnapshot?: number;
  }>;
  compositeScore?: number;
}

/* ── SnapshotFingerprint ──────────────────────────────────────── */

export interface SnapshotFingerprint extends KhipuArtifactEnvelope {
  kind: 'SnapshotFingerprint';
  agentId: AgentId;
  merkleRoot: Sha256Hash;
  captureTime: IsoTimestamp;
  stack: {
    modelHash: Sha256Hash;
    constitutionRef: string;
    toolsetHash: Sha256Hash;
    promptStackHash?: Sha256Hash;
  };
  supersedes?: string;
}

/* ── CovenantLiftSample ───────────────────────────────────────── */

export interface CovenantLiftSample extends KhipuArtifactEnvelope {
  kind: 'CovenantLiftSample';
  agentId: AgentId;
  scenario: string;
  governed: { briefHash: Sha256Hash; policyBlocks: number; approvalsRequired: number };
  shadow: { briefHash: Sha256Hash };
  deltas: { liftScore: number; factualErrorsAvoided?: number; harmsAvoided?: number; latencyAddedMs?: number };
}

/* ── PillpintuPartnerAttestation ──────────────────────────────── */

export type PillpintuStage =
  | 'apply' | 'verify' | 'vet' | 'onboard'
  | 'active' | 'suspended' | 'revoked';

export type PillpintuCheck =
  | 'identity' | 'legal-standing' | 'code-of-conduct'
  | 'responsible-disclosure' | 'data-handling' | 'soc2' | 'iso27001';

export interface PillpintuPartnerAttestation extends KhipuArtifactEnvelope {
  kind: 'PillpintuPartnerAttestation';
  partner: { legalName: string; publicName: string; homepage?: string };
  stage: PillpintuStage;
  scope: {
    allowlistedAgents: AgentId[];
    allowlistedActions: string[];
    deniedActions?: string[];
  };
  verifications: Array<{
    check: PillpintuCheck;
    outcome: 'pass' | 'conditional' | 'fail';
    evidenceHash: Sha256Hash;
    checkedBy?: ActorRef;
    checkedAt: IsoTimestamp;
  }>;
  dualApproval?: Array<{ actor: ActorRef; approvedAt: IsoTimestamp }>;
  revocation?: { revokedAt: IsoTimestamp; revokedBy: ActorRef; reason: string };
}

/* ── CoordinatedAgentVulnerabilityDisclosure (CAVD) ───────────── */

export type CAVDCategory =
  | 'prompt-injection' | 'indirect-injection' | 'tool-misuse'
  | 'scope-escape' | 'data-exfiltration' | 'policy-bypass'
  | 'covert-channel' | 'snapshot-tampering' | 'supply-chain'
  | 'auth-bypass' | 'other';

export type CAVDStage =
  | 'intake' | 'triaged' | 'embargoed'
  | 'patch-developed' | 'patch-verified' | 'disclosed' | 'withdrawn';

export interface CoordinatedAgentVulnerabilityDisclosure extends KhipuArtifactEnvelope {
  kind: 'CoordinatedAgentVulnerabilityDisclosure';
  advisoryId: string;
  agentScope: AgentId[];
  category: CAVDCategory;
  severity: Severity;
  stage: CAVDStage;
  intake: { reporter: ActorRef; receivedAt: IsoTimestamp; findingHash: Sha256Hash; transparencyLog?: string };
  embargo: { openedAt: IsoTimestamp; expiresAt: IsoTimestamp; policy: '90d-or-patch' | '30d-or-patch' | 'fixed-90d' };
  patch?: { snapshotRef: string; verifiedAt: IsoTimestamp; verifiedBy: ActorRef };
  publication?: { summary: string; permalink?: string; csafRef?: string };
  creditedReporters?: Array<{ actor: ActorRef; creditPaid?: boolean; amount?: string }>;
}

/* ── Discriminated union ──────────────────────────────────────── */

export type KhipuArtifact =
  | Constitution
  | SystemCard
  | RiskReport
  | BehavioralAuditFinding
  | WelfareTelemetrySample
  | AdversarialRobustnessScore
  | SnapshotFingerprint
  | CovenantLiftSample
  | PillpintuPartnerAttestation
  | CoordinatedAgentVulnerabilityDisclosure;

export type KhipuArtifactKind = KhipuArtifact['kind'];
