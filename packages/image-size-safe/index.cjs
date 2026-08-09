'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MAX_INPUT_SIZE = 512 * 1024;
const MAX_TIFF_ENTRIES = 4096;
const MAX_SVG_PROLOG_SIZE = 4096;
const SUPPORTED_TYPES = ['png', 'jpg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff', 'ktx'];
const SVG_UNIT_SCALE = Object.freeze({
  '': 1,
  cm: 96 / 2.54,
  em: 16,
  ex: 8,
  in: 96,
  m: 96 / 0.0254,
  mm: 96 / 25.4,
  pc: 16,
  pt: 96 / 72,
  px: 1,
});

let fsDisabled = false;
let disabledTypes = new Set();
let concurrency = 100;
let activeTasks = 0;
const pendingTasks = [];

function fail(message) {
  throw new TypeError(message);
}

function asBuffer(input) {
  if (!(input instanceof Uint8Array)) fail('invalid invocation. input should be a Uint8Array');
  if (input.byteLength === 0) fail('empty image input');
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  return buffer.subarray(0, Math.min(buffer.length, MAX_INPUT_SIZE));
}

function requireBytes(buffer, offset, length, label) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0) {
    fail(`invalid ${label} bounds`);
  }
  if (offset + length > buffer.length) fail(`truncated ${label}`);
}

function checkedDimensions(width, height, type) {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    fail(`invalid ${type} dimensions`);
  }
  return { width, height, type };
}

function parsePng(buffer) {
  requireBytes(buffer, 0, 24, 'PNG header');
  if (buffer.toString('ascii', 12, 16) !== 'IHDR') fail('invalid PNG header');
  return checkedDimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20), 'png');
}

function parseGif(buffer) {
  requireBytes(buffer, 0, 10, 'GIF header');
  return checkedDimensions(buffer.readUInt16LE(6), buffer.readUInt16LE(8), 'gif');
}

function parseBmp(buffer) {
  requireBytes(buffer, 0, 26, 'BMP header');
  const dibSize = buffer.readUInt32LE(14);
  if (dibSize === 12) {
    return checkedDimensions(buffer.readUInt16LE(18), buffer.readUInt16LE(20), 'bmp');
  }
  if (dibSize < 40) fail('unsupported BMP DIB header');
  return checkedDimensions(
    Math.abs(buffer.readInt32LE(18)),
    Math.abs(buffer.readInt32LE(22)),
    'bmp',
  );
}

function parsePsd(buffer) {
  requireBytes(buffer, 0, 22, 'PSD header');
  if (buffer.readUInt16BE(4) !== 1) fail('unsupported PSD version');
  return checkedDimensions(buffer.readUInt32BE(18), buffer.readUInt32BE(14), 'psd');
}

function parseJpeg(buffer) {
  requireBytes(buffer, 0, 4, 'JPEG header');
  const startOfFrame = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let offset = 2;

  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) break;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (marker === 0xd9 || marker === 0xda) break;

    requireBytes(buffer, offset, 2, 'JPEG segment length');
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2) fail('invalid JPEG segment length');
    requireBytes(buffer, offset, segmentLength, 'JPEG segment');

    if (startOfFrame.has(marker)) {
      if (segmentLength < 7) fail('truncated JPEG frame');
      return checkedDimensions(
        buffer.readUInt16BE(offset + 5),
        buffer.readUInt16BE(offset + 3),
        'jpg',
      );
    }
    offset += segmentLength;
  }
  fail('invalid JPEG, no size found');
}

function readUInt24LE(buffer, offset) {
  requireBytes(buffer, offset, 3, '24-bit integer');
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseWebp(buffer) {
  requireBytes(buffer, 0, 25, 'WebP header');
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    requireBytes(buffer, 0, 30, 'WebP extended header');
    return checkedDimensions(readUInt24LE(buffer, 24) + 1, readUInt24LE(buffer, 27) + 1, 'webp');
  }
  if (chunk === 'VP8L') {
    if (buffer[20] !== 0x2f) fail('invalid WebP lossless signature');
    const width = 1 + buffer[21] + ((buffer[22] & 0x3f) << 8);
    const height = 1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10);
    return checkedDimensions(width, height, 'webp');
  }
  if (chunk === 'VP8 ') {
    requireBytes(buffer, 20, 10, 'WebP lossy header');
    if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) {
      fail('invalid WebP lossy signature');
    }
    return checkedDimensions(
      buffer.readUInt16LE(26) & 0x3fff,
      buffer.readUInt16LE(28) & 0x3fff,
      'webp',
    );
  }
  fail('unsupported WebP chunk');
}

