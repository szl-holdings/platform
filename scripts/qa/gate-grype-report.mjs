#!/usr/bin/env node

/**
 * Fail-closed gate for the raw Grype filesystem/SCA JSON report.
 *
 * Grype findings are never suppressed. Every raw High/Critical match remains
 * visible in the report and JSON artifact. A finding is promotional only when
 * Grype binds it to the exact advisory/package/version in the repository's
 * time-bounded mitigation manifest and the registered patch digest verifies.
 * The gate executes repository-owned patch behavior tests before admitting a
 * mitigation; a workflow-only test result is never treated as gate evidence.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument, parse as parseYaml } from 'yaml';

import {
  runRegisteredBehaviorVerifications,
  verifyMitigationManifest,
} from './generate-vuln-report.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DEFAULT_INPUT = path.join(ROOT, 'grype-results.json');
const DEFAULT_OUTPUT = path.join(ROOT, 'grype-gate-report.md');
const EXPECTED_GRYPE_VERSION = '0.118.0';
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'negligible', 'unknown'];
const BLOCKING_SEVERITIES = new Set(['critical', 'high']);
const MAX_GRYPE_REPORT_AGE_MS = 60 * 60 * 1000;
const MAX_GRYPE_DB_AGE_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

/**
 * JSON.parse silently accepts duplicate object keys with last-key-wins
 * semantics. Security evidence must reject that ambiguity at every nesting
 * level, while still using JSON.parse as the authority for strict JSON syntax.
 */
