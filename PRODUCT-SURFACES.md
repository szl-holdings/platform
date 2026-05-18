# Product Surfaces — SZL Holdings Platform

**Version:** 4.1 | **Date:** April 2026 | **Audience:** Engineers, product managers, investors, enterprise evaluators

> **Canonical summary.** For the full product surface reference, see [`docs/product/product-surfaces.md`](docs/product/product-surfaces.md).

---

## Surface Taxonomy

| Type | Examples |
|------|---------|
| **Command surface** | KORA (Lyte Command Center), Command Portal, LUMINA (Pulse) |
| **Execution fabric** | FORGE (shared backbone) · Continuum — Business Observability Fabric |
| **Mobile command** | APEX (roadmap — no mobile artifact currently registered; see Mobile Surfaces) |
| **Domain pack** | TENAX (Sentra), SEXTANT (Vessels), DOMAINE (Terra), Counsel, Carlota Jo, LUMINA (Pulse), PARAGON (Aegis) |
| **Corporate platform** | SZL Holdings (web) |
| **Internal / tooling** | API Server, mockup-sandbox (PRAXIS) |
| **Media** | SZL Demo Video — see [`artifacts/szl-demo-video/deliverables/`](artifacts/szl-demo-video/deliverables/) |

---

## Web Applications

### KORA — Decision Intelligence
- **Artifact:** `artifacts/lyte-command-center`
- **Preview path:** `/lyte/`
- **Status:** Functional alpha
- **Audience:** Operations leads, CFOs, PMOs, executive teams

### PARAGON — Security & Defense Intelligence
- **Artifact:** `artifacts/aegis`
- **Preview path:** `/aegis/`
- **Status:** Functional alpha
- **Audience:** CISOs, SOC analysts, MSPs, compliance officers

### SEXTANT — Maritime Intelligence
- **Artifact:** `artifacts/vessels`
- **Preview path:** `/vessels/`
- **Status:** Functional alpha
- **Audience:** Fleet executives, maritime operations, insurers

### DOMAINE — Real Estate Intelligence
- **Artifact:** `artifacts/terra`
- **Preview path:** `/terra/`
- **Status:** Functional alpha
- **Audience:** NYC brokers, real estate investors, portfolio managers

### Counsel — Legal Matter Command
- **Artifact:** `artifacts/counsel`
- **Preview path:** `/counsel/`
- **Status:** Functional alpha
- **Audience:** Legal partners, case managers, discovery analysts

### Carlota Jo — Private Advisory
- **Artifact:** `artifacts/carlota-jo`
- **Preview path:** `/carlota-jo/`
- **Status:** Beta (most complete artifact; live integrations active)
- **Audience:** Founders, executives, UHNW clients

### TENAX — Cyber Resilience Command
- **Artifact:** `artifacts/sentra`
- **Preview path:** `/sentra/`
- **Status:** Functional alpha
- **Audience:** Security teams, resilience officers, enterprise CISOs

### Command Portal — Ecosystem Intelligence Hub
- **Artifact:** `artifacts/command`
- **Preview path:** `/command/`
- **Status:** Functional alpha
- **Audience:** Internal administrators, ecosystem operators

### LUMINA — AI Executive Briefing
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

## Archived Web Surfaces

These surfaces had registered artifacts that have since been removed from disk. Their API routes and schemas remain active on the API server.

| Surface | Former Artifact | Notes |
|---------|----------------|-------|
| PRISM Counsel | `artifacts/prism-counsel` | Superseded by Counsel (`artifacts/counsel`); legacy `/api/prism-counsel/*` routes retained |
| IMPERIUM — Cloud Sovereignty | `artifacts/imperium` | Merged into Command Portal; governance routes active |

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

> **Status reconciliation:** No mobile artifacts are currently registered in this monorepo. Every mobile surface listed below is **roadmap**, not shipped. This section was previously ambiguous about which mobile apps existed; see [`docs/operations/known-gaps.md`](docs/operations/known-gaps.md) entries **TD-006** (mobile surface documentation accuracy) and **KG031** (status page / customer-visible roadmap) for the tracking record.

### Shipped Mobile Surfaces

_None._ There are no registered mobile artifacts at this time. Mobile access today is delivered via the responsive web surfaces listed above.

### Roadmap — Unified Mobile Command

| App | Planned Artifact | Status | Tracking |
|-----|------------------|--------|----------|
| 🗺️ APEX — Unified Mobile Command (all 9 domains, Expo / React Native) | `artifacts/szl-holdings-mobile` (not registered) | Roadmap — flagship mobile target | [TD-006](docs/operations/known-gaps.md#full-gap-registry) |

### Roadmap — Domain-Specific Mobile Apps

> The apps below are planned companions to APEX. None are registered artifacts or built code. Domain-specific mobile apps will only be split out from APEX when a paying customer or design partner requires a standalone experience.

| App | Planned Artifact | Status | Tracking |
|-----|------------------|--------|----------|
| 🗺️ PARAGON Mobile | `artifacts/paragon-mobile` (not registered) | Roadmap — H2 2026 | [TD-006](docs/operations/known-gaps.md#full-gap-registry) |
| 🗺️ SEXTANT Mobile | `artifacts/sextant-mobile` (not registered) | Roadmap — H2 2026 | [TD-006](docs/operations/known-gaps.md#full-gap-registry) |
| 🗺️ DOMAINE Mobile | `artifacts/domaine-mobile` (not registered) | Roadmap — 2027 | [TD-006](docs/operations/known-gaps.md#full-gap-registry) |
| 🗺️ KORA Mobile | `artifacts/kora-mobile` (not registered) | Roadmap — 2027 | [TD-006](docs/operations/known-gaps.md#full-gap-registry) |
| 🗺️ Carlota Jo Mobile | `artifacts/carlota-jo-mobile` (not registered) | Roadmap — H2 2026 | [TD-006](docs/operations/known-gaps.md#full-gap-registry) |

---

## Development / Internal Surfaces

### Component Preview Server
- **Artifact:** `artifacts/mockup-sandbox`
- **Preview path:** `/nexus/`
- **Audience:** Internal — design and frontend engineers only

---

*Last verified against codebase: April 25, 2026 (Moonshot Phase 1 audit).*
*For full surface specifications see [`docs/product/product-surfaces.md`](docs/product/product-surfaces.md).*
