import { z } from "zod";

export const SignalSchema = z.object({
  id: z.string(),
  domain: z.string(),
  type: z.string(),
  value: z.unknown(),
  source: z.string(),
  sourceId: z.string().optional(),
  timestamp: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type Signal = z.infer<typeof SignalSchema>;

export const BusinessImpactSchema = z.object({
  financialExposureUsd: z.number().min(0).optional(),
  affectedEntities: z.number().int().min(0).optional(),
  reputationalRisk: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
  regulatoryExposure: z.boolean().optional(),
  crossDomainBlastRadius: z.array(z.string()).optional(),
});

export type BusinessImpact = z.infer<typeof BusinessImpactSchema>;

export const RecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  reasoning: z.string(),
  domain: z.string(),
  sourceSignals: z.array(SignalSchema),
  confidence: z.number().min(0).max(1),
  urgency: z.enum(["routine", "moderate", "urgent", "critical"]),
  priority: z.number().min(0).max(100),
  businessImpact: BusinessImpactSchema,
  suggestedAction: z.string(),
  suggestedOwner: z.string().optional(),
  estimatedCostUsd: z.number().min(0).optional(),
  policyState: z.enum(["unchecked", "allowed", "requires_approval", "blocked"]).default("unchecked"),
  approvalState: z.enum(["none", "pending", "approved", "rejected", "escalated"]).default("none"),
  executionStatus: z.enum(["none", "queued", "running", "completed", "failed", "rolled_back"]).default("none"),
  evidence: z.array(z.object({
    label: z.string(),
    value: z.string(),
    source: z.string().optional(),
  })).min(1, "Recommendation must include at least one evidence item"),
  createdAt: z.number(),
  expiresAt: z.number().optional(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const RankingWeightsSchema = z.object({
  businessImpact: z.number().min(0).max(1).default(0.35),
  urgency: z.number().min(0).max(1).default(0.25),
  confidence: z.number().min(0).max(1).default(0.20),
  slaProximity: z.number().min(0).max(1).default(0.10),
  crossDomainRisk: z.number().min(0).max(1).default(0.10),
});

export type RankingWeights = z.infer<typeof RankingWeightsSchema>;

export const SignalBatchSchema = z.object({
  signals: z.array(SignalSchema),
  tenantId: z.string().optional(),
  domain: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export type SignalBatch = z.infer<typeof SignalBatchSchema>;

export interface DecisionEngineResult {
  recommendations: Recommendation[];
  totalSignalsEvaluated: number;
  evaluatedAt: number;
  engineVersion: string;
}
