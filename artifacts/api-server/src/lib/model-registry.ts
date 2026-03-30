import { logger } from "./logger";
import { inferenceTelemetry } from "./inference-telemetry";

const LAST_REVIEWED = "2026-03-30";
const REVIEW_INTERVAL_DAYS = 14;

export type AgentCategory = "domain" | "general" | "lyte-ai";

export interface ModelConfig {
  model: string;
  temperature: number;
  maxCompletionTokens: number;
  topP: number;
  lastReviewed: string;
  category: AgentCategory;
}

export interface ModelCard {
  id: string;
  name: string;
  provider: string;
  model: string;
  version: string;
  purpose: string;
  lifecycle: "active" | "deprecated" | "staging" | "canary";
  category: AgentCategory;
  capabilities: string[];
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  performance: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    totalRequests: number;
    errorRate: number;
    successRate: number;
  };
  lastDeployed: string;
  lastReviewed: string;
}

interface RegistryDefaults {
  model: string;
  temperature: number;
  maxCompletionTokens: number;
  topP: number;
}

const CATEGORY_DEFAULTS: Record<AgentCategory, RegistryDefaults> = {
  domain: {
    model: "gpt-5.2",
    temperature: 0.7,
    maxCompletionTokens: 4096,
    topP: 1,
  },
  general: {
    model: "gpt-5.2",
    temperature: 0.7,
    maxCompletionTokens: 1024,
    topP: 1,
  },
  "lyte-ai": {
    model: "gpt-5.2",
    temperature: 0.4,
    maxCompletionTokens: 500,
    topP: 1,
  },
};

const AGENT_OVERRIDES: Record<string, Partial<RegistryDefaults>> = {
  vessels: { maxCompletionTokens: 8192 },
  firestorm: { maxCompletionTokens: 4096 },
  inca: { maxCompletionTokens: 4096 },
  lyte: { maxCompletionTokens: 4096 },
  dreamscape: { maxCompletionTokens: 4096 },
  "szl-holdings": { maxCompletionTokens: 4096 },
  "carlota-jo": { maxCompletionTokens: 4096 },
  "readiness-report": { maxCompletionTokens: 2048 },
  msp: { maxCompletionTokens: 4096 },
  terra: { maxCompletionTokens: 4096 },
  admin: { maxCompletionTokens: 2048 },
};

const AGENT_CATEGORIES: Record<string, AgentCategory> = {
  vessels: "domain",
  firestorm: "domain",
  inca: "domain",
  lyte: "domain",
  dreamscape: "domain",
  "szl-holdings": "domain",
  "carlota-jo": "domain",
  "readiness-report": "domain",
  msp: "domain",
  terra: "domain",
  admin: "domain",
  stephen: "general",
};

const MODEL_CARDS_META: Record<string, { purpose: string; capabilities: string[] }> = {
  vessels: { purpose: "Maritime intelligence — fleet tracking, sanctions screening, route analysis", capabilities: ["fleet-tracking", "sanctions-risk", "route-economics", "ais-analysis"] },
  firestorm: { purpose: "Cybersecurity threat detection, vulnerability assessment, pen-test analysis", capabilities: ["vulnerability-scoring", "threat-classification", "attack-surface-mapping", "incident-response"] },
  inca: { purpose: "AI research synthesis — experiment tracking, paper analysis, benchmark comparison", capabilities: ["research-synthesis", "experiment-analysis", "model-benchmarking", "trend-detection"] },
  lyte: { purpose: "SRE observability intelligence — health monitoring, SLO analysis, incident diagnosis", capabilities: ["health-monitoring", "slo-compliance", "capacity-planning", "incident-correlation"] },
  dreamscape: { purpose: "Creative AI — campaign generation, content scoring, brand analysis", capabilities: ["content-generation", "campaign-scoring", "brand-monitoring", "creative-optimization"] },
  "szl-holdings": { purpose: "Portfolio intelligence — investment analysis, risk assessment, market monitoring", capabilities: ["portfolio-analysis", "risk-scoring", "market-intelligence", "due-diligence"] },
  "carlota-jo": { purpose: "Consulting intelligence — engagement analysis, strategy recommendation", capabilities: ["engagement-tracking", "strategy-analysis", "client-health", "proposal-generation"] },
  "readiness-report": { purpose: "Operational readiness and maturity assessment", capabilities: ["maturity-scoring", "gap-analysis", "readiness-benchmarking", "improvement-tracking"] },
  msp: { purpose: "Managed services — SLA monitoring, ticket analysis, client health", capabilities: ["sla-monitoring", "ticket-classification", "escalation-prediction", "capacity-planning"] },
  terra: { purpose: "Real estate market intelligence — property scoring, distress detection, investment analysis", capabilities: ["property-scoring", "market-analysis", "distress-detection", "investment-recommendation"] },
  admin: { purpose: "Platform administration decision support and system diagnostics", capabilities: ["system-diagnostics", "configuration-advisory", "capacity-planning", "incident-triage"] },
  stephen: { purpose: "Personal brand and portfolio command agent", capabilities: ["portfolio-presentation", "case-study-generation", "career-narrative"] },
};

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  "gpt-5.2": 128000,
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "claude-sonnet-4-20250514": 200000,
  "claude-sonnet-4-6": 200000,
  "claude-3-haiku-20240307": 200000,
};

