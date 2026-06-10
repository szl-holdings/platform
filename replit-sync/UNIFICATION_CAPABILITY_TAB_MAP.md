<!--
  UNIFICATION_CAPABILITY_TAB_MAP.md — CANONICAL (MAP/DATA only; do NOT edit app code)
  Author: Opus 4.8 unification engineer (subagent) · 2026-06-08
  Consumers: a11oy + killinchu app devs (two devs live-editing a11oy — this file does NOT touch code).
  Maps every ORG-REPO capability → which a11oy tab + which killinchu tab should expose it,
  naming the REAL endpoint/module that already exists, or marking 'needs wiring'.
  Tab ids confirmed from team/A11OY_TABS_LIVE.txt (44 nav ids) + A11OY_30_TAB_CANONICAL.md
  and KILLINCHU_FRONTIER_TABS_REPORT.md (killinchu /elite console, 25 tabs).
  HONESTY: Λ=Conjecture 1; locked=5; BFT=Conjecture 2 OPEN; no jargon in user-visible labels.
-->

# UNIFICATION: Capability → Tab Map (a11oy + killinchu)

For each of the 28 org repos, this maps its capability to the **a11oy tab** and the **killinchu tab**
that should expose it, with the **real endpoint/module** that already exists in-image (or `needs wiring`).
Endpoint/module names are taken from the live repo top-levels surveyed via the GitHub API
(`team/repo_structure.json`) and the a11oy/killinchu file listings.

**Tab-id legend (a11oy live nav ids):** `command, ask, demo, organism, ledger3d / chain / receipts, pulse, trustspace, knowledge / ontology, kbformulas, lambda, policies / verticals, govern / govatlas, gates, feed / decision, forecast, mission, replay, threats / threatgraph / attack, cve, kev, arena, llm / modelatlas, mcp, melt, mesh, business, honest, deploy, codetab, lineage, oversight, fleet, warboard`.
**killinchu `/elite` console:** 25 tabs incl. Live Track Board, Sensor-Fusion, ROE, 13-axis Λ (Trust), 3-of-4 BFT (Consensus), DSSE Verifier (Receipts), PQC, Geofence, Swarm, Threat DB, Mesh, Model Atlas, MELT, Forecast, Anatomy.

---

## A. CORE GOVERNED-AI ORGAN REPOS → tabs

