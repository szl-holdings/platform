#!/usr/bin/env npx tsx
/**
 * check-env-coverage.ts
 *
 * Scans all TypeScript/JavaScript source files for process.env.* and
 * import.meta.env.VITE_* references, then compares against .env.example
 * files to detect undocumented environment variables.
 *
 * Usage:
 *   npx tsx scripts/check-env-coverage.ts
 *   npx tsx scripts/check-env-coverage.ts --strict   # exit 1 on missing vars
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const STRICT = process.argv.includes('--strict');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs']);

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.local',
  'coverage',
  'build',
  '.cache',
]);

const ENV_EXAMPLE_FILES = [
  '.env.example',
  'artifacts/api-server/.env.example',
];

const IGNORE_PATTERNS = [
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
];

function shouldIgnore(varName: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(varName));
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
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
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

function loadExampleKeys(): Set<string> {
  const keys = new Set<string>();
  for (const relPath of ENV_EXAMPLE_FILES) {
    const fullPath = path.join(ROOT, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      if (key) keys.add(key);
    }
  }
  return keys;
}

function main(): void {
  console.log('🔍 Scanning source files for env var references…\n');

  const allRefs = new Map<string, string[]>();
  const sourceFiles = collectSourceFiles(ROOT);

  for (const file of sourceFiles) {
    const refs = extractEnvRefs(file);
    for (const [key, locations] of refs) {
      if (!allRefs.has(key)) allRefs.set(key, []);
      allRefs.get(key)!.push(...locations);
    }
  }

  const documentedKeys = loadExampleKeys();

  const undocumented: Array<{ key: string; locations: string[] }> = [];
  const documented: string[] = [];

  const sortedKeys = Array.from(allRefs.keys()).sort();
  for (const key of sortedKeys) {
    if (documentedKeys.has(key)) {
      documented.push(key);
    } else {
      undocumented.push({ key, locations: Array.from(new Set(allRefs.get(key)!)) });
    }
  }

  console.log(`✅ Documented env vars referenced in source: ${documented.length}`);

  if (undocumented.length === 0) {
    console.log('\n✅ All env var references are documented in .env.example files.\n');
    process.exit(0);
  }

  console.log(`\n⚠️  Found ${undocumented.length} undocumented env var(s):\n`);
  for (const { key, locations } of undocumented) {
    const uniqueLocations = Array.from(new Set(locations)).slice(0, 3);
    const suffix = locations.length > 3 ? ` (+${locations.length - 3} more)` : '';
    console.log(`  ${key}`);
    console.log(`    Used in: ${uniqueLocations.join(', ')}${suffix}`);
  }

  console.log(
    '\nAdd the missing variables to artifacts/api-server/.env.example or .env.example.\n',
  );

  if (STRICT) {
    process.exit(1);
  }
}

main();
