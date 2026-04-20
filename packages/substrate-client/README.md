# @szl/substrate-client

Typed TypeScript SDK for the [Substrate MCP Gateway](../../services/substrate-mcp-gateway). Wraps the MCP JSON-RPC 2.0 interface with fully typed methods and streaming support.

## Installation

```bash
pnpm add @szl/substrate-client
```

## Quickstart (TypeScript)

```ts
import { SubstrateClient } from "@szl/substrate-client";

const client = new SubstrateClient({
  baseUrl: "http://localhost:3700",
  apiKey: process.env.SUBSTRATE_GATEWAY_API_KEY,
});

// 1. Submit a run
const run = await client.submitRun({
  workflowId: "opportunity-audit",
  input: { tenantId: "acme", period: "2026-Q1" },
  mode: "live",
});
console.log("Run ID:", run.runId, "Status:", run.status);

// 2. Poll for completion
let state = await client.getRun(run.runId);
while (state.status === "running") {
  await new Promise(r => setTimeout(r, 500));
  state = await client.getRun(run.runId);
}

// 3. Approve a gate (if paused)
if (state.status === "pending-approval") {
  await client.approve({
    recommendationId: run.runId,
    actor: "alice@example.com",
    note: "Reviewed — looks good.",
  });
}

// 4. Counterfactual replay
const diff = await client.counterfactual({
  runId: run.runId,
  workflowId: "opportunity-audit",
  modelAdapterId: "gpt-4o-mini",
});
console.log("Outcome changed:", diff.outcomeChanged);
console.log("Confidence delta:", diff.finalConfidenceDelta);
```

## Python Quickstart

```python
import httpx, json

BASE_URL = "http://localhost:3700"
API_KEY  = "your-substrate-gateway-api-key"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}",
}

def rpc(method, params=None):
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
    r = httpx.post(f"{BASE_URL}/mcp", headers=HEADERS, json=body, timeout=30)
    r.raise_for_status()
    return r.json()

def tool_call(tool, args):
    result = rpc("tools/call", {"name": tool, "arguments": args})
    if "error" in result:
        raise RuntimeError(result["error"])
    text = result["result"]["content"][0]["text"]
    return json.loads(text)

# Submit a run
run = tool_call("substrate_submit_run", {
    "workflowId": "opportunity-audit",
    "input": {"tenantId": "acme"},
    "mode": "dry-run",
})
print("Run ID:", run["runId"])

# Get run status
state = tool_call("substrate_get_run", {"runId": run["runId"]})
print("Status:", state["status"])

# List approvals
approvals = tool_call("substrate_list_approvals", {})
print("Pending:", approvals["count"])
```

## API Reference

### `SubstrateClient`

#### Constructor

```ts
new SubstrateClient(options: SubstrateClientOptions)
```

| Option | Type | Description |
|--------|------|-------------|
| `baseUrl` | `string` | Gateway base URL (e.g. `http://localhost:3700`) |
| `apiKey` | `string?` | Bearer token (`SUBSTRATE_GATEWAY_API_KEY`) |
| `timeoutMs` | `number?` | Request timeout in ms (default: 30 000) |
| `fetch` | `typeof fetch?` | Custom fetch implementation |

#### Methods

| Method | Description |
|--------|-------------|
| `submitRun(options)` | Submit a workflow run |
| `getRun(runId)` | Poll run state by ID |
| `replay(options)` | Replay a completed run from journal |
| `counterfactual(options)` | Counterfactual replay with model/policy substitution |
| `listApprovals(options?)` | List entries in the approvals inbox |
| `approve(options)` | Approve a pending ApprovalGate |
| `reject(options)` | Reject a pending ApprovalGate |
| `listWorkflows()` | List registered workflows |
| `initialize()` | Negotiate MCP protocol version |
| `listTools()` | Get tool inventory with schemas |
| `health()` | Gateway health check |
| `sseUrl()` | SSE endpoint URL for streaming |

### `SubstrateStreaming`

Connects to the SSE endpoint and emits typed `RunEvent` objects.

```ts
import { SubstrateStreaming } from "@szl/substrate-client/streaming";

const stream = new SubstrateStreaming({
  sseUrl: client.sseUrl(),
  apiKey: process.env.SUBSTRATE_GATEWAY_API_KEY,
  onEvent: (event) => {
    console.log(event.type, event.runId, event.data);
  },
  onError: (err) => console.error(err),
});

await stream.connect();
// ... later
stream.disconnect();
```

### `connectRunEvents` (convenience)

```ts
import { connectRunEvents } from "@szl/substrate-client/streaming";

const disconnect = connectRunEvents(client.sseUrl(), {
  apiKey,
  onEvent: (e) => console.log(e.type),
});
disconnect(); // later
```

## Auth

All write operations require an `Authorization: Bearer <SUBSTRATE_GATEWAY_API_KEY>` header. Read-only operations (`tools/list`, `resources/list`, `prompts/list`, `initialize`, `/mcp/health`) are unauthenticated.

## Error Handling

All methods throw `SubstrateClientError` on failure:

```ts
import { SubstrateClientError } from "@szl/substrate-client";

try {
  await client.submitRun({ workflowId: "missing", input: {} });
} catch (e) {
  if (e instanceof SubstrateClientError) {
    console.error(e.message, e.code, e.data);
  }
}
```

## Versioning

This package follows [Semantic Versioning](https://semver.org). See [CHANGELOG.md](./CHANGELOG.md) for the release history.
