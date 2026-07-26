#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function safePath(root, relativePath) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function validGitHubUrl(value, kind) {
  const pattern =
    kind === 'run'
      ? /^https:\/\/github\.com\/szl-holdings\/[^/]+\/actions\/runs\/\d+$/
      : /^https:\/\/github\.com\/szl-holdings\/[^/]+\/commit\/[0-9a-f]{40}$/;
  return typeof value === 'string' && pattern.test(value);
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

export function validateOverclaimLedger({ ledger, ledgerBytes, manifest, root = ROOT }) {
  const failures = [];
  const fail = (message) => failures.push(message);

  if (ledger.schema_version !== '1.1.0') fail('ledger schema_version must be 1.1.0');
  if (ledger.maturity !== 'MEASURED') fail('ledger maturity must be MEASURED');
  if (ledger.snapshot?.state !== 'SNAPSHOT') fail('ledger evidence state must be SNAPSHOT');
  if (ledger.snapshot?.exhaustive !== false)
    fail('ledger snapshot must explicitly be non-exhaustive');
  if (!Number.isFinite(Date.parse(ledger.snapshot?.observed_at))) {
    fail('ledger snapshot observed_at must be an ISO timestamp');
  }
  if (ledger.evidence_manifest_path !== 'docs/overclaim-ledger.evidence.json') {
    fail('ledger must name the canonical evidence manifest');
  }

  if (manifest.schema_version !== '1.0.0') fail('manifest schema_version must be 1.0.0');
  if (manifest.maturity !== 'MEASURED') fail('manifest maturity must be MEASURED');
  if (manifest.snapshot?.state !== 'SNAPSHOT') fail('manifest evidence state must be SNAPSHOT');
  if (manifest.snapshot?.remote_refresh_required_for_current_state !== true) {
    fail('manifest must require a remote refresh for current state');
  }
  if (manifest.ledger?.path !== 'docs/overclaim-ledger.json') {
    fail('manifest must pin the canonical ledger path');
  }
  if (manifest.ledger?.sha256 !== sha256(ledgerBytes)) {
    fail('manifest ledger SHA-256 does not match ledger bytes');
  }

  const evidenceById = new Map();
  for (const artifact of manifest.artifacts ?? []) {
    if (evidenceById.has(artifact.id)) {
      fail(`duplicate manifest evidence id: ${artifact.id}`);
      continue;
    }
    if (!/^[0-9a-f]{64}$/.test(artifact.sha256 ?? '')) {
      fail(`${artifact.id}: invalid SHA-256`);
      continue;
    }

    let artifactPath;
    try {
      artifactPath = safePath(root, artifact.path);
    } catch (error) {
      fail(`${artifact.id}: ${error.message}`);
      continue;
    }
    if (!fs.existsSync(artifactPath)) {
      fail(`${artifact.id}: evidence file does not exist`);
      continue;
    }

    const bytes = fs.readFileSync(artifactPath);
    if (sha256(bytes) !== artifact.sha256) {
      fail(`${artifact.id}: evidence SHA-256 mismatch`);
      continue;
    }

    const evidence = JSON.parse(bytes.toString('utf8'));
    if (evidence.source_url !== artifact.source) {
      fail(`${artifact.id}: manifest source does not match evidence source_url`);
    }
    evidenceById.set(artifact.id, evidence);
  }

  const incidents = ledger.incidents ?? [];
  const ids = new Set();
  const countedEvidenceRefs = new Set();
  const countedDetectionSources = new Set();
  const countedCorrectionSources = new Set();
  let totalSeconds = 0;
  for (const incident of incidents) {
    if (ids.has(incident.id)) fail(`duplicate incident id: ${incident.id}`);
    ids.add(incident.id);
    if (incident.maturity !== 'MEASURED') fail(`${incident.id}: maturity must be MEASURED`);
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
    if (incident.observed_correction_time_seconds !== duration) {
      fail(
        `${incident.id}: observed_correction_time_seconds=${incident.observed_correction_time_seconds}, expected ${duration}`,
      );
    }
    totalSeconds += duration;

    if (!validGitHubUrl(incident.first_run_url, 'run')) {
      fail(`${incident.id}: invalid first_run_url`);
    }
    if (!validGitHubUrl(incident.correction_url, 'commit')) {
      fail(`${incident.id}: invalid correction_url`);
    }

    const refs = incident.evidence_refs ?? [];
    if (new Set(refs).size !== refs.length) fail(`${incident.id}: duplicate evidence reference`);
    if (refs.length !== 2) fail(`${incident.id}: expected detection and correction evidence`);
    for (const ref of refs) {
      if (countedEvidenceRefs.has(ref)) {
        fail(
          `${incident.id}: counted evidence reference is already used by another incident: ${ref}`,
        );
      }
      countedEvidenceRefs.add(ref);
    }
    const detection = evidenceById.get(refs[0]);
    const correction = evidenceById.get(refs[1]);
    if (detection?.kind !== 'github_actions_policy_finding') {
      fail(`${incident.id}: missing policy-finding snapshot`);
    } else {
      if (countedDetectionSources.has(detection.source_url)) {
        fail(`${incident.id}: detection source is already counted by another incident`);
      }
      countedDetectionSources.add(detection.source_url);
      if (detection.source_url !== incident.first_run_url) {
        fail(`${incident.id}: detection source URL mismatch`);
      }
      if (detection.run_conclusion !== 'failure') {
        fail(`${incident.id}: detection run must have failed`);
      }
      if (detection.failed_step_completed_at !== incident.first_detected_at) {
        fail(`${incident.id}: detection timestamp mismatch`);
      }
    }
    if (correction?.kind !== 'github_commit_correction') {
      fail(`${incident.id}: missing correction snapshot`);
    } else {
      if (countedCorrectionSources.has(correction.source_url)) {
        fail(`${incident.id}: correction source is already counted by another incident`);
      }
      countedCorrectionSources.add(correction.source_url);
      const expectedCorrectionUrl = `https://github.com/${correction.repository}/commit/${correction.commit}`;
      if (correction.source_url !== incident.correction_url) {
        fail(`${incident.id}: correction source URL mismatch`);
      }
      if (correction.source_url !== expectedCorrectionUrl) {
        fail(`${incident.id}: correction source URL does not bind the correction commit`);
      }
      if (correction.commit !== incident.correction_commit) {
        fail(`${incident.id}: correction commit mismatch`);
      }
      if (correction.committed_at !== incident.corrected_at) {
        fail(`${incident.id}: correction timestamp mismatch`);
      }
      if (correction.signature_verified !== true) {
        fail(`${incident.id}: correction commit is not signature-verified`);
      }
    }
  }

  const metrics = ledger.metrics ?? {};
  for (const key of Object.keys(metrics)) {
    if (key.toLowerCase().includes('mean')) {
      fail(`metric ${key} mislabels a one-sample observation as a mean`);
    }
  }
  if (metrics.ci_detected_incidents !== incidents.length) {
    fail(`ci_detected_incidents=${metrics.ci_detected_incidents}, expected ${incidents.length}`);
  }
  if (metrics.correction_time_sample_size !== incidents.length) {
    fail(
      `correction_time_sample_size=${metrics.correction_time_sample_size}, expected ${incidents.length}`,
    );
  }
  if (metrics.correction_time_sample_size === 1 && metrics.aggregation !== 'single_observation') {
    fail('a one-sample correction metric must use single_observation aggregation');
  }
  if (metrics.observed_correction_time_seconds !== totalSeconds) {
    fail(
      `observed_correction_time_seconds=${metrics.observed_correction_time_seconds}, expected ${totalSeconds}`,
    );
  }
  const expectedDisplay = formatDuration(totalSeconds);
  if (metrics.observed_correction_time_display !== expectedDisplay) {
    fail(
      `observed_correction_time_display=${metrics.observed_correction_time_display}, expected ${expectedDisplay}`,
    );
  }

  for (const related of ledger.related_non_ci_incidents ?? []) {
    if (related.counted_in_ci_metric !== false) {
      fail(`${related.id}: related non-CI incident must be excluded from the CI metric`);
    }
    if (related.maturity !== 'REPORTED') {
      fail(`${related.id}: related incident maturity must remain REPORTED`);
    }
    if (related.correction_status !== 'OPEN_UNVERIFIED') {
      fail(`${related.id}: correction must remain OPEN_UNVERIFIED`);
    }
    const refs = related.evidence_refs ?? [];
    if (new Set(refs).size !== refs.length) fail(`${related.id}: duplicate evidence reference`);
    if (refs.length !== 3) {
      fail(`${related.id}: expected report, guard, and reconciliation evidence`);
    }
    for (const ref of refs) {
      if (!evidenceById.has(ref)) fail(`${related.id}: missing evidence ${ref}`);
    }
    const evidence = refs.map((ref) => evidenceById.get(ref)).filter(Boolean);
    const report = evidence.find((artifact) => artifact.kind === 'operations_commit_report');
    const guard = evidence.find((artifact) => artifact.kind === 'github_actions_policy_pass');
    const reconciliation = evidence.find(
      (artifact) => artifact.kind === 'candidate_reconciliation_commit',
    );
    if (!report) {
      fail(`${related.id}: missing operations report snapshot`);
    } else {
      const expectedReportUrl = `https://github.com/${report.repository}/commit/${report.commit}`;
      if (report.source_url !== related.evidence_commit_url) {
        fail(`${related.id}: report source URL mismatch`);
      }
      if (report.source_url !== expectedReportUrl) {
        fail(`${related.id}: report source URL does not bind the reported commit`);
      }
      if (report.committed_at !== related.detected_at) {
        fail(`${related.id}: report timestamp mismatch`);
      }
    }
    if (!guard) {
      fail(`${related.id}: missing overclaim guard snapshot`);
    } else {
      const expectedGuardUrl = `https://github.com/${guard.repository}/actions/runs/${guard.run_id}`;
      if (guard.source_url !== related.overclaim_guard_run_url) {
        fail(`${related.id}: guard source URL mismatch`);
      }
      if (guard.source_url !== expectedGuardUrl) {
        fail(`${related.id}: guard source URL does not bind the run id`);
      }
      if (guard.run_conclusion !== related.overclaim_guard_conclusion) {
        fail(`${related.id}: guard conclusion mismatch`);
      }
    }
    if (!reconciliation) {
      fail(`${related.id}: missing reconciliation snapshot`);
    } else {
      const expectedReconciliationUrl = `https://github.com/${reconciliation.repository}/commit/${reconciliation.commit}`;
      if (reconciliation.source_url !== related.candidate_reconciliation_commit_url) {
        fail(`${related.id}: reconciliation source URL mismatch`);
      }
      if (reconciliation.source_url !== expectedReconciliationUrl) {
        fail(`${related.id}: reconciliation source URL does not bind the candidate commit`);
      }
      if (reconciliation.independent_live_verification !== false) {
        fail(`${related.id}: reconciliation snapshot must remain independently unverified`);
      }
    }
  }

  return failures;
}

function run() {
  const ledgerPath = safePath(ROOT, 'docs/overclaim-ledger.json');
  const manifestPath = safePath(ROOT, 'docs/overclaim-ledger.evidence.json');
  const ledgerBytes = fs.readFileSync(ledgerPath);
  const ledger = JSON.parse(ledgerBytes.toString('utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const failures = validateOverclaimLedger({ ledger, ledgerBytes, manifest });

  const output = (message) => process.stdout.write(`${message}\n`);
  const errorOutput = (message) => process.stderr.write(`${message}\n`);
  output('Overclaim ledger validation');
  output(`  maturity: ${ledger.maturity}`);
  output(`  evidence state: ${ledger.snapshot.state}`);
  output(`  unique CI incidents: ${ledger.metrics.ci_detected_incidents}`);
  output(`  correction observations: ${ledger.metrics.correction_time_sample_size}`);

  if (failures.length > 0) {
    for (const message of failures) errorOutput(`  FAIL ${message}`);
    process.exitCode = 1;
    return;
  }
  output('  PASS evidence digests, bindings, labels, and computed metrics agree');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invokedPath === fileURLToPath(import.meta.url).toLowerCase()) run();
