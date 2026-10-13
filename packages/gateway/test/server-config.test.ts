import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/server.js';

const CONFIG_KEYS = [
  'JWT_ALGORITHM',
  'JWT_SECRET',
  'JWT_PUBLIC_KEY',
  'JWT_ISSUER',
  'JWT_AUDIENCE',
  'JWT_ORG_ID',
  'GATEWAY_EXECUTION_MODE',
  'OPENAI_API_KEY',
  'OPA_ENDPOINT',
  'TEMPORAL_ENDPOINT',
  'TEMPORAL_NAMESPACE',
  'TEMPORAL_APPROVAL_TASK_QUEUE',
  'TEMPORAL_APPROVAL_PROOF_ENDPOINT',
  'TEMPORAL_APPROVAL_PROOF_TOKEN',
  'EVIDENCE_LEDGER_ENDPOINT',
  'EVIDENCE_LEDGER_TOKEN',
  'APPROVAL_TIMEOUT_MS',
  'NODE_ENV',
] as const;

const originalValues = new Map(CONFIG_KEYS.map((key) => [key, process.env[key]]));
const { publicKey: validPublicKey } = generateKeyPairSync('rsa', { modulusLength: 2_048 });
const publicKeyPem = validPublicKey.export({ type: 'spki', format: 'pem' }).toString();

function configureLiveAuth(): void {
  process.env['JWT_ALGORITHM'] = 'RS256';
  process.env['JWT_PUBLIC_KEY'] = publicKeyPem;
  process.env['JWT_ISSUER'] = 'https://identity.example.test';
  process.env['JWT_AUDIENCE'] = 'szl-agent-gateway';
  process.env['JWT_ORG_ID'] = 'szl-holdings';
}

function configureLiveDependencies(): void {
  process.env['OPENAI_API_KEY'] = 'provider-key';
  process.env['OPA_ENDPOINT'] = 'https://opa.example.test';
  process.env['TEMPORAL_ENDPOINT'] = 'temporal.example.test:7233';
  process.env['TEMPORAL_NAMESPACE'] = 'szl-production';
  process.env['TEMPORAL_APPROVAL_TASK_QUEUE'] = 'approval-task-queue';
  process.env['TEMPORAL_APPROVAL_PROOF_ENDPOINT'] = 'https://approval-proof.example.test';
  process.env['TEMPORAL_APPROVAL_PROOF_TOKEN'] = 'approval-proof-token';
}

function configureLedger(): void {
  process.env['EVIDENCE_LEDGER_ENDPOINT'] = 'https://ledger.example.test';
  process.env['EVIDENCE_LEDGER_TOKEN'] = 'ledger-test-token';
}

