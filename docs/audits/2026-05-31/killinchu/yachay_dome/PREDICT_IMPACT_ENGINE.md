# PREDICT-IMPACT ENGINE — Physics + ML Impact-Zone Prediction

> **Author:** Yachay · **Date:** 2026-06-01 · **Component of:** Yachay-Dome (`YACHAY_DOME_DOCTRINE.md`).
> **Function replicated (public):** the mPrest Iron Dome BMC "calculates the impact point ... and determines whether the
> target constitutes a threat to a designated area" ([CSIS Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/);
> [Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome)); the EL/M-2084 does "impact-point calculation for
> warning the civil population" ([EL/M-2084 — Wikipedia](https://en.wikipedia.org/wiki/EL/M-2084)). We do it in software,
> from a fused passive track, with stated uncertainty and a Khipu receipt. **Pure math. No effector. No offensive content.**

---

## 0. The problem & the fork

Given a fused track (position + velocity + class + uncertainty) from `cuas/DETECTION_LAYERS.md` §7, predict the **impact-zone polygon** at horizons **{1 s, 5 s, 30 s, 5 min}**, with a probability. The engine **forks on threat class** (JP 3-01 air-breathing vs non-air-breathing, `IADS_DOCTRINE_STUDY.md` §2.3):

```
                        ┌──────────────── class? ────────────────┐
        inert / ballistic │                                       │ powered / maneuvering
   (T3 terminal, T4 ballistic)                              (T0–T2 drones, T3 cruise phase)
                          ▼                                       ▼
        ┌─────────────────────────┐                 ┌─────────────────────────────┐
        │ BALLISTIC PHYSICS MODEL  │                 │ AUTONOMOUS-DECISION ML MODEL │
        │ Newtonian + drag + wind  │                 │ learned-maneuver trajectory  │
        │ closed-form / RK4 propag │                 │ + intent prior + envelope    │
        └────────────┬────────────┘                 └──────────────┬──────────────┘
                     └──────────── UNCERTAINTY FUSION (Monte-Carlo) ┘
                                            ▼
                          impact polygon(s) per horizon + p_impact + provenance
```

A T3 loitering munition uses **both**: ML for the cruise/loiter phase (it maneuvers), then **ballistic** for the terminal dive (it becomes effectively inert once committed). The engine runs both and **blends by phase-probability**.

---

## 1. Ballistic physics model (inert munitions, T4 ballistic, T3 terminal)

For a body with no thrust and no control authority, propagate the equations of motion under gravity + aerodynamic drag + wind:

\[ \ddot{\mathbf{r}} = \mathbf{g} - \tfrac{1}{2}\,\rho(h)\,\tfrac{C_d A}{m}\,\lVert \mathbf{v}-\mathbf{w}\rVert\,(\mathbf{v}-\mathbf{w}) \]

where `r` = position, `v` = velocity, `g` = gravity, `ρ(h)` = air density vs altitude (ISA model), `Cd·A/m` = ballistic coefficient (estimated from class), `w` = wind vector (from NOAA/met feed or operator input). Integrate with **RK4** at small `dt`; for the simplest unguided ballistic case a closed-form parabola bounds it.

