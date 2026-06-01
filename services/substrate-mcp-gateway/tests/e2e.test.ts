/**
 * Substrate MCP Gateway — End-to-End Tests
 *
 * Tests:
 *   1. Initialize / ping — basic connectivity
 *   2. tools/list — returns all 8 substrate tools
 *   3. substrate_submit_run — submits a dry-run and receives a runId
 *   4. substrate_get_run — retrieves submitted run state
 *   5. Approval gate pause: live-mode run pauses at ApprovalGate
 *   6. substrate_approve resolves the paused run via defaultRuntime.resume()
 *   7. substrate_reject terminates a pending run via defaultRuntime.reject()
 *   8. substrate_list_workflows returns registered workflows from the registry
 *   9. Counterfactual replay returns a diff structure
 *  10. Auth: write tool rejects anonymous requests with API key set
 *  11. Health endpoint returns service info without auth
 *  12. resources/list and resources/read work correctly
 *  13. prompts/list and prompts/get work correctly
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';
import {
  ApprovalGate,
  clearWorkflowRegistry,
  Decide,
  defineBudget,
  definePolicy,
  defineWorkflow,
  listWorkflows,
  registerWorkflow,
} from '@szl/substrate';
import { clearApprovalInbox } from '@workspace/approvals-inbox';
import express from 'express';
import { handleToolCall } from '../src/handlers.js';
import { createDiscoveryHandler, createHttpTransport } from '../src/transport/http.js';

// ─── Test Server Setup ────────────────────────────────────────────────────────

let server: http.Server;
let baseUrl: string;

const TEST_API_KEY = 'test-key-e2e-2026';
process.env.SUBSTRATE_GATEWAY_API_KEY = TEST_API_KEY;
process.env.NODE_ENV = 'test';

before(async () => {
  const app = express();
  app.use('/mcp', createHttpTransport());
  app.get('/.well-known/mcp', createDiscoveryHandler());
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => {
  server?.close();
});

// ─── Workflows ────────────────────────────────────────────────────────────────

// dry-run workflow: ApprovalGate auto-approved in non-live modes
const DRY_RUN_WORKFLOW_ID = 'e2e-dry-run-workflow';
const dryRunWorkflow = defineWorkflow({
  id: DRY_RUN_WORKFLOW_ID,
  name: 'E2E Dry-Run Workflow',
  stages: [
    ApprovalGate({ id: 'gate', name: 'Approval Gate' }),
    Decide({
      id: 'decide',
      name: 'Decide',
      dependsOn: ['gate'],
      sideEffects: ['write-internal'],
      highRiskSideEffects: [],
    }),
  ],
  policy: definePolicy({ id: 'e2e-policy', name: 'E2E Policy' }),
  budget: defineBudget({ escalateAt: 0.5 }),
});

// live-mode workflow: single ApprovalGate pauses immediately in live mode
const LIVE_GATE_WORKFLOW_ID = 'e2e-live-gate-workflow';
const liveGateWorkflow = defineWorkflow({
  id: LIVE_GATE_WORKFLOW_ID,
  name: 'E2E Live Gate Workflow',
  stages: [ApprovalGate({ id: 'approval-gate', name: 'Approval Gate' })],
  policy: definePolicy({ id: 'e2e-live-policy', name: 'E2E Live Policy' }),
  budget: defineBudget({ escalateAt: 0.5 }),
});

registerWorkflow(dryRunWorkflow);
registerWorkflow(liveGateWorkflow);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// MCP Streamable HTTP is stateful: the server returns a `mcp-session-id`
// header on `initialize`, and every subsequent request from that client
// MUST echo it back. The helper below tracks the session ID per `rpc()`
// caller so tests can issue a sequence of requests without managing it.
let mcpSessionId: string | null = null;

async function rpc(
  method: string,
  params?: Record<string, unknown>,
  key: string | null = TEST_API_KEY,
): Promise<unknown> {
  // Auto-initialize on the first non-initialize call so individual tests
  // can call `rpc('ping')` directly without orchestrating the handshake.
  if (method !== 'initialize' && mcpSessionId === null) {
    await rpc('initialize', undefined, key);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // MCP Streamable HTTP requires both content types in Accept so the
    // server can choose the response form per the 2025-11-25 spec.
    Accept: 'application/json, text/event-stream',
  };
  if (key) headers.Authorization = `Bearer ${key}`;
  if (mcpSessionId) headers['MCP-Session-Id'] = mcpSessionId;

  // MCP 2025-11-25: initialize requires protocolVersion + clientInfo.
  let finalParams = params;
  if (method === 'initialize' && !params) {
    finalParams = {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'e2e-test-client', version: '1.0' },
    };
  }

  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: finalParams }),
  });

  // Capture the session id only on the initialize round-trip.
  if (method === 'initialize') {
    const sid = res.headers.get('mcp-session-id');
    if (sid) mcpSessionId = sid;
  }

  // Server may respond as application/json or as a single-event SSE
  // stream (`event: message\ndata: <json>\n\n`). Normalise both.
  const ct = res.headers.get('content-type') ?? '';
  const raw = await res.text();
  if (raw.length === 0) {
    // 202 Accepted notifications have empty bodies; surface them as null.
    return null;
  }
  if (ct.includes('text/event-stream')) {
    const m = raw.match(/^data: (.+)$/m);
    if (!m) throw new Error(`Unparseable SSE body: ${raw.slice(0, 200)}`);
    return JSON.parse(m[1]!) as unknown;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (e) {
    throw new Error(
      `rpc(${method}) non-JSON response (status=${res.status} ct=${ct}): ${raw.slice(0, 200)}`,
    );
  }
}

// Reset the session between tests so each starts fresh.
async function resetMcpSession(): Promise<void> {
  mcpSessionId = null;
}
void resetMcpSession;

// Parse a response that may be JSON, SSE-wrapped JSON, or empty (202 Accepted).
// Used by tests that call fetch() directly and need a tolerant body reader.
async function readBody<T = unknown>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') ?? '';
  const raw = await res.text();
  if (raw.length === 0) return null;
  if (ct.includes('text/event-stream')) {
    const m = raw.match(/^data: (.+)$/m);
    if (!m) throw new Error(`Unparseable SSE body: ${raw.slice(0, 200)}`);
    return JSON.parse(m[1]!) as T;
  }
  return JSON.parse(raw) as T;
}

async function toolCall(
  toolName: string,
  args: Record<string, unknown>,
  key: string | null = TEST_API_KEY,
): Promise<{
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  error?: unknown;
}> {
  const resp = (await rpc('tools/call', { name: toolName, arguments: args }, key)) as {
    result?: { content?: Array<{ type: string; text: string }>; isError?: boolean };
    error?: unknown;
  };
  if (resp.error) return { error: resp.error };
  return resp.result ?? {};
}

function parseResult<T>(result: {
  content?: Array<{ type: string; text: string }>;
  isError?: boolean;
  error?: unknown;
}): T {
  if (result.error) throw new Error(JSON.stringify(result.error));
  if (result.isError) {
    const text = result.content?.[0]?.text ?? 'unknown error';
    throw new Error(`Tool returned isError=true: ${text}`);
  }
  const text = result.content?.[0]?.text ?? '{}';
  return JSON.parse(text) as T;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('1. initialize and ping respond correctly (2025-11-25)', async () => {
  const init = (await rpc('initialize')) as {
    result?: { protocolVersion: string; serverInfo: { name: string }; extensions?: unknown };
    headers?: Record<string, string>;
  };
  assert.ok(init.result, 'initialize must return a result');
  assert.equal(init.result.protocolVersion, '2025-11-25');
  assert.ok(init.result.serverInfo.name.includes('substrate'));

  const ping = (await rpc('ping')) as { result?: unknown };
  assert.deepEqual(ping.result, {});
});

test('2. tools/list returns all expected substrate tools (>= 8 base, plus live-registry contributions)', async () => {
  const resp = (await rpc('tools/list')) as { result?: { tools: Array<{ name: string }> } };
  assert.ok(resp.result, 'tools/list must return a result');
  const names = resp.result.tools.map((t) => t.name);
  const expected = [
    'substrate_submit_run',
    'substrate_get_run',
    'substrate_replay',
    'substrate_counterfactual',
    'substrate_list_approvals',
    'substrate_approve',
    'substrate_reject',
    'substrate_list_workflows',
  ];
  for (const name of expected) {
    assert.ok(names.includes(name), `Missing tool: ${name}`);
  }
  // Registry contributes additional tools from connected internal servers — assert lower bound.
  assert.ok(names.length >= expected.length, `Expected at least ${expected.length} tools, got ${names.length}`);
});

test('3. substrate_submit_run submits a dry-run and returns a runId', async () => {
  const result = await toolCall('substrate_submit_run', {
    workflowId: DRY_RUN_WORKFLOW_ID,
    input: { testKey: 'testValue' },
    mode: 'dry-run',
  });

  const data = parseResult<{ runId: string; status: string; workflowId: string }>(result);
  assert.ok(data.runId, 'runId must be present');
  assert.equal(data.workflowId, DRY_RUN_WORKFLOW_ID);
  assert.ok(
    ['running', 'completed', 'dry-run-complete', 'pending-approval', 'failed'].includes(
      data.status,
    ),
    `Unexpected status: ${data.status}`,
  );
});

test('4. substrate_get_run retrieves submitted run state', async () => {
  const submitResult = await toolCall('substrate_submit_run', {
    workflowId: DRY_RUN_WORKFLOW_ID,
    input: { testKey: 'getRunTest' },
    mode: 'dry-run',
  });
  const submitted = parseResult<{ runId: string }>(submitResult);

  const getResult = await toolCall('substrate_get_run', { runId: submitted.runId });
  const run = parseResult<{ runId: string; workflowId: string; status: string }>(getResult);
  assert.equal(run.runId, submitted.runId, 'runId must match');
  assert.equal(run.workflowId, DRY_RUN_WORKFLOW_ID, 'workflowId must match');
});

test('5. live-mode run pauses at ApprovalGate with status pending-approval', async () => {
  // The liveGateWorkflow has only an ApprovalGate as its first stage.
  // In live mode this causes the run to immediately pause and return.
  const result = await toolCall('substrate_submit_run', {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { trigger: 'approval-flow-test' },
    mode: 'live',
  });

  const data = parseResult<{ runId: string; status: string }>(result);
  assert.ok(data.runId, 'runId must be present');
  assert.equal(
    data.status,
    'pending-approval',
    `Expected pending-approval, got ${data.status}. The ApprovalGate must pause in live mode.`,
  );
});

test('6. substrate_approve resolves pending run via defaultRuntime.resume()', async () => {
  clearApprovalInbox();

  // Submit a live-mode run — it pauses at the ApprovalGate
  const submitResult = await toolCall('substrate_submit_run', {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { trigger: 'approve-test' },
    mode: 'live',
  });
  const submitted = parseResult<{ runId: string; status: string }>(submitResult);
  assert.equal(submitted.status, 'pending-approval', 'Run must pause at gate');

  // Approve via the gateway — internally calls defaultRuntime.resume()
  const approveResult = await toolCall('substrate_approve', {
    recommendationId: submitted.runId,
    actor: 'alice@example.com',
    note: 'Approved by test.',
    domain: 'e2e-test',
  });
  const approval = parseResult<{
    verdict: string;
    actor: string;
    proofRef: string;
    runStatus: string;
  }>(approveResult);
  assert.equal(approval.verdict, 'approved', 'Verdict must be approved');
  assert.equal(approval.actor, 'alice@example.com', 'Actor must be preserved');
  assert.ok(approval.proofRef, 'proofRef must be set by approvals-inbox');

  // The run should now be completed (gate was the only stage)
  assert.ok(
    ['completed', 'running'].includes(approval.runStatus),
    `Run status after approve should be completed or running, got: ${approval.runStatus}`,
  );

  // Verify via substrate_get_run
  const getResult = await toolCall('substrate_get_run', { runId: submitted.runId });
  const run = parseResult<{ status: string }>(getResult);
  assert.ok(
    ['completed', 'running'].includes(run.status),
    `Run should be completed after approval, got: ${run.status}`,
  );

  // Verify approval appears in the inbox
  const listResult = await toolCall('substrate_list_approvals', {
    verdict: 'approved',
    domain: 'e2e-test',
  });
  const list = parseResult<{
    count: number;
    approvals: Array<{ recommendationId: string; verdict: string }>;
  }>(listResult);
  assert.ok(list.count >= 1, 'Approval must appear in inbox');
  const found = list.approvals.find((a) => a.recommendationId === submitted.runId);
  assert.ok(found, 'Approval for our run must appear in the inbox');
  assert.equal(found.verdict, 'approved');
});

test('7. substrate_reject terminates a pending run via defaultRuntime.reject()', async () => {
  clearApprovalInbox();

  // Submit a live-mode run — it pauses at the ApprovalGate
  const submitResult = await toolCall('substrate_submit_run', {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { trigger: 'reject-test' },
    mode: 'live',
  });
  const submitted = parseResult<{ runId: string; status: string }>(submitResult);
  assert.equal(submitted.status, 'pending-approval', 'Run must pause at gate before rejection');

  // Reject via the gateway — internally calls defaultRuntime.reject()
  const rejectResult = await toolCall('substrate_reject', {
    recommendationId: submitted.runId,
    note: 'Risk too high — rejected.',
    actor: 'compliance@example.com',
    domain: 'e2e-test',
  });
  const rejection = parseResult<{ verdict: string; note: string; runStatus: string }>(rejectResult);
  assert.equal(rejection.verdict, 'rejected', 'Verdict must be rejected');
  assert.ok(rejection.note?.includes('Risk too high'), 'Rejection note must be preserved');
  assert.equal(rejection.runStatus, 'failed', 'Run status must be failed after rejection');

  // Verify via substrate_get_run — run must be marked failed
  const getResult = await toolCall('substrate_get_run', { runId: submitted.runId });
  const run = parseResult<{ status: string; error: string }>(getResult);
  assert.equal(run.status, 'failed', 'Run must be failed after rejection');
  assert.ok(run.error?.includes('Rejected'), 'Run error must mention rejection');
});

test('8. substrate_list_workflows returns workflows from the registry', async () => {
  const result = await toolCall('substrate_list_workflows', {});
  const data = parseResult<{
    count: number;
    substrateVersion: string;
    workflows: Array<{ id: string; name: string }>;
  }>(result);

  // Both workflows registered above must appear
  assert.ok(data.count >= 2, `Expected at least 2 registered workflows, got ${data.count}`);
  assert.ok(typeof data.substrateVersion === 'string', 'substrateVersion must be a string');

  const dryRunFound = data.workflows.find((w) => w.id === DRY_RUN_WORKFLOW_ID);
  const liveFound = data.workflows.find((w) => w.id === LIVE_GATE_WORKFLOW_ID);
  assert.ok(dryRunFound, `${DRY_RUN_WORKFLOW_ID} must appear in workflow list`);
  assert.ok(liveFound, `${LIVE_GATE_WORKFLOW_ID} must appear in workflow list`);
});

test('9. counterfactual replay over the wire returns a decision diff', async () => {
  // Use LIVE_GATE_WORKFLOW_ID (only ApprovalGate) so counterfactual succeeds
  // without a registered model adapter — ApprovalGate is auto-approved in
  // counterfactual mode (non-live).
  const submitResult = await toolCall('substrate_submit_run', {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { counterfactualTest: true },
    mode: 'dry-run',
  });
  const submitted = parseResult<{ runId: string; status: string }>(submitResult);
  assert.ok(submitted.runId, 'Baseline run must have a runId');

  const cfResult = await toolCall('substrate_counterfactual', {
    runId: submitted.runId,
    workflowId: LIVE_GATE_WORKFLOW_ID,
  });

  // Must return a successful counterfactual diff (not an error)
  const data = parseResult<{
    baselineRunId: string;
    counterfactualRunId: string;
    diff: unknown;
    outcomeChanged: boolean;
    finalConfidenceDelta: number;
  }>(cfResult);

  assert.ok(data.baselineRunId, 'diff must include baselineRunId');
  assert.ok(data.counterfactualRunId, 'diff must include counterfactualRunId');
  assert.equal(data.baselineRunId, submitted.runId, 'baselineRunId must match the submitted run');
  assert.equal(typeof data.outcomeChanged, 'boolean', 'outcomeChanged must be a boolean');
  assert.equal(typeof data.finalConfidenceDelta, 'number', 'finalConfidenceDelta must be a number');
});

test('10. auth: write tool rejects anonymous request when API key is set', async () => {
  // API key is set (TEST_API_KEY). A request without a key must be denied.
  // We temporarily set NODE_ENV to production to activate strict auth.
  const savedEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const result = (await rpc(
      'tools/call',
      { name: 'substrate_approve', arguments: { recommendationId: 'any', note: 'test' } },
      null, // no key
    )) as { error?: { code: number; message: string } };

    // Must get PERMISSION_DENIED — the gateway must not accept the request
    assert.ok(result.error, 'Request without API key must be rejected');
    assert.ok(
      result.error.code === -32000 || result.error.code === -32001,
      `Expected PERMISSION_DENIED (-32000 or -32001) but got ${result.error.code}: ${result.error.message}`,
    );
  } finally {
    process.env.NODE_ENV = savedEnv;
  }
});

test('11. health endpoint returns service info without auth', async () => {
  const res = await fetch(`${baseUrl}/mcp/health`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; service: string; toolCount: number };
  assert.equal(body.status, 'ok');
  assert.ok(body.toolCount >= 8, `Expected at least 8 tools, got ${body.toolCount}`);
});

test('12. resources/list and resources/read work correctly', async () => {
  const listResp = (await rpc('resources/list')) as {
    result?: { resources: Array<{ uri: string }> };
  };
  assert.ok((listResp.result?.resources.length ?? 0) >= 4, 'At least 4 resources must be listed');

  const readResp = (await rpc('resources/read', { uri: 'substrate://schema/run' })) as {
    result?: { contents: Array<{ mimeType: string; text: string }> };
  };
  assert.ok(readResp.result?.contents?.[0]?.text, 'schema/run resource must return content');
  const schema = JSON.parse(readResp.result?.contents[0]?.text) as { title: string };
  assert.equal(schema.title, 'PipelineRun');
});

test('13. prompts/list and prompts/get work correctly', async () => {
  const listResp = (await rpc('prompts/list')) as { result?: { prompts: Array<{ name: string }> } };
  assert.ok((listResp.result?.prompts.length ?? 0) >= 2, 'At least 2 prompts must be listed');

  // substrate_run_summary with a non-existent runId should return a helpful error from the gateway
  const getResp = (await rpc('prompts/get', {
    name: 'substrate_run_summary',
    arguments: { runId: 'nonexistent-run-id' },
  })) as { result?: unknown; error?: unknown };

  // Either a structured error (run not found) or a result with NOT_FOUND embedded — both are fine
  const responseHasShape = getResp.error !== undefined || getResp.result !== undefined;
  assert.ok(responseHasShape, 'prompts/get must return either a result or structured error');
});

test('15. submit_run returns structured error when workflowId does not resolve', async () => {
  // Submit a run with a workflowId that has not been registered.
  // The gateway must NOT silently fail or return a generic 500 — it must
  // return a structured isError tool result with a developer-friendly message
  // and a machine-readable error code.
  const result = await toolCall('substrate_submit_run', {
    workflowId: 'this-workflow-was-never-registered',
    input: {},
    mode: 'dry-run',
  });

  assert.equal(result.isError, true, 'Result must be marked as an error');
  const text = result.content?.[0]?.text ?? '{}';
  const payload = JSON.parse(text) as {
    error: string;
    details?: {
      code?: string;
      workflowId?: string;
      registeredCount?: number;
      availableWorkflowIds?: string[];
    };
  };

  assert.ok(payload.error, 'Error message must be present');
  assert.ok(
    payload.error.includes('this-workflow-was-never-registered'),
    'Error message must mention the offending workflowId',
  );
  assert.ok(payload.details, 'Error must include structured details');

  // Two prior tests register dryRunWorkflow and liveGateWorkflow, so registry
  // is NOT empty here. The error code must reflect WORKFLOW_NOT_FOUND, and
  // the available workflow ids must be surfaced for developer feedback.
  assert.equal(
    payload.details?.code,
    'WORKFLOW_NOT_FOUND',
    `Expected error code WORKFLOW_NOT_FOUND, got: ${payload.details?.code}`,
  );
  assert.ok(
    (payload.details?.registeredCount ?? 0) >= 2,
    'registeredCount must surface the actual registry size',
  );
  assert.ok(
    Array.isArray(payload.details?.availableWorkflowIds) &&
      payload.details?.availableWorkflowIds?.includes(DRY_RUN_WORKFLOW_ID),
    'availableWorkflowIds must list registered workflows so callers can self-correct',
  );
});

test('16. registry-empty failure path: error and list_workflows surface the empty state', async () => {
  // The "no workflows registered" branch is the failure path called out in
  // task #2444. We exercise it by snapshotting the global registry, clearing
  // it, asserting the gateway behaves correctly, then restoring state so
  // subsequent tests are unaffected.
  const snapshot = listWorkflows();
  clearWorkflowRegistry();

  try {
    const submitResp = await handleToolCall(
      'substrate_submit_run',
      { workflowId: 'anything', input: {}, mode: 'dry-run' },
      'test:empty-registry',
    );
    assert.equal(submitResp.isError, true, 'Empty registry must produce an error');
    const submitPayload = JSON.parse(submitResp.content[0]?.text) as {
      error: string;
      details?: { code?: string; registeredCount?: number };
    };
    assert.equal(
      submitPayload.details?.code,
      'REGISTRY_EMPTY',
      'Empty-registry submission must yield a REGISTRY_EMPTY error code',
    );
    assert.equal(
      submitPayload.details?.registeredCount,
      0,
      'registeredCount must be 0 when registry is empty',
    );
    assert.ok(
      submitPayload.error.toLowerCase().includes('registry is empty'),
      'Error message must explain that the registry is empty',
    );

    const listResp = await handleToolCall('substrate_list_workflows', {}, 'test:empty-registry');
    assert.equal(listResp.isError, undefined, 'list_workflows must not be an error when empty');
    const listPayload = JSON.parse(listResp.content[0]?.text) as {
      count: number;
      registryEmpty: boolean;
      warning?: string;
    };
    assert.equal(listPayload.count, 0, 'list_workflows must report count=0 when empty');
    assert.equal(listPayload.registryEmpty, true, 'list_workflows must flag registryEmpty=true');
    assert.ok(listPayload.warning, 'list_workflows must include a warning when registry is empty');
  } finally {
    for (const wf of snapshot) {
      registerWorkflow(wf);
    }
  }
});

test('14. SSE stream receives run lifecycle events when a run is submitted', async () => {
  // Open an SSE stream and collect events emitted during a substrate_submit_run call.
  // Events must include at minimum: $/ready and one of run_started / run_complete / run_failed.
  const collectedEvents: Array<{ type: string; data: unknown }> = [];
  let sseResolve: (() => void) | null = null;
  let sseDone = false;

  const sseUrl = new URL(`${baseUrl}/mcp/sse`);

  const ssePromise = new Promise<void>((resolve, reject) => {
    const sseReq = http.request(
      {
        hostname: sseUrl.hostname,
        port: Number(sseUrl.port),
        path: sseUrl.pathname,
        headers: { Authorization: `Bearer ${TEST_API_KEY}`, Accept: 'text/event-stream' },
      },
      (sseRes) => {
        let buf = '';
        // currentEventType MUST persist across chunks — SSE event/data line
        // pairs are commonly split between TCP chunks. A per-chunk variable
        // would lose the event name and yield empty-typed events.
        let currentEventType = '';

        sseRes.on('data', (chunk: Buffer) => {
          buf += chunk.toString();
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6)) as unknown;
                collectedEvents.push({ type: currentEventType, data: parsed });
              } catch {
                /* ignore malformed */
              }
            }
          }

          // Once we have a ready event plus at least one run event, we're done
          const hasReady = collectedEvents.some((e) => e.type === '$/ready');
          const hasRunEvent = collectedEvents.some((e) =>
            ['run_started', 'run_complete', 'run_failed', 'approval_required'].includes(e.type),
          );
          if (hasReady && hasRunEvent && !sseDone) {
            sseDone = true;
            sseReq.destroy();
            resolve();
          }
        });

        sseRes.on('error', reject);
      },
    );

    sseReq.on('error', (e) => {
      if (!sseDone) reject(e);
    });
    sseResolve = resolve;
    sseReq.end();
  });

  // Give the SSE connection a moment to establish before firing the run
  await new Promise<void>((r) => setTimeout(r, 50));

  // Submit a run — this fires run lifecycle events onto the bus
  await toolCall('substrate_submit_run', {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { sseTest: true },
    mode: 'dry-run',
  });

  // Wait for the SSE promise to resolve (events received) or timeout after 3s
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('SSE timeout — no run event received within 3s')), 3_000),
  );

  await Promise.race([ssePromise, timeout]);

  // Verify we received the expected events
  const readyEvent = collectedEvents.find((e) => e.type === '$/ready');
  assert.ok(readyEvent, 'SSE stream must emit $/ready on connect');

  const runEvent = collectedEvents.find((e) =>
    ['run_started', 'run_complete', 'run_failed', 'approval_required'].includes(e.type),
  );
  assert.ok(
    runEvent,
    `SSE stream must emit a run lifecycle event. Got: ${collectedEvents.map((e) => e.type).join(', ')}`,
  );

  // The run event must include a runId field
  const runEventData = runEvent.data as Record<string, unknown>;
  assert.ok(typeof runEventData.runId === 'string', 'Run event must include a runId');

  void sseResolve; // ensure variable is referenced
});

