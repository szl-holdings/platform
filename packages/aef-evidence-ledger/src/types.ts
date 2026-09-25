import { z } from 'zod';

// Keep the ledger package independently typecheckable. These constraints mirror
// aef-contracts but are deliberately local so a standalone package build does
// not require generated declaration output from another composite project.
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i, 'expected a SHA-256 digest');
const PromotionStateSchema = z.enum([
  'DEVELOPMENT',
  'EVALUATION_HOLD',
  'QUALIFIED',
  'REVOKED',
]);

export const EvidenceEntrySchema = z.object({
  entryId: z.string().min(1),
  requestId: z.string().min(1),
  tenantId: z.string().min(1),
  profileId: z.string().optional(),
  profileVersion: z.string().optional(),
  chunkId: z.string().min(1),
  sourceId: z.string().min(1),
  sourceUri: z.string().optional(),
  title: z.string().optional(),
  page: z.number().int().nonnegative().optional(),
  section: z.string().optional(),
  denseScore: z.number().optional(),
  keywordScore: z.number().optional(),
  fusedScore: z.number().optional(),
  boostApplied: z.boolean().default(false),
  boostRuleId: z.string().optional(),
  rerankerScore: z.number().optional(),
  finalScore: z.number(),
  policyAllow: z.boolean(),
  policyReasons: z.array(z.string()).default([]),
  redactedFields: z.array(z.string()).default([]),
  retentionOverrideDays: z.number().int().positive().optional(),
  requestedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  operatorAnnotation: z.string().optional(),
  // Governance-depth extensions: per-stage timings, backend attribution, score decomposition, approval artifacts
  stageTimings: z.record(z.number().nonnegative()).optional(),
  backendId: z.string().optional(),
  approvalDecision: z
    .object({ approvalRequestId: z.string(), verdict: z.string(), decidedAt: z.string() })
    .optional(),
  scoreBreakdown: z.record(z.number()).optional(),
  // Immutable model/runtime identity. Optional for backward compatibility with
  // historical receipts; new embedding paths populate every available field.
  modelId: z.string().min(1).optional(),
  modelRevision: z.string().min(1).optional(),
  artifactSetDigest: Sha256Schema.optional(),
  processorRevision: z.string().min(1).optional(),
  runtimeId: z.string().min(1).optional(),
  runtimeVersion: z.string().min(1).optional(),
  dimensions: z.number().int().positive().optional(),
  normalized: z.boolean().optional(),
  inputDigest: Sha256Schema.optional(),
  promotionState: PromotionStateSchema.optional(),
});

export type EvidenceEntry = z.infer<typeof EvidenceEntrySchema>;

export interface LedgerQueryOptions {
  requestId?: string;
  tenantId?: string;
  profileId?: string;
  sourceId?: string;
  policyAllow?: boolean;
  after?: string;
  before?: string;
  limit?: number;
  offset?: number;
}
