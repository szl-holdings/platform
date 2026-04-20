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

import { execSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const OUTPUT_FILE = join(OUTPUT_DIR, 'vuln-report.md');

function fatal(msg) {
  console.error(`[vuln-report] FATAL: ${msg}`);
  process.exit(1);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('[vuln-report] Running pnpm audit --json ...');

  let rawOutput;
  try {
    // pnpm audit exits non-zero when vulnerabilities exist; capture output regardless
    rawOutput = execSync('pnpm audit --json', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    // pnpm audit exits non-zero when vulnerabilities found — that's expected
    rawOutput = err.stdout || '';
    if (!rawOutput.trim()) {
      fatal(`pnpm audit produced no output: ${err.message}`);
    }
  }

  let auditJson;
  try {
    auditJson = JSON.parse(rawOutput);
  } catch (e) {
    fatal(`Failed to parse pnpm audit JSON: ${e.message}\nRaw output:\n${rawOutput.slice(0, 500)}`);
  }

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

  console.log(
    `[vuln-report] Scan complete: ${total} total findings (critical=${critical} high=${high} moderate=${moderate} low=${low})`,
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

  const advEntries = Object.values(advisories);
  const critHighAdvs = advEntries.filter((a) => a.severity === 'critical' || a.severity === 'high');
  const otherAdvs = advEntries.filter((a) => a.severity !== 'critical' && a.severity !== 'high');

  if (critHighAdvs.length === 0) {
    report += '## Findings\n\nNo Critical or High severity vulnerabilities found.\n\n';
  } else {
    report += '## Critical / High Findings\n\n';
    report +=
      '| Package | CVE / Advisory | Severity | Vulnerable Range | Dependency Path | Recommended Action |\n';
    report +=
      '|---------|---------------|----------|-----------------|-----------------|-------------------|\n';
    for (const adv of critHighAdvs) {
      const pkg = adv.module_name ?? 'unknown';
      const cve =
        adv.cves && adv.cves.length > 0
          ? adv.cves.join(', ')
          : adv.url
            ? `[${adv.id}](${adv.url})`
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

  // Read pnpm.overrides dynamically from package.json to avoid drift
  let overrides = {};
  try {
    const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    overrides = rootPkg.pnpm?.overrides ?? {};
  } catch (e) {
    console.warn(
      `[vuln-report] WARN: Could not read pnpm.overrides from package.json: ${e.message}`,
    );
  }

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
    '_Auto-generated by `scripts/qa/generate-vuln-report.js`. CI blocks on any Critical or High finding._\n';
  report += '_Re-run locally: `node scripts/qa/generate-vuln-report.js`_\n';

  writeFileSync(OUTPUT_FILE, report);
  console.log(`[vuln-report] Written to ${OUTPUT_FILE}`);

  if (critical > 0 || high > 0) {
    console.error(
      `\n[vuln-report] ALERT: ${critical} critical and ${high} high severity vulnerabilities found.`,
    );
    console.error("[vuln-report] Action required: run 'pnpm update' to remediate where possible.");
    process.exit(1);
  }

  console.log('[vuln-report] No high/critical vulnerabilities found. Scan passed.');
}

main().catch((err) => fatal(err.message));
