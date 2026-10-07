import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const SERVICES = [
  {
    name: 'alloy-runtime-api',
    packageName: '@workspace/alloy-runtime-api',
    source: 'apps/alloy-runtime-api/src/server.ts',
    compiled: 'dist/server.js',
    readyStatus: 503,
    readyHold: 'dependency-set',
  },
  {
    name: 'alloy-embedding-api',
    packageName: '@workspace/alloy-embedding-api',
    source: 'apps/alloy-embedding-api/src/index.ts',
    compiled: 'dist/index.js',
    readyStatus: 503,
    readyHold: 'capability-set',
  },
  {
    name: 'alloy-ingestion-orchestrator',
    packageName: '@workspace/alloy-ingestion-orchestrator',
    source: 'apps/alloy-ingestion-orchestrator/src/server.ts',
    compiled: 'dist/server.js',
    readyStatus: 503,
  },
];

// The emitted runtime closure plus declaration-only project references that
// its clean TypeScript builds traverse. Docker excludes every pre-existing
// dist directory, so the regression must do the same for this bounded graph.
const CLEAN_PROJECTS = [
  'apps/alloy-runtime-api',
  'apps/alloy-embedding-api',
  'apps/alloy-ingestion-orchestrator',
  'lib/db',
  'lib/observability',
  'packages/a11oy-atelier',
  'packages/a11oy-runtime',
  'packages/aef-contracts',
  'packages/aef-evidence-ledger',
  'packages/aef-policy-guard',
  'packages/aef-retrieval-core',
  'packages/aef-storage-adapters',
  'packages/agent-core',
  'packages/approvals-inbox',
  'packages/contracts',
  'packages/env',
  'packages/evidence-ledger',
  'packages/guardian',
  'packages/memory-core',
  'packages/ouroboros-gauss',
  'packages/ouroboros-anduril',
  'packages/ouroboros-aristotle',
  'packages/ouroboros-davinci',
  'packages/ouroboros-emerald',
  'packages/ouroboros-guardrails',
  'packages/ouroboros-integrations',
  'packages/ouroboros-invariant',
  'packages/ouroboros-jung',
  'packages/ouroboros-loop',
  'packages/ouroboros-newton',
  'packages/ouroboros-theosophy',
  'packages/ouroboros-trithemius',
  'packages/policy-engine',
  'packages/reconciliation',
  'packages/shared-contracts',
  'packages/workflow-runtime',
  'workers/alloy-embed-worker',
  'workers/alloy-rerank-worker',
];

const RUNTIME_MANIFESTS = [
  'apps/alloy-embedding-api/package.json',
  'apps/alloy-ingestion-orchestrator/package.json',
  'lib/db/package.json',
  'lib/observability/package.json',
  'packages/a11oy-atelier/package.json',
  'packages/a11oy-runtime/package.json',
  'packages/aef-contracts/package.json',
  'packages/aef-evidence-ledger/package.json',
  'packages/aef-policy-guard/package.json',
  'packages/aef-retrieval-core/package.json',
  'packages/aef-storage-adapters/package.json',
  'packages/agent-core/package.json',
  'packages/approvals-inbox/package.json',
  'packages/contracts/package.json',
  'packages/env/package.json',
  'packages/evidence-ledger/package.json',
  'packages/guardian/package.json',
  'packages/memory-core/package.json',
  'packages/ouroboros-gauss/package.json',
  'packages/ouroboros-anduril/package.json',
  'packages/ouroboros-aristotle/package.json',
  'packages/ouroboros-davinci/package.json',
  'packages/ouroboros-emerald/package.json',
  'packages/ouroboros-guardrails/package.json',
  'packages/ouroboros-integrations/package.json',
  'packages/ouroboros-invariant/package.json',
  'packages/ouroboros-jung/package.json',
  'packages/ouroboros-loop/package.json',
  'packages/ouroboros-newton/package.json',
  'packages/ouroboros-theosophy/package.json',
  'packages/ouroboros-trithemius/package.json',
  'packages/policy-engine/package.json',
  'packages/reconciliation/package.json',
  'packages/shared-contracts/package.json',
  'packages/workflow-runtime/package.json',
  'workers/alloy-embed-worker/package.json',
  'workers/alloy-rerank-worker/package.json',
];