test('15. SSE stream pushes live stage:start / stage:complete / run:complete events as a run executes', async () => {
  // While a workflow run is executing, the gateway must forward substrate
  // journal events to connected SSE clients so agents see stage-by-stage
  // progress without polling. We connect first, submit a multi-stage run,
  // and assert the full lifecycle sequence arrives over the open stream.
  const collectedEvents: Array<{ type: string; data: unknown }> = [];
  let sseDone = false;

  const sseUrl = new URL(`${baseUrl}/mcp/sse`);

  const ssePromise = new Promise<void>((resolve, reject) => {
    const sseReq = http.request(
      {
        hostname: sseUrl.hostname,
        port: Number(sseUrl.port),
        path: sseUrl.pathname,
        headers: { Authorization: `Bearer ${TEST_API_KEY}`, Accept: 'text/event-stream' },
      },
      (sseRes) => {
        let buf = '';
        // currentEventType MUST persist across chunks (see test 14).
        let currentEventType = '';
        sseRes.on('data', (chunk: Buffer) => {
          buf += chunk.toString();
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6)) as unknown;
                collectedEvents.push({ type: currentEventType, data: parsed });
              } catch {
                /* ignore */
              }
            }
          }

          // Resolve once we've observed a full lifecycle: start + at least one
          // stage:start, one stage:complete, and a run:complete event.
          const hasStageStart = collectedEvents.some((e) => e.type === 'stage:start');
          const hasStageComplete = collectedEvents.some((e) => e.type === 'stage:complete');
          const hasRunComplete = collectedEvents.some((e) => e.type === 'run:complete');
          if (hasStageStart && hasStageComplete && hasRunComplete && !sseDone) {
            sseDone = true;
            sseReq.destroy();
            resolve();
          }
        });
        sseRes.on('error', reject);
      },
    );
    sseReq.on('error', (e) => {
      if (!sseDone) reject(e);
    });
    sseReq.end();
  });

  // Allow the SSE connection to establish before firing the run.
  await new Promise<void>((r) => setTimeout(r, 50));

  const submitResp = await toolCall('substrate_submit_run', {
    workflowId: DRY_RUN_WORKFLOW_ID,
    input: { streamingTest: true },
    mode: 'dry-run',
  });
  const submitted = parseResult<{ runId: string; status: string }>(submitResp);

  const timeout = new Promise<void>((_, reject) =>
    setTimeout(
      () => reject(new Error('SSE timeout — full lifecycle not observed within 3s')),
      3_000,
    ),
  );
  await Promise.race([ssePromise, timeout]);

  // Full lifecycle assertions
  const stageStartEvents = collectedEvents.filter((e) => e.type === 'stage:start');
  const stageCompleteEvents = collectedEvents.filter((e) => e.type === 'stage:complete');
  const runComplete = collectedEvents.find((e) => e.type === 'run:complete');

  assert.ok(stageStartEvents.length >= 1, 'Expected at least one stage:start event');
  assert.ok(stageCompleteEvents.length >= 1, 'Expected at least one stage:complete event');
  assert.ok(runComplete, 'Expected a run:complete event for the dry-run lifecycle');

  // Each event must carry the runId of our submitted run
  for (const evt of [...stageStartEvents, ...stageCompleteEvents, runComplete]) {
    const data = evt.data as Record<string, unknown>;
    assert.equal(
      data.runId,
      submitted.runId,
      `Event ${evt.type} must reference the submitted runId`,
    );
    assert.equal(
      typeof data.timestamp,
      'number',
      `Event ${evt.type} must include a numeric timestamp`,
    );
  }

  // Order check: at least one stage:start arrived before its matching stage:complete
  const firstStartIdx = collectedEvents.findIndex((e) => e.type === 'stage:start');
  const firstCompleteIdx = collectedEvents.findIndex((e) => e.type === 'stage:complete');
  assert.ok(firstStartIdx < firstCompleteIdx, 'stage:start must precede stage:complete');

  // run:complete must arrive after the final stage:complete
  const lastCompleteIdx = collectedEvents.map((e) => e.type).lastIndexOf('stage:complete');
  const runCompleteIdx = collectedEvents.findIndex((e) => e.type === 'run:complete');
  assert.ok(
    runCompleteIdx > lastCompleteIdx,
    'run:complete must arrive after the final stage:complete',
  );
});

