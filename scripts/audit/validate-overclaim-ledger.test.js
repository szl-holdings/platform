import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ROOT, sha256, validateOverclaimLedger } from './validate-overclaim-ledger.js';

const productionLedgerBytes = fs.readFileSync(path.join(ROOT, 'docs', 'overclaim-ledger.json'));
const productionLedger = JSON.parse(productionLedgerBytes.toString('utf8'));
const productionManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs', 'overclaim-ledger.evidence.json'), 'utf8'),
);
const productionMarkdown = fs.readFileSync(path.join(ROOT, 'docs', 'OVERCLAIM_LEDGER.md'), 'utf8');

function clone(value) {
  return structuredClone(value);
}

function validateMutation(
  mutateLedger,
  mutateManifest = () => {},
  mutateMarkdown = (markdown) => markdown,
) {
  const ledger = clone(productionLedger);
  const manifest = clone(productionManifest);
  mutateLedger(ledger);
  const ledgerBytes = Buffer.from(`${JSON.stringify(ledger, null, 2)}\n`);
  manifest.ledger.sha256 = sha256(ledgerBytes);
  mutateManifest(manifest);
  return validateOverclaimLedger({
    ledger,
    ledgerBytes,
    manifest,
    markdown: mutateMarkdown(productionMarkdown),
  });
}

function validateEvidenceMutation(evidenceId, mutateEvidence) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'overclaim-ledger-'));
  try {
    const manifest = clone(productionManifest);
    for (const artifact of manifest.artifacts) {
      const sourcePath = path.join(ROOT, artifact.path);
      const targetPath = path.join(tempRoot, artifact.path);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      const evidence = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      if (artifact.id === evidenceId) mutateEvidence(evidence);
      const bytes = Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`);
      fs.writeFileSync(targetPath, bytes);
      artifact.sha256 = sha256(bytes);
    }
    return validateOverclaimLedger({
      ledger: productionLedger,
      ledgerBytes: productionLedgerBytes,
      manifest,
      markdown: productionMarkdown,
      root: tempRoot,
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

test('production ledger and evidence manifest validate', () => {
  assert.deepEqual(
    validateOverclaimLedger({
      ledger: productionLedger,
      ledgerBytes: productionLedgerBytes,
      manifest: productionManifest,
      markdown: productionMarkdown,
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

test('permits a detected incident to remain open without fabricated correction data', () => {
  const failures = validateMutation(
    (ledger) => {
      const incident = ledger.incidents[0];
      incident.correction_status = 'OPEN';
      delete incident.corrected_at;
      delete incident.correction_commit;
      delete incident.correction_url;
      delete incident.observed_correction_time_seconds;
      incident.evidence_refs = [incident.evidence_refs[0]];
      ledger.metrics.correction_time_sample_size = 0;
      ledger.metrics.observed_correction_time_seconds = 0;
      ledger.metrics.observed_correction_time_display = '0h 0m 0s';
      ledger.metrics.aggregation = 'no_observations';
    },
    () => {},
    (markdown) => markdown.replaceAll('10h 51m 38s', '0h 0m 0s').replaceAll('n=1', 'n=0'),
  );
  assert.deepEqual(failures, []);
});

test('rejects correction data on an open incident', () => {
  const failures = validateMutation((ledger) => {
    ledger.incidents[0].correction_status = 'OPEN';
  });
  assert.ok(failures.some((failure) => failure.includes('open incident must omit corrected_at')));
});

test('rejects a detection URL that is not bound to its structured run id', () => {
  const failures = validateEvidenceMutation('OC-2026-001-detection', (evidence) => {
    evidence.run_id = 1;
  });
  assert.ok(failures.some((failure) => failure.includes('does not bind the run id')));
});

test('rejects a rendered incident count that diverges from the ledger', () => {
  const failures = validateMutation(
    () => {},
    () => {},
    (markdown) =>
      markdown.replace('Overclaims caught by CI | **1**', 'Overclaims caught by CI | **2**'),
  );
  assert.ok(failures.some((failure) => failure.includes('rendered Markdown CI incident count')));
});

test('rejects a rendered duration that diverges from the ledger', () => {
  const failures = validateMutation(
    () => {},
    () => {},
    (markdown) => markdown.replace('**10h 51m 38s**', '**0h 0m 0s**'),
  );
  assert.ok(failures.some((failure) => failure.includes('rendered Markdown correction-time')));
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
