# Agentic Codex Kernels — 45-kernel design across 5 chakras

> Doctrine v11 — 749 declarations · 163 sorries · 14 unique axioms · 13-axis canonical trust
> Sign: **Yachay** <yachay@szlholdings.dev> · License **Apache-2.0**

This document specifies the repository's **agentic codex kernel** design. It does
not establish that any flagship currently runs the loops or that Mesh Cathedral
currently observes them.

**Evidence state (2026-10-05): hosted behavior is UNOBSERVED.** The hardened
successor module is **STAGED LOCAL, NOT DEPLOYED** at commit
`99305772172270109f1023da6987a6ca32445847`, SHA-256
`0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73`.
Earlier flagship commits and module SHA-256
`a15ee4a2f21654013165c14d10736a9ed62dd05ce0f2a1f61fce9f67b32d73ca`
are **RETAINED HISTORY**, not current hosted-source evidence. See the
[SZL estate prepublish audit](../../audit/SZL_ESTATE_PREPUBLISH_AUDIT_2026-10-05.md).

## 1. The shape: 5 chakras × 9 kernels = 45

| Chakra (flagship) | Glyph | 7 universal | 2 vertical |
|---|---|---|---|
| **a11oy**     | 16-node Khipu cord / router + orchestrator | sign · gate · chain · memory · replay · mcp · wire | `route` · `orchestrate` |
| **killinchu** | kestrel + drone swarm / mission edge       | sign · gate · chain · memory · replay · mcp · wire | `geofence` · `mission-plan` |
| **rosie**     | wireframe head / personal companion        | sign · gate · chain · memory · replay · mcp · wire | `aide` · `recall-personal` |
| **sentra**    | hexagonal shield / immune system           | sign · gate · chain · memory · replay · mcp · wire | `filter` · `threat-score` |
| **amaru**     | serpent-coil neural mesh / memory cortex   | sign · gate · chain · memory · replay · mcp · wire | `cortex-ledger` · `axis-track` |

Per-organ kernel docs: [`docs/kernels/<organ>.md`](../kernels/).

## 2. Implemented scaffold and intended OODA contract

The staged module implements lifecycle scheduling, circuit breaking, the
SQLite Codex, heartbeat append, hash-chain verification, authenticated mutation
routes, and the `observe → decide → act → sign` call sequence. It does **not**
wire the named application substrates. In the current source, the default
`observe()` returns no observation and `decide()` selects no work. Every
non-chain kernel therefore emits `did_work=false` with
`UNAVAILABLE: substrate adapter not connected`. Only `chain` performs a
substantive local action: verification of its own Codex hash links.

The full OODA behavior remains a design target: a future adapter must observe a
real substrate, make a bounded decision, perform and verify the named action,
then append its result. A successful individual tick reports `alive=true`; that
field proves only that this tick path completed. Scheduler health requires both
fresh ticks and an observed `running` status, and neither proves external work.

The source uses the span name `szl.kernel.<organ>.<name>.tick`. When the
OpenTelemetry API is importable it enters that span API; recording and export
still depend on the host tracer provider. Otherwise it writes a structured
fallback line to stderr.

