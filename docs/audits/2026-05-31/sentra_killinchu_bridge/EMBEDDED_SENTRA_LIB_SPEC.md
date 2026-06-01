# EMBEDDED_SENTRA_LIB_SPEC — `szl-sentra-detect` (vendored into Killinchu firmware)

**Layer:** PURIQ v12 → `sentra_killinchu_bridge/` (binding **(a)**: szl-sentra-detect vendored
into Killinchu firmware / MAVLink / RF surfaces)
**Author:** Yachay, under CTO authority · 2026-06-01
**Mirrors:** the package skeleton in `…/killinchu/architecture/EMBEDDED_ANATOMY_LIBRARIES.md`
and the Sentra immune posture (18 SLOC + 6 sigs + 1 MB guard).
**Honesty:** SLSA **L1 (honest)**, proof obligations `-- sorry`-tagged, DSSE PLACEHOLDER.
ADDITIVE; no Doctrine v11 LOCKED numbers changed.

---

## 0 — What this is

A tiny Python package, `szl-sentra-detect`, **vendored** (squash-fs ≤ 50 MB, target ≪) into
every Killinchu drone image. It runs **inside** the drone-twin attestation loop and turns raw
firmware / MAVLink / RF / GNSS observations into the four tamper detectors that feed tripwires
T11–T20. It is the embodiment of "every Killinchu drone runs Sentra detection libs embedded."

It is the same *philosophy* as Sentra's immune core (`THREAT_SIGNATURES` + `sentra_inspect`):
small, dependency-light, deterministic, honest about what it cannot prove.

---

## 1 — Module structure (mirrors EMBEDDED_ANATOMY_LIBRARIES.md)

```
szl-sentra-detect/
├── pyproject.toml                 # name=szl-sentra-detect, py>=3.10, deps minimal (§4)
├── PROOF_OBLIGATIONS.md           # Lean obligations (all -- sorry today; honest)
├── src/
│   └── szl_sentra_detect/
│       ├── __init__.py            # public API re-exports (§3)
│       ├── core.py                # the 4 detectors + DetectionResult
│       ├── puriq_iface.py         # PURIQ Λ / Yuyay-13 hooks (axis vector out)
│       ├── khipu_hooks.py         # emit detection → integrity event (§D3 shape)
│       └── _proof_status.py       # PROOF_STATUS dict (sorry counts; honest)
└── tests/
    ├── test_firmware_tamper.py
    ├── test_mavlink_anomaly.py
    ├── test_rf_fingerprint.py
    └── test_gps_spoof.py
```

This is the **identical skeleton** prescribed for every embedded organ in
EMBEDDED_ANATOMY_LIBRARIES.md (`src/szl_<organ>/{__init__,core,puriq_iface,khipu_hooks,_proof_status}.py`).
Here `<organ> = sentra_detect`.

---

## 2 — Where it runs (drone-twin attestation loop)

The Killinchu drone twin (see `…/killinchu/twin/DIGITAL_TWIN_SCHEMA.md`) has a `tamperFlags`
block keyed by tripwire T11–T20 and a `khipuChain`. The attestation loop on each tick:

1. Twin gathers raw observations (boot measurements, firmware merkle root, MAVLink frame buffer,
   RF I/Q fingerprint window, GNSS solution).
2. **Calls the four `szl-sentra-detect` detectors** (§3) with those observations.
3. Each `DetectionResult` sets/clears the matching `tamperFlags[Txx]`.
4. If any flag fires → twin's `/drones/{id}/integrity` POST evaluator produces
   `TAMPER-SUSPECTED`, `_emit_receipt(...)` writes the Khipu receipt, and `khipu_hooks` shapes a
   `szl.integrity.event/v1` (D3) for the `/v1/integrity-stream` webhook → Sentra.
5. The 13-axis vector from `puriq_iface` feeds `_lambda_aggregate` (geometric mean,
   `_LAMBDA_FLOOR=0.90`) — a below-floor Λ is the gating signal.

The detectors are **sensors only** — they never command the drone. "WE SENSE, WE EVIDENCE."

---

## 3 — Public API

```python
from szl_sentra_detect import (
    detect_firmware_tamper,
    detect_mavlink_anomaly,
    detect_rf_fingerprint_deviation,
    detect_gps_spoof,
    DetectionResult,
)
```

