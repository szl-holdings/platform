import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { installHooks, PRE_PUSH_HOOK } from './setup-hooks.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'szl-setup-hooks-'));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return root;
}

test('installs canonical hooks in a Git checkout', (t) => {
  const root = fixture(t);
  const gitExecutable = process.env.GIT_EXECUTABLE ?? 'git';
  const initialized = spawnSync(gitExecutable, ['init'], {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(initialized.status, 0, initialized.stderr);

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
