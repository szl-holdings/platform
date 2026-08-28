# A11oy Atelier

**Status:** Partial — locally integrated; production deployment and durable session persistence are not yet witnessed.

**Owner:** SZL Holdings

**Namespace:** `a11oy.atelier`

**Canonical route:** `POST /api/a11oy/v1/atelier/ask`

**Operator surface:** `/a11oy/atelier`

**CLI:** `a11oy-atelier ask`

> Learn the pattern. Rebuild the expression. Receipt every decision.

## Product boundary

A11oy Atelier is an SZL-owned, evidence-bound intelligence workbench. It borrows public product patterns—strong reasoning, long-context work, provider choice, and developer ergonomics—while retaining original SZL expression, policy, code, interface, receipts, and product identity. It does not copy xAI source, binaries, model weights, branding, or trade dress.

The initial adapters are:

- **xAI Responses API:** deployable, fixed HTTPS endpoint, server-only key, `store: false`, redirect refusal, one attempt, and a 180-second timeout.
- **Grok Build CLI:** local-development only, explicit signed executable path, shell-free process invocation, one turn, and tools/web search/subagents denied.

If neither adapter is configured, the system fails closed. It never substitutes a mock model answer.

## Governing architecture

```text
A11oy Atelier UI / a11oy-atelier CLI
                  |
                  v
POST /api/a11oy/v1/atelier/ask
                  |
                  v
deterministic capability policy gate
                  |
          +-------+--------+
          |                |
          v                v
xAI Responses API    local Grok Build CLI
          |                |
          +-------+--------+
                  |
                  v
response hashes + provider disclosure + EvidenceLedger append
                  |
                  v
tenant-scoped, 24-hour in-process working memory (maximum 12 turns)
```

Atelier is the operator workbench. Ayllu remains the governed council/orchestration layer. Frontier Now remains the evidence cockpit. Provider identity is recorded but does not confer control over A11oy policy, storage, or product identity.

## Default capability policy

Version 1 is reasoning-only. The following capabilities are denied before provider invocation:

- tool execution
- web search
- provider-side durable storage
- provider-side subagents

The policy engine returns deterministic denial reasons. A denied request does not reach a model provider.

## Receipt contract

Every accepted answer includes:

- receipt and request identifiers
- provider, model, and provider request identifier
- prompt and response SHA-256 hashes
- policy decisions and requested capabilities
- evidence state and local-only truth label
- ledger append identifier/state
- working-memory state
- latency and reported token usage
- the exact third-party disclosure

The API appends the completed receipt to the in-process `EvidenceLedger`. Session memory is tenant-scoped and expires after 24 hours. Both are process-local in this phase; a restart loses them. Durable external persistence remains an explicit production gap.

## Configuration

See [Environment Variables Reference](../ENVIRONMENT_VARIABLES.md#a11oy-atelier). Secrets are server-side only. Do not introduce `VITE_A11OY_ATELIER_XAI_API_KEY` or any equivalent browser-exposed provider credential.

For local work, run the runtime API on port `8080` and A11oy Vite on port `4110`, then use the shared proxy at `http://127.0.0.1:9090/a11oy/atelier`.

## Required disclosure

> A11oy Atelier is an SZL Holdings product. Its Ayllu council, policy gates, retrieval, and receipts are operated by A11oy. Model inference for this response was provided by {provider} using {model}. Third-party provider names identify the configured inference service only; no affiliation or endorsement is implied.

## Current truth boundary

- Source implementation and local tests are distinct from deployment.
- Provider configuration health is distinct from a successful inference.
- A successful inference is distinct from durable persistence.
- An HTTP 200 is distinct from production witness.
- Solo-builder evidence may include signed commits, exact-head CI, runtime logs, screenshots, and receipts; it must not fabricate independent approval.
