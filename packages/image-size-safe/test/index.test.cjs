'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const imageSize = require('../index.cjs');

function png(width, height) {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function cgbiPng(width, height) {
  const buffer = Buffer.alloc(36);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  buffer.write('CgBI', 12, 'ascii');
  buffer.write('IHDR', 24, 'ascii');
  buffer.writeUInt32BE(width, 28);
  buffer.writeUInt32BE(height, 32);
  return buffer;
}

function jpeg(width, height) {
  const buffer = Buffer.alloc(21);
  buffer.set([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08]);
  buffer.writeUInt16BE(height, 7);
  buffer.writeUInt16BE(width, 9);
  return buffer;
}

test('preserves the CommonJS API Metro consumes', () => {
  assert.equal(typeof imageSize, 'function');
  assert.equal(imageSize.default, imageSize);
  assert.equal(imageSize.imageSize, imageSize);
  assert.deepEqual(imageSize.types, [
    'png',
    'jpg',
    'bmp',
    'gif',
    'webp',
    'psd',
    'svg',
    'tiff',
    'ktx',
  ]);
  assert.deepEqual(imageSize(png(640, 480)), { width: 640, height: 480, type: 'png' });
});

test('bounds direct buffers to the same 512 KiB prefix used for file reads', () => {
  const largePng = Buffer.alloc(512 * 1024 + 4096);
  png(2048, 1024).copy(largePng);
  assert.deepEqual(imageSize(largePng), { width: 2048, height: 1024, type: 'png' });

  const lateSvg = Buffer.alloc(512 * 1024 + 128, 0x20);
  lateSvg.write('<svg width="10" height="20"></svg>', 512 * 1024 + 32, 'utf8');
  assert.throws(() => imageSize(lateSvg), /unsupported file type/);
});

test('parses the bounded raster formats Metro declares', () => {
  const gif = Buffer.alloc(10);
  gif.write('GIF89a', 0, 'ascii');
  gif.writeUInt16LE(320, 6);
  gif.writeUInt16LE(200, 8);
  assert.deepEqual(imageSize(gif), { width: 320, height: 200, type: 'gif' });
  assert.deepEqual(imageSize(jpeg(48, 32)), { width: 48, height: 32, type: 'jpg' });
  assert.deepEqual(imageSize(cgbiPng(60, 40)), { width: 60, height: 40, type: 'png' });

  const bmp = Buffer.alloc(54);
  bmp.write('BM', 0, 'ascii');
  bmp.writeUInt32LE(40, 14);
  bmp.writeInt32LE(800, 18);
  bmp.writeInt32LE(-600, 22);
  assert.deepEqual(imageSize(bmp), { width: 800, height: 600, type: 'bmp' });

  const psd = Buffer.alloc(22);
  psd.write('8BPS', 0, 'ascii');
  psd.writeUInt16BE(1, 4);
  psd.writeUInt32BE(720, 14);
  psd.writeUInt32BE(1280, 18);
  assert.deepEqual(imageSize(psd), { width: 1280, height: 720, type: 'psd' });

  const webp = Buffer.alloc(30);
  webp.write('RIFF', 0, 'ascii');
  webp.write('WEBP', 8, 'ascii');
  webp.write('VP8X', 12, 'ascii');
  webp[24] = 0xff;
  webp[27] = 0x7f;
  assert.deepEqual(imageSize(webp), { width: 256, height: 128, type: 'webp' });
});

test('parses bounded SVG, TIFF, and KTX metadata', () => {
  assert.deepEqual(imageSize(Buffer.from('<svg viewBox="0 0 1024 768"></svg>')), {
    width: 1024,
    height: 768,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="2cm" height="3cm"></svg>')), {
    width: 76,
    height: 113,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="1in" height="72pt"></svg>')), {
    width: 96,
    height: 96,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="1em" height="2em"></svg>')), {
    width: 16,
    height: 32,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="1ex" height="2ex"></svg>')), {
    width: 8,
    height: 16,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="1e2" height="5e1"></svg>')), {
    width: 100,
    height: 50,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="100" viewBox="0 0 200 50"></svg>')), {
    width: 100,
    height: 25,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg height="75" viewBox="0 0 200 50"></svg>')), {
    width: 300,
    height: 75,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="100" viewBox="0 0 3 2"></svg>')), {
    width: 100,
    height: 66,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="100.1" viewBox="0 0 7 10"></svg>')), {
    width: 100,
    height: 142,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="100" viewBox="0 0 7.1 10.4"></svg>')), {
    width: 100,
    height: 142,
    type: 'svg',
  });
  assert.deepEqual(imageSize(Buffer.from('<svg width="100" viewBox="0\t0\t200\t50"></svg>')), {
    width: 100,
    height: 25,
    type: 'svg',
  });
  assert.throws(
    () => imageSize(Buffer.from('<svg data-viewBox="0 0 200 50" width="100"></svg>')),
    /invalid svg dimensions/i,
  );
  assert.deepEqual(
    imageSize(Buffer.from('<svg data-width="100" height="50" viewBox="0 0 200 50"></svg>')),
    { width: 200, height: 50, type: 'svg' },
  );
  assert.deepEqual(
    imageSize(
      Buffer.from('<svg aria-label="value > threshold" width="100" height="50"></svg>'),
    ),
    { width: 100, height: 50, type: 'svg' },
  );
  assert.deepEqual(
    imageSize(Buffer.from(`${'<?xml'.repeat(512)}<svg width="8" height="9"></svg>`)),
    { width: 8, height: 9, type: 'svg' },
  );

  const tiff = Buffer.alloc(38);
  tiff.write('II', 0, 'ascii');
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(2, 8);
  tiff.writeUInt16LE(256, 10);
  tiff.writeUInt16LE(4, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt32LE(1920, 18);
  tiff.writeUInt16LE(257, 22);
  tiff.writeUInt16LE(4, 24);
  tiff.writeUInt32LE(1, 26);
  tiff.writeUInt32LE(1080, 30);
  assert.deepEqual(imageSize(tiff), { width: 1920, height: 1080, type: 'tiff' });

  const ktx = Buffer.alloc(44);
  Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]).copy(ktx);
  ktx.writeUInt32LE(0x04030201, 12);
  ktx.writeUInt32LE(512, 36);
  ktx.writeUInt32LE(256, 40);
  assert.deepEqual(imageSize(ktx), { width: 512, height: 256, type: 'ktx' });
});

