import { z } from "zod";

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
