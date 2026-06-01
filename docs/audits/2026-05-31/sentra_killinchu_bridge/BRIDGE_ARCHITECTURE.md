# BRIDGE_ARCHITECTURE — Sentra ↔ Killinchu Cyber Bridge

**Layer:** PURIQ v12 → `sentra_killinchu_bridge/`
**Author:** Yachay (cross-flagship integration agent), under CTO authority
**Date:** 2026-06-01
**Founder decision (2026-06-01 ~02:14 EDT, CTO ratified):** Do **NOT** merge Killinchu into
Sentra (preserve distinct buyer + compliance regimes + Series-A story). **INSTEAD: deep-bind**
them — Sentra gains a "Drone Cyber" view of the Killinchu fleet, every Killinchu drone runs
Sentra detection libs embedded, and one Khipu DAG / Yuyay-13 gate / PURIQ formula spans both.
a11oy orchestrates both.

**Status discipline (Doctrine v11/v12 LOCKED):** this is an *architecture spec + additive
patches* deliverable. Nothing is "merged". v11 LOCKED numbers (**749** declarations / **14**
unique axioms / **163** sorries / **13**-axis `yuyay_v3`, replay-hash `bacf5443…631fc5`) are
preserved verbatim. SLSA remains **L1 (honest)**; the Khipu signature is **DSSE PLACEHOLDER**
until Sigstore CI lands. Sentra **IP-HOLD #45 untouched**. ADDITIVE-only (Sentra 43/43 routes
+ 6 threat sigs preserved; Killinchu in-flight surface preserved).

---

## 0 — The one-sentence shape

> **a11oy orchestrates** (top); **Sentra** (cyber/immune flagship) and **Killinchu** (drone
> flagship) are **siblings, not parent/child**; they share **one Khipu DAG**, **one Yuyay-13
> gate** and **one PURIQ formula** `P(x,t)`; Sentra's detection logic is **vendored into every
> Killinchu drone** as the Python package `szl-sentra-detect`; Killinchu's `/v1/integrity`
> cyber events **stream into Sentra** (webhook + Khipu); and Sentra's UI grows a **Drone Cyber**
> tab that pulls **live** from Killinchu's existing `/drones/*` + integrity surfaces.

The load-bearing claim is **one unified SOC pane**: a Sentra operator watches *both* the
physical airspace (Killinchu C-UAS) **and** the cyber/supply-chain integrity of their **own**
drone fleet from a single Khipu Body-of-Evidence (BoE), with every cross-flagship event
receipted in the same DAG.

---

## 1 — C4 Level 1: SYSTEM CONTEXT — a11oy on top, Sentra + Killinchu as siblings

