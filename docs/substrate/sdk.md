# Substrate Client SDK

**Package:** `@szl/substrate-client` v1.0.0  
**Path:** `packages/substrate-client/`  
**CHANGELOG:** [CHANGELOG.md](../../packages/substrate-client/CHANGELOG.md)

**Related:** [mcp-transport.md](./mcp-transport.md) · [architecture.md](../architecture/architecture.md)

---

## Overview

`@szl/substrate-client` is the typed TypeScript SDK for the Substrate MCP Gateway. It wraps the MCP JSON-RPC 2.0 interface with fully typed methods, structured error handling, and SSE streaming support.

The SDK is intentionally dependency-free (Zod is only used for internal validation on the gateway side). It has no dependency on `@szl/substrate` itself, making it safe to import in any app — including those outside the monorepo.

---

## Installation

```bash
# Inside the monorepo (workspace)
pnpm add @szl/substrate-client

# External consumers (once published)
npm install @szl/substrate-client
```

---

## TypeScript Quickstart

```ts
import { SubstrateClient } from "@szl/substrate-client";

const client = new SubstrateClient({
  baseUrl: process.env.SUBSTRATE_GATEWAY_URL ?? "http://localhost:3700",
  apiKey: process.env.SUBSTRATE_GATEWAY_API_KEY,
  timeoutMs: 30_000,
});

// Verify connectivity
const info = await client.initialize();
console.log("Connected to", info.serverInfo.name, info.serverInfo.version);

// Submit a run
const run = await client.submitRun({
  workflowId: "opportunity-audit",
  input: { tenantId: "acme", period: "2026-Q1" },
  mode: "live",
});

// Poll until terminal state
let state = await client.getRun(run.runId);
while (state.status === "running") {
  await new Promise(r => setTimeout(r, 500));
  state = await client.getRun(run.runId);
}

if (state.status === "pending-approval") {
  // Out-of-band approval
  const approvals = await client.listApprovals({ domain: "lyte" });
  console.log("Pending:", approvals.count);

  await client.approve({
    recommendationId: run.runId,
    actor: "alice@example.com",
    note: "Reviewed: opportunity is within risk tolerance.",
  });
}

// Counterfactual replay — what if we'd used a cheaper model?
const diff = await client.counterfactual({
  runId: run.runId,
  workflowId: "opportunity-audit",
  modelAdapterId: "gpt-4o-mini",
});

console.log("Outcome changed:", diff.outcomeChanged);
console.log("Confidence delta:", diff.finalConfidenceDelta);
diff.diff?.stageDiffs
  .filter(d => d.differ)
  .forEach(d => {
    const baseStatus = d.baseline?.status ?? "—";
    const cfStatus   = d.counterfactual?.status ?? "—";
    const deltaConf  = ((d.counterfactual?.confidence ?? 0) - (d.baseline?.confidence ?? 0)).toFixed(3);
    console.log(`  Stage ${d.stageId}: ${baseStatus} → ${cfStatus} (Δ conf ${deltaConf})`);
  });
```

---

## Python Quickstart

```python
import httpx, json, time

GATEWAY_URL = "http://localhost:3700"
API_KEY = "your-substrate-gateway-api-key"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}",
}

def rpc(method, params=None):
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
    resp = httpx.post(f"{GATEWAY_URL}/mcp", headers=HEADERS, json=body, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"RPC error {data['error']['code']}: {data['error']['message']}")
    return data.get("result")

def tool_call(tool, args):
    result = rpc("tools/call", {"name": tool, "arguments": args})
    if result["isError"] if "isError" in result else False:
        raise RuntimeError(json.loads(result["content"][0]["text"])["error"])
    return json.loads(result["content"][0]["text"])


# 1. Submit a run
run = tool_call("substrate_submit_run", {
    "workflowId": "opportunity-audit",
    "input": {"tenantId": "acme", "period": "2026-Q1"},
    "mode": "live",
})
run_id = run["runId"]
print(f"Submitted run {run_id}, status={run['status']}")

# 2. Poll until complete
while True:
    state = tool_call("substrate_get_run", {"runId": run_id})
    if state["status"] not in ("running",):
        break
    time.sleep(0.5)

print(f"Run complete: status={state['status']}, confidence={state.get('finalConfidence')}")

# 3. Approve if at gate
if state["status"] == "pending-approval":
    approval = tool_call("substrate_approve", {
        "recommendationId": run_id,
        "actor": "compliance-bot",
        "note": "Auto-approved within policy threshold.",
    })
    print(f"Approved: proofRef={approval['proofRef']}")

# 4. Counterfactual replay
diff = tool_call("substrate_counterfactual", {
    "runId": run_id,
    "workflowId": "opportunity-audit",
    "modelAdapterId": "gpt-4o-mini",
})
print(f"Outcome changed: {diff['outcomeChanged']}, Δ confidence: {diff['finalConfidenceDelta']:.3f}")
```

