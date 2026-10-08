# A11oy Atelier

**Status:** Partial — locally integrated; encrypted single-host restart continuity is available when configured. Production deployment, distributed continuity, and a durable external ledger are not yet witnessed.

**Owner:** SZL Holdings

**Namespace:** `a11oy.atelier`

**Canonical route:** `POST /api/a11oy/v1/atelier/ask`

**Operator surface:** `/a11oy/atelier`

**CLI:** `a11oy-atelier ask`

> Learn the pattern. Rebuild the expression. Receipt every decision.

## Product boundary

A11oy Atelier is an SZL-owned, evidence-bound intelligence workbench. It borrows public product patterns—strong reasoning, long-context work, provider choice, and developer ergonomics—while retaining original SZL expression, policy, code, interface, receipts, and product identity. It does not copy xAI source, binaries, model weights, branding, or trade dress.

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
reserve -> stage -> commit a tenant-scoped Turn Capsule
                  |
          +-------+--------+
          |                |
          v                v
in-process store    encrypted local store
(default; volatile) (configured; one host/process)
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
- Turn Capsule sequence, prior-capsule digest, and continuity state
- original operator-prompt and provider-prompt hashes
- latency and reported token usage
- the exact third-party disclosure

The API appends the completed receipt to the in-process `EvidenceLedger`; this append is not a durable external ledger write. The Turn Capsule store is a separate continuity boundary. Its default in-process implementation is non-durable and loses session state at restart. When the encrypted local adapter is configured, it retains authenticated capsule state across a restart on one host with the same key. That adapter serializes work within one runtime process and does not provide distributed locking, multi-host coordination, production identity, or external-ledger durability.

## Turn Capsule v1

Before provider invocation, the API requires both a client-generated session ID and a client-generated idempotency key, then reserves one turn for that tenant/session/key scope. Send the same session ID and idempotency key on a retry. A matching retry replays the committed response without a second provider call. Reusing the same idempotency key with different request bytes is rejected, and a different key cannot enter a session while its current turn is pending.

Each committed capsule binds the sanitized request, original operator prompt, context-expanded provider prompt, response, sequence, prior capsule digest, timestamps, retention, and persistence state. `GET /api/a11oy/v1/atelier/sessions/:sessionId/verify` verifies the tenant-scoped chain without returning raw prompt or answer material. Every capsule in a chain shares the first capsule's effective expiry. Twenty-four hours is the maximum logical retrieval window, not a claim that files can self-delete while the process or host is off. The encrypted adapter purges expired indexed state on startup, continuity operations, and a 15-minute runtime sweep; authenticated expired orphan payloads are purged on startup and the sweep. It retains an unindexed object before expiry because another local writer may still be publishing its index. Readers leave temporary index and object candidates untouched for the same reason; abandoned candidates require offline maintenance with exclusive access. Concurrent first-start peers can race the key marker: readiness requires an authenticated published marker. An abandoned marker temporary is not durable state and still requires offline, exclusive-access cleanup.

The provider response is staged before the capsule commit is acknowledged. If commit cannot complete after a provider response, the API fails closed instead of returning an uncommitted success. A successful encrypted stage is labeled durably preserved pending recovery; the default in-memory stage is labeled as retained only in the current non-durable process. Recovery is not automatic in v1.

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
- Provider configuration health is distinct from a successful inference.
- A successful inference is distinct from a committed Turn Capsule.
- Encrypted local restart continuity is distinct from distributed or production-grade persistence.
- A committed Turn Capsule is distinct from a durable external `EvidenceLedger` write.
- An HTTP 200 is distinct from production witness.
- A local Grok Build witness is distinct from a direct xAI Responses API witness.
- Solo-builder evidence may include signed commits, exact-head CI, runtime logs, screenshots, and receipts; it must not fabricate independent approval.
