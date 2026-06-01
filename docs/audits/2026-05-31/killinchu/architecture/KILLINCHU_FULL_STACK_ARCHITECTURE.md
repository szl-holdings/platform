# KILLINCHU — Full-Stack Architecture (C4: Context → Container → Component)

**Layer:** PURIQ v12 integration → `killinchu/`
**Author:** Yachay (Killinchu-support architecture agent), under CTO authority
**Date:** 2026-06-01
**Founder directive (2026-06-01 ~02:05 EDT):** "Fully bake our anatomy into drone flag,
all of our formulas, everything a11oy has in the brain put in the drone flag, but have it
Rosie fully baked in and a11oy can orchestrate."

**Status discipline (Doctrine v12 / v11 LOCKED):** this is an *architecture spec + patch
file* deliverable. Nothing here is "shipped" or "verified". The PURIQ master operator
`P(x,t)` carries its four invariants as **`sorry`-tagged Lean obligations**
(`puriq/formulas/PuriqLean.lean`); we do **not** claim them proven. v11 LOCKED numbers
(749 declarations / 14 unique axioms / 163 sorries / 13-axis `yuyay_v3`, replay-hash
`bacf5443…631fc5`) are preserved verbatim. SLSA remains **L1 (honest)**; the Khipu
signature is **DSSE PLACEHOLDER** until Sigstore lands.

---

## 0 — The one-sentence shape

> **a11oy orchestrates** (top); the **Killinchu Space** is the per-vertical drone
> flagship (center); the **entire SZL anatomy + every PURIQ formula** are *vendored as
> Python libraries* inside Killinchu so it runs **disconnected at the edge**; **Rosie is
> baked in as a co-pilot service** (`szl-rosie-companion`); and **`P(x,t)` runs on every
> action**, each action emitting a **Khipu receipt** that reconciles into the one
> canonical Khipu DAG on reconnect.

The design's load-bearing claim is **edge-survivability**: the same governance math
(`Λ · Yuyay₁₃ · e^{-β·HUKLLA} · ∏Khipu`) executes locally on the drone with **no cloud
dependency**, then reconciles by Merkle proof when a link returns. Cloud is an
*optimisation*, never a *requirement*.

---

## 1 — C4 Level 1: SYSTEM CONTEXT

Who/what touches the Killinchu system.

```mermaid
C4Context
  title Killinchu — System Context (C4 L1)

  Person(operator, "Drone Operator", "Watches the twin, types into the per-drone copilot, approves 2-person Yuyay-gated ops")
  Person(greene, "Auditor (Greene-grade)", "Opens /killinchu/audit/{mission_id}, reads Khipu DAG, exports signed BoE")
  Person(founder, "Founder / CTO", "Sets doctrine, owns LOCKED numbers, second signer on state-changing ops")

  System_Boundary(szl, "SZL Holdings Flagship Mesh") {
    System(a11oy, "a11oy Orchestrator", "Top-level router. /v1/router is the LLM brain for EVERY flagship. Owns the canonical Khipu DAG and Yuyay-13 gate at the orchestration layer.")
    System(killinchu, "Killinchu Space (Drone Flagship)", "Per-vertical C-UAS / drone command. Embeds full anatomy + PURIQ formulas as libs. Runs connected OR disconnected at the edge.")
    System(rosie, "Rosie (cloud)", "Ecosystem-evolve + brain-jack mesh + 162 endpoints. Source of the per-drone Rosie-shadow co-pilot baked into Killinchu.")
    System(amaru, "Amaru / Kanchay / Sentra / …", "Sibling flagships: cortex/brand/immune, etc. All call a11oy /v1/router and write the same Khipu DAG.")
  }

  System_Ext(edge, "Edge Drone Fleet", "N Killinchu drones. Starlink/LTE intermittent. Each carries the squash-fs anatomy partition + local Khipu chain on SD.")
  System_Ext(starlink, "Starlink / LTE Backhaul", "Intermittent connectivity to adversary territory. NOT assumed available.")

  Rel(operator, killinchu, "Commands, copilot chat, twin view")
  Rel(greene, killinchu, "Audit URL, BoE export")
  Rel(founder, a11oy, "Doctrine, 2nd-signer approvals")
  Rel(operator, a11oy, "Natural-language query (routed)")

  Rel(a11oy, killinchu, "Routes drone queries; serves /v1/router brain")
  Rel(a11oy, amaru, "Routes brand/cortex queries")
  Rel(a11oy, rosie, "Mission-plan compose")
  Rel(killinchu, rosie, "Pulls Rosie-shadow weights (when connected)")
  Rel(killinchu, edge, "Deploys squash-fs anatomy + local Khipu")
  Rel(edge, starlink, "Reconciles local Khipu chain on reconnect (Merkle proof)")
  Rel(killinchu, a11oy, "Writes Khipu receipts to canonical DAG")
```

