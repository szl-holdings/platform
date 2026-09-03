#!/usr/bin/env node
/**
 * Dependency vulnerability report generator.
 *
 * pnpm has emitted more than one JSON shape across supported releases:
 * - legacy npm-style: { advisories, metadata }
 * - current pnpm-style: { <advisoryId>: advisory, ... }
 *
 * This parser normalizes both shapes and fails closed on registry/error payloads.
 * CI exits non-zero only for a malformed/unavailable audit or a Critical/High
 * advisory; an empty current-style object is a valid zero-vulnerability result.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const OUTPUT_FILE = join(OUTPUT_DIR, 'vuln-report.md');
const SEVERITIES = ['critical', 'high', 'moderate', 'low'];

function fatal(message) {
  console.error(message);
  process.exit(1);
}

function isPlainRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseAuditJson(rawOutput, errMessageFallback) {
  if (!rawOutput || !rawOutput.trim()) throw new Error(errMessageFallback);
  try {
    return JSON.parse(rawOutput);
  } catch (err) {
    throw new Error(
      `Failed to parse pnpm audit JSON: ${err.message}\nRaw output:\n${rawOutput.slice(0, 500)}`,
    );
  }
}

function looksLikeAdvisory(value) {
  if (!isPlainRecord(value)) return false;
  const severity = String(value.severity ?? '').toLowerCase();
  return (
    SEVERITIES.includes(severity) &&
    (value.id !== undefined || value.github_advisory_id || value.url || value.title)
  );
}

function countAdvisories(advisories) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  for (const advisory of Object.values(advisories)) {
    const severity = String(advisory?.severity ?? '').toLowerCase();
    if (Object.hasOwn(counts, severity)) counts[severity] += 1;
  }
  return counts;
}

/** Normalize supported pnpm audit JSON shapes to one internal contract. */
export function normalizeAuditJson(auditJson) {
  if (!isPlainRecord(auditJson)) throw new Error('pnpm audit JSON must be an object');

  // Error payloads from pnpm/registry must never be interpreted as a clean audit.
  if (
    typeof auditJson.message === 'string' ||
    typeof auditJson.error === 'string' ||
    typeof auditJson.code === 'string'
  ) {
    throw new Error(
      `pnpm audit returned an error payload: ${auditJson.message ?? auditJson.error ?? auditJson.code}`,
    );
  }

  // Legacy npm-style contract.
  if (isPlainRecord(auditJson.metadata) || isPlainRecord(auditJson.advisories)) {
    if (!isPlainRecord(auditJson.metadata)) throw new Error('pnpm audit JSON is missing metadata');
    if (!isPlainRecord(auditJson.metadata.vulnerabilities)) {
      throw new Error('pnpm audit JSON is missing vulnerability counts');
    }
    for (const severity of SEVERITIES) {
      const count = auditJson.metadata.vulnerabilities[severity];
      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error(`pnpm audit JSON has an invalid ${severity} count`);
      }
    }
    if (!Number.isSafeInteger(auditJson.metadata.totalDependencies)) {
      throw new Error('pnpm audit JSON has an invalid dependency count');
    }
    if (!isPlainRecord(auditJson.advisories)) {
      throw new Error('pnpm audit JSON is missing advisory details');
    }
    return {
      advisories: auditJson.advisories,
      vulnerabilities: { ...auditJson.metadata.vulnerabilities },
      totalDependencies: auditJson.metadata.totalDependencies,
      sourceShape: 'legacy-metadata',
    };
  }

  // Current pnpm contract: the root object is the advisory map. `{}` is the
  // documented/observed clean result and must be accepted.
  const entries = Object.entries(auditJson);
  if (entries.some(([, value]) => !looksLikeAdvisory(value))) {
    throw new Error('pnpm audit JSON has an unsupported advisory-map shape');
  }
  return {
    advisories: auditJson,
    vulnerabilities: countAdvisories(auditJson),
    totalDependencies: null,
    sourceShape: 'advisory-map',
  };
}

export function validateAuditJson(auditJson) {
  normalizeAuditJson(auditJson);
}

function advisoryId(adv) {
  return String(adv.github_advisory_id ?? adv.id ?? '').trim();
}

function advisorySeverity(adv) {
  return String(adv.severity ?? '').trim().toLowerCase();
}

