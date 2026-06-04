import { z } from 'zod';

/** Outcome of an individual check. */
export const CheckOutcomeSchema = z.enum(['pass', 'fail', 'warn', 'blocked']);
export type CheckOutcome = z.infer<typeof CheckOutcomeSchema>;

/**
 * Action recommended by a check or by the final aggregated decision.
 * Ordered roughly from least to most severe.
 */
export const DecisionActionSchema = z.enum([
  'approve',
  'revise',
  'request_more_evidence',
  'escalate',
  'route_to_human_review',
  'block',
]);
export type DecisionAction = z.infer<typeof DecisionActionSchema>;

/** Target the verifier is judging — a plan step, action, skill output, etc. */
export const VerifierTargetSchema = z.object({
  targetType: z.enum(['plan', 'plan_step', 'skill_run', 'action', 'output']),
  targetId: z.string().min(1),
  traceId: z.string().optional(),
  planId: z.string().optional(),
  planStepId: z.string().optional(),
  skillRunId: z.string().optional(),
});
export type VerifierTarget = z.infer<typeof VerifierTargetSchema>;

/** A single supportable claim in a generated output. */
export const ClaimSchema = z.object({
  text: z.string(),
  /** ids referencing entries in `output.citations` */
  citationIds: z.array(z.string()).default([]),
  /** explicit support flag — if false, treated as unsupported */
  supported: z.boolean().optional(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const CitationSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  quote: z.string().optional(),
  /** has the citation been validated against its source? */
  verified: z.boolean().optional(),
});
export type Citation = z.infer<typeof CitationSchema>;

/** Proposed action being verified for safety. */
export const ProposedActionSchema = z.object({
  kind: z.string(),
  risk: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  reversible: z.boolean().default(true),
  estimatedCostUsd: z.number().nonnegative().optional(),
  blastRadius: z.enum(['self', 'tenant', 'global']).default('self'),
});
export type ProposedAction = z.infer<typeof ProposedActionSchema>;

/**
 * The output payload to verify. All sub-fields are optional — checks that
 * have nothing to look at simply skip themselves.
 */
export const VerifierOutputSchema = z.object({
  text: z.string().optional(),
  claims: z.array(ClaimSchema).optional(),
  citations: z.array(CitationSchema).optional(),
  /** Self-reported confidence (0..1). */
  confidence: z.number().min(0).max(1).optional(),
  /** Known accuracy from past runs — used for calibration check. */
  historicalAccuracy: z.number().min(0).max(1).optional(),
  proposedAction: ProposedActionSchema.optional(),
  /** Field names the output is required to provide. */
  requiredFields: z.array(z.string()).optional(),
  /** Field names the output actually provided (non-empty). */
  providedFields: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type VerifierOutput = z.infer<typeof VerifierOutputSchema>;

/** Generic domain rule — operator pattern reused from policy-engine. */
export const DomainRuleSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  field: z.string(),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'matches']),
  value: z.unknown(),
  /** Severity if the rule is violated. */
  severity: z.enum(['warn', 'fail', 'blocked']).default('fail'),
});
export type DomainRule = z.infer<typeof DomainRuleSchema>;

/** Pair of mutually-exclusive substrings — both must not co-occur in text. */
export const ContradictionPairSchema = z.tuple([z.string(), z.string()]);
export type ContradictionPair = z.infer<typeof ContradictionPairSchema>;

/** Optional context fed into the verifier alongside the output. */
export const VerifierContextSchema = z.object({
  domain: z.string().optional(),
  /**
   * Owning organization id for tenant scoping. When set, the verifier
   * persists this id so list/get/latestForTarget/delete can enforce
   * org-level access control.
   */
  orgId: z.number().int().nullable().optional(),
  /** Minimum citations required per claim. */
  evidenceMinPerClaim: z.number().int().min(0).default(1),
  /** Maximum claims allowed without any citation. */
  maxUncitedClaims: z.number().int().min(0).default(0),
  /** Mutually-exclusive phrase pairs that must not co-occur in the text. */
  contradictionPairs: z.array(ContradictionPairSchema).default([]),
  /** Domain rules to evaluate against output.metadata. */
  domainRules: z.array(DomainRuleSchema).default([]),
  /**
   * Optional policy-engine evaluation request. When supplied, the policy
   * check runs `checkAction` against the registered policies.
   */
  policyRequest: z.unknown().optional(),
  /** Disable individual checks by name. */
  disabledChecks: z.array(z.string()).default([]),
  /** Calibration tolerance — |confidence - historicalAccuracy| above this warns. */
  calibrationTolerance: z.number().min(0).max(1).default(0.25),
  /** Freeform metadata that travels with the verifier result. */
  metadata: z.record(z.unknown()).default({}),
});
export type VerifierContext = z.infer<typeof VerifierContextSchema>;

/** Result of a single check. */
export const CheckResultSchema = z.object({
  name: z.string(),
  outcome: CheckOutcomeSchema,
  score: z.number().min(0).max(1),
  message: z.string().optional(),
  evidence: z.unknown().optional(),
  recommendedAction: DecisionActionSchema.optional(),
});
export type CheckResult = z.infer<typeof CheckResultSchema>;

/** Final verifier decision. */
export const VerifierDecisionSchema = z.object({
  verifierId: z.string(),
  target: VerifierTargetSchema,
  action: DecisionActionSchema,
  outcome: CheckOutcomeSchema,
  overallScore: z.number().min(0).max(1),
  reasoning: z.string(),
  checks: z.array(CheckResultSchema),
  blockerCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
  passCount: z.number().int().nonnegative(),
  failCount: z.number().int().nonnegative(),
  evaluatedAt: z.number(),
  /** Owning organization id for tenant scoping (null = global / no org). */
  orgId: z.number().int().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type VerifierDecision = z.infer<typeof VerifierDecisionSchema>;

export class VerifierResultNotFoundError extends Error {
  constructor(id: string) {
    super(`Verifier result not found: ${id}`);
    this.name = 'VerifierResultNotFoundError';
  }
}

/** Severity ordering for actions — higher wins during aggregation. */
export const ACTION_SEVERITY: Record<DecisionAction, number> = {
  approve: 0,
  revise: 20,
  request_more_evidence: 40,
  escalate: 60,
  route_to_human_review: 80,
  block: 100,
};
