import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deployProduction } from './deploy-production.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const TEST_SECRET = 'test-only-not-a-credential';
const TEST_SIGNING_KEY = 'a'.repeat(64);
const TEST_GATEWAY_TENANT = 'substrate-gateway';
const TEST_FABRIC_TENANT = 'fabric-runtime-test';
const TEST_INGEST_CONTROL_TENANT = 'ingest-control-runtime-test';
const TEST_RUNTIME_TENANT = 'alloy-runtime-test';
const TEST_EXTERNAL_MODEL_REF = `external-embed-v1@sha256:${'c'.repeat(64)}`;
const INVALID_VECTOR_BATCH_CONFIGS = [
  ['AEF_EMBED_BATCH_SIZE', '0'],
  ['AEF_EMBED_FLUSH_MS', 'NaN'],
  ['AEF_EMBED_QUEUE_DEPTH', '-1'],
  ['AEF_EMBED_OVERSIZE_TOKENS', '1.5'],
].map(([name, value]) => ({
  label: `invalid vector batch setting ${name}`,
  env: { [name]: value },
  expected: new RegExp(`${name} must be a positive integer`),
}));

const SERVICES = [
  {
    name: 'alloy-runtime-api',
    packageName: '@workspace/alloy-runtime-api',
    source: 'apps/alloy-runtime-api/src/server.ts',
    compiled: 'dist/server.js',
    portEnv: 'PORT',
    env: {
      ALLOY_API_KEY: TEST_SECRET,
      ALLOY_API_TENANT_ID: TEST_RUNTIME_TENANT,
    },
    requiredSecretEnvs: ['ALLOY_API_KEY'],
    probes: ['/healthz', { path: '/readyz', expected: 503 }],
    containerBuildPattern: /pnpm turbo run build --filter=@workspace\/alloy-runtime-api/,
  },
  {
    name: 'substrate-mcp-gateway',
    packageName: '@szl/substrate-mcp-gateway',
    source: 'services/substrate-mcp-gateway/src/index.ts',
    compiled: 'dist/index.js',
    portEnv: 'SUBSTRATE_GATEWAY_PORT',
    env: {
      SUBSTRATE_GATEWAY_API_KEY: TEST_SECRET,
      SUBSTRATE_GATEWAY_TENANT_ID: TEST_GATEWAY_TENANT,
      SUBSTRATE_SIGNING_KEY: TEST_SIGNING_KEY,
    },
    requiredSecretEnvs: ['SUBSTRATE_GATEWAY_API_KEY'],
    probes: ['/healthz', { path: '/readyz', expected: 503 }],
  },
  {
    name: 'alloy-fabric-api',
    packageName: '@workspace/alloy-fabric-api',
    source: 'services/alloy-fabric-api/src/server.ts',
    compiled: 'dist/server.js',
    portEnv: 'PORT',
    env: {
      AEF_API_KEY: TEST_SECRET,
      AEF_API_TENANT_ID: TEST_FABRIC_TENANT,
      AEF_EMBED_BACKEND: 'deterministic-cpu',
    },
    requiredSecretEnvs: ['AEF_BEARER_TOKEN', 'AEF_API_KEY'],
    probes: ['/healthz', { path: '/readyz', expected: 503 }],
  },
  {
    name: 'alloy-fabric-ingest-control',
    packageName: '@workspace/alloy-fabric-ingest-control',
    source: 'services/alloy-fabric-ingest-control/src/server.ts',
    compiled: 'dist/server.js',
    portEnv: 'AEF_INGEST_CONTROL_PORT',
    env: {
      AEF_S2S_SECRET: TEST_SECRET,
      AEF_S2S_TENANT_ID: TEST_INGEST_CONTROL_TENANT,
    },
    requiredSecretEnvs: ['AEF_S2S_SECRET'],
    probes: ['/healthz', { path: '/readyz', expected: 503 }],
  },
  {
    name: 'alloy-rank-worker',
    packageName: '@workspace/alloy-rank-worker',
    source: 'workers/alloy-rank-worker/src/server.ts',
    compiled: 'dist/server.js',
    portEnv: 'AEF_RANK_WORKER_PORT',
    env: { AEF_S2S_SECRET: TEST_SECRET },
    requiredSecretEnvs: ['AEF_S2S_SECRET'],
    probes: ['/healthz', { path: '/readyz', expected: 503 }],
  },
  {
    name: 'alloy-vector-worker',
    packageName: '@workspace/alloy-vector-worker',
    source: 'workers/alloy-vector-worker/src/server.ts',
    compiled: 'dist/server.js',
    portEnv: 'AEF_VECTOR_WORKER_PORT',
    env: { AEF_S2S_SECRET: TEST_SECRET, AEF_EMBED_BACKEND: 'deterministic-cpu' },
    requiredSecretEnvs: ['AEF_S2S_SECRET'],
    probes: ['/healthz', { path: '/readyz', expected: 503 }],
  },
];

const CLEAN_PROJECTS = [
  'apps/alloy-runtime-api',
  'services/substrate-mcp-gateway',
  'services/alloy-fabric-api',
  'services/alloy-fabric-ingest-control',
  'workers/alloy-rank-worker',
  'workers/alloy-vector-worker',
  'lib/db',
  'lib/forge-runtime',
  'lib/observability',
  'lib/prism-bus',
  'lib/proof-chain',
  'lib/services',
  'packages/action-engine',
  'packages/aef-contracts',
  'packages/aef-domain-profiles',
  'packages/aef-evals',
  'packages/aef-evidence-ledger',
  'packages/aef-policy-guard',
  'packages/aef-retrieval-core',
  'packages/aef-sdk',
  'packages/aef-storage-adapters',
  'packages/aef-workflow-runtime',
  'packages/agents-core',
  'packages/ai-control-plane',
  'packages/approvals-inbox',
  'packages/atlas-core',
  'packages/cognitive-observability',
  'packages/contracts',
  'packages/decision-engine',
  'packages/env',
  'packages/evidence-graph',
  'packages/guardian',
  'packages/memory-fabric',
  'packages/nexus-mcp',
  'packages/ontology',
  'packages/planner',
  'packages/policy-engine',
  'packages/sandbox-runtime',
  'packages/substrate',
  'packages/substrate-client',
  'packages/tool-mesh',
  'packages/trace-graph',
];

const RUNTIME_MANIFESTS = CLEAN_PROJECTS.map((project) => `${project}/package.json`);
const ALLOCATED_PORTS = new Set();

