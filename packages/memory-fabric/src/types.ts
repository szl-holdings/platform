import { z } from "zod";

export const MemoryTypeSchema = z.enum([
  "working",
  "session",
  "episodic",
  "semantic",
  "workflow",
  "entity",
  "artifact",
  "operator-feedback",
  "executive",
  "skill",
]);

export const MemoryTierSchema = MemoryTypeSchema;

export const SensitivityLevelSchema = z.enum(["public", "internal", "confidential", "restricted"]);

/**
 * Canonical fallback domain for memory entries that genuinely don't belong
 * to any single product domain (e.g. cross-cutting platform telemetry).
 *
 * Every memory writer must set `domain` explicitly. Use this constant rather
 * than passing `""` or omitting the field — `MemoryEntrySchema` rejects empty
 * strings so the runtime guarantee that "every memory has a domain tag" holds.
 */
export const MEMORY_DOMAIN_UNKNOWN = "unknown" as const;

/**
 * Known product/operational domains that the executive briefing engine and
 * other domain-scoped queries match against. Writers SHOULD pick one of these
 * when the memory belongs to a single product. The list is informational —
 * `domain` is a free-form string so new domains can be added without a code
 * change here. The runtime check in `MemoryEntrySchema` only requires that
 * `domain` is a non-empty string.
 */
export const KNOWN_MEMORY_DOMAINS = [
  "vessels",
  "aegis",
  "terra",
  "lyte",
  "prism",
  "carlota",
  "sentra",
  "szl-holdings",
  "platform",
  "consolidated",
  MEMORY_DOMAIN_UNKNOWN,
] as const;

export type KnownMemoryDomain = (typeof KNOWN_MEMORY_DOMAINS)[number];

/**
 * Zod refinement that enforces the "every memory record has a domain tag"
 * invariant. Exported separately so other writer code paths (e.g. raw
 * `memoryRecordsTable` inserts that bypass `MemoryEntrySchema`) can call it
 * without re-implementing the check.
 */
export const MemoryDomainSchema = z
  .string()
  .min(1, "memory.domain is required — pass MEMORY_DOMAIN_UNKNOWN if truly unscoped");

export const MemoryProvenanceSchema = z.object({
  source: z.string(),
  sourceId: z.string().optional(),
  author: z.string().optional(),
  method: z.enum(["agent", "human", "import", "derived"]).default("agent"),
  createdAt: z.string().datetime(),
});

export const MemoryEntrySchema = z.object({
  id: z.string(),
  tier: MemoryTypeSchema,
  memoryType: MemoryTypeSchema.optional(),
  key: z.string(),
  value: z.unknown(),
  summary: z.string().optional(),
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
    pinned: z.boolean().default(false),
  }).default({ policy: "persistent" }),
  sensitivity: SensitivityLevelSchema.default("internal"),
  linkedEntities: z.array(z.string()).default([]),
  linkedTraces: z.array(z.string()).default([]),
  linkedActions: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  scopeId: z.string().optional(),
  /**
   * Canonical product/operational domain this memory belongs to. Required —
   * use `MEMORY_DOMAIN_UNKNOWN` for entries that genuinely span domains. The
   * memory store mirrors this into `metadata.domain` and `scope_id` on write
   * so that domain-scoped queries (executive briefings, dashboards) can match
   * on a single canonical field.
   */
  domain: MemoryDomainSchema,
  metadata: z.record(z.unknown()).default({}),
});

export type MemoryType = z.infer<typeof MemoryTypeSchema>;
export type MemoryTier = MemoryType;
export type SensitivityLevel = z.infer<typeof SensitivityLevelSchema>;
export type MemoryProvenance = z.infer<typeof MemoryProvenanceSchema>;
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;
