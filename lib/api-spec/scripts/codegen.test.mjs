import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

import {
  ensureGeneratedClients,
  GENERATED_CLIENTS,
  generatedClientsPresent,
} from './codegen.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'szl-api-codegen-'));
  const packageRoot = join(root, 'api-spec');
  mkdirSync(packageRoot, { recursive: true });
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return packageRoot;
}

function writeGeneratedClients(packageRoot) {
  for (const relativePath of GENERATED_CLIENTS) {
    const target = resolve(packageRoot, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, 'export {};\n');
  }
}

test('skips Orval only when both generated clients exist', (t) => {
  const packageRoot = fixture(t);
  writeGeneratedClients(packageRoot);

  assert.equal(generatedClientsPresent(packageRoot), true);
  const result = ensureGeneratedClients({
    packageRoot,
    runner() {
      throw new Error('runner must not be called');
    },
    logger: { log() {} },
  });
  assert.deepEqual(result, { generated: false });
});

test('invokes Orval when a generated client is absent', (t) => {
  const packageRoot = fixture(t);
  let calls = 0;

  assert.equal(generatedClientsPresent(packageRoot), false);
  const result = ensureGeneratedClients({
    packageRoot,
    orvalExecutable: 'orval-fixture',
    runner(executable, args, options) {
      calls += 1;
      assert.equal(executable, 'orval-fixture');
      assert.deepEqual(args, ['--config', './orval.config.ts']);
      assert.equal(options.cwd, packageRoot);
      return { status: 0 };
    },
    logger: { log() {} },
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { generated: true });
});
