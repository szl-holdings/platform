# Tool Contract Review
**Date:** 2026-04-20  
**Phase:** Series-A Reset — Phase 10  
**Scope:** Tool contracts across tool-mesh, tool-registry, and ai-control-plane

---

## Executive Summary

Tool contracts in the AEEP platform are partially typed and partially enforced. Input schemas are validated against JSON-Schema-like descriptors in `tool-mesh/schema-validator.ts`. Timeouts are supported per call but not required per manifest. Output schemas are not enforced. Retries are managed upstream in `agents-core` rather than inside the tool executor, creating an inconsistency: tools invoked outside `AgentRun` have no retry protection. Five domain tool files exist (document-retrieval, finance-tools, graph-query, operations-tools, security-tools) and represent the canonical tool surface. The `tool-registry` package currently contains only `node_modules` — it appears to be a placeholder awaiting population.

---

## Tool Manifest Review

### Current `ToolManifest` Shape

From `packages/tool-mesh/src/manifest.ts`:

```typescript
interface ToolManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  inputSchema?: Record<string, unknown>;   // JSON Schema object
  outputSchema?: Record<string, unknown>;  // JSON Schema object — PRESENT but NOT ENFORCED
  timeoutMs?: number;                       // Optional — defaults to caller-provided value
  rateLimit?: { requestsPerMinute: number };
  tags?: string[];
  tier?: AgentTierName;                    // Minimum required agent tier
  requiresApproval?: boolean;
  dryRunSupported?: boolean;
  metadata?: Record<string, unknown>;
}
```

**Assessment:**
- `inputSchema` is declared and validated before handler invocation — good.
- `outputSchema` is declared but not validated after handler returns — gap.
- `timeoutMs` is optional; manifests without it rely on callers to set a timeout.
- `tier` enforces minimum tier — tools requiring `operator` tier cannot be invoked by `analyst`-tier agents.
- `requiresApproval` at manifest level is redundant with `StepDefinition.requiresApproval` in `agents-core` — two sources of truth for the same gate.

---

## Schema Validation Findings

### Input Validation

The `SchemaValidator` in `tool-mesh/schema-validator.ts` implements a recursive JSON-Schema interpreter covering:

| Feature | Supported | Notes |
|---------|-----------|-------|
| `type` checking | Yes | Handles string, number, integer, boolean, array, object |
| `required` fields | Yes | Raises error on missing required properties |
| `enum` values | Yes | Exact match |
| `minimum` / `maximum` | Yes | Numeric bounds |
| `properties` (nested) | Yes | Recursive traversal |
| `items` (arrays) | Yes | Validates each array element |
| `$ref` | No | No JSON Schema reference resolution |
| `anyOf` / `oneOf` | No | No union schema support |
| `additionalProperties` | No | Extra fields silently pass |
| `pattern` (string) | No | String regex patterns not checked |
| `format` | No | `format: "email"` etc. not validated |

**Impact:** Tools with union-typed inputs or string pattern constraints have no runtime input safety. The schema validator should be treated as a best-effort structural check rather than a complete contract.

### Output Validation

**There is no output schema validation.** After a handler returns, the executor records the result in `ToolExecutionRecord.output: unknown` without checking it against `manifest.outputSchema`. Downstream consumers (next plan step, memory writer, verifier) receive unvalidated output.

**Risk:** A tool that returns a partial or malformed response will not be caught until a downstream step either crashes on a missing field or silently propagates bad data.

**Recommendation:** After `executeWithTimeout` returns, run `validateSchema(result, manifest.outputSchema)` and surface validation errors as `tool_output_schema_violation` events. Do not block execution by default, but record a `warn` outcome and attach it to the `ToolExecutionRecord`.

---

## Timeout Review

### Timeout Hierarchy

```
StepDefinition.timeoutMs  (per step, set by agent run author)
  └─ ToolManifest.timeoutMs  (per tool, set by tool author)
      └─ AgentRunOptions.timeoutMs  (run-wide default)
```

**Current behavior:** Only `StepDefinition.timeoutMs` and `AgentRunOptions.timeoutMs` are used in `AgentRun.step()`. `ToolManifest.timeoutMs` is read by the `ToolMeshExecutor.executeWithTimeout()` caller — but that caller is the gateway, not `AgentRun`. The two paths use the same timeout mechanism (Promise.race) but are not coordinated.

**Gap:** If a step definition does not set `timeoutMs` and the run has no default, the tool call has no timeout. Long-running tools can block indefinitely.

**Recommendation:** Make `ToolManifest.timeoutMs` required (with a platform maximum of 120,000 ms). The gateway should reject registration of manifests without a timeout. The step executor should use `Math.min(stepTimeoutMs, manifest.timeoutMs)` to apply the tighter of the two limits.

---

## Retry Policy Review

### Current Retry Architecture

Retries are implemented in `packages/agents-core/src/retry.ts` via `withRetry()` and applied in `AgentRun.step()`. Key parameters:

| Parameter | Default | Notes |
|-----------|---------|-------|
| `maxAttempts` | 3 | Hard cap of 10 |
| `initialDelayMs` | 200 | |
| `maxDelayMs` | 10,000 | |
| `backoffMultiplier` | 2 | Exponential |
| `retryableCategories` | timeout, provider, unknown | policy / approval errors not retried |

