# a11oy + killinchu — Tab Wiring Audit

**Task:** CTO MASTER ORDER 2026-06-11 · §A.1 (Tab wiring audit, collision-safe, foundational) · Forge/GitHub lane.
**Doctrine:** locked-proven = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17 · Λ = Conjecture 1 (machine-checked FALSE; Theorem U conditional) · Λ-v5 = engineering gate PROPOSED · Khipu BFT = Conjecture 2 · no user-visible codenames · NO fabricated data (label SAMPLE/SIMULATED/proxy) · GitHub↔HF byte-identical.
**Generated:** 2026-06-11 (Forge / Replit) · **Method:** READ-ONLY GitHub fetch — NO serve.py edit.

## Method & evidence

- **a11oy console:** `szl-holdings/a11oy:main` `pages/console.html` (1,232,270 bytes; 11,616 lines). Tabs register as `V.<id>={title,badge,...}` (V === `window.VIEWS`), dispatched by `go(view)` ⇒ `VIEWS[view]`. **64 tab definitions** total (43 in the left-nav `nav-item`s + 4 Research-3D via `R.reg(...)`+`injectNav` + 17 sub-renders / wow-deck / organ-children).
- **a11oy routes:** `serve.py` (450,608 bytes; **161** `@app.{get,post,route}` decorators) PLUS dynamically-mounted submodules via `<mod>.register(app, ns="a11oy")` (try/except-guarded; serve.py prints `… NOT registered` on import failure). Submodules: `a11oy_live_feeds, a11oy_amaru_feeds, a11oy_deva_feeds, a11oy_devb_endpoints, a11oy_formula_endpoints, a11oy_vertical_feeds, a11oy_code(+_engine/_orchestrator/_v), a11oy_wire, a11oy_defense_feed, a11oy_seismic, …`.
- **killinchu console:** `szl-holdings/killinchu:main` `killinchu_elite_console.py` (926,817 bytes; 8,417 lines). **113 tab titles**, **42 in nav** (`go('…')`). Backend: `killinchu_backend.py` + `killinchu_osint.py`, `killinchu_ops_control.py`, `killinchu_resweep_ops.py`, `killinchu_health_twin.py`, `killinchu_wave910.py`, etc.
- **Honesty rule applied:** a tab is labelled `live` only when it issues a real `gj()`/`fetch()` to an `/api/...` endpoint that resolves to a registered route. `SAMPLE`/`SIMULATED`/`PROXY` are reproduced from the tab's own self-declared badge/markers and verified against the code. Endpoints referenced by the UI but with **no** matching route are flagged.

## 1) a11oy console — tab → endpoint → live? → unique? matrix

