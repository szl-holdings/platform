# A11oy Atelier

**Status:** Partial — locally integrated; encrypted single-host restart continuity is available when configured. Production deployment, distributed continuity, and a durable external ledger are not yet witnessed.

**Owner:** SZL Holdings

**Namespace:** `a11oy.atelier`

**Canonical routes:**

- `POST /api/a11oy/v1/atelier/ask` — governed provider-backed inference.
- `POST /api/a11oy/v1/atelier/proofweave/compile` — deterministic,
  compile-only research-plan construction.

**Operator surface:** `/a11oy/atelier`

**CLI:** `a11oy-atelier ask` and `a11oy-atelier weave`

> Learn the pattern. Rebuild the expression. Receipt every decision.

## Product boundary

A11oy Atelier is an SZL-owned, evidence-bound intelligence workbench. It studies public product
patterns—strong reasoning, long-context work, provider choice, and developer ergonomics—while
retaining SZL expression, policy, code, interface, receipts, and product identity. `DECLARED` by the
implementer: no xAI source, binaries, model weights, branding, or trade dress were intentionally
copied. This is not an independent provenance or legal conclusion.

The initial adapters are:

- **xAI Responses API:** `grok-4.7` by default, fixed HTTPS endpoint, server-only key, selected low/medium/high/xhigh effort sent as `reasoning.effort`, `store: false`, redirect refusal, one attempt, and a 180-second timeout. Atelier intentionally defaults to medium effort; xAI's own default is high if the field is omitted. The provider-health label shows the configured model, not a successful inference witness.
- **Grok Build CLI:** local-development only, explicit signed executable path, shell-free process invocation, one turn, and tools/web search/subagents denied.

If neither adapter is configured, the system fails closed. It never substitutes a mock model answer.

