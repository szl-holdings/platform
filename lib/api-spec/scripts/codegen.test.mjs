import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

import { ensureGeneratedClients, GENERATED_CLIENTS, generatedClientsPresent } from './codegen.mjs';
import { normalizeBrowserIssuer, normalizeGeneratedZodCoercionHook } from './normalize-zod-coercion.mjs';

const issuerFixture = (expression) => `export const HandleBrowserLoginCallbackQueryParams = zod.object({\n  code: zod.coerce.string().optional(),\n  iss: ${expression},\n});\n`;

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
    writeFileSync(target, relativePath.includes('api-zod')
      ? issuerFixture('zod.coerce.string().url().optional()') : 'export {};\n');
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
  const normalized = readFileSync(resolve(packageRoot, GENERATED_CLIENTS[1]), 'utf8');
  assert.match(normalized, /coerce\.string\(\)\.pipe\(zod\.url\(\)\)/);
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
      writeGeneratedClients(packageRoot);
      return { status: 0 };
    },
    logger: { log() {} },
  });

  assert.equal(calls, 1);
  assert.deepEqual(result, { generated: true });
  assert.match(readFileSync(resolve(packageRoot, GENERATED_CLIENTS[1]), 'utf8'), /\.pipe\(zod\.url\(\)\)/);
});

test('issuer normalization preserves unrelated bytes and is idempotent', () => {
  for (const expression of ['zod.coerce.string().url().optional()', 'zod.url().optional()']) {
    const source = `const other = zod.string().url();\n${issuerFixture(expression)}`;
    const normalized = normalizeBrowserIssuer(source);
    assert.equal(normalized, source.replace(expression, 'zod.coerce.string().pipe(zod.url()).optional()'));
    assert.equal(normalizeBrowserIssuer(normalized), normalized);
  }
});

test('issuer normalization rejects missing, duplicate and unreviewed generated structures', () => {
  assert.throws(() => normalizeBrowserIssuer('export {};'));
  const source = issuerFixture('zod.url().optional()');
  assert.throws(() => normalizeBrowserIssuer(source + source));
  assert.throws(() => normalizeBrowserIssuer(source.replace('  iss:', '  absent:')));
  assert.throws(() => normalizeBrowserIssuer(source.replace('  iss:', '  iss: zod.url(),\n  iss:')));
  assert.throws(() => normalizeBrowserIssuer(issuerFixture('zod.string().optional()')));
});

test('issuer normalization accepts raw Orval output before its formatter runs', () => {
  const source = 'export const HandleBrowserLoginCallbackQueryParams = zod.object({\n  "code": zod.coerce.string().optional(),\n  "state": zod.coerce.string().optional(),\n  "iss": zod.url().optional()\n})';
  for (const raw of [source, source.replaceAll('\n', '\r\n')]) {
    const normalized = normalizeBrowserIssuer(raw);
    assert.equal(normalized, raw.replace('zod.url().optional()', 'zod.coerce.string().pipe(zod.url()).optional()'));
    assert.equal(normalizeBrowserIssuer(normalized), normalized);
  }
});

test('direct generation retains a failing exit status if Orval catches a hook error', (t) => {
  const packageRoot = fixture(t);
  writeGeneratedClients(packageRoot);
  const target = resolve(packageRoot, GENERATED_CLIENTS[1]);
  writeFileSync(target, 'export {};\n');
  const previousExitCode = process.exitCode;
  try {
    assert.throws(() => normalizeGeneratedZodCoercionHook(packageRoot));
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previousExitCode;
  }
});

test('the canonical generator pins Zod 4 and normalizes direct regeneration', () => {
  const config = readFileSync(new URL('../orval.config.ts', import.meta.url), 'utf8');
  assert.match(config, /version: 4/);
  assert.match(config, /afterAllFilesWrite: \(\) => \{ normalizeGeneratedZodCoercionHook\(\); \}/);
});

test('the generated issuer preserves coercion and URL rejection', () => {
  const generated = readFileSync(
    new URL('../../api-zod/src/generated/api.ts', import.meta.url),
    'utf8',
  );
  const issuer = generated.match(
    /export const HandleBrowserLoginCallbackQueryParams = zod\.object\(\{[\\s\\S]*?\\n\}\);/,
  )?.[0];
  assert.ok(issuer, 'generated issuer schema must remain present');
  assert.match(issuer, /iss: zod\.coerce\.string\(\)\.pipe\(zod\.url\(\)\)\.optional\(\)/);
  assert.doesNotMatch(issuer, /iss: zod\.coerce\.string\(\)\.url\(\)\.optional\(\)/);
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