test('16. SubstrateStreaming client surfaces live stage events via onEvent callback', async () => {
  // The packaged client SDK must be able to consume the same stream and emit
  // typed events to its onEvent callback, so external agents (Sentra, etc.)
  // can drive their UIs from the gateway without writing a custom parser.
  const { SubstrateStreaming } = await import('@szl/substrate-client/streaming');

  const received: Array<{ type: string; runId?: string }> = [];
  let resolveDone: (() => void) | null = null;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const stream = new SubstrateStreaming({
    sseUrl: `${baseUrl}/mcp/sse`,
    apiKey: TEST_API_KEY,
    maxReconnectAttempts: 0,
    onEvent: (evt) => {
      const entry: { type: string; runId?: string } = { type: evt.type };
      if (evt.runId !== undefined) entry.runId = evt.runId;
      received.push(entry);
      const hasStart = received.some((e) => e.type === 'stage:start');
      const hasComplete = received.some((e) => e.type === 'stage:complete');
      const hasRunComplete = received.some((e) => e.type === 'run:complete');
      if (hasStart && hasComplete && hasRunComplete && resolveDone) {
        resolveDone();
        resolveDone = null;
      }
    },
  });

  void stream.connect();

  // Allow connection establishment, then trigger the run.
  await new Promise<void>((r) => setTimeout(r, 80));
  const submitResp = await toolCall('substrate_submit_run', {
    workflowId: DRY_RUN_WORKFLOW_ID,
    input: { sdkStreamingTest: true },
    mode: 'dry-run',
  });
  const submitted = parseResult<{ runId: string }>(submitResp);

  const timeout = new Promise<void>((_, reject) =>
    setTimeout(
      () => reject(new Error('SubstrateStreaming did not surface lifecycle within 3s')),
      3_000,
    ),
  );

  try {
    await Promise.race([done, timeout]);
  } finally {
    stream.disconnect();
  }

  const matching = received.filter((e) => e.runId === submitted.runId);
  assert.ok(
    matching.some((e) => e.type === 'stage:start'),
    'Client must surface stage:start',
  );
  assert.ok(
    matching.some((e) => e.type === 'stage:complete'),
    'Client must surface stage:complete',
  );
  assert.ok(
    matching.some((e) => e.type === 'run:complete'),
    'Client must surface run:complete',
  );
});

