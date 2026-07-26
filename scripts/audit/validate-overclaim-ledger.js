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

function markdownRows(markdown, label) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith('|'))
    .filter((line) => line.split('|')[1]?.trim() === label);
}

function markdownSection(markdown, id) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith(`### ${id}`));
  if (start < 0) return null;
  const next = lines.findIndex((line, index) => index > start && line.startsWith('### '));
  return lines.slice(start, next < 0 ? lines.length : next).join('\n');
}

function markdownTimestamp(value) {
  return typeof value === 'string' ? value.replace('T', ' ').replace(/Z$/, ' UTC') : String(value);
}

function validateEvidenceContract(artifact, evidence, fail) {
  const label = artifact.id;
  if (evidence.schema_version !== '1.0.0') {
    fail(`${label}: evidence schema_version must be 1.0.0`);
  }
  if (evidence.repository !== 'szl-holdings/platform') {
    fail(`${label}: evidence repository must be szl-holdings/platform`);
  }

  const measuredKinds = new Set([
    'github_actions_policy_finding',
    'github_commit_correction',
    'github_actions_policy_pass',
  ]);
  const reportedKinds = new Set([
    'operations_commit_report',
    'candidate_reconciliation_commit',
  ]);
  if (!measuredKinds.has(evidence.kind) && !reportedKinds.has(evidence.kind)) {
    fail(`${label}: unsupported evidence kind`);
    return;
  }
  const expectedMaturity = measuredKinds.has(evidence.kind) ? 'MEASURED' : 'REPORTED';
  if (evidence.maturity !== expectedMaturity) {
    fail(`${label}: evidence maturity must be ${expectedMaturity}`);
  }

  const runKinds = new Set(['github_actions_policy_finding', 'github_actions_policy_pass']);
  if (runKinds.has(evidence.kind)) {
    const expectedSuffix =
      evidence.kind === 'github_actions_policy_finding' ? '-detection' : '-guard';
    if (!label.endsWith(expectedSuffix)) {
      fail(`${label}: evidence id does not match kind ${evidence.kind}`);
    }
    if (!Number.isSafeInteger(evidence.run_id) || evidence.run_id <= 0) {
      fail(`${label}: run_id must be a positive safe integer`);
    }
    if (!Number.isSafeInteger(evidence.job_id) || evidence.job_id <= 0) {
      fail(`${label}: job_id must be a positive safe integer`);
    }
    if (!/^[0-9a-f]{40}$/.test(evidence.head_sha ?? '')) {
      fail(`${label}: head_sha must be a 40-character lowercase Git SHA`);
    }
    if (!['pull_request', 'push', 'workflow_dispatch', 'merge_group'].includes(evidence.event)) {
      fail(`${label}: unsupported GitHub Actions event`);
    }
    if (!['success', 'failure', 'cancelled'].includes(evidence.run_conclusion)) {
      fail(`${label}: unsupported run conclusion`);
    }
    if (typeof evidence.job_name !== 'string' || evidence.job_name.length === 0) {
      fail(`${label}: job_name must be non-empty`);
    }
    const expectedSource = `https://github.com/${evidence.repository}/actions/runs/${evidence.run_id}`;
    if (evidence.source_url !== expectedSource) {
      fail(`${label}: source_url does not bind repository and run_id`);
    }
    return;
  }

  const expectedSuffix = {
    github_commit_correction: '-correction',
    operations_commit_report: '-report',
    candidate_reconciliation_commit: '-reconciliation',
  }[evidence.kind];
  if (!label.endsWith(expectedSuffix)) {
    fail(`${label}: evidence id does not match kind ${evidence.kind}`);
  }
  if (!/^[0-9a-f]{40}$/.test(evidence.commit ?? '')) {
    fail(`${label}: commit must be a 40-character lowercase Git SHA`);
  }
  if (!Number.isFinite(Date.parse(evidence.committed_at))) {
    fail(`${label}: committed_at must be an ISO timestamp`);
  }
  if (typeof evidence.signature_verified !== 'boolean') {
    fail(`${label}: signature_verified must be boolean`);
  }
  if (typeof evidence.verification_reason !== 'string' || evidence.verification_reason.length === 0) {
    fail(`${label}: verification_reason must be non-empty`);
  }
  if (
    !Array.isArray(evidence.changed_files) ||
    evidence.changed_files.length === 0 ||
    evidence.changed_files.some(
      (file) =>
        typeof file !== 'string' ||
        file.length === 0 ||
        path.isAbsolute(file) ||
        file.split(/[\\/]/).includes('..'),
    )
  ) {
    fail(`${label}: changed_files must contain safe repository-relative paths`);
  }
  const expectedSource = `https://github.com/${evidence.repository}/commit/${evidence.commit}`;
  if (evidence.source_url !== expectedSource) {
    fail(`${label}: source_url does not bind repository and commit`);
  }
}

