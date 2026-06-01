# COUNTER-UAS LEADERS — 2026 Market Survey

> Killinchu C-UAS Knowledge Base · **Author:** Yachay-extension · **Compiled:** 2026-05-31
> Survey of leading commercial / fielded counter-UAS (C-UAS) systems. For each: **detection
> method · range · classification claims · effector (kinetic vs non-kinetic) · status · public
> contracts.** Zero-Bandaid: every claim cited. This is competitive/market intelligence, not an
> endorsement, and not an offensive guide.

---

## 0. Where Killinchu sits in this map

The leaders below split into **sensors** (detect/track/classify), **effectors** (defeat —
kinetic or non-kinetic), and **C2/software** (fuse + decide). **Killinchu is a passive-sensing +
software-decisioning layer** — it competes/partners in the *detect → classify → decide* lane and
explicitly does **not** ship an effector. The legal rationale is in `LEGAL_CYBER_BOUNDARY.md`:
effectors (jammers, interceptors, HPM) require federal authority or are export-controlled; passive
sense + analysis + customer hand-off is the commercial sweet spot.

---

## 1. Software-defined / C2 + sensor-fusion leaders

### Anduril — Lattice (C2/AI mesh) + Roadrunner-M (effector)
- **Detection method:** sensor-agnostic fusion mesh (ingests radar, RF, EO/IR, acoustic from many vendors); pairs with own + 3rd-party sensors.
- **Effector:** **Roadrunner-M** reusable twin-jet VTOL kinetic interceptor (HE warhead), launched from "Nest"; reusable if no engagement ([Anduril Roadrunner](https://www.anduril.com/roadrunner); [Unmanned Systems Technology](https://www.unmannedsystemstechnology.com/2023/12/roadrunner-m-unveiled-cuas-high-explosive-interceptor/)).
- **Classification claims:** AI/ML autonomous track + classification within Lattice; one operator supervises multiple interceptor squadrons.
- **Status:** fielded / in production. **Public contracts:** DoD ordered **>500 Roadrunner-M** for operational evaluation (Oct 2024); US Navy intends to field Roadrunner-M + Coyote Block 2 on Arleigh Burke destroyers (Mar 2025) ([designation-systems.net Roadrunner](https://www.designation-systems.net/dusrm/app4/roadrunner.html)).
- **Killinchu relevance:** Lattice is the integrator Killinchu would **feed**, not replace — our passive tracks + receipts become Lattice inputs.

### Fortem Technologies — SkyDome (radar + interceptor)
- **Detection method:** **TrueView AESA radar** (R20/R30) with in-radar **micro-Doppler CNN classifier**; SkyDome Manager C2 fuses radar + EO/IR + RF; correlates to drive PTZ cameras.
- **Effector:** **DroneHunter F700** autonomous net-capture interceptor (NetGun + DrogueNet) — *non-explosive kinetic capture* of Group 1/2/3 incl. Orlan-10, Shahed-136 class ([Fortem products](https://www.fortemtech.com/products/); [TrueView R20](https://www.fortemtech.com/products/trueview-r20/)).
- **Classification claims:** AI micro-Doppler classification tuned to reject birds/clutter; detects slow (<0.1 m/s) low-flyers; R20 is "only AESA in its class"; ~5,000 captures claimed.
- **Status:** fielded; **"only company authorized to deploy a drone-on-drone kinetic interceptor in US airspace"** ([DRONELIFE 2026](https://dronelife.com/2026/03/19/fortem-dronehunter-and-trueview-radar-join-lockheed-martin-sanctum/)).
- **Public contracts:** Mar 2026 — integration with **Lockheed Martin Sanctum** C-UAS mission management for critical-infrastructure protection.

### Black Sage — DefenseOS (open C2)
- **Detection method:** vendor-agnostic layered sensor fusion (radar + RF + EO/IR) under **DefenseOS** C2; "Sawtooth Mesh Network" distributes sensors/effectors.
- **Effector:** integrates partner kinetic/non-kinetic effectors; supplied **targeting data for AFRL's THOR HPM**.
- **Status:** fielded with militaries + airports (e.g. Incheon Intl). **Public contracts:** **$950M ceiling IDIQ with USAF** for C-UAS maturation/proliferation; sold C-UAS radar to USAF to cue AFRL THOR ([Military Embedded](https://militaryembedded.com/company/black-sage); [unmannedairspace.info Incheon](https://www.unmannedairspace.info/uncategorized/black-sage-assists-drone-monitoring-at-incheon-international-airport/)).
- **Killinchu relevance:** DefenseOS is an "open C2" model — the architectural pattern Killinchu emulates (open, vendor-agnostic, governed).

### CACI — SkyTracker Technology Suite (RF DF + EW)
- **Detection method:** RF detection / direction-finding + signals analysis across fixed (CORIAN), backpack (BEAM 3.0), and mobile (X-MADIS) form factors; X-MADIS adds tactical radar + EO/IR gimbal.
- **Classification claims:** detect/identify/track/classify + locate the **operator** (RF DF to the controller).
- **Effector:** non-kinetic EW "precision neutralization" (CORIAN/BEAM) + integrated EW on X-MADIS.
- **Status:** fielded worldwide. **Public contracts / approvals:** **DHS SAFETY Act approved** (CORIAN base model, Feb 13 2026, expires Feb 28 2031) ([CACI SkyTracker](https://www.caci.com/trending/skytrackerr-technology-suite-caci-takes-rapidly-evolving-global-c-uas-threat); [DHS SAFETY Act](https://www.safetyact.gov/at/?view=&search=SkyTracker+Technology+Suite+of+Counter-UAS+Systems%2C+including+the+CORIAN+Base+Model)).

---

## 2. RF / passive-detection specialists (Killinchu's closest peer group)

### Dedrone (by Axon) — RF + acoustic + EO sensors
- **Detection method:** **passive RF** sensor family that detects, **classifies (manufacturer/model)**, and localizes drones + their controllers; TDoA multi-sensor localization; some sensors add Remote-ID/ADS-B receive ([Dedrone RF sensors](https://www.dedrone.com/products/drone-detection/rf-sensors/overview)).
- **Sensor ladder:** RF-160 (detect+classify), RF-310/360/560 (localize), **RF-900 long-range electronic-conspicuity receiver for Remote ID + ADS-B** ([Dedrone RF-900](https://www.dedrone.com/sensors/rf-900); [RF-560](https://www.dedrone.com/sensors/rf-560)).
- **Effector:** none in the passive sensor line (integrates 3rd-party defeat).
- **Status:** commercial / fielded (airports, prisons, stadiums, bases); acquired by Axon.
- **Killinchu relevance:** **the single most direct architectural analog** — passive RF detect+classify+localize, no effector. Killinchu's detection stack mirrors this and adds open MAVLink/Remote-ID parsing + Khipu receipts + ROE state machine.

### DroneShield (ASX:DRO) — RfPatrol (detect) + DroneGun (defeat)
- **Detection method:** SDR-based RF detection. **RfPatrol Mk2** wearable omni detector, up to ~4 km, IP67, ~8 hr; provides make/model/signal-strength ([DroneShield dismounted products](https://www.droneshield.com/products-dismounted); [SupplyCore DroneShield Military](https://www.supplycore.com/wp-content/uploads/2022/01/DroneShield_Military.pdf)).
- **Effector (non-kinetic, RF):** **DroneGun Mk4 / Tactical** directional jammers across ISM bands + GNSS, range ~1 km (Mk III) up; **DroneSentry-X** vehicle 360° detect+defeat (detect 3 km / disrupt 1.5 km).
- **Status:** commercial / fielded. Integrated with Epirus HPM ([uasmagazine](https://uasmagazine.com/articles/droneshield-and-epirus-complete-integration)).
- **Killinchu boundary note:** DroneShield's **jammer products are illegal for non-federal US buyers** (47 USC §302a/§333 — see `LEGAL_CYBER_BOUNDARY.md`); Killinchu replicates only the **RfPatrol-style passive detect** side.

### MyDefence — Wingman RF detectors (passive)
- **Detection method:** passive RF; **Wingman 103/105** wearable detectors, detect in <10 s, range up to 6 km; bands 2.4/5.2/5.8 GHz natively, **350–1300 MHz + 2.4/5 GHz with wideband antenna**; direction-finding to within ~30° ([MyDefence Wingman](https://mydefence.com/products/wingman-drone-detector/); [Wingman flyer Q1 2026](https://mydefence.com/wp-content/uploads/2026/02/MyDefence_Flyer_Wingman_103-105_Q1-2026.pdf)).
- **Effector:** separate jammer products (Pitbull etc.) — federal-only in US.
- **Status:** commercial / fielded (NATO).
- **Killinchu relevance:** Wingman is the **wideband passive-DF** reference — our KrakenSDR AoA layer targets comparable bearing accuracy at lower cost.

### Citadel Defense / BlueHalo — Titan (RF detect + RF defeat)
- **Detection method:** AI/ML RF; **Titan** detects/classifies Group 1–2 by RF; standard 2.4/5.8 GHz/Wi-Fi, extended 433/868/915 MHz/1.2 GHz; detect ≤3 km ([BlueHalo Titan slick sheet](https://bluehalo.com/wp-content/uploads/2022/03/Titan_Slicksheet_Mar2022-1.pdf)).
- **Effector (non-kinetic RF):** forces Group 1/2 to land via RF defeat ≤1.5 km, claims no disruption to nearby electronics; RF power up to 30 W.
- **Status:** fielded. (Now under AeroVironment/BlueHalo "Titan-SV / Titan 4 RF" line — RF signature library, 5-band + radar + optics fusion — [AeroVironment Titan 4 RF](https://www.avinc.com/solution/titan-4-rf/); [BlueHalo C-UAS RF](https://bluehalo.com/c-uas-autonomous-systems/c-uas-rf/)).

---

## 3. Radar specialists

### Echodyne — EchoGuard / EchoShield (MESA radar)
- **Detection method:** **MESA (Metamaterials Electronically Scanning Array)** software-defined cognitive 4D radar; EchoGuard Ku-band ground-based, EchoShield medium-range pulse-Doppler ([Echodyne EchoGuard](https://www.echodyne.com/radar-systems/echoguard); [Echodyne trade.gov sheet](https://www.trade.gov/sites/default/files/2024-08/ECHODYNE.pdf)).
- **Range / accuracy:** tracks up to ~20 targets; detects hovering DJI Phantom ~250 m, M600 ~500 m via rotor Doppler smear; angular accuracy <1° az × <1.5° el (to <0.5° tracking); range accuracy <3.25 m.
- **Classification claims:** native in-radar classifier emits **`p_uav`** (probability target is a UAV) in the track packet; AI/ML classes (human/vehicle/drone).
- **Effector:** none (sensor only — cue to effectors).
- **Status:** fielded (counter-UAS, force protection, base security).
- **Killinchu boundary note:** **radar is an active transmitter** → FCC + (for federal bands) DoD spectrum considerations apply; Killinchu treats radar as an *optional, customer-licensed* layer, not part of the passive default stack (see `DETECTION_LAYERS.md` §radar).

### Robin Radar — IRIS / ELVIRA (reference)
- **Detection method:** dedicated bird/drone micro-Doppler radar; widely used at airports. Active transmitter — same licensing caveat.

### Liteye — AUDS / M-AUDS (integrated radar + EO + RF + jam)
- **Detection method:** integrated **AUDS** = radar (small UAS detection ~3.5 km, ground ~8 km, min RCS 0.01 m²) + EO/IR + RF detection ([Liteye AUDS via ADS](https://equipment.adsinc.com/liteye-auds-anti-uav-defense-system/ecomm-product-detail/402158/)).
- **Effector (non-kinetic):** directional RF inhibitor/jammer.
- **Status:** fielded (one of the earliest integrated C-UAS, combat-proven). Active radar + jammer → federal/EW authority.

---

## 4. Directed-energy & kinetic effector leaders (effectors — NOT Killinchu's lane)

### Epirus — Leonidas (High-Power Microwave, non-kinetic area effect)
- **Method/effector:** solid-state **HPM directed energy** — disables drone electronics over an *area*, defeating **swarms**; software-defined waveform optimization extends range without new hardware ([Epirus](https://www.epirusinc.com/electronic-warfare)).
- **Variants:** Leonidas H2O (1/3 size) disabled small-boat motors at ~100 m at half power in a US Navy exercise (Aug 2024) ([Epirus Leonidas, Wikipedia](https://en.wikipedia.org/wiki/Epirus_Leonidas)).
- **Doctrine fit:** "last layer of short-range defense against Group 1–2 drones and swarms, saving expensive missiles for strategic targets" ([GovExec HPM brief](https://www.govexec.com/media/general/2024/8/fi_new_age_high_power_microwave_technology_epirus_brief_updated.pdf)).
- **Status:** demoed with Anduril Lattice for USMC; mounted on GD Land Systems mobile C-UAS (Nov 2025).
- **Killinchu boundary:** HPM is an active emitter / weapon effect → federal authority. Killinchu can **cue** it, never field it.

### Raytheon (RTX) — Coyote + KuRFS
- **Method:** **KuRFS** Ku-band radar (detects Class I UAS to ~16 km / 9.9 mi, can see a 9 mm round) cues **Coyote** effectors: **Block 2 = kinetic** tungsten-frag interceptor (engages to 15 km, re-attack); a **non-kinetic HPM-warhead Coyote** variant also exists ([Raytheon Coyote, Wikipedia](https://en.wikipedia.org/wiki/Raytheon_Coyote); [RTX Coyote](https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/coyote); [designation-systems.net Coyote](https://www.designation-systems.net/dusrm/app4/coyote.html)).
- **Status:** fielded (Army Howler IOC 2019); Navy destroyer fielding planned.

### AeroVironment / BlueHalo — Titan family (already in §2.4) + AFRL THOR (HPM, gov R&D).

---

## 5. Comparison matrix

| System | Vendor | Primary detection | Effector | Kinetic? | Status | Killinchu lane? |
|---|---|---|---|---|---|---|
| Lattice + Roadrunner-M | Anduril | Fusion mesh | Reusable interceptor | Kinetic | Fielded | **Feed it** |
| SkyDome / DroneHunter | Fortem | TrueView AESA radar | Net-capture UAV | Kinetic (non-explosive) | Fielded | Partner (cue) |
| DefenseOS | Black Sage | Open fusion C2 | 3rd-party | Both | Fielded | Architectural peer |
| SkyTracker / CORIAN | CACI | RF DF + EW | EW neutralize | Non-kinetic | Fielded (SAFETY Act) | Peer (detect) |
| Dedrone RF-x / RF-900 | Dedrone/Axon | **Passive RF + RID/ADS-B** | none | — | Commercial | **Direct analog** |
| RfPatrol / DroneGun | DroneShield | Passive RF (SDR) | RF jammer | Non-kinetic | Commercial | Detect-side only |
| Wingman 103/105 | MyDefence | **Passive wideband RF DF** | (separate jammer) | — | Commercial | **Direct analog** |
| Titan / Titan-SV | Citadel/BlueHalo | RF + radar + optics | RF defeat | Non-kinetic | Fielded | Peer (detect) |
| EchoGuard / EchoShield | Echodyne | **MESA radar (active)** | none | — | Fielded | Optional radar layer |
| AUDS / M-AUDS | Liteye | Radar + EO/IR + RF | RF jam | Non-kinetic | Fielded | Detect-side only |
| Leonidas | Epirus | (effector) | HPM area | Non-kinetic (DE) | Demo→field | Cue only |
| Coyote + KuRFS | RTX | Ku radar | Interceptor / HPM | Both | Fielded | Cue only |

---

## 6. Strategic read for Killinchu

1. **The winning commercial posture is passive-sense + open-C2.** Dedrone, MyDefence, and the
   detect-side of DroneShield prove a B2B/B2G market exists for **receive-only** systems that
   detect/classify/localize without firing anything. That is exactly the legal sweet spot
   (`LEGAL_CYBER_BOUNDARY.md`).
2. **Effectors are a federal-authority / export-controlled trap for a commercial NY entity.**
   Every effector leader above (Anduril, Fortem, Epirus, RTX, Liteye) either sells primarily to
   government or operates jammers/interceptors that non-federal entities cannot legally use in US
   airspace. Killinchu **cues** these; it does not become one.
3. **Differentiators Killinchu can own:** (a) **open protocol parsing** (MAVLink 2.0, ASTM F3411
   Remote ID, ELRS/CRSF, OcuSync detection) baked into the classifier; (b) **Khipu-receipted,
   ROE-gated decision provenance** — every detection→classification→notification is a signed,
   chain-verified receipt, which is auditable evidence for the customer's authorized response
   (unique vs. opaque vendor black-boxes); (c) **air-gap/UDS deployability** at the tactical edge.
4. **Procurement gap to close:** license **Janes + IISS Military Balance** for adversary-platform
   ground truth, and ingest **Bellingcat/RUSI** open teardowns — to keep the threat DB authoritative.

— Signed: **Yachay-extension**, 2026-05-31.