function isAsciiWhitespace(character) {
  return (
    character === ' ' ||
    character === '\t' ||
    character === '\n' ||
    character === '\r' ||
    character === '\f'
  );
}

function startsWithAsciiCaseInsensitive(text, offset, expectedLowercase) {
  if (offset < 0 || offset + expectedLowercase.length > text.length) return false;
  for (let index = 0; index < expectedLowercase.length; index += 1) {
    let code = text.charCodeAt(offset + index);
    if (code >= 0x41 && code <= 0x5a) code += 0x20;
    if (code !== expectedLowercase.charCodeAt(index)) return false;
  }
  return true;
}

function isSvgRootBoundary(character) {
  return (
    character === '>' || character === '/' || character === ':' || isAsciiWhitespace(character)
  );
}

function findSvgTagEnd(text, offset) {
  let quote;
  for (let cursor = offset; cursor < text.length; cursor += 1) {
    const character = text[cursor];
    if (quote !== undefined) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '>') return cursor;
  }
  return -1;
}

function scanSvgRoot(buffer) {
  const text = buffer.toString('utf8');
  const prologLimit = Math.min(text.length, MAX_SVG_PROLOG_SIZE);
  let cursor = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let sawComment = false;
  let sawDeclaration = false;

  while (cursor < prologLimit) {
    while (cursor < prologLimit && isAsciiWhitespace(text[cursor])) cursor += 1;

    if (startsWithAsciiCaseInsensitive(text, cursor, '<?xml')) {
      if (sawDeclaration || sawComment) return undefined;
      const declarationEnd = text.indexOf('?>', cursor + 5);
      if (declarationEnd < 0 || declarationEnd + 2 > prologLimit) return undefined;
      sawDeclaration = true;
      cursor = declarationEnd + 2;
      continue;
    }

    if (text.startsWith('<!--', cursor)) {
      const commentEnd = text.indexOf('-->', cursor + 4);
      if (commentEnd < 0 || commentEnd + 3 > prologLimit) return undefined;
      sawComment = true;
      cursor = commentEnd + 3;
      continue;
    }
    break;
  }

  if (!startsWithAsciiCaseInsensitive(text, cursor, '<svg')) return undefined;
  if (!isSvgRootBoundary(text[cursor + 4])) return undefined;
  const tagEnd = findSvgTagEnd(text, cursor + 4);
  if (tagEnd < 0) return undefined;
  return text.slice(cursor + 4, tagEnd);
}

function parseSvgAttributes(tag) {
  const attributes = new Map();
  let cursor = 0;
  while (cursor < tag.length) {
    while (cursor < tag.length && isAsciiWhitespace(tag[cursor])) cursor += 1;
    if (cursor >= tag.length || tag[cursor] === '/') break;

    const nameStart = cursor;
    while (
      cursor < tag.length &&
      !isAsciiWhitespace(tag[cursor]) &&
      tag[cursor] !== '=' &&
      tag[cursor] !== '/'
    ) {
      cursor += 1;
    }
    if (cursor === nameStart) {
      cursor += 1;
      continue;
    }
    const name = tag.slice(nameStart, cursor).toLowerCase();
    while (cursor < tag.length && isAsciiWhitespace(tag[cursor])) cursor += 1;
    if (tag[cursor] !== '=') continue;
    cursor += 1;
    while (cursor < tag.length && isAsciiWhitespace(tag[cursor])) cursor += 1;

    const quote = tag[cursor];
    if (quote !== '"' && quote !== "'") continue;
    const valueStart = cursor + 1;
    const valueEnd = tag.indexOf(quote, valueStart);
    if (valueEnd < 0) fail('invalid SVG attribute');
    attributes.set(name, tag.slice(valueStart, valueEnd));
    cursor = valueEnd + 1;
  }
  return attributes;
}

