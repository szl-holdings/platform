import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lock = parseYaml(readFileSync(path.join(root, 'pnpm-lock.yaml'), 'utf8'));
const rootRequire = createRequire(path.join(root, 'package.json'));
const braceByMinimatchMajor = new Map([
  [3, '1.1.21'],
  [5, '2.1.7'],
  [9, '2.1.7'],
  [10, '5.0.12'],
  // glob 14 (GHSA-3g3m-2fjr-6pw4 override) depends on minimatch 11, which
  // depends on brace-expansion ^5.
  [11, '5.0.12'],
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
    [3, 5, 10, 11],
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
    // brace-expansion 5 (used by minimatch 10 and 11) has a named `expand` export.
    const expand = expectedBrace.startsWith('5.') ? braceModule.expand : braceModule;
    assert.equal(typeof expand, 'function');
    assert.deepEqual(expand('{a,{b,c}}'), ['a', 'b', 'c']);
    assert.deepEqual(expand('item-{1..3}'), ['item-1', 'item-2', 'item-3']);
    assert.deepEqual(expand('literal'), ['literal']);
  });
}

// GHSA-3g3m-2fjr-6pw4: the glob@>=9.0.0 <14.0.2 override moves every glob 10
// consumer across four majors (and onto minimatch 11's new matcher). Each
// reviewed consumer's own glob call path is exercised below; a consumer that is
// not in this list fails the routing test until its call path is reviewed.
const PATCHED_GLOB = '14.0.3';
const reviewedGlobConsumers = [
  '@expo/config-plugins@10.1.2',
  '@expo/config@11.0.13',
  '@joshwooding/vite-plugin-react-docgen-typescript@0.5.0',
  'archiver-utils@5.0.2',
  'rimraf@5.0.10',
  'sucrase@3.35.0',
];
const virtualStore = path.join(root, 'node_modules/.pnpm');

