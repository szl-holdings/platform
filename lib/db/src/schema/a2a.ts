import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const a2aAgentCards = pgTable('a2a_agent_cards', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull().unique(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  version: text('version').notNull().default('1.0.0'),
  description: text('description').notNull().default(''),
  capabilities: text('capabilities').array().notNull().default([]),
  inputSchema: jsonb('input_schema'),
  outputSchema: jsonb('output_schema'),
  preferredModel: text('preferred_model').notNull(),
  preferredProvider: text('preferred_provider').notNull(),
  collaboratesWith: text('collaborates_with').array().notNull().default([]),
  costPerCallUsd: real('cost_per_call_usd').notNull().default(0.001),
  avgLatencyMs: integer('avg_latency_ms').notNull().default(2000),
  successRate: real('success_rate').notNull().default(0.95),
  status: text('status').notNull().default('online'),
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }).defaultNow().notNull(),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata'),
});

export const a2aDelegationTasks = pgTable('a2a_delegation_tasks', {
  id: serial('id').primaryKey(),
  taskId: text('task_id').notNull().unique(),
  requestingAgentId: text('requesting_agent_id').notNull(),
  targetAgentId: text('target_agent_id').notNull(),
  query: text('query').notNull(),
  context: text('context').notNull().default(''),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('normal'),
  result: text('result'),
  resultConfidence: real('result_confidence'),
  errorMessage: text('error_message'),
  timeoutMs: integer('timeout_ms').notNull().default(30000),
  requestedAt: bigint('requested_at', { mode: 'number' }).notNull(),
  acceptedAt: bigint('accepted_at', { mode: 'number' }),
  completedAt: bigint('completed_at', { mode: 'number' }),
  durationMs: integer('duration_ms'),
  retryCount: integer('retry_count').notNull().default(0),
  orchestrationId: text('orchestration_id'),
  metadata: jsonb('metadata'),
});

export const a2aAgentHeartbeats = pgTable('a2a_agent_heartbeats', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  status: text('status').notNull().default('online'),
  load: real('load').notNull().default(0),
  activeTasks: integer('active_tasks').notNull().default(0),
  uptimeMs: bigint('uptime_ms', { mode: 'number' }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
});

export const a2aDiscoveryQueries = pgTable('a2a_discovery_queries', {
  id: serial('id').primaryKey(),
  queryId: text('query_id').notNull().unique(),
  requestingAgentId: text('requesting_agent_id').notNull(),
  capability: text('capability'),
  domain: text('domain'),
  queryText: text('query_text'),
  resultCount: integer('result_count').notNull().default(0),
  topMatchAgentId: text('top_match_agent_id'),
  executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow().notNull(),
});

export type A2AAgentCard = typeof a2aAgentCards.$inferSelect;
export type InsertA2AAgentCard = typeof a2aAgentCards.$inferInsert;
export type A2ADelegationTask = typeof a2aDelegationTasks.$inferSelect;
export type InsertA2ADelegationTask = typeof a2aDelegationTasks.$inferInsert;
export type A2AAgentHeartbeat = typeof a2aAgentHeartbeats.$inferSelect;