test('supports synchronous and callback file-path parsing', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'szl-image-size-'));
  const file = path.join(directory, 'asset.png');
  try {
    fs.writeFileSync(file, png(24, 18));
    assert.deepEqual(imageSize(file), { width: 24, height: 18, type: 'png' });
    await new Promise((resolve, reject) => {
      imageSize(file, (error, dimensions) => {
        if (error) reject(error);
        else {
          assert.deepEqual(dimensions, { width: 24, height: 18, type: 'png' });
          resolve();
        }
      });
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('honors disabled formats and filesystem access', () => {
  imageSize.disableTypes(['png']);
  assert.throws(() => imageSize(png(1, 1)), /disabled file type: png/);
  imageSize.disableTypes([]);
  imageSize.disableFS(true);
  assert.throws(() => imageSize('asset.png'), /input should be a Uint8Array/);
  imageSize.disableFS(false);
  assert.throws(() => imageSize.setConcurrency(0), /invalid concurrency/);
  imageSize.setConcurrency(8);
});

test('fails closed on the advisory ICNS zero-length entry class', () => {
  const input = Buffer.alloc(16);
  input.write('icns', 0, 'ascii');
  input.writeUInt32BE(16, 4);
  input.write('ic07', 8, 'ascii');
  input.writeUInt32BE(0, 12);
  assert.throws(() => imageSize(input), /unsupported file type: unknown/);
});

test('fails closed on the advisory JXL zero-size box class', () => {
  const input = Buffer.alloc(24);
  input.writeUInt32BE(0, 0);
  input.write('JXL ', 4, 'ascii');
  input.write('jxl ', 8, 'ascii');
  assert.throws(() => imageSize(input), /unsupported file type/);
});

test('fails closed on the advisory HEIF zero-size box class', () => {
  const input = Buffer.alloc(24);
  input.writeUInt32BE(0, 0);
  input.write('ftyp', 4, 'ascii');
  input.write('heic', 8, 'ascii');
  assert.throws(() => imageSize(input), /unsupported file type/);
});

test('rejects malformed recognized inputs without an unbounded walk', () => {
  const malformed = Buffer.alloc(32);
  malformed[0] = 0xff;
  malformed[1] = 0xd8;
  malformed[2] = 0xff;
  malformed[3] = 0xe0;
  malformed.writeUInt16BE(0, 4);
  assert.throws(() => imageSize(malformed), /invalid JPEG segment length/);

  const tiff = Buffer.alloc(10);
  tiff.write('II', 0, 'ascii');
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(4097, 8);
  assert.throws(() => imageSize(tiff), /unbounded TIFF directory/);
});