function snapshotIdentity(snapshotKey) {
  return snapshotKey.replace(/\(.*$/, '');
}

function splitIdentity(identity) {
  const at = identity.lastIndexOf('@');
  return { name: identity.slice(0, at), version: identity.slice(at + 1) };
}

// Peer-suffixed virtual-store directories are flattened (and may be
// hash-truncated), so locate the one installed entry by its name@version prefix.
function installedConsumer(identity) {
  const { name, version } = splitIdentity(identity);
  const prefix = `${name.replace('/', '+')}@${version}`;
  const entries = readdirSync(virtualStore).filter(
    (entry) => entry === prefix || entry.startsWith(`${prefix}_`),
  );
  assert.equal(entries.length, 1, `expected one installed ${identity}, found [${entries}]`);
  const manifestPath = path.join(virtualStore, entries[0], 'node_modules', name, 'package.json');
  const consumerRequire = createRequire(manifestPath);
  const consumer = installedPackage(consumerRequire, name);
  assert.equal(consumer.manifest.version, version);
  return { consumerRequire, packageDir: path.dirname(manifestPath) };
}

function patchedGlobConsumer(identity) {
  const installed = installedConsumer(identity);
  assert.equal(installedPackage(installed.consumerRequire, 'glob').manifest.version, PATCHED_GLOB);
  return installed;
}

function withFixture(files, run) {
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'szl-overrides-compat-'));
  for (const [relativePath, contents] of Object.entries(files)) {
    const target = path.join(fixture, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  const cleanup = () => rmSync(fixture, { recursive: true, force: true });
  let result;
  try {
    result = run(fixture);
  } catch (error) {
    cleanup();
    throw error;
  }
  if (result && typeof result.then === 'function') return result.finally(cleanup);
  cleanup();
  return result;
}

function fixtureRelative(fixture, paths) {
  return paths.map((entry) => path.relative(fixture, entry).split(path.sep).join('/')).sort();
}

test('lockfile routes every reviewed glob consumer to patched glob 14.0.3', () => {
  const globVersions = Object.keys(lock.packages ?? {})
    .filter((key) => key.startsWith('glob@'))
    .map((key) => key.slice('glob@'.length))
    .sort();
  // 7.2.3 is outside the advisory range (>=9.0.0 <=14.0.1).
  assert.deepEqual(globVersions, [PATCHED_GLOB, '7.2.3']);
  assert.equal(lock.overrides?.['glob@>=9.0.0 <14.0.2'], PATCHED_GLOB);
  assert.equal(lock.snapshots[`glob@${PATCHED_GLOB}`]?.dependencies?.minimatch, '11.0.4');
  const consumers = Object.entries(lock.snapshots ?? {})
    .filter(([, snapshot]) => snapshot.dependencies?.glob === PATCHED_GLOB)
    .map(([key]) => snapshotIdentity(key))
    .sort();
  assert.deepEqual(consumers, reviewedGlobConsumers);
  for (const identity of consumers) patchedGlobConsumer(identity);
});

test('archiver-utils@5.0.2 expands include/exclude patterns through glob 14', () => {
  const { consumerRequire } = patchedGlobConsumer('archiver-utils@5.0.2');
  const { file } = consumerRequire('archiver-utils');
  withFixture({ 'a.txt': 'a', 'b.md': 'b', 'nested/c.txt': 'c', 'skip/d.txt': 'd' }, (fixture) => {
    assert.deepEqual(file.expand({ cwd: fixture }, ['**/*.txt', '!skip/**']).sort(), [
      'a.txt',
      'nested/c.txt',
    ]);
    assert.deepEqual(file.expand({ cwd: fixture, filter: 'isFile' }, 'nested/*'), ['nested/c.txt']);
  });
});

test('archiver (scripts/launch-kit) still loads archiver-utils and writes a zip', async () => {
  const archiverRequire = createRequire(installedPackage(rootRequire, 'archiver').entry);
  const utilsRequire = createRequire(installedPackage(archiverRequire, 'archiver-utils').entry);
  assert.equal(installedPackage(utilsRequire, 'glob').manifest.version, PATCHED_GLOB);
  const archiver = rootRequire('archiver');
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks = [];
  archive.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve, reject) => {
    archive.on('end', resolve);
    archive.on('error', reject);
  });
  archive.append('compatibility', { name: 'README.txt' });
  await archive.finalize();
  await done;
  const zip = Buffer.concat(chunks);
  assert.equal(zip.subarray(0, 4).toString('hex'), '504b0304');
  assert.ok(zip.includes(Buffer.from('README.txt')));
});

test('rimraf@5.0.10 removes only --glob matches through glob 14', async () => {
  const { consumerRequire } = patchedGlobConsumer('rimraf@5.0.10');
  const { rimraf } = consumerRequire('rimraf');
  await withFixture({ 'one.tmp': '1', 'two.tmp': '2', 'keep.txt': 'k' }, async (fixture) => {
    assert.equal(await rimraf('*.tmp', { glob: { cwd: fixture, absolute: true } }), true);
    assert.deepEqual(readdirSync(fixture), ['keep.txt']);
  });
});

test('sucrase@3.35.0 --project compiles tsconfig include globs through glob 14', () => {
  const { packageDir } = patchedGlobConsumer('sucrase@3.35.0');
  withFixture(
    {
      'proj/tsconfig.json': JSON.stringify({
        compilerOptions: { outDir: 'out', module: 'commonjs', esModuleInterop: true },
        include: ['src/**/*'],
      }),
      'proj/src/a.ts': 'export const a: number = 1;\n',
      'proj/src/nested/b.ts': "import { a } from '../a';\nexport const b: number = a + 1;\n",
      'proj/src/types.d.ts': 'export type Ignored = string;\n',
    },
    (fixture) => {
      // sucrase resolves --project against process.cwd(), so pass a relative path.
      execFileSync(
        process.execPath,
        [path.join(packageDir, 'bin/sucrase'), '--project', 'proj', '-q'],
        {
          cwd: fixture,
          stdio: 'pipe',
        },
      );
      const out = path.join(fixture, 'proj/out/src');
      assert.match(readFileSync(path.join(out, 'a.js'), 'utf8'), /exports\.a = a/);
      assert.match(readFileSync(path.join(out, 'nested/b.js'), 'utf8'), /require\('\.\.\/a'\)/);
      assert.equal(existsSync(path.join(out, 'types.d.js')), false);
    },
  );
});

