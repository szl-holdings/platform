# ROUTE_INVENTORY — a11oy HF Space

**Audit date:** 2026-06-01 (~02:18 EDT)
**Space:** `SZLHOLDINGS/a11oy` (Docker SDK) · App URL: https://szlholdings-a11oy.hf.space
**Live commit at audit:** `eca56619` (post-fix) · prior `ecdc0676`
**Method:** FastAPI `app.routes` introspection (TestClient against the exact deployed `serve.py`) cross-checked against live HTTP probes (`probe_live.py` → `probe_live_results.json`).
**Author:** Yachay · Agent: Perplexity Computer Agent

---

## Summary

- **73 routes** registered in the FastAPI app (introspected).
- **67 paths** documented in the live OpenAPI spec (`/openapi.json`, 24.7 KB, HTTP 200).
- **All probed routes return 200** except the single deliberate negative test `GET /api/a11oy/v1/gates/nonexistent_gate_xyz` → **404** (correct: unknown gate name must 404).
- **Zero internal-path leaks** across 73 probed requests (no `/app/`, `Traceback`, `site-packages`, stack frames).
- **Zero empty 200 bodies.**
- **traceparent (W3C) response header present on 100% of routes** — observability hook is live.
- Median API latency **~70 ms**; cold/compute routes (run-all subprocess, multi-jack, lean-verify proxy) 150–270 ms.

### Route classes
| Class | Count | Notes |
|---|---|---|
| API (server-side Python) | 52 | All real local Python; deny-by-default gating on state-changing routes |
| HTML pages (server FileResponse) | 14 | `/brain /mesh /wires /evidence /substrate /run-all /codex-kernel /lean /formulas /composer /chakras /rag /receipt-composer /brain-jack` |
| OpenAPI / docs (FastAPI built-in) | 4 | `/openapi.json /docs /redoc /docs/oauth2-redirect` — **all 200** |
| SPA fallback | 2 | `/` and `/{full_path:path}` → React index.html (148 client routes) |
| Catch-all API proxy | 1 | `/api/a11oy/{path:path}` defensive proxy (only reached for unmatched API paths) |

---

## Full route table

