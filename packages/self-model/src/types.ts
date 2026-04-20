export type RiskTier =
  | 'advisory-only'
  | 'internal-workflow'
  | 'autonomous-reversible'
  | 'autonomous-irreversible'
  | 'regulated-workflow'
  | 'executive-facing'
  | 'human-approval-mandatory'
  | 'classified';

export type CapabilityStatus = 'active' | 'degraded' | 'unavailable' | 'unknown';

export interface Capability {
  name: string;
  description?: string;
  status: CapabilityStatus;
  version?: string;
  lastUsedAt?: string;
  successRate?: number;
  avgLatencyMs?: number;
}

export interface ToolAccess {
  toolId: string;
  name: string;
  permitted: boolean;
  riskTier: RiskTier;
  lastInvokedAt?: string;
  invocationCount?: number;
  errorCount?: number;
}

export interface ActiveObjective {
  objectiveId: string;
  title: string;
  description?: string;
  priority: number;
  progress?: number;
  startedAt?: string;
  dueAt?: string;
  status: 'pending' | 'in-progress' | 'blocked' | 'completed' | 'abandoned';
}

export interface PerformanceRecord {
  runId: string;
  agentId: string;
  domain?: string;
  outcome: 'success' | 'partial' | 'failure';
  summary?: string;
  durationMs?: number;
  confidenceBefore?: number;
  confidenceAfter?: number;
  drift?: number;
  errorCode?: string;
  occurredAt: string;
}

export interface LearnedStrategy {
  strategyId: string;
  description: string;
  applicableContexts: string[];
  reinforcedCount: number;
  successRate?: number;
  learnedAt: string;
}

export interface ConfidenceProfile {
  overall: number;
  byDomain: Record<string, number>;
  byCapability: Record<string, number>;
  trend: 'rising' | 'stable' | 'declining';
  lastAdjustedAt: string;
}

export interface UncertaintyProfile {
  overall: number;
  byDomain: Record<string, number>;
  flaggedAreas: string[];
  lastReviewedAt: string;
}

export interface RoutingPattern {
  patternId: string;
  description: string;
  preferredFor: string[];
  avoidFor: string[];
  successRate?: number;
}

export interface EscalationThreshold {
  metric: string;
  threshold: number;
  action: 'request-help' | 'pause' | 'abort' | 'notify';
  notifyRecipients?: string[];
}

export interface HumanDependency {
  role: string;
  userId?: string;
  reason: string;
  escalationLevel: 'advisory' | 'approval-required' | 'blocking';
}

export interface DomainProfile {
  domain: string;
  strength: 'strong' | 'adequate' | 'weak' | 'unknown';
  confidence: number;
  knowledgeCount?: number;
  lastActiveAt?: string;
}

export interface IdentityProfile {
  runtimeId: string;
  name: string;
  version: string;
  description?: string;
  owner?: string;
  environment: 'development' | 'staging' | 'production' | 'sandbox';
  launchedAt: string;
  primaryDomain?: string;
  tags?: string[];
}

export interface PolicyInForce {
  policyId: string;
  name: string;
  domain?: string;
  effect: string;
  priority: number;
  appliedAt: string;
}

export interface SelfModelState {
  runtimeId: string;
  identityProfile: IdentityProfile;
  activeObjectives: ActiveObjective[];
  capabilities: Capability[];
  toolAccess: ToolAccess[];
  riskTier: RiskTier;
  policiesInForce: PolicyInForce[];
  currentEnvironment: string;
  recentFailures: PerformanceRecord[];
  recentWins: PerformanceRecord[];
  learnedStrategies: LearnedStrategy[];
  confidenceProfile: ConfidenceProfile;
  uncertaintyProfile: UncertaintyProfile;
  preferredRoutingPatterns: RoutingPattern[];
  escalationThresholds: EscalationThreshold[];
  humanDependencies: HumanDependency[];
  domainStrengths: DomainProfile[];
  domainWeaknesses: DomainProfile[];
  driftScore: number;
  failurePatternCount: number;
  consecutiveFailures: number;
  version: number;
  updatedAt: string;
}

export interface RunOutcome {
  runId: string;
  agentId: string;
  domain?: string;
  status: 'success' | 'partial' | 'failure';
  summary?: string;
  durationMs?: number;
  errorCode?: string;
  confidenceDelta?: number;
}

export interface HelpRequest {
  runtimeId: string;
  reason: string;
  metric: string;
  currentValue: number;
  threshold: number;
  action: EscalationThreshold['action'];
  notifyRecipients: string[];
  requestedAt: string;
}

export interface UpdateAfterRunResult {
  updated: boolean;
  newVersion: number;
  confidenceAfter: number;
  driftScore: number;
  consecutiveFailures: number;
  helpRequested: HelpRequest | null;
  snapshotCreated: boolean;
}