| # | Repo (license) | Capability | a11oy tab → real endpoint/module | killinchu tab → real endpoint/module |
|---|---|---|---|---|
| 1 | **a11oy** (Apache-2.0) | The orchestrator app itself — Command Center, Ask & Act, governed loop. | **Command Center** (`command`) → `serve.py`, self/organ APIs; **Ask & Act** (`ask`) → `/ask` + `/act` (`operator_shell_v4.py`, `szl_governance_gateway.py`) | (consumes a11oy as the shared brain) — killinchu **Mesh** egress → a11oy `:8080` consensus fan-out |
| 2 | **killinchu** (Apache-2.0) | Counter-UAS / fleet field app — ROE, sensor-fusion, interdiction receipts. | (a11oy embeds killinchu fleet view) **Fleet Health & Governed C2** (`fleet`) → `szl_v4_fleet.py` | **Live Track Board / ROE / Sensor-Fusion** → `killinchu_drone_routes.py`, `/roe/evaluate`, `killinchu_fusion.py`, `killinchu_kalman.py` |
| 3 | **ouroboros** (Apache-2.0) | Bounded-recursion runtime; dual-witness emitters; governance budgets. | **Governed Decision** (`govern`/`decision`) → `szl_agentic_loop.py`, `OUROBOROS_RUN_ALL.py` | **ROE / Ops Control** → `szl_agentic_loop.py`, `killinchu_ops_control.py` |
| 4 | **khipu-consensus** (Apache-2.0) | BFT 3-of-4 multi-party-witnessed agreement (ECDSA-P256 over DSSE). | **Mesh & Consensus** (`mesh`) → `szl_khipu_consensus.py`, `szl_ayni_quorum.py`; **Signed Receipts** (`receipts`) | **Consensus** (3-of-4 BFT tab) → `szl_khipu_consensus.py` + POST `/receipt/emit` (label BFT safety = Conjecture 2 OPEN) |
| 5 | **hatun-mcp** (Apache-2.0) | Doctrine-aware MCP server; 17 governed `szl_*` tools; DSSE-signed. | **Agent Tools / MCP tools** (`mcp`) → `mcp/`, `hatun_mcp` tool registry | **MCP tools** → killinchu service-derived tools surfaced via hatun-mcp (`szl_lambda_quorum`) |
| 6 | **szl-mesh** (Apache-2.0) | Doctrine-pinned CRDT mesh on peat; air-gapped fleet sync + 3-of-4 quorum. | **Mesh & Consensus** (`mesh`) → `szl_mesh.py` consumer / mesh graph viz | **Mesh** (CRDT fleet sync tab) → `szl_khipu_replicate.py`, mesh proto |
| 7 | **uds-mesh** (Apache-2.0) | Cross-component OTel span schemas + DSSE receipts onto Khipu Merkle DAG (Layer 5). | **MELT / Observability** (`melt`) → `vsp_otel/`, `szl.mesh.*` span ingest | **MELT** (service-graph observability) → `vsp_otel/`, cross-service span envelope |
| 8 | **vsp-otel** (Apache-2.0) | Λ-signed OTLP exporter (Layer 4); fail-closed span gate; DSSE-signs survivors. | **MELT / Observability** (`melt`) → `vsp_otel/lambda_gate.py` (`/v1/traces`, `/healthz`, `/metrics`) | **MELT** → `vsp_otel/` Λ-span gate + Welford/HLL stats |
| 9 | **szl-lake** (CC-BY-4.0) | Append-only DSSE receipt store (Merkle DAG); HF dataset canonical. | **Receipt Ledger** (`ledger3d`/`chain`) → `szl_lake_query.py`, `szl_dsse.py`, `knowledge.json` lineage | **DSSE Verifier / Receipts** → `dsse/`, `szl_lake_query.py` (receipt PASS / tamper-FAIL) |
| 10 | **lutar-lean** (Apache-2.0) | Lean 4 + Mathlib Λ formalization; the 5 locked formulas + all waves. | **Formulas** (`kbformulas`) → `szl_puriq_formulas.py`, `szl_formulas.py`; **Knowledge Ontology** (`ontology`/`knowledge`) → `knowledge.json` | **13-axis Λ (Trust) / Edge Formulas** → `killinchu_edge_formulas.py`, `szl_formula_wiring.py` |
| 11 | **lean-kernel** (Apache-2.0) | Live Lean v4.13.0 kernel (749/14/163), source-mirrored from HF. | **Lambda** (`lambda`) → `lean_wire.py` (`#print axioms` / kernel sha trace); **Formulas** lineage | **13-axis Λ** → `szl_formula_signatures.py` lean-receipt trace (theorem_ref) |
| 12 | **szl-papers** (CC-BY-4.0) | Academic corpus — preprints, thesis lineage, bounty problems, prior-art. | **Knowledge Ontology** (`ontology`) + **What We Claim** (`honest`) → `szl_math_corpus.py`, thesis DOIs | **Anatomy / About** → citation links (Zenodo DOIs) — `needs wiring` for live preprint list |

---

## B. PLATFORM / RUNTIME / BUILD REPOS → tabs

