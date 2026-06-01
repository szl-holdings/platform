# CONSTELLATION SURVEY 2026 — Satellite + RF Aggregation for Killinchu

**Flagship:** Killinchu (Andean kestrel) — SZL's drone-tracking flagship, evolved from Wamani/Vessels. Inherits dark-vessel detection, MMSI/IMO → drone-serial tracking, OpenFreeMap/CesiumJS display, and the Khipu receipt DAG.
**Author:** Yachay-extension
**Date:** 2026-05-31
**Mandate:** Survey every commercial + government-accessible satellite/RF constellation we can aggregate into Killinchu. Hard honesty. No marketing fluff. No mysticism. Every claim has a primary-source URL.

---

## 0. Framing: what "track a drone from space" actually means

A drone is a small, fast, often low-flying, often cooperative-ID-disabled target. No single space sensor "tracks" it like radar. Instead each constellation contributes a different **observation type** that Killinchu fuses:

- **EO/optical imagery** — you can *see* a parked or flying drone only if GSD is fine enough and the drone is in-frame at capture. Useful for launch sites, staging areas, runways, not real-time flight tracking. Cloud- and daylight-limited.
- **SAR (radar)** — sees through cloud and at night; detects vehicles, launchers, infrastructure. Same caveat: snapshot, not continuous track. A small airborne quadcopter is essentially invisible to spaceborne SAR; SAR's value is the *ground* signature (launch trucks, hangars).
- **RF/SIGINT** — geolocates the *emitter*: the drone's control link, video downlink, or GNSS jammer. **This is the only space modality that finds a Remote-ID-off, camouflaged, in-flight drone**, because the drone must transmit to be flown. HawkEye 360 is the strategic anchor here.
- **AIS/ADS-B/IoT relay** — relays cooperative beacons (ADS-B for large UAS like MQ-9/RQ-4, AIS for ships). Near-real-time but only for cooperative emitters.
- **Comms backhaul** — NOT for tracking adversaries; this carries *our own* drone's telemetry/video. Starlink Mini, Iridium Certus, etc.

**Honest bottom line:** Space gives Killinchu *tip-and-cue and pattern-of-life*, not a closed-loop fire-control track. Real-time tactical drone track still needs terrestrial sensors (RF DF, acoustic, radar, Remote-ID receivers). Killinchu's job is to *aggregate the space layer and fuse it with terrestrial Remote-ID/ADS-B already in Wamani*.

---

## 1. EO / Optical Imagery

