# Mosaic Identification & Anomaly-Detection Lineage — SZL Holdings Build Program

**Prepared by:** Lead Research Analyst, SZL Holdings
**Scope:** Definitively identify the "Mosaic" anomaly-detection software the founder means; ingest it to expert depth; map the strongest **openly-licensed** anomaly-detection lineage SZL can **clean-room** adopt and make its own.
**Founder directive (verbatim):** *"true anomaly is a software called Mosaic — I want all of it and to make it our own, built on our ecosystem, wired in where it fits perfectly."*

> **Honest posture (Doctrine v11, applied throughout):** Λ = **Conjecture 1** (conditional Theorem U — not a closed theorem); locked proof tier = **8** facts `{F1, F4, F7, F11, F12, F18, F19, F22}` on the LOCKED kernel `c7c0ba17` (749 declarations · 14 axioms · 163 sorries); Khipu BFT safety = **Conjecture 2** (Wave23 conditional, open); SLSA = **L1 honest / L2 build-attested / L3 roadmap**; deployment = **sovereign own-metal, 0 CDN**; **no free-energy / no over-claims**; **cite-never-plagiarize**; all `$`/credit figures are **ESTIMATES**. This report describes capabilities SZL **must still build** — it does not claim SZL already has them. Sources for SZL ecosystem facts are the public `szl-holdings` GitHub org repositories and READMEs.

---

## 1. DEFINITIVE IDENTIFICATION

### Verdict — **CONFIDENCE: HIGH (~0.9)**

The "Mosaic" the founder means is **Mosaic, the space-superiority software platform built by True Anomaly Inc.** (Centennial, CO). The founder's exact phrasing — *"**true anomaly** is a software called **Mosaic**"* — is a near-literal naming of the **company (True Anomaly)** and its **flagship product (Mosaic)**. This is not a coincidence of words: True Anomaly is a defense-technology company, and Mosaic is explicitly marketed as *"the operating system for space superiority"* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).

