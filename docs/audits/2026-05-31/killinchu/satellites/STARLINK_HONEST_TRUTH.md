# STARLINK — THE HONEST TRUTH (rebuttal to "use Tesla satellites to track drones")

**Author:** Yachay-extension · 2026-05-31

The founder asked whether we can use "Tesla satellites" to track drones. Direct, hard-honest answer below. No bandaid.

---

## 1. The correction

1. **It's SpaceX, not Tesla.** Starlink is operated by SpaceX (Elon Musk's rocket/satellite company), not Tesla (the carmaker). Separate companies. Common conflation; worth stating cleanly so we never repeat it in a pitch.

2. **Starlink is a Ku-/Ka-band internet constellation. It has NO Earth-observation payload.** Starlink satellites are communications relays — phased-array internet bent-pipe/ISL nodes. They carry **no cameras, no SAR, no RF-SIGINT geolocation payload**. They cannot image the ground and they cannot geolocate a third-party emitter. There is **nothing to "track" with**.

3. **SpaceX does NOT expose a tracking API of remote-terminal positions.** There is no public/commercial Starlink product that streams "where every Starlink terminal is" to third parties. The only position-control behaviors SpaceX exposes are *internal enforcement* (e.g., disabling terminals, geofencing, speed cutoffs) — not a customer-facing geolocation feed. Using Starlink to "track drones" by reading terminal telemetry is **not a thing that exists.**

**Therefore: Starlink is the WRONG tool for tracking adversary drones. The right tools are RF-SIGINT (HawkEye 360), SAR (ICEYE/Capella/Umbra), and EO (Maxar/Planet) — see CONSTELLATION_SURVEY_2026.md and HAWKEYE360_DEEP_DIVE.md.**

---

## 2. What Starlink IS for us: backhaul on OUR OWN drone

The correct, real, deployable use of Starlink in Killinchu is as the **comms backhaul radio on our own drone/ground node** — carrying *our* telemetry and video, not tracking anyone else's aircraft.

### Starlink Mini specs (official spec sheet)
Source: [Starlink Mini specification sheet (PDF)](https://www.starlink.com/public-files/specification_sheet_mini.pdf)

| Spec | Value |
|---|---|
| Weight | **1.10 kg (2.43 lb)** (1.16 kg with kickstand) |
| Dimensions | 298.5 × 259 × 38.5 mm (11.75 × 10.2 × 1.45 in) |
| Power | **25–40 W average** (12–48 V, 60 W input; or USB-PD 100 W) |
| Antenna | Electronic phased array, 110° field of view |
| Environmental | IP67 (Type 4) with DC cable + plug |
| Operating temp | −30 °C to 50 °C |
| Wind | operational 96 kph+ (60 mph+) |
| Wi-Fi | 802.11a/b/g/n/ac, WiFi 5, dual-band 3×3 MU-MIMO; up to 128 devices |

> Note: the task brief cited "~9 oz." The **official spec sheet says 1.10 kg (2.43 lb / ~39 oz)** for the dish itself. The "9 oz" figure is not supported by the official sheet — use **2.43 lb**. Hard honesty: ~1.1 kg is heavy for small multirotors; it's realistic only on larger fixed-wing/VTOL or ground-relay nodes.

### Throughput / latency (real-world)
- Download **50–260 Mbps** (real-world tests ~100–230 Mbps); upload **~8–30 Mbps**; latency **~25–45 ms** ([SatelliteInternet.com Mini review](https://www.satelliteinternet.com/providers/starlink/starlink-mini-review/); [Basenor 2026 Mini/Roam summary](https://www.basenor.com/blogs/news/starlink-mini-roam-2026-plans-prices-what-to-do-now)).
- The ~25–45 ms LEO latency is what makes Starlink the **only** satcom option here capable of live FPV-class video (vs. Iridium's ~400–800 ms+, which is C2/telemetry-only — see CONSTELLATION_SURVEY §5).

### Power source options for drone integration
Starlink Mini supports 12–48 V DC input and USB-PD ([Starlink Mini power sources](https://starlink.com/support/article/0b2d5227-1db6-0002-ecee-f49d3b516b49)) — meaning it can run off a drone/vehicle battery bus, not just an AC wall plug. That's the key integration enabler.

### ROAM service plan
Starlink **Roam** (formerly "RV") is the mobile/portable plan that allows the terminal to move and operate away from a fixed service address ([Starlink Roam](https://starlink.com/roam)). Pricing tiers vary by region/data cap; commonly quoted around ~$50/mo (limited) up to ~$150/mo (unlimited/mobile-priority). Hardware promo pricing has ranged from the original ~$599 down to ~$199–249 ([Mini review pricing](https://www.satelliteinternet.com/providers/starlink/starlink-mini-review/)). **Roam is the correct plan for a mobile drone/ground node**, not the fixed-residential plan.

---

## 3. Real-world drone use cases (open-source reports)

Starlink-on-drone is **not theoretical** — it is in active combat use, which both validates the integration pattern AND demonstrates the adversary risk:

- **Russian strike drones with Starlink antennas hitting up to ~80 km behind Ukrainian lines** by late 2025; Russia operated terminals illegally via third-country imports/front men ([Carnegie Endowment analysis](https://carnegieendowment.org/russia-eurasia/politika/2026/02/russia-starlink-telegram-shutdown); [Ukrainska Pravda](https://www.pravda.com.ua/eng/articles/2026/02/09/8020195/)).
- **SpaceX + Ukraine countermeasure (Feb 2026):** SpaceX began disabling unregistered terminals in Ukraine and **shut down terminals moving faster than 90 km/h** specifically to stop them being strapped to attack drones; Ukraine built a "whitelist" via DELTA/Diia registration ([Ars Technica](https://arstechnica.com/tech-policy/2026/02/russian-drones-use-starlink-but-ukraine-has-plan-to-block-their-internet-access/); [Carnegie](https://carnegieendowment.org/russia-eurasia/politika/2026/02/russia-starlink-telegram-shutdown)).
- **Ukrainian military** uses Starlink at the front to direct drones, gather intelligence, and maintain comms where networks are absent ([Carnegie](https://carnegieendowment.org/russia-eurasia/politika/2026/02/russia-starlink-telegram-shutdown)).

### Two lessons for Killinchu
1. **Integration pattern is proven:** phased-array LEO terminal on a moving airframe works for relaying drone video/telemetry. We adopt that for *our* assets via Starlink Mini Roam.
2. **The speed-cutoff story is a tell, not a tracking API:** SpaceX disables fast-moving terminals as an *internal policy enforcement*. It does **not** publish those positions to third parties. So even the one place SpaceX "knows where a drone-mounted terminal is," it does not hand that out as a tracking feed. This reinforces §1.3.

---

## 4. One-line summary for the pitch deck

> "Starlink is our drone's **internet uplink**, not our drone-detection sensor. To *find* adversary drones we use RF-geolocation (HawkEye 360), radar (SAR), and imagery (EO). Conflating the two is the single most common space-mission mistake — we don't make it."

— Yachay-extension