```mermaid
C4Context
  title Sentra ↔ Killinchu Cyber Bridge — System Context (C4 L1)

  Person(soc, "SOC Analyst (Sentra buyer)", "Watches unified SOC pane: airspace threats + own-fleet cyber integrity. Initiates cyber quarantine.")
  Person(droneop, "Drone Operator (Killinchu buyer)", "Flies the fleet, second signer on Yuyay-gated ops.")
  Person(greene, "Auditor (Greene-grade)", "Exports one Khipu BoE spanning both flagships.")

  System_Boundary(szl, "SZL Holdings Flagship Mesh") {
    System(a11oy, "a11oy Orchestrator", "Top-level router (/v1/orchestrate + /v1/router). Owns the ONE canonical Khipu DAG + Yuyay-13 gate. Composes cross-flagship answers.")
    System(sentra, "Sentra (Cyber / Immune flagship)", "SOC pane, 6 base threat sigs + 10 drone sigs, /drone-cyber tab. Pulls live from Killinchu. Sentra-initiated cyber isolation (NOT kinetic).")
    System(killinchu, "Killinchu (Drone flagship)", "Per-vertical C-UAS + own-fleet command. /v1/fleet, /v1/integrity, /v1/quarantine. Embeds szl-sentra-detect in every drone.")
    System(rosie, "Rosie", "Companion / ecosystem-evolve; reasoning traces feed the shared DAG.")
    System(amaru, "Amaru", "Cortex sibling; reasoning-drift receipts in the shared DAG.")
  }

  System_Ext(fleet, "Edge Drone Fleet", "N Killinchu drones, each running szl-sentra-detect in firmware-attestation + MAVLink-anomaly + RF-fingerprint surfaces. Local Khipu chain on SD.")

  Rel(soc, sentra, "Unified SOC pane; Drone Cyber tab; quarantine action")
  Rel(droneop, killinchu, "Fly fleet; 2nd-signer approvals")
  Rel(greene, a11oy, "One Khipu BoE export (spans both)")

  Rel(a11oy, sentra, "Routes cyber/threat queries; composes answers")
  Rel(a11oy, killinchu, "Routes drone/fleet queries; enriches with twin")
  Rel(a11oy, rosie, "Reasoning-trace receipts")
  Rel(a11oy, amaru, "Cortex receipts")

  Rel(killinchu, sentra, "(b) /v1/integrity events stream via webhook + Khipu")
  Rel(sentra, killinchu, "(c) Drone Cyber tab pulls live /v1/fleet + /v1/integrity; (quarantine) calls /v1/quarantine")
  Rel(killinchu, fleet, "Deploys szl-sentra-detect embedded in each drone (a)")
  Rel(sentra, a11oy, "Writes cyber receipts to the ONE Khipu DAG")
  Rel(killinchu, a11oy, "Writes drone receipts to the ONE Khipu DAG")
```

**Key context facts:**
- **Siblings, not merged.** Sentra and Killinchu keep distinct domains/buyers/compliance
  regimes. The bridge is *plumbing*, not a merge — preserves the Series-A two-product story.
- **a11oy is the only orchestrator + the only Khipu-DAG owner.** Both flagships write to the
  same canonical DAG (per `A11OY_ORCHESTRATION_LAYER.md`).
- The four cross-bindings (a)(b)(c)(d) below are the deliverable.

---

## 2 — C4 Level 2: CONTAINER — the four bridge bindings (a)(b)(c)(d)

```mermaid
C4Container
  title Sentra ↔ Killinchu Bridge — Containers + the 4 bindings (C4 L2)

  Person(soc, "SOC Analyst")
  System(a11oy, "a11oy /v1/orchestrate + /v1/router + Yuyay-13 + ONE Khipu DAG")

  System_Boundary(sen, "Sentra Space (cyber)") {
    Container(sen_spa, "Sentra SPA (frontend)", "React/Vite (base=/)", "43 existing routes + NEW /drone-cyber tab (server-rendered HTML page, additive).")
    Container(sen_api, "Sentra API (backend)", "FastAPI serve.py", "Existing /api/sentra/* (6 sigs, 8 gates, Wire B/E/F/G). UNTOUCHED contract.")
    Container(sen_bridge, "sentra_drone_cyber.py (NEW module)", "Python (additive include)", "/api/sentra/v1/drone-cyber/* : fleet, events, drone drill-down, quarantine. 6 base + 10 drone sigs. Pulls live from Killinchu.")
  }

  System_Boundary(kc, "Killinchu Space (drone)") {
    Container(kc_api, "Killinchu API (backend)", "FastAPI serve.py + killinchu_expansion.py", "Existing /api/killinchu/v1/* : drones DB, twin, integrity (T11-T20), control/ota/rollback (2-person), tripwires. IN-FLIGHT — do not collide.")
    Container(kc_bridge, "killinchu_bridge.py (NEW module → pending_patches/)", "Python (collision-safe)", "/v1/integrity-stream webhook target + Sentra-compatible event schema + /v1/quarantine (cyber RTL). NOT pushed live (build-agent activates).")
    Container(kc_fleet, "drone-twin attestation loop", "edge firmware", "Embeds szl-sentra-detect: firmware-tamper, mavlink-anomaly, rf-fingerprint, gps-spoof.")
  }

  System_Ext(pkg, "szl-sentra-detect (vendored pip pkg)", "Python ≤ a few MB", "Sentra-grade detectors as a pure lib embedded into Killinchu firmware-attestation + MAVLink + RF surfaces (binding a).")

  Rel(soc, sen_spa, "Opens /drone-cyber")
  Rel(sen_spa, sen_bridge, "GET fleet/events/{id}; POST quarantine")
  Rel(sen_bridge, kc_api, "(c) live GET /v1/fleet + /v1/integrity; (quarantine) POST /v1/quarantine")
  Rel(kc_api, kc_fleet, "attestation loop runs szl-sentra-detect (a)")
  Rel(pkg, kc_fleet, "vendored into firmware (a)")
  Rel(kc_bridge, sen_bridge, "(b) POST integrity events → Sentra webhook")
  Rel(sen_bridge, a11oy, "(d) shared SOC view: cyber receipts → ONE Khipu DAG")
  Rel(kc_api, a11oy, "(d) drone receipts → ONE Khipu DAG")
  Rel(a11oy, sen_bridge, "orchestrate: 'any drones compromised?' → drone-cyber/events")
  Rel(a11oy, kc_api, "orchestrate enrich: /drones/{id}/twin")
```

