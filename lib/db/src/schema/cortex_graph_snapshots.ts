import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import type { z } from 'zod/v4';
import { organizationsTable } from './organizations';

export interface GraphSnapshotNode {
  id: string;
  label: string;
  type: string;
  domain: string;
  riskScore: number;
  tags: string[];
  metadata?: unknown;
  lastSeen?: unknown;
}

export interface GraphSnapshotEdge {
  source: string;
  target: string;
  type: string;
  strength: string;
}

export interface GraphSnapshotMeta {
  totalNodes: number;
  totalEdges: number;
  domain: string;
  minRisk: number;
  graphStats: Record<string, unknown>;
  source?: 'manual' | 'scheduled';
  [key: string]: unknown;
}

/**
 * cortex_graph_snapshots — point-in-time captures of the CORTEX entity graph.
 *
 * Each row stores the full node/edge state at a moment in time, scoped to an org.
 * Snapshots can be triggered manually or by a scheduled job.
 * Rows older than `expires_at` should be purged by the retention job.
 */
export const cortexGraphSnapshotsTable = pgTable(
  'cortex_graph_snapshots',
  {
    id: serial('id').primaryKey(),
    snapshotUuid: text('snapshot_uuid').notNull().unique(),
    orgId: integer('org_id').references(() => organizationsTable.id, { onDelete: 'cascade' }),
    label: text('label'),
    nodes: jsonb('nodes').$type<GraphSnapshotNode[]>().notNull().default([]),
    edges: jsonb('edges').$type<GraphSnapshotEdge[]>().notNull().default([]),
    meta: jsonb('meta').$type<GraphSnapshotMeta>().notNull().default({} as GraphSnapshotMeta),
    retentionDays: integer('retention_days').notNull().default(30),
    snapshotAt: timestamp('snapshot_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    index('cortex_graph_snapshots_org_idx').on(table.orgId),
    index('cortex_graph_snapshots_snapshot_at_idx').on(table.snapshotAt),
    index('cortex_graph_snapshots_expires_at_idx').on(table.expiresAt),
  ],
);

export const insertCortexGraphSnapshotSchema = createInsertSchema(cortexGraphSnapshotsTable).omit({
  id: true,
  snapshotAt: true,
});

export type InsertCortexGraphSnapshot = z.infer<typeof insertCortexGraphSnapshotSchema>;
export type CortexGraphSnapshot = typeof cortexGraphSnapshotsTable.$inferSelect;
