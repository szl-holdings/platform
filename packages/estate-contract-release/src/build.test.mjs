import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import test from 'node:test';

import {
  buildManifest,
  COMPONENT_DEFINITIONS,
  canonicalJson,
  compareUtf8Bytes,
  manifestMatchesCurrent,
  OUTPUT_PATH,
  REPOSITORY_ROOT,
} from './build.mjs';

function digest(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

function contractFixture(t) {
  const root = mkdtempSync(resolve(tmpdir(), 'szl-estate-contract-'));
  for (const component of COMPONENT_DEFINITIONS) {
    for (const input of component.inputs) {
      const source = resolve(REPOSITORY_ROOT, input);
      const target = resolve(root, input);
      mkdirSync(dirname(target), { recursive: true });
      cpSync(source, target, { recursive: true });
    }
  }
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return root;
}

test('checked-in manifest matches every current allowlisted byte', () => {
  const checkedIn = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  assert.equal(manifestMatchesCurrent(checkedIn), true);
});

test('canonical ordering is locale-independent UTF-8 byte order', () => {
  const values = ['ı', 'i', 'README', 'I'];
  assert.deepEqual(values.sort(compareUtf8Bytes), ['I', 'README', 'i', 'ı']);
});

test('release id closes the complete component inventories', () => {
  const manifest = buildManifest();
  const { release_id: releaseId, ...release } = manifest;
  assert.equal(releaseId, digest(release));
  assert.equal(manifest.components.length, 6);
  assert.ok(manifest.components.every((component) => component.file_count > 0));
});

test('design-system closure binds every repository-owned exported dependency', () => {
  const manifest = buildManifest();
  const designSystem = manifest.components.find((component) => component.id === 'design-system');
  const forgeTypes = manifest.components.find(
    (component) => component.id === 'design-system-forge-type-contract',
  );
  assert.ok(designSystem);
  assert.ok(forgeTypes);

  const workspaceImports = new Set();
  const matcher = /(?:from|import\()\s*['"](@workspace\/[^'"]+)['"]/g;
  for (const file of designSystem.files.filter((entry) => /\.[cm]?[jt]sx?$/.test(entry.path))) {
    const source = readFileSync(resolve(REPOSITORY_ROOT, file.path), 'utf8');
    for (const match of source.matchAll(matcher)) {
      workspaceImports.add(match[1]);
    }
  }
  assert.deepEqual([...workspaceImports].sort(), ['@workspace/forge/types']);
  assert.deepEqual(
    forgeTypes.files.map((file) => file.path),
    ['packages/forge/package.json', 'packages/forge/src/types.ts'],
  );
});

test('exported dependency mutations change the release identity', (t) => {
  const root = contractFixture(t);
  const before = buildManifest(root);
  appendFileSync(
    resolve(root, 'packages/forge/src/types.ts'),
    '\nexport type EstateReleaseMutationProbe = true;\n',
    'utf8',
  );
  const after = buildManifest(root);
  assert.notEqual(after.release_id, before.release_id);
  assert.notEqual(
    after.components.find((component) => component.id === 'design-system-forge-type-contract')
      ?.tree_sha256,
    before.components.find((component) => component.id === 'design-system-forge-type-contract')
      ?.tree_sha256,
  );

  appendFileSync(
    resolve(root, 'lib/api-zod/src/nexus-v1.ts'),
    '\nexport type EstateReleaseZodMutationProbe = true;\n',
    'utf8',
  );
  const afterZod = buildManifest(root);
  assert.notEqual(afterZod.release_id, after.release_id);
  assert.notEqual(
    afterZod.components.find((component) => component.id === 'api-zod')?.tree_sha256,
    after.components.find((component) => component.id === 'api-zod')?.tree_sha256,
  );
});

test('React client closure includes its public runtime boundary', () => {
  const manifest = buildManifest();
  const reactClient = manifest.components.find((component) => component.id === 'api-client-react');
  assert.ok(reactClient);
  const paths = new Set(reactClient.files.map((file) => file.path));
  for (const path of [
    'lib/api-client-react/src/index.ts',
    'lib/api-client-react/src/custom-fetch.ts',
    'lib/api-client-react/src/standard-hooks.ts',
  ]) {
    assert.equal(paths.has(path), true, `${path} must be hash-closed`);
  }
});

test('Zod client closure includes its complete public re-export boundary', () => {
  const manifest = buildManifest();
  const zodClient = manifest.components.find((component) => component.id === 'api-zod');
  assert.ok(zodClient);
  const paths = new Set(zodClient.files.map((file) => file.path));
  for (const path of [
    'lib/api-zod/package.json',
    'lib/api-zod/src/index.ts',
    'lib/api-zod/src/nexus-v1.ts',
    'lib/api-zod/src/per.ts',
    'lib/api-zod/src/generated/api.ts',
    'lib/api-zod/src/generated/types/index.ts',
  ]) {
    assert.equal(paths.has(path), true, `${path} must be hash-closed`);
  }
});

test('Turbo never caches the external-tree freshness test', () => {
  const turbo = JSON.parse(readFileSync(resolve(REPOSITORY_ROOT, 'turbo.json'), 'utf8'));
  assert.equal(turbo.tasks['@szl-holdings/estate-contract-release#test']?.cache, false);
});

test('one changed file digest changes the release identity', () => {
  const manifest = buildManifest();
  const tampered = structuredClone(manifest);
  tampered.components[0].files[0].sha256 = '0'.repeat(64);
  delete tampered.release_id;
  assert.notEqual(digest(tampered), manifest.release_id);
});

test('generated outputs never claim verified codegen lineage', () => {
  const manifest = buildManifest();
  const generated = manifest.components.filter(
    (component) => component.id.startsWith('api-client') || component.id === 'api-zod',
  );
  assert.equal(generated.length, 2);
  assert.ok(
    generated.every((component) => component.role === 'RUNTIME_AND_GENERATED_OUTPUT_PRESENT'),
  );
  assert.equal(manifest.evidence_labels.generated_output_lineage, 'STRUCTURE_ONLY');
});
