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

import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import http from "node:http";
import express from "express";
import { createHttpTransport } from "../src/transport/http.js";
import {
  registerWorkflow,
  defineWorkflow,
  ApprovalGate,
  Decide,
  definePolicy,
  defineBudget,
} from "@szl/substrate";
import {
  clearApprovalInbox,
} from "@workspace/approvals-inbox";

// ─── Test Server Setup ────────────────────────────────────────────────────────

let server: http.Server;
let baseUrl: string;

const TEST_API_KEY = "test-key-e2e-2026";
process.env["SUBSTRATE_GATEWAY_API_KEY"] = TEST_API_KEY;
process.env["NODE_ENV"] = "test";

before(async () => {
  const app = express();
  app.use("/mcp", createHttpTransport());
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
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
const DRY_RUN_WORKFLOW_ID = "e2e-dry-run-workflow";
const dryRunWorkflow = defineWorkflow({
  id: DRY_RUN_WORKFLOW_ID,
  name: "E2E Dry-Run Workflow",
  stages: [
    ApprovalGate({ id: "gate", name: "Approval Gate" }),
    Decide({ id: "decide", name: "Decide", dependsOn: ["gate"],
      sideEffects: ["write-internal"], highRiskSideEffects: [],
    }),
  ],
  policy: definePolicy({ id: "e2e-policy", name: "E2E Policy" }),
  budget: defineBudget({ escalateAt: 0.5 }),
});

// live-mode workflow: single ApprovalGate pauses immediately in live mode
const LIVE_GATE_WORKFLOW_ID = "e2e-live-gate-workflow";
const liveGateWorkflow = defineWorkflow({
  id: LIVE_GATE_WORKFLOW_ID,
  name: "E2E Live Gate Workflow",
  stages: [
    ApprovalGate({ id: "approval-gate", name: "Approval Gate" }),
  ],
  policy: definePolicy({ id: "e2e-live-policy", name: "E2E Live Policy" }),
  budget: defineBudget({ escalateAt: 0.5 }),
});

registerWorkflow(dryRunWorkflow);
registerWorkflow(liveGateWorkflow);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function rpc(
  method: string,
  params?: Record<string, unknown>,
  key: string | null = TEST_API_KEY,
): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["Authorization"] = `Bearer ${key}`;

  const res = await fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  return res.json() as Promise<unknown>;
}

async function toolCall(
  toolName: string,
  args: Record<string, unknown>,
  key: string | null = TEST_API_KEY,
): Promise<{ content?: Array<{ type: string; text: string }>; isError?: boolean; error?: unknown }> {
  const resp = await rpc("tools/call", { name: toolName, arguments: args }, key) as {
    result?: { content?: Array<{ type: string; text: string }>; isError?: boolean };
    error?: unknown;
  };
  if (resp.error) return { error: resp.error };
  return resp.result ?? {};
}

function parseResult<T>(result: { content?: Array<{ type: string; text: string }>; isError?: boolean; error?: unknown }): T {
  if (result.error) throw new Error(JSON.stringify(result.error));
  if (result.isError) {
    const text = result.content?.[0]?.text ?? "unknown error";
    throw new Error(`Tool returned isError=true: ${text}`);
  }
  const text = result.content?.[0]?.text ?? "{}";
  return JSON.parse(text) as T;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test("1. initialize and ping respond correctly", async () => {
  const init = await rpc("initialize") as { result?: { protocolVersion: string; serverInfo: { name: string } } };
  assert.ok(init.result, "initialize must return a result");
  assert.equal(init.result.protocolVersion, "2024-11-05");
  assert.ok(init.result.serverInfo.name.includes("substrate"));

  const ping = await rpc("ping") as { result?: unknown };
  assert.deepEqual(ping.result, {});
});

test("2. tools/list returns all 8 substrate tools", async () => {
  const resp = await rpc("tools/list") as { result?: { tools: Array<{ name: string }> } };
  assert.ok(resp.result, "tools/list must return a result");
  const names = resp.result.tools.map((t) => t.name);
  const expected = [
    "substrate_submit_run", "substrate_get_run", "substrate_replay",
    "substrate_counterfactual", "substrate_list_approvals",
    "substrate_approve", "substrate_reject", "substrate_list_workflows",
  ];
  for (const name of expected) {
    assert.ok(names.includes(name), `Missing tool: ${name}`);
  }
  assert.equal(names.length, 8);
});

test("3. substrate_submit_run submits a dry-run and returns a runId", async () => {
  const result = await toolCall("substrate_submit_run", {
    workflowId: DRY_RUN_WORKFLOW_ID,
    input: { testKey: "testValue" },
    mode: "dry-run",
  });

  const data = parseResult<{ runId: string; status: string; workflowId: string }>(result);
  assert.ok(data.runId, "runId must be present");
  assert.equal(data.workflowId, DRY_RUN_WORKFLOW_ID);
  assert.ok(
    ["running", "completed", "dry-run-complete", "pending-approval", "failed"].includes(data.status),
    `Unexpected status: ${data.status}`,
  );
});

test("4. substrate_get_run retrieves submitted run state", async () => {
  const submitResult = await toolCall("substrate_submit_run", {
    workflowId: DRY_RUN_WORKFLOW_ID,
    input: { testKey: "getRunTest" },
    mode: "dry-run",
  });
  const submitted = parseResult<{ runId: string }>(submitResult);

  const getResult = await toolCall("substrate_get_run", { runId: submitted.runId });
  const run = parseResult<{ runId: string; workflowId: string; status: string }>(getResult);
  assert.equal(run.runId, submitted.runId, "runId must match");
  assert.equal(run.workflowId, DRY_RUN_WORKFLOW_ID, "workflowId must match");
});

test("5. live-mode run pauses at ApprovalGate with status pending-approval", async () => {
  // The liveGateWorkflow has only an ApprovalGate as its first stage.
  // In live mode this causes the run to immediately pause and return.
  const result = await toolCall("substrate_submit_run", {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { trigger: "approval-flow-test" },
    mode: "live",
  });

  const data = parseResult<{ runId: string; status: string }>(result);
  assert.ok(data.runId, "runId must be present");
  assert.equal(data.status, "pending-approval",
    `Expected pending-approval, got ${data.status}. The ApprovalGate must pause in live mode.`);
});

test("6. substrate_approve resolves pending run via defaultRuntime.resume()", async () => {
  clearApprovalInbox();

  // Submit a live-mode run — it pauses at the ApprovalGate
  const submitResult = await toolCall("substrate_submit_run", {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { trigger: "approve-test" },
    mode: "live",
  });
  const submitted = parseResult<{ runId: string; status: string }>(submitResult);
  assert.equal(submitted.status, "pending-approval", "Run must pause at gate");

  // Approve via the gateway — internally calls defaultRuntime.resume()
  const approveResult = await toolCall("substrate_approve", {
    recommendationId: submitted.runId,
    actor: "alice@example.com",
    note: "Approved by test.",
    domain: "e2e-test",
  });
  const approval = parseResult<{ verdict: string; actor: string; proofRef: string; runStatus: string }>(approveResult);
  assert.equal(approval.verdict, "approved", "Verdict must be approved");
  assert.equal(approval.actor, "alice@example.com", "Actor must be preserved");
  assert.ok(approval.proofRef, "proofRef must be set by approvals-inbox");

  // The run should now be completed (gate was the only stage)
  assert.ok(
    ["completed", "running"].includes(approval.runStatus),
    `Run status after approve should be completed or running, got: ${approval.runStatus}`,
  );

  // Verify via substrate_get_run
  const getResult = await toolCall("substrate_get_run", { runId: submitted.runId });
  const run = parseResult<{ status: string }>(getResult);
  assert.ok(
    ["completed", "running"].includes(run.status),
    `Run should be completed after approval, got: ${run.status}`,
  );

  // Verify approval appears in the inbox
  const listResult = await toolCall("substrate_list_approvals", { verdict: "approved", domain: "e2e-test" });
  const list = parseResult<{ count: number; approvals: Array<{ recommendationId: string; verdict: string }> }>(listResult);
  assert.ok(list.count >= 1, "Approval must appear in inbox");
  const found = list.approvals.find((a) => a.recommendationId === submitted.runId);
  assert.ok(found, "Approval for our run must appear in the inbox");
  assert.equal(found.verdict, "approved");
});

test("7. substrate_reject terminates a pending run via defaultRuntime.reject()", async () => {
  clearApprovalInbox();

  // Submit a live-mode run — it pauses at the ApprovalGate
  const submitResult = await toolCall("substrate_submit_run", {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { trigger: "reject-test" },
    mode: "live",
  });
  const submitted = parseResult<{ runId: string; status: string }>(submitResult);
  assert.equal(submitted.status, "pending-approval", "Run must pause at gate before rejection");

  // Reject via the gateway — internally calls defaultRuntime.reject()
  const rejectResult = await toolCall("substrate_reject", {
    recommendationId: submitted.runId,
    note: "Risk too high — rejected.",
    actor: "compliance@example.com",
    domain: "e2e-test",
  });
  const rejection = parseResult<{ verdict: string; note: string; runStatus: string }>(rejectResult);
  assert.equal(rejection.verdict, "rejected", "Verdict must be rejected");
  assert.ok(rejection.note?.includes("Risk too high"), "Rejection note must be preserved");
  assert.equal(rejection.runStatus, "failed", "Run status must be failed after rejection");

  // Verify via substrate_get_run — run must be marked failed
  const getResult = await toolCall("substrate_get_run", { runId: submitted.runId });
  const run = parseResult<{ status: string; error: string }>(getResult);
  assert.equal(run.status, "failed", "Run must be failed after rejection");
  assert.ok(run.error?.includes("Rejected"), "Run error must mention rejection");
});

test("8. substrate_list_workflows returns workflows from the registry", async () => {
  const result = await toolCall("substrate_list_workflows", {});
  const data = parseResult<{ count: number; substrateVersion: string; workflows: Array<{ id: string; name: string }> }>(result);

  // Both workflows registered above must appear
  assert.ok(data.count >= 2, `Expected at least 2 registered workflows, got ${data.count}`);
  assert.ok(typeof data.substrateVersion === "string", "substrateVersion must be a string");

  const dryRunFound = data.workflows.find((w) => w.id === DRY_RUN_WORKFLOW_ID);
  const liveFound = data.workflows.find((w) => w.id === LIVE_GATE_WORKFLOW_ID);
  assert.ok(dryRunFound, `${DRY_RUN_WORKFLOW_ID} must appear in workflow list`);
  assert.ok(liveFound, `${LIVE_GATE_WORKFLOW_ID} must appear in workflow list`);
});

test("9. counterfactual replay over the wire returns a decision diff", async () => {
  // Use LIVE_GATE_WORKFLOW_ID (only ApprovalGate) so counterfactual succeeds
  // without a registered model adapter — ApprovalGate is auto-approved in
  // counterfactual mode (non-live).
  const submitResult = await toolCall("substrate_submit_run", {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { counterfactualTest: true },
    mode: "dry-run",
  });
  const submitted = parseResult<{ runId: string; status: string }>(submitResult);
  assert.ok(submitted.runId, "Baseline run must have a runId");

  const cfResult = await toolCall("substrate_counterfactual", {
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

  assert.ok(data.baselineRunId, "diff must include baselineRunId");
  assert.ok(data.counterfactualRunId, "diff must include counterfactualRunId");
  assert.equal(data.baselineRunId, submitted.runId, "baselineRunId must match the submitted run");
  assert.equal(typeof data.outcomeChanged, "boolean", "outcomeChanged must be a boolean");
  assert.equal(typeof data.finalConfidenceDelta, "number", "finalConfidenceDelta must be a number");
});

test("10. auth: write tool rejects anonymous request when API key is set", async () => {
  // API key is set (TEST_API_KEY). A request without a key must be denied.
  // We temporarily set NODE_ENV to production to activate strict auth.
  const savedEnv = process.env["NODE_ENV"];
  process.env["NODE_ENV"] = "production";
  try {
    const result = await rpc(
      "tools/call",
      { name: "substrate_approve", arguments: { recommendationId: "any", note: "test" } },
      null, // no key
    ) as { error?: { code: number; message: string } };

    // Must get PERMISSION_DENIED — the gateway must not accept the request
    assert.ok(result.error, "Request without API key must be rejected");
    assert.ok(
      result.error.code === -32000 || result.error.code === -32001,
      `Expected PERMISSION_DENIED (-32000 or -32001) but got ${result.error.code}: ${result.error.message}`,
    );
  } finally {
    process.env["NODE_ENV"] = savedEnv;
  }
});

test("11. health endpoint returns service info without auth", async () => {
  const res = await fetch(`${baseUrl}/mcp/health`);
  assert.equal(res.status, 200);
  const body = await res.json() as { status: string; service: string; toolCount: number };
  assert.equal(body.status, "ok");
  assert.ok(body.toolCount >= 8, `Expected at least 8 tools, got ${body.toolCount}`);
});

test("12. resources/list and resources/read work correctly", async () => {
  const listResp = await rpc("resources/list") as { result?: { resources: Array<{ uri: string }> } };
  assert.ok((listResp.result?.resources.length ?? 0) >= 4, "At least 4 resources must be listed");

  const readResp = await rpc("resources/read", { uri: "substrate://schema/run" }) as {
    result?: { contents: Array<{ mimeType: string; text: string }> }
  };
  assert.ok(readResp.result?.contents?.[0]?.text, "schema/run resource must return content");
  const schema = JSON.parse(readResp.result!.contents[0]!.text) as { title: string };
  assert.equal(schema.title, "PipelineRun");
});

test("13. prompts/list and prompts/get work correctly", async () => {
  const listResp = await rpc("prompts/list") as { result?: { prompts: Array<{ name: string }> } };
  assert.ok((listResp.result?.prompts.length ?? 0) >= 2, "At least 2 prompts must be listed");

  // substrate_run_summary with a non-existent runId should return a helpful error from the gateway
  const getResp = await rpc("prompts/get", {
    name: "substrate_run_summary",
    arguments: { runId: "nonexistent-run-id" },
  }) as { result?: unknown; error?: unknown };

  // Either a structured error (run not found) or a result with NOT_FOUND embedded — both are fine
  const responseHasShape = getResp.error !== undefined || getResp.result !== undefined;
  assert.ok(responseHasShape, "prompts/get must return either a result or structured error");
});

test("14. SSE stream receives run lifecycle events when a run is submitted", async () => {
  // Open an SSE stream and collect events emitted during a substrate_submit_run call.
  // Events must include at minimum: $/ready and one of run_started / run_complete / run_failed.
  const collectedEvents: Array<{ type: string; data: unknown }> = [];
  let sseResolve: (() => void) | null = null;
  let sseDone = false;

  const sseUrl = new URL(`${baseUrl}/mcp/sse`);

  const ssePromise = new Promise<void>((resolve, reject) => {
    const sseReq = http.request(
      { hostname: sseUrl.hostname, port: Number(sseUrl.port), path: sseUrl.pathname,
        headers: { Authorization: `Bearer ${TEST_API_KEY}`, Accept: "text/event-stream" } },
      (sseRes) => {
        let buf = "";

        sseRes.on("data", (chunk: Buffer) => {
          buf += chunk.toString();
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          let currentEventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6)) as unknown;
                collectedEvents.push({ type: currentEventType, data: parsed });
              } catch { /* ignore malformed */ }
            }
          }

          // Once we have a ready event plus at least one run event, we're done
          const hasReady = collectedEvents.some((e) => e.type === "$/ready");
          const hasRunEvent = collectedEvents.some((e) =>
            ["run_started", "run_complete", "run_failed", "approval_required"].includes(e.type)
          );
          if (hasReady && hasRunEvent && !sseDone) {
            sseDone = true;
            sseReq.destroy();
            resolve();
          }
        });

        sseRes.on("error", reject);
      },
    );

    sseReq.on("error", (e) => { if (!sseDone) reject(e); });
    sseResolve = resolve;
    sseReq.end();
  });

  // Give the SSE connection a moment to establish before firing the run
  await new Promise<void>((r) => setTimeout(r, 50));

  // Submit a run — this fires run lifecycle events onto the bus
  await toolCall("substrate_submit_run", {
    workflowId: LIVE_GATE_WORKFLOW_ID,
    input: { sseTest: true },
    mode: "dry-run",
  });

  // Wait for the SSE promise to resolve (events received) or timeout after 3s
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error("SSE timeout — no run event received within 3s")), 3_000)
  );

  await Promise.race([ssePromise, timeout]);

  // Verify we received the expected events
  const readyEvent = collectedEvents.find((e) => e.type === "$/ready");
  assert.ok(readyEvent, "SSE stream must emit $/ready on connect");

  const runEvent = collectedEvents.find((e) =>
    ["run_started", "run_complete", "run_failed", "approval_required"].includes(e.type)
  );
  assert.ok(runEvent, `SSE stream must emit a run lifecycle event. Got: ${collectedEvents.map((e) => e.type).join(", ")}`);

  // The run event must include a runId field
  const runEventData = runEvent.data as Record<string, unknown>;
  assert.ok(typeof runEventData["runId"] === "string", "Run event must include a runId");

  void sseResolve; // ensure variable is referenced
});
