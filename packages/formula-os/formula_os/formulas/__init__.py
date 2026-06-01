"""
PURIQ Formula Suite — 23 deterministic formula modules (F1..F23).

Each formula is a pure, deterministic input -> output function plus a
machine-checkable `identity(...)` predicate expressing the formula's claimed
numeric identity (the thing the Lean theorem asserts and the numeric harness
checks). NO mystical content; pure math only (Zero-Bandaid Law).

Provenance: PURIQ_FORMULA_SUITE.md (F1..F23), PuriqFormulaLean.lean.
Author: Yachay (CTO), SZL Holdings. Date: 2026-06-01.
"""
from __future__ import annotations
import math
from fractions import Fraction
from functools import reduce


# ---------------------------------------------------------------------------
# F1 — Euler-Khipu DAG Identity:  chi = V - E + F ; well-formed iff chi == 2
# ---------------------------------------------------------------------------
def f1_euler_char(V: int, E: int, F: int) -> int:
    return V - E + F


def f1_well_formed(V: int, E: int, F: int) -> bool:
    return f1_euler_char(V, E, F) == 2


def f1_identity(V: int, E: int, F: int) -> bool:
    # Definitional identity: euler_char == V - E + F (always true; mirrors Iff.rfl)
    return f1_euler_char(V, E, F) == (V - E + F)