const INTEGRATIONS_DEPLOY_IMPORTS = [
  '@workspace/ouroboros-anduril',
  '@workspace/ouroboros-aristotle',
  '@workspace/ouroboros-davinci',
  '@workspace/ouroboros-emerald',
  '@workspace/ouroboros-jung',
  '@workspace/ouroboros-theosophy',
  '@workspace/ouroboros-trithemius',
];

function run(command, args, label, cwd = REPO_ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0', TURBO_UI: 'stream' },
    maxBuffer: 32 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    `${label} failed\nstdout:\n${result.stdout ?? ''}\nstderr:\n${result.stderr ?? ''}`,
  );
}

async function cleanGeneratedOutputs() {
  await Promise.all(
    CLEAN_PROJECTS.flatMap((project) => [
      rm(join(REPO_ROOT, project, 'dist'), { recursive: true, force: true }),
      rm(join(REPO_ROOT, project, 'tsconfig.tsbuildinfo'), { force: true }),
    ]),
  );
}

async function getFreePort() {
  const server = createTcpServer();
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const { port } = address;
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return port;
}

async function startEmbeddingContractServer() {
  const readinessVector = Array.from({ length: 1024 }, (_, index) => (index === 0 ? 1 : 0));
  let embeddingCalls = 0;
  const server = createHttpServer((request, response) => {
    if (request.method === 'POST' && request.url === '/embed') {
      embeddingCalls += 1;
      if (
        request.headers.authorization !== 'Bearer compiled-runtime-backend-key' ||
        request.headers['x-tenant-id'] !== 'compiled-runtime-backend-tenant'
      ) {
        response.writeHead(401, { 'content-type': 'application/json' });
        response.end('{"error":"invalid_internal_identity"}');
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          vectors: [readinessVector],
          model: 'BAAI/bge-m3',
          model_revision: 'b'.repeat(40),
          artifact_set_digest: 'a'.repeat(64),
          dimensions: readinessVector.length,
          normalized: true,
          promotion_state: 'QUALIFIED',
        }),
      );
      return;
    }
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end('{"status":"ok"}');
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end('{"error":"not_found"}');
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return {
    url: `http://127.0.0.1:${address.port}`,
    getEmbeddingCalls: () => embeddingCalls,
    close: () =>
      new Promise((resolveClose, reject) =>
        server.close((error) => (error ? reject(error) : resolveClose())),
      ),
  };
}

