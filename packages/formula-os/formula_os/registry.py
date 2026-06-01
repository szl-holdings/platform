"""
PURIQ Formula Registry — canonical metadata + input samplers + identity checks
for F1..F23. Single source of truth consumed by agents, harness, prover, and the
a11oy /formulas tab.

Doctrine v11 LOCKED numbers preserved verbatim (referenced, never mutated):
  749 declarations / 14 unique axioms / 163 sorries ; 13-axis yuyay_v3 ;
  replay bacf5443..631fc5 ; A2=IsHomogeneous ; A4=IsBounded ; SLSA L1 ;
  Lambda Conjecture 1 (Lambda-uniqueness is CONJECTURE, NOT a theorem).

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
import random
from dataclasses import dataclass, field
from fractions import Fraction
from typing import Callable

from . import formulas as F


@dataclass(frozen=True)
class FormulaSpec:
    fid: str                      # "F1"
    name: str
    organ: str
    primitive: str                # ancient/scientific source
    master_factor: str            # which master-formula factor it touches
    lean_name: str
    lean_status: str              # PROVED | SKELETON | CONJ
    identity_doc: str             # human-readable claimed identity
    sampler: Callable[[random.Random], tuple]   # produce input args
    identity: Callable[..., bool]               # check identity on those args
    py_module: str = "formula_os.formulas"


def _R(rng, lo, hi):
    return lo + (hi - lo) * rng.random()


SPECS: list[FormulaSpec] = [
    FormulaSpec("F1", "Euler-Khipu DAG Identity", "Khipu",
        "Euler chi=V-E+F=2", "prod Khipu_i gate", "wellFormed_iff", "PROVED",
        "euler_char(V,E,F) == V-E+F (definitional)",
        lambda r: (r.randint(1, 50), r.randint(0, 80), r.randint(0, 80)),
        F.f1_identity),
    FormulaSpec("F2", "Egyptian-Kallpa Allocation", "Kallpa",
        "Egyptian unit fractions (Rhind/Fibonacci-Sylvester)", "budget (wires)",
        "egyptian_sum_eq", "SKELETON",
        "greedy expansion sums to q; denominators distinct & increasing",
        lambda r: (r.randint(1, 11), r.randint(13, 97)),
        F.f2_identity),
    FormulaSpec("F3", "Noether-Khipu Conservation", "Khipu",
        "Noether 1918 symmetry->conservation", "prod Khipu_i", "noether_conservation",
        "PROVED",
        "symmetry (permutation) mutation preserves sum-charge Q",
        lambda r: (lambda n: ([_R(r, -10, 10) for _ in range(n)],
                              r.sample(range(n), n)))(r.randint(2, 8)),
        F.f3_identity),
    FormulaSpec("F4", "Gauss-Yuyay Aggregation", "Yuyay",
        "Gauss/CLT max-entropy", "Yuyay_13", "gaussYuyayPass", "SKELETON",
        "lowerBound = mu - 1.645*sigma/sqrt(13)",
        lambda r: (_R(r, 0, 1), _R(r, 0.01, 0.3)),
        F.f4_identity),
    FormulaSpec("F5", "Euler-Lagrange Agency", "A/agency",
        "Euler-Lagrange least action", "argmax/agency", "isStationary", "SKELETON",
        "harmonic minimizer satisfies q''+k q = 0 (EL residual ~ 0)",
        lambda r: (_R(r, 0.5, 4.0), _R(r, 0.5, 3.0), _R(r, 0, 6.28)),
        F.f5_identity),
    FormulaSpec("F6", "Newton Risk-Velocity Tripwire", "HUKLLA",
        "Newton fluxion d(risk)/dt", "HUKLLA", "velocity_tripwire_sound", "SKELETON",
        "risk' <= vmax => risk(t+h) <= risk(t)+vmax*h",
        lambda r: (_R(r, 0, 5), _R(r, 0, 2), _R(r, 2, 5), _R(r, 0, 3)),
        F.f6_identity),
    FormulaSpec("F7", "Inverse-Square/Zeta Provenance", "Khipu/Kallpa",
        "Newton 1/r^2 + Riemann zeta", "prod Khipu_i weight", "provenance_converges",
        "SKELETON",
        "sum_{d>=1} d^-s converges for s>1; s=2 -> pi^2/6 (Basel)",
        lambda r: (r.choice([2.0, 1.5, 3.0, 2.5]),),
        F.f7_identity),
    FormulaSpec("F8", "Newton-Parsimony Pick", "HUKLLA",
        "Newton Principia Rule 1/4 (Occam)", "tie-break", "parsimony_minimal",
        "SKELETON",
        "parsimonyPick returns element of minimal justification count",
        lambda r: ([(chr(97 + i), r.randint(1, 9)) for i in range(r.randint(1, 6))],),
        F.f8_identity),
    FormulaSpec("F9", "Sulba Yuyay Mass-Conservation", "Yuyay",
        "Sulba area-preserving altar", "Yuyay_13", "yuyay_mass_conserved", "PROVED",
        "sum(map(x)) == sum(x) for mass-preserving reweight",
        lambda r: ([_R(r, -5, 5) for _ in range(13)], r.randint(0, 12)),
        F.f9_identity),
    FormulaSpec("F10", "Baudhayana Orthogonality Bound", "Lambda-spine",
        "Baudhayana Sulba sqrt2=577/408", "Lambda(x)", "baudhayana_iterate", "PROVED",
        "heronStep(17/12)==577/408 ; |577/408 - sqrt2| < 1.5e-6",
        lambda r: (None,),
        F.f10_identity),
    FormulaSpec("F11", "Frustum A-Shrink Law", "A",
        "Moscow Papyrus frustum", "A size", "frustum_degenerates_to_pyramid", "PROVED",
        "Vol=(h/3)(a^2+ab+b^2); b->0 => pyramid; nonneg",
        lambda r: (_R(r, 0, 10), _R(r, 0, 10)),
        F.f11_identity),
    FormulaSpec("F12", "CRT-Hukulla Schedule", "HUKLLA",
        "Bible-numerics mod-structure + Gauss CRT", "HUKLLA cadence",
        "crt_collision_period", "SKELETON",
        "coprime moduli: residue pair recurs exactly mod m1*m2 = lcm",
        lambda r: (r.choice([7, 5, 11]), r.choice([12, 9, 4]), r.randint(0, 200)),
        F.f12_identity),
    FormulaSpec("F13", "Gauss-Bonnet Spine Curvature", "Lambda-spine",
        "Gauss-Bonnet", "Lambda(x)", "curvatureConsistent", "CONJ",
        "total curvature = 2*pi*chi (=4pi when chi=2); residual==0",
        lambda r: (r.choice([2, 2, 2, 1, 0]),),
        F.f13_identity),
    FormulaSpec("F14", "Ramanujan A-Partition Bound", "A",
        "Hardy-Ramanujan p(n)", "A size", "hardyRamanujan", "CONJ",
        "exact p(n) via pentagonal recurrence; HR asymptotic within band",
        lambda r: (r.randint(0, 60),),
        F.f14_identity),
    FormulaSpec("F15", "Grothendieck Organ Functor", "compose",
        "category theory / schemes", "layer", "organ_comp_assoc", "SKELETON",
        "comp(comp f g) h == comp f (comp g h) (associativity)",
        lambda r: (_R(r, -20, 20),),
        F.f15_identity),
    FormulaSpec("F16", "von-Neumann-Hukulla Minimax", "HUKLLA",
        "von Neumann minimax theorem", "HUKLLA policy", "minimax_exists", "SKELETON",
        "max min == min max == V for zero-sum 2x2 game",
        lambda r: (_R(r, -5, 5), _R(r, -5, 5), _R(r, -5, 5), _R(r, -5, 5)),
        F.f16_identity),
    FormulaSpec("F17", "Shannon-Kallpa Capacity", "Kallpa",
        "Shannon channel capacity/entropy", "budget", "entropy_nonneg", "SKELETON",
        "H(X) = -sum p log2 p >= 0",
        lambda r: ([_R(r, 0, 1) for _ in range(r.randint(2, 8))],),
        F.f17_identity),
    FormulaSpec("F18", "Kolmogorov A-Description Cap", "A",
        "Kolmogorov complexity", "A size", "actions_bounded_by_K", "SKELETON",
        "#programs length<=k == 2^(k+1)-1",
        lambda r: (r.randint(0, 16),),
        F.f18_identity),
    FormulaSpec("F19", "Turing-Fuel Halting Safety", "core",
        "Turing halting problem", "halting safety", "fuel_total", "PROVED",
        "fuel-bounded run terminates in <= fuel steps",
        lambda r: (r.randint(0, 50), r.randint(0, 60)),
        F.f19_identity),
    FormulaSpec("F20", "Schrodinger Action Superposition", "A",
        "Schrodinger wavefunction", "pre-commit A", "superposition_normalized",
        "PROVED",
        "normalized amplitudes: sum c_a^2 == 1",
        lambda r: ([_R(r, -3, 3) for _ in range(r.randint(2, 7))],),
        F.f20_identity),
    FormulaSpec("F21", "Dirac-Commit Projection", "Khipu",
        "Dirac bra-ket measurement", "commit + receipt", "projections_sum_one",
        "PROVED",
        "select(a)=c_a^2 ; sum select == 1",
        lambda r: ([_R(r, -3, 3) for _ in range(r.randint(2, 7))],),
        F.f21_identity),
    FormulaSpec("F22", "Feynman-Puriq Path Integral", "A",
        "Feynman path integral", "argmax weight", "puriqPathWeight", "CONJ",
        "Z = (1/|T_a|) sum Lambda(t) (arithmetic mean, definitional)",
        lambda r: ([_R(r, 0, 5) for _ in range(r.randint(1, 8))],),
        F.f22_identity),
    FormulaSpec("F23", "Bekenstein A-Cap", "A",
        "Bekenstein bound + 't Hooft holography", "A bound", "actionSpaceBounded",
        "SKELETON",
        "|A| <= min(exp(2 pi R E/hbar c), 2^(Kmax+1)-1)",
        lambda r: (_R(r, 0, 2), _R(r, 0, 2), r.randint(1, 10), r.randint(1, 5000)),
        F.f23_identity),
]

assert len(SPECS) == 23, f"expected 23 formulas, got {len(SPECS)}"

BY_ID = {s.fid: s for s in SPECS}

# Doctrine v11 LOCKED numbers (verbatim; preserved, never recomputed).
DOCTRINE_V11_LOCKED = {
    "declarations": 749,
    "unique_axioms": 14,
    "sorries": 163,
    "yuyay": "yuyay_v3 (13-axis)",
    "replay": "bacf5443..631fc5",
    "A2": "IsHomogeneous",
    "A4": "IsBounded",
    "slsa": "L1",
    "lambda_status": "Conjecture 1 (Lambda-uniqueness is a CONJECTURE, not a theorem)",
}
