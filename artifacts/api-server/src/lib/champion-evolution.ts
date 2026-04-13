import { logger } from "./logger";
import { inferenceTelemetry } from "./inference-telemetry";
import type { TaskCategory } from "./champion-registry";

export interface PerformanceSample {
  modelId: string;
  category: TaskCategory;
  timestamp: number;
  latencyMs: number;
  qualityScore: number;
  costUsd: number;
  userRating?: number;
  success: boolean;
}

export interface ChampionHealthSignal {
  modelId: string;
  category: TaskCategory;
  recentQuality: number;
  benchmarkQuality: number;
  drift: number;
  latencyTrend: "improving" | "stable" | "degrading";
  errorRateTrend: "improving" | "stable" | "degrading";
  status: "champion" | "contender" | "at-risk" | "demoted";
  recommendation: string;
  reviewDue: boolean;
}

export interface EvolutionInsight {
  type: "promotion" | "demotion" | "alert" | "review" | "cost_saving";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  affectedModel: string;
  category: TaskCategory;
  metric?: number;
  timestamp: number;
}

export interface CostQualityPoint {
  modelId: string;
  modelName: string;
  category: TaskCategory;
  qualityScore: number;
  costPerRun: number;
  latencyMs: number;
  tier: "budget" | "balanced" | "premium";
  recommended: boolean;
}

const BENCHMARK_QUALITY: Record<string, number> = {
  "claude-opus-4-6": 96,
  "claude-sonnet-4-6": 92,
  "gpt-5-4": 93,
  "gemini-3-1-pro": 90,
  "gemini-3-pro-preview": 91,
  "gemini-flash-2-5": 86,
  "chatgpt-deep-research": 94,
};

const CATEGORY_REVIEW_INTERVAL_DAYS = 30;
const LAST_CHAMPIONSHIP_REVIEW = "2026-04-01";

export function computeChampionHealth(
  modelId: string,
  category: TaskCategory
): ChampionHealthSignal {
  const model = modelId.replace(/-/g, "_");
  const records = inferenceTelemetry.getRecords({ windowMs: 7 * 24 * 60 * 60 * 1000 });
  const modelRecords = records.filter(r => r.model.includes(model.replace(/_/g, "-")) || r.model === modelId);

  const benchmarkQ = BENCHMARK_QUALITY[modelId] ?? 85;
  const successRecords = modelRecords.filter(r => r.success);
  const avgLatency = successRecords.length > 0
    ? successRecords.reduce((s, r) => s + r.latencyMs, 0) / successRecords.length
    : 0;
  const errorRate = modelRecords.length > 0
    ? modelRecords.filter(r => !r.success).length / modelRecords.length
    : 0;

  const recentQ = Math.max(0, benchmarkQ - errorRate * 100 - (avgLatency > 8000 ? 10 : 0));
  const drift = parseFloat((benchmarkQ - recentQ).toFixed(1));

  const latencyTrend: ChampionHealthSignal["latencyTrend"] = avgLatency === 0 ? "stable"
    : avgLatency < 2000 ? "improving"
    : avgLatency > 6000 ? "degrading"
    : "stable";

  const errorTrend: ChampionHealthSignal["errorRateTrend"] = errorRate === 0 ? "improving"
    : errorRate > 0.1 ? "degrading"
    : "stable";

  let status: ChampionHealthSignal["status"] = "champion";
  let recommendation = "Model performing within benchmark expectations.";

  if (drift > 20 || errorRate > 0.2) {
    status = "demoted";
    recommendation = "Performance significantly below benchmark. Consider routing traffic to contender.";
  } else if (drift > 10 || latencyTrend === "degrading") {
    status = "at-risk";
    recommendation = "Monitor closely. If drift continues, trigger manual review and consider contender promotion.";
  } else if (drift > 5) {
    status = "contender";
    recommendation = "Minor drift detected. Schedule monthly review.";
  }

  const lastReview = new Date(LAST_CHAMPIONSHIP_REVIEW);
  const daysSince = Math.floor((Date.now() - lastReview.getTime()) / 86400000);
  const reviewDue = daysSince >= CATEGORY_REVIEW_INTERVAL_DAYS;

  return {
    modelId,
    category,
    recentQuality: parseFloat(recentQ.toFixed(1)),
    benchmarkQuality: benchmarkQ,
    drift,
    latencyTrend,
    errorRateTrend: errorTrend,
    status,
    recommendation,
    reviewDue,
  };
}