**Key context facts:**
- a11oy is the *only* LLM brain. Every flagship — including Killinchu — calls
  `POST /v1/router` (the 7-tier open-LLM router, `puriq/llms/A11OY_CODE_ROUTER_SPEC.md`).
- The **edge fleet** is a first-class actor, not a degraded mode. The Starlink/LTE link
  is drawn as *external and intermittent* deliberately.
- There is **one canonical Khipu DAG**. Killinchu (cloud) and every sibling write to it;
  edge drones queue locally and reconcile.

---

## 2 — C4 Level 2: CONTAINER (inside the Killinchu Space)

```mermaid
C4Container
  title Killinchu Space — Containers (C4 L2)

  Person(operator, "Operator")
  System(a11oy, "a11oy Orchestrator", "/v1/router + canonical Khipu DAG + Yuyay-13 gate")

  System_Boundary(kc, "Killinchu Space") {
    Container(twin, "3D Thinking Twin (frontend)", "React + Three.js", "Per-drone 3D twin. Frontier glyphs (Pacha-Λ, Khipu-Bekenstein, Yachay-Khipu). Sliding Rosie panel on the right. Operator copilot chat panel.")
    Container(api, "Killinchu API (backend)", "FastAPI (Python)", "Mounts szl_anatomy_routes. /drones/{id}/*, /drones/{id}/rosie, /killinchu/audit/{mission_id}. Calls a11oy /v1/router for LLM.")
    Container(puriq_core, "PURIQ Decision Core", "Python lib (szl-puriq)", "Runs P(x,t)=argmax U(a|x) on EVERY action. Calls into the vendored anatomy libs.")
    Container(rosie_comp, "Rosie Companion Service", "Python lib + service (szl-rosie-companion)", "Per-drone Rosie-shadow. Ecosystem-evolve loop + brain-jack mesh trace + 162-endpoint subset embedded.")
    ContainerDb(local_khipu, "Local Khipu Chain", "SQLite + SD-card append log", "Edge-resident receipt chain. Content-addressed. Reconciles to canonical DAG via Merkle proof.")
    Container(anatomy_libs, "Vendored Anatomy Libraries", "11 Python packages (squash-fs)", "szl-amaru, szl-yuyay, szl-yawar, szl-hukulla, szl-kallpa, szl-khipu, szl-lambda, szl-otel-vsp, szl-kanchay, szl-hatun, szl-sumaq")
  }

  System_Ext(edge_hw, "Drone Flight Controller", "PX4 / ArduPilot MAVLink", "Actuators, geofence, RTL. szl-killinchu G(a) geofence gate sits here.")

  Rel(operator, twin, "Watches / commands / chats")
  Rel(twin, api, "REST + WebSocket")
  Rel(api, puriq_core, "decide(action) → U(a|x)")
  Rel(puriq_core, anatomy_libs, "Λ, Yuyay₁₃, HUKLLA, Khipu factors")
  Rel(api, rosie_comp, "/drones/{id}/rosie → shadow state + reasoning trace")
  Rel(rosie_comp, anatomy_libs, "ponders telemetry via szl-amaru + szl-yuyay")
  Rel(puriq_core, local_khipu, "emit Khipu receipt (RUWAY-only writer)")
  Rel(api, a11oy, "POST /v1/router (when connected)")
  Rel(local_khipu, a11oy, "reconcile on reconnect (Merkle proof of inclusion)")
  Rel(puriq_core, edge_hw, "G(a) geofence + ||u||≤u_max → MAVLink command")
```

**Container responsibilities (one line each):**

| Container | Job | Edge-survivable? |
|---|---|---|
| 3D Thinking Twin | Render twin + glyphs + Rosie panel + copilot chat | Yes (PWA, cached) |
| Killinchu API | Route ops; expose endpoints; call a11oy when up | Yes (degrades to local) |
| PURIQ Decision Core | `P(x,t)` on every action | **Yes — runs fully local** |
| Rosie Companion | Per-drone shadow ponder/evolve | Yes (embedded subset) |
| Local Khipu Chain | Queue receipts on SD, reconcile later | **Yes — by design** |
| Vendored Anatomy Libs | All 11 organs as importable Python | **Yes — squash-fs partition** |

