import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * A11oy Defense — persistent payload store for the six defense pages
 * (PrecisionAI, WeaponizedIntel, AgentZeroTrust, AtlasShield,
 * SwarmOrchestrator, PlaybookEngine).
 *
 * Each row holds the full JSON payload returned by the corresponding
 * /api/internal/a11oy/defense/<slug> endpoint. The endpoint reads the row
 * by slug; admins can update any row to change what the dashboards show
 * without touching code or redeploying.
 */
export const a11oyDefensePayloads = pgTable('a11oy_defense_payloads', {
  slug: text('slug').primaryKey(),
  payload: jsonb('payload').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type A11oyDefensePayloadRow = typeof a11oyDefensePayloads.$inferSelect;
export type NewA11oyDefensePayload = typeof a11oyDefensePayloads.$inferInsert;