| # | Repo (license) | Capability | a11oy tab → endpoint/module | killinchu tab → endpoint/module |
|---|---|---|---|---|
| 13 | **platform** (NOASSERTION → treat as internal monorepo) | Substrate runtime, agentic loops, MCP server (11 tools), CI gates, reusable workflows. | **System Health** (`command` sub) + **Deploy** (`deploy`) → `platform-services/`, `infra/` | **Ops Control / Deploy** → shared substrate; mostly internal, surface via STATUS |
| 14 | **szl-build-env** (Apache-2.0) | kind + Istio ambient mesh + OTel Collector + 5-organ stack w/ cosign verify gate; <10-min quickstart. | **Deploy** (`deploy`) → quickstart link / `infra/`; **System Health** reachability | **Deploy** (UDS Edition quickstart) → k3d local-try path (mjnagel idiom); `needs wiring` for in-app button |
| 15 | **szl-fleet-overlay** (Apache-2.0) | UDS Operator packages + Helm + Zarf bundle + peat-mesh nodes for the 5 surfaces. | **Deploy** (`deploy`) → Zarf/Helm artifact links | **Deploy / UDS Edition** → `zarf.yaml`, `uds-bundle.yaml`, chart — the DU-native deploy story |
| 16 | **uds-bundles** (Apache-2.0) | UDS Zarf bundles for a11oy + killinchu (airgap, cosign-signed; SLSA L2 build-attested on container images (verifiable; bundle-level = roadmap)). | **Deploy** (`deploy`) → bundle manifests | **Deploy / UDS Edition** → `bundles/`, `uds-bundle.yaml` |
| 17 | **szl-uds-deployment** (Apache-2.0) | Live UDS governance-receipt deploy (k3d + uds-cli + Pepr DSSE policy, cosign-verified) + OSCAL/Lula compliance. | **Readiness & Compliance** (maps to `govatlas`/`oversight`) → `compliance/oscal-component-a11oy.yaml` | **Readiness & Compliance / DSSE Verifier** → `compliance/oscal-component-killinchu.yaml` + Lula validations |

---

## C. TRUST / DOCTRINE / DEVELOPER / SITE REPOS → tabs

| # | Repo (license) | Capability | a11oy tab → endpoint/module | killinchu tab → endpoint/module |
|---|---|---|---|---|
| 18 | **szl-doctrine** (Apache-2.0) | Org-wide doctrine + governance workflows (secret-health, etc.); the 8 forbidden patterns. | **Safety Gates** (`gates`) → `gates_manifest.json`, `policies/`; **What We Claim** (`honest`) | **ROE / Safety** → doctrine-pinned policy refs; `roe/policy` |
| 19 | **szl-trust** (CC-BY-4.0) | Public Trust Portal — Covenant Proof Standard run artifacts + deterministic replay receipts. | **Signed Receipts** (`receipts`) + **Replay** (`replay`) → `szl_demo_freeze.py`, run artifacts; **Trust Score** (`trustspace`) | **DSSE Verifier / Replay** → deterministic-replay receipt demo (A5, label "measured") |
| 20 | **szl-cookbook** (Apache-2.0) | Recipes / how-to guides + skills for governance infra. | **Demo / Run a Demo** (`demo`) → recipe-backed scenarios | **Demo** → `szl_killinchu_cookbook.py` recipes |
| 21 | **docs-site** (Apache-2.0) | VitePress unified docs (math-grounded, Quechua-rooted) at docs.szlholdings.com. | **What We Claim** (`honest`) + footer doc links → external docs-site URL | **About / Anatomy** → docs link; `needs wiring` for in-app embed |
| 22 | **developers** (Apache-2.0) | Developer hub — API reference for the 5 flagships, MCP integration, SDK drop-in, examples. | **Agent Tools / MCP** (`mcp`) → `MCP_INTEGRATION.md` links; API ref | **MCP tools** → developer hub API-ref links |
| 23 | **warhacker-demo** (Apache-2.0) | Sovereign Warhacker dry-run: one-command tower verify, GPU k3d + UDS deploy, airgap test, Khipu 3-of-4 kill-move. | **Run a Demo** (`demo`) → `szl_warhacker_demos.py`, `szl_warhacker_real.py` | **Warboard / Demo** (`warboard`) → `killinchu_warhacker_demos.py` (3-of-4 kill-move) |
| 24 | **lambda-bounty** (Apache-2.0) | Λ-Conjecture-1 bounty intake (verify-proof CI + webhook); canonical problem in szl-papers. | **What We Claim** (`honest`) + **Lambda** (`lambda`) → BOUNTY.md link (Λ honestly OPEN) | **13-axis Λ** → bounty link (reinforces Λ = Conjecture 1 honesty) |
| 25 | **szlholdings-site** (static) | Marketing site (static, no-CDN), szlholdings.com. | external link only — not an in-app tab | external link only |
| 26 | **szl-brand** (CC-BY-4.0) | Brand kit + **anatomy** assets + motion/mockups (the living-organism visuals). | **Living Organism / Living Anatomy** (`organism`) → `szl_anatomy_3d.py`, `szl_anatomy_routes.py`, anatomy assets | **Anatomy** (`killinchu_anatomy.py`) → embed szl-brand anatomy 3D |
| 27 | **pitch-collateral** (Apache-2.0) | Pitch deck outline, one-pager, demo scripts, outreach. | **What We Claim** (`honest`) narrative source — not a live tab | (sales collateral) — not a live tab |
| 28 | **.github** (org profile) | Org profile, cosign public keys, doctrine, provenance notice, dashboards. | **Signed Receipts** (`receipts`) → `cosign.pub` / `cosign-keys/` for verify; **What We Claim** provenance notice | **DSSE Verifier** → org `cosign.pub` for receipt verification |

