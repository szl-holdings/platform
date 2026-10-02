#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_SNAPSHOT_PATH,
  loadSnapshot,
  validateSnapshot,
} from '../../../tools/hf-catalog/catalog.mjs';
import {
  createEvidenceSteward,
  verifyEvidenceStewardFixtureBlob,
} from './evidence-steward-core.mjs';

const AS_OF = '2026-10-02T00:00:00.000Z';
const CASE_IDS = [
  'SZLHOLDINGS/SZL-Forge-1.5B-ReceiptAgent',
  'SZLHOLDINGS/SZL-Khipu-1.5B',
  'SZLHOLDINGS/SZL-Khipu-1.5B-GGUF',
  'SZLHOLDINGS/szl-kernels',
  'SZLHOLDINGS/SZLHOLDINGS',
];
function verifiedBlob(path, kind) {
  const bytes = readFileSync(path);
  verifyEvidenceStewardFixtureBlob(kind, bytes);
  return bytes;
}

function readFixture(name, kind) {
  const bytes = verifiedBlob(new URL(`../fixtures/${name}`, import.meta.url), kind);
  return JSON.parse(bytes.toString('utf8'));
}

export function replayEvidenceSteward() {
  verifiedBlob(DEFAULT_SNAPSHOT_PATH, 'catalog');
  const catalog = loadSnapshot();
  const errors = validateSnapshot(catalog);
  if (errors.length > 0) throw new Error(`TRACKED_CATALOG_INVALID:${errors.join('|')}`);
  const steward = createEvidenceSteward({
    catalog,
    bindings: readFixture('model-source-bindings.json', 'bindings'),
    portfolio: readFixture('model_portfolio.json', 'portfolio'),
  }, AS_OF);
  const report = {
    schema: 'szl.evidence-steward.fixture-replay/v1',
    mode: 'OFFLINE_SOURCE_ONLY',
    as_of: AS_OF,
    execution: 'NOT_CONFIGURED',
    catalog: steward.listCatalog({ asset_type: 'models', limit: 25 }),
    cases: CASE_IDS.map((asset_id) => ({
      inspect: steward.inspectAsset({ asset_id }),
      gaps: steward.assessEvidenceGaps({ asset_id }),
      proposal: steward.proposeNextStep({ asset_id }),
    })),
  };
  return {
    ...report,
    digest: `sha256:${createHash('sha256').update(JSON.stringify(report)).digest('hex')}`,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) throw new Error('Demo accepts no arguments');
  process.stdout.write(`${JSON.stringify(replayEvidenceSteward(), null, 2)}\n`);
}
