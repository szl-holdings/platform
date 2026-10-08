import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const sha40 = /^[0-9a-f]{40}$/;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const comparePaths = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const fail = (message) => {
  throw new Error(message);
};

function inside(root, candidate) {
  const suffix = relative(root, candidate);
  return suffix !== '' && !isAbsolute(suffix) && suffix !== '..' && !suffix.startsWith(`..${sep}`);
}

function readJson(filename) {
  // Check and consume one inode. A path-based read after lstat could follow a
  // replacement symlink; NONBLOCK also lets us reject a FIFO without waiting.
  const fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.size > 16n * 1024n * 1024n) fail('invalid proof JSON file');
    const size = Number(before.size);
    const bytes = Buffer.alloc(size + 1);
    let length = 0;
    while (length < bytes.length) {
      const count = readSync(fd, bytes, length, Math.min(bytes.length - length, 64 * 1024), null);
      if (count === 0) break;
      length += count;
    }
    const after = fstatSync(fd, { bigint: true });
    const pathAfter = lstatSync(filename, { bigint: true });
    // atime may change from this read; identity, content and access metadata may not.
    const fields = ['dev', 'ino', 'mode', 'nlink', 'uid', 'gid', 'size', 'mtimeNs', 'ctimeNs'];
    if (
      length !== size ||
      !pathAfter.isFile() ||
      fields.some((field) => before[field] !== after[field] || before[field] !== pathAfter[field])
    )
      fail('proof JSON file changed during read');
    return JSON.parse(bytes.subarray(0, length).toString('utf8'));
  } finally {
    closeSync(fd);
  }
}

function safeStat(root, filename) {
  if (!inside(root, filename)) fail(`output escapes repository: ${filename}`);
  let current = root;
  for (const component of relative(root, filename).split(sep)) {
    if (component === 'node_modules' || component === '.git')
      fail('dependency or Git internals are not build outputs');
    current = join(current, component);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
    if (stat.isSymbolicLink())
      fail(`symbolic link is not reproducibility proof: ${relative(root, current)}`);
  }
  return lstatSync(filename);
}

function collectFiles(root, filename, files) {
  const stat = safeStat(root, filename);
  if (!stat) return;
  if (stat.isDirectory()) {
    for (const child of readdirSync(filename).sort(comparePaths))
      collectFiles(root, join(filename, child), files);
  } else if (stat.isFile()) {
    if (stat.size > 512 * 1024 * 1024 || files.size >= 100000)
      fail('build output exceeds proof bound');
    const bytes = readFileSync(filename);
    if (bytes.length !== stat.size) fail('build output changed during capture');
    files.set(relative(root, filename).split(sep).join('/'), {
      path: relative(root, filename).split(sep).join('/'),
      bytes: bytes.length,
      mode: stat.mode & 0o777,
      sha256: sha256(bytes),
    });
  } else {
    fail(`nonregular build output: ${relative(root, filename)}`);
  }
}

