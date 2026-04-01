# SZL Holdings — Platform Roadmap

*Last updated: Q1 2026*

---

## Roadmap Overview

SZL Holdings is building a unified platform ecosystem for business observability, defense intelligence, real estate intelligence, maritime operations, and premium advisory. Every platform shares one intelligence backbone (Alloy), one design system, and one data layer.

This document describes the platform's current state and directional priorities. Internal sprint tracking, triage details, and P1/P2 sequencing are managed in the private workspace.

---

## Platform Status

| Platform | Category | Current State |
|----------|----------|--------------|
| **Lyte** | Business Observability | Live — PRISM framework, action queue, signal lifecycle, readiness module |
| **Aegis** | Defense & Intelligence | Live — SOC operations, managed services command, intelligence engine |
| **Terra** | Real Estate Intelligence | Live — NYC distress data pipeline, broker workflow, deal tracking |
| **Vessels** | Maritime Intelligence | Live — Fleet operations, voyage economics, AIS telemetry, dark vessel detection |
| **Carlota Jo** | Private Advisory | Live — Web app and native mobile client |
| **Alloy** | Execution Fabric | Live — Workflow engine, audit trail, agent coordination |

---

## Strategic Directions

### Near-Term

- **Execution accountability hardening** — Deepen the Lyte + Alloy integration loop: signal → triage → confirmed action → audit. The goal is a provably shorter cycle from observation to verified resolution.
- **Enterprise access model** — Multi-tenant SSO, SCIM provisioning, and role-scoped data isolation are the prerequisites for enterprise pilots. Infrastructure is in place; activation is the next step.
- **Commercial flow activation** — Stripe billing infrastructure is built. Activating payment flows for Carlota Jo, Terra, and Vessels completes the revenue architecture.

### Medium-Term

- **Aegis federal track** — FedRAMP readiness preparation for the Aegis defense platform.
- **Vessels live AIS integration** — Transitioning from seeded fleet data to real-time AIS telemetry.
- **Terra national expansion** — Extending beyond NYC to broader U.S. distressed property coverage.
- **Alloy Scenario API** — External API offering built on the Alloy scenario modeling engine.

### Platform Architecture Priorities

- Cross-domain signal correlation (linking events across Lyte, Aegis, Vessels, and Terra)
- SOC 2 Type II preparation for the defense and maritime verticals
- Mobile command parity with web dashboards across all platforms

---

## Architecture Stability

The monorepo architecture, shared design system, shared database schema, and shared authentication layer are production-stable. All platforms share one Express API server, one PostgreSQL database, and one WebSocket real-time layer.

New verticals are added as domain-specific Observe layers on top of the shared infrastructure — not as separate stacks. This compounds engineering leverage as the ecosystem grows.

---

*This document is the public-facing roadmap summary. Detailed execution planning is maintained internally.*
