#!/usr/bin/env node
/**
 * License Compliance Report Generator
 *
 * Scans every package.json in the pnpm virtual store (node_modules/.pnpm),
 * overlays linked workspace production packages from pnpm-workspace.yaml, and
 * produces `security/license-report.md` with:
 *   - A full per-dependency license inventory (package, version, license, flag)
 *   - A summary of copyleft and unknown-license packages
 *
 * Flag values:
 *   OK     - permissive license (MIT, Apache-2.0, ISC, BSD-*, etc.)
 *   REVIEW - copyleft license (MPL-2.0, LGPL-*, GPL-*, AGPL-*, etc.)
 *   CHECK  - license string is UNKNOWN or non-standard
 *
 * Usage:
 *   node scripts/qa/generate-license-report.js
 *
 * Output: security/license-report.md
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const STORE_DIR = join(ROOT, 'node_modules/.pnpm');
const OUTPUT_DIR = join(ROOT, 'security');
const OUTPUT_FILE = join(OUTPUT_DIR, 'license-report.md');

// SPDX identifiers that are explicitly copyleft — flag as REVIEW
const COPYLEFT_IDENTIFIERS = [
  'GPL-2.0',
  'GPL-3.0',
  'AGPL-3.0',
  'LGPL-2.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'MPL-2.0',
  'CDDL-1.0',
  'EPL-1.0',
  'EPL-2.0',
  'CC-BY-SA-',
  'OSL-3.0',
  'Hippocratic',
];

// SPDX identifiers known to be permissive — any license NOT in this set (and not in
// copyleft list) gets flagged CHECK rather than OK, so non-standard strings don't slip
// through as permitted.
const PERMISSIVE_IDENTIFIERS = new Set([
  'MIT',
  'MIT-0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-4-Clause',
  'Apache-2.0',
  'Apache 2.0',
  '0BSD',
  'BlueOak-1.0.0',
  'Unlicense',
  'CC0-1.0',
  'CC-BY-4.0',
  'CC-BY-3.0',
  'Python-2.0',
  'PSF-2.0',
  'OFL-1.1', // SIL Open Font License
  'Zlib',
  'Zlib/libpng',
  'W3C',
  'Public Domain',
  'WTFPL',
  'EUPL-1.2',
]);

function fatal(_msg) {
  process.exit(1);
}

function licenseString(pkg) {
  const lic = pkg.license;
  if (lic) return String(lic);
  if (pkg.licenses) {
    if (Array.isArray(pkg.licenses)) {
      return pkg.licenses.map((l) => l.type || l).join(' OR ');
    }
    return String(pkg.licenses);
  }
  return 'UNKNOWN';
}

/**
 * Normalize common non-SPDX license aliases to their canonical SPDX identifiers.
 * This prevents over-flagging well-known permissive licenses that are written in
 * informal ways by some package authors.
 */
function normalizeLicense(license) {
  const aliases = {
    'Apache 2.0': 'Apache-2.0',
    'Apache License 2.0': 'Apache-2.0',
    'Apache License, Version 2.0': 'Apache-2.0',
    'Apache-2': 'Apache-2.0',
    BSD: 'BSD-2-Clause',
    'BSD-2': 'BSD-2-Clause',
    'BSD-3': 'BSD-3-Clause',
    BSD3: 'BSD-3-Clause',
    BSD2: 'BSD-2-Clause',
    'MIT License': 'MIT',
    'MIT/X11': 'MIT',
    'ISC License': 'ISC',
    'The ISC License': 'ISC',
    'Zlib/libpng': 'Zlib',
    zlib: 'Zlib',
    'Public Domain': 'Public Domain',
    'CC-BY-3.0 AT': 'CC-BY-3.0',
    CC0: 'CC0-1.0',
    Unlicensed: 'Unlicense',
    Free: 'Unlicense',
  };
  return aliases[license] ?? license;
}

/**
 * Classify a license string as OK / REVIEW / CHECK.
 *
 * OK     — known-permissive SPDX identifier (allowlist)
 * REVIEW — known copyleft or restrictive (Hippocratic, GPL, AGPL, LGPL, MPL-2.0, etc.)
 * CHECK  — anything else: UNKNOWN, "SEE LICENSE IN…", custom strings, URLs, non-SPDX
 *
 * The allowlist approach is intentional: it ensures that any novel or non-standard
 * license string is flagged for human review rather than silently permitted.
 */
