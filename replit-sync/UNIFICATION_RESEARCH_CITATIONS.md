<!--
  UNIFICATION_RESEARCH_CITATIONS.md — CANONICAL (MAP/DATA only; do NOT edit app code)
  Author: Opus 4.8 unification engineer (subagent) · 2026-06-08
  Consumers: a11oy + killinchu app devs — so they can CITE adopted formulas honestly.
  Every URL/DOI below was confirmed against a primary source (arXiv/DOI/GitHub) this session
  or is carried verbatim from team/DU_DEEPDIVE_FINDINGS.md (which verified them via gh api).
  LICENSE LEGEND: ✅ adopt-with-attribution (MIT/Apache-2.0/BSD/ISC) · ⛔ AGPL/GPL = PATTERN-ONLY (no code) · ⚠️ check headers.
  ADOPTION LEGEND: [ADOPTED] technique/result instilled & cited · [CITED] named prior art, not implemented · [REFERENCE ONLY] context, not adopted.
  HONESTY: Λ=Conjecture 1; locked=5; nothing here moves those. No fabricated adoption.
-->

# UNIFICATION: External Research Citations (honest backing)

External papers / repos that back each **adopted** SZL formula or capability, so the apps cite
them truthfully. Anything not actually adopted is marked **[REFERENCE ONLY]**.

---

