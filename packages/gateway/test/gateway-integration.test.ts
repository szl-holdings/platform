/**
 * Agent Gateway — Integration Tests
 * Phase 11 — Agent Gateway
 *
 * Happy-path integration test: runs a fully-approved agent action
 * end-to-end against a fixture environment (all external deps set to local).
 *
 * Also tests authz_denied, auth_failed, and forbidden paths end-to-end.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AgentGateway } from '../src/gateway.js';
import { issueToken } from '../src/auth.js';
import type { GatewayConfig, CallerIdentity } from '../src/types.js';

const TEST_SECRET = 'gateway-integration-test-secret';

const TEST_CONFIG: GatewayConfig = {
  jwtSecret: TEST_SECRET,
  opaEndpoint: 'local',
  temporalEndpoint: 'local',
  openAiApiKey: 'local',
  auditLogPath: '/tmp/gateway-integration-test-audit.ndjson',
  approvalTimeoutMs: 5_000,
};

const PLATFORM_ENGINEER: Omit<CallerIdentity, 'iat' | 'exp'> = {
  sub: 'eng@szl.io',
  role: 'platform-engineer',
  groups: ['platform-team'],
  orgId: 'szl-holdings',
};

const AGENT_SERVICE_CALLER: Omit<CallerIdentity, 'iat' | 'exp'> = {
  sub: 'agent-service@szl.io',
  role: 'agent-service',
  groups: [],
  orgId: 'szl-holdings',
};

function bearerHeader(identity: Omit<CallerIdentity, 'iat' | 'exp'>): string {
  return `Bearer ${issueToken(identity, TEST_SECRET)}`;
}

describe('AgentGateway — happy-path integration', () => {
  let gateway: AgentGateway;

  beforeEach(() => {
    gateway = new AgentGateway(TEST_CONFIG);
  });

  it('completes inspect_code in development without approval', async () => {
    const response = await gateway.handleRequest(
      'inspect_code',
      bearerHeader(PLATFORM_ENGINEER),
      { prompt: 'Inspect the auth module for security issues' },
      { target: 'api-server', domain: 'platform', targetEnvironment: 'development' },
    );

    expect(response.status).toBe('success');
    expect(response.auditId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.evidenceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.plan).toBeDefined();
    expect(response.simulationResult?.riskLevel).toBe('low');
    expect(response.result?.output).toContain('[STUB]');
  });

  it('completes draft_prs in development without approval (dev env, platform-engineer)', async () => {
    const response = await gateway.handleRequest(
      'draft_prs',
      bearerHeader(PLATFORM_ENGINEER),
      { prompt: 'Draft a PR to fix the login redirect bug' },
      { target: 'api-server', domain: 'platform', targetEnvironment: 'development' },
    );

    expect(response.status).toBe('success');
    expect(response.diff).toBeDefined();
    expect(response.plan?.requiresApproval).toBe(false);
  });

  it('requires approval for production target (local approval auto-approves)', async () => {
    const response = await gateway.handleRequest(
      'inspect_code',
      bearerHeader(PLATFORM_ENGINEER),
      {},
      { target: 'api-server', domain: 'platform', targetEnvironment: 'production' },
    );

    // Local approval auto-approves in test mode
    expect(response.status).toBe('success');
    expect(response.plan?.requiresApproval).toBe(true);
    expect(response.approvalId).toBeDefined();
  });
});

describe('AgentGateway — auth failure paths', () => {
  let gateway: AgentGateway;

  beforeEach(() => {
    gateway = new AgentGateway(TEST_CONFIG);
  });

  it('returns auth_failed for missing Authorization header', async () => {
    const response = await gateway.handleRequest(
      'inspect_code',
      undefined,
      {},
      { target: 'api-server', domain: 'platform' },
    );
    expect(response.status).toBe('auth_failed');
    expect(response.auditId).toBeDefined();
  });

  it('returns auth_failed for wrong JWT secret', async () => {
    const badToken = `Bearer ${issueToken(PLATFORM_ENGINEER, 'wrong-secret')}`;
    const response = await gateway.handleRequest(
      'inspect_code',
      badToken,
      {},
      { target: 'api-server', domain: 'platform' },
    );
    expect(response.status).toBe('auth_failed');
  });
});

describe('AgentGateway — forbidden capability paths', () => {
  let gateway: AgentGateway;

  beforeEach(() => {
    gateway = new AgentGateway(TEST_CONFIG);
  });

  it('returns forbidden for direct_prod_change before auth runs', async () => {
    // Note: No auth header provided — forbidden check runs first
    const response = await gateway.handleRequest(
      'direct_prod_change',
      undefined,
      {},
      { target: 'prod-db', domain: 'platform' },
    );
    expect(response.status).toBe('forbidden');
    expect(response.message).toContain('categorically forbidden');
  });

  it('returns forbidden for policy_bypass even with valid token', async () => {
    const response = await gateway.handleRequest(
      'policy_bypass',
      bearerHeader(PLATFORM_ENGINEER),
      {},
      { target: 'opa', domain: 'platform' },
    );
    expect(response.status).toBe('forbidden');
  });

  it('returns forbidden for approval_bypass even with valid token', async () => {
    const response = await gateway.handleRequest(
      'approval_bypass',
      bearerHeader(PLATFORM_ENGINEER),
      {},
      { target: 'temporal', domain: 'platform' },
    );
    expect(response.status).toBe('forbidden');
  });

  it('returns forbidden for plaintext_secret_access', async () => {
    const response = await gateway.handleRequest(
      'plaintext_secret_access',
      bearerHeader(PLATFORM_ENGINEER),
      {},
      { target: 'keyvault', domain: 'platform' },
    );
    expect(response.status).toBe('forbidden');
  });

  it('returns forbidden for pr_flow_bypass', async () => {
    const response = await gateway.handleRequest(
      'pr_flow_bypass',
      bearerHeader(PLATFORM_ENGINEER),
      {},
      { target: 'github', domain: 'platform' },
    );
    expect(response.status).toBe('forbidden');
  });

  it('returns forbidden for unknown capability string', async () => {
    const response = await gateway.handleRequest(
      'delete_everything',
      bearerHeader(PLATFORM_ENGINEER),
      {},
      { target: 'all', domain: 'platform' },
    );
    expect(response.status).toBe('forbidden');
  });
});