### Codex
A **codex** is the kernel's append-only memory: SQLite-backed (`SZL_CODEX_DIR`,
default `/tmp/szl_codex`) and **hash-linked** (each entry carries the prior
entry's hash). The default path provides process/container-local durability; it
survives a rebuild only when the configured path is a persistent mounted
directory. `verify_chain()` walks the links and reports `{ok, checked}`. The
staged source uses `szl_dsse.sign_payload` when the host provides it; otherwise
it emits an explicitly marked placeholder envelope. A placeholder is not
cryptographic signature evidence.

### Illustrative staged heartbeat receipt
```json
{
  "kernel": "rosie.memory", "tick": 128, "ts": "2026-06-01T13:40:00Z",
  "alive": true, "did_work": false, "summary": "UNAVAILABLE: substrate adapter not connected",
  "otel_span": "szl.kernel.rosie.memory.tick", "doctrine": "v11",
  "codex_head": "sha256:…",
  "signed_payload": { "payloadType": "application/vnd.szl.khipu+json", "payload": "…", "signatures": ["…"] }
}
```

## 3. The 7 universal kernel contracts (every chakra)

| Kernel | Cadence | Codex | Intended integration target | Current staged behavior |
|---|---|---|---|---|
| `sign`   | 30s  | `receipt-log`        | Wire-D action observation/signing | `UNAVAILABLE`; no substrate adapter. |
| `gate`   | 60s  | `gate-decisions`     | PURIQ/Yuyay gate decisions | `UNAVAILABLE`; no substrate adapter. |
| `chain`  | 300s | `khipu-dag`          | Khipu integrity | Verifies only the local Codex hash chain; no Reed-Solomon claim. |
| `memory` | 30s  | `unay`               | Unay consolidation/embedding/pruning | `UNAVAILABLE`; no substrate adapter. |
| `replay` | 300s | `ayni-event-log`     | AYNI replay/coherence | `UNAVAILABLE`; no substrate adapter. |
| `mcp`    | 60s  | `hatun-mcp-registry` | Hatun-MCP usage/tools | `UNAVAILABLE`; no substrate adapter. |
| `wire`   | 30s  | `traceparent-log`    | Wire traffic/break detection | `UNAVAILABLE`; no substrate adapter. |

Cadences are configured scheduling intervals. Only an observed exact-source
runtime can establish loop freshness, and freshness does not establish an
adapter or completed external action.

## 4. Lifecycle API (mounted ADDITIVELY per organ)

Base: `/api/<organ>/v3/kernels`. The caller must reserve that organ prefix;
`register(app, organ=…)` does not detect route collisions.

| Method | Path | Purpose |
|---|---|---|
| GET  | `/` | List 9 kernels: `kernel_count`, `doctrine`, per-kernel `status`/`last_heartbeat_ago_sec`/`ticks_total`. |
| GET  | `/{name}` | One kernel's detail. |
| GET  | `/{name}/heartbeat` | Latest heartbeat envelope. |
| GET  | `/{name}/codex` | Hash-linked successful-heartbeat and wake entries; `limit` is 1–100 and `offset` is 0–10,000. |
| POST | `/{name}/tick` | Force one tick; staged source requires `Authorization: Bearer …` backed by `SZL_ADMIN_TOKEN`. |
| POST | `/{name}/start` · `/stop` | Same admin Bearer gate as `tick`. |
| GET  | `/feed` | SSE stream of each kernel's latest heartbeat or pre-heartbeat detail snapshot. |
| POST | `/wake-receipt` | Append one bounded wake event; staged source requires a dedicated Bearer credential backed by `SZL_WAKE_RECEIPT_TOKEN`. |

Both staged credential gates fail closed. An absent or unusable configured
server token returns `503`; a missing or invalid Bearer credential returns `401`
with `WWW-Authenticate: Bearer`. The legacy `x-szl-admin-token` header and query
credentials are rejected. Configured values must each be 32–512 ASCII bytes
without whitespace, and equality disables both mutation gates with `503`.
These checks enforce separation and syntax, not secret entropy. `403` is not
the staged contract. No repository document establishes that either secret is
configured on a host.

The staged Codex read route is pagination-bounded but unauthenticated. That is
an open authorization, tenant-isolation, and data-minimization boundary; it is
not a declaration that ledger contents are suitable for public disclosure.

## 5. Staged sleep-prevention strategy (Option A — external cron heartbeat)

The staged `.github/workflows/warm-flagships.yml` design schedules a ten-minute
health probe and, outside pull requests, posts a bounded wake receipt using
`SZL_WAKE_RECEIPT_TOKEN`. The workflow refuses the write when that secret is
absent. Secret configuration, successful hosted delivery, signing authority,
and effective sleep prevention are unobserved. The wake response is a hash-chain
receipt; it must not be described as cryptographically signed without separate
signature verification.

## 6. Mesh Cathedral integration

Retained source describes a static `mesh-cathedral` view intended to render 45
kernel dots and poll each `/api/<organ>/v3/kernels` every 15 seconds. Current
deployment, polling, and displayed state are **UNOBSERVED**. The retained design:
- colours each dot **green** (`last_heartbeat_ago_sec < 90`), **amber** (`< 300` or circuit open), **red** (offline),
- **pulses** a dot on each fresh tick,
- opens a side panel on click showing the kernel's codex preview + **last 5 heartbeats**,
- sums `ticks_total` across all 45 kernels into a receipt ticker.

These display semantics are not a runtime, signature, or availability receipt.

## 7. Provenance

- **RETAINED HISTORY:** earlier shared module SHA-256
  `a15ee4a2f21654013165c14d10736a9ed62dd05ce0f2a1f61fce9f67b32d73ca`;
  amaru `cd039c7`; killinchu `f9d8041`; sentra `5f71262`; a11oy `e025e39`;
  rosie `16da1b2`; and mesh-cathedral `320c18f9`.
- **STAGED LOCAL, NOT DEPLOYED:**
  `packages/szl-kernels/deploy/szl_kernels_organ.py` at SHA-256
  `0b045cd3f61d1060d9aafc7340ffe00d6328f9a560cce285867ba85ae62d1c73`
  in commit `99305772172270109f1023da6987a6ca32445847`.
- **UNOBSERVED:** current hosted source revisions, token configuration, routes,
  background loops, persistence, signatures, and Mesh Cathedral behavior.