## 1. Λ aggregator characterization (Aczél / quasi-arithmetic means) — backs Λ conditional uniqueness

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| Aczél & Saaty (1983), *Procedures for synthesizing ratio judgements*, J. Math. Psych. 27(1):93–102 | [doi:10.1016/0022-2496(83)90028-7](https://doi.org/10.1016/0022-2496(83)90028-7) | © Elsevier (cite only) | The axiomatic characterization of the weighted geometric mean — the basis for Λ's uniqueness arguments (Set α/δ, CF-24 quasi-arithmetic). | **[CITED]** prior art for `lambda_unique_*`; we wrote our own Lean. |
| Kiss & Shulman (2026), Theorem 1.1 | [arXiv:2606.05221](https://arxiv.org/abs/2606.05221) | arXiv (cite) | Lets Set δ derive continuity "for free" — used as the declared bridge axiom `KS_theorem_1_1`. | **[ADOPTED as cited bridge axiom]** — `geomMean_unique_KS` is conditional on it (disclosed). |
| Csató (2018), pairwise-comparison aggregation | [arXiv:1706.07256](https://arxiv.org/abs/1706.07256) | arXiv (cite) | Supporting characterization context for the Λ axiom set. | **[REFERENCE ONLY]**. |

> Honesty: these strengthen the **conditional** result only. Λ unconditional uniqueness stays **Conjecture 1** (machine-checked FALSE under A1–A5). Open bounty: [lutar-lean BOUNTY.md](https://github.com/szl-holdings/lutar-lean/blob/main/BOUNTY.md).

## 2. Pinsker / KL inequalities — back CF-22 (KL-on-simplex), CF-23 (binary Pinsker), CF-21 (Gibbs/log-sum)

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| Pinsker's inequality (classical: TV ≤ √(KL/2)) | [Wikipedia](https://en.wikipedia.org/wiki/Pinsker's_inequality) · TTIC notes [PDF](https://home.ttic.edu/~madhurt/courses/infotheory2025/l5.pdf) | public | `binary_pinsker` (`2(p−q)² ≤ KL`), the long-sought CF-23 headline. **Binary only** — full Pinsker NOT proven (Mathlib v4.18.0 lacks the derivative analysis). | **[ADOPTED — binary case]**, honestly scoped. |
| Cover & Thomas, *Elements of Information Theory* (log-sum / Gibbs) | standard text (cite) | © (cite) | `log_sum_inequality`, `gibbs_inequality` (CF-21). | **[ADOPTED]** as named lemmas. |
| Marcheselli et al. (2025), *Pinsker's inequality for adapted total variation* | [arXiv:2506.22106](https://arxiv.org/abs/2506.22106) | arXiv (cite) | A modern Pinsker variant — context for the full-Pinsker roadmap. | **[REFERENCE ONLY]** (not adopted). |

## 3. GraphRouter / LLM routing (ft2023 = Tao Feng, adv. Jiaxuan You) — backs a11oy governed router

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| **GraphRouter: A Graph-based Router for LLM Selections** (Feng, Shen, You; ICLR 2025) | [arXiv:2410.03834](https://arxiv.org/abs/2410.03834) · [OpenReview](https://openreview.net/forum?id=eU39PDsZtT) · code [ulab-uiuc/GraphRouter](https://github.com/ulab-uiuc/GraphRouter) | ✅ MIT (code) | a11oy's "graph-router" thesis = routing as **edge prediction** in a task/query/LLM graph. The named prior art. | **[CITED + ADOPTABLE]** — we describe selection as edge-scoring over a model graph; we do NOT claim to have trained their GNN. May adapt graph-construction code with attribution. |
| **Router-R1** (Zhang, Feng, You; NeurIPS 2025) | [arXiv:2506.09033](https://arxiv.org/abs/2506.09033) · code [ulab-uiuc/Router-R1](https://github.com/ulab-uiuc/Router-R1) | ✅ Apache-2.0 | The router's reward decomposition (format + outcome + **cost reward**) → a11oy's honest (effect, cost, latency) scoring rubric + cost-vs-effect Pareto. | **[ADOPTED — scoring rubric]** with attribution (add to NOTICE). |
| **PersonalizedRouter** (Dai, Feng, You) | [arXiv:2511.16883](https://arxiv.org/html/2511.16883v1) | arXiv (cite) | Per-user heterogeneous graph + GNN link-prediction. | **[REFERENCE ONLY]** (future personalization). |

> Honesty: a11oy is **"best GOVERNED LLM"**, routing to top OPEN models (DeepSeek-V3, Qwen2.5-Coder-32B, Llama 3.3) + Λ-gate + signed receipts. **No frontier-weights claim.**

## 4. GNN expressivity / graph substrate (JiaxuanYou + SNAP) — backs Wave-6 GNN ceiling + 3D graphs

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| **Position-aware Graph Neural Networks (P-GNN)** (You, Ying, Leskovec; ICML 2019) | [arXiv:1906.04817](https://arxiv.org/abs/1906.04817) · [Stanford PDF](https://cs.stanford.edu/people/jure/pubs/pgnn-icml19.pdf) · code [JiaxuanYou/P-GNN](https://github.com/JiaxuanYou/P-GNN) | ✅ MIT (code) | Wave-6 PositionAware theorems + the "GNN ≤ 1-WL ceiling" framing — justifies the position-aware graph reasoning substrate. | **[CITED]** prior art; our Lean ceiling theorems are our own. |
| SNAP **GraphGym** (You, Leskovec) | code [snap-stanford/GraphGym](https://github.com/snap-stanford/GraphGym) | ✅ MIT | GNN design-space methodology — informs the router-graph design. | **[REFERENCE ONLY]**. |
| **facebookresearch/graph2nn** (graph structure of neural nets) | [github](https://github.com/facebookresearch/graph2nn) | ✅ MIT | "relational graph → NN performance" — context for graph-router credibility. | **[REFERENCE ONLY]**. |
| Jiaxuan You — Google Scholar | [scholar](https://scholar.google.com/citations?user=NDbMl7oAAAAJ) | — | Author profile (advisor of Tao Feng). | **[REFERENCE ONLY]**. |

## 5. Certified robustness (locuslab / Zico Kolter; huskydoge orbit) — REFERENCE for Λ-gate framing

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| Cohen, Rosenfeld, Kolter, **Certified Adversarial Robustness via Randomized Smoothing** (ICML 2019) | [arXiv:1902.02918](https://arxiv.org/abs/1902.02918) · code [locuslab/smoothing](https://github.com/locuslab/smoothing) | ✅ MIT (code) | The notion of a **certified radius** — conceptual cousin of the Λ-gate's "provable floor" framing; supports the "governed-provable AI" positioning. | **[REFERENCE ONLY]** — we do NOT implement randomized smoothing; cited as the certified-robustness lineage. huskydoge (Benhao Huang) is in this (locuslab) orbit. |

## 6. Arithmetic / length generalization (mcleish7 = Sean McLeish) — backs CF-26 + numeric-reliability note

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| **Transformers Can Do Arithmetic with the Right Embeddings** (Abacus Embeddings; NeurIPS 2024) | [arXiv:2405.17399](https://arxiv.org/abs/2405.17399) · [doi](https://doi.org/10.48550/arXiv.2405.17399) · code [mcleish7/arithmetic](https://github.com/mcleish7/arithmetic) | ✅ MIT (code) | CF-26 abacus place-value theorem + a11oy's **numeric-reliability** guardrail (why LLMs miscount digits → prefer deterministic compute for exact numbers). | **[CITED]** as the *reason* for the deterministic-math guardrail. **No claim a11oy implements Abacus.** |
| mcleish7 **retrofitting-recurrence** (recurrent depth) | [github](https://github.com/mcleish7) (Apache-2.0) | ✅ Apache-2.0 | CF-28 recurrent-depth K^r-Lipschitz contraction amplification. | **[CITED]** prior art for our Lean contraction bound. |

## 7. Multi-physics pretraining (al-jshen / PolymathicAI) — backs killinchu forecast preprocessing

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| **Multiple Physics Pretraining (MPP)** (McCabe et al.; NeurIPS 2024) | [arXiv:2310.02994](https://arxiv.org/abs/2310.02994) · [blog](https://polymathic-ai.org/blog/mpp/) · code [PolymathicAI/multiple_physics_pretraining](https://github.com/PolymathicAI/multiple_physics_pretraining) | ✅ MIT | **RevIN** (instance-normalize then re-inject scale) for killinchu's multi-series forecasts (TCE, CII, Baltic Dry, seismic). | **[ADOPTED — RevIN-style preprocessing]** with attribution; sample/replay data, not a live feed. |

## 8. Goguen–Meseguer non-interference — backs P3

| Source | URL / DOI | License | Backs | Adoption |
|---|---|---|---|---|
| Goguen & Meseguer, **Security Policies and Security Models** (1982) | [doi:10.1109/SP.1982.10014](https://doi.org/10.1109/SP.1982.10014) | © IEEE (cite) | P3 non-interference: poisoned retrieval cannot flip DENY→ALLOW. | **[ADOPTED — formal model]**, our Lean proof. |
| Merkle (1987), hash trees; NIST FIPS 180-4 (SHA-256) | NIST FIPS 180-4 | public std | Hash-chain integrity (A6) + P5 collision-resistance idealization. | **[ADOPTED]** — P5 axiom-gated on `hashFn_collision_resistant`, disclosed. |

## 9. Defense Unicorns stack (UDS / Pepr / Zarf / Lula) — backs killinchu UDS Edition

| Source | URL | License | Backs | Adoption |
|---|---|---|---|---|
| **uds-core** | [defenseunicorns/uds-core](https://github.com/defenseunicorns/uds-core) | ⛔ **AGPL-3.0** (dual w/ commercial) | UDS Package CR vocabulary (sso/monitor/network/expose). | **[PATTERN-ONLY]** — conventions/vocabulary mirrored, **NO code copied**, non-affiliation NOTICE intact. |
| **Pepr** | [defenseunicorns/pepr](https://github.com/defenseunicorns/pepr) · [AustinAbro321/pepr-grafana-capability](https://github.com/AustinAbro321/pepr-grafana-capability) | ✅ Apache-2.0 | The `szl-governance` Capability + `When().Validate()` receipt-gate idiom (in szl-uds-deployment). | **[ADOPTED — idiom]**, our Apache-2.0 code. |
| **Zarf** | [zarf-dev/zarf](https://github.com/zarf-dev/zarf) | ✅ Apache-2.0 | killinchu `zarf.yaml` flavors upstream/registry1/unicorn (airgap). | **[ADOPTED — packaging]**. |
| **Lula1 / go-oscal** | [defenseunicorns-labs/lula1](https://github.com/defenseunicorns-labs/lula1) · [go-oscal](https://github.com/defenseunicorns/go-oscal) | ✅ Apache-2.0 | OSCAL component-def + API-domain Lula Validations mapping Λ-gate + receipts → NIST 800-53 controls (AU-10, SI-7, AC-4, CM-3, AU-3). | **[ADOPTED — compliance artifact]**; honest claims w/ live evidence, **not an ATO**. |
| **wcrum/py-cot** | [wcrum/py-cot](https://github.com/wcrum/py-cot) | ✅ Apache-2.0 | killinchu Maritime/Drones "Export as CoT (SAMPLE)" — TAK/MIL-STD command format. | **[ADOPTED — feed format]**, labeled SAMPLE; no live TAK server claim. |
| eddiezane observability · chance-coleman network-visualizer (D3) · joelmccoy IAM · JeffResc Hetzner | see [DU_DEEPDIVE_FINDINGS.md §2](./DU_DEEPDIVE_FINDINGS.md) | ✅ MIT / BSD | ServiceMonitor idiom, NetworkPolicy graph viz, least-priv RBAC, deploy perimeter. | **[CITED / pattern]**. |

## 10. 3D / graph visualization kit — backs frontier tabs (all permissive)

| Source | URL | License | Backs | Adoption |
|---|---|---|---|---|
| vasturiano **3d-force-graph / three-globe / globe.gl** | [3d-force-graph](https://github.com/vasturiano/3d-force-graph) · [three-globe](https://github.com/vasturiano/three-globe) · [globe.gl](https://github.com/vasturiano/globe.gl) | ✅ MIT | a11oy router/organism graphs; killinchu globe / Maritime / Drones. | **[ADOPTED]** with attribution (NOTICE). |
| anvaka **ngraph.*** (graph / forcelayout / path / hde / w-gl) + map-of-github pipeline | [anvaka](https://github.com/anvaka) | ✅ BSD-3 / MIT (map-of-github repo: no SPDX → technique only) | mesh/router graph model + Jaccard→Leiden→forcelayout "map" technique. | **[ADOPTED — libs]**; map-of-github **technique only** (no code). |
| mapbox **supercluster** · visgl **deck.gl** · mrdoob **three.js** | [supercluster](https://github.com/mapbox/supercluster) · [deck.gl](https://github.com/visgl/deck.gl) · [three.js](https://github.com/mrdoob/three.js) | ✅ ISC / MIT / MIT | high-density geo clustering, WebGL2 layers, atmosphere shaders. | **[ADOPTED]** with attribution. |

---

## NOTICE attribution block (apps must keep verbatim where these are used)
> Techniques cited / adopted with attribution: GraphRouter (MIT) & Router-R1 (Apache-2.0, ulab-uiuc); mcleish7/arithmetic & retrofitting-recurrence (MIT/Apache-2.0); Polymathic MPP (MIT); P-GNN/GraphGym/graph2nn (MIT); Pepr, Zarf, Lula/go-oscal, py-cot (Apache-2.0); ngraph (BSD/MIT, anvaka), 3d-force-graph/three-globe/globe.gl (MIT, vasturiano), supercluster (ISC, mapbox), deck.gl & three.js (MIT). **uds-core is AGPL-3.0 → pattern/vocabulary only, no source included.** SZL is NOT affiliated with Defense Unicorns. Certified-robustness (locuslab/smoothing, MIT) and Aczél/Kiss–Shulman/Pinsker results are CITED as prior art / declared bridge axioms — not re-derived falsely. Λ remains Conjecture 1.