**Strengths:**
- Non-retryable categories (validation, policy) are identified at classification time and do not consume retry budget.
- `retryLog` provides a complete history of retry attempts with error categories and delay times.

**Gaps:**
- No jitter in delay computation. Pure exponential backoff (`delay * multiplier`) means all retrying agents hit the upstream service at the same intervals — thundering herd risk in multi-agent scenarios.
- Retries are applied at the step level in `AgentRun.step()`. Tools invoked directly through `ToolMeshGateway` (outside an `AgentRun`) have no retry protection.
- `maxAttempts: 10` is the schema ceiling but no per-tool retry budget is enforced separately from the step budget. A single tool that fails 10 times consumes the entire step budget without the caller's explicit awareness.
- `categorizeError` uses string matching on error messages — fragile if error messages change. A structured `code` field on errors would be more robust.

**Recommendation:**
1. Add `Math.random() * delay * 0.25` jitter before each retry delay.
2. Add `maxRetries` to `ToolManifest` so tool authors can declare retry budget independently from step-level policy.
3. Propagate retry events to `cognitive-observability` with tool ID as a label.

---

## Failure Handling Review

### Failure Path Coverage

| Scenario | Handled By | Gap |
|----------|-----------|-----|
| Tool timeout | `executeWithTimeout` + `AgentRunError(category: 'timeout')` | None |
| Input schema violation | `SchemaValidator` pre-execution | None |
| Output schema violation | None | **Not handled** |
| Handler throws | `withRetry` → `AgentRunError` | None |
| Exhausted retries | Dead-letter queue | None |
| Approval rejected | `AgentRunError(category: 'approval_rejected')` | None |
| Rate limit exceeded | `RateLimiter` throws | Not categorized as a distinct error category — lands in `unknown` |
| Circuit open | `ModelRouter` throws | Not propagated to `RunLedgerEntry` as a distinct event |

**Recommendation:** Extend `RunErrorCategory` with `rate_limited` and `circuit_open` to distinguish these from generic `unknown` failures. Emit distinct metric events for each.

---

## Domain Tool Inventory

| Tool File | Domain | Key Operations | Input Typed | Output Typed |
|-----------|--------|----------------|-------------|--------------|
| document-retrieval.ts | Cross-domain | search, fetch, summarize | Partial (manifest schema) | No |
| finance-tools.ts | Financial | cashflow, valuation, sensitivity | Partial | No |
| graph-query.ts | Knowledge graph | entity lookup, path traversal | Partial | No |
| operations-tools.ts | Ops/monitoring | alert query, incident lookup | Partial | No |
| security-tools.ts | Sentra/security | finding lookup, risk scoring | Partial | No |

All five domain tool files declare input manifests but none declare `outputSchema`. This is the single highest-impact gap — consumers downstream of these tools (verifier, memory writer, next step) receive untyped results.

---

## `tool-registry` Package Status

`packages/tool-registry/` contains only `node_modules` — no source files. It appears to be a placeholder for a forthcoming centralized tool registry that would replace or wrap the per-process `ToolMeshRegistry`. Until it is implemented, the registry is ephemeral (process-local, reset on restart). This means:

- Tool manifests registered at startup are lost if the process restarts unexpectedly.
- There is no cross-instance tool discovery in a distributed deployment.

**Recommendation:** Implement `tool-registry` as a thin Postgres-backed store that persists tool manifests on registration. This enables durable discovery, versioning, and cross-instance sharing.

---

## Contract Completeness Scorecard

| Contract Dimension | Status | Score |
|-------------------|--------|-------|
| Input schema declared | Most tools | 3/5 |
| Input schema validated at runtime | Yes (all) | 5/5 |
| Output schema declared | None | 0/5 |
| Output schema validated at runtime | No | 0/5 |
| Timeout declared per manifest | Optional | 2/5 |
| Timeout enforced | Yes (if set) | 4/5 |
| Retry policy per tool | No (step-level only) | 2/5 |
| Retry with jitter | No | 1/5 |
| Structured failure codes | Partial | 3/5 |
| Dead-letter on exhaustion | Yes | 5/5 |
| Output immutability | No | 0/5 |
| Cross-instance registry | No | 0/5 |

**Overall:** Moderate — input contracts are the strongest element; output contracts are the weakest.

---

## Recommended Actions (Priority Order)

1. **[P0]** Add output schema validation in `ToolMeshExecutor` — warn on violation, emit structured event.
2. **[P0]** Make `ToolManifest.timeoutMs` required; reject registration without it.
3. **[P1]** Add jitter to `withRetry` delay computation.
4. **[P1]** Implement `tool-registry` as a durable Postgres-backed store.
5. **[P1]** Add `rate_limited` and `circuit_open` to `RunErrorCategory`.
6. **[P2]** Add `maxRetries` to `ToolManifest` for per-tool retry budgets.
7. **[P2]** Declare `outputSchema` on all five domain tool files.
8. **[P3]** Extend schema validator to support `anyOf`, `pattern`, and `$ref`.