function flag(license) {
  if (!license || license === 'UNKNOWN') return 'CHECK';
  license = normalizeLicense(license);

  // Non-standard indicators that always require manual review
  const customIndicators = [
    'SEE LICENSE IN',
    'see license in',
    'http://',
    'https://',
    'Standard',
    'standard',
    'no charge',
    'proprietary',
    'commercial',
    'Proprietary',
    'Commercial',
  ];
  for (const ind of customIndicators) {
    if (license.includes(ind)) return 'CHECK';
  }

  // Known copyleft / restrictive → REVIEW
  for (const cp of COPYLEFT_IDENTIFIERS) {
    if (license.includes(cp)) return 'REVIEW';
  }

  // Decompose compound expressions and check each token
  // Handles "(MIT OR GPL-3.0)", "(BSD-2-Clause OR MIT OR Apache-2.0)", etc.
  // Strip SPDX expression syntax: parentheses, AND, OR, WITH, ONLY, +
  const tokens = license
    .replace(/[()]/g, ' ')
    .split(/\s+(?:AND|OR|WITH)\s+|\s+/)
    .map((t) => t.replace(/\+$/, '').trim())
    .filter(Boolean);

  for (const token of tokens) {
    // Re-check each token against copyleft
    for (const cp of COPYLEFT_IDENTIFIERS) {
      if (token.includes(cp)) return 'REVIEW';
    }
    // If any token is not in the permissive allowlist, flag CHECK
    if (!PERMISSIVE_IDENTIFIERS.has(token)) return 'CHECK';
  }

  return 'OK';
}

function readPackage(pkgJsonPath, fallbackName) {
  try {
    const raw = readFileSync(pkgJsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    return {
      name: pkg.name || fallbackName,
      version: pkg.version || '',
      license: licenseString(pkg),
    };
  } catch (_e) {
    return null;
  }
}

function scanStore() {
  let storeDirs;
  try {
    storeDirs = readdirSync(STORE_DIR);
  } catch (e) {
    fatal(
      `Cannot read pnpm store at ${STORE_DIR}: ${e.message}\nRun 'pnpm install --frozen-lockfile' first.`,
    );
  }

  if (!storeDirs || storeDirs.length === 0) {
    fatal("pnpm store is empty — run 'pnpm install --frozen-lockfile' first.");
  }

  const packages = {};
  let parseErrors = 0;

  for (const storeEntry of storeDirs) {
    const innerModules = join(STORE_DIR, storeEntry, 'node_modules');
    let entries;
    try {
      entries = readdirSync(innerModules);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.startsWith('@')) {
        let scopedEntries;
        try {
          scopedEntries = readdirSync(join(innerModules, entry));
        } catch {
          continue;
        }
        for (const sub of scopedEntries) {
          const pj = join(innerModules, entry, sub, 'package.json');
          if (existsSync(pj)) {
            const info = readPackage(pj, `${entry}/${sub}`);
            if (info) {
              packages[info.name] = { version: info.version, license: info.license };
            } else {
              parseErrors++;
              process.stderr.write(`[license-report] WARN: Failed to read ${pj}\n`);
            }
          }
        }
      } else {
        const pj = join(innerModules, entry, 'package.json');
        if (existsSync(pj)) {
          const info = readPackage(pj, entry);
          if (info) {
            packages[info.name] = { version: info.version, license: info.license };
          } else {
            parseErrors++;
            process.stderr.write(`[license-report] WARN: Failed to read ${pj}\n`);
          }
        }
      }
    }
  }

  const workspacePath = join(ROOT, 'pnpm-workspace.yaml');
  let workspaceText;
  try {
    workspaceText = readFileSync(workspacePath, 'utf8');
  } catch (e) {
    fatal(`Cannot read pnpm-workspace.yaml: ${e.message}`);
  }
  const linkPattern = /\blink:\s*["']?([^"'#\s]+)["']?/g;
  let linkMatch;
  while ((linkMatch = linkPattern.exec(workspaceText)) !== null) {
    const packageRoot = resolve(ROOT, linkMatch[1]);
    const packageRelative = relative(ROOT, packageRoot);
    if (
      packageRelative === '..' ||
      packageRelative.startsWith('../') ||
      packageRelative.startsWith('..\\') ||
      isAbsolute(packageRelative)
    ) {
      fatal(`Linked workspace package escapes repository root: ${linkMatch[1]}`);
    }
    const manifestPath = join(packageRoot, 'package.json');
    const info = readPackage(manifestPath, linkMatch[1]);
    if (!info) {
      fatal(`Cannot read linked workspace package: ${manifestPath}`);
    }
    packages[info.name] = { version: info.version, license: info.license };
  }

  if (Object.keys(packages).length === 0) {
    fatal('No packages found in pnpm store — license scan produced empty results.');
  }

  return { packages, parseErrors };
}

