import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

import { ensureGeneratedClients, GENERATED_CLIENTS, generatedClientsPresent } from './codegen.mjs';

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

test('documents the authenticated Proofweave compile-only truth contract', () => {
  const specification = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8');
  const pathKey = '  /api/a11oy/v1/atelier/proofweave/compile:';
  const pathStart = specification.indexOf(pathKey);
  assert.notEqual(pathStart, -1, 'Proofweave compile path must be documented');

  const nextPath = specification.indexOf('\n  /', pathStart + pathKey.length);
  const operation = specification.slice(pathStart, nextPath);
  assert.match(operation, /operationId: compileA11oyAtelierProofweave/);
  assert.match(operation, /servers:\n\s+- url: \//);
  assert.match(operation, /security:\n\s+- atelierApiKey: \[\]/);
  assert.match(operation, /name: X-Tenant-Id/);
  assert.match(operation, /tenant attribution is therefore `DECLARED`/);
  assert.match(operation, /does\s+not execute the plan/);
  assert.match(operation, /durably store the returned plan/);
  assert.match(operation, /EvidenceLedger append before returning success/);
  assert.match(operation, /durable ledger persistence remains `UNKNOWN`/);
  assert.match(operation, /enum: \[no-store\]/);
  for (const status of ['200', '400', '401', '403', '503']) {
    assert.match(operation, new RegExp(`        "${status}":`));
  }

  assert.match(specification, /atelierApiKey:\n\s+type: apiKey\n\s+in: header\n\s+name: X-Api-Key/);
  assert.match(specification, /evidenceClass: \{ type: string, enum: \[SIMULATED\] \}/);
  assert.match(
    specification,
    /executionState: \{ type: string, enum: \[COMPILED_NOT_EXECUTED\] \}/,
  );
  assert.match(
    specification,
    /persistenceState: \{ type: string, enum: \[IN_PROCESS_NOT_STORED\] \}/,
  );
  assert.match(
    specification,
    /tenantAttributionEvidenceClass: \{ type: string, enum: \[DECLARED\] \}/,
  );
  assert.match(
    specification,
    /durablePersistenceEvidenceClass: \{ type: string, enum: \[UNKNOWN\] \}/,
  );
  assert.match(specification, /entryId:\n\s+type: string\n\s+minLength: 1\n\s+maxLength: 128/);
});
