# understudy-runtime

> Provenanced **understudy** layer for SZL flagships — every vertical Space becomes a failover-ready substitute for the a11oy platform, exposing the full agentic stack under its own namespace.

`SPDX-License-Identifier: Apache-2.0` · © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v11

## What it is

A single importable module — `szl_understudy.py` — whose `register(app, ns)` call installs **35 routes** under `/api/<ns>/v2/*` (plus the canonical `/v1/yuyay/gate`) on any FastAPI app. It turns a flagship into an *understudy* for `a11oy`: if the platform is unavailable, the understudy can answer anything a11oy would, in the **same signed-receipt format** (DSSE / Wire D, P-256).

It is **additive** (never deletes a route), registers **before** the host app's SPA/Gradio catch-all so routes resolve locally, and degrades **honestly** — if a substrate dependency (`faiss`, a model key, a dataset) is absent it returns a structured `503` / `honest_error` rather than fabricating output.

## The 11 understudy capabilities

| # | Capability | Routes |
|---|---|---|
| 1 | Full 7-tier LLM router (open stack: Llama/Qwen/DeepSeek/Mistral/Gemma/Phi/Yi/Command-R/Granite/Hermes/OLMo) | `/llm/tiers`, `/llm/route` |
| 2 | Full agentic RAG (LanceDB default; swap Qdrant/Milvus) | `/rag/{ingest,query,stats}` |
| 3 | Full MCP server, 18 tools, streamable-HTTP + Claude config | `/mcp`, `/mcp/tools`, `/mcp/claude-config`, `/mcp/rpc` |
| 4 | Understudy failover (gated promote) | `/understudy/{health,promote,ask}` |
| 5 | PURIQ 12 organs | `/puriq/organs`, `/puriq/organs/{organ}` |
| 6 | All 23 formulas | `/formulas`, `/formulas/F<n>` |
| 7 | KIPU + QILLQAQ 16 genomes | `/kipu/healthz`, `/qillqaq/manifest` |
| 8 | Khipu DAG, RS(10,6) erasure | `/khipu-dag/{stats,emit}` |
| 9 | AYNI-OS | `/ayni/{state,tinkuy,replay}` |
| 10 | Hatun-MCP tab | (host UI tab) |
| 11 | WAYRA ingest | `/wayra/digests`, `/wayra/{notams,personal}` |

Plus cross-organ canon: `/doctrine`, `/connections`, `/metrics`, `/v1/yuyay/gate`.

## Vertical lenses

`register(app, ns)` adapts the gate posture by namespace via the `LENS` table:

- **rosie** → `aide` (privacy-heavy consent gate, "Rosie's senses" edge organs)
- **killinchu** → `defense` (legal-heavy authority gate, drone-organ passthrough)
- **a11oy** → `platform` (reference)

## Usage

```python
import szl_understudy
info = szl_understudy.register(app, ns="rosie")   # or "killinchu"
print(info["registered_count"], "routes;", info["substrate"])
```

Imports `szl_dsse`, `szl_brain` (LLM router), `szl_rag` (agentic RAG), `szl_formulas` (formula-OS) from the host image; each is optional and guarded with an honest `503` fallback.

## Provenance

Every mutating capability returns a DSSE-signed receipt (`payloadType: application/vnd.szl.khipu+json`, P-256, keyid `szlholdings-cosign`). `/understudy/promote` is gated on an `operator_token` (authority axis) and returns `403` + `gate:"FAIL"` without it.

## Live deployments (verified 2026-06-01)

- `https://szlholdings-rosie.hf.space/api/rosie/v2/understudy/health` → `ready_to_substitute: true`
- `https://szlholdings-killinchu.hf.space/api/killinchu/v2/understudy/health` → `ready_to_substitute: true`

Source mirrors: [`szl-holdings/rosie`](https://github.com/szl-holdings/rosie) (public), `szl-holdings/killinchu` (private).
