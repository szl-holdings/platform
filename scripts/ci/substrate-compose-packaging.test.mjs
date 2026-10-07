import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const GPU_COMPOSE_PATH = join(REPO_ROOT, 'substrate/docker-compose.gpu.yml');
const CPU_COMPOSE_PATH = join(REPO_ROOT, 'substrate/docker-compose.cpu-stub.yml');
const ENV_EXAMPLE_PATH = join(REPO_ROOT, 'substrate/.env.substrate.example');
const WORKER_DOCKERFILE_PATH = join(REPO_ROOT, 'services/substrate-py-workers/Dockerfile');
const INFERENCE_DOCKERFILE_PATH = join(REPO_ROOT, 'apps/substrate-inference/Dockerfile');

const INFERENCE_REQUIRED_ENV = [
  'SUBSTRATE_API_KEY',
  'SUBSTRATE_API_TENANT_ID',
  'SUBSTRATE_MODEL_ADMIN_API_KEY',
  'SUBSTRATE_MODEL_REVISIONS_JSON',
];
const WORKER_REQUIRED_ENV = [
  'SUBSTRATE_PYTHON_WORKER_API_KEY',
  'SUBSTRATE_PYTHON_WORKER_TENANT_ID',
];
const ALL_REQUIRED_ENV = [...INFERENCE_REQUIRED_ENV, ...WORKER_REQUIRED_ENV];

async function loadCompose(path) {
  const source = await readFile(path, 'utf8');
  return { source, config: parseYaml(source) };
}

async function assertBuildClosure(composePath, service) {
  const context = resolve(dirname(composePath), service.build.context);
  const dockerfile = resolve(context, service.build.dockerfile);
  await access(context);
  await access(dockerfile);
}

function assertReadinessHealthcheck(service, label) {
  const command = JSON.stringify(service.healthcheck?.test ?? []);
  assert.match(command, /\/ready\b/, `${label} healthcheck must use readiness`);
  assert.doesNotMatch(
    command,
    /\/healthz?\b/,
    `${label} healthcheck must not substitute liveness for readiness`,
  );
}

function requiredExpression(name) {
  return `\${${name}:?${name} must be set}`;
}

test('GPU Compose has a complete fail-closed production deployment contract', async () => {
  const { config } = await loadCompose(GPU_COMPOSE_PATH);
  const inference = config.services['substrate-inference'];
  const worker = config.services['substrate-py-workers'];

  await Promise.all([
    assertBuildClosure(GPU_COMPOSE_PATH, inference),
    assertBuildClosure(GPU_COMPOSE_PATH, worker),
  ]);
  assert.equal(inference.build.target, 'runtime');
  assert.equal(worker.build.target, 'runtime');

  assert.equal(inference.environment.SUBSTRATE_INFERENCE_ENV, 'production');
  assert.equal(inference.environment.SUBSTRATE_INFERENCE_AUTH_BYPASS, 'false');
  for (const name of INFERENCE_REQUIRED_ENV) {
    assert.equal(inference.environment[name], requiredExpression(name));
  }

  assert.equal(worker.environment.HOST, '0.0.0.0');
  assert.equal(worker.environment.SUBSTRATE_PYTHON_WORKER_ENV, 'production');
  assert.equal(worker.environment.SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS, 'false');
  for (const name of WORKER_REQUIRED_ENV) {
    assert.equal(worker.environment[name], requiredExpression(name));
  }

  assertReadinessHealthcheck(inference, 'inference');
  assertReadinessHealthcheck(worker, 'worker');
  assert.equal(worker.depends_on['substrate-inference'].condition, 'service_healthy');
});

test('CPU stub is a standalone development-only non-GPU configuration', async () => {
  const { config } = await loadCompose(CPU_COMPOSE_PATH);
  const inference = config.services['substrate-inference'];
  const worker = config.services['substrate-py-workers'];

  await Promise.all([
    assertBuildClosure(CPU_COMPOSE_PATH, inference),
    assertBuildClosure(CPU_COMPOSE_PATH, worker),
  ]);
  assert.equal(inference.build.target, 'cpu-stub');
  assert.equal(worker.build.target, 'runtime');
  assert.equal(inference.environment.SUBSTRATE_INFERENCE_ENV, 'development');
  assert.equal(inference.environment.SUBSTRATE_INFERENCE_AUTH_BYPASS, 'true');
  assert.equal(worker.environment.SUBSTRATE_PYTHON_WORKER_ENV, 'development');
  assert.equal(worker.environment.SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS, 'true');
  assert.equal(worker.depends_on['substrate-inference'].condition, 'service_started');

  for (const name of ALL_REQUIRED_ENV) {
    assert.equal(inference.environment[name], undefined);
    assert.equal(worker.environment[name], undefined);
  }
  for (const service of [inference, worker]) {
    assert.equal(service.deploy, undefined);
    assertReadinessHealthcheck(service, `${service.image}`);
  }

  const rendered = JSON.stringify(config).toLowerCase();
  assert.doesNotMatch(rendered, /nvidia|"gpu"|production|:\?/);

  const inferenceDockerfile = await readFile(INFERENCE_DOCKERFILE_PATH, 'utf8');
  assert.match(inferenceDockerfile, /\bAS cpu-stub\b/i);
});

