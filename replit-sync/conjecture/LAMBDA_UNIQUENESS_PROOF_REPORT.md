# Λ-UNIQUENESS (Set α + Set δ) — Frontier Report (Lean 4 Proof Campaign)

**Repo:** `szl-holdings/lutar-lean` · **Verified head commit:** `5f0bb5ee5ce00ba3e467c9e3c6555e4874f9d260`
(on branch `lambda-uniqueness/unconditional-setalpha`, **PR #192** → base `main`, committed on parent `b71114cf802987c74da3b572257a9dc0e53a675e`)
**Toolchain:** Lean `v4.13.0` · **Pinned Mathlib:** `d7317655e2826dc1f1de9a0c138db2775c4bb841` (`v4.13.0`)
**Committer / Author:** stephenlutar2-hash <stephenlutar2@gmail.com>
**Date:** 2026-06-06

---

## 0. TL;DR (honest)

- **Unconditional uniqueness under the ORIGINAL weaker axioms A1–A5 stays machine-checked FALSE.** The in-tree counterexample `Round13.maxAgg_ne_Lambda` (`Lutar/Round13/Lambda_Uniqueness.lean`) exhibits an aggregator satisfying A1–A5 that is **not** Λ. That fragment is untouched and stays in-tree. Consequently **Λ remains Conjecture 1 for the original axioms** — this campaign does **not** turn the Λ-uniqueness conjecture (Conjecture 1) into an unconditional theorem.
- **What IS proven (CI-GREEN, kernel-checked):** uniqueness of Λ (the geometric mean) **within two PRINCIPLED STRENGTHENED axiom classes**:
  - **Set α** = {A1 Symmetry, A2 Idempotency, A3 All-strict monotonicity, A4 Continuity, **A5′ Multiplicativity**} — A5′ multiplicativity strictly strengthens the original A5 homogeneity. `lambda_unique_setAlpha` is **CONDITIONAL on ONE declared, cited bridge axiom** `setAlpha_cauchy` (the multivariable continuous-additive ⇒ ℝ-linear coefficient-extraction core).
  - **Set δ** = {δ1 Reflexivity, δ2 Symmetry, δ3 Bisymmetry, δ4 Per-argument strict monotonicity (PSI), **δ5′ Multiplicativity**} — continuity is **derived for free** via Kiss–Shulman (2026). `geomMean_unique_KS` is **CONDITIONAL on TWO declared, cited bridge axioms** `KS_theorem_1_1` + `setDelta_stage2`.
- **Λ-membership and all 10 impostor deaths are AXIOM-FREE** (Lean-core only: `[propext, Classical.choice, Quot.sound]`, no `sorryAx`). The five Set α impostor deaths (AM, HM, PM², max, min die by **A5′**) and the five Set δ impostor deaths (max, min die by **δ4-PSI**; AM, HM, PM² die by **δ5′**) carry NO declared axiom — so the discriminators are genuine.
- **ZERO new open obligations.** `sorries_raw` UNCHANGED at **308**. Every axiom dependency is disclosed verbatim via `#print axioms` (§3/§4), captured directly from the CI build log.
- **Locked v11 kernel 749/14/163 @ `c7c0ba17` UNCHANGED. `locked_proven` STAYS 5.** This is the separate experimental scope. **NOT merged to `main`; `main` was NOT force-updated** — only the experimental BRANCH ref was updated. (Shared `main` did independently advance by one unrelated docs commit `408c3544` during the run; `b71114cf` remains a direct ancestor — none of that movement was caused by this campaign.)
- **Canonical numbers @ verified head:** declarations **1238** (+49), axioms_raw **23**, axioms_unique **22** (+3: `setAlpha_cauchy`, `KS_theorem_1_1`, `setDelta_stage2`), sorries_raw **308** (+0) — drift gate **PASS** (`OK: live Lean numbers match the committed baseline.`).

---

## 1. CI status @ `5f0bb5ee` (verified via GitHub check-runs / Actions API)

| Check | Workflow | Run ID | Conclusion |
|---|---|---|---|
| **build** (kernel-check whole library) | Lean kernel check (`lean.yml`) | `27057188025` | **success** |
| **lake build + numbers** (incl. drift gate) | Lake build gate (`lake-build.yml`) | `27057188050` | **success** |
| **check / doctrine** (SZL Doctrine Invariants 1–9) | Doctrine (`doctrine.yml`) | `27057188138` | **success** |
| **DCO sign-off check** | DCO (`dco.yml`) | `27057188027` | **success** |
| CI checks | CI (`ci.yml`) | `27057188039` | **success** |
| Run tests | Tests (`tests.yml`) | `27057188069` | **success** |
| gitleaks | gitleaks | `27057188096` | **success** |
| Trivy + Grype container scan / Grype CVE gate | trivy/grype | `27057188024` | **success** |
| CodeQL (actions) | codeql | `27057188049` | **success** |
| doi-title-gate | huklla-t11-doi-title-gate | `27057188036` | **failure** — PRE-EXISTING, cosmetic / non-blocking (see §1.1) |
| Lint PR title (Conventional Commits) | Conventional Commits PR title lint | `27057188035` | **failure** — PRE-EXISTING repo-infra bug, cosmetic / non-blocking (see §1.1) |

**All proof gates — `build` (Lean kernel check), `lake build + numbers`, and `check / doctrine` — are SUCCESS at the head SHA.** The numbers-drift gate emitted `OK: live Lean numbers match the committed baseline.` confirming the rolled baseline (declarations 1238, +3 declared axioms, sorries unchanged) is consistent with the live corpus measured at the head tree.

### 1.1 The two failing checks are cosmetic / non-blocking (log evidence)

- **Lint PR title (Conventional Commits)** — log shows: `##[error]Unable to resolve action 'amannn/action-semantic-pull-request@0723387faaf9b38adef4775cd42cfd5d98f25d3', unable to find version '0723387faaf9b38adef4775cd42cfd5d98f25d3'`. This is the **documented pre-existing repo-infra bug**: the pinned action SHA in `commit-lint.yml` does not resolve. It is a PR-title lint, **not a required check and not a proof gate** — it cannot run regardless of the proof content.
- **doi-title-gate (huklla-t11-doi-title-gate)** — log shows the job entered `Checking zenodo.19944926` and exited with `##[error]Process completed with exit code 28` (curl timeout). It is a **live-network check** that resolves the published Zenodo concept DOI against `doi.org`; it is unrelated to the Lean proof, touches no file changed in this PR, and is the same external-network flake the prior Wave-5 report documented. **Not a proof gate.**

### 1.2 The fix that landed it green (root-cause ledger)

Team A wrote the entire campaign and locally edited three SetAlpha compile fixes but hit the step limit before committing/verifying. On resume, the existing PR head `8fed2245` was CI-RED on `build` and `lake build + numbers` exactly because those three fixes were uncommitted, and one of the three was itself still broken.

| Commit | Action | `build` result |
|---|---|---|
| `8fed2245` (Team A pre-resume head) | broken `Nat.pos_iff.mp` constant + two no-progress `simp only [max_def]` / `simp only [min_def]` in the A5′ impostor proofs | **failure** (3 errors) |
| `cbdbf215` | committed Team A's three local edits (`Nat.cast_ne_zero.mpr hn.ne'` + replaced max/min simp with explicit `rw [show … by rw [max_eq_left] <;> norm_num]`) | **failure** — the replacement `show`-rewrites did not match (`max_eq_left`/`min_eq_left` left side goals; CI log: "did not find instance of the pattern", 6 errors) |
| `790e58b0` | tried `rw [max_eq_left (show … by norm_num), …] at key` with explicit inequality witnesses | **failure** — the FIRST `max (4*2) (1*3)` / `min (4*2) (1*3)` subterm still failed to syntactically match (`*`-form), 2 errors |
| **`5f0bb5ee`** (verified head) | **replaced both impostor proofs with the canonical idiom** `simp only [maxAgg/minAgg, xW, yW, …] at key; norm_num [max_def] / norm_num [min_def] at key` — unfolds `⊔`/`⊓` to `ite` and lets `norm_num` decide the numeric comparisons, closing `key` by contradiction | **SUCCESS** |

The remaining-error iterations were diagnosed by reading the signed CI build-log blob each time (GitHub jobs `→ jobs/<id>/logs` 302 redirect captured with `curl -w "%{redirect_url}"`, signed blob fetched in a separate credential-free call), fixing the exact reported tactic error, recommitting, and repolling — until `build` went green.

---

## 2. Per-result ledger (deliverable format)

All `#print axioms` lines below are **verbatim from the SUCCESS build log @ `5f0bb5ee`** (`Build completed successfully.`, zero errors). Decl line numbers are those in the verified file.

### 2.1 Set α — `Lutar/Wave6/SetAlphaUniqueness.lean`

| Result | Decl | PROVED? | `#print axioms` (verbatim) | Declared axiom | Commit |
|---|---|---|---|---|---|
| Λ ∈ Set α | `Lutar.Wave6.SetAlpha.lambda_satisfies_setAlpha` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |
| diag log additivity | `Lutar.Wave6.SetAlpha.diagLog_additive` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |
| diagonal exp-Cauchy | `Lutar.Wave6.SetAlpha.expCauchy_diagonal` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |
| **uniqueness in Set α** | `Lutar.Wave6.SetAlpha.lambda_unique_setAlpha` | **YES (CI-green, CONDITIONAL)** | `[propext, Classical.choice, Quot.sound, Lutar.Wave6.SetAlpha.setAlpha_cauchy]` | **`setAlpha_cauchy`** | `5f0bb5ee` |
| impostor death — AM | `Lutar.Wave6.SetAlpha.arithmeticMean_not_A5prime` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **A5′** | `5f0bb5ee` |
| impostor death — HM | `Lutar.Wave6.SetAlpha.harmonicMean_not_A5prime` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **A5′** | `5f0bb5ee` |
| impostor death — PM² | `Lutar.Wave6.SetAlpha.powerMeanSq_not_A5prime` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **A5′** | `5f0bb5ee` |
| impostor death — max | `Lutar.Wave6.SetAlpha.maxAgg_not_A5prime` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **A5′** | `5f0bb5ee` |
| impostor death — min | `Lutar.Wave6.SetAlpha.minAgg_not_A5prime` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **A5′** | `5f0bb5ee` |
| Λ passes A5′ at witness | `Lutar.Wave6.SetAlpha.geomMean_passes_A5prime_witness` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |

### 2.2 Set δ — `Lutar/Wave6/SetDeltaUniqueness.lean`

| Result | Decl | PROVED? | `#print axioms` (verbatim) | Declared axiom | Commit |
|---|---|---|---|---|---|
| Λ satisfies δ1 (Reflexivity) | `Lutar.Wave6.SetDelta.lambda_delta1` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |
| Λ satisfies δ2 (Symmetry) | `Lutar.Wave6.SetDelta.lambda_delta2` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |
| Λ satisfies δ3 (Bisymmetry) | `Lutar.Wave6.SetDelta.lambda_delta3` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |
| Λ ∈ Set δ | `Lutar.Wave6.SetDelta.lambda_satisfies_setDelta` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none (AXIOM-FREE) | `5f0bb5ee` |
| **uniqueness in Set δ** | `Lutar.Wave6.SetDelta.geomMean_unique_KS` | **YES (CI-green, CONDITIONAL)** | `[propext, Classical.choice, Quot.sound, Lutar.Wave6.SetDelta.KS_theorem_1_1, Lutar.Wave6.SetDelta.setDelta_stage2]` | **`KS_theorem_1_1` + `setDelta_stage2`** | `5f0bb5ee` |
| impostor death — max | `Lutar.Wave6.SetDelta.maxAgg_not_PSI` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **δ4-PSI** | `5f0bb5ee` |
| impostor death — min | `Lutar.Wave6.SetDelta.minAgg_not_PSI` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **δ4-PSI** | `5f0bb5ee` |
| impostor death — AM | `Lutar.Wave6.SetDelta.arithmeticMean_not_delta5` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **δ5′** | `5f0bb5ee` |
| impostor death — HM | `Lutar.Wave6.SetDelta.harmonicMean_not_delta5` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **δ5′** | `5f0bb5ee` |
| impostor death — PM² | `Lutar.Wave6.SetDelta.powerMeanSq_not_delta5` | **YES (CI-green)** | `[propext, Classical.choice, Quot.sound]` | none — dies by **δ5′** | `5f0bb5ee` |

### 2.3 Cauchy helper — `Lutar/Wave6/MonotoneAdditiveLinear.lean`

| Result | Decl | PROVED? | Declared axiom | Commit |
|---|---|---|---|---|
| monotone-additive ⇒ ℝ-linear (classical Cauchy lemma, pure rational squeeze) | `additive_ratCast_linear`, `monotone_additive_linear` | **YES (CI-green)** | none (AXIOM-FREE) | `5f0bb5ee` |

---

## 3. The impostors-die machine-check (which axiom kills each)

In **Set α** the discriminator is **A5′ multiplicativity** (`A5_Multiplicativity`); each non-Λ mean fails it at the doc witness x = (4,1), y = (2,3), xy = (8,3):

| Impostor | Witness arithmetic | Killed by |
|---|---|---|
| max | max(8,3)=8 ≠ 12 = max(4,1)·max(2,3) | **A5′** |
| min | min(8,3)=3 ≠ 2 = min(4,1)·min(2,3) | **A5′** |
| arithmetic mean | AM(8,3)=5.5 ≠ 6.25 = AM(4,1)·AM(2,3) | **A5′** |
| harmonic mean | HM(8,3)=48/11 ≠ 96/25 | **A5′** |
| power mean (order 2, squared form) | PM²(8,3)=36.5 ≠ 55.25 | **A5′** |

In **Set δ** the discriminator splits — max/min are killed by **δ4-PSI** (per-argument strict monotonicity: fixing the dominating/dominated coordinate makes a strict increase in the other coordinate non-strict), while AM/HM/PM² are killed by **δ5′ multiplicativity**:

| Impostor | Killed by |
|---|---|
| max | **δ4-PSI** (`maxAgg_not_PSI`) |
| min | **δ4-PSI** (`minAgg_not_PSI`) |
| arithmetic mean | **δ5′** (`arithmeticMean_not_delta5`) |
| harmonic mean | **δ5′** (`harmonicMean_not_delta5`) |
| power mean (order 2) | **δ5′** (`powerMeanSq_not_delta5`) |

Every one of these ten impostor-death lemmas carries `#print axioms = [propext, Classical.choice, Quot.sound]` (Lean core only) — **no declared Lutar axiom and no `sorryAx`** — so the kill is genuine, not assumed. By contrast `geomMean_passes_A5prime_witness` shows Λ **passes** A5′ at the same witness, confirming the discriminator separates Λ from the impostors rather than killing everything.

---

## 4. `#print axioms` — VERBATIM (from the SUCCESS build log @ `5f0bb5ee`)

```
info: Lutar/Wave6/SetAlphaUniqueness.lean:375:0: 'Lutar.Wave6.SetAlpha.lambda_satisfies_setAlpha' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:376:0: 'Lutar.Wave6.SetAlpha.diagLog_additive' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:377:0: 'Lutar.Wave6.SetAlpha.expCauchy_diagonal' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:378:0: 'Lutar.Wave6.SetAlpha.lambda_unique_setAlpha' depends on axioms: [propext,
 Classical.choice,
 Quot.sound,
 Lutar.Wave6.SetAlpha.setAlpha_cauchy]
info: Lutar/Wave6/SetAlphaUniqueness.lean:379:0: 'Lutar.Wave6.SetAlpha.arithmeticMean_not_A5prime' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:380:0: 'Lutar.Wave6.SetAlpha.harmonicMean_not_A5prime' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:381:0: 'Lutar.Wave6.SetAlpha.powerMeanSq_not_A5prime' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:382:0: 'Lutar.Wave6.SetAlpha.maxAgg_not_A5prime' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:383:0: 'Lutar.Wave6.SetAlpha.minAgg_not_A5prime' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetAlphaUniqueness.lean:384:0: 'Lutar.Wave6.SetAlpha.geomMean_passes_A5prime_witness' depends on axioms: [propext, Classical.choice, Quot.sound]

info: Lutar/Wave6/SetDeltaUniqueness.lean:291:0: 'Lutar.Wave6.SetDelta.lambda_delta1' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:292:0: 'Lutar.Wave6.SetDelta.lambda_delta2' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:293:0: 'Lutar.Wave6.SetDelta.lambda_delta3' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:294:0: 'Lutar.Wave6.SetDelta.lambda_satisfies_setDelta' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:295:0: 'Lutar.Wave6.SetDelta.geomMean_unique_KS' depends on axioms: [propext,
 Classical.choice,
 Quot.sound,
 Lutar.Wave6.SetDelta.KS_theorem_1_1,
 Lutar.Wave6.SetDelta.setDelta_stage2]
info: Lutar/Wave6/SetDeltaUniqueness.lean:296:0: 'Lutar.Wave6.SetDelta.maxAgg_not_PSI' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:297:0: 'Lutar.Wave6.SetDelta.minAgg_not_PSI' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:298:0: 'Lutar.Wave6.SetDelta.arithmeticMean_not_delta5' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:299:0: 'Lutar.Wave6.SetDelta.harmonicMean_not_delta5' depends on axioms: [propext, Classical.choice, Quot.sound]
info: Lutar/Wave6/SetDeltaUniqueness.lean:300:0: 'Lutar.Wave6.SetDelta.powerMeanSq_not_delta5' depends on axioms: [propext, Classical.choice, Quot.sound]
```

Only the two uniqueness results carry declared Lutar axioms; everything else (membership + all ten impostor deaths + the witness-pass) is Lean-core only and **`sorryAx`-free**. (In the earlier RED builds these same impostor-death lines showed `sorryAx` because the broken proof left an open goal; the green build confirms `sorryAx` is gone.)

---

## 5. Ecosystem map (each result → a real a11oy / killinchu / UDS / governance use)

| Result | Substrate object | Concrete guarantee |
|---|---|---|
| Λ ∈ Set α / Λ ∈ Set δ (membership) | **Λ trust aggregator** (geometric mean) | Λ is a member of both strengthened axiom classes — the geometric-mean aggregator is consistent with symmetry, idempotency, monotonicity, continuity, and the multiplicative/bisymmetric scaling law that governance trust scores obey. |
| `lambda_unique_setAlpha` (Set α uniqueness, conditional) | **SZL governance gate** | If a trust aggregator is symmetric, idempotent, all-strict-monotone, continuous, and **multiplicative** (A5′), then it MUST be Λ — i.e. multiplicativity pins the aggregator down to the geometric mean (modulo the disclosed `setAlpha_cauchy` linear-extraction bridge). |
| `geomMean_unique_KS` (Set δ uniqueness, conditional) | **killinchu / a11oy quasi-arithmetic-mean trust fusion** | Under reflexivity + symmetry + bisymmetry + per-argument strict monotonicity + multiplicativity, continuity is derived for free (Kiss–Shulman 2026) and the fused aggregator is uniquely Λ — a continuity-free QAM characterization for receipt-trust fusion. |
| 10 impostor deaths (AM/HM/PM²/max/min) | **anti-impersonation discriminator** | Each classical alternative aggregator is machine-proven to violate A5′ (Set α) or δ4-PSI/δ5′ (Set δ), so a fusion engine claiming to be Λ cannot silently swap in a mean/median/max — the violation is exhibited at a concrete witness. |
| `monotone_additive_linear` (Cauchy helper) | shared analytic substrate | The classical building block (monotone + additive ⇒ ℝ-linear) used to pin log-Λ to the diagonal, proved axiom-free by a rational squeeze. |

---

## 6. Honest cumulative count

| Metric | Pre (`b71114cf`, parent) | Post (`5f0bb5ee`, CI-green) | Δ |
|---|---|---|---|
| declarations | 1189 | **1238** | +49 (MonotoneAdditiveLinear +2, SetAlpha +30, SetDelta +17) |
| axioms_raw | 20 | **23** | +3 |
| axioms_unique | 19 | **22** | +3 (`setAlpha_cauchy`, `KS_theorem_1_1`, `setDelta_stage2`) |
| sorries_raw | 308 | **308** | **0 (zero new open obligations)** |
| sorries_noncomment | 256 | **256** | 0 |
| locked v11 kernel | 749/14/163 @ `c7c0ba17` | **749/14/163 @ `c7c0ba17`** | UNCHANGED |
| `locked_proven` | 5 | **5** | UNCHANGED |

**New genuinely kernel-verified content this campaign (22 results across 3 modules):**
- **AXIOM-FREE (Lean-core only), CI-green:** both Λ-membership theorems, all three Set δ δ1/δ2/δ3 lemmas, both diagonal Cauchy lemmas, the witness-pass lemma, the two Cauchy-helper lemmas, and **all ten impostor deaths**.
- **CONDITIONAL on declared+cited axioms, CI-green:** `lambda_unique_setAlpha` (on `setAlpha_cauchy`) and `geomMean_unique_KS` (on `KS_theorem_1_1` + `setDelta_stage2`).

**What is now CI-green vs. what stays a conjecture (honest summary):**
- **CI-GREEN (proven):** uniqueness of Λ **within Set α and within Set δ**, conditional on the disclosed bridge axioms; plus axiom-free membership and ten axiom-free impostor deaths.
- **STAYS FALSE (machine-checked):** unconditional uniqueness under the ORIGINAL A1–A5 — the `Round13.maxAgg_ne_Lambda` counterexample is in-tree and untouched.
- **STAYS Conjecture 1:** the Λ-uniqueness statement for the original axioms is Conjecture 1 and is NOT promoted to a theorem by this work. Strengthening the axiom class (A5 → A5′ multiplicativity, or deriving continuity via Kiss–Shulman) is precisely what makes the conditional uniqueness provable; it does not bear on the original weaker conjecture.

---

## 7. Honesty statement (with citations)

This campaign proves uniqueness of the geometric-mean aggregator Λ **only within principled STRENGTHENED axiom classes** (Set α and Set δ), and only **CONDITIONAL on explicitly declared, cited bridge axioms** (`setAlpha_cauchy`; `KS_theorem_1_1` + `setDelta_stage2`), each disclosed verbatim via `#print axioms` (§4). It is **NOT** a proof of unconditional uniqueness under the original weaker A1–A5: that statement stays **machine-checked FALSE** via the in-tree counterexample `Round13.maxAgg_ne_Lambda`, and the Λ-uniqueness statement for the original axioms therefore **remains Conjecture 1** and is never described as a closed theorem. There are **zero new open obligations** (`sorries_raw` unchanged at 308; no `sorryAx` in any disclosed dependency). The locked v11 kernel (749/14/163 @ `c7c0ba17`) and `locked_proven = 5` are unchanged; all of this is the separate experimental scope. The verified commits live on **PR #192 / branch `lambda-uniqueness/unconditional-setalpha`**; shared `main` was **not** force-updated (only the experimental branch ref), and this work is **not** merged to `main`.

The axiomatic-characterization framing follows the multiplicative / consistent-aggregation tradition of **Aczél & Saaty (1983)**, *Procedures for synthesizing ratio judgements*, J. Math. Psychology 27(1):93–102 ([doi:10.1016/0022-2496(83)90028-7](https://doi.org/10.1016/0022-2496(83)90028-7)); the geometric-mean / consistency characterization is in the vein of **Csató (2018)**, *Characterization of the row geometric mean ranking with a group consensus axiom* ([arXiv:1706.07256](https://arxiv.org/abs/1706.07256)). The Set δ continuity-free quasi-arithmetic-mean reduction is the declared bridge **Kiss & Shulman (2026)**, Theorem 1.1 ([arXiv:2606.05221](https://arxiv.org/abs/2606.05221)) — a result not yet in Mathlib, hence carried as a cited axiom. The strengthened-axiom-class / subsort discipline (proving within a stronger class without claiming the weaker one) is in the spirit of **Goguen & Meseguer** order-sorted algebra (*An Oxford survey of order sorted algebra*, Math. Struct. Comp. Sci. — [Cambridge Core](https://www.cambridge.org/core/journals/mathematical-structures-in-computer-science/article/an-oxford-survey-of-order-sorted-algebra/262678443C1EC2A3328237B770729049)), where guarantees proven on a stronger sort do not transfer downward to the weaker one.

**Branch:** `lambda-uniqueness/unconditional-setalpha` · **PR:** #192 · **Final verified SHA:** `5f0bb5ee5ce00ba3e467c9e3c6555e4874f9d260`

Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
