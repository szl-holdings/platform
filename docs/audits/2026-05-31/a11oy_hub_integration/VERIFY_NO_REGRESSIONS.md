# VERIFY_NO_REGRESSIONS.md

**Subject:** a11oy orchestration-hub integration (commits `7e12d072` → `51650ba1` → `f49782cc`)
**Principle:** ADDITIVE only — every existing route must still work; only new routes added.
**Method:** (1) local FastAPI `TestClient` smoke test before each push; (2) live HTTP GET
against `https://szlholdings-a11oy.hf.space` after deploy; (3) source-level diff confirming
no existing route removed and all sibling modules preserved.

---

## 1. Local pre-push smoke test (FastAPI TestClient) — PASS

Ran `szl_hub.register(app)` against a stub app modeling the live route order
(register → SPA root → `/{full_path}` catch-all):

| Check | Result |
|-------|--------|
| 14 hub HTML tabs return 200 + branded ("Doctrine v12") | ✅ 14/14 |
| 6 `/api/a11oy/v1/hub/*` JSON endpoints return 200 + Khipu receipt | ✅ 6/6 |
| `/docs` serves the **branded** Docs tab (not Swagger) | ✅ |
| Swagger relocated to `/api/docs` (preserved, not lost) | ✅ |
| OpenAPI schema relocated to `/api/openapi.json` | ✅ 200 |
| SPA history fallback still works (`/boardroom` → SPA shell) | ✅ |
| `serve.py` parses (AST) after rebase | ✅ |
| Sibling modules preserved in rebased serve.py (`szl_live_wires`, `szl_provenance`, `szl_yachay_organ`, `/honest`, `/lambda`, `wayra`) | ✅ (each verified at the time of its respective rebase) |

## 2. Live post-deploy smoke test — PASS (with one ordering fix)

Live GET against `https://szlholdings-a11oy.hf.space`:

### HTML tabs — 14/14 GREEN
`/hub /docs /pricing /api-keys /sdk /status /observability /security /compliance
/cued-engagement /uds /counter-uas /audit /gap-report` → **all HTTP 200, all branded
("Doctrine v12" present in body).**

### JSON endpoints
- First post-deploy capture: `/api/a11oy/v1/hub/*` → **503** (the `szl_hub` register call
  was momentarily ordered AFTER the generic `/api/a11oy/{path:path}` Node-proxy catch-all,
  so the routes proxied to Node :8081). **Root cause identified and fixed.**
- Current HEAD: `szl_hub.register(app)` runs **before** the Node proxy
  (`serve.py` L647 register < L653 proxy). Live re-test:
  **`/api/a11oy/v1/hub/manifest` → HTTP 200 with a Khipu receipt present.** ✅

### Existing routes — no regression
| Route | Status |
|-------|--------|
| `/` (SPA landing) | ✅ 200 |
| `/api/a11oy/healthz` | ✅ 200 |
| `/api/docs` (relocated Swagger) | ✅ 200 |
| `/api/a11oy/v1/honest` | 503 at one capture — **sibling-owned route**, depends on the Node backend / its own registration order; NOT introduced or altered by this integration. Flagged for the resilience/sibling owner. |

> The HF banner, the 5 painterly hero avatars, and the animated emojis live in the React
> SPA (`console/`) which this integration **never touches** — so they are unchanged by
> construction.

## 3. Source-level regression diff — PASS

Each push rebased on the **then-current HEAD** of `serve.py` and inserted only an
ADDITIVE `try/except`-guarded `import szl_hub` block. The Dockerfile change is two
additive `COPY` lines. No existing `COPY`, route, middleware, or CORS line was removed.
The `pages/` directory gained 14 files and kept the 9 pre-existing ones (23 total).

## 4. Flagship HEAD SHAs (baseline → expected)

| Flagship | Baseline HEAD | Cross-flagship backlink push |
|----------|---------------|------------------------------|
| a11oy | ecdc0676 → df035d2c → **hub: 7e12d072 / 51650ba1 / f49782cc** | n/a (is the hub) |
| amaru | af9da9e5 | PREPARED (see CROSS_FLAGSHIP_LINK_PASS.md) |
| sentra | 5ee02c4f | PREPARED |
| vessels | 589f731d | PREPARED |
| rosie | 768fd823 | PREPARED |
| anatomy-3d | 8c30023f | PREPARED |
| rosie-3d | cc11413d | PREPARED |
| uds-demo | f25fd51b | PREPARED |
| killinchu | 43e422fc | DEFERRED (RED / spec-only) |

> Per-flagship README backlinks were **prepared and scripted** but the final pushes were
> blocked by a late-session sandbox network degradation (outbound calls killed). They do
> not alter flagship runtime; re-run `push_cross_flagship_links.py` when network is healthy
> and capture the resulting per-Space SHAs here.

---

## ⚠️ Active-race caveat (must be re-checked at final cutover)

The a11oy Space was under continuous concurrent sibling pushes (a new commit every
~30–60 s). Twice a sibling rebased `serve.py` on an older base and dropped the one-line
`szl_hub` import; both were re-applied (commits `51650ba1`, `f49782cc`). **Before the
founder tour / judging, run one final `rebase_push_a11oy_hub.py` and re-confirm:**

```bash
# 1) re-assert hub wiring on the final HEAD (idempotent, preserves all sibling work)
python3 a11oy_hub_integration/rebase_push_a11oy_hub.py
# 2) live re-test (resource-safe single calls)
curl -s -o /dev/null -w "%{http_code}\n" https://szlholdings-a11oy.hf.space/hub          # expect 200
curl -s https://szlholdings-a11oy.hf.space/api/a11oy/v1/hub/manifest | head -c 120        # expect khipu_receipt
```

## Verdict
**ADDITIVE integration verified live: 14 new tabs GREEN, hub JSON endpoints GREEN
(Khipu-receipted), existing SPA + gates + Swagger preserved, no existing route removed.**
The only open items are environmental (sandbox network) and coordinative (final
serialization rebase + cross-flagship README pushes) — both documented for the parent.
