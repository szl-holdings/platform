# AMARU — ENDPOINT MAP (for wiring into a11oy as a "Reasoning & Readiness" section)

**Base URL:** `https://szlholdings-amaru.hf.space`
**Organ role:** Reasoner / Provenance (memory cortex).
**Health path:** `/healthz` (NOT `/api/health`).
**Doctrine (honest, must stay true):** Λ = **Conjecture 1** (never a theorem) · locked kernel **749 decls / 14 axioms / 163 sorries** @ `c7c0ba17`, doctrine v11 · SLSA **L2 build-attested** on container images (verifiable via `cosign verify-attestation`) · proved core formulas = **5** {F1,F11,F12,F18,F19}.
Probed live 2026-06-05 ~19:10 EDT. All endpoints returned HTTP 200 unless noted. NO deploy/edits made — map only.

---

## 1. FULL LIVE ENDPOINT INVENTORY

Extracted from `serve.py`, `amaru_proof_tabs.py`, `amaru_formula_endpoints.py` (`amaru_cortex_console.py` registers only an HTML console route, no APIs). Each below was curl'd live.

### GET endpoints

| Method | Path | Purpose | Compact real JSON sample (key fields) |
|---|---|---|---|
| GET | `/healthz` | Liveness + doctrine lock | `{"status":"ok","organ":"amaru","doctrine":"v11","lock":"749/14/163","commit":"c7c0ba17"}` |
| GET | `/api/amaru/v1/version` | Build/version + Λ honesty | `{"flagship":"amaru","version":"1.0.0","doctrine":"v11","declarations":749,"axioms":14,"sorries":163,"lambda":"Conjecture 1 (NOT a theorem)","slsa":"L1 (honest)"}` |
| GET | `/api/amaru/v1/honest` | Honest-disclosure labels (Λ, signatures, SLSA) | `{"organ":"amaru","doctrine_lock":{"declarations":749,"axioms":14,"sorries":163,"lambda":"Conjecture 1"},"footer":"Doctrine v11 LOCKED 749/14/163 @ c7c0ba17 · Λ = Conjecture 1"}` |
| GET | `/api/amaru/v1/lambda` | **Trust gate: 13-axis scores + aggregate vs floor** | `{"trust_axes":13,"axes":[{"name":"soundness","score":0.92},…13 total],"lambda":0.919908,"lambda_floor":0.9,"pass":true,"aggregate":"geometric mean (13-axis)","uniqueness":"Conjecture, not a Theorem"}` |
| GET | `/api/amaru/v1/brain` | Cortex card: theorems (TH1/8/10), 7 chakra **names**, canonical counts, LLM tiers | `{"brain":{"role":"cortex / reasoning","theorems":{"TH1":{"status":"CONJECTURE"},"TH8":{"status":"PROVEN"},"TH10":{"status":"CONJECTURE"}},"chakras":["root","sacral","solar","heart","throat","third_eye","crown"]},"canonical":{"declarations":749,"axioms_unique":14,"sorries":163,"policy_gates":46}}` |
| GET | `/api/amaru/v1/puriq/formulas` | PURIQ Lean formula registry (experimental scope) | `{"counts":{"proved_substantive":22,"open":0,"conjecture":1,"note":"F1–F22 sorry-free; only F23=Conjecture 1 open"},"conjecture":{"F23":"Λ-aggregator uniqueness = CONJECTURE 1 (NOT a theorem)…"}}` |
| GET | `/api/amaru/v1/formulas/index` | Wired shared-formula index (echo of a11oy) | `{"wired":[{"name":"hnsw","citation":"thesis_v22.pdf §2","lean_theorem":"…greedy_search_terminates"}],"count":1}` — **SLOW (≈6s, one timeout on retry)** |
| GET | `/api/amaru/v1/formula/hnsw` | HNSW retrieval backend status | `{"value":true,"backend_available":true,"owner_organ":"amaru","note":"FAISS present"}` — slow-ish (≈2.8s) |
| GET | `/api/amaru/v1/llm/tiers` | LLM router tier table (5 tiers) | `{"count":5,"tiers":[{"id":"claude_sonnet_4_6","rank":0,"use":"default reasoning"},…]}` |
| GET | `/api/amaru/v1/receipts` | Khipu receipt chain (DSSE) | `{"wire":"F","khipu_root":null,"nodes":[],"count":0}` — **EMPTY (0 receipts; honest UNSIGNED, no key)** |
| GET | `/api/amaru/v1/mesh/state` | Inter-organ wire status (B/C/D/E/F) | `{"wires":{"B":{"edge":"a11oy↔sentra","status":"LIVE"},"E":{"edge":"a11oy↔amaru cortex sync","status":"LIVE"},…}}` |
| GET | `/api/amaru/v1/brainz` | Self-status + traceparent + wire health | `{"ok":true,"service":"amaru","surface":"memory cortex (7 chakras)","traceparent_propagating":true,"wires":{"B":"LIVE","C":"LIVE","E":"LIVE"},"declarations":749}` |
| GET | `/api/amaru/v1/brain/sockets` | Cross-organ jack sockets (wire G) | `{"sockets":[{"target_space":"a11oy","status":"open","wire":"G"},{"target_space":"amaru","status":"self"},{"target_space":"sentra","status":"open"}]}` |
| GET | `/api/amaru/v1/cortex/3d` | Reasoning-chain graph nodes/edges | `{"graph":{"nodes":[],"edges":[]},"count_chains":0,"live":false,"note":"empty graph = IDLE (no synthetic nodes)"}` — **EMPTY until /reason is called** |
| GET | `/api/amaru/v1/cortex/ask-killinchu` | Canned answer about sibling Killinchu organ | `{"ok":true,"answer":"Killinchu is the SZL counter-UAS / drone-intelligence flagship…","url":"https://szlholdings-killinchu.hf.space"}` |
| GET | `/api/amaru/v1/rosie-companion` | Rosie co-pilot wiring (wire I) | `{"wire":"I","ops":["ponder","synthesize","evolve","brain_jack"],"honesty":"Rosie is co-pilot, not pilot"}` |
| GET | `/api/amaru/v1/proof-tabs/manifest` | Lists the 3 proof-tab POST use-cases + verdicts | `{"schema":"szl.amaru.proof-tabs.v1","substrate_ok":true,"tabs":[{"id":"readiness",…},{"id":"trajectory",…},{"id":"intel",…}]}` |

