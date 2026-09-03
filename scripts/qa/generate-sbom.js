#!/usr/bin/env node
/**
 * Deterministic CycloneDX SBOM generator.
 *
 * This script is intentionally inventory-only and network-free. Vulnerability
 * policy is enforced separately by generate-vuln-report.js using the package
 * manager's own `pnpm audit --audit-level=high` exit status. Keeping SBOM
 * generation independent from registry availability makes the artifact
 * reproducible while preserving a fail-closed vulnerability gate.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, 'security');
const HISTORY_DIR = join(OUTPUT_DIR, 'sbom-history');

function fatal(message) {
  console.error(message);
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

export function parseLockfile() {
  const lockfilePath = join(ROOT, 'pnpm-lock.yaml');
  let lockfileText;
  try {
    lockfileText = readFileSync(lockfilePath, 'utf8');
  } catch (err) {
    fatal(`Cannot read pnpm-lock.yaml: ${err.message}`);
  }

  const packages = {};
  const marker = lockfileText.indexOf('\npackages:');
  if (marker < 0) fatal('pnpm-lock.yaml is missing the packages section');
  const inPackagesSection = lockfileText.slice(marker);
  const pkgRegex = /^ {2}'((?:@[^@'\n]+\/)?[^@'\n]+)@([^'()\n]+)/gm;
  let match;
  while ((match = pkgRegex.exec(inPackagesSection)) !== null) {
    const name = match[1].trim();
    const version = match[2].trim();
    if (!name || !version || version.includes(' ')) continue;
    if (!packages[name]) packages[name] = new Set();
    packages[name].add(version);
  }
  addLinkedWorkspacePackages(packages);

  const result = {};
  for (const [name, versionSet] of Object.entries(packages)) {
    result[name] = Array.from(versionSet).sort();
  }
  return result;
}

export function buildSbom(packages) {
  const components = [];
  for (const [name, versions] of Object.entries(packages).sort(([a], [b]) => a.localeCompare(b))) {
    for (const version of versions) {
      components.push({
        type: 'library',
        name,
        version,
        purl: `pkg:npm/${name}@${version}`,
      });
    }
  }

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    version: 1,
    serialNumber: `urn:uuid:${crypto.randomUUID()}`,
    metadata: {
      timestamp: new Date().toISOString(),
      scanStatus: 'inventory-only',
      vulnerabilityAuthority: 'pnpm audit --audit-level=high (separate blocking CI step)',
      tools: [{ vendor: 'SZL Holdings', name: 'generate-sbom.js', version: '3.0.0' }],
      component: { type: 'application', name: 'szl-platform', version: '1.0.0' },
      statistics: {
        totalPackages: components.length,
      },
    },
    components,
  };
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(HISTORY_DIR, { recursive: true });
  const packages = parseLockfile();
  const sbom = buildSbom(packages);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sbomPath = join(HISTORY_DIR, `sbom-${timestamp}.json`);
  const latestPath = join(OUTPUT_DIR, 'sbom-latest.json');
  const rendered = JSON.stringify(sbom, null, 2) + '\n';
  writeFileSync(sbomPath, rendered);
  writeFileSync(latestPath, rendered);

  console.log(`SBOM generated: ${sbom.metadata.statistics.totalPackages} package components`);
  console.log('Vulnerability authority: pnpm audit --audit-level=high in generate-vuln-report.js');
}

main().catch((err) => fatal(err.message));
