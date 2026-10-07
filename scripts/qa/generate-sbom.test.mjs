import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import {
  buildSbom,
  generateSbomArtifacts,
  parseLockfile,
  parseLockfileText,
  parsePatchMetadata,
  parseWorkspacePackages,
  validateSbom,
} from './generate-sbom.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const EXPECTED_CURRENT_WORKSPACE_MANIFEST_COUNT = 203;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function expandCurrentWorkspaceManifestImporters() {
  const workspace = parseYaml(readFileSync(path.join(ROOT, 'pnpm-workspace.yaml'), 'utf8'));
  assert.ok(Array.isArray(workspace.packages), 'pnpm-workspace.yaml packages must be an array');

  const expandPattern = (pattern) => {
    assert.equal(
      path.posix.normalize(pattern),
      pattern,
      `workspace pattern must be normalized POSIX: ${pattern}`,
    );
    if (!/[?*[\]]/.test(pattern)) {
      return existsSync(path.join(ROOT, pattern, 'package.json')) ? [pattern] : [];
    }
    assert.match(
      pattern,
      /^[^?*[\]]+\/\*$/,
      `test enumerator must be extended for workspace pattern: ${pattern}`,
    );
    const parent = pattern.slice(0, -2);
    if (!existsSync(path.join(ROOT, parent))) return [];
    return readdirSync(path.join(ROOT, parent), { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && existsSync(path.join(ROOT, parent, entry.name, 'package.json')),
      )
      .map((entry) => `${parent}/${entry.name}`);
  };

  const included = new Set();
  const excluded = new Set();
  for (const rawPattern of workspace.packages) {
    assert.equal(typeof rawPattern, 'string', 'workspace patterns must be strings');
    const isExclusion = rawPattern.startsWith('!');
    const pattern = isExclusion ? rawPattern.slice(1) : rawPattern;
    for (const importer of expandPattern(pattern)) {
      (isExclusion ? excluded : included).add(importer);
    }
  }
  return [...included].filter((importer) => !excluded.has(importer)).sort();
}

function expectedNpmPurl(name, version) {
  if (!name.startsWith('@'))
    return `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(version)}`;
  const [scope, packageName] = name.slice(1).split('/');
  return `pkg:npm/%40${encodeURIComponent(scope)}/${encodeURIComponent(packageName)}@${encodeURIComponent(version)}`;
}

function patchFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'a11oy-sbom-patches-'));
  const patchDirectory = path.join(root, 'patches');
  mkdirSync(patchDirectory, { recursive: true });
  writeFileSync(
    path.join(root, 'package.json'),
    `${JSON.stringify({ name: 'fixture-workspace', private: true, version: '0.0.0' }, null, 2)}\n`,
  );
  const entries = [
    {
      key: '@scope/example@1.2.3',
      name: '@scope/example',
      version: '1.2.3',
      path: 'patches/@scope__example@1.2.3.patch',
      contents: Buffer.from('scoped patch\n'),
    },
    {
      key: 'plain@2.0.0',
      name: 'plain',
      version: '2.0.0',
      path: 'patches/plain@2.0.0.patch',
      contents: Buffer.from('plain patch\n'),
    },
  ].map((entry) => ({ ...entry, hash: sha256(entry.contents) }));

  for (const entry of entries) {
    writeFileSync(path.join(root, entry.path), entry.contents);
  }

  const render = (orderedEntries = entries) => {
    const workspace = { patchedDependencies: {} };
    const lockfile = {
      lockfileVersion: '9.0',
      importers: { '.': {} },
      patchedDependencies: {},
      packages: {
        '@scope/example@1.2.3': { resolution: { integrity: 'sha512-scoped' } },
        'plain@1.9.0': { resolution: { integrity: 'sha512-older' } },
        'plain@2.0.0': { resolution: { integrity: 'sha512-plain' } },
        'untouched@3.0.0': { resolution: { integrity: 'sha512-untouched' } },
      },
      snapshots: {},
    };
    for (const entry of orderedEntries) {
      workspace.patchedDependencies[entry.key] = entry.path;
      lockfile.patchedDependencies[entry.key] = { hash: entry.hash, path: entry.path };
      lockfile.snapshots[`${entry.key}(patch_hash=${entry.hash})`] = {};
    }
    lockfile.snapshots['plain@1.9.0'] = {};
    lockfile.snapshots['untouched@3.0.0'] = {};
    return {
      lockfile,
      lockfileText: stringifyYaml(lockfile),
      workspace,
      workspaceText: stringifyYaml(workspace),
    };
  };

  return {
    entries,
    render,
    root,
    cleanup: () => rmSync(root, { force: true, recursive: true }),
  };
}

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