function declaredTasks(root, plan, sourceSha) {
  root = resolve(root);
  if (
    !sha40.test(sourceSha) ||
    plan?.version !== '1' ||
    plan.scm?.type !== 'git' ||
    plan.scm.sha !== sourceSha
  ) {
    fail('build plan source does not match checkout');
  }
  if (!Array.isArray(plan.tasks) || plan.tasks.length === 0 || plan.tasks.length > 4096)
    fail('empty or invalid build plan');
  const seen = new Set();
  const tasks = [];
  for (const task of plan.tasks) {
    if (
      !task ||
      typeof task.directory !== 'string' ||
      !/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(task.directory) ||
      task.directory.split('/').some((part) => part === '.' || part === '..') ||
      !['build', 'codegen'].includes(task.task) ||
      typeof task.package !== 'string' ||
      task.taskId !== `${task.package}#${task.task}` ||
      seen.has(task.taskId)
    )
      fail('invalid or duplicate build task');
    seen.add(task.taskId);
    const directory = resolve(root, task.directory);
    const manifestPath = join(directory, 'package.json');
    if (!safeStat(root, manifestPath)) fail(`missing task manifest: ${task.taskId}`);
    const manifest = readJson(manifestPath);
    const declaredCommand = manifest.scripts?.[task.task];
    if (task.command === '<NONEXISTENT>' && !declaredCommand) continue;
    if (
      typeof task.command !== 'string' ||
      !task.command.trim() ||
      manifest.name !== task.package ||
      declaredCommand !== task.command
    )
      fail(`task command does not match source: ${task.taskId}`);
    let outputs = task.resolvedTaskDefinition?.outputs;
    if (!Array.isArray(outputs)) fail(`missing output declaration: ${task.taskId}`);
    // This existing task writes a canonical manifest outside dist/build and
    // disables Turbo caching intentionally. No other empty declaration passes.
    if (
      outputs.length === 0 &&
      task.taskId === '@szl-holdings/estate-contract-release#build' &&
      task.directory === 'packages/estate-contract-release' &&
      task.command === 'node src/build.mjs'
    ) {
      outputs = ['manifest.json'];
    }
    if (outputs.length === 0) fail(`undeclared build outputs: ${task.taskId}`);
    const roots = [];
    for (const output of outputs) {
      if (typeof output !== 'string' || !output || isAbsolute(output) || output.includes('\\'))
        fail('invalid output pattern');
      const isTree = output.endsWith('/**');
      const base = isTree ? output.slice(0, -3) : output;
      if (
        !base ||
        [...base].some(
          (character) =>
            character.charCodeAt(0) < 32 ||
            character.charCodeAt(0) === 127 ||
            '*?[]{}!'.includes(character),
        )
      )
        fail(`unreviewed output pattern: ${output}`);
      const filename = resolve(directory, base);
      const stat = safeStat(root, filename);
      if (stat && (isTree ? !stat.isDirectory() : !stat.isFile()))
        fail(`output type does not match declaration: ${output}`);
      const defaultOutput =
        task.task === 'build' && ['dist/**', 'build/**', '.next/**'].includes(output);
      const apiOutput =
        task.taskId === '@szl-holdings/api-spec#codegen' &&
        task.directory === 'lib/api-spec' &&
        task.command === 'node ./scripts/codegen.mjs' &&
        ['../api-client-react/src/generated/**', '../api-zod/src/generated/**'].includes(output);
      const manifestOutput =
        task.taskId === '@szl-holdings/estate-contract-release#build' &&
        task.directory === 'packages/estate-contract-release' &&
        task.command === 'node src/build.mjs' &&
        output === 'manifest.json';
      if (!defaultOutput && !apiOutput && !manifestOutput)
        fail(`unreviewed generated output root: ${output}`);
      roots.push(filename);
    }
    tasks.push({ task: task.taskId, directory: task.directory, command: task.command, roots });
  }
  if (tasks.length === 0) fail('no executable build outputs');
  tasks.sort((a, b) => comparePaths(a.task, b.task));
  return tasks;
}

export function prepareBuild(root, plan, sourceSha) {
  root = resolve(root);
  const tasks = declaredTasks(root, plan, sourceSha);
  const removals = new Set(tasks.flatMap((task) => task.roots));
  for (const task of tasks) {
    // An install prepare script can also leave incremental compiler state.
    for (const name of readdirSync(join(root, task.directory))) {
      if (name.endsWith('.tsbuildinfo')) removals.add(join(root, task.directory, name));
    }
  }
  // Validate the entire deletion set before touching a disposable checkout.
  for (const filename of removals) collectFiles(root, filename, new Map());
  for (const filename of removals) rmSync(filename, { recursive: true, force: true });
  return {
    source_sha: sourceSha,
    task_count: tasks.length,
    removed_roots: [...removals]
      .map((filename) => relative(root, filename).split(sep).join('/'))
      .sort(comparePaths),
  };
}

export function collectTaskOutputs(root, plan, sourceSha) {
  root = resolve(root);
  const allFiles = new Map();
  const tasks = [];
  for (const task of declaredTasks(root, plan, sourceSha)) {
    const files = new Map();
    for (const filename of task.roots) collectFiles(root, filename, files);
    if (files.size === 0 || ![...files.values()].some((file) => file.bytes > 0))
      fail(`missing or empty task outputs: ${task.task}`);
    const paths = [...files.keys()].sort(comparePaths);
    tasks.push({
      task: task.task,
      directory: task.directory,
      command: task.command,
      files: paths,
    });
    for (const [filename, file] of files) allFiles.set(filename, file);
  }
  if (tasks.length === 0 || allFiles.size === 0) fail('no executable build outputs');
  tasks.sort((a, b) => comparePaths(a.task, b.task));
  return { tasks, files: [...allFiles.values()].sort((a, b) => comparePaths(a.path, b.path)) };
}

