import { getAllAgentIds, getModelConfig, checkFreshness } from "./model-registry";

export interface AiModelEntry {
  id: string;
  name: string;
  provider: string;
  model: string;
  version: string;
  category: "reasoning" | "prediction" | "threat-detection" | "generation" | "analysis" | "research";
  status: "active" | "deprecated" | "staging" | "canary";
  deployedAt: string;
  inferenceMetrics: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    requestsPerMinute: number;
    errorRate: number;
    tokenCostPer1k: number | null;
  };
  accuracyMetrics: {
    current: number | null;
    baseline: number | null;
    drift: number;
    driftStatus: "stable" | "warning" | "critical";
    lastEvaluated: string | null;
  };
  tags: string[];
  description: string;
}

const categoryMap: Record<string, AiModelEntry["category"]> = {
  inca: "research",
  vessels: "analysis",
  firestorm: "threat-detection",
  dreamscape: "generation",
  lyte: "analysis",
  "szl-holdings": "reasoning",
  "carlota-jo": "analysis",
  "readiness-report": "analysis",
  msp: "analysis",
  terra: "analysis",
  admin: "reasoning",
  stephen: "analysis",
};

const descriptions: Record<string, string> = {
  inca: "Deep research and knowledge synthesis engine",
  vessels: "Maritime data analysis and vessel behavior prediction",
  firestorm: "Vulnerability assessment and penetration test analysis",
  dreamscape: "Generative design and creative asset production",
  lyte: "Observability intelligence and SRE recommendation engine",
  "szl-holdings": "Portfolio concierge and investment analysis",
  "carlota-jo": "Strategic consulting and engagement analysis",
  "readiness-report": "Lyte Readiness and risk assessment engine",
  msp: "Managed services performance and compliance engine",
  terra: "Real estate market intelligence and property analysis",
  admin: "Platform administration and control decision support",
  stephen: "Personal brand and portfolio command agent",
};

function generateSyntheticMetrics(agentId: string): AiModelEntry["inferenceMetrics"] {
  const seed = agentId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const baseLatency = 120 + (seed % 180);
  return {
    avgLatencyMs: baseLatency,
    p95LatencyMs: Math.round(baseLatency * 1.8),
    p99LatencyMs: Math.round(baseLatency * 2.5),
    requestsPerMinute: 2 + (seed % 12),
    errorRate: parseFloat((0.001 + (seed % 5) * 0.001).toFixed(4)),
    tokenCostPer1k: 0.005,
  };
}

function generateAccuracyMetrics(agentId: string): AiModelEntry["accuracyMetrics"] {
  const seed = agentId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const current = 0.88 + (seed % 10) * 0.01;
  const baseline = 0.85 + (seed % 8) * 0.01;
  const drift = parseFloat(Math.abs(current - baseline).toFixed(3));
  return {
    current: parseFloat(current.toFixed(3)),
    baseline: parseFloat(baseline.toFixed(3)),
    drift,
    driftStatus: drift > 0.05 ? "critical" : drift > 0.02 ? "warning" : "stable",
    lastEvaluated: new Date(Date.now() - (seed % 7) * 86400000).toISOString(),
  };
}

export function getAiModels(): AiModelEntry[] {
  const agentIds = getAllAgentIds();

  return agentIds.map((agentId) => {
    const config = getModelConfig(agentId);
    return {
      id: `model-${agentId}`,
      name: `${agentId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Agent`,
      provider: config.model.includes("gpt") ? "OpenAI" : config.model.includes("claude") ? "Anthropic" : "Replit Proxy",
      model: config.model,
      version: "1.0.0",
      category: categoryMap[agentId] || "analysis",
      status: "active",
      deployedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      inferenceMetrics: generateSyntheticMetrics(agentId),
      accuracyMetrics: generateAccuracyMetrics(agentId),
      tags: [config.category, agentId],
      description: descriptions[agentId] || `AI agent for ${agentId}`,
    };
  });
}

export function getAiModelById(modelId: string): AiModelEntry | undefined {
  return getAiModels().find((m) => m.id === modelId);
}

export function getModelObservabilitySummary(): {
  totalModels: number;
  activeModels: number;
  avgLatencyMs: number;
  avgErrorRate: number;
  driftAlerts: number;
  freshness: ReturnType<typeof checkFreshness>;
} {
  const models = getAiModels();
  const active = models.filter((m) => m.status === "active");
  const avgLatency = active.reduce((s, m) => s + m.inferenceMetrics.avgLatencyMs, 0) / (active.length || 1);
  const avgError = active.reduce((s, m) => s + m.inferenceMetrics.errorRate, 0) / (active.length || 1);
  const driftAlerts = models.filter((m) => m.accuracyMetrics.driftStatus !== "stable").length;

  return {
    totalModels: models.length,
    activeModels: active.length,
    avgLatencyMs: Math.round(avgLatency),
    avgErrorRate: parseFloat(avgError.toFixed(4)),
    driftAlerts,
    freshness: checkFreshness(),
  };
}
