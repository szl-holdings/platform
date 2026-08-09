#!/usr/bin/env node
/**
 * Security SBOM Generator & Vulnerability Scanner
 *
 * Uses the npm bulk advisory endpoint (POST /-/npm/v1/security/advisories/bulk)
 * which replaced the deprecated /v1/security/audits endpoint.
 *
 * Response schema: { [packageName]: [{ id, url, title, severity, vulnerable_versions, cwe, cvss }] }
 * The package name is the OBJECT KEY — there is no `module_name` field in the response.
 *
 * Fails with exit code 1 if:
 *   - The advisory endpoint is unreachable or returns an error
 *   - Any high or critical severity vulnerability is found
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const HISTORY_DIR = join(OUTPUT_DIR, 'sbom-history');

const NPM_BULK_ADVISORY_URL = 'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk';
const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low'];

function fatal(_message) {
  process.exit(1);
}

function addLinkedWorkspacePackages(packages) {
  const workspacePath = join(ROOT, 'pnpm-workspace.yaml');
  let workspaceText;
  try {
    workspaceText = readFileSync(workspacePath, 'utf8');
  } catch (err) {
    fatal(`Cannot read pnpm-workspace.yaml: ${err.message}`);
  }

  const linkPattern = /\blink:\s*["']?([^"'#\s]+)["']?/g;
  let match;
  while ((match = linkPattern.exec(workspaceText)) !== null) {
    const packageRoot = resolve(ROOT, match[1]);
    const packageRelative = relative(ROOT, packageRoot);
    if (
      packageRelative === '..' ||
      packageRelative.startsWith('../') ||
      packageRelative.startsWith('..\\') ||
      isAbsolute(packageRelative)
    ) {
      fatal(`Linked workspace package escapes repository root: ${match[1]}`);
    }
    const manifestPath = join(packageRoot, 'package.json');
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      fatal(`Cannot read linked workspace package ${manifestPath}: ${err.message}`);
    }
    if (
      typeof manifest.name !== 'string' ||
      !manifest.name ||
      typeof manifest.version !== 'string' ||
      !manifest.version
    ) {
      fatal(`Linked workspace package lacks name/version: ${manifestPath}`);
    }
    if (!packages[manifest.name]) packages[manifest.name] = new Set();
    packages[manifest.name].add(manifest.version);
  }
}

function parseLockfile() {
  const lockfilePath = join(ROOT, 'pnpm-lock.yaml');
  let lockfileText;
  try {
    lockfileText = readFileSync(lockfilePath, 'utf8');
  } catch (err) {
    fatal(`Cannot read pnpm-lock.yaml: ${err.message}`);
  }

  const packages = {};

  // pnpm v9 lockfile format: packages section entries look like:
  //   'package-name@version':
  //   '@scope/package-name@version':
  //
  // We scan specifically within the packages: section for these entries.
  const inPackagesSection = lockfileText.slice(lockfileText.indexOf('\npackages:'));

  // Match quoted package@version entries in the packages section
  // Handles both scoped (@scope/pkg@ver) and unscoped (pkg@ver) packages
  const pkgRegex = /^ {2}'((?:@[^@'\n]+\/)?[^@'\n]+)@([^'()\n]+)/gm;
  let match;
  while ((match = pkgRegex.exec(inPackagesSection)) !== null) {
    const name = match[1].trim();
    const version = match[2].trim();
    if (!name || !version || version.includes(' ')) continue;
    if (!packages[name]) {
      packages[name] = new Set();
    }
    packages[name].add(version);
  }
  addLinkedWorkspacePackages(packages);

  const result = {};
  for (const [name, versionSet] of Object.entries(packages)) {
    result[name] = Array.from(versionSet);
  }
  return result;
}

async function fetchAdvisories(packages) {
  const body = {};
  for (const [name, versions] of Object.entries(packages)) {
    body[name] = versions;
  }

  const _packageCount = Object.keys(body).length;

  let response;
  try {
    response = await fetch(NPM_BULK_ADVISORY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    fatal(`Advisory endpoint request failed: ${err.message}. Check network connectivity.`);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    fatal(`Advisory endpoint returned HTTP ${response.status}: ${text}`);
  }

  let advisories;
  try {
    advisories = await response.json();
  } catch (err) {
    fatal(`Advisory endpoint returned non-JSON response: ${err.message}`);
  }

  if (typeof advisories !== 'object' || advisories === null) {
    fatal('Advisory endpoint returned unexpected response shape (not an object).');
  }

  return advisories;
}

/**
 * Flatten advisories from { [pkgName]: AdvisoryEntry[] } into a tagged flat list.
 * The npm bulk advisory endpoint uses the object KEY as the package name —
 * there is no `module_name` field in the advisory entry itself.
 */