function readOverrides() {
  const workspace = parseYaml(readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8'));
  return workspace?.overrides ?? {};
}

function renderAdvisoryRow(adv, includeAction = false) {
  const pkg = adv.module_name ?? adv.name ?? 'unknown';
  const id =
    Array.isArray(adv.cves) && adv.cves.length > 0
      ? adv.cves.join(', ')
      : advisoryId(adv)
        ? `[${advisoryId(adv)}](${adv.url ?? '#'})`
        : 'N/A';
  const severity = String(adv.severity ?? 'unknown').toUpperCase();
  const range = adv.vulnerable_versions ?? 'unknown';
  const paths =
    (adv.findings ?? []).flatMap((finding) => finding.paths ?? []).slice(0, 2).join('; ') ||
    'direct/registry advisory';
  if (!includeAction) return `| \`${pkg}\` | ${id} | ${severity} | \`${range}\` | \`${paths}\` |\n`;
  const recommendation = adv.recommendation ?? `Upgrade ${pkg} to a patched version`;
  return `| \`${pkg}\` | ${id} | ${severity} | \`${range}\` | \`${paths}\` | ${recommendation} |\n`;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let rawOutput;
  try {
    rawOutput = execSync('pnpm audit --json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    // Non-zero is expected when vulnerabilities exist. Preserve the JSON body.
    rawOutput = err.stdout || err.stderr || '';
    if (!rawOutput.trim()) fatal(`pnpm audit produced no output: ${err.message}`);
  }

  let normalized;
  try {
    normalized = normalizeAuditJson(parseAuditJson(rawOutput, 'pnpm audit produced no output'));
  } catch (err) {
    fatal(err.message);
  }

  const advisories = normalized.advisories;
  const vulnMeta = normalized.vulnerabilities;
  const advEntries = Object.values(advisories);
  const blocking = advEntries.filter((adv) => ['critical', 'high'].includes(advisorySeverity(adv)));
  const other = advEntries.filter((adv) => !['critical', 'high'].includes(advisorySeverity(adv)));
  const critical = vulnMeta.critical ?? 0;
  const high = vulnMeta.high ?? 0;
  const moderate = vulnMeta.moderate ?? 0;
  const low = vulnMeta.low ?? 0;
  const total = critical + high + moderate + low;
  const generated = new Date().toISOString().slice(0, 10);

  let report = '# Dependency Vulnerability Report\n\n';
  report += `**Generated:** ${generated} (pnpm audit)\n`;
  report += `**Audit JSON shape:** ${normalized.sourceShape}\n`;
  report += `**Total dependencies scanned:** ${normalized.totalDependencies ?? 'not reported by pnpm'}\n\n`;
  report += '## Summary\n\n';
  report += '| Severity | Count |\n|----------|-------|\n';
  report += `| Critical | ${critical} |\n| High | ${high} |\n| Moderate | ${moderate} |\n| Low | ${low} |\n| **Total** | **${total}** |\n\n`;
  report += `- Blocking Critical/High findings: ${blocking.length}\n`;
  report += '- Critical/High exception policy: disabled\n\n';

  if (blocking.length === 0 && critical === 0 && high === 0) {
    report += '## Findings\n\nNo Critical or High severity vulnerabilities found.\n\n';
  } else {
    report += '## Blocking Critical / High Findings\n\n';
    if (blocking.length > 0) {
      report += '| Package | CVE / Advisory | Severity | Vulnerable Range | Dependency Path | Recommended Action |\n';
      report += '|---------|---------------|----------|-----------------|-----------------|-------------------|\n';
      for (const advisory of blocking) report += renderAdvisoryRow(advisory, true);
      report += '\n';
    } else {
      report += 'Audit counts report Critical/High findings without advisory details. Release remains blocked.\n\n';
    }
  }

  if (other.length > 0) {
    report += '## Moderate / Low Findings\n\n';
    report += '| Package | CVE / Advisory | Severity | Vulnerable Range | Dependency Path |\n';
    report += '|---------|---------------|----------|-----------------|-----------------|\n';
    for (const advisory of other) report += renderAdvisoryRow(advisory, false);
    report += '\n';
  }

  let overrides;
  try {
    overrides = readOverrides();
  } catch (err) {
    fatal(`Failed to read pnpm-workspace.yaml overrides: ${err.message}`);
  }
  const overrideEntries = Object.entries(overrides);
  if (overrideEntries.length > 0) {
    report += '## Overrides Active\n\n';
    report += 'Workspace overrides pinned in `pnpm-workspace.yaml`:\n\n';
    report += '| Package | Pinned Version |\n|---------|---------------|\n';
    for (const [pkg, version] of overrideEntries) report += `| \`${pkg}\` | \`${version}\` |\n`;
    report += '\n';
  }

  report += '_Auto-generated by `scripts/qa/generate-vuln-report.js`. CI blocks on every Critical or High finding and on malformed audit responses._\n';
  writeFileSync(OUTPUT_FILE, report);

  if (blocking.length > 0 || critical > 0 || high > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => fatal(err.message));
}