function run(command, args, label, cwd = REPO_ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0', TURBO_UI: 'stream' },
    maxBuffer: 64 * 1024 * 1024,
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
  for (;;) {
    const server = createServer();
    await new Promise((resolveListen, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolveListen);
    });
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    await new Promise((resolveClose, reject) =>
      server.close((error) => (error ? reject(error) : resolveClose())),
    );
    if (!ALLOCATED_PORTS.has(address.port)) {
      ALLOCATED_PORTS.add(address.port);
      return address.port;
    }
  }
}

function startService(service, mode, port, options = {}) {
  const source = mode === 'source';
  const root = mode === 'deployed' ? service.deployRoot : REPO_ROOT;
  const entry = source
    ? join(REPO_ROOT, service.source)
    : mode === 'deployed'
      ? join(root, service.compiled)
      : join(REPO_ROOT, dirname(service.source), '..', service.compiled);
  const args = source
    ? ['--conditions=workspace', '--import', 'tsx', entry]
    : ['--no-strip-types', '--enable-source-maps', entry];
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    OTEL_IN_MEMORY: 'true',
    OTEL_CONSOLE_EXPORT: 'false',
    ...service.env,
    ...options.env,
    [service.portEnv]: String(port),
  };
  for (const key of options.omitEnv ?? []) delete env[key];
  if (!source) env.NODE_OPTIONS = '--no-strip-types';
  const child = spawn(process.execPath, args, {
    cwd: root,
    detached: process.platform !== 'win32',
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const capture = (chunk) => {
    output = `${output}${String(chunk)}`.slice(-64_000);
  };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  return { child, getOutput: () => output };
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

async function waitForStatus(port, path, expected = 200, init = undefined) {
  let last = 'no response';
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    try {
      const remainingMs = Math.max(1, deadline - Date.now());
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        ...init,
        signal: AbortSignal.timeout(Math.min(1_000, remainingMs)),
      });
      if (response.status === expected) return response;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    const remainingMs = deadline - Date.now();
    if (remainingMs > 0) {
      await new Promise((resolveWait) => setTimeout(resolveWait, Math.min(100, remainingMs)));
    }
  }
  throw new Error(`${path} did not return HTTP ${expected}: ${last}`);
}

async function startGatewayEnterpriseAuthMock() {
  const port = await getFreePort();
  const server = createHttpServer((request, response) => {
    response.setHeader('content-type', 'application/json');
    if (request.url === '/api/enterprise-mcp/revoked-subjects') {
      response.end('{"subjects":[]}');
      return;
    }
    if (request.url === '/api/enterprise-mcp/idp-configs') {
      response.end('{"idps":[]}');
      return;
    }
    response.statusCode = 404;
    response.end('{}');
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveListen);
  });
  return {
    server,
    env: {
      ALLOY_INTERNAL_TOKEN: TEST_SECRET,
      MCP_API_SERVER_BASE_URL: `http://127.0.0.1:${port}`,
    },
  };
}

async function readMcpResponse(response) {
  const raw = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream')) {
    const match = raw.match(/^data: (.+)$/m);
    assert.ok(match, `MCP SSE response did not contain a data event: ${raw.slice(0, 200)}`);
    return JSON.parse(match[1]);
  }
  return JSON.parse(raw);
}

async function probeServices(mode, services = SERVICES) {
  const running = [];
  let enterpriseAuthMock;
  try {
    const needsEnterpriseAuth = services.some(({ name }) => name === 'substrate-mcp-gateway');
    let gatewayEnterpriseEnv = {};
    if (needsEnterpriseAuth) {
      const enterpriseAuth = await startGatewayEnterpriseAuthMock();
      enterpriseAuthMock = enterpriseAuth.server;
      gatewayEnterpriseEnv = enterpriseAuth.env;
    }
    for (const service of services) {
      const port = await getFreePort();
      const options =
        service.name === 'substrate-mcp-gateway' ? { env: gatewayEnterpriseEnv } : undefined;
      running.push({ service, port, ...startService(service, mode, port, options) });
    }
    await Promise.all(
      running.flatMap(({ service, port }) =>
        service.probes.map((probe) =>
          typeof probe === 'string'
            ? waitForStatus(port, probe)
            : waitForStatus(port, probe.path, probe.expected),
        ),
      ),
    );
  } catch (error) {
    const diagnostics = running
      .map(({ service, getOutput }) => `\n--- ${service.name} ---\n${getOutput()}`)
      .join('');
    throw new Error(`${error instanceof Error ? error.message : String(error)}${diagnostics}`);
  } finally {
    await Promise.all(running.map(({ child }) => stopService(child)));
    if (enterpriseAuthMock) {
      await new Promise((resolveClose) => enterpriseAuthMock.close(resolveClose));
    }
  }
}

async function assertGatewayProductionExecutionHold(service, mode, options = {}) {
  const port = await getFreePort();
  const enterpriseAuth = await startGatewayEnterpriseAuthMock();
  const running = startService(service, mode, port, {
    ...options,
    env: { ...enterpriseAuth.env, ...options.env },
  });
  try {
    await waitForStatus(port, '/healthz');

    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.ready, false);
    assert.equal(readinessBody.status, 'execution-held');
    assert.equal(readinessBody.revocationSync?.ready, true);
    assert.deepEqual(
      {
        status: readinessBody.execution?.status,
        ready: readinessBody.execution?.ready,
        mutationAllowed: readinessBody.execution?.mutationAllowed,
        qualifiedAdapters: readinessBody.execution?.qualifiedAdapters,
        durableRunStore: readinessBody.execution?.durableRunStore,
      },
      {
        status: 'held',
        ready: false,
        mutationAllowed: false,
        qualifiedAdapters: false,
        durableRunStore: false,
      },
    );

    const authorization = { authorization: `Bearer ${TEST_SECRET}` };
    const mcpHealth = await waitForStatus(port, '/mcp/health', 503, {
      headers: authorization,
    });
    const mcpHealthBody = await mcpHealth.json();
    assert.equal(mcpHealthBody.status, 'degraded');
    assert.equal(mcpHealthBody.revocationSync?.ready, true);
    assert.equal(mcpHealthBody.execution?.status, 'held');

    const initialize = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: {
        ...authorization,
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'service-runtime-proof', version: '1.0' },
        },
      }),
    });
    assert.equal(initialize.status, 200);
    const initializeBody = await readMcpResponse(initialize);
    assert.equal(initializeBody.error, undefined);
    const sessionId = initialize.headers.get('mcp-session-id');
    assert.ok(sessionId, 'Gateway initialize response must bind a session');

    const mutation = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: {
        ...authorization,
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'mcp-session-id': sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'substrate_submit_run',
          arguments: {
            workflowId: 'must-not-dispatch',
            input: { marker: 'service-runtime-proof' },
            mode: 'live',
          },
        },
      }),
    });
    assert.equal(mutation.status, 200);
    const mutationBody = await readMcpResponse(mutation);
    assert.equal(mutationBody.result?.isError, true);
    const errorText = mutationBody.result?.content?.find(({ type }) => type === 'text')?.text;
    assert.ok(errorText, 'Production execution HOLD must return a structured tool error');
    const toolError = JSON.parse(errorText);
    assert.equal(toolError.details?.code, 'PRODUCTION_EXECUTION_HOLD');
    assert.equal(toolError.details?.execution?.status, 'held');
    assert.equal(toolError.details?.execution?.mutationAllowed, false);
    assert.equal(
      toolError.runId,
      undefined,
      'Held production mutation must not fabricate a run ID',
    );
    assert.doesNotMatch(errorText, /"runId"\s*:/, 'Held production mutation must not dispatch');
  } catch (error) {
    throw new Error(
      `${service.name} ${mode} production execution HOLD failed: ${
        error instanceof Error ? error.message : String(error)
      }\n${running.getOutput()}`,
    );
  } finally {
    await stopService(running.child);
    await new Promise((resolveClose) => enterpriseAuth.server.close(resolveClose));
  }
}

