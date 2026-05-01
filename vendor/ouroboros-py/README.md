# ouroboros-py

Python SDK for the Ouroboros runtime trust envelope. Faithful Python port of the TypeScript reference runtime in `packages/invariant` and `packages/reconciliation`.

The TypeScript runtime is the reference. This SDK matches it numerically. Use this SDK when you need to integrate with Python pipelines: NIST AI RMF dashboards, DARPA evaluation harnesses, Jupyter audit notebooks, scientific-Python toolchains.

## Why a Python SDK at all

Government and audit pipelines run on Python. NIST AI RMF tooling, DARPA program evaluation harnesses, and most academic reproducibility submissions assume a `pip install` is available. The TypeScript runtime stays as the production reference and the source of truth for test parity. The Python SDK is a thin, faithful wrapper so that auditors can import the same primitives without standing up Node.

## Install

```bash
cd packages/ouroboros-py
pip install -e .
```

Requires Python 3.10 or later. No third-party runtime dependencies.

## Quick start

```python
from ouroboros import LutarAxes, lutar_invariant, verify_lutar_bound

axes = LutarAxes(cleanliness=0.88, horizon=0.85, resonance=0.88, frustum=0.93)
report = lutar_invariant(axes)
print(report.invariant)         # ≈ 0.8847
print(report.proof.formula)     # Λ = C^(1/4) · H^(1/4) · R^(1/4) · F^(1/4)
assert verify_lutar_bound(report)
```

## Four axes

- C — Cleanliness. Witness anchor presence and consistency.
- H — Horizon. Page-curve bounded reversibility.
- R — Resonance. Handoff Q-factor, Landauer-bounded.
- F — Frustum. Three-witness Jaccard reconciliation.

Each axis reduces to a real number in [0,1]. The Lutar Invariant compounds them:

\[ \Lambda = C^{\alpha} \cdot H^{\beta} \cdot R^{\gamma} \cdot F^{\delta} \]

with α + β + γ + δ = 1 and each weight expressible as a finite sum of distinct unit fractions (Egyptian inspectability axiom).

The default weights are α = β = γ = δ = 1/4 — Egyptian-exact, audit-readable, and they reduce Λ to the geometric mean of the four axes.

## Bound theorem

For axes a₁, a₂, a₃, a₄ ∈ [0,1] and Egyptian-exact weights:

\[ 0 \le \Lambda \le \min(a_i) \le \max(a_i) \le 1 \]

`verify_lutar_bound(report)` witnesses this at runtime.

## Egyptian primitives

```python
from ouroboros import (
    decompose_unit_fraction,
    compute_seked,
    egyptian_multiply,
    reconcile_frustum,
    WitnessView,
)

# RMP 2/n table
decompose_unit_fraction(2, 3).terms      # (2, 6) → 1/2 + 1/6

# RMP 56-60 slope audit
compute_seked(11, 14).seked              # 5.5 — Great Pyramid

# Doubling multiplication, HSM-friendly
egyptian_multiply(11, 13).product        # 143

# MMP-14 / Liu Hui frustum reconciliation
reconcile_frustum([
    WitnessView(id="rekor",  leaves=("a","b","c")),
    WitnessView(id="ct-log", leaves=("a","b","c")),
    WitnessView(id="anchor", leaves=("a","b","c")),
]).verdict                               # "RECONCILED"
```

## Run the demo

```bash
python examples/lutar_demo.py
```

## Run the tests

```bash
pip install pytest
pytest -q
```

The Python suite cross-checks numerical parity with the TypeScript reference at decisive points (the thesis default axes, the geometric-mean special case, and the bound theorem).

## Versioning

Python SDK version tracks the runtime. v4.0.0 corresponds to the v4 thesis (Lutar Invariant + Egyptian reconciliation primitives).

## License

BUSL-1.1. See `../../LICENSE` at the runtime root.

## Citations

Lutar, Stephen P. "Ouroboros: Closed-Loop Runtime Trust with the Lutar Invariant" (v4, 2026). Zenodo DOI: 10.5281/zenodo.19934129 (v2; v4 DOI pending).
