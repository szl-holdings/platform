# SZL Holdings — Ecosystem Tiering Plan

**Version**: 1.0
**Date**: 2026-04-02
**Owner**: Stephen Lutar, Founder & CEO
**Classification**: Internal — Strategy

---

## Purpose

This document defines the formal three-tier structure of the SZL ecosystem. Tier assignment determines investment priority, development sequencing, and commercial attention. Every artifact has exactly one tier assignment. Tiers are reviewed quarterly and updated when readiness or commercial conditions change.

---

## Tiering Principles

1. **Commercial clarity over portfolio breadth.** The company narrative focuses on the commercial wedge first. Tier 1 receives all active engineering investment and commercial attention.
2. **Shared backbone compounds every tier.** Infrastructure built for Tier 1 (auth, DB, Alloy, audit, AI engine) is inherited by Tiers 2 and 3 at no additional cost. Every dollar spent on Tier 1 infrastructure makes future tier advancement cheaper.
3. **Tier is earned, not assigned aspirationally.** Promotion from Tier 3 to Tier 2, or from Tier 2 to Tier 1, requires evidence of commercial demand or strategic necessity — not product completeness alone.
4. **Parked is not abandoned.** Tier 3 artifacts are maintained in working order. They receive infrastructure updates via the shared backbone. They do not receive active feature investment or commercial prioritization.

---

## Tier Definitions

| Tier | Label | Description | Investment Level |
|------|-------|-------------|-----------------|
| **1** | Flagship Now | Active commercial focus. Revenue, pilots, and enterprise trust building happen here. Maximum engineering investment. | Full |
| **2** | Pilot-Adjacent | Positioned for near-term activation once Tier 1 proves commercial traction. Receives selective investment to maintain advancement readiness. | Selective |
| **3** | Parked / Staged | Built and operational. Maintained via shared infrastructure. No active feature investment or dedicated commercial effort. | Maintenance only |

---

## Tier 1 — Flagship Now

### Rationale
Tier 1 is the commercial wedge, the execution engine, and the corporate presence that supports both. All revenue, design-partner, and investor activity in the near term flows through these artifacts.

### Tier 1 Artifacts

| Artifact | Role | Readiness | Notes |
|----------|------|-----------|-------|
| **Lyte** (embedded in `szl-holdings`) | Market-facing software wedge | Functional Alpha → Pilot Ready (in progress) | Primary commercial entry point. PRISM framework, action queue, approval center, readiness module. All feature investment is Lyte-first. |
| **Alloy** (via `api-server`) | Execution fabric & shared backbone | Functional Alpha | Routes signals to auditable action. Workflow engine, AI decision engine, human-in-the-loop gates, audit trail. Not a standalone product — the engine beneath Lyte and all verticals. |
| **API Server** (`api-server`) | Shared platform backend | Functional Alpha | Single Express process serving all platform backends. Auth, DB, Alloy, AI engine, audit trail. Backbone investment benefits all tiers. |
| **SZL Holdings** (`szl-holdings`) | Corporate presence | Functional Alpha | Investor and enterprise evaluation destination. Top of brand hierarchy. Must reflect current readiness labels and tiering accurately. |
| **Shared Libraries** (`lib/`) | Shared infrastructure | Production-stable (core) | `@workspace/db`, `@workspace/auth`, `@workspace/shared-ui`, `@workspace/audit`, `@workspace/api-zod` are production-stable. Workflow-engine, AI engine, observability are Functional Alpha. |

### Tier 1 Investment Rules
- All active sprint work defaults to Tier 1 unless explicitly assigned otherwise.
- Lyte product features, Alloy engine improvements, API server hardening, and SZL Holdings site accuracy are Tier 1 priorities.
- No Tier 2 or Tier 3 feature work may displace Tier 1 work unless a specific commercial trigger (design partner, investor, enterprise pilot) requires it.

---

## Tier 2 — Pilot-Adjacent

### Rationale
Tier 2 artifacts are positioned for near-term activation. They share the Tier 1 backbone and require targeted investment — not a full build — to reach Pilot Ready. Tier 2 is activated when Lyte + Alloy have earned a commercial win that creates leverage for expansion.

### Tier 2 Artifacts

| Artifact | Role | Readiness | Activation Condition |
|----------|------|-----------|---------------------|
| **Vessels** (`vessels`) | Maritime intelligence vertical | Functional Alpha | First Lyte commercial pilot and one enterprise maritime inquiry. High-stakes buyer profile (enterprise, government, insurance) creates strong expansion leverage. AIS integration is the key capability gap. |
| **Lyte Mobile** (`lyte-mobile`) | Mobile command for Lyte flagship | Prototype | Lyte web reaches Pilot Ready with at least one design partner actively using the platform. Mobile surfaces the same PRISM intelligence on iOS/Android. This is the single designated mobile client for Tier 2 in Phase 0-1. |

