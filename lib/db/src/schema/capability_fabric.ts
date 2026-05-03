import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations';
import { usersTable } from './auth';

/**
 * A11OY Capability Fabric — Unified AI Operating System (Task #3553)
 *
 * Catalog of every governed AI capability domain exposed by the SZL platform.
 * Each row maps a high-level capability (e.g. "Presentation generation",
 * "Email intelligence", "Image generation") to the Nuro Mesh agent that owns
 * it, the available tools, governance tier, and live usage metrics.
 *
 * The Universal Prompt Router scores natural-language prompts against this
 * registry to pick the right agent, then executes through the existing
 * Substrate pipeline so every invocation produces a governed decision receipt.
 */

export const CAPABILITY_DOMAINS = [
  'presentation',
  'chatbots',
  'email',
  'code',
  'spreadsheet',
  'image_generation',
  'workflow_automation',
  'graphic_design',
  'scheduling',
  'writing',
  'meeting_notes',
  'video_generation',
  'knowledge_management',
  'data_visualization',
  'general_intelligence',
] as const;

export type CapabilityDomain = (typeof CAPABILITY_DOMAINS)[number];

export const CAPABILITY_GOVERNANCE_TIERS = ['sovereign', 'governed', 'autonomous'] as const;
export type CapabilityGovernanceTier = (typeof CAPABILITY_GOVERNANCE_TIERS)[number];

export const CAPABILITY_HEALTH_STATUS = ['healthy', 'degraded', 'offline'] as const;
export type CapabilityHealthStatus = (typeof CAPABILITY_HEALTH_STATUS)[number];

export const capabilityRegistryTable = pgTable(
  'capability_registry',
  {
    id: serial('id').primaryKey(),
    domain: text('domain', { enum: CAPABILITY_DOMAINS }).notNull().unique(),
    displayName: text('display_name').notNull(),
    description: text('description').notNull(),
    agentId: text('agent_id').notNull(),
    governanceTier: text('governance_tier', { enum: CAPABILITY_GOVERNANCE_TIERS })
      .notNull()
      .default('governed'),
    semanticIntents: jsonb('semantic_intents').$type<string[]>().notNull().default([]),
    keywords: jsonb('keywords').$type<string[]>().notNull().default([]),
    tools: jsonb('tools').$type<string[]>().notNull().default([]),
    crossDomainLinks: jsonb('cross_domain_links').$type<string[]>().notNull().default([]),
    health: text('health', { enum: CAPABILITY_HEALTH_STATUS }).notNull().default('healthy'),
    invocations: integer('invocations').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    failureCount: integer('failure_count').notNull().default(0),
    avgLatencyMs: integer('avg_latency_ms').notNull().default(0),
    avgConfidence: numeric('avg_confidence', { precision: 5, scale: 4 })
      .notNull()
      .default('0.0'),
    lastInvokedAt: timestamp('last_invoked_at'),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('capability_registry_domain_idx').on(t.domain),
    index('capability_registry_agent_idx').on(t.agentId),
    index('capability_registry_tier_idx').on(t.governanceTier),
    index('capability_registry_active_idx').on(t.isActive),
  ],
);

/**
 * Per-invocation log. Every Universal Prompt Router execution writes a row
 * here with the routing decision (which capability won, scores against all
 * domains), the agent invoked, latency, confidence, and the cross-domain
 * memory entities that were pulled in to enrich the response.
 *
 * Linked to the Decision Fabric via decisionRecordId so operators can pivot
 * from a capability invocation into the full governed decision receipt.
 */
export const capabilityInvocationsTable = pgTable(
  'capability_invocations',
  {
    id: serial('id').primaryKey(),
    invocationId: text('invocation_id').notNull().unique(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    prompt: text('prompt').notNull(),
    selectedDomain: text('selected_domain', { enum: CAPABILITY_DOMAINS }).notNull(),
    selectedAgentId: text('selected_agent_id').notNull(),
    routingScores: jsonb('routing_scores')
      .$type<Array<{ domain: string; score: number; agentId: string }>>()
      .notNull()
      .default([]),
    response: text('response'),
    confidence: numeric('confidence', { precision: 5, scale: 4 }),
    latencyMs: integer('latency_ms').notNull().default(0),
    tokensUsed: integer('tokens_used').notNull().default(0),
    crossDomainContext: jsonb('cross_domain_context')
      .$type<
        Array<{ domain: string; entityType?: string; entityId?: string; snippet: string }>
      >()
      .notNull()
      .default([]),
    decisionRecordId: integer('decision_record_id'),
    traceId: text('trace_id'),
    status: text('status', { enum: ['ok', 'failed', 'blocked'] }).notNull().default('ok'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('capability_invocations_domain_idx').on(t.selectedDomain),
    index('capability_invocations_org_idx').on(t.orgId),
    index('capability_invocations_user_idx').on(t.userId),
    index('capability_invocations_status_idx').on(t.status),
    index('capability_invocations_created_idx').on(t.createdAt),
  ],
);

/**
 * Knowledge sources harvested from curated GitHub repositories and indexed
 * into the Capability Fabric. The harvest pipeline classifies each source
 * against one or more capability domains so operators can browse the patterns
 * (architecture, prompt techniques, evaluation strategies) that informed each
 * agent's design.
 *
 * Linked to nexus_memory rows via nexusMemoryId so the indexed knowledge
 * is queryable through the memory fabric in addition to this registry.
 */
export const capabilityKnowledgeSourcesTable = pgTable(
  'capability_knowledge_sources',
  {
    id: serial('id').primaryKey(),
    sourceId: text('source_id').notNull().unique(),
    repo: text('repo').notNull(),
    repoUrl: text('repo_url').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    domains: jsonb('domains').$type<CapabilityDomain[]>().notNull().default([]),
    patterns: jsonb('patterns').$type<string[]>().notNull().default([]),
    confidence: numeric('confidence', { precision: 5, scale: 4 }).notNull().default('0.5'),
    starsCount: integer('stars_count').notNull().default(0),
    license: text('license').notNull().default(''),
    nexusMemoryId: text('nexus_memory_id'),
    harvestedAt: timestamp('harvested_at').notNull().defaultNow(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    index('capability_knowledge_repo_idx').on(t.repo),
    index('capability_knowledge_harvested_idx').on(t.harvestedAt),
  ],
);

export const insertCapabilityRegistrySchema = createInsertSchema(capabilityRegistryTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCapabilityRegistry = z.infer<typeof insertCapabilityRegistrySchema>;
export type CapabilityRegistryRow = typeof capabilityRegistryTable.$inferSelect;

export const insertCapabilityInvocationSchema = createInsertSchema(
  capabilityInvocationsTable,
).omit({ id: true, createdAt: true });
export type InsertCapabilityInvocation = z.infer<typeof insertCapabilityInvocationSchema>;
export type CapabilityInvocationRow = typeof capabilityInvocationsTable.$inferSelect;

export const insertCapabilityKnowledgeSourceSchema = createInsertSchema(
  capabilityKnowledgeSourcesTable,
).omit({ id: true, harvestedAt: true });
export type InsertCapabilityKnowledgeSource = z.infer<
  typeof insertCapabilityKnowledgeSourceSchema
>;
export type CapabilityKnowledgeSourceRow = typeof capabilityKnowledgeSourcesTable.$inferSelect;
