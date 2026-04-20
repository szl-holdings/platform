import { z } from 'zod';
import { TenantIdSchema } from './tenant.js';

export const AefEvidenceObjectSchema = z.object({
  evidenceId: z.string().min(1),
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  profileVersion: z.string().optional(),
  chunkId: z.string(),
  sourceId: z.string(),
  sourceUri: z.string().optional(),
  title: z.string().optional(),
  page: z.number().int().nonnegative().optional(),
  section: z.string().optional(),
  denseScore: z.number().optional(),
  keywordScore: z.number().optional(),
  fusedScore: z.number().optional(),
  boostApplied: z.boolean().default(false),
  rerankerScore: z.number().optional(),
  finalScore: z.number(),
  policyAllow: z.boolean(),
  policyReasons: z.array(z.string()).default([]),
  redactedFields: z.array(z.string()).default([]),
  requestedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  operatorAnnotation: z.string().optional(),
});
export type AefEvidenceObject = z.infer<typeof AefEvidenceObjectSchema>;
