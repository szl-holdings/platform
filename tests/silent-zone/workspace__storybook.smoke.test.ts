// AUTO-GENERATED baseline smoke test for @workspace/storybook
// No importable entrypoint found; this asserts the package directory and package.json exist.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('@workspace/storybook (silent-zone baseline)', () => {
  it('package.json exists', () => {
    expect(existsSync(resolve(__dirname, '../../packages/storybook/package.json'))).toBe(true);
  });
});