function startService(service, mode, port, embeddingUrl) {
  const isSource = mode === 'source';
  const isDeployed = mode === 'deployed';
  const command = isSource || isDeployed ? process.execPath : PNPM;
  const args = isSource
    ? ['--conditions=workspace', '--import', 'tsx', join(REPO_ROOT, service.source)]
    : isDeployed
      ? ['--no-strip-types', '--enable-source-maps', join(service.deployRoot, service.compiled)]
      : ['--filter', service.packageName, 'start'];
  const child = spawn(command, args, {
    cwd: isDeployed ? service.deployRoot : REPO_ROOT,
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      OTEL_IN_MEMORY: 'true',
      OTEL_CONSOLE_EXPORT: 'false',
      AEF_API_KEY: 'compiled-runtime-test-only-key',
      AEF_API_TENANT_ID: 'compiled-runtime-test-tenant',
      AEF_AUTH_BYPASS: 'false',
      SUBSTRATE_EMBED_URL: embeddingUrl,
      SUBSTRATE_EMBED_API_KEY: 'compiled-runtime-backend-key',
      SUBSTRATE_EMBED_TENANT_ID: 'compiled-runtime-backend-tenant',
      AEF_EMBED_PROMOTION_STATE: 'QUALIFIED',
      HF_EMBED_MODEL_REVISION: 'b'.repeat(40),
      HF_EMBED_ARTIFACT_SET_DIGEST: 'a'.repeat(64),
      ALLOY_API_KEY: 'compiled-runtime-test-only-key',
      ALLOY_API_TENANT_ID: 'compiled-runtime-test-tenant',
      ORCHESTRATOR_API_TOKEN: 'compiled-runtime-test-only-token',
      ORCHESTRATOR_API_TENANT_ID: 'compiled-runtime-test-tenant',
      ORCHESTRATOR_API_ACTOR_ID: 'compiled-runtime-test-operator',
      ORCHESTRATOR_API_ROLES: 'operator',
      ORCHESTRATOR_AUTH_BYPASS: 'false',
      // A compiled production process must not get accidental help from
      // Node's built-in TypeScript stripper. Any leaked src/*.ts export fails.
      ...(isSource ? {} : { NODE_OPTIONS: '--no-strip-types' }),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const capture = (chunk) => {
    output = `${output}${String(chunk)}`.slice(-32_000);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  return { child, getOutput: () => output };
}

function assertMissingProductionCredentialFails({ label, entry, env, message }) {
  const result = spawnSync(
    process.execPath,
    ['--no-strip-types', '--enable-source-maps', join(REPO_ROOT, entry)],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        ...env,
        PORT: '0',
      },
      timeout: 10_000,
    },
  );
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  assert.notEqual(
    result.status,
    null,
    `${label} did not fail fast without a credential\n${output}`,
  );
  assert.notEqual(result.status, 0, `${label} accepted a missing production credential\n${output}`);
  assert.match(output, message);
}

async function waitForProbe(name, port, path, expectedStatus = 200, expectedHold) {
  let lastError = 'no response';
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    try {
      const remainingMs = Math.max(1, deadline - Date.now());
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        signal: AbortSignal.timeout(Math.min(1_000, remainingMs)),
      });
      if (response.status === expectedStatus) {
        if (expectedStatus === 503) {
          const report = await response.json();
          assert.equal(report.ready, false, `${name} ${path} hold ready flag`);
          if (expectedHold === 'dependency-set') {
            assert.ok(
              report.dependencies.some(
                (dependency) =>
                  dependency.name === 'production-capability-backends' &&
                  dependency.ready === false,
              ),
              `${name} ${path} production capability hold`,
            );
          } else if (expectedHold === 'capability-set') {
            assert.equal(report.retrieval.admitted, false, `${name} ${path} retrieval admission`);
            assert.equal(
              report.evidenceLedger.promotionState,
              'EVALUATION_HOLD',
              `${name} ${path} evidence-ledger promotion state`,
            );
            assert.equal(
              report.evidenceLedger.tamperEvident,
              false,
              `${name} ${path} evidence-ledger integrity state`,
            );
            assert.equal(
              report.statefulWorkflows.promotionState,
              'EVALUATION_HOLD',
              `${name} ${path} workflow promotion state`,
            );
            assert.equal(
              report.statefulWorkflows.durableState,
              false,
              `${name} ${path} workflow durable state`,
            );
          } else {
            assert.equal(
              report.promotionState,
              'EVALUATION_HOLD',
              `${name} ${path} hold promotion state`,
            );
            assert.equal(report.durableState, false, `${name} ${path} durable state`);
          }
        }
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    const remainingMs = deadline - Date.now();
    if (remainingMs > 0) {
      await new Promise((resolveWait) => setTimeout(resolveWait, Math.min(100, remainingMs)));
    }
  }
  throw new Error(`${name} ${path} did not become ready: ${lastError}`);
}

