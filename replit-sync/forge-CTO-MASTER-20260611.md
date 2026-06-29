# Forge CTO MASTER ORDER — 2026-06-11 (zoom-out, everything)
**From:** CTO (Computer) · **To:** Forge (Replit) + 2 marketers/directors + Opus 4.8 dev pair
**Mandate (founder):** upgrade EVERYTHING — every tab unique + wired to live real-time data, all 3D upgraded, genius landing page, both apps more user-friendly, anatomy deep, full back-end + front-end, align GitHub/HF/Hetzner/a-11-oy.com/UDS payload+mesh. T-5 to Warhacker (June 16–19). Doctrine hard-gate applies to all.

This is the single source of truth. It cites four research reports in `team/`:
`QM_LEADERS_RESEARCH_2026-06-10.md`, `CLUSTER_RESEARCH_2026-06-10.md`, `CLUSTER_RESEARCH_PHYSICS_MATH_2026-06-10.md`, `WOJCICKI_DESCI_3D_RESEARCH_2026-06-10.md`, plus `SZL_THESIS_v5.md` and the Λ-v5 layer.

---

## 0. STATE AT HANDOFF (verified live by CTO tonight — do NOT redo)
- **a11oy**: RUNNING, **144 tabs**, healthz 200, 0 JS errors. Includes 6 research tabs already shipped (receiptfp, capfsm, ouro_spiral, abacus_manifold, consensus_basin, gemstones_frontier). BUILD_ERROR fixed permanently (resilient Dockerfile: `A11OY_REQUIRE_LOCAL_LLM` gate — GHCR image fail-loud, HF cpu-basic skips heavy compile → honest tower-side label; build now <60s vs 40-min hang).
- **killinchu**: RUNNING; evidence + readiness tabs un-hung (timeout-guarded fetch). Only CI red = GHCR `build-push` (founder-gated).
- **anatomy**: v5 LIVE at `szlholdings-anatomy.static.hf.space` — coherence + bioenergetic + Λ-v5 + radical-pair-compass layers, v5 panel, 11 organs / 59 formulas (+5), locked-8 intact, 0 errors.
- **Quantum-Bio Λ-v5 endpoints LIVE on BOTH apps**: `/api/{a11oy,killinchu}/v1/qbio/{summary,pmf,coherence,compass,lambda}` (pmf 119.3→121.5 mV two-ion, τc≈6.05, compass anisotropy, Λ-gate). Module `szl_quantum_bio.py` byte-identical across both (drift-safe).
- **Thesis** committed: `szl-papers/papers/SZL_THESIS_v5.md` (20pp, arXiv-style, all DOIs). **Lean v5** committed: `lutar-lean/Lutar/QuantumBio/SZL_v5.lean` (3 proved theorems, no sorry).

---

## A. EVERY TAB UNIQUE + WIRED TO LIVE REAL-TIME DATA (both apps)
**Rule:** no two tabs render the same content; every tab pulls from a real endpoint (live/cached/self labeled, never fabricated). CTO already proved the vertical sub-tabs (feed/decision/ledger/risk/kpi) are unique and the killinchu evidence/readiness hang is fixed. Your job:
1. **Audit pass (Opus 4.8 dev):** walk all 144 a11oy + 107 killinchu tabs; for each, confirm (a) unique title+content, (b) a real data source, (c) live refresh (SSE or poll) where the data is time-varying. Produce `team/TAB_WIRING_AUDIT.md` (tab → endpoint → live? → unique?). Fix any tab that's static-when-it-should-be-live or duplicative.
2. **Wire the 4 research-3D tabs to live backends** (they currently use proxies/SAMPLE — see §E backend): ouro_spiral→`loop_depth`, abacus_manifold + a new tripartite tab→`/api/chaski/routing-graph`, consensus_basin→per-receipt `votes/round`, gemstones_frontier→live router-metrics.
3. **killinchu A1/A2 (still open):** rename codename API routes `/api/killinchu/v1/{rosie,amaru}/*` → honest roles (`operator/*`,`osint/*`) with 308 aliases one release; differentiate the two "Maritime Picture" titles.