const COST_RATES: Record<string, { input: number; output: number }> = {
  "gpt-5.2": { input: 0.005, output: 0.015 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "claude-sonnet-4-6": { input: 0.003, output: 0.015 },
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
};

function resolveEnvOverride(agentId: string, field: string): string | undefined {
  const key = `AGENT_${field.toUpperCase()}_${agentId.replace(/-/g, "_").toUpperCase()}`;
  return process.env[key] || process.env[`AGENT_${field.toUpperCase()}_DEFAULT`];
}

export function getModelConfig(agentId: string): ModelConfig {
  const category = AGENT_CATEGORIES[agentId] || "domain";
  const defaults = CATEGORY_DEFAULTS[category];
  const overrides = AGENT_OVERRIDES[agentId] || {};

  const envModel = resolveEnvOverride(agentId, "model");
  const envTemp = resolveEnvOverride(agentId, "temp");
  const envMaxTokens = resolveEnvOverride(agentId, "max_tokens");

  return {
    model: envModel || overrides.model || defaults.model,
    temperature: envTemp ? parseFloat(envTemp) : (overrides.temperature ?? defaults.temperature),
    maxCompletionTokens: envMaxTokens
      ? parseInt(envMaxTokens, 10)
      : (overrides.maxCompletionTokens ?? defaults.maxCompletionTokens),
    topP: overrides.topP ?? defaults.topP,
    lastReviewed: LAST_REVIEWED,
    category,
  };
}

export function getAllAgentIds(): string[] {
  return Object.keys(AGENT_CATEGORIES);
}

export function getModelCard(agentId: string): ModelCard {
  const config = getModelConfig(agentId);
  const meta = MODEL_CARDS_META[agentId] ?? { purpose: `AI agent for ${agentId}`, capabilities: [] };
  const provider = config.model.includes("gpt") ? "OpenAI" : config.model.includes("claude") ? "Anthropic" : "Replit Proxy";
  const costs = COST_RATES[config.model] ?? { input: 0, output: 0 };

  const records = inferenceTelemetry.getRecords({ agentId, windowMs: 3600000 });
  const successRecords = records.filter(r => r.success);
  const latencies = successRecords.map(r => r.latencyMs).sort((a, b) => a - b);
  const failures = records.filter(r => !r.success).length;

  return {
    id: `model-${agentId}`,
    name: `${agentId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Agent`,
    provider,
    model: config.model,
    version: "2.0.0",
    purpose: meta.purpose,
    lifecycle: "active",
    category: config.category,
    capabilities: meta.capabilities,
    contextWindow: MODEL_CONTEXT_WINDOWS[config.model] ?? 128000,
    maxOutputTokens: config.maxCompletionTokens,
    costPer1kInput: costs.input,
    costPer1kOutput: costs.output,
    performance: {
      avgLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length) : 0,
      p95LatencyMs: latencies.length > 0 ? latencies[Math.ceil(latencies.length * 0.95) - 1]! : 0,
      totalRequests: records.length,
      errorRate: records.length > 0 ? parseFloat((failures / records.length).toFixed(4)) : 0,
      successRate: records.length > 0 ? parseFloat((successRecords.length / records.length).toFixed(4)) : 1,
    },
    lastDeployed: new Date(Date.now() - 3 * 86400000).toISOString(),
    lastReviewed: LAST_REVIEWED,
  };
}

export function getAllModelCards(): ModelCard[] {
  return getAllAgentIds().map(id => getModelCard(id));
}

export function checkFreshness(): { fresh: boolean; lastReviewed: string; daysSinceReview: number; nextReviewDue: string } {
  const reviewed = new Date(LAST_REVIEWED);
  const now = new Date();
  const daysSinceReview = Math.floor((now.getTime() - reviewed.getTime()) / (86400000));
  const nextReview = new Date(reviewed.getTime() + REVIEW_INTERVAL_DAYS * 86400000);

  return {
    fresh: daysSinceReview <= REVIEW_INTERVAL_DAYS,
    lastReviewed: LAST_REVIEWED,
    daysSinceReview,
    nextReviewDue: nextReview.toISOString().split("T")[0]!,
  };
}

export function getRegistrySummary(): {
  agents: Array<{ id: string; model: string; category: AgentCategory; maxTokens: number }>;
  freshness: ReturnType<typeof checkFreshness>;
  modelCards: ModelCard[];
} {
  const agents = getAllAgentIds().map((id) => {
    const config = getModelConfig(id);
    return { id, model: config.model, category: config.category, maxTokens: config.maxCompletionTokens };
  });

  return { agents, freshness: checkFreshness(), modelCards: getAllModelCards() };
}

logger.info({ lastReviewed: LAST_REVIEWED }, "Model registry initialized");
