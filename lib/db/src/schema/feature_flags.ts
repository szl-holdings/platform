import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';

export const featureFlagsTable = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isEnabled: boolean('is_enabled').notNull().default(false),
  rolloutPercentage: integer('rollout_percentage').notNull().default(0),
  conditions: jsonb('conditions'),
  scope: text('scope', { enum: ['global', 'org', 'user', 'role', 'product'] })
    .notNull()
    .default('global'),
  targetingJson: jsonb('targeting_json'),
  product: text('product'),
  requiredPlatformRole: text('required_platform_role'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const featureFlagOverridesTable = pgTable('feature_flag_overrides', {
  id: serial('id').primaryKey(),
  flagId: integer('flag_id')
    .notNull()
    .references(() => featureFlagsTable.id, { onDelete: 'cascade' }),
  entityType: text('entity_type', { enum: ['user', 'org', 'role'] }).notNull(),
  entityId: text('entity_id').notNull(),
  isEnabled: boolean('is_enabled').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const flagCheckLogsTable = pgTable(
  'flag_check_logs',
  {
    id: serial('id').primaryKey(),
    flagKey: text('flag_key').notNull(),
    userId: integer('user_id'),
    orgId: integer('org_id'),
    result: boolean('result').notNull(),
    source: text('source', { enum: ['override', 'rollout', 'global', 'default'] }).notNull(),
    callerTag: text('caller_tag'),
    checkedAt: timestamp('checked_at').notNull().defaultNow(),
  },
  (t) => [
    index('flag_check_logs_key_idx').on(t.flagKey),
    index('flag_check_logs_org_id_idx').on(t.orgId),
    index('flag_check_logs_checked_at_idx').on(t.checkedAt),
  ],
);

export const insertFeatureFlagSchema = createInsertSchema(featureFlagsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlagsTable.$inferSelect;

export const insertFeatureFlagOverrideSchema = createInsertSchema(featureFlagOverridesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFeatureFlagOverride = z.infer<typeof insertFeatureFlagOverrideSchema>;
export type FeatureFlagOverride = typeof featureFlagOverridesTable.$inferSelect;

export const insertFlagCheckLogSchema = createInsertSchema(flagCheckLogsTable).omit({
  id: true,
  checkedAt: true,
});
export type InsertFlagCheckLog = z.infer<typeof insertFlagCheckLogSchema>;
export type FlagCheckLog = typeof flagCheckLogsTable.$inferSelect;
