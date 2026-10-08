function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function isValidDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
export const EXPECTED_HOLDS = [
  'task-planning-and-execution',
  'memory-fabric',
  'workflow-execution',
  'hybrid-search',
  'embedding',
  'reranking',
  'openai-embedding-compat',
  'index-rebuild',
  'index-verification',
  'evaluation-runner',
  'atelier',
  'ouroboros-integrations',
  'lutar-evaluation',
];
const EXPECTED_DEPENDENCIES = ['memory-store', 'run-registry', 'workflow-runtime'];

export function validateRuntimeReadiness(status, body, gitSha, policy = 'ready') {
  invariant(
    ['ready', 'production-hold'].includes(policy),
    'SMOKE_READINESS_POLICY must be ready or production-hold',
  );
  const held = policy === 'production-hold';
  const expectedStatus = held ? 503 : 200;
  invariant(
    status === expectedStatus,
    `/readyz returned HTTP ${status}, expected ${expectedStatus}`,
  );
  invariant(body && typeof body === 'object', '/readyz returned no JSON object');
  invariant(
    body.ready === !held,
    `/readyz ready is ${JSON.stringify(body.ready)}, expected ${!held}`,
  );
  invariant(
    body.service === 'alloy-runtime-api',
    `/readyz service is ${JSON.stringify(body.service)}, expected "alloy-runtime-api"`,
  );
  invariant(isValidDate(body.checkedAt), '/readyz checkedAt is not a valid timestamp');
  invariant(Array.isArray(body.dependencies), '/readyz dependencies is not an array');
  invariant(typeof gitSha === 'string', 'liveness build identity was not established');
  invariant(
    body.gitSha === gitSha,
    `/readyz gitSha ${JSON.stringify(body.gitSha)} does not match /healthz ${gitSha}`,
  );

  const expectedDependencies = held
    ? [...EXPECTED_DEPENDENCIES, 'production-capability-backends']
    : EXPECTED_DEPENDENCIES;
  const dependencyNames = body.dependencies.map((dependency) => dependency?.name);
  invariant(
    body.dependencies.length === expectedDependencies.length &&
      new Set(dependencyNames).size === expectedDependencies.length &&
      expectedDependencies.every((name) => dependencyNames.includes(name)),
    `/readyz dependencies are ${JSON.stringify(dependencyNames)}, expected ${JSON.stringify(expectedDependencies)}`,
  );

  for (const dependency of body.dependencies) {
    const blocked = held && dependency.name === 'production-capability-backends';
    invariant(dependency.ready === !blocked, `${dependency.name} readiness must be ${!blocked}`);
    invariant(
      Number.isFinite(dependency.latencyMs) && dependency.latencyMs >= 0,
      `${dependency.name} latencyMs is not a finite nonnegative number`,
    );
    const expectedDetail = blocked
      ? `unwired production capabilities: ${EXPECTED_HOLDS.join(', ')}`
      : 'ok';
    invariant(
      dependency.detail === expectedDetail,
      `${dependency.name} detail does not match its readiness policy`,
    );
  }

  return `HTTP ${expectedStatus}; ready=${!held}; dependencies=${dependencyNames.join(',')}`;
}
