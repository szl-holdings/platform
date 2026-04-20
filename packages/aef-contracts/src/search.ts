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

// Canonical 13-stage retrieval pipeline — documented native shape.
export const RETRIEVAL_PATH = [
  "normalize_query",
  "load_profile",
  "policy_check",
  "query_shaping",
  "dense_ann",
  "keyword_bm25",
  "exact_match_boost",
  "rrf_fusion",
  "metadata_filter",
  "rerank",
  "evidence_assemble",
  "ledger_write",
  "response_normalization",
] as const;
export type RetrievalStage = (typeof RETRIEVAL_PATH)[number];

export const SearchHitSchema = z.object({
  // Core retrieval fields
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

  // Governance / evidence-first extension fields
  traceId: z.string().optional(),
  evidenceId: z.string().optional(),
  retrievalPath: z.array(z.string()).optional(),
  rationale: z.string().optional(),
  selectedRationale: z.string().optional(),
  profileVersion: z.string().optional(),
  sourceType: z.string().optional(),
  documentTitle: z.string().optional(),
  exactMatchBoosts: z.array(z.string()).optional(),
  fusionScore: z.number().optional(),
  rerankScore: z.number().optional(),
});
export type SearchHit = z.infer<typeof SearchHitSchema>;

export const HybridSearchResponseSchema = z.object({
  requestId: z.string(),
  tenantId: TenantIdSchema,
  profileId: z.string().optional(),
  profileVersion: z.string().optional(),

  // Evidence / governance envelope
  traceId: z.string(),
  retrievalPath: z.array(z.string()),
  stageTimings: z.record(z.number()).optional(),
  policyDecision: z
    .object({
      allow: z.boolean(),
      redactions: z.array(z.string()),
      appliedRuleIds: z.array(z.string()),
    })
    .optional(),
  ledgerFailures: z.number().int().nonnegative().optional(),

  hits: z.array(SearchHitSchema),
  totalCandidates: z.number().int().nonnegative(),
  processingMs: z.number().nonnegative().optional(),
});
export type HybridSearchResponse = z.infer<typeof HybridSearchResponseSchema>;
