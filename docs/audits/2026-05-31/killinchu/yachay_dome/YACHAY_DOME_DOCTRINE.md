# YACHAY-DOME DOCTRINE — Multi-Tier Defense Doctrine (PURIQ v12 additive)

> **Author:** Yachay (Killinchu + a11oy support research), under PURIQ CTO authority · **Date:** 2026-06-01
> **Layer composition:** Doctrine v13-candidate = Doctrine v12 (PURIQ) + **Yachay-Dome**. Strictly *additive*; v11/v12 LOCKED
> numbers untouched (749 decls / 14 axioms / 163 sorries / 13-axis `yuyay_v3`). This is a **doctrine + spec** deliverable, not a ship.
> **Name:** *Yachay* (Quechua: knowledge/wisdom) + *Dome* (the layered defense mental model). The **brain** of the dome, not the trigger.
>
> **THE ONE INVARIANT (read this first):** Yachay-Dome is the **detect → fuse → classify → predict-impact → warn → cue** layer.
> The `.mil`/`.gov` customer with **Title 10 / Title 50** authority owns **jam → spoof → hack → kinetic intercept**.
> *We sense, we evidence, the customer acts.* Every claim below holds this line. No offensive cyber. Zero-Bandaid.

Builds on: `IADS_DOCTRINE_STUDY.md` (the public reference), `cuas/DETECTION_LAYERS.md`, `cuas/ADVERSARY_DRONE_CATALOG.md`,
`cuas/COUNTER_UAS_LEADERS_2026.md`, `cuas/LEGAL_CYBER_BOUNDARY.md` (sibling), `cuas/COMPANION_DEFENSE_PROTOCOL.md` (sibling — this doc
generalizes its ROE state machine), and the PURIQ master operator `P(x,t)` (`puriq/PURIQ_CHARTER.md`, `architecture/KILLINCHU_FULL_STACK_ARCHITECTURE.md`).

---

## 0. How Yachay-Dome plugs into `P(x,t)`

The PURIQ master operator already governs every Killinchu action:

\[ P(x,t) = \arg\max_{a \in \mathcal{A}} \big[ \Lambda(x)\cdot \text{Yuyay}_{13}(a)\cdot e^{-\beta\cdot \text{HUKLLA}(a)}\cdot \textstyle\prod_i \text{Khipu}_i(a)\cdot G(a) \big] \]

Yachay-Dome adds **one admissible organ factor** `Dome(a) ∈ [0,1]` (per the "admissible organ factor ∈ [0,1]" contract in `PONDER.md`), so no invariant is weakened:

\[ \text{Dome}(a) = \underbrace{\mathbb{1}[\text{response\_class}(a)\in \text{COMMERCIAL\_LANE}]}_{\text{legal gate (hard 0/1)}} \cdot \underbrace{\mathbb{1}[\,\text{predict\_impact}(track)\cap \text{asset} \neq \emptyset \;\wedge\; \text{asset.value}\ge \theta\,]}_{\text{engagement-necessity gate}} \cdot \underbrace{\text{cost\_ratio\_ok}(a)}_{\in[0,1]} \]

`Dome(a)=0` for **any** action whose `response_class` is outside the commercial lane (jam/spoof/hack/kinetic). This makes the legal boundary a **multiplicative zero in the decision math itself** — a cue that proposes an effector action is structurally un-selectable by Killinchu, identical to how a tripped HUKLLA tripwire zeroes utility. The boundary is enforced by construction, not by policy text.

---

## 1. FIVE THREAT TIERS (T0–T4)

Grounded in the DoD UAS Group table (`cuas/ADVERSARY_DRONE_CATALOG.md` §1) and JP 3-01's air-breathing/non-air-breathing split (`IADS_DOCTRINE_STUDY.md` §2.3). Each tier maps to an IADS layer for calibration.