async function assertInvalidSecretFails(service, mode, value) {
  const port = await getFreePort();
  const secretEnv = Object.fromEntries(service.requiredSecretEnvs.map((name) => [name, value]));
  const running = startService(service, mode, port, {
    env: secretEnv,
    omitEnv: value === undefined ? service.requiredSecretEnvs : [],
  });
  const caseName = value === undefined ? 'missing' : 'whitespace-only';
  const code = await Promise.race([
    new Promise((resolveExit) => running.child.once('exit', resolveExit)),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${service.name} accepted a ${caseName} required secret`)),
        5_000,
      ),
    ),
  ]).finally(() => stopService(running.child));
  assert.notEqual(code, 0, `${service.name} must exit non-zero with a ${caseName} required secret`);
  assert.match(running.getOutput(), /required|refusing to start/);
}

async function assertInvalidProductionConfigFails(
  service,
  mode,
  { label, omitEnv = [], env = {}, expected },
) {
  const port = await getFreePort();
  const running = startService(service, mode, port, { env, omitEnv });
  const code = await Promise.race([
    new Promise((resolveExit) => running.child.once('exit', resolveExit)),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${service.name} accepted invalid production config: ${label}`)),
        5_000,
      ),
    ),
  ]).finally(() => stopService(running.child));
  assert.notEqual(code, 0, `${service.name} must exit non-zero for ${label}`);
  assert.match(running.getOutput(), expected);
}

function assertExportTarget(target, manifestPath, exportName) {
  assert.equal(
    typeof target,
    'object',
    `${manifestPath} ${exportName} must use conditional exports`,
  );
  assert.match(target.development, /^\.\/src\/.+\.tsx?$/);
  assert.match(target.workspace, /^\.\/src\/.+\.tsx?$/);
  assert.match(target.types, /^\.\/dist\/.+\.d\.ts$/);
  assert.match(target.import, /^\.\/dist\/.+\.js$/);
  assert.deepEqual(Object.keys(target), ['development', 'workspace', 'types', 'import']);
}

async function assertProductionEntrypoints() {
  for (const manifestPath of RUNTIME_MANIFESTS) {
    const fullPath = join(REPO_ROOT, manifestPath);
    let manifest;
    try {
      manifest = JSON.parse(await readFile(fullPath, 'utf8'));
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') continue;
      throw error;
    }
    for (const [exportName, target] of Object.entries(manifest.exports ?? {})) {
      assertExportTarget(target, manifestPath, exportName);
      await access(join(REPO_ROOT, dirname(manifestPath), target.types));
      await access(join(REPO_ROOT, dirname(manifestPath), target.import));
    }
    if (manifest.main) {
      assert.doesNotMatch(manifest.main, /(?:^|\/)src\//, `${manifestPath} main targets source`);
      await access(join(REPO_ROOT, dirname(manifestPath), manifest.main));
    }
  }
}

async function assertContainerBuildContracts() {
  const dockerignore = await readFile(join(REPO_ROOT, '.dockerignore'), 'utf8');
  assert.match(dockerignore, /^\*\*\/\*\.tsbuildinfo$/m);
  for (const service of SERVICES) {
    const dockerfile = await readFile(
      join(REPO_ROOT, dirname(service.source), '..', 'Dockerfile'),
      'utf8',
    );
    assert.match(dockerfile, service.containerBuildPattern ?? /tsc --build --force tsconfig\.json/);
    assert.match(
      dockerfile,
      /pnpm install --frozen-lockfile --offline --ignore-scripts --prod=false/,
    );
    assert.match(
      dockerfile,
      /RUN --mount=type=cache,id=pnpm-store,target=\/root\/\.local\/share\/pnpm\/store \\\n\s+node scripts\/ci\/deploy-production\.mjs/,
    );
    assert.doesNotMatch(dockerfile, /deploy[^\n]*--legacy/);
  }
  for (const file of [
    'services/alloy-fabric-api/Dockerfile',
    'workers/alloy-vector-worker/Dockerfile',
  ]) {
    const dockerfile = await readFile(join(REPO_ROOT, file), 'utf8');
    assert.doesNotMatch(dockerfile, /node:26-alpine/);
    assert.match(
      dockerfile,
      /node:26-bookworm-slim@sha256:662933cf47f013bc8e4beb31a6116448427a82057ba7c42c97e4c5ba766504c2/,
    );
    assert.match(dockerfile, /import\('@huggingface\/transformers'\)/);
    assert.match(dockerfile, /\+['"]\/readyz['"]/);
  }
  for (const file of [
    'apps/alloy-runtime-api/Dockerfile',
    'services/alloy-fabric-ingest-control/Dockerfile',
    'workers/alloy-rank-worker/Dockerfile',
  ]) {
    const dockerfile = await readFile(join(REPO_ROOT, file), 'utf8');
    assert.match(dockerfile, /\+['"]\/readyz['"]/);
  }
}

async function assertDevelopmentBackendReadinessRecovers(service, mode) {
  const port = await getFreePort();
  const upstreamPort = await getFreePort();
  const running = startService(service, mode, port, {
    env: {
      NODE_ENV: 'development',
      AEF_EMBED_BACKEND: 'external-http',
      AEF_EMBED_ENDPOINT: `http://127.0.0.1:${upstreamPort}`,
      AEF_EMBED_API_KEY: TEST_SECRET,
      AEF_EMBED_MODEL_REF: TEST_EXTERNAL_MODEL_REF,
    },
  });
  let upstream;
  try {
    await waitForStatus(port, '/health');
    await waitForStatus(port, '/readyz', 503);
    upstream = createHttpServer((request, response) => {
      response.setHeader('content-type', 'application/json');
      if (request.url === '/health') {
        response.end('{"status":"ok"}');
        return;
      }
      if (request.url === '/embeddings') {
        let body = '';
        request.setEncoding('utf8');
        request.on('data', (chunk) => {
          body += chunk;
        });
        request.on('end', () => {
          const inputs = JSON.parse(body).inputs;
          const outputs = inputs.map((input) => ({
            chunkId: input.chunkId,
            vector: [1, ...new Array(1535).fill(0)],
            dimensions: 1536,
            modelRef: TEST_EXTERNAL_MODEL_REF,
            tokenCount: 1,
            latencyMs: 1,
          }));
          response.end(JSON.stringify({ outputs }));
        });
        return;
      }
      response.statusCode = 404;
      response.end('{}');
    });
    await new Promise((resolveListen, reject) => {
      upstream.once('error', reject);
      upstream.listen(upstreamPort, '127.0.0.1', resolveListen);
    });
    await waitForStatus(port, '/readyz');

    const modelSpoof = await fetch(`http://127.0.0.1:${port}/embed`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            chunkId: 'model-spoof',
            text: 'caller model identity must not be trusted',
            modelRef: 'attacker-controlled-model',
          },
        ],
      }),
    });
    assert.equal(modelSpoof.status, 400);
    assert.equal((await modelSpoof.json()).error, 'model_ref_mismatch');

    const embedding = await fetch(`http://127.0.0.1:${port}/embed`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [{ chunkId: 'qualified-backend', text: 'qualified external backend' }],
      }),
    });
    assert.equal(embedding.status, 200);
    const embeddingBody = await embedding.json();
    assert.equal(embeddingBody.outputs.length, 1);
    assert.equal(embeddingBody.outputs[0].chunkId, 'qualified-backend');
    assert.equal(embeddingBody.outputs[0].modelRef, TEST_EXTERNAL_MODEL_REF);

    await new Promise((resolveClose) => upstream.close(resolveClose));
    upstream = undefined;
    await waitForStatus(port, '/readyz', 503);
  } finally {
    if (upstream) await new Promise((resolveClose) => upstream.close(resolveClose));
    await stopService(running.child);
  }
}