async function stopService(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === 'win32') child.kill('SIGTERM');
    else process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
  await Promise.race([
    new Promise((resolveExit) => child.once('exit', resolveExit)),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

const EMBEDDING_HOLD_ROUTES = [
  '/alloy-embedding-api/v1/embed',
  '/alloy-embedding-api/v1/rerank',
  '/alloy-embedding-api/v1/hybrid-search',
  '/alloy-embedding-api/v1/multimodal/embed',
  '/alloy-embedding-api/v1/openai/embeddings',
  '/alloy-embedding-api/v1/ingest',
  '/alloy-embedding-api/v1/index/rebuild',
  '/alloy-embedding-api/v1/index/verify',
  '/alloy-embedding-api/v1/evals/run',
];

const ORCHESTRATOR_HOLD_ROUTES = [
  { method: 'POST', path: '/orchestrator/v1/runs' },
  { method: 'POST', path: '/orchestrator/v1/runs/held-run/approve' },
  { method: 'DELETE', path: '/orchestrator/v1/runs/held-run' },
];

function assertNoExecutionResult(payload, route) {
  for (const field of [
    'runId',
    'workflowId',
    'approvalRequestId',
    'requestId',
    'jobId',
    'evalId',
    'evidenceId',
    'evidenceIds',
    'data',
    'vectors',
    'results',
    'output',
    'statusUrl',
    'traceId',
  ]) {
    assert.equal(
      Object.hasOwn(payload, field),
      false,
      `${route} returned execution field ${field}: ${JSON.stringify(payload)}`,
    );
  }
}

async function assertProductionRoutesHeld(service, mode, port) {
  if (service.name === 'alloy-embedding-api') {
    for (const path of EMBEDDING_HOLD_ROUTES) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST',
        headers: {
          authorization: 'Bearer compiled-runtime-test-only-key',
          'content-type': 'application/json',
          'x-tenant-id': 'compiled-runtime-test-tenant',
        },
        body: '{}',
        signal: AbortSignal.timeout(3_000),
      });
      assert.equal(response.status, 503, `${service.name} (${mode}) ${path} must be held`);
      const payload = await response.json();
      const statefulRoute =
        path.includes('/ingest') || path.includes('/index/') || path.includes('/evals/');
      const admittedCodes = statefulRoute
        ? ['DURABLE_ORCHESTRATOR_STATE_REQUIRED', 'EVIDENCE_LEDGER_DURABILITY_REQUIRED']
        : ['EVIDENCE_LEDGER_DURABILITY_REQUIRED'];
      assert.ok(
        admittedCodes.includes(payload.code),
        `${service.name} (${mode}) ${path} hold code: ${JSON.stringify(payload)}`,
      );
      assertNoExecutionResult(payload, `${service.name} (${mode}) ${path}`);
    }
    return;
  }

  if (service.name === 'alloy-ingestion-orchestrator') {
    for (const { method, path } of ORCHESTRATOR_HOLD_ROUTES) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: {
          authorization: 'Bearer compiled-runtime-test-only-token',
          'content-type': 'application/json',
          'x-tenant-id': 'compiled-runtime-test-tenant',
        },
        ...(method === 'POST' ? { body: '{}' } : {}),
        signal: AbortSignal.timeout(3_000),
      });
      assert.equal(response.status, 503, `${service.name} (${mode}) ${path} must be held`);
      const payload = await response.json();
      assert.equal(payload.code, 'DURABLE_ORCHESTRATOR_STATE_REQUIRED');
      assertNoExecutionResult(payload, `${service.name} (${mode}) ${path}`);
    }
  }
}

async function probeServices(mode, embeddingContractServer, services = SERVICES) {
  const running = [];
  const allocatedPorts = new Set();
  const initialEmbeddingCalls = embeddingContractServer.getEmbeddingCalls();
  try {
    for (const service of services) {
      let port = await getFreePort();
      while (allocatedPorts.has(port)) port = await getFreePort();
      allocatedPorts.add(port);
      running.push({
        service,
        port,
        ...startService(service, mode, port, embeddingContractServer.url),
      });
    }
    await Promise.all(
      running.flatMap(({ service, port }) => [
        waitForProbe(`${service.name} (${mode})`, port, '/healthz'),
        waitForProbe(
          `${service.name} (${mode})`,
          port,
          '/readyz',
          service.readyStatus ?? 200,
          service.readyHold,
        ),
      ]),
    );
    for (const { service, port } of running) {
      await assertProductionRoutesHeld(service, mode, port);
    }
    assert.equal(
      embeddingContractServer.getEmbeddingCalls(),
      initialEmbeddingCalls,
      `${mode} readiness/HOLD probes must not invoke the external embedding backend`,
    );
  } catch (error) {
    const diagnostics = running
      .map(({ service, getOutput }) => `\n--- ${service.name} ---\n${getOutput()}`)
      .join('');
    throw new Error(`${error instanceof Error ? error.message : String(error)}${diagnostics}`);
  } finally {
    await Promise.all(running.map(({ child }) => stopService(child)));
  }
}

