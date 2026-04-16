import { z } from "zod";

export const MemoryTierSchema = z.enum([
  "session",
  "workflow",
  "entity",
  "artifact",
  "executive",
  "domain",
  "operator-feedback",
  "long-term",
]);

export const SensitivityLevelSchema = z.enum(["public", "internal", "confidential", "restricted"]);

export const MemoryProvenanceSchema = z.object({
  source: z.string(),
  sourceId: z.string().optional(),
  author: z.string().optional(),
  method: z.enum(["agent", "human", "import", "derived"]).default("agent"),
  createdAt: z.string().datetime(),
});

export const MemoryEntrySchema = z.object({
  id: z.string(),
  tier: MemoryTierSchema,
  key: z.string(),
  value: z.unknown(),
  provenance: MemoryProvenanceSchema,
  freshness: z.object({
    lastAccessedAt: z.string().datetime().optional(),
    lastUpdatedAt: z.string().datetime(),
    isStale: z.boolean().default(false),
  }),
  confidence: z.number().min(0).max(1).default(1),
  retention: z.object({
    policy: z.enum(["ephemeral", "session-scoped", "workflow-scoped", "persistent", "archival"]).default("persistent"),
    expiresAt: z.string().datetime().optional(),
    maxAgeDays: z.number().positive().optional(),
  }).default({ policy: "persistent" }),
  sensitivity: SensitivityLevelSchema.default("internal"),
  linkedEntities: z.array(z.string()).default([]),
  linkedTraces: z.array(z.string()).default([]),
  linkedActions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  scopeId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export type MemoryTier = z.infer<typeof MemoryTierSchema>;
export type SensitivityLevel = z.infer<typeof SensitivityLevelSchema>;
export type MemoryProvenance = z.infer<typeof MemoryProvenanceSchema>;
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
