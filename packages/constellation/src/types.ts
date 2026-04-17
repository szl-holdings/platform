import { z } from "zod";

export const CST_DOMAINS = [
  "terra",
  "prism",
  "vessels",
  "aegis",
  "lyte",
  "imperium",
  "carlota-jo",
  "platform",
] as const;
export type CstDomain = typeof CST_DOMAINS[number];

export const CST_SENSITIVITY_TIERS = [
  "public",
  "internal",
  "confidential",
  "restricted",
  "top_secret",
] as const;
export type CstSensitivityTier = typeof CST_SENSITIVITY_TIERS[number];

export const CST_PROVENANCE_SOURCE_TYPES = [
  "api",
  "feed",
  "manual",
  "agent",
  "system",
  "webhook",
  "import",
  "seed",
] as const;
export type CstProvenanceSourceType = typeof CST_PROVENANCE_SOURCE_TYPES[number];

export const CstProvenanceSchema = z.object({
  sourceId: z.string(),
  sourceType: z.enum(CST_PROVENANCE_SOURCE_TYPES),
  sourceLabel: z.string().optional(),
});
export type CstProvenance = z.infer<typeof CstProvenanceSchema>;

export const CstOwnerSchema = z.object({
  ownerId: z.string(),
  ownerType: z.enum(["human", "agent", "system", "organization"]),
  ownerOrgId: z.string().optional(),
});
export type CstOwner = z.infer<typeof CstOwnerSchema>;

export const CstNodeSchema = z.object({
  id: z.string().uuid(),
  canonicalId: z.string().uuid(),
  domain: z.enum(CST_DOMAINS),
  entityType: z.string().min(1),
  labels: z.array(z.string()).default([]),
  name: z.string().min(1),
  description: z.string().optional(),
  provenance: CstProvenanceSchema.optional(),
  freshness: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  owner: CstOwnerSchema.optional(),
  sensitivityTier: z.enum(CST_SENSITIVITY_TIERS).default("internal"),
  relatedActionIds: z.array(z.string()).default([]),
  relatedDocumentIds: z.array(z.string()).default([]),
  relatedExecutionIds: z.array(z.string()).default([]),
  relatedRiskIds: z.array(z.string()).default([]),
  extensions: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type CstNode = z.infer<typeof CstNodeSchema>;

export const CreateCstNodeSchema = CstNodeSchema.omit({
  id: true,
  canonicalId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  labels: true,
  provenance: true,
  owner: true,
  sensitivityTier: true,
  relatedActionIds: true,
  relatedDocumentIds: true,
  relatedExecutionIds: true,
  relatedRiskIds: true,
  extensions: true,
  isActive: true,
  freshness: true,
  confidence: true,
});
export type CreateCstNode = z.infer<typeof CreateCstNodeSchema>;

export const CstEdgeEvidenceSchema = z.object({
  id: z.string().uuid(),
  edgeId: z.string().uuid(),
  evidenceType: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  sourceId: z.string().optional(),
  sourceLabel: z.string().optional(),
  confidence: z.number().min(0).max(1),
  recordedBy: z.string().optional(),
  recordedAt: z.string().datetime(),
});
export type CstEdgeEvidence = z.infer<typeof CstEdgeEvidenceSchema>;

export const CstEdgeSchema = z.object({
  id: z.string().uuid(),
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  relationshipType: z.string().min(1),
  confidence: z.number().min(0).max(1),
  source: CstProvenanceSchema.optional(),
  active: z.boolean().default(true),
  extensions: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  evidence: z.array(CstEdgeEvidenceSchema).optional(),
});
export type CstEdge = z.infer<typeof CstEdgeSchema>;

export const CreateCstEdgeSchema = CstEdgeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  evidence: true,
}).partial({
  source: true,
  active: true,
  extensions: true,
  confidence: true,
});
export type CreateCstEdge = z.infer<typeof CreateCstEdgeSchema>;

export const AddCstEvidenceSchema = z.object({
  edgeId: z.string().uuid(),
  evidenceType: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  sourceId: z.string().optional(),
  sourceLabel: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  recordedBy: z.string().optional(),
});
export type AddCstEvidence = z.infer<typeof AddCstEvidenceSchema>;

export const CstQueryFiltersSchema = z.object({
  domain: z.enum(CST_DOMAINS).optional(),
  entityType: z.string().optional(),
  sensitivityTier: z.enum(CST_SENSITIVITY_TIERS).optional(),
  isActive: z.boolean().optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  labels: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});
export type CstQueryFilters = z.infer<typeof CstQueryFiltersSchema>;

export const CstRelationshipFiltersSchema = z.object({
  fromNodeId: z.string().uuid().optional(),
  toNodeId: z.string().uuid().optional(),
  relationshipType: z.string().optional(),
  active: z.boolean().optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  includeEvidence: z.boolean().default(false),
  limit: z.number().int().min(1).max(500).default(50),
  offset: z.number().int().min(0).default(0),
});
export type CstRelationshipFilters = z.infer<typeof CstRelationshipFiltersSchema>;

export const CstSearchParamsSchema = z.object({
  q: z.string().min(1),
  domain: z.enum(CST_DOMAINS).optional(),
  entityType: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});
export type CstSearchParams = z.infer<typeof CstSearchParamsSchema>;

export interface CstNodeTypeRegistration {
  domain: CstDomain;
  typeKey: string;
  displayName: string;
  description?: string;
  defaultSensitivity?: CstSensitivityTier;
}