export function parseStrictJsonEvidence(raw, label = 'JSON evidence') {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error(`${label} must be nonempty JSON text`);
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} is not valid JSON (${error.message})`);
  }
  const duplicateCheck = parseDocument(raw, { schema: 'json', uniqueKeys: true });
  if (duplicateCheck.errors.length > 0) {
    throw new Error(
      `${label} contains duplicate-key ambiguity (${duplicateCheck.errors
        .map((error) => error.message.replaceAll('\n', ' '))
        .join('; ')})`,
    );
  }
  return value;
}

function normalizedVersion(value) {
  return String(value).replace(/^v/, '');
}

function rfc3339Instant(value, label) {
  const text = nonEmptyString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(text)) {
    throw new Error(`${label} must be an RFC 3339 timestamp with an explicit timezone`);
  }
  const epoch = Date.parse(text);
  if (!Number.isFinite(epoch)) throw new Error(`${label} must be a real RFC 3339 timestamp`);
  return { epoch, text };
}

function validateEvidenceAge({ epoch, label, maxAge, now, evidenceErrors }) {
  const age = now.getTime() - epoch;
  if (age < -MAX_FUTURE_CLOCK_SKEW_MS) {
    evidenceErrors.push(`${label} is more than five minutes in the future`);
  } else if (age > maxAge) {
    evidenceErrors.push(`${label} is older than ${Math.round(maxAge / (60 * 60 * 1000))} hours`);
  }
}

function matchIdentifiers(match, index) {
  if (!Array.isArray(match.relatedVulnerabilities)) {
    throw new Error(`matches[${index}].relatedVulnerabilities must be an array`);
  }
  if (!Array.isArray(match.vulnerability.advisories)) {
    throw new Error(`matches[${index}].vulnerability.advisories must be an array`);
  }

  const identifiers = new Set([match.vulnerability.id]);
  for (const [relatedIndex, related] of match.relatedVulnerabilities.entries()) {
    if (!isRecord(related)) {
      throw new Error(
        `matches[${index}].relatedVulnerabilities[${relatedIndex}] must be an object`,
      );
    }
    identifiers.add(
      nonEmptyString(related.id, `matches[${index}].relatedVulnerabilities[${relatedIndex}].id`),
    );
  }
  for (const [advisoryIndex, advisory] of match.vulnerability.advisories.entries()) {
    if (!isRecord(advisory)) {
      throw new Error(
        `matches[${index}].vulnerability.advisories[${advisoryIndex}] must be an object`,
      );
    }
    identifiers.add(
      nonEmptyString(
        advisory.id,
        `matches[${index}].vulnerability.advisories[${advisoryIndex}].id`,
      ),
    );
  }
  return [...identifiers].sort();
}

/**
 * Validate the pinned Grype JSON evidence before policy evaluation.
 */
export function normalizeGrypeReport(
  value,
  expectedVersion = EXPECTED_GRYPE_VERSION,
  expectedRoot = ROOT,
  now = new Date(),
) {
  if (!isRecord(value)) throw new Error('Grype report must be a JSON object');
  if (!Array.isArray(value.matches)) throw new Error('Grype report matches must be an array');
  if (!isRecord(value.descriptor)) throw new Error('Grype report descriptor must be an object');
  if (!isRecord(value.source)) throw new Error('Grype report source must be an object');
  // Grype v0.118.0 models.Document marks this slice `omitempty`, so the
  // pinned presenter omits it when no matches were ignored. Explicit malformed
  // values must still fail closed rather than silently discarding evidence.
  // https://github.com/anchore/grype/blob/v0.118.0/grype/presenter/models/document.go
  const ignoredMatches = Object.hasOwn(value, 'ignoredMatches') ? value.ignoredMatches : [];
  if (!Array.isArray(ignoredMatches)) {
    throw new Error('Grype report ignoredMatches must be an array');
  }

  const scannerName = nonEmptyString(value.descriptor.name, 'descriptor.name');
  const scannerVersion = nonEmptyString(value.descriptor.version, 'descriptor.version');
  const sourceType = nonEmptyString(value.source.type, 'source.type');
  const sourceTarget = nonEmptyString(value.source.target, 'source.target');
  const evidenceErrors = [];

  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error('Grype evidence evaluation time must be a valid Date');
  }

  const reportTimestamp = rfc3339Instant(value.descriptor.timestamp, 'descriptor.timestamp');
  validateEvidenceAge({
    epoch: reportTimestamp.epoch,
    evidenceErrors,
    label: 'Grype report timestamp',
    maxAge: MAX_GRYPE_REPORT_AGE_MS,
    now,
  });

  if (!isRecord(value.descriptor.configuration)) {
    throw new Error('descriptor.configuration must be an object');
  }
  const databaseConfiguration = value.descriptor.configuration.db;
  if (!isRecord(databaseConfiguration)) {
    throw new Error('descriptor.configuration.db must be an object');
  }
  if (value.descriptor.configuration.timestamp !== true) {
    evidenceErrors.push('Grype report timestamps were not enabled in scanner configuration');
  }
  if (databaseConfiguration['validate-age'] !== true) {
    evidenceErrors.push('Grype database age validation was not enabled');
  }
  if (databaseConfiguration['validate-by-hash-on-start'] !== true) {
    evidenceErrors.push('Grype database checksum validation was not enabled');
  }

  if (!isRecord(value.descriptor.db)) throw new Error('descriptor.db must be an object');
  if (!isRecord(value.descriptor.db.status)) {
    throw new Error('descriptor.db.status must be an object');
  }
  const databaseStatus = value.descriptor.db.status;
  const databaseSchemaVersion = nonEmptyString(
    databaseStatus.schemaVersion,
    'descriptor.db.status.schemaVersion',
  );
  if (!/^6\.\d+\.\d+$/.test(databaseSchemaVersion)) {
    evidenceErrors.push(
      `Grype database schema ${databaseSchemaVersion} is not a pinned-scanner v6 schema`,
    );
  }
  const databaseBuilt = rfc3339Instant(databaseStatus.built, 'descriptor.db.status.built');
  validateEvidenceAge({
    epoch: databaseBuilt.epoch,
    evidenceErrors,
    label: 'Grype vulnerability database build',
    maxAge: MAX_GRYPE_DB_AGE_MS,
    now,
  });
  if (databaseStatus.valid !== true) {
    evidenceErrors.push('Grype vulnerability database status is not valid');
  }
  if (databaseStatus.error !== undefined && databaseStatus.error !== '') {
    evidenceErrors.push(
      `Grype vulnerability database reported an error: ${String(databaseStatus.error).slice(0, 200)}`,
    );
  }

  const databaseSource = nonEmptyString(databaseStatus.from, 'descriptor.db.status.from');
  try {
    const sourceUrl = new URL(databaseSource);
    const checksum = sourceUrl.searchParams.get('checksum');
    if (sourceUrl.protocol !== 'https:') {
      evidenceErrors.push('Grype vulnerability database source is not HTTPS');
    }
    if (!/^sha256:[a-f0-9]{64}$/.test(checksum ?? '')) {
      evidenceErrors.push('Grype vulnerability database source lacks an exact SHA-256 checksum');
    }
  } catch {
    evidenceErrors.push('Grype vulnerability database source is not a valid URL');
  }

  if (!isRecord(value.descriptor.db.providers)) {
    throw new Error('descriptor.db.providers must be an object');
  }
  const databaseProviders = Object.entries(value.descriptor.db.providers);
  if (databaseProviders.length === 0) {
    evidenceErrors.push('Grype vulnerability database provider provenance is empty');
  }
  for (const [provider, provenance] of databaseProviders) {
    if (!provider.trim() || !isRecord(provenance)) {
      throw new Error('descriptor.db.providers contains malformed provenance');
    }
  }

  if (scannerName.toLowerCase() !== 'grype') {
    evidenceErrors.push(`scanner name ${scannerName} is not Grype`);
  }
  if (normalizedVersion(scannerVersion) !== normalizedVersion(expectedVersion)) {
    evidenceErrors.push(
      `scanner version ${scannerVersion} does not match pinned ${expectedVersion}`,
    );
  }
  if (sourceType !== 'directory') {
    evidenceErrors.push(`scan source type ${sourceType} is not directory`);
  }
  const repositoryRoot = path.resolve(expectedRoot);
  const scannedDirectory = path.isAbsolute(sourceTarget)
    ? path.normalize(sourceTarget)
    : path.resolve(repositoryRoot, sourceTarget);
  if (scannedDirectory !== repositoryRoot) {
    evidenceErrors.push(
      `scan source target ${sourceTarget} does not resolve to repository root ${repositoryRoot}`,
    );
  }

  const ignoredCount = ignoredMatches.length;
  if (ignoredCount > 0) {
    evidenceErrors.push(
      `${ignoredCount} Grype/VEX ignored match(es) were present; this gate admits no scanner suppression`,
    );
  }

  const matches = value.matches.map((match, index) => {
    if (!isRecord(match)) throw new Error(`matches[${index}] must be an object`);
    if (!isRecord(match.vulnerability)) {
      throw new Error(`matches[${index}].vulnerability must be an object`);
    }
    if (!isRecord(match.artifact)) {
      throw new Error(`matches[${index}].artifact must be an object`);
    }

    const vulnerabilityId = nonEmptyString(
      match.vulnerability.id,
      `matches[${index}].vulnerability.id`,
    );
    const severity = nonEmptyString(
      match.vulnerability.severity,
      `matches[${index}].vulnerability.severity`,
    ).toLowerCase();
    if (!SEVERITIES.includes(severity)) {
      throw new Error(`matches[${index}] has unsupported severity ${severity}`);
    }
    const packageName = nonEmptyString(match.artifact.name, `matches[${index}].artifact.name`);
    const packageVersion = nonEmptyString(
      match.artifact.version,
      `matches[${index}].artifact.version`,
    );
    const packageType = nonEmptyString(match.artifact.type, `matches[${index}].artifact.type`);

    return {
      identifiers: matchIdentifiers(match, index),
      packageName,
      packageType,
      packageVersion,
      severity,
      vulnerabilityId,
    };
  });

  return {
    evidenceErrors,
    ignoredCount,
    matches,
    scannerName,
    scannerVersion,
    databaseBuilt: databaseBuilt.text,
    databaseSchemaVersion,
    databaseSource,
    reportTimestamp: reportTimestamp.text,
    sourceTarget,
    sourceType,
  };
}

function configuredMitigations(manifest) {
  const errors = [];
  const configured = new Map();
  if (!isRecord(manifest) || manifest.schemaVersion !== 1 || !Array.isArray(manifest.mitigations)) {
    return {
      configured,
      errors: [
        'security/vulnerability-mitigations.json must use schemaVersion 1 with a mitigations array',
      ],
    };
  }

  for (const entry of manifest.mitigations) {
    if (!isRecord(entry) || typeof entry.advisory !== 'string' || entry.advisory.length === 0) {
      errors.push('every vulnerability mitigation must declare a non-empty advisory identifier');
      continue;
    }
    if (configured.has(entry.advisory)) {
      errors.push(`duplicate vulnerability mitigation for ${entry.advisory}`);
      continue;
    }
    configured.set(entry.advisory, entry);
  }
  return { configured, errors };
}

function rawCounts(matches) {
  const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
  for (const match of matches) counts[match.severity] += 1;
  return counts;
}

function uniqueBlockingMatches(matches) {
  const grouped = new Map();
  for (const match of matches) {
    if (!BLOCKING_SEVERITIES.has(match.severity)) continue;
    const key = [
      match.vulnerabilityId,
      match.packageName,
      match.packageType,
      match.packageVersion,
      match.severity,
      ...match.identifiers,
    ].join('\u0000');
    const current = grouped.get(key);
    if (current) {
      current.occurrences += 1;
    } else {
      grouped.set(key, { ...match, occurrences: 1 });
    }
  }
  return [...grouped.values()].sort((a, b) =>
    [a.packageName, a.packageVersion, a.vulnerabilityId]
      .join('\u0000')
      .localeCompare([b.packageName, b.packageVersion, b.vulnerabilityId].join('\u0000')),
  );
}

/**
 * Apply repository mitigation policy without removing any raw scanner result.
 */
export function evaluateGrypeReport(
  normalized,
  manifest,
  {
    behaviorRunner = runRegisteredBehaviorVerifications,
    now = new Date(),
    patchedDependencies = {},
    root = ROOT,
    verifiedBehaviors,
  } = {},
) {
  const counts = rawCounts(normalized.matches);
  const findings = uniqueBlockingMatches(normalized.matches);
  const manifestState = configuredMitigations(manifest);
  const errors = [...normalized.evidenceErrors, ...manifestState.errors];
  const eligibleByAdvisory = new Map();

  for (const finding of findings) {
    if (manifestState.errors.length > 0) {
      finding.disposition = 'BLOCKING';
      finding.reason = 'mitigation manifest structure is not trustworthy';
      continue;
    }
    const candidates = finding.identifiers
      .filter((identifier) => manifestState.configured.has(identifier))
      .map((identifier) => manifestState.configured.get(identifier));

    if (candidates.length === 0) {
      finding.disposition = 'BLOCKING';
      finding.reason = 'no exact advisory entry exists in the mitigation manifest';
      continue;
    }
    if (candidates.length > 1) {
      finding.disposition = 'BLOCKING';
      finding.reason = `multiple mitigation entries match Grype identifiers: ${candidates
        .map((entry) => entry.advisory)
        .join(', ')}`;
      continue;
    }

    const entry = candidates[0];
    finding.correlatedAdvisory = entry.advisory;
    if (finding.packageType !== 'npm') {
      finding.disposition = 'BLOCKING';
      finding.reason = `${entry.advisory}: package ecosystem ${finding.packageType} is not npm`;
      continue;
    }
    if (finding.packageName !== entry.package) {
      finding.disposition = 'BLOCKING';
      finding.reason = `${entry.advisory}: package does not match the Grype finding`;
      continue;
    }
    if (finding.packageVersion !== entry.version) {
      finding.disposition = 'BLOCKING';
      finding.reason = `${entry.advisory}: installed finding versions do not exactly match ${entry.version}`;
      continue;
    }
    if (finding.severity !== String(entry.severity ?? '').toLowerCase()) {
      finding.disposition = 'BLOCKING';
      finding.reason = `${entry.advisory}: severity does not match the Grype finding`;
      continue;
    }

    const group = eligibleByAdvisory.get(entry.advisory) ?? { entry, findings: [] };
    group.findings.push(finding);
    eligibleByAdvisory.set(entry.advisory, group);
  }

  const syntheticAdvisories = {};
  const filteredEntries = [];
  for (const [advisory, group] of eligibleByAdvisory) {
    filteredEntries.push(group.entry);
    syntheticAdvisories[advisory] = {
      findings: group.findings.map((finding) => ({ version: finding.packageVersion })),
      github_advisory_id: advisory,
      module_name: group.entry.package,
      severity: group.entry.severity,
    };
  }

  let behaviorResult = { errors: [], verified: new Set() };
  if (filteredEntries.length > 0) {
    if (verifiedBehaviors === undefined) {
      try {
        behaviorResult = behaviorRunner(
          filteredEntries.map((entry) => entry.verification),
          { root },
        );
      } catch (error) {
        behaviorResult = {
          errors: [`registered behavior verification could not run (${error.message})`],
          verified: new Set(),
        };
      }
    } else {
      behaviorResult = { errors: [], verified: new Set(verifiedBehaviors) };
    }
  }

  const verification = verifyMitigationManifest(
    { advisories: syntheticAdvisories },
    { schemaVersion: 1, mitigations: filteredEntries },
    {
      now,
      patchedDependencies,
      root,
      verifiedBehaviors: behaviorResult.verified,
    },
  );
  errors.push(...behaviorResult.errors, ...verification.errors);

  for (const group of eligibleByAdvisory.values()) {
    const admitted = verification.mitigated.has(group.entry.advisory);
    for (const finding of group.findings) {
      if (admitted) {
        finding.disposition = 'VERIFIED LOCAL PATCH';
        finding.mitigation = group.entry;
        finding.reason = `exact ${group.entry.advisory} patch and behavior evidence verified`;
      } else {
        finding.disposition = 'BLOCKING';
        const relevantErrors = [...behaviorResult.errors, ...verification.errors].filter((error) =>
          error.startsWith(`${group.entry.advisory}:`),
        );
        finding.reason = relevantErrors.join('; ') || 'local patch verification did not complete';
      }
    }
  }

  const blocked = findings.filter((finding) => finding.disposition !== 'VERIFIED LOCAL PATCH');
  const passed = errors.length === 0 && blocked.length === 0;
  return {
    blocked,
    counts,
    errors,
    findings,
    passed,
    rawMatchCount: normalized.matches.length,
    reason: passed
      ? findings.length > 0
        ? `all ${findings.length} unique raw High/Critical finding(s) have exact verified local patches`
        : 'no raw High/Critical findings'
      : `${errors.length} evidence/policy error(s) and ${blocked.length} unmitigated unique High/Critical finding(s)`,
  };
}

function tableCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export function renderGrypeGateReport(normalized, evaluation, generated = new Date()) {
  let report = '# Grype Filesystem/SCA Gate Report\n\n';
  report += `**Generated:** ${generated.toISOString()}\n`;
  report += `**Verdict:** ${evaluation.passed ? 'PASS' : 'FAIL'} — ${evaluation.reason}.\n`;
  report += `**Scanner:** \`${tableCell(normalized.scannerName)} ${tableCell(normalized.scannerVersion)}\`\n`;
  report += `**Scan timestamp:** \`${tableCell(normalized.reportTimestamp)}\`\n`;
  report += `**Vulnerability database:** schema \`${tableCell(normalized.databaseSchemaVersion)}\`, built \`${tableCell(normalized.databaseBuilt)}\`\n`;
  report += `**Database source:** \`${tableCell(normalized.databaseSource)}\`\n`;
  report += `**Source:** \`${tableCell(normalized.sourceType)}:${tableCell(normalized.sourceTarget)}\`\n`;
  report += `**Raw match count:** ${evaluation.rawMatchCount}\n`;
  report += `**Ignored match count:** ${normalized.ignoredCount}\n\n`;
  report +=
    '**Policy:** raw findings are retained. High/Critical findings block unless the exact Grype advisory/package/version is covered by a registered, digest-bound, unexpired local patch whose behavior test ran before this gate. Scanner/VEX ignores are not admitted.\n\n';

  report += '## Raw scanner counts\n\n';
  report += '| Severity | Match count |\n|---|---:|\n';
  for (const severity of SEVERITIES) {
    report += `| ${severity[0].toUpperCase()}${severity.slice(1)} | ${evaluation.counts[severity]} |\n`;
  }
  report += '\n';

  report += '## Raw High/Critical findings and disposition\n\n';
  if (evaluation.findings.length === 0) {
    report += 'No raw High/Critical matches were reported.\n\n';
  } else {
    report +=
      '| Package | Type | Version | Grype primary ID | Correlated IDs | Severity | Raw occurrences | Disposition |\n';
    report += '|---|---|---:|---|---|---|---:|---|\n';
    for (const finding of evaluation.findings) {
      const disposition =
        finding.disposition === 'VERIFIED LOCAL PATCH'
          ? `${finding.disposition} (${finding.mitigation.advisory}; expires ${finding.mitigation.expires})`
          : `${finding.disposition}: ${finding.reason}`;
      report += `| \`${tableCell(finding.packageName)}\` | \`${tableCell(finding.packageType)}\` | \`${tableCell(finding.packageVersion)}\` | \`${tableCell(finding.vulnerabilityId)}\` | ${finding.identifiers.map((id) => `\`${tableCell(id)}\``).join(', ')} | ${finding.severity.toUpperCase()} | ${finding.occurrences} | ${tableCell(disposition)} |\n`;
    }
    report += '\n';
  }

  if (evaluation.errors.length > 0) {
    report += '## Evidence or policy errors\n\n';
    for (const error of evaluation.errors) report += `- ${error}\n`;
    report += '\n';
  }

  report +=
    '_The unmodified `grype-results.json` artifact is the raw authority for every scanner match. This report adds disposition; it does not remove findings._\n';
  return report;
}

function renderFatalReport(error, generated = new Date()) {
  return `# Grype Filesystem/SCA Gate Report\n\n**Generated:** ${generated.toISOString()}\n**Verdict:** FAIL — scanner evidence could not be validated.\n\n## Evidence or policy errors\n\n- ${String(error?.message ?? error).replaceAll('\n', ' ')}\n\n_The release remains blocked._\n`;
}

