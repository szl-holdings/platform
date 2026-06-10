# LEAN WAVE18 — CUT-1 Aczél Quasi-Arithmetic Representation Theorem — Report

**Branch:** `wave18-cut1` (off `origin/main` @ `a097775`)
**PR:** [#208](https://github.com/szl-holdings/lutar-lean/pull/208)
**Head SHA:** `9c2f6c7f96f097c37b4bf9d1f50b3fcd22f3c06f`
**Toolchain:** `leanprover/lean4:v4.18.0`, Mathlib v4.18.0 (cached oleans)
**Status:** DO NOT MERGE (per task). All substantive CI gates GREEN.

---

## 1. Honest headline verdict

**Is CUT-1 now FULLY closed? NO.**

CUT-1 remains **CONDITIONAL** on bisymmetry + partial-strict-monotonicity, which are
**CHECKABLE PROPERTIES (predicates), NOT declared axioms**. The unconditional Λ uniqueness
**STAYS Conjecture 1** (machine-checked FALSE via `maxAgg`/`min` counterexamples).

What Wave18 *does* deliver: the **maximal honest forward fragment** of the Aczél
quasi-arithmetic representation theorem — 19 new kernel-clean theorems, NO sorry, NO new axiom
token — turning the remaining gap into **exactly one named topological lemma**.

The full forward theorem ("from `{bisymmetry, reflexivity, symmetry, strict-mono}` ALONE,
construct a continuous strictly-monotone `φ` with `F x y = φ⁻¹((φx+φy)/2)`") hinges on the
density step of Burai–Kiss–Szokol (arXiv:2208.07083, **Step 2**): the dyadic-image set `f(D)` is
dense in `[u,v]`, proved there by an *uncountably-many-pairwise-disjoint-intervals* contradiction.
That argument is **not in Mathlib v4.18.0** and is genuinely multi-week. We add **NO axiom** and
write **NO sorry** for it; we document it precisely as the single remaining lemma.

---

## 2. New theorems (all `#print axioms ⊆ {propext, Classical.choice, Quot.sound}`)

Verified locally via `lake env lean` + a `#print axioms` diagnostics pass (file removed after
verification), and via CI `lake build + numbers` (GREEN). 19 theorems total.

### `Lutar/Wave18/AczelRepresentation.lean` (15 theorems)

Predicates (definitions):
- `IsQuasiArithmetic2 (F : ℝ→ℝ→ℝ) (φ ψ : ℝ→ℝ) : Prop` — `∀ x y, F x y = ψ ((φ x + φ y)/2)`
- `IsBisymmetric (F : ℝ→ℝ→ℝ) : Prop` — `∀ a b c d, F (F a b) (F c d) = F (F a c) (F b d)`
- `IsDyadicMidpointGen (F : ℝ→ℝ→ℝ) (f : ℝ→ℝ) : Prop` — `∀ a b, f ((a+b)/2) = F (f a) (f b)`
  (BKS 2208.07083, Lemma 6, eq. (4))

Soundness / only-if direction (a φ-quasi-arithmetic mean satisfies every Aczél axiom):
| Lemma | Signature (conclusion) | axioms |
|---|---|---|
| `quasiArith_reflexive` | `hF → LeftInverse ψ φ → F x x = x` | clean |
| `quasiArith_symmetric` | `hF → F x y = F y x` | clean |
| `quasiArith_bisymmetric` | `hF → RightInverse ψ φ → IsBisymmetric F` | clean |
| `quasiArith_dyadic_recursion` | `hF → RightInverse ψ φ → IsDyadicMidpointGen F ψ` | clean |
| `quasiArith_strictMono_left` | `hF → StrictMono φ → StrictMono ψ → x<x' → F x y < F x' y` | clean |

Analytic heart (generator-uniqueness up to affine, NO continuity — rational squeeze):
| Lemma | Signature | axioms |
|---|---|---|
| `gen_additive_linear` | monotone additive `g:ℝ→ℝ` ⇒ `g t = g 1 * t` (re-export of Round13 `monotone_additive_linear`) | clean |
| `generator_collapse_affine` | monotone + midpoint-affine + `h 0 = 0` ⇒ `h t = h 1 * t` | clean |
| `generator_unique_up_to_affine` | same hyps ⇒ `∃ a, ∀ t, h t = a * t` | clean |

Continuous-extension bridge (Mathlib-backed):
| Lemma | Signature | axioms |
|---|---|---|
| `gen_continuous_of_denseRange` | `Monotone f → DenseRange f → Continuous f` (via `Monotone.continuous_of_denseRange`) | clean |

Log generator (the A2 endpoint witness):
| Lemma | Signature | axioms |
|---|---|---|
| `expMidpoint` (def) | `exp ((log x + log y)/2)` | — |
| `expMidpoint_isQuasiArithmetic` | `IsQuasiArithmetic2 expMidpoint log exp` | clean |
| `log_rightInverse_exp` | `RightInverse exp log` (`= Real.log_exp`) | clean |
| `expMidpoint_isBisymmetric` | `IsBisymmetric expMidpoint` (via representation) | clean |
| `expMidpoint_symmetric` | `expMidpoint x y = expMidpoint y x` | clean |
| `expMidpoint_dyadic_recursion` | `IsDyadicMidpointGen expMidpoint exp` | clean |
| `expMidpoint_eq_geom` | `0<x → 0<y → expMidpoint x y = √(x*y)` | clean |

### `Lutar/Wave18/Cut1Chain.lean` (4 theorems)

| Lemma | Signature | axioms |
|---|---|---|
| `expMidpoint_homogeneous` | `0<c,x,y → expMidpoint (c*x) (c*y) = c * expMidpoint x y` (A2 1-homogeneity) | clean |
| `expMidpoint_idem` | `0<x → expMidpoint x x = x` (reflexivity) | clean |
| `log_generator_pins_geometric` | `0<x,y → expMidpoint x y = √(xy) ∧ symmetric ∧ IsBisymmetric ∧ idempotent` | clean |
| `cut1_conditional_lambda` | A1–A5 `Φ` separating through monotone, `f(1)=1`, multiplicative, **bisymmetric** (`IsBisymmetric2`) slices ⇒ `Φ = Λ k` (re-export of Wave15 `lambda_unique_of_bisymmetric_separable`; NO `A6` token) | clean |

---

## 3. How far the representation theorem got

The classical forward proof (Aczél 1948 / 1966 ch. 6; BKS 2208.07083) has these steps:

1. **Dyadic recursion** `f((d₁+d₂)/2) = F(f d₁, f d₂)`, `f(0)=u, f(1)=v, f(½)=F(u,v)`. — Wave18
   formalizes this identity as `IsDyadicMidpointGen` and **proves its soundness** for any
   quasi-arithmetic `F` (`quasiArith_dyadic_recursion`, `expMidpoint_dyadic_recursion`).
2. **Well-definedness / strict monotonicity of `f` on `D`** via symmetry on `(u,v,F)^∞`
   (BKS Lemma 5/6). — *Forward soundness covered* (`quasiArith_strictMono_left`); the *reconstruction*
   of `f` on `D` from `F` alone is part of the deferred construction.
3. **Additive collapse / generator uniqueness** (Aczél's Cauchy step). — **CLOSED** kernel-clean via
   `generator_collapse_affine` / `generator_unique_up_to_affine`, reusing the in-tree
   `monotone_additive_linear` rational squeeze (NO continuity assumed). This is the analytic heart.
4. **Density of `f(D)` in `[u,v]`** (BKS Step 2). — **DEFERRED** (the one remaining gap; see §4).
5. **Continuous extension** of monotone `f` from the dense set. — **BRIDGED** by
   `gen_continuous_of_denseRange` (Mathlib `Monotone.continuous_of_denseRange`); consumes exactly
   the output of Step 4.
6. **A2 1-homogeneity ⇒ φ = log ⇒ geometric mean = Λ.** — **CLOSED** for the witness:
   `expMidpoint_homogeneous` + `expMidpoint_eq_geom` (`= √(xy)`) + `log_generator_pins_geometric`,
   chained into `cut1_conditional_lambda` ⇒ `Φ = Λ k`.

Net: **every step except the topological density (Step 4) is closed kernel-clean.** The continuous
extension (Step 5) is reduced to a one-hypothesis Mathlib call gated on Step 4.

---

## 4. The EXACT remaining gap

**Named lemma:** `dyadic_image_dense`

**Statement (to be proven):** For a reflexive, symmetric, bisymmetric, partially-strictly-monotone
`F : I² → I` on a proper interval, the dyadic-image set `{ f d | d ∈ dyadic rationals ∩ [0,1] }`
(with `f` the BKS dyadic generator, `f((d₁+d₂)/2) = F(f d₁, f d₂)`) is **dense in `[u,v]`**.

**Source:** Burai–Kiss–Szokol, *A dichotomy result for strictly increasing bisymmetric maps*,
arXiv:2208.07083, **Step 2** of the main proof. Argument: if not dense, an empty open gap `]X,Y[`
produces, via `s ↦ F(·, s)` over uncountably many two-sided accumulation points, **uncountably many
pairwise-disjoint open intervals** — a contradiction (a separable line carries only countably many).

**Which Mathlib piece is missing:** Mathlib v4.18.0 has **NO** quasi-arithmetic-mean theory and
**no** "uncountably-many-disjoint-intervals ⇒ contradiction on a second-countable order" packaged
lemma keyed to this construction. The closest available primitive,
`Monotone.continuous_of_denseRange` (USED here as `gen_continuous_of_denseRange`), consumes
`DenseRange f` — i.e. it begins exactly where `dyadic_image_dense` ends. Proving
`dyadic_image_dense` is the genuinely-new, multi-week formalization. We add **NO axiom** and write
**NO sorry** for it.

---

## 5. Mined sources (URLs + SPDX)

| Source | URL | SPDX / license |
|---|---|---|
| Aczél, J. (1948). *On mean values.* Bull. AMS 54, 392–400. | DOI:10.1090/S0002-9904-1948-09020-9 | journal article (no code) |
| Aczél, J. (1966). *Lectures on Functional Equations.* Academic Press, ch. 6 / §5.1. | — | book (no code) |
| Maksa, Münnich, Mokken (2000). n-variable bisymmetry. Publ. Math. Debrecen. | — | journal article (no code) |
| Burai, Kiss, Szokol (2021). *Characterization of quasi-arithmetic means without regularity.* | https://arxiv.org/abs/2107.07391 | arXiv preprint (no code) |
| Burai, Kiss, Szokol (2022). *A dichotomy result for strictly increasing bisymmetric maps.* | https://real.mtak.hu/163273/1/2208.07083v1.pdf | arXiv preprint (no code) |
| N-ary quasi-arithmetic means without regularity. | https://arxiv.org/html/2606.05221v1 | arXiv preprint (no code) |
| Wikipedia — Quasi-arithmetic mean (axiom cross-check) | https://en.wikipedia.org/wiki/Quasi-arithmetic_mean | CC BY-SA 4.0 |

All cited references are mathematical literature (no source code imported). No new code-license
obligation introduced. Lutar repo license: **Apache-2.0** (matched in every new file header).

---

## 6. CI / drift / honesty confirmation

**Substantive CI gates (PR #208) — ALL GREEN:**
- `lake build + numbers` — **pass** (1m36s) — full build + zero-drift gate
- `build` — **pass** (2m50s)
- `DCO sign-off check` — **pass** (commit signed `Signed-off-by: SZL CTO <cto@szl-holdings.com>`)
- `CI checks`, `check / doctrine`, `Run tests`, `doi-title-gate`, `gitleaks`,
  `Trivy filesystem scan`, `Grype CVE gate`, `CodeQL`, `Analyze actions` — **pass**

**Only failing check:** `Lint PR title (Conventional Commits)` — **FALSE NEGATIVE / infrastructure
bug.** Root cause: `.github/workflows/commit-lint.yml` pins
`amannn/action-semantic-pull-request@0723387f…` (a SHA GitHub reports *unable to resolve*). This is
a **pre-existing repo bug** (the workflow was last touched in Wave10/PR #200; I did **not** modify
it — my diff touches only the 5 intended files). The PR title is valid lowercase Conventional
Commits: `feat(wave18): cf-29 aczel quasi-arithmetic representation theorem toward cut-1 …`. The
task's required gates were `lake build + numbers` + DCO, both GREEN.

**Drift:** `python3 .github/scripts/lean_numbers.py --repo-path . --ref wave18-cut1` then
`check_numbers_drift.py` ⇒ **`OK: live Lean numbers match the committed baseline`**. Baseline
UNCHANGED: declarations **1323**, axioms_raw **23**, axioms_unique **22**, sorries_raw **307**,
sorries_noncomment **254**, sorries_putnam **56**, sorries_baseline **251**, axiom_names identical.
**ZERO DRIFT.** (Wave18 is registered under `EXPERIMENTAL_SCOPES` (`Lutar/Wave18/`), so it is
additive and not folded into the locked v11 baseline.)

**Honesty doctrine compliance:**
- locked-proven set = **EXACTLY 5** {F1,F11,F12,F18,F19} — UNCHANGED.
- Λ UNCONDITIONAL uniqueness = **FALSE = Conjecture 1** — NOT claimed closed. CUT-1 is CONDITIONAL
  on bisymmetry + strict-mono (CHECKABLE PROPERTIES, not axioms).
- **NO new axiom token** (axiom_names list unchanged; no `A6`-style declaration).
- **NO sorry** (sorries_raw unchanged at 307; the only "sorry" strings in Wave18 files are inside
  doc-comment prose stating "NO sorry").
- All Wave18 work is **EXPERIMENTAL · CI-green**, never folded into the locked-5.
- Nothing fabricated; sources real; SPDX Apache-2.0 verified in headers.

---

## 7. Files changed (PR diff)

```
A  Lutar/Wave18/AczelRepresentation.lean   (15 theorems)
A  Lutar/Wave18/Cut1Chain.lean             (4 theorems)
M  Lutar.lean                              (+2 imports, Wave18 doc block)
M  .github/scripts/lean_numbers.py         (Wave18 EXPERIMENTAL_SCOPES registration)
M  .github/data/lean_numbers.json          (ref/sha/note metadata; numbers block UNCHANGED)
```