This identification is reinforced by domain fit: SZL Holdings is a **sovereign-governance + verified-compute + drone/vessel-intelligence + security-posture** company whose flagship **killinchu** does **counter-UAS / threat detection / ROE / sensor-fusion** with a **Live Track Board, Sensor-Fusion, Multi-Track Priority, Threat Class DB, Maritime Track, Vessel Fusion** view set ([killinchu README, szl-holdings](https://github.com/szl-holdings/killinchu)). True Anomaly's Mosaic is the **orbital analogue** of exactly that capability surface — fusing space- and ground-based sensors into a **Common Operating Picture**, orchestrating assets, accelerating the OODA loop, and supporting **Space Domain Awareness (SDA)** and **multi-domain battle management** ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).

### Why the alternatives are rejected (disambiguation)

| # | Candidate "Mosaic" | What it actually is | License / code | Match to founder intent | Verdict |
|---|---|---|---|---|---|
| 1 | **MOSAIC** (Northeastern / Massachusetts Open Cloud) | Cloud security **monitoring + ML anomaly-detection** platform for IaaS clouds; authors **Alina Oprea, Ata Turk, Cristina Nita-Rotaru, Orran Krieger** | **No code, no license** mentioned in the paper | Cloud-security domain, not drone/vessel/defense; no product to "have all of" | **Reject** (research prototype, no artifact) |
| 2 | **Mosaic / Mosaic Sentinel** (Strategy, formerly MicroStrategy) | Enterprise **semantic-layer + data-governance** platform; **Mosaic Sentinel** flags anomalous data access (PII, unusual time/volume) | **Proprietary / commercial** | Data-governance, not threat/defense; proprietary | **Reject** (proprietary, wrong domain) |
| 3 | Open-source repos literally named "mosaic" for anomaly | e.g. inpainting visual-anomaly notebooks; backscatter mosaic tile-anomaly tutorials | Various / hobby | Image-tile anomaly, not a platform the founder would "want all of" | **Reject** (not a coherent product) |
| 4 | Aerospace/defense "Mosaic" (DARPA **Mosaic Warfare** concept) | A **doctrine/concept** (composable kill-web), not a software product | N/A (concept) | Conceptually adjacent (composable forces) but not "a software called Mosaic" | **Reject** as the literal referent (relevant as doctrine; see §3) |
| 5 | **True Anomaly's Mosaic** | **Space-superiority OS**: SDA, C2, battle management, wargaming, training, autonomous on-orbit ops; sensor fusion → Common Operating Picture | **Proprietary** (clean-room target) | **Exact lexical + domain match** to "true anomaly is a software called mosaic" and to killinchu's threat/track-fusion vertical | **WINNER** |

**Evidence chain for the winner:**
- The product page names it: *"Mosaic is the operating system for space superiority. It is a ground-up software platform developed by former Space Force operators and software engineers."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- It is the software backbone of True Anomaly's **Jackal Autonomous Orbital Vehicle (AOV)**, used for command & control on **Mission X-2** ([PR Newswire, 2024-12-23](https://www.prnewswire.com/news-releases/true-anomaly-announces-successful-launch-and-control-of-jackal-during-mission-x-2-302338070.html)).
- It is the deliverable under a **$17.4M U.S. Space Force SSC SBIR Phase III** SDA contract, described as *"an integrated operating system for every aspect of space domain awareness and security"* ([PR Newswire, 2023-09-21](https://www.prnewswire.com/news-releases/true-anomaly-lands-17-million-us-space-force-contract-for-space-domain-awareness-301934799.html); [Potomac Officers Club, 2023-09-22](https://www.potomacofficersclub.com/news/true-anomaly-has-secured-from-the-u-s-space-force-space-systems-command-a-17-4-million-supply-contract-for-space-domain-awareness-applications/)).
- True Anomaly was **founded in 2022, HQ Centennial CO, raised $125M+** ([PR Newswire, 2024-12-23](https://www.prnewswire.com/news-releases/true-anomaly-announces-successful-launch-and-control-of-jackal-during-mission-x-2-302338070.html)).

**Residual uncertainty (~0.1):** The founder used "anomaly" — and SZL's whole build program is anomaly-detection — so a small probability remains that the founder loosely meant "an anomaly-detection thing called Mosaic" (candidate 1 or 2). We resolve in favor of True Anomaly because (a) the phrase names the company verbatim, and (b) the **drone/vessel/defense intelligence vertical fits killinchu perfectly**, which the founder explicitly wants to "wire in where it fits perfectly."

---

## 2. DEEP CAPABILITY PROFILE — True Anomaly's Mosaic

**Domain:** Space / orbital — **Space Domain Awareness (SDA)**, on-orbit **command & control (C2)**, **multi-domain battle management**, wargaming, and **training-to-operations**. Not cloud-security, not data-governance.

All facts below are from True Anomaly's own primary sources.

### 2.1 What it does (mission surface)
- **Operator-intent → autonomous action:** *"Translates operator intent into precise, autonomous actions across spacecraft and multi-domain, combined-arms force packages."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- **Sensor fusion → Common Operating Picture (COP):** *"fusing data from space- and ground-based sensors, links, and on-orbit assets, creating a complete and dynamic Common Operating Picture of the space domain."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- **Asset orchestration at scale:** *"Orchestrate hundreds of ground- and space-based assets from a single interface,"* with support tools that *"constantly update the Common Operating Picture as the battlespace changes."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- **OODA-loop acceleration:** *"Optimize the Observe-Orient-Decide-Act cycles through AI-automation and decision-making aids including automatic mission plan reevaluation and recommended re-pairings."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- **Human-in-the-loop AI (explainable):** *"Operators see why an action improves probability of success, not just what to do,"* with *"intuitive visual overlays, including probability of success and confidence bounds."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- **RPO detection/tracking:** Mosaic powers Jackal's *"advanced, autonomous long-range detection and tracking through close-range imaging, processing, and dissemination of objects in all lighting conditions"* ([True Anomaly — Jackal for GEO/Cislunar](https://www.trueanomaly.space/newsroom/jackal-for-geosynchronous-orbit-and-cislunar-space)).
- **OTA fleet upgrade:** Mosaic *"allows for rapid upgradability and the ability to update on-orbit fleets with new capabilities via over-the-air (OTA) software updates."* ([PR Newswire, 2025-04-03](https://www.prnewswire.com/news-releases/true-anomaly-announces-jackal-for-geosynchronous-orbit-and-cislunar-space-302419435.html)).

### 2.2 SDA "kit" functional decomposition (from True Anomaly leadership)
The SDA contract solution decomposes into four functions ([Eric Hilmer / True Anomaly, LinkedIn 2023-09-21](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t)):
1. **DTID — Detect, Track, ID** an object in space.
2. **Characterization** — infer what a system does from collected information.
3. **TW&A — Threat Warning & Assessment** — store characterized information and **use machine learning to predict changes** to the object.
4. **Data Exploitation & Integration** — fuse publicly-available, commercial, and classified data to perform **event forecasting**.

> This four-stage pipeline — **Detect/Track/ID → Characterize → ML-predict threat change → fuse + forecast** — is the *exact* capability skeleton SZL must clean-room build (anomaly detection lives at stages 3–4). It maps cleanly onto killinchu's track→classify→evaluate→receipt flow (§3).

### 2.3 Architecture as publicly described
- **Cloud-native, modern stack:** *"Mosaic is a cloud-native application leveraging the fault-tolerance and scalability of **Elixir** and the performance and power of **C++**. The frontend is a hybrid **Unity and React** application... with a rich and dynamic game engine."* ([True Anomaly, LinkedIn 2024-07-17](https://www.linkedin.com/posts/true-anomaly_software-spacesecurity-nationalsecurity-activity-7219445803793178624-bE3W)).
- **Applications supported:** *"spacecraft command and control, battle management, wargaming, space domain awareness, and virtual/synthetic/live on-orbit training ranges."* ([True Anomaly, LinkedIn 2024-07-17](https://www.linkedin.com/posts/true-anomaly_software-spacesecurity-nationalsecurity-activity-7219445803793178624-bE3W)).
- **Composable / no-monolith:** *"Deploy applications as standalone services... or build into a full-stack solution,"* *"Deploy only the services you need, with no monolithic overhead,"* integrating *"across multiple vendor tech stacks."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- **Deployment flexibility:** *"Fully GovCloud compliant,"* *"cloud-based, scalable architecture and web interface,"* **and** *"Installable on classified or **air-gapped** systems,"* with *"containerized deployment across your cloud architecture of choice."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).
- **Integration:** *"platform-agnostic and modular, no vendor lock, and seamless integration with existing sensors, ground stations, and flight systems"* via a *"Unified API."* ([True Anomaly — Mosaic](https://www.trueanomaly.space/mosaic)).

### 2.4 Capability surface summary

| Capability | Mosaic (public description) | Primary source |
|---|---|---|
| Multi-sensor fusion → COP | Space + ground sensors, links, on-orbit assets fused into dynamic COP | [Mosaic page](https://www.trueanomaly.space/mosaic) |
| Detect / Track / ID | DTID of objects in space; RPO long-range detect+track+image | [Hilmer LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t), [Jackal GEO](https://www.trueanomaly.space/newsroom/jackal-for-geosynchronous-orbit-and-cislunar-space) |
| Threat Warning & Assessment | ML predicts changes to tracked object | [Hilmer LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t) |
| Event forecasting | Fuse open/commercial/classified data to forecast events | [Hilmer LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t) |
| C2 + battle management | Spacecraft C2, multi-domain battle management, asset orchestration | [LinkedIn 2024-07-17](https://www.linkedin.com/posts/true-anomaly_software-spacesecurity-nationalsecurity-activity-7219445803793178624-bE3W) |
| OODA acceleration | AI re-pairing, mission-plan reevaluation, probability-of-success overlays | [Mosaic page](https://www.trueanomaly.space/mosaic) |
| Wargaming / training ranges | Virtual / synthetic / live on-orbit training | [LinkedIn 2024-07-17](https://www.linkedin.com/posts/true-anomaly_software-spacesecurity-nationalsecurity-activity-7219445803793178624-bE3W) |
| Air-gap + GovCloud deploy | Classified/air-gapped install **and** GovCloud; containerized | [Mosaic page](https://www.trueanomaly.space/mosaic) |
| OTA fleet update | Update on-orbit fleets over the air | [PR Newswire 2025-04-03](https://www.prnewswire.com/news-releases/true-anomaly-announces-jackal-for-geosynchronous-orbit-and-cislunar-space-302419435.html) |

**License of Mosaic itself:** **Proprietary.** True Anomaly publishes **no source code and no open license**. → SZL must **clean-room build the *capability*** from these public descriptions plus openly-licensed science. **Never copy proprietary code or assets.**

---

## 3. ECO-FIT MAP — How Mosaic's capability elevates the SZL ecosystem

SZL already owns the *governance, receipt, and edge-threat* spine; Mosaic's capability surface tells us **what to build next and how to wire it in**. Mapping uses the public `szl-holdings` org repos.

### 3.1 killinchu (counter-UAS / drones & vessels) — the primary landing zone
killinchu is *"a full left-nav application at `/elite`"* with **44 views** plus **7 maritime/drone live demos** and a **live 3D health twin**, including **Live Track Board, Sensor-Fusion, Multi-Track Priority, ROE Editor, Threat Class DB, Maritime Track, Vessel Fusion, Swarm Topology, Mesh**, and it *"detects, classifies, and evaluates hostile UAS tracks at machine speed, signing every interdiction decision with a DSSE Khipu receipt"* with **human-on-the-loop** ([killinchu README](https://github.com/szl-holdings/killinchu)). It ships **real protocol decoders** — Remote ID (ASTM F3411-22a), ADS-B (Mode-S 1090ES via pyModeS), MAVLink (pymavlink) — a **13-axis Λ-gate**, and **53 drone fingerprints** ([killinchu README](https://github.com/szl-holdings/killinchu)).

**Surface-by-surface mapping (Mosaic capability → killinchu surface → build action):**

| Mosaic capability | killinchu surface today | "Make it ours" build action |
|---|---|---|
| Sensor fusion → dynamic COP | Sensor-Fusion + Live Track Board + Maritime Track / Vessel Fusion | Elevate to a **single dynamic COP** across air + maritime + (new) orbital tracks; one fused track store |
| DTID (Detect/Track/ID) | Track Board + 53 drone fingerprints + Threat Class DB | Add explicit **DTID pipeline stage** + characterization store keyed to fingerprint DB |
| TW&A (ML predicts object-change) | 13-axis Λ-gate + `yuyay_v3` score | Add **forecasting-based anomaly model** (GDN/MTAD-GAT, §4) feeding the Λ-gate as a new axis; output **anomaly score + confidence bound** |
| Event forecasting (fuse multi-source) | Mesh + Cross-Flagship views | Multi-source fusion (open + commercial + sovereign feeds) into Khipu DAG; **forecast = advisory only** (Λ Conjecture 1) |
| OODA acceleration / re-pairing | Multi-Track Priority + ROE Editor | Add **recommended-action overlays** with **probability-of-success + confidence bounds** (Mosaic-style explainability), human approves |
| Asset orchestration (hundreds of assets) | Swarm Topology + Mesh | Scale track/asset orchestration via **szl-mesh** CRDT + 3-of-4 Khipu quorum |
| Air-gap / classified deploy | UDS bundles, k3d, air-gap test | Already aligned — **sovereign own-metal, 0 CDN**; package new anomaly organ as a UDS capability service |

> **Differentiator SZL keeps that Mosaic does not advertise:** every killinchu interdiction emits a **DSSE Khipu receipt in a real SHA-256 Merkle DAG** — *"real-DSSE-or-honestly-UNSIGNED, never silently fabricated"* ([killinchu README](https://github.com/szl-holdings/killinchu)). SZL's anomaly verdicts inherit **tamper-evident provenance** Mosaic's public materials do not claim.

### 3.2 a11oy — governance brain over anomalies
a11oy is the *"full orchestrator application (Command Center, Five Superpowers, Warhacker, Observability, Wires, Mesh, Formulas, Evidence, LLM Router)"* on a *"signed-receipt substrate; receipts.in ≡ receipts.out"* under **Apache-2.0** ([a11oy repo, szl-holdings](https://github.com/szl-holdings/a11oy)). a11oy is where **governance over anomaly decisions** lives: every anomaly/threat verdict from the new pipeline becomes an **Evidence-backed, Λ-gated, receipt-signed** action. This is the honest analogue to Mosaic's *"operators see why an action improves probability of success"* — but with a **checkable receipt** rather than an opaque UI claim.

### 3.3 UDS deployment ecosystem — sovereign, air-gap, signed
SZL's deployment spine already matches Mosaic's *"air-gapped / GovCloud / containerized"* posture **and exceeds it on provenance**:
- **szl-uds-deployment** — *"Live UDS governance-receipt deployment — k3d + uds-cli + Pepr DSSE receipt policy, cosign-verified"* ([repo](https://github.com/szl-holdings/szl-uds-deployment)).
- **uds-bundles** — *"UDS Zarf bundles... airgap-deployable, cosign-signed, SLSA L1+L2"* for a11oy + killinchu ([repo](https://github.com/szl-holdings/uds-bundles)).
- **szl-mesh / szl-fleet-overlay / uds-mesh** — CRDT mesh, BFT 3-of-4 Khipu quorum, DSSE receipts on a Khipu Merkle DAG ([szl-mesh](https://github.com/szl-holdings/szl-mesh), [uds-mesh](https://github.com/szl-holdings/uds-mesh)).
- **khipu-consensus** — *"BFT 3-of-4 multi-party-witnessed agreement... multi-party-witnessed AI"* ([repo](https://github.com/szl-holdings/khipu-consensus)).

**Wiring plan:** the new anomaly/SDA organ ships as a **UDS capability service**, air-gap-deployable, cosign-signed, emitting DSSE receipts into the Khipu DAG — fully consistent with **sovereign own-metal, 0 CDN**.

### 3.4 Net effect
Mosaic gives SZL a **proven capability blueprint** (DTID → Characterize → ML-TW&A → fuse/forecast, fused into a COP, OODA-accelerated, air-gap-deployable). SZL builds that **capability** on top of its existing **track-board + sensor-fusion + threat-DB + ROE + mesh + signed-receipt** spine — and it adds **verifiable provenance + honest doctrine** that the proprietary original does not publicly offer.

---

## 4. OPENLY-LICENSED ADOPTION LINEAGE (clean-room "make it ours")

**Rule:** SZL adopts only **verified-permissive** licenses (MIT / BSD / Apache-2.0). **HARD REJECT** anything proprietary, no-license, or copyleft/source-available for **code reuse**. Each license below was verified against the project's GitHub `license.spdx_id` or its paper's stated license.

### 4.1 License verification table (each independently checked)

| Library / asset | Purpose | License | Verified via | Adopt? |
|---|---|---|---|---|
| **PyOD** (`yzhao062/pyod`) | 50+ classical/deep outlier detectors; the de-facto anomaly toolkit | **BSD-2-Clause** | GitHub `license.spdx_id` = `BSD-2-Clause` ([repo](https://github.com/yzhao062/pyod)) | **YES** |
| **PyGOD** (`pygod-team/pygod`) | **Graph** outlier detection (nodes/edges) | **BSD-2-Clause** | GitHub `license.spdx_id` = `BSD-2-Clause`; paper states "released under a BSD 2-Clause license" ([JMLR](https://www.jmlr.org/papers/volume25/23-0963/23-0963.pdf)) | **YES** |
| **Merlion** (`salesforce/Merlion`) | End-to-end time-series intelligence (forecast + anomaly + ensembling) | **BSD-3-Clause** | GitHub `license.spdx_id` = `BSD-3-Clause`; source headers `SPDX-License-Identifier: BSD-3-Clause` ([repo](https://github.com/salesforce/Merlion), [vae.py](https://github.com/salesforce/Merlion/blob/main/merlion/models/anomaly/vae.py)) | **YES** |
| **TODS** (`datamllab/tods`) | Automated time-series outlier detection / AutoML | **Apache-2.0** | GitHub `license.spdx_id` = `Apache-2.0`; paper "released under Apache 2.0 license" ([arXiv](https://arxiv.org/html/2009.09822v4)) | **YES** |
| **tsod** (`DHI/tsod`) | Lightweight time-series anomaly detection (rule + statistical) | **MIT** | GitHub `license.spdx_id` = `MIT`; docs "licensed under MIT" ([repo](https://github.com/DHI/tsod), [docs](https://dhi.github.io/tsod/)) | **YES** |
| **GraGOD** (`GraGODs/GraGOD`) | Open-source **GNN-TSAD** framework (PyTorch) — arXiv **2603.09675** | **MIT** | GitHub `license.spdx_id` = `MIT` ([repo](https://github.com/GraGODs/GraGOD), [arXiv 2603.09675](https://arxiv.org/html/2603.09675v1)) | **YES** |
| **GDN** (`d-ailin/GDN`) | Graph Deviation Network — multivariate TSAD (AAAI'21), explainable, inter-sensor graph | **MIT** | GitHub `license.spdx_id` = `MIT` ([repo](https://github.com/d-ailin/GDN), [paper](https://www.alphaxiv.org/overview/2106.06947v1)) | **YES** |
| **python-sgp4** (`brandon-rhodes/python-sgp4`) | SGP4/SDP4 orbit propagation from TLE/OMM — space domain | **MIT** | GitHub `license.spdx_id` = `MIT` ([repo](https://github.com/brandon-rhodes/python-sgp4)) | **YES** |
| **alibi-detect** (`SeldonIO/alibi-detect`) | Drift/outlier/adversarial detection | **BSL 1.1** (was Apache-2.0 **until 2024-01-22**) | Seldon relicensed to **Business Source License 1.1** — *no production use without subscription* ([Seldon announcement](https://www.seldon.io/strengthening-our-commitment-to-open-core/), [Licensing FAQs](https://www.seldon.io/licensing-faqs/)) | **REJECT** for code reuse |

> **CRITICAL CORRECTION to the brief:** alibi-detect is **no longer Apache-2.0**. As of **22 January 2024**, Seldon relicensed Alibi Detect (and Core) to the **Business Source License 1.1**, which forbids production use without a commercial subscription ([Seldon](https://www.seldon.io/strengthening-our-commitment-to-open-core/); [FAQs](https://www.seldon.io/licensing-faqs/)). **It is a HARD REJECT for SZL code reuse.** Only Seldon's **MLServer** remains Apache-2.0, and only specific *individual* pre-2024 contributions stay Apache-2.0 — not the project as a whole. SZL may study alibi-detect's *published methods/papers* (ideas aren't copyrightable) but must not vendor its post-2024 code.

### 4.2 Recommended sovereign anomaly/SDA stack (clean-room, by Mosaic capability stage)

| Mosaic stage | Open lineage SZL builds on | License | Role in SZL build |
|---|---|---|---|
| **Detect / point-anomaly** | **PyOD** | BSD-2 | Classical + deep univariate detectors as the baseline detector bank in the new organ |
| **Track-level multivariate TSAD** | **Merlion**, **TODS**, **tsod** | BSD-3 / Apache-2.0 / MIT | Time-series anomaly across fused track channels; tsod for lightweight edge rules on killinchu |
| **TW&A / inter-sensor graph anomaly** | **GDN**, **GraGOD**, **PyGOD** | MIT / MIT / BSD-2 | Graph-deviation forecasting across sensors/tracks — explainable anomaly scoring (which sensor caused it) feeds the Λ-gate as a new axis |
| **Space-domain track / SDA** | **python-sgp4** | MIT | Orbit propagation from TLE/OMM for the (new) orbital-track surface; pairs with killinchu's existing decoders for air/maritime |
| **Science (methods, not code)** | Graph-TSAD surveys (arXiv 2302.00058, 2307.03759); GDN AAAI'21 (2106.06947) | papers (cite, don't vendor) | Method grounding for forecasting-based, explainable, unsupervised anomaly scoring |

### 4.3 Clean-room "make it ours" plan (with attribution)
1. **Capability spec from public sources only.** Author the SZL anomaly/SDA spec from True Anomaly's *public descriptions* (§2) — the DTID→Characterize→TW&A→fuse/forecast skeleton — and from openly-licensed papers. **No proprietary Mosaic code or assets touch the repo.**
2. **Build the organ on permissive code.** Implement the new **anomaly/SDA capability service** using PyOD/Merlion/TODS/tsod (detection), GDN/GraGOD/PyGOD (graph TSAD), and sgp4 (orbital track) — vendored or wrapped per their licenses.
3. **License hygiene & attribution.** Ship the organ **Apache-2.0** (SZL's house license) with a **`THIRD_PARTY_NOTICES`/NOTICE** file reproducing each upstream license (BSD-2, BSD-3, MIT, Apache-2.0) and copyright. Honor BSD/MIT attribution and Apache-2.0 NOTICE requirements. **Exclude alibi-detect entirely.** **cite-never-plagiarize** applies to papers (cite arXiv IDs/DOIs).
4. **Wire into the spine.** Anomaly score becomes a **new Λ-gate axis** (advisory — Λ = **Conjecture 1**); each verdict emits a **DSSE Khipu receipt** into the Merkle DAG; package as a **UDS capability service** (cosign-signed, air-gap-deployable, 0 CDN).
5. **Honest delineation.** Anomaly/TW&A outputs are **advisory forecasts under human-on-the-loop**, not autonomous kill authority — consistent with killinchu's *"human operator before any action propagates"* ([killinchu README](https://github.com/szl-holdings/killinchu)).

---

## 5. HONEST POSTURE (Doctrine v11 — binding on this build)

- **Λ = Conjecture 1** (conditional Theorem U; **not** a closed theorem). Anomaly scores feeding the Λ-gate are **advisory**, never asserted as proven-optimal. Backing: `lutar-lean`, **749 declarations · 14 axioms · 163 sorries**, kernel `c7c0ba17` ([lutar-lean](https://github.com/szl-holdings/lutar-lean); [killinchu README](https://github.com/szl-holdings/killinchu)).
- **Locked proof tier = 8**: `{F1, F4, F7, F11, F12, F18, F19, F22}` (the experimental CI-green tier is **NOT** folded into the locked count) ([killinchu README](https://github.com/szl-holdings/killinchu)).
- **Khipu BFT safety = Conjecture 2** (Wave23 conditional, **open**) ([killinchu README](https://github.com/szl-holdings/killinchu); [khipu-consensus](https://github.com/szl-holdings/khipu-consensus)).
- **SLSA = L1 honest / L2 build-attested / L3 roadmap** — no inflation ([killinchu README](https://github.com/szl-holdings/killinchu)).
- **Sovereign own-metal, 0 CDN** — deploy on SZL infrastructure via UDS/Zarf, air-gap-capable ([szlholdings-site](https://github.com/szl-holdings/szlholdings-site); [uds-bundles](https://github.com/szl-holdings/uds-bundles)).
- **No free-energy / no over-claims.** This report describes capability SZL **must still build**; SZL does **not** today have an orbital-SDA or full TW&A anomaly organ. killinchu today is **counter-UAS air/maritime track + classify + evaluate + receipt** — orbital DTID/SDA and ML-TW&A forecasting are **roadmap**.
- **cite-never-plagiarize** — clean-room from public descriptions + openly-licensed code/papers, with attribution; **never copy proprietary Mosaic code**.
- **Honest sensor caveat (inherited):** broadcast Remote-ID/ADS-B/MAVLink are **unauthenticated and spoofable** — every decoded field is a *claim*, not ground truth ([killinchu README](https://github.com/szl-holdings/killinchu)). The same skepticism applies to fused anomaly inputs.
- **$/credit = ESTIMATE.** True Anomaly's "$125M+ raised" and "$17.4M contract" are *their* figures from press releases ([PR Newswire](https://www.prnewswire.com/news-releases/true-anomaly-announces-successful-launch-and-control-of-jackal-during-mission-x-2-302338070.html)); any SZL cost/credit projections are estimates, not committed figures.

---

## Appendix A — Source ledger (primary, named)

**True Anomaly / Mosaic (primary):**
- Mosaic product page — [trueanomaly.space/mosaic](https://www.trueanomaly.space/mosaic)
- Jackal GEO/Cislunar (Mosaic = software backbone, RPO) — [trueanomaly.space](https://www.trueanomaly.space/newsroom/jackal-for-geosynchronous-orbit-and-cislunar-space); [PR Newswire 2025-04-03](https://www.prnewswire.com/news-releases/true-anomaly-announces-jackal-for-geosynchronous-orbit-and-cislunar-space-302419435.html)
- Mission X-2 launch + Mosaic C2 — [PR Newswire 2024-12-23](https://www.prnewswire.com/news-releases/true-anomaly-announces-successful-launch-and-control-of-jackal-during-mission-x-2-302338070.html)
- $17.4M Space Force SDA contract — [PR Newswire 2023-09-21](https://www.prnewswire.com/news-releases/true-anomaly-lands-17-million-us-space-force-contract-for-space-domain-awareness-301934799.html); [Potomac Officers Club](https://www.potomacofficersclub.com/news/true-anomaly-has-secured-from-the-u-s-space-force-space-systems-command-a-17-4-million-supply-contract-for-space-domain-awareness-applications/)
- SDA-kit four functions (DTID/Characterize/TW&A/Data Exploitation) — [Eric Hilmer, LinkedIn](https://www.linkedin.com/posts/erichilmer_true-anomaly-lands-174m-contract-from-us-activity-7110684034724233216-371t)
- Mosaic stack (Elixir/C++/Unity/React; C2/battle mgmt/wargaming/SDA/training) — [True Anomaly, LinkedIn 2024-07-17](https://www.linkedin.com/posts/true-anomaly_software-spacesecurity-nationalsecurity-activity-7219445803793178624-bE3W)

**Disambiguation candidates:**
- MOSAIC (Northeastern/MOC) — [MOSAIC paper PDF](https://www.khoury.northeastern.edu/home/alina/papers/MOSAIC.pdf)
- Strategy/MicroStrategy Mosaic + Sentinel — [Strategy Mosaic](https://www.strategy.com/software/strategymosaic); [Mosaic Sentinel](https://www2.microstrategy.com/producthelp/Current/Mosaic/en-us/Content/mosaic_sentinel.htm)

**Open lineage + licenses:**
- PyOD [BSD-2](https://github.com/yzhao062/pyod) · PyGOD [BSD-2](https://github.com/pygod-team/pygod) · Merlion [BSD-3](https://github.com/salesforce/Merlion) · TODS [Apache-2.0](https://github.com/datamllab/tods) · tsod [MIT](https://github.com/DHI/tsod) · GraGOD [MIT, arXiv 2603.09675](https://github.com/GraGODs/GraGOD) · GDN [MIT, AAAI'21](https://github.com/d-ailin/GDN) · python-sgp4 [MIT](https://github.com/brandon-rhodes/python-sgp4)
- **alibi-detect — BSL 1.1 (REJECT)** — [Seldon relicense](https://www.seldon.io/strengthening-our-commitment-to-open-core/); [Licensing FAQs](https://www.seldon.io/licensing-faqs/)
- Graph-TSAD science — [arXiv 2302.00058](https://arxiv.org/html/2302.00058v4); [arXiv 2307.03759](https://arxiv.org/abs/2307.03759); [GDN arXiv 2106.06947](https://www.alphaxiv.org/overview/2106.06947v1)

**SZL ecosystem (public `szl-holdings` org):**
- [killinchu](https://github.com/szl-holdings/killinchu) · [a11oy](https://github.com/szl-holdings/a11oy) · [lutar-lean](https://github.com/szl-holdings/lutar-lean) · [khipu-consensus](https://github.com/szl-holdings/khipu-consensus) · [szl-mesh](https://github.com/szl-holdings/szl-mesh) · [uds-mesh](https://github.com/szl-holdings/uds-mesh) · [szl-uds-deployment](https://github.com/szl-holdings/szl-uds-deployment) · [uds-bundles](https://github.com/szl-holdings/uds-bundles)
