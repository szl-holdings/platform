# Dev 1 — Mosaic Anomaly / SDA CORE (`khipu-sda-core` / `szl_mosaic`) — FINDINGS

**Author:** Dev 1 (full-stack). **Status:** CORE LANDED, RUNS, TESTS GREEN, interface `v0` frozen.
**Work dir:** `/home/user/workspace/mosaic_szl/`
**Build spec followed:** `estate_audit/mosaic_build_spec.md` §3.0 interface contract (it landed mid-build; I reconciled to it).
**Identification basis:** `estate_audit/mosaic_identification.md` (Mosaic = True Anomaly's proprietary SDA/C2/TW&A platform; clean-room the capability).

---

## 1. What I built (all 6 spec items delivered)

| Spec item | File | Status |
|---|---|---|
| 1. Multivariate anomaly ENSEMBLE (iForest + autoencoder + robust z-score) | `szl_mosaic_core.py` | ✅ runs; per-track + per-timestep score in [0,1] |
| 2. GRAPH anomaly (track-relational, GDN-style) | `szl_mosaic_core.py` (`GraphDeviationDetector`) | ✅ velocity-space k-NN graph; explainable deviation |
| 3. TRACK FUSION (multi-sensor NN + tiny Kalman → COP) | `szl_track_fusion.py` | ✅ 6 fused COP tracks from 6 true (2 noisy sensors) |
| 4. ORBIT/SDA STUB (python-sgp4 TLE + conjunction flag) | `szl_sda_orbit.py` | ✅ honestly labeled SDA **roadmap seed** |
| 5. PROVENANCE RECEIPT + Λ-gated + bounded confidence | `szl_mosaic_core.py`, `szl_confidence.py`, `szl_sda_envelope.py` | ✅ honest UNSIGNED in-toto v1; conformal + PAC-Bayes |
| 6. VALIDATION HARNESS (synthetic + injected anomalies + P/R + figure) | `szl_mosaic_validate.py` | ✅ real numbers; `mosaic_validation.png` |

Plus contract/quality files: `szl_sda_envelope.py` (the FROZEN §3.0 contract),
`szl_confidence.py`, `tests/test_no_mock.py`, `tests/test_receipt_roundtrip.py`,
`README.md` (math + schema), `ATTRIBUTION.md`, `THIRD_PARTY_NOTICES`, `NOTICE`,
`requirements.txt`.

---

## 2. Interface contract (FROZEN v0 — Dev2/3/4 build against this)

`szl_sda_envelope.evaluate(track, core, calib_scores, stage=...) -> envelope`
returns the spec §3.0 shape EXACTLY:

- `track_id`, `stage` ∈ {DTID, CHARACTERIZE, TWA, FUSE}
- `anomaly_score` ∈ [0,1]
- `lambda_axis = {name:"anomaly_twa", value, advisory:true, verdict:allow|advisory|deny}` — Λ = Conjecture 1, **always advisory**
- `confidence = {lo, hi, method:"conformal|PAC-Bayes", label:"ESTIMATE"}`
- `sgp4 = {tle_hash:"sha256:…", propagated:true}` for orbital tracks, **null** for air/maritime
- `receipt` = **in-toto Statement v1**, `predicateType …/sda-anomaly/v1`, predicate `{engine:"khipu-sda-core", model_hash, seed, lib_lineage[…], verified:false, sovereign:true}`
- `_signing = {status:"UNSIGNED", signed_by:"szl_lake/khipu DSSE (Ed25519/P-256)"}`

**Honesty invariant baked in:** `predicate.verified=false` + `_signing.status="UNSIGNED"` until a REAL DSSE signs downstream (a11oy / khipu-consensus BFT 3-of-4 on the SHA-256 Khipu Merkle DAG). **No signature is ever fabricated.** UNSIGNED is structural-only.

**For Dev2 (killinchu):** call `evaluate(...)` in the `killinchu_fusion.py` path; route `anomaly_score`/`lambda_axis` into `_lake_receipt` Khipu append; add `anomaly_twa` as the new Λ axis (keep 13-axis conjunctive deny-by-default; advisory). Engine is `pip`-free at runtime beyond numpy/scipy/sklearn/sgp4 (+optional torch).

---

## 3. Validation — HONEST numbers (real, on synthetic data)

`python3 szl_mosaic_validate.py` → `mosaic_validation.png` + printed P/R + Λ-gated receipt.

Synthetic: **6 tracks × 120 steps × 7 raw features** → **6 behavioural features**
[speed, rcs, |Δvx|, |Δvy|, |accel|, |heading-rate|]; **23 injected-anomaly cells**
across 3 types: sustained **maneuver** (track1, t40–47), **RCS spike** (track3,
t70–76), **heading oscillation/weave** (track4, t95–102). Trained on the normal
early window; thresholds from the calibration (normal) distribution — NOT tuned to
the test anomalies.

| Channel | Precision | Recall | F1 |
|---|---|---|---|
| Point ensemble (iForest + AE + robust-z) | **0.436** | **0.739** | **0.548** |
| Graph-relational (GDN-style velocity-deviation) | **1.000** | **0.348** | **0.516** |
| Fused consensus (0.5·point + 0.5·graph) | **0.400** | **0.696** | **0.508** |
| Track fusion | 6 fused COP tracks / 6 true (2 noisy sensors) | | |

**Honest reading (no inflation):** the point ensemble carries recall; the graph
channel is high-precision / low-recall — it fires only on velocity-space maneuvers
and **correctly misses the RCS spike** (no kinematic signature), which is the right
behaviour, not a bug. The 22 point-ensemble false positives are genuine normal
heading-drift noise, surfaced honestly. These are small clean-room-model numbers.

A modeling bug was caught and fixed honestly during the build: scoring on absolute
position (x,y) — which drifts unboundedly — made every late timestep look novel
(P≈0.03). Switched to **stationary behavioural features**; numbers became honest
and defensible. Documented in the validate script comments.

---

## 4. Clean-room / license posture (the moat)

- **Inspiration only** from True Anomaly Mosaic public descriptions ([Mosaic page](https://www.trueanomaly.space/mosaic); [Hilmer/True Anomaly LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t)). **No proprietary code seen or copied.**
- Methods adopted (re-implemented from scratch), with verified-permissive licenses: **PyOD** (BSD-2), **PyGOD** (BSD-2), **Merlion** (BSD-3), **TODS** (Apache-2.0), **tsod** (MIT), **GDN** (MIT, AAAI'21 arXiv:2106.06947), **GraGOD** (MIT), **python-sgp4** (MIT). Runtime: scikit-learn/scipy/numpy (BSD-3), matplotlib, optional torch.
- **alibi-detect EXCLUDED** (BSL-1.1 since 2024-01-22). Not imported; `tests/test_no_mock.py::test_alibi_detect_absent` enforces it.
- Full attribution in `ATTRIBUTION.md` + each license reproduced in `THIRD_PARTY_NOTICES`.

---

## 5. Doctrine v11 compliance

- **Λ = Conjecture 1** — `lambda_axis.advisory=true` always; verdicts are advisories (allow/advisory/deny), never "proven trust", never folded into locked-proven=8.
- **Confidence honest** — split-conformal band + PAC-Bayes (McAllester/Catoni) bound, both labeled `ESTIMATE`; bounds, not certainties.
- **Receipts honest** — in-toto v1, `verified:false`/UNSIGNED, signer pointer named; **no fabricated signatures**.
- **Sovereign own-metal, 0 CDN** — pure local compute, no network calls anywhere.
- **NO free-energy, no over-claims; numbers REAL** — validation is genuinely computed on synthetic data.
- **Orbital SDA honestly labeled roadmap seed** — sgp4 is real, but the module banner states air/maritime is live and orbital DTID/SDA is roadmap.
- **No banned codenames** (amaru/sentra/rosie/jarvis) in any user-visible copy.
- **Sensor-spoofing caveat preserved** (Remote-ID/ADS-B/MAVLink = unauthenticated claims; same skepticism for fused inputs) — noted in README + module headers.

---

## 6. Tests

`python3 -m pytest tests/ -q` → **6 passed**:
- `test_no_mock.py`: no placeholder logic (mock/fake/stub/dummy) in sources; alibi-detect absent/excluded.
- `test_receipt_roundtrip.py`: §3.0 envelope JSON round-trips; receipt is in-toto v1; HONESTY invariants (verified=false, UNSIGNED, sovereign=true) hold; orbital track has `sgp4.tle_hash`, air track has `sgp4=null`; PAC-Bayes path works.

---

## 7. Deliverables (paths)

```
/home/user/workspace/mosaic_szl/
  szl_mosaic_core.py        # ensemble + graph anomaly + receipt + Λ-gate + conformal CI
  szl_track_fusion.py       # multi-sensor NN-assoc + tiny Kalman -> fused COP
  szl_sda_orbit.py          # python-sgp4 TLE propagation + conjunction/anomaly (roadmap seed)
  szl_confidence.py         # conformal band + PAC-Bayes (Catoni) bound, ESTIMATE
  szl_sda_envelope.py       # FROZEN §3.0 contract: evaluate(track) -> envelope
  szl_mosaic_validate.py    # synthetic + injected anomalies -> P/R + figure
  mosaic_validation.png     # figure: tracks + flagged anomalies + fused COP + score curves
  tests/test_no_mock.py, tests/test_receipt_roundtrip.py
  README.md, ATTRIBUTION.md, THIRD_PARTY_NOTICES, NOTICE, requirements.txt
```

## 8. Handoff notes for Dev2/3/4 + Forge
- **Dev2 (killinchu):** import `szl_sda_envelope.evaluate`; fit one `SZLMosaicCore` on a normal window per deployment, pass its `_combined_scores(X_train)` as `calib_scores`. The `anomaly_twa` Λ-axis value = `envelope["lambda_axis"]["value"]`.
- **Dev3 (a11oy):** render `confidence{lo,hi}` band + `lambda_axis.verdict` + receipt link; treat UNSIGNED as structural-only (not green).
- **Dev4 (UDS):** package as a capability service; the receipt is already in-toto v1 ready for DSSE/cosign + Rekor; canonical version `uds-v0.4.0` per spec §4.
- **Forge:** CI must `pip install` lineage libs but **block alibi-detect**; `pytest tests/` is the no-mock + receipt-roundtrip gate.
- Renaming `szl_*` files to the spec's `khipu_sda_core/{detect,multivariate,graph,orbit,fusion,receipt,confidence}.py` package layout is a mechanical follow-up; the functionality + frozen contract are in place now.
```
