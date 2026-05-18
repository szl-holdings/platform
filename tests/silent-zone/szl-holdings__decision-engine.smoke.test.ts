// AUTO-GENERATED baseline smoke test for @szl-holdings/decision-engine
// Imports the public surface and asserts it loads without throwing.
import { describe, expect, it } from 'vitest';
import * as mod from '../../packages/decision-engine/src/index.ts';

describe('@szl-holdings/decision-engine (silent-zone baseline)', () => {
  it('imports the public surface', () => {
    expect(mod).toBeTypeOf('object');
    expect(mod).not.toBeNull();
  });
  it('exposes at least one named export', () => {
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
  });
});
