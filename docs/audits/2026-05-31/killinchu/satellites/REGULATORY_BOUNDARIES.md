# REGULATORY BOUNDARIES — satellite-fed drone tracking, legal vs. not

**Author:** Yachay-extension · 2026-05-31
**Entity assumed:** SZL Holdings — a commercial entity incorporated in New York (US person/company for export-control purposes).
**Scope:** What we can legally *build*, *operate*, and *sell to whom* when aggregating satellite/RF data into Killinchu. This is an engineering-grade compliance map, **not legal advice** — engage export counsel before any government or foreign sale.

---

## TL;DR decision table

| Activity | Legality for SZL (US commercial entity) | Controlling regime |
|---|---|---|
| Buy commercial imagery/SAR/RF data via API and display it | **Legal** | Vendor's own remote-sensing license (NOAA/CRSRA); data is the vendor's to sell |
| Build software that aggregates + visualizes that data (Killinchu) | **Legal**; most likely **EAR99 or CCL**, not ITAR, IF kept commercial-grade and not built to mil-spec | EAR |
| **Receive** RF passively (FCC Part 15 receiver) on the ground | **Legal** — receivers are largely unlicensed | FCC Part 15 |
| **Transmit** (jam, spoof, or actively interrogate a drone) | **ILLEGAL without authorization** — including any counter-UAS jamming | FCC; 18 U.S.C.; Wireless |
| Sell Killinchu (commercial SaaS) to US commercial customers | **Legal** | EAR; license terms |
| Sell to US Government (DoD/IC) | **Legal**, via acquisition (EOCL/SCE/SBIR/CRADA) | FAR/DFARS + clearances |
| Sell/export to foreign customers | **Conditional** — depends on classification (EAR99 vs CCL vs ITAR) and destination | EAR/ITAR screening required |
| Add fire-control / weapon-cueing / mil-spec targeting | **Likely ITAR USML** — do NOT build without DDTC registration | ITAR |

---

## 1. ITAR — 22 CFR §121.1, USML Category XV (Spacecraft)

