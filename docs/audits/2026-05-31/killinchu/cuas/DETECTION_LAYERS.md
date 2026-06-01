# DETECTION LAYERS — Killinchu Passive Detection Stack

> Killinchu C-UAS Knowledge Base · **Author:** Yachay-extension · **Compiled:** 2026-05-31
>
> **Design principle (the legal keystone): NO TRANSMIT.** Every default layer is **receive-only**.
> A receive-only sensor needs **no FCC transmit license** and does not implicate 47 USC §333 /
> §302a (jammer prohibition) — see `LEGAL_CYBER_BOUNDARY.md`. The one exception (active radar) is
> explicitly flagged as an **optional, customer-licensed** layer, *not* part of the default stack.
>
> Five passive layers + one optional active layer, then a shared ML classifier and feature schema.

---

## 0. Architecture at a glance

```
            ┌──────────────────────────────────────────────────────┐
            │              KILLINCHU FUSION + CLASSIFIER            │
            │   feature schema → ML model → {class, model, conf}    │
            │   → Khipu receipt → COMPANION_DEFENSE_PROTOCOL FSM    │
            └──────────────────────────────────────────────────────┘
   ▲            ▲              ▲               ▲              ▲          ▲(optional)
   │RF spectrum │ADS-B/RID RX  │acoustic       │EO/IR          │          │radar(ACTIVE)
 RTL-SDR/      pingRX /        mic array +     FLIR Boson/      |          Echodyne/
 HackRF/       dual-band       ML classifier   Hadron-R +       |          Robin
 USRP B210/    978/1090 +      (DroneNet)       classifier      |          (FCC+DoD)
 KrakenSDR     2.4/5.8 RID                                      |
 (AoA)
```

All passive layers are **receive-only**. Each emits a time-stamped feature vector + a Khipu
receipt; the fusion engine combines them.

---

## 1. Layer A — RF spectrum sensing (receive-only SDR)

**Goal:** detect + classify control links / video downlinks (OcuSync, ELRS/CRSF, analog 5.8 GHz,
Orlan UHF), and direction-find the emitter.

| Hardware | Tuning range | Bandwidth | Coherent? | Role |
|---|---|---|---|---|
| **RTL-SDR (R820T2/RTL2832U)** | ~24 MHz–1.7 GHz | up to ~2.4 MHz | no | low-cost wideband survey, ADS-B 1090 |
| **HackRF One** | 1 MHz–6 GHz | up to 20 MHz | no (half-duplex) | full 70 MHz–6 GHz sweep, ISM bands |
| **Ettus USRP B210** | 70 MHz–6 GHz | up to 56 MHz | 2×2 MIMO | wideband capture, 2.4/5.8 GHz drone bands |
| **KrakenSDR** | 24 MHz–1.766 GHz | per-channel ~2.4 MHz | **5-ch coherent** | **Angle-of-Arrival (AoA) / direction finding** |

