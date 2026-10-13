'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
const virtualStore = path.join(workspaceRoot, 'node_modules', '.pnpm');

function png(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

test('every locked Metro version resolves the workspace replacement and parses an asset', () => {
  const lockfile = fs.readFileSync(path.join(workspaceRoot, 'pnpm-lock.yaml'), 'utf8');
  const lockedMetroPackages = [
    ...new Set([...lockfile.matchAll(/^ {2}(metro@\d+\.\d+\.\d+):/gm)].map((match) => match[1])),
  ].sort();
  assert.ok(lockedMetroPackages.length > 0, 'Metro must remain in the lockfile');

  const metroPackages = fs
    .readdirSync(virtualStore)
    .filter((name) => /^metro@\d+\.\d+\.\d+$/.test(name))
    .sort();
  assert.deepEqual(metroPackages, lockedMetroPackages);

  for (const metroPackage of metroPackages) {
    const metroDirectory = path.join(virtualStore, metroPackage, 'node_modules', 'metro');
    const resolvedImageSize = require.resolve('image-size', { paths: [metroDirectory] });
    assert.equal(
      resolvedImageSize,
      path.join(workspaceRoot, 'packages', 'image-size-safe', 'index.cjs'),
    );

    const metroAssets = require(path.join(metroDirectory, 'src', 'Assets.js'));
    assert.deepEqual(metroAssets.getAssetSize('png', png(321, 123), 'fixture.png'), {
      width: 321,
      height: 123,
    });
  }
});