async function assertFabricProductionRoutesHold(service, mode, options = {}) {
  const port = await getFreePort();
  const running = startService(service, mode, port, options);
  const tenantId = service.env.AEF_API_TENANT_ID;
  assert.equal(typeof tenantId, 'string');
  try {
    await waitForStatus(port, '/healthz');
    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.ready, false);
    assert.equal(readinessBody.code, 'PRODUCTION_CAPABILITY_UNAVAILABLE');
    assert.equal(readinessBody.evidenceState, 'UNAVAILABLE');

    for (const [path, body] of [
      [
        '/v1/embed',
        {
          requestId: 'embed-model-spoof',
          tenantId,
          texts: ['model identity must be authoritative'],
          model: 'BAAI/bge-m3',
        },
      ],
      [
        '/v1/rerank',
        {
          requestId: 'rerank-model-spoof',
          tenantId,
          query: 'identity',
          candidates: [{ id: 'candidate', text: 'identity' }],
          model: 'BAAI/bge-reranker-v2-m3',
        },
      ],
      ['/v1/hybrid-search', {}],
      ['/v1/ingest', {}],
      ['/v1/openai/embeddings', {}],
      ['/v1/index/rebuild', {}],
      ['/v1/index/verify', {}],
      ['/v1/evals/run', {}],
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${TEST_SECRET}`,
          'content-type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 503, `${path} executed despite the production HOLD`);
      const payload = await response.json();
      assert.equal(payload.code, 'PRODUCTION_CAPABILITY_UNAVAILABLE');
      assert.equal(payload.evidenceState, 'UNAVAILABLE');
      const serialized = JSON.stringify(payload);
      for (const forbiddenField of [
        'vectors',
        'reranked',
        'hits',
        'jobId',
        'integrityCheckPassed',
        'evalId',
      ]) {
        assert.equal(
          Object.hasOwn(payload, forbiddenField),
          false,
          `${path} returned fabricated field ${forbiddenField}: ${serialized}`,
        );
      }
    }
  } finally {
    await stopService(running.child);
  }
}

async function assertFabricDevelopmentExecutionReceipts(service, mode) {
  const port = await getFreePort();
  const tenantId = service.env.AEF_API_TENANT_ID;
  assert.equal(typeof tenantId, 'string');
  const running = startService(service, mode, port, {
    env: { NODE_ENV: 'development', AEF_EMBED_BACKEND: 'deterministic-cpu' },
  });
  const headers = {
    authorization: `Bearer ${TEST_SECRET}`,
    'content-type': 'application/json',
    'x-tenant-id': tenantId,
  };
  try {
    await waitForStatus(port, '/readyz');

    const embed = await fetch(`http://127.0.0.1:${port}/v1/embed`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requestId: `development-embed-receipt-${mode}`,
        tenantId,
        texts: ['development embeddings must identify their execution backend'],
      }),
    });
    assert.equal(embed.status, 200);
    const embedBody = await embed.json();
    assert.equal(embedBody.execution?.backendId, 'deterministic-cpu:aef-deterministic-cpu-v1');
    assert.equal(embedBody.execution?.modelId, 'aef-deterministic-cpu-v1');
    assert.equal(embedBody.execution?.dimensions, 768);
    assert.equal(embedBody.execution?.normalized, true);
    assert.equal(embedBody.execution?.promotionState, 'DEVELOPMENT');
    assert.deepEqual(embedBody.execution?.supportedModalities, ['text']);

    const rerank = await fetch(`http://127.0.0.1:${port}/v1/rerank`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requestId: `development-rerank-receipt-${mode}`,
        tenantId,
        query: 'execution receipt',
        candidates: [{ id: 'candidate', text: 'execution receipt' }],
      }),
    });
    assert.equal(rerank.status, 200);
    const rerankBody = await rerank.json();
    assert.deepEqual(rerankBody.execution, {
      backendId: 'alloy-rank-worker:lexical-overlap-v1',
      modelId: 'lexical-overlap-v1',
      promotionState: 'DEVELOPMENT',
      implementationKind: 'lexical-overlap',
      fallback: false,
    });
  } finally {
    await stopService(running.child);
  }
}

