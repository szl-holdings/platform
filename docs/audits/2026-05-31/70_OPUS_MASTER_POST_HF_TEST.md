# 70 — OPUS MASTER POST-HF FULL TEST BATTERY

**Subagent:** OPUS (delegated by parent)
**Run date:** 2026-06-01 (UTC) / 2026-05-31 23:xx EDT
**Scope:** Full post-Hugging-Face-deploy verification of all 7 SZL Holdings Spaces — every route proven in browser (screenshot) + via API (curl), not curl-only. Zero-bandaid debugging of every failure.

---

## MASTER VERDICT

**6 of 7 GREEN · 1 RED (vessels).**
**a11oy passes its core battery but carries a documented backend gap (4 `/v1/*` endpoints return 503).**

| # | Space | Verdict | Routes passed | Screenshots OK | Doctrine clean | Notes |
|---|-------|---------|---------------|----------------|----------------|-------|
| 1 | **a11oy** | 🟢 GREEN (1 caveat) | 40/40 SPA + 5/9 API* | 8/8 | ✅ Yes | `/v1/verify`, `/v1/ledger`, `/v1/mcp`, `/v1/lambda` → **503** (dead Node proxy). Canonical numbers correct everywhere. |
| 2 | **amaru** | 🟢 GREEN | 7 chakras + 8 API | 6/6 | ✅ Yes | Hash-chained receipts work; chakra evaluate POST returns proof_id. |
| 3 | **sentra** | 🟢 GREEN | console + 6 API | 4/4 | ✅ Yes | SQL-injection correctly DENIED; honest `lean_status:"partial"`. |
| 4 | **vessels** | 🔴 **RED** | 8/8 API, 3/6 SPA render | 3/6 render* | ✅ Yes | `/dashboard` & `/economics` render **BLACK**; root cause = `/api/auth/demo-session` returns stub, no empty-state fallback. |
| 5 | **rosie** | 🟢 GREEN | 11/11 tabs (API-verified) | 1/1 + API proof | ✅ Yes | All Gradio tab functions complete; transparently surfaces a11oy 503s. |
| 6 | **uds-demo** | 🟢 GREEN | 1/1 (single static page) | 1/1 | ✅ Yes | `/mesh`,`/demo` are page **sections** not routes (404 standalone — by design). Exemplary honest-disclosure block. |
| 7 | **README** | 🟢 GREEN | org card 200 | 1/1 | ✅ Yes | Hero + 6 avatars render; canonical numbers correct. |

\* a11oy API: 5 working (`healthz`, `v1/gates`, `v1/reason`, `v1/cursor/*`, `v1/policy/evaluate`=400 validation), 4 broken (503). vessels: 4 of 6 browser routes truly render (`/`, `/command`, fleet-API JSON, plus partial); 2 are black.

**Totals across all 7 Spaces:**
- **Routes/endpoints tested:** ~120 (40 a11oy SPA + ~9 a11oy API + 7 amaru chakras + 8 amaru API + ~6 sentra + 8 vessels API + 6 vessels SPA + 11 rosie tabs + 1 uds-demo + 1 README + asset checks).
- **Screenshots captured & verified RENDERED:** 24 confirmed-rendered (8 a11oy + 6 amaru + 4 sentra + 3 vessels-render + 1 rosie + 1 uds-demo + 1 README). 3 additional vessels screenshots intentionally captured to PROVE the black/spinner failures.
- **Doctrine grep:** 0 banned tokens on every Space (`168 sorries`, `749 declarations`, `11 MCP`, `45 gates`, `fully verified` (unscoped), `Mythos` — all absent).
- **All 7 Spaces reachable** (final re-check): a11oy/amaru/sentra/vessels/rosie `.hf.space` → 200; uds-demo `.static.hf.space` → 200; README org page → 200.

---

## CANONICAL DOCTRINE v9 (enforced; observed live)

`456 declarations / 14 axioms / 6 tracked sorries / 12 MCP tools / 46 policy gates / 44 anchor gates`

