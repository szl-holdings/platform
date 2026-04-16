import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { z } = require("zod");

export const RankingWeightsSchema = z.object({
  urgency: z.number().min(0).max(1).optional().default(0.4),
  businessImpact: z.number().min(0).max(1).optional().default(0.3),
  feasibility: z.number().min(0).max(1).optional().default(0.2),
  confidence: z.number().min(0).max(1).optional().default(0.1),
});

export function rankSignalGroups(groups = [], weights = {}) {
  const merged = groups.flatMap((g) => g.signals ?? []);
  return merged.map((signal, i) => ({
    id: signal.id ?? `rec-${i}`,
    title: signal.title ?? "Recommendation",
    description: signal.description ?? "",
    domain: signal.domain ?? "general",
    action: signal.action ?? "review",
    priorityScore: computePriorityScore({ signal, weights }),
    confidence: signal.confidence ?? 0.5,
    businessImpact: signal.businessImpact ?? { severity: "medium", estimatedValue: 0 },
    signals: [signal],
    reasoning: "Derived from signal analysis.",
    requiredRoles: ["analyst"],
    estimatedEffortHours: 1,
    isActionable: true,
    createdAt: new Date().toISOString(),
  })).sort((a, b) => b.priorityScore - a.priorityScore);
}

export function computePriorityScore({ signal = {}, weights = {} } = {}) {
  const w = { urgency: 0.4, businessImpact: 0.3, feasibility: 0.2, confidence: 0.1, ...weights };
  return (
    (signal.urgency ?? 0.5) * w.urgency +
    (signal.businessImpactScore ?? 0.5) * w.businessImpact +
    (signal.feasibility ?? 0.5) * w.feasibility +
    (signal.confidence ?? 0.5) * w.confidence
  );
}
