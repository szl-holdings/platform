# SZL Holdings — System Inventory

**Version**: 1.0
**Date**: 2026-04-02
**Owner**: Stephen Lutar, Founder & CEO
**Classification**: Internal — Operations

---

## Purpose

Complete operating inventory of every artifact in the SZL Holdings monorepo. This is the authoritative baseline for readiness, tiering, and investment decisions. All labels use the canonical [Readiness Standard](../../public/readiness-standard.md) and [Environment Labeling Standard](../../public/environment-labeling-standard.md).

---

## Readiness Scale

Five-level canonical readiness scale per the [Readiness Standard](../../public/readiness-standard.md):

| Level | Label | Meaning |
|-------|-------|---------|
| 0 | Concept | Idea only; no code written |
| 1 | Prototype | Proof-of-concept; not externally usable; architecture may change |
| 2 | Functional Alpha | Core workflows end-to-end; suitable for internal testing and controlled demos |
| 3 | Pilot Ready | Feature-complete for a defined use case; enterprise controls active; suitable for design-partner pilots |
| 4 | Production | Fully hardened; SLA-backed; monitoring, incident response, and support in place |

---

## Environment Labels

Four-label canonical environment model per the [Environment Labeling Standard](../../public/environment-labeling-standard.md):

| Label | Meaning |
|-------|---------|
| **Live** | Connected to real data sources; production infrastructure; actions have real consequences |
| **Pilot** | Real infrastructure, limited scope, design-partner data; actions may have real consequences within pilot boundary |
| **Demo** | Curated demonstration environment; seeded or simulated data; no real-world consequences |
| **Seeded Data** | Real system with pre-populated test data; infrastructure live, data synthetic |

---

## Inventory Key

| Field | Description |
|-------|-------------|
| **Owner** | Responsible party (product/eng) for this artifact |
| **Route** | URL path where artifact is accessible (N/A for mobile apps with no fixed web route) |
| **Platform** | Runtime / framework |
| **Readiness** | Current label per the 5-level readiness scale |
| **Environment** | Current data environment label |
| **Auth** | Authentication implemented |
| **Payments** | Stripe billing wired |
| **Analytics** | Event tracking instrumented |
| **Monitoring** | APM/health endpoints active |
| **Last Build** | Most recent verified build status |
| **Tier** | Strategic tier assignment (1/2/3) |

---

## Web Applications

### API Server (`artifacts/api-server`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/api` |
| **Platform** | Node.js / Express |
| **Readiness** | Functional Alpha |
| **Environment** | Seeded Data |
| **Auth** | Yes — OIDC PKCE, org-scoped RBAC, SCIM 2.0, Azure AD multi-tenant SSO |
| **Payments** | Yes — Stripe (routes active, keys pending production) |
| **Analytics** | Partial — Pino structured logging; no external analytics pipeline |
| **Monitoring** | Yes — `/api/health`, `/api/healthz`, `/api/health/detailed`, Pino APM logging |
| **Last Build** | HTTP 200 · All route domains active (March 30, 2026) |
| **Tier** | 1 — Flagship / Shared Backbone |
| **Notes** | Single Express process serving all platform backends. Shared backbone for auth, DB, Alloy, audit, AI engine. Every artifact depends on this service. |

---

### Lyte Command Center (`artifacts/lyte-command-center`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/lyte-command-center/` |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Seeded Data |
| **Auth** | Yes — OIDC PKCE required for all routes |
| **Payments** | Partial — Stripe routes defined in API; billing activation pending |
| **Analytics** | Partial — event schema exists; no external analytics provider wired |
| **Monitoring** | Partial — API health active; no frontend Sentry/APM yet |
| **Last Build** | Running — all PRISM surfaces, action queue, approval center operational |
| **Tier** | 1 — Flagship Now |
| **Notes** | Primary commercial wedge. PRISM framework (Pulse/Risk/Intelligence/Signals/Motion). Approaching Pilot Ready. Highest engineering investment priority. |

---

### SZL Holdings (`artifacts/szl-holdings`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/` |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Live (public marketing and corporate content) |
| **Auth** | Partial — `/admin` and `/kpis` require OIDC auth; all public routes open |
| **Payments** | No — corporate site only |
| **Analytics** | No — not instrumented |
| **Monitoring** | No — static marketing application |
| **Last Build** | HTTP 200 (March 30, 2026) |
| **Tier** | 1 — Flagship Now (corporate presence) |
| **Notes** | Primary destination for investor, enterprise, and partner evaluation. Top of brand hierarchy. Must reflect current readiness labels and tiering accurately. |

---

### Aegis — Unified Defense & Intelligence (`artifacts/firestorm`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/firestorm/` |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Demo (mix of seeded and simulated threat data) |
| **Auth** | Yes — OIDC PKCE |
| **Payments** | No — enterprise billing not yet wired for Aegis |
| **Analytics** | No |
| **Monitoring** | Partial — API health; no frontend error tracking |
| **Last Build** | Running — SOC, Command, Intelligence workspaces operational |
| **Tier** | 3 — Parked / Staged |
| **Notes** | SOC operations, MITRE ATT&CK v14, SOAR playbooks, INCA AI research. Strong capability set. Parked pending Lyte/Alloy commercial validation. FedRAMP track medium-term. |

