# Killinchu — Phase 1 Research Notes (Drone Intelligence)

> Quechua: **Killinchu** = American kestrel / hawk (Falco sparverius). The smallest, sharpest-eyed
> falcon of the Andes — a fitting namesake for a counter-UAS rule engine that watches the sky.
>
> Compiled 2026-05-31 (Yachay CTO + Opus 4.8). All sources cited inline with URLs.
> NO MOCKS doctrine: every figure below feeds a real backend endpoint or the curated drone DB.

---

## 1. Defense Unicorns — drone / UAS posture

Defense Unicorns ships **UDS (Unicorn Delivery Service)** — a secure software delivery platform
for National Security missions in *secure, constrained, or disconnected (airgapped)* environments
(<https://docs.defenseunicorns.com>). The relevant building blocks:

- **UDS Core** — a FOSS secure runtime: Istio service mesh, Keycloak SSO, NeuVector runtime
  security, Pepr (policy engine), Loki/Grafana observability. GA at **UDS Core 1.0**
  (<https://defenseunicorns.com/resources/announcing-uds-core-1-0/>, repo
  <https://github.com/defenseunicorns/uds-core>).
- **Zarf** — airgap package/delivery tool (declarative, disconnected installs).
- **Pepr** — TypeScript Kubernetes operator / policy engine (the same Pepr that vessels' repo carries
  a `pepr/` dir for).
- **UDS Platform / Airgap Software Delivery** — bundles the above for edge + tactical clouds
  (<https://defenseunicorns.com/platform/uds-platform/>).

**Drone relevance:** DU does not build airframes; it provides the *mission software substrate* that
C2 / ISR / counter-UAS payloads run on at the tactical edge. Killinchu positions as exactly that
layer for drone intelligence — a governed rule engine that could deploy *inside* a UDS bundle.

---

## 2. US military drones in active service (2024–2026)

DoD classifies UAS into **5 Groups** by max gross takeoff weight, operating altitude, and speed
(<https://en.wikipedia.org/wiki/UAS_groups_of_the_United_States_military>):

| Group | Max wt (lb) | Nominal alt (ft) | Speed (kn) | Examples |
|---|---|---|---|---|
| 1 | 0–20 | <1,200 AGL | 100 | RQ-11 Raven, WASP, RQ-20 Puma |
| 2 | 21–55 | <3,500 AGL | <250 | ScanEagle, Flexrotor |
| 3 | <1,320 | <FL180 | <250 | RQ-7B Shadow, RQ-21 Blackjack, V-BAT |
| 4 | >1,320 | <FL180 | any | MQ-8 Fire Scout, MQ-1C Gray Eagle, MQ-1 Predator |
| 5 | >1,320 | >FL180 | any | MQ-9 Reaper, RQ-4 Global Hawk, MQ-4C Triton |

Key platforms:

- **MQ-9 Reaper** (Group 5, strike/ISR) — General Atomics. Turboprop 900 shp, wingspan 66 ft,
  MTOW 10,500 lb, range 1,150 mi (1,000 nmi), ceiling ~50k ft, AGM-114 Hellfire + GBU-12/38/49/54.
  AFSOC inventory 50 as of Jan 2025. Unit cost ~$56.5M/system
  (<https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104470/mq-9-reaper/>).
- **MQ-1C Gray Eagle** (Group 4, ISR/strike) — General Atomics, US Army. Speed 309 km/h, range
  370 km, ceiling 8,839 m, MTOW 1,633 kg, ~204 produced, IOC 2009
  (<https://www.globalmilitary.net/compare/aircraft/mq-1c-gray-eagle-vs-rq-4-global-hawk/>).
- **RQ-4 Global Hawk** (Group 5, HALE ISR) — Northrop Grumman. Speed 629 km/h, range 22,800 km,
  ceiling 60,000 ft (18,000 m), MTOW 14,628 kg, endurance 34+ hr, unarmed; IMINT/SIGINT/MTI in
  Blocks 20/30/40 (<https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104516/rq-4-global-hawk/>).
- **MQ-4C Triton** (Group 5, maritime ISR) — Navy variant of Global Hawk.
- **RQ-170 Sentinel** (stealth ISR) — Lockheed Martin "Beast of Kandahar".
- **MQ-8 Fire Scout** (Group 4, VTOL ISR) — Northrop Grumman, US Navy.
- **RQ-7 Shadow** (Group 3, tactical ISR) — AAI/Textron, US Army.
- **RQ-21 Blackjack** (Group 3, ISR) — Boeing/Insitu, USMC/Navy.
- **RQ-11 Raven** (Group 1, hand-launched ISR) — AeroVironment; the most-produced US military UAS.
- **RQ-20 Puma** (Group 1, ISR) — AeroVironment.
- **ScanEagle** (Group 2, ISR) — Boeing/Insitu.

**Loitering munitions (US):**

- **Switchblade 300** (Block 20) — AeroVironment. AUR 3.27 kg, 30 km range w/ extended antenna,
  20+ min endurance, EO/IR, frag or EFP warhead. >700 sent to Ukraine after 2022
  (<https://www.avinc.com/solution/switchblade-300-block-20/>,
  <https://en.wikipedia.org/wiki/AeroVironment_Switchblade>).
- **Switchblade 600** — anti-armor. AUR 29.5 kg, 40+ km (90+ km w/ relay), 40+ min, 185 km/h dash,
  Javelin-derived warhead, SAASM GPS (<https://www.avinc.com/solution/switchblade-600/>).
- **Phoenix Ghost** — AEVEX Aerospace loitering munition, developed for/with US for Ukraine.
- **ALTIUS-600 / ALTIUS-700** — Anduril (Area-I) air-launched effects / loitering ISR-strike.

---

## 3. Adversary drones (publicly documented)

- **Shahed-136** (Iran, HESA) — delta-wing loitering munition. Length 3.5 m, wingspan 2.5 m,
  ~200 kg, 185 km/h, range 1,000–2,500 km, 30–50 kg HE-frag warhead, MADO MD-550 50-hp piston
  pusher, INS + consumer GPS; salvo/swarm launch from truck. Russian-operated as "Geran-2"
  (<https://armyrecognition.com/military-products/army/unmanned-systems/unmanned-aerial-vehicles/shahed-136-loitering-munition-kamikaze-suicide-drone-technical-data>,
  <https://en.wikipedia.org/wiki/Shahed_drones>).
- **Shahed-131** (Iran) — smaller predecessor, 15 kg warhead, ~900 km range.
- **Lancet-3** (Russia, ZALA/Kalashnikov) — electric pusher loitering munition, catapult-launched,
  80–110 km/h, 40 km range, 40 min endurance, MTOW 12 kg, ~3 kg HE/HE-frag, EO + TV terminal
  guidance (<https://armyrecognition.com/military-products/army/unmanned-systems/unmanned-aerial-vehicles/lancet-3-loitering-munition-kamikaze-drone-russia-data-fact-sheet>).
- **Bayraktar TB2** (Turkey, Baykar) — MALE strike/ISR. Wingspan 12 m, length 6.5 m, 222 km/h,
  range 300 km, ceiling 8,239 m, MTOW 1,200 kg, ~$5M/unit. Used by allies *and* adversaries
  (<https://www.globalmilitary.net/compare/aircraft/bayraktar-tb2-vs-shahed-136/>).
- **Wing Loong II** (China, CAIG/CASC) — MALE strike/ISR. Length 11 m, wingspan 20.5 m, 370 km/h,
  endurance 32 hr, ceiling 9,000–9,900 m, MTOW 4,200 kg, up to 480 kg ordnance, SatCom >1,000 km
  (<https://en.wikipedia.org/wiki/CAIG_Wing_Loong_II>,
  <https://www.globalmilitary.net/aircraft/wing-loong-ii/>).
- **CH-4 Rainbow** (China, CASC) — MALE strike/ISR, Reaper-class export drone.
- **DJI Mavic 3 / Matrice 300** (China, commercial) — used by *both* sides in Ukraine for ISR and
  improvised munition drops; the dominant small-quad threat in the FPV/commercial tier.

---

## 4. Counter-UAS systems

- **Anduril Lattice** — C2 / sensor-fusion mesh for counter-UAS, integrates with effectors.
- **Epirus Leonidas** — solid-state High-Power Microwave (HPM) directed-energy, defeats drone
  *swarms* by frying electronics over an area; demoed with Anduril Lattice for the USMC Warfighting
  Lab, and mounted on a GD Land Systems mobile C-UAS platform
  (<https://www.epirusinc.com/electronic-warfare>,
  <https://www.defenseone.com/business/2023/07/defense-startups-team-defeat-swarm-drones/388909/>).
- **DroneShield DroneGun** — RF-jammer handheld/mounted; integrated with Epirus
  (<https://uasmagazine.com/articles/droneshield-and-epirus-complete-integration>).
- **SkyWiper (EDM4S)** — NT Service (Lithuania) handheld RF jammer, used in Ukraine.

---

## 5. Detection / telemetry protocols (the decoder substrate)

### 5.1 FAA Remote ID — OpenDroneID / ASTM F3411
- FAA Remote ID **Final Rule** (14 CFR Part 89), broadcast Remote ID in force since 2023
  (<https://www.faa.gov/sites/faa.gov/files/2021-08/RemoteID_Final_Rule.pdf>).
- Open spec: **ASTM F3411** (-19, -22a) + **ASD-STAN prEN 4709-002**. Reference implementation
  **opendroneid/opendroneid-core-c** (<https://github.com/opendroneid/opendroneid-core-c>).
- Message format: each message is **25 bytes**. **Byte 0** = header:
  - high nibble (bits 7–4) = **message type** (0=Basic ID, 1=Location/Vector, 2=Auth,
    3=Self-ID, 4=System, 5=Operator ID, 0xF=Message Pack);
  - low nibble (bits 3–0) = **protocol version**.
  - bytes 1–24 = 24-byte message body.
- **Basic ID (type 0):** byte 1 high nibble = ID-type, low nibble = UA-type; bytes 2–21 = UAS ID
  (ASCII, e.g. serial / CAA reg).
- **Location/Vector (type 1):** status/flags, track direction (1 byte, 0–179 + E/W bit → 0–359°),
  speed (1 byte, encoded m/s), vertical speed; **latitude int32 LE = degrees × 1e7**,
  **longitude int32 LE = degrees × 1e7**; pressure & geodetic altitude (uint16, (alt+1000)/0.5),
  height, timestamp (tenths of second within the hour).
- Killinchu implements a **real byte parser** for this layout (bytes-in → JSON-out), with honest
  errors on malformed/short input — NOT a mock.

### 5.2 ADS-B Mode-S (1090 MHz Extended Squitter)
- TSO-C166b 1090ES @ 1090 MHz; broadcasts position/velocity once per second
  (<https://www.faa.gov/air_traffic/technology/equipadsb/resources/faq>).
- 112-bit (28 hex) extended-squitter frame: **DF** (downlink format, 17 for ADS-B), **ICAO 24-bit**
  address, **type code (TC)** selects payload (TC 1–4 ident, 9–18 airborne position via CPR,
  19 velocity).
- Decoder: **pyModeS** (junzis) — v3 single-call `pyModeS.decode(msg)` returns icao, typecode,
  callsign, altitude, groundspeed, track, vertical_rate, CPR lat/lon; passing an even/odd pair
  `decode([even, odd])` yields full **latitude/longitude** (verified locally: 52.2658, 3.9389).
  (<https://mode-s.org/pymodes/api/pyModeS.decoder.adsb.html>,
  <https://github.com/junzis/pyModeS>). Killinchu wires this library directly.

### 5.3 STANAG 4609 — NATO Motion Imagery
- NATO standard for digital motion imagery + **KLV metadata** (MISB 0601) embedding platform
  lat/lon, sensor pointing, target location in the MPEG-2 TS. Killinchu surfaces a STANAG 4609 /
  MISB 0601 KLV field reference in the protocol catalog.

### 5.4 MAVLink — open UAS messaging
- MAVLink v1/v2 framing; common dialect messages HEARTBEAT(0), GLOBAL_POSITION_INT(33),
  ATTITUDE(30), SYS_STATUS(1), GPS_RAW_INT(24). Decoder: **pymavlink** (verified locally:
  HEARTBEAT round-trip parse). v2 frame starts `0xFD`, v1 `0xFE`. Killinchu parses real frames
  via pymavlink's `MAVLink.decode()`.

### 5.5 Security note
- ADS-B and Remote ID are **unauthenticated broadcast** — spoofable. Recent survey:
  *Security of ADS-B and Remote ID Systems*, Sensors 2026
  (<https://pmc.ncbi.nlm.nih.gov/articles/PMC12846276/>). Killinchu's counter-UAS evaluator
  therefore treats decoded telemetry as *claims*, scored against geofence/policy, and emits an
  honest Λ-receipt (DSSE **PLACEHOLDER** signature per Doctrine v11 — Sigstore CI not yet wired).

---

## 6. Recent (2025–2026) counter-UAS market signals
- GD Land Systems + Epirus unveiled a **mobile counter-UAS** capability (Nov 2025)
  (<https://www.facebook.com/generaldynamicslandsystems/posts/1649667373018810/>).
- Counter-swarm demos (Epirus HPM + Anduril Lattice) targeted at USMC; directed-energy is the
  emerging answer to cheap mass (Shahed/FPV) saturation.

---

## 7. Doctrine v11 honest numbers (carried into every Killinchu surface)
- **749** Lean 4 declarations · **14** unique axioms (15 raw, 1 dup) · **163** tracked sorries.
- **13-axis** canonical trust schema (yuyay_v3 LinkedIn truth) — NOT 9-axis.
- **Λ (Lambda) uniqueness = Conjecture**, not a closed Theorem (open CAUCHY_ND sorry +
  missing symmetry axiom).
- **SLSA L1** (honest; previously mis-claimed L3, corrected platform PR #235).
- Receipts: DSSE envelopes, **signature = PLACEHOLDER** (Sigstore CI signing not wired).
- Mythos → **Hatun-Willay** everywhere.
- Canonical Spaces after this ship (8): a11oy · amaru · sentra · vessels · **killinchu** · rosie ·
  uds-demo · README.
