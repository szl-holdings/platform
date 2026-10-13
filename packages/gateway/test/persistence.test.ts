import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { issueToken } from '../src/auth.js';
import { AgentGateway } from '../src/gateway.js';
import { probeEvidenceLedger } from '../src/persistence.js';
import { startServer } from '../src/server.js';
import type { GatewayConfig } from '../src/types.js';

const TEST_SECRET = 'gateway-persistence-test-secret';
const originalFetch = globalThis.fetch;

function config(auditLogPath: string): GatewayConfig {
  return {
    jwt: { algorithm: 'HS256', secret: TEST_SECRET },
    opaEndpoint: 'local',
    temporalEndpoint: 'local',
    openAiApiKey: 'local',
    approvalWorkflow: null,
    evidenceLedger: null,
    auditLogPath,
    approvalTimeoutMs: 5_000,
  };
}

function bearer(): string {
  return `Bearer ${issueToken(
    {
      sub: 'eng@szl.io',
      role: 'platform-engineer',
      groups: ['platform-team'],
      orgId: 'szl-holdings',
    },
    TEST_SECRET,
  )}`;
}

async function run(gateway: AgentGateway) {
  return gateway.handleRequest(
    'inspect_code',
    bearer(),
    { prompt: 'inspect persistence boundary' },
    { target: 'api-server', domain: 'platform', targetEnvironment: 'development' },
  );
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('required gateway evidence and audit persistence', () => {
  it('persists evidence and authorization audit before returning a local success', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'gateway-ledger-'));
    const path = join(directory, 'development-ledger.ndjson');
    const response = await run(new AgentGateway(config(path)));
    expect(response.status).toBe('success');

    const records = readFileSync(path, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(records.map((record) => record.kind)).toEqual(['evidence', 'audit', 'audit']);
    for (const record of records) {
      const serialized = JSON.stringify({
        kind: record.kind,
        id: record.id,
        payload: record.payload,
      });
      expect(record.digest).toBe(`sha256:${createHash('sha256').update(serialized).digest('hex')}`);
    }
    expect((records[1]?.payload as { status?: string }).status).toBe('execution_authorized');
    expect((records[2]?.payload as { status?: string }).status).toBe('completed');
  });

  it('blocks before approval and provider execution when evidence persistence fails', async () => {
    const missingParent = join(tmpdir(), `gateway-missing-${randomUUID()}`, 'ledger.ndjson');
    const response = await run(new AgentGateway(config(missingParent)));
    expect(response).toMatchObject({
      status: 'error',
      auditId: 'unpersisted',
    });
    expect(response.message).toMatch(/evidence persistence failed.*blocked/i);
    expect(response.result).toBeUndefined();
  });

  it('blocks provider execution when the remote ledger rejects the authorization audit', async () => {
    let recordCount = 0;
    globalThis.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      recordCount += 1;
      const envelope = JSON.parse(String(init?.body)) as { digest: string };
      if (recordCount === 1) {
        return new Response(
          JSON.stringify({ stored: true, recordId: 'evidence-1', digest: envelope.digest }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response('ledger unavailable', { status: 503 });
    });

    const remoteConfig: GatewayConfig = {
      ...config('/tmp/not-used-by-remote-ledger.ndjson'),
      evidenceLedger: {
        endpoint: 'https://ledger.example.test',
        token: 'test-ledger-token',
      },
    };
    const response = await run(new AgentGateway(remoteConfig));
    expect(recordCount).toBe(2);
    expect(response).toMatchObject({ status: 'error', auditId: 'unpersisted' });
    expect(response.message).toMatch(/audit persistence failed.*blocked/i);
    expect(response.result).toBeUndefined();
  });

  it('requires the full durable, tamper-evident, append-only readiness attestation', async () => {
    const remoteConfig: GatewayConfig = {
      ...config('/tmp/not-used-by-remote-ledger.ndjson'),
      evidenceLedger: {
        endpoint: 'https://ledger.example.test',
        token: 'test-ledger-token',
      },
    };
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ready',
          durable: true,
          tamperEvident: true,
          appendOnly: false,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    await expect(probeEvidenceLedger(remoteConfig)).resolves.toBe(false);
    await expect(startServer(remoteConfig)).rejects.toThrow(/startup HOLD/);
  });
});