`SZL_GROK_MODEL` selects the reviewed default or the explicit `grok-4.6` rollback. The legacy `A11OY_ATELIER_MODEL` is read only when that key is blank or unset. Caller-supplied model choices pass the same allowlist before API fetch or CLI execution. See the official [Grok 4.7 API contract](https://docs.x.ai/developers/grok-4-7) and [reasoning contract](https://docs.x.ai/developers/model-capabilities/text/reasoning).

Grok 4.7 Responses return encrypted reasoning items by default. Turn Capsule v1 keeps only final assistant text and reported token usage; it discards provider reasoning ciphertext and does not replay it in a later request. Its multi-turn context is the bounded text history described below. Native provider-reasoning continuity would require a separately reviewed storage and replay contract.

## Governing architecture

```text
A11oy Atelier UI / a11oy-atelier CLI
                  |
          +-------+----------------------------------+
          |                                          |
          v                                          v
POST /api/a11oy/v1/atelier/ask     POST /api/a11oy/v1/atelier/proofweave/compile
          |                                          |
deterministic capability gate          deterministic policy compiler
          |                                          |
  +-------+--------+                    PATTERN -> CUT -> STITCH
  |                |                     -> FITTING -> LABEL
  v                v                                |
xAI Responses API  local Grok Build CLI             v
  |                |                      compile receipt + required
  +-------+--------+                      audit-metadata append
          |
response hashes + disclosure + EvidenceLedger append
          |
reserve -> stage -> commit a tenant-scoped Turn Capsule
          |
  +-------+--------+
  |                |
  v                v
in-process store    encrypted local store
(default; volatile) (configured; one host/process)
```

Atelier is the operator workbench. Ayllu remains the governed council/orchestration layer. Frontier Now remains the evidence cockpit. Provider identity is recorded but does not confer control over A11oy policy, storage, or product identity.

## Ask-route capability policy

Version 1 is reasoning-only. The following capabilities are denied before provider invocation:

- tool execution
- web search
- provider-side durable storage
- provider-side subagents

The policy engine returns deterministic denial reasons. A denied request does not reach a model provider.

## Ask-route receipt contract

Every accepted answer includes:

- receipt and request identifiers
- provider, model, and provider request identifier
- prompt and response SHA-256 hashes
- policy decisions and requested capabilities
- `MEASURED` response/receipt evidence class and a separate local-only lifecycle state
- ledger append identifier/state
- Turn Capsule sequence, prior-capsule digest, and continuity state
- original operator-prompt and provider-prompt hashes
- latency and reported token usage
- the exact third-party disclosure

The API appends the completed receipt to the in-process `EvidenceLedger`; this append is not a durable external ledger write. The Turn Capsule store is a separate continuity boundary. Its default in-process implementation is non-durable and loses session state at restart. When the encrypted local adapter is configured, it retains authenticated capsule state across a restart on one host with the same key. That adapter serializes work within one runtime process and does not provide distributed locking, multi-host coordination, production identity, or external-ledger durability.

## Turn Capsule v1

Before provider invocation, the API requires both a client-generated session ID and a client-generated idempotency key, then reserves one turn for that tenant/session/key scope. Send the same session ID and idempotency key on a retry. A matching retry replays the committed response without a second provider call. Reusing the same idempotency key with different request bytes is rejected, and a different key cannot enter a session while its current turn is pending.

Each committed capsule binds the sanitized request, original operator prompt, context-expanded provider prompt, response, sequence, prior capsule digest, timestamps, retention, and persistence state. `GET /api/a11oy/v1/atelier/sessions/:sessionId/verify` verifies the tenant-scoped chain without returning raw prompt or answer material. Every capsule in a chain shares the first capsule's effective expiry. Twenty-four hours is the maximum logical retrieval window, not a claim that files can self-delete while the process or host is off. The encrypted adapter purges expired indexed state and authenticated orphan payloads on startup, during continuity operations, and on a 15-minute runtime sweep.

The provider response is staged before the capsule commit is acknowledged. If commit cannot complete after a provider response, the API fails closed instead of returning an uncommitted success. A successful encrypted stage is labeled durably preserved pending recovery; the default in-memory stage is labeled as retained only in the current non-durable process. Recovery is not automatic in v1.

## Proofweave compiler

Proofweave converts an objective, explicit typed claims, source declarations,
and fixed budgets into a deterministic five-stage plan:

`PATTERN -> CUT -> STITCH -> FITTING -> LABEL`

The compiler emits a hash-addressed plan, stable policy identifiers and digest,
claim/material metadata, automated-review declarations, limitations, and
future Workcell responsibility and budget declarations. It labels the result
with evidence class `SIMULATED` and the separate lifecycle states `DEMO`,
`COMPILED_NOT_EXECUTED`, and `IN_PROCESS_NOT_STORED`.

The first release does not fetch or validate a declared locator, prove that a
40-hex Git revision exists or is reachable, invoke a provider, run tools or
Workcells, start subagents, execute the review, approve a claim, or durably
store the compiled plan. A required audit-metadata append is the only route
side effect. Its backend is configuration-dependent, durable persistence is
`UNKNOWN`, and tenant attribution has evidence class `DECLARED` rather than an authenticated-human
identity binding.

Non-reference code adaptation is admitted only when the caller declares a
syntactically valid 40-hex revision and an allowlisted permissive license.
AGPL, custom, unknown, and unlicensed material can be declared for reference,
but cannot be incorporated into an adaptation by this policy. This
pattern-adaptation boundary is `DECLARED`; it is not a formal dual-team
clean-room or independent-provenance claim.

The linked public-source and license register is a dated implementer record
based on public sources reviewed as of 2026-08-30. It is not a current or
exhaustive inventory, an independent provenance audit, or a legal conclusion.

See [Proofweave](A11OY_ATELIER_PROOFWEAVE.md) and the
[public-source and license boundary](A11OY_ATELIER_LICENSE_BOUNDARY.md).

## Browser authorization boundary

The current browser transport is enabled only by the Vite local-development
runtime. An authenticated local browser flow uses the explicit loopback-only
shared-proxy bridge described below; the bridge attaches a server-held key and
fixed tenant only to Atelier requests. Production browser builds fail closed:
they do not request Atelier health, submit inference, or submit Proofweave
compilation because no authenticated server-side session or
backend-for-frontend (BFF) exists for those browser actions. The operator
surface displays `BLOCKED` and runtime evidence `UNKNOWN` instead of treating
an API-key guard as browser identity.

Provider credentials remain server-side. A production browser must never add
an Atelier API key to a request, browser storage, HTML, or a `VITE_*` variable.
Enabling production browser actions requires a separately reviewed
server-authenticated session/BFF implementation and fresh authorization proof.
The server API and CLI remain separate transports governed by their own
configuration and access controls.

## Configuration

See [Environment Variables Reference](../ENVIRONMENT_VARIABLES.md#a11oy-atelier). Secrets are server-side only. Do not introduce `VITE_A11OY_ATELIER_XAI_API_KEY` or any equivalent browser-exposed provider credential.

Turn Capsule continuity remains volatile unless both A11OY_ATELIER_CONTINUITY_DIR and A11OY_ATELIER_CONTINUITY_KEY are configured. The directory must be an absolute, non-root path; the server-only key must decode to exactly 32 bytes. NODE_ENV=production always requires durable continuity. In other environments, set A11OY_ATELIER_CONTINUITY_REQUIRED=true to refuse Atelier requests instead of falling back to in-process continuity. Invalid or incomplete continuity configuration leaves unrelated runtime routes mounted, while Atelier health and requests fail closed with sanitized UNAVAILABLE state.

The browser stores a confirmed, tenant-namespaced session ID in tab-scoped `sessionStorage`. Before an unconfirmed request, it also stores the pending session ID, idempotency key, timestamp, and SHA-256 of the request fingerprint, but not the prompt or provider answer. After a reload, the operator must re-enter the same prompt, provider, and reasoning effort to reuse that pending key; a different request fails closed until the operator explicitly chooses New session. Pending retry identity is cleared after a confirmed answer, on New session, or when a different session is selected. A retry older than the 24-hour logical retention window is blocked rather than silently generating a new key. If tab storage is unavailable or cleared, reload-safe retry cannot be promised. The session ID and pending key are not authentication; operators should use New session on a shared browser.

Explicit xAI API authentication, access, balance, and rate-limit HTTP rejections are treated as known pre-inference failures and release the pending reservation. Provider timeouts, redirects, malformed success payloads, and server failures remain ambiguous; they retain the same retry key to prevent an automatic second paid request. This classification is local-source behavior, not a claim of a live direct xAI API witness.

The canonical local ports are runtime API `8080`, A11oy Vite `4110`, and shared proxy `9090`. The shared route is `http://127.0.0.1:9090/a11oy/atelier`. If those ports are occupied, configure a collision-free set before starting the proxy, for example:

```dotenv
SHARED_PROXY_PORT=19090
SHARED_PROXY_A11OY_PORT=4110
SHARED_PROXY_API_PORT=18080
SHARED_PROXY_BIND_HOST=127.0.0.1
SHARED_PROXY_LOCAL_API_KEY_BRIDGE=true
SHARED_PROXY_LOCAL_TENANT_ID=solo-builder
A11OY_ATELIER_API_BASE_URL=http://127.0.0.1:18080
```

The runtime API must also be listening on `18080`; the proxy variables only select upstreams. For an authenticated local browser flow, give the runtime API and Vite/proxy processes the same server-only `ALLOY_API_KEY`. The explicit loopback-only bridge attaches that key and a fixed tenant ID only to `/api/a11oy/v1/atelier` requests, and rejects unexpected Host or Origin values; it never bundles the key into browser JavaScript or returns it in proxy status. The bridge fails closed on a non-loopback listener, a missing key or tenant, malformed booleans, invalid ranges, and listener/upstream collisions. This is a single-operator local development bridge, not browser-user authentication. Deployed identity and edge authentication remain separate requirements.

## Required disclosure

> A11oy Atelier is an SZL Holdings product. Its Ayllu council, policy gates, retrieval, and receipts are operated by A11oy. Model inference for this response was provided by {provider} using {model}. Third-party provider names identify the configured inference service only; no affiliation or endorsement is implied.

## Current truth boundary

- Source implementation and local tests are distinct from deployment.
- Local browser development is distinct from authorized production browser access.
- Provider configuration health is distinct from a successful inference.
- A compiled Proofweave plan is distinct from plan or Workcell execution.
- An accepted audit append is distinct from witnessed durable persistence.
- A successful inference is distinct from a committed Turn Capsule.
- Encrypted local restart continuity is distinct from distributed or production-grade persistence.
- A committed Turn Capsule is distinct from a durable external `EvidenceLedger` write.
- An HTTP 200 is distinct from production witness.
- A local Grok Build witness is distinct from a direct xAI Responses API witness.
- Solo-builder evidence may include signed commits, exact-head CI, runtime logs, screenshots, and receipts; it must not fabricate independent approval.
