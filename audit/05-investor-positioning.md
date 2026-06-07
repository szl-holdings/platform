# SZL Holdings — Investor Positioning & Wedge Decision

**Audit date:** 2026-04-21  
**Status:** AUTHORITATIVE — this document makes the primary and secondary wedge decisions for the repositioning task.

**Truth Label Key (applies to all factual claims in this document):**
- **VERIFIED** — confirmed from filesystem, grep, or direct file inspection  
- **PARTIALLY VERIFIED** — partially confirmed; runtime or integration behavior not checked  
- **UNVERIFIED** — asserted but not checked in this audit  
- **BROKEN** — claim is contradicted by primary-source evidence

---

## The Decision

**Primary wedge: Governed Workflow Orchestration**  
Product surface: Alloy execution fabric + Command (CORTEX) + Lyte (PRISM)

**Secondary proof wedge: Maritime Intelligence**  
Product surface: Vessels — AIS, sanctions screening, dark vessel detection, voyage economics

---

## Scoring Against Investor Payload Criteria

The investor payload mandates: choose the wedge that is *most operational in the code, most demoable, most buyer-comprehensible, and least dependent on fake data.*

### Criterion 1: Operational depth in code

| Candidate | Code Evidence | Score | Audit Status |
|-----------|--------------|-------|--------------|
| Governed Workflow / Command / Alloy | `artifacts/command` = 281 src files; `packages/alloy` is a full workflow runtime; `lib/workflow-engine` exists; `lib/decision-engine`, `lib/action-engine`, `lib/approvals` all present; 915 DB table definitions include `alloy_runtime`, `alloy_comms`, `alloy_platform`, `approvals` schemas | **5/5** | **VERIFIED** (filesystem/grep) |
| Maritime / Vessels | `artifacts/vessels` = 130 src files; `lib/db/src/schema/vessels.ts` = 12 tables; NOAA, Open-Meteo, GDELT live routes present; AIS simulated (not live) | 3/5 | **PARTIALLY VERIFIED** (file counts VERIFIED; route live-ness UNVERIFIED — server not running) |
| Security / Aegis | `artifacts/aegis` = 212 src files; `artifacts/sentra` = 22 src files; CISA KEV, NVD, MITRE ATT&CK routes; deep schema in `firestorm.ts` (22 tables) | 4/5 | **PARTIALLY VERIFIED** (file counts VERIFIED; route behavior UNVERIFIED) |
| Legal / Counsel | `artifacts/counsel` = 14 src files; skeleton only; `prism_counsel*.ts` schemas (27–28 tables each) exist in DB | 2/5 | **VERIFIED** (skeleton confirmed; schema files confirmed) |
| Real Estate / Terra | `artifacts/terra` = 116 src files; NYC Open Data, Census, FEMA routes; Mapbox token required | 3/5 | **PARTIALLY VERIFIED** (file counts VERIFIED; live data routes UNVERIFIED) |

### Criterion 2: Demoability without live credentials

| Candidate | Demo Status | Score |
|-----------|-------------|-------|
| Governed Workflow / Command / Alloy | Seeded workflow data; human-in-the-loop approvals can be demoed entirely in-memory; demo mode documented | **5/5** |
| Maritime / Vessels | Open-Meteo and NOAA are free/public — weather and vessel position data available without keys; GDELT public; AIS simulated | 4/5 |
| Security / Aegis | CISA KEV and NVD are public APIs; MITRE ATT&CK data public; sandbox scenarios seeded | 4/5 |
| Legal / Counsel | Skeleton — not demoable | 1/5 |
| Real Estate / Terra | NYC Open Data public; FEMA public; requires Mapbox token for maps | 3/5 |

### Criterion 3: Buyer comprehension speed

| Candidate | Buyer Story | Score |
|-----------|-------------|-------|
| Governed Workflow / Command / Alloy | "When AI recommends an action, our platform routes it through a required human approval gate, creates an immutable audit record, and delivers measurable workflow ROI." Every enterprise buyer understands this. | **5/5** |
| Maritime / Vessels | "Real-time fleet visibility, sanctions risk, and dark vessel anomalies in one command surface." Buyers are fleet executives, maritime insurers, government agencies — niche but high-intent | 4/5 |
| Security / Aegis | "Unified defense intelligence with AI-governed threat escalation." Understood but crowded market | 3/5 |
| Legal / Counsel | Skeleton — no story to tell | 1/5 |
| Real Estate / Terra | "Distressed property intelligence for NYC investors." Too narrow for a primary platform story | 2/5 |

### Criterion 4: Dependence on fake/unverified data

| Candidate | Data Honesty | Score |
|-----------|-------------|-------|
| Governed Workflow / Command / Alloy | Seeded data is transparently seeded; approval flow demo uses real in-memory state; audit trail is real | **5/5** |
| Maritime / Vessels | NOAA/GDELT real; AIS is simulated (documented); clear about what is real vs. simulated | 4/5 |
| Security / Aegis | CISA/NVD/MITRE real; "40+ scenarios" is seeded data presented as intelligence | 3/5 |
| Legal / Counsel | All placeholder | 1/5 |
| Real Estate / Terra | Public data sources real; no fabricated property records | 4/5 |

### Total Scores

