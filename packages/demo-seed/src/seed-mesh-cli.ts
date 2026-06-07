#!/usr/bin/env tsx

/**
 * Signal Mesh Seed CLI
 *
 * Boots the signal mesh with synthetic scenarios and starts all connector
 * adapters emitting a live signal stream. When DATABASE_URL is set, the
 * mesh's defaultSignalBus, evidence store, recommendation store, and entity
 * registry are first swapped to Postgres-backed implementations so that
 * everything seeded survives across server restarts. The CLI then prints
 * the live record counts queried directly from the database.
 *
 * Usage:
 *   pnpm --filter @workspace/demo-seed run seed:mesh
 *   pnpm --filter @workspace/demo-seed run seed:mesh --no-connectors
 */

import { getEnv } from '@szl-holdings/env';
import {
  defaultEvidenceStore,
  defaultRecommendationStore,
  PostgresEntityRegistry,
  PostgresEvidenceStore,
  PostgresRecommendationStore,
} from '@szl-holdings/evidence-graph';
import { defaultSignalBus, PostgresSignalBusStore } from '@szl-holdings/signal-mesh';
import { defaultEntityRegistry } from '@workspace/ontology';
import { seedSignalMesh } from './seed-signal-mesh.js';

const startConnectors = !process.argv.includes('--no-connectors');

let signalBusStore: PostgresSignalBusStore | undefined;
let evidenceStore: PostgresEvidenceStore | undefined;
let recommendationStore: PostgresRecommendationStore | undefined;
let entityRegistry: PostgresEntityRegistry | undefined;
let dbReady = false;

if (getEnv().DATABASE_URL) {
  try {
    const { db } = await import('@szl-holdings/db');
    const {
      meshSignalsTable,
      meshEvidenceItemsTable,
      meshEvidenceEntityLinksTable,
      meshRecommendationsTable,
      meshEntitySnapshotsTable,
    } = await import('@szl-holdings/db/schema');

    signalBusStore = new PostgresSignalBusStore({
      db,
      signalsTable: meshSignalsTable,
      flushIntervalMs: 500,
    });
    evidenceStore = new PostgresEvidenceStore({
      db,
      evidenceItemsTable: meshEvidenceItemsTable,
      evidenceEntityLinksTable: meshEvidenceEntityLinksTable,
      flushIntervalMs: 500,
    });
    recommendationStore = new PostgresRecommendationStore({
      db,
      recommendationsTable: meshRecommendationsTable,
      flushIntervalMs: 500,
    });
    entityRegistry = new PostgresEntityRegistry({
      db,
      entitySnapshotsTable: meshEntitySnapshotsTable,
      flushIntervalMs: 500,
    });

    defaultSignalBus.setStore(signalBusStore);
    defaultEvidenceStore.setBackend(evidenceStore);
    defaultRecommendationStore.setBackend(recommendationStore);
    defaultEntityRegistry.setBackend(entityRegistry);
    dbReady = true;
  } catch (_err) {
  }
} else {
}

const _stats = await seedSignalMesh({ startConnectors });

if (dbReady) {
  await Promise.all([
    signalBusStore?.flush(),
    evidenceStore?.flush(),
    recommendationStore?.flush(),
    entityRegistry?.flush(),
  ]);
}

if (dbReady) {
  try {
    const { db } = await import('@szl-holdings/db');
    const { sql } = await import('drizzle-orm');
    const counts = await db.execute<{ table_name: string; n: string }>(sql`
      SELECT 'mesh_signals' AS table_name, COUNT(*)::text AS n FROM mesh_signals
      UNION ALL SELECT 'mesh_evidence_items', COUNT(*)::text FROM mesh_evidence_items
      UNION ALL SELECT 'mesh_recommendations', COUNT(*)::text FROM mesh_recommendations
      UNION ALL SELECT 'mesh_entity_snapshots', COUNT(*)::text FROM mesh_entity_snapshots
      UNION ALL SELECT 'mesh_evidence_entity_links', COUNT(*)::text FROM mesh_evidence_entity_links
    `);
    const rows =
      (counts as unknown as { rows: Array<{ table_name: string; n: string }> }).rows ??
      (counts as unknown as Array<{ table_name: string; n: string }>);
    for (const _r of rows) {
    }
  } catch (_err) {
  }
}

if (startConnectors) {
  process.on('SIGINT', async () => {
    await Promise.all([
      signalBusStore?.stop(),
      evidenceStore?.stop(),
      recommendationStore?.stop(),
      entityRegistry?.stop(),
    ]);
    process.exit(0);
  });
} else {
  await Promise.all([
    signalBusStore?.stop(),
    evidenceStore?.stop(),
    recommendationStore?.stop(),
    entityRegistry?.stop(),
  ]);
  process.exit(0);
}
