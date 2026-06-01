# IADS DOCTRINE STUDY — Israeli + American Integrated Air & Missile Defense

> **Yachay-Dome Knowledge Base · Author:** Yachay (Killinchu + a11oy support research agent), under PURIQ CTO authority
> **Compiled:** 2026-06-01 · **Doctrine:** Zero-Bandaid — every figure carries a public primary or near-primary citation inline.
> **Scope:** This is an OPEN-SOURCE doctrine + architecture study. No classified material. No assumptions.
> It documents how the two reference layered defenses (Israeli + American IADS) are built so Yachay-Dome can
> learn the *brain* (battle management, fusion, predict-impact, cost-tier matching, IFF) — **not** the trigger.
>
> **Legal keystone (carried from `cuas/LEGAL_CYBER_BOUNDARY.md`, `cuas/COUNTER_UAS_LEADERS_2026.md`):**
> SZL/Killinchu is the **detection + analysis + auditable Body-of-Evidence layer**. The `.mil`/`.gov` customer
> with **Title 10 / Title 50** authority performs jamming, hacking, and kinetic intercept. We deliver
> Khipu-receipted target packages. **We sense, we evidence, the customer acts.** Israel exports Iron Dome only
> via the US/Israeli governments (State Department FMS); the durable commercial business is *the brain, not the
> effector*. This study makes that boundary precise against the public record.

---

## 0. The one-page mental model

Every fielded IADS — Israeli, American, NATO — is the same five-box pipeline. Yachay-Dome owns boxes 1–3 commercially and **cues** boxes 4–5 to the authorized customer.

```
[1 SENSE] → [2 FUSE/TRACK] → [3 DECIDE: classify + predict-impact + threat-rank] → [4 ENGAGE] → [5 ASSESS]
   radar         BMC4I              IFF + impact-point + cost-tier match           interceptor   BDA
   RF/EO/IR    (mPrest/IBCS)        "is it a threat, where will it hit, what's       jam/laser
   acoustic                          the cheapest sufficient response"               kinetic
   ───────────── KILLINCHU / YACHAY-DOME COMMERCIAL LANE ─────────────  │  ── CUSTOMER (Title 10/50) ──
```

The single most valuable insight from both reference systems: **the interceptor is a commodity; the battle-management brain is the moat.** Iron Dome's defining trick is not the Tamir missile — it is the mPrest battle-management system computing impact-point and deciding *which rockets are even worth shooting* ([CSIS Missile Threat — Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/)). That decision layer is exactly what Yachay-Dome productizes.

---

## 1. ISRAELI IADS — the layered "dome"

