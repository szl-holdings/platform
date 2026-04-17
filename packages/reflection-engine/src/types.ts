import { z } from "zod";

export const FailureModeSchema = z.enum([
  "no_failure",
  "tool_failure",
  "guardrail_block",
  "retrieval_miss",
  "timeout",
  "policy_violation",
  "high_cost",
  "unknown",
]);

export type FailureMode = z.infer<typeof FailureModeSchema>;

export const RouteQualitySchema = z.object({
  model: z.string().optional(),
  promptVersion: z.string().optional(),
  tools: z.array(z.string()),
  avgToolSuccessRate: z.number().min(0).max(1),
  avgRetrievalQuality: z.number().min(0).max(1).optional(),
  latencyMs: z.number().optional(),
  costUsd: z.number().optional(),
  totalTokens: z.number().optional(),
});

export type RouteQuality = z.infer<typeof RouteQualitySchema>;

export const CandidateSkillSchema = z.object({
  skillId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    "analysis",
    "synthesis",
    "extraction",
    "generation",
    "validation",
    "monitoring",
    "research",
    "orchestration",
  ]),
  triggerKeywords: z.array(z.string()),
  inputFields: z.array(z.string()),
  outputFields: z.array(z.string()),
  estimatedTokens: z.number().int(),
  derivedFromTraceId: z.string(),
  status: z.enum(["draft", "under-review", "active"]).default("draft"),
  createdAt: z.string().datetime(),
});

export type CandidateSkill = z.infer<typeof CandidateSkillSchema>;

export const ReflectionSchema = z.object({
  reflectionId: z.string(),
  traceId: z.string(),
  createdAt: z.string().datetime(),
  qualityScore: z.number().min(0).max(1),
  failureMode: FailureModeSchema,
  whatWorked: z.array(z.string()),
  whatFailed: z.array(z.string()),
  whatWasMissing: z.array(z.string()),
  whatToTryNext: z.array(z.string()),
  bestRoute: RouteQualitySchema,
  lesson: z.string(),
  candidateSkill: CandidateSkillSchema.optional(),
  memoryIds: z.object({
    episodicId: z.string().optional(),
    skillMemoryId: z.string().optional(),
  }).default({}),
});

export type Reflection = z.infer<typeof ReflectionSchema>;
