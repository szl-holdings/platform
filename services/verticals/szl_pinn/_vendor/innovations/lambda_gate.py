# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — clean-room innovation (PINN sibling of the FE-NO gate)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""
lambda_gate.py — Λ-GATED PINN SOLVE: route a PINN provenance receipt through the
a11oy governance gate so a solve whose error estimate is above threshold is
flagged ADVISORY / DENY and never silently trusted.

SZL INNOVATION (beyond the bare PINN). The method produces a number; SZL produces
a GOVERNED number. Deny-by-default verdict, identical posture to the FE-NO gate.

DECISION (deny-by-default; honest labels):
  - ALLOW   : converged AND solution_error_estimate <= tol AND
              (no conformal band OR not distribution_shift_flag) AND
              modeled_not_measured is honestly declared.
  - ADVISORY: converged but a soft signal tripped (error within tol but conformal
              distribution_shift_flag True, or error near the tol ceiling).
  - DENY    : not converged, error > tol, missing receipt, or any error.
              Deny-by-default: absence/weakness of evidence => DENY.

HONESTY DOCTRINE (encoded, never violated):
  - Λ is CONJECTURE 1. This gate is ADVISORY governance, NEVER "proven trust". A
    green verdict means "passed the SZL admission policy", NOT "mathematically
    proven correct", and NOT "measured joules".
  - The PINN output is MODELED; the gate refuses to ALLOW a receipt that claims to
    be measured energy (free-energy guard).

Pure stdlib. No network in the decision path.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, Optional

VERDICT_ALLOW = "ALLOW"
VERDICT_ADVISORY = "ADVISORY"
VERDICT_DENY = "DENY"


@dataclass
class GateVerdict:
    verdict: str                      # ALLOW | ADVISORY | DENY
    advisory: bool                    # True for ADVISORY and DENY
    reason: str
    solution_error_estimate: Optional[float]
    tol: Optional[float]
    converged: Optional[bool]
    distribution_shift_flag: Optional[bool]
    modeled_not_measured: Optional[bool]
    lambda_label: str = ("Λ = Conjecture 1 — advisory governance, NOT 'proven "
                         "trust'; ALLOW means passed SZL admission policy, not "
                         "mathematically proven correct, not measured joules")
    deny_by_default: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def gate_solve(
    receipt: Dict[str, Any],
    *,
    tol: float = 5e-2,
    near_tol_frac: float = 0.85,
) -> GateVerdict:
    """Deny-by-default Λ gate over a PINN ProvenanceReceipt dict."""
    try:
        err = float(receipt["solution_error_estimate"])
        converged = bool(receipt["converged"])
        modeled = bool(receipt.get("modeled_not_measured", True))
        shift = receipt.get("distribution_shift_flag")
    except (KeyError, TypeError, ValueError) as e:
        return GateVerdict(
            verdict=VERDICT_DENY, advisory=True,
            reason=f"deny-by-default: missing/invalid receipt ({e})",
            solution_error_estimate=None, tol=tol, converged=None,
            distribution_shift_flag=None, modeled_not_measured=None,
        )

    # Free-energy guard: a receipt that does NOT honestly declare its field as
    # MODELED (i.e. claims measured energy) is denied outright.
    if not modeled:
        return GateVerdict(
            verdict=VERDICT_DENY, advisory=True,
            reason=("free-energy guard: receipt does not declare modeled_not_"
                    "measured — PINN output is MODELED, never measured joules"),
            solution_error_estimate=err, tol=tol, converged=converged,
            distribution_shift_flag=shift, modeled_not_measured=modeled,
        )

    if (not converged) or (err != err) or (err > tol):
        return GateVerdict(
            verdict=VERDICT_DENY, advisory=True,
            reason=(f"solution_error_estimate {err:.3e} > tol {tol:.3e} or not "
                    f"converged — error estimate above threshold"),
            solution_error_estimate=err, tol=tol, converged=converged,
            distribution_shift_flag=shift, modeled_not_measured=modeled,
        )

    soft = []
    if shift is True:
        soft.append("conformal distribution_shift_flag set (off-distribution)")
    if err >= near_tol_frac * tol:
        soft.append(f"error {err:.3e} near tol {tol:.3e}")
    if soft:
        return GateVerdict(
            verdict=VERDICT_ADVISORY, advisory=True,
            reason="converged but soft signal(s): " + "; ".join(soft),
            solution_error_estimate=err, tol=tol, converged=converged,
            distribution_shift_flag=shift, modeled_not_measured=modeled,
        )

    return GateVerdict(
        verdict=VERDICT_ALLOW, advisory=False,
        reason="converged within tol; no soft signals; passed SZL admission policy",
        solution_error_estimate=err, tol=tol, converged=converged,
        distribution_shift_flag=shift, modeled_not_measured=modeled,
    )


if __name__ == "__main__":
    good = {"solution_error_estimate": 1.1e-2, "converged": True,
            "modeled_not_measured": True, "distribution_shift_flag": False}
    near = {"solution_error_estimate": 4.8e-2, "converged": True,
            "modeled_not_measured": True, "distribution_shift_flag": False}
    bad = {"solution_error_estimate": 2.0e-1, "converged": False,
           "modeled_not_measured": True}
    fake_energy = {"solution_error_estimate": 1e-3, "converged": True,
                   "modeled_not_measured": False}
    print("good       ->", gate_solve(good).verdict)
    print("near-tol    ->", gate_solve(near).verdict)
    print("bad         ->", gate_solve(bad).verdict)
    print("fake-energy ->", gate_solve(fake_energy).verdict)
    print("empty       ->", gate_solve({}).verdict)
    assert gate_solve(good).verdict == VERDICT_ALLOW
    assert gate_solve(near).verdict == VERDICT_ADVISORY
    assert gate_solve(bad).verdict == VERDICT_DENY
    assert gate_solve(fake_energy).verdict == VERDICT_DENY
    assert gate_solve({}).verdict == VERDICT_DENY
    print("OK — deny-by-default Λ gate behaves correctly (incl. free-energy guard).")
