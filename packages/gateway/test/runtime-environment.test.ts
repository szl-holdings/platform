import { afterEach, describe, expect, it } from 'vitest';
import { runAgent } from '../src/agent-runner.js';
import { ApprovalError, routeApproval } from '../src/approval.js';
import { AuthzError, evaluatePolicy, probeOpaDecision } from '../src/authz.js';
import { loadConfig, startServer } from '../src/server.js';
import type {
  AgentActionRequest,
  CallerIdentity,
  EvidenceRecord,
  GatewayConfig,
  OpaDecision,
} from '../src/types.js';

const ENVIRONMENT_KEYS = [
  'RUNTIME_MODE',
  'APP_ENV',
  'NODE_ENV',
  'SZL_ENV',
  'GATEWAY_EXECUTION_MODE',
  'JWT_SECRET',
] as const;

const originalValues = new Map(ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]));

const request: AgentActionRequest = {
  correlationId: 'runtime-marker-test',
  capability: 'inspect_code',
  model: 'local-stub',
  promptHash: 'runtime-marker-test',
  target: 'gateway',
  targetEnvironment: 'production',
  domain: 'platform',
  parameters: {},
  requestedAt: '2026-10-07T00:00:00.000Z',
};

const caller: CallerIdentity = {
  sub: 'runtime-marker-test',
  role: 'platform-engineer',
  groups: ['platform-team'],
  orgId: 'szl-holdings',
  iat: 1,
  exp: 2,
};

const evidence = {
  evidenceId: 'runtime-marker-evidence',
  correlationId: request.correlationId,
} as EvidenceRecord;

const decision: OpaDecision = {
  allowed: true,
  requiredApprovals: 1,
  requiredGroups: ['platform-team'],
  policyId: 'szl.approval/agent_inspect_code',
  evaluatedAt: '2026-10-07T00:00:00.000Z',
  reasons: [],
};

const localConfig: GatewayConfig = {
  jwt: { algorithm: 'HS256', secret: 'runtime-marker-test-secret' },
  opaEndpoint: 'local',
  temporalEndpoint: 'local',
  openAiApiKey: 'local',
  approvalWorkflow: null,
  evidenceLedger: null,
  auditLogPath: '/tmp/gateway-runtime-marker-test.ndjson',
  approvalTimeoutMs: 5_000,
};

function configureConflict(): void {
  process.env['NODE_ENV'] = 'test';
  process.env['RUNTIME_MODE'] = 'production';
}

afterEach(() => {
  for (const key of ENVIRONMENT_KEYS) {
    const value = originalValues.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe.sequential('Agent Gateway runtime marker safety boundary', () => {
  it('rejects the development stub when RUNTIME_MODE=production conflicts with NODE_ENV=test', () => {
    configureConflict();
    process.env['GATEWAY_EXECUTION_MODE'] = 'stub';
    process.env['JWT_SECRET'] = 'runtime-marker-test-secret';

    expect(() => loadConfig()).toThrow(/stub is permitted only in development or test/);
  });

  it('keeps local readiness on HOLD under the conflicting production marker', async () => {
    configureConflict();

    await expect(probeOpaDecision('local')).resolves.toBe(false);
    await expect(startServer(localConfig)).rejects.toThrow(/startup HOLD: OPA/);
  });

  it('blocks embedded OPA, local execution, and local auto-approval', async () => {
    configureConflict();

    await expect(evaluatePolicy(request, caller, 'local')).rejects.toBeInstanceOf(AuthzError);
    await expect(runAgent(request, evidence, 'local')).rejects.toThrow(
      /local Agent Gateway stub is forbidden in production/,
    );
    await expect(
      routeApproval(decision, evidence, request, caller, 'local', null, 5_000),
    ).rejects.toBeInstanceOf(ApprovalError);
  });

  it('treats an invalid RUNTIME_MODE as a startup-fatal configuration error', async () => {
    process.env['NODE_ENV'] = 'test';
    process.env['RUNTIME_MODE'] = 'prod';
    process.env['GATEWAY_EXECUTION_MODE'] = 'stub';
    process.env['JWT_SECRET'] = 'runtime-marker-test-secret';

    expect(() => loadConfig()).toThrow(/Invalid RUNTIME_MODE/);
    await expect(startServer(localConfig)).rejects.toThrow(/Invalid RUNTIME_MODE/);
  });
});
