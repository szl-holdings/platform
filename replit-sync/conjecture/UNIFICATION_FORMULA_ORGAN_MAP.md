<!--
  UNIFICATION_FORMULA_ORGAN_MAP.md — CANONICAL (MAP/DATA only; do NOT edit app code)
  Author: Opus 4.8 unification engineer (subagent) · 2026-06-08
  Consumers: a11oy + killinchu app devs.
  Single source of truth for proven state: team/PROVEN_STATE_CANONICAL.md + lutar-lean/PROVEN_FORMULAS.md
  HARD RULES (non-negotiable, baked into every row below):
    • LOCKED proven = EXACTLY 5 {F1, F11, F12, F18, F19}. NEVER inflate. NEVER fold experimental in.
    • Λ (F23 / Λ-uniqueness) = Conjecture 1. Unconditional uniqueness is machine-checked FALSE
      (Round13.maxAgg_ne_Lambda). The conditional axiom-free results are the strongest honest claim.
    • F12 / F19 prove only the ADDITIVE fragment — never "Kuramoto sync proved" / "Bekenstein bound proved".
    • BFT safety (Khipu) = Conjecture 2 OPEN. P5 tamper-evidence = AXIOM-GATED (hashFn_collision_resistant).
    • No fabricated proofs. Experimental/conditional/conjecture labeled in EVERY row.
-->

# UNIFICATION: Formula → Organ Map (honest maturity)

The SZL governed organism has five load-bearing organs. Below, **every** proven / CI-green
formula and theorem is mapped to the organ it lives in, with its Lean name, a plain-language
meaning, an honest maturity tier, and the source repo/file. Maturity tiers are exactly:

| Tier | Meaning |
|---|---|
| **LOCKED** | Kernel-verified, sorry-free, Lean-core axioms only `[propext, Classical.choice, Quot.sound]`. The locked set is **exactly 5** — never more. |
| **CI-green-experimental** | Kernel-checked by lutar-lean CI, `#print axioms ⊆ {propext, Classical.choice, Quot.sound}`, NO new axiom, NO sorry — but **NOT** in the locked 5. |
| **Conditional** | Sorry-free GIVEN a declared, cited bridge axiom / hypothesis (stated, not faked). |
| **Conjecture** | Not a theorem. Λ unconditional uniqueness and Khipu BFT safety live here. |
| **Axiom-gated** | Sorry-free given one disclosed cryptographic idealization (e.g. collision-resistance). |
| **Measured / Defined** | Empirically measured or schema-defined, not formally proven. |

