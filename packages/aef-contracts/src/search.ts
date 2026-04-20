import { z } from "zod";
import { TenantIdSchema } from "./tenant.js";

export const MetadataFilterSchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
);
export type MetadataFilter = z.infer<typeof MetadataFilterSchema>;

export const HybridSearchRequestSchema = z.object({
  requestId: z.string().min(1),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  query: z.string().min(1),
  topK: z.number().int().positive().default(10),
  candidatePool: z.number().int().positive().default(100),
  denseWeight: z.number().min(0).max(1).default(0.6),
  keywordWeight: z.number().min(0).max(1).default(0.4),
  metadataFilter: MetadataFilterSchema.optional(),
  rerankEnabled: z.boolean().default(false),
  includeProvenance: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
});
export type HybridSearchRequest = z.infer<typeof HybridSearchRequestSchema>;

export const SearchHitSchema = z.object({
  chunkId: z.string(),
  sourceId: z.string(),
  sourceUri: z.string().optional(),
  title: z.string().optional(),
  page: z.number().int().nonnegative().optional(),
  section: z.string().optional(),
  text: z.string(),
  denseScore: z.number().optional(),
  keywordScore: z.number().optional(),
  fusedScore: z.number(),
  rerankerScore: z.number().optional(),
  finalScore: z.number(),
  boostApplied: z.boolean().default(false),
  metadata: z.record(z.unknown()).default({}),
});
export type SearchHit = z.infer<typeof SearchHitSchema>;

export const HybridSearchResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  hits: z.array(SearchHitSchema),
  totalCandidates: z.number().int().nonnegative(),
  processingMs: z.number().nonnegative().optional(),
});
export type HybridSearchResponse = z.infer<typeof HybridSearchResponseSchema>;