function buildReport(packages, parseErrors) {
  const entries = Object.entries(packages).map(([name, info]) => ({
    name,
    version: info.version,
    license: info.license,
    flag: flag(info.license),
  }));

  // Sort: REVIEW first, then CHECK, then OK — alphabetical within each group
  entries.sort((a, b) => {
    const order = { REVIEW: 0, CHECK: 1, OK: 2 };
    const diff = order[a.flag] - order[b.flag];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  const review = entries.filter((e) => e.flag === 'REVIEW');
  const check = entries.filter((e) => e.flag === 'CHECK');
  const ok = entries.filter((e) => e.flag === 'OK');
  const total = entries.length;

  const generated = new Date().toISOString().slice(0, 10);

  let report = '# License Compliance Report\n\n';
  report += `**Generated:** ${generated}\n`;
  report += `**Total packages scanned:** ${total}\n`;
  if (parseErrors > 0)
    report += `**Parse warnings:** ${parseErrors} package.json files could not be read (see stderr)\n`;
  report += '\n';

  report += '## Summary\n\n';
  report += '| Category | Count |\n|----------|-------|\n';
  report += `| Permissive — OK | ${ok.length} |\n`;
  report += `| Copyleft — REVIEW | ${review.length} |\n`;
  report += `| Unknown / Non-standard — CHECK | ${check.length} |\n`;
  report += `| **Total** | **${total}** |\n\n`;

  report += '**Flag key:**\n';
  report +=
    '- `OK` — permissive license (MIT, Apache-2.0, ISC, BSD-*, Unlicense, CC0, etc.); no commercial use restrictions\n';
  report +=
    '- `REVIEW` — copyleft or restrictive license (MPL-2.0, LGPL, GPL, AGPL, Hippocratic, etc.); may impose obligations or restrict use\n';
  report +=
    '- `CHECK` — license unknown or non-standard; verify before commercial distribution\n\n';

  if (review.length > 0) {
    report += '## Copyleft / Restrictive Packages — Review Required\n\n';
    report +=
      'These packages have licenses that impose obligations or restrict commercial use. ' +
      'MPL-2.0 (file-scoped copyleft) has no obligation when used unmodified in a larger proprietary codebase. ' +
      'Dual-licensed packages should elect the permissive option. ' +
      'Hippocratic-2.1 restricts use for human rights violations — acceptable for legitimate commercial use but requires acknowledgment.\n\n';
    report += '| Package | Version | License | Notes |\n|---------|---------|---------|-------|\n';
    for (const e of review) {
      const notes = e.license.includes(' OR ')
        ? 'Dual-licensed — elect permissive option'
        : e.license.includes('MPL-2.0')
          ? 'File-scoped copyleft; no obligation if unmodified'
          : e.license.includes('AGPL-3.0')
            ? 'Strong copyleft — review before any distribution'
            : e.license.includes('GPL-3.0')
              ? 'Copyleft — review before distribution'
              : e.license.includes('Hippocratic')
                ? 'Restrictive ethical license — confirm commercial use compliance'
                : 'Review obligations before commercial distribution';
      report += `| \`${e.name}\` | ${e.version} | ${e.license} | ${notes} |\n`;
    }
    report += '\n';
  }

  if (check.length > 0) {
    report += '## Unknown / Non-Standard License Packages\n\n';
    report +=
      'These packages have missing or non-SPDX license identifiers. ' +
      'Verify acceptable use before commercial deployment.\n\n';
    report += '| Package | Version | License String |\n|---------|---------|---------------|\n';
    for (const e of check) {
      report += `| \`${e.name}\` | ${e.version} | ${e.license} |\n`;
    }
    report += '\n';
  }

  report += '## Full Dependency License Inventory\n\n';
  report += 'Complete per-package license listing for all installed dependencies.\n\n';
  report += '| Package | Version | License | Flag |\n|---------|---------|---------|------|\n';
  for (const e of entries) {
    report += `| \`${e.name}\` | ${e.version} | ${e.license} | ${e.flag} |\n`;
  }
  report += '\n';

  report +=
    '_Auto-generated by `scripts/qa/generate-license-report.js`. Re-run after any dependency change._\n';

  return report;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const { packages, parseErrors } = scanStore();
  const _total = Object.keys(packages).length;

  const report = buildReport(packages, parseErrors);

  writeFileSync(OUTPUT_FILE, report);

  const _review = Object.values(packages).filter((p) => flag(p.license) === 'REVIEW');
  const _check = Object.values(packages).filter((p) => flag(p.license) === 'CHECK');
}

main().catch((err) => fatal(err.message));
