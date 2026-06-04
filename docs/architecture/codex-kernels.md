# Agentic Codex Kernels — 45 living kernels across 5 chakras

> Doctrine v11 — 749 declarations · 163 sorries · 14 unique axioms · 13-axis canonical trust
> Sign: **Yachay** <yachay@szlholdings.dev> · License **Apache-2.0**

This document specifies the **agentic codex kernel** layer that makes the SZL stack *living*:
every flagship (chakra) runs a fixed set of perpetual agentic loops, each rooted in a
hash-linked, DSSE-signed **codex**, each emitting a signed heartbeat on a fixed cadence,
all observable from the Mesh Cathedral.

## 1. The shape: 5 chakras × 9 kernels = 45

| Chakra (flagship) | Glyph | 7 universal | 2 vertical |
|---|---|---|---|
| **a11oy**     | 16-node Khipu cord / router + orchestrator | sign · gate · chain · memory · replay · mcp · wire | `route` · `orchestrate` |
| **killinchu** | kestrel + drone swarm / mission edge       | sign · gate · chain · memory · replay · mcp · wire | `geofence` · `mission-plan` |
| **rosie**     | wireframe head / personal companion        | sign · gate · chain · memory · replay · mcp · wire | `aide` · `recall-personal` |
| **sentra**    | hexagonal shield / immune system           | sign · gate · chain · memory · replay · mcp · wire | `filter` · `threat-score` |
| **amaru**     | serpent-coil neural mesh / memory cortex   | sign · gate · chain · memory · replay · mcp · wire | `cortex-ledger` · `axis-track` |

Per-organ kernel docs: [`docs/kernels/<organ>.md`](../kernels/).

## 2. A kernel = a codex + a perpetual OODA loop

Each kernel is an **OODA loop**: `observe → decide → act → sign`. On every tick it:

1. **observes** its substrate (the host Space's real subsystems),
2. **decides** whether work is warranted (rate-limited; a circuit breaker opens after 3 consecutive failures),
3. **acts** (the kernel-specific behaviour),
4. **signs** the result into its codex as a heartbeat receipt and emits an OpenTelemetry span
   `szl.kernel.<organ>.<name>.tick`.

### Codex
A **codex** is the kernel's append-only memory: SQLite-backed (`SZL_CODEX_DIR`, default
`/tmp/szl_codex`, so heartbeats survive Space rebuilds), **hash-linked** (each entry carries the
prior entry's hash → a Khipu DAG), and **DSSE-signed**. `verify_chain()` walks the links and
reports `{ok, checked}`. Signing uses the host Space's `szl_dsse.sign_payload` if present,
otherwise an **honest PLACEHOLDER** DSSE envelope — never silently unsigned.

### Heartbeat receipt
```json
{
  "kernel": "rosie.memory", "tick": 128, "ts": "2026-06-01T13:40:00Z",
  "alive": true, "did_work": true, "summary": "consolidated recent receipts into Unay …",
  "otel_span": "szl.kernel.rosie.memory.tick", "doctrine": "v11",
  "codex_head": "sha256:…",
  "signed_payload": { "payloadType": "application/vnd.szl.khipu+json", "payload": "…", "signatures": ["…"] }
}
```

## 3. The 7 universal kernels (every chakra)

| Kernel | Cadence | Codex | Substrate | Behaviour |
|---|---|---|---|---|
| `sign`   | 30s  | `receipt-log`        | wire-d    | Observe actions, DSSE-sign via Wire D, append to Khipu. |
| `gate`   | 60s  | `gate-decisions`     | puriq-os  | Record `/v1/yuyay/gate` pass/fail with 13-axis breakdown. |
| `chain`  | 300s | `khipu-dag`          | khipu-os  | Verify Khipu DAG integrity (Reed-Solomon RS(10,6) ready). |
| `memory` | 30s  | `unay`               | unay      | Consolidate receipts into Unay, embed, prune stale. |
| `replay` | 300s | `ayni-event-log`     | ayni-os   | Replay last-hour AYNI events, compute coherence. |
| `mcp`    | 60s  | `hatun-mcp-registry` | hatun-mcp | Track Hatun-MCP tool usage; expose `/tools/list`. |
| `wire`   | 30s  | `traceparent-log`    | wire-d    | Observe Wire D/E/F/G/H/I/J/K traffic; detect breaks. |

Short cadences (30s) on `sign`/`memory`/`wire` guarantee a `curl` of the list endpoint shows
`last_heartbeat_ago_sec < 60` almost immediately after boot.

## 4. Lifecycle API (mounted ADDITIVELY per organ)

Base: `/api/<organ>/v3/kernels`. The `register(app, organ=…)` hook never shadows an existing route.

| Method | Path | Purpose |
|---|---|---|
| GET  | `/` | List 9 kernels: `kernel_count`, `doctrine`, per-kernel `status`/`last_heartbeat_ago_sec`/`ticks_total`. |
| GET  | `/{name}` | One kernel's detail. |
| GET  | `/{name}/heartbeat` | Latest signed heartbeat. |
| GET  | `/{name}/codex` | Hash-linked codex entries (one per tick). |
| POST | `/{name}/tick` | Force one tick. |
| POST | `/{name}/start` · `/stop` | Admin-gated (`x-szl-admin-token`), **fail-closed 403**. |
| GET  | `/feed` | SSE stream of heartbeats. |
| POST | `/wake-receipt` | Sign a wake event (used by the warming cron). |

## 5. Sleep-prevention strategy (chosen: Option A — external cron heartbeat)

HF Spaces sleep after idle. **Option A** keeps all 5 flagships warm with an external GitHub
Actions cron (`.github/workflows/warm-flagships.yml`, every 10 min) that GETs each `/healthz`,
opens a de-duped issue on 5xx, and POSTs a **signed** `wake-receipt` to a11oy so the wake itself
is recorded in the Khipu. (Rejected alternatives: B = paid always-on hardware — cost; C =
in-process self-ping — dies when the Space sleeps, so cannot self-recover.)

## 6. Mesh Cathedral integration

The static Space `mesh-cathedral` renders all 45 kernels as orbiting dots around the Ouroboros
ring. It polls each `/api/<organ>/v3/kernels` every 15s and:
- colours each dot **green** (`last_heartbeat_ago_sec < 90`), **amber** (`< 300` or circuit open), **red** (offline),
- **pulses** a dot on each fresh tick,
- opens a side panel on click showing the kernel's codex preview + **last 5 heartbeats**,
- sums `ticks_total` across all 45 kernels into a **live signed-receipt ticker**.

Unreachable flagships honestly turn their 9 dots red and contribute 0 — never faked.

## 7. Provenance

- Self-contained, vendorable module `packages/szl-kernels/deploy/szl_kernels_organ.py` (bundles
  framework + 7 universal + per-organ verticals + `register()` hook), identical sha256
  `a15ee4a2f21654013165c14d10736a9ed62dd05ce0f2a1f61fce9f67b32d73ca` across all 5 flagships.
- Deployed commits: amaru `cd039c7` · killinchu `f9d8041` · sentra `5f71262` · a11oy `e025e39` · rosie `16da1b2`.
- Mesh observability: `mesh-cathedral` commit `320c18f9`.
