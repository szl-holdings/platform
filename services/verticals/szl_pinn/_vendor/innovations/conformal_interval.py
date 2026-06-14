# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — clean-room innovation (PINN sibling of the FE-NO band)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""
conformal_interval.py — HONEST UNCERTAINTY for the PINN solution field.

SZL INNOVATION (beyond the bare PINN of Raissi et al. 2019). A PINN reports a
point-estimate field; we refuse to ship a bare point estimate as a "trusted
physics result". We wrap every per-point PINN prediction in a DISTRIBUTION-FREE
split-conformal prediction interval at a user-chosen coverage 1 - alpha. This is
the same construction the FE-NO operator subdomain uses, so PINN inherits the
sibling honest-error contract.

METHOD (split / inductive conformal prediction; Vovk; Lei et al.):
  1. Reserve a calibration set drawn from the SAME PDE/solution family the PINN
     serves (e.g. held-out (x,t) points with the analytic reference, or a
     residual-based score where no closed form exists).
  2. Nonconformity score s_i = |u_hat(x_i) - u_ref(x_i)|.
  3. Conformal radius q_hat = the ceil((n+1)(1-alpha))/n empirical quantile.
  4. Interval at a new point: [u_hat - q_hat, u_hat + q_hat].
  5. GUARANTEE (the ONLY claim): under exchangeability, P(u_true in interval)
     >= 1 - alpha in finite samples. No Gaussian assumption, no Lipschitz const.

HONESTY: coverage holds ONLY under exchangeability. Off-distribution (a new
alpha, a hotspot layout never calibrated) breaks it — we emit a
`distribution_shift_flag` and the MEASURED realized coverage, never a bare "90%".
This is an honest auditable error bar, NOT a proof of correctness. Lambda =
Conjecture 1 (advisory). Pure stdlib (math only).
"""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Dict, Sequence


@dataclass
class ConformalBand:
    alpha: float                  # miscoverage target (0.10 -> 90% coverage target)
    q_hat: float                  # conformal radius (same units as the field)
    n_cal: int                    # calibration set size
    target_coverage: float        # 1 - alpha
    realized_coverage: float      # MEASURED on a held-out check set (never assumed)
    distribution_shift_flag: bool # honest: True if check coverage < target - tol
    method: str = "split-conformal (absolute-residual nonconformity)"

    def to_dict(self) -> Dict:
        return asdict(self)


def conformal_quantile(cal_scores: Sequence[float], alpha: float) -> float:
    """Finite-sample conformal quantile: ceil((n+1)(1-alpha))/n empirical quantile."""
    n = len(cal_scores)
    if n == 0:
        raise ValueError("calibration set is empty — cannot certify coverage")
    if not (0.0 < alpha < 1.0):
        raise ValueError("alpha must be in (0,1)")
    s = sorted(cal_scores)
    k = math.ceil((n + 1) * (1.0 - alpha))
    k = min(k, n)               # if (n+1)(1-alpha) > n, interval is unbounded -> use max
    return float(s[k - 1])


def calibrate(
    cal_pred: Sequence[float],
    cal_true: Sequence[float],
    check_pred: Sequence[float],
    check_true: Sequence[float],
    alpha: float = 0.10,
    shift_tol: float = 0.03,
) -> ConformalBand:
    """Build a conformal band from calibration residuals; MEASURE realized coverage."""
    if len(cal_pred) != len(cal_true):
        raise ValueError("calibration pred/true length mismatch")
    cal_scores = [abs(p - t) for p, t in zip(cal_pred, cal_true)]
    q = conformal_quantile(cal_scores, alpha)
    covered = sum(1 for p, t in zip(check_pred, check_true) if abs(p - t) <= q)
    realized = covered / len(check_true) if check_true else 0.0
    target = 1.0 - alpha
    shift = realized < (target - shift_tol)
    return ConformalBand(
        alpha=alpha, q_hat=q, n_cal=len(cal_scores),
        target_coverage=target, realized_coverage=realized,
        distribution_shift_flag=shift,
    )


if __name__ == "__main__":
    # Self-demo on synthetic residuals (NOT a physics result — illustrates math).
    import random
    random.seed(7)
    cal_true = [random.gauss(0, 1) for _ in range(500)]
    cal_pred = [t + random.gauss(0, 0.02) for t in cal_true]
    chk_true = [random.gauss(0, 1) for _ in range(500)]
    chk_pred = [t + random.gauss(0, 0.02) for t in chk_true]
    band = calibrate(cal_pred, cal_true, chk_pred, chk_true, alpha=0.10)
    print("ConformalBand:", band.to_dict())
    assert band.realized_coverage >= 0.85, "demo coverage sanity"
    print("OK — conformal band realizes ~90% coverage on in-distribution check set.")
