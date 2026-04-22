/**
 * Live DB smoke for the ontology registry. Proves write→resolve→neighbors
 * round-trips against the actual Postgres tables.
 * Run via: pnpm --filter @szl-holdings/ontology exec tsx src/__tests__/registry.smoke.ts
 */
import { db, nexusEdgesTable, nexusEntitiesTable } from '@szl-holdings/db';
import { sql } from 'drizzle-orm';
import { neighbors, registerEdge, resolveEntity } from '../registry.js';
import {
  registerCounselMatter,
  registerTerraProperty,
  registerVessel,
  uriFromCounselMatter,
  uriFromTerraProperty,
  uriFromVessel,
} from '../sources.js';

async function main() {
  const stamp = Date.now();

  // Clean any prior runs that share our synthetic identifiers.
  await db.execute(
    sql`DELETE FROM nexus_edges WHERE from_uri LIKE 'szl://%/smoke-%' OR to_uri LIKE 'szl://%/smoke-%'`,
  );
  await db.execute(sql`DELETE FROM nexus_entities WHERE uri LIKE 'szl://%/smoke-%'`);

  const vessel = {
    id: stamp,
    imo: `smoke-${stamp}`,
    name: 'MV Test Frigate',
    orgId: null,
    flag: 'PA',
    vesselType: 'cargo',
  };
  const property = {
    id: stamp + 1,
    externalId: `smoke-${stamp + 1}`,
    address: '1 Test Way',
    city: 'Miami',
    state: 'FL',
    orgId: null,
  };
  const matter = {
    id: stamp + 2,
    title: `Test matter ${stamp}`,
    orgId: 1,
    status: 'open',
    courtName: null,
  };

  const v = await registerVessel(vessel);
  const p = await registerTerraProperty(property);
  const m = await registerCounselMatter(matter);

  console.log('registered:', v.uri, p.uri, m.uri);

  await registerEdge({
    fromUri: uriFromVessel(vessel),
    toUri: uriFromCounselMatter(matter),
    relation: 'subject_of',
  });
  await registerEdge({
    fromUri: uriFromTerraProperty(property),
    toUri: uriFromCounselMatter(matter),
    relation: 'collateral_in',
  });

  const r = await resolveEntity(uriFromVessel(vessel));
  if (!r || r.kind !== 'vessel') throw new Error('vessel not resolved');

  const matterNeighbors = await neighbors(uriFromCounselMatter(matter));
  if (matterNeighbors.length < 2) {
    throw new Error(`expected ≥2 neighbours for matter, got ${matterNeighbors.length}`);
  }
  const relations = new Set(matterNeighbors.map((n) => n.edge.relation));
  if (!relations.has('subject_of') || !relations.has('collateral_in')) {
    throw new Error('missing expected relations');
  }

  console.log('OK — neighbors:', matterNeighbors.length, [...relations].join(','));

  // Cleanup
  await db.execute(
    sql`DELETE FROM nexus_edges WHERE from_uri LIKE 'szl://%/smoke-%' OR to_uri LIKE 'szl://%/smoke-%'`,
  );
  await db.execute(sql`DELETE FROM nexus_entities WHERE uri LIKE 'szl://%/smoke-%'`);
  process.exit(0);
}

main().catch((err) => {
  console.error('SMOKE FAILED:', err);
  process.exit(1);
});
