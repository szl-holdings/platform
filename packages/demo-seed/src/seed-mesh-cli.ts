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

console.log('╔═══════════════════════════════════════════════════╗');
console.log('║  SZL Holdings — Signal Mesh Boot                 ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');

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
    console.log('[seed-mesh] Postgres-backed mesh stores wired in');
  } catch (err) {
    console.warn('[seed-mesh] Failed to wire Postgres stores — falling back to in-memory:', err);
  }
} else {
  console.log('[seed-mesh] DATABASE_URL not set — seeding into in-memory stores only');
}

const stats = await seedSignalMesh({ startConnectors });

if (dbReady) {
  await Promise.all([
    signalBusStore?.flush(),
    evidenceStore?.flush(),
    recommendationStore?.flush(),
    entityRegistry?.flush(),
  ]);
}

console.log('');
console.log('✅ Signal Mesh Ready');
console.log('──────────────────────────────────────────────────');
console.log(`  Signals seeded:        ${stats.signalsSeeded}`);
console.log(`  Evidence items:        ${stats.evidenceItemsSeeded}`);
console.log(`  Recommendations:       ${stats.recommendationsSeeded}`);
console.log(`  Entities registered:   ${stats.entitiesRegistered}`);
console.log(`  Connectors started:    ${stats.connectorsStarted}`);
console.log('');
console.log('  Bus signals buffered:  ' + defaultSignalBus.count());
console.log('  Evidence graph items:  ' + defaultEvidenceStore.count());
console.log('  Recommendations:       ' + defaultRecommendationStore.count());
console.log('  Entity snapshots:      ' + defaultEntityRegistry.count());

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
    console.log('');
    console.log('  Database (live counts from Postgres):');
    for (const r of rows) {
      console.log(`    ${r.table_name.padEnd(28)} ${r.n}`);
    }
  } catch (err) {
    console.warn('[seed-mesh] DB count query failed:', err);
  }
}

console.log('');
console.log('  Evidence graph read API exposed at:');
console.log('    GET /api/evidence-graph/recommendations');
console.log('    GET /api/evidence-graph/recommendations/:id');
console.log('    GET /api/evidence-graph/why/:entityId');
console.log('    GET /api/evidence-graph/signals');
console.log('');

if (startConnectors) {
  console.log('  Connector adapters running — press Ctrl+C to stop');
  process.on('SIGINT', async () => {
    console.log('\n[seed-mesh] Shutting down connectors...');
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
  console.log('  Connector adapters not started (--no-connectors flag)');
  process.exit(0);
}
