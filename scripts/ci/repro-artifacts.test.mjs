import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs, {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { captureBuild, compareBuilds, prepareBuild } from './repro-artifacts.mjs';

const SOURCE = 'a'.repeat(40);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function fixture(t) {
  const base = mkdtempSync(join(tmpdir(), 'repro-contract-'));
  const root = join(base, 'repo');
  const outputDir = join(base, 'proof');
  mkdirSync(root);
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const plan = { version: '1', scm: { type: 'git', sha: SOURCE }, tasks: [] };
  const put = (filename, content) => {
    const target = join(root, filename);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    return target;
  };
  function task(
    directory,
    {
      name = `@test/${directory.replaceAll('/', '-')}`,
      command = 'build-package',
      task = 'build',
      outputs = ['.next/**', 'build/**', 'dist/**'],
    } = {},
  ) {
    put(`${directory}/package.json`, JSON.stringify({ name, scripts: { [task]: command } }));
    const entry = {
      taskId: `${name}#${task}`,
      task,
      directory,
      package: name,
      command,
      resolvedTaskDefinition: { outputs },
    };
    plan.tasks.push(entry);
    return entry;
  }
  const capture = (label) => captureBuild({ root, outputDir, sourceSha: SOURCE, plan, label });
  return { base, root, outputDir, plan, put, task, capture };
}

// Interpose only the scheduling boundary. Every descriptor, stat, replacement
// and byte read remains a native filesystem operation on this test's files.
function withNativeFsHooks(hooks, action) {
  const original = Object.fromEntries(Object.keys(hooks).map((name) => [name, fs[name]]));
  try {
    for (const [name, hook] of Object.entries(hooks)) fs[name] = hook(original[name]);
    syncBuiltinESMExports();
    return action();
  } finally {
    Object.assign(fs, original);
    syncBuiltinESMExports();
  }
}

function proofFixture(t) {
  const f = fixture(t);
  f.task('packages/one');
  f.put('packages/one/dist/index.js', 'inside');
  f.capture('A');
  f.capture('B');
  return { ...f, target: join(f.outputDir, 'capture_A.json') };
}

test('a proof pathname replacement cannot redirect the checked JSON read', (t) => {
  const f = proofFixture(t);
  const { target } = f;
  const outside = join(f.base, 'outside.json');
  writeFileSync(outside, readFileSync(target));
  const originalStat = fs.lstatSync(target);
  const outsideStat = fs.lstatSync(outside);
  const nativeStat = fs.statSync;
  const nativeFstat = fs.fstatSync;
  let replaced = false;
  let outsideReads = 0;
  const replaceAfterCheck = (stat) => {
    if (
      !replaced &&
      BigInt(stat.dev) === BigInt(originalStat.dev) &&
      BigInt(stat.ino) === BigInt(originalStat.ino)
    ) {
      fs.renameSync(target, `${target}.original`);
      symlinkSync(outside, target);
      replaced = true;
    }
    return stat;
  };
  let error;
  withNativeFsHooks(
    {
      lstatSync:
        (native) =>
        (...args) =>
          replaceAfterCheck(native(...args)),
      fstatSync:
        (native) =>
        (...args) =>
          replaceAfterCheck(native(...args)),
      readFileSync:
        (native) =>
        (filename, ...args) => {
          const stat = typeof filename === 'number' ? nativeFstat(filename) : nativeStat(filename);
          if (stat.dev === outsideStat.dev && stat.ino === outsideStat.ino) outsideReads++;
          return native(filename, ...args);
        },
      readSync:
        (native) =>
        (fd, ...args) => {
          const stat = nativeFstat(fd);
          if (stat.dev === outsideStat.dev && stat.ino === outsideStat.ino) outsideReads++;
          return native(fd, ...args);
        },
    },
    () => {
      try {
        compareBuilds(f.outputDir);
      } catch (caught) {
        error = caught;
      }
    },
  );
  assert.equal(replaced, true);
  assert.equal(outsideReads, 0, 'replacement bytes must never be read');
  assert.match(error?.message || '', /proof JSON file changed/);
  assert.equal(existsSync(join(f.outputDir, 'comparison.json')), false);
});

for (const change of [
  'growth',
  'truncation',
  'same-size write',
  'regular replacement',
  'removal',
]) {
  test(`proof JSON ${change} after descriptor validation fails closed`, (t) => {
    const f = proofFixture(t);
    const before = fs.statSync(f.target, { bigint: true });
    const originalContent = readFileSync(f.target, 'utf8');
    const nativeFstat = fs.fstatSync;
    let changed = false;
    let bytesRead = 0;
    let error;
    withNativeFsHooks(
      {
        fstatSync:
          (native) =>
          (...args) => {
            const stat = native(...args);
            if (!changed && BigInt(stat.dev) === before.dev && BigInt(stat.ino) === before.ino) {
              changed = true;
              if (change === 'growth')
                fs.truncateSync(f.target, Number(before.size) + 32 * 1024 * 1024);
              if (change === 'truncation') fs.truncateSync(f.target, Number(before.size) - 1);
              if (change === 'same-size write') {
                const content = originalContent.replace('"label": "A"', '"label": "Z"');
                writeFileSync(f.target, content);
                // Restoring mtime cannot hide the native ctime/content change.
                utimesSync(f.target, Number(before.atimeMs) / 1000, Number(before.mtimeMs) / 1000);
              }
              if (change === 'regular replacement' || change === 'removal') {
                fs.renameSync(f.target, `${f.target}.original`);
                if (change === 'regular replacement') writeFileSync(f.target, originalContent);
              }
            }
            return stat;
          },
        readSync:
          (native) =>
          (fd, ...args) => {
            const stat = nativeFstat(fd, { bigint: true });
            const count = native(fd, ...args);
            if (stat.dev === before.dev && stat.ino === before.ino) bytesRead += count;
            return count;
          },
      },
      () => {
        try {
          compareBuilds(f.outputDir);
        } catch (caught) {
          error = caught;
        }
      },
    );
    assert.equal(changed, true);
    if (change === 'removal') assert.equal(error?.code, 'ENOENT');
    else assert.match(error?.message || '', /proof JSON file changed/);
    assert.ok(bytesRead <= Number(before.size) + 1, 'reads remain bounded by the admitted size');
    if (change === 'growth') assert.equal(bytesRead, Number(before.size) + 1);
    assert.equal(existsSync(join(f.outputDir, 'comparison.json')), false);
  });
}

test('symlink and oversized proof JSON inputs are rejected before reading bytes', (t) => {
  const f = proofFixture(t);
  fs.renameSync(f.target, `${f.target}.original`);
  symlinkSync(`${f.target}.original`, f.target);
  let reads = 0;
  withNativeFsHooks(
    {
      readSync:
        (native) =>
        (...args) => {
          reads++;
          return native(...args);
        },
    },
    () => {
      assert.throws(() => compareBuilds(f.outputDir), { code: 'ELOOP' });
      rmSync(f.target);
      fs.renameSync(`${f.target}.original`, f.target);
      fs.truncateSync(f.target, 16 * 1024 * 1024 + 1);
      assert.throws(() => compareBuilds(f.outputDir), /invalid proof JSON file/);
    },
  );
  assert.equal(reads, 0);
  assert.equal(existsSync(join(f.outputDir, 'comparison.json')), false);
});

test('a FIFO proof JSON input fails promptly without waiting for a writer', (t) => {
  const f = proofFixture(t);
  rmSync(f.target);
  const fifo = spawnSync('mkfifo', [f.target], { encoding: 'utf8' });
  assert.equal(fifo.status, 0, fifo.stderr);
  const result = spawnSync(
    process.execPath,
    [join(repositoryRoot, 'scripts/ci/repro-artifacts.mjs'), 'compare', f.outputDir],
    { encoding: 'utf8', timeout: 5000 },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /invalid proof JSON file/);
  assert.equal(existsSync(join(f.outputDir, 'comparison.json')), false);
});

test('short native reads and a read-driven atime update retain a valid comparison', (t) => {
  const f = proofFixture(t);
  const original = fs.statSync(f.target);
  utimesSync(f.target, new Date(0), original.mtime);
  const before = fs.statSync(f.target, { bigint: true });
  let reads = 0;
  const result = withNativeFsHooks(
    {
      readSync: (native) => (fd, buffer, offset, length, position) => {
        reads++;
        return native(fd, buffer, offset, Math.min(length, 7), position);
      },
    },
    () => compareBuilds(f.outputDir),
  );
  const after = fs.statSync(f.target, { bigint: true });
  assert.equal(result.status, 'PASS');
  assert.ok(reads > 2);
  assert.equal(after.mtimeNs, before.mtimeNs);
  assert.equal(after.ctimeNs, before.ctimeNs);
  t.diagnostic(`native read updated atime: ${after.atimeNs > before.atimeNs}`);
});

for (const outcome of ['success', 'invalid JSON', 'metadata failure', 'read failure']) {
  test(`proof JSON descriptors close after ${outcome}`, (t) => {
    const f = proofFixture(t);
    if (outcome === 'invalid JSON') writeFileSync(f.target, '{');
    const descriptors = [];
    let error;
    withNativeFsHooks(
      {
        openSync:
          (native) =>
          (...args) => {
            const fd = native(...args);
            if ([f.target, join(f.outputDir, 'capture_B.json')].includes(args[0]))
              descriptors.push(fd);
            return fd;
          },
        fstatSync:
          (native) =>
          (...args) => {
            if (outcome === 'metadata failure') throw new Error('injected metadata failure');
            return native(...args);
          },
        readSync:
          (native) =>
          (...args) => {
            if (outcome === 'read failure') throw new Error('injected read failure');
            return native(...args);
          },
      },
      () => {
        try {
          compareBuilds(f.outputDir);
        } catch (caught) {
          error = caught;
        }
      },
    );
    assert.equal(descriptors.length, outcome === 'success' ? 2 : 1);
    for (const fd of descriptors) assert.throws(() => fs.fstatSync(fd), { code: 'EBADF' });
    if (outcome === 'success') assert.equal(error, undefined);
    else {
      assert.ok(error);
      assert.equal(existsSync(join(f.outputDir, 'comparison.json')), false);
    }
  });
}

test('captures actual nested workspace outputs and preserves paths, bytes and modes', (t) => {
  const f = fixture(t);
  f.task('artifacts/site');
  f.task('packages/sdk');
  f.put('artifacts/site/dist/public/index.html', '<h1>owned build</h1>');
  f.put('packages/sdk/build/file with spaces.js', 'export const value = 1;');
  const result = f.capture('A');
  assert.equal(result.tasks.length, 2);
  assert.deepEqual(
    result.files.map((file) => file.path),
    ['artifacts/site/dist/public/index.html', 'packages/sdk/build/file with spaces.js'],
  );
  assert.ok(result.files.every((file) => file.bytes > 0 && /^[0-9a-f]{64}$/.test(file.sha256)));
  const tar = spawnSync('tar', ['-tf', join(f.outputDir, 'build_A.tar')], { encoding: 'utf8' });
  assert.equal(tar.status, 0, tar.stderr);
  assert.deepEqual(
    tar.stdout.trim().split('\n'),
    result.files.map((file) => file.path),
  );
});

test('matching nonempty builds ignore filesystem mtimes but retain artifact equality', (t) => {
  const f = fixture(t);
  f.task('packages/one');
  const file = f.put('packages/one/dist/index.js', 'real bytes');
  f.capture('A');
  utimesSync(file, new Date(0), new Date(1234567890000));
  f.capture('B');
  const result = compareBuilds(f.outputDir);
  assert.equal(result.status, 'PASS');
  assert.equal(result.file_count, 1);
  assert.equal(result.source_sha, SOURCE);
});

for (const change of ['bytes', 'mode', 'path']) {
  test(`changed output ${change} fails instead of claiming reproducibility`, (t) => {
    const f = fixture(t);
    f.task('packages/one');
    const file = f.put('packages/one/dist/index.js', 'before');
    f.capture('A');
    if (change === 'bytes') writeFileSync(file, 'after');
    if (change === 'mode') chmodSync(file, 0o755);
    if (change === 'path') f.put('packages/one/dist/extra.js', 'additional');
    f.capture('B');
    assert.throws(() => compareBuilds(f.outputDir), /not reproducible/);
    assert.equal(existsSync(join(f.outputDir, 'comparison.json')), false);
  });
}

test('one successful task cannot hide another task with missing or all-empty outputs', (t) => {
  const f = fixture(t);
  f.task('packages/one');
  f.task('packages/two');
  f.put('packages/one/dist/index.js', 'present');
  assert.throws(() => f.capture('A'), /missing or empty task outputs: @test\/packages-two/);
  f.put('packages/two/dist/empty.js', '');
  assert.throws(() => f.capture('A'), /missing or empty task outputs/);
  assert.equal(existsSync(f.outputDir), false);
});

test('empty, unknown, duplicate and falsely nonexistent tasks cannot produce proof', (t) => {
  const f = fixture(t);
  assert.throws(() => f.capture('A'), /empty or invalid build plan/);
  const task = f.task('packages/one');
  f.put('packages/one/dist/index.js', 'present');
  task.command = '<NONEXISTENT>';
  assert.throws(() => f.capture('A'), /task command does not match source/);
  task.command = 'build-package';
  task.resolvedTaskDefinition.outputs = [];
  assert.throws(() => f.capture('A'), /undeclared build outputs/);
  task.resolvedTaskDefinition.outputs = ['dist/**/*.js'];
  assert.throws(() => f.capture('A'), /unreviewed output pattern/);
  task.resolvedTaskDefinition.outputs = ['dist/**'];
  f.plan.tasks.push(task);
  assert.throws(() => f.capture('A'), /invalid or duplicate build task/);
});

test('empty-output estate task requires its exact reviewed identity and real manifest', (t) => {
  const f = fixture(t);
  f.task('packages/estate-contract-release', {
    name: '@szl-holdings/estate-contract-release',
    command: 'node src/build.mjs',
    outputs: [],
  });
  assert.throws(() => f.capture('A'), /missing or empty task outputs/);
  f.put('packages/estate-contract-release/manifest.json', '{"release_id":"owned-fixture"}');
  assert.deepEqual(
    f.capture('A').files.map((file) => file.path),
    ['packages/estate-contract-release/manifest.json'],
  );
});

test('declared codegen sibling outputs are included while repository escapes fail', (t) => {
  const f = fixture(t);
  const task = f.task('lib/api-spec', {
    name: '@szl-holdings/api-spec',
    command: 'node ./scripts/codegen.mjs',
    task: 'codegen',
    outputs: ['../api-client-react/src/generated/**'],
  });
  f.put('lib/api-client-react/src/generated/client.ts', 'export {};');
  assert.equal(f.capture('A').files[0].path, 'lib/api-client-react/src/generated/client.ts');
  task.resolvedTaskDefinition.outputs = ['../../../outside/**'];
  assert.throws(() => f.capture('B'), /output escapes repository/);
});

for (const linked of ['output root', 'output member', 'task manifest']) {
  test(`symbolic link at ${linked} cannot enter the proof`, (t) => {
    const f = fixture(t);
    f.task('packages/one');
    const outside = join(f.base, 'outside');
    mkdirSync(outside);
    writeFileSync(join(outside, 'index.js'), 'outside');
    if (linked === 'output root') symlinkSync(outside, join(f.root, 'packages/one/dist'));
    if (linked === 'output member') {
      f.put('packages/one/dist/index.js', 'inside');
      symlinkSync(join(outside, 'index.js'), join(f.root, 'packages/one/dist/link.js'));
    }
    if (linked === 'task manifest') {
      rmSync(join(f.root, 'packages/one/package.json'));
      symlinkSync(join(outside, 'index.js'), join(f.root, 'packages/one/package.json'));
    }
    assert.throws(() => f.capture('A'), /symbolic link/);
  });
}

test('mismatched source, dependency outputs, and proof inside checkout are rejected', (t) => {
  const f = fixture(t);
  const task = f.task('packages/one');
  f.put('packages/one/dist/index.js', 'inside');
  f.plan.scm.sha = 'b'.repeat(40);
  assert.throws(() => f.capture('A'), /source does not match/);
  f.plan.scm.sha = SOURCE;
  task.resolvedTaskDefinition.outputs = ['node_modules/**'];
  assert.throws(() => f.capture('A'), /dependency or Git internals/);
  task.resolvedTaskDefinition.outputs = ['dist/**'];
  assert.throws(
    () => captureBuild({ ...f, sourceSha: SOURCE, label: 'A', outputDir: join(f.root, 'proof') }),
    /outside the checkout/,
  );
});

test('an archiver failure propagates without an empty tar or success receipt fallback', (t) => {
  const f = fixture(t);
  f.task('packages/one');
  f.put('packages/one/dist/index.js', 'inside');
  const bin = join(f.base, 'bin');
  mkdirSync(bin);
  const tar = join(bin, 'tar');
  writeFileSync(tar, '#!/bin/sh\nexit 71\n', { mode: 0o755 });
  const before = process.env.PATH;
  process.env.PATH = `${bin}:${before}`;
  t.after(() => {
    process.env.PATH = before;
  });
  assert.throws(() => f.capture('A'), /artifact archive failed: 71/);
  assert.equal(existsSync(join(f.outputDir, 'capture_A.json')), false);
});

test('matching empty receipts and tampered stored archives cannot pass comparison', (t) => {
  const f = fixture(t);
  mkdirSync(f.outputDir);
  for (const label of ['A', 'B'])
    writeFileSync(
      join(f.outputDir, `capture_${label}.json`),
      JSON.stringify({
        schema: 'platform-build-capture/v1',
        label,
        source_sha: SOURCE,
        files: [],
        tasks: [],
      }),
    );
  assert.throws(() => compareBuilds(f.outputDir), /invalid or empty capture/);
  rmSync(f.outputDir, { recursive: true });
  f.task('packages/one');
  f.put('packages/one/dist/index.js', 'inside');
  f.capture('A');
  f.capture('B');
  writeFileSync(join(f.outputDir, 'build_B.tar'), 'tampered');
  assert.throws(() => compareBuilds(f.outputDir), /invalid or empty capture B/);
});

test('a no-op build cannot reuse tracked generated output or install-time incremental state', (t) => {
  const f = fixture(t);
  f.task('lib/api-spec', {
    name: '@szl-holdings/api-spec',
    task: 'codegen',
    command: 'node ./scripts/codegen.mjs',
    outputs: ['../api-client-react/src/generated/**'],
  });
  f.task('packages/estate-contract-release', {
    name: '@szl-holdings/estate-contract-release',
    command: 'node src/build.mjs',
    outputs: [],
  });
  const generated = f.put('lib/api-client-react/src/generated/api.ts', 'stale committed bytes');
  const manifest = f.put('packages/estate-contract-release/manifest.json', '{"stale":true}');
  const incremental = f.put('lib/api-spec/tsconfig.tsbuildinfo', 'stale compiler state');
  const source = f.put('lib/api-spec/openapi.yaml', 'openapi: 3.0.0');
  const prepared = prepareBuild(f.root, f.plan, SOURCE);
  assert.equal(prepared.task_count, 2);
  assert.equal(existsSync(generated), false);
  assert.equal(existsSync(manifest), false);
  assert.equal(existsSync(incremental), false);
  assert.equal(readFileSync(source, 'utf8'), 'openapi: 3.0.0');
  assert.throws(() => f.capture('A'), /missing or empty task outputs/);
  f.put('lib/api-client-react/src/generated/api.ts', 'fresh generated bytes');
  f.put('packages/estate-contract-release/manifest.json', '{"fresh":true}');
  assert.equal(f.capture('A').tasks.length, 2);
});

test('cleanup validates all roots before deleting any output and rejects unreviewed source roots', (t) => {
  const f = fixture(t);
  f.task('packages/one');
  const task = f.task('packages/two');
  const existing = f.put('packages/one/dist/index.js', 'preserve on invalid plan');
  task.resolvedTaskDefinition.outputs = ['../../scripts/**'];
  f.put('scripts/owned-source.js', 'source');
  assert.throws(() => prepareBuild(f.root, f.plan, SOURCE), /unreviewed generated output root/);
  assert.equal(readFileSync(existing, 'utf8'), 'preserve on invalid plan');
});

const workflow = readFileSync(join(repositoryRoot, '.github/workflows/repro-check.yml'), 'utf8');
function stepScript(name) {
  const marker = `      - name: ${name}\n`;
  const start = workflow.indexOf(marker);
  assert.notEqual(start, -1);
  const end = workflow.indexOf('\n      - ', start + marker.length);
  const step = workflow.slice(start, end === -1 ? undefined : end);
  const run = step.indexOf('        run: |\n');
  assert.notEqual(run, -1);
  return step
    .slice(run + '        run: |\n'.length)
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
}

test('workflow uses fresh exact source, frozen scripts, narrow ONNX skip and disabled build caches', () => {
  assert.equal((workflow.match(/ref: \$\{\{ github.sha \}\}/g) || []).length, 2);
  assert.equal((workflow.match(/clean: true/g) || []).length, 2);
  assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 2);
  assert.equal(
    (workflow.match(/pnpm install --frozen-lockfile --side-effects-cache=false/g) || []).length,
    2,
  );
  assert.equal((workflow.match(/node scripts\/ci\/verify-onnx-cpu.mjs/g) || []).length, 2);
  assert.match(workflow, /ONNXRUNTIME_NODE_INSTALL: skip/);
  assert.doesNotMatch(
    workflow,
    /--ignore-scripts|continue-on-error|\|\| true|\|\| echo|tar[^\n]*\/dev\/null/,
  );
  for (const label of ['A', 'B']) {
    const script = stepScript(`Build and capture ${label}`);
    assert.match(script, /pnpm exec turbo run build --cache=local:,remote: --concurrency=2/);
    assert.ok(script.indexOf('repro-artifacts.mjs prepare') < script.indexOf('--concurrency=2'));
    assert.doesNotMatch(script, /--filter|--if-present/);
  }
});