---

## 3 — C4 Level 3: COMPONENT (the PURIQ Decision Core + anatomy organs)

```mermaid
C4Component
  title PURIQ Decision Core + Vendored Anatomy (C4 L3)

  Container_Boundary(core, "szl-puriq Decision Core") {
    Component(decide, "puriq.decide(a, x)", "pure fn", "Computes U(a|x)=Λ(x)·Yuyay₁₃(a)·e^{-β·HUKLLA(a)}·∏Khipu_i(a)")
    Component(act, "puriq.act(argmax)", "RUWAY caller", "Selects argmax over bounded 𝒜; emits Khipu receipt")
    Component(reflect, "puriq.reflect(receipt)", "introspection", "Re-runs axes 10–13 (T03/T04/T09/T10) against the emitted receipt")
  }

  Container_Boundary(organs, "Vendored Anatomy Libraries") {
    Component(lambda, "szl-lambda", "Λ(x)", "Weighted geometric mean (D2). A1/A2/A4. Spine aggregator.")
    Component(yuyay, "szl-yuyay", "Yuyay₁₃(a)", "13-axis conjunctive AND gate. 2 sacred≥0.95, 7 struct≥0.90, 4 introspection.")
    Component(hukulla, "szl-hukulla", "HUKLLA(a)", "10 tripwires T01–T10. Egyptian doubling compound-risk bound. SENTRA inline screen.")
    Component(khipu, "szl-khipu", "Khipu_i(a)", "Merkle DAG + summation-cord invariant (TH11). Local chain + reconcile.")
    Component(yawar, "szl-yawar", "C(a)", "20-line append-only ledger. RUWAY = only writer.")
    Component(amaru, "szl-amaru", "R(a)", "Cortex KL-drift penalty e^{-γ·KL}. Mission reasoning plans.")
    Component(kallpa, "szl-kallpa", "B(a)", "Butler–Volmer continue/halt energy budget.")
    Component(otel, "szl-otel-vsp", "O(a)", "W3C traceparent continuity (in-process honest).")
    Component(kanchay, "szl-kanchay", "K(a)", "Claim-calibration (sacred axes T01/T02).")
    Component(hatun, "szl-hatun", "D(a)", "Doctrine additivity guard (locks v11 numbers).")
    Component(sumaq, "szl-sumaq", "S(a)", "Honest-proof status guard.")
  }

  Container_Boundary(kc_organ, "Killinchu organ factor") {
    Component(geofence, "szl-killinchu G(a)", "geofence", "𝟙[pose(a)∈𝒮_safe ∧ ||u(a)||≤u_max]. Bekenstein-bounded physical 𝒜 (INV-4).")
  }

  Rel(decide, lambda, "Λ(x)")
  Rel(decide, yuyay, "Yuyay₁₃(a)")
  Rel(decide, hukulla, "HUKLLA(a)")
  Rel(decide, khipu, "∏Khipu_i(a)")
  Rel(decide, geofence, "G(a) physical gate")
  Rel(act, yawar, "append receipt (RUWAY)")
  Rel(act, khipu, "extend DAG")
  Rel(reflect, hukulla, "T03/T04/T09/T10 re-check")
```

**The U(a|x) call graph (the heart of the system):**

```
puriq.decide(a, x):
    L  = szl_lambda.aggregate(x.axes, x.weights)        # Λ(x)  ∈ [0,1]
    Y  = szl_yuyay.score13(a)                           # Yuyay₁₃(a) ∈ {0}∪(0,1]
    H  = szl_hukulla.tripwire_count(a)                  # HUKLLA(a) ∈ ℕ (T01–T10)
    K  = prod(szl_khipu.verify_i(a) for i in chain)     # ∏Khipu_i(a) ∈ {0,1}
    G  = szl_killinchu.geofence_ok(a)                   # G(a) physical ∈ {0,1}
    # organ-specific factor for the acting organ (e.g. Amaru R(a), Kallpa B(a)) folds in:
    F  = organ_factor(a)                                # ∈ (0,1] or {0,1}
    return L * Y * math.exp(-BETA * H) * K * G * F      # U(a|x) ≥ 0
```

