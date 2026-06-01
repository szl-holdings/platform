# SENTRA — 9 living agentic codex kernels

> Doctrine v11 — 749 declarations · 163 sorries · 14 unique axioms · 13-axis canonical trust  
> Sign: **Yachay** <yachay@szlholdings.dev> · License **Apache-2.0**

`SENTRA` (hexagonal shield / immune system) runs **9 perpetual agentic kernels**: 7 universal (shared by every chakra) + 2 vertical (specific to this chakra). Each kernel is an OODA loop (**observe → decide → act → sign**) rooted in a SQLite-backed, hash-linked, DSSE-signed **codex**. Every tick appends a signed heartbeat receipt to the Khipu and emits an OpenTelemetry span `szl.kernel.sentra.<name>.tick`.

## Lifecycle API

All endpoints are mounted **additively** under `/api/sentra/v3/kernels` (preserving every pre-existing route). Deployed in flagship commit `5f71262`.

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/sentra/v3/kernels` | List all 9 kernels (`kernel_count`, `doctrine`, per-kernel status) |
| GET  | `/api/sentra/v3/kernels/{name}` | One kernel's detail (status, `last_heartbeat_ago_sec`, `ticks_total`) |
| GET  | `/api/sentra/v3/kernels/{name}/heartbeat` | The kernel's most recent signed heartbeat |
| GET  | `/api/sentra/v3/kernels/{name}/codex` | Hash-linked codex entries (one per tick) |
| POST | `/api/sentra/v3/kernels/{name}/tick` | Force a single tick (returns the receipt) |
| POST | `/api/sentra/v3/kernels/{name}/start` | Start a stopped kernel (admin-gated, fail-closed 403) |
| POST | `/api/sentra/v3/kernels/{name}/stop` | Stop a kernel (admin-gated, fail-closed 403) |
| GET  | `/api/sentra/v3/kernels/feed` | Server-Sent Events stream of heartbeats |
| POST | `/api/sentra/v3/kernels/wake-receipt` | Sign a wake event (used by the warming cron) |

## 7 universal kernels

| Kernel | Cadence | Codex | Substrate | What it does |
|---|---|---|---|---|
| `sign` | 30s | `receipt-log` | `wire-d` | Observes every action, DSSE-signs it via Wire D, appends to the Khipu. |
| `gate` | 60s | `gate-decisions` | `puriq-os` | Records /v1/yuyay/gate pass/fail with the full 13-axis breakdown. |
| `chain` | 300s | `khipu-dag` | `khipu-os` | Verifies Khipu DAG integrity (hash-linked, Reed-Solomon RS(10,6) ready). |
| `memory` | 30s | `unay` | `unay` | Consolidates recent receipts into Unay, computes embeddings, prunes stale. |
| `replay` | 300s | `ayni-event-log` | `ayni-os` | Replays the last hour of AYNI events, computes coherence metrics. |
| `mcp` | 60s | `hatun-mcp-registry` | `hatun-mcp` | Tracks Hatun-MCP tool usage and exposes /tools/list. |
| `wire` | 30s | `traceparent-log` | `wire-d` | Observes Wire D/E/F/G/H/I/J/K traffic and detects breaks. |

## 2 vertical kernels

| Kernel | Cadence | Codex | What it does |
|---|---|---|---|
| `filter` | 60s | `filter-decisions` | Observes content-filter passes/blocks. |
| `threat-score` | 60s | `threat-score` | Observes threat signals; computes rolling threat score. |

## Verify it's alive

```bash
# list all 9 kernels + freshness (look for last_heartbeat_ago_sec < 60 on 30s kernels)
curl -s https://szlholdings-sentra.hf.space/api/sentra/v3/kernels | jq '.kernel_count, .kernels[] | {name, status, last_heartbeat_ago_sec, ticks_total}'

# one kernel's latest signed heartbeat
curl -s https://szlholdings-sentra.hf.space/api/sentra/v3/kernels/sign/heartbeat | jq .
```

> **Heartbeat shape:** `{kernel, tick, ts, alive, did_work, summary, otel_span:"szl.kernel.sentra.<name>.tick", doctrine:"v11", codex_head:"sha256:…", signed_payload:{payloadType, payload, signatures}}`. Signing uses the host Space's `szl_dsse` if present, otherwise an honest PLACEHOLDER DSSE envelope (never silently unsigned).

## Provenance

- Self-contained kernel module `szl_kernels_organ.py` (identical across all 5 flagships), sha256 `a15ee4a2f21654013165c14d10736a9ed62dd05ce0f2a1f61fce9f67b32d73ca`.
- Wired into the flagship via `import szl_kernels_organ as _kernels; _kernels.register(app, organ="sentra")` (ADDITIVE).
- Observable live in the [Mesh Cathedral](https://szlholdings-mesh-cathedral.static.hf.space) — this organ's 9 kernel dots colour green/amber/red and pulse on each heartbeat.
