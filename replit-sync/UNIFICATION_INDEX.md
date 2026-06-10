<!--
  UNIFICATION_INDEX.md — CANONICAL entry point (MAP/DATA only; do NOT edit app code)
  Author: Opus 4.8 unification engineer (subagent) · 2026-06-08
  Consumers: a11oy + killinchu app devs. Read this first; it indexes the 3 map files
  and flags the top-10 "instill these next" items. Two devs are LIVE-editing a11oy —
  these files touch NO code; they are the instruction set for what to wire.
-->

# UNIFICATION INDEX — the canonical map set

This is the single entry point to the org-wide unification. It indexes three map files and
flags the **top-10 instill-next** items. Every claim is honest: **locked proven = exactly 5**
{F1, F11, F12, F18, F19}; **Λ = Conjecture 1** (unconditional uniqueness machine-checked FALSE);
**Khipu BFT safety = Conjecture 2, OPEN**; F12/F19 = additive fragment only; SLSA L1 honest · L2 build-attested on container images (verifiable; bundle-level = roadmap); L3 roadmap.
Source of truth: [PROVEN_STATE_CANONICAL.md](./PROVEN_STATE_CANONICAL.md) · [lutar-lean PROVEN_FORMULAS.md](https://github.com/szl-holdings/lutar-lean/blob/main/PROVEN_FORMULAS.md).

## The three maps
1. **[UNIFICATION_FORMULA_ORGAN_MAP.md](./UNIFICATION_FORMULA_ORGAN_MAP.md)** — every proven / CI-green formula → organ (HEART/YUYAY · BRAIN/YACHAY · CIRCULATORY/YAWAR · NERVOUS/OTel · SKELETON/services), with Lean name, plain meaning, maturity tier, source repo/file.
2. **[UNIFICATION_CAPABILITY_TAB_MAP.md](./UNIFICATION_CAPABILITY_TAB_MAP.md)** — all 28 org repos → which a11oy tab + which killinchu tab, with the real endpoint/module that exists (or `needs wiring`).
3. **[UNIFICATION_RESEARCH_CITATIONS.md](./UNIFICATION_RESEARCH_CITATIONS.md)** — external papers/repos (real URLs) backing each adopted formula; `[ADOPTED]` / `[CITED]` / `[REFERENCE ONLY]` + license per repo.

## Organ ↔ repo ↔ proven-anchor at a glance
| Organ (Quechua) | Decision role | Home repos | Proven anchor (honest) |
|---|---|---|---|
| **HEART — YUYAY** | the Λ-gate / ALLOW–DENY | a11oy + lutar-lean + ouroboros | **F1 LOCKED** + **P2 gate-soundness** (CI-green); Λ = **Conjecture 1** (conditional axiom-free results are the strongest claim) |
| **BRAIN — YACHAY** | reasoning / knowledge corpus | szl-lake + lutar-lean/lean-kernel + szl-papers | **F11 LOCKED**, **F12 LOCKED (additive)** + Wave-5/6/7 + CF-21/23 (Pinsker binary), all CI-green |
| **CIRCULATORY — YAWAR** | receipt bus (DSSE/Merkle) | szl-lake + ouroboros | **F18 LOCKED** + **P1/P4/P6** (CI-green); **P5 axiom-gated** |
| **NERVOUS — OTel** | Λ-signed telemetry | vsp-otel + uds-mesh | **P3 non-interference** (CI-green, Goguen–Meseguer); span Λ-floor 0.90 operational |
| **SKELETON — services** | consensus / runtime / MCP / mesh | khipu-consensus, ouroboros, hatun-mcp, szl-mesh | **F19 LOCKED (additive)**; Khipu 3-of-4 quorum (non-Byz, CI-green); **BFT safety = Conjecture 2 OPEN** |

## The 28 repos, bucketed
- **Core organs (12):** a11oy, killinchu, ouroboros, khipu-consensus, hatun-mcp, szl-mesh, uds-mesh, vsp-otel, szl-lake, lutar-lean, lean-kernel, szl-papers.
- **Platform/build/deploy (5):** platform, szl-build-env, szl-fleet-overlay, uds-bundles, szl-uds-deployment.
- **Trust/doctrine/dev/demo (7):** szl-doctrine, szl-trust, szl-cookbook, docs-site, developers, warhacker-demo, lambda-bounty.
- **Site/brand/collateral/org (4):** szlholdings-site, szl-brand, pitch-collateral, .github.

---

## 🔝 TOP 10 — instill these next (ranked; for the app devs)

> Ordered by leverage. Each names the **tab**, the **real source**, and the **honest label** required.
> None require new proofs; all are wiring of existing, honest assets.

1. **HERO "Provable Interdiction" trace** — a11oy `mission`/`lambda` + killinchu ROE+Consensus. Live decision → Λ-receipt → click → exact Lean theorem id (CF-/CUT-) + kernel sha (`c7c0ba17` locked-5 / `044eb098` experimental) + `#print axioms` clean assertion + Zenodo DOI. Sources: lutar-lean (theorem), lean-kernel (sha), szl-lake (receipt), knowledge.json (trace map). **Label each cited theorem locked / conditional / conjecture.** *(no competitor can trace a live decision to a machine-checked proof — the lean-forward moment.)*
2. **Tamper demo** — a11oy `chain`/`receipts` + killinchu DSSE Verifier. Button "Tamper a receipt" → hash chain visibly REJECTS in 3D. Source: szl-lake DSSE chain + `szl_dsse.py`. **Label: P5 tamper-evidence is axiom-gated on collision-resistance (FIPS 180-4).**
3. **Determinism demo** — a11oy `replay` + killinchu Replay. "Run this governed decision 5×" → byte-identical Merkle roots. Source: szl-trust replay artifacts + `ayni_os`/`replay_api.py` (axiom A5). **Label "measured", not "proven".**
4. **GraphRouter-cited Model Router Pareto** — a11oy `llm`/`modelatlas` (+ killinchu Model Atlas). Show (effect, cost, latency) per open model + cost-vs-effect Pareto; Λ-gate as the governance overlay. Source: `szl_budget_router.py` + `szl_llm_registry.py`. **Cite GraphRouter (ICLR'25, MIT) + Router-R1 (Apache-2.0); "best GOVERNED LLM" — no frontier-weights claim.** Currently `needs wiring`.
5. **killinchu UDS-Edition deploy native-ness** — killinchu Deploy. Surface `zarf.yaml` (3 flavors) + Pepr `szl-governance` receipt-gate + OSCAL/Lula compliance (AU-10/SI-7/AC-4/CM-3/AU-3). Sources: szl-fleet-overlay, uds-bundles, szl-uds-deployment. **uds-core AGPL = pattern-only; non-affiliation NOTICE intact; implementation-status honest (partial/planned where no backend).**
6. **Living Anatomy tab (both apps)** — a11oy `organism` + killinchu Anatomy. Embed the szl-brand anatomy 3D showing a11oy+killinchu as ONE governed organism, the proven formulas living in their organs (use this map's tiers as the per-organ labels). Source: `szl_anatomy_3d.py` + `szlholdings-anatomy.static.hf.space`.
7. **Fleet Health & Governed C2** — a11oy `fleet` + killinchu Live Track Board. 3D drones/vessels w/ color-coded subsystem health (inferred, labeled), hack-detect via Λ-gate + signed receipt, governed command console. Sources: killinchu fleet/drone routes + wcrum/py-cot (Apache-2.0). **Effector link = "command demonstration"; CoT/AIS feeds = SAMPLE/replay.**
8. **Business Observability 5-domain spine** — a11oy `business`. Reframe REAL data as Coverage (governed spans) → Connectivity (live feeds) → Cognitive (Λ-gate + router) → Executive (console tabs) → Impact (economic line). Data hooks exist; the 5-domain grouping is `needs wiring`. **Make it ours with the proof backbone competitors lack.**
9. **Knowledge Ontology ↔ live formula maturity** — a11oy `ontology`/`kbformulas` + killinchu Edge Formulas. Render the axiom→theorem→formula graph from knowledge.json with the **honest maturity tier** from the Formula→Organ map on every node (LOCKED=5 highlighted, Λ flagged Conjecture 1, CF-* = CI-green-experimental). Source: `knowledge.json` + `szl_puriq_formulas.py`.
10. **Economic-thesis one-liner on every surface** — both apps, footer/header. *"Every autonomous engagement carries court-admissible cryptographic provenance — governed-provable AI de-risks ROE/liability exposure."* Source: FRONTIER_GAPS objective 4. The Series-A "so what" wedge; engineers already have the proofs.

---

## Honesty guardrails (apply to ALL instill work — gate before shipping)
- locked-proven = **exactly 5**; never inflate.
- Λ = **Conjecture 1** (unconditional uniqueness machine-checked FALSE; conditional results are axiom-free + cited).
- Khipu **BFT safety = Conjecture 2, OPEN**; P5 = axiom-gated; F12/F19 = additive fragment only.
- SLSA **L1 honest · L2 build-attested** on container images (verifiable; bundle-level = roadmap). Not Iron Bank/FedRAMP/CMMC/ATO; SLSA L3 roadmap.
- uds-core **AGPL = pattern-only**, no code; Defense-Unicorns **non-affiliation NOTICE** intact.
- Real data only (live feeds OK; CoT/AIS/forecast SAMPLE labeled). 3D only where real data backs it. 0 CDN.
- User-visible labels use plain words (Trust score, Signed receipt, Consensus, Forecast) — no Λ/Khipu/DSSE jargon.
- Cite real URLs only (see RESEARCH_CITATIONS). No fabricated proofs, certifications, or affiliations.

## Provenance of this map set
- 28 org repos read via GitHub API (`team/repo_structure.json`); live `knowledge.json` v6.0.0 (100 formulas / 9 axioms / 4 theorems) at `team/knowledge_live.json`.
- Proven state from PROVEN_STATE_CANONICAL.md + lutar-lean/PROVEN_FORMULAS.md; DU + research findings from DU_DEEPDIVE_FINDINGS.md; frontier objectives from FRONTIER_GAPS.md; tab ids from A11OY_TABS_LIVE.txt + A11OY_30_TAB_CANONICAL.md + KILLINCHU_FRONTIER_TABS_REPORT.md.
- External citations confirmed against arXiv/DOI/GitHub this session.