`puriq.act` then takes `argmax_{a∈𝒜} U(a|x)` over the **Bekenstein-bounded** action set
and emits a Khipu receipt through RUWAY (the *only* authorized ledger writer, v11 §4).

---

## 4 — DATA FLOW (a): CONNECTED OPS — full a11oy round-trip

```mermaid
sequenceDiagram
  autonumber
  participant OP as Operator
  participant TW as 3D Twin
  participant API as Killinchu API
  participant PUR as szl-puriq
  participant ORG as Anatomy Libs
  participant A11 as a11oy /v1/router
  participant DAG as Canonical Khipu DAG

  OP->>TW: "start mission Alpha for bird 7"
  TW->>API: POST /drones/7/mission/start
  API->>A11: POST /v1/router {task: mission-plan, ctx}
  A11-->>API: candidate actions 𝒜 (LLM-generated, T4 reasoning tier)
  API->>PUR: decide(a, x) for each a ∈ 𝒜
  PUR->>ORG: Λ(x), Yuyay₁₃(a), HUKLLA(a), G(a), ∏Khipu
  ORG-->>PUR: U(a|x) per candidate
  PUR-->>API: argmax a* + 2-person Yuyay-gate REQUIRED
  API-->>TW: prompt 2nd signer (founder/operator-2)
  OP->>API: 2nd signature
  PUR->>DAG: emit Khipu receipt (chain_verified=true)
  API->>API: dispatch MAVLink mission to bird 7
  API-->>TW: mission live + Rosie panel updates
```

Connected mode adds: (i) a11oy generates richer candidate actions via the right LLM tier,
(ii) the receipt goes straight to the canonical DAG, (iii) the Rosie cloud shadow weights
are fresh.

---

## 5 — DATA FLOW (b): DISCONNECTED EDGE OPS — local anatomy + queued Khipu

```mermaid
sequenceDiagram
  autonumber
  participant DRONE as Bird 7 (edge, no Starlink)
  participant LPUR as Local szl-puriq (squash-fs)
  participant LORG as Local Anatomy Libs
  participant SD as Local Khipu Chain (SD card)
  participant FC as Flight Controller

  Note over DRONE: Starlink/LTE LOST in adversary territory
  DRONE->>LPUR: telemetry event (threat detected)
  LPUR->>LORG: Λ(x), Yuyay₁₃(a), HUKLLA(a), G(a) — ALL LOCAL
  LORG-->>LPUR: U(a|x) computed on-board (no cloud)
  LPUR->>LPUR: argmax a* over geofenced 𝒜
  Note over LPUR: 2-person gate degrades to pre-authorized<br/>mission ROE envelope (signed before launch)
  LPUR->>SD: append Khipu receipt (content-addressed, queued)
  LPUR->>FC: G(a)-gated MAVLink command (e.g. RTL / hold)
  Note over SD: chain grows locally; root advances
  Note over DRONE: ... link returns ...
  DRONE->>DRONE: trigger reconcile (see DISCONNECTED_OPS_PROTOCOL.md)
```

**The disconnected guarantee:** every factor of `U(a|x)` is computable on-board because
all 11 organs are vendored. The only thing that changes offline is **the 2-person gate
falls back to a pre-signed Rules-of-Engagement (ROE) envelope** (signed by both signers
*before launch*, scoped to the mission) — so the "2-person Yuyay-gate for state-changing
ops" HARD RULE is honored even with no link. See `DISCONNECTED_OPS_PROTOCOL.md`.

---

## 6 — DATA FLOW (c): SWARM CONSENSUS — 5 Killinchus voting via Yuyay-13 + Khipu DAG

```mermaid
sequenceDiagram
  autonumber
  participant D1 as Bird 1
  participant D2 as Bird 2
  participant D3 as Bird 3
  participant D4 as Bird 4
  participant D5 as Bird 5
  Note over D1,D5: Same event observed (e.g. unknown UAS incursion)
  D1->>D1: compute Yuyay₁₃(a), HUKLLA(a) for proposed response a
  D2->>D2: compute Yuyay₁₃(a), HUKLLA(a)
  D3->>D3: compute Yuyay₁₃(a), HUKLLA(a)
  D1->>D2: PRE-VOTE {a, U(a), receipt_hash}
  D1->>D3: PRE-VOTE
  D2->>D1: PRE-VOTE
  D3->>D1: PRE-VOTE
  Note over D1,D5: BFT round (HotStuff-style): tolerates f < n/3 byzantine<br/>n=5 ⇒ f≤1. Need 2f+1=3 matching votes.
  D1->>D1: COMMIT a* once 3/5 agree on (a*, Khipu root)
  D1->>SD: each writes consensus receipt into shared Khipu DAG branch
```