test('@expo/config@11.0.13 detects bare projects through glob 14', () => {
  const { consumerRequire } = patchedGlobConsumer('@expo/config@11.0.13');
  const { getDefaultTarget } = consumerRequire('@expo/config');
  const exp = { sdkVersion: '53.0.0' };
  const manifest = JSON.stringify({ name: 'fixture-app', version: '1.0.0' });
  withFixture({ 'package.json': manifest }, (fixture) => {
    assert.equal(getDefaultTarget(fixture, exp), 'managed');
  });
  withFixture({ 'package.json': manifest, 'ios/App.xcodeproj/project.pbxproj': '' }, (fixture) =>
    assert.equal(getDefaultTarget(fixture, exp), 'bare'),
  );
  withFixture({ 'package.json': manifest, 'android/app/build.gradle': '' }, (fixture) =>
    assert.equal(getDefaultTarget(fixture, exp), 'bare'),
  );
});

test('@expo/config-plugins@10.1.2 keeps extglob and ignore semantics on glob 14', () => {
  const { consumerRequire } = patchedGlobConsumer('@expo/config-plugins@10.1.2');
  const { AndroidConfig, IOSConfig } = consumerRequire('@expo/config-plugins');
  withFixture(
    {
      'android/app/src/main/java/com/acme/app/MainActivity.kt': '',
      'android/app/src/main/java/com/acme/app/MainApplication.java': '',
      'ios/App/AppDelegate.swift': '',
      'ios/App/Info.plist': '',
      'ios/AppTests/Info.plist': '',
      'ios/Pods/AppDelegate.m': '',
      'ios/Pods/Info.plist': '',
      'ios/vendor/Info.plist': '',
    },
    (fixture) => {
      assert.deepEqual(
        fixtureRelative(fixture, [AndroidConfig.Paths.getProjectFilePath(fixture, 'MainActivity')]),
        ['android/app/src/main/java/com/acme/app/MainActivity.kt'],
      );
      assert.deepEqual(
        fixtureRelative(fixture, [IOSConfig.Paths.getAppDelegateFilePath(fixture)]),
        ['ios/App/AppDelegate.swift'],
      );
      assert.deepEqual(fixtureRelative(fixture, IOSConfig.Paths.getAllInfoPlistPaths(fixture)), [
        'ios/App/Info.plist',
        'ios/AppTests/Info.plist',
      ]);
    },
  );
});

test('@joshwooding/vite-plugin-react-docgen-typescript@0.5.0 builds its program from glob 14 matches', async () => {
  const { consumerRequire } = patchedGlobConsumer(
    '@joshwooding/vite-plugin-react-docgen-typescript@0.5.0',
  );
  const reactDocgenTypescript = consumerRequire('@joshwooding/vite-plugin-react-docgen-typescript');
  const source = [
    'export interface ButtonProps {',
    '  /** Visible button label. */',
    '  label: string;',
    '}',
    'export function Button(props: ButtonProps) {',
    '  return <button type="button">{props.label}</button>;',
    '}',
    '',
  ].join('\n');
  await withFixture({ 'src/nested/Button.tsx': source }, async (fixture) => {
    const include = path.posix.join(fixture.split(path.sep).join('/'), 'src/**/*.tsx');
    const plugin = reactDocgenTypescript({ include: [include], compilerOptions: {} });
    await plugin.configResolved();
    const result = await plugin.transform(source, path.join(fixture, 'src/nested/Button.tsx'));
    assert.ok(result?.code, 'the glob-discovered component produced no docgen block');
    assert.match(result.code, /Button\.__docgenInfo/);
    assert.match(result.code, /Visible button label\./);
  });
});

