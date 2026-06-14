# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""szl_pinn_core — clean-room, SZL-native Physics-Informed Neural Network core.

ENERGY-FIRST seed of SZL's physics-ML capability. Sibling of the FE-NO operator
solver (platform/services/verticals/szl_mechanics): same provenance-receipt
contract, same honest-limits posture (Λ = Conjecture 1, advisory).

THE SEED PHYSICS — 1D heat / diffusion equation
------------------------------------------------
    u_t = α · u_xx ,            x ∈ [0, L], t ∈ [0, T]
    IC:  u(x, 0) = u0(x)
    BC:  u(0, t) = u(L, t) = 0   (homogeneous Dirichlet)

A small MLP  u_θ(x, t)  is trained NOT on labelled data but on the PDE itself:

    physics_loss(θ) = mean_{collocation} ( u_t − α·u_xx )^2     (PDE residual)
                    + λ_bc · mean_{boundary}   ( u_θ − u_BC )^2  (BC)
                    + λ_ic · mean_{initial}    ( u_θ − u_IC )^2  (IC)

This is the canonical PINN of Raissi, Perdikaris & Karniadakis (2019),
re-derived clean-room from the published METHOD (the PDE-residual loss is
standard public science). No author/library source code was consulted or copied
(see ATTRIBUTION.md). DeepXDE / NVIDIA Modulus are cited as PRIOR ART, NOT copied.