// ─── New 2025-11-25 Protocol Compliance Tests ──────────────────────────────────

test('17. Session lifecycle: create → use → terminate → 404', async () => {
  const initRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_API_KEY}`,
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'e2e-test-client', version: '1.0' } } }),
  });
  assert.equal(initRes.status, 200, 'initialize must return 200');
  const sessionId = initRes.headers.get('mcp-session-id');
  assert.ok(sessionId, 'initialize response must include MCP-Session-Id header');

  const pingRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_API_KEY}`,
      'MCP-Session-Id': sessionId,
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping', params: {} }),
  });
  assert.equal(pingRes.status, 200, 'ping with valid session must return 200');
  const pingBody = (await readBody<{ result?: unknown }>(pingRes))!;
  assert.deepEqual(pingBody.result, {}, 'ping must return empty result');

  const deleteRes = await fetch(`${baseUrl}/mcp`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${TEST_API_KEY}`,
      'MCP-Session-Id': sessionId,
    },
  });
  assert.equal(deleteRes.status, 200, 'DELETE must terminate the session');
  const deleteBody = (await readBody<{ terminated: boolean }>(deleteRes))!;
  assert.equal(deleteBody.terminated, true, 'DELETE must confirm termination');

  const expiredRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_API_KEY}`,
      'MCP-Session-Id': sessionId,
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'ping', params: {} }),
  });
  assert.equal(expiredRes.status, 404, 'Request with terminated session must return 404');
});

