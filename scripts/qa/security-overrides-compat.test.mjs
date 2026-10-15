import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lock = parseYaml(readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8'));
const rootRequire = createRequire(path.join(root, 'package.json'));
const braceByMinimatchMajor = new Map([
  [3, '1.1.21'],
  [5, '2.1.7'],
  [9, '2.1.7'],
  [10, '5.0.12'],
]);

// Select only current lockfile snapshots, never stale versions left in .pnpm.
const minimatchSnapshots = Object.entries(lock.snapshots ?? {}).filter(([key]) =>
  key.startsWith('minimatch@'),
);
const rateLimitImporters = Object.entries(lock.importers ?? {}).filter(
  ([, importer]) => importer.dependencies?.['express-rate-limit'],
);

function installedPackage(requireFrom, name) {
  const entry = requireFrom.resolve(name);
  let directory = path.dirname(realpathSync(entry));
  while (true) {
    const manifestPath = path.join(directory, 'package.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.name === name) return { entry, manifest, manifestPath };
    }
    const parent = path.dirname(directory);
    assert.notEqual(parent, directory, `cannot identify installed ${name}: ${entry}`);
    directory = parent;
  }
}

test('lockfile contains every covered consumer and only patched brace releases', () => {
  assert.ok(minimatchSnapshots.length > 0, 'missing minimatch snapshots');
  const observedMajors = new Set();
  for (const [key, snapshot] of minimatchSnapshots) {
    const match = /^minimatch@(\d+)\.\d+\.\d+$/.exec(key);
    assert.ok(match, `unreviewed minimatch snapshot shape: ${key}`);
    const major = Number(match[1]);
    observedMajors.add(major);
    assert.ok(braceByMinimatchMajor.has(major), `unreviewed minimatch major: ${major}`);
    assert.equal(snapshot.dependencies?.['brace-expansion'], braceByMinimatchMajor.get(major));
  }
  assert.deepEqual(
    [...observedMajors].sort((a, b) => a - b),
    [3, 5, 9, 10],
  );
  const braceVersions = Object.keys(lock.packages ?? {})
    .filter((key) => key.startsWith('brace-expansion@'))
    .map((key) => key.slice('brace-expansion@'.length))
    .sort();
  assert.deepEqual(braceVersions, ['1.1.21', '2.1.7', '5.0.12']);
  assert.ok(rateLimitImporters.length > 0, 'missing express-rate-limit consumers');
});

for (const [snapshotKey, snapshot] of minimatchSnapshots) {
  test(`${snapshotKey} resolves a patched, API-compatible brace dependency`, () => {
    assert.match(snapshotKey, /^minimatch@\d+\.\d+\.\d+$/);
    const version = snapshotKey.slice('minimatch@'.length);
    const major = Number(version.split('.')[0]);
    const expectedBrace = braceByMinimatchMajor.get(major);
    assert.ok(expectedBrace, `unreviewed minimatch major: ${major}`);
    const manifestPath = path.join(
      root,
      'node_modules/.pnpm',
      snapshotKey,
      'node_modules/minimatch/package.json',
    );
    assert.ok(
      existsSync(manifestPath),
      `lockfile-selected consumer is not installed: ${snapshotKey}`,
    );
    const consumerRequire = createRequire(manifestPath);
    const consumer = installedPackage(consumerRequire, 'minimatch');
    assert.equal(realpathSync(consumer.manifestPath), realpathSync(manifestPath));
    assert.equal(consumer.manifest.version, version);
    const module = consumerRequire('minimatch');
    const matches = typeof module === 'function' ? module : module.minimatch;
    assert.equal(typeof matches, 'function');

    // Exercise the consumer's real import. A blanket v5 override throws here
    // for legacy consumers even though its vulnerability audit is clean.
    assert.equal(matches('src/a.js', 'src/{a,b}.js'), true);
    assert.equal(matches('src/c.ts', 'src/{a,{b,c}}.{js,ts}'), true);
    assert.equal(matches('src/unit-2.js', 'src/unit-{1..3}.{js,ts}'), true);
    assert.equal(matches('src/z.js', 'src/{a,{b,c}}.{js,ts}'), false);
    assert.equal(matches('src/unit-4.js', 'src/unit-{1..3}.{js,ts}'), false);
    assert.equal(snapshot.dependencies?.['brace-expansion'], expectedBrace);
    const brace = installedPackage(consumerRequire, 'brace-expansion');
    assert.equal(brace.manifest.version, expectedBrace);
    const braceModule = consumerRequire('brace-expansion');
    const expand = major === 10 ? braceModule.expand : braceModule;
    assert.equal(typeof expand, 'function');
    assert.deepEqual(expand('{a,{b,c}}'), ['a', 'b', 'c']);
    assert.deepEqual(expand('item-{1..3}'), ['item-1', 'item-2', 'item-3']);
    assert.deepEqual(expand('literal'), ['literal']);
  });
}

for (const [importerPath, importer] of rateLimitImporters) {
  test(`${importerPath} retains IPv4 and IPv6 rate-limit key boundaries`, () => {
    const locked = importer.dependencies['express-rate-limit'].version;
    assert.equal(typeof locked, 'string');
    const snapshot = lock.snapshots[`express-rate-limit@${locked}`];
    assert.ok(snapshot, `missing rate-limit snapshot for ${importerPath}`);
    assert.equal(snapshot.dependencies?.['ip-address'], '10.7.1');
    const importerRequire = createRequire(path.join(root, importerPath, 'package.json'));
    const limiter = installedPackage(importerRequire, 'express-rate-limit');
    assert.equal(limiter.manifest.version, locked.split('(')[0]);
    const limiterRequire = createRequire(limiter.entry);
    assert.equal(installedPackage(limiterRequire, 'ip-address').manifest.version, '10.7.1');
    const { ipKeyGenerator } = importerRequire('express-rate-limit');
    const { Address4, Address6 } = limiterRequire('ip-address');
    assert.equal(ipKeyGenerator('192.0.2.1'), '192.0.2.1');
    assert.notEqual(ipKeyGenerator('192.0.2.1'), ipKeyGenerator('192.0.2.2'));
    assert.equal(ipKeyGenerator('2001:db8:1234:5600::1'), ipKeyGenerator('2001:db8:1234:56ff::2'));
    assert.notEqual(
      ipKeyGenerator('2001:db8:1234:5600::1'),
      ipKeyGenerator('2001:db8:1234:5700::1'),
    );
    assert.equal(new Address4('192.0.2.1').isInSubnet(new Address4('192.0.2.0/24')), true);
    assert.equal(new Address4('198.51.100.1').isInSubnet(new Address4('192.0.2.0/24')), false);
    assert.equal(new Address6('::1').isInSubnet(new Address4('0.0.0.0/0')), false);
    assert.equal(new Address4('0.0.0.1').isInSubnet(new Address6('::/0')), false);
  });
}

test('patched Nodemailer parses addresses and composes mail entirely offline', {
  timeout: 5_000,
}, async () => {
  assert.equal(lock.importers?.['.']?.dependencies?.nodemailer?.version, '10.0.9');
  assert.equal(installedPackage(rootRequire, 'nodemailer').manifest.version, '10.0.9');
  const nodemailer = rootRequire('nodemailer');
  const addressparser = rootRequire('nodemailer/lib/addressparser');
  assert.equal(addressparser('Alice <alice@example.com>')[0].address, 'alice@example.com');
  const quoted = addressparser('"user"@example.com(x)evil.com');
  assert.ok(quoted.length > 0);
  assert.ok(quoted.every((recipient) => !/\s/.test(recipient.address ?? '')));
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  });
  try {
    const composed = await transport.sendMail({
      from: 'sender@example.com',
      to: 'Alice <alice@example.com>',
      subject: 'Offline dependency compatibility',
      text: 'Local stream transport only; no SMTP connection.',
    });
    assert.deepEqual(composed.envelope, { from: 'sender@example.com', to: ['alice@example.com'] });
    assert.ok(Buffer.isBuffer(composed.message));
    assert.match(composed.message.toString('utf8'), /Subject: Offline dependency compatibility/);
  } finally {
    transport.close();
  }
});