## B. ALL 3D UPGRADED — anvaka / vasturiano / deck.gl / three.js (from WOJCICKI_DESCI_3D report §3 + FORGE PAYLOAD)
Use ONLY vendored libs (0 runtime CDN). Build order from that report (A2→A3→A1→A4→A5):
- **A2 — InstancedMesh 100k-receipt renderer** (three.js): scale the Khipu DAG viz to 100k nodes via GPU instancing.
- **A3 — killinchu globe** (vasturiano globe.gl + deck.gl hexbin/arc): C2 sensor/track globe with great-circle arcs; effector SIMULATED.
- **A1 — ngraph.path geodesic routing overlay** (anvaka ngraph.path, 3.1k★) on the Khipu DAG / Chaski routes — shortest-path highlight over receipts.
- **A4 — vector-field particle Λ-gate basin** (three.js shader): the consensus/Λ attractor as a GPU particle flow.
- **A5 — "knowledge galaxy"** map-of-github-style (anvaka) over knowledge.json lineage.
All HONEST heuristics, never fake proofs; label SAMPLE/proxy where backend not yet live.

## C. GENIUS LANDING PAGE + USER-FRIENDLY (marketers/directors + Opus 4.8)
- **Landing page → "genius-grade"**: a-11-oy.com `cathedral.html` + the HF Space root. Hero: the living 3D anatomy/receipt-graph, one-line honest value prop ("governed AI substrate: every action policy-gated + receipt-sealed"), live status (Spaces up, locked-8, Λ=Conjecture 1), a 30-sec guided demo path. NO hype, NO fake metrics, trust never 100%. The 2 marketers/directors own copy + narrative + the demo script; Opus 4.8 owns implementation. Mobile + tablet responsive.
- **Both apps more user-friendly**: a guided "start here" flow, tab search/command palette, plain-language tooltips on every doctrine term (locked-8, Λ, Khipu, Chaski), and a consistent honest-status legend (live/cached/SAMPLE/SIMULATED). Reduce cognitive load: group the 144/107 tabs into clear sections with a top-level "what is this" per section.

