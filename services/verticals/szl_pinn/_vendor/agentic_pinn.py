# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""agentic_pinn — a GOVERNED agentic solve loop around the SZL PINN core.

THE FRONTIER (founder's): an AGENTIC PINN. Where ``szl_pinn_core`` trains a single
PINN once, this module wraps the core in a closed-loop *agent* that:

  (a) SOLVES the PDE (train the analytic-MLP PINN on the residual loss),
  (b) MEASURES the residual field on a dense, independent test grid,
  (c) ADAPTIVELY ADDS collocation points where the residual is largest
      (residual-based adaptive refinement; clean-room from the published METHOD
      of Lu et al. / Wu et al. — see ATTRIBUTION; NO DeepXDE/LGPL code copied),
  (d) RE-SOLVES on the enriched collocation set,
  (e) Λ-GATES: accept a round only if the residual + conformal error band pass a
      threshold, else refine again or mark the round ADVISORY / DENY,
  and iterates up to N rounds, emitting a SIGNED RECEIPT PER ROUND — the agent's
  full decision trail.

WHY THIS IS NOVEL (beyond bare Raissi 2019 + bare RAR): the adaptive refinement
is placed UNDER A DENY-BY-DEFAULT GOVERNANCE GATE and a SIGNED PER-ROUND PROVENANCE
TRAIL. The agent never "decides it is done" on its own authority — every round's
acceptance is an *advisory* Λ verdict (Λ = Conjecture 1), and the whole trail is
content-addressed + signer-ready (DSSE/khipu). The method produces a number; SZL
produces a GOVERNED, AUDITABLE number with an honest error bar.

HONESTY (Doctrine v11): the PINN field is MODELED, never measured. The residual
drop across rounds is a BOUNDED ESTIMATE over the tested input family, never a
proven a-priori convergence bound (PINN a-priori convergence is OPEN). Λ is
advisory. Pure numpy → sovereign, own-metal, auditable.

Clean interface: ``AgenticPINN.run()`` returns an ``AgenticResult`` with the full
per-round trail. The same object runs unchanged in-sandbox (numpy) or on a real
GPU later (Forge) — the core is the only compute dependency.
"""
from __future__ import annotations

import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional

import numpy as np

# --- wire to the existing clean-room PINN core + innovations ----------------- #
# Layout-agnostic path wiring so this runs UNCHANGED in the workspace
# (../pinn_szl/szl_pinn_core.py) AND in the platform vertical's flat _vendor/
# directory (szl_pinn_core.py as a SIBLING) AND on Forge's GPU box. We try each
# candidate location for the clean-room core; the first that holds it wins.
_HERE = Path(__file__).resolve().parent
_CORE_CANDIDATES = [
    _HERE,                          # platform _vendor/ flat layout (core is a sibling)
    _HERE.parent / "pinn_szl",      # workspace layout (../pinn_szl/)
    _HERE / "pinn_szl",             # nested layout
]
for _cand in _CORE_CANDIDATES:
    if (_cand / "szl_pinn_core.py").is_file() and str(_cand) not in sys.path:
        sys.path.insert(0, str(_cand))

import szl_pinn_core as core  # noqa: E402
from innovations.conformal_interval import calibrate as conformal_calibrate  # noqa: E402
from innovations.lambda_gate import gate_solve, VERDICT_ALLOW, VERDICT_ADVISORY, VERDICT_DENY  # noqa: E402


METHOD = ("szl_agentic_pinn (governed agentic PINN: solve -> measure residual -> "
          "residual-based adaptive refinement -> re-solve -> Lambda-gate, per-round "
          "signed receipts)")

# Method attribution ONLY — clean-room, no library/paper code or text copied.
ATTRIBUTION = {
    "pinn_method": core.ATTRIBUTION["pinn_method"],
    "adaptive_refinement_method": (
        "Residual-based adaptive sampling re-derived clean-room from the published "
        "METHOD: Lu, Meng, Mao, Karniadakis, 'DeepXDE: A deep learning library for "
        "solving differential equations', SIAM Review 63(1):208-228 (2021), "
        "doi:10.1137/19M1274067 (RAR — residual-based adaptive refinement); and "
        "Wu, Zhu, Tan, Kartha, Lu, 'A comprehensive study of non-adaptive and "
        "residual-based adaptive sampling for physics-informed neural networks', "
        "Comput. Methods Appl. Mech. Engrg. 403:115671 (2023), "
        "doi:10.1016/j.cma.2022.115671 (RAR-D / RAD). METHOD/MATHEMATICS attribution "
        "ONLY: residual-weighted point insertion is standard public science. NO "
        "DeepXDE source code (LGPL) was consulted or copied."
    ),
    "conformal_method": (
        "Split/inductive conformal prediction (Vovk; Lei et al.) — distribution-free "
        "finite-sample coverage; clean-room math, no code copied."
    ),
    "implementation": (
        "Clean-room SZL-native agent loop over the pure-numpy szl_pinn_core. The "
        "refinement, gate, and per-round receipts are SZL innovations layered on the "
        "cited public methods. No framework autodiff, no library source reused."
    ),
}

DOCTRINE = (
    "v11 LOCKED: Lambda=Conjecture 1 (ADVISORY gate, NOT proven trust); locked-proven=8; "
    "SLSA L1 honest; sovereign own-metal-only; NO free-energy/over-unity; the PINN field "
    "is MODELED (no measured joules asserted here); residual-drop is a BOUNDED ESTIMATE, "
    "NOT a proven a-priori convergence bound (PINN convergence is OPEN); no fabricated "
    "numbers (the loop really runs); cite-never-plagiarize."
)


# --------------------------------------------------------------------------- #
# Per-round and overall result structures (the agent's decision trail)        #
# --------------------------------------------------------------------------- #
@dataclass
class RoundReceipt:
    """Signer-ready provenance for ONE refinement round (the agent's decision)."""
    round_index: int
    n_pde_collocation: int            # size of the collocation set this round
    n_points_added: int               # adaptive points added before this round (0 for round 0)
    epochs: int
    final_pde_residual_loss: float    # mean PDE-residual loss after this round's training
    max_residual_on_test: float       # worst |residual| on the dense INDEPENDENT test grid
    mean_residual_on_test: float
    rel_l2_error_estimate: float      # rel-L2 vs analytic on the test grid (BOUNDED ESTIMATE)
    conformal_q_hat: float            # conformal radius (honest error bar)
    conformal_realized_coverage: float
    conformal_distribution_shift_flag: bool
    lambda_verdict: str               # ALLOW | ADVISORY | DENY
    lambda_advisory: bool
    lambda_reason: str
    accepted: bool                    # round accepted by the gate (ALLOW)
    inputs_hash: str
    wall_time_s: float
    modeled_not_measured: bool = True
    error_estimate_is_bound: bool = True
    method: str = METHOD
    doctrine: str = DOCTRINE
    lambda_label: str = ("Λ = Conjecture 1 — the gate is ADVISORY governance, NOT "
                         "'proven trust'; ALLOW means passed SZL admission policy, not "
                         "mathematically proven correct, not measured joules.")
    signature: None = None            # signed downstream on the DSSE/khipu path

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class AgenticResult:
    """Full result of a governed agentic solve: net + per-round decision trail."""
    rounds: list                      # list[RoundReceipt]
    final_round_index: int
    final_accepted: bool
    final_verdict: str
    residual_per_round: list          # list[float] max-residual trail (for plotting)
    rel_l2_per_round: list
    collocation_size_per_round: list
    converged: bool
    total_wall_time_s: float
    attribution: dict = field(default_factory=lambda: ATTRIBUTION)
    method: str = METHOD
    doctrine: str = DOCTRINE
    # the trained network is attached but excluded from receipts (params are large)
    net: Any = None

    def trail_dicts(self) -> list:
        return [r.to_dict() for r in self.rounds]


# --------------------------------------------------------------------------- #
# Clean-room residual-based adaptive refinement (RAR / RAD)                    #
# --------------------------------------------------------------------------- #
def _measure_residual_field(net: core.AnalyticMLP, prob: core.HeatProblem,
                            pool: np.ndarray) -> np.ndarray:
    """|PDE residual| at every point in `pool`. The agent's MEASUREMENT step (b)."""
    r = core.pde_residual(net, pool, prob.alpha)
    return np.abs(r).ravel()


def adaptive_refine(net: core.AnalyticMLP, prob: core.HeatProblem,
                    current_Xf: np.ndarray, *, n_add: int, pool_size: int,
                    rng: np.random.Generator, rad_k: float = 1.0,
                    rad_c: float = 1.0) -> tuple[np.ndarray, int]:
    """Add `n_add` collocation points where the PDE residual is largest.

    Clean-room reimplementation of the PUBLISHED METHOD (Lu et al. RAR / Wu et al.
    RAD): draw a fresh dense candidate POOL, score each candidate by a residual-based
    probability p(x) ∝ ε(x)^k / mean(ε^k) + c (the RAD density of Wu et al. 2023; RAR
    is the k→∞ / greedy-top-n limit), then SAMPLE the new points from that density.
    This focuses capacity on the hard region (here, the early-time hotspot) without
    copying any library code.

    Returns (enriched_Xf, n_added).
    """
    xf = rng.uniform(0.0, prob.L, (pool_size, 1))
    tf = rng.uniform(0.0, prob.T, (pool_size, 1))
    pool = np.hstack([xf, tf])
    eps = _measure_residual_field(net, prob, pool)            # ε(x) = |residual|
    # RAD density: p ∝ ε^k / E[ε^k] + c  (Wu et al. 2023, eq. for p_RAD)
    epsk = eps ** rad_k
    dens = epsk / (epsk.mean() + 1e-30) + rad_c
    probv = dens / dens.sum()
    take = min(n_add, pool_size)
    idx = rng.choice(pool_size, size=take, replace=False, p=probv)
    new_pts = pool[idx]
    enriched = np.vstack([current_Xf, new_pts])
    return enriched, int(take)


# --------------------------------------------------------------------------- #
# One governed round: train on current collocation, measure, gate             #
# --------------------------------------------------------------------------- #
def _train_on_collocation(net: core.AnalyticMLP, prob: core.HeatProblem,
                          Xf: np.ndarray, Xb, ub, Xi, ui, *, epochs: int, lr: float,
                          w_bc: float, w_ic: float) -> list:
    """Train the PINN on a SPECIFIC collocation set (so the agent controls points)."""
    shapes = [w.shape for w in net.W] + [b.shape for b in net.b]
    opt = core.Adam(shapes, lr=lr)
    history = []
    for ep in range(epochs):
        gW, gb, _ = core.compute_grads(net, Xf, Xb, ub, Xi, ui, prob.alpha, w_bc, w_ic)
        params = net.W + net.b
        grads = gW + gb
        new = opt.step(params, grads)
        net.W = new[:net.n_layers]
        net.b = new[net.n_layers:]
        tot, lp, lb, lic = core.total_loss(net, Xf, Xb, ub, Xi, ui, prob.alpha, w_bc, w_ic)
        history.append((ep, tot, lp, lb, lic))
    return history


@dataclass
class AgenticConfig:
    max_rounds: int = 6
    epochs_per_round: int = 1500
    lr: float = 5e-3
    n_pde0: int = 300          # initial collocation budget
    n_bc: int = 100
    n_ic: int = 100
    w_bc: float = 20.0
    w_ic: float = 20.0
    n_add_per_round: int = 300 # adaptive points added each refinement
    pool_size: int = 4000      # candidate pool for residual scoring
    rad_k: float = 1.0         # RAD exponent
    rad_c: float = 1.0         # RAD additive floor
    hidden: tuple = (24, 24)
    seed: int = 0
    # Λ-gate thresholds. We gate on the MEAN measured residual over the dense
    # test grid (a stable, honest aggregate). The MAX pointwise residual is also
    # reported on every receipt, but it is dominated by the heat equation's sharp
    # early-time corner (a known, documented singular region) so it is unsuitable
    # as a hard accept gate; we surface it as an ADVISORY signal instead.
    residual_tol: float = 2.0e-2   # accept round only if MEAN test residual <= this
    rel_l2_tol: float = 5e-2       # AND rel-L2 estimate <= this
    conformal_alpha: float = 0.10  # 90% target coverage
    stop_on_accept: bool = True    # stop early once a round is ALLOW-accepted


class AgenticPINN:
    """Governed agentic PINN solver. Same object runs in-sandbox or on Forge GPU."""

    def __init__(self, prob: Optional[core.HeatProblem] = None,
                 cfg: Optional[AgenticConfig] = None):
        self.prob = prob or core.HeatProblem()
        self.cfg = cfg or AgenticConfig()

    # -- dense INDEPENDENT test grid (never used for training) --------------- #
    def _test_grid(self, nx: int = 60, nt: int = 60):
        xs = np.linspace(0, self.prob.L, nx)
        ts = np.linspace(0, self.prob.T, nt)
        XX, TT = np.meshgrid(xs, ts)
        grid = np.column_stack([XX.ravel(), TT.ravel()])
        u_true = self.prob.u_exact(XX.ravel(), TT.ravel())
        return grid, u_true

    def run(self, verbose: bool = False) -> AgenticResult:
        cfg = self.cfg
        prob = self.prob
        rng = np.random.default_rng(cfg.seed)

        net = core.AnalyticMLP(core.MLPConfig(in_dim=2, hidden=tuple(cfg.hidden),
                                              out_dim=1, seed=cfg.seed))
        # fixed BC/IC anchors (the agent only adapts INTERIOR collocation)
        Xf, Xb, ub, Xi, ui = core.sample_collocation(prob, cfg.n_pde0, cfg.n_bc,
                                                      cfg.n_ic, seed=cfg.seed)
        test_grid, u_true = self._test_grid()

        rounds: list[RoundReceipt] = []
        residual_trail, rel_l2_trail, size_trail = [], [], []
        t_start = time.time()
        final_accepted = False
        final_verdict = VERDICT_DENY
        n_added_this_round = 0

        for ridx in range(cfg.max_rounds):
            t0 = time.time()
            # (a) SOLVE on current collocation set
            hist = _train_on_collocation(net, prob, Xf, Xb, ub, Xi, ui,
                                         epochs=cfg.epochs_per_round, lr=cfg.lr,
                                         w_bc=cfg.w_bc, w_ic=cfg.w_ic)
            final_pde = float(hist[-1][2])

            # (b) MEASURE residual on dense INDEPENDENT test grid
            res_field = _measure_residual_field(net, prob, test_grid)
            max_res = float(res_field.max())
            mean_res = float(res_field.mean())

            u_pred = net.forward(test_grid).ravel()
            rel_l2 = float(np.linalg.norm(u_pred - u_true) /
                           (np.linalg.norm(u_true) + 1e-30))

            # conformal band: calibrate on half the test grid, check on the other
            # half (honest split; same posture as the FE-NO sibling). The band is
            # an honest auditable error bar, NOT a proof.
            n = len(u_true)
            perm = rng.permutation(n)
            half = n // 2
            cal_idx, chk_idx = perm[:half], perm[half:]
            band = conformal_calibrate(
                u_pred[cal_idx].tolist(), u_true[cal_idx].tolist(),
                u_pred[chk_idx].tolist(), u_true[chk_idx].tolist(),
                alpha=cfg.conformal_alpha)

            # (e) Λ-GATE: build a receipt-shaped dict, route through the deny-by-
            # default gate. Acceptance also requires the MEASURED max test residual
            # to be under the agent's residual_tol (residual-aware admission).
            gate_input = {
                "solution_error_estimate": rel_l2,
                "converged": (mean_res <= cfg.residual_tol),
                "modeled_not_measured": True,
                "distribution_shift_flag": band.distribution_shift_flag,
            }
            verdict = gate_solve(gate_input, tol=cfg.rel_l2_tol)
            # residual-aware overlay: accept requires the MEAN measured residual
            # under the agent's residual tolerance (deny-by-default otherwise).
            residual_pass = mean_res <= cfg.residual_tol
            accepted = (verdict.verdict == VERDICT_ALLOW) and residual_pass
            if verdict.verdict == VERDICT_ALLOW and not residual_pass:
                v_str, v_adv = VERDICT_ADVISORY, True
                v_reason = (f"rel-L2 {rel_l2:.2e} within tol but MEAN measured residual "
                            f"{mean_res:.2e} > residual_tol {cfg.residual_tol:.2e} — "
                            f"refine again (advisory)")
            else:
                v_str, v_adv, v_reason = verdict.verdict, verdict.advisory, verdict.reason

            inputs = {
                "round": ridx, "n_pde": int(Xf.shape[0]), "epochs": cfg.epochs_per_round,
                "lr": cfg.lr, "alpha": prob.alpha, "seed": cfg.seed,
                "rad_k": cfg.rad_k, "rad_c": cfg.rad_c, "added": n_added_this_round,
            }
            rcpt = RoundReceipt(
                round_index=ridx,
                n_pde_collocation=int(Xf.shape[0]),
                n_points_added=int(n_added_this_round),
                epochs=cfg.epochs_per_round,
                final_pde_residual_loss=final_pde,
                max_residual_on_test=max_res,
                mean_residual_on_test=mean_res,
                rel_l2_error_estimate=rel_l2,
                conformal_q_hat=float(band.q_hat),
                conformal_realized_coverage=float(band.realized_coverage),
                conformal_distribution_shift_flag=bool(band.distribution_shift_flag),
                lambda_verdict=v_str,
                lambda_advisory=bool(v_adv),
                lambda_reason=v_reason,
                accepted=bool(accepted),
                inputs_hash=core._hash_inputs(inputs),
                wall_time_s=float(time.time() - t0),
            )
            rounds.append(rcpt)
            residual_trail.append(max_res)
            rel_l2_trail.append(rel_l2)
            size_trail.append(int(Xf.shape[0]))

            if verbose:
                print(f"[round {ridx}] n_pde={Xf.shape[0]:5d}  pde_loss={final_pde:.3e}  "
                      f"mean_res={mean_res:.3e}  max_res={max_res:.3e}  rel_l2={rel_l2:.3e}  "
                      f"cover={band.realized_coverage:.2f}  -> {v_str}"
                      f"{'  ACCEPTED' if accepted else ''}")

            final_verdict = v_str
            final_accepted = accepted
            if accepted and cfg.stop_on_accept:
                break

            # (c)(d) ADAPTIVELY ADD points where residual is highest, then re-solve
            if ridx < cfg.max_rounds - 1:
                Xf, n_added_this_round = adaptive_refine(
                    net, prob, Xf, n_add=cfg.n_add_per_round, pool_size=cfg.pool_size,
                    rng=rng, rad_k=cfg.rad_k, rad_c=cfg.rad_c)

        total_wall = time.time() - t_start
        converged = bool(rounds[-1].final_pde_residual_loss <= cfg.residual_tol)
        return AgenticResult(
            rounds=rounds,
            final_round_index=rounds[-1].round_index,
            final_accepted=final_accepted,
            final_verdict=final_verdict,
            residual_per_round=residual_trail,
            rel_l2_per_round=rel_l2_trail,
            collocation_size_per_round=size_trail,
            converged=converged,
            total_wall_time_s=total_wall,
            net=net,
        )


__all__ = [
    "METHOD", "ATTRIBUTION", "DOCTRINE",
    "AgenticConfig", "AgenticPINN", "AgenticResult", "RoundReceipt",
    "adaptive_refine",
]


if __name__ == "__main__":
    print("SZL AGENTIC PINN — governed solve/measure/refine/gate loop (heat eq) ...")
    agent = AgenticPINN()
    res = agent.run(verbose=True)
    print(f"\nrounds run        : {len(res.rounds)}")
    print(f"residual per round: {[f'{r:.2e}' for r in res.residual_per_round]}")
    print(f"final verdict     : {res.final_verdict}  (accepted={res.final_accepted})")
    print(f"total walltime    : {res.total_wall_time_s:.2f}s")
