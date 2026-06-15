#!/usr/bin/env node
/**
 * Guard: every relative import/export in lib/db/src/schema/**\/*.ts MUST carry an
 * explicit file extension (the repo convention is `.js`, e.g. `export * from './auth.js'`).
 *
 * Why this exists
 * ---------------
 * `lib/db/src/schema/*.ts` is type-checked *directly from source* by a NodeNext
 * consumer (`apps/alloy-ingestion-orchestrator`, `moduleResolution: nodenext`).
 * Under NodeNext, an extensionless relative import is a hard `TS2835` error. When
 * 90 schema files silently drifted to `from './auth'` the platform "Tests" check
 * went RED with 133 TS2835 errors. Nothing enforced the convention, so it could
 * (and did) recur. This guard fails CI the moment any schema file reintroduces an
 * extensionless relative import.
 *
 * Usage
 * -----
 *   node scripts/check-schema-import-extensions.mjs            # scan committed tree, exit 1 on drift
 *   node scripts/check-schema-import-extensions.mjs --selftest # negative-fixture self-test (proves the detector works)
 *
 * Dependency-free on purpose: it runs in its own lightweight workflow without
 * `pnpm install`, so it cannot be silently skipped by a broken toolchain.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_DIR = 'lib/db/src/schema';

// Relative specifiers ending in one of these are considered "explicit" and OK.
const ALLOWED_EXTENSIONS = [
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.json',
  '.node',
  '.wasm',
  '.css',
];

// Matches the specifier string of:
//   import ... from '<spec>'        export ... from '<spec>'
//   import '<spec>'                 (side-effect)
//   import('<spec>')                (dynamic)
// capturing only relative specifiers (those that start with `.`).
const SPECIFIER_PATTERNS = [
  /\b(?:import|export)\b[^'"\n;]*?\bfrom\s*['"](\.[^'"]+)['"]/g, // import/export ... from '...'
  /\bimport\s*['"](\.[^'"]+)['"]/g, // side-effect import '...'
  /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g, // dynamic import('...')
];

/**
 * @param {string} spec a relative module specifier (starts with `.`)
 * @returns {boolean} true when the specifier carries an explicit, allowed extension
 */
export function hasExplicitExtension(spec) {
  // Strip any query/hash suffix (e.g. './x.js?worker') before checking.
  const clean = spec.split(/[?#]/)[0];
  const lastSegment = clean.split('/').pop() ?? '';
  return ALLOWED_EXTENSIONS.some((ext) => lastSegment.toLowerCase().endsWith(ext));
}

/**
 * Find every extensionless relative specifier in a chunk of source.
 * @param {string} src
 * @returns {string[]} the offending specifiers, in order of appearance
 */
export function findExtensionlessImports(src) {
  const found = [];
  for (const pattern of SPECIFIER_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(src)) !== null) {
      const spec = m[1];
      if (!hasExplicitExtension(spec)) found.push(spec);
    }
  }
  return found;
}

/**
 * Scan a single file's source, returning per-line violations.
 * @param {string} file path used for reporting
 * @param {string} src file contents
 * @returns {{file:string,line:number,spec:string,snippet:string}[]}
 */
export function scanSource(file, src) {
  const violations = [];
  const lines = src.split('\n');
  for (const pattern of SPECIFIER_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(src)) !== null) {
      const spec = m[1];
      if (hasExplicitExtension(spec)) continue;
      const lineNo = src.slice(0, m.index).split('\n').length;
      violations.push({
        file,
        line: lineNo,
        spec,
        snippet: (lines[lineNo - 1] ?? '').trim(),
      });
    }
  }
  // Stable order: by line, then specifier.
  violations.sort((a, b) => a.line - b.line || a.spec.localeCompare(b.spec));
  return violations;
}

/** Recursively collect *.ts files under a directory. */
function collectTsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

/**
 * Run the guard against the committed schema tree.
 * @param {string} [repoRoot]
 * @returns {{scanned:number, violations:object[]}}
 */
export function runScan(repoRoot = process.cwd()) {
  const schemaDir = resolve(repoRoot, SCHEMA_DIR);
  const files = collectTsFiles(schemaDir);
  const violations = [];
  for (const file of files) {
    const rel = file.slice(resolve(repoRoot).length + 1);
    violations.push(...scanSource(rel, readFileSync(file, 'utf8')));
  }
  return { scanned: files.length, violations };
}

/**
 * Negative-fixture self-test. Proves the detector actually catches bad imports
 * (so the guard can never silently no-op) AND does not flag good ones.
 * Throws on any incorrect classification.
 */
export function selfTest() {
  const mustFlag = [
    "export * from './auth';",
    "import { x } from '../shared/util';",
    "import type { T } from './types';",
    "import './side-effect';",
    "const m = await import('./lazy');",
    "export { a, b } from './multi';",
  ];
  const mustPass = [
    "export * from './auth.js';",
    "import { x } from '../shared/util.js';",
    "import type { T } from './types.js';",
    "import { sql } from 'drizzle-orm';", // bare specifier — not relative
    "import { z } from '@workspace/shared';", // alias — not relative
    "import data from './fixtures/data.json';",
    "import './styles.css';",
  ];

  const failures = [];
  for (const line of mustFlag) {
    if (findExtensionlessImports(line).length === 0) {
      failures.push(`EXPECTED a violation but found none: ${line}`);
    }
  }
  for (const line of mustPass) {
    const hits = findExtensionlessImports(line);
    if (hits.length !== 0) {
      failures.push(`EXPECTED clean but flagged ${JSON.stringify(hits)}: ${line}`);
    }
  }

  // Line-number reporting must work too.
  const multi = ["import a from './a';", "import b from './b.js';", "import c from './c';"].join(
    '\n',
  );
  const v = scanSource('fixture.ts', multi);
  if (v.length !== 2 || v[0].line !== 1 || v[1].line !== 3) {
    failures.push(`scanSource line mapping wrong: ${JSON.stringify(v)}`);
  }

  if (failures.length > 0) {
    throw new Error(`Self-test FAILED:\n  - ${failures.join('\n  - ')}`);
  }
  return mustFlag.length + mustPass.length + 1;
}

function main() {
  if (process.argv.includes('--selftest')) {
    const cases = selfTest();
    console.log(`✅ schema-import-extension guard self-test passed (${cases} cases).`);
    return;
  }

  const { scanned, violations } = runScan();
  if (violations.length > 0) {
    const detail = violations
      .map((x) => `  ${x.file}:${x.line} → '${x.spec}'\n    ${x.snippet}`)
      .join('\n');
    console.error(
      `❌ Extensionless relative import(s) found in ${SCHEMA_DIR}/**.\n\n` +
        `NodeNext consumers (e.g. apps/alloy-ingestion-orchestrator) type-check these\n` +
        `files directly and FAIL with TS2835 when an extension is missing. Add the\n` +
        `explicit extension — the convention is '.js' (e.g. \`from './auth.js'\`):\n\n` +
        `${detail}\n`,
    );
    process.exit(1);
  }
  console.log(`✅ ${scanned} schema file(s) scanned — all relative imports carry an extension.`);
}

// Only run main when executed directly (not when imported by a test).
const isDirectRun = (() => {
  try {
    return resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();
if (isDirectRun) main();

// Keep dirname import referenced for tooling that strips "unused" imports.
void dirname;