```python
@dataclass(frozen=True)
class DetectionResult:
    tripwire: str          # "T11".."T20"
    sentra_sig: str        # "DSIG-01".."DSIG-10"
    fired: bool
    severity: str          # info|low|medium|high|critical
    metric: dict           # observed values
    threshold: dict        # configured thresholds
    axis_delta: dict       # per-axis penalty applied to the 13-axis vector
    note: str              # honest plain-language note

def detect_firmware_tamper(boot_measure: bytes, expected_pcr: bytes,
                           merkle_root: str, golden_root: str,
                           ota_state: dict) -> list[DetectionResult]:
    """Covers T11 secure-boot-attestation, T12 firmware-merkle-mismatch,
    T17 unexpected-ota-attempt. Pure comparison; no network."""

def detect_mavlink_anomaly(frames: list[dict], baseline: dict) -> list[DetectionResult]:
    """Covers T13 mavlink-anomaly, T15 accelerometer/IMU cross, T18 geofence cross,
    T19 mission-deviation, T20 unauthorized-mavlink-command. Stateless over the window."""

def detect_rf_fingerprint_deviation(iq_window, baseline_fingerprint) -> DetectionResult:
    """Covers T14 rf-fingerprint-deviation. Cosine distance vs enrolled fingerprint."""

def detect_gps_spoof(gnss_solution: dict, imu_solution: dict,
                     history: list[dict]) -> DetectionResult:
    """Covers T16 gps-spoof. Cross-checks HDOP jump, sat-count drop, clock bias,
    GNSS-vs-IMU divergence. No correction issued — sense + evidence only."""
```

Algorithms / FP-targets are **the existing ones** documented in
`…/killinchu/twin/TAMPER_HACK_DETECTION.md`; this lib packages them, it does not redefine them.

---

## 4 — Minimal dependencies (≤ 50 MB squash-fs)

| dep | why | size note |
|-----|-----|-----------|
| `numpy` | RF cosine distance, GNSS/IMU vector math | the only heavy dep; pinned, headless |
| stdlib `hashlib` | merkle / PCR comparison | 0 |
| stdlib `dataclasses`, `json`, `math` | result shaping, Λ math | 0 |

**No** scipy / torch / sklearn — RF distance is a hand-rolled cosine; Λ is a plain geometric
mean. Squash-fs target: **< 25 MB** with numpy headless; hard ceiling **50 MB**. This honours
the Sentra-immune ethos (1 MB guard for the pure-python core; numpy is the single concession for
RF/GNSS math and is the line item that must justify itself in CI size-gate).

`pyproject.toml` declares `[project.optional-dependencies] dev = [pytest]`; runtime deps are
`numpy` only.

---

## 5 — Test plan

| test file | covers | asserts |
|-----------|--------|---------|
| `test_firmware_tamper.py` | T11/T12/T17 | golden-root match ⇒ no fire; mutated merkle ⇒ T12 fire; bad PCR ⇒ T11; OTA w/o auth ⇒ T17 |
| `test_mavlink_anomaly.py` | T13/T15/T18/T19/T20 | replayed/forged frames ⇒ T13/T20; IMU-vs-cmd mismatch ⇒ T15; outside geofence ⇒ T18; off-mission ⇒ T19 |
| `test_rf_fingerprint.py` | T14 | enrolled fingerprint ⇒ no fire; foreign emitter ⇒ T14 fire at cosine-dist > threshold |
| `test_gps_spoof.py` | T16 | clean GNSS ⇒ no fire; HDOP jump + sat drop + IMU divergence ⇒ T16 fire |

Plus a **determinism test**: same input ⇒ identical `DetectionResult` (no hidden state/clock).
Plus a **size-gate** CI check: built squash-fs ≤ 50 MB or build fails.
Plus a **no-network test**: detectors must not open a socket (sense-only invariant).

---

## 6 — Proof obligations (PROOF_OBLIGATIONS.md — all honest `-- sorry` today)

```
-- OBLIGATION 1: detect_* are pure (no I/O, no clock) given fixed inputs.        -- sorry
-- OBLIGATION 2: fired == true  ⟹  matching tamperFlags[Txx] set in twin.        -- sorry
-- OBLIGATION 3: axis_delta lowers exactly the axes named for that tripwire.     -- sorry
-- OBLIGATION 4: emitted integrity event validates against szl.integrity.event/v1. -- sorry
-- OBLIGATION 5: no detector ever issues a control command (sense-only).         -- sorry
```

`_proof_status.py` exposes `PROOF_STATUS = {"obligations": 5, "proven": 0, "sorry": 5,
"slsa": "L1 (honest)", "signature": "DSSE PLACEHOLDER"}` so any consumer can read the honest
state at runtime.

---

## 7 — Integration into Killinchu image

- Vendored under `firmware/vendor/szl-sentra-detect/` and pinned by commit + sha256 in the drone
  SBOM (HUKLLA SBOMProvenance reference; SLSA L1 honest, Sigstore PLACEHOLDER).
- Imported by the twin attestation module; failure to import ⇒ twin reports
  `attestation: DEGRADED` honestly (never a silent pass).
- Surfaced to Sentra via the new Killinchu `/v1/integrity-stream` webhook (see
  `pending_patches/killinchu_bridge.py`), which Sentra's `/drone-cyber` tab subscribes to.

---

*— Yachay, 2026-06-01. ADDITIVE. NO BANDAID. 5 proof obligations, 0 proven (`-- sorry`).
SLSA L1 (honest). DSSE PLACEHOLDER. v11 LOCKED numbers preserved.*
