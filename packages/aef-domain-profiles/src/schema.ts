import { z } from "zod";

export const ChunkingStrategySchema = z.object({
  method: z.enum(["sentence", "paragraph", "fixed-token", "semantic", "hybrid"]),
  targetTokens: z.number().int().positive().default(512),
  overlapTokens: z.number().int().nonnegative().default(64),
  respectBoundaries: z.boolean().default(true),
  splitOnHeadings: z.boolean().default(false),
  minChunkTokens: z.number().int().positive().default(64),
});
export type ChunkingStrategy = z.infer<typeof ChunkingStrategySchema>;

export const PromptTemplateSchema = z.object({
  templateId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  template: z.string().min(1),
  variables: z.array(z.string()).default([]),
  description: z.string().optional(),
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

export const PrivacyLevelSchema = z.enum(["public", "internal", "confidential", "restricted", "privileged"]);
export type PrivacyLevel = z.infer<typeof PrivacyLevelSchema>;

export const RetentionRulesSchema = z.object({
  defaultRetentionDays: z.number().int().positive(),
  requestLogRetentionDays: z.number().int().positive(),
  evidenceRetentionDays: z.number().int().positive(),
  deletionRequired: z.boolean().default(false),
  auditTrailRetentionDays: z.number().int().positive(),
  encryptAtRest: z.boolean().default(true),
  encryptInTransit: z.boolean().default(true),
  allowCrossRegionReplication: z.boolean().default(false),
});
export type RetentionRules = z.infer<typeof RetentionRulesSchema>;

export const ScoreThresholdsSchema = z.object({
  minimumRelevanceScore: z.number().min(0).max(1),
  rerankDropBelowScore: z.number().min(0).max(1),
  exactMatchBoostFloor: z.number().min(0).max(1),
  highConfidenceThreshold: z.number().min(0).max(1),
});
export type ScoreThresholds = z.infer<typeof ScoreThresholdsSchema>;

export const ProfileStatusSchema = z.enum(["active", "deprecated", "draft", "rollback-candidate"]);
export type ProfileStatus = z.infer<typeof ProfileStatusSchema>;

export const DomainProfileSchema = z.object({
  profileId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  domain: z.enum([
    "lyte_governance_ops",
    "vessels_maritime_risk",
    "terra_real_estate_intel",
    "aegis_security_incident",
    "prism_legal_matter",
    "carlota_private_advisory",
  ]),
  displayName: z.string(),
  description: z.string(),
  status: ProfileStatusSchema.default("active"),

  chunkingStrategy: ChunkingStrategySchema,

  queryPromptTemplate: PromptTemplateSchema,
  documentPromptTemplate: PromptTemplateSchema,

  defaultMetadataFilters: z.record(z.unknown()).default({}),
  exactMatchBoostTerms: z.array(z.string()).min(1),
  boostRuleIds: z.array(z.string()).default([]),

  rerankEnabled: z.boolean(),
  topK: z.number().int().positive(),
  maxCandidates: z.number().int().positive(),

  scoreThresholds: ScoreThresholdsSchema,
  privacyLevel: PrivacyLevelSchema,
  retentionRules: RetentionRulesSchema,

  deprecatedAt: z.string().datetime().optional(),
  deprecationMessage: z.string().optional(),
  successorProfileId: z.string().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DomainProfile = z.infer<typeof DomainProfileSchema>;

export const AEF_DOMAIN_PROFILE_DOMAINS = [
  "lyte_governance_ops",
  "vessels_maritime_risk",
  "terra_real_estate_intel",
  "aegis_security_incident",
  "prism_legal_matter",
  "carlota_private_advisory",
] as const;
export type AEFDomain = (typeof AEF_DOMAIN_PROFILE_DOMAINS)[number];
