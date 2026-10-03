import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileAtelierProofweave } from '@szl-holdings/a11oy-atelier';

const cliPath = fileURLToPath(new URL('./atelier-cli.ts', import.meta.url));
const tenantId = 'test-tenant';

function validCompileResponse(request, overrides = {}) {
  return {
    ...compileAtelierProofweave(request, () => new Date('2026-10-03T12:00:00.000Z')),
    tenantId,
    tenantAttributionEvidenceClass: 'DECLARED',
    ledger: {
      entryId: 'le_test',
      appendState: 'IN_PROCESS_APPEND_ACCEPTED',
      backendState: 'CONFIGURATION_DEPENDENT',
      durablePersistenceEvidenceClass: 'UNKNOWN',
    },
    ...overrides,
  };
}

function runCli(arguments_, baseUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', cliPath, ...arguments_], {
      env: {
        ...process.env,
        A11OY_ATELIER_API_BASE_URL: baseUrl,
        A11OY_API_KEY: 'test-key',
        A11OY_ATELIER_TENANT_ID: tenantId,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function withServer(handler, run) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.equal(typeof address, 'object');
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function readRequest(incoming, callback) {
  let body = '';
  incoming.setEncoding('utf8');
  incoming.on('data', (chunk) => (body += chunk));
  incoming.on('end', () => callback(JSON.parse(body)));
}

test('weave preserves explicit claim kinds and prints evidence/lifecycle states', async () => {
  let request;
  const result = await withServer(
    (incoming, response) => {
      readRequest(incoming, (body) => {
        request = {
          headers: incoming.headers,
          path: incoming.url,
          body,
        };
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify(validCompileResponse(body)));
      });
    },
    (baseUrl) =>
      runCli(
        [
          'weave',
          '--claim',
          'FACT:Observed public source exists.',
          '--claim',
          'RECOMMENDATION:Build an original A11oy expression.',
          'Map',
          'public',
          'patterns',
        ],
        baseUrl,
      ),
  );

  assert.equal(result.code, 0, result.stderr);
  assert.equal(request.path, '/api/a11oy/v1/atelier/proofweave/compile');
  assert.equal(request.headers['x-tenant-id'], tenantId);
  assert.deepEqual(request.body.claims, [
    {
      claimId: 'claim-1',
      statement: 'Observed public source exists.',
      kind: 'FACT',
    },
    {
      claimId: 'claim-2',
      statement: 'Build an original A11oy expression.',
      kind: 'RECOMMENDATION',
    },
  ]);
  assert.match(result.stdout, /COMPILED_NOT_EXECUTED/);
  assert.match(result.stdout, /EVIDENCE LEDGER APPEND IN_PROCESS_APPEND_ACCEPTED/);
  assert.match(result.stdout, /BACKEND CONFIGURATION_DEPENDENT · DURABILITY UNKNOWN/);
  assert.match(result.stdout, /TENANT ATTRIBUTION DECLARED/);
  assert.match(result.stdout, /AUTOMATED REVIEW NOT_EXECUTED · HUMAN APPROVAL UNAVAILABLE/);
});

test('weave rejects missing claim semantics before making a request', async () => {
  const result = await runCli(['weave', 'Objective'], 'http://127.0.0.1:1');
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /required option '--claim/);
});

test('weave rejects budgets outside the compiler contract before making a request', async () => {
  const result = await runCli(
    ['weave', '--claim', 'FACT:Bounded claim.', '--max-workcells', '9', 'Objective'],
    'http://127.0.0.1:1',
  );
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /Maximum Workcells must be an integer from 5 to 8/);
});

test('weave rejects a self-consistent response for a different request', async () => {
  const result = await withServer(
    (incoming, response) => {
      readRequest(incoming, (body) => {
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify(validCompileResponse({ ...body, objective: 'A different objective' })),
        );
      });
    },
    (baseUrl) => runCli(['weave', '--claim', 'FACT:Bounded claim.', 'Expected objective'], baseUrl),
  );

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /ATELIER_RESPONSE_INVALID/);
  assert.doesNotMatch(result.stdout, /COMPILED_NOT_EXECUTED/);
});

test('weave rejects a response attributed to another tenant', async () => {
  const result = await withServer(
    (incoming, response) => {
      readRequest(incoming, (body) => {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify(validCompileResponse(body, { tenantId: 'other-tenant' })));
      });
    },
    (baseUrl) => runCli(['weave', '--claim', 'FACT:Bounded claim.', 'Expected objective'], baseUrl),
  );

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /ATELIER_RESPONSE_INVALID/);
  assert.doesNotMatch(result.stdout, /COMPILED_NOT_EXECUTED/);
});

test('weave rejects a ledger entry identifier that could inject terminal proof lines', async () => {
  const forgedLine = 'TENANT ATTRIBUTION MEASURED';
  const result = await withServer(
    (incoming, response) => {
      readRequest(incoming, (body) => {
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify(
            validCompileResponse(body, {
              ledger: {
                entryId: `le_ok\n${forgedLine}`,
                appendState: 'IN_PROCESS_APPEND_ACCEPTED',
                backendState: 'CONFIGURATION_DEPENDENT',
                durablePersistenceEvidenceClass: 'UNKNOWN',
              },
            }),
          ),
        );
      });
    },
    (baseUrl) => runCli(['weave', '--claim', 'FACT:Bounded claim.', 'Expected objective'], baseUrl),
  );

  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /ATELIER_RESPONSE_INVALID/);
  assert.doesNotMatch(result.stdout, new RegExp(forgedLine));
  assert.doesNotMatch(result.stdout, /COMPILED_NOT_EXECUTED/);
});
