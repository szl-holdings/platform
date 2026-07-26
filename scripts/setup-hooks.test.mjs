import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import test from 'node:test';

import { installHooks, PRE_PUSH_HOOK } from './setup-hooks.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'szl-setup-hooks-'));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return root;
}

function runGit(gitExecutable, cwd, args) {
  const result = spawnSync(gitExecutable, args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(
    result.status,
    0,
    result.stderr || result.error?.message || `git ${args.join(' ')} failed`,
  );
  return result.stdout.trim();
}

test('installs canonical hooks in a Git checkout', (t) => {
  const root = fixture(t);
  const gitExecutable = process.env.GIT_EXECUTABLE ?? 'git';
  runGit(gitExecutable, root, ['init']);

  mkdirSync(join(root, '.husky'), { recursive: true });
  writeFileSync(join(root, '.husky', 'pre-commit'), '#!/usr/bin/env sh\necho verified\n');

  const result = installHooks({
    cwd: root,
    gitExecutable,
    logger: { log() {} },
  });

  assert.equal(result.installed, true);
  assert.equal(existsSync(join(result.hooksDirectory, 'pre-commit')), true);
  assert.equal(readFileSync(join(result.hooksDirectory, 'pre-push'), 'utf8'), PRE_PUSH_HOOK);
  assert.match(PRE_PUSH_HOOK, /node_modules\/tsx\/dist\/cli\.mjs scripts\/brand-check\.ts/);
  assert.match(PRE_PUSH_HOOK, /git merge-base HEAD origin\/main/);
  assert.match(PRE_PUSH_HOOK, /check-banned-brand-strings\.ts --changed-from "\$BASE_REF"/);
  assert.match(PRE_PUSH_HOOK, /python3 scripts\/generate_og_cards\.py --check/);
});

test('installs hooks in the Git-resolved hook directory from a linked worktree', (t) => {
  const root = fixture(t);
  const primary = join(root, 'primary repo');
  const linked = join(root, 'linked worktree');
  const gitExecutable = process.env.GIT_EXECUTABLE ?? 'git';
  mkdirSync(primary, { recursive: true });
  runGit(gitExecutable, primary, ['init']);
  runGit(gitExecutable, primary, [
    '-c',
    'user.name=SZL Test',
    '-c',
    'user.email=szl-test@example.invalid',
    'commit',
    '--allow-empty',
    '-m',
    'fixture',
  ]);
  runGit(gitExecutable, primary, ['worktree', 'add', '--detach', linked, 'HEAD']);

  mkdirSync(join(linked, '.husky'), { recursive: true });
  writeFileSync(join(linked, '.husky', 'pre-commit'), '#!/usr/bin/env sh\necho linked\n');

  const result = installHooks({
    cwd: linked,
    gitExecutable,
    logger: { log() {} },
  });
  const gitHooksPath = runGit(gitExecutable, linked, ['rev-parse', '--git-path', 'hooks']);
  const expectedHooksDirectory = isAbsolute(gitHooksPath)
    ? gitHooksPath
    : resolve(linked, gitHooksPath);

  assert.equal(result.installed, true);
  assert.equal(resolve(result.hooksDirectory), resolve(expectedHooksDirectory));
  assert.equal(
    readFileSync(join(expectedHooksDirectory, 'pre-commit'), 'utf8'),
    '#!/usr/bin/env sh\necho linked\n',
  );
  assert.equal(readFileSync(join(expectedHooksDirectory, 'pre-push'), 'utf8'), PRE_PUSH_HOOK);
});

test('skips safely outside a Git checkout', (t) => {
  const root = fixture(t);
  const result = installHooks({
    cwd: root,
    gitExecutable: process.env.GIT_EXECUTABLE ?? 'git',
    logger: { log() {} },
  });

  assert.deepEqual(result, { installed: false });
});

test('preserves hooks in an externally configured core.hooksPath', (t) => {
  const root = fixture(t);
  const checkout = join(root, 'checkout');
  const externalHooks = join(root, 'external hooks');
  const gitExecutable = process.env.GIT_EXECUTABLE ?? 'git';
  mkdirSync(checkout, { recursive: true });
  runGit(gitExecutable, checkout, ['init']);
  runGit(gitExecutable, checkout, ['config', 'core.hooksPath', externalHooks]);

  mkdirSync(join(checkout, '.husky'), { recursive: true });
  writeFileSync(join(checkout, '.husky', 'pre-commit'), '#!/usr/bin/env sh\necho external\n');
  mkdirSync(externalHooks, { recursive: true });
  writeFileSync(join(externalHooks, 'pre-commit'), '#!/usr/bin/env sh\necho user-pre-commit\n');
  writeFileSync(join(externalHooks, 'pre-push'), '#!/usr/bin/env sh\necho user-pre-push\n');

  const result = installHooks({
    cwd: checkout,
    gitExecutable,
    logger: { log() {}, warn() {} },
  });

  assert.equal(result.installed, false);
  assert.equal(result.reason, 'configured-hooks-path-preserved');
  assert.equal(resolve(result.hooksDirectory), resolve(externalHooks));
  assert.equal(
    readFileSync(join(externalHooks, 'pre-commit'), 'utf8'),
    '#!/usr/bin/env sh\necho user-pre-commit\n',
  );
  assert.equal(
    readFileSync(join(externalHooks, 'pre-push'), 'utf8'),
    '#!/usr/bin/env sh\necho user-pre-push\n',
  );
});

test('treats an unwritable hook directory as a visible best-effort skip', (t) => {
  const root = fixture(t);
  const gitExecutable = process.env.GIT_EXECUTABLE ?? 'git';
  runGit(gitExecutable, root, ['init']);

  mkdirSync(join(root, '.husky'), { recursive: true });
  writeFileSync(join(root, '.husky', 'pre-commit'), '#!/usr/bin/env sh\necho verified\n');

  const warnings = [];
  const unavailable = Object.assign(new Error('read-only hook directory'), { code: 'EROFS' });
  const result = installHooks({
    cwd: root,
    gitExecutable,
    logger: {
      log() {},
      warn(message) {
        warnings.push(message);
      },
    },
    fileSystem: {
      mkdirSync() {
        throw unavailable;
      },
      copyFileSync,
      writeFileSync,
      chmodSync,
    },
  });

  assert.equal(result.installed, false);
  assert.equal(result.reason, 'hook-directory-unavailable');
  assert.match(warnings[0], /continuing without local hooks/);
  assert.match(warnings[0], /read-only hook directory/);
});
