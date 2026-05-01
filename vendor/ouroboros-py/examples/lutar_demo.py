"""Lutar Invariant demo — Python SDK.

Run from packages/ouroboros-py:
    python examples/lutar_demo.py

This mirrors the TypeScript demo at packages/invariant/examples/.
"""
from __future__ import annotations

from ouroboros import (
    LutarAxes,
    WitnessView,
    compute_seked,
    decompose_unit_fraction,
    egyptian_multiply,
    inspectable_weight,
    lutar_invariant,
    reconcile_frustum,
    seked_to_degrees,
)


def banner(title: str) -> None:
    print("\n" + "=" * 64)
    print(title)
    print("=" * 64)


def main() -> None:
    banner("1. Frustum reconciliation (MMP-14 / Liu Hui)")
    leaves = ["bit-a", "bit-b", "bit-c"]
    rep = reconcile_frustum(
        [
            WitnessView(id="rekor", leaves=tuple(leaves), source="rekor.sigstore.dev"),
            WitnessView(id="ct-log", leaves=tuple(leaves), source="ct.googleapis.com"),
            WitnessView(id="anchor", leaves=tuple(leaves), source="szl-holdings"),
        ]
    )
    print(f"verdict             : {rep.verdict}")
    print(f"per-witness volume  : {rep.per_witness_volume}")
    print(f"max symmetric diff  : {rep.max_symmetric_difference}")

    banner("2. Seked slope audit (RMP 56-60)")
    r = compute_seked(11, 14)  # Great Pyramid base/height
    print(f"seked               : {r.seked} palms-per-cubit")
    print(f"slope               : {seked_to_degrees(r.seked):.3f}°")
    print(f"verdict             : {r.verdict}")

    banner("3. Unit-fraction inspectability")
    d = decompose_unit_fraction(2, 3)
    print(f"2/3 decomposes into : 1/{ ' + 1/'.join(str(t) for t in d.terms)}")
    print(f"exact               : {d.exact}")

    banner("4. Egyptian doubling multiplication")
    t = egyptian_multiply(11, 13)
    print(f"11 · 13             : {t.product}")
    print(f"steps               : {len(t.steps)} doubling rounds")

    banner("5. Lutar Invariant Λ")
    axes = LutarAxes(cleanliness=0.88, horizon=0.85, resonance=0.88, frustum=0.93)
    report = lutar_invariant(axes)
    print(f"Λ                   : {report.invariant:.4f}")
    print(f"formula             : {report.proof.formula}")
    print(f"min axis            : {report.proof.min_axis:.3f}")
    print(f"max axis            : {report.proof.max_axis:.3f}")
    print(f"weight sum exact    : {report.proof.weight_sum_exact}")
    print(f"bound holds         : 0 ≤ {report.invariant:.4f} ≤ {report.proof.bound_upper:.4f}")

    banner("6. Custom weights — operator emphasizes Cleanliness")
    from ouroboros import LutarWeights
    weights = LutarWeights(
        cleanliness=inspectable_weight(2, 3),
        horizon=inspectable_weight(1, 6),
        resonance=inspectable_weight(1, 12),
        frustum=inspectable_weight(1, 12),
    )
    r2 = lutar_invariant(axes, weights=weights)
    print(f"Λ (cleanliness-weighted): {r2.invariant:.4f}")
    print(f"formula                 : {r2.proof.formula}")


if __name__ == "__main__":
    main()