async function main() {
  try {
    if (process.argv.length > 2) {
      throw new Error('gate-grype-report.mjs does not accept path arguments');
    }
    const rawReport = parseStrictJsonEvidence(
      readFileSync(DEFAULT_INPUT, 'utf8'),
      'raw Grype report',
    );
    const manifest = parseStrictJsonEvidence(
      readFileSync(path.join(ROOT, 'security', 'vulnerability-mitigations.json'), 'utf8'),
      'vulnerability mitigation manifest',
    );
    const workspace = parseYaml(readFileSync(path.join(ROOT, 'pnpm-workspace.yaml'), 'utf8'));
    const normalized = normalizeGrypeReport(rawReport);
    const evaluation = evaluateGrypeReport(normalized, manifest, {
      patchedDependencies: workspace?.patchedDependencies ?? {},
    });
    writeFileSync(DEFAULT_OUTPUT, renderGrypeGateReport(normalized, evaluation));
    process.stdout.write(`${evaluation.passed ? 'PASS' : 'FAIL'}: ${evaluation.reason}\n`);
    if (!evaluation.passed) {
      const details = [
        evaluation.reason,
        ...evaluation.errors,
        ...evaluation.findings
          .filter((finding) => finding.disposition !== 'VERIFIED LOCAL PATCH')
          .map(
            (finding) =>
              `${finding.packageName}@${finding.packageVersion}: ${finding.vulnerabilityId}: ${finding.reason}`,
          ),
      ].join('\n');
      if (process.env.GITHUB_ACTIONS === 'true') {
        process.stderr.write(
          `::error title=Grype admission failure::${details.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}\n`,
        );
      }
      process.exitCode = 1;
    }
  } catch (error) {
    writeFileSync(DEFAULT_OUTPUT, renderFatalReport(error));
    process.stderr.write(`FAIL: ${error.message}\n`);
    if (process.env.GITHUB_ACTIONS === 'true') {
      process.stderr.write(
        `::error title=Grype evidence failure::${String(error.message).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')}\n`,
      );
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