export function captureBuild({ root, plan, sourceSha, outputDir, label }) {
  if (!['A', 'B'].includes(label)) fail('invalid build label');
  root = resolve(root);
  outputDir = resolve(outputDir);
  if (outputDir === root || inside(root, outputDir)) fail('proof must be outside the checkout');
  const outputs = collectTaskOutputs(root, plan, sourceSha);
  mkdirSync(outputDir, { recursive: true });
  const listPath = join(outputDir, `files_${label}.nul`);
  const archive = join(outputDir, `build_${label}.tar`);
  writeFileSync(listPath, `${outputs.files.map((file) => file.path).join('\0')}\0`, { flag: 'wx' });
  const tar = spawnSync(
    'tar',
    [
      '--format=gnu',
      '--sort=name',
      '--mtime=@1577836800',
      '--owner=0',
      '--group=0',
      '--numeric-owner',
      '--hard-dereference',
      '--no-recursion',
      '--null',
      '--verbatim-files-from',
      '-cf',
      archive,
      '-T',
      listPath,
    ],
    { cwd: root, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 },
  );
  if (tar.error || tar.status !== 0)
    fail(`artifact archive failed: ${tar.error?.message || tar.stderr || tar.status}`);
  const receipt = {
    schema: 'platform-build-capture/v1',
    source_sha: sourceSha,
    label,
    captured_at: new Date().toISOString(),
    ...outputs,
    archive_sha256: sha256(readFileSync(archive)),
  };
  writeFileSync(join(outputDir, `capture_${label}.json`), `${JSON.stringify(receipt, null, 2)}\n`, {
    flag: 'wx',
  });
  return receipt;
}

export function compareBuilds(outputDir) {
  const receipts = ['A', 'B'].map((label) => {
    const receipt = readJson(join(outputDir, `capture_${label}.json`));
    if (
      receipt.schema !== 'platform-build-capture/v1' ||
      receipt.label !== label ||
      !sha40.test(receipt.source_sha) ||
      !Array.isArray(receipt.tasks) ||
      !receipt.tasks.length ||
      !Array.isArray(receipt.files) ||
      !receipt.files.length ||
      !receipt.files.some((file) => Number.isSafeInteger(file.bytes) && file.bytes > 0) ||
      receipt.archive_sha256 !== sha256(readFileSync(join(outputDir, `build_${label}.tar`)))
    ) {
      fail(`invalid or empty capture ${label}`);
    }
    return receipt;
  });
  const comparable = ({ source_sha, tasks, files, archive_sha256 }) => ({
    source_sha,
    tasks,
    files,
    archive_sha256,
  });
  if (JSON.stringify(comparable(receipts[0])) !== JSON.stringify(comparable(receipts[1]))) {
    fail(
      'builds are not reproducible: source, task coverage, file metadata/bytes, or archive hashes differ',
    );
  }
  const result = {
    schema: 'platform-reproducibility/v1',
    status: 'PASS',
    source_sha: receipts[0].source_sha,
    compared_at: new Date().toISOString(),
    task_count: receipts[0].tasks.length,
    file_count: receipts[0].files.length,
    archive_sha256: receipts[0].archive_sha256,
    scope: 'declared build/codegen outputs from two fresh checkouts in this runner job',
  };
  writeFileSync(join(outputDir, 'comparison.json'), `${JSON.stringify(result, null, 2)}\n`, {
    flag: 'wx',
  });
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (
      (command === 'capture' && args.length === 3) ||
      (command === 'prepare' && args.length === 1)
    ) {
      const git = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
      if (git.status !== 0) fail('cannot resolve checkout source');
      const sourceSha = git.stdout.trim();
      if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== sourceSha)
        fail('checkout does not match workflow source');
      if (command === 'prepare') {
        const clean = spawnSync('git', ['diff', '--exit-code', 'HEAD'], { encoding: 'utf8' });
        if (clean.status !== 0)
          fail('generated-output cleanup requires a clean disposable checkout');
        process.stdout.write(
          `${JSON.stringify(prepareBuild(process.cwd(), readJson(args[0]), sourceSha), null, 2)}\n`,
        );
      } else {
        const receipt = captureBuild({
          root: process.cwd(),
          sourceSha,
          label: args[0],
          plan: readJson(args[1]),
          outputDir: args[2],
        });
        process.stdout.write(
          `Build ${receipt.label}: ${receipt.tasks.length} tasks, ${receipt.files.length} files, ${receipt.archive_sha256}\n`,
        );
      }
    } else if (command === 'compare' && args.length === 1) {
      process.stdout.write(`${JSON.stringify(compareBuilds(args[0]), null, 2)}\n`);
    } else
      fail(
        'usage: repro-artifacts.mjs prepare PLAN | capture A|B PLAN OUTPUT_DIR | compare OUTPUT_DIR',
      );
  } catch (error) {
    process.stderr.write(`Reproducibility proof failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