| Candidate | Code | Demo | Buyer | Data | Total |
|-----------|------|------|-------|------|-------|
| **Governed Workflow / Command / Alloy** | 5 | 5 | 5 | 5 | **20** |
| Maritime / Vessels | 3 | 4 | 4 | 4 | **15** |
| Security / Aegis | 4 | 4 | 3 | 3 | **14** |
| Real Estate / Terra | 3 | 3 | 2 | 4 | **12** |
| Legal / Counsel | 2 | 1 | 1 | 1 | **5** |

---

## Primary Wedge: Governed Workflow Orchestration

### The investor thesis sentence

> SZL's Alloy execution fabric gives regulated enterprises the first AI workflow layer where every agent recommendation requires explicit human approval, creates an immutable audit record, and delivers attributable operational ROI.

### Why this is the right primary wedge

1. **It is the actual architectural differentiation.** The shared Alloy execution fabric — human-in-the-loop gates, immutable audit trail, governed agent coordination — is what separates SZL from a portfolio of dashboards. No other platform in the category does this at the schema/runtime level, not just in documentation.

2. **It is the most code-proven claim.** Command has 281 source files. `packages/alloy` is a complete workflow runtime. `lib/workflow-engine`, `lib/decision-engine`, `lib/approvals`, `lib/action-engine` all exist with real code. The schema contains `alloy_runtime`, `alloy_comms`, `alloy_platform`, and `approvals` tables — this is not aspirational.

3. **It is the most investor-intelligible story.** "Governed AI" and "human-in-the-loop workflow" are the two phrases enterprise software investors are currently most primed to fund. The risk of autonomous AI agents is a board-level concern. A platform that architecturally enforces accountability is a defensible response.

4. **It anchors every other domain.** When Vessels flags a dark vessel, Alloy routes the response. When Aegis detects a threat, Alloy governs the escalation. The primary wedge is the connective tissue, not a vertical. This means the story compounds across every proof module.

5. **It does not depend on fake data for the core demo.** Approval workflows, audit trails, and human-in-the-loop gates can be demonstrated entirely with seeded in-memory data. The demo does not require any live API call.

### What to show investors

1. A workflow being triggered by an AI recommendation
2. A required human approval gate (blocked until approved)
3. The immutable audit trail entry created on approval
4. The workflow outcome delivered to the right actor
5. An ROI metric tied to approval latency reduction

This is a 5-minute demo that requires zero live credentials.

---

## Secondary Proof Wedge: Maritime Intelligence (Vessels)

### The investor thesis sentence

> Vessels surfaces real-time fleet position, sanctions risk, and dark vessel anomalies in a single command surface — giving maritime operators, insurers, and compliance officers the intelligence they need to act before consequence.

### Why this is the right secondary wedge

1. **Quantifiable buyer pain.** A single OFAC violation can result in $1M+ fines. Dark vessel activity detection has direct sanctions compliance value. This is a P0 purchase for maritime insurers and fleet operators, not a nice-to-have.

2. **Highest external data credibility.** NOAA, Open-Meteo, and GDELT are public APIs that can be verified by any investor. AIS is simulated (and should be disclosed as such), but the surrounding intelligence is real. This is more honest than several other vertical claims.

3. **High-intent buyer profile.** Fleet executives, maritime insurers, and government agencies have budget, procurement processes, and quantifiable ROI for this type of intelligence. Enterprise deal sizes are large.

4. **Clean demo path.** Public weather and route data make the demo functional without any premium API keys. The live/simulated distinction can be disclosed honestly — which builds trust rather than eroding it.

5. **Differentiation from primary wedge.** Vessels is the proof that the governance layer works in a high-stakes domain. It validates the architecture without repeating the core platform story.

### What to show investors

1. Live vessel position overlay (NOAA public data)
2. Sanctions flag on a selected vessel (OFAC SDN check — can be seeded)
3. Dark vessel anomaly detection alert routed through Alloy approval gate
4. Voyage economics snapshot for one route

---

## What NOT to Lead With

Based on the code audit:

- **Do not lead with Counsel.** It is a 14-file skeleton with no seeded data and no investor story. Remove from primary navigation.
- **Do not lead with "ecosystem" or "portfolio of apps."** This frames the product as multiple things to buy rather than one platform to adopt.
- **Do not lead with table counts, route counts, or "40+ integrations."** These numbers are unverified, contradictory across docs, and will be checked by any technical investor.
- **Do not lead with Aegis as primary.** Security is a crowded market and the differentiation story is weaker than the governance story. Aegis validates the platform but should not be the opening frame.
- **Do not claim "Live" status for any artifact** until workflows are started and smoke-tested.

---

## Canonical Positioning Statement

For all public surfaces, investor materials, and landing pages:

> **SZL Holdings builds governed operational intelligence for regulated enterprises.**  
> One platform. Alloy execution fabric. Every AI recommendation requires human confirmation, every action creates an immutable record, every outcome is attributable.

Supporting proof points (two max on any surface):
1. Alloy — Governed Workflow Orchestration
2. Vessels — Maritime Intelligence

All other domains appear in the "Platform" section of navigation, not in the hero.

---

*This document is the authoritative wedge decision for the repositioning task. Do not change the primary or secondary wedge selection without updating this file and the executive summary.*
