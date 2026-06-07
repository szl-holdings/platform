import { z } from 'zod';

export const TenantIdSchema = z.string().min(1).brand('TenantId');
export type TenantId = z.infer<typeof TenantIdSchema>;

export const TenantIdentitySchema = z.object({
  tenantId: TenantIdSchema,
  displayName: z.string().optional(),
  allowedDomains: z.array(z.string()).default([]),
  allowedProfiles: z.array(z.string()).default([]),
  retentionDays: z.number().int().positive().default(90),
  provenanceRequired: z.boolean().default(false),
});
export type TenantIdentity = z.infer<typeof TenantIdentitySchema>;

export const ProfileDescriptorSchema = z.object({
  profileId: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  domain: z.enum(['maritime', 'legal', 'real-estate', 'cyber', 'compliance', 'general']),
  displayName: z.string(),
  description: z.string().optional(),
  promptTransformHook: z.string().optional(),
  boostRuleIds: z.array(z.string()).default([]),
  defaultMetadataFilters: z.record(z.unknown()).default({}),
  rerankEnabled: z.boolean().default(false),
  maxCandidates: z.number().int().positive().default(100),
  maxResults: z.number().int().positive().default(10),
});
export type ProfileDescriptor = z.infer<typeof ProfileDescriptorSchema>;