for (const label of ['A', 'B']) {
  test(`${label} frozen install failure stops the actual workflow before source readback`, (t) => {
    const f = fixture(t);
    const bin = join(f.base, 'bin');
    mkdirSync(bin);
    writeFileSync(join(bin, 'pnpm'), '#!/bin/sh\nexit 41\n', { mode: 0o755 });
    writeFileSync(join(bin, 'git'), '#!/bin/sh\nexit 99\n', { mode: 0o755 });
    const result = spawnSync(
      'bash',
      ['-e', '-o', 'pipefail', '-c', stepScript(`Install ${label} from lockfile`)],
      {
        cwd: f.root,
        encoding: 'utf8',
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
      },
    );
    assert.equal(result.status, 41, result.stderr);
  });
  for (const failure of ['plan', 'build']) {
    test(`${label} ${failure} failure stops the actual workflow script before artifact capture`, (t) => {
      const f = fixture(t);
      const bin = join(f.base, 'bin');
      mkdirSync(bin);
      writeFileSync(join(bin, 'git'), `#!/bin/sh\nprintf '%s\\n' '${SOURCE}'\n`, { mode: 0o755 });
      writeFileSync(
        join(bin, 'pnpm'),
        `#!/bin/sh\ncase "$*" in *--dry=json*) ${failure === 'plan' ? 'exit 37' : "printf '{}'; exit 0"};; *) exit 42;; esac\n`,
        { mode: 0o755 },
      );
      // These cases isolate upstream failure propagation; preparation has its
      // own real-filesystem stale-output controls above.
      writeFileSync(join(bin, 'node'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
      mkdirSync(join(f.base, 'platform-repro'));
      const result = spawnSync(
        'bash',
        ['-e', '-o', 'pipefail', '-c', stepScript(`Build and capture ${label}`)],
        {
          cwd: f.root,
          encoding: 'utf8',
          env: {
            ...process.env,
            PATH: `${bin}:${process.env.PATH}`,
            RUNNER_TEMP: f.base,
            GITHUB_SHA: SOURCE,
          },
        },
      );
      assert.equal(result.status, failure === 'plan' ? 37 : 42, result.stderr);
      assert.equal(existsSync(join(f.base, 'platform-repro', `capture_${label}.json`)), false);
    });
  }
}
