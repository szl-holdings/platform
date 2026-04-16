import { z } from "zod";

export const SensitivityTierSchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
  "top-secret",
]);

export const NodeTypeSchema = z.enum([
  "entity",
  "asset",
  "event",
  "signal",
  "risk",
  "opportunity",
  "control",
  "workflow",
  "agent",
  "tool",
  "policy",
  "document",
  "parcel",
  "vessel",
  "matter",
  "person",
  "organization",
  "custom",
]);

export const EdgeTypeSchema = z.enum([
  "relates-to",
  "depends-on",
  "triggers",
  "mitigates",
  "owns",
  "managed-by",
  "derived-from",
  "affects",
  "linked-trace",
  "similar-to",
  "supersedes",
  "custom",
]);

export const ProvenanceSchema = z.object({
  source: z.string(),
  sourceId: z.string().optional(),
  ingestedAt: z.string().datetime(),
  method: z.enum(["api", "manual", "agent", "import", "derived"]).default("api"),
  confidence: z.number().min(0).max(1).default(1),
  author: z.string().optional(),
});

export const ConstellationNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  label: z.string(),
  domain: z.string(),
  properties: z.record(z.unknown()).default({}),
  provenance: ProvenanceSchema,
  freshness: z.object({
    lastUpdatedAt: z.string().datetime(),
    ttlSeconds: z.number().positive().optional(),
    isStale: z.boolean().default(false),
  }),
  confidence: z.number().min(0).max(1).default(1),
  owner: z.string().optional(),
  sensitivityTier: SensitivityTierSchema.default("internal"),
  businessImpact: z.object({
    score: z.number().min(0).max(10).optional(),
    currency: z.string().optional(),
    estimatedValue: z.number().optional(),
    impactDescription: z.string().optional(),
  }).optional(),
  linkedTraces: z.array(z.string()).default([]),
  linkedActions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ConstellationEdgeSchema = z.object({
  id: z.string(),
  type: EdgeTypeSchema,
  fromNodeId: z.string(),
  toNodeId: z.string(),
  label: z.string().optional(),
  weight: z.number().default(1),
  provenance: ProvenanceSchema,
  confidence: z.number().min(0).max(1).default(1),
  properties: z.record(z.unknown()).default({}),
  linkedTraces: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SensitivityTier = z.infer<typeof SensitivityTierSchema>;
export type NodeType = z.infer<typeof NodeTypeSchema>;
export type EdgeType = z.infer<typeof EdgeTypeSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;
export type ConstellationNode = z.infer<typeof ConstellationNodeSchema>;
export type ConstellationEdge = z.infer<typeof ConstellationEdgeSchema>;