| Provider | Constellation | Resolution (GSD) | Revisit | Swath | API docs | Pricing model | License | Drone-tracking suitability |
|---|---|---|---|---|---|---|---|---|
| **Planet Labs** | PlanetScope (Dove/SuperDove, ~150+ sats) | ~3 m | Daily global | scene ~24×8 to 32.5×19.6 km | [docs.planet.com PlanetScope](https://docs.planet.com/data/imagery/planetscope/) | Subscription (area-monitoring) + per-km tasking | Commercial EULA; NRO EOCL for USG | Low for the drone itself (3 m too coarse); good for daily wide-area change detection of launch sites |
| **Planet Labs** | SkySat (15 sats) | 0.50 m orthorectified | Up to ~7–10× daily | frame ~5.9×5.9 km strips | [docs.planet.com SkySat](https://docs.planet.com/data/imagery/skysat/); Data/Orders/Subscriptions/Tasking APIs ✅ | Per-tasking + archive | Commercial EULA | Medium — 0.5 m can resolve a large UAS / launcher on the ground; high revisit helps cueing |
| **Maxar (Vantor)** | WorldView Legion + legacy WV (10 EO sats) | 30 cm class native | as frequent as ~20 min over some areas; ~15×/day | varies by sat | [developers.vantor.com tasking guide](https://developers.vantor.com/docs/tasking/guides/tasking-guide); FlexView/FastView REST | Credit-based tasking; min 50 km², max 1000 km²/order; archive | Commercial; NRO EOCL | **Highest optical detail.** 30 cm resolves vehicles/large UAS clearly. FastView 8h–13d tasking window. Still snapshot, not flight track |
| **Airbus** | Pléiades Neo (4 sats) | 30 cm pan / 1.2 m MS | up to 2×/day (intra-day) | 14 km at nadir | [space-solutions.airbus.com Pléiades Neo](https://space-solutions.airbus.com/imagery/our-optical-and-radar-satellite-imagery/pleiades-neo/); [ESA EO Gateway](https://earth.esa.int/eogateway/missions/pleiades-neo) | Tasking + archive (OneAtlas API) | Commercial; geoloc <5 m CE90 | High optical detail, 30 cm; daily revisit; good for staging-area imagery |
| **BlackSky** | Gen-2 / Gen-3 (Spectra) | 0.8–1.3 m (Gen-2); ~35 cm (Gen-3) | hourly over some AOIs; up to 7×/day | ~5–6 km scene | [blacksky.com offerings](https://blacksky.com/offerings/); Spectra Tasking/AI APIs | On-Demand / Assured subscription; archive ~$120/scene, tasking from ~$250/scene | Commercial; NRO EOCL | Medium-high — sub-meter, sub-90-min delivery; high cadence good for cueing |
| **Satellogic** | NewSat (~40 sats target) | ~70 cm–1 m | up to 4–7×/day | ~5 km (HR) / ~30 km (multispectral) | [developers.satellogic.com Aleph v2 API](https://developers.satellogic.com/aleph-v2/api/api_v2_specs.html) | Low-cost tasking; API/FTP/reseller | Commercial | Medium — cheap, frequent; resolution adequate for launchers, marginal for small UAS |
| **Umbra** (SAR, listed in EO row for completeness — see §2) | — | — | — | — | — | — | — | See SAR section |

**Sources for revisit cross-check:** [UP42 revisit rates table](https://docs.up42.com/data/revisit-rates) (Vantor 15×/day, BlackSky 7×, SkySat 7×, Satellogic 4×, Pléiades Neo 2×).

**Honest note on optical for drones:** Even 30 cm GSD cannot reliably detect an airborne consumer quadcopter (~0.3–0.5 m wingspan, motion-blurred at orbital framing). Optical's real Killinchu role = **launch-site / staging detection and pattern-of-life**, not airborne tracking.

---

## 2. SAR (Radar — sees through clouds + at night)

| Provider | Constellation | Best resolution | Ground sample distance / range res | Revisit | Swath / scene | API docs | Pricing | License | Drone suitability |
|---|---|---|---|---|---|---|---|---|---|
| **Capella Space** | 6+ sats, X-band | 25–30 cm (Spot ultra) slant; 25–50 cm azimuth | GRD 0.38 m–1.34 m (Spot); Site 0.76–2.23 m; Strip 1.13–3.37 m | ~5×/day | Spot 5×5 km; Site 10×20 km; Strip 5–10 km × 20/50/100 km | [support.capellaspace.com API ref](https://support.capellaspace.com/api-reference-and-documentation); [format spec v1.8](https://support.capellaspace.com/hubfs/Capella_Space_SAR_Products_Format_Specification_v1.8.pdf) | Tasking per-scene; archive | Commercial; NRO SCE-radar | High for ground signatures (launch trucks, hangars) day/night/all-weather; airborne drone not resolvable |
| **ICEYE** | ~40 sats, X-band (largest SAR fleet) | up to 25 cm (Dwell Precise) | mode-dependent | sub-6 hr global; daily/sub-daily per site | Spot/Strip/Scan up to 120,000 km² | [iceye.com SAR API](https://www.iceye.com/sar-data/api); [iceye.us API](https://iceye.us/sar-data/api); [direct-tasking press](https://www.iceye.com/newsroom/press-releases/iceye-announces-api-that-allows-customers-to-directly-task-worlds-largest-sar-satellite-constellation) | Direct tasking API; subscription | Commercial; US entity (iceye.us) for USG | High — largest fleet, fastest revisit, all-weather ground monitoring |
| **Umbra** | 8+ sats, X-band | **16 cm** (highest commercial SAR) | 16/25/35/50 cm or 1 m single-look spotlight | tasking-driven | spotlight (small AOI) | [umbra.space open data](https://umbra.space/open-data/); [AWS Open Data registry](https://registry.opendata.aws/umbra-open-data/) (`s3://umbra-open-data-catalog/`, no-sign-request) | **Free open archive** + paid tasking (Canopy API) | Open data CC-BY 4.0 for archive; commercial tasking | High detail; **free archive is the cheapest demo path** |
| **Synspective** | StriX, X-band (9.60/9.65 GHz) | 0.25 m azimuth (Staring Spotlight 2) | slant 0.23–1.8 m; ground 0.46–3.6 m | 1–7 days (growing) | Stripmap 10–30 km (nom 20); spotlight 10 km | [SAR Data Product Guide v13 PDF](https://synspective.com/wp-content/uploads/2025/04/SAR_Data_Product_Guide_EN_v13.0_general_users.pdf); [product format manual](https://synspective.com/wp-content/uploads/2025/04/StriX-SAR-Data-Product-Format-Manual_En_v2.0.pdf) | Tasking | Commercial (Japan) | Medium — fewer sats, longer revisit |
| **Airbus Radar Constellation** | TerraSAR-X / TanDEM-X / PAZ / future radar | ~25 cm (Staring Spotlight) | mode-dependent | multi-day | up to 100+ km (ScanSAR) | [Airbus optical & radar imagery](https://space-solutions.airbus.com/imagery/our-optical-and-radar-satellite-imagery/) | Tasking via OneAtlas | Commercial; export-controlled | Medium — mature, high quality, slower cadence |

**Honest note on SAR for drones:** Spaceborne X-band SAR resolves *vehicles and structures*, not airborne micro-UAS. Its unique value to Killinchu is **all-weather, day/night detection of the ground infrastructure that produces drones** (launch sites, mobile launchers, swarm staging) — exactly the dark-vessel-analog logic from the Wamani plan, applied to land.

---

## 3. RF / SIGINT — the strategic core for Remote-ID-OFF adversary drones

This is the **single most important category for Killinchu's actual mission**. A drone flown without Remote ID is still emitting: a control uplink, a video downlink, and often a GNSS/jammer signature. RF-geolocation satellites find *any emitter*, cooperative or not.

| Provider | Constellation | Frequency coverage | Geolocation method | Accuracy | Revisit | API / access | Status |
|---|---|---|---|---|---|---|---|
| **HawkEye 360** ⭐ | 30+ sats, clusters of 3, ~500 km LEO | ~144 MHz – 15 GHz (VHF/UHF/L-band, ISM incl. 433/915 MHz UAV control, 2.4 GHz) | **TDOA + FDOA** across the 3-sat cluster (passive, receive-only) | typically few-hundred m to few-km; <1 km ideal | constellation-dependent; **latency is hours, not real-time** (Cluster 15/16 add real-time downlink) | **RFGeo** product line + Mission Space; via API/dashboard; commercial contract + USG channels (NRO SCE-RF) | Operational, expanding |
| **Unseenlabs** | mono-satellite RF, France | shipborne RF emitters | mono-satellite (single-pass) geolocation | up to ~1 km | <1 hr at full constellation; ~300,000 km² footprint/pass | SFTP or API; KML/GeoJSON/SHP/CSV; <1 MB/acquisition | Operational; **maritime-focused** |
| **Kleos Space** | 4 clusters launched | VHF/UHF maritime | cluster TDOA/FDOA | km-class | — | — | **DEFUNCT — entered voluntary administration/wound down 2023–24. Do NOT design against.** |
| **Aurora Insight** | small RF-sensing fleet + terrestrial | wideband spectrum mapping | RF measurement/mapping (not primarily emitter-DF) | spectrum-density, not point-geoloc | — | data products | **Acquired by HawkEye 360 (2022)** — capability now folded into HawkEye |

**Sources:** [HawkEye 360 technology](https://www.he360.com/technology/) (30+ sats, clusters of 3, TDOA/FDOA); [Hubble guide on HawkEye coverage 144 MHz–15 GHz + few-hundred-m to few-km accuracy + hours latency](https://hubble.com/community/guides/how-hawkeye-360-finds-rf-signals-from-space/); [HawkEye Comms Detection & Mapping mission brief PDF](https://www.he360.com/wp-content/uploads/2025/09/HawkEye-360-Mission-Brief-Communications-Mapping-September-2025.pdf); [RFGeo launch (PR Newswire)](https://www.prnewswire.com/news-releases/hawkeye-360-launches-first-commercial-product---rfgeo-300824414.html); [SFL Cluster 15/16 real-time downlink (Business Wire)](https://www.businesswire.com/news/home/20250910034084/en/); [Unseenlabs ESA EO Gateway (1 km, <1 hr, 300,000 km², <1 MB/acq)](https://earth.esa.int/eogateway/missions/unseenlabs); [Kleos Space company updates (wind-down)](https://kleos.space/market-releases/company-update-october-2024/).

**Why RF is the answer to the founder's question:** Optical/SAR can't see an in-flight small drone. RF can, because the drone *must transmit to be controlled*. HawkEye geolocates that emission. This is the dark-drone analog of dark-vessel RF detection that Unseenlabs already does for ships — the exact capability lineage from Wamani.

---

## 4. AIS / ADS-B / IoT Relay (cooperative beacons + sensor backhaul)

| Provider | Constellation | Protocol coverage | Data latency | Drone-relevant claim | Source |
|---|---|---|---|---|---|
| **Spire Global** | ~100+ LEMUR nanosats | ADS-B (1090 MHz Mode-S), AIS, GNSS-RO, weather | Tracking Stream pushes target updates per 5-sec interval per ICAO; near-real-time | Tracks ADS-B-equipped large UAS globally incl. oceanic/polar gaps; satellite+terrestrial fusion | [Spire ADS-B](https://spire.com/spirepedia/ads-b/); [Tracking Stream API](https://aviation-docs.spire.com/api/tracking-stream/introduction/) |
| **Aireon (Iridium-hosted)** | hosted payloads on 66 Iridium NEXT sats (+spares) | ADS-B 1090 MHz, 100% global real-time | **<400 ms** sat-to-user; ~2 s median update in low-density | Authoritative real-time global aircraft surveillance; large fixed-wing UAS | [Aireon ADS-B datasheet](https://aireon.com/wp-content/uploads/2024/01/Aireon-Datasheet_NatSec_ADS-B-Advantage_062123.pdf); [Aireon turbulence white paper (latency)](https://aireon.com/wp-content/uploads/2024/09/Aireon-White-Paper_En-route-Turbulence-Detection_Sept2024.pdf) |
| **exactEarth / L3Harris** | S-AIS (now L3Harris) | satellite AIS | near-real-time | maritime AIS; analog for drone-as-vessel logic, not airborne | (L3Harris S-AIS; legacy exactEarth) |
| **Kepler Communications** | optical data-relay (33 launched; 10-sat tranche Jan 2026) | optical inter-sat relay, up to 2.5 Gbps; SDA-compatible | real-time relay | **Backhaul for our own space/air assets**, not a tracking feed | [Kepler optical datasheet PDF](https://kepler.space/wp-content/uploads/2023/09/Optical-Datasheet-v6-2025-1.pdf); [Jan 2026 launch](https://kepler.space/kepler-successfully-launches-first-tranche-of-optical-relay-satellites/) |
| **Swarm (SpaceX)** | ~150 sat-bee IoT | sub-GHz IoT (1200 bps store-and-forward) | store-and-forward, minutes–hours | low-rate IoT telemetry relay; **note: SpaceX has been sunsetting Swarm into Starlink Direct-to-Cell roadmap** | (Swarm/SpaceX; verify EOL before designing) |

**Honest note:** ADS-B/AIS only relay *cooperative* emitters — exactly the targets that *aren't* the counter-UAS threat. Their Killinchu value is (a) deconfliction/whitelisting friendly air traffic, and (b) the "AIS-off = dark vessel" → "ADS-B-off = dark drone" detection logic.

---

## 5. Comms Backhaul (for OUR drones, NOT tracking adversaries)

| Provider | Product | SWaP | Throughput | Latency | Drone integration |
|---|---|---|---|---|---|
| **Starlink** | **Mini** | **1.10 kg (2.43 lb)**, 298.5×259×38.5 mm, 25–40 W avg, IP67, electronic phased array, 110° FoV, −30 to 50 °C | DL 50–260 Mbps (real-world ~100–230); UL ~8–30 Mbps | ~25–45 ms | ROAM plan; phased array tolerates motion; proven on Ukrainian/Russian drones (see STARLINK_HONEST_TRUTH.md) |
| **Iridium** | Certus 700 / 100 | terminal ~1.36 kg (SKYTRAC IMS-350 class) | up to 704 kbps DL / 352 kbps UL (C-700); 88/22 kbps (C-100) | ~0.5 s advertised; **measured ~400 ms one-way, up to 800 ms+ closed-loop, queueing to 40 s under loss** | UAS terminals exist; pole-to-pole; **too slow for BVLOS video pilot loop — fine for C2/telemetry only** |
| **Inmarsat** | BGAN / SwiftBroadband | GEO terminal heavier | up to ~492 kbps (BGAN) | ~1+ s (GEO) | C2/telemetry; high latency limits |
| **Viasat** | Ku/Ka GEO + L-band (post-Inmarsat) | varies | Mbps-class GEO | ~600 ms+ (GEO) | bulk backhaul; high latency |

**Sources:** [Starlink Mini spec sheet PDF (official)](https://www.starlink.com/public-files/specification_sheet_mini.pdf); [Starlink Mini review speeds](https://www.satelliteinternet.com/providers/starlink/starlink-mini-review/); [Iridium Certus throughput (SKYTRAC)](https://www.skytrac.ca/resources/magazine/what-is-iridium-certus/); [SKYTRAC UAS terminal](https://www.globenewswire.com/news-release/2021/03/16/2193364/0/en/skytrac-enters-unmanned-aviation-segment-with-innovative-ims-350-iridium-certus-satcom-terminal.html); [FFI Iridium latency measurement (Reddit summary of report)](https://www.reddit.com/r/ASTSpaceMobile/comments/p8yfva/).

**Honest note:** Starlink Mini's low LEO latency (~25–45 ms) makes it the only one of these usable for live drone *video*; Iridium/Inmarsat/Viasat are C2/telemetry-only due to latency. Starlink price commonly quoted: hardware ~$599 originally (now discounted to ~$199–249 promo), service from ~$50/mo (mini roam tiers up to ~$150/mo).

---

## 6. Government / Partner-Only Pathways (NOT a commercial API)

These are **acquisition gates, not endpoints.** Killinchu cannot "call" them. Cite the pathway honestly.

| Channel | What it is | How you access | Reality |
|---|---|---|---|
| **NRO Electro-Optical Commercial Layer (EOCL)** | NRO's operational commercial-imagery subscription brokering to ~500k IC/DoD/fed users; awarded to BlackSky, Maxar, Planet (2022, base 5 yr + options to 2032) | You must be a USG end-user org or subcontract to one; not a public API | [NRO EOCL press release PDF](https://www.nro.gov/Portals/65/documents/news/press/2022/press_release_05-22.pdf); [NRO.gov article](https://www.nro.gov/news-media-featured-stories/news-media-archive/News-Article/Article/3135765/) |
| **NRO Strategic Commercial Enhancements (SCE) BAA** | BAA framework assessing emerging commercial EO/radar/RF/hyperspectral providers (Airbus US, Albedo, Hydrosat, Muon, Turion + earlier RF/radar/hyperspectral awardees) | Respond to BAA as a vendor; two-stage assessment | [NRO SCE EO contracts PDF](https://www.nro.gov/Portals/135/Documents/news/press/2023/SCE_EO_Contracts_Press_Release_FINAL.pdf) |
| **NGA Commercial GEOINT Activity (CGA)** | NGA's "front door" for commercial GEOINT vendors; Commercial GEOINT Strategy 2021–2025 | Engage CGA; partnership/contract, not API | [NGA Commercial GEOINT Strategy (Carahsoft PDF)](https://static.carahsoft.com/concrete/files/8817/3887/7529/Strategy_NGA_Commercial_GEOINT_Strategy.pdf); [Defense News on 2021–2025 strategy](https://www.defensenews.com/intel-geoint/2021/11/08/national-geospatial-intelligence-agency-issues-new-commercial-strategy/) |
| **DoD / SBIR / CRADA** | Small Business Innovation Research awards and Cooperative R&D Agreements gate access to gov data + co-development | Win an SBIR/STTR topic or sign a CRADA with a lab | Standard DoD acquisition pathway (SBIR.gov / lab T2 offices) |

**HARD HONESTY:** There is **no fake "NSILR API URL."** Government feeds are reached only by becoming (or subcontracting to) a USG-authorized entity through these acquisition vehicles. For a hackathon/Series-A posture, Killinchu uses **commercial APIs only** and treats government integration as a future B2G roadmap item gated by FOCI/facility clearance, not a demo feature.

---

## Aggregation verdict (what Killinchu actually integrates first)

| Tier | Constellation | Why first |
|---|---|---|
| **Demo (free)** | Umbra SAR open data (S3), Spire ADS-B trial, Planet/educational trial | $0–low, real data |
| **Series-A** | HawkEye 360 RFGeo (the differentiator) + one SAR (ICEYE/Capella) + Spire ADS-B | RF = the only true dark-drone finder |
| **Operational** | + Maxar/Planet tasking, Aireon real-time ADS-B, Starlink Mini backhaul on own drones | full multi-INT fusion |

Each becomes an **Adapter** emitting normalized **Observations**, each Khipu-receipted. See AGGREGATION_ARCHITECTURE.md.

— Yachay-extension, 2026-05-31
