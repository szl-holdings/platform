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
import { organizationsTable } from './organizations';

export const alloyLegacyPoliciesTable = pgTable(
  'alloy_policies',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    policyType: text('policy_type', {
      enum: [
        'approval_matrix',
        'model_routing',
        'cost_ceiling',
        'agent_permission',
        'data_access',
        'compliance_template',
      ],
    }).notNull(),
    scope: text('scope', {
      enum: ['global', 'tenant', 'team', 'user'],
    })
      .notNull()
      .default('tenant'),
    rules: jsonb('rules').notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    priority: integer('priority').notNull().default(100),
    complianceFramework: text('compliance_framework'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('alloy_policies_org_idx').on(table.orgId),
    index('alloy_policies_type_idx').on(table.policyType),
    index('alloy_policies_active_idx').on(table.isActive),
  ],
);

export const modelRoutingPoliciesTable = pgTable(
  'model_routing_policies',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    modelProvider: text('model_provider').notNull(),
    modelId: text('model_id').notNull(),
    taskCategories: jsonb('task_categories').notNull().default([]),
    maxCostPerCall: numeric('max_cost_per_call', { precision: 10, scale: 4 }),
    isAllowed: boolean('is_allowed').notNull().default(true),
    isDefault: boolean('is_default').notNull().default(false),
    priority: integer('priority').notNull().default(100),
    environment: text('environment', {
      enum: ['development', 'staging', 'production'],
    })
      .notNull()
      .default('production'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('model_routing_org_idx').on(table.orgId),
    index('model_routing_provider_idx').on(table.modelProvider),
  ],
);

export const costBudgetsTable = pgTable(
  'cost_budgets',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    budgetType: text('budget_type', {
      enum: ['monthly', 'weekly', 'daily', 'per_workflow'],
    })
      .notNull()
      .default('monthly'),
    limitAmount: numeric('limit_amount', { precision: 12, scale: 2 }).notNull(),
    currentSpend: numeric('current_spend', { precision: 12, scale: 2 }).notNull().default('0'),
    warnThreshold: numeric('warn_threshold', { precision: 5, scale: 2 }).notNull().default('0.80'),
    hardStopThreshold: numeric('hard_stop_threshold', { precision: 5, scale: 2 })
      .notNull()
      .default('1.00'),
    alertSent80: boolean('alert_sent_80').notNull().default(false),
    alertSent100: boolean('alert_sent_100').notNull().default(false),
    periodStart: timestamp('period_start').notNull().defaultNow(),
    periodEnd: timestamp('period_end'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('cost_budgets_org_idx').on(table.orgId),
    index('cost_budgets_active_idx').on(table.isActive),
  ],
);

export const costEventsTable = pgTable(
  'cost_events',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    budgetId: integer('budget_id').references(() => costBudgetsTable.id, { onDelete: 'set null' }),
    eventType: text('event_type', {
      enum: ['agent_run', 'skill_invocation', 'model_call', 'browser_task', 'artifact_generation'],
    }).notNull(),
    resourceId: text('resource_id'),
    resourceName: text('resource_name'),
    modelProvider: text('model_provider'),
    modelId: text('model_id'),
    tokensIn: integer('tokens_in').default(0),
    tokensOut: integer('tokens_out').default(0),
    costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).notNull().default('0'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('cost_events_org_idx').on(table.orgId),
    index('cost_events_budget_idx').on(table.budgetId),
    index('cost_events_type_idx').on(table.eventType),
    index('cost_events_created_idx').on(table.createdAt),
  ],
);

export const governanceIncidentsTable = pgTable(
  'governance_incidents',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    policyId: integer('policy_id').references(() => alloyLegacyPoliciesTable.id, {
      onDelete: 'set null',
    }),
    severity: text('severity', {
      enum: ['critical', 'high', 'medium', 'low', 'info'],
    })
      .notNull()
      .default('medium'),
    incidentType: text('incident_type', {
      enum: [
        'policy_violation',
        'budget_exceeded',
        'unauthorized_access',
        'agent_error',
        'manual_override',
        'data_breach_attempt',
      ],
    }).notNull(),
    title: text('title').notNull(),
    description: text('description'),
    agentId: text('agent_id'),
    userId: text('user_id'),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    resolution: text('resolution'),
    resolvedBy: text('resolved_by'),
    resolvedAt: timestamp('resolved_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('gov_incidents_org_idx').on(table.orgId),
    index('gov_incidents_severity_idx').on(table.severity),
    index('gov_incidents_type_idx').on(table.incidentType),
    index('gov_incidents_created_idx').on(table.createdAt),
  ],
);

export type AlloyLegacyPolicy = typeof alloyLegacyPoliciesTable.$inferSelect;
export type InsertAlloyLegacyPolicy = typeof alloyLegacyPoliciesTable.$inferInsert;
export type ModelRoutingPolicy = typeof modelRoutingPoliciesTable.$inferSelect;
export type InsertModelRoutingPolicy = typeof modelRoutingPoliciesTable.$inferInsert;
export type CostBudget = typeof costBudgetsTable.$inferSelect;
export type InsertCostBudget = typeof costBudgetsTable.$inferInsert;
export type CostEvent = typeof costEventsTable.$inferSelect;
export type InsertCostEvent = typeof costEventsTable.$inferInsert;
export type GovernanceIncident = typeof governanceIncidentsTable.$inferSelect;
export type InsertGovernanceIncident = typeof governanceIncidentsTable.$inferInsert;
