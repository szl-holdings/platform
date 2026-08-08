#!/usr/bin/env node
/**
 * Vulnerability Report Generator
 *
 * Runs `pnpm audit --json` and produces `security/vuln-report.md`.
 * Exits with code 1 if any Critical or High severity findings are found.
 *
 * Usage:
 *   node scripts/qa/generate-vuln-report.js
 *
 * Output: security/vuln-report.md
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

function fatal(message) {
  console.error(message);
  process.exit(1);
}

export function parseAuditJson(rawOutput, errMessageFallback) {
  if (!rawOutput || !rawOutput.trim()) {
    throw new Error(errMessageFallback);
  }

  try {
    return JSON.parse(rawOutput);
  } catch (err) {
    throw new Error(
      `Failed to parse pnpm audit JSON: ${err.message}\nRaw output:\n${rawOutput.slice(0, 500)}`,
    );
  }
}

function isPlainRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateAuditJson(auditJson) {
  if (!isPlainRecord(auditJson)) throw new Error('pnpm audit JSON must be an object');
  if (!isPlainRecord(auditJson.metadata)) {
    throw new Error('pnpm audit JSON is missing metadata');
  }
  if (!isPlainRecord(auditJson.metadata.vulnerabilities)) {
    throw new Error('pnpm audit JSON is missing vulnerability counts');
  }
  for (const severity of ['critical', 'high', 'moderate', 'low']) {
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
}

function advisoryId(adv) {
  return String(adv.github_advisory_id ?? adv.id ?? '').trim();
}

function advisorySeverity(adv) {
  return String(adv.severity ?? '')
    .trim()
    .toLowerCase();
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let rawOutput;
  try {
    // pnpm audit exits non-zero when vulnerabilities exist; capture output regardless.
    rawOutput = execSync('pnpm audit --json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    // pnpm audit exits non-zero when vulnerabilities found — that's expected.
    rawOutput = err.stdout || err.stderr || '';
    if (!rawOutput.trim()) {
      fatal(`pnpm audit produced no output: ${err.message}`);
    }
  }

  const auditJson = parseAuditJson(rawOutput, 'pnpm audit produced no output');
  validateAuditJson(auditJson);
  const metadata = auditJson.metadata ?? {};
  const vulnMeta = metadata.vulnerabilities ?? {};
  const advisories = auditJson.advisories ?? {};
  const totalDeps = metadata.totalDependencies ?? 0;
  const generated = new Date().toISOString().slice(0, 10);

  const critical = vulnMeta.critical ?? 0;
  const high = vulnMeta.high ?? 0;
  const moderate = vulnMeta.moderate ?? 0;
  const low = vulnMeta.low ?? 0;
  const total = critical + high + moderate + low;

  const advEntries = Object.values(advisories);
  const blockingCritHighAdvs = advEntries.filter((adv) => {
    const severity = advisorySeverity(adv);
    return severity === 'critical' || severity === 'high';
  });
  const otherAdvs = advEntries.filter(
    (a) => advisorySeverity(a) !== 'critical' && advisorySeverity(a) !== 'high',
  );

  let report = '# Dependency Vulnerability Report\n\n';
  report += `**Generated:** ${generated} (pnpm audit)\n`;
  report += `**Total dependencies scanned:** ${totalDeps}\n\n`;

  report += '## Summary\n\n';
  report += '| Severity | Count |\n|----------|-------|\n';
  report += `| Critical | ${critical} |\n`;
  report += `| High | ${high} |\n`;
  report += `| Moderate | ${moderate} |\n`;
  report += `| Low | ${low} |\n`;
  report += `| **Total** | **${total}** |\n\n`;

  report += `- Blocking Critical/High findings: ${blockingCritHighAdvs.length}\n`;
  report += '- Critical/High exception policy: disabled\n\n';

  if (blockingCritHighAdvs.length === 0 && critical === 0 && high === 0) {
    report += '## Findings\n\nNo Critical or High severity vulnerabilities found.\n\n';
  } else {
    if (blockingCritHighAdvs.length > 0) {
      report += '## Blocking Critical / High Findings\n\n';
      report +=
        '| Package | CVE / Advisory | Severity | Vulnerable Range | Dependency Path | Recommended Action |\n';
      report +=
        '|---------|---------------|----------|-----------------|-----------------|-------------------|\n';
      for (const adv of blockingCritHighAdvs) {
        const pkg = adv.module_name ?? 'unknown';
        const cve =
          adv.cves && adv.cves.length > 0
            ? adv.cves.join(', ')
            : advisoryId(adv)
              ? `[${advisoryId(adv)}](${adv.url ?? '#'})`
              : String(adv.id ?? 'N/A');
        const sev = (adv.severity ?? 'unknown').toUpperCase();
        const range = adv.vulnerable_versions ?? 'unknown';
        const paths =
          (adv.findings ?? [])
            .flatMap((f) => f.paths ?? [])
            .slice(0, 2)
            .join('; ') || 'direct';
        const rec = adv.recommendation ?? `Upgrade ${pkg} to a patched version`;
        report += `| \`${pkg}\` | ${cve} | ${sev} | \`${range}\` | \`${paths}\` | ${rec} |\n`;
      }
      report += '\n';
    }
    if (blockingCritHighAdvs.length === 0 && (critical > 0 || high > 0)) {
      report +=
        '## Blocking Critical / High Findings\n\nThe audit metadata reports Critical or High findings but provided no advisory details. The release remains blocked.\n\n';
    }
  }

  if (otherAdvs.length > 0) {
    report += '## Moderate / Low Findings\n\n';
    report += '| Package | CVE / Advisory | Severity | Vulnerable Range | Dependency Path |\n';
    report += '|---------|---------------|----------|-----------------|-----------------|\n';
    for (const adv of otherAdvs) {
      const pkg = adv.module_name ?? 'unknown';
      const cve = adv.cves && adv.cves.length > 0 ? adv.cves.join(', ') : String(adv.id ?? 'N/A');
      const sev = adv.severity ?? 'unknown';
      const range = adv.vulnerable_versions ?? 'unknown';
      const paths =
        (adv.findings ?? [])
          .flatMap((f) => f.paths ?? [])
          .slice(0, 2)
          .join('; ') || 'direct';
      report += `| \`${pkg}\` | ${cve} | ${sev} | \`${range}\` | \`${paths}\` |\n`;
    }
    report += '\n';
  }

  // Read the workspace-level overrides dynamically to avoid report drift.
  let overrides = {};
  try {
    const workspace = parseYaml(readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8'));
    overrides = workspace?.overrides ?? {};
  } catch (error) {
    fatal(`Failed to read pnpm-workspace.yaml overrides: ${error.message}`);
  }

  const overrideEntries = Object.entries(overrides);
  if (overrideEntries.length > 0) {
    report += '## Overrides Active\n\n';
    report +=
      'The following workspace overrides are pinned in `pnpm-workspace.yaml` to resolve known transitive vulnerabilities or ensure version consistency:\n\n';
    report += '| Package | Pinned Version |\n|---------|---------------|\n';
    for (const [pkg, version] of overrideEntries) {
      report += `| \`${pkg}\` | \`${version}\` |\n`;
    }
    report += '\n';
  }

  report +=
    '_Auto-generated by `scripts/qa/generate-vuln-report.js`. CI blocks on every Critical or High finding._\n';
  report += '_Re-run locally: `node scripts/qa/generate-vuln-report.js`_\n';

  writeFileSync(OUTPUT_FILE, report);

  if (blockingCritHighAdvs.length > 0 || critical > 0 || high > 0) {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => fatal(err.message));
}