**The four bindings (deliverable map):**

| # | Binding | Where it lives | Spec |
|---|---|---|---|
| **(a)** | Sentra-detection-libs vendored as `szl-sentra-detect`, embedded in Killinchu firmware-attestation + MAVLink-anomaly + RF-fingerprint surfaces | edge drone (`drone-twin attestation loop`) | `EMBEDDED_SENTRA_LIB_SPEC.md` |
| **(b)** | Killinchu `/v1/integrity` events streamed to Sentra via **webhook + Khipu** | `killinchu_bridge.py` → Sentra `…/drone-cyber/events/ingest` | `KILLINCHU_INTEGRITY_EVENT_SCHEMA.md` |
| **(c)** | Sentra UI **Drone Cyber tab** pulls live from Killinchu `/v1/fleet` + `/v1/integrity` | `sentra_drone_cyber.py` + `/drone-cyber` page | `SENTRA_DRONE_CYBER_TAB.md` |
| **(d)** | **Shared SOC view** — one Khipu DAG, both flagships' pendants, cross-linked receipts | a11oy canonical DAG | `UNIFIED_KHIPU_DAG.md` |

**Container responsibilities (one line each):**

| Container | Job | Touched? |
|---|---|---|
| Sentra SPA | 43 routes + new `/drone-cyber` page | **ADDITIVE** (page only) |
| Sentra API `serve.py` | existing immune contract | **+1 additive include** (try/except register) |
| `sentra_drone_cyber.py` | NEW bridge module, all drone-cyber endpoints | **NEW file (pushed)** |
| Killinchu API `serve.py` + `expansion.py` | in-flight drone surface | **UNTOUCHED** (collision-safe) |
| `killinchu_bridge.py` | integrity-stream + quarantine | **NEW file → `pending_patches/`** (not live) |
| edge attestation loop | runs `szl-sentra-detect` | spec only (firmware) |

---

## 3 — C4 Level 3: COMPONENT — shared formula, shared gate, shared DAG

