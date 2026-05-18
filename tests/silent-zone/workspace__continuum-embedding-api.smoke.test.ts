// AUTO-GENERATED baseline smoke test for @workspace/continuum-embedding-api
// Imports the public surface and asserts it loads without throwing.
import { describe, expect, it } from 'vitest';
import * as mod from '../../packages/continuum-embedding-api/src/index.ts';

describe('@workspace/continuum-embedding-api (silent-zone baseline)', () => {
  it('imports the public surface', () => {
    expect(mod).toBeTypeOf('object');
    expect(mod).not.toBeNull();
  });
  it('exposes at least one named export', () => {
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
  });
});
