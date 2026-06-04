/**
 * Tests for scripts/check-package-boundaries.ts
 *
 * Builds a synthetic monorepo on disk in a tmp dir, then runs the boundary
 * checker against it to verify each rule fires (and does not fire) as
 * expected. This protects the script against regressions where a refactor
 * silently stops detecting cross-artifact or package→artifact imports.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  checkArtifactFiles,
  checkPackageFiles,
  extractImports,
  getFiles,
  isArtifactImport,
  runChecks,
} from './check-package-boundaries';

describe('extractImports', () => {
  it('captures static import statements', () => {
    const r = extractImports(`import { x } from "foo";\nimport y from 'bar';`);
    expect(r.map((i) => i.path)).toEqual(['foo', 'bar']);
  });

  it('captures dynamic import() calls', () => {
    const r = extractImports(`const m = await import("./lazy");`);
    expect(r[0]?.path).toBe('./lazy');
  });

  it('captures require() calls', () => {
    const r = extractImports(`const m = require('legacy-pkg');`);
    expect(r[0]?.path).toBe('legacy-pkg');
  });

  it('captures re-exports (export ... from)', () => {
    const r = extractImports(`export { x } from "./other";`);
    expect(r[0]?.path).toBe('./other');
  });

  it('records 1-indexed line numbers', () => {
    const r = extractImports(`// header\n\nimport x from "y";`);
    expect(r[0]?.line).toBe(3);
  });

  it('returns empty for files with no imports', () => {
    expect(extractImports(`const x = 1;\nexport const y = 2;`)).toEqual([]);
  });
});

describe('isArtifactImport', () => {
  it('flags absolute-style /artifacts/ paths', () => {
    expect(isArtifactImport('@workspace/artifacts/api-server')).toBe(true);
  });
  it('flags relative ../artifacts/ paths', () => {
    expect(isArtifactImport('../../artifacts/sentra/src/x')).toBe(true);
  });
  it('does not flag normal package imports', () => {
    expect(isArtifactImport('@szl-holdings/contracts')).toBe(false);
    expect(isArtifactImport('zod')).toBe(false);
    expect(isArtifactImport('./local')).toBe(false);
    expect(isArtifactImport('../sibling/file')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Fixture-based tests: build a temp monorepo and run the real check.
// ---------------------------------------------------------------------------

let root: string;

function w(rel: string, content: string) {
  const full = join(root, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'boundary-fixture-'));

  // ---- Two artifacts: one clean, one that imports another artifact ----
  w(
    'artifacts/clean/src/index.ts',
    `import { ok } from "@szl-holdings/contracts";\nexport const x = ok;\n`,
  );
  w(
    'artifacts/dirty/src/index.ts',
    `import { thing } from "../../clean/src/index";\nimport { other } from "../../../artifacts/clean/src/other";\nexport const y = thing;\n`,
  );

  // ---- A package that imports from an artifact ----
  w(
    'packages/badpkg/src/index.ts',
    `import { x } from "../../../artifacts/clean/src/index";\nexport const z = x;\n`,
  );
  w('packages/cleanpkg/src/index.ts', `import { z } from "zod";\nexport const ok = z;\n`);

  // ---- A lib package that imports from an artifact ----
  w(
    'lib/badlib/src/index.ts',
    `import { x } from "../../../artifacts/clean/src/index";\nexport const a = x;\n`,
  );

  // ---- Excluded directories should be skipped ----
  w(
    'packages/cleanpkg/node_modules/junk/src/bad.ts',
    `import x from "../../../artifacts/whatever";\n`,
  );
  w('packages/cleanpkg/dist/bad.ts', `import x from "../../../artifacts/whatever";\n`);
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('getFiles', () => {
  it('walks .ts files but skips node_modules and dist', () => {
    const files = getFiles(join(root, 'packages/cleanpkg'));
    const rel = files.map((f) => f.replace(`${root}/`, ''));
    expect(rel).toContain('packages/cleanpkg/src/index.ts');
    expect(rel.find((p) => p.includes('node_modules'))).toBeUndefined();
    expect(rel.find((p) => p.includes('/dist/'))).toBeUndefined();
  });

  it('returns empty array for missing directory', () => {
    expect(getFiles(join(root, 'does-not-exist'))).toEqual([]);
  });
});

describe('checkArtifactFiles (fixture)', () => {
  it('flags artifact-to-artifact imports', () => {
    const v = checkArtifactFiles(root);
    expect(v.length).toBeGreaterThanOrEqual(1);
    expect(v.every((vi) => vi.rule.startsWith('ARTIFACT_CROSS_IMPORT'))).toBe(true);
    expect(v.some((vi) => vi.file === 'artifacts/dirty/src/index.ts')).toBe(true);
    // The flagged import should be the one that textually references "artifacts/".
    const dirtyViolation = v.find((vi) => vi.file === 'artifacts/dirty/src/index.ts');
    expect(dirtyViolation?.importPath).toMatch(/artifacts\//);
  });

  it('does not flag the clean artifact', () => {
    const v = checkArtifactFiles(root);
    expect(v.find((vi) => vi.file.startsWith('artifacts/clean/'))).toBeUndefined();
  });
});

describe('checkPackageFiles (fixture)', () => {
  it('flags packages/* importing from artifacts/', () => {
    const v = checkPackageFiles(root, 'packages', 'packages/*');
    expect(v.length).toBe(1);
    expect(v[0]?.file).toBe('packages/badpkg/src/index.ts');
    expect(v[0]?.rule).toMatch(/PKG_IMPORTS_ARTIFACT/);
  });

  it('flags lib/* importing from artifacts/', () => {
    const v = checkPackageFiles(root, 'lib', 'lib/*');
    expect(v.length).toBe(1);
    expect(v[0]?.file).toBe('lib/badlib/src/index.ts');
  });

  it('does not flag a clean package', () => {
    const v = checkPackageFiles(root, 'packages', 'packages/*');
    expect(v.find((vi) => vi.file.startsWith('packages/cleanpkg/'))).toBeUndefined();
  });
});

describe('runChecks (fixture)', () => {
  it('aggregates violations across artifacts, packages, and lib', () => {
    const v = runChecks(root);
    const rules = new Set(v.map((vi) => vi.rule.split(':')[0]));
    expect(rules.has('ARTIFACT_CROSS_IMPORT')).toBe(true);
    expect(rules.has('PKG_IMPORTS_ARTIFACT')).toBe(true);
    // Each violation has line >= 1 and a non-empty importPath.
    for (const vi of v) {
      expect(vi.line).toBeGreaterThanOrEqual(1);
      expect(vi.importPath.length).toBeGreaterThan(0);
    }
  });

  it('returns no violations when none of the rules are broken', () => {
    const cleanRoot = mkdtempSync(join(tmpdir(), 'boundary-clean-'));
    try {
      mkdirSync(join(cleanRoot, 'packages/x/src'), { recursive: true });
      writeFileSync(
        join(cleanRoot, 'packages/x/src/index.ts'),
        `import { z } from "zod";\nexport const a = z;\n`,
      );
      mkdirSync(join(cleanRoot, 'artifacts/x/src'), { recursive: true });
      writeFileSync(join(cleanRoot, 'artifacts/x/src/index.ts'), `export const a = 1;\n`);
      expect(runChecks(cleanRoot)).toEqual([]);
    } finally {
      rmSync(cleanRoot, { recursive: true, force: true });
    }
  });
});