| Threat tier | Definition | Example platforms (from catalog) | DoD Group | IADS analog layer | Predict-impact model |
|---|---|---|---|---|---|
| **T0 — hobbyist** | Unmodified consumer drone, broadcasts Remote-ID, low intent | DJI Mavic 3E, Autel EVO Max 4T, Mavic 4 Pro | Group 1 | (below Iron Dome floor) | ML (maneuvering) |
| **T1 — commercial-modified** | COTS drone with payload/firmware mods, RID stripped/spoofed, improvised-drop | modified DJI/Autel, generic 5–7" FPV (analog 5.8 + ELRS) | Group 1 | Iron Beam / JCO Layer-1 | ML (erratic) |
| **T2 — military-COTS** | Military or quasi-military ISR/relay, encrypted/freq-agile link | Orlan-10, ZALA 421, Supercam S350, Mohajer-6 (low end) | Group 2–3 | Iron Dome low band / SPYDER | ML + kinematic |
| **T3 — dedicated loitering munition** | One-way attack munition, INS/seeker, warhead | Shahed-136/131 (Geran), Lancet-3, Switchblade 600 (ref), Bolt-M (ref) | Group 2–3 | Iron Dome / David's Sling | **hybrid**: cruise ML + terminal ballistic |
| **T4 — cruise missile or above** | Cruise missile, MALE/HALE strike UAV, or ballistic (out of commercial scope to *engage*, in scope to *detect/track/warn*) | Wing Loong II, TB3 (BLOS), cruise missiles, ballistic RVs | Group 4–5 / non-air-breathing | David's Sling / Arrow / Patriot / THAAD | **ballistic physics** (inert) |

