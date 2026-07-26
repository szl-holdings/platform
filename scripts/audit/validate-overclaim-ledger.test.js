import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { ROOT, sha256, validateOverclaimLedger } from './validate-overclaim-ledger.js';

const productionLedgerBytes = fs.readFileSync(path.join(ROOT, 'docs', 'overclaim-ledger.json'));
const productionLedger = JSON.parse(productionLedgerBytes.toString('utf8'));
const productionManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs', 'overclaim-ledger.evidence.json'), 'utf8'),
);

function clone(value) {
  return structuredClone(value);
}

function validateMutation(mutateLedger, mutateManifest = () => {}) {
  const ledger = clone(productionLedger);
  const manifest = clone(productionManifest);
  mutateLedger(ledger);
  const ledgerBytes = Buffer.from(`${JSON.stringify(ledger, null, 2)}\n`);
  manifest.ledger.sha256 = sha256(ledgerBytes);
  mutateManifest(manifest);
  return validateOverclaimLedger({ ledger, ledgerBytes, manifest });
}

test('production ledger and evidence manifest validate', () => {
  assert.deepEqual(
    validateOverclaimLedger({
      ledger: productionLedger,
      ledgerBytes: productionLedgerBytes,
      manifest: productionManifest,
    }),
    [],
  );
});

test('rejects a pinned evidence digest mismatch', () => {
  const failures = validateMutation(
    () => {},
    (manifest) => {
      manifest.artifacts[0].sha256 = '0'.repeat(64);
    },
  );
  assert.ok(failures.some((failure) => failure.includes('evidence SHA-256 mismatch')));
});

test('rejects a one-sample metric mislabeled as a mean', () => {
  const failures = validateMutation((ledger) => {
    ledger.metrics.mean_time_to_correction_seconds =
      ledger.metrics.observed_correction_time_seconds;
  });
  assert.ok(failures.some((failure) => failure.includes('mislabels')));
});

test('rejects a correction duration that does not match timestamps', () => {
  const failures = validateMutation((ledger) => {
    ledger.incidents[0].observed_correction_time_seconds += 1;
  });
  assert.ok(failures.some((failure) => failure.includes('expected 39098')));
});

test('rejects duplicate evidence references', () => {
  const failures = validateMutation((ledger) => {
    ledger.incidents[0].evidence_refs[1] = ledger.incidents[0].evidence_refs[0];
  });
  assert.ok(failures.some((failure) => failure.includes('duplicate evidence reference')));
});