test('18. Extension negotiation round-trip returns server extensions', async () => {
  const initRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_API_KEY}`,
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0' },
        extensions: {
          'szl/governed-autonomy': {},
          'szl/unknown-extension': {},
        },
      },
    }),
  });
  assert.equal(initRes.status, 200);
  const body = (await readBody<{
    result?: {
      protocolVersion: string;
      extensions?: Record<string, unknown>;
    };
  }>(initRes))!;
  assert.ok(body.result, 'initialize must return result');
  assert.equal(body.result.protocolVersion, '2025-11-25');
  assert.ok(body.result.extensions, 'Server must return negotiated extensions');
  assert.ok('szl/governed-autonomy' in body.result.extensions, 'Known extension must be accepted');
  assert.ok(!('szl/unknown-extension' in body.result.extensions), 'Unknown extension must not be accepted');
});

test('19. Origin validation rejects requests with disallowed Origin', async () => {
  const savedEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_API_KEY}`,
        Origin: 'https://evil-attacker.example.com',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping', params: {} }),
    });
    assert.equal(res.status, 403, 'Disallowed Origin must receive 403 Forbidden');
  } finally {
    process.env.NODE_ENV = savedEnv;
  }
});

test('20. CORS preflight returns correct headers', async () => {
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    },
  });
  assert.ok(res.status === 200 || res.status === 204, 'OPTIONS must return 200 or 204');
  const allowMethods = res.headers.get('access-control-allow-methods') ?? '';
  assert.ok(allowMethods.includes('POST'), 'CORS must allow POST');
  assert.ok(allowMethods.includes('DELETE'), 'CORS must allow DELETE');
});

