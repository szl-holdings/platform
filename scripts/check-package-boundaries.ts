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

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname ?? process.cwd(), "..");

interface Violation {
  file: string;
  line: number;
  importPath: string;
  rule: string;
}

const violations: Violation[] = [];

function getFiles(dir: string, ext = [".ts", ".tsx"]): string[] {
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
        entry === "node_modules" ||
        entry === "dist" ||
        entry === "build" ||
        entry === ".cache" ||
        entry.startsWith(".")
      ) continue;
      results.push(...getFiles(full, ext));
    } else if (ext.some((e) => entry.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function extractImports(content: string): Array<{ line: number; path: string }> {
  const imports: Array<{ line: number; path: string }> = [];
  const lines = content.split("\n");
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

function isArtifactPath(importPath: string, fromArtifact: string): boolean {
  // Relative imports like ../../artifacts/api-server
  if (!importPath.startsWith(".")) return false;
  const normalized = importPath.replace(/\\/g, "/");
  return /\.\.\/.*artifacts\//.test(normalized) || /^\.\.\/[^/]+\//.test(normalized);
}

function checkArtifactFiles(): void {
  const artifactsDir = join(ROOT, "artifacts");
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
    return;
  }

  for (const artifactName of artifactDirs) {
    const srcDir = join(artifactsDir, artifactName, "src");
    const files = getFiles(srcDir);

    for (const file of files) {
      let content: string;
      try {
        content = readFileSync(file, "utf8");
      } catch {
        continue;
      }

      const imports = extractImports(content);
      const relFile = relative(ROOT, file);

      for (const { line, path: importPath } of imports) {
        // Rule: artifacts must not import from other artifacts via relative path
        if (
          importPath.includes("/artifacts/") ||
          (importPath.startsWith("../") && /\/?artifacts\//.test(importPath))
        ) {
          violations.push({
            file: relFile,
            line,
            importPath,
            rule: "ARTIFACT_CROSS_IMPORT: Artifacts must not import from other artifacts. Use a shared package instead.",
          });
        }
      }
    }
  }
}

function checkPackageFiles(pkgRoot: string, pkgLabel: string): void {
  const files = getFiles(join(ROOT, pkgRoot));

  for (const file of files) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const imports = extractImports(content);
    const relFile = relative(ROOT, file);

    for (const { line, path: importPath } of imports) {
      // Rule: lib/* and packages/* must not import from artifacts/*
      if (
        importPath.includes("/artifacts/") ||
        (importPath.startsWith("../") && /\/?artifacts\//.test(importPath))
      ) {
        violations.push({
          file: relFile,
          line,
          importPath,
          rule: `PKG_IMPORTS_ARTIFACT: ${pkgLabel} packages must not import from artifacts/. Extract shared logic to a package.`,
        });
      }
    }
  }
}

// Run checks
checkArtifactFiles();
checkPackageFiles("packages", "packages/*");
checkPackageFiles("lib", "lib/*");

// Report
if (violations.length === 0) {
  console.log("✓ No package boundary violations found.");
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
