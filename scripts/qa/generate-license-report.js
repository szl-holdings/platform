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

import { randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const OUTPUT_FILE = join(OUTPUT_DIR, 'license-report.md');
const POLICY_FILE = join(OUTPUT_DIR, 'license-policy.json');
const POLICY_SCHEMA_VERSION = 1;
const REVIEW_CLASSIFICATIONS = new Set(['REVIEW', 'CHECK']);
const REVIEW_FIELDS = [
  'classification',
  'decision',
  'expires',
  'license',
  'package',
  'rationale',
  'reviewedAt',
  'version',
];

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
  'EUPL-1.2',
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
]);

const PERMISSIVE_NON_EXPRESSION_LICENSES = new Set(['Public Domain']);

function fatal(msg) {
  throw new Error(msg);
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

function hasControlCharacters(value) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f);
  });
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
export function classifyLicense(license) {
  if (
    typeof license !== 'string' ||
    license.length === 0 ||
    license.trim() !== license ||
    hasControlCharacters(license) ||
    license === 'UNKNOWN'
  ) {
    return 'CHECK';
  }
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

  if (PERMISSIVE_NON_EXPRESSION_LICENSES.has(license)) return 'OK';

  const tokens = license.match(/\(|\)|AND|OR|WITH|[A-Za-z0-9][A-Za-z0-9.+-]*/g);
  if (!tokens || tokens.join('') !== license.replaceAll(/\s/g, '')) return 'CHECK';

  let cursor = 0;
  const identifier = () => {
    const token = tokens[cursor];
    if (!token || token === '(' || token === ')' || token === 'AND' || token === 'OR') {
      return false;
    }
    cursor++;
    if (tokens[cursor] === 'WITH') {
      cursor++;
      const exception = tokens[cursor];
      if (
        !exception ||
        exception === '(' ||
        exception === ')' ||
        exception === 'AND' ||
        exception === 'OR' ||
        exception === 'WITH'
      ) {
        return false;
      }
      cursor++;
    }
    return true;
  };
  const primary = () => {
    if (tokens[cursor] !== '(') return identifier();
    cursor++;
    if (!expression()) return false;
    if (tokens[cursor] !== ')') return false;
    cursor++;
    return true;
  };
  const conjunction = () => {
    if (!primary()) return false;
    while (tokens[cursor] === 'AND') {
      cursor++;
      if (!primary()) return false;
    }
    return true;
  };
  const expression = () => {
    if (!conjunction()) return false;
    while (tokens[cursor] === 'OR') {
      cursor++;
      if (!conjunction()) return false;
    }
    return true;
  };
  if (!expression() || cursor !== tokens.length) return 'CHECK';

  const identifiers = tokens.filter(
    (token) =>
      token !== '(' && token !== ')' && token !== 'AND' && token !== 'OR' && token !== 'WITH',
  );
  for (const candidate of identifiers) {
    for (const copyleft of COPYLEFT_IDENTIFIERS) {
      if (
        candidate === copyleft ||
        candidate === `${copyleft}+` ||
        candidate.startsWith(copyleft.endsWith('-') ? copyleft : `${copyleft}-`)
      ) {
        return 'REVIEW';
      }
    }
  }

  // WITH exceptions require a separate exact legal review; none are silently
  // admitted by this engineering allowlist.
  if (tokens.includes('WITH')) return 'CHECK';
  for (const candidate of identifiers) {
    if (!PERMISSIVE_IDENTIFIERS.has(candidate)) return 'CHECK';
  }

  return 'OK';
}

function packageIdentity(name, version) {
  return `${name}\u0000${version}`;
}

function reviewIdentity(entry) {
  return [entry.package, entry.version, entry.license, entry.classification].join('\u0000');
}

function addPackage(packages, info, sourcePath) {
  const identity = packageIdentity(info.name, info.version);
  const existing = packages.get(identity);
  if (existing && existing.license !== info.license) {
    fatal(
      `Conflicting license metadata for ${info.name}@${info.version}: ` +
        `${existing.license} (${existing.sourcePath}) vs ${info.license} (${sourcePath})`,
    );
  }
  packages.set(identity, { ...info, sourcePath });
}

function readPackage(pkgJsonPath, fallbackName) {
  try {
    const raw = readFileSync(pkgJsonPath, 'utf8');
    const pkg = parseStrictJson(raw, pkgJsonPath);
    return {
      name: pkg.name || fallbackName,
      version: pkg.version || '',
      license: licenseString(pkg),
    };
  } catch (_e) {
    return null;
  }
}

