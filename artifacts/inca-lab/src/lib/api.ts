import { getApiBase } from "./utils";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
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