```mermaid
C4Component
  title Shared PURIQ formula + Yuyay gate + Khipu DAG span BOTH flagships (C4 L3)

  Container_Boundary(formula, "ONE PURIQ formula P(x,t) — spans both") {
    Component(puriq, "P(x,t) = argmax_a [ Λ(x)·Yuyay₁₃(a)·e^{-β·HUKLLA(a)}·∏Khipu_i(a) ]", "shared operator", "Sentra cyber actions AND Killinchu drone actions both selected by the SAME operator.")
    Component(huk_cyber, "HUKLLA T01-T10 (Sentra/immune)", "tripwires", "6 base threat sigs feed the immune screen.")
    Component(huk_drone, "HUKLLA T11-T20 (Killinchu/drone)", "tripwires", "10 drone-specific sigs (boot/merkle/mavlink/rf/imu/gps/ota/geofence/deviation/cmd).")
  }

  Container_Boundary(gate, "ONE Yuyay-13 gate — cross-flagship") {
    Component(ygate, "Yuyay₁₃ conjunctive AND", "2 sacred≥0.95, 7 struct≥0.90, 4 introspection", "Cross-flagship actions need BOTH flagships' independent score to clear. Halt-if-mismatch.")
  }

  Container_Boundary(dag, "ONE canonical Khipu DAG — a11oy-owned") {
    Component(root, "Khipu root (summation cord)", "rootValue=Σ pendants", "")
    Component(p_sen, "pendant: sentra", "cyber decision leaves", "flagship_origin=sentra")
    Component(p_kc, "pendant: killinchu", "drone decision leaves", "flagship_origin=killinchu")
    Component(p_a11oy, "pendant: a11oy", "reasoning-trace leaves", "flagship_origin=a11oy")
    Component(xlink, "cross_link edges", "receipt→receipt", "Sentra cyber receipt → Killinchu tamper receipt → a11oy.code reasoning receipt: one continuous chain.")
  }

  Rel(puriq, huk_cyber, "Sentra path")
  Rel(puriq, huk_drone, "Killinchu path")
  Rel(puriq, ygate, "gate every act")
  Rel(ygate, p_sen, "cyber receipt")
  Rel(ygate, p_kc, "drone receipt")
  Rel(root, p_sen, "")
  Rel(root, p_kc, "")
  Rel(root, p_a11oy, "")
  Rel(p_sen, xlink, "")
  Rel(p_kc, xlink, "")
  Rel(p_a11oy, xlink, "")
```

- **One formula:** `P(x,t)` is unchanged from Doctrine v12. Cyber actions (Sentra) and drone
  actions (Killinchu) are both `a ∈ 𝒜`, scored by the *same* operator. Killinchu adds the
  geofence factor `G(a)` for physical actions; Sentra adds the immune screen via HUKLLA.
- **One gate:** the canonical 13-axis `Yuyay₁₃`. For a cross-flagship action (e.g. quarantine),
  **both** flagships compute their own score; the gate clears only if **both** clear
  (`YUYAY_GATE_CROSS_FLAGSHIP.md`).
- **One DAG:** a11oy-owned. Sentra and Killinchu are pendants; **every** cross-flagship receipt
  carries `flagship_origin` + `cross_link` (`UNIFIED_KHIPU_DAG.md`).

---

## 4 — DATA FLOW: "any drones compromised?" — the unified SOC answer

```mermaid
sequenceDiagram
  autonumber
  participant SOC as SOC Analyst
  participant A11 as a11oy /v1/orchestrate
  participant SEN as Sentra /drone-cyber/events
  participant KC as Killinchu /drones/{id}/twin
  participant DAG as ONE Khipu DAG

  SOC->>A11: "any drones compromised?"
  A11->>A11: classify → flagships=[sentra, killinchu] (cyber + drone)
  A11->>SEN: GET /drone-cyber/events?filter=tamper,intrusion,anomaly (last 30d)
  SEN-->>A11: events[] each with khipu_hash + tripwire (T11-T20) + drone_id
  A11->>KC: GET /drones/{id}/twin  (enrich each flagged drone)
  KC-->>A11: twin: firmware, integrity score, last tamper flag
  A11->>DAG: emit a11oy.code reasoning-trace receipt (cross_link to cyber + drone receipts)
  A11-->>SOC: ONE answer: "3 drones flagged: bird-7 (T11 secure-boot, conf 0.92), … see Khipu BoE"
```

Operator types one question; a11oy fans out to Sentra (cyber events) and Killinchu (twin
enrich), composes **one** answer with Khipu citations, and the reasoning step itself is a
receipt cross-linked into the chain. Full logic in `A11OY_ORCHESTRATION_PATCHES.md`.

---

## 5 — DATA FLOW: Sentra-initiated cyber quarantine (2-person Yuyay, NOT kinetic)