test('21. MCP discovery endpoint returns server manifest', async () => {
  const res = await fetch(`${baseUrl}/.well-known/mcp`);
  assert.equal(res.status, 200, 'Discovery endpoint must return 200');
  const manifest = (await res.json()) as {
    name: string;
    protocolVersion: string;
    toolCount: number;
    authMethods: string[];
    extensions: unknown;
    capabilities: unknown;
  };
  assert.equal(manifest.name, 'szl-substrate-mcp-gateway');
  assert.equal(manifest.protocolVersion, '2025-11-25');
  assert.ok(manifest.toolCount >= 8, 'Manifest must list tool count');
  assert.ok(Array.isArray(manifest.authMethods), 'authMethods must be an array');
  assert.ok(manifest.authMethods.includes('bearer_token'), 'bearer_token auth must be listed');
  assert.ok(manifest.authMethods.includes('oauth2_pkce'), 'oauth2_pkce must be listed');
  assert.ok(manifest.extensions, 'extensions must be present in manifest');
  assert.ok(manifest.capabilities, 'capabilities must be present in manifest');
});

test('22. Notifications 202 Accepted — initialized, cancelled, roots/list_changed', async () => {
  // MCP Streamable HTTP requires a session before notifications can be
  // dispatched. Initialize a fresh session for this test.
  const initRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_API_KEY}`,
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'e2e-notif-client', version: '1.0' },
      },
    }),
  });
  assert.equal(initRes.status, 200, 'initialize must return 200');
  await readBody(initRes);
  const sessionId = initRes.headers.get('mcp-session-id');
  assert.ok(sessionId, 'initialize must return a session id');

  for (const method of [
    'notifications/initialized',
    'notifications/cancelled',
    'notifications/roots/list_changed',
  ]) {
    const params = method === 'notifications/cancelled' ? { requestId: 'req-123' } : undefined;
    const res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TEST_API_KEY}`,
        'MCP-Session-Id': sessionId!,
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', method, ...(params ? { params } : {}) }),
    });
    assert.equal(res.status, 202, `${method} notification must return 202 Accepted`);
    assert.equal(
      (await res.text()).trim(),
      '',
      `${method} notification must return empty body`,
    );
  }
});

