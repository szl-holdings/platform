// AUTO-GENERATED baseline smoke test for @szl-holdings/api-spec
// No importable entrypoint found; this asserts the package directory and package.json exist.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('@szl-holdings/api-spec (silent-zone baseline)', () => {
  it('package.json exists', () => {
    expect(existsSync(resolve(__dirname, '../../lib/api-spec/package.json'))).toBe(true);
  });
});
