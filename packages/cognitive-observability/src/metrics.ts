import { z } from "zod";

export const MetricTypeSchema = z.enum(["counter", "gauge", "histogram", "summary"]);

export const CognitiveMetricSchema = z.object({
  name: z.string(),
  type: MetricTypeSchema,
  unit: z.string().optional(),
  description: z.string(),
  value: z.number(),
  labels: z.record(z.string()).default({}),
  timestamp: z.string().datetime(),
});

export type MetricType = z.infer<typeof MetricTypeSchema>;
export type CognitiveMetric = z.infer<typeof CognitiveMetricSchema>;

export const METRIC_DEFINITIONS = {
  latency_ms: { type: "histogram" as const, unit: "ms", description: "End-to-end agent request latency" },
  token_count: { type: "counter" as const, unit: "tokens", description: "Total tokens consumed" },
  tool_error_rate: { type: "gauge" as const, unit: "ratio", description: "Rate of tool invocation errors" },
  retrieval_quality_score: { type: "gauge" as const, unit: "score", description: "Average retrieval quality score (0–1)" },
  memory_hit_rate: { type: "gauge" as const, unit: "ratio", description: "Memory cache hit rate" },
  hallucination_rate: { type: "gauge" as const, unit: "ratio", description: "Estimated hallucination rate in agent outputs" },
  citation_coverage: { type: "gauge" as const, unit: "ratio", description: "Fraction of claims with supporting citations" },
  approval_bottleneck_ms: { type: "histogram" as const, unit: "ms", description: "Time spent waiting for human approvals" },
  override_rate: { type: "gauge" as const, unit: "ratio", description: "Rate of human policy overrides" },
  rollback_count: { type: "counter" as const, unit: "events", description: "Number of workflow rollbacks" },
  drift_score: { type: "gauge" as const, unit: "score", description: "Model/behavior drift score relative to baseline" },
  value_created_usd: { type: "counter" as const, unit: "USD", description: "Estimated business value created by agents" },
  value_at_risk_usd: { type: "gauge" as const, unit: "USD", description: "Business value at risk from pending actions" },
  agent_reliability_score: { type: "gauge" as const, unit: "score", description: "Composite agent reliability score (0–1)" },
  cost_usd: { type: "counter" as const, unit: "USD", description: "Total agent runtime cost in USD" },
} satisfies Record<string, { type: MetricType; unit: string; description: string }>;

export type KnownMetricName = keyof typeof METRIC_DEFINITIONS;

export function makeMetric(
  name: KnownMetricName,
  value: number,
  labels: Record<string, string> = {}
): CognitiveMetric {
  const def = METRIC_DEFINITIONS[name];
  return CognitiveMetricSchema.parse({
    name,
    type: def.type,
    unit: def.unit,
    description: def.description,
    value,
    labels,
    timestamp: new Date().toISOString(),
  });
}
