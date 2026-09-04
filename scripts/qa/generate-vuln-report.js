#!/usr/bin/env node
/**
 * Fail-closed dependency vulnerability report.
 *
 * Security authority is the parsed package-manager audit result. High/Critical
 * advisories block promotion. Moderate/Low findings remain visible but do not
 * masquerade as High/Critical failures merely because a package-manager version
 * returns a non-zero exit status for lower severities.
 *
 * We still fail closed when pnpm cannot execute, emits no parseable JSON, or
 * returns an unsupported audit schema. This keeps registry/network/parser
 * failures blocking without weakening the intended High/Critical policy.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const OUTPUT_FILE = join(OUTPUT_DIR, 'vuln-report.md');
const SEVERITIES = ['critical', 'high', 'moderate', 'low'];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseAuditJson(rawOutput, fallback = 'pnpm audit produced no JSON output') {
  if (!rawOutput || !rawOutput.trim()) throw new Error(fallback);
  try {
    return JSON.parse(rawOutput);
  } catch (err) {
    throw new Error(`Failed to parse pnpm audit JSON: ${err.message}`);
  }
}

function emptyCounts() {
  return { critical: 0, high: 0, moderate: 0, low: 0 };
}

function fromAdvisoryList(list) {
  const advisories = {};
  const counts = emptyCounts();
  for (const [index, advisory] of list.entries()) {
    if (!isRecord(advisory)) continue;
    const id = String(advisory.github_advisory_id ?? advisory.id ?? index);
    advisories[id] = advisory;
    const severity = String(advisory.severity ?? '').toLowerCase();
    if (Object.hasOwn(counts, severity)) counts[severity] += 1;
  }
  return { advisories, vulnerabilities: counts, totalDependencies: null, sourceShape: 'advisory-list' };
}

function fromAdvisoryMap(map, sourceShape = 'advisory-map') {
  const advisories = {};
  const counts = emptyCounts();
  for (const [key, value] of Object.entries(map)) {
    const entries = Array.isArray(value) ? value : [value];
    for (const [index, advisory] of entries.entries()) {
      if (!isRecord(advisory)) continue;
      const severity = String(advisory.severity ?? '').toLowerCase();
      if (!SEVERITIES.includes(severity)) continue;
      const id = String(advisory.github_advisory_id ?? advisory.id ?? `${key}-${index}`);
      advisories[id] = { ...advisory, module_name: advisory.module_name ?? key };
      counts[severity] += 1;
    }
  }
  return { advisories, vulnerabilities: counts, totalDependencies: null, sourceShape };
}

export function normalizeAuditJson(value) {
  if (Array.isArray(value)) return fromAdvisoryList(value);
  if (!isRecord(value)) throw new Error('pnpm audit JSON must be an object or array');

  if (isRecord(value.vulnerabilities)) {
    const normalized = fromAdvisoryMap(value.vulnerabilities, 'npm-vulnerabilities');
    const counts = value.metadata?.vulnerabilities;
    if (isRecord(counts)) {
      for (const severity of SEVERITIES) {
        const count = Number(counts[severity] ?? 0);
        if (Number.isSafeInteger(count) && count >= 0) normalized.vulnerabilities[severity] = count;
      }
    }
    normalized.totalDependencies = Number.isSafeInteger(value.metadata?.totalDependencies)
      ? value.metadata.totalDependencies
      : null;
    return normalized;
  }

  if (isRecord(value.advisories)) {
    const normalized = fromAdvisoryMap(value.advisories, 'legacy-advisories');
    const counts = value.metadata?.vulnerabilities;
    if (isRecord(counts)) {
      for (const severity of SEVERITIES) {
        const count = Number(counts[severity] ?? 0);
        if (Number.isSafeInteger(count) && count >= 0) normalized.vulnerabilities[severity] = count;
      }
    }
    normalized.totalDependencies = Number.isSafeInteger(value.metadata?.totalDependencies)
      ? value.metadata.totalDependencies
      : null;
    return normalized;
  }

  const mapNormalized = fromAdvisoryMap(value);
  if (Object.keys(mapNormalized.advisories).length > 0 || Object.keys(value).length === 0) {
    return mapNormalized;
  }
  throw new Error('unsupported pnpm audit JSON shape');
}

export function validateAuditJson(value) {
  normalizeAuditJson(value);
}

/**
 * Fail closed unless a supported audit payload was parsed and it contains no
 * High/Critical advisory. Lower severities stay reportable, not promotional.
 */