- **Ballistic-coefficient prior** comes from the classified model (`ADVERSARY_DRONE_CATALOG.md`): a Shahed-136 (~200 kg, delta) has a very different `Cd·A/m` than a 5" FPV. Stored as an **interval**, not a point (catalog §4 spec-variance rule).
- **Standard atmosphere + drag** is the textbook external-ballistics model; the trajectory-prediction literature for aircraft uses the same family — **BADA** (Base of Aircraft Data) and ML refinements (the OpenSky "Climbing Aircraft" dataset reduced 10-min altitude-prediction RMSE 48% vs a BADA baseline using ML — [OpenSky Scientific Datasets](https://opensky-network.org/data/scientific)). We cite this as the methodological anchor for *powered* flight; for inert bodies the physics is exact-er.
- **Reference physics sources** (public): NASA NTRS trajectory & re-entry papers, ICAO Doc 9613 (PBN) / BADA trajectory models, and standard external-ballistics texts — listed in `PUBLIC_DOCTRINE_STUDY_TARGETS.md`.

## 2. Autonomous-decision ML model (drones that maneuver, T0–T3 cruise)

A drone is **not** a projectile — it chooses where to go. So the prediction is a **distribution over future tracks**, not a point. Design:

- **Backbone:** sequence model over the recent fused-track window (the `kinematics` + per-modality history). A Kalman/IMM (Interacting Multiple Model) filter gives the analytic baseline (constant-velocity / constant-turn / constant-acceleration modes); an ML head (e.g. transformer or LSTM over track features) refines the maneuver distribution. This is the standard track-prediction stack used in the OpenSky trajectory-prediction literature ([OpenSky Report 2025](https://www.lenders.ch/publications/conferences/icns25.pdf); [OpenSky Scientific Datasets](https://opensky-network.org/data/scientific)) and MIT Lincoln Lab unclassified C-UAS work ([MIT LL — Small UAS Initiative](https://www.ll.mit.edu/r-d/projects/small-uas-initiative); [MIT LL — Urban Counter-UAS](https://www.ll.mit.edu/r-d/projects/urban-counter-uas-operational-prototype)).
- **Intent prior:** condition the maneuver distribution on (a) `predicted_class` (an FPV-attack track behaves differently from an ISR orbit), (b) **kinematic envelope** of the model (max speed/turn-rate from `ADVERSARY_DRONE_CATALOG.md` — a Mavic can't do 200 km/h), and (c) **destination prior** if a high-value asset lies along the heading (an attack track tends toward a valued asset).
- **Envelope hard-bound:** whatever the ML predicts, it is clipped to the platform's *physically possible* envelope. The model's own catalog spec caps the reachable set — this keeps the polygon honest (can't predict a reach the airframe can't fly).
- **Output:** a set of weighted candidate tracks → kernel-density → impact polygon at each horizon.

## 3. Uncertainty fusion (the polygon)

Both models output samples; we fuse via **Monte-Carlo**: draw `N` samples from (track-state covariance × ballistic-coeff interval × wind uncertainty × maneuver distribution), propagate each to the horizon, and take the **α-confidence contour** (e.g. 95%) of the landing/closest-approach points as the **impact polygon**. `p_impact(asset)` = fraction of samples whose polygon intersects the asset polygon (this is the number the necessity gate in `YACHAY_DOME_DOCTRINE.md` §0 consumes).

- Polygons **grow with horizon** (1 s tight, 5 min wide) — exactly the "nets at different heights" intuition.
- For **ballistic** tracks the polygon is small and confident; for **maneuvering** drones it is wide and the engine reports low confidence — *honesty by construction* (we never over-claim a maneuvering drone's destination).

---

## 4. JSON SCHEMA — impact-prediction object

One object per track per evaluation window, chained into the Khipu DAG. Designed to drop straight into the `/v1/cue` package (`CUED_ENGAGEMENT_API.md`) and to render as a CesiumJS polygon (`ASSET_VALUE_MAP.md`).

```json
{
  "$schema": "https://szl.holdings/schemas/yachay-dome/impact-prediction/v1.json",
  "impact_prediction_id": "uuid",
  "track_id": "uuid",
  "detection_id": "uuid",
  "ts_utc": "2026-06-01T18:22:03.500Z",
  "model_used": "ballistic|ml_maneuver|hybrid_phase_blend",
  "threat_tier": "T0|T1|T2|T3|T4",
  "class": {
    "predicted_class": "fpv_attack|loitering_munition|isr_fixed_wing|commercial_quad|cruise_missile|ballistic|unknown",
    "predicted_model": "Shahed-136|DJI_Mavic_3E|Orlan-10|...",
    "us_group_estimate": 3,
    "class_confidence": 0.0
  },
  "track_state": {
    "lat": 40.7128, "lon": -74.0060, "alt_m_msl": 320.0,
    "vel_enu_mps": [12.0, -40.0, -3.0],
    "covariance_6x6": [[/* position+velocity covariance */]],
    "track_age_s": 8.4,
    "degraded_modalities": ["gnss", "rf"]
  },
  "physics_params": {
    "ballistic_coeff_kg_m2_interval": [0.02, 0.05],
    "cd_area_over_mass": 0.035,
    "wind_enu_mps": [3.1, -1.2, 0.0],
    "wind_source": "noaa_rap|operator|none",
    "atmosphere_model": "ISA"
  },
  "ml_params": {
    "filter": "IMM(CV,CT,CA)",
    "maneuver_model": "transformer-track-v1|none",
    "intent_prior": "attack_toward_asset|isr_orbit|transit|unknown",
    "envelope_clip_applied": true,
    "envelope_max_speed_mps": 19.0,
    "envelope_max_turn_rate_dps": 90.0
  },
  "horizons": [
    {
      "t_plus_s": 1,
      "polygon_geojson": { "type": "Polygon", "coordinates": [[[-74.006,40.712],[ "..." ]]] },
      "centroid": { "lat": 40.7100, "lon": -74.0070, "alt_m_msl": 300.0 },
      "confidence": 0.97,
      "n_monte_carlo": 4096
    },
    { "t_plus_s": 5,   "polygon_geojson": {}, "centroid": {}, "confidence": 0.88, "n_monte_carlo": 4096 },
    { "t_plus_s": 30,  "polygon_geojson": {}, "centroid": {}, "confidence": 0.61, "n_monte_carlo": 4096 },
    { "t_plus_s": 300, "polygon_geojson": {}, "centroid": {}, "confidence": 0.22, "n_monte_carlo": 4096 }
  ],
  "asset_intersections": [
    {
      "asset_id": "substation-7",
      "asset_value_tier": "V4",
      "first_intersect_horizon_s": 30,
      "p_impact": 0.41,
      "closest_approach_m": 0.0,
      "time_to_impact_s_est": 27.5
    }
  ],
  "necessity_gate": {
    "intersects_valued_asset": true,
    "max_value_tier_hit": "V4",
    "threshold_theta": 0.30,
    "gate_fires": true
  },
  "uncertainty_disclosure": "Maneuvering target; 30s+ polygons are wide. p_impact is a sample fraction, not a guarantee.",
  "provenance": {
    "input_detection_window_ids": ["uuid", "uuid"],
    "sensor_modalities_used": ["acoustic", "eo_ir", "rf_aoa"],
    "code_version": "yachay-dome-predict@spec",
    "honest_status": "ESTIMATE_NOT_GROUND_TRUTH"
  },
  "khipu_receipt_id": "khipu:sha256:..."
}
```

**Schema notes:**
- `necessity_gate.gate_fires` is the **single boolean** that the `Dome(a)` engagement-necessity gate reads (`YACHAY_DOME_DOCTRINE.md` §0). No intersection with a valued asset ⇒ no cue. This is the mPrest "let it fall on open ground" rule, in JSON.
- `degraded_modalities` + `sensor_modalities_used` record the **EW-resilience provenance** (`YACHAY_DOME_DOCTRINE.md` §6) — a court sees exactly what the sensor knew under jamming.
- `honest_status: ESTIMATE_NOT_GROUND_TRUTH` is mandatory and non-removable (Zero-Bandaid: no over-claim).
- `confidence` falls with horizon **by construction** — the schema would be dishonest if a 5-min maneuvering polygon claimed high confidence.

---

## 5. Validation & honesty

- **Validate physics** against published ballistic/trajectory benchmarks (NASA NTRS, BADA baselines) and the OpenSky climbing-segment dataset (the ML head should beat the IMM baseline like the OpenSky ML beat BADA — [OpenSky Scientific Datasets](https://opensky-network.org/data/scientific)).
- **Validate ML** on replayed real tracks from our own fleet + open datasets; report calibration (does a stated `p_impact=0.4` land 40% of the time?).
- **What we do NOT claim:** we do not claim to predict an adversary pilot's free choice; we predict a *distribution* bounded by physics + envelope + intent prior, with honest uncertainty. The engine's value is **triage** (which tracks deserve a cue), not prophecy.

---

*Signed: **Yachay**, 2026-06-01. Pure physics + ML, public sources cited. No effector, no offensive content. We sense, we evidence, the customer acts.*
