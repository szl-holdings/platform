export type Page =
  | 'home'
  | 'research'
  | 'memory'
  | 'skills'
  | 'patterns'
  | 'bridge'
  | 'orchestrator'
  | 'ingest'
  | 'design-system'
  | 'tokens-governance'
  | 'ai-quality'
  | 'prompt-registry'
  | 'eval-console'
  | 'audit'
  | 'marketplace'
  | 'eval-layer'
  | 'kernel';

export interface PraxisStatus {
  activeSwarms: number;
  memoryItems: number;
  enabledSkills: number;
  registeredTools: number;
  orchestrationsToday: number;
}

export type AgentLaneStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentLane {
  id: string;
  name: string;
  role: string;
  status: AgentLaneStatus;
  log: string[];
  sources?: string[];
  citationsVerified?: number;
  citationsKilled?: number;
  output?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  confidence?: number;
}

export interface ResearchRun {
  id: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lanes: AgentLane[];
  finalBrief?: string;
  citations?: Citation[];
  createdAt: string;
  completedAt?: string;
}

export interface Citation {
  url: string;
  title: string;
  status: 'verified' | 'killed' | 'pending';
  reason?: string;
}

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  type: 'fact' | 'preference' | 'entity' | 'claim' | 'context';
  tier: 'working' | 'session' | 'episodic' | 'semantic';
  pinned: boolean;
  confidence: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  sourceRepo: string;
  sourceUrl: string;
  license: string;
  pattern: string;
  primitiveType: 'Skill' | 'Hook' | 'Command' | 'Agent' | 'MemorySchema' | 'RAGStrategy' | 'Tool';
  enabled: boolean;
  usageCount: number;
  praxisAdaptation: string;
  originalSummary: string;
  tags: string[];
  isCustom: boolean;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface PatternFamily {
  id: string;
  name: string;
  description: string;
  icon: string;
  repos: string[];
  praxisCapability: string;
  skills: number;
}

export interface ProtocolTool {
  id: string;
  name: string;
  description: string;
  protocol: 'MCP' | 'A2A' | 'ACP' | 'ANP';
  inputSchema: Record<string, unknown>;
  domain: string;
  tags: string[];
  isCustom: boolean;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface CustomizationsResetResult {
  ok: boolean;
  removedSkills: number;
  resetSkills: number;
  removedTools: number;
  resetTools: number;
}

export interface ToolCallResult {
  toolId: string;
  protocol: string;
  status: 'success' | 'error';
  output: unknown;
  durationMs: number;
  traceId: string;
}

export interface OrchestrationPlan {
  id: string;
  intent: string;
  status: 'planning' | 'running' | 'completed' | 'failed';
  steps: OrchestrationStep[];
  stitchedOutput?: string;
  planGraph?: PlanNode[];
  createdAt: string;
  completedAt?: string;
}

export interface OrchestrationStep {
  id: string;
  app: string;
  appSlug: string;
  action: string;
  endpoint: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output?: string;
  durationMs?: number;
  rawPayload?: string;
  httpStatus?: number;
  confidence?: number;
}

export interface PlanNode {
  id: string;
  label: string;
  type: 'start' | 'app' | 'stitch' | 'end';
  dependsOn: string[];
}

export interface AuditEntry {
  id: string;
  runId: string;
  agentSlug: string;
  agentName: string;
  intent: string;
  action: string;
  endpoint: string;
  status: 'success' | 'error' | 'skipped';
  durationMs: number;
  reasoning: string;
  alternativesConsidered: string[];
  outputSummary: string;
  rateLimit: AgentRateLimit;
  startedAt: string;
  completedAt: string;
}

export interface AgentRateLimit {
  agentSlug: string;
  requestsPerMinute: number;
  requestsUsedThisMinute: number;
  tokensPerMinute: number;
  tokensUsedThisMinute: number;
  cooldownUntil?: string;
}

export interface IngestJob {
  id: string;
  repoUrl: string;
  repoName: string;
  status: 'queued' | 'fetching' | 'adapting' | 'publishing' | 'done' | 'failed';
  skillsGenerated: number;
  patternsFound: string[];
  log: string[];
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface OrchestrationRecipe {
  id: string;
  name: string;
  slug: string;
  description: string;
  requiredCapabilities: string[];
  defaultTicker?: string;
  stepSequence: Array<{
    capability: string;
    label: string;
    action: string;
  }>;
}

export type ThirdPartyIntegrationMode = 'in-process' | 'external-service' | 'pattern-reference';
export type ThirdPartyPolicyState = 'allowed' | 'requires-review' | 'blocked';

export interface ThirdPartyLeader {
  id: string;
  name: string;
  sourceRepo: string;
  sourceUrl: string;
  licenseSpdx: string;
  capabilitySummary: string;
  capabilityTags: string[];
  integrationMode: ThirdPartyIntegrationMode;
  policyState: ThirdPartyPolicyState;
  policyNote?: string;
  lastFetchedCommit?: string;
  lastFetchedAt?: string;
  enabled: boolean;
  logicalCapability?: string;
}