- **KrakenSDR** is five RTL-SDR front-ends driven by one clock with built-in coherence calibration;
  it runs **MUSIC** (and pseudo-Doppler / Watson-Watt) for bearing, and correlative interferometry
  with a known antenna array → triangulation across multiple sites ([About KrakenSDR](https://www.krakenrf.com/about-krakensdr)).
  This is how Killinchu gets a **bearing-to-controller** legally (passive DF), the same capability
  MyDefence Wingman (~30°) and Dedrone TDoA sell commercially.
- **Bands to cover:** 433/868/915 MHz (ELRS 900 / Crossfire / Orlan-class UHF), 1.2 GHz (analog
  video / some control), **2.400–2.4835 GHz** (OcuSync, ELRS 2.4, Wi-Fi quads), **5.150–5.850 GHz**
  (OcuSync, 5.8 analog video). See `MAVLINK_REMOTEID_DEEPDIVE.md` for the waveform families.
- **Detection technique:** energy detection + spectral-template / FHSS-hop-pattern matching +
  cyclostationary features; the classifier (§7) consumes spectrogram tiles.

**Open dataset to train on:** **DroneRF** — Al-Sa'd et al., Mendeley Data v1, DOI
[10.17632/f4c2b4n755.1](https://data.mendeley.com/datasets/f4c2b4n755/1); data paper in *Data in
Brief* ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2352340919306675);
[project page](https://al-sad.github.io/DroneRF/)). Classes: RF **background** vs three drones
(Parrot Bebop, Parrot AR, DJI Phantom), captured as raw RF segments for detection/identification —
the canonical open RF benchmark.

---

## 2. Layer B — ADS-B / Remote-ID receive (electronic conspicuity)

**Goal:** legally receive the IDs drones are *required to broadcast*, plus cooperative aircraft.

- **ADS-B 1090ES (1090 MHz)** — fixed-wing/large UAS + manned traffic; **TSO-C166b**, 112-bit
  extended squitter once/sec. Decode with **pyModeS** (junzis) — `pyModeS.decode(msg)` returns
  ICAO, typecode, callsign, altitude, groundspeed, track, vertical rate; even/odd CPR pair →
  lat/lon ([pyModeS](https://github.com/junzis/pyModeS); [FAA ADS-B FAQ](https://www.faa.gov/air_traffic/technology/equipadsb/resources/faq)).
- **ADS-B 978 (UAT)** — low-altitude US GA band; dual-band receivers cover both.
- **Remote ID (ASTM F3411-22a)** — broadcast over **Bluetooth 4/5 + Wi-Fi (2.4/5.8 GHz)** by the
  drone itself; receive-only, no license. Reference decoder **opendroneid/opendroneid-core-c**
  ([OpenDroneID core-c](https://github.com/opendroneid/opendroneid-core-c)). Full message layout in
  `MAVLINK_REMOTEID_DEEPDIVE.md`.
- **Hardware:** **uAvionix pingRX** (dual-band 978/1090 ADS-B receiver) for cooperative traffic; a
  **2.4/5.8 GHz Wi-Fi/BLE sniffer** (or SDR) for ASTM F3411 broadcast RID. Commercial analog:
  Dedrone **RF-900** is exactly a "Remote ID + ADS-B electronic-conspicuity receiver"
  ([Dedrone RF-900](https://www.dedrone.com/sensors/rf-900)).
- **Security caveat:** ADS-B and Remote ID are **unauthenticated broadcast → spoofable**. Killinchu
  treats decoded telemetry as **claims**, scored against geofence/policy, never as ground truth
  ([Security of ADS-B and Remote ID, *Sensors* 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12846276/)).

> **Legal note:** Mandatory broadcast Remote ID has been required in US airspace since Sept 16 2023
> under **14 CFR Part 89** ([FAA Remote ID Final Rule](https://www.faa.gov/sites/faa.gov/files/2021-08/RemoteID_Final_Rule.pdf);
> [14 CFR Part 89](https://www.govinfo.gov/content/pkg/CFR-2023-title14-vol2/pdf/CFR-2023-title14-vol2-part89.pdf)).
> Note Part 89 specifies ADS-B Out **cannot** be used to satisfy Remote-ID — they are distinct.

---

## 3. Layer C — Acoustic (microphone array + ML classifier)

**Goal:** catch the platforms RF can't — INS-only Shahed in cruise, fiber-tethered FPV.

- **Hardware:** multi-element MEMS microphone array (e.g. 4–8 elements) → beamforming for bearing +
  classification. Fully passive.
- **Signal model:** drone acoustic signatures are dominated by **blade-pass frequency (BPF) =
  n_blades × RPM/60** and its harmonics, plus motor/engine tonals. A quad shows distinct BPF combs;
  a Shahed-class piston shows a low broadband "moped" engine signature (see catalog §3).
- **ML approach:** log-mel spectrogram / MFCC → CNN (DroneNet-style) or lightweight CRNN; the field
  benchmark family is generally referred to as "DroneNet" acoustic classifiers.
- **Open datasets:**
  - **DroneAudioDataset** (saraalemadi) — labeled drone vs background audio, the common GitHub
    baseline ([DroneAudioDataset](https://github.com/saraalemadi/DroneAudioDataset)).
  - **Multiclass acoustic dataset + interactive tool** (2025) — newer multi-class drone acoustic
    benchmark ([arXiv 2509.04715](https://arxiv.org/html/2509.04715v1)).
  - **Comprehensive UAV-sound database for ML** (Euracoustics FA2023) ([dael.euracoustics.org](https://dael.euracoustics.org/confs/landing_pages/fa2023/000049.html)).
  - **Drone Sound Audio Detection** (Kaggle, 2026) ([Kaggle](https://www.kaggle.com/datasets/amineipad/drone-sound-audio-detection)).
- **Range note:** acoustic is short-range (typically <300–500 m for small quads) and degrades in
  wind/urban noise — a *confirmation* layer, not a primary long-range layer.

---

## 4. Layer D — EO/IR (camera + classifier)

**Goal:** visual/thermal confirmation + model-ID + intent cues (payload, behavior).

- **Hardware:** **Teledyne FLIR Boson / Boson+** (LWIR, 640×512, <30 mK on Boson+) and **Hadron-R**
  (combined visible + thermal module for sUAS). Skydio X10D is the first sUAS to integrate Boson+
  ([Skydio X10D](https://www.skydio.com/x10d/technical-specs)). Pair with a daylight EO sensor + PTZ
  for slew-to-cue from RF/radar bearing.
- **Classifier:** YOLO-class detector fine-tuned for small aerial objects on EO + IR frames; output
  bounding box + class + track. IR is the night/obscurant fallback; EO gives model-ID detail
  (rotor count, planform, payload gimbal).
- **Cueing:** EO/IR is best *slewed* by an RF/acoustic/radar bearing — staring search is
  inefficient. Killinchu's fusion engine drives a PTZ to the RF AoA bearing (mirrors Fortem's
  radar→camera correlation and OWL/CACI EO/IR identify stages).
- **Thermal cues by platform (from catalog §3):** piston/turbine exhaust (Shahed, Mohajer, TB2/3),
  cold-ish electric battery warmth (DJI/FPV), engine ball + EO gimbal (MALE).

---

## 5. Layer E — Radar (OPTIONAL / ACTIVE — transmitter, not in default stack)

> **⚠ Active radar IS a transmitter.** It requires **FCC equipment authorization + frequency
> coordination**, and operation in federal/DoD bands brings DoD spectrum-management considerations.
> Killinchu therefore treats radar as a **customer-provided / customer-licensed** layer that we
> *integrate and fuse*, never a thing we transmit from a commercial product by default.

- **Echodyne EchoGuard / EchoShield** — MESA software-defined Ku-band; tracks ~20 targets, hovering
  DJI Phantom ~250 m / M600 ~500 m via rotor Doppler smear; in-radar classifier emits **`p_uav`**
  in the track packet ([Echodyne EchoGuard](https://www.echodyne.com/radar-systems/echoguard);
  [Echodyne sheet](https://www.trade.gov/sites/default/files/2024-08/ECHODYNE.pdf)).
- **Robin Radar IRIS / ELVIRA** — dedicated bird/drone micro-Doppler radar (airport-grade).
- **Fortem TrueView R20/R30** — AESA with in-radar micro-Doppler CNN ([Fortem TrueView R20](https://www.fortemtech.com/products/trueview-r20/)).
- **Killinchu's role:** ingest the radar track packet (incl. `p_uav` / micro-Doppler class) as a
  fusion input + emit a Khipu receipt; we do not own the emission.

---

## 6. Sensor-fusion logic

- **Track association:** associate RF AoA bearing + acoustic bearing + EO/IR pixel track + (optional)
  radar track + Remote-ID claimed lat/lon into a single fused track (nearest-neighbor / JPDA over
  bearings and positions).
- **Confidence:** per-layer confidence is combined (e.g. Dempster-Shafer or calibrated logistic
  fusion). **No single layer can authorize a response** — see ROE state machine in
  `COMPANION_DEFENSE_PROTOCOL.md`.
- **Spoof resistance:** if Remote-ID claims a position that disagrees with RF AoA + radar track,
  flag **`rid_inconsistent`** (possible spoof) and *lower* confidence on the cooperative claim while
  *raising* threat priority (a non-cooperative track pretending to be cooperative is suspicious).

---

## 7. Classifier feature schema (the contract every layer fills)

A single normalized feature record per fused detection window (e.g. 1 s). JSON schema:

```json
{
  "detection_id": "uuid",
  "ts_utc": "2026-05-31T18:22:01.300Z",
  "window_s": 1.0,
  "rf": {
    "present": true,
    "bands_hz": [[2400e6, 2483.5e6], [5725e6, 5850e6]],
    "peak_freq_hz": 2437e6,
    "occupied_bw_hz": 20e6,
    "modulation_family": "OcuSync|ELRS|CRSF|analog_fm|wifi|unknown",
    "fhss_hop_rate_hz": 500,
    "fhss_pattern_hash": "sha256:...",
    "rssi_dbm": -71.2,
    "aoa_deg": 137.0,            
    "aoa_method": "MUSIC|pseudo_doppler|tdoa",
    "aoa_sigma_deg": 5.0
  },
  "remote_id": {
    "received": true,
    "astm_f3411_version": "22a",
    "basic_id": "1581F3F...serial",
    "ua_type": 2,
    "claimed_lat": 40.7128, "claimed_lon": -74.0060,
    "claimed_alt_m": 92.0,
    "operator_id": "FAA12345",
    "rid_consistent_with_track": false
  },
  "adsb": { "received": false, "icao24": null, "callsign": null },
  "acoustic": {
    "present": true,
    "blade_pass_freq_hz": 168.0,
    "n_harmonics": 6,
    "engine_class": "electric_quad|piston|ducted_fan|turbine|none",
    "bearing_deg": 140.0,
    "snr_db": 8.5,
    "mfcc": [/* 13–40 coeffs */]
  },
  "eo_ir": {
    "present": true,
    "sensor": "boson_plus|hadron_r|eo_daylight",
    "bbox": [0.41,0.33,0.06,0.05],
    "detector_class": "multirotor|fixed_wing|vtol|bird|unknown",
    "rotor_count_est": 4,
    "thermal_signature": "warm_exhaust|battery_warm|cold|none",
    "pixel_track_id": 17
  },
  "radar_optional": {
    "present": false,
    "p_uav": null, "rcs_m2": null, "micro_doppler_class": null,
    "range_m": null, "az_deg": null, "el_deg": null
  },
  "kinematics": {
    "fused_range_m": 430.0,
    "speed_mps": 14.2,
    "heading_deg": 318.0,
    "closure_rate_mps_to_asset": 9.1,
    "altitude_m_agl": 88.0,
    "track_age_s": 6.2
  },
  "labels": {
    "predicted_class": "fpv_attack|isr_fixed_wing|loitering_munition|commercial_quad|friendly|decoy|unknown",
    "predicted_model": "DJI_Mavic_3E|Shahed-136|Orlan-10|...",
    "us_group_estimate": 1,
    "confidence": 0.0
  },
  "khipu_receipt_id": "khipu:sha256:..."
}
```

**Notes on the schema**
- Every layer is **optional/null-safe**; the classifier handles missing modalities (e.g. RF-dark
  fiber FPV → rely on acoustic + EO/IR + radar).
- `rid_consistent_with_track=false` is the spoof flag (§6).
- `us_group_estimate` maps to the DoD Group table in `ADVERSARY_DRONE_CATALOG.md` §1.
- `khipu_receipt_id` chains the detection into the receipt DAG (Doctrine v11/v12) — every detection
  is auditable evidence for the customer's authorized response.

---

## 8. Open datasets summary (training corpus)

| Dataset | Domain | Classes | Cite |
|---|---|---|---|
| DroneRF | RF | background, Bebop, AR, Phantom | [Mendeley DOI 10.17632/f4c2b4n755.1](https://data.mendeley.com/datasets/f4c2b4n755/1) · [Data in Brief](https://www.sciencedirect.com/science/article/pii/S2352340919306675) |
| DroneAudioDataset | acoustic | drone vs background | [GitHub saraalemadi](https://github.com/saraalemadi/DroneAudioDataset) |
| Multiclass acoustic (2025) | acoustic | multi-drone | [arXiv 2509.04715](https://arxiv.org/html/2509.04715v1) |
| Euracoustics UAV-sound DB | acoustic | UAV sounds | [dael.euracoustics.org](https://dael.euracoustics.org/confs/landing_pages/fa2023/000049.html) |
| Drone Sound Audio Detection | acoustic | drone/non-drone | [Kaggle 2026](https://www.kaggle.com/datasets/amineipad/drone-sound-audio-detection) |
| OpenDroneID core-c | Remote-ID parsing | F3411 messages | [GitHub opendroneid](https://github.com/opendroneid/opendroneid-core-c) |
| pyModeS | ADS-B parsing | Mode-S/ADS-B | [GitHub junzis/pyModeS](https://github.com/junzis/pyModeS) |

**EO/IR:** no single dominant open thermal-sUAS set; assemble from Boson+ captures + public
small-aerial-object detection sets, labeled to the schema above.

---

## 9. Why this stack is the legal commercial sweet spot

- **All five default layers are receive-only** → no FCC transmit license, no §333/§302a exposure.
- **Remote-ID/ADS-B receive is explicitly legal** electronic conspicuity (Dedrone RF-900 ships it
  commercially).
- **Active radar is quarantined** as an optional, customer-licensed integration — Killinchu never
  becomes the transmitter.
- The output is **detection + classification + signed evidence**, handed to a customer with
  authority — exactly the boundary defended in `LEGAL_CYBER_BOUNDARY.md`.

— Signed: **Yachay-extension**, 2026-05-31.
