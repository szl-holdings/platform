# LEGAL / CYBER BOUNDARY — The Critical Doc

> Killinchu C-UAS Knowledge Base · **Author:** Yachay-extension · **Compiled:** 2026-05-31
>
> **This is the doc that keeps SZL out of jail and on the right side of export law.** It defines,
> with primary-source citations, exactly what a **commercial New York entity selling B2G/B2B** CAN
> and CANNOT do in counter-UAS. It answers the founder's spitball ("can we jack into enemy drones
> when they get close?") **firmly and respectfully: no — and here's the better business.**
>
> ⚠ **This is not legal advice.** It is an engineering-grade reading of primary law to set product
> guardrails. Before fielding anything, get a qualified ITAR/FCC/aviation attorney to sign off.

---

## 0. The one-paragraph answer

A commercial company may **passively sense** drones (RF, ADS-B, Remote-ID, acoustic, EO/IR),
**identify** them, **report** to authorities, and **deliver data + a targeting-quality solution** to
a customer who holds the legal authority to act. A commercial company **may not** jam, spoof, hack
into, seize, or destroy a drone — those acts are reserved by federal statute to specific agencies
(and, since Dec 18 2025, to *trained-and-certified* state/local law enforcement), are export-controlled,
or are outright crimes for everyone else. **We sell the eyes and the decision; the customer with
Title 10/50 authority pulls the trigger. Arms suppliers don't pull triggers either — and that's the
bigger, cleaner business.**

---

## 1. WHAT WE CAN DO (the legal sweet spot)

