# Product Surfaces — SZL Holdings Platform

**Version:** 4.0 | **Date:** April 2026 | **Audience:** Engineers, product managers, investors, enterprise evaluators

> **Canonical summary.** For the full product surface reference, see [`docs/product/product-surfaces.md`](docs/product/product-surfaces.md).

---

## Surface Taxonomy

| Type | Examples |
|------|---------|
| **Command surface** | KORA (Lyte Command Center), Command Portal, Pulse |
| **Execution fabric** | FORGE (shared backbone, formerly Alloy) |
| **Mobile command** | APEX (`artifacts/szl-holdings-mobile`) |
| **Domain pack** | TENAX (Sentra), SEXTANT (Vessels), DOMAINE (Terra), Counsel, Carlota Jo, LUMINA (Pulse), PARAGON (Aegis) |
| **Corporate platform** | SZL Holdings (web) |
| **Internal / tooling** | API Server, mockup-sandbox (NEXUS) |
| **Media** | SZL Demo Video — see [`artifacts/szl-demo-video/deliverables/`](artifacts/szl-demo-video/deliverables/) |

---

## Web Applications

### Lyte — Business Observability
- **Artifact:** `artifacts/lyte-command-center`
- **Preview path:** `/lyte/`
- **Status:** Functional alpha
- **Audience:** Operations leads, CFOs, PMOs, executive teams

### Aegis — Security & Defense Intelligence
- **Artifact:** `artifacts/aegis`
- **Preview path:** `/aegis/`
- **Status:** Functional alpha
- **Audience:** CISOs, SOC analysts, MSPs, compliance officers

### Vessels — Maritime Intelligence
- **Artifact:** `artifacts/vessels`
- **Preview path:** `/vessels/`
- **Status:** Functional alpha
- **Audience:** Fleet executives, maritime operations, insurers

### Terra — Real Estate Intelligence
- **Artifact:** `artifacts/terra`
- **Preview path:** `/terra/`
- **Status:** Functional alpha
- **Audience:** NYC brokers, real estate investors, portfolio managers

### PRISM Counsel — Legal Matter Command *(Archived)*
- **Artifact:** `artifacts/prism-counsel`
- **Preview path:** `/prism-counsel/`
- **Status:** Archived (API routes and schema retained; frontend removed)

### Counsel — Legal Matter Command
- **Artifact:** `artifacts/counsel`
- **Preview path:** `/counsel/`
- **Status:** Functional alpha
- **Audience:** Legal partners, case managers, discovery analysts

### IMPERIUM — Cloud Sovereignty
- **Artifact:** `artifacts/imperium`
- **Preview path:** `/imperium/`
- **Status:** Functional alpha
- **Audience:** Cloud infrastructure teams, platform operators, governance officers

### Carlota Jo — Private Advisory
- **Artifact:** `artifacts/carlota-jo`
- **Preview path:** `/carlota-jo/`
- **Status:** Live
- **Audience:** Founders, executives, UHNW clients

### Sentra — Cyber Resilience Command
- **Artifact:** `artifacts/sentra`
- **Preview path:** `/sentra/`
- **Status:** Functional alpha
- **Audience:** Security teams, resilience officers, enterprise CISOs

### Command Portal — Ecosystem Intelligence Hub
- **Artifact:** `artifacts/command`
- **Preview path:** `/command/`
- **Status:** Functional alpha
- **Audience:** Internal administrators, ecosystem operators

### Pulse — AI Executive Briefing
- **Artifact:** `artifacts/pulse`
- **Preview path:** `/pulse/`
- **Status:** Functional alpha
- **Audience:** Executives requiring synthesized signal-to-briefing intelligence

### SZL Holdings — Corporate Platform
- **Artifact:** `artifacts/szl-holdings`
- **Preview path:** `/`
- **Status:** Public Beta Candidate
- **Audience:** Investors, fund managers, enterprise evaluators

### API Server
- **Artifact:** `artifacts/api-server`
- **Preview path:** `/api/`
- **Status:** Live (internal service)
- **Audience:** All frontends — not user-facing

---

## Media Surfaces

### SZL Holdings — Governed Autonomy Demo
- **Artifact:** `artifacts/szl-demo-video`
- **Preview path:** `/szl-demo-video/`
- **Status:** Published
- **Audience:** Investors, enterprise evaluators, design partners
- **Purpose:** Animated demonstration of the Governed Autonomy thesis

---

## Mobile Surfaces

### CORTEX — Unified Mobile Command
- **Artifact:** `artifacts/szl-holdings-mobile`
- **Preview path:** `/szl-holdings-mobile/`
- **Status:** Functional alpha
- **Platform:** iOS + Android (Expo / React Native)
- **Domains:** All 9 platform domains in one app

### CORTEX Mobile (Next Generation)
- **Artifact:** `artifacts/cortex-mobile`
- **Preview path:** `/cortex-mobile/`
- **Status:** Work in progress

---

## Domain-Specific Mobile Apps — Roadmap (Not Yet Built)

> None of the apps below are registered artifacts or built code. They are planned companions to CORTEX (`artifacts/szl-holdings-mobile`). Domain-specific mobile apps will only be split out from CORTEX when a paying customer or design partner requires a standalone experience.

| App | Planned Artifact | Status |
|-----|------------------|--------|
| Aegis Mobile | `artifacts/aegis-mobile` (not registered) | Roadmap — H2 2026 |
| Vessels Mobile | `artifacts/vessels-mobile` (not registered) | Roadmap — H2 2026 |
| Terra Mobile | `artifacts/terra-mobile` (not registered) | Roadmap — 2027 |
| Lyte Mobile | `artifacts/lyte-mobile` (not registered) | Roadmap — 2027 |
| Carlota Jo Mobile | `artifacts/carlota-jo-mobile` (not registered) | Roadmap — H2 2026 |

---

## Development / Internal Surfaces

### Component Preview Server
- **Artifact:** `artifacts/mockup-sandbox`
- **Preview path:** `/nexus/`
- **Audience:** Internal — design and frontend engineers only

---

*Last verified against codebase: April 2026.*
*For full surface specifications see [`docs/product/product-surfaces.md`](docs/product/product-surfaces.md).*