function assertExportTarget(target, manifestPath, exportName) {
  assert.equal(
    typeof target,
    'object',
    `${manifestPath} ${exportName} must use conditional exports`,
  );
  assert.match(
    target.development,
    /^\.\/src\/.+\.ts$/,
    `${manifestPath} ${exportName} development target`,
  );
  assert.match(target.types, /^\.\/dist\/.+\.d\.ts$/, `${manifestPath} ${exportName} types target`);
  assert.match(
    target.workspace,
    /^\.\/src\/.+\.ts$/,
    `${manifestPath} ${exportName} workspace target`,
  );
  assert.match(target.import, /^\.\/dist\/.+\.js$/, `${manifestPath} ${exportName} import target`);
  const conditions = Object.keys(target);
  assert.ok(
    conditions.indexOf('development') < conditions.indexOf('import'),
    `${manifestPath} ${exportName} development must precede import`,
  );
  assert.ok(
    conditions.indexOf('workspace') < conditions.indexOf('types'),
    `${manifestPath} ${exportName} workspace must precede types`,
  );
  assert.ok(
    conditions.indexOf('workspace') < conditions.indexOf('import'),
    `${manifestPath} ${exportName} workspace must precede import`,
  );
}

async function assertProductionExportsUseDist() {
  for (const manifestPath of RUNTIME_MANIFESTS) {
    const manifest = JSON.parse(await readFile(join(REPO_ROOT, manifestPath), 'utf8'));
    for (const [exportName, target] of Object.entries(manifest.exports)) {
      assertExportTarget(target, manifestPath, exportName);
      await access(join(REPO_ROOT, dirname(manifestPath), target.types));
      await access(join(REPO_ROOT, dirname(manifestPath), target.import));
    }
    if (manifest.main) {
      assert.doesNotMatch(
        manifest.main,
        /(?:^|\/)src\//,
        `${manifestPath} main must not target src`,
      );
    }
  }
}

async function assertContainerReadinessContracts() {
  const orchestratorDockerfile = await readFile(
    join(REPO_ROOT, 'apps/alloy-ingestion-orchestrator/Dockerfile'),
    'utf8',
  );
  assert.match(orchestratorDockerfile, /HEALTHCHECK[\s\S]*\/readyz/);
  assert.doesNotMatch(orchestratorDockerfile, /HEALTHCHECK[\s\S]*\/healthz/);

  const inferenceDockerfile = await readFile(
    join(REPO_ROOT, 'apps/substrate-inference/Dockerfile'),
    'utf8',
  );
  assert.match(inferenceDockerfile, /AS cpu-stub/);
  const healthchecks = inferenceDockerfile.match(/HEALTHCHECK[^\n]*\n\s*CMD[^\n]*/g) ?? [];
  assert.ok(
    healthchecks.length >= 2,
    'inference GPU and CPU targets require readiness healthchecks',
  );
  for (const healthcheck of healthchecks) {
    assert.match(healthcheck, /\/ready/);
    assert.doesNotMatch(healthcheck, /\/healthz/);
  }
}