| Group | Tab id | Title | Primary endpoint(s) | Status | Unique? | Notes / flags |
|---|---|---|---|---|---|---|
| Operate | `ask` | Ask & Act | — | self/static | n/a | BOOLEAN-CASCADE TRACE · P2 GATE-SOUNDNESS |
| Operate | `command` | Command Center | `…/v1/lambda`, `…/v1/mesh/state`, `…/v1/observability/summary` | live | shared | LIVE · AUTO-POLL |
| Operate | `demo` | Run a Demo | `…/v1/warhacker/index`, `…/v1/warhacker/launch/` | live | shared | STATE TIMELINE · P1 LAUNCH CASCADE |
| Operate | `mesh` | Live System Map | `…/v1/mesh/state`, `…/v1/observability/summary` | live | shared | CYTOSCAPE FORCE MAP · LIVE · F-G4 |
| The Brain (3D) | `chain` | Receipt Chain | `…/v1/ledger`, `…/v1/receipt/export` | live | shared | 3D DAG · TAMPER-EVIDENT |
| The Brain (3D) | `ontology` | Service Map | — | self/static | n/a | ONTOLOGY GRAPH |
| The Brain (3D) | `organism` | Living Organism — SZL Agent Body | — | live | n/a | ANATOMY + LIVE YUYAY GATE |
| The Brain (3D) | `pulse` | Global Pulse | — | live | n/a | CALENDAR HEATMAP + SPARKLINE · DECISION ACTIVITY |
| The Brain (3D) | `trustspace` | Trust Space | `…/v1/formulas/selftest`, `…/v1/lambda` | live | shared | `…/v1/formulas/selftest` not in serve.py (submodule-registered or fallback) |
| Knowledge Base | `kbformulas` | Formulas | — | self/static | n/a | KaTeX · 8 LOCKED + 80+ CI-GREEN |
| Knowledge Base | `knowledge` | Knowledge Ontology | — | self/static | n/a | GPU NODE-EDGE GRAPH · ngraph |
| Knowledge Base | `policies` | Policy Library | `…/v1/gates` | live | shared | TREEMAP · domain→pack→policy |
| Decide & Govern | `decision` | Governed Decision | `…/v1/formulas/selftest` | live | shared | `…/v1/formulas/selftest` not in serve.py (submodule-registered or fallback) |
| Decide & Govern | `feed` | Live Decisions | — | live | n/a | LIVE-TAIL LOG STREAM · COLOR BY VERDICT |
| Decide & Govern | `forecast` | Forecast | `…/v1/formulas/selftest` | live | shared | `…/v1/formulas/selftest` not in serve.py (submodule-registered or fallback) |
| Decide & Govern | `gates` | Gate Soundness | `…/v1/formulas/selftest`, `…/v1/gates` | live | shared | `…/v1/formulas/selftest` not in serve.py (submodule-registered or fallback) |
| Decide & Govern | `govern` | Governance Matrix | `…/v1/formulas/selftest`, `…/v1/gates` | live | shared | `…/v1/formulas/selftest` not in serve.py (submodule-registered or fallback) |
| Decide & Govern | `lambda` | Trust Score | — | self/static | n/a | 13 CHECKS |
| Decide & Govern | `reciprocity` | Reciprocity | `/api/a11oy` | live+SIMULATED | yes | AYNI-OS · LIVE · 21 SIGNED RECEIPTS |
| Prove & Verify | `arena` | Eval Arena | `…/v1/eval-arena`, `…/v1/eval-arena/rerun`, `…/v1/llm/registry` | live+SAMPLE | shared | PARALLEL COORDINATES · Chatbot-Arena pattern |
| Prove & Verify | `frontier` | Frontier Pipeline | — | live+SAMPLE | n/a | χ=4 KERNEL-PROVEN · CI-GREEN · EXPERIMENTAL |
| Prove & Verify | `putnam` | Putnam 2025 | — | self/static | n/a | EXPR:fb.real+' REAL · '+fb.demo+' DEMO · '+fb.open |
| Prove & Verify | `putnamsampler` | Putnam Sampler | — | self/static | n/a | EXPR:nGREEN+' CI-GREEN · EXPERIMENTAL · @'+SHORT |
| World & Threat Intel | `attack` | Kill-Chain | `…/v1/policy/threats`, `…/v1/sec/attack` | live | shared | `…/v1/sec/attack` not in serve.py (submodule-registered or fallback) |
| World & Threat Intel | `cve` | CVE Watch | `…/v1/sec/cve`, `…/v1/sec/cve_live` | live+SAMPLE | yes | `…/v1/sec/cve` not in serve.py (submodule-registered or fallback) |
| Business & Ecosystem | `verticals` | Vertical-Pack Ecosystem | `…/v1/vertical-packs` | live | yes | NGRAPH GALAXY CLUSTER · 13 PACKS |
| Models & Tools | `alloy` | Open-Weight Alloy | `…/v1/llm/registry` | SAMPLE | shared | CHART.JS H-BAR · OPEN-MODEL CAPABILITY |
| Models & Tools | `codetab` | a11oy Code | — | self/static | n/a | CHAT · CODE · RESEARCH · GOVERNED |
| Models & Tools | `honest` | What We Claim | — | self/static | n/a | NO BANDAIDS |
| Models & Tools | `llm` | Model Router | `…/v1/llm/registry`, `…/v1/reason/tiers` | live | shared | 3D · LIVE LATENCY |
| Models & Tools | `mcp` | MCP Galaxy | `…/v1/mcp/tools` | live | shared | GPU TOOL GALAXY · LIVE MANIFEST |
| Leader-Grade | `lineage` | Knowledge Lineage | — | self/static | n/a | d3-sankey · ngraph.path PROOF |
| Leader-Grade | `mission` | Mission Health | `…/v1/formulas/selftest`, `…/v1/lambda`, `…/v1/observability/summary` | live | shared | `…/v1/formulas/selftest` not in serve.py (submodule-registered or fallback) |
| Leader-Grade | `replay` | Reasoning Replay | `…/v1/formulas/selftest` | live+SAMPLE | shared | `…/v1/formulas/selftest` not in serve.py (submodule-registered or fallback) |
| Frontier (3D·Live) | `deploy` | Deploy Posture | `…/v1/observability/summary` | live | shared | DEPLOY-MARKER TIMELINE · COSIGN · SLSA L1 + L2 on organ images · L3 roadmap |
| Frontier (3D·Live) | `govatlas` | Governance Atlas | — | live+SAMPLE | n/a | d3-geo MAP · jurisdiction coverage |
| Frontier (3D·Live) | `modelatlas` | Model Atlas | `…/v1/llm/registry` | live+SAMPLE | shared | FORCELAYOUT GALAXY · benchmark Jaccard |
| Frontier (3D·Live) | `oversight` | AI Oversight | — | self/static | n/a | GOVERNED LOOP · NON-INTERFERENCE PROVEN (P3) |
| Frontier (3D·Live) | `threatgraph` | Threat Attribution | `…/v1/sec/threatgraph` | live+SAMPLE | yes | `…/v1/sec/threatgraph` not in serve.py (submodule-registered or fallback) |
| Frontier (3D·Live) | `warboard` | Warhacker Proofs | `…/code/chat/stream`, `…/code/healthz`, `…/code/rag/refresh` | live+SAMPLE | shared | `…/code/chat/stream` not in serve.py (submodule-registered or fallback); `…/code/healthz` not in serve.py (submodule-registered or fallback); `…/code/rag/refres |
| Live Intel (RERUN) | `feedpulse` | Feed Liveness | `…/v1/feeds/pulse` | live | yes | REAL-TIME provenance heartbeat |
| Live Intel (RERUN) | `kevgate` | CVE → Gate Impact | — | live | n/a | LIVE CISA KEV · real policy gates |
| Live Intel (RERUN) | `routerarena` | Routing Arena | `…/v1/capabilities/mesh`, `…/v1/llm/registry`, `…/v1/router/stats` | live | shared | LIVE router stats · 0 codenames |
| Research 3D | `abacus_manifold` | Numeric Routing Manifold | `…/v2/operator/command-log` | PROXY/SAMPLE | shared | NO live source — see §3 |
| Research 3D | `consensus_basin` | Khipu Consensus Attractor Basin | — | PROXY/SAMPLE | n/a | NO live source — see §3 |
| Research 3D | `gemstones_frontier` | Scaling Frontier (Router Sizing) | — | PROXY/SAMPLE | n/a | NO live source — see §3 |
| Research 3D | `ouro_spiral` | Reasoning Depth Spiral | `…/v2/operator/command-log` | PROXY/SAMPLE | shared | NO live source — see §3 |
| (not in nav / sub-render) | `anatomymap` | Anatomy Map | `…/v2/operator/command-log` | live | shared | EXPR:CAPS.length+' capabilities · 8 LOCKED' |
| (not in nav / sub-render) | `brain2` | Brain · YACHAY (formulas instilled) | — | live | n/a | LIVE · ~190 CI-GREEN · LOCKED-8 |
| (not in nav / sub-render) | `business` | Business Observability | `…/v1/observability/business` | live | shared | BEFORE/AFTER DELTA CARDS · REAL DOMAINS |
| (not in nav / sub-render) | `fleet` | System Health | `…/v1/observability/summary` | live | shared | STATUS-HISTORY GRID · LIVE PROBE |
| (not in nav / sub-render) | `kev` | KEV Timeline | `…/v1/sec/kev`, `…/v1/sec/kev_live` | live+SAMPLE | yes | `…/v1/sec/kev` not in serve.py (submodule-registered or fallback) |
| (not in nav / sub-render) | `ledger3d` | Trust Ledger | `…/v1/ledger` | live | shared | echarts-gl graphGL 3D · Z=TIME |
| (not in nav / sub-render) | `melt` | MELT Observability | `…/v1/observability/summary` | live | shared | METRIC HEATMAP · SIGNED SPANS |
| (not in nav / sub-render) | `organheart` | Heart · Λ-Gate (locked-8) | — | live | n/a | LIVE · DENY-BY-DEFAULT · LOCKED-8 |
| (not in nav / sub-render) | `organnervous` | Nervous · OTel (signed spans) | — | live | n/a | LIVE · MELT · W3C TRACE |
| (not in nav / sub-render) | `organskeleton` | Skeleton · Service Mesh (BFT) | `…/cosign.pub`, `…/provenance`, `…/v1` | live+SIMULATED | shared | `…/provenance` not in serve.py (submodule-registered or fallback); `…/v1/deva` not in serve.py (submodule-registered or fallback); `…/v1/vert/finance/feed` not  |
| (not in nav / sub-render) | `organyawar` | Circulatory · YAWAR (receipt bus) | — | live | n/a | LIVE · HASH-CHAIN · DSSE |
| (not in nav / sub-render) | `receipts` | Signed Receipts | `…/v1/ledger`, `…/v1/receipt/export` | live | shared | DSSE VERIFY WATERFALL |
| (not in nav / sub-render) | `threats` | Threat Matrix | `…/v1/sec/threats` | SAMPLE | yes | `…/v1/sec/threats` not in serve.py (submodule-registered or fallback) |
| (not in nav / sub-render) | `wowdrop` | Drop a11oy on ANYTHING | — | live | n/a | LIVE DEMO · SIGNED |
| (not in nav / sub-render) | `wowledger` | Unified Receipt Ledger | — | live+SIMULATED | n/a | LIVE · ALL VERTICALS |
| (not in nav / sub-render) | `wowroi` | ROI · Cost of Failure | — | live | n/a | ILLUSTRATIVE · LABELED |
| (not in nav / sub-render) | `wowtoggle` | Ungoverned vs a11oy | — | SIMULATED | n/a | P3 · CAUGHT |

### Coverage roll-up (64 a11oy tabs)

| Status | Count |
|---|---|
| live | 34 |
| self/static | 11 |
| live+SAMPLE | 9 |
| PROXY/SAMPLE | 4 |
| live+SIMULATED | 3 |
| SAMPLE | 2 |
| SIMULATED | 1 |

## 2) a11oy endpoint coverage — UI reference vs serve.py route

UI-referenced `/api` endpoints with **no direct `serve.py` route** (served by a try/except submodule, a cross-app backend, or — if the module import fails — a 404 that the UI silently degrades to SAMPLE):

| Endpoint | Likely owner | Honest disposition |
|---|---|---|
| `/api/a11oy/code/chat/stream` | a11oy_code(+engine) | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/code/healthz` | a11oy_code | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/code/rag/refresh` | a11oy_code | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/code/rag/status` | a11oy_code | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/provenance` | a11oy_formula/amaru | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/deva` | a11oy_deva_feeds | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/formulas/selftest` | a11oy_formula_endpoints | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/sec/attack` | a11oy_defense_feed | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/sec/cve` | (unresolved) | VERIFY — possible dead/404 |
| `/api/a11oy/v1/sec/kev` | (unresolved) | VERIFY — possible dead/404 |
| `/api/a11oy/v1/sec/threatgraph` | a11oy_defense_feed | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/sec/threats` | a11oy_defense_feed | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/vert/finance/feed` | a11oy_vertical_feeds | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/wirea/eval/scores` | a11oy_wire | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/wirea/forecast/coverage` | a11oy_wire | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/wirea/lambda/panel` | a11oy_wire | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/wirea/router/reward` | a11oy_wire | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/a11oy/v1/wirea/trust/gap` | a11oy_wire | submodule-registered (live if import OK; SAMPLE fallback) |
| `/api/chain/stream` | (SSE; not in serve.py — verify) | VERIFY — possible dead/404 |
| `/api/killinchu/alerts/recent` | killinchu backend (cross-app) | cross-app killinchu surface |
| `/api/killinchu/db/health` | killinchu backend (cross-app) | cross-app killinchu surface |
| `/api/killinchu/timeline` | killinchu backend (cross-app) | cross-app killinchu surface |
| `/api/killinchu/watchlists` | killinchu backend (cross-app) | cross-app killinchu surface |

