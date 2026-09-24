import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';

import { parseLockfileText } from './generate-sbom.js';

test('parses quoted and unquoted pnpm package keys without reading snapshots', () => {
  const lockfile = `lockfileVersion: '9.0'

packages:

  '@scope/quoted@1.2.3':
    resolution: {integrity: sha512-quoted}

  fflate@0.8.3:
    resolution: {integrity: sha512-unquoted}

  'react-dom@19.1.0(react@19.1.0)':
    peerDependencies:
      react: 19.1.0

snapshots:

  ignored@9.9.9: {}
`;

  assert.deepEqual(parseLockfileText(lockfile), {
    '@scope/quoted': ['1.2.3'],
    fflate: ['0.8.3'],
    'react-dom': ['19.1.0'],
  });
});

test('inventory covers every unique name/version pair in the current packages section', () => {
  const lockfile = readFileSync(new URL('../../pnpm-lock.yaml', import.meta.url), 'utf8');
  const packages = parseLockfileText(lockfile);
  const componentCount = Object.values(packages).reduce(
    (sum, versions) => sum + versions.length,
    0,
  );
  const lockfilePackageCount = Object.keys(parseYaml(lockfile).packages).length;

  assert.equal(componentCount, lockfilePackageCount);
  assert.ok(
    componentCount > 1000,
    'inventory unexpectedly contains only the quoted package subset',
  );
  assert.deepEqual(packages.fflate, ['0.8.3']);
  assert.deepEqual(packages['@xmldom/xmldom'], ['0.9.12']);
});