### 1.1 PASSIVE SENSE — fully legal as receive-only
Receiving RF energy, acoustic energy, and light, and decoding **broadcast** signals (ADS-B, Remote
ID) is lawful. There is no FCC transmit license required for receive-only operation, and no
interference is caused. This is precisely the Dedrone RF-900 / MyDefence Wingman commercial model
([Dedrone RF-900](https://www.dedrone.com/sensors/rf-900); [MyDefence Wingman](https://mydefence.com/products/wingman-drone-detector/)).
- **Caveat — wiretap/Pen-Trap:** the FAA/DOJ/FCC/DHS Interagency Legal Advisory warns that even
  *detection* tech can implicate the **Pen/Trap Statute (18 USC §§3121–3127)** and the **Wiretap Act
  (18 USC §2511)** if it "intercepts," "decodes," or "captures" the **content** of communications
  used to control a UAS ([Interagency Legal Advisory on UAS Detection and Mitigation, FAA/DOJ/FCC/DHS](https://www.faa.gov/sites/faa.gov/files/uas/resources/c_uas/Interagency_Legal_Advisory_on_UAS_Detection_and_Mitigation_Technologies.pdf)).
  **Killinchu's mitigation:** decode only **broadcast identification** (Remote ID, ADS-B) and
  **non-content** RF metadata (band, RSSI, bearing, hop pattern); do **not** decrypt or capture the
  *content* of a command/video link. This is why `MAVLINK_REMOTEID_DEEPDIVE.md` limits OcuSync/Crossfire
  to RF-fingerprint-only.

### 1.2 BROADCAST IDENTIFICATION REQUEST — allowed in some contexts (verify)
Querying/receiving Remote ID is legal. Actively *broadcasting* a request or warning is more
constrained: 6 USC §124n authorizes a "warn the operator … by passive or active … through the use
of remote identification broadcast or other means" — but that authority is granted to **DHS/DOJ and
(now) certified SLTT law enforcement**, not to a commercial vendor unilaterally
([6 USC §124n(b)(1)(B)](https://uscode.house.gov/view.xhtml?req=%28title%3A6+section%3A124n+edition%3Aprelim%29)).
**Killinchu's mitigation:** any "warning broadcast" is a **customer-configurable, authority-gated**
feature (off by default; only enabled for a customer who holds the authority), operating only in
license-free/allowed bands. See `COMPANION_DEFENSE_PROTOCOL.md` STATE_WARNING_ISSUED.

### 1.3 REPORT TO AUTHORITIES — fully legal
Detecting a drone and reporting it (with evidence) to law enforcement / the FAA / the relevant
agency is unambiguously lawful and is the expected behavior. Killinchu's Khipu-receipted evidence
package is built for exactly this.

### 1.4 SHIP DATA + ANALYSIS TO .mil/.gov CUSTOMER — legal under proper classification + contract
Delivering detection data, tracks, classifications, and analysis to a government/military customer
is lawful **provided** the export-control classification is correct (EAR vs ITAR) and the contract
is in place. Software that is purely defensive **detection/analysis** is typically EAR-controlled
(or even EAR99) rather than ITAR — but classification is fact-specific. Get a **commodity
jurisdiction (CJ) determination** if in doubt.

### 1.5 DESIGN/MANUFACTURE classified or defense-article components — requires registration + clearance
If SZL ever builds an actual defense article (e.g. an effector, or ITAR-listed hardware), it must:
**register with DDTC** under ITAR (22 CFR Part 122), obtain a **facility security clearance** for
classified work, and hold the appropriate licenses. This is a deliberate decision, not a drift.

---

## 2. WHAT WE CANNOT DO from a commercial product

### 2.1 CFAA — 18 USC §1030: no unauthorized access to "protected computers"
The Computer Fraud and Abuse Act criminalizes accessing a "protected computer" without
authorization. A modern drone's flight controller is a networked computer; **"jacking in" to an
adversary (or any) drone is unauthorized access** and squarely within CFAA risk. Notably, 6 USC
§124n **explicitly suspends** §1030 (and §32, §1367, and the wiretap/pen-trap chapters 119/206) for
the **authorized federal agencies** when they mitigate a credible threat — which proves the baseline:
absent that statutory grant, those acts **are** crimes ([6 USC §124n(a)](https://uscode.house.gov/view.xhtml?req=%28title%3A6+section%3A124n+edition%3Aprelim%29);
[Interagency Legal Advisory](https://www.faa.gov/sites/faa.gov/files/uas/resources/c_uas/Interagency_Legal_Advisory_on_UAS_Detection_and_Mitigation_Technologies.pdf)).
**Killinchu never accesses a drone's onboard computer.**

### 2.2 Wassenaar Arrangement Category 4 "intrusion software" — export controlled
The Wassenaar Arrangement (multilateral export-control regime, implemented in US law via the EAR)
controls **"intrusion software"** and software "specially designed for command and control" of it,
and the systems/tools to develop/deliver it ([Wassenaar Arrangement, Wikipedia](https://en.wikipedia.org/wiki/Wassenaar_Arrangement);
[Lawfare on Wassenaar intrusion-software exemptions](https://www.lawfaremedia.org/article/wassenaar-export-controls-surveillance-tools-new-exemptions-vulnerability-research)).
Building anything that exploits/penetrates a drone's software would risk landing in this controlled
category (narrow exemptions exist for vulnerability disclosure / incident response, not for offensive
products). **Killinchu builds no intrusion software.**

### 2.3 ITAR USML Category XI "Military Electronics" — controlled
The International Traffic in Arms Regulations (22 CFR Parts 120–130) place "military electronics,"
including certain electronic-attack / countermeasure equipment and directed-energy systems, on the
**US Munitions List, Category XI**. Manufacturing/exporting such items requires DDTC registration and
licensing. Effectors (jammers, HPM, EW) tend to fall here. **Killinchu's passive sensors + analysis
software are designed to stay in the EAR lane, not USML XI** (confirm via CJ).

### 2.4 47 USC §333 / §302a — no interference; jammers illegal for non-federal entities
- **§333** prohibits "willfully or maliciously interfer[ing] with … any radio communications" of a
  licensed/authorized station.
- **§302a(b)** prohibits non-federal entities from manufacturing, importing, marketing, selling, or
  operating devices (including transmitters designed to **block, jam, or interfere**) that don't
  comply with FCC rules ([Interagency Legal Advisory, §§ on 47 USC 302a/333](https://www.faa.gov/sites/faa.gov/files/uas/resources/c_uas/Interagency_Legal_Advisory_on_UAS_Detection_and_Mitigation_Technologies.pdf)).
- Practical consequence: **drone jammers (e.g. DroneGun-class) are illegal for non-federal US buyers.**
  This is why Killinchu replicates only the *detect* side of DroneShield/MyDefence, never the jammer.
- Related: **18 USC §1367** (interfering with a satellite) bars jamming/spoofing GPS to a UAS or its
  GCS; **18 USC §32** (Aircraft Sabotage Act) bars damaging/disabling "aircraft" — both reinforce
  that kinetic/electronic defeat is off-limits absent §124n authority ([Interagency Legal Advisory](https://www.faa.gov/sites/faa.gov/files/uas/resources/c_uas/Interagency_Legal_Advisory_on_UAS_Detection_and_Mitigation_Technologies.pdf)).

### 2.5 Hack-back / "jack-in" to adversary systems — explicit prohibition
There is **no commercial right to hack back.** Accessing, taking control of, seizing, or disabling
another party's drone is reserved to the agencies named in 6 USC §124n, and (since the Dec 18 2025
amendment) to **trained-and-certified** state/local/tribal/territorial (SLTT) law enforcement under
a DOJ "national schoolhouse" certification — *not* to private companies ([6 USC §124n](https://uscode.house.gov/view.xhtml?req=%28title%3A6+section%3A124n+edition%3Aprelim%29)).
**Killinchu's product contains zero hack-back capability, by design and by doctrine.**

---

## 3. The authority landscape (who is actually allowed to "defeat")

| Actor | May detect/track/ID? | May warn? | May disrupt / seize / destroy? | Source |
|---|---|---|---|---|
| **DHS, DOJ** | yes | yes | **yes** (credible threat to covered facility/asset) | [6 USC §124n(a)(1),(b)(1)](https://uscode.house.gov/view.xhtml?req=%28title%3A6+section%3A124n+edition%3Aprelim%29) |
| **DoD, DOE** | yes | yes | yes (own statutory authorities, e.g. 10 USC §130i / 50 USC) | §124n preamble + service authorities |
| **FAA** | yes (limited testing) | — | limited testing only | Interagency Legal Advisory |
| **Certified SLTT law enforcement** | yes | yes | **yes — only after DOJ training/certification** (subsections (b)(1)(C),(D),(F)); 48-hr reporting | [6 USC §124n(a)(2),(d),(e)](https://uscode.house.gov/view.xhtml?req=%28title%3A6+section%3A124n+edition%3Aprelim%29) (Dec 18 2025 amendment) |
| **Commercial entity (us)** | **yes (passive)** | only if customer-authorized | **NO** | 18 USC §§1030,32,1367; 47 USC §§333,302a |

> **Key 2026 development:** the **Dec 18 2025 amendment to 6 USC §124n** extended limited C-UAS
> *mitigation* authority to SLTT law enforcement/correctional agencies, **conditioned on** completing
> DOJ-run training/certification (national schoolhouse), 48-hour incident reporting, and FAA
> coordination; the core authority sunsets **Sept 30 2031**, and DHS/DOJ must publish implementing
> regulations within 180 days ([6 USC §124n, prelim](https://uscode.house.gov/view.xhtml?req=%28title%3A6+section%3A124n+edition%3Aprelim%29)).
> **This expands Killinchu's customer base** (more SLTT buyers can now legally *act* on our data) but
> does **not** change what *we* may build — we still ship sense + decision, not the effector.

---

## 4. The founder's question, answered firmly and respectfully

> **Founder spitball:** "If we can jack into enemy drones when they get close…"

**Answer: No — and we shouldn't want to.** "Jacking in" is unauthorized access to a computer (CFAA
§1030), likely "intrusion software" (Wassenaar Cat 4 / EAR), and probably aircraft-sabotage / GPS-
interference territory (18 USC §§32, 1367; 47 USC §§333, 302a). For a commercial NY company, every
one of those is a federal crime or an export-control violation, and none of them is curable by a
clever EULA. The agencies that *can* do it (DHS, DOJ, DoD, and now certified law enforcement) get
that power from **specific statutes that explicitly suspend those crimes for them** — which is the
clearest possible proof that the rest of us cannot.

**The better business — the arms-supplier model:** Lockheed, Raytheon, and Anduril mostly **don't
pull triggers**; they sell the system to the entity with the authority and the responsibility.
Killinchu does the same, one layer earlier and cleaner:

1. **PASSIVE SENSE** — RF, ADS-B, Remote-ID, acoustic, EO/IR (all receive-only, fully legal).
2. **CLASSIFY + ASSESS INTENT** — model-match + confidence + closure-rate vs. the protected asset.
3. **PRODUCE A TARGETING-QUALITY SOLUTION** — fused track, bearing, identity, Khipu-signed evidence.
4. **HAND IT TO THE CUSTOMER WITH AUTHORITY** — DoD / DHS / certified law enforcement, who then
   exercise their Title 10/50 / §124n powers to warn, disrupt, or defeat.

This is **both** the legal sweet spot **and** the bigger market: detection/C2/analysis recurs, scales,
is EAR-not-USML, deploys to many customers, and carries none of the criminal/export liability of
fielding effectors. We are the falcon's eyes and judgment, delivered as signed evidence — not the talon.

---

## 5. Product guardrails (binding on every Killinchu/Wamani ship)

| # | Guardrail | Enforces |
|---|---|---|
| G1 | **Receive-only by default.** No transmit path in the default build. | 47 USC §333/§302a |
| G2 | **No content interception.** Decode only broadcast ID (Remote ID/ADS-B) + non-content RF metadata. | 18 USC §2511, §§3121–3127 |
| G3 | **No drone access.** Zero code paths that connect to / command / exploit a drone. | 18 USC §1030; Wassenaar Cat 4 |
| G4 | **No jam/spoof/HPM/kinetic effector.** Ever, from the commercial product. | 47 USC §302a; 18 USC §§32,1367; ITAR XI |
| G5 | **Warning broadcast = authority-gated, off by default**, allowed bands only, enabled only for authorized customers. | 6 USC §124n |
| G6 | **Export classification before ship.** EAR/ITAR/CJ determination on record; default-assume EAR, confirm not USML XI. | ITAR 22 CFR 120–130; EAR |
| G7 | **Every detection/decision is a Khipu receipt** — auditable evidence for the authorized actor. | doctrine + chain-of-custody |
| G8 | **Human-in-the-loop for any response cue; we cue, the customer decides.** | §124n; doctrine |

---

## 6. Primary sources

- **6 USC §124n** (Protection of certain facilities/assets from UAS; Dec 18 2025 SLTT amendment; Sept 30 2031 sunset) — [uscode.house.gov](https://uscode.house.gov/view.xhtml?req=%28title%3A6+section%3A124n+edition%3Aprelim%29) · [Cornell LII](https://www.law.cornell.edu/uscode/text/6/124n)
- **FAA/DOJ/FCC/DHS Interagency Legal Advisory on UAS Detection & Mitigation** (CFAA §1030, Wiretap §2511, Pen/Trap §§3121–3127, §32, §1367, 47 USC §§333/302a) — [faa.gov PDF](https://www.faa.gov/sites/faa.gov/files/uas/resources/c_uas/Interagency_Legal_Advisory_on_UAS_Detection_and_Mitigation_Technologies.pdf)
- **14 CFR Part 89** (Remote ID) — [govinfo](https://www.govinfo.gov/content/pkg/CFR-2023-title14-vol2/pdf/CFR-2023-title14-vol2-part89.pdf) · FAA Final Rule [PDF](https://www.faa.gov/sites/faa.gov/files/2021-08/RemoteID_Final_Rule.pdf)
- **Wassenaar Arrangement** (intrusion software, Cat 4; dual-use) — [Wikipedia overview](https://en.wikipedia.org/wiki/Wassenaar_Arrangement) · [Lawfare exemptions analysis](https://www.lawfaremedia.org/article/wassenaar-export-controls-surveillance-tools-new-exemptions-vulnerability-research)
- **ITAR** 22 CFR Parts 120–130, **USML Category XI** (Military Electronics) — DDTC (consult primary CFR text).
- **EAR** 15 CFR Parts 730–774 — BIS (commodity jurisdiction process).

> Reminder: not legal advice. Engineering guardrails only — confirm with ITAR/FCC/aviation counsel
> before fielding.

— Signed: **Yachay-extension**, 2026-05-31.