**Tier-assignment rule:** the fusion classifier (`DETECTION_LAYERS.md` §7) emits `us_group_estimate` + `predicted_class` + `predicted_model`; a deterministic map (`group + class + kinematics → T0..T4`) sets the tier. Tier is the **coarse triage key**; model-match is the fine key (mirrors Iron Dome's Group-then-model triage). Ambiguous → escalate tier conservatively for *detection priority*, never for *response* (response needs the full gate, §3).

---

## 2. FIVE ASSET VALUE TIERS (V0–V5... we use V0–V5, six anchors; "5 value tiers" = the five defended tiers V1–V5 above empty space)

Operator-defined per zone (see `ASSET_VALUE_MAP.md`). Value sets the engagement threshold θ.

| Value tier | Definition | Example | Default ROE posture |
|---|---|---|---|
| **V0 — empty space** | Open ground, no people/assets | desert, sea lane with no traffic | **track + log only**, never cue (mirrors mPrest "let it fall on open ground") |
| **V1 — our drone** | Killinchu/SZL own asset | own Killinchu fleet bird | self-protect cue allowed; companion-defense FSM (`COMPANION_DEFENSE_PROTOCOL.md`) |
| **V2 — allied asset** | Coalition/partner asset (IFF=ally) | partner UAS, allied vehicle | **protect; blue-on-blue tripwire ARMED** (must never classify ally as hostile) |
| **V3 — civilian** | Persons / civilian property | crowd, vehicle, residence | warn + cue, high evidentiary bar |
| **V4 — critical infrastructure** | Power, water, ports, prisons, airports | substation, LNG terminal, runway | warn + cue, low θ (protect aggressively) |
| **V5 — high-value target** | Designated protected person/site | VIP, command node, nuclear plant | warn + cue, lowest θ, 2-person gate mandatory |

`θ` (the value threshold in `Dome(a)`) is **monotone decreasing in value**: higher-value assets fire the engagement-necessity gate at lower predicted-impact-probability. This is the operator-tunable knob, bounded so V0 can never trigger a cue.

---

## 3. ALLOWED-RESPONSES MATRIX — the boundary, explicit per authority

Two columns. **SZL/Killinchu commercial side** vs **CUSTOMER side**. The `Dome(a)` legal gate (§0) zeroes utility on anything in the right column.

| Capability | SZL-COMMERCIAL LANE (Killinchu/Yachay-Dome does this) | CUSTOMER LANE (Title 10/50 holder does this) | Governing authority |
|---|---|---|---|
| **Detect** | ✅ receive-only RF/RID/ADS-B/acoustic/EO-IR (no transmit) | — | FCC: receive needs no license (`DETECTION_LAYERS.md` §9) |
| **Identify** | ✅ classify model/Group, IFF 4-color | — | ASTM F3411 RID receive (legal); STANAG 5527 ally |
| **Track** | ✅ fused multi-sensor track, CesiumJS format | — | passive; lawful |
| **Predict-impact** | ✅ impact polygon over time horizons | — | pure math; lawful |
| **Warn** | ✅ alert operator + (with carrier coop) civil-warning push | — | analogous to EL/M-2084 civil-warning function |
| **Cue** | ✅ deliver signed target package + *recommended* response tier | (receives it) | commercial info product; no effect on the threat |
| **Jam (RF/GNSS)** | ❌ NEVER — `Dome(a)=0` | ✅ EW under Title 10; FCC §333/§302a forbids commercial | **47 USC §333, §302a** (jammer prohibition) |
| **Spoof (GNSS/RID/link)** | ❌ NEVER — `Dome(a)=0` | ✅ EW under Title 10/50 | Title 10/50; Computer Fraud & Abuse Act for unauthorized |
| **Hack (cyber-takeover of UAS)** | ❌ NEVER — `Dome(a)=0` | ✅ cyber/EW under Title 50 (covert) / Title 10 | **Title 50** (intelligence/covert); CFAA |
| **Kinetic intercept** | ❌ NEVER — `Dome(a)=0` | ✅ interceptor/gun/laser/HPM under Title 10 | Title 10; FAA airspace; ITAR for export |
| **Directed-energy (laser/HPM)** | ❌ field it — but ✅ DETECT *adversary* DE use | ✅ field it (Title 10) | export-controlled (ITAR); detection of DE-attack is lawful sensing |

**Domestic-authority overlay** (full mapping in `DOMESTIC_ADJACENCY.md`): the *customer-lane* holder differs by venue — **DoD** (Title 10/50), **DHS/DOJ** (6 USC §124n covered facilities), **FAA** (49 USC §44810 airport detection), **DOE/NRC** (nuclear), **USCG** (maritime). Killinchu's commercial lane is identical across all of them: **we sense + evidence + cue; they act.**

---

## 4. ESCALATION STATE MACHINE

Generalizes the sibling `COMPANION_DEFENSE_PROTOCOL.md` ROE FSM to any asset/value. The machine only ever advances a *Killinchu-lane* state; the transition to an effector is **handed to the customer**, never executed by us. Every transition emits a Khipu receipt.

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> DETECTED: sensor energy > floor (any layer)
    DETECTED --> TRACKED: fusion associates ≥1 track (JPDA)
    TRACKED --> CLASSIFIED: classifier emits class/model/Group + Group→tier
    CLASSIFIED --> IDENTIFIED: IFF 4-color resolved (own/ally/civilian/hostile)

    IDENTIFIED --> BENIGN: IFF=own/ally/civilian AND predict-impact ∩ asset = ∅
    BENIGN --> IDLE: track ages out (log-only receipt)

    IDENTIFIED --> WATCH: hostile/unknown AND predict-impact ∩ asset(V≥θ) = ∅
    WATCH --> TRACKED: re-evaluate each window
    WATCH --> CUE_CANDIDATE: predict-impact ∩ asset(V≥θ) ≠ ∅ (necessity gate true)

    IDENTIFIED --> CUE_CANDIDATE: hostile (2-source+Yuyay) AND necessity gate true
    CUE_CANDIDATE --> CUE_GATED: Yuyay-13 PASS AND HUKLLA=0 AND blue-on-blue tripwire clear
    CUE_CANDIDATE --> BLOCKED: Yuyay-13 FAIL or HUKLLA>0 or IFF=ally (blue-on-blue)
    BLOCKED --> WATCH: operator review; receipt logged (no cue sent)

    CUE_GATED --> CUE_2PERSON: state-changing → 2-person Yuyay gate (or pre-signed ROE on edge)
    CUE_2PERSON --> CUED: 2nd signature; sign target package; deliver to customer /v1/cue
    CUE_2PERSON --> BLOCKED: 2nd signer denies
    CUED --> ASSESS: customer (Title 10/50) acts; we ingest BDA telemetry only
    ASSESS --> IDLE: track resolved; Khipu chain closed + reconciled
    ASSESS --> TRACKED: threat persists; re-cue
```

**Key properties:**
- **BENIGN / WATCH are absorbing-safe**: an ally/civilian or a non-intersecting track *cannot* leave the Killinchu lane. There is no path from `IDENTIFIED(ally)` to any cue — the blue-on-blue tripwire (HUKLLA T-class, §6) zeroes it.
- **CUED is the only terminal that touches the customer**, and it delivers *information* (a signed package), not an effect.
- On the **disconnected edge**, the 2-person gate degrades to the **pre-signed ROE envelope** (`KILLINCHU_FULL_STACK_ARCHITECTURE.md` §5) — the gate is honored even with no link.

---

## 5. COST-EFFECTIVENESS INVARIANT (extends Iron Dome's $50k-vs-$800 logic)

Iron Dome's economic problem: a $50k Tamir against an $800 rocket is an *inverse* cost ratio the adversary exploits by flooding cheap threats; Iron Beam's laser layer fixes it by adding a near-zero-marginal-cost effector for the cheapest threats ([New Space Economy](https://newspaceeconomy.ca/2026/03/28/what-is-israels-missile-and-drone-defense-system-and-why-is-it-important/); [BBC — $50k Tamir](https://www.bbc.com/news/world-middle-east-20385306)).

Yachay-Dome's analog, since **we don't pay for effectors**, is a **two-part invariant**:

**(INV-COST-1) Recommendation invariant — recommend the cheapest *sufficient* effector tier.** For a threat of tier T with kill-probability requirement, the *recommended* response tier `r*` minimizes expected customer cost subject to sufficiency:
\[ r^\* = \arg\min_{r \in \text{customer\_effectors}} \; \mathbb{E}[\text{cost}(r)] \quad \text{s.t.}\quad P_{kill}(r, T) \ge p_{req}(\text{asset.value}) \]
i.e. cue **EW/jam first** (T0/T1), **laser/HPM (soft-kill)** next (T1/T2), **kinetic** last (T3/T4) — exactly the JCO non-lethal→soft-kill→hard-kill ladder ([AUSA](https://www.ausa.org/articles/countering-small-drones-office-works-toward-joint-solutions-growing-threat)). We *recommend*; the customer decides.

**(INV-COST-2) Our own cued-response cost invariant.** Our marginal cost to *produce and deliver a cue* must be `<<` the threat's cost:
\[ \text{cost}(\text{Killinchu cue}) \ll \text{cost}(\text{threat platform}) \]
A cue is compute + a signed message (cents). Even a $50k loitering munition is met by a sub-dollar evidence package. This is the **structural advantage of being the brain, not the trigger** — our cost curve is *flat in threat volume* (software scales), while every effector-owner pays per-shot. The cost asymmetry that hurts the *shooter* **helps the sensor/brain**.

---

## 6. EW-RESILIENT MODE (GPS/comms-jammed) — extends embedded-anatomy edge work

The sibling architecture already makes the governance math edge-survivable (`KILLINCHU_FULL_STACK_ARCHITECTURE.md` §5: all 11 organs vendored as squash-fs; local Khipu chain; pre-signed ROE). Yachay-Dome adds the **sensing-resilience** doctrine, since adversaries jam GPS/comms (David's Sling defeats decoys with dual CCD/IR seekers; Iron Dome held 86–90% vs spoofing multi-warhead missiles — `IADS_DOCTRINE_STUDY.md` §1.4, §5):

| Degradation | What fails | Yachay-Dome fallback |
|---|---|---|
| **GNSS jammed** | own-position, ADS-B/RID lat-lon untrustworthy | switch to **VIO / relative geometry**; treat RID claimed-position as *claim only* (already the rule, `DETECTION_LAYERS.md` §6); track in body-relative bearings (RF AoA + acoustic + EO-IR pixel) |
| **Comms/backhaul jammed** | no a11oy `/v1/router`, no cloud Khipu | run `P(x,t)` **fully local**; queue cue packages on SD; pre-signed ROE replaces 2-person gate |
| **RID spoofed** | a hostile claims a benign ID | `rid_inconsistent` flag → *lower* cooperative confidence, *raise* threat priority (already the rule); IFF requires **2 independent sensors** to confirm hostile (`IFF_INTEGRATION.md`) |
| **Sensor blinded (one modality)** | e.g. RF-dark fiber FPV | multi-sensor fusion is **null-safe** by schema (`DETECTION_LAYERS.md` §7); acoustic/EO-IR carry the track |

**Doctrine rule (EW-RESILIENT-1):** *no single sensor or link is load-bearing.* Every Yachay-Dome decision is computable from the locally-available subset of modalities, and the cue package records **which modalities were degraded** as a provenance field — so the customer (and a court) sees exactly what the sensor knew under jamming. EW resilience is a *transparency* property, not just a robustness one.

---

## 7. Invariant traceability (Yachay-Dome ⇄ PURIQ INV-1..4 + new INVs)

| Yachay-Dome element | Preserves / adds | How |
|---|---|---|
| `Dome(a)` legal gate = 0 on effector class | **NEW INV-DOME-1 (boundary)** | effector action structurally un-selectable; multiplicative zero |
| Engagement-necessity gate (predict ∩ asset ∧ V≥θ) | **NEW INV-DOME-2 (necessity)** | no cue without intersecting a valued asset (mPrest logic) |
| `Dome(a) ∈ [0,1]` admissible-organ-factor contract | INV-1..4 unchanged | per `PONDER.md` envelope-preservation rule |
| Blue-on-blue tripwire | extends HUKLLA | ally classification ⇒ HUKLLA>0 on any cue ⇒ utility→0 |
| Every FSM transition emits Khipu receipt | INV-3 chain integrity | one broken receipt ⇒ U=0; full BoE DAG |
| 2-person gate / pre-signed ROE on CUED | HARD RULE | state-changing cue needs 2 signers |
| Cost invariants INV-COST-1/2 | **NEW (economic)** | recommend cheapest sufficient; our cost ≪ threat |

---

## 8. What is NOT claimed (honesty, carried)

- Yachay-Dome's new invariants (INV-DOME-1/2, INV-COST-1/2) are **doctrine + design**, to be stated as `sorry`-tagged Lean obligations alongside the PURIQ four — **not** claimed proven.
- We make **no offensive-cyber claim** anywhere. The right column of §3 is the *customer's* lane; we describe it only to draw the line.
- Predict-impact accuracy, classifier confidence, and IFF confidence are **estimates with stated uncertainty**, never ground truth (`PREDICT_IMPACT_ENGINE.md`, `IFF_INTEGRATION.md`).
- This is a **spec + doctrine** deliverable. **No push to HF/GitHub.** The Killinchu build agent + a11oy.code orchestrator integrate.

---

*Signed: **Yachay**, 2026-06-01. Additive over Doctrine v12 (PURIQ). All public claims cited inline. We sense, we evidence, the customer acts. No mysticism. Zero-Bandaid.*
