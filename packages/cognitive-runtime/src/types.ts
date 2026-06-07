import { z } from 'zod';

export const CognitivePhaseSchema = z.enum([
  'perceive',
  'orient',
  'plan',
  'execute',
  'verify',
  'reflect',
  'update_self_model',
  'update_memory',
  'complete',
  'failed',
  'guardian_blocked',
]);
// All 8 spec-required phases (excluding terminal/administrative phases)
export const COGNITIVE_LOOP_PHASES = [
  'perceive',
  'orient',
  'plan',
  'execute',
  'verify',
  'reflect',
  'update_self_model',
  'update_memory',
] as const;
export type CognitivePhase = z.infer<typeof CognitivePhaseSchema>;

export const LoopStatusSchema = z.enum([
  'running',
  'completed',
  'failed',
  'guardian_blocked',
  'pending_approval',
  'checkpointed',
]);
export type LoopStatus = z.infer<typeof LoopStatusSchema>;

export const PhaseResultSchema = z.object({
  phase: CognitivePhaseSchema,
  status: z.enum(['ok', 'error', 'skipped', 'blocked']),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  durationMs: z.number().optional(),
  output: z.unknown().optional(),
  error: z.string().optional(),
  retryCount: z.number().int().nonnegative().default(0),
  metadata: z.record(z.unknown()).default({}),
});
export type PhaseResult = z.infer<typeof PhaseResultSchema>;

export const PerceiveInputSchema = z.object({
  rawSignals: z.array(z.record(z.unknown())).default([]),
  eventType: z.string().optional(),
  sourceDomain: z.string().optional(),
  sourceId: z.string().optional(),
  timestamp: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
});
export type PerceiveInput = z.infer<typeof PerceiveInputSchema>;

export const WorldModelUpdateSchema = z.object({
  entities: z
    .array(
      z.object({
        entityId: z.string(),
        entityType: z.string(),
        attributes: z.record(z.unknown()).default({}),
        confidence: z.number().min(0).max(1).default(0.8),
      }),
    )
    .default([]),
  noveltyScore: z.number().min(0).max(1).default(0),
  riskScore: z.number().min(0).max(1).default(0),
  uncertaintyScore: z.number().min(0).max(1).default(0),
  missingContextKeys: z.array(z.string()).default([]),
  detectedAnomalies: z.array(z.string()).default([]),
  graphUpdates: z.number().int().nonnegative().default(0),
});
export type WorldModelUpdate = z.infer<typeof WorldModelUpdateSchema>;

export const ExecuteStepResultSchema = z.object({
  stepId: z.string(),
  stepTitle: z.string(),
  status: z.enum(['completed', 'failed', 'skipped', 'blocked', 'pending_approval']),
  output: z.unknown().optional(),
  error: z.string().optional(),
  toolId: z.string().optional(),
  retries: z.number().int().nonnegative().default(0),
  durationMs: z.number().optional(),
  checkpointRef: z.string().optional(),
  guardianOutcome: z.string().optional(),
});
export type ExecuteStepResult = z.infer<typeof ExecuteStepResultSchema>;

export const CognitiveContextSchema = z.object({
  agentId: z.string().default('default-agent'),
  sessionId: z.string().optional(),
  traceId: z.string().optional(),
  tenantId: z.string().optional(),
  domain: z.string().optional(),
  perceiveInput: PerceiveInputSchema.optional(),
  agentTier: z.enum(['assistant', 'analyst', 'operator', 'autonomous']).default('analyst'),
  maxPlanSteps: z.number().int().positive().default(10),
  maxRetries: z.number().int().nonnegative().default(3),
  maxVerifyRevisions: z.number().int().nonnegative().default(2),
  checkpointEveryNSteps: z.number().int().positive().default(1),
  dryRun: z.boolean().default(false),
  resumeFromCheckpoint: z.string().optional(),
  guardianEnabled: z.boolean().default(true),
  verifierEnabled: z.boolean().default(true),
  reflectionEnabled: z.boolean().default(true),
  selfModelRuntimeId: z.string().optional(),
  // Optional overrides used by eval variant replay (and any other caller that
  // wants to pin a specific model / prompt version for an entire loop).
  // - preferredProvider/preferredModel: forwarded to plan-phase routing so
  //   every plan step's RouteDecision is pinned to this model.
  // - promptVersionId: stamped onto each plan step's route metadata so the
  //   downstream engines (planner/verifier/reflector) resolve this exact
  //   prompt version from `@workspace/prompt-registry`.
  // - maxBudgetUsd: forwarded to PlanContext for cost-aware routing.
  preferredProvider: z.string().optional(),
  preferredModel: z.string().optional(),
  promptVersionId: z.string().optional(),
  maxBudgetUsd: z.number().positive().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type CognitiveContext = z.input<typeof CognitiveContextSchema>;
export type ResolvedCognitiveContext = z.infer<typeof CognitiveContextSchema>;

export const CognitiveLoopRunSchema = z.object({
  runId: z.string(),
  objective: z.string(),
  context: CognitiveContextSchema,
  status: LoopStatusSchema,
  currentPhase: CognitivePhaseSchema,
  phases: z.array(PhaseResultSchema).default([]),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  durationMs: z.number().optional(),
  traceId: z.string().optional(),
  planId: z.string().optional(),
  stepResults: z.array(ExecuteStepResultSchema).default([]),
  verifyRevisions: z.number().int().nonnegative().default(0),
  planRevisions: z.number().int().nonnegative().default(0),
  reflectionId: z.string().optional(),
  selfModelVersion: z.number().optional(),
  memoryIds: z.array(z.string()).default([]),
  checkpointRef: z.string().optional(),
  output: z.unknown().optional(),
  worldModelUpdate: WorldModelUpdateSchema.optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type CognitiveLoopRun = z.infer<typeof CognitiveLoopRunSchema>;

export class CognitiveLoopError extends Error {
  constructor(
    message: string,
    public readonly phase: CognitivePhase,
    public readonly runId: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CognitiveLoopError';
  }
}

export class GuardianBlockError extends Error {
  constructor(
    public readonly action: string,
    public readonly reason: string,
    public readonly runId: string,
  ) {
    super(`Guardian blocked action '${action}': ${reason}`);
    this.name = 'GuardianBlockError';
  }
}

export class VerifierBlockError extends Error {
  constructor(
    public readonly verifierId: string,
    public readonly reason: string,
    public readonly runId: string,
  ) {
    super(`Verifier blocked output (${verifierId}): ${reason}`);
    this.name = 'VerifierBlockError';
  }
}

export class CheckpointNotFoundError extends Error {
  constructor(checkpointRef: string) {
    super(`Checkpoint not found: ${checkpointRef}`);
    this.name = 'CheckpointNotFoundError';
  }
}
