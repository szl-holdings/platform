/**
 * OntologyEngine.upsertEntity wasCreated flag (Task #2634)
 *
 * Locks in the contract that the upsert outcome classifier (created vs.
 * merged) used by the feed ingestion pipeline keeps working. A future
 * refactor of the upsert SQL or the conflict target would silently
 * regress the created/merged classification consumed by
 * `intelligence-feeds-init` summary logs without this guard.
 *
 * Strategy:
 *   - Seed an entity through `upsertEntity` and assert wasCreated=true.
 *   - Call again with the same (name, sourceApp) and assert wasCreated=false.
 *   - Same row id is returned — confirming the conflict target fired.
 *
 * Skipped if no DATABASE_URL is configured (tests cannot truly exercise
 * the ON CONFLICT path without Postgres).
 */

import type { OntologyEngine as OntologyEngineClass } from '@szl-holdings/ai-engine/ontology/ontology-engine';
import type { db as DbHandle, entitiesTable as EntitiesTable } from '@szl-holdings/db';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const HAS_DB = Boolean(process.env.DATABASE_URL);
const d = HAS_DB ? describe : describe.skip;

d('OntologyEngine.upsertEntity wasCreated flag', () => {
  let engine: OntologyEngineClass;
  let db: typeof DbHandle;
  let entitiesTable: typeof EntitiesTable;

  const name = `wascreated-test-${randomUUID()}`;
  const domain = 'ontology-wascreated-test';

  beforeAll(async () => {
    const ontologyMod = await import('@szl-holdings/ai-engine/ontology/ontology-engine');
    const dbMod = await import('@szl-holdings/db');
    db = dbMod.db;
    entitiesTable = dbMod.entitiesTable;
    engine = new ontologyMod.OntologyEngine();

    // Defensive cleanup: any leftover row from a crashed previous run
    // would make the first upsert return wasCreated=false and mask a
    // real regression.
    await db
      .delete(entitiesTable)
      .where(and(eq(entitiesTable.name, name), eq(entitiesTable.sourceApp, domain)));
  });

  afterAll(async () => {
    if (db && entitiesTable) {
      await db
        .delete(entitiesTable)
        .where(and(eq(entitiesTable.name, name), eq(entitiesTable.sourceApp, domain)));
    }
    engine?.dispose();
  });

  it('returns wasCreated=true on first insert and wasCreated=false on subsequent merge', async () => {
    const first = await engine.upsertEntity({
      type: 'asset',
      name,
      domain,
      metadata: { iteration: 1 },
      tags: ['initial'],
    });

    expect(first.wasCreated).toBe(true);
    expect(first.id).toBeTruthy();

    const second = await engine.upsertEntity({
      type: 'asset',
      name,
      domain,
      metadata: { iteration: 2 },
      tags: ['updated'],
    });

    expect(second.wasCreated).toBe(false);
    // Same row should be returned — proves the (name, sourceApp) conflict
    // target fired rather than a new row being inserted.
    expect(second.id).toBe(first.id);

    // A third pass should also be classified as a merge.
    const third = await engine.upsertEntity({
      type: 'asset',
      name,
      domain,
      metadata: { iteration: 3 },
      tags: ['updated-again'],
    });
    expect(third.wasCreated).toBe(false);
    expect(third.id).toBe(first.id);
  });
});
