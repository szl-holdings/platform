import { logger } from "./logger";

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
} {
  const agents = getAllAgentIds().map((id) => {
    const config = getModelConfig(id);
    return { id, model: config.model, category: config.category, maxTokens: config.maxCompletionTokens };
  });

  return { agents, freshness: checkFreshness() };
}

logger.info({ lastReviewed: LAST_REVIEWED }, "Model registry initialized");
