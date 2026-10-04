import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import {
  assertPristineArchive,
  assertPristineProvenance,
  downloadPristineArchive,
  MAX_ARCHIVE_BYTES,
  MAX_UNPACKED_BYTES,
  preparePristineControl,
  PRISTINE_URL,
  readBoundedArchive,
  validatePristineMembers,
} from './prepare-node-forge-pristine.mjs';
import { provenance } from './check-node-forge-backport.mjs';

// Independent minimal ustar encoder for inert archive fixtures. No shell or
// downloaded package is used to construct the adversarial inputs.
function tarEntry(name, { type = '0', data = Buffer.from('fixture'), link = '' } = {}) {
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, 'ascii');
  for (const [offset, width, value] of [
    [100, 8, 0o644],
    [108, 8, 0],
    [116, 8, 0],
    [124, 12, data.length],
    [136, 12, 0],
  ]) {
    header.write(`${value.toString(8).padStart(width - 1, '0')}\0`, offset, width, 'ascii');
  }
  header.fill(0x20, 148, 156);
  header.write(type, 156, 1, 'ascii');
  header.write(link, 157, 100, 'ascii');
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  header.write(`${checksum.toString(8).padStart(6, '0')}\0 `, 148, 8, 'ascii');
  return Buffer.concat([header, data, Buffer.alloc((512 - (data.length % 512)) % 512)]);
}

function archive(entries) {
  return gzipSync(Buffer.concat([...entries, Buffer.alloc(1024)]));
}

test('receipt URL or integrity drift cannot select another retrieval source', () => {
  assertPristineProvenance();
  for (const field of [
    'tarball_url',
    'registry_integrity',
    'tarball_sha256',
    'pristine_rsa_sha256',
  ]) {
    const modified = structuredClone(provenance);
    modified.node_forge[field] = 'modified receipt field';
    assert.throws(() => assertPristineProvenance(modified));
  }
});

test('download is a fixed credential-free request with redirects forbidden', async (t) => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests += 1;
    assert.equal(url, PRISTINE_URL);
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.body, undefined);
    assert.equal(options.headers, undefined);
    return new Response('inert fixture');
  });
  assert.equal((await downloadPristineArchive()).toString(), 'inert fixture');
  assert.equal(requests, 1);
});

test('HTTP and redirect failures terminate before a control is prepared', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  await assert.rejects(downloadPristineArchive(), /HTTP 503/);
  t.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('redirect rejected');
  });
  await assert.rejects(downloadPristineArchive(), /redirect rejected/);
});

test('bounded reads preserve split binary data and accept the exact size limit', async () => {
  async function* chunks() {
    yield Buffer.from([0, 255]);
    yield Buffer.alloc(MAX_ARCHIVE_BYTES - 2, 0x53);
  }
  const bytes = await readBoundedArchive(chunks());
  assert.equal(bytes.length, MAX_ARCHIVE_BYTES);
  assert.deepEqual([...bytes.subarray(0, 3)], [0, 255, 0x53]);
});

test('oversized downloads cancel their source instead of buffering further data', async () => {
  let finalized = false;
  let extraRead = false;
  async function* chunks() {
    try {
      yield Buffer.alloc(MAX_ARCHIVE_BYTES);
      yield Buffer.from([1]);
      extraRead = true;
      yield Buffer.from([2]);
    } finally {
      finalized = true;
    }
  }
  await assert.rejects(readBoundedArchive(chunks()), /bounded retrieval size/);
  assert.equal(finalized, true);
  assert.equal(extraRead, false);
});

test('hash or size mismatch is rejected before any extraction directory is created', () => {
  const root = mkdtempSync(join(tmpdir(), 'szl-pristine-negative-'));
  try {
    assert.throws(() => assertPristineArchive(Buffer.alloc(MAX_ARCHIVE_BYTES + 1)), /bounded/);
    assert.throws(
      () =>
        preparePristineControl(archive([tarEntry('package/lib/rsa.js')]), { temporaryRoot: root }),
      /integrity mismatch/,
    );
    assert.deepEqual(readdirSync(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('regular files inside package pass the complete archive inventory', () => {
  const bytes = archive([tarEntry('package/package.json'), tarEntry('package/lib/rsa.js')]);
  assert.ok(validatePristineMembers(bytes).length > 0);
});

test('inherited tar options cannot hide members from the inventory', () => {
  const previous = process.env.TAR_OPTIONS;
  process.env.TAR_OPTIONS = '--exclude=*';
  try {
    assert.ok(validatePristineMembers(archive([tarEntry('package/file')])).length > 0);
    assert.throws(() => validatePristineMembers(archive([tarEntry('../outside')])), /member path/);
  } finally {
    if (previous === undefined) delete process.env.TAR_OPTIONS;
    else process.env.TAR_OPTIONS = previous;
  }
});

test('PAX and GNU extended names are validated after tar resolves them', () => {
  const record = 'path=../../outside\n';
  let length = Buffer.byteLength(record) + 2;
  while (Buffer.byteLength(`${length} ${record}`) !== length) {
    length = Buffer.byteLength(`${length} ${record}`);
  }
  for (const entry of [
    tarEntry('package/PaxHeaders/file', { type: 'x', data: Buffer.from(`${length} ${record}`) }),
    tarEntry('././@LongLink', { type: 'L', data: Buffer.from('../../outside\0') }),
  ]) {
    assert.throws(
      () => validatePristineMembers(archive([entry, tarEntry('package/file')])),
      /member path/,
    );
  }
});

for (const name of [
  '../outside',
  '/tmp/outside',
  'package/../../outside',
  'package/./file',
  'package//file',
  'package/back\\slash',
  'package/line\nfeed',
  'package/sp ace',
]) {
  test(`archive rejects unsafe name ${JSON.stringify(name)}`, () => {
    assert.throws(() => validatePristineMembers(archive([tarEntry(name)])), /member path/);
  });
}

for (const [label, type] of [
  ['symlink', '2'],
  ['hardlink', '1'],
  ['directory', '5'],
  ['character device', '3'],
  ['block device', '4'],
  ['FIFO', '6'],
]) {
  test(`archive rejects ${label} records before extraction`, () => {
    assert.throws(
      () =>
        validatePristineMembers(
          archive([
            tarEntry('package/member', { type, data: Buffer.alloc(0), link: '/tmp/outside' }),
          ]),
        ),
      /regular files|member path/,
    );
  });
}

test('archive rejects duplicate names and excessive member counts', () => {
  assert.throws(
    () => validatePristineMembers(archive([tarEntry('package/file'), tarEntry('package/file')])),
    /Duplicate/,
  );
  assert.throws(
    () =>
      validatePristineMembers(
        archive(Array.from({ length: 129 }, (_, index) => tarEntry(`package/file-${index}`))),
      ),
    /member count/,
  );
});

test('archive rejects an empty inventory, invalid gzip, and decompression bombs', () => {
  assert.throws(() => validatePristineMembers(archive([])), /member path|member count/);
  assert.throws(() => validatePristineMembers(Buffer.from('not a gzip')));
  assert.throws(() => validatePristineMembers(gzipSync(Buffer.alloc(MAX_UNPACKED_BYTES + 512))));
});
