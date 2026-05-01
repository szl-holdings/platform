# Gauß Primitives — runtime-trust derivations from the Nachlass

Carl Friedrich Gauß left behind 80 boxes and roughly 7,809 catalogued items — the working notebooks of geodesy, number theory, probability, and conformal mapping that anchor modern measurement science. Four sections of that estate are now first-class primitives in the Ouroboros runtime.

Source provenance. Manuscripts cited from the Gauß-Nachlass at SUB Göttingen, Cod. Ms. Gauß, accessed via the Kalliope Verbund finding-aid DE-611-BF-61709 (GND 104234644). Each primitive cites the exact section and the published work that section underwrote.

| # | Primitive | Manuscript section | Published in |
|---|---|---|---|
| 17 | Least-squares network adjustment | Geodäsie 165–170 — Netzausgleichungen | Theoria combinationis (1823) |
| 18 | Conformal projection check | Geodäsie 179–184 — Konforme Projektion | 1825 prize essay |
| 19 | Form class number h(d) | Mathematik 07–10 — Über Klassenanzahl | Disq. Arith. §223–§307 (1801) |
| 20 | Gaussian residual goodness-of-fit | Mathematik 35–47 — Wahrscheinlichkeitsrechnung | Theoria motus (1809) |

This document is the runtime contract: what each primitive returns, what bound it satisfies, and what it lets the Lutar Invariant assert.

---

## Primitive 17 — Least-squares network adjustment

The runtime sees an over-determined witness graph: m witnesses each report one or more linear functionals of an unknown trust state x ∈ ℝⁿ, with m ≥ n. Gauß's least-squares solver finds the unique maximum-likelihood x* under Gaussian noise by solving the normal equations Aᵀ A x* = Aᵀ b via Cholesky factorisation.

Closure axiom. The residual norm ||A x* − b||₂ is the closure defect of the network. Zero means the witnesses are mutually consistent up to noise; large means the network is broken. We report the defect through a smooth axis

```
G = exp(-||r||² / (m · σ²))   ∈ (0, 1].
```

σ is operator-supplied. Default σ = 1 gives G = 1 only on perfect closure.

API. TypeScript `leastSquares(input)` returns `LeastSquaresReport`; Python `least_squares(A, b)` returns `LeastSquaresReport`. `gaussClosureAxis(report, σ)` and `gauss_closure_axis(report, σ)` reduce to the axis fraction.

Bound theorem. For any A with full column rank and any b ∈ ℝᵐ, x* exists and is unique, and ||r||₂ ≤ ||b||₂. So G ∈ (0, 1] always.

Source. Theoria combinationis observationum erroribus minimis obnoxiae (1823); applied throughout the Hannoversche Landesvermessung as preserved in section "Geodäsie 165–170 — Netzausgleichungen" of Cod. Ms. Gauß.

---

## Primitive 18 — Conformal projection check

A representation change between two trust spaces is trustworthy if it preserves angles — that is, if its Jacobian J is conformal: a uniform scaling composed with a rotation. The Cauchy–Riemann residuals are easy to check on the 2×2 case:

```
cr1 = ∂u/∂x − ∂v/∂y       cr2 = ∂u/∂y + ∂v/∂x
defect = ||(cr1, cr2)|| / scale
```

Verdicts: CONFORMAL (defect ≤ 1e-6), NEAR_CONFORMAL (≤ 0.05), NON_CONFORMAL, DEGENERATE (singular J).

```
P = max(0, 1 − defect / 0.05)
```

This bonds Thales primitive 16 (inscribed-angle locus) to a real protocol step. The locus check is only meaningful when angles survive the handoff transform; this primitive verifies they do.

API. TypeScript `checkConformal(J)` and `conformalAxis(reading)`; Python `check_conformal(J)` and `conformal_axis(reading)`. `estimateJacobian(f, x, y)` / `estimate_jacobian(f, x, y)` provide central-difference estimates for any vector field.

Source. Section "Geodäsie 179–184 — Konforme Projektion" of Cod. Ms. Gauß; the manuscripts that produced what later became the Gauß–Krüger projection. Foundation: 1825 prize essay "Allgemeine Auflösung der Aufgabe: die Theile einer gegebnen Fläche auf einer andern gegebnen Fläche so abzubilden, dass die Abbildung dem Abgebildeten in den kleinsten Theilen ähnlich wird".