HONEST DERIVATIVES (no heavy framework)
---------------------------------------
We need u_t = ∂u/∂t and u_xx = ∂²u/∂x² INSIDE the loss. Rather than depend on a
torch/JAX autodiff engine, we implement EXACT forward-mode differentiation
analytically through the MLP. With tanh activations every derivative is closed
form (tanh' = 1 − tanh², tanh'' = −2·tanh·(1 − tanh²)). So u_t and u_xx are the
TRUE analytic derivatives of the network — not finite differences, not noisy.
Training gradients (∂loss/∂θ) are obtained by manual backpropagation through the
same analytic forward pass, optimised with Adam. Pure numpy → sovereign,
own-metal-only, trivially auditable.

HONESTY (Doctrine v11): this MODELS a temperature field. It does NOT create or
measure energy. The solution error is reported as a BOUNDED ESTIMATE over the
tested input family, never as a proven a-priori bound. Λ = Conjecture 1.
"""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import asdict, dataclass

import numpy as np

# Method + attribution constants (single source of truth for the receipt).
# Clean-room: method attribution ONLY — no paper/library code or text copied.
METHOD = "szl_pinn (physics-informed neural network, PDE-residual loss; 1D heat u_t=alpha*u_xx)"
ATTRIBUTION = {
    "pinn_method": (
        "Raissi, Perdikaris, Karniadakis (2019), 'Physics-informed neural "
        "networks: A deep learning framework for solving forward and inverse "
        "problems involving nonlinear partial differential equations', J. "
        "Comput. Phys. 378:686-707, doi:10.1016/j.jcp.2018.10.045 "
        "(method attribution only; clean-room, no code/text copied)"
    ),
    "prior_art_not_copied": (
        "DeepXDE (Lu, Meng, Mao, Karniadakis, SIAM Review 63(1):208-228, 2021, "
        "doi:10.1137/19M1274067) and NVIDIA Modulus are acknowledged PRIOR ART; "
        "no source code from either library was consulted or reused."
    ),
    "implementation": (
        "Clean-room SZL-native reimplementation from the published method "
        "(mathematics, not code). Pure-numpy MLP with analytic forward-mode "
        "PDE derivatives + manual backprop + Adam. No framework autodiff."
    ),
    "license_note": (
        "The published PINN method is standard public science (PDE-residual "
        "loss); only the non-copyrightable math/ideas are adopted, with "
        "citation. No paid product code was ever copied."
    ),
}


# --------------------------------------------------------------------------- #
# Analytic MLP: forward value AND exact spatial/temporal derivatives           #
# --------------------------------------------------------------------------- #
@dataclass
class MLPConfig:
    in_dim: int = 2          # (x, t)
    hidden: tuple = (24, 24) # small on purpose: must converge in-sandbox
    out_dim: int = 1
    seed: int = 0


class AnalyticMLP:
    """Tanh MLP u(x,t) with closed-form ∂u/∂x, ∂²u/∂x², ∂u/∂t and manual backprop.

    Layers: z1 = W1·in + b1 ; a1 = tanh(z1) ; ... ; u = Wout·a_last + bout.
    The network is fully differentiable analytically because tanh has closed-form
    derivatives. We propagate, alongside the activations, their first and second
    derivatives w.r.t. each input coordinate (forward-mode), giving EXACT u_x,
    u_xx, u_t with no finite-difference error.
    """

    def __init__(self, cfg: MLPConfig):
        self.cfg = cfg
        rng = np.random.default_rng(cfg.seed)
        dims = [cfg.in_dim, *cfg.hidden, cfg.out_dim]
        self.W, self.b = [], []
        for din, dout in zip(dims[:-1], dims[1:]):
            # Xavier/Glorot init for tanh nets.
            scale = np.sqrt(2.0 / (din + dout))
            self.W.append(rng.standard_normal((dout, din)) * scale)
            self.b.append(np.zeros((dout, 1)))
        self.n_layers = len(self.W)

    # -- parameter (de)serialisation ---------------------------------------- #
    def get_params(self):
        return [w.copy() for w in self.W], [b.copy() for b in self.b]

    def set_params(self, W, b):
        self.W = [w.copy() for w in W]
        self.b = [bb.copy() for bb in b]

    def to_json(self):
        return json.dumps(
            {"cfg": asdict(self.cfg),
             "W": [w.tolist() for w in self.W],
             "b": [bb.tolist() for bb in self.b]},
            separators=(",", ":"),
        )

    @classmethod
    def from_json(cls, s):
        d = json.loads(s)
        cfg = MLPConfig(**{k: (tuple(v) if k == "hidden" else v)
                           for k, v in d["cfg"].items()})
        net = cls(cfg)
        net.W = [np.array(w) for w in d["W"]]
        net.b = [np.array(b) for b in d["b"]]
        return net

    # -- plain forward (value only) ----------------------------------------- #
    def forward(self, X):
        """X: (N, in_dim). Returns u: (N, 1)."""
        a = X.T  # (in_dim, N)
        for li in range(self.n_layers):
            z = self.W[li] @ a + self.b[li]
            a = np.tanh(z) if li < self.n_layers - 1 else z
        return a.T

    # -- forward + analytic derivatives w.r.t. inputs ----------------------- #
    def forward_with_derivs(self, X):
        """Return u, u_x, u_xx, u_t — EXACT analytic derivatives of the net.

        Forward-mode propagation of (a, da/dx, d2a/dx2, da/dt) through every
        layer. Input coords: column 0 = x, column 1 = t.
        X: (N, 2). All returns shape (N, 1).
        """
        N = X.shape[0]
        a = X.T                                   # (d, N) ; d = in_dim
        # seed derivatives of the inputs themselves
        e_x = np.zeros((self.cfg.in_dim, 1)); e_x[0, 0] = 1.0   # d(in)/dx
        e_t = np.zeros((self.cfg.in_dim, 1)); e_t[1, 0] = 1.0   # d(in)/dt
        a_x = np.repeat(e_x, N, axis=1)           # (d, N)
        a_xx = np.zeros_like(a)                   # (d, N)
        a_t = np.repeat(e_t, N, axis=1)           # (d, N)

        for li in range(self.n_layers):
            W = self.W[li]
            z = W @ a + self.b[li]
            z_x = W @ a_x
            z_xx = W @ a_xx
            z_t = W @ a_t
            if li < self.n_layers - 1:
                th = np.tanh(z)
                d1 = 1.0 - th * th                # tanh'
                d2 = -2.0 * th * d1               # tanh''
                a = th
                # chain rule (forward mode)
                a_x = d1 * z_x
                a_xx = d2 * (z_x * z_x) + d1 * z_xx
                a_t = d1 * z_t
            else:
                # linear output layer
                a = z
                a_x = z_x
                a_xx = z_xx
                a_t = z_t
        return a.T, a_x.T, a_xx.T, a_t.T

    # -- backprop of d(scalar loss)/d(params) via the analytic forward ------ #
    # For training we differentiate the PDE-residual + BC + IC losses w.r.t. the
    # weights. We compute this with a single manual reverse pass that also
    # accounts for the residual depending on u_t and u_xx (second-order in x).
    # To keep the code honest and compact, we obtain parameter gradients by a
    # cached-forward + analytic adjoint described in compute_grads().


# --------------------------------------------------------------------------- #
# Problem definition + analytic reference                                      #
# --------------------------------------------------------------------------- #
@dataclass
class HeatProblem:
    """1D heat equation u_t = alpha*u_xx on [0,L]x[0,T], Dirichlet zero BC.

    Initial condition u0(x) = sin(k*pi*x/L). The analytic solution is then
        u(x,t) = exp(-alpha*(k*pi/L)^2 * t) * sin(k*pi*x/L)
    which we use as the GROUND TRUTH for validation (not for training).
    """
    alpha: float = 0.4
    L: float = 1.0
    T: float = 1.0
    k_mode: int = 1          # initial sine mode

    def u_initial(self, x):
        return np.sin(self.k_mode * np.pi * x / self.L)

    def u_exact(self, x, t):
        decay = np.exp(-self.alpha * (self.k_mode * np.pi / self.L) ** 2 * t)
        return decay * np.sin(self.k_mode * np.pi * x / self.L)


# --------------------------------------------------------------------------- #
# Provenance receipt (matches szl_mechanics/receipt shape; signer-ready)       #
# --------------------------------------------------------------------------- #
@dataclass
class ProvenanceReceipt:
    """Honest, signer-ready provenance struct (DSSE/Khipu compatible).

    Mirrors szl_mechanics ProvenanceReceipt so PINN is a sibling capability under
    the same contract. `verified` reflects that training converged AND the bounded
    solution-error ESTIMATE is below tolerance — it is NOT a cryptographic
    attestation and NOT one of the locked-proven=8 results. `modeled_not_measured`
    is True: the temperature/joule fields are MODELED, never MEASURED.
    """
    method: str
    attribution: dict
    inputs_hash: str
    pde: str
    alpha: float
    geometry: dict
    epochs: int
    converged: bool
    physics_residual_loss: float        # final mean PDE-residual loss achieved
    bc_loss: float
    ic_loss: float
    solution_error_estimate: float      # BOUNDED ESTIMATE (rel-L2 vs analytic), not exact
    error_estimate_is_bound: bool
    error_estimate_scope: str
    wall_time_s: float
    verified: bool
    modeled_not_measured: bool          # ALWAYS True for PINN outputs (honest)
    doctrine: str
    signature: None = None              # left empty; signed on DSSE/Khipu path

    def to_json(self, indent=2):
        return json.dumps(asdict(self), indent=indent, default=str)


def _hash_inputs(inputs: dict) -> str:
    canon = json.dumps(inputs, sort_keys=True, separators=(",", ":"), default=str)
    return "sha256:" + hashlib.sha256(canon.encode()).hexdigest()


# --------------------------------------------------------------------------- #
# Collocation sampling                                                         #
# --------------------------------------------------------------------------- #
def sample_collocation(prob: HeatProblem, n_pde, n_bc, n_ic, seed=0):
    rng = np.random.default_rng(seed)
    # interior PDE collocation points
    xf = rng.uniform(0.0, prob.L, (n_pde, 1))
    tf = rng.uniform(0.0, prob.T, (n_pde, 1))
    Xf = np.hstack([xf, tf])
    # boundary points (x=0 and x=L), Dirichlet 0
    tb = rng.uniform(0.0, prob.T, (n_bc, 1))
    half = n_bc // 2
    xb = np.vstack([np.zeros((half, 1)), np.full((n_bc - half, 1), prob.L)])
    Xb = np.hstack([xb, tb])
    ub = np.zeros((n_bc, 1))
    # initial points t=0
    xi = rng.uniform(0.0, prob.L, (n_ic, 1))
    Xi = np.hstack([xi, np.zeros((n_ic, 1))])
    ui = prob.u_initial(xi)
    return (Xf, Xb, ub, Xi, ui)


# --------------------------------------------------------------------------- #
# Loss + gradients                                                             #
# --------------------------------------------------------------------------- #
def pde_residual(net: AnalyticMLP, Xf, alpha):
    """r = u_t - alpha*u_xx  (the heat-equation residual at collocation points)."""
    _, _, u_xx, u_t = net.forward_with_derivs(Xf)
    return u_t - alpha * u_xx


def total_loss(net, Xf, Xb, ub, Xi, ui, alpha, w_bc=1.0, w_ic=1.0):
    r = pde_residual(net, Xf, alpha)
    loss_pde = float(np.mean(r ** 2))
    ub_pred = net.forward(Xb)
    loss_bc = float(np.mean((ub_pred - ub) ** 2))
    ui_pred = net.forward(Xi)
    loss_ic = float(np.mean((ui_pred - ui) ** 2))
    total = loss_pde + w_bc * loss_bc + w_ic * loss_ic
    return total, loss_pde, loss_bc, loss_ic


def compute_grads(net: AnalyticMLP, Xf, Xb, ub, Xi, ui, alpha, w_bc, w_ic):
    """EXACT analytic parameter gradients of the total PINN loss.

    Two pieces:
      (a) BC + IC terms are plain forward-MSE → standard reverse-mode backprop.
      (b) The PDE-residual term mean((u_t - alpha*u_xx)^2) depends on SECOND
          derivatives of the network in x. We differentiate it analytically by
          treating the residual r(theta) as a closed-form function of the layer
          pre-activations and propagating dr/dtheta in forward mode (the same
          forward-mode machinery that produced u_x, u_xx, u_t), then forming
          dLoss/dtheta = mean( 2*r * dr/dtheta ). No finite differences, no
          framework autodiff — exact and auditable.

    Returns (gW, gb, loss_pde_value).
    """
    gW = [np.zeros_like(w) for w in net.W]
    gb = [np.zeros_like(b) for b in net.b]

    # ---- (a) exact reverse-mode backprop for a forward-MSE term ----------- #
    def backprop_mse(X, target, weight):
        a = X.T
        acts = [a]
        zs = []
        for li in range(net.n_layers):
            z = net.W[li] @ a + net.b[li]
            zs.append(z)
            a = np.tanh(z) if li < net.n_layers - 1 else z
            acts.append(a)
        pred = a.T
        N = X.shape[0]
        delta = (2.0 / N) * (pred - target).T * weight   # (out, N)
        for li in reversed(range(net.n_layers)):
            gW[li] += delta @ acts[li].T
            gb[li] += delta.sum(axis=1, keepdims=True)
            if li > 0:
                da = net.W[li].T @ delta
                delta = da * (1.0 - np.tanh(zs[li - 1]) ** 2)
        return float(np.mean((pred - target) ** 2))

    backprop_mse(Xb, ub, w_bc)
    backprop_mse(Xi, ui, w_ic)

    # ---- (b) exact gradient of the PDE-residual term ---------------------- #
    # The residual r = u_t - alpha*u_xx is a closed-form function of the layer
    # pre-activations (forward-mode produced a, a_x, a_xx, a_t). We backpropagate
    # mean(r^2) through that augmented forward graph in ONE reverse pass
    # (reverse-over-forward) — exact analytic gradients, fully vectorised, no
    # finite differences and no framework autodiff. See _pde_grad_reverse.
    loss_pde_val = _pde_grad_reverse(net, Xf, alpha, gW, gb)
    return gW, gb, loss_pde_val


def _pde_grad_reverse(net: AnalyticMLP, Xf, alpha, gW, gb):
    """EXACT reverse-mode gradient of mean((u_t - alpha*u_xx)^2) w.r.t. params.

    Reverse-over-forward AD, hand-derived for the tanh MLP. The augmented forward
    pass carries, per layer l, the tuple (a, a_x, a_xx, a_t) where these are the
    activation and its analytic 1st/2nd-x and 1st-t derivatives. We cache every
    intermediate, then run one reverse sweep accumulating parameter gradients.
    Verified against complex-step (see tests/test_gradcheck).
    """
    N = Xf.shape[0]
    nl = net.n_layers
    in_dim = net.cfg.in_dim
    # ---- augmented forward, caching everything ---------------------------- #
    a = Xf.T.copy()
    e_x = np.zeros((in_dim, 1)); e_x[0, 0] = 1.0
    e_t = np.zeros((in_dim, 1)); e_t[1, 0] = 1.0
    a_x = np.repeat(e_x, N, axis=1)
    a_xx = np.zeros_like(a)
    a_t = np.repeat(e_t, N, axis=1)
    cache = []  # per layer: dict of forward quantities needed in reverse
    for li in range(nl):
        W = net.W[li]
        z = W @ a + net.b[li]
        z_x = W @ a_x
        z_xx = W @ a_xx
        z_t = W @ a_t
        entry = {"a_in": a, "ax_in": a_x, "axx_in": a_xx, "at_in": a_t,
                 "z": z, "z_x": z_x, "z_xx": z_xx, "z_t": z_t}
        if li < nl - 1:
            th = np.tanh(z)
            d1 = 1.0 - th * th            # tanh'(z)
            d2 = -2.0 * th * d1           # tanh''(z)
            d3 = -2.0 * (d1 * d1 + th * d2)  # tanh'''(z)
            entry.update({"th": th, "d1": d1, "d2": d2, "d3": d3})
            a = th
            a_x = d1 * z_x
            a_xx = d2 * (z_x * z_x) + d1 * z_xx
            a_t = d1 * z_t
        else:
            a = z; a_x = z_x; a_xx = z_xx; a_t = z_t
        cache.append(entry)

    r = (a_t - alpha * a_xx).ravel()      # (N,)
    loss = float(np.mean(r ** 2))
    # seed adjoints on the OUTPUT layer quantities
    dLdr = (2.0 / N) * r                  # (N,)
    # output a_t, a_xx feed r; a, a_x unused at output
    bar_a = np.zeros((net.W[-1].shape[0], N))
    bar_ax = np.zeros_like(bar_a)
    bar_axx = (-alpha * dLdr).reshape(1, N)
    bar_at = (dLdr).reshape(1, N)

    # ---- reverse sweep ---------------------------------------------------- #
    for li in reversed(range(nl)):
        e = cache[li]
        W = net.W[li]
        if li < nl - 1:
            d1, d2, d3 = e["d1"], e["d2"], e["d3"]
            z_x, z_xx, z_t = e["z_x"], e["z_xx"], e["z_t"]
            # forward relations:
            #   a    = th(z)
            #   a_x  = d1*z_x
            #   a_xx = d2*z_x^2 + d1*z_xx
            #   a_t  = d1*z_t
            # adjoints w.r.t. z, z_x, z_xx, z_t (note d1'=d2*?, chain via z)
            # contributions to bar_z from each output:
            bar_z = bar_a * d1
            bar_z += bar_ax * (d2 * z_x)
            bar_z += bar_axx * (d3 * (z_x * z_x) + d2 * z_xx)
            bar_z += bar_at * (d2 * z_t)
            bar_zx = bar_ax * d1 + bar_axx * (2.0 * d2 * z_x)
            bar_zxx = bar_axx * d1
            bar_zt = bar_at * d1
        else:
            bar_z = bar_a
            bar_zx = bar_ax
            bar_zxx = bar_axx
            bar_zt = bar_at
        # z = W a_in + b ; z_x = W ax_in ; z_xx = W axx_in ; z_t = W at_in
        a_in, ax_in, axx_in, at_in = e["a_in"], e["ax_in"], e["axx_in"], e["at_in"]
        gW[li] += (bar_z @ a_in.T + bar_zx @ ax_in.T
                   + bar_zxx @ axx_in.T + bar_zt @ at_in.T)
        gb[li] += bar_z.sum(axis=1, keepdims=True)
        # propagate to previous layer activations
        bar_a = W.T @ bar_z
        bar_ax = W.T @ bar_zx
        bar_axx = W.T @ bar_zxx
        bar_at = W.T @ bar_zt
    return loss


def _residual_complex(W, b, Xf, alpha, n_layers, in_dim):
    """Complex-capable forward-mode evaluation of r = u_t - alpha*u_xx.

    Mirrors AnalyticMLP.forward_with_derivs but dtype-agnostic so a complex step
    can be injected into a single parameter for exact (cancellation-free)
    differentiation. tanh and its derivatives are analytic on C, so complex-step
    yields the exact derivative.
    """
    N = Xf.shape[0]
    a = Xf.T.astype(W[0].dtype)
    e_x = np.zeros((in_dim, 1), dtype=W[0].dtype); e_x[0, 0] = 1.0
    e_t = np.zeros((in_dim, 1), dtype=W[0].dtype); e_t[1, 0] = 1.0
    a_x = np.repeat(e_x, N, axis=1)
    a_xx = np.zeros_like(a)
    a_t = np.repeat(e_t, N, axis=1)
    for li in range(n_layers):
        Wl = W[li]
        z = Wl @ a + b[li]
        z_x = Wl @ a_x
        z_xx = Wl @ a_xx
        z_t = Wl @ a_t
        if li < n_layers - 1:
            th = np.tanh(z)
            d1 = 1.0 - th * th
            d2 = -2.0 * th * d1
            a = th
            a_x = d1 * z_x
            a_xx = d2 * (z_x * z_x) + d1 * z_xx
            a_t = d1 * z_t
        else:
            a = z; a_x = z_x; a_xx = z_xx; a_t = z_t
    r = (a_t - alpha * a_xx).ravel()   # (N,)
    return r


def _pde_grad_complex_step(net: AnalyticMLP, Xf, alpha, gW, gb, h=1e-20):
    """Accumulate EXACT dLoss_pde/dtheta into gW/gb via complex-step.

    loss_pde = mean(r^2). dLoss/dtheta_j = mean( 2*r * dr/dtheta_j ), and
    dr/dtheta_j = Im( r(theta + i*h*e_j) ) / h  is exact (no cancellation).
    """
    W = [w.astype(np.complex128) for w in net.W]
    b = [bb.astype(np.complex128) for bb in net.b]
    in_dim = net.cfg.in_dim
    nl = net.n_layers
    r0 = _residual_complex(W, b, Xf, alpha, nl, in_dim).real   # (N,)
    N = r0.shape[0]
    coeff = (2.0 / N) * r0                                     # dLoss/dr_i
    for li in range(nl):
        Wl = W[li]
        it = np.nditer(Wl, flags=["multi_index"], op_flags=["readwrite"])
        for _ in it:
            idx = it.multi_index
            orig = Wl[idx]
            Wl[idx] = orig + 1j * h
            dr = _residual_complex(W, b, Xf, alpha, nl, in_dim).imag / h
            Wl[idx] = orig
            gW[li][idx] += float(np.dot(coeff, dr))
        bl = b[li]
        for bidx in np.ndindex(bl.shape):
            orig = bl[bidx]
            bl[bidx] = orig + 1j * h
            dr = _residual_complex(W, b, Xf, alpha, nl, in_dim).imag / h
            bl[bidx] = orig
            gb[li][bidx] += float(np.dot(coeff, dr))
    return float(np.mean(r0 ** 2))


# --------------------------------------------------------------------------- #
# Adam trainer                                                                 #
# --------------------------------------------------------------------------- #
class Adam:
    def __init__(self, params_shapes, lr=5e-3, b1=0.9, b2=0.999, eps=1e-8):
        self.lr, self.b1, self.b2, self.eps = lr, b1, b2, eps
        self.m = [np.zeros(s) for s in params_shapes]
        self.v = [np.zeros(s) for s in params_shapes]
        self.t = 0

    def step(self, params, grads):
        self.t += 1
        out = []
        for i, (p, g) in enumerate(zip(params, grads)):
            self.m[i] = self.b1 * self.m[i] + (1 - self.b1) * g
            self.v[i] = self.b2 * self.v[i] + (1 - self.b2) * (g * g)
            mhat = self.m[i] / (1 - self.b1 ** self.t)
            vhat = self.v[i] / (1 - self.b2 ** self.t)
            out.append(p - self.lr * mhat / (np.sqrt(vhat) + self.eps))
        return out


def train_pinn(prob: HeatProblem, net: AnalyticMLP, *,
               epochs=2000, lr=5e-3, n_pde=400, n_bc=100, n_ic=100,
               w_bc=20.0, w_ic=20.0, seed=0, verbose=False, conv_tol=5e-3):
    """Train u_theta on the heat-equation PDE-residual + BC + IC loss.

    Returns (history, converged) where converged = final PDE residual <= conv_tol.
    BC/IC weighted up (standard PINN practice) so the unique solution is pinned.
    """
    Xf, Xb, ub, Xi, ui = sample_collocation(prob, n_pde, n_bc, n_ic, seed=seed)
    shapes = [w.shape for w in net.W] + [b.shape for b in net.b]
    opt = Adam(shapes, lr=lr)
    history = []
    for ep in range(epochs):
        gW, gb, _ = compute_grads(net, Xf, Xb, ub, Xi, ui, prob.alpha, w_bc, w_ic)
        params = net.W + net.b
        grads = gW + gb
        new = opt.step(params, grads)
        net.W = new[:net.n_layers]
        net.b = new[net.n_layers:]
        tot, lp, lb, lic = total_loss(net, Xf, Xb, ub, Xi, ui, prob.alpha, w_bc, w_ic)
        history.append((ep, tot, lp, lb, lic))
        if verbose and (ep % 50 == 0 or ep == epochs - 1):
            print(f"  ep {ep:4d}  total={tot:.3e}  pde={lp:.3e}  bc={lb:.3e}  ic={lic:.3e}")
    converged = history[-1][2] <= conv_tol
    return history, converged


# --------------------------------------------------------------------------- #
# Top-level solve → returns prediction grid + ProvenanceReceipt                #
# --------------------------------------------------------------------------- #
@dataclass
class PINNSolveResult:
    net: AnalyticMLP
    history: list
    converged: bool
    receipt: ProvenanceReceipt
    rel_l2_error: float


def solve_heat_pinn(prob: HeatProblem | None = None, *,
                    hidden=(20, 20), epochs=2000, lr=5e-3, seed=0,
                    n_pde=400, n_bc=100, n_ic=100, w_bc=20.0, w_ic=20.0,
                    error_tol=5e-2, verbose=False) -> PINNSolveResult:
    """Train a heat-equation PINN and emit a signer-ready provenance receipt.

    Validation grid error (rel-L2 vs analytic) is a BOUNDED ESTIMATE over the
    tested input family — never a proven a-priori bound (Λ = Conjecture 1).
    """
    if prob is None:
        prob = HeatProblem()
    cfg = MLPConfig(in_dim=2, hidden=tuple(hidden), out_dim=1, seed=seed)
    net = AnalyticMLP(cfg)

    t0 = time.time()
    history, converged = train_pinn(
        prob, net, epochs=epochs, lr=lr, n_pde=n_pde, n_bc=n_bc, n_ic=n_ic,
        w_bc=w_bc, w_ic=w_ic, seed=seed, verbose=verbose)
    wall = time.time() - t0

    # ---- bounded solution-error ESTIMATE on a dense validation grid ------- #
    nx, nt = 41, 41
    xs = np.linspace(0, prob.L, nx)
    ts = np.linspace(0, prob.T, nt)
    XX, TT = np.meshgrid(xs, ts)
    grid = np.column_stack([XX.ravel(), TT.ravel()])
    u_pred = net.forward(grid).ravel()
    u_true = prob.u_exact(XX.ravel(), TT.ravel())
    rel_l2 = float(np.linalg.norm(u_pred - u_true) / (np.linalg.norm(u_true) + 1e-30))

    _, final_tot, final_pde, final_bc, final_ic = history[-1]
    verified = bool(converged and rel_l2 <= error_tol)

    inputs = {
        "pde": "u_t = alpha*u_xx",
        "alpha": prob.alpha, "L": prob.L, "T": prob.T, "k_mode": prob.k_mode,
        "hidden": list(hidden), "epochs": epochs, "lr": lr, "seed": seed,
        "n_pde": n_pde, "n_bc": n_bc, "n_ic": n_ic, "w_bc": w_bc, "w_ic": w_ic,
    }
    geometry = {
        "domain_x": [0.0, prob.L],
        "domain_t": [0.0, prob.T],
        "bc": "homogeneous Dirichlet u(0,t)=u(L,t)=0",
        "ic": f"u(x,0)=sin({prob.k_mode}*pi*x/L)",
        "collocation": {"n_pde": n_pde, "n_bc": n_bc, "n_ic": n_ic},
        "net_hidden": list(hidden),
    }
    rcpt = ProvenanceReceipt(
        method=METHOD,
        attribution=ATTRIBUTION,
        inputs_hash=_hash_inputs(inputs),
        pde="u_t = alpha*u_xx",
        alpha=float(prob.alpha),
        geometry=geometry,
        epochs=int(epochs),
        converged=bool(converged),
        physics_residual_loss=float(final_pde),
        bc_loss=float(final_bc),
        ic_loss=float(final_ic),
        solution_error_estimate=float(rel_l2),
        error_estimate_is_bound=True,
        error_estimate_scope=(
            "relative L2 vs the closed-form heat-equation solution on the tested "
            "(alpha, IC mode, domain) family; bounded across tested cases, NOT a "
            "proven a-priori bound (Lambda=Conjecture 1)."
        ),
        wall_time_s=float(wall),
        verified=verified,
        modeled_not_measured=True,
        doctrine=(
            "v11 LOCKED: Lambda=Conjecture 1 (advisory); locked-proven=8; SLSA L1 "
            "honest; sovereign own-metal-only; NO free-energy/over-unity; joules "
            "MEASURED-only via real exporter, PINN output is MODELED; no fabricated "
            "numbers (validation really runs); cite-never-plagiarize."
        ),
    )
    return PINNSolveResult(net=net, history=history, converged=converged,
                           receipt=rcpt, rel_l2_error=rel_l2)


__all__ = [
    "METHOD", "ATTRIBUTION",
    "MLPConfig", "AnalyticMLP", "HeatProblem", "ProvenanceReceipt",
    "sample_collocation", "pde_residual", "total_loss", "compute_grads",
    "Adam", "train_pinn", "solve_heat_pinn", "PINNSolveResult",
]


if __name__ == "__main__":
    print("SZL PINN core — training 1D heat-equation PINN (u_t = alpha*u_xx) ...")
    res = solve_heat_pinn(verbose=True)
    print(f"\nconverged          : {res.converged}")
    print(f"final PDE residual : {res.receipt.physics_residual_loss:.3e}")
    print(f"rel-L2 vs analytic : {res.rel_l2_error:.3e}  (BOUNDED ESTIMATE)")
    print(f"verified           : {res.receipt.verified}")
    print(f"walltime           : {res.receipt.wall_time_s:.2f}s")
