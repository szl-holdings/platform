#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'tests', 'silent-zone');

function walk(dir, depth = 0) {
  const out = [];
  if (depth > 2) return out;
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === 'node_modules' || e === 'dist' || e === '.next' || e === 'coverage') continue;
    const p = join(dir, e);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) out.push(...walk(p, depth + 1));
    else out.push(p);
  }
  return out;
}

function countTests(dir) {
  return walk(dir).filter((f) =>
    /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(f) &&
    !f.includes('/dist/') &&
    !f.includes('/node_modules/')
  ).length;
}

function countSrc(dir) {
  return walk(dir).filter((f) =>
    /\.(ts|tsx)$/.test(f) &&
    !/\.(test|spec)\.(ts|tsx)$/.test(f) &&
    !f.includes('/dist/') &&
    !f.includes('/node_modules/')
  ).length;
}

function pkgEntries() {
  const result = [];
  for (const base of ['packages', 'lib']) {
    const baseDir = join(ROOT, base);
    if (!existsSync(baseDir)) continue;
    for (const e of readdirSync(baseDir)) {
      const dir = join(baseDir, e);
      const pkgPath = join(dir, 'package.json');
      if (!existsSync(pkgPath)) continue;
      let pkg;
      try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); } catch { continue; }
      result.push({ dir, pkgPath, pkg, rel: relative(ROOT, dir) });
    }
  }
  return result;
}

function findEntry(dir, pkg) {
  // Prefer exports.'.' or main from package.json that points into src/.
  const candidates = [];
  if (pkg.exports && typeof pkg.exports === 'object') {
    const root = pkg.exports['.'];
    if (typeof root === 'string') candidates.push(root);
    else if (root && typeof root === 'object') {
      for (const k of ['import', 'types', 'default', 'node']) {
        if (typeof root[k] === 'string') candidates.push(root[k]);
      }
    }
  }
  if (typeof pkg.main === 'string') candidates.push(pkg.main);
  if (typeof pkg.module === 'string') candidates.push(pkg.module);
  if (typeof pkg.types === 'string') candidates.push(pkg.types);
  candidates.push('src/index.ts', 'src/index.tsx');
  for (const c of candidates) {
    if (!c) continue;
    if (c.startsWith('dist/') || c.includes('/dist/')) continue;
    const p = join(dir, c.replace(/^\.\//, ''));
    if (existsSync(p)) return p;
    // try .ts -> .ts swap if it ends with .js
    if (p.endsWith('.js')) {
      const t = p.replace(/\.js$/, '.ts');
      if (existsSync(t)) return t;
    }
  }
  return null;
}

function slug(name) {
  return name.replace(/^@/, '').replace(/[/]/g, '__').replace(/[^a-z0-9_-]/gi, '-');
}

const all = pkgEntries();
const silent = [];
for (const p of all) {
  const tc = countTests(p.dir);
  const sc = countSrc(p.dir);
  if (tc === 0 && sc > 0) silent.push(p);
}

mkdirSync(OUT_DIR, { recursive: true });

const manifest = [];
const skipNames = new Set([
  // Packages that perform heavy side-effects on import — covered by deeper tests or skipped.
  '@szl-holdings/db', // pulls drizzle + env at import
  '@szl-holdings/db-schema', // covered by deeper tests
  '@szl-holdings/db-repository', // requires db
  '@szl-holdings/api-zod', // huge generated bundle covered by codegen
  '@szl-holdings/design-system', // covered by deeper tests
  '@szl-holdings/auth-shared', // covered by deeper tests
]);

for (const p of silent) {
  const name = p.pkg.name || p.rel;
  const entry = findEntry(p.dir, p.pkg);
  const outFile = join(OUT_DIR, `${slug(name)}.smoke.test.ts`);
  let body;
  if (!entry) {
    body = `// AUTO-GENERATED baseline smoke test for ${name}\n` +
      `// No importable entrypoint found; this asserts the package directory and package.json exist.\n` +
      `import { existsSync } from 'node:fs';\nimport { resolve } from 'node:path';\nimport { describe, expect, it } from 'vitest';\n\n` +
      `describe('${name} (silent-zone baseline)', () => {\n` +
      `  it('package.json exists', () => {\n` +
      `    expect(existsSync(resolve(__dirname, '../../${p.rel}/package.json'))).toBe(true);\n` +
      `  });\n});\n`;
  } else if (skipNames.has(name)) {
    body = `// AUTO-GENERATED stub — ${name} has dedicated deeper tests elsewhere in tests/silent-zone/.\n` +
      `import { describe, it } from 'vitest';\n\n` +
      `describe('${name} (silent-zone baseline)', () => {\n` +
      `  it.skip('covered by dedicated deeper tests', () => {});\n});\n`;
  } else {
    const relEntry = relative(OUT_DIR, entry).replace(/\\/g, '/');
    body = `// AUTO-GENERATED baseline smoke test for ${name}\n` +
      `// Imports the public surface and asserts it loads without throwing.\n` +
      `import { describe, expect, it } from 'vitest';\n` +
      `import * as mod from '${relEntry}';\n\n` +
      `describe('${name} (silent-zone baseline)', () => {\n` +
      `  it('imports the public surface', () => {\n` +
      `    expect(mod).toBeTypeOf('object');\n` +
      `    expect(mod).not.toBeNull();\n` +
      `  });\n` +
      `  it('exposes at least one named export', () => {\n` +
      `    const keys = Object.keys(mod);\n` +
      `    expect(keys.length).toBeGreaterThan(0);\n` +
      `  });\n});\n`;
  }
  writeFileSync(outFile, body);
  manifest.push({ name, rel: p.rel, file: relative(ROOT, outFile), entry: entry ? relative(ROOT, entry) : null });
}

writeFileSync(
  join(OUT_DIR, 'MANIFEST.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), count: manifest.length, packages: manifest }, null, 2)
);

console.log(`Generated ${manifest.length} silent-zone smoke tests in ${relative(ROOT, OUT_DIR)}`);
