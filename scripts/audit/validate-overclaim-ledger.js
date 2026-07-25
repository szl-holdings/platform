#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ledgerPath = path.join(root, 'docs', 'overclaim-ledger.json');
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));

const failures = [];

function fail(message) {
  failures.push(message);
}

function validGitHubUrl(value, kind) {
  const pattern =
    kind === 'run'
      ? /^https:\/\/github\.com\/szl-holdings\/[^/]+\/actions\/runs\/\d+$/
      : /^https:\/\/github\.com\/szl-holdings\/[^/]+\/commit\/[0-9a-f]{40}$/;
  return pattern.test(value);
}

const incidents = ledger.incidents ?? [];
const ids = new Set();
let totalSeconds = 0;

for (const incident of incidents) {
  if (ids.has(incident.id)) fail(`duplicate incident id: ${incident.id}`);
  ids.add(incident.id);

  if (incident.detector_type !== 'ci-policy-gate') {
    fail(`${incident.id}: counted incident is not a CI policy-gate finding`);
  }

  const detected = Date.parse(incident.first_detected_at);
  const corrected = Date.parse(incident.corrected_at);
  if (!Number.isFinite(detected) || !Number.isFinite(corrected) || corrected < detected) {
    fail(`${incident.id}: invalid detection or correction timestamp`);
    continue;
  }

  const duration = Math.floor((corrected - detected) / 1000);
  if (incident.time_to_correction_seconds !== duration) {
    fail(
      `${incident.id}: time_to_correction_seconds=${incident.time_to_correction_seconds}, expected ${duration}`,
    );
  }
  totalSeconds += duration;

  if (!validGitHubUrl(incident.first_run_url, 'run')) {
    fail(`${incident.id}: invalid first_run_url`);
  }
  if (!validGitHubUrl(incident.correction_url, 'commit')) {
    fail(`${incident.id}: invalid correction_url`);
  }
  for (const url of incident.repeated_run_urls ?? []) {
    if (!validGitHubUrl(url, 'run')) fail(`${incident.id}: invalid repeated run URL`);
  }
}

const count = incidents.length;
const meanSeconds = count === 0 ? 0 : Math.round(totalSeconds / count);
if (ledger.metrics.ci_detected_incidents !== count) {
  fail(`ci_detected_incidents=${ledger.metrics.ci_detected_incidents}, expected ${count}`);
}
if (ledger.metrics.mean_time_to_correction_seconds !== meanSeconds) {
  fail(
    `mean_time_to_correction_seconds=${ledger.metrics.mean_time_to_correction_seconds}, expected ${meanSeconds}`,
  );
}
if (ledger.guard_run_audit.unique_policy_findings !== count) {
  fail(
    `unique_policy_findings=${ledger.guard_run_audit.unique_policy_findings}, expected ${count}`,
  );
}
if (
  ledger.guard_run_audit.runs_with_policy_finding +
    ledger.guard_run_audit.runs_without_completed_policy_output !==
  ledger.guard_run_audit.failed_runs_reviewed
) {
  fail('guard run audit counts do not reconcile');
}

for (const related of ledger.related_non_ci_incidents ?? []) {
  if (related.counted_in_ci_metric !== false) {
    fail(`${related.id}: related non-CI incident must be excluded from the CI metric`);
  }
}

console.log('Overclaim ledger validation');
console.log(`  unique CI incidents: ${count}`);
console.log(`  mean correction seconds: ${meanSeconds}`);
console.log(`  guard runs audited: ${ledger.guard_run_audit.failed_runs_reviewed}`);

if (failures.length > 0) {
  for (const message of failures) console.error(`  FAIL ${message}`);
  process.exit(1);
}

console.log('  PASS ledger schema and computed metrics agree');
