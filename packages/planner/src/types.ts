import { z } from 'zod';

export const PlanStepStatusSchema = z.enum([
  'pending',
  'ready',
  'running',
  'blocked',
  'completed',
  'failed',
  'skipped',
]);
export type PlanStepStatus = z.infer<typeof PlanStepStatusSchema>;

export const PlanStatusSchema = z.enum([
  'draft',
  'ready',
  'executing',
  'completed',
  'failed',
  'cancelled',
]);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RouteDecisionSchema = z.object({
  modelProvider: z.string().optional(),
  model: z.string().optional(),
  routeClass: z
    .enum([
      'reasoning',
      'triage',
      'extraction',
      'planning',
      'embedding',
      'classification',
      'summarization',
      'generation',
    ])
    .default('generation'),
  toolId: z.string().optional(),
  toolVersion: z.string().optional(),
  estimatedCostUsd: z.number().nonnegative().default(0),
  selectedBy: z.enum(['eval', 'cost', 'priority', 'preferred', 'manual']).default('priority'),
  fallbackChain: z.array(z.object({ provider: z.string(), model: z.string() })).default([]),
});
export type RouteDecision = z.infer<typeof RouteDecisionSchema>;

export const RollbackPointSchema = z.object({
  stepId: z.string(),
  description: z.string(),
  /** snapshot reference (memory-fabric or trace key) */
  snapshotRef: z.string().optional(),
});
export type RollbackPoint = z.infer<typeof RollbackPointSchema>;

export const PlanStepSchema = z.object({
  stepId: z.string(),
  index: z.number().int().nonnegative(),
  title: z.string().min(1),
  description: z.string().default(''),
  /** ids of steps this step depends on */
  dependsOn: z.array(z.string()).default([]),
  status: PlanStepStatusSchema.default('pending'),
  route: RouteDecisionSchema,
  /** estimated value of completing this step (0..1) */
  estimatedValue: z.number().min(0).max(1).default(0.5),
  /** estimated risk of attempting this step (0..1) */
  estimatedRisk: z.number().min(0).max(1).default(0.1),
  riskLevel: RiskLevelSchema.default('low'),
  requiredEvidence: z.array(z.string()).default([]),
  requiredApproval: z.boolean().default(false),
  approvalReason: z.string().optional(),
  rollbackPoints: z.array(RollbackPointSchema).default([]),
  inputs: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type PlanStep = z.infer<typeof PlanStepSchema>;

export const PlanGraphSchema = z.object({
  planId: z.string(),
  parentPlanId: z.string().optional(),
  fallbackOf: z.string().optional(),
  rank: z.number().int().nonnegative().default(0),
  title: z.string().min(1),
  objective: z.string().min(1),
  status: PlanStatusSchema.default('draft'),
  steps: z.array(PlanStepSchema),
  /** topologically sorted step ids */
  executionOrder: z.array(z.string()),
  /** total estimated cost in USD */
  estimatedCostUsd: z.number().nonnegative().default(0),
  estimatedValue: z.number().min(0).max(1).default(0.5),
  estimatedRisk: z.number().min(0).max(1).default(0.1),
  riskLevel: RiskLevelSchema.default('low'),
  confidence: z.number().min(0).max(1).default(0.7),
  /** counterfactual / alternative plans */
  fallbacks: z.array(z.string()).default([]),
  context: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});
export type PlanGraph = z.infer<typeof PlanGraphSchema>;

export const PlanContextSchema = z.object({
  agentId: z.string().optional(),
  sessionId: z.string().optional(),
  workflowId: z.string().optional(),
  traceId: z.string().optional(),
  orgId: z.string().optional(),
  agentTier: z.enum(['assistant', 'analyst', 'operator', 'autonomous']).default('analyst'),
  /** override decomposition: explicit step seeds */
  seeds: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        routeClass: RouteDecisionSchema.shape.routeClass.optional(),
        toolId: z.string().optional(),
        dependsOn: z.array(z.string()).default([]),
        requiredApproval: z.boolean().default(false),
        estimatedValue: z.number().min(0).max(1).optional(),
        estimatedRisk: z.number().min(0).max(1).optional(),
        requiredEvidence: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  /** generate this many fallback plans (0..5) */
  fallbackCount: z.number().int().min(0).max(5).default(2),
  /** budget in USD; affects routing */
  maxBudgetUsd: z.number().positive().optional(),
  /** require approval gates for any step at or above this risk level */
  approvalThreshold: RiskLevelSchema.default('high'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type PlanContext = z.input<typeof PlanContextSchema>;
export type ResolvedPlanContext = z.infer<typeof PlanContextSchema>;

export class PlanNotFoundError extends Error {
  constructor(planId: string) {
    super(`Plan not found: ${planId}`);
    this.name = 'PlanNotFoundError';
  }
}

export class PlanCycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanCycleError';
  }
}