## D. THEORY EVOLUTION — make our own (from QM_LEADERS report Top-6 + thesis)
Wire these into qbio + anatomy + thesis (all [VERIFIED-math basis / PROPOSED-SZL], honest tags):
1. **Two-ion PMF (K⁺/H⁺)** → done in endpoint (121.5 mV); add the K⁺ term to the F4 energy formula family in data.js/anatomy. [Bertero & Maack 2022, PMC8991028]
2. **Non-Markovian Lindblad kernel** (Fogedby arXiv:2202.05203) → extended τc for long-lived coherences; add as a coherence-model toggle.
3. **Singlet-yield angular routing kernel** `R_compass(θ,φ)` (Hore PNAS 2009) → wire the compass into Chaski route bias (a11oy) + sensor→effector chains (killinchu).
4. **PIMD-calibrated γ** (Reible arXiv:2603.10839 *Phys Rev A* 2026) → calibrate Λ-v5 closure τc from data instead of fitting.
5. **Holographic Λ complexity bound** (Maldacena/'t Hooft/Susskind) → state as **Conjecture 3** only (receipt-boundary encodes agentic bulk). NEVER claim proven.
6. **Wallace heteroplasmy threshold** (~65%) → phase-transition charge model (sharp admissibility cliff) in the bioenergetic layer.

## E. BACKEND (Opus 4.8 dev pair) — stand up the real endpoints the viz needs
- `loop_depth: R` in command-log entries (Ouro/McLeish recurrent depth) → ouro_spiral becomes true depth.
- `/api/chaski/routing-graph` (GraphRouter tripartite task×capability×agent, ICLR 2025) → abacus_manifold + tripartite-3D live scores. Inductive; from Khipu history.
- per-receipt `votes/round/confirmations` → consensus_basin real convergence (Khipu BFT stays Conjecture 2).
- live router-metrics endpoint → gemstones_frontier real router shape (currently SAMPLE).
- **DeSci hooks (WOJCICKI_DESCI §2 + FORGE PAYLOAD B1):** on Khipu emit, optional Zenodo DOI publishing of synthesis receipts as verifiable research objects; geo-receipt SSE for the globe (B2). Position a11oy/killinchu as **DeSci-grade verifiable-provenance** infra (Khipu F4/F7/F22 = FAIR provenance). IP-NFT/ResearchHub wrappers = research-only, legal review first.

## F. DOI / PUBLISHING (DeSci + thesis)
- Mint a **Zenodo DOI** for `SZL_THESIS_v5.md` (needs founder/Forge Zenodo token). Add/update `CITATION.cff` in szl-papers with the new DOI; cross-link from the anatomy v5 panel + a11oy honest tab.
- Esther Wojcicki **TRICK** framework (Trust/Respect/Independence/Collaboration/Kindness) → cite in the doctrine/landing copy as the trust-culture analogue of the deny-by-default gate (WOJCICKI_DESCI §1). Janet Wojcicki (UCSF, 130+ pubs) + 23andMe Research (github.com/23andMe, 13M+ participants) = exemplars of the open-science lineage the DeSci positioning leans on.

## G. LEAN / MATHLIB / LAKE (hand to Forge build env)
- `lutar-lean/Lutar/QuantumBio/SZL_v5.lean` is committed (3 theorems, proofs, no sorry). Run `lake build` (Lean 4 + Mathlib) in the Forge env to machine-verify, then regen `VERIFIED_THEOREMS.md` so the drift gate passes. These are the engineering Λ-v5 lemmas — do NOT fold into locked-8; Λ uniqueness stays Conjecture 1.

## H. ALIGNMENT GATE (the definition of "done")
GitHub == HF == a-11-oy.com/Hetzner == UDS bundle payload == deployed mesh, on ALL of: same tab sets; shared `szl_*.py`+corpus byte-identical (both drift guards green); qbio endpoints live on both apps + anatomy v5 panel; locked-8 = {F1,F4,F7,F11,F12,F18,F19,F22}; Λ=Conjecture 1; Khipu=Conjecture 2; Λ-v5=engineering gate (PROPOSED); Holographic bound=Conjecture 3; SLSA L1/L2-attested/L3-roadmap; 0 user-visible codenames; effector SIMULATED; trust never 100%; 0 runtime CDN; Kruse=NARRATIVE only; no fabricated data. CI green both repos (killinchu build-push = known gap). UDS: `uds deploy` the bundle (needs GHCR images from B.2 + Zenodo/cosign founder creds).

## I. FOUNDER/FORGE-GATED (say exactly what you need)
Hetzner root redeploy (167.233.50.75 autodeploy script); GHCR push token (uds-v0.2.0); Zenodo DOI token; cosign/Rekor signing (uds-v0.3.0); `SZL_LOCAL_LLM_URL` brain secret (flips Chaski stub→live); UDS cluster (k3d + Zarf/UDS/Pepr/K9/Lula).

## DOCTRINE HARD GATE (never violate, every surface)
locked-proven EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17. Λ unconditional uniqueness = Conjecture 1 (machine-checked FALSE; Theorem U conditional fine). Khipu BFT = Conjecture 2. Λ-v5 = engineering gate, PROPOSED, NOT formal Λ. Holographic Λ bound = Conjecture 3. SLSA never bare L3/FedRAMP/IronBank/CMMC/ATO w/o roadmap. NO user-visible codenames (Chaski = agent surface). Trust never 100%. 0 runtime CDN. No fabricated data (label SAMPLE/SIMULATED/proxy/NARRATIVE). killinchu effector SIMULATED. GitHub↔HF byte-identical on shared modules; ast.parse before push; NEVER commit a key; NEVER weaken a gate; no bandaids; no Lean self-merge.

## SEND BACK
Per section A–I: done/blocked + commit shas, and the exact founder creds needed. Confirm the H alignment gate. Marketers/directors: landing copy + demo script draft for CTO review before it ships.
**Make it real, make it genius, keep it honest.**