Other GET routes exist but are **HTML/UI or SSE, not JSON data** (skip for data wiring): `/`, `/operational-core[/]`, `/console[/]`, `/proof-tabs[/]`, `/explorer`, `/compute`, `/upgrades`, `/constellation-3d`, `/conduit[/...]`, and the SSE stream `GET /api/amaru/v1/cortex-subscribe` (Server-Sent Events, not request/response JSON).

### POST endpoints

| Method | Path | Purpose | Required body | Compact real JSON sample (key fields) |
|---|---|---|---|---|
| POST | `/api/amaru/v1/readiness/assess` | **Deployment-readiness gate** (HANGAR2APPS): clears/refuses on submitted records | `{"subject":str,"records":{…}}` | `{"ok":true,"assessment":{"verdict":"NEEDS_REVIEW","criteria_total":5,"criteria_cleared":0,"criteria_gaps":5,"checks":[{"criterion":"medical_clearance","result":"GAP"}…]},"grounded_confidence":…}` |
| POST | `/api/amaru/v1/trajectory/triage` | **Trajectory / anomaly triage** (Cyber RTS): checks orbital track vs envelopes | `{"track_id":str,"track":{"altitude_km":…,"velocity_kms":…,"inclination_deg":…}}` | `{"ok":true,"triage":{"verdict":"NOMINAL","flags":[],"contextualization":["altitude 420 km vs LEO 160–2000 km"]},"grounded_confidence":1.0}` |
| POST | `/api/amaru/v1/intel/answer` | **Defensible intel answer** (sources-only, refuses if unsupported) | `{"question":str,"sources":[{"text","url"}]}` | `{"ok":true,"verdict":"ANSWERED","answer":"The container build is SLSA L2 build-attested (verifiable) [s1]","citations":["s1"],"supporting":[{"support":0.5}],"grounded_confidence":0.5}` |
| POST | `/api/amaru/v1/reason` | Full reasoning w/ live arxiv citation resolution + Khipu receipt | `{"question":str}` (NOT "query") | `{"ok":true,"answer":"…theorems=['TH1','TH8','TH10']","citations":["arxiv…"],"citation_resolution":{…200},"khipu_signed":…}` — **SLOW / VARIABLE (1s–30s+, timed out once)** |
| POST | `/api/amaru/v1/brain/reason` | Lightweight reason: Λ + chakras + cited theorems | `{"query":str}` | `{"lambda":0.9,"chakras":["root",…7],"theorems_cited":{"TH1":{"status":"CONJECTURE"}},"llm_route":…}` (~1.5KB, fast) |
| POST | `/api/amaru/v1/confidence` | Hallucination-risk / confidence scorer for a claim | `{"question":str,"answer":str,"sources":[{"text","url"}]}` | `{"ok":true,"scores":{"citation_coverage":0.0,"cove_consistency":0.5,"lambda_score":1.0},"confidence":0.0008,"hallucination_risk":true,"risk_label":"HIGH"}` — **SLOW (≈23s)** |
| POST | `/api/amaru/v1/eval` | Same scorer as confidence (eval alias) | `{"question":str,"answer":str,"sources":[…]}` | similar to `/confidence` — **SLOW (≈7.7s)** |
| POST | `/api/amaru/v1/llm/route` | Honest LLM-tier routing decision (no model key wired → stub) | `{"prompt":str,"task":str}` | `{"response":"[HONEST STUB] would route to claude_opus_4_8…","tier_used":"claude_opus_4_8","tier_rank":3}` |