async function assertFabricRejectsCrossTenantCredential(service, mode) {
  const port = await getFreePort();
  const running = startService(service, mode, port);
  try {
    await waitForStatus(port, '/healthz');
    const response = await fetch(`http://127.0.0.1:${port}/v1/embed`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
        'x-tenant-id': 'different-tenant',
      },
      body: JSON.stringify({
        requestId: 'cross-tenant-must-fail',
        tenantId: 'different-tenant',
        texts: ['this request must not reach the embedding backend'],
      }),
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error, 'credential_tenant_mismatch');
  } finally {
    await stopService(running.child);
  }
}

async function assertRuntimeApiProductionHold(service, mode, options = {}) {
  const port = await getFreePort();
  const running = startService(service, mode, port, options);
  const authHeaders = {
    'x-api-key': TEST_SECRET,
    'x-tenant-id': TEST_RUNTIME_TENANT,
    'content-type': 'application/json',
  };
  try {
    const health = await waitForStatus(port, '/healthz');
    assert.equal((await health.json()).status, 'ok');
    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.ready, false);
    assert.ok(
      readinessBody.dependencies.some(
        (dependency) =>
          dependency.name === 'production-capability-backends' && dependency.ready === false,
      ),
    );

    for (const [method, path] of [
      ['POST', '/v1/tasks/plan'],
      ['POST', '/v1/memory/write'],
      ['GET', '/v1/workflows'],
      ['POST', '/v1/search/hybrid'],
      ['POST', '/v1/embed'],
      ['POST', '/v1/index/rebuild'],
      ['POST', '/v1/evals/run'],
      ['GET', '/v1/ouroboros/sentra/anchor-state'],
      ['POST', '/v1/ouroboros/lutar/v1'],
      ['GET', '/api/a11oy/v1/atelier/health'],
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: authHeaders,
        ...(method === 'POST' ? { body: '{}' } : {}),
      });
      assert.equal(response.status, 503, `${method} ${path} bypassed the production HOLD`);
      const body = await response.json();
      assert.equal(body.code, 'PRODUCTION_CAPABILITY_UNAVAILABLE');
      assert.equal(body.evidenceState, 'UNAVAILABLE');
      for (const forbiddenField of [
        'runId',
        'workflowId',
        'memoryId',
        'evalRunId',
        'results',
        'hits',
      ]) {
        assert.equal(
          Object.hasOwn(body, forbiddenField),
          false,
          `${method} ${path} returned fabricated field ${forbiddenField}`,
        );
      }
    }

    const crossTenant = await fetch(`http://127.0.0.1:${port}/v1/memory/write`, {
      method: 'POST',
      headers: {
        'x-api-key': TEST_SECRET,
        'x-tenant-id': 'different-tenant',
        'content-type': 'application/json',
      },
      body: '{}',
    });
    assert.equal(crossTenant.status, 403);
    assert.equal((await crossTenant.json()).code, 'TENANT_SCOPE_MISMATCH');

    const beacon = await fetch(`http://127.0.0.1:${port}/api/omnia/adoption/beacon`, {
      method: 'POST',
    });
    assert.equal(beacon.status, 503);
    assert.equal((await beacon.json()).code, 'PRODUCTION_CAPABILITY_UNAVAILABLE');
  } finally {
    await stopService(running.child);
  }
}

async function assertIngestControlProductionHoldAndTenantIsolation(service, mode, options = {}) {
  const port = await getFreePort();
  const dataDir = await mkdtemp(join(tmpdir(), 'a11oy-ingest-control-state-'));
  const foreignWorkflowId = 'foreign-workflow';
  const foreignApprovalId = 'foreign-approval';
  const now = new Date().toISOString();
  await writeFile(
    join(dataDir, 'checkpoints.json'),
    JSON.stringify([
      [
        foreignWorkflowId,
        {
          workflowId: foreignWorkflowId,
          tenantId: 'different-tenant',
          kind: 'rebuild_index',
          currentStepIndex: 0,
          totalSteps: 1,
          status: 'waiting_approval',
          completedSteps: [],
          context: {},
          createdAt: now,
          updatedAt: now,
          approvalRequestId: foreignApprovalId,
        },
      ],
    ]),
  );
  await writeFile(
    join(dataDir, 'approvals.json'),
    JSON.stringify([
      [
        foreignApprovalId,
        {
          approvalId: foreignApprovalId,
          workflowId: foreignWorkflowId,
          kind: 'rebuild_index.approval',
          requestedAt: now,
          decision: 'pending',
          context: {},
        },
      ],
    ]),
  );

  const running = startService(service, mode, port, {
    ...options,
    env: { AEF_DATA_DIR: dataDir, ...options.env },
  });
  const headers = {
    authorization: `Bearer ${TEST_SECRET}`,
    'content-type': 'application/json',
  };
  try {
    await waitForStatus(port, '/healthz');
    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.ready, false);
    assert.equal(readinessBody.status, 'HOLD');
    assert.equal(readinessBody.code, 'INGEST_CONTROL_PRODUCTION_UNAVAILABLE');
    assert.equal(readinessBody.evidenceState, 'UNAVAILABLE');

    const heldMutation = await fetch(`http://127.0.0.1:${port}/control/ingest`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenantId: TEST_INGEST_CONTROL_TENANT }),
    });
    assert.equal(heldMutation.status, 503);
    const heldPayload = await heldMutation.json();
    assert.equal(heldPayload.code, 'INGEST_CONTROL_PRODUCTION_UNAVAILABLE');
    assert.equal(heldPayload.evidenceState, 'UNAVAILABLE');
    assert.equal(Object.hasOwn(heldPayload, 'results'), false);

    const bodyTenantMismatch = await fetch(`http://127.0.0.1:${port}/control/ingest`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenantId: 'different-tenant' }),
    });
    assert.equal(bodyTenantMismatch.status, 403);
    assert.equal((await bodyTenantMismatch.json()).error, 'credential_tenant_mismatch');

    const whitespaceTenant = await fetch(`http://127.0.0.1:${port}/control/ingest`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tenantId: '   ' }),
    });
    assert.equal(whitespaceTenant.status, 400);
    assert.equal((await whitespaceTenant.json()).error, 'invalid_tenant_id');

    const foreignResume = await fetch(
      `http://127.0.0.1:${port}/control/workflows/${foreignWorkflowId}/resume`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ tenantId: TEST_INGEST_CONTROL_TENANT }),
      },
    );
    assert.equal(foreignResume.status, 404);
    assert.equal((await foreignResume.json()).error, 'workflow_not_found');

    const foreignApproval = await fetch(
      `http://127.0.0.1:${port}/control/approvals/${foreignApprovalId}/resolve`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ decision: 'approved', resolvedBy: 'attacker' }),
      },
    );
    assert.equal(foreignApproval.status, 404);
    assert.equal((await foreignApproval.json()).error, 'approval_not_found');

    const foreignApprovalList = await fetch(
      `http://127.0.0.1:${port}/control/approvals/${foreignWorkflowId}`,
      { headers: { authorization: `Bearer ${TEST_SECRET}` } },
    );
    assert.equal(foreignApprovalList.status, 404);
    assert.equal((await foreignApprovalList.json()).error, 'workflow_not_found');
  } finally {
    await stopService(running.child);
    await rm(dataDir, { recursive: true, force: true });
  }
}