test('environment template declares every production input without credential defaults', async () => {
  const source = await readFile(ENV_EXAMPLE_PATH, 'utf8');
  const assignments = new Map(
    source
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );

  for (const name of ALL_REQUIRED_ENV) {
    assert.ok(assignments.has(name), `${name} must be documented`);
    assert.equal(assignments.get(name), '', `${name} must not have a committed value`);
  }
  assert.match(source, /docker compose --env-file \.env\.substrate/);
  assert.doesNotMatch(source, /\bsource \.env\.substrate\b/);
  assert.doesNotMatch(source, /deploy-substrate\.sh/);
  assert.doesNotMatch(source, /^VITE_.*(?:KEY|TOKEN|SECRET)=/m);
});

test('Python worker image packages runtime dependencies and probes readiness as non-root', async () => {
  const dockerfile = await readFile(WORKER_DOCKERFILE_PATH, 'utf8');
  const fromLines = dockerfile.match(/^FROM .+$/gm) ?? [];
  assert.equal(fromLines.length, 2);
  for (const line of fromLines) {
    assert.match(line, /@sha256:[a-f0-9]{64}\b/);
  }
  assert.match(dockerfile, /\bAS builder\b/i);
  assert.match(dockerfile, /\bAS runtime\b/i);
  assert.match(dockerfile, /pip wheel --wheel-dir \/wheels \./);
  assert.match(dockerfile, /pip install --no-index --find-links=\/wheels substrate-py-workers/);
  assert.match(dockerfile, /poppler-utils/);
  assert.match(dockerfile, /tesseract-ocr/);
  assert.match(dockerfile, /USER substrate/);
  assert.match(dockerfile, /EXPOSE 8090/);

  const healthcheck = dockerfile.split('HEALTHCHECK', 2)[1].split('LABEL', 1)[0];
  assert.match(healthcheck, /\/ready\b/);
  assert.doesNotMatch(healthcheck, /\/healthz?\b/);
  assert.match(dockerfile, /CMD \["python", "-m", "worker\.main"\]/);
  assert.ok(
    dockerfile.indexOf('USER substrate') < dockerfile.indexOf('CMD ["python"'),
    'worker must run as the non-root image user',
  );
});

test('Docker Compose renders both substrate configurations', (t) => {
  const version = spawnSync('docker', ['compose', 'version'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (version.error?.code === 'ENOENT') {
    t.skip('Docker Compose is not installed');
    return;
  }
  assert.equal(version.status, 0, version.stderr || version.stdout);

  const productionEnv = {
    ...process.env,
    SUBSTRATE_API_KEY: 'inference-packaging-test-only',
    SUBSTRATE_API_TENANT_ID: 'packaging-test-tenant',
    SUBSTRATE_MODEL_ADMIN_API_KEY: 'admin-packaging-test-only',
    SUBSTRATE_MODEL_REVISIONS_JSON: JSON.stringify({
      'llama-3.1-8b-instruct': 'a'.repeat(40),
    }),
    SUBSTRATE_PYTHON_WORKER_API_KEY: 'worker-packaging-test-only',
    SUBSTRATE_PYTHON_WORKER_TENANT_ID: 'packaging-test-tenant',
  };
  const gpu = spawnSync('docker', ['compose', '-f', GPU_COMPOSE_PATH, 'config', '--quiet'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: productionEnv,
  });
  assert.equal(gpu.status, 0, gpu.stderr || gpu.stdout);

  const developmentEnv = { ...process.env };
  for (const name of ALL_REQUIRED_ENV) delete developmentEnv[name];
  const cpu = spawnSync('docker', ['compose', '-f', CPU_COMPOSE_PATH, 'config', '--quiet'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: developmentEnv,
  });
  assert.equal(cpu.status, 0, cpu.stderr || cpu.stdout);
});