POST endpoints related to Rosie co-pilot and brain-jack (interactive, not core data): `/api/amaru/v1/cortex/with-rosie`, `/rosie-companion/{ponder,synthesize,evolve,brain-jack}`, `/brain/jack`, `/brain/multi-jack`, `/receipts/ingest` (ingest-only). Use only if a11oy needs the Rosie dual-answer feature.

---

## 2. TOP DEMO-WORTHY ENDPOINTS (plain-language labels + best chart)

For each: best **plain-language** section label (no jargon), the endpoint, the data to chart, and recommended chart type.

| # | Plain-language label | Endpoint | What to show | Chart type |
|---|---|---|---|---|
| 1 | **Trust score** (overall + 13 checks) | `GET /api/amaru/v1/lambda` | Big number `lambda` (0.9199) vs floor 0.9 with PASS badge; the 13 axis scores | **gauge** (aggregate vs 0.9 floor) **+ radar** (13 axes) |
| 2 | **System balance** (7 parts) | `GET /api/amaru/v1/brain` → `brain.chakras` | The 7 balance dimensions (root…crown). ⚠️ **names only, NO per-dimension scores live** — show as 7 labelled cells/legend, or omit the chart. Do NOT invent scores. | **barV / radar IF scores added** — honest note: currently labels only |
| 3 | **Readiness check** (Go / Review / No-Go) | `POST /api/amaru/v1/readiness/assess` | Cleared vs Gaps vs Failed counts; verdict badge (DEPLOYABLE / NEEDS_REVIEW / NOT_DEPLOYABLE) | **doughnut** (cleared / gap / failed) + verdict pill |
| 4 | **Flight-path check** (Nominal vs Anomaly) | `POST /api/amaru/v1/trajectory/triage` | Verdict (NOMINAL/ANOMALOUS), parameter-vs-envelope bars (altitude, velocity, inclination) | **barH** (each param vs its envelope) + verdict pill |
| 5 | **Proven formulas** (math we've verified) | `GET /api/amaru/v1/puriq/formulas` → `counts` | proved vs open vs conjecture mix. **Honest label:** core locked proved = **5**; experimental PURIQ set = 22 substantive, **1 Conjecture (F23 = Λ)** | **doughnut** (proved / conjecture) |
| 6 | **Provenance receipts** (signed audit trail) | `GET /api/amaru/v1/receipts` | Receipt count over time. ⚠️ currently **0 receipts, unsigned (no key)** — show honest "0 receipts · UNSIGNED (no key)" empty state, optionally a lineSpark once populated | **lineSpark + count** (empty-state honest now) |
| 7 | **Reasoning map** (how it connected the dots) | `GET /api/amaru/v1/cortex/3d` (after a `POST /reason`) | Reasoning-chain nodes/edges graph | **mesh3d** (empty/IDLE until a reason call runs — show honest "IDLE") |
| 8 | **Organ connections** (live wiring health) | `GET /api/amaru/v1/mesh/state` (or `/brain/sockets`) | Wire status B/C/D/E/F (LIVE vs not), organ-to-organ links | **mesh3d** (amaru at center, a11oy/sentra/killinchu nodes) **or status doughnut** |

Secondary nice-to-haves: **Confidence / hallucination risk** (`POST /confidence` → gauge of `confidence` + HIGH/LOW risk pill) and **LLM tiers** (`GET /llm/tiers` → barH of 5 tiers) — both real but `/confidence` is slow (~23s).

---

## 3. HONESTY NOTES — slow / empty / quirks

- **SLOW (>3s):**
  - `GET /api/amaru/v1/formulas/index` ≈ **6s**, and **timed out once** before succeeding on retry — treat as flaky/slow.
  - `GET /api/amaru/v1/formula/hnsw` ≈ **2.8s** (borderline).
  - `POST /api/amaru/v1/confidence` ≈ **23s**; `POST /api/amaru/v1/eval` ≈ **7.7s**.
  - `POST /api/amaru/v1/reason` is **highly variable: 1s to 30s+, timed out at 30s once** (it resolves live arxiv citation URLs). Prefer `POST /brain/reason` (~1.5s) for a fast Λ+chakras+theorems summary if speed matters.
- **EMPTY (honest, not broken):**
  - `GET /api/amaru/v1/receipts` → `count:0, khipu_root:null, nodes:[]`. No signing key wired → honest "UNSIGNED (no key)". Render an empty state, do not fake.
  - `GET /api/amaru/v1/cortex/3d` → `graph:{nodes:[],edges:[]}, live:false`. IDLE until a `POST /reason` populates a chain. Wire it to run after a reason call, else show "IDLE — no reasoning yet".
- **DATA QUIRKS:**
  - `brain.chakras` is **7 names only — no numeric scores live**. Do NOT fabricate scores for a radar/bar. Either show them as 7 labelled chips or wait until the org exposes per-chakra scores.
  - **Formula counts mismatch (document, don't hide):** the locked-doctrine "proved = 5" {F1,F11,F12,F18,F19} is the *core kernel* claim; the `/puriq/formulas` endpoint reports an **experimental, excluded-from-locked-v11** PURIQ set of 22 substantive lemmas with **F23 = Conjecture 1** (Λ). When labeling "Proven formulas," cite the experimental scope explicitly so it stays honest.
  - `/api/amaru/v1/reason` requires field **`question`** (not `query`); `/api/amaru/v1/confidence` & `/eval` require **both** `question` and `answer` (else HTTP 400 `"question and answer required"`). `/brain/reason` uses `query`.
  - `POST /llm/route` returns an **HONEST STUB** ("no model key wired in this Space"); tier-selection + Λ-receipt are real, the model response text is not. Keep the "stub" honesty if surfaced.
  - Λ `pass:true` at 0.919908 ≥ floor 0.9 — real and current. `uniqueness` field always reiterates "Conjecture, not a Theorem" — preserve that label.

---

*Map produced by amaru-visuals subagent. No files edited, no deploys performed (per CEO consolidation decision — amaru/sentra/rosie fold into a11oy). Live probe 2026-06-05.*