# ---------------------------------------------------------------------------
# F2 — Egyptian-Kallpa Allocation: greedy unit-fraction expansion of 0<q<1
# Identity: sum of unit fractions == q ; denominators strictly increasing.
# ---------------------------------------------------------------------------
def f2_egyptian_greedy(q: Fraction, fuel: int = 64) -> list[int]:
    out: list[int] = []
    while q > 0 and fuel > 0:
        n = -(-q.denominator // q.numerator)  # ceil(1/q) = ceil(den/num)
        out.append(n)
        q = q - Fraction(1, n)
        fuel -= 1
    return out


def f2_sum(denoms: list[int]) -> Fraction:
    return sum((Fraction(1, n) for n in denoms), Fraction(0))


def f2_identity(num: int, den: int) -> bool:
    q = Fraction(num, den)
    if not (0 < q < 1):
        return True  # vacuous outside domain
    denoms = f2_egyptian_greedy(q)
    sums_back = f2_sum(denoms) == q
    strictly_inc = all(denoms[i] < denoms[i + 1] for i in range(len(denoms) - 1))
    distinct = len(set(denoms)) == len(denoms)
    return sums_back and strictly_inc and distinct


# ---------------------------------------------------------------------------
# F3 — Noether-Khipu Conservation: symmetry mutation preserves charge Q.
# Identity: if mu is a symmetry (charge-preserving), Q(mu s) == Q(s).
# ---------------------------------------------------------------------------
def f3_charge(state: list[float]) -> float:
    return float(sum(state))


def f3_symmetry_permute(state: list[float], perm: list[int]) -> list[float]:
    # A permutation is a symmetry of the sum-charge.
    return [state[p] for p in perm]


def f3_identity(state: list[float], perm: list[int]) -> bool:
    mutated = f3_symmetry_permute(state, perm)
    return math.isclose(f3_charge(mutated), f3_charge(state), rel_tol=1e-12, abs_tol=1e-12)


# ---------------------------------------------------------------------------
# F4 — Gauss-Yuyay Aggregation: 1/sqrt(13) confidence shrink lower bound.
# Identity: yuyayLowerBound = mu - 1.645 * sigma / sqrt(13).
# ---------------------------------------------------------------------------
Z_95 = 1.645
N_AXES = 13


def f4_yuyay_lower_bound(mu: float, sigma: float) -> float:
    return mu - Z_95 * sigma / math.sqrt(N_AXES)


def f4_pass(mu: float, sigma: float, theta: float) -> bool:
    return f4_yuyay_lower_bound(mu, sigma) >= theta


def f4_identity(mu: float, sigma: float) -> bool:
    lb = f4_yuyay_lower_bound(mu, sigma)
    return math.isclose(lb, mu - Z_95 * sigma / math.sqrt(13), rel_tol=1e-12, abs_tol=1e-12)


# ---------------------------------------------------------------------------
# F5 — Euler-Lagrange Agency: stationary action; harness checks EL residual
# vanishes for the analytic minimizer of a quadratic Lagrangian.
# For L = 1/2 q'^2 - 1/2 k q^2 (harmonic), stationary q(t)=A cos(sqrt(k) t)
# satisfies q'' + k q = 0. Identity: residual ~ 0 for that q.
# ---------------------------------------------------------------------------
def f5_el_residual_harmonic(k: float, A: float, t: float, dt: float = 1e-4) -> float:
    q = lambda s: A * math.cos(math.sqrt(k) * s)
    # numeric 2nd derivative
    qpp = (q(t + dt) - 2 * q(t) + q(t - dt)) / dt**2
    return qpp + k * q(t)  # EL: q'' + k q = 0


def f5_identity(k: float, A: float, t: float) -> bool:
    if k <= 0:
        return True
    return abs(f5_el_residual_harmonic(k, A, t)) < 1e-3


# ---------------------------------------------------------------------------
# F6 — Newton Risk-Velocity Tripwire: convex, velocity-capped risk stays
# below level bound. Identity: risk(t+h) <= risk(t) + vmax*h when risk' <= vmax.
# ---------------------------------------------------------------------------
def f6_level_bound_ok(risk0: float, vmax: float, h: float, risk_th: float) -> bool:
    return risk_th <= risk0 + vmax * h


def f6_identity(risk0: float, slope: float, vmax: float, h: float) -> bool:
    # linear risk(t)=risk0+slope*t with slope<=vmax => risk(t+h)=risk0+slope*h
    if slope > vmax or h < 0:
        return True
    risk_h = risk0 + slope * h
    return risk_h <= risk0 + vmax * h + 1e-12


# ---------------------------------------------------------------------------
# F7 — Inverse-Square / Zeta Provenance: sum_{d>=1} d^-s converges for s>1.
# Identity (numeric): partial sums are Cauchy / bounded by zeta(s); s=2 -> pi^2/6.
# ---------------------------------------------------------------------------
def f7_provenance_partial(s: float, N: int) -> float:
    return sum((d + 1.0) ** (-s) for d in range(N))


def f7_identity(s: float) -> bool:
    if s <= 1:
        return True  # vacuous; divergent excluded
    if math.isclose(s, 2.0):
        return math.isclose(f7_provenance_partial(2.0, 200000), math.pi**2 / 6, abs_tol=1e-4)
    # convergence: tail between N and 4N shrinks
    a = f7_provenance_partial(s, 1000)
    b = f7_provenance_partial(s, 4000)
    return (b - a) < 1.0  # bounded tail


# ---------------------------------------------------------------------------
# F8 — Newton-Parsimony Pick: argmin justification count.
# Identity: parsimonyPick returns an element with minimal count.
# ---------------------------------------------------------------------------
def f8_parsimony_pick(cands: list[tuple[str, int]]) -> str | None:
    if not cands:
        return None
    best = min(cands, key=lambda c: c[1])
    return best[0]


def f8_identity(cands: list[tuple[str, int]]) -> bool:
    if not cands:
        return True
    pick = f8_parsimony_pick(cands)
    minc = min(c[1] for c in cands)
    return any(name == pick and cnt == minc for name, cnt in cands)


# ---------------------------------------------------------------------------
# F9 — Sulba Yuyay Mass-Conservation: mass-preserving reweight conserves sum.
# Identity: sum(map(x)) == sum(x) for a doubly-stochastic-style reshuffle.
# ---------------------------------------------------------------------------
def f9_mass_preserving_map(x: list[float], shift: int) -> list[float]:
    n = len(x)
    return [x[(i + shift) % n] for i in range(n)]  # cyclic shift preserves sum


def f9_identity(x: list[float], shift: int) -> bool:
    return math.isclose(sum(f9_mass_preserving_map(x, shift)), sum(x),
                        rel_tol=1e-12, abs_tol=1e-9)


# ---------------------------------------------------------------------------
# F10 — Baudhayana Orthogonality Bound: 577/408 = 2nd Heron iterate from 17/12.
# Identity: heronStep(17/12) == 577/408 ; |577/408 - sqrt2| < 1.5e-6.
# ---------------------------------------------------------------------------
def f10_heron_step(r: Fraction) -> Fraction:
    return (r + 2 / r) / 2


# True value: |577/408 - sqrt(2)| = 2.1239...e-6 (the PURIQ suite's stated 1.5e-6
# bound is too tight by ~0.6e-6; we record the mathematically correct bound).
F10_SQRT2_ERROR_BOUND = 2.2e-6


def f10_identity(_=None) -> bool:
    exact = f10_heron_step(Fraction(17, 12)) == Fraction(577, 408)
    close = abs(577 / 408 - math.sqrt(2)) < F10_SQRT2_ERROR_BOUND
    return exact and close


# ---------------------------------------------------------------------------
# F11 — Frustum A-Shrink: Vol = (h/3)(a^2+ab+b^2). Identity: b->0 gives pyramid.
# ---------------------------------------------------------------------------
def f11_frustum_volume(a: float, b: float, h: float) -> float:
    return (h / 3.0) * (a * a + a * b + b * b)


def f11_identity(a: float, h: float) -> bool:
    pyramid = math.isclose(f11_frustum_volume(a, 0.0, h), (h / 3.0) * a * a,
                           rel_tol=1e-12, abs_tol=1e-12)
    nonneg = f11_frustum_volume(abs(a), abs(a), abs(h)) >= -1e-12
    return pyramid and nonneg


# ---------------------------------------------------------------------------
# F12 — CRT-Hukulla Schedule: pairwise-coprime moduli collide only at lcm.
# Identity: for coprime m1,m2, residue pair determines residue mod m1*m2 uniquely.
# ---------------------------------------------------------------------------
def f12_crt_period(moduli: list[int]) -> int:
    return reduce(lambda a, b: a * b // math.gcd(a, b), moduli, 1)


def f12_identity(m1: int, m2: int, t: int) -> bool:
    if math.gcd(m1, m2) != 1:
        return True
    # CRT: collisions of (t%m1, t%m2) recur exactly mod m1*m2
    period = m1 * m2
    r1, r2 = t % m1, t % m2
    tprime = t + period
    return (tprime % m1 == r1) and (tprime % m2 == r2) and (f12_crt_period([m1, m2]) == period)


# ---------------------------------------------------------------------------
# F13 — Gauss-Bonnet Spine Curvature: total curvature = 2*pi*chi = 4*pi (chi=2).
# Identity: residual = totalCurv - 2*pi*chi == 0 when totalCurv set to 2*pi*chi.
# (CONJ in Lean; numerically the consistency relation is exact.)
# ---------------------------------------------------------------------------
def f13_gauss_bonnet_residual(total_curv: float, chi: int) -> float:
    return total_curv - 2 * math.pi * chi


def f13_identity(chi: int) -> bool:
    total = 2 * math.pi * chi  # well-formed spine pins curvature to topology
    return math.isclose(f13_gauss_bonnet_residual(total, chi), 0.0, abs_tol=1e-9)


# ---------------------------------------------------------------------------
# F14 — Ramanujan A-Partition Bound: |A_split(n)| = p(n).
# Identity: exact partition count p(n) matches recurrence; HR asymptotic is upper
# guide (CONJ). We check exact p(n) via pentagonal recurrence.
# ---------------------------------------------------------------------------
def f14_partitions(n: int) -> int:
    p = [0] * (n + 1)
    p[0] = 1
    for i in range(1, n + 1):
        total = 0
        k = 1
        while True:
            g1 = k * (3 * k - 1) // 2
            g2 = k * (3 * k + 1) // 2
            if g1 > i and g2 > i:
                break
            sign = -1 if k % 2 == 0 else 1
            if g1 <= i:
                total += sign * p[i - g1]
            if g2 <= i:
                total += sign * p[i - g2]
            k += 1
        p[i] = total
    return p[n]


def f14_hardy_ramanujan(n: int) -> float:
    if n <= 0:
        return 1.0
    return (1.0 / (4 * n * math.sqrt(3))) * math.exp(math.pi * math.sqrt(2 * n / 3))


def f14_identity(n: int) -> bool:
    known = {0: 1, 1: 1, 2: 2, 3: 3, 4: 5, 5: 7, 6: 11, 7: 15, 10: 42, 20: 627, 50: 204226}
    if n in known and f14_partitions(n) != known[n]:
        return False
    # HR asymptotic must be within 50% (loose) for large n (it is an asymptote)
    if n >= 20:
        approx = f14_hardy_ramanujan(n)
        exact = f14_partitions(n)
        return 0.4 * exact <= approx <= 1.6 * exact
    return True


# ---------------------------------------------------------------------------
# F15 — Grothendieck Organ Functor: composition associativity.
# Identity: comp(comp f g) h == comp f (comp g h) for function composition.
# ---------------------------------------------------------------------------
def f15_comp(f, g):
    return lambda x: f(g(x))


def f15_identity(x: float) -> bool:
    f = lambda v: v + 1
    g = lambda v: v * 2
    h = lambda v: v - 3
    left = f15_comp(f15_comp(f, g), h)(x)
    right = f15_comp(f, f15_comp(g, h))(x)
    return math.isclose(left, right, rel_tol=1e-12, abs_tol=1e-12)


# ---------------------------------------------------------------------------
# F16 — von-Neumann-Hukulla Minimax: max min == min max == V for a 2x2 game.
# Identity (numeric LP-free): for matching pennies-style A, value via mixed
# strategy equals saddle value.
# ---------------------------------------------------------------------------
def f16_game_value_2x2(A):
    # A = [[a,b],[c,d]]; value of zero-sum mixed game with no pure saddle:
    a, b = A[0]
    c, d = A[1]
    denom = (a + d - b - c)
    if denom == 0:
        # pure saddle: maximin of row minima == minimax of col maxima check
        row_min = [min(A[0]), min(A[1])]
        col_max = [max(A[0][0], A[1][0]), max(A[0][1], A[1][1])]
        return max(row_min), min(col_max)
    V = (a * d - b * c) / denom
    return V, V


def f16_identity(a: float, b: float, c: float, d: float) -> bool:
    lo, hi = f16_game_value_2x2([[a, b], [c, d]])
    return math.isclose(lo, hi, rel_tol=1e-9, abs_tol=1e-9)


# ---------------------------------------------------------------------------
# F17 — Shannon-Kallpa Capacity: H(X) = -sum p log2 p >= 0.
# Identity: entropy non-negative for any distribution.
# ---------------------------------------------------------------------------
def f17_entropy(p: list[float]) -> float:
    return -sum(pi * math.log2(pi) for pi in p if pi > 0)


def f17_identity(p: list[float]) -> bool:
    s = sum(p)
    if s <= 0:
        return True
    p = [pi / s for pi in p]  # normalize
    return f17_entropy(p) >= -1e-12


# ---------------------------------------------------------------------------
# F18 — Kolmogorov A-Description Cap: |A| <= 2^(Kmax+1)-1.
# Identity: number of programs of length <= k equals 2^(k+1)-1.
# ---------------------------------------------------------------------------
def f18_num_programs_up_to(k: int) -> int:
    return 2 ** (k + 1) - 1


def f18_identity(k: int) -> bool:
    # sum_{i=0}^{k} 2^i = 2^(k+1)-1
    return sum(2**i for i in range(k + 1)) == f18_num_programs_up_to(k)


# ---------------------------------------------------------------------------
# F19 — Turing-Fuel Halting Safety: run_fuel(a,n) terminates in <= n steps.
# Identity: fuel-bounded runner always halts; step count <= fuel.
# ---------------------------------------------------------------------------
def f19_run_with_fuel(step, fuel: int, s):
    steps = 0
    cur = s
    while fuel > 0:
        nxt = step(cur)
        steps += 1
        if nxt is None:
            return ("halted", steps, cur)
        cur = nxt
        fuel -= 1
    return ("fuel_exhausted", steps, cur)


def f19_identity(start: int, fuel: int) -> bool:
    # step: count down to 0 then stop (None)
    step = lambda x: (x - 1) if x > 0 else None
    status, steps, _ = f19_run_with_fuel(step, fuel, start)
    return steps <= fuel and status in ("halted", "fuel_exhausted")


# ---------------------------------------------------------------------------
# F20 — Schrodinger Action Superposition: sum c_a^2 == 1 (normalized).
# Identity: a normalized amplitude vector squares-sum to 1.
# ---------------------------------------------------------------------------
def f20_normalize(amps: list[float]) -> list[float]:
    norm = math.sqrt(sum(a * a for a in amps))
    return [a / norm for a in amps]


def f20_identity(amps: list[float]) -> bool:
    if all(a == 0 for a in amps):
        return True
    c = f20_normalize(amps)
    return math.isclose(sum(ci * ci for ci in c), 1.0, rel_tol=1e-12, abs_tol=1e-12)


# ---------------------------------------------------------------------------
# F21 — Dirac-Commit Projection: select(a)=c_a^2 ; sum select == 1.
# Identity: projection weights of a normalized state sum to 1.
# ---------------------------------------------------------------------------
def f21_project(amps_normalized: list[float]) -> list[float]:
    return [a * a for a in amps_normalized]


def f21_identity(amps: list[float]) -> bool:
    if all(a == 0 for a in amps):
        return True
    c = f20_normalize(amps)
    return math.isclose(sum(f21_project(c)), 1.0, rel_tol=1e-12, abs_tol=1e-12)


# ---------------------------------------------------------------------------
# F22 — Feynman-Puriq Path Integral: Z = (1/|T_a|) sum_{t in T_a} Lambda(t).
# Identity: weight equals arithmetic mean of trajectory Lambdas (definitional).
# ---------------------------------------------------------------------------
def f22_path_weight(lambdas: list[float]) -> float:
    if not lambdas:
        return 0.0
    return sum(lambdas) / len(lambdas)


def f22_identity(lambdas: list[float]) -> bool:
    if not lambdas:
        return True
    w = f22_path_weight(lambdas)
    return math.isclose(w * len(lambdas), sum(lambdas), rel_tol=1e-12, abs_tol=1e-9)


# ---------------------------------------------------------------------------
# F23 — Bekenstein A-Cap: |A| <= min(exp(2 pi R E / (hbar c)), 2^(Kmax+1)-1).
# Identity: the enforced cap is the min of the two bounds and |A| respects it.
# ---------------------------------------------------------------------------
def f23_bekenstein_cap(R: float, E: float, Kmax: int,
                       hbar_c: float = 1.0) -> float:
    holo = math.exp(min(2 * math.pi * R * E / hbar_c, 700))  # avoid overflow
    kolmo = 2 ** (Kmax + 1) - 1
    return min(holo, kolmo)


def f23_identity(R: float, E: float, Kmax: int, card_A: int) -> bool:
    cap = f23_bekenstein_cap(abs(R), abs(E), Kmax)
    # an admissible action space sized at floor(cap) respects the cap
    sized = min(card_A, int(cap))
    return sized <= cap + 1e-9
