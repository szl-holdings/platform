import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Terra Portfolio Module Seeds
 *
 * Stores the per-module portfolio/list payloads served by the Terra
 * intelligence routes (climate-risk, zoning, neighborhood-momentum,
 * seller-motivation, spatial-walkthrough). One row per module key,
 * payload is a JSONB blob matching the module's response shape.
 *
 * Persisted in Postgres (rather than living as in-file constants) so
 * the data can be edited, audited, and rotated without redeploying.
 * The boot seeder populates rows on first launch when missing.
 */
export const terraPortfolioModulesTable = pgTable("terra_portfolio_modules", {
  module: text("module").primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type TerraPortfolioModuleRow = typeof terraPortfolioModulesTable.$inferSelect;
