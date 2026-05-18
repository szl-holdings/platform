// AUTO-GENERATED baseline smoke test for @workspace/a11oy-cli
// No importable entrypoint found; this asserts the package directory and package.json exist.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('@workspace/a11oy-cli (silent-zone baseline)', () => {
  it('package.json exists', () => {
    expect(existsSync(resolve(__dirname, '../../packages/a11oy-cli/package.json'))).toBe(true);
  });
});
