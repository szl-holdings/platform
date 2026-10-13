# A11OY — 9-kernel agentic codex design

> Doctrine v11 — 749 declarations · 163 sorries · 14 unique axioms · 13-axis canonical trust  
> Sign: **Yachay** <yachay@szlholdings.dev> · License **Apache-2.0**

**Evidence state (2026-10-05): hosted behavior is UNOBSERVED.** The repository
design defines **9 agentic kernels** for A11oy: 7 universal kernels and 2
organ-specific kernels. That source does not prove perpetual hosted execution.
The target design is **observe → decide → act → sign** around a SQLite-backed,
hash-linked Codex. The staged scaffold uses the span name
`szl.kernel.a11oy.<name>.tick`; when the OpenTelemetry API is importable it
enters that span API, but recording and export depend on the host tracer
provider. Otherwise it writes a structured stderr fallback.

- **STAGED LOCAL, NOT DEPLOYED:** commit
  `99305772172270109f1023da6987a6ca32445847`, module SHA-256
  `0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73`.
- **RETAINED HISTORY:** flagship commit `e025e39` and the earlier shared-module
  SHA-256 `a15ee4a2f21654013165c14d10736a9ed62dd05ce0f2a1f61fce9f67b32d73ca`
  are historical deployment records, not current hosted-source evidence.
- Full boundary: [SZL estate prepublish audit](../../audit/SZL_ESTATE_PREPUBLISH_AUDIT_2026-10-05.md).

## Lifecycle API

When registered, the staged local source mounts these routes additively under
`/api/a11oy/v3/kernels`. Their presence on any hosted revision is unobserved.

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/a11oy/v3/kernels` | List all 9 kernels (`kernel_count`, `doctrine`, per-kernel status) |
| GET  | `/api/a11oy/v3/kernels/{name}` | One kernel's detail (status, `last_heartbeat_ago_sec`, `ticks_total`) |
| GET  | `/api/a11oy/v3/kernels/{name}/heartbeat` | The kernel's most recent heartbeat envelope |
| GET  | `/api/a11oy/v3/kernels/{name}/codex` | Hash-linked successful-heartbeat and wake entries; `limit` 1–100, `offset` 0–10,000 |
| POST | `/api/a11oy/v3/kernels/{name}/tick` | Force one tick; staged source requires `Authorization: Bearer …` backed by `SZL_ADMIN_TOKEN` |
| POST | `/api/a11oy/v3/kernels/{name}/start` | Start a stopped kernel; same admin Bearer gate |
| POST | `/api/a11oy/v3/kernels/{name}/stop` | Stop a kernel; same admin Bearer gate |
| GET  | `/api/a11oy/v3/kernels/feed` | SSE stream of latest heartbeat or pre-heartbeat detail snapshots |
| POST | `/api/a11oy/v3/kernels/wake-receipt` | Append one bounded wake event; staged source requires a dedicated Bearer credential backed by `SZL_WAKE_RECEIPT_TOKEN` |

Both staged credential gates fail closed. An absent or unusable configured
server token returns `503`; a missing or invalid Bearer credential returns `401`
with `WWW-Authenticate: Bearer`. The legacy `x-szl-admin-token` header and query
credentials are rejected. Configured values must each be 32–512 ASCII bytes
without whitespace, and equality disables both mutation gates with `503`.
These checks enforce separation and syntax, not secret entropy. `403` is not
the staged contract. This documentation does not establish that either secret
is configured on a host.

The staged Codex read route is pagination-bounded but unauthenticated. Public
exposure therefore remains blocked on an explicit authenticated tenant/role
policy and response data-minimization review.

The staged source does not connect any named application substrate. Every
non-chain kernel reports `did_work=false` with
`UNAVAILABLE: substrate adapter not connected`. Its `alive=true` field means
only that the individual tick path completed; scheduler health also requires a
fresh tick and observed `running` status. `chain` alone verifies its local
Codex hash links. These boundaries are covered across all five organs by the
dependency-free contract tests.

## 7 universal kernel design targets

| Kernel | Cadence | Codex | Intended target | Current staged result |
|---|---|---|---|---|
| `sign` | 30s | `receipt-log` | Wire-D action observation/signing | `UNAVAILABLE`; no adapter. |
| `gate` | 60s | `gate-decisions` | PURIQ/Yuyay gate decisions | `UNAVAILABLE`; no adapter. |
| `chain` | 300s | `khipu-dag` | Khipu integrity | Local Codex hash-chain verification only. |
| `memory` | 30s | `unay` | Unay consolidation/embedding/pruning | `UNAVAILABLE`; no adapter. |
| `replay` | 300s | `ayni-event-log` | AYNI replay/coherence | `UNAVAILABLE`; no adapter. |
| `mcp` | 60s | `hatun-mcp-registry` | Hatun-MCP usage/tools | `UNAVAILABLE`; no adapter. |
| `wire` | 30s | `traceparent-log` | Wire traffic/break detection | `UNAVAILABLE`; no adapter. |

## 2 vertical kernel design targets

| Kernel | Cadence | Codex | Intended target | Current staged result |
|---|---|---|---|---|
| `route` | 60s | `llm-router` | LLM routing model/cost/latency | `UNAVAILABLE`; no adapter. |
| `orchestrate` | 60s | `puriq-host-plan` | PURIQ plan step outcomes | `UNAVAILABLE`; no adapter. |

## Read-only check after deployment is established

Use these only after an independently observed, exact-source deployment. A
response alone does not establish signing, persistence, or continuous execution.

```bash
# list the kernel records exposed by the observed deployment
curl -s https://szlholdings-a11oy.hf.space/api/a11oy/v3/kernels | jq '.kernel_count, .kernels[] | {name, status, last_heartbeat_ago_sec, ticks_total}'

# inspect one kernel's latest heartbeat envelope
curl -s https://szlholdings-a11oy.hf.space/api/a11oy/v3/kernels/sign/heartbeat | jq .
```

> **Staged heartbeat shape:** `{kernel, tick, ts, alive, did_work, summary, otel_span:"szl.kernel.a11oy.<name>.tick", doctrine:"v11", codex_head:"sha256:…", signed_payload:{payloadType, payload, signatures}}`. For non-chain kernels, `did_work` is `false` and the summary is explicitly `UNAVAILABLE` until an adapter exists. `alive=true` means only that this tick path completed; it does not establish a running scheduler. The envelope is cryptographically signed only when the host signing implementation is present; otherwise the source emits an explicitly marked placeholder envelope, which is not signature proof.

## Provenance

- **RETAINED:** the earlier vendored module was recorded at SHA-256
  `a15ee4a2f21654013165c14d10736a9ed62dd05ce0f2a1f61fce9f67b32d73ca`
  in flagship commit `e025e39`.
- **STAGED LOCAL:** the successor module is
  `packages/szl-kernels/deploy/szl_kernels_organ.py` at SHA-256
  `0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73`
  in commit `99305772172270109f1023da6987a6ca32445847`.
  It is not a deployment receipt.
- **UNOBSERVED:** current flagship source identity, route behavior, token
  configuration, background execution, persistence, and Mesh Cathedral display.