**Locked kernel:** `c7c0ba17` · 749 declarations / 14 unique axioms / 163 tracked sorries · `lake build` clean.
**Experimental head:** main `880c803e` · 1323 declarations / 23 axioms (22 unique) / 307 raw sorries · CI-green.
**Toolchain:** Lean `v4.13.0` · Mathlib pinned `d7317655`.
Source of truth: [PROVEN_STATE_CANONICAL.md](./PROVEN_STATE_CANONICAL.md), [lutar-lean PROVEN_FORMULAS.md](https://github.com/szl-holdings/lutar-lean/blob/main/PROVEN_FORMULAS.md).

---

## ❤️ HEART — YUYAY (the Λ-gate / trust decision)

**Repo home:** `a11oy` (covenant policy engine) + `lutar-lean` (the formal scaffold) + `ouroboros` (runtime gate).
**Role:** decides ALLOW / DENY. The conjunctive 13-axis gate is the heartbeat; nothing exits the body graph without a Heart pulse.

| Formula id | Lean name | Plain meaning | Maturity | Source repo/file |
|---|---|---|---|---|
| **F1** *(of the LOCKED-5)* | `f1_replay_fold_deterministic`, `f1_replay_fold_eq_trace_last` | Replaying the same recorded gate log from the same state yields a **bit-identical** trace — the gate verdict is reproducible. | **LOCKED** | [lutar-lean PuriqFormulaLean.lean](https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Puriq/Formulas/PuriqFormulaLean.lean) |
| **P2** (agentic loop) | gate-soundness (`P2` in PR #188) | Emit ALLOW **iff** both the policy gate and the kernel gate ALLOW; DENY is absorbing. This is the conjunctive-AND soundness of the gate. | **CI-green-experimental** | [lutar-lean PR #188 @ 2ede47a2](https://github.com/szl-holdings/lutar-lean/pull/188) |
| **Λ / F23** (TH_L1) | `Λ_uniqueness` (conjecture); `Round13.maxAgg_ne_Lambda` (the falsifier) | "Is Λ the *unique* trust aggregator?" Unconditionally **NO** — a max-aggregator satisfies A1–A5 yet differs from Λ at (4,1). Stays **Conjecture 1**. | **Conjecture** | [lutar-lean Round13/Lambda_Uniqueness.lean](https://github.com/szl-holdings/lutar-lean) · DOI [10.5281/zenodo.20053148](https://doi.org/10.5281/zenodo.20053148) |
| Λ conditional (CUT-2) | `lambda_unique_of_separable` | Λ uniqueness IS a theorem **conditional on** {A1,A2,A3,A5 + slice-multiplicativity (separability)} — **axiom-free** (no new axiom). Gets Λ off bare conjecture, honestly. | **Conditional** (axiom-free) | lutar-lean Round13 · Wave12 PR #202 |
| Λ conditional (Set α) | `Lutar.Wave6.SetAlpha.lambda_unique_setAlpha` | Λ unique within {symmetry, idempotency, strict-monotone, continuity, multiplicativity}, conditional on one cited bridge axiom `setAlpha_cauchy`. | **Conditional** | [lutar-lean PR #192 @ 5f0bb5ee](https://github.com/szl-holdings/lutar-lean/pull/192) |
| Λ conditional (Set δ) | `Lutar.Wave6.SetDelta.geomMean_unique_KS` | Λ unique within a bisymmetry/multiplicativity class; continuity derived free via Kiss–Shulman (2026). Conditional on `KS_theorem_1_1` + `setDelta_stage2`. | **Conditional** | lutar-lean PR #192 · [Kiss–Shulman arXiv:2606.05221](https://arxiv.org/abs/2606.05221) |
| Λ impostor-deaths (×10) | `maxAgg_not_A5prime`, `arithmeticMean_not_delta5`, … | AM, HM, PM², max, min each provably FAIL the discriminating axiom at a concrete witness — so the characterization is genuine, not vacuous. **Axiom-free.** | **CI-green-experimental** | lutar-lean Wave6 SetAlpha/SetDelta |
| Λ bisymmetry bridge (CF-24) | `lambda_unique_of_bisymmetric_separable`, `IsBisymmetric2` (predicate) | Bisymmetry as a *checkable predicate* (not an axiom) + an axiom-free CUT-1→CUT-2 bridge. `geoBin` satisfies the full Aczel quasi-arithmetic axioms (idem/comm/homog/mono). | **CI-green-experimental** | lutar-lean Wave15/16 PR #205/#206 |
| Λ scale-invariance (CF-25) | `lambda_scale_axes`, `normalization_invariant` | Λ's verdict is invariant to consistent rescaling/normalization of the axes. | **CI-green-experimental** | lutar-lean Wave16 PR #206 |
| Λ bounds (TH_L2) | `Λ_min_max_bounds` (`Lutar/Bound.lean`) | Λ ∈ [0,1]; = 0 iff any axis is 0; = 1 iff all axes are 1. | **CI-green-experimental** | [lutar-lean Lutar/Bound.lean](https://github.com/szl-holdings/lutar-lean) · DOI [10.5281/zenodo.20053148](https://doi.org/10.5281/zenodo.20053148) |
| Axis floors A2/A3 | `moralGroundingFloor`, `measurabilityHonestyFloor` | moralGrounding and measurabilityHonesty axes carry an **elevated** 0.95 floor (vs default 0.90) — a second asymmetric layer. | **Defined** | knowledge.json axioms A2/A3 · thesis §4.1 · DOI [10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582) |
| Soundness axiom A1 | `soundnessAxiom` | gate_pass(r) ⇒ Λ(r) ≥ 0.90 **conjunctively** (every axis a blocking veto). | **Defined** (schema) | knowledge.json axiom A1 · thesis §4.1 |
| DPO KL-on-simplex (CF-22) | `klDivergence_nonneg_simplex`, `dpo_klDivergence_nonneg_on_simplex` | KL ≥ 0 **on the probability simplex** — conditionally repairs the FALSE-as-stated DPO axiom, axiom-free. (Unconditional DPO KL stays FALSE-as-stated.) | **CI-green-experimental** (conditional repair) | lutar-lean Wave15 PR #205 |

> **Honesty line for the app (verbatim-safe):** *"Λ unconditional remains Conjecture 1 (unconditional uniqueness is provably false for A1–A5); we proved the strongest axiom-free CONDITIONAL uniqueness (slice-multiplicativity ⇒ Λ), machine-checked."*

---

## 🧠 BRAIN — YACHAY (reasoning / knowledge corpus)

**Repo home:** `szl-lake` (corpus) + `lutar-lean` / `lean-kernel` (Mathlib corpus + reasoning theorems) + `szl-papers` (preprints) + `szl-math_corpus` (in a11oy).
**Role:** the read-only reasoning cortex — the Mathlib-grounded theorem corpus the gate's verdicts reason over.

| Formula id | Lean name | Plain meaning | Maturity | Source repo/file |
|---|---|---|---|---|
| **F11** *(LOCKED-5)* | `f11_ayni_reciprocity_conservation`, `f11_tit_for_tat_parity` | An append-only reciprocity ledger conserves its balance invariant (Axelrod–Hamilton tit-for-tat parity). | **LOCKED** | [lutar-lean PuriqFormulaLean.lean](https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Puriq/Formulas/PuriqFormulaLean.lean) |
| **F12** *(LOCKED-5)* | `f12_*` | Reciprocity coupling stays bounded under **additive** superposition over an organ set. **Additive fragment ONLY — NOT full nonlinear Kuramoto synchronization.** | **LOCKED** (additive fragment) | lutar-lean PuriqFormulaLean.lean |
| CF-1 graph auto-dist | `GraphAutoDistInvariant` | A graph automorphism preserves distance structure — Λ-graph reasoning is isomorphism-invariant. | **CI-green-experimental** | lutar-lean Wave11 PR #201 |
| Wave-6 GNN ceiling | GNN ≤ 1-WL ceiling, Λ-graph iso-invariance, spectral contraction, DAG termination | The reasoning graph substrate's expressivity is bounded by 1-WL; spectral steps contract; DAGs terminate. | **CI-green-experimental** | [lutar-lean PR #189 @ dc7ae26d](https://github.com/szl-holdings/lutar-lean/pull/189) |
| Wave-5 inequalities | AM–GM, Cauchy–Schwarz, conformal coverage, receipt-collision pigeonhole, optional-stopping | Core analysis lemmas the reasoning corpus depends on (conformal coverage backs calibrated forecast bands). | **CI-green-experimental** | [lutar-lean PR #186 @ b71114cf](https://github.com/szl-holdings/lutar-lean/pull/186) |
| Wave-7 conformal/PAC | conformal rank-count / p-value, Doob two-sided audit envelope, PAC-Bayes routing envelope, degree-sum iso-invariance | Distribution-free prediction intervals + a martingale audit envelope + a routing generalization envelope. | **CI-green-experimental** | [lutar-lean PR #190 @ d6a232ba](https://github.com/szl-holdings/lutar-lean/pull/190) |
| CF-18 Mādhava | `leibniz_remainder_bound`, `madhava_alt_series_bound_clean` | Alternating-series remainder bound (Mādhava–Leibniz) — exact numeric truncation error. | **CI-green-experimental** | lutar-lean Wave14 PR #204 |
| CF-20 VCG | `exists_efficient_outcome`, `efficientOutcome_maximises`, `vcg_truthfulness_core` | VCG mechanism: an efficient outcome exists and truthful bidding is incentive-compatible (mechanism-design grounding). | **CI-green-experimental** | lutar-lean Wave14 PR #204 |
| CF-21 log-sum / Gibbs | `log_sum_inequality`, `gibbs_inequality` | Log-sum inequality and Gibbs' inequality (Cover–Thomas) — information-theory backbone. | **CI-green-experimental** | lutar-lean Wave14 PR #204 |
| CF-23 Pinsker (binary) | `binary_pinsker` (`2(p-q)² ≤ KL`), `binary_inv_sum_ge_four` | **Binary Pinsker inequality** — total variation is bounded by √(KL/2) in the binary case. The long-sought headline; full (non-binary) Pinsker NOT yet proven (honest). | **CI-green-experimental** | lutar-lean Wave16/17 PR #206/#207 · [Pinsker (Wikipedia)](https://en.wikipedia.org/wiki/Pinsker's_inequality) |
| CF-22 KL-simplex | `klDivergence_nonneg_simplex` | KL ≥ 0 on the simplex (also serves the Heart's DPO repair). | **CI-green-experimental** | lutar-lean Wave15 PR #205 |
| CF-26 abacus place-value | `abacus_*` (place-value) | Place-value / digit-position arithmetic correctness — the formal cousin of why deterministic compute beats LLM digit-counting. | **CI-green-experimental** | lutar-lean Wave16 PR #206 · cites [Abacus arXiv:2405.17399](https://arxiv.org/abs/2405.17399) |
| CF-27 monDEQ | monDEQ strong-monotonicity ⇒ unique equilibrium | A strongly-monotone deep-equilibrium operator has a unique fixed point (well-posed reasoning fixpoints). | **CI-green-experimental** | lutar-lean Wave17 PR #207 |
| CF-28 recurrent depth | `K^r`-Lipschitz contraction amplification | Recurrent-depth contraction amplifies — convergence bound for iterated reasoning (mcleish7 retrofitting-recurrence, Apache-2.0). | **CI-green-experimental** | lutar-lean Wave17 PR #207 |
| CF-13 / CF-17 | `OuroLoopInputLipschitz`, `NumericStability` | DEQ input-Lipschitz well-posedness + floating-point summation error bound (numeric reliability). | **CI-green-experimental** | lutar-lean Wave12 PR #202 |
| BKS density engine | DisjointOpens / Density / AccumulationUncountable / Cut1Density / DyadicImageDense | Topological density machinery driving the CUT-1 residual (the route toward fewer Λ hypotheses). (C-order) gap-shift ordering remains an HONEST structural hypothesis, documented not faked. | **CI-green-experimental** | lutar-lean Wave19/20/21 PR #209/#210/#211 |

---

## 🩸 CIRCULATORY — YAWAR (the receipt bus)

**Repo home:** `szl-lake` (append-only DSSE receipt store) + `ouroboros` (emitter) + the `szl_dsse.py` / `szl_khipu.py` substrate in a11oy/killinchu.
**Role:** every governed action emits an ECDSA-P256 DSSE-signed Khipu receipt onto a hash-linked Merkle DAG; receipts.in ≡ receipts.out.

| Formula id | Lean name | Plain meaning | Maturity | Source repo/file |
|---|---|---|---|---|
| **F18** *(LOCKED-5)* | `f18_*` (Reed–Solomon RS(10,6)) | Receipt/payload erasure tolerance: recoverable **iff ≥ 6 of 10 shards survive** — the resilience arithmetic of the bus. | **LOCKED** | [lutar-lean PuriqFormulaLean.lean](https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Puriq/Formulas/PuriqFormulaLean.lean) |
| **P1** receipt-completeness | `P1` (agentic loop) | Every hop leaves **exactly one** chained receipt — no silent drop or reorder. | **CI-green-experimental** | [lutar-lean PR #188 @ 2ede47a2](https://github.com/szl-holdings/lutar-lean/pull/188) |
| **P4** replay-determinism | `P4` (agentic loop), `findReplayRoot_complete` | Re-running a recorded run reproduces a **byte-identical** receipt chain (axiom-free). | **CI-green-experimental** | lutar-lean PR #188 / Wave13 PR #203 |
| **P5** tamper-evidence | `P5` (agentic loop) | Any single-receipt mutation makes re-verify **reject**. **Axiom-gated** on `hashFn_collision_resistant` (NIST FIPS 180-4, disclosed). | **Axiom-gated** | lutar-lean PR #188 |
| **P6** monotone auditability | `P6` (agentic loop) | An accepted prefix never has to be retracted as the log grows. | **CI-green-experimental** | lutar-lean PR #188 |
| CF-19 Reed–Solomon MDS | `rs_distance_lower_bound`, `agreement_card_lt_of_degree_lt` | RS codes meet the MDS distance bound — the formal basis for the erasure resilience. | **CI-green-experimental** | lutar-lean Wave14 PR #204 |
| Hash-chain integrity A6 | `hashChainIntegrity` | Every spine entry: `entry.chain = SHA256(prev_entry)` — the chain invariant. | **Defined** (schema) | knowledge.json axiom A6 · thesis §3.4 |
| Deterministic replay A5 | `deterministicReplay` | Canonical JSON + pinned PRNG + frozen registry ⇒ 5× replay yields byte-identical roots. | **Measured** | knowledge.json axiom A5 · thesis §4.6 |
| Dual-witness disjoint A4 | `dualWitnessDisjointness` | ρ-closure requires `witness_1_id ≠ witness_2_id` (registry-enforced at write time). | **Proven** (registry invariant) | knowledge.json axiom A4 |
| ρ-closure production (TH_L4) | `rho_closure_production` | 100% ρ-closure on 8,000/8,000 paired calls under the v11 platform (measured, not a theorem). | **Measured** | ouroboros v6.3.0 · DOI [10.5281/zenodo.20119582](https://doi.org/10.5281/zenodo.20119582) |
| Ingest discipline A8 | `ingestDiscipline` | Every ingest requires source_url + content_hash + license (allow-list) + ORCID. | **Defined** | knowledge.json axiom A8 · thesis §7 |
| Bekenstein chain bound A7 | `bekensteinBound` (TH_L3 `bekenstein_soundness`) | Receipt-chain entropy bounded by an information-theoretic limit; indicator fires at 49.5% under uniform seed (measured). Formal proof pending. | **Conjecture / Measured** | knowledge.json axiom A7 · DOI [10.5281/zenodo.19944926](https://doi.org/10.5281/zenodo.19944926) |

---

## 🌐 NERVOUS — OTel spans (the afferent telemetry)

**Repo home:** `vsp-otel` (Λ-signed OTLP exporter, Layer 4) + `uds-mesh` (cross-service span schemas, Layer 5).
**Role:** carries signals inward — Λ-signed, DSSE-attested OpenTelemetry spans; records who observed what and when.

| Formula id | Lean name | Plain meaning | Maturity | Source repo/file |
|---|---|---|---|---|
| **P3** non-interference | `P3` (Goguen–Meseguer, agentic loop) | Poisoned / untrusted retrieval **provably cannot** flip a DENY→ALLOW — information-flow non-interference (axiom-free core). | **CI-green-experimental** | [lutar-lean PR #188 @ 2ede47a2](https://github.com/szl-holdings/lutar-lean/pull/188) · [Goguen–Meseguer doi:10.1109/SP.1982.10014](https://doi.org/10.1109/SP.1982.10014) |
| Span Λ-gate floor | `lambda_gate.py` `LAMBDA_FLOOR = 0.90` | Every span is scored by Λ over A1–A5 axes; spans below the 0.90 floor are rejected (fail-closed); survivors are DSSE-signed. | **Defined / operational** | [vsp-otel collector/lambda_gate.py](https://github.com/szl-holdings/vsp-otel) · DOI [10.5281/zenodo.20424995](https://doi.org/10.5281/zenodo.20424995) |
| Welford / HLL span stats | `stats.py` (Welford, HyperLogLog) | Online mean/variance (Welford, numerically stable) + unique-trace cardinality (HLL) for span telemetry. | **Operational** (standard algorithms) | vsp-otel collector/stats.py |
| `attr: E → A` attribution | `attr` mapping (thesis §safety-wires) | Every telemetry edge is attributable to a named actor — no orphan spans. | **Defined** (schema) | thesis F0036 · uds-mesh span schemas |
| Cross-service span envelope | `szl.mesh.*` (5 schemas) | One identical cross-service envelope (`organ`, `receipt_hash`, `lambda_value`, `governance_drift`) lets one decision be followed across all 5 services. | **Operational** (schema) | [uds-mesh schemas/spans/*.yaml](https://github.com/szl-holdings/uds-mesh) · DOI [10.5281/zenodo.20434276](https://doi.org/10.5281/zenodo.20434276) |

---

## 🦴 SKELETON — load-bearing service capabilities

**Repos:** `khipu-consensus`, `ouroboros`, `hatun-mcp`, `szl-mesh` (+ `lutar-lean`/`lean-kernel` as the formal scaffold).
**Role:** the structural members the organism stands on — consensus, the bounded-recursion runtime, the MCP tool surface, and the CRDT fleet mesh.

| Formula id | Lean name | Plain meaning | Maturity | Source repo/file |
|---|---|---|---|---|
| **F19** *(LOCKED-5)* | `f19_*` (Bekenstein additive) | Entropy budget is **additive and monotone** over a region partition (per-region ≤ total). **Additive scaffolding ONLY — NOT the full Bekenstein bound S ≤ 2πkRE/(ℏc).** | **LOCKED** (additive fragment) | [lutar-lean PuriqFormulaLean.lean](https://github.com/szl-holdings/lutar-lean/blob/main/Lutar/Puriq/Formulas/PuriqFormulaLean.lean) |
| Khipu BFT safety | `ubuntu_quorum_safety` | "Can ≥3-of-4 dishonest witnesses force a bad action?" Safety is **Conjecture 2 OPEN** — a faulty organ can equivocate. NEVER claim BFT safety proven. | **Conjecture** (Conjecture 2, OPEN) | [khipu-consensus](https://github.com/szl-holdings/khipu-consensus) |
| Khipu 3-of-4 quorum rule | `quorum_agreement_single_valued_vote` | **Non-Byzantine** shadow: ≥3 valid `allow` signatures over the same action hash ⇒ canonical; ≤2-of-4 ⇒ rejected. NOT Conjecture 2 (the safe, honest fragment). | **CI-green-experimental** | lutar-lean Wave13 PR #203 · [khipu-consensus README](https://github.com/szl-holdings/khipu-consensus) |
| Ouroboros early-exit / KV-cache | `OuroLoopEarlyExit`, `OuroKVCacheSlots` (CF-2/CF-3) | The bounded-recursion loop provably exits early and respects KV-cache slot bounds — termination + memory safety of agentic loops. | **CI-green-experimental** | lutar-lean Wave11 PR #201 · [ouroboros](https://github.com/szl-holdings/ouroboros) |
| Ouroboros input-Lipschitz | `OuroLoopInputLipschitz` (CF-13) | The loop is input-Lipschitz (DEQ well-posedness) — small input change ⇒ bounded output change. | **CI-green-experimental** | lutar-lean Wave12 PR #202 |
| HLP HM bottleneck | `hm_bottleneck_clean` | Harmonic-mean bottleneck bound for the mesh/quorum aggregation. | **CI-green-experimental** | lutar-lean Wave13 PR #203 |
| Immune Neyman–Pearson | `ImmuneNeymanPearsonOpt` (CF-5) | The egress-immune inspector's accept/reject test is Neyman–Pearson optimal at its operating point. | **CI-green-experimental** | lutar-lean Wave11 PR #201 |
| PURIQ governance formula | `Hatun_MCP(client) ∈ [0,1]` + Yuyay-13 gate | The MCP server governs every tool call: authenticate → Yuyay-13 input gate → reputation → 2-person gate for state-changing tools → Khipu receipt → DSSE response. | **Operational** (schema) | [hatun-mcp README](https://github.com/szl-holdings/hatun-mcp) |
| CRDT convergence | szl-mesh CRDT merge (peat) | Always-converging shared state across an air-gapped fleet (CRDT join-semilattice convergence) layered with 3-of-4 Khipu quorum. | **Operational** (standard CRDT property) | [szl-mesh spec/](https://github.com/szl-holdings/szl-mesh) |

---

## Cross-organ honesty footer (must stay verbatim-true in any app surface)
- **Locked proven = exactly 5**: F1, F11, F12 (additive), F18, F19 (additive) @ kernel `c7c0ba17`.
- **Λ = Conjecture 1**: unconditional uniqueness machine-checked **FALSE**; conditional axiom-free results are the strongest honest claim.
- **Khipu BFT safety = Conjecture 2, OPEN.** **P5 tamper-evidence = axiom-gated** (collision-resistance).
- **F12 / F19 = additive fragment only.** Never "Kuramoto sync proved" / "Bekenstein bound proved".
- **SLSA**: L1 honest + L2 on service images (cosign + slsa.dev/provenance/v0.2). **No** L3 / FedRAMP / Iron Bank / CMMC.
- Everything in the **CI-green-experimental** tier is real and kernel-checked but is **never** folded into the locked count of 5.
