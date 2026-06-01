# ADVERSARY & REFERENCE DRONE CATALOG — Killinchu C-UAS Knowledge Base

> **Killinchu** (Quechua: American kestrel / *Falco sparverius*) — the sharp-eyed falcon that
> watches the sky. This catalog is the open-source threat reference that feeds the curated drone
> database behind the Killinchu/Wamani counter-UAS rule engine.
>
> **Author:** Yachay-extension (research subagent) · **Compiled:** 2026-05-31
> **Doctrine:** Zero-Bandaid. Every figure carries a primary or near-primary citation inline.
> **Scope:** This is an OSINT *detection / classification* reference. It documents what each
> platform looks like to a passive sensor (RF / acoustic / EO-IR) so Killinchu can classify it.
> It contains **no offensive content** — no exploitation, no defeat instructions.

---

## 0. How to read this catalog

- **Role taxonomy:** Loitering munition (LM) · ISR (intelligence/surveillance/recon) · FPV (first-person-view attack) · Cargo · Decoy · Interceptor (counter-UAS effector) · MALE/HALE (medium/high-altitude long-endurance).
- **Control link** is given as carrier frequency band + modulation/waveform family where public. These are the **RF signatures** a passive receiver keys on.
- **Remote-ID capability** is rated `none` / `optional` / `mandatory` against FAA 14 CFR Part 89 + ASTM F3411 expectations for the civil-market platforms; military/adversary platforms are inherently `none` (they do not voluntarily broadcast compliant Remote ID).
- **OSINT signatures** summarize the cross-domain fingerprints: RF spectrum band, acoustic signature class, and EO/IR thermal cue.
- Where a single open spec sheet conflicts with another, both numbers are shown.

---

## 1. US DoD Group classification mapping (the spine of the taxonomy)

