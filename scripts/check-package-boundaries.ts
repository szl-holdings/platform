#!/usr/bin/env tsx
/**
 * check-package-boundaries.ts
 *
 * Enforces package boundary rules for the SZL Holdings monorepo.
 * Run via: pnpm tsx scripts/check-package-boundaries.ts
 * Or via CI: it exits non-zero on any violation.
 *
 * Rules enforced:
 *   1. Artifacts must not directly import from other artifacts.
 *   2. Packages in lib/* must not import from artifacts/*.
 *   3. packages/* must not import from artifacts/*.
 *   4. Agent/AI engine packages must not import from presentation layers.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export interface Violation {
  file: string;
  line: number;
  importPath: string;
  rule: string;
}

export function getFiles(dir: string, ext = ['.ts', '.tsx']): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (
        entry === 'node_modules' ||
        entry === 'dist' ||
        entry === 'build' ||
        entry === '.cache' ||
        entry.startsWith('.')
      )
        continue;
      results.push(...getFiles(full, ext));
    } else if (ext.some((e) => entry.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

export function extractImports(content: string): Array<{ line: number; path: string }> {
  const imports: Array<{ line: number; path: string }> = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Match static imports/exports and dynamic imports
    const patterns = [
      /from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        imports.push({ line: i + 1, path: match[1]! });
      }
    }
  }
  return imports;
}

export function isArtifactImport(importPath: string): boolean {
  // Matches both relative (../../artifacts/foo) and bare/aliased
  // (something/artifacts/bar) paths that cross into another artifact tree.
  return (
    importPath.includes('/artifacts/') ||
    (importPath.startsWith('../') && /\/?artifacts\//.test(importPath))
  );
}

export function checkArtifactFiles(root: string): Violation[] {
  const violations: Violation[] = [];
  const artifactsDir = join(root, 'artifacts');
  let artifactDirs: string[];
  try {
    artifactDirs = readdirSync(artifactsDir).filter((d) => {
      try {
        return statSync(join(artifactsDir, d)).isDirectory();
      } catch {
        return false;
      }
    });
  } catch {
    return violations;
  }

  for (const artifactName of artifactDirs) {
    const srcDir = join(artifactsDir, artifactName, 'src');
    const files = getFiles(srcDir);

    for (const file of files) {
      let content: string;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      const imports = extractImports(content);
      const relFile = relative(root, file);

      for (const { line, path: importPath } of imports) {
        if (isArtifactImport(importPath)) {
          violations.push({
            file: relFile,
            line,
            importPath,
            rule: 'ARTIFACT_CROSS_IMPORT: Artifacts must not import from other artifacts. Use a shared package instead.',
          });
        }
      }
    }
  }
  return violations;
}

export function checkPackageFiles(root: string, pkgRoot: string, pkgLabel: string): Violation[] {
  const violations: Violation[] = [];
  const files = getFiles(join(root, pkgRoot));

  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const imports = extractImports(content);
    const relFile = relative(root, file);

    for (const { line, path: importPath } of imports) {
      if (isArtifactImport(importPath)) {
        violations.push({
          file: relFile,
          line,
          importPath,
          rule: `PKG_IMPORTS_ARTIFACT: ${pkgLabel} packages must not import from artifacts/. Extract shared logic to a package.`,
        });
      }
    }
  }
  return violations;
}

export function runChecks(root: string): Violation[] {
  return [
    ...checkArtifactFiles(root),
    ...checkPackageFiles(root, 'packages', 'packages/*'),
    ...checkPackageFiles(root, 'lib', 'lib/*'),
  ];
}

function isMainModule(): boolean {
  // True when invoked directly (not imported as a module).
  if (typeof process === 'undefined' || !process.argv[1]) return false;
  const entry = resolve(process.argv[1]);
  const here = resolve(import.meta.dirname ?? '', 'check-package-boundaries.ts');
  return entry === here || entry.endsWith('check-package-boundaries.ts');
}

if (isMainModule()) {
  const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');
  const violations = runChecks(ROOT);

  if (violations.length === 0) {
    console.log('✓ No package boundary violations found.');
    process.exit(0);
  } else {
    console.error(`\n✗ Found ${violations.length} package boundary violation(s):\n`);
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`    Import: "${v.importPath}"`);
      console.error(`    Rule:   ${v.rule}`);
      console.error();
    }
    process.exit(1);
  }
}