function parseSvgLength(rawValue) {
  if (typeof rawValue !== 'string') return undefined;
  const value = rawValue.trim();
  let cursor = 0;
  if (value[cursor] === '+' || value[cursor] === '-') cursor += 1;
  let digits = 0;
  while (
    cursor < value.length &&
    value.charCodeAt(cursor) >= 0x30 &&
    value.charCodeAt(cursor) <= 0x39
  ) {
    cursor += 1;
    digits += 1;
  }
  if (value[cursor] === '.') {
    cursor += 1;
    while (
      cursor < value.length &&
      value.charCodeAt(cursor) >= 0x30 &&
      value.charCodeAt(cursor) <= 0x39
    ) {
      cursor += 1;
      digits += 1;
    }
  }
  if (digits === 0) return undefined;

  if (value[cursor] === 'e' || value[cursor] === 'E') {
    const exponentStart = cursor;
    cursor += 1;
    if (value[cursor] === '+' || value[cursor] === '-') cursor += 1;
    const exponentDigitsStart = cursor;
    while (
      cursor < value.length &&
      value.charCodeAt(cursor) >= 0x30 &&
      value.charCodeAt(cursor) <= 0x39
    ) {
      cursor += 1;
    }
    if (cursor === exponentDigitsStart) cursor = exponentStart;
  }

  const number = Number(value.slice(0, cursor));
  const unit = value.slice(cursor).toLowerCase();
  if (!Number.isFinite(number) || !Object.hasOwn(SVG_UNIT_SCALE, unit)) return undefined;
  return number * SVG_UNIT_SCALE[unit];
}

function parseSvgNumberList(rawValue) {
  if (typeof rawValue !== 'string') return undefined;
  const values = [];
  let cursor = 0;
  while (cursor < rawValue.length) {
    while (
      cursor < rawValue.length &&
      (isAsciiWhitespace(rawValue[cursor]) || rawValue[cursor] === ',')
    ) {
      cursor += 1;
    }
    if (cursor >= rawValue.length) break;
    const start = cursor;
    while (
      cursor < rawValue.length &&
      !isAsciiWhitespace(rawValue[cursor]) &&
      rawValue[cursor] !== ','
    ) {
      cursor += 1;
    }
    const number = Number(rawValue.slice(start, cursor));
    if (!Number.isFinite(number)) return undefined;
    values.push(number);
    if (values.length > 4) return undefined;
  }
  return values;
}

function parseSvg(buffer) {
  const tag = scanSvgRoot(buffer);
  if (tag === undefined) fail('invalid SVG root');
  const attributes = parseSvgAttributes(tag);
  let width = parseSvgLength(attributes.get('width'));
  let height = parseSvgLength(attributes.get('height'));
  const viewBox = parseSvgNumberList(attributes.get('viewbox'));
  if (viewBox?.length === 4) {
    width ??= viewBox[2];
    height ??= viewBox[3];
  }
  return checkedDimensions(Math.round(width), Math.round(height), 'svg');
}

function parseTiff(buffer) {
  requireBytes(buffer, 0, 8, 'TIFF header');
  const byteOrder = buffer.toString('ascii', 0, 2);
  if (byteOrder !== 'II' && byteOrder !== 'MM') fail('invalid TIFF byte order');
  const littleEndian = byteOrder === 'II';
  const read16 = (offset) => {
    requireBytes(buffer, offset, 2, 'TIFF uint16');
    return littleEndian ? buffer.readUInt16LE(offset) : buffer.readUInt16BE(offset);
  };
  const read32 = (offset) => {
    requireBytes(buffer, offset, 4, 'TIFF uint32');
    return littleEndian ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
  };
  if (read16(2) !== 42) fail('invalid TIFF magic');
  const ifdOffset = read32(4);
  const count = read16(ifdOffset);
  if (count > MAX_TIFF_ENTRIES) fail('unbounded TIFF directory');
  let width;
  let height;
  for (let index = 0; index < count; index += 1) {
    const entry = ifdOffset + 2 + index * 12;
    requireBytes(buffer, entry, 12, 'TIFF directory entry');
    const tag = read16(entry);
    if (tag !== 256 && tag !== 257) continue;
    const fieldType = read16(entry + 2);
    const fieldCount = read32(entry + 4);
    if (fieldCount !== 1 || (fieldType !== 3 && fieldType !== 4))
      fail('unsupported TIFF size field');
    const value = fieldType === 3 ? read16(entry + 8) : read32(entry + 8);
    if (tag === 256) width = value;
    if (tag === 257) height = value;
  }
  return checkedDimensions(width, height, 'tiff');
}