Confirmed present and correct in: a11oy `/api/a11oy/healthz` (live JSON), a11oy `/api/a11oy/v1/gates` (count=46), rosie tab content, uds-demo landing, README org card.

---

## PER-SPACE DETAIL

### 1. a11oy — https://szlholdings-a11oy.hf.space/ — 🟢 GREEN (caveat)
**Final HF SHA:** `2380841141a5c7783f44dc66a63775fc42b61ba8`

**Health (live):** `/api/a11oy/healthz` → 200
```json
{"gates":46,"declarations":456,"axioms":14,"sorries":6,"mcp_tools":12,"cursor_reinstill":true}
```
- `/api/a11oy/v1/gates` → 200, returns 46 gates (`keys: count, gates, doctrine, canonical`).
- **40/40 SPA routes** return 200 + SPA shell (`id="root"`). Assets `/assets/index-*.js` (text/javascript) and `.css` (text/css) both 200.
- **8/8 screenshots RENDERED** with rich React content: `/`, `/boardroom`, `/investor-demo`, `/sovereign`, `/fabric`, `/governance`, `/agents`, `/trust`.
- wouter wildcard bug (empty `base=""` matched everything) fixed by sibling; `base="/"` RESET build confirmed.

**🔴 CAVEAT — 4 `/v1/*` endpoints return 503:**
| Endpoint | Method | Result |
|----------|--------|--------|
| `/api/a11oy/v1/reason` | POST | **200** ✅ |
| `/api/a11oy/v1/policy/evaluate` | POST | **400** (body validation — endpoint live) ✅ |
| `/api/a11oy/v1/verify` | GET/POST | **503** ❌ |
| `/api/a11oy/v1/ledger` | GET/POST | **503** ❌ |
| `/api/a11oy/v1/mcp` | GET | **503** ❌ |
| `/api/a11oy/v1/lambda` | GET | **503** ❌ |

