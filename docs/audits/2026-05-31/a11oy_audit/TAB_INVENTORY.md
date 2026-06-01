# TAB_INVENTORY — a11oy UI surfaces

**Audit date:** 2026-06-01 · **Space:** `SZLHOLDINGS/a11oy` · **Author:** Yachay · **Agent:** Perplexity Computer Agent
**Screenshots:** `a11oy_audit/screenshots/`

The a11oy UI has **three distinct surfaces**:
1. **React SPA** (served at `/` via `index.html` + `/assets/index-*.js`) — **149 client-side routes**, top nav: Architecture · Applications · Resources · Platform · Now Board · Request access.
2. **Server-side HTML pages** (FastAPI `FileResponse`, `pages/*.html`) — 14 governance/proof consoles.
3. **OpenAPI docs** — `/docs` (Swagger), `/redoc`.

---

## A. React SPA tabs (149 routes — grouped)

All SPA routes return **HTTP 200** (server history-fallback serves `index.html`; wouter renders the matching component client-side). Verified by probe; unknown routes render the SPA's own 404 component (see broken-flag note below).

| Section | Representative routes | Renders | Calls |
|---|---|---|---|
| **Landing / Home** | `/` | "Governed intelligence — your unfair advantage" hero, nav, Execute box | local; `/api/...gates` on some panels |
| **Architecture** | `/architecture`, `/fabric`, `/fabric/{signals,risks,decisions,evidence,outcomes,roadmap,twins,verticals}`, `/agent-mesh`, `/constellation` | Architecture diagrams, fabric sub-views | mixed |
| **Applications** | `/applications`, `/boardroom`, `/nexus`, `/investor-demo`, `/command`, `/care`, `/deep-research`, `/alert-triage` | Product/demo pages | **some fabricate data — see MOCK_HUNT F-1** |
| **Governance / Proof** | `/governance`, `/evidence`, `/doctrine`, `/constitution`, `/covenant-lift`, `/formal-verification`, `/lean`, `/audit`, `/trust` | Governance dashboards | `/api/a11oy/v1/gates`, lean-kernel |
| **a11oy.code** | `/a11oy-code`, `/a11oy.code`, `/code-behaviors` | Code orchestrator console | `/api/a11oy/code/*` (concurrent orchestrator) |
| **Ouroboros / Cookbook** | `/cookbook`, `/cookbook/anatomy-evolved-v1`, `/cookbook/knot-calculus-v1`, `/convergence` | Cookbook recipes w/ Zenodo DOIs | external DOI links |
| **Sovereign / Replay** | `/sovereign`, `/sovereign/replay/:id` | Replay detail | **fabricates trace data — MOCK_HUNT F-1** |
| **Platform / Infra** | `/substrate-compute`, `/flexcache`, `/cost-monitoring`, `/self-healing`, `/precision-ai`, `/intent-router`, `/skills` | Runtime dashboards | **synthetic data; some disclosed (F-2), some not (F-1)** |
| **Security** | `/atlas-shield`, `/agent-zero-trust`, `/cyber-resilience`, `/gard-robustness`, `/supply-chain` | Threat taxonomy/posture | local content |
| **Now Board / Account** | `/now-board` (Now Board), `/account/billing`, `/connectors` | Status board, settings | mixed |

### Broken-flag notes (SPA)
- **`/console/` → renders SPA "404 Page not found"** (screenshot `00_console_404.png`). The server returns `index.html` (HTTP 200) but the SPA router has **no `/console` route** — it mounts at root `/`. Legacy/stale path. **Cosmetic dead-link** (the real app is at `/`). Not a server defect.
- The root `/` and all 149 wouter routes render correctly (screenshot `01_landing_root.png` shows a polished, fully-styled landing).

---

## B. Server-side HTML governance pages (14)

All return **HTTP 200** with full HTML. These are the real proof/governance consoles.

| Path | Title / shows | Live calls | Status |
|---|---|---|---|
| `/evidence` | **Evidence Ledger — Lutar Invariant Λ**; per-claim PROVEN/AXIOM/CONJECTURE table, LOCKED numbers (749/14/163), Λ=Conjecture 1, SLSA L1, honest aggregator-discrepancy disclosure | GitHub Lean file links | **PASS** (screenshot `02_evidence_ledger.png`) |
| `/run-all` | **Ouroboros Run-All — 32 module self-tests**; "Run" button executes real subprocess | `POST /api/a11oy/internal/run-all` | **PASS** — exit 0, 32 green/0 red (screenshot `03_run_all_ouroboros.png`) |
| `/brain` | szl_brain 5-tier LLM router + Λ-receipt composer | `POST /v1/brain/compose` | PASS (pre-collision) |
| `/brain-jack` | Wire G brain-jack across organs | `POST /v1/brain/jack`, `/multi-jack` | PASS (pre-collision) |
| `/mesh` | Wire D/E/F mesh state, in-memory ring buffers | `GET /v1/mesh/state` | PASS (pre-collision) |
| `/wires` | Khipu DAG / Wire C receipt ingest demo | client + `/v1/mesh/*` | PASS (pre-collision) |
| `/substrate` | Receipt substrate console | `/v1/policy/*`, `/v1/ledger` | **was fixed by this audit; reverted by RESET** |
| `/codex-kernel` | Governed-loop validators (state-transition, drift, evidence, human_gate) | client-side validators | PASS |
| `/lean` | Lean theorem table | `GET /v1/lean-verify` → lean-kernel Space | PASS (pre-collision) |
| `/formulas`, `/composer`, `/chakras` | szl_anatomy formula/composer/chakra consoles | `/api/a11oy/v1/formulas`, `/chakra/{n}` | PASS (pre-collision) |
| `/rag` | RAG query box over thesis corpus | `POST /v1/rag` | PASS (pre-collision) — returns 5 real chunks |
| `/receipt-composer` | Receipt composer | `/v1/formulas/*` | PASS (pre-collision) |

> "pre-collision" = verified 200/working at commit `eca56619`; reverted to 503 by the concurrent RESET build (`f1e76d01`+). See ENDPOINT_TEST_RESULTS.md RUN A vs RUN B.

---

## C. OpenAPI docs
| Path | Status |
|---|---|
| `/openapi.json` | 200 — 67 documented paths, title "a11oy — Brand Orchestration Layer" v2.0.0 |
| `/docs` (Swagger UI) | 200 |
| `/redoc` | 200 |

---

## Screenshots captured
| File | Surface |
|---|---|
| `screenshots/00_console_404.png` | `/console/` SPA 404 (stale path) |
| `screenshots/01_landing_root.png` | `/` landing (fully functional) |
| `screenshots/02_evidence_ledger.png` | `/evidence` proof ledger |
| `screenshots/03_run_all_ouroboros.png` | `/run-all` Ouroboros runner |
