import { boolean, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * NEXUS state persistence (Task #2470).
 *
 * Memory items already persist via `nexus_memory`. The remaining NEXUS
 * stores — skills, protocol bridge tools, orchestration plans, and
 * ingest jobs — used to live only in JS memory and were wiped on every
 * api-server restart. These tables let user-curated state (skill toggle
 * state, custom MCP tools, in-flight orchestrations, ingest history)
 * survive restarts the same way memory does. The in-memory `Map` stores
 * in `routes/nexus.ts` are now hot read caches hydrated from these
 * tables on startup; every mutation is mirrored back to Postgres.
 */

// ─── Skills ───────────────────────────────────────────────────────────────────

export const NEXUS_SKILL_PRIMITIVE_TYPES = [
  'Skill',
  'Hook',
  'Command',
  'Agent',
  'MemorySchema',
  'RAGStrategy',
  'Tool',
] as const;

export type NexusSkillPrimitiveType = (typeof NEXUS_SKILL_PRIMITIVE_TYPES)[number];

export const nexusSkillsTable = pgTable(
  'nexus_skills',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    sourceRepo: text('source_repo').notNull().default(''),
    sourceUrl: text('source_url').notNull().default(''),
    license: text('license').notNull().default(''),
    pattern: text('pattern').notNull().default(''),
    primitiveType: text('primitive_type', { enum: NEXUS_SKILL_PRIMITIVE_TYPES })
      .notNull()
      .default('Skill'),
    enabled: boolean('enabled').notNull().default(false),
    usageCount: integer('usage_count').notNull().default(0),
    nexusAdaptation: text('nexus_adaptation').notNull().default(''),
    originalSummary: text('original_summary').notNull().default(''),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    isCustom: boolean('is_custom').notNull().default(false),
    lastModifiedAt: timestamp('last_modified_at'),
    lastModifiedBy: text('last_modified_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('nexus_skills_enabled_idx').on(t.enabled),
    index('nexus_skills_pattern_idx').on(t.pattern),
    index('nexus_skills_primitive_idx').on(t.primitiveType),
    index('nexus_skills_custom_idx').on(t.isCustom),
  ],
);

export type NexusSkillRow = typeof nexusSkillsTable.$inferSelect;
export type NexusSkillInsert = typeof nexusSkillsTable.$inferInsert;

// ─── Protocol bridge tools ────────────────────────────────────────────────────

export const NEXUS_TOOL_PROTOCOLS = ['MCP', 'A2A', 'ACP', 'ANP'] as const;
export type NexusToolProtocol = (typeof NEXUS_TOOL_PROTOCOLS)[number];

export const nexusProtocolToolsTable = pgTable(
  'nexus_protocol_tools',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    protocol: text('protocol', { enum: NEXUS_TOOL_PROTOCOLS }).notNull(),
    domain: text('domain').notNull().default(''),
    inputSchema: jsonb('input_schema').$type<Record<string, unknown>>().notNull().default({}),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    isCustom: boolean('is_custom').notNull().default(false),
    lastModifiedAt: timestamp('last_modified_at'),
    lastModifiedBy: text('last_modified_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('nexus_protocol_tools_protocol_idx').on(t.protocol),
    index('nexus_protocol_tools_domain_idx').on(t.domain),
    index('nexus_protocol_tools_custom_idx').on(t.isCustom),
  ],
);

export type NexusProtocolToolRow = typeof nexusProtocolToolsTable.$inferSelect;
export type NexusProtocolToolInsert = typeof nexusProtocolToolsTable.$inferInsert;

// ─── Orchestration plans ──────────────────────────────────────────────────────

export const NEXUS_ORCHESTRATION_STATUSES = ['planning', 'running', 'completed', 'failed'] as const;
export type NexusOrchestrationStatus = (typeof NEXUS_ORCHESTRATION_STATUSES)[number];

export interface NexusOrchestrationStepData {
  id: string;
  app: string;
  appSlug: string;
  action: string;
  endpoint: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output?: string;
  durationMs?: number;
}

export const nexusOrchestrationPlansTable = pgTable(
  'nexus_orchestration_plans',
  {
    id: text('id').primaryKey(),
    intent: text('intent').notNull(),
    status: text('status', { enum: NEXUS_ORCHESTRATION_STATUSES }).notNull().default('planning'),
    steps: jsonb('steps').$type<NexusOrchestrationStepData[]>().notNull().default([]),
    stitchedOutput: text('stitched_output'),
    /** Email or user-id string of the authenticated caller who created this plan. */
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('nexus_orchestration_plans_status_idx').on(t.status),
    index('nexus_orchestration_plans_created_idx').on(t.createdAt),
  ],
);

export type NexusOrchestrationPlanRow = typeof nexusOrchestrationPlansTable.$inferSelect;
export type NexusOrchestrationPlanInsert = typeof nexusOrchestrationPlansTable.$inferInsert;

// ─── Ingest jobs ──────────────────────────────────────────────────────────────

export const NEXUS_INGEST_STATUSES = [
  'queued',
  'fetching',
  'adapting',
  'publishing',
  'done',
  'failed',
] as const;
export type NexusIngestStatus = (typeof NEXUS_INGEST_STATUSES)[number];

export const nexusIngestJobsTable = pgTable(
  'nexus_ingest_jobs',
  {
    id: text('id').primaryKey(),
    repoUrl: text('repo_url').notNull(),
    repoName: text('repo_name').notNull(),
    status: text('status', { enum: NEXUS_INGEST_STATUSES }).notNull().default('queued'),
    skillsGenerated: integer('skills_generated').notNull().default(0),
    patternsFound: jsonb('patterns_found').$type<string[]>().notNull().default([]),
    log: jsonb('log').$type<string[]>().notNull().default([]),
    error: text('error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('nexus_ingest_jobs_status_idx').on(t.status),
    index('nexus_ingest_jobs_created_idx').on(t.createdAt),
  ],
);

export type NexusIngestJobRow = typeof nexusIngestJobsTable.$inferSelect;
export type NexusIngestJobInsert = typeof nexusIngestJobsTable.$inferInsert;