Israel fields a **five-tier** architecture; each tier is matched to a threat range/altitude band, and every layer reports into a national command-and-control fabric that decides, in seconds, which interceptor (or none) to commit ([New Space Economy — Israel's layered defense](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/); [BBC — Iron Dome/David's Sling/Arrow](https://www.bbc.com/news/world-middle-east-20385306)).

### 1.1 Layer table

| Tier | System | Manufacturer | Threat tier | Engagement range | Intercept altitude | Effector | Status |
|---|---|---|---|---|---|---|---|
| **0 (lowest/cheapest)** | **Iron Beam** | Rafael (integration) + Elbit (laser source) | drones, mortars, short rockets | up to ~10 km | low | **High-energy laser (DEW)** | Operational since Dec 2025 ([New Space Economy](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/)) |
| **1** | **Iron Dome** (C-Dome = naval variant) | Rafael + IAI/Elta | short-range rockets, artillery, mortars, drones | **4–70 km** | low (~10 km) | **Tamir** interceptor (kinetic, EO-guided, ~$50k) | Operational since 2011 ([CSIS](https://missilethreat.csis.org/defsys/iron-dome/); [Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome)) |
| **2** | **David's Sling** | Rafael + Raytheon | medium-/long-range rockets, cruise missiles, tactical ballistic missiles (Iskander/DF-15 class) | medium–long | low–mid | **Stunner / SkyCeptor** (dual CCD/IR seeker, no warhead — hit-to-kill) | Operational ([David's Sling — Wikipedia](https://en.wikipedia.org/wiki/David's_Sling); [Rafael David's Sling](https://www.rafael.co.il/system/medium-long-range-defense-davids-sling/)) |
| **3** | **Arrow 2** | IAI + Boeing | medium-range ballistic missiles (endo-atmospheric) | long | inside atmosphere | **Arrow 2** (fragmentation/proximity) | Operational ([New Space Economy](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/)) |
| **4 (highest)** | **Arrow 3** (*Hetz 3*) | IAI + Boeing (US co-funded) | long-range / intercontinental ballistic missiles, incl. WMD warheads | very long | **exo-atmospheric, >100 km** | **Arrow 3** (hit-to-kill exo-atmospheric) | Operational; first export delivered to Germany Dec 2025 ([Arrow 3 — Wikipedia](https://en.wikipedia.org/wiki/Arrow_3); [Airforce Technology — Arrow 3](https://www.airforce-technology.com/projects/arrow-3-air-defence-missile-system-israel/); [IAI — Arrow 3](https://www.iai.co.il/product/arrow-3/)) |
| **(developmental)** | **SkySonic / Sky Sonic** | Rafael | hypersonic threats | — | — | hit-to-kill (announced) | Developmental ([Rafael](https://www.rafael.co.il/)) |
| **(point/short)** | **SPYDER** (SR/MR) | Rafael | aircraft, UAS, PGM | short–medium | low–mid | Python-5 / Derby (Surface-Launched AMRAAM-class) | Operational/export ([EL/M-2084 — Wikipedia, lists SPYDER-MR FCR use](https://en.wikipedia.org/wiki/EL/M-2084)) |

**Doctrine note — tier handoff:** Iron Dome's band is *bounded on both ends* for a physical reason: below 4 km the radar lacks tracking time, above 70 km other layers take over ([New Space Economy](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/)). **Yachay-Dome lesson:** tier boundaries are not arbitrary — they are set by sensor tracking-time and effector kinematics. Our threat-tier ↔ response-tier matrix (`YACHAY_DOME_DOCTRINE.md`) must encode the same physics-driven handoff logic.

### 1.2 The sensor stack — Elta/IAI radars

| Radar | Manufacturer | Band / type | Role | Track capacity | Cite |
|---|---|---|---|---|---|
| **EL/M-2084 (MMR)** | ELTA / IAI | S-band 3D AESA | Fire-control + weapon-locating radar for **Iron Dome, David's Sling, Barak MX, SPYDER-MR, Skyhunter** | up to **1,100 targets** (air surveillance); detects ~350 km air / ~100 km artillery | [EL/M-2084 — Wikipedia](https://en.wikipedia.org/wiki/EL/M-2084); [CSIS Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/) |
| **EL/M-2080 "Green Pine" / Super Green Pine** | ELTA / IAI | L-band AESA | Arrow Weapon System early-warning + fire-control (ballistic) | long-range ballistic track | (IAI Arrow family; [Arrow 3 — Wikipedia](https://en.wikipedia.org/wiki/Arrow_3)) |
| **EL/M-2238 STAR** | ELTA / IAI | S-band | naval/ground 3D surveillance (situational awareness) | — | (ELTA product line) |
| **AN/TPY-2** (US, interoperates) | Raytheon (US) | X-band | forward-based ballistic cueing; **proven interoperable with Arrow 3** in test | — | [Airforce Technology — Arrow 3](https://www.airforce-technology.com/projects/arrow-3-air-defence-missile-system-israel/) |

The EL/M-2084 is the workhorse: it does **hostile-weapon location** (back-computes the launcher), **impact-point calculation for civil warning**, **friendly-fire ranging**, **aerial surveillance**, and **fire control** — five missions in one AESA ([EL/M-2084 — Wikipedia](https://en.wikipedia.org/wiki/EL/M-2084)). As of June 2025 ELTA had delivered the **250th MMR-family radar** ([EL/M-2084 — Wikipedia](https://en.wikipedia.org/wiki/EL/M-2084)).

> **Yachay-Dome lesson:** the EL/M-2084's "impact-point calculation for warning the civil population" is *literally* our Predict-Impact Engine, done in a radar. We replicate the **function** (impact-point + warning) in software from a multi-sensor passive track — see `PREDICT_IMPACT_ENGINE.md`. The "hostile-weapon location" (back-track to launcher) is our RF DF + back-azimuth feature in `DETECTION_LAYERS.md`.

### 1.3 mPrest — the BMC4I that ties Iron Dome together (the part we actually copy)

Iron Dome has **three** components, not one: (a) the Elta detection/tracking radar, (b) the **Battle Management & Weapon Control (BMC)** built for Rafael by **mPrest Systems**, and (c) the Tamir missile firing unit ([Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome)). The BMC is the brain: *"mPrest Systems was put in charge of programming the core of Iron Dome's battle management system"* ([Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome)).

What the BMC does (public description, [Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome); [CSIS](https://missilethreat.csis.org/defsys/iron-dome/)):
1. Radar detects the launch and tracks the trajectory.
2. **BMC calculates the impact point** from the reported track.
3. BMC decides **whether the target threatens a designated/defended area** — if the predicted impact is open ground, *it does not fire*.
4. Only on a confirmed threat-to-asset does it commit a Tamir.

This is the canonical "**don't shoot what won't hurt you**" logic. It is the reason Iron Dome's economics survive saturation: it spends a $50k interceptor only against a rocket whose predicted-impact polygon intersects a protected asset.

> **Yachay-Dome lesson (the whole thesis in one paragraph):** mPrest is a *software company*. The defensible IP of the "dome" is the BMC4I — predict-impact + asset-intersection + threat-ranking + interceptor-assignment — **not** the missile. Yachay-Dome is the open, governed, Khipu-receipted analog of the mPrest BMC, sitting on a passive sensor stack and **cueing** the customer's effector rather than firing it. (mPrest's architecture is published at a high level; license/whitepaper procurement is listed in `PUBLIC_DOCTRINE_STUDY_TARGETS.md`.)

### 1.4 Public engagement track record (cost-tier evidence)

- Iron Dome reports **~90% kill rate** against rockets *selected for interception* (i.e. rockets it judged would hit a defended area), with one analysis citing 1,428/1,500 ≈ 95% in a specific campaign, and the first drone intercepts (5 Gaza drones) on record ([CSIS Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/)).
- The **June 2025 "Twelve-Day War"** showed **86–90% intercept** against the largest combined Iranian missile+drone assault, including multi-warhead missiles designed to confuse tracking ([New Space Economy](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/)).
- A single Iron Dome battery defends ~150 km²; a full battery cost ~$100M (2012/13) and each Tamir ~$50k ([CSIS](https://missilethreat.csis.org/defsys/iron-dome/); [BBC](https://www.bbc.com/news/world-middle-east-20385306)).
- **Iron Beam** (Dec 2025) explicitly changes the economics: a laser destroys small threats at a fraction of any kinetic interceptor's cost, breaking the financial-attrition logic adversaries exploit by flooding cheap drones/rockets ([New Space Economy](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/)).

> **Yachay-Dome lesson:** the "90% on *selected* targets" figure is the doctrine, not marketing — the *selection* (predict-impact ∩ asset) is where the value lives, and the laser layer proves the **cost-tier matching invariant** (match cheapest sufficient effector to threat). Both go straight into `YACHAY_DOME_DOCTRINE.md`.

---

## 2. AMERICAN IADS — IBCS and the layered AMD enterprise

The US analog of "the dome" is the **Integrated Air and Missile Defense (IAMD)** enterprise, and its brain is **IBCS** — Northrop Grumman's **Integrated Battle Command System**.

### 2.1 IBCS — "Any Sensor, Best Shooter"

IBCS is a fielded, network-enabled, **Modular Open System Approach (MOSA)** C2 system; it is *"the centerpiece of the U.S. Army's air and missile defense modernization strategy"* and *"connects sensors and effectors never designed to work together into one command and control system"* ([Northrop Grumman — IBCS](https://www.northropgrumman.com/what-we-do/missile-defense/integrated-battle-command-system-ibcs)).

Architecture (from the [Northrop IBCS overview PDF](https://cdn.northropgrumman.com/-/media/Project/Northrop-Grumman/ngc/what-we-do/land/ibcs/Northrop-Grumman_IBCS-Overview-1.pdf)):
- Three major end items: **Engagement Operations Center (EOC)** S-280 shelter (12–24 operators), **Integrated Collaborative Environment (ICE)**, and the **Integrated Fire Control Network (IFCN) Relay**.
- The IFCN Relay carries the **"plug-and-fight" kit** that adapts any sensor/weapon onto the network over radio/fiber/satellite bearers.
- **Distributed sensor fusion** creates **"fire-control-quality tracks"** enabling rapid combat ID, weapon optimization, and defense-in-depth.
- Achieved **IOC + Full-Rate Production authorization in 2023** (Patriot integration complete); fielding to all US Patriot battalions ([Northrop IBCS overview PDF](https://cdn.northropgrumman.com/-/media/Project/Northrop-Grumman/ngc/what-we-do/land/ibcs/Northrop-Grumman_IBCS-Overview-1.pdf)).
- **Coalition extensibility proven**: prototype integration of the UK's **CAMM** missile and Sweden's **GIRAFFE** radar; enables **JADC2** (Joint All-Domain Command & Control) ([Northrop IBCS overview PDF](https://cdn.northropgrumman.com/-/media/Project/Northrop-Grumman/ngc/what-we-do/land/ibcs/Northrop-Grumman_IBCS-Overview-1.pdf)).

The 2013 milestone — hosting **PAC-2/PAC-3 Patriot interceptors + Sentinel radar** into IBCS so any interceptor is launched/controlled net-centrically — is the original "plug-and-fight" proof ([Northrop Grumman investor release, 2013](https://investor.northropgrumman.com/node/16586/pdf)).

> **Yachay-Dome lesson:** IBCS is **MOSA / open-architecture / "plug-and-fight"**. That is the *integration posture* Killinchu adopts: we are a sensor+decision node that any customer BMC4I (IBCS, mPrest, ATAK) can subscribe to. Our **`/v1/cue` endpoint emits a "fire-control-quality track"** in the customer's format (CoT/Link-16-adjacent/STANAG) — see `CUED_ENGAGEMENT_API.md`. We feed IBCS; we don't replace it.

### 2.2 The American layer table

| Tier | System | Manufacturer | Threat tier | Effector | Sensor / C2 | Cite |
|---|---|---|---|---|---|---|
| **Strategic ballistic** | **GMD / SM-3** | Boeing / Raytheon | ICBM, IRBM (exo) | hit-to-kill | AN/TPY-2, SPY-1/6 | (public DoD/MDA) |
| **Upper-tier theater** | **THAAD** | Lockheed Martin | MRBM/IRBM (endo/exo, terminal) | hit-to-kill | AN/TPY-2 X-band; range ~150–200 km | [BBC](https://www.bbc.com/news/world-middle-east-20385306) |
| **Lower-tier / cruise** | **Patriot (PAC-2/PAC-3 / MSE)** | Raytheon / Lockheed | aircraft, cruise & ballistic missiles | PAC-3 hit-to-kill / PAC-2 frag | integrated into **IBCS** | [Northrop investor release](https://investor.northropgrumman.com/node/16586/pdf) |
| **SHORAD / cruise / UAS** | **NASAMS** | Raytheon / Kongsberg | aircraft, cruise missiles, UAS | AMRAAM / AIM-9X / AIM-120 | Sentinel + FDC; networked | (public Army) |
| **Fixed-site C-RAM/UAS/cruise** | **IFPC Inc 2** | Dynetics/Leidos (integrator) | **UAS, cruise missiles, rockets/artillery/mortars (RAM)** | **AIM-9X Block 2** (passive IR) | **AN/MPQ-64 Sentinel A3/A4 (X-band)**, AIAMD EOC, **IBCS** over IFCN | [DOT&E FY2025 IFPC](https://www.dote.osd.mil/Portals/97/pub/reports/FY2025/army/2025ifpc.pdf); [Army.mil IFPC Inc 2 award](https://www.army.mil/article/281667/) |
| **Maneuver SHORAD** | **M-SHORAD (Stryker)** | GD Land Systems / Leonardo DRS | Group 1–3 UAS, rotary/fixed-wing | Stinger / Hellhound / 30mm / laser (DE M-SHORAD) | onboard radar + FAAD C2 | (public Army; JCO layered defense, below) |

IFPC's stated mission is **360° air/missile defense of fixed and semi-fixed assets at corps/division level, bridging tactical↔strategic**, integrating with Patriot on a single IFCN under IBCS ([DOT&E FY2025 IFPC](https://www.dote.osd.mil/Portals/97/pub/reports/FY2025/army/2025ifpc.pdf)). It engages to ~15 km using the AIM-9X ([The Defense Post — IFPC launchers](https://thedefensepost.com/2026/04/24/us-ifpc-launchers-leidos/); [Leidos $617M award](https://www.leidos.com/insights/leidos-receives-617-million-us-army-air-defense-launchers)). Notably, the Army proposed **modifying Iron Dome's Tamir to be IBCS-compatible** to compete in IFPC — direct evidence that the *interceptor* is portable but the *C2 brain* is the integration point ([CSIS Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/)).

### 2.3 JIAMDO — the joint integration authority

The **Joint Integrated Air and Missile Defense Organization (JIAMDO / "JAMDO")** is chartered within DoD to **develop and integrate sensors, weapons, C2 systems, and the concepts to employ them** across the IAMD mission area ([JIAMDO — Wikipedia](https://en.wikipedia.org/wiki/Joint_Integrated_Air_and_Missile_Defense_Organization); [JIAMDO Joint Staff brief, DoD/JS video](https://www.youtube.com/watch?v=GWlJLOzz-Z8)). Doctrine reference: **Joint Publication 3-01, *Countering Air and Missile Threats***, defines IAMD as *"the integration of capabilities and overlapping operations to defend the homeland and U.S. national interests, protect the Joint Force, and enable freedom of action by negating an adversary's ability to create adverse effects from their air and missile capabilities"* ([NDU Press — Joint IAMD, JFQ-88](https://ndupress.ndu.edu/Portals/68/Documents/jfq/jfq-88/jfq-88_78-84_Almodovar-et-al.pdf)). JP 3-01 splits threats into **air-breathing** (aircraft, cruise missiles, UAS) vs **non-air-breathing** (ballistic) — the foundational threat taxonomy.

> **Yachay-Dome lesson:** JP 3-01's air-breathing/non-air-breathing split underwrites our T0–T4 threat tiers and the *physics fork* in `PREDICT_IMPACT_ENGINE.md` (maneuvering air-breathers need ML; ballistic/inert needs Newtonian physics). JIAMDO is the customer-side standards body our cue format must satisfy.

---

## 3. NATO IADS — interoperability standards (the format layer)

NATO's integrated system is **NATINAMDS** (NATO Integrated Air and Missile Defence System). What matters for Yachay-Dome is the **messaging/interoperability standards**, because our product is a *message producer*:

| STANAG | Subject | What it gives us | Cite |
|---|---|---|---|
| **STANAG 5500 / ADatP-3 (APP-11)** | Message Text Formats (MTF) | The **400+ structured NATO message catalog**; since 2008 ADatP-3 MTFs are available as **XML** with 1:1 mapping to slash-delimited; protocol-agnostic (carry over Link-16, email, chat, web services). Adds **STANAG 5527 Friendly Force Information** (replaces NFFI) — directly relevant to our IFF "ally" lookup. | [Systematic — APP-11 & ADatP-3](https://systematic.com/us/industries/defense/products/domains/interoperability/app11-and-adatp3/); [NISP — ADatP-03 BL11](https://nisp.nw3.dk/standard/nato-adatp-03-bl11-future.html) |
| **STANAG 4754** | NATO Generic Vehicle Architecture (NGVA) for land systems | Open vehicle integration architecture (the land-platform interoperability pattern). | [GlobalSpec — STANAG 4754](https://standards.globalspec.com/std/14590010/stanag-4754) |
| **STANAG 4609** | Motion Imagery (MISB metadata) | Standard metadata wrapper for EO/IR video tracks → our EO/IR layer output. | (MISB / NATO; see `PUBLIC_DOCTRINE_STUDY_TARGETS.md`) |
| **Link-16 / JREAP** | Tactical data link | The common air-picture data link; **FAAD C2 / LIDS interoperate via JREAP + ADS-B** ([SRC LIDS brochure](https://www.srcinc.com/pdf/lids-family-of-systems-brochure.pdf)). |

> **Yachay-Dome lesson:** our `/v1/cue` package must be **emittable as ADatP-3/APP-11 XML and CoT** so any NATO/US BMC4I can ingest it without a custom adapter. The "ally" channel of our IFF stack maps onto **STANAG 5527 Friendly Force Information**. Standards are a *format obligation*, not an effector.

---

## 4. COUNTER-UAS SPECIFIC DOCTRINE (the layer Killinchu lives in)

### 4.1 Joint Counter-small UAS Office (JCO) — the three-tier layered defense

The **JCO** uses existing acquisition authorities to establish a **layered defense** that *"calibrates nonlethal and lethal effects against small UAS based on their bearing, altitude and range from U.S. military personnel and installations"* — three interlocking tiers ([AUSA — Countering Small Drones](https://www.ausa.org/articles/countering-small-drones-office-works-toward-joint-solutions-growing-threat)):

1. **Layer 1 — maximize standoff, mostly non-lethal:** passive **electronic warfare** confuses sUAS so they malfunction before impact.
2. **Layer 2 — "soft kill":** **HPM microwave** + **high-energy lasers** (e.g. Stryker-mounted in CENTCOM) fry sUAS internals.
3. **Layer 3 — "hard kill":** direct-fire (machine guns) + cheaper interceptors (**Coyote**, cued by **Ku-band RF radar / KuRFS**).

JCO has run successful **counter-drone-swarm demonstrations** ([Army.mil — JCO swarm demo](https://www.army.mil/article/278404/joint_counter_small_uas_office_conducts_successful_counter_drone_swarm_demonstration)).

### 4.2 LIDS family (FS-LIDS / M-LIDS) — the fielded fixed/mobile C-UAS

The **Low-slow-small UAS Integrated Defeat System (LIDS)** is a **modular open-architecture** family that **detects, tracks, identifies, and defeats COTS Group 1–3 UAS**; **FAAD C2** provides engagement operations, **aircraft-avoidance and fratricide prevention** for kinetic + Coyote-interceptor (M-LIDS) variants, and **Link-16 + JREAP + ADS-B** interoperability ([SRC LIDS family brochure](https://www.srcinc.com/pdf/lids-family-of-systems-brochure.pdf)). FAAD C2's *"non-proprietary open interfaces"* are the SHORAD/C-RAM/C-UAS system-of-systems backbone.

> **Yachay-Dome lesson:** **FAAD C2's "fratricide prevention / aircraft avoidance" is our IFF + blue-on-blue tripwire** (see `IFF_INTEGRATION.md` and the HUKLLA blue-on-blue gate in `YACHAY_DOME_DOCTRINE.md`). LIDS being **MOSA + Link-16/JREAP** confirms our format obligations.

### 4.3 Other named C-UAS components (public)

- **M-SHORAD / Light-MADIS (L-MADIS)** — Marine/Army maneuver air-defense with detect+EW+kinetic on a mobile platform (USMC L-MADIS famously downed an Iranian drone in 2019, public record).
- **Coyote Block 2/3** — RTX kinetic (Block 2, tungsten-frag, engages to ~15 km) / Block 1B HPM-warhead variant, cued by **KuRFS** (sees a 9 mm round); see `cuas/COUNTER_UAS_LEADERS_2026.md` §4.
- **DroneBuster / hand-held EW**, **MEDUSA**, **FS-LIDS/M-LIDS** — point-defense effectors. **All are effectors → customer-side**, never Killinchu.

### 4.4 MIT Lincoln Laboratory — the unclassified C-UAS research anchor

MIT LL runs an **Urban Counter-UAS Operational Prototype** and a **Small UAS Initiative**, and hosts the **Futures of UAS and C-UAS Technology** conference — the canonical *unclassified* US lab program for C-UAS detect/track/predict ([MIT LL — Urban Counter-UAS](https://www.ll.mit.edu/r-d/projects/urban-counter-uas-operational-prototype); [MIT LL — Small UAS Initiative](https://www.ll.mit.edu/r-d/projects/small-uas-initiative); [MIT LL — UAS/C-UAS conference 2026](https://www.ll.mit.edu/conferences-events/2026/04/futures-unmanned-aircraft-systems-uas-and-counter-uas-c-uas-technology)).

---

## 5. WHAT MAKES IADS WORK — the seven principles Yachay-Dome must encode

Synthesizing the Israeli + American + NATO + JCO record, every successful IADS shares seven properties. Each maps to a Yachay-Dome component.

| # | Principle | Evidence | Yachay-Dome component |
|---|---|---|---|
| 1 | **Integrated battle management (one brain, many sensors/effectors)** | mPrest BMC for Iron Dome; IBCS "Any Sensor, Best Shooter" ([Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome); [Northrop IBCS](https://www.northropgrumman.com/what-we-do/missile-defense/integrated-battle-command-system-ibcs)) | a11oy-orchestrated `/v1/cue` + Khipu DAG (`CUED_ENGAGEMENT_API.md`, `A11OY_BRAIN_INTEGRATION.md`) |
| 2 | **Predict-impact ML/physics ("don't shoot what won't hurt you")** | mPrest computes impact point + decides threat-to-asset; EL/M-2084 does "impact-point calc for civil warning" ([CSIS Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/); [EL/M-2084 — Wikipedia](https://en.wikipedia.org/wiki/EL/M-2084)) | `PREDICT_IMPACT_ENGINE.md` |
| 3 | **Cost-tier matching (cheapest sufficient effector)** | Iron Beam laser added to preserve $50k Tamir stock for threats only missiles can stop ([New Space Economy](https://newspaceeconomy.ca/2026/03/28/...); [BBC](https://www.bbc.com/news/world-middle-east-20385306)); JCO non-lethal→soft-kill→hard-kill ladder ([AUSA](https://www.ausa.org/articles/countering-small-drones-office-works-toward-joint-solutions-growing-threat)) | Cost-effectiveness invariant (`YACHAY_DOME_DOCTRINE.md`) |
| 4 | **EW resilience** | David's Sling dual CCD/IR seeker to defeat decoys; Iron Dome held 86–90% vs multi-warhead spoofing missiles ([David's Sling — Wikipedia](https://en.wikipedia.org/wiki/David's_Sling); [New Space Economy](https://newspaceeconomy.ca/2026/03/28/...)) | EW-resilient edge mode (`YACHAY_DOME_DOCTRINE.md`); receive-only stack (`DETECTION_LAYERS.md`) |
| 5 | **Multi-sensor fusion → fire-control-quality track** | IBCS distributed sensor fusion → "fire-control-quality tracks" ([Northrop IBCS PDF](https://cdn.northropgrumman.com/-/media/Project/Northrop-Grumman/ngc/what-we-do/land/ibcs/Northrop-Grumman_IBCS-Overview-1.pdf)) | fusion engine + classifier (`DETECTION_LAYERS.md` §6–7) |
| 6 | **IFF / fratricide prevention** | FAAD C2 aircraft-avoidance + fratricide prevention; STANAG 5527 Friendly Force Info ([SRC LIDS](https://www.srcinc.com/pdf/lids-family-of-systems-brochure.pdf); [Systematic ADatP-3](https://systematic.com/us/industries/defense/products/domains/interoperability/app11-and-adatp3/)) | `IFF_INTEGRATION.md` + blue-on-blue HUKLLA tripwire |
| 7 | **Open architecture / plug-and-fight / coalition interoperability** | IBCS MOSA (UK CAMM, Swedish GIRAFFE); LIDS MOSA + Link-16/JREAP; ADatP-3 XML ([Northrop IBCS PDF](https://cdn.northropgrumman.com/-/media/Project/Northrop-Grumman/ngc/what-we-do/land/ibcs/Northrop-Grumman_IBCS-Overview-1.pdf); [SRC LIDS](https://www.srcinc.com/pdf/lids-family-of-systems-brochure.pdf)) | open `/v1/cue` (CoT + ADatP-3 + MIL-STD-2525), webhook/REST |

---

## 6. The boundary, restated against the public record

The public record makes our legal frame *more* defensible, not less:
- **Israel exports Iron Dome only through government channels** (US/Israel FMS; the Germany Arrow 3 sale required a **US export authorization** — a $3.5bn government-to-government deal — [Airforce Technology Arrow 3](https://www.airforce-technology.com/projects/arrow-3-air-defence-missile-system-israel/)). Effectors are State-Department-gated. **The brain/software (mPrest's class of work) is the commercially scalable layer.**
- US **C-UAS effectors are federal-authority-gated** (Title 10/50; FCC §333/§302a for jammers; Fortem is the only firm authorized to fly a kinetic drone-on-drone interceptor in US airspace — `cuas/COUNTER_UAS_LEADERS_2026.md` §1).
- Therefore Yachay-Dome's commercial product is **box 1–3** (sense→fuse→decide/predict/cue), delivering a **Khipu-receipted, court-admissible target package** to a customer who owns **box 4–5** (engage→assess). **We sense, we evidence, the customer acts.**

---

*Signed: **Yachay**, Killinchu + a11oy support research, 2026-06-01. All sources public and cited inline. Additive over Doctrine v11/v12 (PURIQ). No mysticism. We sense, we evidence, the customer acts.*