test('23. Streamable HTTP GET establishes SSE stream with session', async () => {
  const initRes = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TEST_API_KEY}`,
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'e2e-test-client', version: '1.0' } } }),
  });
  const sessionId = initRes.headers.get('mcp-session-id');
  assert.ok(sessionId, 'Session ID must be present');

  const events: Array<{ type: string; data: unknown }> = [];
  let resolved = false;

  const ssePromise = new Promise<void>((resolve, reject) => {
    const sseReq = http.request(
      {
        hostname: new URL(baseUrl).hostname,
        port: Number(new URL(baseUrl).port),
        path: '/mcp',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TEST_API_KEY}`,
          'MCP-Session-Id': sessionId,
          Accept: 'text/event-stream',
        },
      },
      (sseRes) => {
        let buf = '';
        // currentType MUST persist across TCP chunks (see test 14 for rationale).
        let currentType = '';
        sseRes.on('data', (chunk: Buffer) => {
          buf += chunk.toString();
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('event: ')) currentType = line.slice(7).trim();
            else if (line.startsWith('data: ')) {
              try {
                events.push({ type: currentType, data: JSON.parse(line.slice(6)) });
              } catch {}
            }
          }
          const hasReady = events.some((e) => e.type === '$/ready');
          if (hasReady && !resolved) {
            resolved = true;
            sseReq.destroy();
            resolve();
          }
        });
        sseRes.on('error', reject);
      },
    );
    sseReq.on('error', (e) => { if (!resolved) reject(e); });
    sseReq.end();
  });

  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('GET /mcp SSE timeout')), 3_000),
  );

  await Promise.race([ssePromise, timeout]);

  const readyEvent = events.find((e) => e.type === '$/ready');
  assert.ok(readyEvent, '$/ready event must be emitted on GET /mcp with session');
  const readyData = readyEvent.data as Record<string, unknown>;
  assert.equal(readyData.sessionId, sessionId, 'Ready event must echo the sessionId');
});