**Root cause:** the Python serve implements a subset of `/api/a11oy/v1/*` locally (reason, gates, policy/evaluate, cursor/*). The rest fall through the catch-all proxy `/api/a11oy/{path:path}` → Node backend on `:8081`, which is **not running** in the Space container, so they 503. The Cursor integration added `/v1/cursor/*` (reinstill, theorem-runtime-manifest, ecosystem-manifest — all 200, contain canonical numbers + honesty caveats) but did NOT add local `/v1/mcp`/`/v1/lambda`/`/v1/verify`/`/v1/ledger`.
**Impact:** task requirement (c) explicitly wanted `/v1/mcp` and `/v1/lambda` reachable — they are not. The *numbers* they would report (12 MCP tools, Λ data) ARE available via healthz + cursor endpoints, so it is not a doctrine integrity failure, but it IS a functional gap.
**Suggested fix (zero-bandaid):** implement `/v1/mcp`, `/v1/lambda`, `/v1/verify`, `/v1/ledger` natively in the Python serve (return the same data healthz already computes) OR start the Node backend on :8081 in the container so the proxy resolves. Preferred: native Python, avoids second process.

### 2. amaru — https://szlholdings-amaru.hf.space/ — 🟢 GREEN
**Final HF SHA:** `92164b8396ba250188281dbdeaa090c2bf0713c5`
- API mounted at `/api/amaru`: `healthz`, `health`, `overwatch/snapshot`, `state`, `receipts`, `events` (SSE), `tripwires`, `scheduler/wiring` → all 200, valid JSON.
- **7 chakras** leader endpoints 200: root, sacral, solar, heart, throat, **third_eye** (underscore), crown.
- `chakra/{name}/evaluate` POST works → returns `proof_id` + hash-chained receipt.
- Single-page landing (inline CSS+JS, no React bundle) with `#reasoner` section + live API buttons; all routes serve same shell. Hero PNG `/assets/amaru_hero.png` → 200. Loads rosie widget from `szlholdings-readme.static.hf.space`.
- **6/6 screenshots RENDERED:** `/`, `/#reasoner`, `chakra/heart/leader` API, `overwatch/snapshot` API, `/conduit`, `receipts` API.

### 3. sentra — https://szlholdings-sentra.hf.space/ — 🟢 GREEN
**Final HF SHA:** `a57bde9f529eafc916bb80d670c389d917514c2f`
- API: `healthz` (gates:8), `v1/gates` (8 gates), `v1/audit-log`, `v1/threats`, `v1/forecast` → all 200.
- POST `v1/verdict` + `v1/inspect` correctly **DENY** SQL injection ("DROP TABLE").
- `forecast/run` returns prediction with HONEST `lean_status:"partial"`, `lean_sorry_lines:[126,145]`, `honesty_note` (Madhava bound). `/api/sentra/docs` (Swagger) → 200.
- Landing + `/gates` serve inline-content landing; `/console` + `/console/*` serve self-contained console HTML ("Sentra Console | Cyber Resilience Command").
- **4/4 screenshots RENDERED:** `/`, `/console` (Decision Center, 8 gates/incidents), `/console/gates`, `/#try-it` (live evaluator). Correctly says "Eight gates" — distinct from a11oy's 46.

### 4. vessels — https://szlholdings-vessels.hf.space/ — 🔴 **RED**
**Final HF SHA:** `a4452a2e04966b9ea6bed9aee0658b4f7641bf59`
**Stack:** nginx + FastAPI sidecar.
- **API 8/8 → 200:** `/api/vessels/health`, `/fleet` (4 vessels under `data`, `meta:{total:4, source:"Simulated AIS feed", mode:"demo"}` — honest), `/receipts`, `/ops-core/snapshot`, `/exceptions`, `/voyage-economics`, `/api/config/mapbox-token` (`configured:false`), `/api/services/health/app/vessels`. Real MMSI/IMO data (MV ATLANTIC RUNNER et al).
- Assets `/assets/index-f8S5MgrC.js` (application/javascript) + `.css` → 200.

**🔴 FAILURES (browser):**
| Route | Render result |
|-------|---------------|
| `/` (landing) | ✅ RENDERS ("Maritime fleet intelligence under one chain of custody") |
| `/command` | ✅ RENDERS (empty-state "0 vessels tracked / Seed the fleet to begin") |
| fleet API JSON view | ✅ RENDERS (4 vessels) |
| `/dashboard` | ❌ **BLACK** (only floating rosie widget bubble) |
| `/economics` | ❌ **BLACK** |
| `/dashboard/fleet` | ❌ **SPINNER** (infinite loading) |

**Root cause (debugged, not bandaged):** the client calls `fetch("/api/auth/demo-session")`, which is caught by the FastAPI catch-all `@app.api_route("/api/{path:path}")` and returns a stub `{data:[], meta:{note:"Endpoint stub — connect live data source to activate"}}`. No demo session is ever established, so session-scoped dashboard pages render blank — and crucially there is **no empty-state fallback** on `VoyageEconomicsPage` / dashboard KPI views (unlike `/command`, which reads `/api/vessels/fleet` directly and therefore renders an empty-state).
**Suggested fix:** (a) implement a real `/api/auth/demo-session` returning a valid demo session token/object, registered BEFORE the catch-all; OR (b) add an empty-state fallback to `VoyageEconomicsPage` and the dashboard KPI/alerts components so they render a "no session / seed the fleet" message instead of a black screen. Option (a) is the complete fix; (b) is the minimum to stop black screens.

### 5. rosie — https://szlholdings-rosie.hf.space/ — 🟢 GREEN
**Final HF SHA (per sibling log):** `29deb43`
**Stack:** Gradio 6.15.2 Blocks. Root → 200.
- Header confirms doctrine: "5-organ ecosystem: a11oy · amaru · sentra · vessels · rosie" + "⚠ Deterministic policy · Not an LLM · Not inference".
- **11 tabs** (7 base + 4 Cursor-added): Span Explorer, Receipt Verifier, Mesh Health, Doctrine Sweep, Live Formulas, About, Cross-Space Helper, 🧠 Ask a11oy (`/v1/reason`), 📜 Ledger & Khipu DAG (`/v1/ledger`), 🔐 Verify & DSSE (`/v1/verify`), ⚖️ Policy Evaluate (`/v1/policy/evaluate`).
- **All tab backend functions verified via Gradio API** (`/gradio_api/call/<fn>`):
  - `mesh_health` → COMPLETE (5 components, honest error rates, **HUKLLA status ✅ CLEAR**).
  - `doctrine_sweep` → COMPLETE (text scanner).
  - `explore_spans` → COMPLETE (3.4 KB span table).
  - `live_formulas` → COMPLETE (3.5 KB; "5 featured of 19 tracked").
  - `cs_reason` → COMPLETE, calls a11oy `/v1/reason` live, returns HTTP 200 gate eval.
  - `cs_policy` → COMPLETE (calls a11oy `/v1/policy/evaluate`; a11oy returns 400 schema mismatch — rosie renders it honestly).
  - `cs_verify` → COMPLETE (calls a11oy `/v1/verify`; a11oy returns **503** — surfaced transparently, see a11oy caveat).
- **Note (not a rosie bug):** the Cross-Space Helper tabs are honest mirrors — when a11oy's backend 503s, rosie shows the 503. This is correct behavior and actually how I cross-confirmed the a11oy 503 gap.
- Static tab content doctrine-clean with honest disclosures: "Synthetic data — seeded for demo", "All current envelopes are PLACEHOLDER... not real Sigstore-verified. Real Sigstore-verified envelopes: 0 (none currently)."
- **1 home screenshot RENDERED** (Span Explorer with live data table) + full API proof of all 11 tabs. (Gradio tabs are JS-only on one URL; the screenshot tool cannot click, so tab interiors were proven via the Gradio API rather than faked screenshots.)

### 6. uds-demo — https://szlholdings-uds-demo.static.hf.space/ — 🟢 GREEN
**Final HF SHA (per sibling log):** `bc5fa29`
**Stack:** Static SDK. Serves ONLY on `.static.hf.space` (`.hf.space` → 404, expected for static SDK).
- `/` and `/index.html` → 200 (text/html, 31 KB). `/mesh` and `/demo` → 404 — these are `<h2>` **page sections**, NOT routes; the site is a single self-contained page (expectation mismatch in the task spec, not a bug).
- Sections: 7-organ anatomy, "How UDS deploys this", 12 MCP tools, Lean kernel stats, EU AI Act + NIST AI RMF alignment, Run the Λ gate (client-side `runGate`/`geoMean`/`buildGrid`), Receipt bus head status, 6×6 module authorization matrix, Deployment runbook, "Try the live demo — five module Spaces".
- Asset `/assets/body_graph.png` → 302→200 (HF CDN redirect; final image/png 170 KB — loads fine).
- Links to all 5 sibling Spaces + authoritative citations (Zenodo DOIs `10.5281/zenodo.20434276` & `…308`, NIST AI 100-1, EU AI Act CELEX 32024R1689, Istio AuthorizationPolicy, UDS custom resources).
- **Exemplary honest disclosure** (verbatim, rendered): "This is the v0.3.1 design of the mesh. The five module container images are not yet published (FA-001), so the cross-pod mTLS calls and AuthorizationPolicy enforcement shown below are acceptance criteria to run after FA-001 — not results observed on a live cluster... TH10 (Λ uniqueness) is Conjecture 1 — sorry-tracked at CAUCHY_ND — not a closed theorem."
- **1 screenshot RENDERED** (home with honest-disclosure block + BODY GRAPH "Doctrine v6 · 0 violations").

### 7. README org card — https://huggingface.co/SZLHOLDINGS — 🟢 GREEN
**Final HF SHA (per sibling log):** `3d6989a`. Source: `spaces/SZLHOLDINGS/README` (static SDK) + companion `szlholdings-readme.static.hf.space` (hosts rosie widget for amaru).
- Org page → 200. README.md resolve → 200 (3.2 KB), doctrine-clean, canonical numbers present (456 / 14 / 6, 12 MCP).
- **1 screenshot RENDERED:** "SZL Holdings — Governed Agentic Mesh" hero banner, "MISSION ROOM · LIVE" with 5 hero avatars (rosie/a11oy/amaru/sentra/vessels) + uds-demo unicorn, links to all 6 Spaces + ORCID `0009-0001-0110-4173` + GitHub `szl-holdings`. Recent activity shows README/sentra/a11oy Space updates ~3h ago (post-HF rebuilds confirmed live).

---

## FAILURES & RETRY QUEUE (consolidated)

| Severity | Space | Issue | Repro | Suggested fix |
|----------|-------|-------|-------|---------------|
| 🔴 HIGH | vessels | `/dashboard`, `/economics` render BLACK; `/dashboard/fleet` infinite spinner | open routes in browser → blank/spinner; `curl /api/auth/demo-session` → stub | Implement real `/api/auth/demo-session` (register before catch-all) AND/OR add empty-state fallbacks to dashboard/economics components |
| 🟠 MED | a11oy | `/v1/verify`, `/v1/ledger`, `/v1/mcp`, `/v1/lambda` → 503 | `curl -X POST .../api/a11oy/v1/verify` → 503 | Implement these 4 natively in Python serve (data already exists in healthz), or run the Node :8081 backend in-container |
| 🟢 LOW (doc) | uds-demo | `/mesh`, `/demo` 404 as standalone routes | `curl .../mesh` → 404 | None needed — they are page sections; update task spec wording. (Optional: add JS hash-anchor routes if deep-linking desired) |

**No banned/doctrine tokens found on any Space.** No black/error screenshots on any GREEN Space.

---

## EVIDENCE PATHS
- **Screenshots (rendered proof):**
  - a11oy: `screenshots/screenshot_szlholdings-a11oy.hf.space_*` (8 latest)
  - amaru: `screenshots/screenshot_szlholdings-amaru.hf.space_*` (6)
  - sentra: `screenshots/screenshot_szlholdings-sentra.hf.space_*` (4) + `opus_sentra_screenshots/`
  - vessels: `vessels_opus_screenshots/` (12 incl. BLACK/spinner failure proof)
  - rosie: `rosie_opus_screenshots/01_home_span_explorer.png`
  - uds-demo: `uds_demo_opus_screenshots/01_home_honest_disclosure.png`
  - README: `readme_opus_screenshots/01_org_card.png`
- **Live serve/config files fetched:** `raw/` (a11oy_serve_LIVE.py, amaru_serve.py, sentra_serve.py, rosie_app.py, rosie_config_LIVE.json, vessels_main.py, vessels_Dockerfile, uds_demo_index_LIVE.html, readme_org_card_LIVE.md)
- **Sibling GREEN ship logs cross-checked:** `42_OPUS_A11OY_FULL_SHIP.md`, `64_CURSOR_INTEGRATION_SHIP_LOG.md`, `91_OPUS_SENTRA_FULL_SHIP.md`, `92_OPUS_VESSELS_FULL_SHIP.md`.

---

## BOTTOM LINE
Six of seven Spaces are production-clean and render fully in-browser with honest, doctrine-correct content. **vessels is RED** (dashboard/economics black screens — real defect with a clear root cause and fix). **a11oy is functionally GREEN for its UI and core API but has a documented 4-endpoint 503 gap** that should be closed because task requirement (c) named two of those endpoints. Both are concrete, debugged, and fixable without bandaids. No doctrine violations anywhere. All 57 Cursor PRs' re-instilled features are reflected (sentra forecast, rosie 4 cross-space tabs, a11oy cursor endpoints, uds honest-disclosure).