function flattenAdvisories(advisories) {
  return Object.entries(advisories).flatMap(([pkgName, advs]) =>
    (Array.isArray(advs) ? advs : [advs]).map((adv) => ({
      ...adv,
      packageName: pkgName,
    })),
  );
}

function buildSbom(packages, advisories) {
  const components = [];
  for (const [name, versions] of Object.entries(packages)) {
    for (const version of versions) {
      components.push({
        type: 'library',
        name,
        version,
        purl: `pkg:npm/${name}@${version}`,
      });
    }
  }

  const flatVulns = flattenAdvisories(advisories);

  const vulnList = flatVulns.map((adv) => ({
    id: `npm-advisory-${adv.id}`,
    source: { name: 'npmjs', url: adv.url },
    ratings: [
      {
        severity: adv.severity,
        score: adv.cvss?.score ?? null,
        vector: adv.cvss?.vectorString ?? null,
      },
    ],
    cwes: adv.cwe ?? [],
    description: adv.title,
    recommendation: `Upgrade ${adv.packageName} to a non-vulnerable version. Vulnerable range: ${adv.vulnerable_versions ?? 'unknown'}`,
    affects: adv.vulnerable_versions
      ? [{ ref: `pkg:npm/${adv.packageName}`, versions: [{ range: adv.vulnerable_versions }] }]
      : [],
  }));

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    version: 1,
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    metadata: {
      timestamp: new Date().toISOString(),
      scanStatus: 'success',
      tools: [{ vendor: 'SZL Holdings', name: 'generate-sbom.js', version: '2.2.0' }],
      component: { type: 'application', name: 'szl-platform', version: '1.0.0' },
      statistics: {
        totalPackages: components.length,
        vulnerabilitiesFound: vulnList.length,
        critical: flatVulns.filter((v) => v.severity === 'critical').length,
        high: flatVulns.filter((v) => v.severity === 'high').length,
        moderate: flatVulns.filter((v) => v.severity === 'moderate').length,
        low: flatVulns.filter((v) => v.severity === 'low').length,
      },
    },
    components,
    vulnerabilities: vulnList,
  };
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(HISTORY_DIR, { recursive: true });
  const packages = parseLockfile();
  const _packageCount = Object.keys(packages).length;

  const advisories = await fetchAdvisories(packages);

  const flatVulns = flattenAdvisories(advisories);

  const sbom = buildSbom(packages, advisories);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // Timestamped archive goes to sbom-history/ to keep security/ root clean
  const sbomPath = join(HISTORY_DIR, `sbom-${timestamp}.json`);
  const latestPath = join(OUTPUT_DIR, 'sbom-latest.json');

  writeFileSync(sbomPath, JSON.stringify(sbom, null, 2));
  writeFileSync(latestPath, JSON.stringify(sbom, null, 2));

  if (flatVulns.length > 0) {
    for (const severity of SEVERITY_ORDER) {
      const count = flatVulns.filter((v) => v.severity === severity).length;
      if (count > 0) {
      }
    }
  }

  const highAndCritical = flatVulns.filter(
    (v) => v.severity === 'critical' || v.severity === 'high',
  );

  if (highAndCritical.length > 0) {
    for (const _v of highAndCritical) {
    }
    process.exit(1);
  }
}

main().catch((err) => fatal(err.message));
