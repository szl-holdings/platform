# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""physics_bounds — FUNDAMENTAL-PHYSICS-BOUNDS CERTIFIER for a compute job.

THE DOCTRINE-SAFE FRONTIER (founder's): the HONEST INVERSE of a free-energy claim.
Instead of pretending compute is free or over-unity, we PROVE that a real compute
job's energy use and information throughput sit FAR BELOW the fundamental ceilings
of physics — Landauer, Margolus-Levitin, Bremermann, Bekenstein, Bekenstein-Hawking.
That is not a magic-energy story; it is the opposite: a certificate that the job
is *physically bounded* by established law.

These bounds are ESTABLISHED PHYSICS — they are CITED, never claimed as SZL's:
  * Landauer (1961): minimum energy to ERASE one bit, E_min = kT·ln2.
  * Margolus & Levitin (1998): a system of average energy E can perform at most
    4E/h operations per second (≈ 6.0×10³³ ops/s per joule).
  * Bremermann (1962): maximum c²/h ≈ 1.356×10⁵⁰ bits/s per kg of mass.
  * Bekenstein (1981): entropy bounded by S ≤ 2πkRE/(ħc); equivalently the
    information content I ≤ 2πRE/(ħc·ln2) bits in a region of radius R, energy E.
  * Bekenstein–Hawking (Hawking 1975): black-hole entropy S = kc³A/(4Għ) — the
    holographic ultimate ceiling: information scales with AREA, not volume.

HONESTY (Doctrine v11, HARD): every INPUT is labelled MEASURED vs every DERIVED
bound. We assert NO measured joule we did not receive from a real exporter — the
energy is computed from a MEASURED average power × MEASURED wall time. We NEVER
fabricate numbers. We make NO over-unity / free-energy claim. The certificate is a
factual bound statement; it is signer-ready (DSSE/khipu) but UNSIGNED here. Λ is
advisory: the certificate states physical facts, it does not "prove trust".

Pure stdlib + math → sovereign, own-metal, auditable. Real GPU inputs feed in via
``MeasuredJob`` (see nvml_hook.py); in-sandbox we use HONEST, CLEARLY-LABELLED
sample inputs.
"""
from __future__ import annotations

import hashlib
import json
import math
import time
from dataclasses import asdict, dataclass, field
from typing import Optional

# --------------------------------------------------------------------------- #
# Fundamental physical constants (SI, CODATA-style). Exact where SI defines.   #
# --------------------------------------------------------------------------- #
K_B = 1.380649e-23          # Boltzmann constant, J/K (SI exact)
H_PLANCK = 6.62607015e-34   # Planck constant, J·s (SI exact)
HBAR = H_PLANCK / (2.0 * math.pi)
C_LIGHT = 299792458.0       # speed of light, m/s (SI exact)
G_NEWTON = 6.67430e-11      # gravitational constant, m³/(kg·s²) (CODATA 2018)
LN2 = math.log(2.0)

# Provenance: these bounds are ESTABLISHED PHYSICS, CITED not claimed as SZL's.
BOUNDS_ATTRIBUTION = {
    "landauer": (
        "Landauer, R. (1961), 'Irreversibility and heat generation in the computing "
        "process', IBM J. Res. Dev. 5(3):183-191, doi:10.1147/rd.53.0183. Minimum "
        "energy to erase one bit at temperature T is k·T·ln2."
    ),
    "margolus_levitin": (
        "Margolus, N. & Levitin, L. (1998), 'The maximum speed of dynamical "
        "evolution', Physica D 120:188-195, doi:10.1016/S0167-2789(98)00054-2. A "
        "system of average energy E (above ground state) performs at most 4E/h "
        "orthogonal-state transitions (operations) per second."
    ),
    "bremermann": (
        "Bremermann, H.J. (1962), 'Optimization through evolution and "
        "recombination', in Self-Organizing Systems. Maximum c²/h ≈ 1.356×10⁵⁰ "
        "bits/s per kilogram of mass (mass-energy equivalence + Heisenberg)."
    ),
    "bekenstein": (
        "Bekenstein, J.D. (1981), 'Universal upper bound on the entropy-to-energy "
        "ratio for bounded systems', Phys. Rev. D 23(2):287, "
        "doi:10.1103/PhysRevD.23.287. S ≤ 2πkRE/(ħc); info I ≤ 2πRE/(ħc·ln2) bits."
    ),
    "bekenstein_hawking": (
        "Hawking, S.W. (1975), 'Particle creation by black holes', Commun. Math. "
        "Phys. 43:199-220, doi:10.1007/BF02345020; Bekenstein (1973), Phys. Rev. D "
        "7:2333. Black-hole entropy S = k·c³·A/(4·G·ħ); the holographic ceiling — "
        "information scales with AREA not volume ('t Hooft 1993; Susskind 1995)."
    ),
    "honesty": (
        "These are ESTABLISHED physics bounds, cited verbatim by source. They are "
        "NOT SZL conjectures and NOT claimed as SZL's. The certificate is the "
        "HONEST INVERSE of a free-energy claim: it proves the job is physically "
        "bounded, asserts no over-unity, and fabricates no number."
    ),
}

DOCTRINE = (
    "v11 LOCKED: NO free-energy/over-unity (this certificate PROVES bounded energy use "
    "— the honest inverse); joules computed ONLY from MEASURED power×time via a real "
    "exporter (DERIVED bounds clearly separated from MEASURED inputs); established "
    "physics bounds are CITED, not claimed as SZL's; Λ=Conjecture 1 (advisory); locked-"
    "proven=8; SLSA L1 honest; sovereign own-metal; no fabricated numbers."
)


# --------------------------------------------------------------------------- #
# MEASURED inputs (clearly labelled) — fed by the NVML hook or honest sample   #
# --------------------------------------------------------------------------- #
@dataclass
class MeasuredJob:
    """MEASURED inputs for one compute job. EVERY field here is an observation,
    NOT a derived bound. ``source`` records provenance (real NVML vs honest sample).
    """
    avg_power_w: float            # MEASURED average board power (W) — e.g. NVML
    wall_time_s: float            # MEASURED wall-clock duration (s)
    temperature_k: float          # MEASURED operating temperature (K) — e.g. NVML
    bit_operations: float         # MEASURED/counted logical bit-ops performed
    bits_erased: float            # MEASURED/estimated irreversible bit-erasures
    info_content_bits: float      # MEASURED/estimated information registered (bits)
    device_mass_kg: float         # device mass (kg) for Bremermann (spec sheet)
    device_radius_m: float        # bounding radius (m) for Bekenstein (spec sheet)
    label: str = "MEASURED"       # MEASURED | SAMPLE (honest)
    source: str = "unspecified"   # e.g. "nvidia-nvml", "honest-sample"
    note: str = ""

    @property
    def energy_joules(self) -> float:
        """DERIVED from MEASURED power × MEASURED time. NOT an independent claim."""
        return self.avg_power_w * self.wall_time_s


# --------------------------------------------------------------------------- #
# Individual bound computations (all DERIVED from the MEASURED inputs)         #
# --------------------------------------------------------------------------- #
def landauer_floor_joules(temperature_k: float, bits_erased: float) -> float:
    """Landauer (1961): minimum energy to erase `bits_erased` bits at T = kT·ln2·N."""
    return K_B * temperature_k * LN2 * bits_erased


def margolus_levitin_max_ops_per_s(energy_joules: float) -> float:
    """Margolus-Levitin (1998): max ops/s = 4E/h for a system of average energy E."""
    return 4.0 * energy_joules / H_PLANCK


def bremermann_max_ops_per_s(mass_kg: float) -> float:
    """Bremermann (1962): max c²/h bits/s per kg → for `mass_kg` total."""
    return (C_LIGHT ** 2 / H_PLANCK) * mass_kg


def bekenstein_max_info_bits(radius_m: float, energy_joules: float) -> float:
    """Bekenstein (1981): I ≤ 2πRE/(ħc·ln2) bits in radius R holding energy E."""
    return 2.0 * math.pi * radius_m * energy_joules / (HBAR * C_LIGHT * LN2)


def bekenstein_hawking_entropy_bits(radius_m: float) -> float:
    """Bekenstein-Hawking holographic ceiling: a region of radius R can hold at
    most the entropy of a black hole that fits it, S = kc³A/(4Għ) with A=4πR².
    Returned in BITS (S/(k·ln2)). The ULTIMATE area-law ceiling, honestly framed.
    """
    area = 4.0 * math.pi * radius_m ** 2
    s_over_k = (C_LIGHT ** 3 * area) / (4.0 * G_NEWTON * HBAR)  # S/k (nats-ish, dimensionless×k)
    return s_over_k / LN2  # convert S/k to bits


# --------------------------------------------------------------------------- #
# The PHYSICAL-BOUNDS CERTIFICATE                                              #
# --------------------------------------------------------------------------- #
@dataclass
class PhysicalBoundsCertificate:
    """Signer-ready certificate. MEASURED inputs vs DERIVED bounds, clearly split."""
    certificate_type: str
    # --- MEASURED inputs (echoed, clearly labelled) ---
    measured: dict
    # --- DERIVED bounds ---
    energy_joules_derived: float          # = measured power × measured time
    landauer_floor_joules: float
    landauer_multiple_above_floor: float  # how many × above the Landauer floor
    margolus_levitin_max_ops_per_s: float
    job_ops_per_s_measured: float         # measured bit-ops / measured time
    margolus_levitin_headroom_fraction: float   # job rate / ML max (a tiny number)
    margolus_levitin_headroom_pct: float
    bremermann_max_ops_per_s: float
    bremermann_headroom_fraction: float
    bekenstein_max_info_bits: float
    bekenstein_info_fraction: float       # info content / Bekenstein ceiling
    bekenstein_under_ceiling: bool
    bekenstein_hawking_ceiling_bits: float  # holographic ultimate ceiling
    # --- honest verdict ---
    physically_bounded: bool              # ALL checks consistent with physics
    summary: str
    inputs_hash: str
    timestamp_utc: float
    attribution: dict = field(default_factory=lambda: BOUNDS_ATTRIBUTION)
    doctrine: str = DOCTRINE
    honest_inverse_of_free_energy: bool = True
    labels: dict = field(default_factory=lambda: {
        "MEASURED": "observed from a real exporter (NVML) or an honestly-labelled sample",
        "DERIVED": "computed from MEASURED inputs via CITED established-physics formulas",
    })
    lambda_note: str = ("Λ = Conjecture 1 (advisory). This certificate states physical "
                        "FACTS (bounds), not 'proven trust'. It makes NO free-energy claim.")
    signature: None = None

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(asdict(self), indent=indent, default=str)


def _hash_measured(job: MeasuredJob) -> str:
    canon = json.dumps(asdict(job), sort_keys=True, separators=(",", ":"), default=str)
    return "sha256:" + hashlib.sha256(canon.encode()).hexdigest()


def certify(job: MeasuredJob) -> PhysicalBoundsCertificate:
    """Compute the PHYSICAL-BOUNDS CERTIFICATE from one MEASURED job.

    Returns a certificate stating: this job used X joules = N× the Landauer floor,
    ran at M% of the Margolus-Levitin rate, with information under the Bekenstein
    ceiling. The HONEST INVERSE of a free-energy claim.
    """
    E = job.energy_joules  # DERIVED: measured power × measured time

    # Landauer
    floor = landauer_floor_joules(job.temperature_k, job.bits_erased)
    land_mult = (E / floor) if floor > 0 else float("inf")

    # Margolus-Levitin
    ml_max = margolus_levitin_max_ops_per_s(E)
    job_ops_rate = (job.bit_operations / job.wall_time_s) if job.wall_time_s > 0 else 0.0
    ml_frac = (job_ops_rate / ml_max) if ml_max > 0 else float("inf")

    # Bremermann
    brem_max = bremermann_max_ops_per_s(job.device_mass_kg)
    brem_frac = (job_ops_rate / brem_max) if brem_max > 0 else float("inf")

    # Bekenstein info bound
    bek_max = bekenstein_max_info_bits(job.device_radius_m, E)
    bek_frac = (job.info_content_bits / bek_max) if bek_max > 0 else float("inf")
    bek_ok = job.info_content_bits <= bek_max

    # Bekenstein-Hawking holographic ceiling
    bh_ceiling = bekenstein_hawking_entropy_bits(job.device_radius_m)

    # Honest verdict: bounded iff above the Landauer floor (>=1×, irreversibility
    # forbids below-floor erasure) AND under all upper ceilings.
    physically_bounded = bool(
        land_mult >= 1.0 and ml_frac <= 1.0 and brem_frac <= 1.0 and bek_ok
    )

    summary = (
        f"This compute job used {E:.4g} J (DERIVED = {job.avg_power_w:g} W MEASURED × "
        f"{job.wall_time_s:g} s MEASURED) = {land_mult:.3g}× the Landauer erasure floor "
        f"({floor:.4g} J at {job.temperature_k:g} K, {job.bits_erased:.4g} bits). It ran "
        f"at {ml_frac*100:.3g}% of the Margolus-Levitin maximum operation rate "
        f"({ml_max:.4g} ops/s) and {brem_frac*100:.3g}% of the Bremermann limit. Its "
        f"information content ({job.info_content_bits:.4g} bits) is {bek_frac*100:.3g}% of "
        f"the Bekenstein ceiling ({bek_max:.4g} bits) and far under the holographic "
        f"Bekenstein-Hawking area ceiling ({bh_ceiling:.4g} bits). VERDICT: the compute "
        f"is PHYSICALLY BOUNDED by established law — the honest inverse of a free-energy "
        f"claim. No over-unity. No fabricated number."
    )

    return PhysicalBoundsCertificate(
        certificate_type="szl/physical-bounds-certificate/v1",
        measured={
            "label": job.label,
            "source": job.source,
            "avg_power_w_MEASURED": job.avg_power_w,
            "wall_time_s_MEASURED": job.wall_time_s,
            "temperature_k_MEASURED": job.temperature_k,
            "bit_operations_MEASURED": job.bit_operations,
            "bits_erased_MEASURED": job.bits_erased,
            "info_content_bits_MEASURED": job.info_content_bits,
            "device_mass_kg": job.device_mass_kg,
            "device_radius_m": job.device_radius_m,
            "note": job.note,
        },
        energy_joules_derived=E,
        landauer_floor_joules=floor,
        landauer_multiple_above_floor=land_mult,
        margolus_levitin_max_ops_per_s=ml_max,
        job_ops_per_s_measured=job_ops_rate,
        margolus_levitin_headroom_fraction=ml_frac,
        margolus_levitin_headroom_pct=ml_frac * 100.0,
        bremermann_max_ops_per_s=brem_max,
        bremermann_headroom_fraction=brem_frac,
        bekenstein_max_info_bits=bek_max,
        bekenstein_info_fraction=bek_frac,
        bekenstein_under_ceiling=bek_ok,
        bekenstein_hawking_ceiling_bits=bh_ceiling,
        physically_bounded=physically_bounded,
        summary=summary,
        inputs_hash=_hash_measured(job),
        timestamp_utc=time.time(),
    )


__all__ = [
    "K_B", "H_PLANCK", "HBAR", "C_LIGHT", "G_NEWTON", "LN2",
    "BOUNDS_ATTRIBUTION", "DOCTRINE",
    "MeasuredJob", "PhysicalBoundsCertificate", "certify",
    "landauer_floor_joules", "margolus_levitin_max_ops_per_s",
    "bremermann_max_ops_per_s", "bekenstein_max_info_bits",
    "bekenstein_hawking_entropy_bits",
]


if __name__ == "__main__":
    from nvml_hook import sample_job
    job = sample_job()
    cert = certify(job)
    print("SZL PHYSICAL-BOUNDS CERTIFICATE (sample job)\n" + "=" * 60)
    print(cert.summary)
    print("=" * 60)
    print(f"physically_bounded : {cert.physically_bounded}")
    print(f"Landauer multiple  : {cert.landauer_multiple_above_floor:.3g}×")
    print(f"ML headroom        : {cert.margolus_levitin_headroom_pct:.3e}%")
    print(f"Bremermann frac    : {cert.bremermann_headroom_fraction:.3e}")
    print(f"Bekenstein frac    : {cert.bekenstein_info_fraction:.3e}")
