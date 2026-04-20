import { z } from "zod";

export const AutonomyTierSchema = z.enum([
  "human-approval-mandatory",
  "human-in-the-loop",
  "supervised-autonomy",
  "full-autonomy",
]);
export type AutonomyTier = z.infer<typeof AutonomyTierSchema>;

export const VerifierStatusSchema = z.enum(["passed", "revision_required", "pending"]);
export type VerifierStatus = z.infer<typeof VerifierStatusSchema>;

export const CitationSchema = z.object({
  id: z.string(),
  sourceType: z.enum(["entity", "memory", "reflection", "signal", "trace"]),
  sourceId: z.string(),
  domain: z.string().optional(),
  quote: z.string().optional(),
  freshness: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  verified: z.boolean().default(false),
});
export type Citation = z.infer<typeof CitationSchema>;

export const BeliefStatementSchema = z.object({
  id: z.string(),
  claim: z.string(),
  confidence: z.number().min(0).max(1),
  citationIds: z.array(z.string()),
  supported: z.boolean().default(true),
  caveats: z.array(z.string()).default([]),
});
export type BeliefStatement = z.infer<typeof BeliefStatementSchema>;

export const RecommendedActionSchema = z.object({
  id: z.string(),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  action: z.string(),
  rationale: z.string(),
  owner: z.string().optional(),
  dueBy: z.string().optional(),
  autonomyTier: AutonomyTierSchema,
  citationIds: z.array(z.string()).default([]),
});
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;

export const EntityProvenanceSchema = z.object({
  entityId: z.string(),
  entityType: z.string(),
  domain: z.string(),
  confidence: z.number().min(0).max(1),
  lastSeen: z.string().optional(),
});
export type EntityProvenance = z.infer<typeof EntityProvenanceSchema>;

export const BriefSectionSchema = z.object({
  id: z.string(),
  domain: z.string(),
  title: z.string(),
  agentId: z.string(),
  situation: z.string(),
  beliefs: z.array(BeliefStatementSchema),
  gaps: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  freshness: z.string(),
});
export type BriefSection = z.infer<typeof BriefSectionSchema>;

export const StructuredExecutiveBriefSchema = z.object({
  id: z.string(),
  domain: z.string(),
  generatedAt: z.string(),
  briefingId: z.string().optional(),
  headline: z.string(),
  situation: z.string(),
  whatWeBelieve: z.array(BeliefStatementSchema),
  whyCitations: z.array(CitationSchema),
  whatWeRecommend: z.array(RecommendedActionSchema),
  autonomyTier: AutonomyTierSchema,
  confidence: z.number().min(0).max(1),
  overallRisk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  verifierStatus: VerifierStatusSchema,
  verifierFeedback: z.string().nullable().optional(),
  sourceTraceIds: z.array(z.string()).default([]),
  entityProvenance: z.array(EntityProvenanceSchema).default([]),
  sections: z.array(BriefSectionSchema).default([]),
});
export type StructuredExecutiveBrief = z.infer<typeof StructuredExecutiveBriefSchema>;

export interface WorldModelEntity {
  id: string;
  entityType: string;
  domain: string;
  confidence: number;
  attributes: Record<string, unknown>;
  freshness?: Date;
  isActive: boolean;
  /** Constellation canonical id (stable across re-imports), used for citation links. */
  canonicalId?: string;
  /** Human-readable name used as the citation `quote`. */
  name?: string;
  /** True when this entity was reached via constellation edge traversal rather than the root domain query. */
  isNeighbor?: boolean;
}

export interface WorldModelEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: string;
  confidence: number;
  fromDomain?: string;
  toDomain?: string;
  /** True when the edge connects two different domains. */
  crossDomain?: boolean;
}

export interface MemoryEntry {
  id: string;
  memoryType: string;
  content: string;
  confidence: number;
  provenance: string;
  createdAt?: Date;
}

export interface RecentReflection {
  id: string;
  qualityScore: number;
  lesson?: string;
  whatWorked?: string[];
  whatFailed?: string[];
  createdAt?: Date;
  domain?: string;
}

export interface BriefGenerationContext {
  domain: string;
  entities: WorldModelEntity[];
  memories: MemoryEntry[];
  reflections: RecentReflection[];
  crossDomainEdgeCount?: number;
  /** Concrete edges traversed from the constellation around the brief's entities. */
  edges?: WorldModelEdge[];
  generatedAt: string;
}
