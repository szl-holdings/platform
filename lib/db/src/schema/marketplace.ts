import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  jsonb,
  serial,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Unified Marketplace Catalog ──────────────────────────────────────────────

export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  listingId: text("listing_id").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  version: text("version").notNull().default("1.0.0"),
  description: text("description").notNull(),
  kind: text("kind", { enum: ["agent", "skill"] }).notNull(),
  domain: text("domain").notNull(),
  category: text("category").notNull(),
  capability: text("capability"),
  tags: jsonb("tags").default([]),
  autonomyLevel: text("autonomy_level", { enum: ["supervised", "semi-autonomous", "autonomous"] }),
  provider: text("provider"),
  model: text("model"),
  publisher: text("publisher").default("SZL Platform"),
  costPerRun: real("cost_per_run"),
  avgLatencyMs: integer("avg_latency_ms"),
  successRate: real("success_rate"),
  deploymentCount: integer("deployment_count").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  rating: real("rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPopular: boolean("is_popular").notNull().default(false),
  isSlaCompliant: boolean("is_sla_compliant").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  capabilities: jsonb("capabilities").default([]),
  changeLog: jsonb("change_log").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("marketplace_slug_version_idx").on(t.slug, t.version),
  index("marketplace_kind_idx").on(t.kind),
  index("marketplace_domain_idx").on(t.domain),
  index("marketplace_category_idx").on(t.category),
  index("marketplace_featured_idx").on(t.isFeatured),
  index("marketplace_active_idx").on(t.isActive),
]);

export const marketplaceRatings = pgTable("marketplace_ratings", {
  id: serial("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => marketplaceListings.listingId),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("marketplace_ratings_listing_idx").on(t.listingId),
  uniqueIndex("marketplace_ratings_user_listing_idx").on(t.userId, t.listingId),
]);

export const marketplaceDeployments = pgTable("marketplace_deployments", {
  id: serial("id").primaryKey(),
  deploymentId: text("deployment_id").notNull().unique(),
  listingId: text("listing_id").notNull().references(() => marketplaceListings.listingId),
  userId: integer("user_id").notNull(),
  status: text("status", { enum: ["active", "paused", "failed", "terminated"] }).notNull().default("active"),
  config: jsonb("config").default({}),
  deployedAt: timestamp("deployed_at").notNull().defaultNow(),
  terminatedAt: timestamp("terminated_at"),
}, (t) => [
  index("marketplace_deployments_listing_idx").on(t.listingId),
  index("marketplace_deployments_user_idx").on(t.userId),
  index("marketplace_deployments_status_idx").on(t.status),
]);

export const marketplaceUserActivations = pgTable("marketplace_user_activations", {
  id: serial("id").primaryKey(),
  listingId: text("listing_id").notNull().references(() => marketplaceListings.listingId),
  userId: integer("user_id").notNull(),
  isActivated: boolean("is_activated").notNull().default(true),
  activatedAt: timestamp("activated_at").notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at"),
}, (t) => [
  uniqueIndex("marketplace_activations_user_listing_idx").on(t.userId, t.listingId),
  index("marketplace_activations_listing_idx").on(t.listingId),
]);

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;
export type MarketplaceDeployment = typeof marketplaceDeployments.$inferSelect;
