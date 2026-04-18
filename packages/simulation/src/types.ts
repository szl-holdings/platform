import { z } from "zod";

export const SimulationActionSchema = z.object({
  id: z.string(),
  type: z.enum(["execute_recommendation", "partial_action", "escalation", "reassign", "void_chain", "no_action"]),
  recommendationId: z.string().optional(),
  targetEntityId: z.string().optional(),
  targetEntityType: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
});
export type SimulationAction = z.infer<typeof SimulationActionSchema>;

export const DownstreamEffectSchema = z.object({
  entityId: z.string().optional(),
  entityLabel: z.string(),
  entityType: z.string().optional(),
  effect: z.string(),
  magnitude: z.enum(["high", "medium", "low"]),
  timeToEffect: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type DownstreamEffect = z.infer<typeof DownstreamEffectSchema>;

export const ProjectedOutcomeSchema = z.object({
  primaryMetricLabel: z.string(),
  primaryMetricBefore: z.number(),
  primaryMetricAfter: z.number(),
  primaryMetricUnit: z.string(),
  daysToRecovery: z.number().optional(),
  estimatedValueCapture: z.number().optional(),
  estimatedValueLoss: z.number().optional(),
  confidence: z.number().min(0).max(1),
  confidenceReason: z.string().optional(),
});
export type ProjectedOutcome = z.infer<typeof ProjectedOutcomeSchema>;

export const SimulationResultSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  scenarioName: z.string(),
  scenarioDescription: z.string(),
  action: SimulationActionSchema,
  projectedOutcome: ProjectedOutcomeSchema,
  downstreamEffects: z.array(DownstreamEffectSchema),
  riskIfNotTaken: z.string().optional(),
  alternativeScenarios: z.array(z.object({
    id: z.string(),
    name: z.string(),
    closeProbability: z.number().optional(),
    valueCapture: z.number().optional(),
    confidence: z.number().optional(),
  })).optional(),
  simulatedAt: z.number(),
  engineVersion: z.string(),
});
export type SimulationResult = z.infer<typeof SimulationResultSchema>;

export const SimulationRequestSchema = z.object({
  recommendationId: z.string(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  domain: z.string(),
  action: SimulationActionSchema,
  context: z.record(z.unknown()).optional(),
});
export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  action: SimulationAction;
  projectedOutcome: ProjectedOutcome;
  downstreamEffects: DownstreamEffect[];
}
