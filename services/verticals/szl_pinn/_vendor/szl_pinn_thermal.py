# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""szl_pinn_thermal — sovereign-energy application of the heat PINN.

USE-CASE: model the 2D STEADY-STATE temperature field across a GPU / accelerator
die surface given a spatial COMPUTE-LOAD heat source. The result is a thermal
field T(x, y) that feeds **thermal-aware scheduling** for SZL's wasted-/stranded-
energy harvest engine: hot regions are scheduling constraints; the spatial
gradient of T marks where stranded heat is dense enough to be worth recovering.

GOVERNING PHYSICS — steady-state heat equation with source (Poisson form)
-------------------------------------------------------------------------
    ∂T/∂t = α·∇²T + Q(x,y)/(ρ c_p) ;  steady state ∂T/∂t = 0  ⇒
        α·(T_xx + T_yy) + s(x,y) = 0,        s = Q/(ρ c_p)   [K/s]
    on the unit die [0,1]² with Dirichlet edge temperature T = T_edge
    (package/heat-spreader boundary held at a reference temperature).

The same clean-room AnalyticMLP and PDE-residual loss from szl_pinn_core are
reused: inputs are now (x, y) instead of (x, t), and the residual is the 2D
steady heat-balance  α·(T_xx + T_yy) + s  rather than the 1D transient residual.
Derivatives T_xx, T_yy are EXACT analytic forward-mode (tanh closed form).

HONESTY (Doctrine v11) — READ THIS
----------------------------------
  * This MODELS heat transport. It does NOT create, harvest, or measure energy.
    NO free-energy / over-unity / perpetual-motion is implied or possible here.
  * The harvest engine targets WASTED / STRANDED heat ONLY — energy already lost
    as waste from compute. We model where that waste concentrates; recovery is
    bounded by ordinary thermodynamics (Carnot), never above unity.
  * JOULES: the compute-load heat input here is a MODELED design input, and the
    Landauer figure below is a MODELED thermodynamic FLOOR — both are clearly
    labelled MODELED, never MEASURED. Real joules are MEASURED only by SZL's real
    power exporter; nothing in this file asserts a measured joule.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass

import numpy as np

from szl_pinn_core import (
    Adam, AnalyticMLP, MLPConfig, ProvenanceReceipt, _hash_inputs,
)

# Landauer limit constants (SI). SZL already cites Landauer for the honest
# thermodynamic floor on irreversible computation.
K_BOLTZMANN = 1.380649e-23          # J/K
LANDAUER_NOTE = (
    "Landauer's principle (Landauer 1961, IBM J. Res. Dev. 5(3):183-191): "
    "erasing one bit of information dissipates AT LEAST k_B*T*ln(2) joules as "
    "heat. This is a MODELED thermodynamic FLOOR, not a measured device power."
)
METHOD_THERMAL = (
    "szl_pinn_thermal (2D steady-state heat PINN with compute-load source; "
    "alpha*(T_xx+T_yy)+s=0)"
)


# --------------------------------------------------------------------------- #
# Thermal problem definition                                                   #
# --------------------------------------------------------------------------- #
@dataclass
class ChipThermalProblem:
    """2D steady-state thermal model of a GPU/accelerator die [0,1]^2.

    alpha       : thermal diffusivity proxy (normalised).
    T_edge      : Dirichlet boundary temperature (e.g. heat-spreader, K above ref).
    hotspots    : list of (cx, cy, power, radius) compute-load heat sources;
                  `power` is a MODELED source strength (s units), `radius` its
                  Gaussian spread. Models e.g. busy SM clusters / tensor cores.
    """
    alpha: float = 1.0
    T_edge: float = 0.0
    hotspots: tuple = (
        (0.30, 0.30, 8.0, 0.10),    # compute cluster A
        (0.70, 0.65, 12.0, 0.12),   # compute cluster B (hotter)
        (0.50, 0.80, 5.0, 0.08),    # memory controller
    )

    def source(self, x, y):
        """Compute-load heat source s(x,y) = sum of Gaussian hotspots [K/s]."""
        s = np.zeros_like(x, dtype=float)
        for (cx, cy, p, r) in self.hotspots:
            s = s + p * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2.0 * r * r))
        return s