beforeEach(() => {
  for (const key of CONFIG_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of CONFIG_KEYS) {
    const value = originalValues.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe.sequential('Agent Gateway production configuration', () => {
  it('rejects missing and blank JWT secrets in the explicit local stub', () => {
    process.env['NODE_ENV'] = 'development';
    process.env['GATEWAY_EXECUTION_MODE'] = 'stub';
    expect(() => loadConfig()).toThrow(/JWT_SECRET is required/);
    process.env['JWT_SECRET'] = '   ';
    expect(() => loadConfig()).toThrow(/JWT_SECRET is required/);
  });

  it('rejects unknown execution modes and production stubs', () => {
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['GATEWAY_EXECUTION_MODE'] = 'unknown';
    expect(() => loadConfig()).toThrow(/must be either live or stub/);

    process.env['GATEWAY_EXECUTION_MODE'] = 'stub';
    process.env['NODE_ENV'] = 'production';
    expect(() => loadConfig()).toThrow(/permitted only in development or test/);
  });

  it('requires provider, OPA, and Temporal configuration in live mode', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['GATEWAY_EXECUTION_MODE'] = 'live';
    configureLiveAuth();
    configureLedger();
    expect(() => loadConfig()).toThrow(/OPENAI_API_KEY is required/);

    process.env['OPENAI_API_KEY'] = 'provider-key';
    expect(() => loadConfig()).toThrow(/OPA_ENDPOINT is required/);

    process.env['OPA_ENDPOINT'] = 'https://opa.example.test';
    expect(() => loadConfig()).toThrow(/TEMPORAL_ENDPOINT is required/);
  });

  it('forbids symmetric JWT authentication in live mode', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['GATEWAY_EXECUTION_MODE'] = 'live';
    configureLiveDependencies();
    configureLedger();
    process.env['JWT_ALGORITHM'] = 'HS256';
    process.env['JWT_SECRET'] = 'must-not-be-used';
    expect(() => loadConfig()).toThrow(/requires explicit JWT_ALGORITHM=RS256/);

    process.env['JWT_ALGORITHM'] = 'RS256';
    configureLiveAuth();
    process.env['JWT_SECRET'] = 'leftover-secret';
    expect(() => loadConfig()).toThrow(/JWT_SECRET is forbidden in live mode/);
  });

  it('validates the asymmetric key, issuer, and audience', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['GATEWAY_EXECUTION_MODE'] = 'live';
    configureLiveDependencies();
    configureLedger();
    process.env['JWT_ALGORITHM'] = 'RS256';
    expect(() => loadConfig()).toThrow(/JWT_PUBLIC_KEY, JWT_ISSUER, JWT_AUDIENCE, and JWT_ORG_ID/);

    process.env['JWT_PUBLIC_KEY'] = 'not-a-public-key';
    process.env['JWT_ISSUER'] = 'issuer';
    process.env['JWT_AUDIENCE'] = 'audience';
    process.env['JWT_ORG_ID'] = 'szl-holdings';
    expect(() => loadConfig()).toThrow(/valid RSA public key/);
  });

  it('keeps live startup on HOLD without a configured durable ledger', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['GATEWAY_EXECUTION_MODE'] = 'live';
    configureLiveDependencies();
    configureLiveAuth();
    expect(() => loadConfig()).toThrow(/on HOLD.*durable tamper-evident ledger/);

    process.env['EVIDENCE_LEDGER_ENDPOINT'] = 'http://ledger.example.test';
    process.env['EVIDENCE_LEDGER_TOKEN'] = 'token';
    expect(() => loadConfig()).toThrow(/must use HTTPS/);
  });

  it('keeps live startup on HOLD without a configured approvalWorkflow proof', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['GATEWAY_EXECUTION_MODE'] = 'live';
    configureLiveDependencies();
    configureLiveAuth();
    configureLedger();
    delete process.env['TEMPORAL_APPROVAL_PROOF_ENDPOINT'];
    expect(() => loadConfig()).toThrow(/on HOLD.*approvalWorkflow round-trip proof/);

    process.env['TEMPORAL_APPROVAL_PROOF_ENDPOINT'] = 'http://approval-proof.example.test';
    expect(() => loadConfig()).toThrow(/must use HTTPS/);
  });

  it('allows only an explicit development stub and labels file evidence as non-production', () => {
    process.env['JWT_SECRET'] = ' test-secret ';
    process.env['NODE_ENV'] = 'development';
    process.env['GATEWAY_EXECUTION_MODE'] = 'stub';

    expect(loadConfig()).toMatchObject({
      jwt: { algorithm: 'HS256', secret: 'test-secret' },
      opaEndpoint: 'local',
      temporalEndpoint: 'local',
      openAiApiKey: 'local',
      approvalWorkflow: null,
      evidenceLedger: null,
    });
  });

  it('returns a strict RS256 and durable-ledger configuration in live mode', () => {
    process.env['NODE_ENV'] = 'production';
    process.env['GATEWAY_EXECUTION_MODE'] = 'live';
    configureLiveDependencies();
    configureLiveAuth();
    configureLedger();

    expect(loadConfig()).toMatchObject({
      jwt: {
        algorithm: 'RS256',
        issuer: 'https://identity.example.test',
        audience: 'szl-agent-gateway',
        orgId: 'szl-holdings',
      },
      evidenceLedger: {
        endpoint: 'https://ledger.example.test',
        token: 'ledger-test-token',
      },
      approvalWorkflow: {
        namespace: 'szl-production',
        taskQueue: 'approval-task-queue',
        proofEndpoint: 'https://approval-proof.example.test',
        proofToken: 'approval-proof-token',
      },
    });
  });
});
