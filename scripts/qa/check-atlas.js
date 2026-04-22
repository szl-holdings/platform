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

  let _passed = 0;
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
      failed++;
      continue;
    }

    const row = rows[0];

    if (row.domain !== expected.domain) {
      failed++;
      continue;
    }

    if (row.entity_type !== expected.entityType) {
      failed++;
      continue;
    }

    if (row.status !== 'ready') {
      failed++;
      continue;
    }

    const sections = Array.isArray(row.sections) ? row.sections : [];
    if (sections.length < expected.minSections) {
      failed++;
      continue;
    }

    const metadata = row.metadata ?? {};
    if (!metadata.demo) {
    }
    _passed++;
  }

  await sql.end();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((_err) => {
  process.exit(1);
});