test('inventory covers every exact lockfile workspace importer and derives the root subject', () => {
  const lockfileText = readFileSync(path.join(ROOT, 'pnpm-lock.yaml'), 'utf8');
  const lockfile = parseYaml(lockfileText);
  const workspace = parseWorkspacePackages({ lockfileText, root: ROOT });
  const expectedImporters = Object.keys(lockfile.importers)
    .filter((importer) => importer !== '.')
    .sort();
  const manifestImporters = expandCurrentWorkspaceManifestImporters();

  assert.deepEqual(
    expectedImporters,
    manifestImporters,
    'lockfile importers must exactly cover every manifest selected by pnpm-workspace.yaml',
  );
  assert.equal(
    manifestImporters.length + 1,
    EXPECTED_CURRENT_WORKSPACE_MANIFEST_COUNT,
    'update the explicit workspace-manifest count only with a deliberate topology change',
  );
  assert.equal(workspace.components.length, expectedImporters.length);
  assert.deepEqual(
    workspace.components.map(({ importer }) => importer),
    expectedImporters,
  );
  for (const component of workspace.components) {
    const manifest = JSON.parse(
      readFileSync(path.join(ROOT, component.importer, 'package.json'), 'utf8'),
    );
    assert.equal(component.name, manifest.name, component.importer);
    assert.equal(component.version, manifest.version, component.importer);
    assert.equal(
      component.type,
      /^(apps|artifacts|services|workers)\//.test(component.importer) ? 'application' : 'library',
      component.importer,
    );
  }

  const sbom = buildSbom(
    parseLockfile(ROOT),
    {},
    {
      subject: workspace.subject,
      workspacePackages: workspace.components,
    },
  );
  const emittedWorkspaceComponents = sbom.components.filter((component) =>
    component.properties?.some(({ name }) => name === 'szl:pnpm:workspace-importer'),
  );
  assert.equal(emittedWorkspaceComponents.length, manifestImporters.length);
  for (const workspaceComponent of workspace.components) {
    const emitted = emittedWorkspaceComponents.find((component) =>
      component.properties.some(
        ({ name, value }) =>
          name === 'szl:pnpm:workspace-importer' && value === workspaceComponent.importer,
      ),
    );
    assert.ok(emitted, `missing emitted workspace component for ${workspaceComponent.importer}`);
    assert.equal(emitted.name, workspaceComponent.name, workspaceComponent.importer);
    assert.equal(emitted.version, workspaceComponent.version, workspaceComponent.importer);
    assert.equal(emitted.type, workspaceComponent.type, workspaceComponent.importer);
    assert.equal(
      emitted.purl,
      expectedNpmPurl(workspaceComponent.name, workspaceComponent.version),
      workspaceComponent.importer,
    );
  }
  assert.equal(validateSbom(sbom), sbom);

  const rootManifest = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.deepEqual(workspace.subject, {
    type: 'application',
    name: rootManifest.name,
    version: rootManifest.version,
    purl: expectedNpmPurl(rootManifest.name, rootManifest.version),
    properties: [{ name: 'szl:pnpm:workspace-importer', value: '.' }],
  });
});

