// Baseline smoke test for @szl-holdings/mobile-shared.
// Cannot static-import the package under Vite/Rollup because it transitively
// imports react-native (Flow-syntax `import typeof`) which the workspace
// transformer cannot parse. We exercise the public surface via filesystem
// structural assertions instead: every declared `exports` entry must resolve
// to a readable source file.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PKG_DIR = resolve(__dirname, '../../lib/mobile-shared');

describe('@szl-holdings/mobile-shared (silent-zone baseline)', () => {
  const pkg = JSON.parse(readFileSync(resolve(PKG_DIR, 'package.json'), 'utf8')) as {
    name?: string;
    exports?: Record<string, string | Record<string, string>>;
  };

  it('declares the expected package name', () => {
    expect(pkg.name).toBe('@szl-holdings/mobile-shared');
  });

  it('every declared export resolves to a readable source file', () => {
    const entries = Object.values(pkg.exports ?? {});
    expect(entries.length).toBeGreaterThan(0);
    for (const value of entries) {
      const target = typeof value === 'string' ? value : (value.import ?? value.default);
      expect(target, 'export entry must be a string').toBeTypeOf('string');
      const p = resolve(PKG_DIR, target as string);
      expect(existsSync(p), `${target} should exist`).toBe(true);
      expect(statSync(p).size, `${target} should be non-empty`).toBeGreaterThan(0);
    }
  });
});