---

### Terra — Real Estate Intelligence (`artifacts/terra`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/terra/` |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Seeded Data (NYC distress pipeline active but unvalidated in production) |
| **Auth** | Yes — OIDC PKCE |
| **Payments** | Partial — Stripe routes defined; billing activation pending |
| **Analytics** | No |
| **Monitoring** | Partial — API health; no frontend error tracking |
| **Last Build** | Running — distress pipeline, deal management, property map operational |
| **Tier** | 3 — Parked / Staged |
| **Notes** | NYC HPD, DOF, DOB, ACRIS, ECB data pipeline. Strong expansion candidate. Deferred investment until Lyte/Alloy reach Pilot Ready. |

---

### Vessels — Maritime Intelligence (`artifacts/vessels`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/vessels/` |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Demo (simulated fleet data; live AIS integration pending) |
| **Auth** | Yes — OIDC PKCE for dashboard; public marketing routes open |
| **Payments** | Partial — Stripe routes defined; billing activation pending |
| **Analytics** | No |
| **Monitoring** | Partial — API health; DEMO banner visible in UI |
| **Last Build** | HTTP 200 (March 30, 2026) — fleet command, voyage analytics, AIS tracking operational |
| **Tier** | 2 — Pilot-Adjacent |
| **Notes** | AIS telemetry, voyage economics, dark vessel detection, sanctions screening. Exception Center with consequence modeling. Second-highest expansion priority. Enterprise/government/insurance buyer profile creates strong commercial leverage. |

---

### Carlota Jo — Advisory Web App (`artifacts/carlota-jo`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/carlota-jo/` |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Live (advisory content; no external data feeds) |
| **Auth** | Partial — inquiry workflow; full auth not required for public advisory site |
| **Payments** | Partial — Stripe strategy session and retainer prices defined; activation pending |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | HTTP 200 (March 30, 2026) |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Premium advisory brand. Near-term revenue pathway via client intake (Stripe checkout only). Deferred technical investment; operational continuity maintained. |

---

### Stephen Lutar — Founder Site (`artifacts/stephen-site`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/stephen/` |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Live (portfolio and founder content) |
| **Auth** | No — public site |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | HTTP 200 (March 30, 2026) |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Founder authority and personal brand. Separate from SZL Holdings corporate identity. Maintained; no active development investment. |

---

### Component Preview Server (`artifacts/mockup-sandbox`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | `/__mockup` (internal dev tool) |
| **Platform** | React / Vite / TypeScript |
| **Readiness** | Functional Alpha |
| **Environment** | Demo |
| **Auth** | No — internal dev tool |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Running (internal tooling) |
| **Tier** | 1 — Shared Backbone (dev tooling) |
| **Notes** | Design system component preview. Internal development tool. Not customer-facing. |

---

## Mobile Applications

*Mobile applications do not have a fixed web route. Deep-link convention: `szl://[app]/[screen]`. The route field is set to N/A for all mobile artifacts.*

### Lyte Mobile (`artifacts/lyte-mobile`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | N/A (Expo/React Native mobile app; deep-link: `szl://lyte/`) |
| **Platform** | Expo / React Native (iOS & Android) |
| **Readiness** | Prototype |
| **Environment** | Demo |
| **Auth** | Partial — Expo PKCE token exchange scaffolded |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Scaffolded — development environment only |
| **Tier** | 2 — Pilot-Adjacent |
| **Notes** | Mobile command surface for Lyte flagship. Designated Tier 2 as the one selected mobile client for near-term advancement. Investment follows Lyte web reaching Pilot Ready. |

---

### SZL Holdings Mobile (`artifacts/szl-holdings-mobile`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | N/A (Expo/React Native mobile app; deep-link: `szl://holdings/`) |
| **Platform** | Expo / React Native (iOS & Android) |
| **Readiness** | Prototype |
| **Environment** | Demo |
| **Auth** | Partial — Expo PKCE token exchange scaffolded |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Scaffolded — development environment only |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Executive mobile command for SZL leadership. Parked at Prototype. Activation deferred until Lyte Mobile reaches Pilot Ready and executive mobile use case is confirmed with a pilot partner. |

---

### Aegis Mobile (`artifacts/aegis-mobile`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | N/A (Expo/React Native mobile app; deep-link: `szl://aegis/`) |
| **Platform** | Expo / React Native (iOS & Android) |
| **Readiness** | Prototype |
| **Environment** | Demo |
| **Auth** | Partial — scaffolded |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Scaffolded — development environment only |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Mobile SOC command. Parked with Aegis web (Tier 3). No investment until Aegis web advances. |

---

### Vessels Mobile (`artifacts/vessels-mobile`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | N/A (Expo/React Native mobile app; deep-link: `szl://vessels/`) |
| **Platform** | Expo / React Native (iOS & Android) |
| **Readiness** | Prototype |
| **Environment** | Demo |
| **Auth** | Partial — scaffolded |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Scaffolded — development environment only |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Parked at Prototype. Investment follows Vessels web commercial validation. |

