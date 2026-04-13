import { getApiBase } from "./utils";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const resp = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => resp.statusText);
    throw new Error(err || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export interface AgentDef {
  id: string;
  name: string;
  domain: string;
  preferredModel: string;
  preferredProvider: string;
  highStakesDomains: string[];
  tools: string[];
}

export interface RouteConfig {
  routes: Record<string, { model: string; provider: string; maxTokens: number; temperature: number }>;
  highRiskLanes: string[];
  requireApprovalForHighRisk: boolean;
  executionMode: string;
}

export interface HFModel {
  id: string;
  author: string;
  task: string;
  downloads: number;
  likes: number;
  lastModified: string;
  tags: string[];
  license: string | null;
  modelSize: number | null;
  source: string;
}

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  published: string;
  pdfUrl: string;
  source: string;
}

export interface AgentUsageStat {
  agentId: string;
  agentName: string;
  domain: string;
  tokensUsed: number;
  latencyMs: number;
  success: boolean;
  model: string;
  provider: string;
}

export const api = {
  getAgentRegistry: () => apiFetch<{ data: AgentDef[] }>("/inca-lab/agents"),
  getAgentUsage: () => apiFetch<{ data: AgentUsageStat[] }>("/inca-lab/agents/usage"),
  updateAgentModel: (agentId: string, model: string, provider: string) =>
    apiFetch<{ data: { agentId: string; model: string; provider: string; updated: string } }>("/inca-lab/agents/assign", {
      method: "POST",
      body: JSON.stringify({ agentId, model, provider }),
    }),

  getRouterConfig: () => apiFetch<{ data: RouteConfig }>("/inca-lab/router/config"),
  updateRouterConfig: (patch: Partial<RouteConfig>) =>
    apiFetch<{ data: RouteConfig }>("/inca-lab/router/config", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  getRoutingEvents: () => apiFetch<{ data: RoutingEvent[] }>("/inca-lab/router/events"),

  getHFModels: (task = "text-generation", limit = 10) =>
    apiFetch<{ data: { models: HFModel[] } }>(`/inca/live/huggingface-models?task=${task}&limit=${limit}`),

  getArxivPapers: (q = "large language model", limit = 8) =>
    apiFetch<{ data: { papers: ArxivPaper[] } }>(`/inca/live/arxiv?q=${encodeURIComponent(q)}&limit=${limit}`),

  getDashboard: () => apiFetch<{ data: IncaDashboard }>("/inca/dashboard"),

  getModelBenchmarks: () => apiFetch<{ data: BenchmarkEntry[] }>("/inca-lab/benchmarks"),

  getDeploymentTargets: () => apiFetch<{ data: DeploymentTarget[] }>("/inca-lab/deployment/targets"),
  createDeploymentTarget: (target: Omit<DeploymentTarget, "id">) =>
    apiFetch<{ data: DeploymentTarget }>("/inca-lab/deployment/targets", {
      method: "POST",
      body: JSON.stringify(target),
    }),
  updateDeploymentTarget: (id: string, patch: Partial<DeploymentTarget>) =>
    apiFetch<{ data: DeploymentTarget }>(`/inca-lab/deployment/targets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteDeploymentTarget: (id: string) =>
    apiFetch<{ data: { deleted: boolean; id: string } }>(`/inca-lab/deployment/targets/${id}`, {
      method: "DELETE",
    }),

  getTokenUsage: () => apiFetch<{ data: TokenUsage[] }>("/inca-lab/observatory/tokens"),
  getCostTrends: () => apiFetch<{ data: CostTrend[] }>("/inca-lab/observatory/costs"),
  getGovernanceAudit: () => apiFetch<{ data: GovernanceAudit[] }>("/inca-lab/observatory/governance"),

  runModelComparison: (prompt: string, models: string[]) =>
    apiFetch<{ data: ComparisonResult[] }>("/inca-lab/lab/compare", {
      method: "POST",
      body: JSON.stringify({ prompt, models }),
    }),

  getSkills: () =>
    apiFetch<{ data: SkillEntry[] }>("/api/skills").then((r) => r.data ?? []),

  testSkill: (skillId: string, input: Record<string, unknown>, userId = "playground-user") =>
    apiFetch<{ status: string; output?: unknown; error?: string; latencyMs?: number; requiresApproval?: boolean; approvalToken?: string }>(
      `/api/skills/${skillId}/test`,
      { method: "POST", body: JSON.stringify({ input, userId }) },
    ),

  getMcpHealth: () =>
    apiFetch<{
      gateway: string;
      modules: Array<{
        moduleId: string;
        name: string;
        domain: string;
        healthy: boolean;
        tools: number;
        details?: string;
        callsPerMinute: number;
        errorsPerMinute: number;
        circuitState: "closed" | "half-open" | "open";
        lastStateChange: number;
        lastError?: string;
      }>;
    }>("/api/skills/mcp/health"),

  getSkillsStats: () =>
    apiFetch<{
      data: {
        total: number;
        active: number;
        byCategory: Record<string, number>;
        topByUsage: Array<{ skillId: string; label: string; invocations: number }>;
      };
    }>("/api/skills/stats"),

  // ── Model Catalog & AIBOM ────────────────────────────────────────────────
  getModelCatalog: () =>
    apiFetch<{ data: CatalogModel[]; meta: { total: number; approved: number } }>("/inca-lab/models/catalog"),
  getModelById: (id: string) =>
    apiFetch<{ data: CatalogModel }>(`/inca-lab/models/catalog/${id}`),
  approveModel: (id: string, actor?: string, overrideReason?: string) =>
    apiFetch<{ data: CatalogModel; evaluation: { allowed: boolean; flaggedBy: { id: string; name: string }[]; requiresApproval: boolean }; audit: ModelAuditRecord }>(
      `/inca-lab/models/${id}/approve`,
      { method: "POST", body: JSON.stringify({ actor: actor ?? "ops-lead@szl.internal", overrideReason }) }
    ),

  // ── Security Scanning ─────────────────────────────────────────────────────
  getSecurityScans: () =>
    apiFetch<{ data: { scans: SecurityScan[]; vulnerabilities: ModelVulnerability[]; summary: { avgFleetScore: number; activeVulnerabilities: number; failedScans: number; policyBlocked: number } } }>("/inca-lab/models/security-scans"),
  triggerScan: (modelId: string) =>
    apiFetch<{ data: SecurityScan }>(`/inca-lab/models/${modelId}/scan`, { method: "POST" }),
  updateVulnerabilityStatus: (vulnId: string, status: ModelVulnerability["status"]) =>
    apiFetch<{ data: ModelVulnerability }>(`/inca-lab/models/vulnerabilities/${vulnId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // ── Governance Policies & Audit ───────────────────────────────────────────
  getGovernancePolicies: () =>
    apiFetch<{ data: GovernancePolicy[] }>("/inca-lab/governance/policies"),
  updateGovernancePolicy: (id: string, patch: Partial<GovernancePolicy>) =>
    apiFetch<{ data: GovernancePolicy }>(`/inca-lab/governance/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  getModelAuditLog: () =>
    apiFetch<{ data: ModelAuditRecord[] }>("/inca-lab/governance/audit"),
  createAuditEntry: (entry: Omit<ModelAuditRecord, "id" | "timestamp">) =>
    apiFetch<{ data: ModelAuditRecord }>("/inca-lab/governance/audit", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  getComplianceStatus: () =>
    apiFetch<{ data: ComplianceStatus[] }>("/inca-lab/governance/compliance"),
  getGatewayStatus: () =>
    apiFetch<{ data: GatewayStatus[] }>("/inca-lab/governance/gateway-status"),

  // ── Environment Snapshots ─────────────────────────────────────────────────
  getSnapshots: () =>
    apiFetch<{ data: EnvironmentSnapshot[]; meta: { total: number; production: number } }>("/inca-lab/environments/snapshots"),
  getSnapshotById: (id: string) =>
    apiFetch<{ data: EnvironmentSnapshot }>(`/inca-lab/environments/snapshots/${id}`),
  cloneSnapshot: (id: string, actor?: string) =>
    apiFetch<{ data: EnvironmentSnapshot }>(`/inca-lab/environments/snapshots/${id}/clone`, {
      method: "POST",
      body: JSON.stringify({ actor: actor ?? "user@szl.internal" }),
    }),
  promoteSnapshot: (id: string, target: "staging" | "production") =>
    apiFetch<{ data: EnvironmentSnapshot }>(`/inca-lab/environments/snapshots/${id}/promote`, {
      method: "POST",
      body: JSON.stringify({ target }),
    }),
  deleteSnapshot: (id: string) =>
    apiFetch<{ data: EnvironmentSnapshot }>(`/inca-lab/environments/snapshots/${id}`, { method: "DELETE" }),

  // ── Model Lifecycle ───────────────────────────────────────────────────────
  getModelLifecycle: () =>
    apiFetch<{ data: { pipeline: LifecycleRecord[]; costIntelligence: CostIntelligence[]; summary: { inProduction: number; blocked: number; rotationCandidates: number; totalMonthlyCost: number; potentialSavings: number } } }>("/inca-lab/models/lifecycle"),
  advanceLifecycle: (modelId: string, patch: Partial<LifecycleRecord>) =>
    apiFetch<{ data: LifecycleRecord }>(`/inca-lab/models/${modelId}/lifecycle`, {
      method: "POST",
      body: JSON.stringify(patch),
    }),
  initiateRotation: (modelId: string, candidateModelId: string) =>
    apiFetch<{ data: LifecycleRecord; rotationInitiated: boolean; candidateModel: string }>(`/inca-lab/models/lifecycle/${modelId}/rotate`, {
      method: "PATCH",
      body: JSON.stringify({ candidateModelId }),
    }),
};

export interface RoutingEvent {
  id: string;
  timestamp: string;
  routeClass: string;
  model: string;
  provider: string;
  latencyMs: number;
  costEstimateUsd: number;
  usedFallback: boolean;
  totalTokens: number;
}

export interface IncaDashboard {
  activeProjects: number;
  runningExperiments: number;
  deployedModels: number;
  totalInsights: number;
  avgAccuracy: number;
  healthScore: number;
}

export interface BenchmarkEntry {
  model: string;
  provider: string;
  mmlu: number;
  hellaswag: number;
  humaneval: number;
  cost1kTokens: number;
  latencyP50: number;
}

export interface DeploymentTarget {
  id: string;
  modelId: string;
  quantization: "4bit" | "8bit" | "fp16" | "fp32";
  vramRequired: number;
  apiCostMonthly: number;
  selfHostedCostMonthly: number;
  readinessScore: number;
  status: "ready" | "staging" | "not_ready";
}

export interface TokenUsage {
  date: string;
  provider: string;
  tokens: number;
  cost: number;
}

export interface CostTrend {
  date: string;
  openai: number;
  anthropic: number;
  gemini: number;
  huggingface: number;
}

export interface ComparisonResult {
  model: string;
  provider: string;
  output: string;
  latencyMs: number;
  tokens: number;
  cost: number;
}

export interface GovernanceAudit {
  timestamp: string;
  agent: string;
  model: string;
  action: string;
  sensitiveData: boolean;
  flag: string | null;
  status: "approved" | "requires_approval" | "blocked";
}

export interface SkillEntry {
  skill_id: string;
  label: string;
  description: string;
  category: string;
  domains: string[];
  status: string;
  required_autonomy_level: string;
  invocations: number;
  successful_invocations: number;
  avg_latency_ms: number;
  tags: string[];
}

export interface ChampionCard {
  id: string;
  name: string;
  provider: string;
  providerLabel: string;
  model: string;
  categoryRankings: Record<string, number>;
  categoryChampion: string[];
  benchmarks: { name: string; score: number; unit: string; asOf: string }[];
  costPerRun: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  latencyP50Ms: number;
  contextWindow: number;
  strengths: string[];
  bestFor: string[];
  livePerformance: { avgLatencyMs: number; errorRate: number; qualityScore: number; requestCount: number };
  championBadge: boolean;
  rank: number;
  tier: "S" | "A" | "B" | "C";
}

export interface CategoryChampions {
  category: string;
  label: string;
  description: string;
  champion: ChampionCard;
  contenders: ChampionCard[];
}

export interface EvolutionInsight {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  affectedModel: string;
  category: string;
  metric?: number;
  timestamp: number;
}

export interface CostQualityPoint {
  modelId: string;
  modelName: string;
  category: string;
  qualityScore: number;
  costPerRun: number;
  latencyMs: number;
  tier: "budget" | "balanced" | "premium";
  recommended: boolean;
}

export interface ChampionRegistryData {
  champions: ChampionCard[];
  summary: {
    totalChampions: number;
    categoryChampions: Record<string, string>;
    sTierCount: number;
    aTierCount: number;
    avgCostPerRun: number;
  };
}

export interface EvolutionData {
  insights: EvolutionInsight[];
  reviewStatus: {
    lastReview: string;
    nextReview: string;
    daysSinceReview: number;
    reviewDue: boolean;
    reviewsCompleted: number;
  };
  costQualityMap: CostQualityPoint[];
}

export const championApi = {
  getRegistry: (): Promise<{ data: ChampionRegistryData }> =>
    apiFetch("/champion/registry"),

  getCategories: (): Promise<{ data: CategoryChampions[] }> =>
    apiFetch("/champion/categories"),

  getEvolutionData: (): Promise<{ data: EvolutionData }> =>
    apiFetch("/champion/evolution/insights"),

  getCostQuality: (): Promise<{ data: CostQualityPoint[] }> =>
    apiFetch("/champion/evolution/cost-quality"),
};

export interface GatewayPerfStats {
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    hitRatePct: number;
    totalEntries: number;
    estimatedSavingsUsd: number;
    savedTokens: number;
  };
  queue: {
    enqueued: number;
    processed: number;
    shed: number;
    queueDepth: number;
    activeConcurrent: number;
    queueByPriority: Record<string, number>;
    byPriority: Record<string, number>;
  };
  domainTtls: Record<string, number>;
}

export interface CacheEntry {
  id: string;
  domain: string;
  promptHash: string;
  promptText: string;
  response: string;
  model: string;
  provider: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd: number;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  domain: string;
  taskType: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: Array<{ name: string; type: string; description?: string; required?: boolean }>;
  version: number;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface PromptABTest {
  testId: string;
  name: string;
  templateId: string;
  versionA: number;
  versionB: number;
  weightA: number;
  weightB: number;
  domain: string;
  taskType: string;
  metric: string;
  status: string;
  startedAt: string;
  results?: {
    requestsA: number;
    requestsB: number;
    avgQualityA: number;
    avgQualityB: number;
    winner?: string;
    confidence: number;
  };
}

export interface VersionPerformance {
  version: number;
  requestCount: number;
  avgQualityScore: number;
  avgLatencyMs: number;
  successRate: number;
}

export const gatewayPerfApi = {
  getStats: () => apiFetch<GatewayPerfStats>("/gateway-perf/stats"),
  getCacheEntries: (domain?: string) =>
    apiFetch<{ entries: CacheEntry[]; count: number }>(`/gateway-perf/cache/entries${domain ? `?domain=${domain}` : ""}`),
  invalidateDomain: (domain: string) =>
    apiFetch<{ success: boolean; invalidatedCount: number }>(`/gateway-perf/cache/domain/${domain}`, { method: "DELETE" }),
  getQueueStats: () => apiFetch<Record<string, unknown>>("/gateway-perf/queue/stats"),
};

export const promptPipelineApi = {
  listTemplates: (domain?: string, taskType?: string) =>
    apiFetch<{ templates: PromptTemplate[]; count: number }>(
      `/prompt-pipeline/templates${domain ? `?domain=${domain}` : ""}${taskType ? `&taskType=${taskType}` : ""}`
    ),
  getTemplate: (id: string) => apiFetch<{ template: PromptTemplate }>(`/prompt-pipeline/templates/${id}`),
  createTemplate: (body: Partial<PromptTemplate> & { name: string; systemPrompt: string }) =>
    apiFetch<{ template: PromptTemplate }>("/prompt-pipeline/templates", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTemplate: (id: string, patch: Partial<PromptTemplate> & { changeNote?: string }) =>
    apiFetch<{ template: PromptTemplate }>(`/prompt-pipeline/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  getVersions: (id: string) =>
    apiFetch<{ versions: Array<{ version: number; createdAt: string; changeNote?: string; avgQualityScore: number; requestCount: number }> }>(
      `/prompt-pipeline/templates/${id}/versions`
    ),
  rollback: (id: string, version: number) =>
    apiFetch<{ template: PromptTemplate }>(`/prompt-pipeline/templates/${id}/rollback`, {
      method: "POST",
      body: JSON.stringify({ version }),
    }),
  getPerformance: (id: string) =>
    apiFetch<{ performance: VersionPerformance[] }>(`/prompt-pipeline/templates/${id}/performance`),
  listABTests: (templateId?: string) =>
    apiFetch<{ tests: PromptABTest[]; count: number }>(
      `/prompt-pipeline/ab-tests${templateId ? `?templateId=${templateId}` : ""}`
    ),
  createABTest: (body: { name: string; templateId: string; versionA: number; versionB: number; metric?: string }) =>
    apiFetch<{ test: PromptABTest }>("/prompt-pipeline/ab-tests", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getABTestResults: (testId: string) =>
    apiFetch<{ testId: string; results: PromptABTest["results"] }>(`/prompt-pipeline/ab-tests/${testId}/results`),
};

// ── INCA Model Governance types ─────────────────────────────────────────────

export interface CatalogModel {
  id: string;
  name: string;
  provider: string;
  task: string;
  license: string;
  licenseType: "commercial" | "research-only" | "restricted";
  securityScore: number;
  vulnerabilities: number;
  mmlu: number | null;
  humaneval: number | null;
  gsm8k: number | null;
  hellaswag: number | null;
  costPer1kTokens: number;
  contextWindow: number;
  parameters: string;
  trainingCutoff: string;
  dataOrigin: string;
  provenance: string;
  compliance: { gdpr: boolean; hipaa: boolean; sox: boolean; fedramp: boolean };
  approvalStatus: "approved" | "pending" | "blocked" | "under-review";
  inProduction: boolean;
  aibomHash: string;
  lastScanned: string;
  featured?: boolean;
}

export interface SecurityScan {
  id: string;
  modelId: string;
  model: string;
  provider: string;
  scanDate: string;
  overallScore: number;
  promptInjectionScore: number;
  toxicityScore: number;
  dataLeakageScore: number;
  adversarialRobustnessScore: number;
  biasScore: number;
  status: "passed" | "failed" | "warning";
  vulnerabilitiesFound: number;
  scanDurationMs: number;
}

export interface ModelVulnerability {
  id: string;
  modelId: string;
  model: string;
  provider: string;
  cveId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "prompt-injection" | "data-leakage" | "toxicity" | "adversarial" | "bias";
  status: "active" | "cleared" | "mitigated" | "disputed";
  cvssScore: number;
  description: string;
  remediation: string;
  discoveredDate: string;
  updatedDate: string;
}

export interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  ruleType: "license" | "benchmark" | "cost" | "security" | "residency";
  condition: string;
  action: "block" | "flag" | "require-approval" | "restrict";
  triggeredCount: number;
  lastTriggered: string | null;
}

export interface ModelAuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  modelId: string;
  model: string;
  decision: "approved" | "blocked" | "flagged";
  policyTriggered: string | null;
  benchmarksPassed: string[];
  notes: string;
}

export interface ComplianceStatus {
  modelId: string;
  model: string;
  provider: string;
  overallCompliant: boolean;
  securityPolicyMet: boolean;
  licensePolicyMet: boolean;
  benchmarkPolicyMet: boolean;
  costPolicyMet: boolean;
  noActiveHighVulnerabilities: boolean;
  lastReviewed: string;
  drift: boolean;
}

export interface EnvironmentSnapshot {
  id: string;
  name: string;
  description: string;
  version: string;
  createdAt: string;
  createdBy: string;
  domain: string;
  tag: string;
  modelId: string;
  model: string;
  provider: string;
  systemPromptHash: string;
  toolsHash: string;
  memoryConfig: string;
  hyperparameters: Record<string, string | number>;
  pinned: boolean;
  deployedTo: string | null;
  parentSnapshotId: string | null;
  diffFromParent?: { added: number; removed: number; changed: number };
}

export interface LifecycleRecord {
  id: string;
  modelId: string;
  name: string;
  provider: string;
  stage: string;
  stageStatus: "in-progress" | "passed" | "failed" | "pending" | "blocked";
  enteredStageAt: string;
  daysInStage: number;
  securityScore?: number;
  benchmarkScore?: number;
  costPer1kTokens?: number;
  agentCount?: number;
  qualityScore?: number;
  nextAction: string;
  rotation?: { reason: string; candidateModel: string; savingsEstimate: string };
}

export interface CostIntelligence {
  model: string;
  agent: string;
  domain: string;
  monthlyCost: number;
  alternativeModel: string;
  alternativeCost: number;
  qualityDelta: number;
  savings: number;
}

export interface GatewayStatus {
  modelId: string;
  name: string;
  provider: string;
  approvalStatus: string;
  securityScore: number;
  inProduction: boolean;
  routingAllowed: boolean;
  reason: string | null;
}


