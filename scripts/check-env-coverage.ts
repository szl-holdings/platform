#!/usr/bin/env npx tsx
/**
 * check-env-coverage.ts
 *
 * Per-artifact environment variable coverage check.
 *
 * For every artifact directory that contains a .env.example file, this script
 * scans the artifact's own source files for `process.env.*` and
 * `import.meta.env.VITE_*` references and reports any variable that is used
 * in code but not listed in the artifact's .env.example.
 *
 * Shared workspace packages (packages/) are checked against the api-server's
 * .env.example because they are primarily consumed by the backend.
 *
 * Usage:
 *   npx tsx scripts/check-env-coverage.ts            # advisory (exit 0 always)
 *   npx tsx scripts/check-env-coverage.ts --strict   # exit 1 on missing vars
 *   npx tsx scripts/check-env-coverage.ts --artifact api-server  # single artifact
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const STRICT = process.argv.includes('--strict');

const singleArtifactFlag = process.argv.indexOf('--artifact');
const SINGLE_ARTIFACT: string | null =
  singleArtifactFlag !== -1 ? (process.argv[singleArtifactFlag + 1] ?? null) : null;

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs']);

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.local',
  'coverage',
  'build',
  '.cache',
  '__snapshots__',
  '__tests__',
  '__mocks__',
  '__fixtures__',
  'e2e',
  'fixtures',
  'test-helpers',
]);

const SKIP_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /\.stories\.[jt]sx?$/,
  /check-env-coverage/,
];

/**
 * Variables that are OS/runtime-level or Replit-platform-injected and should
 * never appear in a developer-configured .env.example.
 */
const IGNORE_PATTERNS: RegExp[] = [
  // Standard OS / shell variables
  /^NODE_ENV$/,
  /^PATH$/,
  /^HOME$/,
  /^USER$/,
  /^SHELL$/,
  /^TERM$/,
  /^TMPDIR$/,
  /^PWD$/,
  /^OLDPWD$/,
  /^_$/,
  /^npm_/,
  /^INIT_CWD$/,
  /^GOPATH$/,
  /^GOROOT$/,
  /^GOMAXPROCS$/,

  // CI / GitHub Actions variables
  /^CI$/,
  /^GITHUB_/,
  /^RUNNER_/,
  /^ACTIONS_/,

  // Replit platform-injected variables (set automatically; developers cannot configure)
  /^REPL_ID$/,
  /^REPL_HOME$/,
  /^REPL_IDENTITY$/,
  /^REPLIT_CONNECTORS_HOSTNAME$/,
  /^WEB_REPL_RENEWAL$/,
  /^BASE_PATH$/,       // Replit per-artifact path prefix (injected at build time)

  // Internal build / startup flags (not real env vars)
  /^__FAST_START_SERVER$/,

  // VITE_PORT is used in vite.config.ts as a platform-assigned build alias for PORT.
  // Developers should not set this — the Replit workflow runner provides it.
  /^VITE_PORT$/,
];

function shouldIgnore(varName: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(varName));
}

function shouldSkipFile(filePath: string): boolean {
  const base = path.basename(filePath);
  return SKIP_FILE_PATTERNS.some((p) => p.test(base));
}

function collectSourceFiles(dir: string, files: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(full, files);
    } else if (
      entry.isFile() &&
      SOURCE_EXTENSIONS.has(path.extname(entry.name)) &&
      !shouldSkipFile(full)
    ) {
      files.push(full);
    }
  }
  return files;
}

function extractEnvRefs(file: string): Map<string, string[]> {
  let content: string;
  try {
    content = fs.readFileSync(file, 'utf-8');
  } catch {
    return new Map();
  }

  const refs = new Map<string, string[]>();
  const relPath = path.relative(ROOT, file);

  const processEnvRe = /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = processEnvRe.exec(content)) !== null) {
    const key = m[1];
    if (shouldIgnore(key)) continue;
    if (!refs.has(key)) refs.set(key, []);
    refs.get(key)!.push(relPath);
  }

  const viteEnvRe = /import\.meta\.env\.(VITE_[A-Za-z0-9_]+)/g;
  while ((m = viteEnvRe.exec(content)) !== null) {
    const key = m[1];
    if (!refs.has(key)) refs.set(key, []);
    refs.get(key)!.push(relPath);
  }

  return refs;
}

function loadExampleKeys(examplePath: string): Set<string> {
  const keys = new Set<string>();
  if (!fs.existsSync(examplePath)) return keys;
  const content = fs.readFileSync(examplePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (key) keys.add(key);
  }
  return keys;
}

interface ArtifactReport {
  artifact: string;
  examplePath: string;
  undocumented: Array<{ key: string; locations: string[] }>;
  documented: number;
  sourceFileCount: number;
}

