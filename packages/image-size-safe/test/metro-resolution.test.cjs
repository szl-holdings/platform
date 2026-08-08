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

test('both installed Metro versions resolve the workspace replacement and parse an asset', () => {
  const metroPackages = fs
    .readdirSync(virtualStore)
    .filter((name) => /^metro@0\.83\.(?:3|7)$/.test(name))
    .sort();
  assert.deepEqual(metroPackages, ['metro@0.83.3', 'metro@0.83.7']);

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
