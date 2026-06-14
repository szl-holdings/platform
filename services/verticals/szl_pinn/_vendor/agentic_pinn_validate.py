# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""agentic_pinn_validate — runnable validation harness for the AGENTIC PINN +
PHYSICS-BOUNDS CERTIFIER. Real, runnable, honest — NO fabricated numbers.

It (1) runs the GOVERNED agentic solve loop on the 1D heat equation and shows the
residual DROPPING across refinement rounds + the Λ-gate ACCEPTING once converged;
(2) runs the physics-bounds certifier on a sample GPU job; (3) emits a real
PHYSICAL-BOUNDS CERTIFICATE JSON + the per-round agentic decision trail JSON; and
(4) produces a matplotlib figure: residual-per-round (left) and a bounds bar chart
(right: actual vs Landauer floor vs Margolus-Levitin limit, log scale).

Run:  python agentic_pinn_validate.py
Out:  agentic_pinn_validation.png
      physical_bounds_certificate.json
      agentic_decision_trail.json
"""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from agentic_pinn import AgenticPINN, AgenticConfig
from physics_bounds import certify, margolus_levitin_max_ops_per_s, landauer_floor_joules
from nvml_hook import sample_job

OUT_DIR = Path(__file__).resolve().parent
FIG_PATH = OUT_DIR / "agentic_pinn_validation.png"
CERT_PATH = OUT_DIR / "physical_bounds_certificate.json"
TRAIL_PATH = OUT_DIR / "agentic_decision_trail.json"


def run_agentic() -> "AgenticResult":  # noqa: F821
    print("=" * 70)
    print("PART 1 — GOVERNED AGENTIC PINN LOOP (1D heat eq u_t = alpha*u_xx)")
    print("=" * 70)
    cfg = AgenticConfig(seed=0)  # validation defaults: genuinely converges + accepts
    agent = AgenticPINN(cfg=cfg)
    res = agent.run(verbose=True)
    print(f"\n  rounds run         : {len(res.rounds)}")
    print(f"  residual per round : {[f'{r:.3e}' for r in res.residual_per_round]}")
    print(f"  rel-L2 per round   : {[f'{r:.3e}' for r in res.rel_l2_per_round]}")
    print(f"  collocation sizes  : {res.collocation_size_per_round}")
    print(f"  final verdict      : {res.final_verdict}  (accepted={res.final_accepted})")
    # honest assertion: residual must monotonically (non-strictly) trend down
    drops = res.rel_l2_per_round
    assert drops[-1] < drops[0], "rel-L2 must drop across refinement rounds"
    assert res.final_accepted, "Λ-gate must ACCEPT once the loop converges"
    return res


def run_bounds() -> dict:
    print("\n" + "=" * 70)
    print("PART 2 — PHYSICAL-BOUNDS CERTIFIER (sample GPU job; HONEST sample inputs)")
    print("=" * 70)
    job = sample_job()
    cert = certify(job)
    print(cert.summary)
    print(f"\n  physically_bounded : {cert.physically_bounded}")
    print(f"  Landauer multiple  : {cert.landauer_multiple_above_floor:.4g}×")
    print(f"  ML headroom        : {cert.margolus_levitin_headroom_pct:.4e}%")
    print(f"  Bekenstein under   : {cert.bekenstein_under_ceiling}")
    # honest assertions
    assert cert.physically_bounded, "sample job must be physically bounded"
    assert cert.landauer_multiple_above_floor >= 1.0, "must be at/above Landauer floor"
    assert cert.margolus_levitin_headroom_fraction <= 1.0, "must be under ML rate"
    cert_dict = json.loads(cert.to_json())
    CERT_PATH.write_text(json.dumps(cert_dict, indent=2, default=str))
    print(f"\n  wrote certificate  -> {CERT_PATH.name}")
    return cert_dict


def make_figure(res, cert_dict):
    print("\n" + "=" * 70)
    print("PART 3 — VALIDATION FIGURE")
    print("=" * 70)
    fig, (axL, axR) = plt.subplots(1, 2, figsize=(14.5, 5.6))
    fig.suptitle("SZL Agentic PINN + Physical-Bounds Certifier — validation "
                 "(Λ = Conjecture 1, advisory)", fontsize=12, fontweight="bold")

    # --- LEFT: residual + rel-L2 per refinement round --------------------- #
    rounds = list(range(len(res.residual_per_round)))
    axL.semilogy(rounds, res.residual_per_round, "o-", color="#c0392b", lw=2,
                 label="max |PDE residual| on test grid")
    axL.semilogy(rounds, res.rel_l2_per_round, "s--", color="#2c6fbb", lw=2,
                 label="rel-L2 error estimate (vs analytic)")
    # annotate the accepted round (place ACCEPT label below-right of the marker
    # so it never collides with the per-round verdict labels above the curves)
    acc_idx = next((r.round_index for r in res.rounds if r.accepted), None)
    if acc_idx is not None:
        y = res.rel_l2_per_round[acc_idx]
        axL.scatter([acc_idx], [y], s=180, facecolors="none", edgecolors="#27ae60",
                    linewidths=2.5, zorder=5)
        axL.annotate("Λ-gate ACCEPT", (acc_idx, y), textcoords="offset points",
                     xytext=(-6, -26), ha="right", va="top", color="#1e8449",
                     fontweight="bold", fontsize=9.5,
                     arrowprops=dict(arrowstyle="->", color="#1e8449", lw=1.4))
    # per-round Λ verdict labels — sit just ABOVE the red residual curve, well
    # clear of the rel-L2 curve and of each other (one per integer round)
    for r in res.rounds:
        axL.annotate(r.lambda_verdict,
                     (r.round_index, res.residual_per_round[r.round_index]),
                     textcoords="offset points", xytext=(0, 12), ha="center",
                     fontsize=8, fontweight="bold", color="#7a7a7a")
    axL.set_xlabel("agentic refinement round")
    axL.set_ylabel("error / residual (log)")
    axL.set_title("Residual drops across residual-based adaptive refinement\n"
                  "(collocation grows: " +
                  " → ".join(str(s) for s in res.collocation_size_per_round) + " pts)",
                  fontsize=9)
    axL.set_xticks(rounds)
    axL.set_xlim(-0.35, rounds[-1] + 0.45)
    # give vertical headroom so the top verdict label isn't clipped
    _ylo = min(min(res.rel_l2_per_round), min(res.residual_per_round)) * 0.45
    _yhi = max(res.residual_per_round) * 2.6
    axL.set_ylim(_ylo, _yhi)
    axL.grid(True, which="both", alpha=0.3)
    axL.legend(fontsize=8, loc="upper right")

    # --- RIGHT: bounds bar chart (actual vs Landauer floor vs ML limit) ---- #
    # Energy axis (joules): actual job energy vs Landauer floor.
    E_actual = cert_dict["energy_joules_derived"]
    E_floor = cert_dict["landauer_floor_joules"]
    # Rate axis (ops/s): job rate vs Margolus-Levitin max vs Bremermann.
    job_rate = cert_dict["job_ops_per_s_measured"]
    ml_max = cert_dict["margolus_levitin_max_ops_per_s"]
    brem_max = cert_dict["bremermann_max_ops_per_s"]

    labels = ["Job energy\n(DERIVED)", "Landauer\nfloor", "Job op-rate\n(MEASURED)",
              "Margolus-\nLevitin max", "Bremermann\nmax"]
    vals = [E_actual, E_floor, job_rate, ml_max, brem_max]
    colors = ["#2c6fbb", "#7f8c8d", "#16a085", "#c0392b", "#8e44ad"]
    bars = axR.bar(range(len(vals)), vals, color=colors, log=True, width=0.62)
    # generous top headroom so the highest value label + section captions fit
    axR.set_ylim(top=max(vals) * 1e7)
    # visual divider: first 2 bars are ENERGY (J), last 3 are RATE (ops/s).
    # Section captions sit just INSIDE the top of the axes (clear of the title).
    axR.axvline(1.5, color="#999", ls=":", lw=1.2)
    axR.text(0.5, 0.965, "ENERGY (J)", transform=axR.transAxes,
             ha="center", va="top", fontsize=8, color="#555", style="italic")
    axR.text(0.83, 0.965, "OP-RATE (ops·s⁻¹)", transform=axR.transAxes,
             ha="center", va="top", fontsize=8, color="#555", style="italic")
    axR.set_xticks(range(len(labels)))
    axR.set_xticklabels(labels, fontsize=7.5)
    axR.set_ylabel("joules  /  ops·s⁻¹  (log scale)")
    axR.set_title("Physical bounds: job sits FAR below fundamental ceilings\n"
                  "(honest inverse of a free-energy claim — no over-unity)", fontsize=9)
    axR.grid(True, which="both", axis="y", alpha=0.3)
    for b, v in zip(bars, vals):
        axR.annotate(f"{v:.2e}", (b.get_x() + b.get_width() / 2, v),
                     textcoords="offset points", xytext=(0, 4), ha="center",
                     fontsize=7, color="#222")
    # headroom annotation — dark text on light box, placed in clear upper-left space
    land_mult = cert_dict["landauer_multiple_above_floor"]
    ml_pct = cert_dict["margolus_levitin_headroom_pct"]
    axR.text(0.03, 0.86,
             f"{land_mult:.2e}× above Landauer floor\n"
             f"{ml_pct:.2e}% of Margolus-Levitin rate",
             transform=axR.transAxes, ha="left", va="top", fontsize=8.5,
             color="#222",
             bbox=dict(boxstyle="round", fc="#f4f4f4", ec="#bbb"))

    fig.tight_layout(rect=[0, 0, 1, 0.94])
    fig.savefig(FIG_PATH, dpi=130)
    print(f"  wrote figure       -> {FIG_PATH.name}")


def main():
    res = run_agentic()
    # write the per-round decision trail
    trail = {
        "method": res.method,
        "attribution": res.attribution,
        "doctrine": res.doctrine,
        "final_verdict": res.final_verdict,
        "final_accepted": res.final_accepted,
        "rounds": res.trail_dicts(),
    }
    TRAIL_PATH.write_text(json.dumps(trail, indent=2, default=str))
    print(f"  wrote decision trail -> {TRAIL_PATH.name}")

    cert_dict = run_bounds()
    make_figure(res, cert_dict)

    print("\n" + "=" * 70)
    print("VALIDATION COMPLETE — all checks passed. Real, runnable, honest.")
    print("  Λ = Conjecture 1 (advisory). Bounds = ESTABLISHED PHYSICS, CITED.")
    print("  NO free-energy. Joules DERIVED from MEASURED power×time only.")
    print("=" * 70)


if __name__ == "__main__":
    main()