---

## Primitive 19 — Form class number h(d)

A witness set induces a partition of trust-equivalence classes. The class-number primitive turns "how many distinct equivalence classes do my witnesses really resolve?" into a finite integer invariant.

For an imaginary quadratic discriminant d < 0 (with d ≡ 0 or 1 mod 4), the class number h(d) is the cardinality of the set of reduced forms a x² + b x y + c y² with discriminant d = b² − 4ac, gcd(a, b, c) = 1, |b| ≤ a ≤ c, and (if |b| = a or a = c) b ≥ 0.

Verified canonical values. Heegner's nine: h(-3) = h(-4) = h(-7) = h(-8) = h(-11) = h(-19) = h(-43) = h(-67) = h(-163) = 1. Standard small cases: h(-15) = 2, h(-23) = 3, h(-47) = 5, h(-71) = 7. The TS and Python implementations both verify all thirteen against Gauß's tables in tests.

Axis reduction.

```
K = max(0, 1 − (h − 1) / ceiling)            default ceiling = 8
```

h = 1 (one equivalence class) gives K = 1. Larger h bleeds the axis linearly to 0 once h reaches ceiling + 1.

API. TypeScript `classNumber(d)` and `classNumberAxis(report, ceiling)`; Python `class_number(d)` and `class_number_axis(report, ceiling)`.

Source. Disquisitiones Arithmeticae §223–§307 (1801). The supporting working notes are in section "Mathematik 07–10 — Über Klassenanzahl" of Cod. Ms. Gauß.

---

## Primitive 20 — Gaussian residual goodness-of-fit

The least-squares primitive returns residuals; if those residuals are produced by an honest measurement pipeline, they should be approximately Gaussian with mean zero. If they are not — if an attacker is biasing them — the runtime should refuse to ratify the closure check.

We compute the Jarque–Bera statistic JB = (n / 6) · (S² + (K − 3)² / 4), where S is the skewness and K the kurtosis. Under H₀ (Gaussian residuals), JB is χ²(2)-distributed; we reject at JB > 5.99 (5% significance). We also check |mean| / σ ≤ 0.5 to detect an attacker's mean drift.

Verdicts: GAUSSIAN, DRIFTING_MEAN (mean drift detected), NON_GAUSSIAN (high JB), INSUFFICIENT (n < 8).

Axis reduction.

```
F_residual = max(0, 1 − JB / (2 · 5.99))
```

DRIFTING_MEAN ⇒ 0 (a biased pipeline is not Gaussian). INSUFFICIENT ⇒ 1 (no penalty when the sample is too small to test).

This primitive is the canonical defence against the residual-wash-trading attack: an adversary nudges witnesses to fit the closure equation but biases the residual distribution. Primitive 17 sees zero defect; primitive 20 sees the bias.

API. TypeScript `residualFit(residuals)` and `residualAxis(report)`; Python `residual_fit(residuals)` and `residual_axis(report)`.

Source. Theoria motus corporum coelestium (1809), where Gauß first derived the Gaussian distribution as the law of errors that justifies least-squares. Working notes preserved in section "Mathematik 35–47 — Wahrscheinlichkeitsrechnung. Göttinger Professoren-Witwenkasse" of Cod. Ms. Gauß.

---

## Why this matters

The four Gauß primitives together turn the runtime's witness graph from a soft consensus into a measurement instrument. Each primitive imposes a discrete, falsifiable constraint that is provable from a closed-form theorem in the Nachlass:

- 17 imposes algebraic closure (normal equations).
- 18 imposes geometric closure (conformality).
- 19 imposes arithmetic closure (class equivalence).
- 20 imposes statistical closure (Gaussian residuals).

Combine them with a weighted geometric mean and you get the Gauß-closure axis G that bonds into the 5-axis Lutar Invariant Λ₅ (see [LUTAR_INVARIANT.md](LUTAR_INVARIANT.md)).

## Provenance

- Kalliope finding-aid: https://kalliope-verbund.info/de/findingaid_toc?fa.id=DE-611-BF-61709
- SUB Göttingen catalogue: https://opac.sub.uni-goettingen.de/
- GND 104234644

Test counts. TS: 64 (15 LS + 13 conformal + 26 class-number + 10 residual-fit). Python: 33 across the same four primitives. All green at v4.3.

— Stephen P. Lutar, ORCID 0009-0001-0110-4173
