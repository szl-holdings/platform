import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBuild, verifyBuildWitness, WITNESS_PATH } from './capture-cyber-build-witness.mjs';

test('native CommonJS loading can import the witness helpers without running the CLI', () => {
  const helper = fileURLToPath(new URL('./capture-cyber-build-witness.mjs', import.meta.url));
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=commonjs',
      '-e',
      'const helper = require(process.argv[2]); process.stdout.write(typeof helper.verifyBuildWitness);',
      'playwright-loader',
      helper,
    ],
    { encoding: 'utf8', stdio: 'pipe' },
  );
  assert.equal(output, 'function');
});

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cyber-build-witness-'));
  const git = (...args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  try {
    await mkdir(path.join(root, 'artifacts/a11oy'), { recursive: true });
    await writeFile(path.join(root, '.gitignore'), 'artifacts/a11oy/dist/\n.env*\n');
    await writeFile(path.join(root, 'artifacts/a11oy/source.txt'), 'reviewed presentation\n');
    git('init', '--quiet');
    git('add', '.');
    git(
      '-c',
      'user.name=Offline fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'fixture',
    );
    const build = async () => {
      await mkdir(path.join(root, 'artifacts/a11oy/dist/public/assets'), { recursive: true });
      await writeFile(
        path.join(root, 'artifacts/a11oy/dist/public/index.html'),
        '<html>fixture</html>',
      );
      await writeFile(path.join(root, 'artifacts/a11oy/dist/public/assets/app.js'), 'void 0;');
    };
    await run({ root, build, git });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('witness binds a clean exact source, successful build, and output bytes', async () =>
  fixture(async ({ root, build }) => {
    const witness = await captureBuild(root, { BASE_PATH: '/' }, build);
    assert.equal((await verifyBuildWitness(root, witness)).source_sha, witness.source_sha);
    assert.deepEqual(JSON.parse(await readFile(path.join(root, WITNESS_PATH), 'utf8')), witness);
    await writeFile(path.join(root, 'artifacts/a11oy/dist/public/assets/app.js'), 'changed output');
    await assert.rejects(verifyBuildWitness(root, witness), /does not match/);
  }));

test('native verifier CLI returns only validated witness JSON and rejects tampering or arguments', async () =>
  fixture(async ({ root, build }) => {
    const helper = fileURLToPath(new URL('./capture-cyber-build-witness.mjs', import.meta.url));
    const cli = (...args) =>
      execFileSync(process.execPath, [helper, ...args], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    assert.throws(() => cli('--verify'));
    const witness = await captureBuild(root, { BASE_PATH: '/' }, build);
    assert.deepEqual(JSON.parse(cli('--verify')), witness);
    assert.throws(() => cli('--verify', 'extra'));
    assert.throws(() => cli('--unknown'));
    await writeFile(
      path.join(root, WITNESS_PATH),
      JSON.stringify({ ...witness, source_sha: '0'.repeat(40) }),
    );
    assert.throws(() => cli('--verify'));
    await writeFile(path.join(root, WITNESS_PATH), JSON.stringify(witness));
    await writeFile(path.join(root, 'artifacts/a11oy/dist/public/assets/app.js'), 'changed bytes');
    assert.throws(() => cli('--verify'));
  }));

test('failed build propagates its error and removes any earlier successful witness', async () =>
  fixture(async ({ root, build }) => {
    await captureBuild(root, { BASE_PATH: '/' }, build);
    const failure = Object.assign(new Error('build failed'), { status: 7 });
    await assert.rejects(
      captureBuild(root, { BASE_PATH: '/' }, () => {
        throw failure;
      }),
      (error) => error === failure,
    );
    await assert.rejects(readFile(path.join(root, WITNESS_PATH)), { code: 'ENOENT' });
  }));

test('dirty source is refused before invoking the build', async () =>
  fixture(async ({ root }) => {
    await writeFile(path.join(root, 'artifacts/a11oy/source.txt'), 'unreviewed');
    let invoked = false;
    await assert.rejects(
      captureBuild(root, { BASE_PATH: '/' }, () => {
        invoked = true;
      }),
      /not clean/,
    );
    assert.equal(invoked, false);
  }));

test('source mutation during build cannot mint a witness', async () =>
  fixture(async ({ root, build }) => {
    await assert.rejects(
      captureBuild(root, { BASE_PATH: '/' }, async () => {
        await build();
        await writeFile(path.join(root, 'artifacts/a11oy/source.txt'), 'changed during build');
      }),
      /not clean/,
    );
    await assert.rejects(readFile(path.join(root, WITNESS_PATH)), { code: 'ENOENT' });
  }));

test('wrong workflow source and uncontrolled build environment are refused', async () =>
  fixture(async ({ root, build }) => {
    for (const environment of [
      { BASE_PATH: '/', GITHUB_SHA: '0'.repeat(40) },
      { BASE_PATH: '/a11oy/' },
      { BASE_PATH: '/', VITE_DEMO_ALLOWED: 'true' },
      { BASE_PATH: '/', VITE_BACKEND: 'https://example.invalid' },
    ])
      await assert.rejects(
        captureBuild(root, environment, build),
        /workflow source|environment override/,
      );
    await writeFile(path.join(root, '.env.local'), 'VITE_DEMO_ALLOWED=true');
    await assert.rejects(captureBuild(root, { BASE_PATH: '/' }, build), /environment file/);
  }));

test('source, tree, base, command, and scope substitutions cannot pass verification', async () =>
  fixture(async ({ root, build }) => {
    const witness = await captureBuild(root, { BASE_PATH: '/' }, build);
    for (const mutation of [
      { source_sha: '0'.repeat(40) },
      { source_tree: '0'.repeat(40) },
      { base_path: '/a11oy/' },
      { build_command: 'true' },
      { scope: 'deployment' },
    ])
      await assert.rejects(verifyBuildWitness(root, { ...witness, ...mutation }), /does not match/);
  }));

test('committed .env.example is admitted but an ignored untracked template is not', async () =>
  fixture(async ({ root, build, git }) => {
    const template = path.join(root, '.env.example');
    await writeFile(template, 'EXAMPLE_ONLY=\n');
    await assert.rejects(captureBuild(root, { BASE_PATH: '/' }, build), /environment file/);
    git('add', '-f', '.env.example');
    git(
      '-c',
      'user.name=Offline fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'tracked template',
    );
    const witness = await captureBuild(root, { BASE_PATH: '/' }, build);
    await verifyBuildWitness(root, witness);
    await writeFile(path.join(root, '.env.production'), 'VITE_DEMO_ALLOWED=true');
    await assert.rejects(captureBuild(root, { BASE_PATH: '/' }, build), /environment file/);
  }));
