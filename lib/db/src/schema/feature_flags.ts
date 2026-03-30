import { pgTable, text, serial, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const featureFlagsTable = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  rolloutPercentage: integer("rollout_percentage").notNull().default(0),
  conditions: jsonb("conditions"),
  scope: text("scope", { enum: ["global", "org", "user", "role", "product"] }).notNull().default("global"),
  targetingJson: jsonb("targeting_json"),
  product: text("product"),
  requiredPlatformRole: text("required_platform_role"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const featureFlagOverridesTable = pgTable("feature_flag_overrides", {
  id: serial("id").primaryKey(),
  flagId: integer("flag_id").notNull().references(() => featureFlagsTable.id, { onDelete: "cascade" }),
  entityType: text("entity_type", { enum: ["user", "org", "role"] }).notNull(),
  entityId: text("entity_id").notNull(),
  isEnabled: boolean("is_enabled").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlagsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlagsTable.$inferSelect;

export const insertFeatureFlagOverrideSchema = createInsertSchema(featureFlagOverridesTable).omit({ id: true, createdAt: true });
export type InsertFeatureFlagOverride = z.infer<typeof insertFeatureFlagOverrideSchema>;
export type FeatureFlagOverride = typeof featureFlagOverridesTable.$inferSelect;
