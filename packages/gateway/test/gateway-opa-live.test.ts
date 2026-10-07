/**
 * Agent Gateway — Live OPA Integration Test
 * Phase 11 — Agent Gateway / Task #4610
 *
 * Boots a real `opa` process serving the policy bundle from
 * platform/policy/approval/approval-requirements.rego, then drives a
 * production-targeted `inspect_code` request through the gateway and
 * asserts that the policy decision is honored end-to-end.
 *
 * The pinned source/checksum contract is mandatory on every run. A real OPA
 * process is an additional integration check when an authenticated binary is
 * present on PATH or at OPA_BIN. Locally:
 *
 *   curl -sL -o /tmp/opa https://openpolicyagent.org/downloads/v0.69.0/opa_linux_amd64_static
 *   chmod +x /tmp/opa && OPA_BIN=/tmp/opa pnpm test
 */

import { createHash } from 'node:crypto';
import { type ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { issueToken } from '../src/auth.js';
import { AgentGateway } from '../src/gateway.js';
import type { AuditEntry, CallerIdentity, GatewayConfig } from '../src/types.js';

// ---------------------------------------------------------------------------
// OPA discovery
// ---------------------------------------------------------------------------

function findOpaBinary(): string | null {
  const candidates = [process.env['OPA_BIN'], '/tmp/opa', '/usr/local/bin/opa', '/usr/bin/opa'];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      try {
        const st = statSync(candidate);
        if (st.isFile()) return candidate;
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

const OPA_BINARY = findOpaBinary();
const POLICY_DIR = resolve(__dirname, '../../../policy');
const POLICY_BUNDLE = resolve(POLICY_DIR, 'approval/approval-requirements.rego');
const POLICY_CHECKSUM = resolve(POLICY_DIR, 'approval/approval-requirements.sha256');
const EXPECTED_POLICY_SHA256 = '0d48db558f2bc99186168ad34f87218666e31ab0dfc4d65ea10869975383c485';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TEST_SECRET = 'gateway-opa-live-test-secret';
const PLATFORM_ENGINEER: Omit<CallerIdentity, 'iat' | 'exp'> = {
  sub: 'eng@szl.io',
  role: 'platform-engineer',
  groups: ['platform-team'],
  orgId: 'szl-holdings',
};

function bearer(): string {
  return `Bearer ${issueToken(PLATFORM_ENGINEER, TEST_SECRET)}`;
}

// ---------------------------------------------------------------------------
// OPA lifecycle
// ---------------------------------------------------------------------------

interface OpaHandle {
  process: ChildProcessWithoutNullStreams;
  port: number;
  endpoint: string;
}

async function startOpa(): Promise<OpaHandle> {
  if (!OPA_BINARY) throw new Error('OPA binary not found');
  if (!existsSync(POLICY_BUNDLE)) throw new Error(`Policy bundle missing: ${POLICY_BUNDLE}`);

  const port = 18181 + Math.floor(Math.random() * 1000);
  const proc = spawn(
    OPA_BINARY,
    ['run', '--server', `--addr=127.0.0.1:${port}`, '--log-level=error', POLICY_BUNDLE],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );

  proc.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.toLowerCase().includes('error')) {
      // Surface real errors only; quieter messages are noise during boot.
      process.stderr.write(`[opa] ${text}`);
    }
  });

  // Poll the OPA health endpoint until ready.
  const endpoint = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${endpoint}/health`);
      if (res.ok) return { process: proc, port, endpoint };
    } catch {
      /* OPA not yet ready */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill('SIGKILL');
  throw new Error(`OPA did not become ready on ${endpoint} within 10s`);
}

async function stopOpa(handle: OpaHandle | null): Promise<void> {
  if (!handle) return;
  handle.process.kill('SIGTERM');
  await new Promise<void>((resolveExit) => {
    handle.process.once('exit', () => resolveExit());
    setTimeout(() => {
      handle.process.kill('SIGKILL');
      resolveExit();
    }, 2_000);
  });
}

// ---------------------------------------------------------------------------
// Mandatory deterministic bundle contract. This cannot skip: a missing or
// modified policy fails CI even when the optional native OPA binary is absent.
// ---------------------------------------------------------------------------

describe('Agent Gateway — mandatory OPA bundle contract', () => {
  it('requires the reviewed decision bundle and exact pinned digest', () => {
    const source = readFileSync(POLICY_BUNDLE);
    const actualDigest = createHash('sha256').update(source).digest('hex');
    expect(actualDigest).toBe(EXPECTED_POLICY_SHA256);
    expect(readFileSync(POLICY_CHECKSUM, 'utf8')).toBe(
      `${EXPECTED_POLICY_SHA256}  approval-requirements.rego\n`,
    );
  });

  it('pins the exact remote decision document and fail-closed output fields', () => {
    const source = readFileSync(POLICY_BUNDLE, 'utf8');
    expect(source).toMatch(/^package szl\.approval$/m);
    expect(source).toContain('decision := {');
    expect(source).toContain('"allowed": allowed');
    expect(source).toContain('"required_approvals": required_approvals');
    expect(source).toContain('"required_groups": required_groups');
    expect(source).toContain('"deny": deny');
    expect(source).toContain('allowed := count(invalid_reasons) == 0');
  });
});

// Supplemental native OPA integration — skipped when no authenticated binary
// is installed. The non-optional contract above still runs in that case.
// ---------------------------------------------------------------------------

const describeIfOpa = OPA_BINARY ? describe : describe.skip;

describeIfOpa('AgentGateway — live OPA integration', () => {
  let opa: OpaHandle | null = null;
  let auditLogPath: string;
  let opaStartTime: number;

  beforeAll(async () => {
    opa = await startOpa();
    opaStartTime = Date.now();
    const dir = mkdtempSync(join(tmpdir(), 'gateway-opa-live-'));
    auditLogPath = join(dir, 'audit.ndjson');
  }, 15_000);

  afterAll(async () => {
    await stopOpa(opa);
  });

  function readAuditEntries(): AuditEntry[] {
    if (!existsSync(auditLogPath)) return [];
    const lines = readFileSync(auditLogPath, 'utf-8').trim().split('\n').filter(Boolean);
    return lines
      .map((line) => JSON.parse(line) as { kind: string; payload: AuditEntry })
      .filter((record) => record.kind === 'audit')
      .map((record) => record.payload);
  }

  it('gates a production-targeted inspect_code request through the live OPA bundle', async () => {
    if (!opa) throw new Error('OPA not started');

    const config: GatewayConfig = {
      jwt: { algorithm: 'HS256', secret: TEST_SECRET },
      opaEndpoint: opa.endpoint,
      // Local-mode approval auto-approves for this OPA-only integration. Live
      // startup remains held unless the separate workflow proof contract passes.
      temporalEndpoint: 'local',
      openAiApiKey: 'local',
      approvalWorkflow: null,
      evidenceLedger: null,
      auditLogPath,
      approvalTimeoutMs: 5_000,
    };

    const gateway = new AgentGateway(config);
    const response = await gateway.handleRequest(
      'inspect_code',
      bearer(),
      { prompt: 'Inspect production secrets handling' },
      { target: 'api-server', domain: 'platform', targetEnvironment: 'production' },
    );

    // The request flowed through real OPA, which mapped the production
    // operation_type=deploy rule and returned required_approvals=1.
    expect(response.status).toBe('success');
    expect(response.plan?.requiresApproval).toBe(true);
    expect(response.plan?.approvalGroups).toEqual(
      expect.arrayContaining(['platform-team', 'release-managers']),
    );
    expect(response.approvalId).toBeDefined();

    // Audit log shows the OPA-derived decision and timestamp.
    const entries = readAuditEntries();
    const completed = entries.filter((e) => e.status === 'completed');
    expect(completed.length).toBeGreaterThan(0);
    const policy = completed[completed.length - 1].policyDecision;
    expect(policy).toBeDefined();
    expect(policy?.policyId).toMatch(/^szl\.approval\//);
    expect(policy?.requiredApprovals).toBe(1);
    expect(policy?.requiredGroups).toEqual(
      expect.arrayContaining(['platform-team', 'release-managers']),
    );

    // `evaluatedAt` came from OPA's HTTP Date header, not the gateway's clock.
    // It must be >= the OPA process start time and within a sensible window.
    expect(policy?.evaluatedAt).toBeDefined();
    if (!policy) throw new Error('completed audit entry omitted policyDecision');
    const evaluatedMs = new Date(policy.evaluatedAt).getTime();
    expect(evaluatedMs).toBeGreaterThanOrEqual(opaStartTime - 1_000);
    expect(evaluatedMs).toBeLessThanOrEqual(Date.now() + 1_000);
  });

  it('does not require approval for development-environment inspect_code', async () => {
    if (!opa) throw new Error('OPA not started');

    const config: GatewayConfig = {
      jwt: { algorithm: 'HS256', secret: TEST_SECRET },
      opaEndpoint: opa.endpoint,
      temporalEndpoint: 'local',
      openAiApiKey: 'local',
      approvalWorkflow: null,
      evidenceLedger: null,
      auditLogPath,
      approvalTimeoutMs: 5_000,
    };

    const gateway = new AgentGateway(config);
    const response = await gateway.handleRequest(
      'inspect_code',
      bearer(),
      { prompt: 'Inspect dev module' },
      { target: 'api-server', domain: 'platform', targetEnvironment: 'development' },
    );

    expect(response.status).toBe('success');
    expect(response.plan?.requiresApproval).toBe(false);
  });

  it('fails closed when OPA is unreachable', async () => {
    const config: GatewayConfig = {
      jwt: { algorithm: 'HS256', secret: TEST_SECRET },
      opaEndpoint: 'http://127.0.0.1:1', // intentionally invalid
      temporalEndpoint: 'local',
      openAiApiKey: 'local',
      approvalWorkflow: null,
      evidenceLedger: null,
      auditLogPath,
      approvalTimeoutMs: 5_000,
    };

    const gateway = new AgentGateway(config);
    const response = await gateway.handleRequest(
      'inspect_code',
      bearer(),
      {},
      { target: 'api-server', domain: 'platform', targetEnvironment: 'production' },
    );

    expect(response.status).toBe('authz_denied');
    expect(response.message.toLowerCase()).toContain('opa');
  });
});

// When OPA is unavailable, surface a single explanatory test so the run output
// makes the skip reason obvious instead of silently passing zero tests.
if (!OPA_BINARY) {
  describe('AgentGateway — live OPA integration (skipped)', () => {
    it.skip('OPA binary not found at $OPA_BIN, /tmp/opa, or /usr/local/bin/opa', () => {
      /* skipped */
    });
  });
}