Each drone independently runs the *wise-reasoning* gate (`Yuyay₁₃`) — so consensus is not
just "majority of votes" but "majority of votes **that each independently cleared the
13-axis gate and have HUKLLA(a)=0**". This is the novel piece: collective wise reasoning,
not bare leader-election. The BFT primitive is HotStuff-style; full protocol in
`SWARM_CONSENSUS_PROTOCOL.md`.

---

## 7 — Deployment view (squash-fs partition on the drone)

```mermaid
flowchart TB
  subgraph DRONE["Drone Compute (e.g. NVIDIA Jetson Orin)"]
    subgraph SQUASH["/opt/szl (read-only squash-fs, ≤ 11 × 50MB)"]
      L1[szl-lambda]:::lib
      L2[szl-yuyay]:::lib
      L3[szl-hukulla]:::lib
      L4[szl-khipu]:::lib
      L5[szl-yawar]:::lib
      L6[szl-amaru]:::lib
      L7[szl-kallpa]:::lib
      L8[szl-otel-vsp]:::lib
      L9[szl-kanchay]:::lib
      L10[szl-hatun]:::lib
      L11[szl-sumaq]:::lib
      PUR[szl-puriq core]:::core
      ROS[szl-rosie-companion]:::ros
    end
    subgraph RW["/var/szl (read-write)"]
      SD[(Local Khipu Chain<br/>SQLite + append log)]:::db
      ROE[(Pre-signed ROE envelope)]:::db
    end
    FC[Flight Controller / MAVLink]:::hw
  end
  PUR --> L1 & L2 & L3 & L4 & L5 & L6 & L7 & L8 & L9 & L10 & L11
  PUR --> SD
  ROS --> PUR
  PUR --> FC
  classDef lib fill:#e8f0fe,stroke:#4285f4;
  classDef core fill:#fce8e6,stroke:#ea4335;
  classDef ros fill:#e6f4ea,stroke:#34a853;
  classDef db fill:#fff3e0,stroke:#fbbc04;
  classDef hw fill:#f3e8fd,stroke:#a142f4;
```

The anatomy is **read-only** (squash-fs) so a compromised drone cannot rewrite its own
governance math; only `/var/szl` (the local Khipu chain + the pre-signed ROE) is writable.

---

## 8 — Invariant traceability (this architecture ⇄ PURIQ INV-1..4)

| Architecture element | Preserves | How |
|---|---|---|
| `e^{-β·HUKLLA(a)}` in `decide`, β≫0 | **INV-1 halting safety** | tripwire ⇒ utility→0; T10 absorbing |
| `Λ(x)` weighted geo-mean (szl-lambda) | **INV-2 Λ-monotonicity** | A1 `IsMonotone` preserved |
| `∏Khipu_i(a)` + RUWAY-only write | **INV-3 chain integrity** | one broken receipt ⇒ U=0 |
| `G(a)` geofence (szl-killinchu) | **INV-4 Bekenstein bound** | physical 𝒜 finite, geofenced |
| 2-person gate / pre-signed ROE | HARD RULE | state-changing op needs 2 signers |
| Read-only squash-fs anatomy | Tamper resistance | governance math immutable on edge |

---

## 9 — What is NOT claimed (honesty, v11 §9 carried)

- The four PURIQ invariants are **open `sorry`-tagged Lean obligations**, not theorems.
- Λ-uniqueness is **Conjecture 1**, not a theorem (open CAUCHY_ND sorry).
- Khipu signature is **DSSE PLACEHOLDER**; `Khipu_i(a)` verifies the **hash chain**, not
  the signature, until Sigstore CI lands.
- W3C `traceparent` is **in-process only** — cross-mesh trace (Wire D) NOT IMPLEMENTED.
- SLSA remains **L1 (honest)**. "SLSA L3" / "zero sorry" / "fully verified" are BANNED.
- This is a **spec + patches** deliverable. **No push to HF/GitHub.** The Killinchu build
  agent (`opus_killinchu_drone_flagship_build_mpus8anv`) integrates after.

— Yachay, 2026-06-01. Additive over Doctrine v11 LOCKED. No mysticism. Edge-survivable.