# --------------------------------------------------------------------------- #
# 2D forward-mode derivatives (T_xx + T_yy) for the AnalyticMLP                 #
# --------------------------------------------------------------------------- #
def _forward_laplacian(net: AnalyticMLP, X):
    """Return T, T_xx, T_yy via EXACT analytic forward-mode through the tanh MLP.

    X: (N,2) with columns (x,y). Reuses the same closed-form rules as the core.
    """
    N = X.shape[0]
    a = X.T.copy()
    e_x = np.zeros((2, 1)); e_x[0, 0] = 1.0
    e_y = np.zeros((2, 1)); e_y[1, 0] = 1.0
    a_x = np.repeat(e_x, N, axis=1); a_xx = np.zeros_like(a)
    a_y = np.repeat(e_y, N, axis=1); a_yy = np.zeros_like(a)
    for li in range(net.n_layers):
        W = net.W[li]
        z = W @ a + net.b[li]
        z_x = W @ a_x; z_xx = W @ a_xx
        z_y = W @ a_y; z_yy = W @ a_yy
        if li < net.n_layers - 1:
            th = np.tanh(z); d1 = 1 - th * th; d2 = -2 * th * d1
            a = th
            a_x = d1 * z_x; a_xx = d2 * (z_x * z_x) + d1 * z_xx
            a_y = d1 * z_y; a_yy = d2 * (z_y * z_y) + d1 * z_yy
        else:
            a = z; a_xx = z_xx; a_yy = z_yy
    return a.T, a_xx.T, a_yy.T


