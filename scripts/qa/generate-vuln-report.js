#!/usr/bin/env node
/**
 * Vulnerability Report Generator
 *
 * Runs `pnpm audit --json` and produces `security/vuln-report.md`.
 * Exits with code 1 if any unaccepted Critical or High severity findings are found.
 *
 * Usage:
 *   node scripts/qa/generate-vuln-report.js
 *
 * Output: security/vuln-report.md
 */

import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const OUTPUT_FILE = join(OUTPUT_DIR, 'vuln-report.md');

const ACCEPTED_HIGH_SEVERITY_ADVISORIES = new Set([
  // Accepted by design triage in SECURITY_KNOWN_ISSUES.md §2.
  'GHSA-w3rx-r6r6-pgpr',
  'GHSA-5p2g-fcmc-qvqq',
]);

const ACCEPTED_ADVISORY_REASONS = {
  'GHSA-w3rx-r6r6-pgpr':
    'Accepted as transient dependency in mobile toolchain, no patched upstream version with a clean transitive replacement available. Risk is scoped to build-time image parsing paths with trusted repository assets.',
  'GHSA-5p2g-fcmc-qvqq':
    'Accepted as transient dependency in mobile toolchain, no patched upstream version with a clean transitive replacement available. Risk is scoped to build-time image parsing paths with trusted repository assets.',
};

function fatal(message) {
  console.error(message);
  process.exit(1);
}

function parseAuditJson(rawOutput, errMessageFallback) {
  if (!rawOutput || !rawOutput.trim()) {
    fatal(errMessageFallback);
  }

  try {
    return JSON.parse(rawOutput);
  } catch (err) {
    const trimmed = rawOutput.trim();
    if (
      trimmed === 'No new vulnerabilities were ignored' ||
      trimmed === 'No vulnerabilities found'
    ) {
      return {
        metadata: { vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0 } },
        advisories: {},
      };
    }
    fatal(
      `Failed to parse pnpm audit JSON: ${err.message}\nRaw output:\n${rawOutput.slice(0, 500)}`,
    );
  }
}

function advisoryId(adv) {
  return String(adv.github_advisory_id ?? adv.id ?? '').trim();
}

function advisorySeverity(adv) {
  return (adv.severity ?? '').toLowerCase();
}

function isAcceptedHigh(adv) {
  const id = advisoryId(adv);
  return ACCEPTED_HIGH_SEVERITY_ADVISORIES.has(id);
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
    rawOutput = (err.stdout || '') + (err.stderr || '');
    if (!rawOutput.trim()) {
      fatal(`pnpm audit produced no output: ${err.message}`);
    }
  }

  const auditJson = parseAuditJson(rawOutput, 'pnpm audit produced no output');
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
  const acceptedCritHighAdvs = [];
  const blockingCritHighAdvs = [];
  const otherAdvs = advEntries.filter(
    (a) => advisorySeverity(a) !== 'critical' && advisorySeverity(a) !== 'high',
  );

  for (const adv of advEntries) {
    if (advisorySeverity(adv) === 'critical' || advisorySeverity(adv) === 'high') {
      if (isAcceptedHigh(adv)) {
        acceptedCritHighAdvs.push(adv);
      } else {
        blockingCritHighAdvs.push(adv);
      }
    }
  }

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
  report += `- Accepted / deferred Critical/High findings: ${acceptedCritHighAdvs.length}\n\n`;

  if (blockingCritHighAdvs.length === 0 && acceptedCritHighAdvs.length === 0) {
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

    if (acceptedCritHighAdvs.length > 0) {
      report += '## Accepted / Deferred Critical / High Findings\n\n';
      report +=
        '| Package | CVE / Advisory | Severity | Vulnerable Range | Dependency Path | Risk Rationale |\n';
      report +=
        '|---------|---------------|----------|-----------------|-----------------|----------------|\n';
      for (const adv of acceptedCritHighAdvs) {
        const pkg = adv.module_name ?? 'unknown';
        const cve =
          adv.cves && adv.cves.length > 0
            ? adv.cves.join(', ')
            : advisoryId(adv) || String(adv.id ?? 'N/A');
        const sev = (adv.severity ?? 'unknown').toUpperCase();
        const range = adv.vulnerable_versions ?? 'unknown';
        const paths =
          (adv.findings ?? [])
            .flatMap((f) => f.paths ?? [])
            .slice(0, 2)
            .join('; ') || 'direct';
        const reason = ACCEPTED_ADVISORY_REASONS[advisoryId(adv)] ?? 'Documented accepted risk';
        report += `| \`${pkg}\` | ${cve} | ${sev} | \`${range}\` | \`${paths}\` | ${reason} |\n`;
      }
      report += '\n';
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

  // Read pnpm.overrides dynamically from package.json to avoid drift.
  let overrides = {};
  try {
    const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    overrides = rootPkg.pnpm?.overrides ?? {};
  } catch (_e) {}

  const overrideEntries = Object.entries(overrides);
  if (overrideEntries.length > 0) {
    report += '## Overrides Active\n\n';
    report +=
      'The following `pnpm.overrides` are pinned in `package.json` to resolve known transitive vulnerabilities or ensure version consistency:\n\n';
    report += '| Package | Pinned Version |\n|---------|---------------|\n';
    for (const [pkg, version] of overrideEntries) {
      report += `| \`${pkg}\` | \`${version}\` |\n`;
    }
    report += '\n';
  }

  report +=
    '_Auto-generated by `scripts/qa/generate-vuln-report.js`. CI blocks on any unaccepted Critical or High finding._\n';
  report += '_Re-run locally: `node scripts/qa/generate-vuln-report.js`_\n';

  writeFileSync(OUTPUT_FILE, report);

  if (blockingCritHighAdvs.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => fatal(err.message));