test('workspace provenance fails closed on traversal, manifest ambiguity, and duplicate identities', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'a11oy-sbom-workspaces-'));
  try {
    writeFileSync(
      path.join(root, 'package.json'),
      `${JSON.stringify({ name: '@scope/root', version: '1.0.0' })}\n`,
    );
    mkdirSync(path.join(root, 'packages', 'one'), { recursive: true });
    writeFileSync(
      path.join(root, 'packages', 'one', 'package.json'),
      `${JSON.stringify({ name: '@scope/one', version: '1.2.3' })}\n`,
    );
    const oneImporter = stringifyYaml({
      lockfileVersion: '9.0',
      importers: { '.': {}, 'packages/one': {} },
      packages: {},
      snapshots: {},
    });
    const valid = parseWorkspacePackages({ lockfileText: oneImporter, root });
    assert.equal(valid.subject.purl, 'pkg:npm/%40scope/root@1.0.0');
    assert.deepEqual(valid.components, [
      {
        importer: 'packages/one',
        name: '@scope/one',
        type: 'library',
        version: '1.2.3',
      },
    ]);

    const traversal = stringifyYaml({
      lockfileVersion: '9.0',
      importers: { '.': {}, '../outside': {} },
      packages: {},
      snapshots: {},
    });
    assert.throws(
      () => parseWorkspacePackages({ lockfileText: traversal, root }),
      /normalized repository-relative POSIX path/,
    );

    writeFileSync(
      path.join(root, 'packages', 'one', 'package.json'),
      '{"name":"@scope/one","name":"substituted","version":"1.2.3"}\n',
    );
    assert.throws(
      () => parseWorkspacePackages({ lockfileText: oneImporter, root }),
      /duplicate-key ambiguity/,
    );

    writeFileSync(
      path.join(root, 'packages', 'one', 'package.json'),
      `${JSON.stringify({ name: '@scope/one', version: '1.2.3' })}\n`,
    );
    mkdirSync(path.join(root, 'packages', 'two'), { recursive: true });
    writeFileSync(
      path.join(root, 'packages', 'two', 'package.json'),
      `${JSON.stringify({ name: '@scope/one', version: '1.2.3' })}\n`,
    );
    const duplicateIdentity = stringifyYaml({
      lockfileVersion: '9.0',
      importers: { '.': {}, 'packages/one': {}, 'packages/two': {} },
      packages: {},
      snapshots: {},
    });
    assert.throws(
      () => parseWorkspacePackages({ lockfileText: duplicateIdentity, root }),
      /workspace package identity @scope\/one@1\.2\.3 is ambiguous/,
    );
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('correlates exact workspace, lockfile, snapshot, and on-disk patch identities', () => {
  const fixture = patchFixture();
  try {
    const { workspaceText, lockfileText } = fixture.render();
    const patches = parsePatchMetadata({ workspaceText, lockfileText, root: fixture.root });
    assert.deepEqual(
      Object.keys(patches),
      ['@scope/example@1.2.3', 'plain@2.0.0'],
      'patch records must use stable package/version ordering',
    );
    assert.deepEqual(patches['@scope/example@1.2.3'], {
      name: '@scope/example',
      version: '1.2.3',
      path: 'patches/@scope__example@1.2.3.patch',
      sha256: fixture.entries[0].hash,
    });
  } finally {
    fixture.cleanup();
  }
});

test('fails closed when workspace and lockfile patch registrations diverge', () => {
  const fixture = patchFixture();
  try {
    const missingWorkspace = fixture.render();
    delete missingWorkspace.workspace.patchedDependencies['plain@2.0.0'];
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: stringifyYaml(missingWorkspace.workspace),
          lockfileText: missingWorkspace.lockfileText,
          root: fixture.root,
        }),
      /exact same package keys/,
    );

    const missingLock = fixture.render();
    delete missingLock.lockfile.patchedDependencies['plain@2.0.0'];
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: missingLock.workspaceText,
          lockfileText: stringifyYaml(missingLock.lockfile),
          root: fixture.root,
        }),
      /exact same package keys/,
    );

    const pathMismatch = fixture.render();
    pathMismatch.lockfile.patchedDependencies['plain@2.0.0'].path = 'patches/different@2.0.0.patch';
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: pathMismatch.workspaceText,
          lockfileText: stringifyYaml(pathMismatch.lockfile),
          root: fixture.root,
        }),
      /patch paths do not match/,
    );
  } finally {
    fixture.cleanup();
  }
});