---

### Terra Mobile (`artifacts/terra-mobile`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | N/A (Expo/React Native mobile app; deep-link: `szl://terra/`) |
| **Platform** | Expo / React Native (iOS & Android) |
| **Readiness** | Prototype |
| **Environment** | Demo |
| **Auth** | Partial — scaffolded |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Scaffolded — development environment only |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Parked at Prototype. Investment follows Terra web commercial validation. |

---

### Carlota Jo Mobile (`artifacts/carlota-jo-mobile`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | N/A (Expo/React Native mobile app; deep-link: `szl://carlotajo/`) |
| **Platform** | Expo / React Native (iOS & Android) |
| **Readiness** | Prototype |
| **Environment** | Demo |
| **Auth** | Partial — scaffolded |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Scaffolded — development environment only |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Native client for Carlota Jo advisory. Parked at Prototype. Investment follows advisory revenue activation. |

---

### Stephen Mobile (`artifacts/stephen-mobile`)

| Attribute | Value |
|-----------|-------|
| **Owner** | Stephen Lutar (Founder & CEO) |
| **Route** | N/A (Expo/React Native mobile app; deep-link: `szl://stephen/`) |
| **Platform** | Expo / React Native (iOS & Android) |
| **Readiness** | Prototype |
| **Environment** | Demo |
| **Auth** | No |
| **Payments** | No |
| **Analytics** | No |
| **Monitoring** | No |
| **Last Build** | Scaffolded — development environment only |
| **Tier** | 3 — Parked / Staged |
| **Notes** | Personal command app for founder. No commercial investment planned. |

---

## Shared Libraries (`lib/`)

| Library | Owner | Purpose | Status |
|---------|-------|---------|--------|
| `@workspace/db` | Stephen Lutar | Drizzle schema, migrations, seed data | Production-stable |
| `@workspace/auth` | Stephen Lutar | OIDC PKCE, RBAC, session management | Production-stable |
| `@workspace/shared-ui` | Stephen Lutar | Cross-app React component library | Production-stable |
| `@workspace/workflow-engine` | Stephen Lutar | Alloy execution fabric | Functional Alpha |
| `@workspace/ai-engine` | Stephen Lutar | Multi-provider AI inference, eval harness | Functional Alpha |
| `@workspace/audit` | Stephen Lutar | Immutable event log | Production-stable |
| `@workspace/observability` | Stephen Lutar | APM, Pino logging, metrics | Functional Alpha |
| `@workspace/api-spec` | Stephen Lutar | OpenAPI 3.1 specification | Functional Alpha |
| `@workspace/api-zod` | Stephen Lutar | Zod schema validation | Production-stable |
| `@workspace/api-client-react` | Stephen Lutar | Generated React Query hooks | Functional Alpha |
| `@workspace/services` | Stephen Lutar | Business logic adapters | Functional Alpha |
| `@workspace/graphql-client` | Stephen Lutar | GraphQL client | Functional Alpha |

---

## Summary Table

| Artifact | Platform | Tier | Readiness | Environment | Auth | Payments | Monitoring |
|----------|----------|------|-----------|-------------|------|----------|------------|
| api-server | Node.js/Express | 1 | Functional Alpha | Seeded Data | Yes | Yes | Yes |
| lyte-command-center | React/Vite | 1 | Functional Alpha | Seeded Data | Yes | Partial | Partial |
| szl-holdings | React/Vite | 1 | Functional Alpha | Live | Partial | No | No |
| mockup-sandbox | React/Vite | 1 | Functional Alpha | Demo | No | No | No |
| vessels | React/Vite | 2 | Functional Alpha | Demo | Yes | Partial | Partial |
| lyte-mobile | Expo/RN | 2 | Prototype | Demo | Partial | No | No |
| firestorm (Aegis) | React/Vite | 3 | Functional Alpha | Demo | Yes | No | Partial |
| terra | React/Vite | 3 | Functional Alpha | Seeded Data | Yes | Partial | Partial |
| carlota-jo | React/Vite | 3 | Functional Alpha | Live | Partial | Partial | No |
| stephen-site | React/Vite | 3 | Functional Alpha | Live | No | No | No |
| szl-holdings-mobile | Expo/RN | 3 | Prototype | Demo | Partial | No | No |
| aegis-mobile | Expo/RN | 3 | Prototype | Demo | Partial | No | No |
| vessels-mobile | Expo/RN | 3 | Prototype | Demo | Partial | No | No |
| terra-mobile | Expo/RN | 3 | Prototype | Demo | Partial | No | No |
| carlota-jo-mobile | Expo/RN | 3 | Prototype | Demo | Partial | No | No |
| stephen-mobile | Expo/RN | 3 | Prototype | Demo | No | No | No |

---

*See also:*
- *[Tiering Plan](tiering-plan.md) — Strategic tier assignments and investment guidance*
- *[Readiness Standard](../../public/readiness-standard.md) — Label definitions*
- *[Environment Labeling Standard](../../public/environment-labeling-standard.md) — Environment label definitions*
- *[Production Readiness Package](../../production-readiness.md) — Deployment checklist and environment config*
