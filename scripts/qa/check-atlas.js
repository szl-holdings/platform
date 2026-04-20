#!/usr/bin/env node
/**
 * check-atlas.js — ATLAS Spatial Runtime QA validation
 *
 * Verifies that all four canonical ATLAS demo scenes are seeded and
 * that each scene has the expected structure (sections, metadata, domain).
 *
 * Usage:
 *   node scripts/qa/check-atlas.js
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const EXPECTED_SCENES = [
  {
    slug: 'atlas-aegis-ransomware-inc2026001',
    domain: 'security',
    entityType: 'incident',
    entityId: 'INC-2026-001',
    minSections: 3,
  },
  {
    slug: 'atlas-vessels-sanctions-imo9876543',
    domain: 'maritime',
    entityType: 'vessel',
    entityId: 'IMO-9876543',
    minSections: 3,
  },
  {
    slug: 'atlas-terra-distress-propbk2026-0142',
    domain: 'real_estate',
    entityType: 'property',
    entityId: 'PROP-BK-2026-0142',
    minSections: 3,
  },
  {
    slug: 'atlas-counsel-matter-mtr2026-0891',
    domain: 'general',
    entityType: 'matter',
    entityId: 'MTR-2026-0891',
    minSections: 3,
  },
];

async function main() {
  console.log('[qa:atlas] Checking ATLAS demo scene seed completeness...\n');

  let passed = 0;
  let failed = 0;

  for (const expected of EXPECTED_SCENES) {
    const rows = await sql`
      SELECT id, slug, domain, entity_type, entity_id, sections, metadata, status
      FROM atlas_artifacts
      WHERE slug = ${expected.slug}
        AND is_latest = true
      LIMIT 1
    `;

    if (rows.length === 0) {
      console.error(`  [FAIL] Missing scene: ${expected.slug}`);
      console.error(`         Run 'pnpm seed:atlas' to seed this scene`);
      failed++;
      continue;
    }

    const row = rows[0];

    if (row.domain !== expected.domain) {
      console.error(
        `  [FAIL] ${expected.slug}: domain mismatch. Expected ${expected.domain}, got ${row.domain}`,
      );
      failed++;
      continue;
    }

    if (row.entity_type !== expected.entityType) {
      console.error(
        `  [FAIL] ${expected.slug}: entityType mismatch. Expected ${expected.entityType}, got ${row.entity_type}`,
      );
      failed++;
      continue;
    }

    if (row.status !== 'ready') {
      console.error(`  [FAIL] ${expected.slug}: status is '${row.status}', expected 'ready'`);
      failed++;
      continue;
    }

    const sections = Array.isArray(row.sections) ? row.sections : [];
    if (sections.length < expected.minSections) {
      console.error(
        `  [FAIL] ${expected.slug}: has ${sections.length} sections, expected at least ${expected.minSections}`,
      );
      failed++;
      continue;
    }

    const metadata = row.metadata ?? {};
    if (!metadata.demo) {
      console.error(
        `  [WARN] ${expected.slug}: metadata.demo is not set — may not be labelled as demo data`,
      );
    }

    console.log(`  [PASS] ${expected.slug} (id: ${row.id}, sections: ${sections.length})`);
    passed++;
  }

  console.log(`\n[qa:atlas] Results: ${passed} passed, ${failed} failed`);

  await sql.end();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[qa:atlas] Error:', err.message);
  process.exit(1);
});