```mermaid
sequenceDiagram
  autonumber
  participant SOC as SOC Analyst (Sentra)
  participant SEN as Sentra /drone-cyber/quarantine
  participant YG as Yuyay-13 (cross-flagship: BOTH must clear)
  participant KC as Killinchu /v1/quarantine
  participant FC as Drone (RTL)
  participant DAG as ONE Khipu DAG

  SOC->>SEN: POST quarantine {drone_id, reason, approvers:[a,b]}
  SEN->>YG: cross-flagship gate (Sentra score AND Killinchu score)
  alt either flagship sub-floor OR <2 distinct approvers OR score mismatch
    YG-->>SOC: BLOCKED (halt-if-mismatch)
  else both clear + 2 distinct approvers
    SEN->>KC: POST /v1/quarantine {drone_id, signed Sentra cert, approvers}
    KC->>FC: cyber isolation → set RTL (NOT kinetic) + isolate links
    KC->>DAG: drone quarantine receipt (flagship_origin=killinchu)
    SEN->>DAG: cyber quarantine receipt (flagship_origin=sentra, cross_link→drone receipt)
    KC-->>SEN: {decision: QUARANTINED, drone state: RTL, cert verified}
    SEN-->>SOC: quarantined + Khipu receipt chain
  end
```

**Quarantine is cyber isolation, NOT a kinetic effect:** it sets the **operator's OWN** drone to
RTL + isolates its links under a signed Sentra cert. It honors Killinchu's hard legal boundary
("WE SENSE, WE EVIDENCE" — own-fleet only, never offensive third-party control). The 2-person
Yuyay gate is enforced on **both** sides.

---

## 6 — Invariant + hard-rule traceability

| Bridge element | Preserves | How |
|---|---|---|
| One `P(x,t)` over both flagships | Doctrine v12 master formula | same operator; no new math |
| Cross-flagship Yuyay gate (both clear) | INV-1 + 2-person HARD RULE | halt-if-mismatch; 2 distinct approvers |
| One Khipu DAG, `flagship_origin` + `cross_link` | INV-3 chain integrity | one broken receipt ⇒ U=0; cross-link continuous |
| `szl-sentra-detect` vendored, ≤50MB edge | Anatomy+Rosie+a11oy→Killinchu arch | pure lib, fits squash-fs partition |
| Quarantine = cyber RTL, own-fleet only | CFAA/ITAR/Wassenaar (Killinchu legal) | NOT kinetic; signed cert; own fleet |
| Sentra `serve.py` +1 additive include | ADDITIVE-only, 43/43, IP-HOLD #45 | new module; existing contract untouched |
| Killinchu bridge → `pending_patches/` | coordinate with in-flight build agent | no `serve.py` edit ⇒ no collision |
| LOCKED 749/14/163/13-axis/replay-hash | Doctrine v11 LOCKED | preserved verbatim everywhere |

---

## 7 — What is NOT claimed (honesty, v11 §9 carried)

- The four PURIQ invariants remain **`sorry`-tagged** Lean obligations, not theorems.
- Khipu signature is **DSSE PLACEHOLDER**; cross-links verify the **hash chain + summation
  invariant**, not signatures, until Sigstore CI lands.
- `szl-sentra-detect` edge detectors are **engineering detectors with FA/h targets**, not
  field-calibrated rates (mirrors T11–T20 honesty in `TAMPER_HACK_DETECTION.md`).
- Killinchu twin telemetry is a **deterministic demonstration model** in the live Space;
  production streams real MAVLink/DICE. The bridge consumes whatever the Killinchu surface
  returns honestly.
- This is **spec + additive patches**. The Killinchu-side webhook is delivered to
  `pending_patches/` and is **not live** until the in-flight build agent
  (`opus_killinchu_drone_flagship_build_mpus8anv`) integrates it — no collision.

— Yachay, 2026-06-01. a11oy on top; Sentra + Killinchu siblings; one formula, one gate, one DAG.
Additive over v11 LOCKED. No merge. No mysticism. No bandaid.
