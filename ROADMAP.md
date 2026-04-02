# SZL Holdings — Product Roadmap

*Public-safe directional roadmap. Specific timelines and competitive implementation details are not disclosed.*

**Last updated:** April 2026

---

## Ecosystem Tiering

The SZL ecosystem operates under a formal three-tier investment framework. Every artifact has an assigned tier:

| Tier | Label | Current Assignments |
|------|-------|-------------------|
| **1** | Flagship Now | Lyte (web), Alloy (engine), API Server, SZL Holdings (web), Shared Libraries |
| **2** | Pilot-Adjacent | Vessels (web), Lyte Mobile |
| **3** | Parked / Staged | Aegis, Terra, Carlota Jo, Stephen Site, all remaining mobile apps |

**The commercial wedge is Lyte + Alloy.** Tier 2 and Tier 3 platforms are built and operational; they advance when commercial traction in Tier 1 earns the right to expand.

See [Tiering Plan](docs/internal/operations/tiering-plan.md) · [System Inventory](docs/internal/operations/system-inventory.md)

---

## Readiness & Environment Standards

All SZL products use the five-level readiness scale defined in the [Readiness Standard](docs/public/readiness-standard.md):

**Concept → Prototype → Functional Alpha → Pilot Ready → Production**

Current state: all web platforms at **Functional Alpha**. All mobile apps at **Prototype**.

Environment labels (Demo / Seeded Data / Pilot / Live) are defined in the [Environment Labeling Standard](docs/public/environment-labeling-standard.md). Every non-Live surface must display its environment label visibly.

See [Readiness Standard](docs/public/readiness-standard.md) · [Environment Labeling Standard](docs/public/environment-labeling-standard.md)

---

## Current State — v0.1.0 (Functional Alpha)

All five platforms (Lyte, Aegis, Terra, Vessels, Carlota Jo) are feature-complete at the functional alpha stage. The full monorepo — 16 artifacts, shared infrastructure, mobile apps, and documentation — is built and operational.

The platform is pre-commercial. Revenue activation, live data feeds, and enterprise deployment are Phase 1 milestones (in progress).

For detailed current capabilities, see [CHANGELOG.md](CHANGELOG.md) and [docs/investor/product-readiness.md](docs/investor/product-readiness.md).

---

## Phase 1 — Commercial Activation *(in progress)*

The goal of Phase 1 is to convert functional alpha into a revenue-generating, design-partner-ready commercial platform.

- **Revenue activation** — Stripe billing activated for Vessels, Lyte, Terra, and Carlota Jo
- **Design partner onboarding** — first paying commercial pilots in target verticals
- **Production infrastructure** — Redis session store, Sentry error tracking, Azure deployment
- **Live data feeds** — AIS telemetry (Vessels), NYC distress pipeline validation (Terra)
- **Lyte pilot** — first business observability pilot with an operating company

---

## Phase 2 — Enterprise Readiness

The goal of Phase 2 is to make the platform evaluatable and purchasable by mid-market and enterprise buyers.

- **Enterprise SSO / SCIM 2.0** — federated identity for enterprise orgs
- **SOC 2 Type II audit preparation** — formal compliance track
- **OpenAPI developer portal** — documentation and partner integration portal
- **FedRAMP readiness track** — Aegis federal/SLED market pathway
- **White-glove onboarding** — structured deployment and enablement for enterprise accounts

---

## Phase 3 — Platform Expansion

The goal of Phase 3 is to compound the infrastructure investment by expanding distribution and cross-domain signal correlation.

- **Salesforce AppExchange** — Lyte connector available on AppExchange
- **Jira Marketplace** — Alloy workflow integration for engineering and ops teams
- **Cross-domain signal correlation** — Lyte ↔ Aegis ↔ Terra ↔ Vessels signal sharing
- **Partner and reseller program** — channel partners for vertical-specific distribution
- **International expansion** — non-US maritime (Vessels) and real estate (Terra) coverage

---

## Architecture North Star

The long-term architecture vision is a unified operating intelligence layer across industries — where the same signal-to-action pipeline, the same audit model, and the same AI governance framework can be applied to any operational domain.

Each new vertical compresses infrastructure cost and increases the value of the shared backbone. The moat is the system, not any single product.

---

## What Is Not On This Roadmap

- Specific release dates
- Revenue or ARR targets
- Competitive intelligence about feature differentiation
- Acquisition or exit strategy details

---

*For questions about the roadmap, design partnerships, or enterprise evaluation: [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)*

*For the full platform overview, see [docs/PLATFORM_OVERVIEW.md](docs/PLATFORM_OVERVIEW.md)*  
*For technical architecture, see [docs/architecture/system-overview.md](docs/architecture/system-overview.md)*