- The **U.S. Munitions List (USML)** is codified at **22 CFR §121.1**; **Category XV covers spacecraft and related articles** ([State/DDTC 22 CFR Part 121 notice PDF](https://www.pmddtc.state.gov/sys_attachment.do?sys_id=8864e39ddb9ddf00d0a370131f961983)). Items on the USML require DDTC registration and licensing to export; "defense services" (technical assistance to foreign persons) are also controlled.
- In the 2014–2017 reform, many *commercial* remote-sensing satellites moved **off the USML to the EAR's "500-series" ECCNs (9A515 etc.)**, while **software source code or commands that control a spacecraft/payload remain controlled** under USML XV(f) / ECCN 9D515 / 9E515 ([Federal Register 2016-31751 on USML XV vs 9x515](https://www.govinfo.gov/content/pkg/FR-2017-01-10/html/2016-31751.htm)).
- **What this means for Killinchu:** We **do not build, own, or operate spacecraft** — we consume *data products* from licensed operators. That keeps us off USML Cat XV almost entirely. The ITAR trap is **if we build spacecraft-command software, mil-spec targeting, or provide defense services to foreign persons.** We avoid all three. Killinchu is a *ground-segment data aggregation + visualization* app.
- **Hard line:** the moment Killinchu produces *weapon-cueing / fire-control* outputs (vs. situational awareness), reclassification toward USML (and toward Category VIII/XII targeting electronics) becomes a live risk. Keep Killinchu as **decision-support / SA**, not targeting.

## 2. EAR — EAR99 vs CCL (the regime we actually live in)

- Most commercial software that is not specially designed for military end-use falls under the **Export Administration Regulations (EAR)**, classified either as **EAR99** (low-control catch-all) or on the **Commerce Control List (CCL)** under a specific ECCN.
- **Geospatial-imagery analytics software** can implicate **ECCN 0Y521 / 9x515 / 0E521** depending on capability; plain visualization/aggregation is frequently **EAR99**. The classification turns on *what the software is designed to do*, not what data it shows.
- **Action:** obtain a formal **CCATS / self-classification** for Killinchu before any export. Assume **EAR99 best case, CCL (e.g., 9x515-adjacent) if it ingests 500-series-controlled data products or adds advanced fusion.** Screen all foreign customers against **Entity List / denied parties / embargoed destinations** (no Cuba, Iran, North Korea, Syria, Russia, Crimea/DNR/LNR, etc.).

## 3. Wassenaar Arrangement — Category 5 Part 2 ("intrusion software" / surveillance)

- Wassenaar's dual-use **Category 5 – Part 2 ("Information Security")** and the **2013 "intrusion software" + IP-network-surveillance** additions control software designed to defeat protective measures to extract data, and IP surveillance systems — intended to stop sale of surveillance tech to human-rights-abusing governments ([Wikipedia Wassenaar summary of 2013 intrusion-software amendment](https://en.wikipedia.org/wiki/Wassenaar_Arrangement); [Wassenaar 2023 control list PDF](https://www.wassenaar.org/app/uploads/2023/12/List-of-Dual-Use-Goods-and-Technologies-Munitions-List-2023-1.pdf)).
- **What this means for Killinchu:** As long as Killinchu is **passive aggregation of lawfully-purchased observation data** — it does **not** intrude into target systems, does not exfiltrate data from a drone, does not defeat protective measures — it should **not** be "intrusion software" under Cat 5 Pt 2. The risk line is if we ever add **active RF exploitation, signal injection, or network intrusion against the drone's link**. We don't.
- The US implements relevant Wassenaar controls through the **EAR CCL Category 5 Part 2 (encryption ECCNs 5A002/5D002 etc.)** — so a strong-crypto component in Killinchu (e.g., the Khipu DSSE signing, TLS) may pull encryption-classification/notification obligations. Standard, well-trodden: file the **encryption self-classification / notification** if needed.

## 4. Remote ID rule — FAA 14 CFR Part 89

- The FAA **Remote ID Final Rule** (RIN 2120-AL31) requires US-airspace unmanned aircraft to broadcast identification, location, performance, control-station location, time mark, and emergency status; codified at **14 CFR Part 89** ([FAA Remote ID Final Rule PDF](https://www.faa.gov/sites/faa.gov/files/2021-08/RemoteID_Final_Rule.pdf); [eCFR 14 CFR Part 89](https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-89)).
- It is **broadcast-only** (the network/USS internet-transmission requirement was eliminated). UAS without RID equipment may only fly **within VLOS inside an FAA-Recognized Identification Area**. **US Government aircraft are excepted.**
- **What this means for Killinchu:** **Receiving and parsing the public RID broadcast is legal** (it's a public broadcast). Killinchu's RID parser (already planned in the Wamani pivot) is on solid ground. The **counter-UAS value is the "RID-off" detection**: an airborne RF emitter with *no* corresponding RID broadcast is the dark-drone signal — exactly the dark-vessel→dark-drone analog. We **detect and report**; we do **not** transmit/jam (that's §5).
- Honest caveat: BVLOS authority for *our own* drones comes from *other* FAA rules (Part 107 waiver / Part 91), not Part 89 — see Starlink backhaul doc.

## 5. FCC — Part 15 receivers vs. transmitters (the bright line)

- **Receiving** RF is broadly permissible: FCC **Part 15** governs unlicensed devices and passive reception. Killinchu's ground RF/Remote-ID receivers are fine.
- **Transmitting to interfere** — jamming, spoofing, or actively interrogating a drone — is **illegal** in the US. The FCC is explicit that **operation/marketing/sale of jammers is prohibited**, and federal law bars willful interference. **Even law enforcement** generally cannot use RF counter-UAS jamming without specific federal authorization (limited statutory authority sits with **DoD, DOE, DHS, DOJ** under specific counter-UAS statutes — not commercial entities).
- **Hard line for SZL:** Killinchu **never transmits a countermeasure.** It is a **detect / classify / cue** system. Any "HALT" action in the counter-UAS rule engine is a **policy signal to authorized operators / the a11oy gate**, not an RF transmission. Marketing Killinchu as a "jammer" or bundling a transmit-capable mitigation effector would cross into prohibited territory and (for export) toward USML. We sell **sensing + decision support**, full stop.

---

## 6. What SZL (NY commercial entity) can sell, to whom

| Customer | Can we sell Killinchu? | Conditions |
|---|---|---|
| **US commercial** (ports, airports, critical infra, event security) | **Yes** | Standard SaaS EULA; data sublicensing must respect each vendor's redistribution terms (Maxar/Planet/HawkEye license rights). Detect-only; no transmit. |
| **US state/local law enforcement** | **Yes for sensing/SA** | They may not jam without federal authority; sell them detection, not mitigation. |
| **US Government (DoD/IC)** | **Yes**, via acquisition | EOCL/SCE/SBIR/CRADA pathways; FAR/DFARS; facility/personnel clearances if classified; possible FOCI review. |
| **Allied foreign government** | **Conditional** | Requires export classification (EAR99/CCL) + license; if any ITAR-controlled component, DDTC license. Screen destination. |
| **Foreign commercial** | **Conditional** | EAR classification + denied-party/embargo screening; respect data vendors' export restrictions (some imagery is export-controlled by the operator). |
| **Embargoed / sanctioned destinations** | **No** | Prohibited (Cuba, Iran, DPRK, Syria, Russia, Crimea/DNR/LNR, etc.). |

### Data-redistribution caveat (often missed)
Even when *we* are export-clear, the **upstream data vendors' license terms govern what we may redistribute.** BlackSky/Maxar/Planet/HawkEye each restrict downstream sharing, government-vs-commercial use, and resolution/derivative rights (see BlackSky General Terms; Maxar/Planet EULAs). Killinchu must **enforce per-vendor license scope at the Adapter layer** (tag each Observation with its license class and gate redistribution accordingly). The Khipu receipt is the natural place to record the governing license per Observation.

---

## 7. Compliance design rules baked into Killinchu
1. **Detect-only, never transmit.** No jamming/spoofing/active interrogation. HALT = policy signal, not RF.
2. **Decision-support, not targeting.** Keep outputs as situational awareness to avoid USML reclassification.
3. **Passive aggregation, no intrusion.** Stay clear of Wassenaar Cat 5 Pt 2 intrusion-software scope.
4. **License-tag every Observation.** Enforce upstream vendor redistribution scope at the Adapter; record in Khipu.
5. **Classify before export.** CCATS/self-classification (assume EAR99 best case); screen all parties; government access only via proper acquisition vehicles.
6. **Encryption notification.** The DSSE/TLS crypto may trigger EAR encryption self-classification/notification — file it.

**Bottom line:** A NY commercial entity can lawfully build and sell Killinchu **as a passive, detect-and-cue, decision-support aggregator** to US commercial, US government (via acquisition), and (with classification + screening) allied buyers. It **cannot** lawfully sell an RF countermeasure/jammer, cannot provide mil-spec targeting/defense services to foreign persons without ITAR licensing, and cannot ship to embargoed destinations. Stay on the sensing side of the line and the regulatory posture is clean.

— Yachay-extension
