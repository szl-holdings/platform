# WHAT THE FOUNDER IS MISSING — Honest Gap Analysis

> **Author:** Yachay · **Date:** 2026-06-01 · **Component of:** Yachay-Dome (strategic critique).
> **Founder directive (2026-06-01):** *"America has it and the Israelites have the dome. I want all of the dome
> and take from it and make it our own and bake into a11oy brain and the drone flag — if someone comes close and
> not an ally we hack it or innovate and evolve. What am I missing?"*
> **This is the honest answer.** 15 gaps, each with the fix and the public evidence. The first one corrects the
> directive itself: **we do not hack. We sense, we evidence, the customer acts.** That is not a limitation — it is
> the moat. Everything below builds from that.

---

## 0. The directive's one wrong word — "we hack it"

The single most important correction: **a commercial product hacking an adversary drone is illegal and uninsurable.** Domestic counter-UAS mitigation — jamming, hacking, kinetic — "may be restricted or prohibited by existing federal laws such as the Aircraft Sabotage Act or the Computer Fraud and Abuse Act," and only **four federal agencies (DoD, DOE, DOJ, DHS) are authorized to deploy counter-UAS technologies** ([GAO Counter-Drone Technologies](https://news.usni.org/2022/03/24/gao-report-on-counter-drone-technologies)). SZL is none of those. So the product is the **detection + analysis + auditable Body-of-Evidence layer**; the .mil/.gov customer with Title 10/50 authority does the jamming/hacking/intercept. We deliver Khipu-receipted target packages (`cuas/LEGAL_CYBER_BOUNDARY.md`, `CUED_ENGAGEMENT_API.md`). **Reframe "we hack it" → "we hand the authorized customer a signed cue and they act."** This is gap #0 because it reframes all fifteen.

---

## 1. The fifteen gaps

### Gap 1 — Directed-energy *attack-detection* (not DE delivery)
DE weapons are export-controlled and a customer-effector function, so we don't build them. But we *can* lawfully **detect and characterize a DE engagement environment** (laser/HPM signatures) as another sensor input — useful for the customer's own battle-damage and ROE picture. **Fix:** add a DE-environment detection modality to `DETECTION_LAYERS.md` (passive, receive-only — keystone preserved).

### Gap 2 — Cyber-EW fusion via *carrier cooperation*, never interception
The directive's instinct (use the RF/cellular channel) is right; the method must be lawful. We do **not** intercept SS7 or cell-modem traffic. We **fuse carrier-provided indicators** (a cooperating MNO flagging an anomalous cell-modem-piloted drone) with our RF detections — with the carrier's consent and a contract. **Fix:** define a `carrier_indicator` source class in `IFF_INTEGRATION.md`'s non-cooperative inputs, gated behind a cooperation agreement.

### Gap 3 — Lawfare-grade Body-of-Evidence (court-admissible Khipu DAG)
The biggest under-exploited asset. A signed, Merkle-DAG, timestamped chain of *who knew what when* is admissible evidence — for prosecution, IG inquiry, or insurance. Tie this to the IETF **SCITT** supply-chain-transparency standard so the receipts are interoperable, not bespoke ([IETF SCITT architecture draft](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/); [SCITT BoF](https://datatracker.ietf.org/doc/bofreq-birkholz-supply-chain-integrity-transparency-and-trust-scitt/)). **Fix:** serialize Khipu receipts as in-toto/SCITT attestations (echoes the sibling UDS PONDER proposal); make "court-admissible" an explicit product claim.

### Gap 4 — Maritime adjacency (drone boats)
The threat is no longer only aerial — Houthi and Ukrainian operations have made **uncrewed surface vessels** a primary threat. The same detect-classify-cue pipeline applies to drone boats threatening ports/LNG/cargo (`DOMESTIC_ADJACENCY.md` maritime row). **Fix:** a Killinchu **naval mode** — same four-color gate, same `/v1/cue`, surface-track kinematics; sells to USCG and port authorities.

### Gap 5 — High-altitude platform (HAPS) tier
Yachay-Dome's threat tiers stop at conventional UAS groups; we omit the **stratospheric tier** (Airbus Zephyr, BAE PHASA-35), which is both a threat surface and a *sensor opportunity* ([HAPS — Wikipedia](https://en.wikipedia.org/wiki/High-altitude_platform_station); [Airbus Zephyr](https://www.airbus.com/en/products-services/defence/uas/zephyr); [BAE PHASA-35](https://www.baesystems.com/en/product/phasa-35)). **Fix:** add a T-HAPS tier and a HAPS-hosted persistent-sensor concept.

### Gap 6 — GREENE-NETWORK pivot (the warm-path BD)
Our backer Andrew Greene is a **named co-founder of Defense Unicorns** (per the sibling UDS analysis), which collapses the BD path to a warm co-founder intro. Beyond that, the entry points are mapped: **DIU Replicator** (which explicitly onboards software vendors), AFWERX, SOFWERX, In-Q-Tel ([DIU Replicator](https://www.diu.mil/replicator); [DIU Replicator software vendors](https://www.diu.mil/latest/defense-innovation-unit-announces-software-vendors-to-support-replicator); [Potomac Institute — National Security Innovation Entities](https://www.potomacinstitute.org/images/2025/02/10/National_Security_Innovation_Entities.pdf)). **Fix:** sequence the Greene intro → DIU Replicator software-vendor track → AFWERX/SOFWERX SBIR.

### Gap 7 — Standards-shaping seat (own the format, own the market)
If our cue format becomes *the* interoperable evidence standard, every vendor integrates around us. The venues exist: **IETF SCITT WG**, **OASIS**, **ASTM F38** (drones), and the **NATO STANAG** message-format bodies ([IETF SCITT](https://datatracker.ietf.org/doc/draft-ietf-scitt-architecture/); [ASTM — Standards Enable Future of Drones](https://www.astm.org/news/standards-enable-future-drone-operations-so22)). **Fix:** take an editor/contributor seat; propose Khipu-as-attestation + the `/v1/cue` CoT profile as standards.

### Gap 8 — Academic / national-lab partnerships
Credibility and talent flow through the labs already doing urban C-UAS: **MIT Lincoln Laboratory** (urban C-UAS operational prototype, Small-UAS Initiative), plus JHU APL, Sandia, INL ([MIT LL Urban Counter-UAS](https://www.ll.mit.edu/r-d/projects/urban-counter-uas-operational-prototype); [MIT LL Small UAS Initiative](https://www.ll.mit.edu/r-d/projects/small-uas-initiative)). MIT LL even runs a 2026 UAS/C-UAS technology conference ([MIT LL UAS/C-UAS conference 2026](https://www.ll.mit.edu/conferences-events/2026/04/futures-unmanned-aircraft-systems-uas-and-counter-uas-c-uas-technology)). **Fix:** a CRADA or conference presence to validate the predict-impact + fusion methods.

### Gap 9 — Blue-on-blue (fratricide) tripwire
The IADS doctrine's hardest failure mode is fratricide. Our two-source + Yuyay gate (`IFF_INTEGRATION.md`) mitigates it, but we should make a **dedicated HUKLLA tripwire** that fires (and blocks any cue) when an own/ally Mode 5/DICE signal is *anywhere near* a candidate hostile track. Mode 5 itself exists precisely "to reduce the possibility of fratricide" ([DOT&E Mark XIIA Mode 5 IFF](https://www.dote.osd.mil/Portals/97/pub/reports/FY2013/navy/2013mkxiiaiffmode5.pdf)). **Fix:** add tripwire T-FRAT to the HUKLLA set; a cue near a friendly signal degrades to UNKNOWN.

### Gap 10 — Congressional liaison (the authority is a cliff)
Federal C-UAS mitigation authority **expired in October 2025** ([DRONELIFE — C-UAS authority expires](https://dronelife.com/2025/10/02/counter-uas-authority-expires-amid-government-shutdown/)). Reauthorization of **6 USC §124n** is recurring legislative work, and CRS keeps raising interagency-coordination questions ([CRS via USNI](https://news.usni.org/2025/04/01/report-to-congress-on-dod-counter-unmanned-aircraft-systems); [6 USC §124n](https://www.law.cornell.edu/uscode/text/6/124n)). **Fix:** a liaison posture that positions detection-and-evidence as the *authority-independent* layer every reauthorization debate needs — and stays sold through every lapse.

### Gap 11 — Swarm-scale fusion (the real near-term threat)
Single-track logic is necessary but insufficient; the demonstrated threat is **swarms** ([Army.mil — JCO swarm demo](https://www.army.mil/article/278404/); [DoD C-sUAS Strategy](https://media.defense.gov/2021/Jan/07/2002561080/-1/-1/0/DEPARTMENT-OF-DEFENSE-COUNTER-SMALL-UNMANNED-AIRCRAFT-SYSTEMS-STRATEGY.pdf)). Our predict-impact + cue must scale to **N concurrent tracks with shared-intent inference** (is this one swarm or twenty independents?). **Fix:** add swarm-clustering to `PREDICT_IMPACT_ENGINE.md` and a batched-cue mode to `/v1/cue`.

### Gap 12 — Interagency common-picture interoperability
JIATF-401's stated problem is sensors from many agencies passing tracks to decision-makers across boundaries ([HSToday — JIATF-401](https://www.hstoday.us/subject-matter-areas/unmanned-vehicles/dozens-of-federal-agencies-initiate-counter-uas-collaboration/)). IBCS's "any-sensor / any-shooter" single integrated picture is the model ([Northrop IBCS](https://www.northropgrumman.com/what-we-do/missile-defense/integrated-battle-command-system-ibcs)). **Fix:** position `/v1/cue` (CoT-native, 2525-correct) as the **neutral cross-agency evidence bus** — the thing that rides *between* agency BMC4Is.

### Gap 13 — The 2026 World Cup as a beachhead
The 2026 FIFA World Cup is a designated **National Special Security Event** and an explicit JIATF-401 priority ([HSToday — JIATF-401](https://www.hstoday.us/subject-matter-areas/unmanned-vehicles/dozens-of-federal-agencies-initiate-counter-uas-collaboration/)). GAO already names "security at sports championships" as an authorized C-UAS circumstance ([GAO](https://news.usni.org/2022/03/24/gao-report-on-counter-drone-technologies)). **Fix:** target a venue/host-city detection-and-evidence deployment as a flagship reference; near-term, dated, high-visibility.

### Gap 14 — Test & evaluation credibility (DOT&E posture)
Defense buyers trust independently tested systems; DOT&E publishes exactly what fails ([DOT&E FY2025 IFPC report](https://www.dote.osd.mil/Portals/97/pub/reports/FY2025/army/2025ifpc.pdf)). Our honest LOCKED numbers (749 declarations / 14 axioms / 163 sorries, SLSA L1, DSSE-placeholder signing) are a *credibility asset* if we publish a test plan and own the gaps. **Fix:** a public-facing T&E/verification posture (LAKE_TEST_PLAN-style) that turns honesty about `sorry`-tagged obligations into a trust differentiator.

### Gap 15 — Insurance / actuarial product wrapper
A court-admissible BoE chain (Gap 3) plus a quantified false-positive/false-negative rate makes Yachay-Dome **underwritable** — facilities could insure against drone incidents *because* the evidence and detection rates are auditable. No competitor frames detection-as-evidence as an actuarial instrument. **Fix:** a metrics-publishing discipline (detection P_d, false-alarm rate per `DETECTION_LAYERS.md`) packaged for insurers.

---

## 2. Priority ranking

| Priority | Gap | Why now |
|----------|-----|---------|
| **P0** | #0 reframe ("we don't hack"), #3 lawfare BoE, #6 Greene/DIU BD | Series-A narrative + legal survival + warm path |
| **P1** | #9 fratricide tripwire, #11 swarm, #13 World Cup, #12 cross-agency bus | Near-term technical + flagship deal |
| **P2** | #7 standards seat, #8 lab partnerships, #4 maritime | Moat-building, 6–18 mo |
| **P3** | #1 DE-detect, #2 carrier fusion, #5 HAPS, #10 congressional, #14 T&E, #15 insurance | Differentiation + durability |

---

## 3. The one-sentence answer to the founder

You are missing that **the dome's genius was never the interceptor — it was the decision to act only on a predicted threat to a defended thing, with positive ID, fully recorded** ([CSIS Iron Dome](https://missilethreat.csis.org/defsys/iron-dome/); [Northrop IBCS](https://www.northropgrumman.com/what-we-do/missile-defense/integrated-battle-command-system-ibcs)) — so the part worth owning, the part that is lawful, durable, and ours, is **that brain and its evidence**, not the trigger, and the way to win is to make our signed cue the interoperable standard every authorized mitigator plugs into.

---

*Signed: **Yachay**, 2026-06-01. The honest gaps, the lawful fixes, the warm path. We sense, we evidence, the customer acts — and that is the moat, not the limit. No mysticism. Zero-Bandaid.*