test('fails closed on malformed, mismatched, or unbound patch hashes', () => {
  const fixture = patchFixture();
  try {
    const malformed = fixture.render();
    malformed.lockfile.patchedDependencies['plain@2.0.0'].hash = 'ABC123';
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: malformed.workspaceText,
          lockfileText: stringifyYaml(malformed.lockfile),
          root: fixture.root,
        }),
      /lowercase SHA-256 digest/,
    );

    const wrongSnapshot = fixture.render();
    const snapshotKey = Object.keys(wrongSnapshot.lockfile.snapshots).find((key) =>
      key.startsWith('plain@2.0.0('),
    );
    delete wrongSnapshot.lockfile.snapshots[snapshotKey];
    wrongSnapshot.lockfile.snapshots[`plain@2.0.0(patch_hash=${'0'.repeat(64)})`] = {};
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: wrongSnapshot.workspaceText,
          lockfileText: stringifyYaml(wrongSnapshot.lockfile),
          root: fixture.root,
        }),
      /snapshot patch_hash does not match/,
    );

    const wrongFile = fixture.render();
    const falseHash = '0'.repeat(64);
    wrongFile.lockfile.patchedDependencies['plain@2.0.0'].hash = falseHash;
    const originalSnapshot = Object.keys(wrongFile.lockfile.snapshots).find((key) =>
      key.startsWith('plain@2.0.0('),
    );
    delete wrongFile.lockfile.snapshots[originalSnapshot];
    wrongFile.lockfile.snapshots[`plain@2.0.0(patch_hash=${falseHash})`] = {};
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: wrongFile.workspaceText,
          lockfileText: stringifyYaml(wrongFile.lockfile),
          root: fixture.root,
        }),
      /patch file SHA-256 does not match/,
    );
  } finally {
    fixture.cleanup();
  }
});

test('rejects ambiguous YAML and unsafe patch paths before reading patch bytes', () => {
  const fixture = patchFixture();
  try {
    const valid = fixture.render();
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: `${valid.workspaceText}patchedDependencies: {}\n`,
          lockfileText: valid.lockfileText,
          root: fixture.root,
        }),
      /not unambiguous YAML/,
    );

    const aliasWorkspace = `patch: &patch patches/plain@2.0.0.patch\npatchedDependencies:\n  plain@2.0.0: *patch\n`;
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: aliasWorkspace,
          lockfileText: valid.lockfileText,
          root: fixture.root,
        }),
      /must not contain YAML aliases/,
    );

    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: 'patchedDependencies: !untrusted {}\n',
          lockfileText: valid.lockfileText,
          root: fixture.root,
        }),
      /not unambiguous YAML.*Unresolved tag/,
    );

    const traversal = fixture.render();
    traversal.workspace.patchedDependencies['plain@2.0.0'] = 'patches/../outside.patch';
    traversal.lockfile.patchedDependencies['plain@2.0.0'].path = 'patches/../outside.patch';
    assert.throws(
      () =>
        parsePatchMetadata({
          workspaceText: stringifyYaml(traversal.workspace),
          lockfileText: stringifyYaml(traversal.lockfile),
          root: fixture.root,
        }),
      /normalized repository-relative POSIX path/,
    );
  } finally {
    fixture.cleanup();
  }
});