// typedoc 0.28.x declares minimatch ^10 and its glob discovery calls
// Minimatch#matchOne, which minimatch 11 removed. No typedoc release supports
// minimatch 11, so minimatch is deliberately NOT overridden to 11 for typedoc
// (GHSA-g3hv-75wg-m249 stays reported until typedoc leaves or supports 11).
for (const [snapshotKey, snapshot] of Object.entries(lock.snapshots ?? {}).filter(([key]) =>
  key.startsWith('typedoc@'),
)) {
  test(`${snapshotKey} keeps a minimatch its entry-point discovery can run on`, async () => {
    const { consumerRequire } = installedConsumer(snapshotIdentity(snapshotKey));
    const locked = snapshot.dependencies?.minimatch;
    assert.ok(locked, `${snapshotKey} has no locked minimatch`);
    assert.equal(installedPackage(consumerRequire, 'minimatch').manifest.version, locked);
    const { Minimatch } = consumerRequire('minimatch');
    assert.equal(typeof new Minimatch('src/**/*.ts').matchOne, 'function');
    const { Application } = await import(pathToFileURL(consumerRequire.resolve('typedoc')).href);
    await withFixture(
      {
        'src/index.ts': "export * from './nested/value.js';\n",
        'src/nested/value.ts': '/** Documented value. */\nexport const value = 1;\n',
        'tsconfig.json': JSON.stringify({
          compilerOptions: { module: 'nodenext', moduleResolution: 'nodenext', strict: true },
          include: ['src'],
        }),
      },
      async (fixture) => {
        const app = await Application.bootstrap({
          entryPoints: [path.posix.join(fixture.split(path.sep).join('/'), 'src/**/*.ts')],
          tsconfig: path.join(fixture, 'tsconfig.json'),
          logLevel: 'Error',
          readme: 'none',
          skipErrorChecking: true,
        });
        const project = await app.convert();
        assert.ok(project, 'typedoc did not convert the glob-discovered entry points');
        assert.ok(project.getChildByName(['nested/value', 'value']));
      },
    );
  });
}

for (const [importerPath, importer] of rateLimitImporters) {
  test(`${importerPath} retains IPv4 and IPv6 rate-limit key boundaries`, () => {
    const locked = importer.dependencies['express-rate-limit'].version;
    assert.equal(typeof locked, 'string');
    const snapshot = lock.snapshots[`express-rate-limit@${locked}`];
    assert.ok(snapshot, `missing rate-limit snapshot for ${importerPath}`);
    assert.equal(snapshot.dependencies?.['ip-address'], '10.7.4');
    const importerRequire = createRequire(path.join(root, importerPath, 'package.json'));
    const limiter = installedPackage(importerRequire, 'express-rate-limit');
    assert.equal(limiter.manifest.version, locked.split('(')[0]);
    const limiterRequire = createRequire(limiter.entry);
    assert.equal(installedPackage(limiterRequire, 'ip-address').manifest.version, '10.7.4');
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
  const version = '10.1.4';
  const manifest = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const workspace = parseYaml(readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8'));
  // A manifest-only bump can pass frozen installs while an older override wins.
  assert.equal(manifest.dependencies.nodemailer, `^${version}`);
  assert.equal(workspace.overrides.nodemailer, version);
  assert.equal(lock.overrides.nodemailer, version);
  assert.deepEqual(lock.importers?.['.']?.dependencies?.nodemailer, {
    specifier: version,
    version,
  });
  for (const entries of [lock.packages, lock.snapshots]) {
    assert.deepEqual(
      Object.keys(entries).filter((key) => key.startsWith('nodemailer@')),
      [`nodemailer@${version}`],
    );
  }
  assert.equal(installedPackage(rootRequire, 'nodemailer').manifest.version, version);
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