---

## API Reference

### `SubstrateClient`

#### `new SubstrateClient(options)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | — | Gateway base URL |
| `apiKey` | `string?` | — | Bearer token |
| `timeoutMs` | `number?` | `30000` | Request timeout (ms) |
| `fetch` | `typeof fetch?` | `globalThis.fetch` | Custom fetch |

#### Methods

##### `submitRun(options)` → `Promise<SubmitRunResponse>`

Submit a workflow run.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `workflowId` | `string` | Yes | Registered workflow ID |
| `input` | `Record<string, unknown>` | Yes | Workflow-specific input |
| `mode` | `"live" \| "dry-run"` | No | Default: `"live"` |
| `metadata` | `Record<string, unknown>` | No | Caller-supplied metadata |

##### `getRun(runId)` → `Promise<PipelineRunSummary>`

Get current run state. Poll until `status` is not `"running"`.

##### `replay(options)` → `Promise<ReplayResponse>`

Replay a completed run from its journal. `workflowId` must match the original.

##### `counterfactual(options)` → `Promise<CounterfactualResponse>`

Counterfactual replay with optional model/policy substitution. Returns a `CounterfactualDiff` with per-stage deltas and an overall outcome change flag.

| Param | Type | Description |
|-------|------|-------------|
| `runId` | `string` | Baseline run ID |
| `workflowId` | `string` | Workflow definition ID |
| `modelAdapterId` | `string?` | Substitute model adapter |
| `policyId` | `string?` | Substitute policy (from policy-engine registry) |

##### `listApprovals(options?)` → `Promise<ApprovalListResponse>`

List entries in the approvals inbox. Optional filters: `verdict`, `domain`.

##### `approve(options)` → `Promise<ApprovalActionResponse>`

Approve a pending ApprovalGate. Records actor, note, and proof provenance.

| Param | Type | Required |
|-------|------|----------|
| `recommendationId` | `string` | Yes |
| `actor` | `string?` | No |
| `note` | `string?` | No |
| `domain` | `string?` | No |

##### `reject(options)` → `Promise<ApprovalActionResponse>`

Reject a pending ApprovalGate. `note` is required.

##### `listWorkflows()` → `Promise<WorkflowListResponse>`

List all registered workflows with ID, name, stage count, and run count.

---

### Streaming

```ts
import { SubstrateStreaming } from "@szl/substrate-client/streaming";

const stream = new SubstrateStreaming({
  sseUrl: client.sseUrl(),
  apiKey: process.env.SUBSTRATE_GATEWAY_API_KEY,
  onEvent: (event) => {
    // event.type: "ready" | "ping" | "run_started" | ...
    console.log(event.type, event.runId, event.data);
  },
  reconnectDelayMs: 3000,
  maxReconnectAttempts: 5,
});

await stream.connect();
stream.disconnect(); // when done
```

---

### Error Handling

```ts
import { SubstrateClientError } from "@szl/substrate-client";

try {
  await client.submitRun({ workflowId: "missing", input: {} });
} catch (e) {
  if (e instanceof SubstrateClientError) {
    console.error(`[${e.code}] ${e.message}`, e.data);
  }
}
```

---

## Key Types

```ts
type ExecutionMode = "live" | "dry-run" | "replay" | "counterfactual";
type PipelineRunStatus = "running" | "completed" | "failed" | "pending-approval" | "dry-run-complete" | "cancelled";
type ApprovalVerdict = "approved" | "rejected" | "escalated";

interface PipelineRunSummary {
  runId: string;
  workflowId: string;
  workflowName: string;
  mode: ExecutionMode;
  status: PipelineRunStatus;
  stageResults: StageResultSummary[];
  finalConfidence?: number;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  traceId: string;
}

interface CounterfactualDiff {
  baselineRunId: string;
  counterfactualRunId: string;
  stageDiffs: StageDiff[];
  finalConfidenceDelta: number;
  outcomeChanged: boolean;
  generatedAt: string;
}
```

---

## Versioning & Changelog

Follows [Semantic Versioning](https://semver.org). See [CHANGELOG.md](../../packages/substrate-client/CHANGELOG.md).

Current: **v1.0.0** (April 2026)

---

*Last updated: 2026-04-20.*