async function deployAndProbeServices(scratch, embeddingContractServer) {
  const deployed = [];
  for (const service of SERVICES) {
    const deployRoot = join(scratch, service.name);
    run(
      PNPM,
      ['--filter', service.packageName, 'deploy', '--prod', '--legacy', deployRoot],
      `${service.name} production deploy`,
    );
    await access(join(deployRoot, 'package.json'));
    await access(join(deployRoot, service.compiled));
    deployed.push({ ...service, deployRoot });
  }

  const runtimeDeploy = deployed.find(({ name }) => name === 'alloy-runtime-api');
  assert.ok(runtimeDeploy);
  run(
    process.execPath,
    [
      '--no-strip-types',
      '--experimental-import-meta-resolve',
      '--input-type=module',
      '--eval',
      `
        import { realpathSync } from 'node:fs';
        import { fileURLToPath, pathToFileURL } from 'node:url';
        const importFrom = async (entry, specifiers) => {
          const parent = pathToFileURL(realpathSync(entry)).href;
          const resolved = specifiers.map((specifier) => import.meta.resolve(specifier, parent));
          await Promise.all(resolved.map((url) => import(url)));
          return resolved;
        };
        await importFrom(
          './node_modules/@workspace/ouroboros-integrations/dist/index.js',
          ${JSON.stringify(INTEGRATIONS_DEPLOY_IMPORTS)},
        );
        const [, loopUrl] = await importFrom(
          './node_modules/@workspace/a11oy-runtime/dist/index.js',
          ['@workspace/ouroboros-gauss', '@workspace/ouroboros-loop'],
        );
        await importFrom(fileURLToPath(loopUrl), ['@workspace/ouroboros-newton']);
      `,
    ],
    'runtime deploy native workspace imports',
    runtimeDeploy.deployRoot,
  );
  await probeServices('deployed', embeddingContractServer, deployed);
}

