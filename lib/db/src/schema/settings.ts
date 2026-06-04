import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { usersTable } from './auth';
import { organizationsTable } from './organizations';

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1: Platform-wide defaults  (super_admin only)
// ─────────────────────────────────────────────────────────────────────────────

export const platformSettingsTable = pgTable(
  'platform_settings',
  {
    id: serial('id').primaryKey(),
    namespace: text('namespace').notNull(),
    key: text('key').notNull(),
    value: jsonb('value'),
    valueType: text('value_type', { enum: ['string', 'number', 'boolean', 'json'] })
      .notNull()
      .default('string'),
    label: text('label'),
    description: text('description'),
    category: text('category').notNull().default('general'),
    isPublic: boolean('is_public').notNull().default(false),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    updatedBy: integer('updated_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('platform_settings_ns_key_uq').on(t.namespace, t.key)],
);

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2: Tenant (org) overrides
// ─────────────────────────────────────────────────────────────────────────────

export const tenantSettingsTable = pgTable(
  'tenant_settings',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    namespace: text('namespace').notNull(),
    key: text('key').notNull(),
    value: jsonb('value'),
    valueType: text('value_type', { enum: ['string', 'number', 'boolean', 'json'] })
      .notNull()
      .default('string'),
    label: text('label'),
    category: text('category').notNull().default('general'),
    createdBy: integer('created_by').references(() => usersTable.id, { onDelete: 'set null' }),
    updatedBy: integer('updated_by').references(() => usersTable.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('tenant_settings_org_ns_key_uq').on(t.orgId, t.namespace, t.key),
    index('tenant_settings_org_idx').on(t.orgId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3: User-level preferences
// ─────────────────────────────────────────────────────────────────────────────

export const userSettingsTable = pgTable(
  'user_settings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    namespace: text('namespace').notNull(),
    key: text('key').notNull(),
    value: jsonb('value'),
    valueType: text('value_type', { enum: ['string', 'number', 'boolean', 'json'] })
      .notNull()
      .default('string'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_settings_user_org_ns_key_uq').on(t.userId, t.orgId, t.namespace, t.key),
    index('user_settings_user_idx').on(t.userId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT: Every settings write is logged
// ─────────────────────────────────────────────────────────────────────────────

export const settingsAuditLogTable = pgTable(
  'settings_audit_log',
  {
    id: serial('id').primaryKey(),
    tier: text('tier', { enum: ['platform', 'tenant', 'user'] }).notNull(),
    settingId: integer('setting_id').notNull(),
    namespace: text('namespace').notNull(),
    key: text('key').notNull(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'set null' }),
    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),
    actorId: integer('actor_id').references(() => usersTable.id, { onDelete: 'set null' }),
    action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('settings_audit_tier_setting_idx').on(t.tier, t.settingId),
    index('settings_audit_actor_idx').on(t.actorId),
    index('settings_audit_org_idx').on(t.orgId),
    index('settings_audit_created_at_idx').on(t.createdAt),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// TENANT HEALTH SCORECARDS — computed & cached per org
// ─────────────────────────────────────────────────────────────────────────────

export const tenantHealthScorecardsTable = pgTable(
  'tenant_health_scorecards',
  {
    id: serial('id').primaryKey(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizationsTable.id, { onDelete: 'cascade' }),
    computedAt: timestamp('computed_at').notNull().defaultNow(),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),

    // Raw signals
    activeUsers: integer('active_users').notNull().default(0),
    totalUsers: integer('total_users').notNull().default(0),
    sessionCount: integer('session_count').notNull().default(0),
    featureAdoptionPct: real('feature_adoption_pct').notNull().default(0),
    supportTicketVolume: integer('support_ticket_volume').notNull().default(0),
    slaAdherencePct: real('sla_adherence_pct').notNull().default(100),
    billingStatus: text('billing_status', {
      enum: ['current', 'overdue', 'churned', 'trial', 'unknown'],
    })
      .notNull()
      .default('unknown'),
    apiCallCount: integer('api_call_count').notNull().default(0),
    errorRatePct: real('error_rate_pct').notNull().default(0),
    avgResponseTimeMs: real('avg_response_time_ms'),

    // Computed score (0–100)
    healthScore: real('health_score').notNull().default(0),
    healthTier: text('health_tier', { enum: ['critical', 'at_risk', 'healthy', 'champion'] })
      .notNull()
      .default('healthy'),

    // Trend vs prior period
    healthScoreDelta: real('health_score_delta'),
    activeUsersDelta: integer('active_users_delta'),

    // Raw JSON for additional signals
    signalBreakdown: jsonb('signal_breakdown'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('tenant_health_org_period_uq').on(t.orgId, t.periodStart),
    index('tenant_health_org_idx').on(t.orgId),
    index('tenant_health_score_idx').on(t.healthScore),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const insertPlatformSettingSchema = createInsertSchema(platformSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPlatformSetting = typeof platformSettingsTable.$inferInsert;
export type PlatformSetting = typeof platformSettingsTable.$inferSelect;

export const insertTenantSettingSchema = createInsertSchema(tenantSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTenantSetting = typeof tenantSettingsTable.$inferInsert;
export type TenantSetting = typeof tenantSettingsTable.$inferSelect;

export const insertUserSettingSchema = createInsertSchema(userSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserSetting = typeof userSettingsTable.$inferInsert;
export type UserSetting = typeof userSettingsTable.$inferSelect;

export const insertSettingsAuditLogSchema = createInsertSchema(settingsAuditLogTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSettingsAuditLog = typeof settingsAuditLogTable.$inferInsert;
export type SettingsAuditLog = typeof settingsAuditLogTable.$inferSelect;

export const insertTenantHealthScorecardSchema = createInsertSchema(
  tenantHealthScorecardsTable,
).omit({ id: true, createdAt: true });
export type InsertTenantHealthScorecard = typeof tenantHealthScorecardsTable.$inferInsert;
export type TenantHealthScorecard = typeof tenantHealthScorecardsTable.$inferSelect;
