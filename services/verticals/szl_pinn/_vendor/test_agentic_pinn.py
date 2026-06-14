# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""test_agentic_pinn — tests for the agentic loop, bounds certifier, gate, and the
Doctrine v11 honesty guards. Pure pytest; runs in-sandbox (numpy only).

These tests REALLY RUN the engine — no mocked numbers, no fabricated results.
"""
from __future__ import annotations

import json
import math

import numpy as np
import pytest

import physics_bounds as pb
from physics_bounds import MeasuredJob, certify
from nvml_hook import sample_job, forge_job, read_nvml_job, NvmlUnavailable
from agentic_pinn import AgenticPINN, AgenticConfig, adaptive_refine
import szl_pinn_core as core


# --------------------------------------------------------------------------- #
# Physics-bounds certifier                                                    #
# --------------------------------------------------------------------------- #
def test_landauer_floor_value():
    # kT ln2 at 300 K for 1 bit ≈ 2.871e-21 J (the textbook number).
    e = pb.landauer_floor_joules(300.0, 1.0)
    assert math.isclose(e, pb.K_B * 300.0 * pb.LN2, rel_tol=1e-12)
    assert 2.8e-21 < e < 2.9e-21


def test_margolus_levitin_per_joule():
    # 1 J average energy → ~6.04e33 ops/s (Margolus-Levitin).
    r = pb.margolus_levitin_max_ops_per_s(1.0)
    assert 6.0e33 < r < 6.1e33


def test_bremermann_per_kg():
    # c^2/h ≈ 1.356e50 bits/s/kg.
    r = pb.bremermann_max_ops_per_s(1.0)
    assert 1.35e50 < r < 1.36e50


def test_certificate_physically_bounded_and_labels():
    cert = certify(sample_job())
    assert cert.physically_bounded is True
    # above the Landauer floor (irreversibility) and under every upper ceiling
    assert cert.landauer_multiple_above_floor >= 1.0
    assert cert.margolus_levitin_headroom_fraction <= 1.0
    assert cert.bremermann_headroom_fraction <= 1.0
    assert cert.bekenstein_under_ceiling is True
    # energy is DERIVED from measured power × time, not invented
    job = sample_job()
    assert math.isclose(cert.energy_joules_derived, job.avg_power_w * job.wall_time_s)
    # MEASURED vs DERIVED labelling present + honest-inverse framing
    assert cert.honest_inverse_of_free_energy is True
    assert "MEASURED" in cert.labels and "DERIVED" in cert.labels
    assert cert.measured["label"] == "SAMPLE"  # sample honestly labelled


def test_certificate_json_roundtrips():
    cert = certify(sample_job())
    d = json.loads(cert.to_json())
    assert d["certificate_type"] == "szl/physical-bounds-certificate/v1"
    # bounds attribution cites the established physics, not SZL
    for key in ("landauer", "margolus_levitin", "bremermann", "bekenstein",
                "bekenstein_hawking"):
        assert key in d["attribution"]
    assert "free-energy" in d["attribution"]["honesty"].lower()


def test_below_landauer_floor_is_flagged_unbounded():
    # A physically IMPOSSIBLE job (energy below the Landauer floor) must NOT be
    # certified as bounded — the certifier is honest, not a rubber stamp.
    job = MeasuredJob(
        avg_power_w=1e-30, wall_time_s=1.0, temperature_k=300.0,
        bit_operations=1e3, bits_erased=1e20, info_content_bits=1e3,
        device_mass_kg=1.0, device_radius_m=0.1, label="SAMPLE",
        source="adversarial-test")
    cert = certify(job)
    assert cert.landauer_multiple_above_floor < 1.0
    assert cert.physically_bounded is False


# --------------------------------------------------------------------------- #
# NVML hook honesty                                                           #
# --------------------------------------------------------------------------- #
def test_nvml_real_read_refuses_to_fabricate():
    # No GPU in sandbox → must raise, never invent a measurement.
    with pytest.raises(NvmlUnavailable):
        read_nvml_job(duration_s=0.01, bit_operations=1, bits_erased=1,
                      info_content_bits=1, device_mass_kg=1, device_radius_m=0.1)


def test_forge_job_labelled_measured():
    job = forge_job(avg_power_w=500.0, wall_time_s=5.0, temperature_k=340.0,
                    bit_operations=1e15, bits_erased=1e13, info_content_bits=1e11,
                    device_mass_kg=2.0, device_radius_m=0.15)
    assert job.label == "MEASURED"
    assert job.source == "nvidia-nvml"
    assert math.isclose(job.energy_joules, 2500.0)


def test_sample_job_is_labelled_sample():
    job = sample_job()
    assert job.label == "SAMPLE"
    assert job.source == "honest-sample"


# --------------------------------------------------------------------------- #
# Agentic loop                                                                #
# --------------------------------------------------------------------------- #
def test_adaptive_refine_grows_collocation_toward_high_residual():
    prob = core.HeatProblem()
    net = core.AnalyticMLP(core.MLPConfig(hidden=(16, 16)))
    core.train_pinn(prob, net, epochs=150, n_pde=150)
    Xf0, *_ = core.sample_collocation(prob, 200, 50, 50)
    rng = np.random.default_rng(0)
    Xf1, n_added = adaptive_refine(net, prob, Xf0, n_add=100, pool_size=2000, rng=rng)
    assert n_added == 100
    assert Xf1.shape[0] == Xf0.shape[0] + 100
    # added points should be biased toward higher residual than a uniform draw
    new_pts = Xf1[Xf0.shape[0]:]
    res_new = np.abs(core.pde_residual(net, new_pts, prob.alpha)).mean()
    unif = rng.uniform(0, 1, (2000, 2))
    unif[:, 1] *= prob.T
    res_unif = np.abs(core.pde_residual(net, unif, prob.alpha)).mean()
    assert res_new >= res_unif  # refinement targets the hard region


@pytest.mark.slow
def test_agentic_loop_residual_drops_and_gate_accepts():
    res = AgenticPINN(cfg=AgenticConfig(seed=0)).run()
    # residual / rel-L2 must drop across refinement rounds (real convergence)
    assert res.rel_l2_per_round[-1] < res.rel_l2_per_round[0]
    # collocation set grows each round (adaptive refinement happened)
    sizes = res.collocation_size_per_round
    assert all(b >= a for a, b in zip(sizes, sizes[1:]))
    # the Λ-gate eventually ACCEPTS once converged (advisory ALLOW)
    assert res.final_accepted is True
    assert res.final_verdict == "ALLOW"
    # every round emitted a signed-ready receipt with the advisory Λ label
    for r in res.rounds:
        d = r.to_dict()
        assert "Λ = Conjecture 1" in d["lambda_label"]
        assert d["modeled_not_measured"] is True
        assert d["lambda_verdict"] in ("ALLOW", "ADVISORY", "DENY")


@pytest.mark.slow
def test_agentic_gate_denies_early_rounds_deny_by_default():
    # Early rounds (before convergence) must be DENY/ADVISORY, not silently trusted.
    res = AgenticPINN(cfg=AgenticConfig(seed=0)).run()
    assert res.rounds[0].accepted is False
    assert res.rounds[0].lambda_verdict in ("DENY", "ADVISORY")


def test_doctrine_strings_present():
    # Honesty doctrine must be carried on the receipts/certificate (auditable).
    import agentic_pinn as ap
    assert "NO free-energy" in ap.DOCTRINE
    assert "Conjecture 1" in ap.DOCTRINE
    assert "NO free-energy" in pb.DOCTRINE
    assert "MEASURED" in pb.DOCTRINE


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