test('emits deterministic patch properties only on the exact patched versions', () => {
  const fixture = patchFixture();
  try {
    const firstInput = fixture.render(fixture.entries);
    const secondInput = fixture.render([...fixture.entries].reverse());
    const firstPatches = parsePatchMetadata({
      workspaceText: firstInput.workspaceText,
      lockfileText: firstInput.lockfileText,
      root: fixture.root,
    });
    const secondPatches = parsePatchMetadata({
      workspaceText: secondInput.workspaceText,
      lockfileText: secondInput.lockfileText,
      root: fixture.root,
    });
    assert.deepEqual(firstPatches, secondPatches);

    const packages = {
      ...parseLockfileText(firstInput.lockfileText),
      Upper: ['1.0.0'],
      'a-b': ['1.0.0'],
      a_b: ['2.0.0', '1.0.0'],
    };
    const first = buildSbom(packages, firstPatches);
    const reversedPackages = Object.fromEntries(
      Object.entries(packages)
        .reverse()
        .map(([name, versions]) => [name, [...versions].reverse()]),
    );
    const reversedPatches = Object.fromEntries(Object.entries(secondPatches).reverse());
    const second = buildSbom(reversedPackages, reversedPatches);
    assert.equal(JSON.stringify(first), JSON.stringify(second));
    assert.match(
      first.serialNumber,
      /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    assert.equal(first.metadata.timestamp, undefined);
    assert.equal(first.metadata.scanStatus, undefined);
    assert.deepEqual(
      first.components.map(({ name, version }) => `${name}@${version}`),
      [
        '@scope/example@1.2.3',
        'Upper@1.0.0',
        'a-b@1.0.0',
        'a_b@1.0.0',
        'a_b@2.0.0',
        'plain@1.9.0',
        'plain@2.0.0',
        'untouched@3.0.0',
      ],
    );
    assert.equal(first.components[0].purl, 'pkg:npm/%40scope/example@1.2.3');
    assert.notEqual(
      first.serialNumber,
      buildSbom({ ...packages, z: ['1.0.0'] }, firstPatches).serialNumber,
    );

    const patched = first.components.filter((component) => component.properties);
    assert.deepEqual(
      patched.map(({ name, version }) => `${name}@${version}`),
      ['@scope/example@1.2.3', 'plain@2.0.0'],
    );
    assert.deepEqual(patched[1].properties, [
      { name: 'szl:pnpm:patch:path', value: 'patches/plain@2.0.0.patch' },
      { name: 'szl:pnpm:patch:sha256', value: fixture.entries[1].hash },
    ]);
    assert.equal(
      first.components.find(
        (component) => component.name === 'plain' && component.version === '1.9.0',
      ).properties,
      undefined,
    );
  } finally {
    fixture.cleanup();
  }
});

test('deduplicates workspace identities and emits deterministic provenance properties', () => {
  const packages = {
    '@scope/application': ['1.2.3'],
    dependency: ['2.0.0'],
    library: ['0.0.0'],
  };
  const workspacePackages = [
    {
      importer: 'packages/library',
      name: 'library',
      type: 'library',
      version: '0.0.0',
    },
    {
      importer: 'apps/application',
      name: '@scope/application',
      type: 'application',
      version: '1.2.3',
    },
  ];
  const subject = {
    type: 'application',
    name: 'root-workspace',
    version: '0.0.0',
    purl: 'pkg:npm/root-workspace@0.0.0',
    properties: [{ name: 'szl:pnpm:workspace-importer', value: '.' }],
  };
  const first = buildSbom(packages, {}, { subject, workspacePackages });
  const second = buildSbom(
    Object.fromEntries(Object.entries(packages).reverse()),
    {},
    { subject, workspacePackages: [...workspacePackages].reverse() },
  );

  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(first.components.length, 3, 'workspace identities must not duplicate registry rows');
  assert.deepEqual(first.metadata.component, subject);
  assert.deepEqual(first.components[0], {
    type: 'application',
    name: '@scope/application',
    version: '1.2.3',
    purl: 'pkg:npm/%40scope/application@1.2.3',
    properties: [{ name: 'szl:pnpm:workspace-importer', value: 'apps/application' }],
  });
  assert.deepEqual(first.components[2].properties, [
    { name: 'szl:pnpm:workspace-importer', value: 'packages/library' },
  ]);
  assert.equal(validateSbom(first), first);
});

test('validates generated SBOMs against the digest-pinned official CycloneDX 1.4 schema', () => {
  const sbom = buildSbom({ '@scope/example': ['1.2.3'], plain: ['2.0.0'] });
  assert.equal(validateSbom(sbom), sbom);
  assert.deepEqual(sbom.metadata.properties, [
    { name: 'szl:sbom:scan-status', value: 'inventory-only' },
    {
      name: 'szl:sbom:vulnerability-authority',
      value: 'pnpm audit --audit-level=high (separate blocking CI step)',
    },
    { name: 'szl:sbom:component-count', value: '2' },
  ]);

  const invalid = structuredClone(sbom);
  invalid.metadata.scanStatus = 'inventory-only';
  assert.throws(
    () => validateSbom(invalid),
    /CycloneDX 1\.4 schema validation failed:.*additional properties/,
  );

  const tamperedSchemaDir = mkdtempSync(path.join(tmpdir(), 'a11oy-sbom-schema-'));
  try {
    writeFileSync(path.join(tamperedSchemaDir, 'bom-1.4.schema.json'), '{}\n');
    assert.throws(
      () => validateSbom(sbom, { schemaDir: tamperedSchemaDir }),
      /bom-1\.4\.schema\.json failed SHA-256 verification/,
    );
  } finally {
    rmSync(tamperedSchemaDir, { force: true, recursive: true });
  }
});

test('artifact generation is byte-idempotent and reuses content-addressed history', () => {
  const fixture = patchFixture();
  try {
    const { lockfileText, workspaceText } = fixture.render();
    writeFileSync(path.join(fixture.root, 'pnpm-lock.yaml'), lockfileText);
    writeFileSync(path.join(fixture.root, 'pnpm-workspace.yaml'), workspaceText);
    const outputDir = path.join(fixture.root, 'security');

    const first = generateSbomArtifacts({ root: fixture.root, outputDir });
    const firstHistory = readdirSync(path.join(outputDir, 'sbom-history'));
    const second = generateSbomArtifacts({ root: fixture.root, outputDir });
    const secondHistory = readdirSync(path.join(outputDir, 'sbom-history'));

    assert.equal(first.rendered, second.rendered);
    assert.equal(first.digest, sha256(first.rendered));
    assert.equal(path.basename(first.historyPath), `sbom-${first.digest}.json`);
    assert.equal(second.historyPath, first.historyPath);
    assert.deepEqual(firstHistory, [`sbom-${first.digest}.json`]);
    assert.deepEqual(secondHistory, firstHistory);
    assert.equal(readFileSync(first.latestPath, 'utf8'), first.rendered);
    assert.equal(readFileSync(first.historyPath, 'utf8'), first.rendered);
  } finally {
    fixture.cleanup();
  }
});

test('tracked latest SBOM exactly reflects the current lockfile and verified patches', () => {
  const workspaceText = readFileSync(path.join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
  const lockfileText = readFileSync(path.join(ROOT, 'pnpm-lock.yaml'), 'utf8');
  const patches = parsePatchMetadata({ workspaceText, lockfileText, root: ROOT });
  assert.deepEqual(Object.keys(patches), [
    '@storybook/core@8.6.18',
    'braces@3.0.3',
    'node-forge@1.4.0',
  ]);

  const latestPath = path.join(ROOT, 'security', 'sbom-latest.json');
  const latestText = readFileSync(latestPath, 'utf8');
  const latest = JSON.parse(latestText);
  const workspace = parseWorkspacePackages({ lockfileText, root: ROOT });
  const expected = buildSbom(parseLockfile(ROOT), patches, {
    subject: workspace.subject,
    workspacePackages: workspace.components,
  });
  assert.deepEqual(latest, expected);
  assert.equal(validateSbom(latest), latest);
  assert.ok(
    latest.components.length > 1000,
    `expected a full-workspace SBOM, received ${latest.components.length} components`,
  );
  const workspaceComponents = latest.components.filter((component) =>
    component.properties?.some(({ name }) => name === 'szl:pnpm:workspace-importer'),
  );
  assert.equal(workspaceComponents.length, workspace.components.length);
  assert.deepEqual(latest.metadata.component, workspace.subject);
  const patchedComponents = latest.components.filter((component) =>
    component.properties?.some(({ name }) => name === 'szl:pnpm:patch:sha256'),
  );
  assert.equal(patchedComponents.length, 3);
  const scopedComponents = latest.components.filter((component) => component.name.startsWith('@'));
  assert.ok(scopedComponents.length > 500);
  assert.ok(scopedComponents.every((component) => component.purl.startsWith('pkg:npm/%40')));

  const historyName = `sbom-${sha256(latestText)}.json`;
  const historyText = readFileSync(
    path.join(ROOT, 'security', 'sbom-history', historyName),
    'utf8',
  );
  assert.equal(latestText, historyText);
});

test('vendored CycloneDX schemas retain the exact upstream Apache-2.0 license', () => {
  const license = readFileSync(path.join(ROOT, 'security', 'schemas', 'cyclonedx', 'LICENSE'));
  assert.equal(sha256(license), '6c29f22a4a7385285c6f579ec9f33c5e989f00739d6b257243a0b082ec9447ae');
  assert.match(license.toString('utf8'), /Apache License\n {27}Version 2\.0, January 2004/);
  assert.match(license.toString('utf8'), /Copyright OWASP Foundation/);
});
