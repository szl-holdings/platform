# Domain Pack Catalog — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Buyers, partners, sales, product, engineering
**Companion docs:** [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) · [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) · [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md)

---

## What a Domain Pack Is

A **domain pack** is a bundled extension of the SZL platform into a specific operational domain. Each pack contributes signal connectors, domain-specific agents, an action vocabulary, scenario library entries, RBAC role mappings, proof chain templates, and a UI surface — all built on the same six primitives that every other pack uses.

A pack is not a separate product. It is an entitlement on the shared platform.

See [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) for the primitives every pack inherits.

---

## Pack Inventory

| Pack | Status | Surface | Edition availability |
|------|--------|---------|---------------------|
| Aegis — Defense & Intelligence | Beta | `/aegis` + Command Portal | All editions (entitlement) |
| Vessels — Maritime Intelligence | Beta | `/vessels` + CORTEX maritime | All editions |
| Terra — Real Estate Intelligence | Beta | `/terra` + CORTEX deal view | All editions |
| PRISM Counsel — Legal Matter | Beta | `/prism-counsel` | All editions |
| Carlota Jo — Advisory & Client Portal | Beta | `/carlota-jo` | All editions |
| IMPERIUM — Sovereign / GovTech | Roadmap (FY27) | TBD | Enterprise + bespoke |

---

## Pack Anatomy

Every pack contributes the following components:

| Component | Description |
|-----------|-------------|
| Signal connectors | Domain-specific data ingestion (AIS, STIX/TAXII, court records, property data, etc.) |
| Domain agents | Specialized AI agents that recommend domain actions |
| Action vocabulary | Pack-defined verbs (e.g., `sanction-vessel`, `escalate-incident`) registered with Alloy |
| Scenario library entries | Monte Carlo scenarios for domain-relevant decisions |
| RBAC role mappings | Pack-specific role names mapped to platform-level role hierarchy |
| Proof chain templates | Pre-built citation patterns for common pack actions |
| UI surface | Domain-specific screens built on the shared design system |
| Documentation | Operator guides, agent descriptions, signal source references |

---

## Aegis — Unified Defense & Intelligence

**Tagline:** Threat intelligence and incident response with structural governance.

**Signal sources:** STIX/TAXII feeds, EDR alerts, SIEM bridges, threat intel partners, deception grid telemetry, INCA intelligence.

**Domain agents:** Sentinel (threat triage), Watchkeeper (incident triage), Rampart (containment recommender), INCA-Analyst (intel synthesis).

**Action vocabulary:** `triage-incident`, `contain-host`, `escalate-soc`, `dismiss-alert`, `update-playbook`, `enrich-indicator`.

**Scenario library:** `AEGIS_CYBER_RISK` (expected loss given current controls), `AEGIS_RESPONSE_TIME_DECAY` (impact of delayed response).

**RBAC mapping:** `security_analyst`, `analyst`, `operator`, `org_admin`.

**Surfaces:** `/aegis` web app, Command Portal Aegis tile, CORTEX security feed.

**Differentiation:** Unlike a SOC platform, every recommended action carries proof chain attribution and an approval gate appropriate to its risk class.

---

## Vessels — Maritime Intelligence

**Tagline:** Fleet intelligence, voyage economics, sanctions screening on a single governed surface.

**Signal sources:** AIS positional data, sanctions lists (OFAC, UN, EU, UK), port arrival data, charter rate feeds, fuel cost indices.

**Domain agents:** Helmsman (route economics), Lookout (sanctions screen), Quartermaster (port turn-around).

**Action vocabulary:** `sanction-screen-vessel`, `flag-route`, `hold-departure`, `release-vessel`, `record-charter`, `simulate-voyage-cost`.

**Scenario library:** `VESSELS_VOYAGE_COST` (total cost with fuel/port/charter uncertainty), `VESSELS_SANCTIONS_EXPOSURE` (regulatory risk score).

**RBAC mapping:** `maritime_ops_user`, `analyst`, `operator`.

**Surfaces:** `/vessels` web app, CORTEX maritime view, exception center.

**Differentiation:** Sanctions screening, voyage economics, and fleet ops on one platform with cryptographically attributable recommendations.

---

## Terra — Real Estate Intelligence

**Tagline:** Distressed property intelligence and ownership-graph-driven deal pipeline.

