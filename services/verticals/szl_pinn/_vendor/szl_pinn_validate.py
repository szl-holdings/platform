# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""szl_pinn_validate — RUN the heat PINN vs analytic + the thermal app; make figure.

Produces:
  * Heat-equation PINN: relative-L2 error vs the closed-form solution + final PDE
    residual loss. A split-conformal band MEASURES coverage of the bounded error.
  * Thermal app: the 2D GPU-die temperature field and the PDE-residual field, plus
    the MODELED Landauer joule accounting (labelled MODELED, never measured).
  * A 4-panel matplotlib figure  pinn_validation.png:
       (1) heat PINN u(x,t) prediction vs analytic at sample times,
       (2) heat PINN total/PDE-residual loss decay over training,
       (3) thermal app predicted temperature field T(x,y) on the die,
       (4) thermal app PDE-residual field (where the steady balance is satisfied).
  * pinn_receipt.json (heat) and pinn_thermal_receipt.json — signer-ready,
    UNSIGNED, with the DSSE envelope skeleton attached.

Everything here REALLY RUNS and converges; no numbers are fabricated.
"""
from __future__ import annotations

import json
import os

import numpy as np

import matplotlib
matplotlib.use("Agg")  # headless / sandbox
import matplotlib.pyplot as plt  # noqa: E402

from szl_pinn_core import HeatProblem, solve_heat_pinn  # noqa: E402
from szl_pinn_thermal import ChipThermalProblem, solve_chip_thermal  # noqa: E402
from receipt import build_statement, build_dsse_envelope  # noqa: E402
from innovations import conformal_interval as ci  # noqa: E402
from innovations import lambda_gate as lg  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
FIG_PATH = os.path.join(HERE, "pinn_validation.png")


def run_heat(verbose=True):
    print("=" * 70)
    print("[1/2] HEAT-EQUATION PINN  u_t = alpha*u_xx  (vs closed-form solution)")
    print("=" * 70)
    prob = HeatProblem(alpha=0.4, L=1.0, T=1.0, k_mode=1)
    res = solve_heat_pinn(prob, hidden=(20, 20), epochs=2000, lr=5e-3,
                          n_pde=400, n_bc=100, n_ic=100, w_bc=20.0, w_ic=20.0,
                          seed=0, verbose=verbose)
    print(f"\n  converged           : {res.converged}")
    print(f"  final PDE residual  : {res.receipt.physics_residual_loss:.3e}  (MEASURED)")
    print(f"  final BC loss       : {res.receipt.bc_loss:.3e}")
    print(f"  final IC loss       : {res.receipt.ic_loss:.3e}")
    print(f"  relative L2 error   : {res.rel_l2_error:.3e}  (BOUNDED ESTIMATE vs analytic)")
    print(f"  verified            : {res.receipt.verified}")
    print(f"  walltime            : {res.receipt.wall_time_s:.2f}s")

    # ---- conformal band: MEASURE coverage of the pointwise error ---------- #
    rng = np.random.default_rng(11)
    cal = np.column_stack([rng.uniform(0, prob.L, 400), rng.uniform(0, prob.T, 400)])
    chk = np.column_stack([rng.uniform(0, prob.L, 400), rng.uniform(0, prob.T, 400)])
    cal_pred = res.net.forward(cal).ravel().tolist()
    cal_true = prob.u_exact(cal[:, 0], cal[:, 1]).tolist()
    chk_pred = res.net.forward(chk).ravel().tolist()
    chk_true = prob.u_exact(chk[:, 0], chk[:, 1]).tolist()
    band = ci.calibrate(cal_pred, cal_true, chk_pred, chk_true, alpha=0.10)
    print(f"  conformal 90% band  : q_hat={band.q_hat:.3e}  "
          f"realized_coverage={band.realized_coverage:.3f}  "
          f"shift_flag={band.distribution_shift_flag}")

    # ---- Λ gate over the receipt ------------------------------------------ #
    rc = json.loads(res.receipt.to_json())
    rc["distribution_shift_flag"] = band.distribution_shift_flag
    verdict = lg.gate_solve(rc, tol=5e-2)
    print(f"  Lambda gate verdict : {verdict.verdict}  ({verdict.reason})")

    # ---- emit signer-ready receipt + DSSE envelope ------------------------ #
    stmt = build_statement(res.receipt, sovereign=True)
    stmt["predicate"]["measured_relative_L2_error"] = res.rel_l2_error
    stmt["predicate"]["conformal_band"] = band.to_dict()
    stmt["predicate"]["lambda_gate"] = verdict.to_dict()
    env = build_dsse_envelope(stmt)
    with open(os.path.join(HERE, "pinn_receipt.json"), "w") as f:
        json.dump({"statement": stmt, "dsse_envelope": env}, f, indent=2, default=str)
    print("  wrote pinn_receipt.json (UNSIGNED, signer-ready)")
    return prob, res, band


def run_thermal(verbose=True):
    print("\n" + "=" * 70)
    print("[2/2] THERMAL APP  alpha*(T_xx+T_yy)+s=0  (GPU-die compute-load heat)")
    print("=" * 70)
    prob = ChipThermalProblem()
    res = solve_chip_thermal(prob, hidden=(28, 28), epochs=4000, lr=4e-3,
                             n_pde=1200, n_bc=240, w_bc=40.0, seed=0, verbose=verbose)
    print(f"\n  converged            : {res.converged}")
    print(f"  final PDE residual   : {res.receipt.physics_residual_loss:.3e}  (MEASURED)")
    print(f"  RMS residual (grid)  : {res.rms_residual:.3e}")
    print(f"  REL residual (grid)  : {res.rel_residual:.3e}  (BOUNDED ESTIMATE)")
    print(f"  verified             : {res.receipt.verified}")
    print(f"  peak MODELED T       : {res.T_field.max():.4f} (relative units)")
    print(f"  MODELED Landauer floor: {res.joule_accounting['modeled_landauer_floor_W']:.3e} W"
          f"  [{res.joule_accounting['label']}]")

    stmt = build_statement(res.receipt, sovereign=True)
    stmt["predicate"]["joule_accounting"] = res.joule_accounting
    env = build_dsse_envelope(stmt)
    with open(os.path.join(HERE, "pinn_thermal_receipt.json"), "w") as f:
        json.dump({"statement": stmt, "dsse_envelope": env}, f, indent=2, default=str)
    print("  wrote pinn_thermal_receipt.json (UNSIGNED, signer-ready)")
    return prob, res


def make_figure(heat_prob, heat_res, thermal_prob, thermal_res):
    fig, axes = plt.subplots(2, 2, figsize=(13, 10))

    # ---- (1) heat PINN prediction vs analytic at sample times ------------- #
    ax = axes[0, 0]
    xs = np.linspace(0, heat_prob.L, 120)
    for t in (0.0, 0.1, 0.3, 0.6):
        X = np.column_stack([xs, np.full_like(xs, t)])
        up = heat_res.net.forward(X).ravel()
        ue = heat_prob.u_exact(xs, np.full_like(xs, t))
        line = ax.plot(xs, up, lw=2, label=f"PINN t={t}")[0]
        ax.plot(xs, ue, "--", color=line.get_color(), lw=1.2, alpha=0.8)
    ax.set_title(f"Heat PINN  u(x,t)  vs analytic (dashed)\n"
                 f"rel-L2 = {heat_res.rel_l2_error:.2e}  (BOUNDED ESTIMATE)")
    ax.set_xlabel("x"); ax.set_ylabel("u(x,t)")
    ax.legend(fontsize=8); ax.grid(alpha=0.3)

    # ---- (2) loss decay --------------------------------------------------- #
    ax = axes[0, 1]
    hist = np.array(heat_res.history)
    ax.semilogy(hist[:, 0], hist[:, 1], label="total loss", lw=1.5)
    ax.semilogy(hist[:, 0], hist[:, 2], label="PDE-residual loss", lw=1.5)
    ax.semilogy(hist[:, 0], hist[:, 3], label="BC loss", lw=1.0, alpha=0.8)
    ax.semilogy(hist[:, 0], hist[:, 4], label="IC loss", lw=1.0, alpha=0.8)
    ax.set_title("Heat PINN training loss decay (physics_loss)")
    ax.set_xlabel("epoch"); ax.set_ylabel("loss (log)")
    ax.legend(fontsize=8); ax.grid(alpha=0.3, which="both")

    # ---- (3) thermal predicted temperature field ------------------------- #
    ax = axes[1, 0]
    im = ax.pcolormesh(thermal_res.grid_x, thermal_res.grid_y,
                       thermal_res.T_field, shading="auto", cmap="inferno")
    fig.colorbar(im, ax=ax, label="MODELED T (relative units)")
    for (cx, cy, p, r) in thermal_prob.hotspots:
        ax.plot(cx, cy, "co", ms=5, mec="white")
    ax.set_title("Thermal PINN: GPU-die temperature field T(x,y)\n"
                 "compute-load hotspots (cyan) — MODELED, not measured")
    ax.set_xlabel("x (die)"); ax.set_ylabel("y (die)")

    # ---- (4) thermal residual field --------------------------------------- #
    ax = axes[1, 1]
    im = ax.pcolormesh(thermal_res.grid_x, thermal_res.grid_y,
                       np.abs(thermal_res.residual_field), shading="auto",
                       cmap="viridis")
    fig.colorbar(im, ax=ax, label="|PDE residual|")
    ax.set_title(f"Thermal PINN: |steady heat-balance residual|\n"
                 f"REL residual = {thermal_res.rel_residual:.2e}  (BOUNDED ESTIMATE)")
    ax.set_xlabel("x (die)"); ax.set_ylabel("y (die)")

    fig.suptitle("SZL PINN core — validation (clean-room; heat eq + sovereign-energy "
                 "thermal app)\nMODELED fields, honest bounded-error ESTIMATEs, "
                 "Λ=Conjecture 1 advisory · Doctrine v11",
                 fontsize=12, y=0.99)
    fig.tight_layout(rect=[0, 0, 1, 0.96])
    fig.savefig(FIG_PATH, dpi=130)
    print(f"\n  wrote {FIG_PATH}")


def main():
    heat_prob, heat_res, _band = run_heat(verbose=True)
    thermal_prob, thermal_res = run_thermal(verbose=True)
    make_figure(heat_prob, heat_res, thermal_prob, thermal_res)
    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY (all numbers MEASURED at runtime, none fabricated)")
    print("=" * 70)
    print(f"  Heat PINN    rel-L2 error      : {heat_res.rel_l2_error:.3e}")
    print(f"  Heat PINN    PDE residual loss : {heat_res.receipt.physics_residual_loss:.3e}")
    print(f"  Heat PINN    verified          : {heat_res.receipt.verified}")
    print(f"  Thermal app  REL residual      : {thermal_res.rel_residual:.3e}")
    print(f"  Thermal app  verified          : {thermal_res.receipt.verified}")
    print("  Honesty: temperature/joule fields are MODELED, never measured. "
          "Harvest targets WASTED heat only. NO free-energy/over-unity.")
    return heat_res, thermal_res


if __name__ == "__main__":
    main()
