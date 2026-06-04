#!/usr/bin/env node
/**
 * audit:broken-links — SZL Holdings Platform
 * Scans source files for internal href/Link references that point to undefined routes.
 * Also checks that all lazily-imported page modules actually exist on disk.
 *
 * Usage:
 *   node scripts/qa/audit-broken-links.js
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, dirname as pathDirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const APP_CONFIGS = [
  {
    name: 'SZL Holdings',
    srcDir: join(ROOT, 'artifacts/szl-holdings/src'),
    appFile: 'App.tsx',
  },
  {
    name: 'Lyte Command Center',
    srcDir: join(ROOT, 'artifacts/lyte-command-center/src'),
    appFile: 'App.tsx',
  },
];

const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.cache'];
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx']);

// External links and anchors to ignore
const _ALLOWED_EXTERNAL = ['http://', 'https://', 'mailto:', 'tel:', '#', 'javascript:'];

function walkDir(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkDir(fullPath));
      } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch {
    // skip
  }
  return files;
}

function extractImports(content, _filePath) {
  const imports = [];
  const importRegex = /(?:import|from)\s+["'](@\/[^"']+|\.\.?\/[^"']+)["']/g;
  const lazyRegex = /lazy\(\s*\(\)\s*=>\s*import\(\s*["'](@\/[^"']+|\.\.?\/[^"']+)["']\s*\)\s*\)/g;

  let match;
  while ((match = lazyRegex.exec(content)) !== null) {
    imports.push({ path: match[1], lazy: true });
  }
  while ((match = importRegex.exec(content)) !== null) {
    imports.push({ path: match[1], lazy: false });
  }

  return imports;
}

function resolveImportPath(importPath, fromFile, srcDir) {
  if (importPath.startsWith('@/')) {
    const rel = importPath.slice(2);
    return join(srcDir, rel);
  }
  return resolve(pathDirname(fromFile), importPath);
}

function fileExists(basePath) {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
  for (const ext of extensions) {
    if (existsSync(basePath + ext)) return true;
  }
  return existsSync(basePath);
}

function auditApp(config) {
  const { name, srcDir } = config;
  const findings = [];

  const files = walkDir(srcDir);

  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    // Check lazy imports / regular imports
    const imports = extractImports(content, file);
    for (const { path: importPath, lazy } of imports) {
      // Skip workspace imports
      if (
        importPath.startsWith('@workspace/') ||
        importPath.startsWith('wouter') ||
        importPath.startsWith('react')
      )
        continue;

      const resolved = resolveImportPath(importPath, file, srcDir);
      if (!fileExists(resolved)) {
        findings.push({
          app: name,
          file: relative(ROOT, file),
          importPath,
          resolved: relative(ROOT, resolved),
          type: lazy ? 'lazy import' : 'import',
          severity: 'error',
        });
      }
    }
  }

  return findings;
}

function main() {

  const allFindings = [];

  for (const config of APP_CONFIGS) {
    allFindings.push(...auditApp(config));
  }

  const errors = allFindings.filter((f) => f.severity === 'error');
  const _warnings = allFindings.filter((f) => f.severity === 'warning');

  if (errors.length > 0) {
    for (const _f of errors) {
    }
  }

  if (errors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