---

## D. The five FRONTIER tabs (founder-approved, BOTH apps) — capability sourcing

| Frontier tab | a11oy id | killinchu id | Backing org repos / endpoints | Honesty label |
|---|---|---|---|---|
| **HERO: Provable Interdiction** (live decision → Λ-receipt → click → exact Lean theorem + kernel sha + #print-axioms + Zenodo DOI) | `mission` / `lambda` | ROE + Consensus | lutar-lean (theorem id), lean-kernel (sha trace), szl-lake (receipt), knowledge.json (KB trace map) | each cited theorem labeled locked / conditional / conjecture |
| **Tamper demo** (button → hash chain visibly REJECTS) | `chain` / `receipts` | DSSE Verifier | szl-lake DSSE chain, `szl_dsse.py` (P5 axiom-gated) | "tamper-evidence is axiom-gated on collision-resistance" |
| **Determinism demo** ("run 5×" → byte-identical Merkle roots) | `replay` | DSSE Verifier / Replay | szl-trust replay artifacts, `ayni_os`/`replay_api.py` (A5) | label "measured", not "proven" |
| **Fleet Health & Governed C2** (3D drones/vessels, hack-detect via Λ-gate + receipt, governed command) | `fleet` | Live Track Board + C2 | killinchu fleet/drone routes, wcrum/py-cot CoT/TAK (Apache-2.0) | effector link = "command demonstration"; CoT feed = SAMPLE |
| **Living Anatomy** (a11oy+killinchu as ONE governed organism, formulas in organs) | `organism` | Anatomy | szl-brand anatomy 3D (`szlholdings-anatomy.static.hf.space`), `szl_anatomy_3d.py` | honest proof labels per organ (this map's tiers) |

---

## E. Capabilities that STILL NEED WIRING (honest gaps for the app devs)
- **szl-papers live preprint list** in a11oy Knowledge Ontology / killinchu About — currently DOI links only; no live PAPERS_INDEX feed. `needs wiring`.
- **szl-build-env "try on k3d locally" button** in killinchu UDS-Edition Deploy tab — quickstart exists in repo; no in-app affordance. `needs wiring`.
- **docs-site in-app embed** (vs external link) — `needs wiring`.
- **Boss-Technology 5-domain framing** (Coverage→Connectivity→Cognitive→Executive→Impact) on a11oy **Business Observability** (`business`) tab — narrative spine approved; data hooks exist (governed spans / live feeds / Λ-gate+router / console tabs / economic line) but the 5-domain UI grouping is `needs wiring`.
- **GraphRouter-style (effect, cost) Pareto** in a11oy **Model Router** (`llm`/`modelatlas`) — `szl_budget_router.py` + `szl_llm_registry.py` exist; the cost-vs-effect Pareto viz citing GraphRouter is `needs wiring`.

> Every user-visible label must use plain words (Trust score, Signed receipt, Consensus, Forecast) — no Λ/Khipu/DSSE jargon in the UI, per doctrine.