async function assertRankWorkerProductionHold(service, mode, options = {}) {
  const port = await getFreePort();
  const running = startService(service, mode, port, options);
  try {
    await waitForStatus(port, '/healthz');
    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.ready, false);
    assert.equal(readinessBody.status, 'HOLD');
    assert.equal(readinessBody.code, 'RANKING_BACKEND_UNAVAILABLE');
    assert.equal(readinessBody.evidenceState, 'UNAVAILABLE');

    const response = await fetch(`http://127.0.0.1:${port}/rerank`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: 'production must not use lexical overlap',
        candidates: [{ id: 'candidate', text: 'lexical overlap' }],
      }),
    });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, 'RANKING_BACKEND_UNAVAILABLE');
    assert.equal(body.evidenceState, 'UNAVAILABLE');
    assert.equal(Object.hasOwn(body, 'results'), false);
  } finally {
    await stopService(running.child);
  }
}

async function assertVectorWorkerDevelopmentBackendHold(service, mode, options = {}) {
  const port = await getFreePort();
  const running = startService(service, mode, port, options);
  try {
    await waitForStatus(port, '/healthz');
    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.ready, false);
    assert.equal(readinessBody.status, 'HOLD');
    assert.equal(readinessBody.code, 'EMBEDDING_BACKEND_UNQUALIFIED');
    assert.equal(readinessBody.evidenceState, 'UNAVAILABLE');
    assert.equal(readinessBody.backend, 'deterministic-cpu');

    const response = await fetch(`http://127.0.0.1:${port}/embed`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            chunkId: 'must-not-embed',
            text: 'deterministic vectors carry no semantic signal',
            inputType: 'passage',
          },
        ],
      }),
    });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, 'EMBEDDING_BACKEND_UNQUALIFIED');
    assert.equal(body.evidenceState, 'UNAVAILABLE');
    assert.equal(Object.hasOwn(body, 'outputs'), false);
  } finally {
    await stopService(running.child);
  }
}

async function assertVectorWorkerDuplicateIdsRemainCorrelated(service, mode) {
  const port = await getFreePort();
  const running = startService(service, mode, port, {
    env: {
      NODE_ENV: 'development',
      AEF_EMBED_BACKEND: 'deterministic-cpu',
      AEF_EMBED_FLUSH_MS: '100',
    },
  });
  try {
    await waitForStatus(port, '/readyz');
    const response = await fetch(`http://127.0.0.1:${port}/embed`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          { chunkId: 'shared-caller-id', text: 'short', inputType: 'passage' },
          {
            chunkId: 'shared-caller-id',
            text: 'a distinctly longer input whose embedding must stay with its own caller',
            inputType: 'passage',
          },
        ],
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.outputs.length, 2);
    assert.deepEqual(
      body.outputs.map(({ chunkId }) => chunkId),
      ['shared-caller-id', 'shared-caller-id'],
    );
    assert.notDeepEqual(
      body.outputs[0].vector,
      body.outputs[1].vector,
      'Duplicate caller chunkIds must not collapse micro-batch output correlation',
    );
  } finally {
    await stopService(running.child);
  }
}

async function assertVectorWorkerCustomModelHold(service, mode) {
  const port = await getFreePort();
  const customRevision = 'd'.repeat(40);
  const running = startService(service, mode, port, {
    env: {
      AEF_EMBED_BACKEND: 'local-cpu',
      AEF_HF_MODEL_ID: 'unapproved/custom-model',
      AEF_HF_MODEL_REVISION: customRevision,
      AEF_HF_ALLOW_REMOTE_MODELS: 'false',
    },
  });
  try {
    await waitForStatus(port, '/healthz');
    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.code, 'EMBEDDING_BACKEND_UNQUALIFIED');
    assert.equal(readinessBody.backend, 'local-cpu');
    assert.equal(readinessBody.modelRef, `unapproved/custom-model@${customRevision}`);

    const response = await fetch(`http://127.0.0.1:${port}/embed`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [{ chunkId: 'unapproved-model', text: 'must remain on production hold' }],
      }),
    });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, 'EMBEDDING_BACKEND_UNQUALIFIED');
    assert.equal(Object.hasOwn(body, 'outputs'), false);
  } finally {
    await stopService(running.child);
  }
}

async function assertVectorWorkerPinnedModelStillHolds(service, mode) {
  const port = await getFreePort();
  const running = startService(service, mode, port, {
    env: {
      AEF_EMBED_BACKEND: 'local-cpu',
      AEF_HF_MODEL_ID: 'Xenova/all-MiniLM-L6-v2',
      AEF_HF_MODEL_REVISION: '751bff37182d3f1213fa05d7196b954e230abad9',
      AEF_HF_ALLOW_REMOTE_MODELS: 'false',
    },
  });
  try {
    await waitForStatus(port, '/healthz');
    const readiness = await waitForStatus(port, '/readyz', 503);
    const readinessBody = await readiness.json();
    assert.equal(readinessBody.code, 'EMBEDDING_BACKEND_UNQUALIFIED');
    assert.equal(readinessBody.backendConfigurationApproved, true);
    assert.equal(readinessBody.promotionReceiptVerified, false);

    const response = await fetch(`http://127.0.0.1:${port}/embed`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${TEST_SECRET}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [{ chunkId: 'unqualified-artifact', text: 'configuration is not evidence' }],
      }),
    });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, 'EMBEDDING_BACKEND_UNQUALIFIED');
    assert.equal(body.promotionReceiptVerified, false);
    assert.equal(Object.hasOwn(body, 'outputs'), false);
  } finally {
    await stopService(running.child);
  }
}

