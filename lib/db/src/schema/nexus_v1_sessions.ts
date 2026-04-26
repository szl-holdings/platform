import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * NEXUS v1 Sessions — cross-domain conversation context store.
 *
 * Each session tracks which SZL domains have been consulted, what evidence
 * has been gathered, and what decisions have been made across turns. This
 * enables multi-turn cross-domain investigations (e.g., a maritime inquiry
 * that surfaces a legal risk connected to a financial exposure).
 */

export interface NexusV1DecisionGraphEntry {
  turn: number;
  query: string;
  domains_consulted: string[];
  action_taken: string | null;
  timestamp: string;
}

export const nexusV1SessionsTable = pgTable(
  'nexus_v1_sessions',
  {
    id: text('id').primaryKey(),
    orgId: integer('org_id'),
    userId: integer('user_id'),
    domainsTouched: jsonb('domains_touched').$type<string[]>().notNull().default([]),
    contextSummary: text('context_summary').notNull().default(''),
    decisionGraph: jsonb('decision_graph')
      .$type<NexusV1DecisionGraphEntry[]>()
      .notNull()
      .default([]),
    turnCount: integer('turn_count').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
  },
  (t) => [
    index('nexus_v1_sessions_org_idx').on(t.orgId),
    index('nexus_v1_sessions_user_idx').on(t.userId),
    index('nexus_v1_sessions_updated_idx').on(t.updatedAt),
    index('nexus_v1_sessions_expires_idx').on(t.expiresAt),
  ],
);

export type NexusV1SessionRow = typeof nexusV1SessionsTable.$inferSelect;
export type NexusV1SessionInsert = typeof nexusV1SessionsTable.$inferInsert;
