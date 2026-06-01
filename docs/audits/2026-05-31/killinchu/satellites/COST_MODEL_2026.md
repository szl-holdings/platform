# COST MODEL 2026 — Killinchu satellite/RF aggregation

**Author:** Yachay-extension · 2026-05-31

Realistic monthly cost for three postures. All figures are **estimates from published/quoted transparent pricing** where it exists, and clearly flagged as "quote-only / contract-gated" where it does not. No invented numbers.

---

## Reference price points (sourced)

**SkyFi transparent imagery pricing** (broker reselling Maxar/Planet/ICEYE/Umbra etc.) — [SkyFi 2025 pricing PDF](https://skyfi.com/files/SkyFi_Pricing_2025.pdf), [SkyFi pricing page](https://skyfi.com/en/pricing):
- Optical archive: from **$15**/image; high-res (51–100 cm) **$5/km²** archive ($675 per 25 km² scene), 31–50 cm **$8/km²**, 16–30 cm **$22.50/km²**, ≤30 cm UHR **$3,250 per 25 km² scene**.
- Optical tasking ("new image"): from **$200**/image; 51–100 cm **$8/km²** (min 25 km²), 31–50 cm **$12/km²**, 16–30 cm **$30/km²**.
- **SAR: from $450**/image; SAR archive 16–30 cm **$45/km²** (min 5 km²); SAR tasking 16–30 cm **$60/km²**, priority **$110/km²**.
- [SkyFi tasking blog](https://skyfi.com/en/blog/satellite-tasking-explained): 50 cm optical tasking from ~$300 / 25 km²; 30 cm from ~$812 / 25 km²; SAR from ~$675 per 5×5 km scene.

**BlackSky** ([EOS LandViewer on BlackSky Gen-2](https://eos.com/find-satellite/blacksky-gen-2/)): archive from **$120/scene** (~25 km²), tasking from **$250/scene**.

**ICEYE** ([ICEYE tasking pricing model](https://docs.iceye.com/constellation/api/tasking/pricing-model/)): contract-immutable pricing plan; per-task quote via `getTaskPrice`; **cancellation 100% if <24 h**. No public flat rate — enterprise contract.

**Capella** ([Capella products guide PDF](https://vekom.hr/wp-content/uploads/2020/12/Capella_Space_SAR_Imagery_Products_Guide.pdf)): min purchase = single scene; pricing via contract/reseller.

**Planet** ([Planet tasking](https://www.planet.com/products/high-resolution-satellite-imagery/), [tasking API pricing](https://docs.planet.com/develop/apis/tasking/)): tasking credits or pay-per-km² via Planet Select; **enterprise quote-only** for monitoring subscriptions; SkySat min 25 km² charge.

**Spire** ([Spire ADS-B](https://spire.com/spirepedia/ads-b/), [Tracking Stream API](https://aviation-docs.spire.com/api/tracking-stream/introduction/)): enterprise subscription, quote-only; trial access available.

**HawkEye 360** ([RFGeo](https://www.he360.com/hawkeye-360-launches-rfgeo-signal-mapping-product/)): enterprise contract / USG channels only — **no public price**. Budget as a five-to-six-figure annual commitment based on the SIGINT-product market norm (treat as quote-only; do NOT pin a number in a deck without a quote).

**Starlink Mini** ([spec sheet](https://www.starlink.com/public-files/specification_sheet_mini.pdf), [Mini review](https://www.satelliteinternet.com/providers/starlink/starlink-mini-review/)): hardware ~$199–599; Roam service ~$50–150/mo.

**Umbra open data** ([AWS registry](https://registry.opendata.aws/umbra-open-data/)): **$0** (free archive, only AWS egress if you copy out).

---

## (a) Hackathon demo posture — cheapest possible

Goal: real data on screen, near-zero spend. Use **free/archive** sources + simulated live feed.

| Item | Source | Monthly cost |
|---|---|---|
| Umbra SAR archive (S3 no-sign-request) | [Umbra open data](https://registry.opendata.aws/umbra-open-data/) | **$0** (just AWS egress) |
| Spire ADS-B trial / OpenSky ADS-B sample | Spire trial / OpenSky | **$0** |
| A few archive optical images (set dressing) | SkyFi from $15/image, ~5–10 images | **~$75–150** one-time |
| Starlink Mini (if demoing own-drone backhaul) — optional | hardware + 1 mo Roam | **~$249 hw + ~$50/mo** (optional) |
| HawkEye/Maxar/Planet | **simulate** (synthetic Observations into the adapter) | **$0** |
| **Demo monthly run-rate** | | **≈ $0–150/mo** (plus optional one-time hardware) |

> Honest: at hackathon stage we **simulate** the RF/tasking feeds with the real Observation schema. That's not cheating — it's the correct way to demo the aggregation architecture without a five-figure HawkEye contract. We label it "synthetic feed."

---

## (b) Series-A pitch posture — 1 region, 1 Hz, 2 constellations

Goal: one credible region, live-ish, two *real* paid constellations (the differentiator + one corroborator) + ADS-B truth layer.

| Item | Assumption | Monthly cost |
|---|---|---|
| **HawkEye 360 RFGeo** (the differentiator) | smallest commercial regional subscription — **quote-only** | **~$5k–25k/mo** (modeled; confirm via quote) |
| **ICEYE or Capella SAR** — periodic tasking over 1 region | ~20–40 scenes/mo, ~$450–675/scene equiv | **~$10k–25k/mo** |
| **Spire ADS-B** regional stream | enterprise sub, quote-only | **~$2k–8k/mo** |
| Archive optical fill-ins | ~30 images × $15–250 | **~$1k–5k/mo** |
| Cloud (compute + S3 + egress) | modest | **~$0.5k–2k/mo** |
| **Series-A monthly** | | **≈ $18k–65k/mo** |

> Honest ranges are wide because HawkEye and Spire are quote-only; the SAR line is the most defensible (transparent per-scene). For a *pitch*, present the **low end (~$18k/mo)** as "starter region" and note the figure scales with tasking volume.

---

## (c) Operational customer posture — CONUS + OCONUS, 0.1 Hz nominal + on-demand tasking

Goal: persistent multi-INT over wide areas, on-demand high-res tasking when a cue fires. This is enterprise/defense scale.

| Item | Assumption | Monthly cost |
|---|---|---|
| **HawkEye 360** multi-region RF subscription | wide-area persistent — **quote-only** | **~$50k–150k+/mo** (modeled) |
| **SAR** (ICEYE + Capella) operational tasking | ~200–500 scenes/mo across CONUS+OCONUS | **~$100k–300k/mo** |
| **EO tasking** (Maxar 30 cm + Planet) on-demand cue-triggered | ~100–300 scenes/mo, incl. UHR ($3,250/25 km² scene) | **~$100k–400k/mo** |
| **Spire + Aireon ADS-B** global real-time | enterprise | **~$10k–40k/mo** |
| Starlink Mini fleet (own drones) | ~50 units × $150/mo Roam | **~$7.5k/mo** + hardware capex |
| Cloud/storage/egress at scale | imagery pixels dominate | **~$10k–50k/mo** |
| **Operational monthly** | | **≈ $280k–990k/mo** (~$3.4M–12M/yr) |

> Honest: at this scale the rational path is **NRO EOCL brokering** (if a USG customer) rather than paying retail per-scene — EOCL exists precisely to aggregate this demand ([NRO EOCL](https://www.nro.gov/Portals/65/documents/news/press/2022/press_release_05-22.pdf)). A commercial CONUS+OCONUS customer paying retail tasking is the most expensive way to do it; volume contracts cut these numbers materially.

---

## Cost-control design rules (baked into the architecture)
1. **Cue, don't blanket-task.** Use cheap/free wide-area layers (ADS-B, Umbra archive, RF subscription) to *cue* expensive 30 cm tasking only when a dark-drone Observation fires. This is the single biggest cost lever.
2. **0.1 Hz nominal, burst to on-demand.** Persistent layers run slow; high-res tasking is event-driven (see AGGREGATION_ARCHITECTURE §1).
3. **Pixels to S3, KB to the bus.** Never stream imagery on the WebSocket; fetch by reference. Keeps egress bounded.
4. **Quote-gated lines stay quote-gated in the deck.** Never present HawkEye/Spire/Planet enterprise numbers as fixed — present as ranges pending quote.

— Yachay-extension