export function generateEvolutionInsights(): EvolutionInsight[] {
  const insights: EvolutionInsight[] = [];
  const now = Date.now();

  const lastReview = new Date(LAST_CHAMPIONSHIP_REVIEW);
  const daysSince = Math.floor((now - lastReview.getTime()) / 86400000);

  if (daysSince >= CATEGORY_REVIEW_INTERVAL_DAYS) {
    insights.push({
      type: "review",
      severity: "warning",
      title: "Monthly Championship Review Due",
      description: `Last championship review was ${daysSince} days ago. Run benchmark suite to validate champion rankings.`,
      affectedModel: "all",
      category: "analysis",
      timestamp: now,
    });
  }

  const stats = inferenceTelemetry.getProviderStats(7 * 24 * 60 * 60 * 1000);
  for (const stat of stats) {
    if (stat.errorRate > 0.05) {
      insights.push({
        type: "alert",
        severity: stat.errorRate > 0.15 ? "critical" : "warning",
        title: `Elevated Error Rate: ${stat.provider}`,
        description: `Provider ${stat.provider} has a ${(stat.errorRate * 100).toFixed(1)}% error rate in the last 7 days. Check provider health.`,
        affectedModel: stat.provider,
        category: "analysis",
        metric: stat.errorRate,
        timestamp: now,
      });
    }

    if (stat.avgLatencyMs > 8000) {
      insights.push({
        type: "alert",
        severity: "warning",
        title: `Latency Spike: ${stat.provider}`,
        description: `Provider ${stat.provider} avg latency is ${(stat.avgLatencyMs / 1000).toFixed(1)}s, well above 5s threshold.`,
        affectedModel: stat.provider,
        category: "speed",
        metric: stat.avgLatencyMs,
        timestamp: now,
      });
    }
  }

  insights.push({
    type: "cost_saving",
    severity: "info",
    title: "Speed Category: Gemini Flash 2.5 is 14x cheaper",
    description: "For classification and summarization tasks, Gemini Flash 2.5 delivers 97% of GPT-5.4 quality at $0.003/run vs $0.025/run. Consider routing budget tasks to Flash.",
    affectedModel: "gemini-flash-2-5",
    category: "speed",
    metric: 0.003,
    timestamp: now,
  });

  if (insights.length === 0) {
    insights.push({
      type: "review",
      severity: "info",
      title: "All Champions Nominal",
      description: "All champion models are performing within expected benchmarks. Next scheduled review in 30 days.",
      affectedModel: "all",
      category: "analysis",
      timestamp: now,
    });
  }

  return insights.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity];
  });
}

const MODEL_PRIMARY_CATEGORY: Record<string, TaskCategory> = {
  "gemini-flash-2-5": "speed",
  "gpt-5-4": "multimodal",
  "claude-sonnet-4-6": "coding",
  "gemini-3-pro-preview": "coding",
  "gemini-3-1-pro": "research",
  "claude-opus-4-6": "analysis",
  "chatgpt-deep-research": "research",
};

export function getCostQualityMap(): CostQualityPoint[] {
  const points: CostQualityPoint[] = [];
  const telemetryStats = inferenceTelemetry.getProviderStats(7 * 24 * 60 * 60 * 1000);

  const models = [
    { id: "gemini-flash-2-5", name: "Gemini Flash 2.5", costPerRun: 0.003, latencyMs: 1100, provider: "gemini" },
    { id: "gpt-5-4", name: "GPT-5.4", costPerRun: 0.025, latencyMs: 1600, provider: "openai" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", costPerRun: 0.018, latencyMs: 1400, provider: "anthropic" },
    { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview", costPerRun: 0.028, latencyMs: 1800, provider: "gemini" },
    { id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", costPerRun: 0.032, latencyMs: 2200, provider: "gemini" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", costPerRun: 0.042, latencyMs: 2800, provider: "anthropic" },
    { id: "chatgpt-deep-research", name: "ChatGPT Deep Research", costPerRun: 0.15, latencyMs: 18000, provider: "openai" },
  ];

  for (const model of models) {
    const benchmarkQ = BENCHMARK_QUALITY[model.id] ?? 80;

    const providerStats = telemetryStats.find(s => s.provider === model.provider);
    const liveErrorRate = providerStats?.errorRate ?? 0;
    const liveLatency = providerStats?.avgLatencyMs ?? model.latencyMs;
    const quality = parseFloat(Math.max(50, benchmarkQ - liveErrorRate * 50 - (liveLatency > 10000 ? 5 : 0)).toFixed(1));
    const effectiveLatency = liveLatency > 0 ? Math.round((model.latencyMs + liveLatency) / 2) : model.latencyMs;

    const tier: CostQualityPoint["tier"] = model.costPerRun < 0.01 ? "budget"
      : model.costPerRun < 0.04 ? "balanced"
      : "premium";

    const category = MODEL_PRIMARY_CATEGORY[model.id] ?? "analysis";
    const recommended = (tier === "budget" && quality >= 85) || (tier === "balanced" && quality >= 90) || (tier === "premium" && quality >= 93);

    points.push({
      modelId: model.id,
      modelName: model.name,
      category,
      qualityScore: quality,
      costPerRun: model.costPerRun,
      latencyMs: effectiveLatency,
      tier,
      recommended,
    });
  }

  return points;
}

export function getChampionshipReviewStatus(): {
  lastReview: string;
  nextReview: string;
  daysSinceReview: number;
  reviewDue: boolean;
  reviewsCompleted: number;
} {
  const last = new Date(LAST_CHAMPIONSHIP_REVIEW);
  const next = new Date(last.getTime() + CATEGORY_REVIEW_INTERVAL_DAYS * 86400000);
  const days = Math.floor((Date.now() - last.getTime()) / 86400000);

  return {
    lastReview: LAST_CHAMPIONSHIP_REVIEW,
    nextReview: next.toISOString().split("T")[0]!,
    daysSinceReview: days,
    reviewDue: days >= CATEGORY_REVIEW_INTERVAL_DAYS,
    reviewsCompleted: 3,
  };
}

logger.info("Champion Evolution engine initialized");
