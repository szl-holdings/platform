# HAWKEYE 360 — DEEP DIVE (Killinchu's strategic RF constellation)

**Author:** Yachay-extension · 2026-05-31
**Thesis:** HawkEye 360 is the most strategic external constellation for Killinchu because it is the **only commercial space layer that can geolocate a drone that has Remote ID turned off**. A camouflaged, in-flight UAS still emits a control uplink and/or video downlink; HawkEye geolocates the emitter from LEO. This is the airborne analog of the dark-vessel RF detection lineage Wamani inherited from Vessels.

---

## 1. How the RF geolocation works

HawkEye 360 flies **30+ satellites in clusters of 3**, at roughly **500 km LEO** ([HawkEye 360 technology page](https://www.he360.com/technology/)). The constellation is **passive / receive-only** — the emitter on the ground (or in the air) has no indication it is being observed ([Hubble guide](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/)).

Geolocation uses two physics handles, combined:

- **TDOA (Time Difference of Arrival):** the same RF burst reaches the three formation-flying satellites at slightly different times because they are at slightly different ranges. Each pairwise time-difference defines a hyperboloid; intersecting them constrains the emitter location.
- **FDOA (Frequency Difference of Arrival):** because each satellite has a different velocity vector relative to the emitter, each sees a different Doppler shift. Differencing the Doppler adds an orthogonal constraint.

Stacking **TDOA + FDOA** from a 3-sat cluster yields a 2-D fix ([HawkEye 360 technology](https://www.he360.com/technology/); [Hubble guide](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/)). Accurate geolocation **requires precise formation flying** — the relative positions of the three satellites must be known to high accuracy, which is why HawkEye selected a builder (SFL Missions) specifically for formation-control expertise ([SFL HawkEye Cluster 3](https://sflmissions.com/hawkeye-360-cluster-3/)).

### Processing pipeline (per [Hubble guide](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/))
1. **Onboard collection** — each cluster captures raw RF over a tasking window (subscribe to a recurring regional/band sweep, or task a specific AOI).
2. **Downlink** — raw IQ shipped to ground on next station pass.
3. **Signal processing** — separate emissions, classify by waveform, run TDOA/FDOA solutions.
4. **Characterization** — each detection tagged with frequency, bandwidth, modulation hints, duty cycle, confidence-bounded location.
5. **Delivery** — output via **RFGeo / Mission Space** products through API or dashboard.

---

## 2. Frequency coverage

The constellation covers roughly **144 MHz – 15 GHz** ([Hubble guide](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/)). That window includes the bands that matter for UAS:

| Band | What it carries for drones | In HawkEye coverage? |
|---|---|---|
| **433 MHz ISM** | long-range UAV telemetry / LRS control | Yes (within 144 MHz–15 GHz) |
| **915 MHz ISM (US)** | UAV control / telemetry, ELRS 900 | Yes |
| **2.4 GHz ISM** | most consumer drone control + ExpressLRS (ELRS) 2.4 LP, Wi-Fi FPV | Yes |
| **5.8 GHz** | analog/digital FPV video downlink | At/near upper edge (~to 15 GHz) — Yes |
| VHF/UHF tactical, L-band (Iridium/Thuraya), marine radar, GNSS-adjacent | jammers, sat phones, control | Yes |

HawkEye's published product suite explicitly covers push-to-talk, digital mobile radio, general VHF/UHF, and L-band satellite devices ([Comms Detection & Mapping mission brief PDF](https://www.he360.com/wp-content/uploads/2025/09/HawkEye-360-Mission-Brief-Communications-Mapping-September-2025.pdf)).

**Honest caveat:** HawkEye markets specific catalogued signal types (maritime VHF, AIS, distress beacons, comms bands), expanding over time ([RFGeo launch — initial catalog was maritime VHF/AIS/EPIRB](https://www.he360.com/hawkeye-360-launches-rfgeo-signal-mapping-product/)). Whether a *specific* ELRS hopping waveform at 2.4 GHz is in their production detection catalog today is a **contract-time question to confirm with HawkEye**, not something to assume. We design the adapter to accept whatever emitter classes they geolocate and tag.

---

## 3. Accuracy

- **Ideal:** <1 km.
- **Nominal:** few-hundred meters to few kilometers, depending on signal duration, bandwidth, SNR, and collection geometry ([Hubble guide](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/)).
- Tri-satellite collection + advanced processing improves accuracy even for weak or mobile emitters ([Comms Detection & Mapping brief](https://www.he360.com/wp-content/uploads/2025/09/HawkEye-360-Mission-Brief-Communications-Mapping-September-2025.pdf)).

**HARD HONESTY on latency:** This is **NOT real-time.** End-to-end latency is **hours**, driven by tasking and pass/downlink geometry ([Hubble guide](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/)). The newer **Cluster 15/16** spacecraft (ordered from SFL, Sept 2025) add **concurrent in-theater collection + real-time downlink** to ground stations, which will shrink latency — but that is a forward capability, not today's baseline ([Business Wire SFL contract](https://www.businesswire.com/news/home/20250910034084/en/); [Via Satellite](https://www.satellitetoday.com/manufacturing/2025/09/10/hawkeye-360-orders-three-new-satellite-clusters-from-sfl-missions/)).

**Implication for Killinchu:** HawkEye is a **tip-and-cue / pattern-of-life** source, NOT a fire-control track. It tells us "an unregistered control emitter at ~915 MHz appeared near grid X within a ~1–5 km ellipse during this pass window." Killinchu fuses that with terrestrial Remote-ID/RF-DF for the close-in track.

---

## 4. API / Access

- **Products:** RFGeo (first commercial product, launched 2019), plus Mission Space and analytics layers, delivered **via API or dashboard** ([RFGeo PR Newswire](https://www.prnewswire.com/news-releases/hawkeye-360-launches-first-commercial-product---rfgeo-300824414.html); [Hubble guide](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/)).
- **Output format:** standardized for loading into common commercial GIS tools — coordinates + observed RF characteristics per emitter ([RFGeo launch page](https://www.he360.com/hawkeye-360-launches-rfgeo-signal-mapping-product/)).
- **Access channels:** commercial contract **and** USG channels (HawkEye holds NRO SCE radio-frequency remote-sensing assessment contracts — see CONSTELLATION_SURVEY §6).
- **No public self-serve key.** Access is sales-gated (`sales@he360.com` / enterprise contract). There is no anonymous developer tier. Budget a contract conversation; do not assume a free API.

---

## 5. Exact integration shape into Killinchu

We build a **HawkEyeAdapter** that runs a **poll/webhook hybrid** and receipt-signs every detection into Khipu.

### 5.1 Ingestion (poll + webhook hybrid)
- **Poll loop (baseline):** because HawkEye latency is hours and delivery is pass-driven, the adapter polls the RFGeo API on a slow cadence (e.g., every 5–15 min) for new emitter detections in our subscribed AOIs/bands. Polling — not 1 Hz — matches the actual data arrival rate. (1 Hz polling against HawkEye would waste calls; reserve 1 Hz for terrestrial feeds.)
- **Webhook (when available):** if HawkEye exposes push/webhook delivery for a contract tier, register a callback so new detections arrive event-driven; the poll loop becomes the reconciliation/backfill safety net.

### 5.2 Normalization → Observation
Each HawkEye detection maps to Killinchu's canonical **Observation** schema:
```json
{
  "obs_id": "uuid",
  "source": "hawkeye360.rfgeo",
  "modality": "RF_GEOLOCATION",
  "emitter": {
    "freq_hz": 915000000,
    "bandwidth_hz": 250000,
    "modulation_hint": "FHSS",
    "signal_class": "uav_control_ism_915",
    "duty_cycle": 0.4
  },
  "geo": { "lat": ..., "lon": ..., "error_ellipse_m": { "semi_major": 1200, "semi_minor": 800, "orientation_deg": 47 } },
  "confidence": 0.78,
  "collected_at": "2026-05-31T14:02:11Z",
  "delivered_at": "2026-05-31T16:48:03Z",
  "latency_s": 9952,
  "remote_id_correlated": false
}
```
- `remote_id_correlated: false` is the **dark-drone flag** — an RF emitter with no matching Remote-ID/ADS-B broadcast is the counter-UAS signal of interest (direct reuse of Wamani's AIS-off dark-vessel logic).

### 5.3 Khipu receipt-signing (per Puriq Zero-Bandaid Law)
Every Observation emits a **Khipu receipt** before it is allowed to surface:
- Hash the normalized Observation (canonical JSON → SHA-256).
- DSSE-style sign the digest; chain-link `prev_receipt_id`.
- Gate through 13-axis Yuyay before any *action* (e.g., HALT cue) — per PURIQ_CHARTER: `Khipu_i(a)` must be `chain_verified=true` for non-zero action score.
- Receipt records provenance (`hawkeye360.rfgeo`), collected_at, delivered_at, and the confidence-bounded geometry, so downstream analysts can audit *why* a dark-drone alert fired.

### 5.4 Fan-out to scene
The receipted Observation publishes to the WebSocket fan-out; the CesiumJS scene renders the RF emitter as a **confidence ellipse** (not a point) — honest depiction of the few-hundred-m-to-few-km uncertainty. See AGGREGATION_ARCHITECTURE.md.

---

## 6. Honest limitations (no bandaid)

1. **Not real-time today.** Hours of latency. Cannot close a tactical intercept loop. Use for cueing + pattern-of-life only.
2. **Catalog gaps.** Confirm at contract time exactly which UAV-control waveforms (e.g., DJI OcuSync, ELRS hopping) are in production detection — do not assume.
3. **Accuracy is an ellipse, not a pin.** Render it honestly; never collapse a 1–5 km ellipse to a deceptive point.
4. **Sales-gated.** No free tier; budget a commercial contract and (for USG) the SCE/clearance pathway.
5. **Geolocates emitters, not airframes.** A drone running silent (pre-programmed, no RF) is invisible to HawkEye — that gap is exactly where SAR/EO ground-signature detection and terrestrial sensors fill in.

— Yachay-extension