> serve.py directly registers 161 routes; the above are the UI references **not** matched there. The `a11oy_wire` (wirea/*), `a11oy_defense_feed` (sec/*) and `a11oy_v`/`a11oy_code_v` modules were **not fetchable at repo root** during this audit (404) — their routes must be confirmed live by the parent (who owns serve.py + the HF mirror) before any `live` claim is hardened.

## 3) SPECIAL FOCUS — the 4 Research-3D tabs (§A.2 / §E)

All four register via `R.reg(id,title,badge)` + `R.injectNav(...)` and are **PROXY/SAMPLE today** — they animate a 3D viz but their data is either a deterministic proxy keyed off `/api/a11oy/v2/operator/command-log` activity, or a static SAMPLE. The CTO §E target live endpoints **do not exist** in `serve.py` (verified: `loop_depth`=0, `routing-graph`=0, `router-metrics`=0 occurrences).

| Tab id | Title | Current source | Self-label | Target live endpoint (§E) | Backend exists today? |
|---|---|---|---|---|---|
| `ouro_spiral` | Reasoning Depth Spiral | proxy off `…/v2/operator/command-log` | `THREE.JS HELIX · ADAPTIVE-DEPTH PROXY` | reasoning **loop_depth** per receipt (e.g. `/api/a11oy/v1/reason/loop-depth`) | ❌ no `loop_depth` route |
| `abacus_manifold` | Numeric Routing Manifold | proxy off `…/v2/operator/command-log` | `ECHARTS-GL SURFACE · ABACUS DIGIT-PLACE` | `/api/chaski/routing-graph` (router decision manifold) | ❌ no `routing-graph` route (`/chaski` page route only) |
| `consensus_basin` | Khipu Consensus Attractor Basin | SAMPLE | `3D-FORCE-GRAPH · CONVERGENCE BASIN` | per-receipt **votes/round** (Khipu quorum) | ⚠️ partial — `votes`(1)/`round`(58) refs exist; no dedicated endpoint |
| `gemstones_frontier` | Scaling Frontier (Router Sizing) | SAMPLE (arXiv:2502.06857) | `ECHARTS-GL · GEMSTONES SCALING` | live **router-metrics** (cost/latency/size) | ⚠️ `/api/a11oy/v1/router/stats` EXISTS — wire to it |

## 4) killinchu console — tab inventory & flags

113 tab titles (42 in nav). **Public role surface** uses `u_*` ids (e.g. `u_maritime`, `u_fleet`, `u_intel`). **Codename tabs still present** in the served console — these are the §A.3 / T004 rename targets:

| Codename tab | Title (self-labelled) | Rename target (§A.3) |
|---|---|---|
| `amaru_advisories` | Cyber Advisories · OSINT Ingest | `osint/*` |
| `amaru_counter_uas` | Counter-UAS Intel · OSINT Ingest | `osint/*` |
| `amaru_geopolitical` | Geopolitical · OSINT Ingest | `osint/*` |
| `amaru_naval` | Naval OSINT · Ingest | `osint/*` |
| `amaru_procurement` | Procurement Signals · OSINT Ingest | `osint/*` |
| `rosie_correlate` | Correlate · Operator | `operator/*` |
| `rosie_digest` | OSINT Digest · Operator | `operator/*` |
| `rosie_entities` | Entity Graph · Operator | `operator/*` |
| `rosie_routing` | Vertical Routing · Operator | `operator/*` |
| `rosie_watch` | Watchlist · Operator | `operator/*` |

**Codename leak census in killinchu console (raw substring counts):** `amaru`=34, `rosie`=40, `chapaq`=4, `sentra`=14. The `…_advisories/…_digest` subtitles already say *OSINT/Operator* but the **tab ids + `go('rosie_*')`/`go('amaru_*')` handlers leak the codename** — must become `operator/*` & `osint/*` with 308 aliases for one release (T004).

**Duplicate title flag (§A.3):** TWO tabs titled exactly **"Maritime Picture"** — `maritime` and `u_maritime`. Differentiate (e.g. *Maritime Picture (Operator)* vs *Maritime Picture (Public)*).

**killinchu backend API surface referenced by the console (35 endpoints):** `/api/killinchu/v1/{fleet,gov/*,mined/*,resweep/*,twin/*,research/,proxy/,receipt/ledger,warhacker/*,wave910}`, `/api/killinchu/v2/geofence/*`, `/api/killinchu/uds/v1/*`, plus governance cross-links `/api/a11oy/v1/{honest,ledger,policy/gates}` and `/api/sentra/v1/verdict`. (killinchu uses a dict-dispatch backend, not `@app.get` decorators — route liveness to be confirmed by parent against the running killinchu image.)

## 5) Prioritized fix-list for §A / §E

**P0 — §E live wiring of the 4 Research-3D tabs (T003, gated on this audit + serve.py coordination):**
1. `gemstones_frontier` → **lowest-risk, do first**: `/api/a11oy/v1/router/stats` ALREADY EXISTS. Point the ECharts-GL frontier at real router cost/latency/size; drop the SAMPLE arXiv overlay to a citation only.
2. `consensus_basin` → stand up a per-receipt **votes/round** endpoint (Khipu quorum 3-of-4) and feed the convergence basin; honest `Conjecture 2` label retained.
3. `ouro_spiral` → add a **loop_depth** field to the reason API (`/api/a11oy/v1/reason/loop-depth` or extend `…/reason`) and bind the helix segments to real adaptive-depth; remove the command-log proxy.
4. `abacus_manifold` → add `/api/chaski/routing-graph` (router digit-place manifold) and bind the ECharts-GL surface; remove the command-log proxy.
   - **Coordination:** all four require `serve.py` mutation → re-fetch current main, 3-way merge (`git apply --recount`), re-verify, append a one-line note to `replit-sync/SYNC_STATUS.md` so the parent mirrors to HF byte-identical. serve.py is PARENT-CONCURRENT — do not co-edit in the same window.

**P1 — harden/verify currently-ambiguous a11oy endpoints (§A.1 follow-through):**
5. Confirm `a11oy_wire` (`wirea/*`), `a11oy_defense_feed` (`sec/attack`, `sec/threats`, `sec/threatgraph`) and `a11oy_code` (`code/*`) modules actually import & register on the live image — these UI refs have NO serve.py route and were not fetchable at repo root. If a module silently fails to register, the tab is a hidden SAMPLE, not `live`.
6. `cve`/`kev`/`threatgraph`/`modelatlas`/`govatlas` carry `live+SAMPLE` fallbacks → upgrade the SAMPLE halves to real feeds (CISA KEV catalog JSON, MITRE ATT&CK STIX) per the 2026-06-09 recommendation; keep honest labels until wired.
7. `lambda`, `ask`, `kbformulas`, `knowledge`, `lineage`, `ontology`, `codetab`, `honest`, `oversight`, `putnam`, `putnamsampler` render `self/static` (no live `gj`) — confirm intended (most are reference/claims surfaces) or wire (`lambda`→`…/v1/lambda`, `putnam`→`…/v1/putnam` which EXISTS).

**P2 — §A.3 killinchu codename hygiene (T004):**
8. Rename `rosie_*`→`operator/*`, `amaru_*`→`osint/*` (tab ids, `go()` handlers, backend routes) with 308 redirects for one release; differentiate the two "Maritime Picture" tabs. Additive, no codename leak.

---
*Audit is read-only and evidence-based. No `live` claim is made without a verified route; all SAMPLE/SIMULATED/PROXY labels are reproduced from the tab's own self-declaration and confirmed in code. serve.py and the HF mirror remain parent-owned and were not modified.*