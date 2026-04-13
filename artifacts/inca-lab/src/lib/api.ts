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
