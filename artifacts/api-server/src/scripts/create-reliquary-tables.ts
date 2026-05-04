import { db } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating reliquary tables…');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reliquary_catalog (
      id SERIAL PRIMARY KEY,
      org_id INTEGER,
      content_hash TEXT NOT NULL UNIQUE,
      covenant_hash TEXT NOT NULL UNIQUE,
      artifact_type TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      policy_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      tenant TEXT NOT NULL,
      doctrine_revision TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      disk_path TEXT NOT NULL,
      proof_receipt_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('reliquary_catalog: ok');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reliquary_lineage_edges (
      id SERIAL PRIMARY KEY,
      parent_content_hash TEXT NOT NULL,
      child_content_hash TEXT NOT NULL,
      relationship TEXT NOT NULL DEFAULT 'derived_from',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('reliquary_lineage_edges: ok');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reliquary_snapshots (
      id SERIAL PRIMARY KEY,
      snapshot_hash TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      manifest JSONB NOT NULL,
      disk_path TEXT NOT NULL,
      proof_receipt_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('reliquary_snapshots: ok');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reliquary_attestations (
      id SERIAL PRIMARY KEY,
      merkle_root TEXT NOT NULL,
      artifact_count INTEGER NOT NULL DEFAULT 0,
      content_hashes_snapshot JSONB NOT NULL,
      proof_receipt_id TEXT,
      verified_at TIMESTAMP,
      verification_result TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('reliquary_attestations: ok');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS reliquary_sovereign_state (
      id SERIAL PRIMARY KEY,
      active BOOLEAN NOT NULL DEFAULT FALSE,
      activated_by TEXT,
      reason TEXT,
      activated_at TIMESTAMP,
      deactivated_at TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log('reliquary_sovereign_state: ok');

  console.log('All reliquary tables created successfully.');
  process.exit(0);
}

main().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