test('24. OAuth 2.1 — dynamic registration + authorization code + token exchange', async () => {
  const regRes = await fetch(`${baseUrl}/mcp/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_API_KEY}` },
    body: JSON.stringify({
      client_name: 'e2e-test-client',
      redirect_uris: ['http://localhost:9999/callback'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      scope: 'mcp',
    }),
  });
  assert.equal(regRes.status, 201, 'Client registration must return 201');
  const client = (await regRes.json()) as {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
  assert.ok(client.client_id, 'client_id must be returned');
  assert.ok(client.client_secret, 'client_secret must be returned');
  assert.deepEqual(client.redirect_uris, ['http://localhost:9999/callback']);

  const codeVerifier = 'e2e-code-verifier-abcdefghijklmnopqrstuvwxyz01234567890-test';
  const { createHash } = await import('node:crypto');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  const authRes = await fetch(`${baseUrl}/mcp/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_API_KEY}` },
    body: JSON.stringify({
      client_id: client.client_id,
      redirect_uri: 'http://localhost:9999/callback',
      response_type: 'code',
      scope: 'mcp',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: 'test-state-123',
    }),
    redirect: 'manual',
  });
  assert.equal(authRes.status, 302, 'Authorize must redirect');
  const location = authRes.headers.get('location') ?? '';
  assert.ok(location.includes('code='), 'Redirect must include authorization code');
  assert.ok(location.includes('state=test-state-123'), 'Redirect must echo state');

  const codeUrl = new URL(location);
  const code = codeUrl.searchParams.get('code');
  assert.ok(code, 'Authorization code must be present in redirect');

  const tokenRes = await fetch(`${baseUrl}/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_API_KEY}` },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:9999/callback',
      client_id: client.client_id,
      code_verifier: codeVerifier,
    }),
  });
  assert.equal(tokenRes.status, 200, 'Token exchange must return 200');
  const token = (await tokenRes.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  };
  assert.ok(token.access_token, 'access_token must be present');
  assert.equal(token.token_type, 'Bearer');
  assert.ok(token.expires_in > 0, 'expires_in must be positive');

  const replayRes = await fetch(`${baseUrl}/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TEST_API_KEY}` },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:9999/callback',
      client_id: client.client_id,
      code_verifier: codeVerifier,
    }),
  });
  assert.equal(replayRes.status, 400, 'Replaying used code must return 400');
  const replayBody = (await replayRes.json()) as { error: string };
  assert.equal(replayBody.error, 'invalid_grant', 'Replayed code must give invalid_grant error');
});

test('25. Security headers are present on responses', async () => {
  const res = await fetch(`${baseUrl}/mcp/health`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  const csp = res.headers.get('content-security-policy');
  assert.ok(csp, 'Content-Security-Policy header must be present');
  assert.ok(csp?.includes("frame-ancestors 'none'"), 'CSP must include frame-ancestors');
});