function checkArtifact(artifactName: string, artifactDir: string, examplePath: string): ArtifactReport {
  const sourceFiles = collectSourceFiles(artifactDir);
  const allRefs = new Map<string, string[]>();

  for (const file of sourceFiles) {
    const refs = extractEnvRefs(file);
    for (const [key, locations] of refs) {
      if (!allRefs.has(key)) allRefs.set(key, []);
      allRefs.get(key)!.push(...locations);
    }
  }

  const documentedKeys = loadExampleKeys(examplePath);
  const undocumented: Array<{ key: string; locations: string[] }> = [];
  let documented = 0;

  const sortedKeys = Array.from(allRefs.keys()).sort();
  for (const key of sortedKeys) {
    if (documentedKeys.has(key)) {
      documented++;
    } else {
      undocumented.push({
        key,
        locations: Array.from(new Set(allRefs.get(key)!)),
      });
    }
  }

  return {
    artifact: artifactName,
    examplePath: path.relative(ROOT, examplePath),
    undocumented,
    documented,
    sourceFileCount: sourceFiles.length,
  };
}

function discoverArtifacts(): Array<{ name: string; dir: string; examplePath: string }> {
  const artifactsDir = path.join(ROOT, 'artifacts');
  const results: Array<{ name: string; dir: string; examplePath: string }> = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(artifactsDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const artifactDir = path.join(artifactsDir, entry.name);
    const examplePath = path.join(artifactDir, '.env.example');
    if (fs.existsSync(examplePath)) {
      results.push({ name: entry.name, dir: artifactDir, examplePath });
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
}

function checkSharedPackages(apiServerExamplePath: string): ArtifactReport | null {
  const packagesDir = path.join(ROOT, 'packages');
  if (!fs.existsSync(packagesDir)) return null;

  return checkArtifact('packages (shared)', packagesDir, apiServerExamplePath);
}

function main(): void {
  console.log('🔍 Per-artifact env-var coverage check\n');

  const artifacts = discoverArtifacts();

  if (artifacts.length === 0) {
    console.log('No artifact .env.example files found. Nothing to check.\n');
    process.exit(0);
  }

  const selected = SINGLE_ARTIFACT
    ? artifacts.filter((a) => a.name === SINGLE_ARTIFACT)
    : artifacts;

  if (SINGLE_ARTIFACT && selected.length === 0) {
    console.error(`❌ Artifact "${SINGLE_ARTIFACT}" not found or has no .env.example.\n`);
    process.exit(1);
  }

  const reports: ArtifactReport[] = [];

  for (const { name, dir, examplePath } of selected) {
    reports.push(checkArtifact(name, dir, examplePath));
  }

  if (!SINGLE_ARTIFACT) {
    const apiServerExample = path.join(ROOT, 'artifacts', 'api-server', '.env.example');
    const sharedReport = checkSharedPackages(apiServerExample);
    if (sharedReport) reports.push(sharedReport);
  }

  let totalUndocumented = 0;
  const failingArtifacts: string[] = [];

  for (const report of reports) {
    const { artifact, examplePath, undocumented, documented, sourceFileCount } = report;
    const status = undocumented.length === 0 ? '✅' : '❌';
    console.log(`${status} ${artifact}`);
    console.log(`   example : ${examplePath}`);
    console.log(`   sources : ${sourceFileCount} files scanned`);
    console.log(`   documented   : ${documented} var(s) covered`);

    if (undocumented.length > 0) {
      console.log(`   undocumented : ${undocumented.length} var(s) missing from .env.example`);
      for (const { key, locations } of undocumented) {
        const shown = locations.slice(0, 3);
        const more = locations.length > 3 ? ` (+${locations.length - 3} more)` : '';
        console.log(`     • ${key}`);
        console.log(`       ${shown.join(', ')}${more}`);
      }
      totalUndocumented += undocumented.length;
      failingArtifacts.push(artifact);
    }

    console.log();
  }

  console.log('─'.repeat(60));

  if (totalUndocumented === 0) {
    console.log(
      `\n✅ All ${reports.length} artifact(s) are fully documented in their .env.example files.\n`,
    );
    process.exit(0);
  }

  console.log(
    `\n⚠️  ${totalUndocumented} undocumented env var(s) across ${failingArtifacts.length} artifact(s):\n`,
  );
  for (const name of failingArtifacts) {
    console.log(`  • ${name}`);
  }
  console.log(
    '\nAdd the missing variables to the relevant artifact .env.example file(s).\n',
  );
  console.log(
    'Run locally to see the full list:\n' +
      '  npx tsx scripts/check-env-coverage.ts\n',
  );

  if (STRICT) {
    process.exit(1);
  }
}

main();
