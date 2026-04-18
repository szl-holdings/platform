import { getAllAgentIds, getModelConfig, checkFreshness, getModelCard, type ModelCard } from "./model-registry";
import { inferenceTelemetry } from "./inference-telemetry";
import { providerCircuitBreaker, type CircuitBreakerStatus } from "./ai-gateway";

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

function buildMetricsFromTelemetry(agentId: string): AiModelEntry["inferenceMetrics"] {
  const records = inferenceTelemetry.getRecords({ agentId, windowMs: 3600000 });
  const successes = records.filter(r => r.success);
  const latencies = successes.map(r => r.latencyMs).sort((a, b) => a - b);
  const failures = records.filter(r => !r.success).length;

  if (records.length === 0) {
    return { avgLatencyMs: 0, p95LatencyMs: 0, p99LatencyMs: 0, requestsPerMinute: 0, errorRate: 0, tokenCostPer1k: null };
  }

  const windowMinutes = 60;
  return {
    avgLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length) : 0,
    p95LatencyMs: latencies.length > 0 ? latencies[Math.ceil(latencies.length * 0.95) - 1]! : 0,
    p99LatencyMs: latencies.length > 0 ? latencies[Math.ceil(latencies.length * 0.99) - 1]! : 0,
    requestsPerMinute: parseFloat((records.length / windowMinutes).toFixed(2)),
    errorRate: parseFloat((failures / records.length).toFixed(4)),
    tokenCostPer1k: records.reduce((s, r) => s + r.estimatedCostUsd, 0) / Math.max(records.reduce((s, r) => s + r.totalTokens, 0) / 1000, 1),
  };
}

function buildAccuracyFromTelemetry(agentId: string): AiModelEntry["accuracyMetrics"] {
  const recent = inferenceTelemetry.getRecords({ agentId, windowMs: 3600000 });
  const older = inferenceTelemetry.getRecords({ agentId, windowMs: 86400000 });

  const recentSuccessRate = recent.length > 0 ? recent.filter(r => r.success).length / recent.length : null;
  const olderSuccessRate = older.length > 0 ? older.filter(r => r.success).length / older.length : null;

  const drift = recentSuccessRate !== null && olderSuccessRate !== null ? Math.abs(recentSuccessRate - olderSuccessRate) : 0;

  return {
    current: recentSuccessRate !== null ? parseFloat(recentSuccessRate.toFixed(3)) : null,
    baseline: olderSuccessRate !== null ? parseFloat(olderSuccessRate.toFixed(3)) : null,
    drift: parseFloat(drift.toFixed(3)),
    driftStatus: drift > 0.1 ? "critical" : drift > 0.05 ? "warning" : "stable",
    lastEvaluated: recent.length > 0 ? new Date(recent[0]!.timestamp).toISOString() : null,
  };
}

export function getAiModels(): AiModelEntry[] {
  const agentIds = getAllAgentIds();

  return agentIds.map((agentId) => {
    const card = getModelCard(agentId);
    return {
      id: card.id,
      name: card.name,
      provider: card.provider,
      model: card.model,
      version: card.version,
      category: categoryMap[agentId] || "analysis",
      status: card.lifecycle,
      deployedAt: card.lastDeployed,
      inferenceMetrics: buildMetricsFromTelemetry(agentId),
      accuracyMetrics: buildAccuracyFromTelemetry(agentId),
      tags: [card.category, agentId, ...card.capabilities.slice(0, 3)],
      description: card.purpose,
    };
  });
}

export function getAiModelById(modelId: string): AiModelEntry | undefined {
  return getAiModels().find((m) => m.id === modelId);
}

export function getCircuitBreakerMetrics(): {
  circuits: CircuitBreakerStatus[];
  openCount: number;
  halfOpenCount: number;
  closedCount: number;
} {
  const circuits = providerCircuitBreaker.getAllStatuses();
  return {
    circuits,
    openCount: circuits.filter(c => c.state === "open").length,
    halfOpenCount: circuits.filter(c => c.state === "half-open").length,
    closedCount: circuits.filter(c => c.state === "closed").length,
  };
}

export function getModelObservabilitySummary(): {
  totalModels: number;
  activeModels: number;
  avgLatencyMs: number;
  avgErrorRate: number;
  driftAlerts: number;
  freshness: ReturnType<typeof checkFreshness>;
  telemetrySummary: ReturnType<typeof inferenceTelemetry.getSummary>;
  circuitBreakers: ReturnType<typeof getCircuitBreakerMetrics>;
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
    telemetrySummary: inferenceTelemetry.getSummary(),
    circuitBreakers: getCircuitBreakerMetrics(),
  };
}