export function scanStore({ root = ROOT, storeDir = join(root, 'node_modules/.pnpm') } = {}) {
  let storeDirs;
  try {
    storeDirs = readdirSync(storeDir, { withFileTypes: true });
  } catch (e) {
    fatal(
      `Cannot read pnpm store at ${storeDir}: ${e.message}\nRun 'pnpm install --frozen-lockfile' first.`,
    );
  }

  if (!storeDirs || storeDirs.length === 0) {
    fatal("pnpm store is empty — run 'pnpm install --frozen-lockfile' first.");
  }

  const packages = new Map();
  let parseErrors = 0;

  for (const directoryEntry of storeDirs) {
    const storeEntry = directoryEntry.name;
    if (storeEntry === 'lock.yaml' && directoryEntry.isFile()) continue;
    if (storeEntry === 'node_modules' && directoryEntry.isDirectory()) continue;
    if (!directoryEntry.isDirectory()) {
      fatal(`Unexpected non-directory entry in pnpm virtual store: ${storeEntry}`);
    }

    const innerModules = join(storeDir, storeEntry, 'node_modules');
    let entries;
    try {
      entries = readdirSync(innerModules);
    } catch (error) {
      fatal(`Cannot inspect pnpm virtual-store package ${storeEntry}: ${error.message}`);
    }

    for (const entry of entries) {
      if (entry.startsWith('@')) {
        let scopedEntries;
        try {
          scopedEntries = readdirSync(join(innerModules, entry));
        } catch (error) {
          fatal(
            `Cannot inspect pnpm scoped package directory ${storeEntry}/${entry}: ${error.message}`,
          );
        }
        for (const sub of scopedEntries) {
          const pj = join(innerModules, entry, sub, 'package.json');
          const info = readPackage(pj, `${entry}/${sub}`);
          if (info) {
            addPackage(packages, info, pj);
          } else {
            parseErrors++;
            process.stderr.write(`[license-report] WARN: Failed to read ${pj}\n`);
          }
        }
      } else {
        const pj = join(innerModules, entry, 'package.json');
        const info = readPackage(pj, entry);
        if (info) {
          addPackage(packages, info, pj);
        } else {
          parseErrors++;
          process.stderr.write(`[license-report] WARN: Failed to read ${pj}\n`);
        }
      }
    }
  }

  const workspacePath = join(root, 'pnpm-workspace.yaml');
  let workspaceText;
  try {
    workspaceText = readFileSync(workspacePath, 'utf8');
  } catch (e) {
    fatal(`Cannot read pnpm-workspace.yaml: ${e.message}`);
  }
  const linkPattern = /\blink:\s*["']?([^"'#\s]+)["']?/g;
  let linkMatch;
  while ((linkMatch = linkPattern.exec(workspaceText)) !== null) {
    const packageRoot = resolve(root, linkMatch[1]);
    const packageRelative = relative(root, packageRoot);
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
    addPackage(packages, info, manifestPath);
  }

  if (packages.size === 0) {
    fatal('No packages found in pnpm store — license scan produced empty results.');
  }

  return { packages, parseErrors };
}

export function inventoryEntries(packages) {
  const entries = [...packages.values()].map((info) => ({
    name: info.name,
    version: info.version,
    license: info.license,
    flag: classifyLicense(info.license),
  }));

  // Sort: REVIEW first, then CHECK, then OK — deterministic by package/version.
  entries.sort((a, b) => {
    const order = { REVIEW: 0, CHECK: 1, OK: 2 };
    const diff = order[a.flag] - order[b.flag];
    if (diff !== 0) return diff;
    return `${a.name}\u0000${a.version}`.localeCompare(`${b.name}\u0000${b.version}`);
  });
  return entries;
}

export function parseStrictJson(raw, label = 'JSON document') {
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

function exactDate(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be an ISO date in YYYY-MM-DD form`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a real calendar date`);
  }
  return value;
}

function exactNonemptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new Error(`${label} must be a non-empty, trimmed string`);
  }
  if (hasControlCharacters(value)) {
    throw new Error(`${label} must not contain control characters`);
  }
  if (value.includes('*')) throw new Error(`${label} must not contain a wildcard`);
  return value;
}

