import { z } from 'zod';

export const BoostTermSchema = z.object({
  term: z.string().min(1),
  pattern: z.string(),
  multiplier: z.number().positive(),
  fieldHint: z.string().optional(),
});
export type BoostTerm = z.infer<typeof BoostTermSchema>;

export const ExactMatchFieldClassSchema = z.object({
  classId: z.string().min(1),
  description: z.string(),
  examplePatterns: z.array(z.string()).default([]),
  metadataField: z.string().optional(),
  boostMultiplier: z.number().positive().default(1.5),
});
export type ExactMatchFieldClass = z.infer<typeof ExactMatchFieldClassSchema>;

export const MetadataPresetSchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
);
export type MetadataPreset = z.infer<typeof MetadataPresetSchema>;

export const TruncationPolicySchema = z.object({
  strategy: z.enum(['reject', 'truncate']),
  maxTokens: z.number().int().positive().default(512),
  warnAtTokens: z.number().int().positive().optional(),
});
export type TruncationPolicy = z.infer<typeof TruncationPolicySchema>;

export const DomainProfileSchema = z.object({
  profileId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  domain: z.enum(['maritime', 'legal', 'real-estate', 'cyber', 'compliance', 'advisory']),
  displayName: z.string(),
  description: z.string(),
  priorityTerms: z.array(z.string()).default([]),
  boostTerms: z.array(BoostTermSchema).default([]),
  exactMatchFieldClasses: z.array(ExactMatchFieldClassSchema).default([]),
  defaultMetadataFilters: MetadataPresetSchema.default({}),
  rerankEnabled: z.boolean().default(false),
  maxCandidates: z.number().int().positive().default(100),
  maxResults: z.number().int().positive().default(10),
  denseWeight: z.number().min(0).max(1).default(0.6),
  keywordWeight: z.number().min(0).max(1).default(0.4),
  truncationPolicy: TruncationPolicySchema.default({
    strategy: 'truncate',
    maxTokens: 512,
  }),
  promptContextPrefix: z.string().optional(),
  retentionDays: z.number().int().positive().default(90),
  provenanceRequired: z.boolean().default(false),
  allowedTenantIds: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).default({}),
});
export type DomainProfile = z.infer<typeof DomainProfileSchema>;

export const ProfileVersionRecordSchema = z.object({
  profileId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  profile: DomainProfileSchema,
  stagedFor: z.array(z.string()).default([]),
  publishedAt: z.string().datetime(),
  deprecatedAt: z.string().datetime().optional(),
});
export type ProfileVersionRecord = z.infer<typeof ProfileVersionRecordSchema>;

export const RolloutStateSchema = z.object({
  profileId: z.string().min(1),
  activeVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  stagedVersion: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/)
    .optional(),
  stagedTenantIds: z.array(z.string()).default([]),
  rolloutStartedAt: z.string().datetime().optional(),
});
export type RolloutState = z.infer<typeof RolloutStateSchema>;