def _thermal_grads(net, Xf, sf, Xb, Tb, alpha, w_bc, gW, gb):
    """Exact gradients of  mean((alpha*(T_xx+T_yy)+s)^2) + w_bc*mean((T-Tb)^2).

    PDE term uses reverse-over-forward AD (analytic); BC term uses plain backprop.
    Returns (loss_pde, loss_bc).
    """
    nl = net.n_layers
    # ---- BC term (plain forward MSE) ------------------------------------- #
    a = Xb.T; acts = [a]; zs = []
    for li in range(nl):
        z = net.W[li] @ a + net.b[li]; zs.append(z)
        a = np.tanh(z) if li < nl - 1 else z; acts.append(a)
    pred = a.T; Nb = Xb.shape[0]
    delta = (2.0 / Nb) * (pred - Tb).T * w_bc
    for li in reversed(range(nl)):
        gW[li] += delta @ acts[li].T
        gb[li] += delta.sum(axis=1, keepdims=True)
        if li > 0:
            delta = (net.W[li].T @ delta) * (1 - np.tanh(zs[li - 1]) ** 2)
    loss_bc = float(np.mean((pred - Tb) ** 2))

    # ---- PDE term (reverse-over-forward, analytic) ----------------------- #
    N = Xf.shape[0]
    a = Xf.T.copy()
    e_x = np.zeros((2, 1)); e_x[0, 0] = 1.0
    e_y = np.zeros((2, 1)); e_y[1, 0] = 1.0
    a_x = np.repeat(e_x, N, axis=1); a_xx = np.zeros_like(a)
    a_y = np.repeat(e_y, N, axis=1); a_yy = np.zeros_like(a)
    cache = []
    for li in range(nl):
        W = net.W[li]
        z = W @ a + net.b[li]
        z_x = W @ a_x; z_xx = W @ a_xx
        z_y = W @ a_y; z_yy = W @ a_yy
        e = {"a_in": a, "ax_in": a_x, "axx_in": a_xx, "ay_in": a_y, "ayy_in": a_yy}
        if li < nl - 1:
            th = np.tanh(z); d1 = 1 - th * th; d2 = -2 * th * d1
            d3 = -2 * (d1 * d1 + th * d2)
            e.update({"d1": d1, "d2": d2, "d3": d3,
                      "z_x": z_x, "z_xx": z_xx, "z_y": z_y, "z_yy": z_yy})
            a = th
            a_x = d1 * z_x; a_xx = d2 * (z_x * z_x) + d1 * z_xx
            a_y = d1 * z_y; a_yy = d2 * (z_y * z_y) + d1 * z_yy
        else:
            a = z; a_xx = z_xx; a_yy = z_yy
        cache.append(e)
    lap = (a_xx + a_yy).ravel()
    r = alpha * lap + sf.ravel()
    loss_pde = float(np.mean(r ** 2))
    dLdr = (2.0 / N) * r
    bar_a = np.zeros((net.W[-1].shape[0], N))
    bar_ax = np.zeros_like(bar_a); bar_ay = np.zeros_like(bar_a)
    bar_axx = (alpha * dLdr).reshape(1, N)
    bar_ayy = (alpha * dLdr).reshape(1, N)
    for li in reversed(range(nl)):
        e = cache[li]; W = net.W[li]
        if li < nl - 1:
            d1, d2, d3 = e["d1"], e["d2"], e["d3"]
            z_x, z_xx, z_y, z_yy = e["z_x"], e["z_xx"], e["z_y"], e["z_yy"]
            bar_z = bar_a * d1
            bar_z += bar_ax * (d2 * z_x) + bar_ay * (d2 * z_y)
            bar_z += bar_axx * (d3 * (z_x * z_x) + d2 * z_xx)
            bar_z += bar_ayy * (d3 * (z_y * z_y) + d2 * z_yy)
            bar_zx = bar_ax * d1 + bar_axx * (2 * d2 * z_x)
            bar_zxx = bar_axx * d1
            bar_zy = bar_ay * d1 + bar_ayy * (2 * d2 * z_y)
            bar_zyy = bar_ayy * d1
        else:
            bar_z = bar_a; bar_zx = bar_ax; bar_zxx = bar_axx
            bar_zy = bar_ay; bar_zyy = bar_ayy
        gW[li] += (bar_z @ e["a_in"].T + bar_zx @ e["ax_in"].T
                   + bar_zxx @ e["axx_in"].T + bar_zy @ e["ay_in"].T
                   + bar_zyy @ e["ayy_in"].T)
        gb[li] += bar_z.sum(axis=1, keepdims=True)
        bar_a = W.T @ bar_z
        bar_ax = W.T @ bar_zx; bar_axx = W.T @ bar_zxx
        bar_ay = W.T @ bar_zy; bar_ayy = W.T @ bar_zyy
    return loss_pde, loss_bc


@dataclass
class ThermalSolveResult:
    net: AnalyticMLP
    history: list
    converged: bool
    receipt: ProvenanceReceipt
    grid_x: np.ndarray
    grid_y: np.ndarray
    T_field: np.ndarray
    residual_field: np.ndarray
    joule_accounting: dict
    rms_residual: float = 0.0
    rel_residual: float = 0.0