test('fresh source, compiled workspace, and production deploys enforce expected probe states', {
  timeout: 300_000,
}, async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'a11oy-compiled-runtime-'));
  const embeddingContractServer = await startEmbeddingContractServer();
  try {
    await cleanGeneratedOutputs();
    await assertContainerReadinessContracts();

    // TypeScript, Vitest, and Node resolve the explicit workspace condition
    // directly to source, so developer flows remain fresh-install capable.
    for (const service of SERVICES) {
      run(PNPM, ['--filter', service.packageName, 'typecheck'], `${service.name} source typecheck`);
      run(PNPM, ['--filter', service.packageName, 'test'], `${service.name} source tests`);
    }
    await probeServices('source', embeddingContractServer);

    run(
      PNPM,
      [
        'turbo',
        'run',
        'build',
        '--filter=@workspace/alloy-runtime-api',
        '--filter=@workspace/alloy-embedding-api',
        '--filter=@workspace/alloy-ingestion-orchestrator',
        '--concurrency=4',
        '--force',
      ],
      'clean compiled runtime build',
    );
    await assertProductionExportsUseDist();
    assertMissingProductionCredentialFails({
      label: 'embedding API',
      entry: 'apps/alloy-embedding-api/dist/index.js',
      env: { AEF_API_KEY: '', AEF_AUTH_BYPASS: 'false' },
      message: /AEF_API_KEY is required/,
    });
    assertMissingProductionCredentialFails({
      label: 'embedding API backend',
      entry: 'apps/alloy-embedding-api/dist/index.js',
      env: {
        AEF_API_KEY: 'compiled-runtime-test-only-key',
        AEF_API_TENANT_ID: 'compiled-runtime-test-tenant',
        AEF_AUTH_BYPASS: 'false',
        SUBSTRATE_EMBED_URL: '',
        HF_EMBED_URL: '',
      },
      message: /real embedding endpoint is required/i,
    });
    assertMissingProductionCredentialFails({
      label: 'embedding API tenant binding',
      entry: 'apps/alloy-embedding-api/dist/index.js',
      env: {
        AEF_API_KEY: 'compiled-runtime-test-only-key',
        AEF_API_TENANT_ID: '',
        AEF_AUTH_BYPASS: 'false',
        SUBSTRATE_EMBED_URL: 'http://127.0.0.1:1',
      },
      message: /AEF_API_TENANT_ID is required/,
    });
    assertMissingProductionCredentialFails({
      label: 'embedding API model qualification',
      entry: 'apps/alloy-embedding-api/dist/index.js',
      env: {
        AEF_API_KEY: 'compiled-runtime-test-only-key',
        AEF_API_TENANT_ID: 'compiled-runtime-test-tenant',
        AEF_AUTH_BYPASS: 'false',
        SUBSTRATE_EMBED_URL: 'http://127.0.0.1:1',
        AEF_EMBED_PROMOTION_STATE: 'DEVELOPMENT',
        HF_EMBED_MODEL_REVISION: 'b'.repeat(40),
        HF_EMBED_ARTIFACT_SET_DIGEST: 'a'.repeat(64),
      },
      message: /AEF_EMBED_PROMOTION_STATE=QUALIFIED is required/,
    });
    assertMissingProductionCredentialFails({
      label: 'runtime API',
      entry: 'apps/alloy-runtime-api/dist/server.js',
      env: { ALLOY_API_KEY: '', ALLOY_API_TENANT_ID: 'compiled-runtime-test-tenant' },
      message: /ALLOY_API_KEY is required/,
    });
    assertMissingProductionCredentialFails({
      label: 'runtime API tenant binding',
      entry: 'apps/alloy-runtime-api/dist/server.js',
      env: { ALLOY_API_KEY: 'compiled-runtime-test-only-key', ALLOY_API_TENANT_ID: '' },
      message: /ALLOY_API_TENANT_ID is required/,
    });
    assertMissingProductionCredentialFails({
      label: 'ingestion orchestrator',
      entry: 'apps/alloy-ingestion-orchestrator/dist/server.js',
      env: {
        ORCHESTRATOR_API_TOKEN: '',
        ORCHESTRATOR_API_TENANT_ID: 'compiled-runtime-test-tenant',
        ORCHESTRATOR_AUTH_BYPASS: 'false',
      },
      message: /ORCHESTRATOR_API_TOKEN is required/,
    });
    assertMissingProductionCredentialFails({
      label: 'ingestion orchestrator tenant binding',
      entry: 'apps/alloy-ingestion-orchestrator/dist/server.js',
      env: {
        ORCHESTRATOR_API_TOKEN: 'compiled-runtime-test-only-token',
        ORCHESTRATOR_API_TENANT_ID: '',
        ORCHESTRATOR_AUTH_BYPASS: 'false',
      },
      message: /ORCHESTRATOR_API_TENANT_ID is required/,
    });
    assertMissingProductionCredentialFails({
      label: 'ingestion orchestrator principal binding',
      entry: 'apps/alloy-ingestion-orchestrator/dist/server.js',
      env: {
        ORCHESTRATOR_API_TOKEN: 'compiled-runtime-test-only-token',
        ORCHESTRATOR_API_TENANT_ID: 'compiled-runtime-test-tenant',
        ORCHESTRATOR_API_ACTOR_ID: '',
        ORCHESTRATOR_API_ROLES: '',
        ORCHESTRATOR_AUTH_BYPASS: 'false',
      },
      message: /ORCHESTRATOR_API_ACTOR_ID and ORCHESTRATOR_API_ROLES are required/,
    });
    assertMissingProductionCredentialFails({
      label: 'ingestion orchestrator production bypass',
      entry: 'apps/alloy-ingestion-orchestrator/dist/server.js',
      env: {
        ORCHESTRATOR_API_TOKEN: '',
        ORCHESTRATOR_API_TENANT_ID: '',
        ORCHESTRATOR_AUTH_BYPASS: 'true',
      },
      message: /ORCHESTRATOR_AUTH_BYPASS is permitted only/,
    });
    await probeServices('compiled', embeddingContractServer);
    await deployAndProbeServices(scratch, embeddingContractServer);
  } finally {
    await embeddingContractServer.close();
    await rm(scratch, { recursive: true, force: true });
  }
});
