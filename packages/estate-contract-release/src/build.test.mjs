import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildManifest,
  canonicalJson,
  compareUtf8Bytes,
  manifestMatchesCurrent,
  OUTPUT_PATH,
} from './build.mjs';

function digest(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
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
  assert.equal(manifest.components.length, 5);
  assert.ok(manifest.components.every((component) => component.file_count > 0));
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
  assert.ok(generated.every((component) => component.role === 'GENERATED_OUTPUT_PRESENT'));
  assert.equal(manifest.evidence_labels.generated_output_lineage, 'STRUCTURE_ONLY');
});
