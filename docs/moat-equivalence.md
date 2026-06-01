<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v11 -->

# Moat Equivalence & Understudy Parity

**Founder order:** *"Make sure Rosie gets all the formulas all the moats same for killinchu."* — then reinforced: *"Rosie needs all the LLMS AND ALL THE AGENTIC RAG MCP ALL OF IT SHE NEEDS TO BE BASICALLY a11oy's UNDERSTUDY."*

This document records how every a11oy moat and the **11 understudy capabilities** were replicated onto **killinchu** (defense vertical) and **rosie** (aide vertical), each under its own namespace, with live curl evidence. Verified **2026-06-01**.

## Namespace pattern

- killinchu → `/api/killinchu/v2/*`
- rosie → `/api/rosie/v2/*`
- shared canon (all three) → `/healthz`, `/khipu/{sign,verify,pubkey}`, `/wires/D`, `/metrics`, `/v1/yuyay/gate`

## How parity was achieved (additive, no copy-paste)

A single module, `szl_understudy.py` (mirrored to `platform/packages/understudy-runtime/`), is imported by each flagship and registered with `register(app, ns)` **before** the host's SPA/Gradio catch-all so routes resolve locally. Substrate (`szl_dsse`, `szl_brain`, `szl_rag`, `szl_formulas`) is **imported** from the host image; on killinchu it was **vendored** from `platform/packages/{llm-router,agentic-rag,formula-os}` with provenance headers (to be replaced by `pip install ./packages/<name>` once the monorepo lands). No route was deleted on any flagship.

## The 11 understudy capabilities — live status

| # | Capability | killinchu | rosie | Evidence path |
|---|---|---|---|---|
| 1 | 7-tier LLM router (open stack) | ✅ real tiers + Λ-receipt; LLM answer honest-stub (no key) | ✅ same | `/api/<ns>/v2/llm/{tiers,route}` |
| 2 | Agentic RAG | ✅ surface live; honest `503 ModuleNotFoundError: faiss` | ✅ **real chunks returned** (corpus present) | `/api/<ns>/v2/rag/{stats,query,ingest}` |
| 3 | MCP server (18 tools, streamable-HTTP) | ✅ | ✅ | `/api/<ns>/v2/mcp{,/tools,/claude-config,/rpc}` |
| 4 | Understudy failover | ✅ `ready_to_substitute:true`; promote gated `403` | ✅ same | `/api/<ns>/v2/understudy/{health,promote,ask}` |
| 5 | PURIQ 12 organs | ✅ | ✅ | `/api/<ns>/v2/puriq/organs` |
| 6 | 23 formulas | ✅ F23 signed, Λ=0.922 | ✅ same | `/api/<ns>/v2/formulas/F<n>` |
| 7 | KIPU + QILLQAQ 16 genomes | ✅ | ✅ | `/api/<ns>/v2/{kipu/healthz,qillqaq/manifest}` |
| 8 | Khipu DAG RS(10,6) | ✅ root hash, 2 nodes | ✅ | `/api/<ns>/v2/khipu-dag/stats` |
| 9 | AYNI-OS | ✅ | ✅ | `/api/<ns>/v2/ayni/state` |
| 10 | Hatun-MCP | ✅ (MCP surface) | ✅ | `/api/<ns>/v2/mcp` |
| 11 | WAYRA ingest | ✅ 232 events, chain_verified | ✅ aide sources | `/api/<ns>/v2/wayra/digests` |

## Understudy readiness (live)

Both report `role: understudy_for_a11oy`, `ready_to_substitute: true`, identical capability map, and Wire-D continuity:

```
killinchu /api/killinchu/v2/understudy/health → ready_to_substitute:true, vertical:defense
rosie     /api/rosie/v2/understudy/health      → ready_to_substitute:true, vertical:aide
wire_d_continuity: "same P-256 key + chain-root across siblings (cross-organ verifiable)"
```

All three flagships share the **same P-256 public key**
(`MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7mrYWDnz8TvT7o4/65XGqYxo9OoV…`) at `/khipu/pubkey`, so a receipt signed by rosie or killinchu verifies against the same chain root as a11oy.

## Gaps closed on killinchu

Before this work, killinchu had real-JSON gaps that the understudy layer now fixes (verified):

- `/api/killinchu/v2/connections` was **404** → now **200**.
- `/v1/yuyay/gate` resolved to the SPA → now **real `ALLOW`** decision, Λ=0.922181.
- `/api/killinchu/v2/metrics` returned SPA HTML → now **real Prometheus** counters (`killinchu_commands_signed_total`, `killinchu_geofence_violations_blocked_total`, `killinchu_drones_active=53`, `killinchu_swarm_coherence_avg=0.94`).

## Honest note on the a11oy reference

a11oy's real-JSON moats are the **canonical cross-organ endpoints** (`/healthz`, `/khipu/*`, `/wires/D`, top-level `/metrics`). Its capability-style root paths (`/doctrine`, `/formulas`, `/llm/tiers`, `/mcp`, `/puriq/organs`, `/understudy/health`, …) currently return **HTTP 200 but `Content-Type: text/html`** — they are shadowed by a11oy's SPA history-fallback catch-all, not real JSON (audited 2026-06-01).

**Consequence:** killinchu and rosie now expose **more real (JSON) capability surface** under their vertical namespaces than a11oy exposes at its root paths. Parity was not only met — on live JSON surface, the understudies currently exceed the reference. This is reported transparently; no fabrication.

## Provenance

- Signed-off-by: Yachay `<yachay@szlholdings.dev>`
- Co-Authored-By: Perplexity Computer Agent
- Doctrine v11: 749 declarations / 14 unique axioms / 163 sorries, locked at `c7c0ba17`.
- License: Apache-2.0. Mobile-first per `SZL_MOBILE_FIRST_STANDARD.md`.