export function validateOverclaimLedger({ ledger, ledgerBytes, manifest, markdown, root = ROOT }) {
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
    if (typeof artifact.id !== 'string' || !/^OC-\d{4}-(?:\d{3}|R0)-[a-z-]+$/.test(artifact.id)) {
      fail('manifest evidence id is missing or malformed');
      continue;
    }
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

    let evidence;
    try {
      evidence = JSON.parse(bytes.toString('utf8'));
    } catch {
      fail(`${artifact.id}: evidence is not valid JSON`);
      continue;
    }
    if (evidence.source_url !== artifact.source) {
      fail(`${artifact.id}: manifest source does not match evidence source_url`);
    }
    validateEvidenceContract(artifact, evidence, fail);
    evidenceById.set(artifact.id, evidence);
  }

  const incidents = ledger.incidents ?? [];
  const ids = new Set();
  const countedEvidenceRefs = new Set();
  const countedDetectionSources = new Set();
  const countedCorrectionSources = new Set();
  let resolvedIncidentCount = 0;
  let totalSeconds = 0;
  for (const incident of incidents) {
    if (ids.has(incident.id)) fail(`duplicate incident id: ${incident.id}`);
    ids.add(incident.id);
    if (incident.maturity !== 'MEASURED') fail(`${incident.id}: maturity must be MEASURED`);
    if (incident.detector_type !== 'ci-policy-gate') {
      fail(`${incident.id}: counted incident is not a CI policy-gate finding`);
    }

    const detected = Date.parse(incident.first_detected_at);
    if (!Number.isFinite(detected)) fail(`${incident.id}: invalid detection timestamp`);
    if (!validGitHubUrl(incident.first_run_url, 'run')) {
      fail(`${incident.id}: invalid first_run_url`);
    }

    const isResolved = incident.correction_status === 'RESOLVED';
    const isOpen = incident.correction_status === 'OPEN';
    if (!isResolved && !isOpen) {
      fail(`${incident.id}: correction_status must be RESOLVED or OPEN`);
    }
    if (isResolved) {
      resolvedIncidentCount += 1;
      const corrected = Date.parse(incident.corrected_at);
      if (!Number.isFinite(detected) || !Number.isFinite(corrected) || corrected < detected) {
        fail(`${incident.id}: invalid correction timestamp`);
      } else {
        const duration = Math.floor((corrected - detected) / 1000);
        if (incident.observed_correction_time_seconds !== duration) {
          fail(
            `${incident.id}: observed_correction_time_seconds=${incident.observed_correction_time_seconds}, expected ${duration}`,
          );
        }
        totalSeconds += duration;
      }
      if (!validGitHubUrl(incident.correction_url, 'commit')) {
        fail(`${incident.id}: invalid correction_url`);
      }
    }
    if (isOpen) {
      const correctionFields = [
        'corrected_at',
        'correction_commit',
        'correction_url',
        'observed_correction_time_seconds',
      ];
      for (const field of correctionFields) {
        if (Object.hasOwn(incident, field)) {
          fail(`${incident.id}: open incident must omit ${field}`);
        }
      }
    }

    const refs = incident.evidence_refs ?? [];
    if (new Set(refs).size !== refs.length) fail(`${incident.id}: duplicate evidence reference`);
    const expectedRefCount = isResolved ? 2 : 1;
    if (refs.length !== expectedRefCount) {
      fail(`${incident.id}: expected detection${isResolved ? ' and correction' : ''} evidence`);
    }
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
      const expectedDetectionUrl = `https://github.com/${detection.repository}/actions/runs/${detection.run_id}`;
      if (detection.source_url !== expectedDetectionUrl) {
        fail(`${incident.id}: detection source URL does not bind the run id`);
      }
      if (detection.run_conclusion !== 'failure') {
        fail(`${incident.id}: detection run must have failed`);
      }
      if (detection.failed_step_completed_at !== incident.first_detected_at) {
        fail(`${incident.id}: detection timestamp mismatch`);
      }
    }
    if (isResolved) {
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
  if (metrics.correction_time_sample_size !== resolvedIncidentCount) {
    fail(
      `correction_time_sample_size=${metrics.correction_time_sample_size}, expected ${resolvedIncidentCount}`,
    );
  }
  const expectedAggregation =
    resolvedIncidentCount === 0
      ? 'no_observations'
      : resolvedIncidentCount === 1
        ? 'single_observation'
        : 'cumulative_observations';
  if (metrics.aggregation !== expectedAggregation) {
    fail(`correction aggregation=${metrics.aggregation}, expected ${expectedAggregation}`);
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

  const renderedMarkdown =
    markdown ?? fs.readFileSync(safePath(root, 'docs/OVERCLAIM_LEDGER.md'), 'utf8');
  const countRows = markdownRows(renderedMarkdown, 'Overclaims caught by CI');
  const expectedCountToken = `**${metrics.ci_detected_incidents}**`;
  if (countRows.length !== 1 || !countRows[0].split('|')[2]?.includes(expectedCountToken)) {
    fail('rendered Markdown CI incident count does not match the ledger metric');
  }
  const durationRows = markdownRows(renderedMarkdown, 'Observed correction time');
  const expectedDurationToken = `**${metrics.observed_correction_time_display}**`;
  const expectedSampleToken = `n=${metrics.correction_time_sample_size}`;
  if (
    durationRows.length === 0 ||
    durationRows.some(
      (row) => !row.includes(expectedDurationToken) || !row.includes(expectedSampleToken),
    )
  ) {
    fail('rendered Markdown correction-time values do not match the ledger metrics');
  }

  for (const incident of incidents) {
    const section = markdownSection(renderedMarkdown, incident.id);
    if (!section) {
      fail(`${incident.id}: rendered Markdown incident section is missing`);
      continue;
    }
    const requiredTokens = [
      [`| Maturity | **${incident.maturity}** |`, 'maturity'],
      [`| Correction state | **${incident.correction_status}** |`, 'correction state'],
      [`| Claim caught | ${incident.claim} |`, 'claim'],
      [`| Truth | ${incident.truth} |`, 'truth'],
      [`| First detection | ${markdownTimestamp(incident.first_detected_at)} |`, 'timestamp'],
      ['| Failed policy run |', 'failed-run row'],
      [`(${incident.first_run_url})`, 'failed-run URL'],
    ];
    if (incident.correction_status === 'RESOLVED') {
      requiredTokens.push(
        ['| Correction |', 'correction row'],
        [`(${incident.correction_url})`, 'correction URL'],
        [`| Corrected | ${markdownTimestamp(incident.corrected_at)} |`, 'correction timestamp'],
        [
          `| Observed correction time | **${formatDuration(incident.observed_correction_time_seconds)}** (\`n=1\`) |`,
          'correction duration',
        ],
      );
    }
    for (const [token, field] of requiredTokens) {
      if (!section.includes(token)) {
        fail(`${incident.id}: rendered Markdown ${field} does not match the ledger`);
      }
    }
  }

  for (const related of ledger.related_non_ci_incidents ?? []) {
    const section = markdownSection(renderedMarkdown, related.id);
    if (!section) {
      fail(`${related.id}: rendered Markdown incident section is missing`);
    } else {
      const requiredTokens = [
        [`| Maturity | **${related.maturity}** |`, 'maturity'],
        [`| Correction state | **${related.correction_status}** |`, 'correction state'],
        [`| Claim reported | ${related.claim} |`, 'claim'],
        [`| Truth | ${related.truth} |`, 'truth'],
        [`| Observed | ${markdownTimestamp(related.detected_at)} |`, 'timestamp'],
        ['| Operations report |', 'operations-report row'],
        [`(${related.evidence_commit_url})`, 'operations-report URL'],
        ['| Overclaim guard |', 'overclaim-guard row'],
        [`(${related.overclaim_guard_run_url})`, 'overclaim-guard URL'],
        [`**${related.overclaim_guard_conclusion}**`, 'overclaim-guard conclusion'],
        ['| Candidate reconciliation |', 'reconciliation row'],
        [`(${related.candidate_reconciliation_commit_url})`, 'reconciliation URL'],
        ['| Counted in CI metric | **No** |', 'CI-count exclusion'],
        [`**Exclusion reason:** ${related.exclusion_reason}`, 'exclusion reason'],
      ];
      for (const [token, field] of requiredTokens) {
        if (!section.includes(token)) {
          fail(`${related.id}: rendered Markdown ${field} does not match the ledger`);
        }
      }
    }
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
  const markdown = fs.readFileSync(safePath(ROOT, 'docs/OVERCLAIM_LEDGER.md'), 'utf8');
  const failures = validateOverclaimLedger({ ledger, ledgerBytes, manifest, markdown });

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
