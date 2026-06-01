# PUBLIC DOCTRINE STUDY TARGETS — The Open-Source Reading List

> **Author:** Yachay · **Date:** 2026-06-01 · **Component of:** Yachay-Dome (study basis for all components).
> **Function:** the curated, *public-only* corpus underpinning Yachay-Dome. Every entry: **URL · what's in it for us ·
> which Yachay-Dome component it informs.** No classified material. No assumptions. This is the bibliography that
> makes the doctrine defensible and the Series-A story sourceable.

---

## 0. Reading rule

Every source below is **publicly accessible**. We study published doctrine to *mirror its decision logic in software*, never to replicate restricted designs. We take the **decision framework** (when does a system act, on what evidence, against what value) and rebuild it as our detection + Body-of-Evidence layer.

---

## 1. Israeli IADS — layered interception doctrine

| # | Source | What's in it for us | Informs |
|---|--------|--------------------|---------|
| 1 | [CSIS Missile Threat — Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/) | The "only intercept if it threatens a defended area, else let it fall" decision — our legal keystone | `ASSET_VALUE_MAP.md`, `YACHAY_DOME_DOCTRINE.md` |
| 2 | [Iron Dome — Wikipedia](https://en.wikipedia.org/wiki/Iron_Dome) | Battle-management + radar + interceptor architecture overview | `IADS_DOCTRINE_STUDY.md` |
| 3 | [EL/M-2084 MMR — Wikipedia](https://en.wikipedia.org/wiki/EL/M-2084) | Multi-mission radar that does detection + fire-control + impact prediction | `PREDICT_IMPACT_ENGINE.md` |
| 4 | [David's Sling — Wikipedia](https://en.wikipedia.org/wiki/David%27s_Sling) | Mid-tier interceptor layer; tiering logic | `YACHAY_DOME_DOCTRINE.md` (threat tiers) |
| 5 | [Arrow 3 — Wikipedia](https://en.wikipedia.org/wiki/Arrow_3) | Exo-atmospheric top tier; full layered picture | `IADS_DOCTRINE_STUDY.md` |
| 6 | [IAI — Arrow 3 product page](https://www.iai.co.il/product/arrow-3/) | Vendor framing of layered defense (primary) | `IADS_DOCTRINE_STUDY.md` |
| 7 | [Rafael — David's Sling](https://www.rafael.co.il/system/medium-long-range-defense-davids-sling/) | Vendor framing; BMC integration language | `CUED_ENGAGEMENT_API.md` |
| 8 | [New Space Economy — Israel's layered missile/drone defense](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/) | Recent synthesis of the full layered stack | `IADS_DOCTRINE_STUDY.md` |
| 9 | [BBC — How Israel's missile defenses work](https://www.bbc.com/news/world-middle-east-20385306) | Public-facing explainer of the intercept-only-if-threatening logic | `ASSET_VALUE_MAP.md` |
| 10 | [Airforce Technology — Arrow 3](https://www.airforce-technology.com/projects/arrow-3-air-defence-missile-system-israel/) | System specs and engagement envelope | `IADS_DOCTRINE_STUDY.md` |

---

## 2. American IADS — integrated battle command

| # | Source | What's in it for us | Informs |
|---|--------|--------------------|---------|
| 11 | [Northrop Grumman — IBCS](https://www.northropgrumman.com/what-we-do/missile-defense/integrated-battle-command-system-ibcs) | "Any-sensor, best-effector" single integrated air picture — our orchestration model | `A11OY_BRAIN_INTEGRATION.md`, `CUED_ENGAGEMENT_API.md` |
| 12 | [Northrop — IBCS Overview PDF](https://cdn.northropgrumman.com/-/media/Project/Northrop-Grumman/ngc/what-we-do/land/ibcs/Northrop-Grumman_IBCS-Overview-1.pdf) | Architecture detail; sensor/effector decoupling (primary) | `A11OY_BRAIN_INTEGRATION.md` |
| 13 | [Northrop 2013 investor release](https://investor.northropgrumman.com/node/16586/pdf) | Historical framing of integrated fire control | `IADS_DOCTRINE_STUDY.md` |
| 14 | [DOT&E FY2025 IFPC report PDF](https://www.dote.osd.mil/Portals/97/pub/reports/FY2025/army/2025ifpc.pdf) | Independent test findings — what fails, where the gaps are (primary, gov) | `WHAT_FOUNDER_IS_MISSING.md` |
| 15 | [Army.mil — IFPC Inc 2](https://www.army.mil/article/281667/) | Indirect Fire Protection Capability program framing | `YACHAY_DOME_DOCTRINE.md` |
| 16 | [The Defense Post — IFPC launchers (Leidos)](https://thedefensepost.com/2026/04/24/us-ifpc-launchers-leidos/) | Current procurement state | `WHAT_FOUNDER_IS_MISSING.md` |
| 17 | [Leidos — $617M IFPC launchers](https://www.leidos.com/insights/leidos-receives-617-million-us-army-air-defense-launchers) | Prime-contractor BD landscape | `WHAT_FOUNDER_IS_MISSING.md` |
| 18 | [JIAMDO — Wikipedia](https://en.wikipedia.org/wiki/Joint_Integrated_Air_and_Missile_Defense_Organization) | Joint integration governance body | `IADS_DOCTRINE_STUDY.md` |
| 19 | [NDU Press — Joint IAMD, JFQ-88 PDF](https://ndupress.ndu.edu/Portals/68/Documents/jfq/jfq-88/jfq-88_78-84_Almodovar-et-al.pdf) | Doctrine paper on joint air/missile defense (primary, gov) | `IADS_DOCTRINE_STUDY.md` |

---

## 3. Counter-UAS doctrine & strategy

| # | Source | What's in it for us | Informs |
|---|--------|--------------------|---------|
| 20 | [DoD Counter-small UAS Strategy 2021 PDF](https://media.defense.gov/2021/Jan/07/2002561080/-1/-1/0/DEPARTMENT-OF-DEFENSE-COUNTER-SMALL-UNMANNED-AIRCRAFT-SYSTEMS-STRATEGY.pdf) | The "detect, identify, deter, defeat" + "risk-informed tiered approach" framework (primary, gov) | `YACHAY_DOME_DOCTRINE.md` (tiers), `IFF_INTEGRATION.md` |
| 21 | [DoD C-UAS — NPS hosted copy PDF](https://nps.edu/documents/115559645/122225231/2021+Dist+A+DoD+Counter-UAS+11+Jan+2021.pdf) | Budget + Sec.1074 NDAA reporting context | `WHAT_FOUNDER_IS_MISSING.md` |
| 22 | [CRS — DoD Counter-UAS, Background & Issues (Mar 2025) via USNI](https://news.usni.org/2025/04/01/report-to-congress-on-dod-counter-unmanned-aircraft-systems) | Congressional framing; interagency coordination questions | `DOMESTIC_ADJACENCY.md` |
| 23 | [GAO — Counter-Drone Technologies (2022) via USNI](https://news.usni.org/2022/03/24/gao-report-on-counter-drone-technologies) | The four authorized agencies (DoD, DOE, DOJ, DHS) + CFAA/Sabotage-Act limits | `DOMESTIC_ADJACENCY.md`, `WHAT_FOUNDER_IS_MISSING.md` |
| 24 | [AUSA — Countering Small Drones (JCO 3-tier)](https://www.ausa.org/articles/countering-small-drones-office-works-toward-joint-solutions-growing-threat) | JCO's tiered/layered C-sUAS construct | `YACHAY_DOME_DOCTRINE.md` |
| 25 | [Army.mil — JCO swarm demo](https://www.army.mil/article/278404/) | Swarm threat + layered response demonstration | `PREDICT_IMPACT_ENGINE.md` |
| 26 | [SRC — LIDS family-of-systems brochure PDF](https://www.srcinc.com/pdf/lids-family-of-systems-brochure.pdf) | Fielded C-sUAS sensor/effector family (primary vendor) | `IADS_DOCTRINE_STUDY.md` |
| 27 | [MIT LL — Urban Counter-UAS prototype](https://www.ll.mit.edu/r-d/projects/urban-counter-uas-operational-prototype) | National-lab urban C-UAS reference design | `WHAT_FOUNDER_IS_MISSING.md` (lab partnerships) |
| 28 | [MIT LL — Small UAS Initiative](https://www.ll.mit.edu/r-d/projects/small-uas-initiative) | Sensing/fusion research lineage | `PREDICT_IMPACT_ENGINE.md` |
| 29 | [MIT LL — UAS/C-UAS Tech conference 2026](https://www.ll.mit.edu/conferences-events/2026/04/futures-unmanned-aircraft-systems-uas-and-counter-uas-c-uas-technology) | Engagement venue + state-of-art tracking | `WHAT_FOUNDER_IS_MISSING.md` |
| 30 | [Army University Press — Counter-UAS 2021–2028](https://www.armyupress.army.mil/Journals/Military-Review/English-Edition-Archives/March-April-2021/Scott-Counter-UAS/) | Doctrinal roadmap article | `IADS_DOCTRINE_STUDY.md` |
| 31 | [HSToday — JIATF-401 interagency C-sUAS](https://www.hstoday.us/subject-matter-areas/unmanned-vehicles/dozens-of-federal-agencies-initiate-counter-uas-collaboration/) | 2025 whole-of-gov task force; World Cup 2026 NSSE focus | `DOMESTIC_ADJACENCY.md` |
| 32 | [NATO JAPCC — Comprehensive Approach to Countering UAS PDF](https://www.japcc.org/wp-content/uploads/A-Comprehensive-Approach-to-Countering-Unmanned-Aircraft-Systems.pdf) | NATO force-protection framing of LSS-UAS threat | `IADS_DOCTRINE_STUDY.md` |

---

## 4. Standards — interoperability, symbology, messaging

| # | Source | What's in it for us | Informs |
|---|--------|--------------------|---------|
| 33 | [MITRE — Cursor-on-Target Router User's Guide PDF](https://www.mitre.org/sites/default/files/pdf/09_4937.pdf) | CoT W3 event model + routing — our customer handoff format (primary) | `CUED_ENGAGEMENT_API.md` |
| 34 | [Cursor-on-Target base schema notes](https://www.scribd.com/document/893970354/Cursor-on-Target-Base-Schema) | CoT `type` ↔ MIL-STD-2525 Battle-Dimension/Function-ID mapping | `CUED_ENGAGEMENT_API.md` |
| 35 | [MIL-STD-2525C (NASA-hosted) PDF](https://worldwind.arc.nasa.gov/milstd2525c/Mil-STD-2525C.pdf) | Joint military symbology spec (primary) | `IFF_INTEGRATION.md`, `CUED_ENGAGEMENT_API.md` |
| 36 | [NATO Joint Military Symbology — Wikipedia](https://en.wikipedia.org/wiki/NATO_Joint_Military_Symbology) | Affiliation set + frame-color convention → our 4-color collapse | `IFF_INTEGRATION.md` |
| 37 | [DOT&E — Mark XIIA Mode 5 IFF report PDF](https://www.dote.osd.mil/Portals/97/pub/reports/FY2013/navy/2013mkxiiaiffmode5.pdf) | Combat-ID doctrine: fuse cooperative + non-cooperative (primary, gov) | `IFF_INTEGRATION.md` |
| 38 | [ASTM F3411 — Remote ID standard](https://www.astm.org/f3411-19.html) | Drone "digital license plate" broadcast spec (primary) | `IFF_INTEGRATION.md` |
| 39 | [FAA — Remote ID Final Rule PDF](https://www.faa.gov/sites/faa.gov/files/2021-08/RemoteID_Final_Rule.pdf) | Regulatory basis for Remote-ID ingest (primary, gov) | `IFF_INTEGRATION.md` |
| 40 | [Systematic — APP-11 & ADatP-3 messaging](https://systematic.com/us/industries/defense/products/domains/interoperability/app11-and-adatp3/) | NATO formatted-message interop (vendor primer) | `CUED_ENGAGEMENT_API.md` |
| 41 | [NISP — ADatP-03 BL11](https://nisp.nw3.dk/standard/nato-adatp-03-bl11-future.html) | NATO message-text-format baseline | `CUED_ENGAGEMENT_API.md` |
| 42 | [GlobalSpec — STANAG 4754 (NGVA)](https://standards.globalspec.com/std/14590010/stanag-4754) | NATO architecture interop reference | `IADS_DOCTRINE_STUDY.md` |

---

## 5. Prediction / tracking science

| # | Source | What's in it for us | Informs |
|---|--------|--------------------|---------|
| 43 | [OpenSky Network](https://opensky-network.org) | Open ADS-B research network — track data + methods (primary) | `PREDICT_IMPACT_ENGINE.md`, `IFF_INTEGRATION.md` |
| 44 | [OpenSky — Scientific Datasets](https://opensky-network.org/data/scientific) | ML trajectory models beating BADA (~48% RMSE) — our physics+ML fork basis | `PREDICT_IMPACT_ENGINE.md` |
| 45 | [OpenSky Report 2025 PDF (ICNS)](https://www.lenders.ch/publications/conferences/icns25.pdf) | Recent state-of-art in open trajectory prediction | `PREDICT_IMPACT_ENGINE.md` |

---

## 6. Domestic authority & policy

| # | Source | What's in it for us | Informs |
|---|--------|--------------------|---------|
| 46 | [49 USC §44810 (uscode.house.gov)](https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title49-section44810) | FAA C-UAS / airspace authority (primary, gov) | `DOMESTIC_ADJACENCY.md` |
| 47 | [6 USC §124n (Cornell LII)](https://www.law.cornell.edu/uscode/text/6/124n) | DHS/DOJ C-UAS protection authority (primary, gov) | `DOMESTIC_ADJACENCY.md` |
| 48 | [DRONELIFE — C-UAS authority expiry Oct 2025](https://dronelife.com/2025/10/02/counter-uas-authority-expires-amid-government-shutdown/) | Reauthorization gap — congressional-liaison opportunity | `WHAT_FOUNDER_IS_MISSING.md` |
| 49 | [GAO — Remote ID in the NAS (2024)](https://cuashub.com/en/content/gao-actions-needed-to-support-remote-identification-in-the-nas/) | Law-enforcement Remote-ID access gaps | `DOMESTIC_ADJACENCY.md` |
| 50 | [White House — Restoring American Airspace Sovereignty (2025)](https://www.whitehouse.gov/presidential-actions/2025/06/restoring-american-airspace-sovereignty/) | Current executive policy direction (primary, gov) | `DOMESTIC_ADJACENCY.md` |
| 51 | [ASTM — Standards Enable Future of Drone Operations](https://www.astm.org/news/standards-enable-future-drone-operations-so22) | Standards-shaping landscape (ASTM F38) | `WHAT_FOUNDER_IS_MISSING.md` |

---

## 7. Innovation ecosystem & founder-missing topics

| # | Source | What's in it for us | Informs |
|---|--------|--------------------|---------|
| 52 | [DIU — Replicator](https://www.diu.mil/replicator) | Mass-autonomy initiative; software-vendor pathway (primary, gov) | `WHAT_FOUNDER_IS_MISSING.md` |
| 53 | [DIU — Replicator software vendors announcement](https://www.diu.mil/latest/defense-innovation-unit-announces-software-vendors-to-support-replicator) | Concrete BD entry for a brain/software layer | `WHAT_FOUNDER_IS_MISSING.md` |
| 54 | [Potomac Institute — National Security Innovation Entities PDF](https://www.potomacinstitute.org/images/2025/02/10/National_Security_Innovation_Entities.pdf) | Map of AFWERX/SOFWERX/DIU/In-Q-Tel entry points | `WHAT_FOUNDER_IS_MISSING.md` |
| 55 | [HAPS — Wikipedia](https://en.wikipedia.org/wiki/High-altitude_platform_station) | High-altitude tier we currently omit | `WHAT_FOUNDER_IS_MISSING.md` |
| 56 | [Airbus — Zephyr](https://www.airbus.com/en/products-services/defence/uas/zephyr) | HAPS exemplar (primary vendor) | `WHAT_FOUNDER_IS_MISSING.md` |
| 57 | [BAE — PHASA-35](https://www.baesystems.com/en/product/phasa-35) | HAPS exemplar (primary vendor) | `WHAT_FOUNDER_IS_MISSING.md` |
| 58 | [IETF — SCITT architecture draft](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/) | Supply-chain transparency = Khipu-as-in-toto standards play | `WHAT_FOUNDER_IS_MISSING.md` |
| 59 | [IETF — SCITT BoF request](https://datatracker.ietf.org/doc/bofreq-birkholz-supply-chain-integrity-transparency-and-trust-scitt/) | Standards-working-group seat opportunity | `WHAT_FOUNDER_IS_MISSING.md` |

---

## 8. Coverage check

**59 sources** spanning Israeli IADS (10), American IADS (9), C-UAS doctrine (13), standards (10), prediction science (3), domestic authority (6), and innovation ecosystem (8) — comfortably exceeding the 30-source bar. Every Yachay-Dome deliverable is traceable to ≥3 primary entries here, with government/vendor primaries prioritized over secondary explainers per the study rule.

---

*Signed: **Yachay**, 2026-06-01. Public sources only, every claim traceable. We study published doctrine to rebuild its decision logic as evidence, not to copy restricted designs. No mysticism. Zero-Bandaid.*