**Signal sources:** County property records, lien registries, ownership graphs, market signal feeds, distress indicators (tax delinquency, foreclosure filings).

**Domain agents:** Surveyor (property scoring), Cartographer (ownership graph), Closer (deal pipeline progression).

**Action vocabulary:** `pursue-property`, `qualify-deal`, `walk-away`, `close-deal`, `enrich-owner`, `simulate-roi`.

**Scenario library:** `TERRA_DEAL_RETURN` (expected ROI on distressed acquisition), `TERRA_HOLD_RISK` (cost of carry under uncertainty).

**RBAC mapping:** `analyst`, `operator`, `sales_delivery_user`.

**Surfaces:** `/terra` web app, CORTEX deal view.

**Differentiation:** Ownership graph and distressed-property scoring with full audit attribution from signal to close.

---

## PRISM Counsel — Legal Matter Command

**Tagline:** Matter management with structural recovery operations and proof-chain-backed approvals.

**Signal sources:** Court records, document review pipeline outputs, recovery operations data, no-fault module feeds.

**Domain agents:** Counsel (matter intake), Recorder (document review summarization), Recoverer (recovery pipeline).

**Action vocabulary:** `intake-matter`, `file-document`, `settle`, `escalate-counsel`, `record-recovery`, `simulate-settlement`.

**Scenario library:** `PRISM_SETTLEMENT_RANGE` (likely settlement under case strength + jurisdiction).

**RBAC mapping:** `analyst`, `operator`, `approver`, `org_admin`.

**Surfaces:** `/prism-counsel` web app.

**Differentiation:** Matter operations with the same proof chain and approval governance as every other domain — recovery operations are first-class.

---

## Carlota Jo — Advisory & Client Portal

**Tagline:** Client-facing advisory engagement layer on the same governed infrastructure.

**Signal sources:** Bookings, client engagement events, content publishing pipeline, advisory engagement records.

**Domain agents:** Concierge (booking triage), Steward (engagement progression), Curator (content recommendations).

**Action vocabulary:** `schedule-booking`, `deliver-engagement`, `invoice-client`, `publish-content`.

**Scenario library:** None pack-specific yet (scheduled FY27).

**RBAC mapping:** `viewer` (client), `operator`, `org_admin`.

**Surfaces:** `/carlota-jo` public + client portal.

**Differentiation:** Client-facing portal that inherits the same audit, identity, and governance as the operator-facing platform — no separate trust posture.

---

## IMPERIUM — Sovereign / GovTech (Roadmap, FY27)

**Tagline:** Sovereign-controlled deployment of the governed decision platform.

**Status:** Roadmap. Pre-design conversations only. Customer-controlled environment options being scoped.

**Anticipated signal sources:** Customer-supplied; sovereign data sources by negotiation.

**Anticipated agent set:** Customer-configurable from the standard primitives + bespoke domain agents.

**Anticipated availability:** Enterprise edition + bespoke MSA, FY27 target.

---

## Pack Selection Guidance

| Customer profile | Recommended packs |
|-----------------|-------------------|
| Mid-market security operator | Aegis (primary) |
| Maritime operator with sanctions exposure | Vessels (primary) + Aegis (optional) |
| Real estate investor with distressed pipeline | Terra (primary) |
| Law firm or in-house counsel | PRISM Counsel (primary) + Carlota Jo (optional) |
| Professional services firm | Carlota Jo (primary) + PRISM Counsel (optional) |
| Multi-domain holding | Pro edition with 3 packs; Enterprise if regulated |

---

## How New Packs Are Added

Adding a new domain pack to the catalog requires:

1. Domain agent set defined and live in the AI engine
2. Signal connectors built and tested
3. Action vocabulary registered with Alloy and reflected in Covenant Policy
4. At least one Monte Carlo scenario for the pack
5. RBAC role mappings published in [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md)
6. UI surface meeting the design system bar
7. Operator documentation published
8. At least one design partner committed to validation
9. Founder approval

Once approved, the pack is added to this document, [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md), [PLATFORM_EDITIONS.md](PLATFORM_EDITIONS.md), and the public site.

---

## Related Documents

| Document | Path |
|----------|------|
| Product packaging | [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Category positioning | [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) |
| Access control matrix | [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) |
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