export function validateLicensePolicy(policy, { now = new Date() } = {}) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    throw new Error('license policy must be a JSON object');
  }
  const rootFields = Object.keys(policy).sort();
  if (JSON.stringify(rootFields) !== JSON.stringify(['reviews', 'schemaVersion'])) {
    throw new Error('license policy must contain exactly schemaVersion and reviews');
  }
  if (policy.schemaVersion !== POLICY_SCHEMA_VERSION || !Array.isArray(policy.reviews)) {
    throw new Error(
      `license policy must use schemaVersion ${POLICY_SCHEMA_VERSION} with reviews[]`,
    );
  }
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error('license policy evaluation time must be a valid Date');
  }

  const today = now.toISOString().slice(0, 10);
  const reviews = new Map();
  for (const [index, review] of policy.reviews.entries()) {
    const label = `license policy reviews[${index}]`;
    if (!review || typeof review !== 'object' || Array.isArray(review)) {
      throw new Error(`${label} must be an object`);
    }
    const fields = Object.keys(review).sort();
    if (JSON.stringify(fields) !== JSON.stringify(REVIEW_FIELDS)) {
      throw new Error(`${label} must contain exactly ${REVIEW_FIELDS.join(', ')}`);
    }

    exactNonemptyString(review.package, `${label}.package`);
    exactNonemptyString(review.version, `${label}.version`);
    exactNonemptyString(review.license, `${label}.license`);
    if (!REVIEW_CLASSIFICATIONS.has(review.classification)) {
      throw new Error(`${label}.classification must be REVIEW or CHECK`);
    }
    if (classifyLicense(review.license) !== review.classification) {
      throw new Error(`${label}.classification does not match the exact license string`);
    }
    if (review.decision !== 'allow') throw new Error(`${label}.decision must be allow`);
    if (typeof review.rationale !== 'string' || review.rationale.trim().length < 30) {
      throw new Error(`${label}.rationale must contain at least 30 non-whitespace characters`);
    }
    const reviewedAt = exactDate(review.reviewedAt, `${label}.reviewedAt`);
    const expires = exactDate(review.expires, `${label}.expires`);
    if (reviewedAt > today) throw new Error(`${label}.reviewedAt must not be in the future`);
    if (expires < reviewedAt) throw new Error(`${label}.expires precedes reviewedAt`);

    const identity = reviewIdentity(review);
    if (reviews.has(identity)) throw new Error(`${label} duplicates an exact review entry`);
    reviews.set(identity, Object.freeze({ ...review }));
  }
  return { reviews, today };
}