export function auditBlockingVerdict(normalized, spawnError = null) {
  if (spawnError || !normalized) {
    return { passed: false, reason: 'audit execution or JSON parsing was unavailable' };
  }
  const counts = normalized.vulnerabilities ?? emptyCounts();
  const high = Number(counts.high ?? 0);
  const critical = Number(counts.critical ?? 0);
  const advisories = Object.values(normalized.advisories ?? {});
  const parsedBlocking = advisories.filter((a) => ['critical', 'high'].includes(advisorySeverity(a)));
  const passed = high === 0 && critical === 0 && parsedBlocking.length === 0;
  return {
    passed,
    reason: passed
      ? 'no parsed High/Critical advisory'
      : `${critical} Critical and ${high} High advisories reported`,
  };
}

function readOverrides() {
  const workspace = parseYaml(readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8'));
  return workspace?.overrides ?? {};
}

function advisorySeverity(advisory) {
  return String(advisory?.severity ?? '').toLowerCase();
}

function renderRow(advisory) {
  const pkg = advisory.module_name ?? advisory.name ?? 'unknown';
  const id = advisory.github_advisory_id ?? advisory.id ?? 'N/A';
  const url = advisory.url ?? '#';
  const range = advisory.vulnerable_versions ?? advisory.range ?? 'unknown';
  return `| \`${pkg}\` | [${id}](${url}) | ${String(advisory.severity ?? 'unknown').toUpperCase()} | \`${range}\` |\n`;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const audit = spawnSync('pnpm', ['audit', '--json', '--audit-level=high'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  const stdout = audit.stdout ?? '';
  const stderr = audit.stderr ?? '';
  let normalized = null;
  let parseNote = null;
  try {
    normalized = normalizeAuditJson(parseAuditJson(stdout));
  } catch (err) {
    parseNote = err.message;
  }

  const counts = normalized?.vulnerabilities ?? emptyCounts();
  const advisories = Object.values(normalized?.advisories ?? {});
  const blocking = advisories.filter((a) => ['critical', 'high'].includes(advisorySeverity(a)));
  const verdict = auditBlockingVerdict(normalized, audit.error ?? null);
  const generated = new Date().toISOString();

  let report = '# Dependency Vulnerability Report\n\n';
  report += `**Generated:** ${generated}\n`;
  report += '**Policy:** parsed High/Critical advisories block; Moderate/Low remain reported\n';
  report += '**Command:** `pnpm audit --json --audit-level=high`\n';
  report += `**Command exit status:** ${audit.status ?? 'UNAVAILABLE'}\n`;
  report += `**Parsed schema:** ${normalized?.sourceShape ?? 'UNAVAILABLE'}\n`;
  report += `**Total dependencies reported by audit:** ${normalized?.totalDependencies ?? 'not reported'}\n\n`;
  report += '## Blocking verdict\n\n';
  report += verdict.passed
    ? `PASS — ${verdict.reason}.\n\n`
    : `FAIL — ${verdict.reason}; release remains blocked.\n\n`;

  report += '## Parsed counts\n\n';
  report += '| Severity | Count |\n|---|---:|\n';
  for (const severity of SEVERITIES) {
    report += `| ${severity[0].toUpperCase() + severity.slice(1)} | ${counts[severity]} |\n`;
  }
  report += '\n';

  if (blocking.length) {
    report += '## Parsed High / Critical findings\n\n';
    report += '| Package | Advisory | Severity | Vulnerable range |\n|---|---|---|---|\n';
    for (const advisory of blocking) report += renderRow(advisory);
    report += '\n';
  }

  if (parseNote) {
    report += '## Parser note\n\n';
    report += `Audit JSON was not recognized for detailed reporting: \`${parseNote}\`. `;
    report += 'The blocking verdict remains FAIL because an unsupported or unavailable audit cannot be admitted.\n\n';
  }
  if (audit.error) {
    report += '## Audit execution error\n\n```text\n';
    report += String(audit.error.message ?? audit.error).slice(0, 4000).replace(/```/g, "''' ");
    report += '\n```\n\n';
  }
  if (stderr.trim()) {
    report += '## Audit stderr\n\n```text\n';
    report += stderr.trim().slice(0, 4000).replace(/```/g, "''' ");
    report += '\n```\n\n';
  }

  const overrideEntries = Object.entries(readOverrides());
  if (overrideEntries.length) {
    report += '## Workspace overrides\n\n| Package | Pinned version |\n|---|---|\n';
    for (const [pkg, version] of overrideEntries) report += `| \`${pkg}\` | \`${version}\` |\n`;
    report += '\n';
  }

  report += '_CI fails closed on High/Critical findings and on audit execution/parser failure. Moderate/Low findings remain visible and non-promotional._\n';
  writeFileSync(OUTPUT_FILE, report);

  if (!verdict.passed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
