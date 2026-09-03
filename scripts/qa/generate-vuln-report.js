#!/usr/bin/env node
/**
 * Fail-closed dependency vulnerability report.
 *
 * Security authority is the package manager itself:
 *   pnpm audit --json --audit-level=high
 *
 * Exit status 0 means pnpm found no High/Critical advisory. Any non-zero status
 * blocks the release, including registry/network failure. JSON parsing is used
 * for reporting only and supports multiple pnpm/npm schemas; an unfamiliar
 * clean-output schema cannot weaken the command's blocking verdict.
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
  const commandPassed = audit.status === 0;
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
  const generated = new Date().toISOString();

  let report = '# Dependency Vulnerability Report\n\n';
  report += `**Generated:** ${generated}\n`;
  report += '**Blocking authority:** `pnpm audit --json --audit-level=high`\n';
  report += `**Command exit status:** ${audit.status ?? 'UNAVAILABLE'}\n`;
  report += `**Parsed schema:** ${normalized?.sourceShape ?? 'UNAVAILABLE'}\n`;
  report += `**Total dependencies reported by audit:** ${normalized?.totalDependencies ?? 'not reported'}\n\n`;
  report += '## Blocking verdict\n\n';
  report += commandPassed
    ? 'PASS — pnpm reported no High or Critical vulnerability.\n\n'
    : 'FAIL — pnpm audit returned non-zero; release remains blocked.\n\n';

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
    report += commandPassed
      ? 'The blocking verdict remains PASS because the package-manager audit command itself returned 0.\n\n'
      : 'The blocking verdict remains FAIL because the package-manager audit command returned non-zero.\n\n';
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

  report += '_CI fails closed on every non-zero `pnpm audit --audit-level=high` result, including registry/network failure._\n';
  writeFileSync(OUTPUT_FILE, report);

  if (!commandPassed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