### Tier 2 Investment Rules
- Tier 2 artifacts receive investment only when a specific trigger event occurs (design partner, commercial inquiry, investor request).
- Investment is targeted: close the specific gap that blocks Pilot Ready for the activated artifact.
- Vessels is the highest-priority Tier 2 candidate — the commercial profile (enterprise, compliance-driven) is strongest.
- Lyte Mobile follows Lyte web — no mobile investment before web is Pilot Ready.

---

## Tier 3 — Parked / Staged

### Rationale
Tier 3 artifacts are built, operational, and maintained. They demonstrate ecosystem optionality and compounding platform value. They are not receiving active development investment or dedicated commercial attention. Parked does not mean low quality — it means the commercial sequencing is correct.

### Tier 3 Artifacts

| Artifact | Platform | Readiness | Deferred Until |
|----------|----------|-----------|---------------|
| **Aegis** (`aegis`) | Defense & Intelligence web | Functional Alpha | Lyte/Alloy reach Pilot Ready and first commercial revenue exists. FedRAMP track requires dedicated compliance work. High capability, high market complexity. |
| **Terra** (`terra`) | Real Estate Intelligence web | Functional Alpha | Lyte/Alloy commercial validation; NYC data pipeline validated with real broker use case. NYC expansion opportunity is real but requires dedicated sales motion. |
| **Carlota Jo** (`carlota-jo`) | Advisory web app | Functional Alpha | Advisory revenue can be activated with minimal technical investment. Maintained as near-term revenue pathway; no feature investment. |
| **SZL Holdings Founder** (route in `szl-holdings`) | Founder site | GA | Content live at `/founder` within the szl-holdings app. No separate artifact needed. |
| **SZL Holdings Mobile** (`szl-holdings-mobile`) | Executive mobile | Prototype | Deferred. Activation requires Lyte Mobile reaching Pilot Ready first and confirmed executive mobile use case with a pilot partner. |
| **Aegis Mobile** (`aegis-mobile`) | SOC mobile | Prototype | Follows Aegis web tier advancement. |
| **Vessels Mobile** (`vessels-mobile`) | Fleet mobile | Prototype | Follows Vessels web commercial validation. |
| **Terra Mobile** (`terra-mobile`) | Field intelligence mobile | Prototype | Follows Terra web commercial validation. |
| **Carlota Jo Mobile** (`carlota-jo-mobile`) | Advisory mobile | Prototype | Follows Carlota Jo advisory revenue activation. |
| **Stephen Mobile** (`stephen-mobile`) | Personal command | Prototype | No commercial investment planned. |

### Tier 3 Investment Rules
- Tier 3 artifacts receive maintenance updates only: dependency bumps, infrastructure updates via shared backbone, critical bug fixes.
- No feature development for Tier 3 without an explicit commercial trigger.
- Carlota Jo is the exception: the advisory web site can activate revenue with near-zero technical investment (Stripe checkout only). This is a permitted activation that does not require Tier promotion.

---

## Tier Advancement Criteria

### Tier 3 → Tier 2
- Confirmed commercial inquiry (design partner, enterprise pilot, or investment conversation) that requires the artifact.
- Founder decision with documented rationale.

### Tier 2 → Tier 1
- Active revenue or signed pilot agreement tied to the artifact.
- Strategic necessity (e.g., Lyte partner requires Vessels for supply chain use case).
- Founder decision with board or advisor visibility.

---

## Tiering Summary Map

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1 — FLAGSHIP NOW (Full Investment)                │
│                                                         │
│  Lyte (web)         → Market-facing commercial wedge   │
│  Alloy (engine)     → Execution fabric                 │
│  API Server         → Shared platform backbone         │
│  SZL Holdings (web) → Corporate presence               │
│  Shared Libraries   → Infrastructure backbone          │
├─────────────────────────────────────────────────────────┤
│  TIER 2 — PILOT-ADJACENT (Selective Investment)         │
│                                                         │
│  Vessels (web)          → Next expansion vertical      │
│  Lyte Mobile            → Selected mobile client       │
├─────────────────────────────────────────────────────────┤
│  TIER 3 — PARKED / STAGED (Maintenance Only)            │
│                                                         │
│  Aegis (web + mobile)       → Defense/Intel — deferred│
│  Terra (web + mobile)       → Real Estate — deferred  │
│  Carlota Jo (web + mobile)  → Advisory — low-invest   │
│  SZL Holdings Mobile        → Deferred executive app  │
│  Stephen Site + Mobile      → Founder — static        │
└─────────────────────────────────────────────────────────┘
```

---

## Review Schedule

| Review | Frequency | Owner | Trigger |
|--------|-----------|-------|---------|
| Tier assignments | Quarterly | Founder | Calendar |
| Tier promotion | As needed | Founder | Commercial trigger |
| Investment reallocation | As needed | Founder | Sprint planning |

---

*See also:*
- *[System Inventory](system-inventory.md) — Complete artifact baseline*
- *[Readiness Standard](../../public/readiness-standard.md) — Label definitions*
- *[Environment Labeling Standard](../../public/environment-labeling-standard.md) — Environment label definitions*