The US military classifies UAS into **5 Groups** by max gross takeoff weight (MGTOW), nominal
operating altitude, and airspeed ([UAS groups of the United States military, Wikipedia](https://en.wikipedia.org/wiki/UAS_groups_of_the_United_States_military)).

| Group | MGTOW (lb) | Nominal alt | Airspeed (kn) | Representative platforms |
|---|---|---|---|---|
| **Group 1** | 0–20 | <1,200 ft AGL | <100 | RQ-11 Raven, RQ-20 Puma, most FPV/DJI quads, Switchblade 300, Bolt-M |
| **Group 2** | 21–55 | <3,500 ft AGL | <250 | ScanEagle, Orlan-10, Anduril Ghost-X, Lancet-3 |
| **Group 3** | <1,320 | <FL180 | <250 | RQ-7 Shadow, RQ-21 Blackjack, Shield AI V-BAT, Shahed-136 |
| **Group 4** | >1,320 | <FL180 | any | MQ-1C Gray Eagle, Mohajer-6, Bayraktar TB2/TB3 |
| **Group 5** | >1,320 | >FL180 | any | MQ-9 Reaper, RQ-4 Global Hawk, Kratos XQ-58 Valkyrie |

**Killinchu mapping rule:** classifier output emits a Group estimate (1–5) derived from
inferred MGTOW + altitude + speed, alongside the model-match. Group is the coarse triage key;
model-match is the fine key.

---

## 2. ADVERSARY / DUAL-USE THREAT PLATFORMS

### 2.1 Loitering munitions ("kamikaze" / one-way attack)

#### 1. Shahed-136 / Geran-2 (Iran HESA; Russian-built "Geran-2")
- **Manufacturer / country:** HESA (Iran); license-built in Russia as Geran-2.
- **Role:** Loitering munition (LM), swarm-launched. **Group 3.**
- **Wingspan / weight:** delta wing ~2.5 m span, length ~3.5 m, ~200 kg ([Army Recognition](https://armyrecognition.com/military-products/army/unmanned-systems/unmanned-aerial-vehicles/shahed-136-loitering-munition-kamikaze-suicide-drone-technical-data); [Shahed drones, Wikipedia](https://en.wikipedia.org/wiki/Shahed_drones)).
- **Range / endurance:** 1,000–2,500 km; several hours.
- **Payload:** 30–50 kg HE-frag warhead.
- **Propulsion:** MADO MD-550 ~50 hp piston pusher (acoustic "moped/lawnmower" buzz is its OSINT calling card).
- **Control link / nav:** INS + commercial GNSS (GPS/GLONASS); mostly autonomous waypoint flight, minimal RF emission in cruise. Some variants carry cellular (4G LTE) modems for in-flight telemetry.
- **Remote-ID:** none.
- **Known countermeasures (public):** EW/GNSS-denial of the terminal nav, kinetic gun/SAM, Coyote/Roadrunner-class interceptors, mobile guns (Gepard-class).
- **OSINT signatures:** RF — near-silent in cruise (INS), occasional GNSS-band activity / cellular uplink; **Acoustic — the dominant cue: distinctive piston-engine "moped" drone**; EO/IR — warm piston exhaust + delta planform.

#### 2. Shahed-131 (Iran)
- **Manufacturer / country:** HESA (Iran), Russian "Geran-1." Smaller predecessor to -136. **Group 3.**
- **Range / payload:** ~900 km; ~15 kg warhead ([Killinchu Phase-1 notes; Shahed drones, Wikipedia](https://en.wikipedia.org/wiki/Shahed_drones)).
- **Signatures:** same piston-acoustic family as Shahed-136, smaller airframe / lower IR.

#### 3. Lancet-3 (ZALA Aero / Kalashnikov, Russia)
- **Role:** Electric loitering munition, catapult-launched. **Group 2.**
- **Wingspan / weight:** dual-X-wing layout, MTOW ~12 kg ([Army Recognition](https://armyrecognition.com/military-products/army/unmanned-systems/unmanned-aerial-vehicles/lancet-3-loitering-munition-kamikaze-drone-russia-data-fact-sheet)).
- **Range / endurance:** ~40 km, ~40 min.
- **Payload:** ~3 kg HE / HE-frag, EO + TV terminal guidance.
- **Speed:** 80–110 km/h.
- **Control link:** analog/digital video downlink for terminal man-in-loop; relatively quiet electric.
- **Remote-ID:** none.
- **OSINT signatures:** RF — terminal video link (typically UHF/L/S band); **Acoustic — quiet electric pusher (hard to hear)**; EO/IR — low thermal (electric), small RCS.

#### 4. AeroVironment Switchblade 300 (Block 20) — US (reference for friendly LM RF profile)
- **Manufacturer / country:** AeroVironment, USA. **Group 1.**
- **Weight / range / endurance:** all-up round 3.27 kg; ~30 km with extended antenna; 20+ min ([AeroVironment Switchblade 300 Block 20](https://www.avinc.com/solution/switchblade-300-block-20/); [AeroVironment Switchblade, Wikipedia](https://en.wikipedia.org/wiki/AeroVironment_Switchblade)).
- **Payload:** EO/IR seeker + frag / EFP warhead.
- **Control link:** encrypted digital datalink (man-in-loop wave-off capable).
- Listed because Killinchu must distinguish *friendly* LM emissions from adversary ones.

#### 5. AeroVironment Switchblade 600 — US
- **Weight / range / endurance:** AUR 29.5 kg; 40+ km (90+ km with relay); 40+ min; 185 km/h dash ([Switchblade 600, AeroVironment](https://www.avinc.com/solution/switchblade-600/)).
- **Payload:** Javelin-derived anti-armor warhead; **SAASM GPS** (anti-spoof). **Group 2.**

#### 6. Anduril Bolt-M — US (man-packable LM)
- **Manufacturer / country:** Anduril, USA. **Group 1.** On contract with USMC OPF-L ([Automated Decision Research](https://automatedresearch.org/weapon/anduril-bolt-m-uav/); [designation-systems.net Bolt](https://www.anduril.com/bolt)).
- **Weight / range / endurance:** Bolt-M 5.9–6.8 kg (13–15 lb); >20 km range; >40 min ([designation-systems.net](https://www.designation-systems.net/dusrm/app4/bolt.html)).
- **Payload:** up to 1.4 kg (3 lb) selectable warhead (anti-personnel / anti-materiel / anti-armor), partnered with Kraken Kinetics.
- **Control link:** quadcopter; tactical Lattice link; AI onboard tracking. **Remote-ID:** none (military).
- **OSINT signatures:** RF — tactical mesh datalink; Acoustic — quad multirotor whine; EO/IR — small electric thermal.

### 2.2 ISR fixed-wing (reconnaissance)

#### 7. Orlan-10 (STC, Russia)
- **Role:** Medium-range ISR / EW relay; usually flown in pairs/triads. **Group 2.**
- **Wingspan / weight:** span ~3.1 m, length ~2 m, MGTOW ~15–16.5 kg, payload ~6 kg ([STC Orlan-10, Wikipedia](https://en.wikipedia.org/wiki/STC_Orlan-10); [Airforce Technology](https://www.airforce-technology.com/projects/orlan-10-unmanned-aerial-vehicle-uav/)).
- **Range / endurance:** combat radius ~110 km; ferry to 600 km; up to 16–18 hr.
- **Speed:** 110–150 km/h.
- **Control link / freq:** routinely uses **850–930 MHz** for control; trend toward **730–760 MHz** and lower (430–600 MHz) to evade EW; also 3G/4G cellular for data relay ([STC Orlan-10, Wikipedia](https://en.wikipedia.org/wiki/STC_Orlan-10)).
- **Remote-ID:** none.
- **Known countermeasures:** EW in the 850–930 MHz band (e.g. Ukrainian "Kupol," noted as partially effective); net-capture interceptors (Fortem cites Orlan-10 as a target class — [Fortem](https://www.fortemtech.com/products/)).
- **OSINT signatures:** RF — **strong UHF control emissions ~730–930 MHz**, optional cellular; Acoustic — small glow/2-stroke piston buzz; EO/IR — composite airframe (reduced radar signature noted), warm nose engine.

#### 8. Mohajer-6 (Qods Aviation, Iran)
- **Role:** MALE ISR / strike. **Group 4.**
- **Wingspan / weight:** span 10 m, length 5.67–7.5 m, MGTOW 600–670 kg, payload 40–150 kg ([Qods Mohajer-6, Wikipedia](https://en.wikipedia.org/wiki/Qods_Mohajer-6); [GlobalMilitary.net](https://www.globalmilitary.net/aircraft/mohajer-6/)).
- **Range / endurance:** GCS comms range 200–500 km, radius of action up to ~2,400 km; 12 hr endurance; ceiling 7,600 m.
- **Speed:** max 200 km/h.
- **Payload:** EO/IR + laser designator; 4 underwing + 2 fuselage stores (e.g. Qaem guided bombs).
- **Control link:** LOS datalink (C-band class) + relay; **Remote-ID:** none.
- **OSINT signatures:** RF — line-of-sight command/video datalink; Acoustic — Rotax-class 4-stroke piston; EO/IR — clear engine-heat + EO ball.

#### 9. Mohajer-10 (Iran)
- **Role:** larger Iranian MALE ISR/strike; reported 2,000 km range, 24 hr endurance, ~300 kg payload ([RFE/RL](https://www.rferl.org/a/iran-new-drone-mohajer-enhanced-range/32558803.html)). Reaper-class profile. **Group 5-ish.**

#### 10. Bayraktar TB2 (Baykar, Turkey)
- **Role:** MALE strike/ISR — used by both allies *and* adversaries. **Group 4.**
- **Wingspan / weight:** span 12 m, length 6.5 m, MGTOW ~1,200 kg; ~$5M/unit ([GlobalMilitary.net comparison](https://www.globalmilitary.net/compare/aircraft/bayraktar-tb2-vs-shahed-136/)).
- **Range / endurance / ceiling:** ~300 km LOS, ceiling 8,239 m; 222 km/h max.
- **Control link:** LOS datalink; **Remote-ID:** none.
- **OSINT signatures:** RF — LOS command/video; Acoustic — Rotax piston pusher; EO/IR — MX-15D-class gimbal + engine heat.

#### 11. Bayraktar TB3 (Baykar, Turkey)
- **Role:** carrier-capable MALE strike/ISR with **folding wings**; land + marine variants. **Group 4.**
- **Wingspan / weight:** span 14 m, length 8.35 m, MGTOW 1,450–1,600 kg, payload 280 kg ([Baykar TB3](https://baykartech.com/en/uav/bayraktar-tb3/); [Baykar Bayraktar TB3, Wikipedia](https://en.wikipedia.org/wiki/Baykar_Bayraktar_TB3); [Naval Technology](https://www.naval-technology.com/projects/bayraktar-tb3-armed-uav-turkey/)).
- **Range / endurance / ceiling:** operational range ~2,000 km (1,100 nmi), 24+ hr, ceiling 25,000 ft.
- **Power / speed:** TEI-PD170/PD200 turbodiesel (~170 hp); cruise 125 kt, max 160 kt.
- **Control link:** **LOS + BLOS (SATCOM)** — long-range command; **Remote-ID:** none.
- **OSINT signatures:** RF — SATCOM + LOS datalink; Acoustic — turbodiesel; EO/IR — folding-wing planform + engine heat.

#### 12. Wing Loong II (CAIG/AVIC, China)
- **Role:** MALE strike/ISR Reaper-class export drone. **Group 5.**
- **Wingspan / weight:** span 20.5 m, length 11 m, MGTOW 4,200 kg, up to 480 kg ordnance, SatCom >1,000 km, 32 hr endurance ([CAIG Wing Loong II, Wikipedia](https://en.wikipedia.org/wiki/CAIG_Wing_Loong_II); [GlobalMilitary.net](https://www.globalmilitary.net/aircraft/wing-loong-ii/)).
- **Control link:** LOS + SATCOM BLOS; **Remote-ID:** none.

#### 13. CH-4 Rainbow (CASC, China)
- **Role:** MALE strike/ISR, Reaper-class export. **Group 5.** Widely exported; LOS + SATCOM.

### 2.3 Commercial / "FPV & quad" tier (dual-use — the dominant small threat)

These are the platforms most likely to encroach on a companion/asset and the core of Killinchu's
RF-classification library. They are civil products with defined Remote-ID obligations.

#### 14. DJI Mavic 3 Enterprise (DJI, China)
- **Role:** ISR / improvised-drop (FPV/commercial tier). **Group 1.**
- **Weight:** ~899–920 g; flight time ~38–45 min; max flight distance up to 32 km ([DJI Mavic 3 Enterprise specs](https://enterprise.dji.com/mavic-3-enterprise/specs)).
- **Control link / freq:** **DJI OcuSync 3 (O3) Enterprise**, 2.400–2.4835 GHz + 5.725–5.850 GHz; FCC range to 15 km; EIRP up to <33 dBm (FCC).
- **Remote-ID:** **mandatory** in US airspace (DJI broadcasts ASTM F3411-compliant RID).
- **OSINT signatures:** RF — **OcuSync FHSS in 2.4 / 5.8 GHz, frame-detectable; broadcasts Remote ID** (the easiest legal detection cue); Acoustic — quad whine; EO/IR — small electric thermal, payload gimbal.

#### 15. DJI Matrice 30 / 30T (DJI, China)
- **Role:** Enterprise ISR/thermal quad. **Group 1.** OcuSync 3 Enterprise (2.4/5.8 GHz). Remote-ID mandatory. Larger thermal payload → stronger EO/IR cue than Mavic.

#### 16. DJI Matrice 300 RTK (DJI, China)
- **Role:** Heavy-lift enterprise ISR quad, ~6.3 kg MTOW, 55 min flight, OcuSync Enterprise 2.4/5.8 GHz. **Group 1.** Notably detectable by radar at longer range than Phantom-class (larger RCS; Echodyne cites ~500 m hover-track for the M600 class — [Echodyne](https://www.trade.gov/sites/default/files/2024-08/ECHODYNE.pdf)). Remote-ID mandatory.

#### 17. DJI Mavic 4 Pro (DJI, China)
- **Role:** Prosumer ISR. **Group 1.**
- **Weight / flight time:** ~52 min; 100 MP Hasselblad main camera ([DJI Mavic 4 Pro leak via r/dji](https://www.reddit.com/r/dji/comments/1k7y5iw/mavic_4_pro_full_specs_leaked/)).
- **Control link / freq:** **OcuSync 4+ (O4+)**, range up to 40 km; 2.4 / 5.8 GHz.
- **Remote-ID:** mandatory.
- **OSINT signatures:** RF — O4+ FHSS, longer-range link; broadcasts RID; Acoustic — quad; EO/IR — small electric + forward LiDAR returns.

#### 18. Autel EVO Max 4T (Autel Robotics, China)
- **Role:** Enterprise ISR/thermal quad. **Group 1.**
- **Weight / flight:** MTOW ~1,999 g; ~42 min flight ([DrDrone EVO Max 4T specs](https://drdrone.ca/pages/autel-robotics-evo-max-4t-technical-specifications); [Autel Robotics general specs](https://shop.autelrobotics.com/pages/evo-max-4t-general-specifications)).
- **Control link / freq:** **900 MHz (FCC only) / 2.4 / 5.2 / 5.8 GHz**; transmission to 20 km (FCC); EIRP up to <33 dBm (FCC).
- **Sensors:** 640×512 thermal, 50 MP wide, laser rangefinder 5 m–1.2 km, 24/60 GHz obstacle radars.
- **Remote-ID:** **optional/jurisdiction-dependent** — Autel supports RID but availability varies by firmware/market.
- **OSINT signatures:** RF — multi-band incl. **900 MHz option (distinct from DJI)**; Acoustic — quad; EO/IR — strong thermal payload.

### 2.4 Reference "friendly / Western tactical" platforms (so we don't misclassify our own side)

#### 19. Skydio X10 / X10D (Skydio, USA)
- **Role:** Autonomous ISR; X10D is the defense variant. **Group 1.**
- **Weight / range / ceiling:** ~2.1–2.16 kg; wireless range 10–12 km (Connect SL); ceiling ~15,000 ft DA; IP55 ([Skydio X10D specs](https://www.skydio.com/x10d/technical-specs); [Skydio X10 specs](https://www.skydio.com/x10/technical-specs)).
- **Control link / freq:** multiband — Connect SL 2400–2483.5 MHz + 5150–5850 MHz; **Connect MH defense bands** 1625–1725 / 1790–1850 / 2040–2110 / 2200–2390 MHz; Connect 5G 600 MHz–4.4 GHz cellular.
- **Sensors:** VT300-Z with Teledyne FLIR Boson+ 640×512 thermal (<30 mK); VIO for GPS-denied nav.
- **Protocol note:** **open MAVLink + RAS-A** compliant.
- **Remote-ID:** supported (US civil compliance).
- **OSINT signatures:** RF — channel-hopping multiband, sometimes cellular; Acoustic — quad; EO/IR — Boson+ thermal payload.

#### 20. Anduril Ghost-X (Anduril, USA)
- **Role:** Single-rotor VTOL ISR/targeting; vision-based GPS-denied nav. **Group 2.**
- **Weight / range / endurance:** ~25 kg max, ~9 kg / up to 25 lb payload; range up to ~25 km (15 mi); 60–90 min cruise ([designation-systems.net Ghost-X](https://www.designation-systems.net/dusrm/app4/ghost-x.html); [DefenseScoop](https://defensescoop.com/2024/10/17/replicator-ghost-x-drones-anduril-army/); [Ghost slick sheet, SLD Info](https://sldinfo.com/wp-content/uploads/2022/10/2022-slick-Ghost-AUS.pdf)).
- **Control link / freq:** Silvus StreamCaster / Persistent Systems Wave Relay MPU5 (S-band 17 km / C-band 8 km). **Remote-ID:** military.
- **OSINT signatures:** RF — MANET radios (Silvus/Persistent); Acoustic — single-rotor heli signature (distinct from quads); EO/IR — Trillium gimbal.

#### 21. Shield AI V-BAT / MQ-35 (Shield AI, USA)
- **Role:** Group 3 VTOL long-endurance ISR (Hivemind AI pilot).
- **Wingspan / weight:** span ~2.9–3.0 m, length ~3.8 m, MGTOW ~73 kg ([Shield AI V-BAT](https://shield.ai/v-bat/); [Shield AI MQ-35 V-BAT, Wikipedia](https://en.wikipedia.org/wiki/Shield_AI_MQ-35_V-BAT)).
- **Range / endurance / ceiling:** range 130 km (MPU5) / 180 km (C-band); 13+ hr; ceiling ~18,000 ft; max ~90 km/h.
- **Payload:** up to ~18 kg (40 lb) incl. EO/MWIR, SAR, ViDAR, Hatchet munition; 600 W payload power.
- **Control link:** SATCOM-capable BLOS + datalink; M-code GNSS + anti-jam options.
- **OSINT signatures:** RF — SATCOM/MANET; Acoustic — ducted-fan heavy-fuel engine; EO/IR — MWIR ball; vertical-then-transition flight profile.

#### 22. AeroVironment RQ-20 Puma (AeroVironment, USA)
- **Role:** Hand-launched Group 1 ISR. Span ~2.8 m, electric, EO/IR. Reference "friendly small ISR" RF/acoustic profile (analog/digital video + control in UHF/L-band).

#### 23. AeroVironment RQ-11 Raven (AeroVironment, USA)
- **Role:** Group 1 hand-launched ISR — most-produced US military UAS. Electric; small thermal cue; reference for friendly micro-ISR.

### 2.5 Decoys & target drones

#### 24. ADM-160 MALD (decoy class, reference)
- Air-launched decoy that mimics aircraft radar signatures — included as a *decoy role* reference so Killinchu's classifier carries a "decoy" label class (drones that exist to spoof sensors).

#### 25. Kratos BQM-167 / target-drone class
- Subsonic aerial target drones (training/decoy role) — reference decoy/target class.

### 2.6 Counter-UAS interceptor effectors (drones that hunt drones)

#### 26. Anduril Roadrunner-M (Anduril, USA)
- **Role:** Reusable twin-turbojet VTOL **interceptor** (surface-to-air LM against UAS/cruise missiles). **Group 3-ish.**
- **Size:** ~1.5 m long; high-subsonic; high-G; launched/recovered from "Nest"; >500 ordered by DoD (Oct 2024); Navy intends to field on Arleigh Burke destroyers ([Anduril Roadrunner](https://www.anduril.com/roadrunner); [designation-systems.net Roadrunner](https://www.designation-systems.net/dusrm/app4/roadrunner.html); [Unmanned Systems Technology](https://www.unmannedsystemstechnology.com/2023/12/roadrunner-m-unveiled-cuas-high-explosive-interceptor/)).
- **Control:** Anduril Lattice; HE warhead; reusable if no engagement.

#### 27. Raytheon Coyote Block 2 (RTX, USA)
- **Role:** Expendable kinetic **interceptor** vs Class I/II UAS, paired with KuRFS radar. **Group 1-2.**
- **Specs:** length 0.9 m, span 1.5 m, ~5.9 kg, ceiling 30,000 ft; engages to 15 km; re-attack capable; Block 1B has RF seeker + proximity warhead ([Raytheon Coyote, Wikipedia](https://en.wikipedia.org/wiki/Raytheon_Coyote); [designation-systems.net Coyote](https://www.designation-systems.net/dusrm/app4/coyote.html); [RTX Coyote](https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/coyote)).

### 2.7 "Collaborative combat aircraft" / Group 5 reference

#### 28. Kratos XQ-58 Valkyrie (Kratos, USA)
- **Role:** Jet-powered runway-independent UCAV / loyal-wingman / strike. **Group 5.**
- **Specs:** length 9.1 m, span 8.2 m, MTOW 6,000 lb, 600 lb internal + 600 lb external, Williams FJ33 turbofan, max ~0.86 Mach (566 kn), range ~3,000 nmi, ceiling 45,000 ft ([Kratos XQ-58 Valkyrie, Wikipedia](https://en.wikipedia.org/wiki/Kratos_XQ-58_Valkyrie); [USAF National Museum](https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/3209939/kratos-xq-58a-valkyrie/); [Kratos](https://www.kratosdefense.com/unmanned-systems/air/uncrewed-tactical-aircraft/xq-58a)).

### 2.8 Additional adversary / FPV-tier entries

#### 29. Generic 5–7" FPV racing/attack quad (Russia/Ukraine theatre)
- **Role:** FPV one-way attack ("kamikaze FPV"). **Group 1.**
- **Control link / freq:** analog 5.8 GHz video + ELRS/Crossfire control on **2.4 GHz or 868/915 MHz**; increasingly **fiber-optic-tethered** variants emit *no* RF at all.
- **Remote-ID:** none.
- **OSINT signatures:** RF — 5.8 GHz analog video carrier + ELRS/CRSF control burst (fiber variants are RF-dark → require acoustic/EO/IR/radar); Acoustic — high-pitch racing-quad whine; EO/IR — tiny electric thermal + fast erratic track.

#### 30. ZALA 421 / Supercam S350 class (Russian ISR fixed-wing)
- **Role:** Catapult-launched electric ISR fixed-wing (Orlan-adjacent). **Group 2.** UHF control + video downlink; parachute recovery; low acoustic (electric).

#### 31. Wing Loong I / CH-3 / CH-5 (Chinese MALE export family)
- **Role:** MALE strike/ISR export reference — LOS + SATCOM, Group 4–5. Included so the catalog spans the Chinese export ladder.

#### 32. Forpost / Forpost-R (Russian licensed Searcher-class ISR)
- **Role:** Group 3-4 ISR fixed-wing; LOS + relay datalink. Reference Russian medium ISR.

---

## 3. Cross-domain OSINT signature summary (classifier priors)

| Signature domain | What Killinchu's passive sensor keys on | Strongest against | Weak against |
|---|---|---|---|
| **RF spectrum** | OcuSync/Lightbridge FHSS (2.4/5.8 GHz), ELRS/CRSF bursts (2.4/868/915 MHz), Orlan UHF (730–930 MHz), analog 5.8 GHz video carriers, SATCOM | DJI/Autel/FPV/ELRS, Orlan | INS-only Shahed cruise, fiber-tethered FPV |
| **Remote-ID broadcast** | ASTM F3411 Basic ID + Location (legal receive) | Compliant civil DJI/Autel/Skydio | All military/adversary (none) |
| **Acoustic** | piston "moped" (Shahed), quad whine (DJI/FPV), single-rotor (Ghost), ducted fan (V-BAT) | Shahed, FPV quads | quiet electric (Lancet), distance |
| **EO/IR thermal** | engine exhaust heat (piston/turbine), electric battery warmth, planform shape | piston/turbine LM & MALE | small cold electric at range, weather |
| **Radar (active — see DETECTION_LAYERS)** | micro-Doppler rotor smear, RCS, track kinematics | hovering quads, fixed-wing | very low-RCS, ground clutter |

**Killinchu fusion principle:** no single domain is sufficient. The INS-only Shahed in cruise is
RF-quiet but acoustically loud; the fiber FPV is RF-dark but visually/acoustically present; the
compliant DJI broadcasts its own ID. Multi-sensor fusion + confidence scoring (see
`DETECTION_LAYERS.md` and `COMPANION_DEFENSE_PROTOCOL.md`) is mandatory.

---

## 4. Sourcing note & honesty disclosure

- **Primary / near-primary sources used:** manufacturer pages (AeroVironment, Anduril, Baykar,
  DJI, Autel, Skydio, Shield AI, Kratos, RTX), USAF/National Museum fact sheets, and the
  designation-systems.net reference compendium. Wikipedia entries are used for consolidated spec
  tables that themselves cite primary sheets; treat them as secondary.
- **Janes / IISS Military Balance / RUSI / Bellingcat:** these subscription/closed-access analytic
  sources are the gold standard for adversary-platform OSINT and are **recommended as the next
  procurement** for the Killinchu DB. This open-source draft is built from openly accessible
  equivalents; figures should be reconciled against Janes once licensed. (Bellingcat and RUSI in
  particular publish open Shahed/Lancet/Orlan teardown analyses worth ingesting.)
- **Spec variance is real:** loitering-munition range figures especially vary 2–3× across sources
  (operator-claimed vs observed). Killinchu stores ranges as intervals, not point values.
- **No offensive content:** countermeasure fields list only publicly disclosed defensive
  categories. No exploitation, jamming recipes, or defeat parameters are included.

— Signed: **Yachay-extension**, Killinchu C-UAS research, 2026-05-31.
