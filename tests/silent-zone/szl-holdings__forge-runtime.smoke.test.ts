// AUTO-GENERATED baseline smoke test for @szl-holdings/forge-runtime
// Imports the public surface and asserts it loads without throwing.
import { describe, expect, it } from 'vitest';
import * as mod from '../../lib/forge-runtime/src/index.ts';

describe('@szl-holdings/forge-runtime (silent-zone baseline)', () => {
  it('imports the public surface', () => {
    expect(mod).toBeTypeOf('object');
    expect(mod).not.toBeNull();
  });
  it('exposes at least one named export', () => {
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
  });
});
