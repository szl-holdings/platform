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

test('rejects a correction URL that is not bound to its evidence snapshot', () => {
  const failures = validateMutation((ledger) => {
    ledger.incidents[0].correction_url =
      'https://github.com/szl-holdings/platform/commit/0000000000000000000000000000000000000000';
  });
  assert.ok(failures.some((failure) => failure.includes('correction source URL mismatch')));
});

test('rejects duplicate evidence references', () => {
  const failures = validateMutation((ledger) => {
    ledger.incidents[0].evidence_refs[1] = ledger.incidents[0].evidence_refs[0];
  });
  assert.ok(failures.some((failure) => failure.includes('duplicate evidence reference')));
});

test('rejects duplicate counted incidents that reuse detection and correction evidence', () => {
  const failures = validateMutation((ledger) => {
    const duplicate = clone(ledger.incidents[0]);
    duplicate.id = 'OC-2026-002';
    ledger.incidents.push(duplicate);
    ledger.metrics.ci_detected_incidents = 2;
    ledger.metrics.correction_time_sample_size = 2;
    ledger.metrics.observed_correction_time_seconds *= 2;
    ledger.metrics.observed_correction_time_display = '21h 43m 16s';
  });
  assert.ok(failures.some((failure) => failure.includes('already used by another incident')));
  assert.ok(failures.some((failure) => failure.includes('already counted by another incident')));
});

test('rejects an incorrect correction-time display value', () => {
  const failures = validateMutation((ledger) => {
    ledger.metrics.observed_correction_time_display = '0 seconds';
  });
  assert.ok(failures.some((failure) => failure.includes('expected 10h 51m 38s')));
});

test('rejects missing related-incident evidence', () => {
  const failures = validateMutation((ledger) => {
    ledger.related_non_ci_incidents[0].evidence_refs = [];
  });
  assert.ok(
    failures.some((failure) =>
      failure.includes('expected report, guard, and reconciliation evidence'),
    ),
  );
});

test('rejects a related-incident report URL that diverges from evidence', () => {
  const failures = validateMutation((ledger) => {
    ledger.related_non_ci_incidents[0].evidence_commit_url =
      'https://github.com/szl-holdings/platform/commit/0000000000000000000000000000000000000000';
  });
  assert.ok(failures.some((failure) => failure.includes('report source URL mismatch')));
});

test('rejects a related-incident detection timestamp that diverges from evidence', () => {
  const failures = validateMutation((ledger) => {
    ledger.related_non_ci_incidents[0].detected_at = '2026-06-13T03:25:03Z';
  });
  assert.ok(failures.some((failure) => failure.includes('report timestamp mismatch')));
});

test('rejects a related-incident guard conclusion that diverges from evidence', () => {
  const failures = validateMutation((ledger) => {
    ledger.related_non_ci_incidents[0].overclaim_guard_conclusion = 'failure';
  });
  assert.ok(failures.some((failure) => failure.includes('guard conclusion mismatch')));
});

test('rejects a related-incident guard URL that diverges from evidence', () => {
  const failures = validateMutation((ledger) => {
    ledger.related_non_ci_incidents[0].overclaim_guard_run_url =
      'https://github.com/szl-holdings/platform/actions/runs/1';
  });
  assert.ok(failures.some((failure) => failure.includes('guard source URL mismatch')));
});

test('rejects a related-incident reconciliation URL that diverges from evidence', () => {
  const failures = validateMutation((ledger) => {
    ledger.related_non_ci_incidents[0].candidate_reconciliation_commit_url =
      'https://github.com/szl-holdings/platform/commit/0000000000000000000000000000000000000000';
  });
  assert.ok(failures.some((failure) => failure.includes('reconciliation source URL mismatch')));
});
