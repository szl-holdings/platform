# SZL Holdings — Product Surfaces

**Version:** 4.2  
**Date:** April 2026  
**Source:** `generated/platform-metrics.json` + `PRODUCT-SURFACES.md` (root)  
**Audience:** Engineers, product managers, investors, enterprise evaluators

> **Canonical summary.** For the full surface-level reference and roadmap context, see [`PRODUCT-SURFACES.md`](../PRODUCT-SURFACES.md) at the repo root.

---

## Surface Taxonomy

| Type | Surfaces |
|------|---------|
| **Command surfaces** | KORA (Lyte), Command Portal, LUMINA (Pulse) |
| **Execution fabric** | API Server (centralized backend) |
| **Mobile command** | APEX (`artifacts/szl-holdings-mobile`) |
| **Domain packs** | TENAX (Sentra), SEXTANT (Vessels), DOMAINE (Terra), Counsel, Carlota Jo, PARAGON (Aegis) |
| **Corporate platform** | SZL Holdings (web) |
| **Internal / tooling** | mockup-sandbox (PRAXIS design preview) |
| **Media** | SZL Demo Video |

---

## Web Applications

### KORA — Decision Intelligence
- **Artifact:** `artifacts/lyte-command-center` (`@workspace/lyte-command-center`)
- **Preview path:** `/lyte/`
- **Status:** Functional alpha
- **Audience:** Operations leads, CFOs, PMOs, executive teams

### PARAGON — Security & Defense Intelligence
- **Artifact:** `artifacts/aegis` (`@workspace/aegis`)
- **Preview path:** `/aegis/`
- **Status:** Functional alpha
- **Audience:** CISOs, SOC analysts, MSPs, compliance officers

### SEXTANT — Maritime Intelligence
- **Artifact:** `artifacts/vessels` (`@workspace/vessels`)
- **Preview path:** `/vessels/`
- **Status:** Functional alpha
- **Audience:** Fleet executives, maritime operations, insurers

### DOMAINE — Real Estate Intelligence
- **Artifact:** `artifacts/terra` (`@workspace/terra`)
- **Preview path:** `/terra/`
- **Status:** Functional alpha
- **Audience:** NYC brokers, real estate investors, portfolio managers

### Counsel — Legal Matter Command
- **Artifact:** `artifacts/counsel` (`@workspace/counsel`)
- **Preview path:** `/counsel/`
- **Status:** Functional alpha
- **Audience:** Legal partners, case managers, discovery analysts

### Carlota Jo — Private Advisory
- **Artifact:** `artifacts/carlota-jo` (`@workspace/carlota-jo`)
- **Preview path:** `/carlota-jo/`
- **Status:** Beta (most complete artifact; live integrations active)
- **Audience:** Founders, executives, UHNW clients

### TENAX — Cyber Resilience Command
- **Artifact:** `artifacts/sentra` (`@workspace/sentra`)
- **Preview path:** `/sentra/`
- **Status:** Functional alpha
- **Audience:** Security teams, resilience officers, enterprise CISOs

### Command Portal — Ecosystem Intelligence Hub
- **Artifact:** `artifacts/command` (`@workspace/command`)
- **Preview path:** `/command/`
- **Status:** Functional alpha
- **Audience:** Internal administrators, ecosystem operators

### LUMINA — AI Executive Briefing
- **Artifact:** `artifacts/pulse` (`@workspace/pulse`)
- **Preview path:** `/pulse/`
- **Status:** Functional alpha
- **Audience:** Executives requiring synthesized signal-to-briefing intelligence

### Conduit — Reverse ETL
- **Artifact:** `artifacts/conduit` (`@workspace/conduit`)
- **Preview path:** `/conduit/`
- **Status:** Functional alpha
- **Audience:** Data engineers, platform operators

### A11oy — Brand Orchestration Layer
- **Artifact:** `artifacts/a11oy` (`@workspace/a11oy`)
- **Preview path:** `/a11oy/`
- **Status:** Functional alpha (Phase 1 — all data in-memory demo; mutating endpoints return 501)
- **Audience:** Brand operators, platform administrators

### SZL Holdings — Corporate Platform
- **Artifact:** `artifacts/szl-holdings` (`@workspace/szl-holdings`)
- **Preview path:** `/`
- **Status:** Public Beta Candidate
- **Audience:** Investors, fund managers, enterprise evaluators

### API Server
- **Artifact:** `artifacts/api-server` (`@workspace/api-server`)
- **Preview path:** `/api/`
- **Status:** Live (internal service)
- **Note:** 180 route files, 6,063 route handlers, 59 SQL migrations. Source: `generated/platform-metrics.json`
- **Audience:** All frontends — not user-facing

---

## Mobile Surfaces

### APEX — Unified Mobile Command
- **Artifact:** `artifacts/szl-holdings-mobile` (`@workspace/szl-holdings-mobile`)
- **Preview path:** `/szl-holdings-mobile/`
- **Status:** Functional alpha
- **Platform:** iOS + Android (Expo / React Native)
- **Domains:** All platform domains in one app

---

## Media Surfaces

### SZL Holdings — Governed Autonomy Demo
- **Artifact:** `artifacts/szl-demo-video` (`@workspace/szl-demo-video`)
- **Preview path:** `/szl-demo-video/`
- **Status:** Published
- **Audience:** Investors, enterprise evaluators, design partners
- **Purpose:** Animated demonstration of the Governed Autonomy thesis

---

## Design / Internal Surfaces

### PRAXIS — Component Preview
- **Artifact:** `artifacts/mockup-sandbox` (`@workspace/mockup-sandbox`)
- **Preview path:** `/nexus/`
- **Status:** Internal — design and frontend engineers only

---

## Archived Surfaces

These surfaces had registered artifacts that have since been removed from disk. Their API routes and schemas remain active on the API server.

| Surface | Former Artifact | Notes |
|---------|----------------|-------|
| PRISM Counsel | `artifacts/prism-counsel` | Superseded by Counsel; legacy `/api/prism-counsel/*` routes retained |
| IMPERIUM — Cloud Sovereignty | `artifacts/imperium` | Merged into Command Portal; governance routes active |

---

## Counts (Source: `generated/platform-metrics.json`)

| Metric | Count |
|--------|-------|
| Artifacts on disk | 19 |
| Library packages | 51 |
| Standalone packages | 101 |
| Total packages | 199 (MEASURED; `artifacts/SOURCE_OF_TRUTH.json`) |
| API route files | 180 |
| API route handlers | 6,063 |
| DB table definitions | 1,047 |
| SQL migrations | 59 |

---

*Last verified: April 2026. Counts sourced from `generated/platform-metrics.json`. To refresh: `npx tsx scripts/audit/generate-platform-metrics.ts`*