export function evaluateLicensePolicy(entries, parseErrors, policy, { now = new Date() } = {}) {
  if (!Array.isArray(entries) || !Number.isSafeInteger(parseErrors) || parseErrors < 0) {
    throw new Error('license inventory inputs are malformed');
  }
  const validated = validateLicensePolicy(policy, { now });
  const violations = [];
  const admitted = new Map();
  const inventory = new Set();

  if (parseErrors > 0) {
    violations.push(`${parseErrors} installed package manifest(s) could not be parsed`);
  }
  for (const [index, entry] of entries.entries()) {
    const label = `license inventory entries[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`${label} must be an object`);
    }
    exactNonemptyString(entry.name, `${label}.name`);
    exactNonemptyString(entry.version, `${label}.version`);
    exactNonemptyString(entry.license, `${label}.license`);
    const expectedFlag = classifyLicense(entry.license);
    if (entry.flag !== expectedFlag) {
      throw new Error(`${label}.flag does not match the exact license string`);
    }
    const packageKey = packageIdentity(entry.name, entry.version);
    if (inventory.has(packageKey)) {
      throw new Error(`${label} duplicates package/version ${entry.name}@${entry.version}`);
    }
    inventory.add(packageKey);

    if (!REVIEW_CLASSIFICATIONS.has(entry.flag)) continue;
    const identity = reviewIdentity({
      package: entry.name,
      version: entry.version,
      license: entry.license,
      classification: entry.flag,
    });
    const review = validated.reviews.get(identity);
    if (!review) {
      violations.push(
        `${entry.name}@${entry.version} (${entry.license}; ${entry.flag}) has no exact reviewed policy entry`,
      );
      continue;
    }
    if (review.expires < validated.today) {
      violations.push(
        `${entry.name}@${entry.version} (${entry.license}; ${entry.flag}) review expired ${review.expires}`,
      );
      continue;
    }
    admitted.set(identity, review);
  }

  return {
    admitted,
    passed: violations.length === 0,
    policyReviewCount: validated.reviews.size,
    violations,
  };
}

function markdownCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function disposition(entry, evaluation) {
  if (entry.flag === 'OK') return 'PERMISSIVE';
  const identity = reviewIdentity({
    package: entry.name,
    version: entry.version,
    license: entry.license,
    classification: entry.flag,
  });
  const review = evaluation.admitted.get(identity);
  return review ? `REVIEWED ALLOW (expires ${review.expires})` : 'BLOCKING';
}

export function buildReport(entries, parseErrors, evaluation, generated = new Date()) {
  const review = entries.filter((entry) => entry.flag === 'REVIEW');
  const check = entries.filter((entry) => entry.flag === 'CHECK');
  const ok = entries.filter((entry) => entry.flag === 'OK');

  let report = '# License Compliance Report\n\n';
  report += `**Generated:** ${generated.toISOString()}\n`;
  report += `**Verdict:** ${evaluation.passed ? 'PASS' : 'FAIL'}\n`;
  report += `**Policy:** \`security/license-policy.json\` (schema ${POLICY_SCHEMA_VERSION}; ${evaluation.policyReviewCount} exact review entries)\n`;
  report += `**Total unique package/version pairs scanned:** ${entries.length}\n`;
  report += `**Manifest parse errors:** ${parseErrors}\n\n`;

  report += '## Summary\n\n';
  report += '| Category | Count |\n|---|---:|\n';
  report += `| Permissive — OK | ${ok.length} |\n`;
  report += `| Copyleft/restrictive — REVIEW | ${review.length} |\n`;
  report += `| Unknown/non-standard — CHECK | ${check.length} |\n`;
  report += `| Exact reviewed admissions | ${evaluation.admitted.size} |\n`;
  report += `| Blocking policy/inventory violations | ${evaluation.violations.length} |\n`;
  report += `| **Total** | **${entries.length}** |\n\n`;

  if (evaluation.violations.length > 0) {
    report += '## Blocking policy or inventory violations\n\n';
    for (const violation of evaluation.violations) report += `- ${markdownCell(violation)}\n`;
    report += '\n';
  }

  report +=
    '`REVIEW` and `CHECK` findings block unless package, version, exact license string, and classification match an unexpired entry in the reviewed policy registry. Manifest parse failures always block. A registry entry is a narrow engineering admission, not a blanket license-family approval or legal opinion.\n\n';

  if (review.length > 0) {
    report += '## Copyleft / restrictive packages\n\n';
    report += '| Package | Version | License | Disposition |\n|---|---:|---|---|\n';
    for (const entry of review) {
      report += `| \`${markdownCell(entry.name)}\` | ${markdownCell(entry.version)} | ${markdownCell(entry.license)} | ${disposition(entry, evaluation)} |\n`;
    }
    report += '\n';
  }

  if (check.length > 0) {
    report += '## Unknown / non-standard license metadata\n\n';
    report += '| Package | Version | License string | Disposition |\n|---|---:|---|---|\n';
    for (const entry of check) {
      report += `| \`${markdownCell(entry.name)}\` | ${markdownCell(entry.version)} | ${markdownCell(entry.license)} | ${disposition(entry, evaluation)} |\n`;
    }
    report += '\n';
  }

  report += '## Full dependency license inventory\n\n';
  report +=
    '| Package | Version | License | Classification | Disposition |\n|---|---:|---|---|---|\n';
  for (const entry of entries) {
    report += `| \`${markdownCell(entry.name)}\` | ${markdownCell(entry.version)} | ${markdownCell(entry.license)} | ${entry.flag} | ${disposition(entry, evaluation)} |\n`;
  }
  report += '\n';
  report +=
    '_Auto-generated by `scripts/qa/generate-license-report.js`. Re-run after any dependency change._\n';
  return report;
}

function fatalReport(error, generated = new Date()) {
  const message = String(error?.message ?? error).replaceAll('\n', ' ');
  return `# License Compliance Report\n\n**Generated:** ${generated.toISOString()}\n**Verdict:** FAIL\n\n## Blocking policy or inventory violations\n\n- License evidence could not be evaluated: ${markdownCell(message)}\n\n_The required license gate remains blocked._\n`;
}

function writeReport(report) {
  const temporaryFile = `${OUTPUT_FILE}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryFile, report, { flag: 'wx' });
    renameSync(temporaryFile, OUTPUT_FILE);
  } finally {
    rmSync(temporaryFile, { force: true });
  }
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  try {
    const { packages, parseErrors } = scanStore();
    const entries = inventoryEntries(packages);
    const policy = parseStrictJson(readFileSync(POLICY_FILE, 'utf8'), 'license policy');
    const evaluation = evaluateLicensePolicy(entries, parseErrors, policy);
    writeReport(buildReport(entries, parseErrors, evaluation));
    process.stdout.write(
      `${evaluation.passed ? 'PASS' : 'FAIL'}: ${entries.length} package/version pairs; ${evaluation.violations.length} violation(s)\n`,
    );
    if (!evaluation.passed) process.exitCode = 1;
  } catch (error) {
    writeReport(fatalReport(error));
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