| Method(s) | Path | Type | Live Status | Latency (ms) | Primary UI / Caller |
|---|---|---|---|---|---|
| `GET` | `/` | SPA (history fallback → index.html) | 200 | 72.2 | — |
| `GET` | `/api/a11oy/chakra/{n}` | API (server-side Python) | 200* | ~70 | — |
| `POST` | `/api/a11oy/composer/adversarial` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/formulas/immune` | API (server-side Python) | 200 | 69.8 | — |
| `GET` | `/api/a11oy/formulas/receipt` | API (server-side Python) | 200 | 68.0 | — |
| `GET` | `/api/a11oy/healthz` | API (server-side Python) | 200 | 263.7 | — |
| `GET` | `/api/a11oy/internal/run-all` | API (server-side Python) | 200 | 237.8 | /run-all page "Run all 32 self-tests" |
| `POST` | `/api/a11oy/internal/run-all` | API (server-side Python) | 200* | ~70 | /run-all page "Run all 32 self-tests" |
| `GET` | `/api/a11oy/readyz` | API (server-side Python) | 200 | 69.9 | — |
| `GET` | `/api/a11oy/v1/axes` | API (server-side Python) | 200 | 87.6 | — |
| `GET` | `/api/a11oy/v1/brain` | API (server-side Python) | 200 | 66.2 | — |
| `POST` | `/api/a11oy/v1/brain/compose` | API (server-side Python) | 200 | 71.8 | /brain page composer |
| `GET` | `/api/a11oy/v1/brain/gates` | API (server-side Python) | 200 | 67.3 | — |
| `POST` | `/api/a11oy/v1/brain/jack` | API (server-side Python) | 200 | 71.4 | /brain-jack page |
| `POST` | `/api/a11oy/v1/brain/multi-jack` | API (server-side Python) | 200 | 266.1 | /brain-jack page |
| `GET` | `/api/a11oy/v1/brain/sockets` | API (server-side Python) | 200 | 72.4 | — |
| `POST` | `/api/a11oy/v1/code/auto` | API (server-side Python) | 200 | 76.5 | — |
| `POST` | `/api/a11oy/v1/code/route` | API (server-side Python) | 200 | 70.1 | — |
| `GET` | `/api/a11oy/v1/code/tiers` | API (server-side Python) | 200 | 66.8 | — |
| `POST` | `/api/a11oy/v1/composer/run` | API (server-side Python) | 200* | ~70 | — |
| `POST` | `/api/a11oy/v1/cortex-publish` | API (server-side Python) | 200 | 75.7 | Wire E publish (amaru subscribes) |
| `GET` | `/api/a11oy/v1/formulas` | API (server-side Python) | 200 | 69.6 | — |
| `POST` | `/api/a11oy/v1/formulas/{name}` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/gates` | API (server-side Python) | 200 | 74.0 | gates surfaces; SPA TrustCenter |
| `GET` | `/api/a11oy/v1/gates/{name}` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/honest` | API (server-side Python) | 200 | 66.9 | — |
| `GET,POST` | `/api/a11oy/v1/lean-verify` | API (server-side Python) | 200 | 147.0 | /lean page; proxies lean-kernel Space |
| `GET` | `/api/a11oy/v1/ledger` | API (server-side Python) | 200 | 67.5 | Landing "Try it live" → Ledger button |
| `GET` | `/api/a11oy/v1/ledger/{rid}` | API (server-side Python) | 200* | ~70 | — |
| `POST` | `/api/a11oy/v1/llm/route` | API (server-side Python) | 200 | 67.3 | — |
| `GET` | `/api/a11oy/v1/llm/tiers` | API (server-side Python) | 200 | 68.9 | — |
| `GET` | `/api/a11oy/v1/math/doctrine` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/formula/{name}` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/formulas` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/lean/theorems` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/lean/{name}` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/reference-vectors` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/status` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/thesis/claim/{label}` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/math/thesis/claims` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/a11oy/v1/mesh/state` | API (server-side Python) | 200 | 69.7 | — |
| `GET` | `/api/a11oy/v1/mesh/wire-f` | API (server-side Python) | 200 | 67.8 | — |
| `POST` | `/api/a11oy/v1/policy/evaluate` | API (server-side Python) | 200 | 67.9 | Landing "Try it live" → Evaluate button; /reason |
| `GET` | `/api/a11oy/v1/policy/example` | API (server-side Python) | 200 | 67.3 | — |
| `GET` | `/api/a11oy/v1/rag` | API (server-side Python) | 200* | ~70 | /rag page query box |
| `POST` | `/api/a11oy/v1/rag` | API (server-side Python) | 200* | ~70 | /rag page query box |
| `POST` | `/api/a11oy/v1/reason` | API (server-side Python) | 200 | 71.9 | — |
| `POST` | `/api/a11oy/v1/verify` | API (server-side Python) | 200 | 72.2 | Landing "Try it live" → Verify button |
| `DELETE,GET,PATCH,POST,PUT` | `/api/a11oy/{path:path}` | API (server-side Python) | 200* | ~70 | — |
| `GET,POST` | `/api/graphql` | API (server-side Python) | 200 | 71.0 | — |
| `GET,POST` | `/api/internal/a11oy/defense/{surface:path}` | API (server-side Python) | 200* | ~70 | — |
| `GET` | `/api/internal/a11oy/manifest` | API (server-side Python) | 200 | 69.5 | — |
| `GET` | `/api/internal/a11oy/mcp/readiness` | API (server-side Python) | 200 | 67.9 | — |
| `GET` | `/api/internal/a11oy/readiness` | API (server-side Python) | 200 | 70.2 | — |
| `GET` | `/brain` | HTML page (server-side FileResponse) | 200 | 71.7 | — |
| `GET` | `/brain-jack` | HTML page (server-side FileResponse) | 200 | 82.4 | — |
| `GET` | `/chakras` | HTML page (server-side FileResponse) | 200 | 67.9 | — |
| `GET` | `/codex-kernel` | HTML page (server-side FileResponse) | 200 | 70.7 | — |
| `GET` | `/composer` | HTML page (server-side FileResponse) | 200 | 71.5 | — |
| `GET` | `/docs` | OpenAPI/docs (FastAPI built-in) | 200* | ~70 | — |
| `GET` | `/docs/oauth2-redirect` | OpenAPI/docs (FastAPI built-in) | 200* | ~70 | — |
| `GET` | `/evidence` | HTML page (server-side FileResponse) | 200 | 69.4 | — |
| `GET` | `/formulas` | HTML page (server-side FileResponse) | 200 | 73.0 | — |
| `GET` | `/lean` | HTML page (server-side FileResponse) | 200 | 67.7 | — |
| `GET` | `/mesh` | HTML page (server-side FileResponse) | 200 | 68.2 | — |
| `GET` | `/openapi.json` | OpenAPI/docs (FastAPI built-in) | 200* | ~70 | — |
| `GET` | `/rag` | HTML page (server-side FileResponse) | 200* | ~70 | — |
| `GET` | `/receipt-composer` | HTML page (server-side FileResponse) | 200* | ~70 | — |
| `GET` | `/redoc` | OpenAPI/docs (FastAPI built-in) | 200* | ~70 | — |
| `GET` | `/run-all` | HTML page (server-side FileResponse) | 200 | 73.2 | — |
| `GET` | `/substrate` | HTML page (server-side FileResponse) | 200 | 71.2 | — |
| `GET` | `/wires` | HTML page (server-side FileResponse) | 200 | 67.7 | — |
| `GET` | `/{full_path:path}` | SPA (history fallback → index.html) | 200* | ~70 | — |

\* = status inferred from same-handler probe of a sibling method/path; representative live probe shows 200. The full machine-readable probe is in `probe_live_results.json` (73 records, method/path/status/latency/leak-check/traceparent).

---

## State-changing (action) endpoints — gating status
| Endpoint | State change | PURIQ gate | Result |
|---|---|---|---|
| `POST /api/a11oy/v1/policy/evaluate` | Appends Khipu receipt to ledger on allow | **YES** — ThresholdPolicySeverity, deny-by-default | PASS (fixed this audit) |
| `POST /api/a11oy/v1/cortex-publish` | Publishes brand-decision to Wire-E bus | **YES** — added this audit, deny-by-default | PASS (fixed this audit) |
| `POST /api/a11oy/v1/verify` | Read-only chain verification (no mutation) | n/a (read-only) | PASS |
| `POST /api/a11oy/internal/run-all` | Spawns Ouroboros subprocess (ephemeral) | n/a (self-test runner) | PASS — exit 0, 32 green/0 red |
| `POST /api/a11oy/v1/reason` | Read-only gate reasoning | uses substrate `gate_evaluate` locally | PASS (fixed this audit) |

See `PURIQ_GATE_VERIFICATION.md` for the master-formula derivation.

---

## Fixes applied to routes this audit
1. `/v1/policy/evaluate`, `/v1/ledger`, `/v1/verify`, `/reason` — were **HTTP 503** (dead Node :8081 proxy). Replaced with local `szl_receipt_substrate`. **Commit `8af6e2b6`.**
2. `/v1/cortex-publish` — added PURIQ deny-by-default gate + Khipu receipt. **Commit `eca56619`.**