function parseKtx(buffer) {
  const ktx1 = Buffer.from([
    0xab, 0x4b, 0x54, 0x58, 0x20, 0x31, 0x31, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const ktx2 = Buffer.from([
    0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  if (buffer.subarray(0, 12).equals(ktx1)) {
    requireBytes(buffer, 0, 44, 'KTX1 header');
    const marker = buffer.readUInt32LE(12);
    if (marker === 0x04030201)
      return checkedDimensions(buffer.readUInt32LE(36), buffer.readUInt32LE(40), 'ktx');
    if (marker === 0x01020304)
      return checkedDimensions(buffer.readUInt32BE(36), buffer.readUInt32BE(40), 'ktx');
    fail('invalid KTX1 endianness');
  }
  if (buffer.subarray(0, 12).equals(ktx2)) {
    requireBytes(buffer, 0, 28, 'KTX2 header');
    return checkedDimensions(buffer.readUInt32LE(20), buffer.readUInt32LE(24), 'ktx');
  }
  fail('invalid KTX signature');
}

function detect(buffer) {
  if (
    buffer.length >= 24 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (buffer.length >= 10 && /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6))) return 'gif';
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
  if (buffer.length >= 26 && buffer.toString('ascii', 0, 2) === 'BM') return 'bmp';
  if (buffer.length >= 22 && buffer.toString('ascii', 0, 4) === '8BPS') return 'psd';
  if (
    buffer.length >= 25 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  if (buffer.length >= 8 && ['II', 'MM'].includes(buffer.toString('ascii', 0, 2))) return 'tiff';
  if (buffer.length >= 12 && buffer[0] === 0xab && buffer.toString('ascii', 1, 4) === 'KTX')
    return 'ktx';
  if (scanSvgRoot(buffer) !== undefined) return 'svg';
  return undefined;
}

const parsers = {
  png: parsePng,
  jpg: parseJpeg,
  bmp: parseBmp,
  gif: parseGif,
  webp: parseWebp,
  psd: parsePsd,
  svg: parseSvg,
  tiff: parseTiff,
  ktx: parseKtx,
};

function lookup(input, filepath) {
  const buffer = asBuffer(input);
  const type = detect(buffer);
  if (type === undefined) fail(`unsupported file type (file: ${filepath ?? ''})`);
  if (disabledTypes.has(type)) fail(`disabled file type: ${type}`);
  return parsers[type](buffer);
}

function readFileSyncBounded(filepath) {
  const descriptor = fs.openSync(filepath, 'r');
  try {
    const size = fs.fstatSync(descriptor).size;
    if (size <= 0) fail('empty image file');
    const input = Buffer.alloc(Math.min(size, MAX_INPUT_SIZE));
    fs.readSync(descriptor, input, 0, input.length, 0);
    return input;
  } finally {
    fs.closeSync(descriptor);
  }
}

async function readFileBounded(filepath) {
  const handle = await fs.promises.open(filepath, 'r');
  try {
    const size = (await handle.stat()).size;
    if (size <= 0) fail('empty image file');
    const input = Buffer.alloc(Math.min(size, MAX_INPUT_SIZE));
    await handle.read(input, 0, input.length, 0);
    return input;
  } finally {
    await handle.close();
  }
}

function drainQueue() {
  while (activeTasks < concurrency && pendingTasks.length > 0) {
    const task = pendingTasks.shift();
    activeTasks += 1;
    Promise.resolve()
      .then(task)
      .finally(() => {
        activeTasks -= 1;
        drainQueue();
      });
  }
}

function enqueue(task) {
  pendingTasks.push(task);
  drainQueue();
}

function imageSize(input, callback) {
  if (input instanceof Uint8Array) return lookup(input);
  if (typeof input !== 'string' || fsDisabled)
    fail('invalid invocation. input should be a Uint8Array');
  const filepath = path.resolve(input);
  if (typeof callback === 'function') {
    enqueue(async () => {
      try {
        const dimensions = lookup(await readFileBounded(filepath), filepath);
        process.nextTick(callback, null, dimensions);
      } catch (error) {
        process.nextTick(callback, error);
      }
    });
    return;
  }
  return lookup(readFileSyncBounded(filepath), filepath);
}

function disableFS(disabled) {
  fsDisabled = Boolean(disabled);
}

function disableTypes(types) {
  disabledTypes = new Set(Array.isArray(types) ? types : []);
}

function setConcurrency(value) {
  if (!Number.isSafeInteger(value) || value <= 0) fail('invalid concurrency');
  concurrency = value;
  drainQueue();
}

module.exports = imageSize;
module.exports.default = imageSize;
module.exports.imageSize = imageSize;
module.exports.disableFS = disableFS;
module.exports.disableTypes = disableTypes;
module.exports.setConcurrency = setConcurrency;
module.exports.types = [...SUPPORTED_TYPES];