function computeCompiledSubstrateSignature(signingKey) {
  const program = [
    "import { signBundleHash } from './packages/substrate/dist/journal.js';",
    "process.stdout.write(signBundleHash('restart-verification-probe'));",
  ].join('');
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', program], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, SUBSTRATE_SIGNING_KEY: signingKey },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^[0-9a-f]{32}$/);
  return result.stdout;
}

async function deployServices(scratch) {
  const deployed = [];
  for (const service of SERVICES) {
    const deployRoot = join(scratch, service.name);
    await deployProduction(service.packageName, deployRoot);
    await access(join(deployRoot, service.compiled));
    deployed.push({ ...service, deployRoot });
  }
  return deployed;
}

test('six Node service surfaces build cleanly and boot from production deploy layouts', {
  timeout: 600_000,
}, async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'a11oy-service-runtime-'));
  try {
    await assertContainerBuildContracts();
    await cleanGeneratedOutputs();
    for (const service of SERVICES) {
      await assertInvalidSecretFails(service, 'source', undefined);
      await assertInvalidSecretFails(service, 'source', '   ');
    }
    await probeServices('source');
    const sourceRuntime = SERVICES.find(({ name }) => name === 'alloy-runtime-api');
    const sourceFabric = SERVICES.find(({ name }) => name === 'alloy-fabric-api');
    const sourceIngestControl = SERVICES.find(({ name }) => name === 'alloy-fabric-ingest-control');
    const sourceRank = SERVICES.find(({ name }) => name === 'alloy-rank-worker');
    const sourceVector = SERVICES.find(({ name }) => name === 'alloy-vector-worker');
    assert.ok(sourceRuntime && sourceFabric && sourceIngestControl && sourceRank && sourceVector);
    await assertRuntimeApiProductionHold(sourceRuntime, 'source');
    await assertRankWorkerProductionHold(sourceRank, 'source');
    await assertVectorWorkerDevelopmentBackendHold(sourceVector, 'source');
    await assertVectorWorkerDuplicateIdsRemainCorrelated(sourceVector, 'source');
    await assertVectorWorkerCustomModelHold(sourceVector, 'source');
    await assertVectorWorkerPinnedModelStillHolds(sourceVector, 'source');
    await assertDevelopmentBackendReadinessRecovers(sourceVector, 'source');
    await assertFabricProductionRoutesHold(sourceFabric, 'source');
    await assertFabricDevelopmentExecutionReceipts(sourceFabric, 'source');
    await assertFabricRejectsCrossTenantCredential(sourceFabric, 'source');
    await assertIngestControlProductionHoldAndTenantIsolation(sourceIngestControl, 'source');

    // A development-looking NODE_ENV must never override a service-specific
    // production marker. These full route probes prove HOLD before execution.
    await assertRuntimeApiProductionHold(sourceRuntime, 'source', {
      env: { NODE_ENV: 'test', ALLOY_RUNTIME_ENV: 'production' },
    });
    await assertFabricProductionRoutesHold(sourceFabric, 'source', {
      env: { NODE_ENV: 'test', AEF_FABRIC_ENV: 'production' },
    });
    await assertIngestControlProductionHoldAndTenantIsolation(sourceIngestControl, 'source', {
      env: { NODE_ENV: 'test', AEF_INGEST_CONTROL_ENV: 'production' },
    });
    await assertRankWorkerProductionHold(sourceRank, 'source', {
      env: { NODE_ENV: 'test', AEF_RANK_WORKER_ENV: 'production' },
    });
    await assertVectorWorkerDevelopmentBackendHold(sourceVector, 'source', {
      env: { NODE_ENV: 'test', AEF_VECTOR_WORKER_ENV: 'production' },
    });

    const gateway = SERVICES.find(({ name }) => name === 'substrate-mcp-gateway');
    assert.ok(gateway);
    await assertGatewayProductionExecutionHold(gateway, 'source');
    for (const [service, cases] of [
      [
        sourceRuntime,
        [
          {
            label: 'missing runtime API credential tenant binding',
            omitEnv: ['ALLOY_API_TENANT_ID'],
            expected: /ALLOY_API_TENANT_ID is required/,
          },
          {
            label: 'blank runtime API credential tenant binding',
            env: { ALLOY_API_TENANT_ID: '   ' },
            expected: /ALLOY_API_TENANT_ID is required/,
          },
        ],
      ],
      [
        gateway,
        [
          {
            label: 'missing gateway tenant binding',
            omitEnv: ['SUBSTRATE_GATEWAY_TENANT_ID'],
            expected: /SUBSTRATE_GATEWAY_TENANT_ID is required/,
          },
          {
            label: 'blank gateway tenant binding',
            env: { SUBSTRATE_GATEWAY_TENANT_ID: '   ' },
            expected: /SUBSTRATE_GATEWAY_TENANT_ID is required/,
          },
          {
            label: 'missing signing key',
            omitEnv: ['SUBSTRATE_SIGNING_KEY'],
            expected: /SUBSTRATE_SIGNING_KEY is required/,
          },
          {
            label: 'malformed signing key',
            env: { SUBSTRATE_SIGNING_KEY: 'abc123' },
            expected: /exactly 64 hexadecimal characters/,
          },
        ],
      ],
      [
        sourceFabric,
        [
          {
            label: 'missing fabric credential tenant binding',
            omitEnv: ['AEF_API_TENANT_ID'],
            expected: /AEF_API_TENANT_ID is required/,
          },
          {
            label: 'blank fabric credential tenant binding',
            env: { AEF_API_TENANT_ID: '   ' },
            expected: /AEF_API_TENANT_ID is required/,
          },
        ],
      ],
      [
        sourceIngestControl,
        [
          {
            label: 'missing ingest-control credential tenant binding',
            omitEnv: ['AEF_S2S_TENANT_ID'],
            expected: /AEF_S2S_TENANT_ID is required/,
          },
          {
            label: 'blank ingest-control credential tenant binding',
            env: { AEF_S2S_TENANT_ID: '   ' },
            expected: /AEF_S2S_TENANT_ID is required/,
          },
        ],
      ],
      [sourceVector, INVALID_VECTOR_BATCH_CONFIGS],
    ]) {
      for (const invalidCase of cases) {
        await assertInvalidProductionConfigFails(service, 'source', invalidCase);
      }
    }

    run(
      PNPM,
      [
        'exec',
        'tsc',
        '--build',
        '--force',
        'services/substrate-mcp-gateway/tsconfig.json',
        'services/alloy-fabric-api/tsconfig.json',
        'services/alloy-fabric-ingest-control/tsconfig.json',
        'workers/alloy-rank-worker/tsconfig.json',
        'workers/alloy-vector-worker/tsconfig.json',
      ],
      'clean gateway/fabric/worker compiled build',
    );
    run(
      PNPM,
      ['turbo', 'run', 'build', '--filter=@workspace/alloy-runtime-api'],
      'clean alloy-runtime-api compiled build',
    );
    await assertProductionEntrypoints();

    const firstSignature = computeCompiledSubstrateSignature(TEST_SIGNING_KEY);
    const secondSignature = computeCompiledSubstrateSignature(TEST_SIGNING_KEY);
    const differentSignature = computeCompiledSubstrateSignature('b'.repeat(64));
    assert.equal(firstSignature, secondSignature, 'signatures must survive a process restart');
    assert.notEqual(firstSignature, differentSignature, 'signature must be key-bound');

    const rank = await import(
      pathToFileURL(join(REPO_ROOT, 'workers/alloy-rank-worker/dist/index.js')).href
    );
    const ranked = rank.rankCandidates(
      'alpha beta',
      [
        { id: 'match', text: 'alpha beta' },
        { id: 'miss', text: 'gamma' },
      ],
      2,
      'lexical-overlap',
    );
    assert.equal(ranked[0].id, 'match');
    assert.equal(ranked[0].mode, 'lexical-overlap');

    const contracts = await import(
      pathToFileURL(join(REPO_ROOT, 'packages/aef-contracts/dist/index.js')).href
    );
    assert.equal(
      contracts.RerankRequestSchema.safeParse({
        requestId: 'model-spoof',
        tenantId: 'runtime-test',
        query: 'query',
        candidates: [{ id: 'candidate', text: 'candidate' }],
        model: 'BAAI/bge-reranker-v2-m3',
      }).success,
      false,
    );
    assert.equal(contracts.RERANK_IMPLEMENTATION_ID, 'lexical-overlap-v1');

    const vector = await import(
      pathToFileURL(join(REPO_ROOT, 'workers/alloy-vector-worker/dist/index.js')).href
    );
    assert.equal(vector.DEFAULT_LOCAL_CPU_MODEL_ID, 'Xenova/all-MiniLM-L6-v2');
    assert.equal(
      vector.DEFAULT_LOCAL_CPU_MODEL_REVISION,
      '751bff37182d3f1213fa05d7196b954e230abad9',
    );
    assert.equal(vector.DEFAULT_LOCAL_CPU_DIMENSIONS, 384);
    assert.throws(
      () => new vector.LocalCpuBackend({ hfModelId: 'example/custom-model' }),
      /immutable revision is required/,
    );

    await probeServices('compiled');
    for (const invalidCase of INVALID_VECTOR_BATCH_CONFIGS) {
      await assertInvalidProductionConfigFails(sourceVector, 'compiled', invalidCase);
    }
    await assertGatewayProductionExecutionHold(gateway, 'compiled');
    await assertRuntimeApiProductionHold(sourceRuntime, 'compiled');
    await assertRankWorkerProductionHold(sourceRank, 'compiled');
    await assertVectorWorkerDevelopmentBackendHold(sourceVector, 'compiled');
    await assertVectorWorkerDuplicateIdsRemainCorrelated(sourceVector, 'compiled');
    await assertVectorWorkerCustomModelHold(sourceVector, 'compiled');
    await assertVectorWorkerPinnedModelStillHolds(sourceVector, 'compiled');
    await assertDevelopmentBackendReadinessRecovers(sourceVector, 'compiled');
    await assertFabricProductionRoutesHold(sourceFabric, 'compiled');
    await assertFabricDevelopmentExecutionReceipts(sourceFabric, 'compiled');
    await assertFabricRejectsCrossTenantCredential(sourceFabric, 'compiled');
    await assertIngestControlProductionHoldAndTenantIsolation(sourceIngestControl, 'compiled');

    const deployed = await deployServices(scratch);
    const deployedRuntime = deployed.find(({ name }) => name === 'alloy-runtime-api');
    const deployedGateway = deployed.find(({ name }) => name === 'substrate-mcp-gateway');
    const deployedRank = deployed.find(({ name }) => name === 'alloy-rank-worker');
    const deployedVector = deployed.find(({ name }) => name === 'alloy-vector-worker');
    for (const service of deployed) {
      await assertInvalidSecretFails(service, 'deployed', undefined);
      await assertInvalidSecretFails(service, 'deployed', '   ');
    }
    await probeServices('deployed', deployed);
    const deployedFabric = deployed.find(({ name }) => name === 'alloy-fabric-api');
    const deployedIngestControl = deployed.find(
      ({ name }) => name === 'alloy-fabric-ingest-control',
    );
    assert.ok(
      deployedRuntime &&
        deployedGateway &&
        deployedFabric &&
        deployedIngestControl &&
        deployedRank &&
        deployedVector,
    );
    for (const invalidCase of INVALID_VECTOR_BATCH_CONFIGS) {
      await assertInvalidProductionConfigFails(deployedVector, 'deployed', invalidCase);
    }
    await assertGatewayProductionExecutionHold(deployedGateway, 'deployed');
    await assertRuntimeApiProductionHold(deployedRuntime, 'deployed');
    await assertRankWorkerProductionHold(deployedRank, 'deployed');
    await assertVectorWorkerDevelopmentBackendHold(deployedVector, 'deployed');
    await assertVectorWorkerDuplicateIdsRemainCorrelated(deployedVector, 'deployed');
    await assertVectorWorkerCustomModelHold(deployedVector, 'deployed');
    await assertVectorWorkerPinnedModelStillHolds(deployedVector, 'deployed');
    await assertDevelopmentBackendReadinessRecovers(deployedVector, 'deployed');
    await assertFabricProductionRoutesHold(deployedFabric, 'deployed');
    await assertFabricDevelopmentExecutionReceipts(deployedFabric, 'deployed');
    await assertFabricRejectsCrossTenantCredential(deployedFabric, 'deployed');
    await assertIngestControlProductionHoldAndTenantIsolation(deployedIngestControl, 'deployed');
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