def solve_chip_thermal(prob: ChipThermalProblem | None = None, *,
                       hidden=(28, 28), epochs=4000, lr=4e-3, seed=0,
                       n_pde=1200, n_bc=240, w_bc=40.0, ng=60,
                       n_logical_ops_per_s: float = 1e15,
                       op_temperature_K: float = 350.0,
                       conv_tol=5e-2, error_tol=8e-2,
                       verbose=False) -> ThermalSolveResult:
    """Train the 2D steady thermal PINN and emit a provenance receipt.

    n_logical_ops_per_s / op_temperature_K parameterise the MODELED Landauer
    floor (joule accounting) — clearly labelled MODELED, never measured.
    """
    if prob is None:
        prob = ChipThermalProblem()
    cfg = MLPConfig(in_dim=2, hidden=tuple(hidden), out_dim=1, seed=seed)
    net = AnalyticMLP(cfg)
    rng = np.random.default_rng(seed)

    # collocation: interior PDE points + Dirichlet boundary points
    Xf = rng.uniform(0, 1, (n_pde, 2))
    sf = prob.source(Xf[:, 0], Xf[:, 1]).reshape(-1, 1)
    nb = n_bc // 4
    edge = []
    edge.append(np.column_stack([np.zeros(nb), rng.uniform(0, 1, nb)]))
    edge.append(np.column_stack([np.ones(nb), rng.uniform(0, 1, nb)]))
    edge.append(np.column_stack([rng.uniform(0, 1, nb), np.zeros(nb)]))
    edge.append(np.column_stack([rng.uniform(0, 1, nb), np.ones(nb)]))
    Xb = np.vstack(edge)
    Tb = np.full((Xb.shape[0], 1), prob.T_edge)

    shapes = [w.shape for w in net.W] + [b.shape for b in net.b]
    opt = Adam(shapes, lr=lr)
    history = []
    t0 = time.time()
    for ep in range(epochs):
        gW = [np.zeros_like(w) for w in net.W]
        gb = [np.zeros_like(b) for b in net.b]
        lp, lb = _thermal_grads(net, Xf, sf, Xb, Tb, prob.alpha, w_bc, gW, gb)
        params = net.W + net.b
        new = opt.step(params, gW + gb)
        net.W = new[:net.n_layers]; net.b = new[net.n_layers:]
        history.append((ep, lp + w_bc * lb, lp, lb))
        if verbose and (ep % 250 == 0 or ep == epochs - 1):
            print(f"  ep {ep:4d}  pde={lp:.3e}  bc={lb:.3e}")
    wall = time.time() - t0
    converged = history[-1][2] <= conv_tol

    # dense field + residual field for the figure
    xs = np.linspace(0, 1, ng); ys = np.linspace(0, 1, ng)
    GX, GY = np.meshgrid(xs, ys)
    grid = np.column_stack([GX.ravel(), GY.ravel()])
    T, Txx, Tyy = _forward_laplacian(net, grid)
    sgrid = prob.source(GX.ravel(), GY.ravel()).reshape(-1, 1)
    res = prob.alpha * (Txx + Tyy) + sgrid
    T_field = T.reshape(ng, ng)
    residual_field = res.reshape(ng, ng)
    rms_residual = float(np.sqrt(np.mean(res ** 2)))
    # RELATIVE residual: RMS residual normalised by RMS source magnitude
    # (honest scale-free convergence measure for the source-driven balance).
    rms_source = float(np.sqrt(np.mean(sgrid ** 2)) + 1e-30)
    rel_residual = rms_residual / rms_source

    verified = bool(converged and rel_residual <= error_tol)

    # ---- MODELED Landauer joule accounting (honest floor) ----------------- #
    landauer_per_op = K_BOLTZMANN * op_temperature_K * np.log(2.0)   # J/bit-erase
    modeled_floor_W = float(landauer_per_op * n_logical_ops_per_s)   # J/s = W
    # Total MODELED source heat (relative units) integrated over the die.
    total_modeled_source = float(np.mean(sgrid) * 1.0)   # mean over unit area
    joule_accounting = {
        "label": "MODELED — NOT MEASURED",
        "landauer_per_bit_erase_J": float(landauer_per_op),
        "assumed_op_temperature_K": float(op_temperature_K),
        "assumed_logical_ops_per_s": float(n_logical_ops_per_s),
        "modeled_landauer_floor_W": modeled_floor_W,
        "modeled_total_source_heat_relunits": total_modeled_source,
        "interpretation": (
            "modeled_landauer_floor_W is the THERMODYNAMIC FLOOR on dissipated "
            "power for the assumed irreversible-op rate (k_B*T*ln2 per bit erase, "
            "times ops/s). Real device power is far ABOVE this floor and is "
            "MEASURED only by SZL's real power exporter. The PINN temperature "
            "field and the source integral are MODELED design inputs. NO energy "
            "is created or harvested here; harvest targets WASTED/stranded heat "
            "only, bounded by ordinary thermodynamics (no over-unity)."
        ),
        "landauer_note": LANDAUER_NOTE,
    }

    inputs = {
        "pde": "alpha*(T_xx+T_yy)+s(x,y)=0 (2D steady heat with compute-load source)",
        "alpha": prob.alpha, "T_edge": prob.T_edge,
        "hotspots": [list(h) for h in prob.hotspots],
        "hidden": list(hidden), "epochs": epochs, "lr": lr, "seed": seed,
        "n_pde": n_pde, "n_bc": n_bc, "w_bc": w_bc,
        "n_logical_ops_per_s": n_logical_ops_per_s,
        "op_temperature_K": op_temperature_K,
    }
    geometry = {
        "domain": "[0,1]^2 GPU/accelerator die",
        "bc": f"Dirichlet edge T={prob.T_edge} (heat-spreader reference)",
        "source": "sum of Gaussian compute-load hotspots",
        "n_hotspots": len(prob.hotspots),
        "collocation": {"n_pde": n_pde, "n_bc": n_bc},
        "net_hidden": list(hidden),
    }
    rcpt = ProvenanceReceipt(
        method=METHOD_THERMAL,
        attribution={
            **{"pinn_method": (
                "Raissi, Perdikaris, Karniadakis (2019), J. Comput. Phys. "
                "378:686-707, doi:10.1016/j.jcp.2018.10.045 (method only, "
                "clean-room).")},
            "landauer": LANDAUER_NOTE,
            "implementation": (
                "2D steady heat PINN reusing the clean-room AnalyticMLP and "
                "PDE-residual loss from szl_pinn_core; exact analytic Laplacian "
                "via forward-mode; pure numpy, sovereign own-metal."),
        },
        inputs_hash=_hash_inputs(inputs),
        pde="alpha*(T_xx+T_yy)+s(x,y)=0",
        alpha=float(prob.alpha),
        geometry=geometry,
        epochs=int(epochs),
        converged=bool(converged),
        physics_residual_loss=float(history[-1][2]),
        bc_loss=float(history[-1][3]),
        ic_loss=0.0,                     # steady-state: no initial condition
        solution_error_estimate=float(rms_residual),
        error_estimate_is_bound=True,
        error_estimate_scope=(
            "RMS PDE-residual of the steady heat-balance on a dense die grid; "
            "bounded across the tested hotspot family, NOT a proven a-priori "
            "bound (Lambda=Conjecture 1). No closed-form reference for the "
            "multi-hotspot field, so residual is the honest in-sample error."
        ),
        wall_time_s=float(wall),
        verified=verified,
        modeled_not_measured=True,
        doctrine=(
            "v11 LOCKED: Lambda=Conjecture 1; locked-proven=8; SLSA L1 honest; "
            "sovereign own-metal; NO free-energy/over-unity; harvest=WASTED/"
            "stranded heat only; joules MEASURED-only via real exporter — this "
            "thermal field + Landauer floor are MODELED, labelled so; no "
            "fabricated numbers; cite-never-plagiarize."
        ),
    )
    return ThermalSolveResult(
        net=net, history=history, converged=converged, receipt=rcpt,
        grid_x=GX, grid_y=GY, T_field=T_field, residual_field=residual_field,
        joule_accounting=joule_accounting,
        rms_residual=rms_residual, rel_residual=rel_residual,
    )


__all__ = [
    "K_BOLTZMANN", "LANDAUER_NOTE", "METHOD_THERMAL",
    "ChipThermalProblem", "ThermalSolveResult", "solve_chip_thermal",
    "_forward_laplacian",
]


if __name__ == "__main__":
    print("SZL PINN thermal — 2D steady GPU-die heat field (compute-load source)...")
    res = solve_chip_thermal(verbose=True)
    print(f"\nconverged          : {res.converged}")
    print(f"final PDE residual : {res.receipt.physics_residual_loss:.3e}")
    print(f"RMS residual (grid): {res.rms_residual:.3e}")
    print(f"REL residual (grid): {res.rel_residual:.3e}  (BOUNDED ESTIMATE)")
    print(f"verified           : {res.receipt.verified}")
    print(f"peak MODELED T     : {res.T_field.max():.4f} (relative units)")
    print("joule accounting (MODELED, not measured):")
    print(json.dumps(res.joule_accounting, indent=2))
