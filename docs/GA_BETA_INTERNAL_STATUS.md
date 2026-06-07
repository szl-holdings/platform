# SZL Holdings — GA / Beta / Internal / Archived Status Register

**Date:** April 16, 2026
**Authority:** This document is the authoritative classification of every SZL Holdings product surface.
**Update cadence:** Updated after each Phase completion or significant surface launch.

> **Canonical artifact-level status lives in `docs/APP_STATUS.md`.** This document extends that register with messaging guidance, what is safe to demo, and what requires a disclaimer.

---

## Status Definitions

| Status | Label | Investor Demo Safe? | Customer Presentable? | Notes |
|---|---|---|---|---|
| **GA** | _(no badge)_ | Yes | Yes | Production-ready, full data, no disclaimers needed |
| **Beta** | `BETA` | Yes — with framing | With labeling | Core features work; some data seeded/mocked; needs "Beta" label visible |
| **Internal** | `INTERNAL` | No | No | Operational tooling; not for external consumption |
| **Partial** | `PARTIAL` | With heavy framing | Not recommended | Core structure present; significant features unbuilt or unmocked |
| **Archived** | `ARCHIVED` | No | No | No longer maintained; content migrated or deprecated |
| **Concept** | `CONCEPT` | No | No | Directory exists; no active development |

---

## Web Surfaces

### SZL Holdings Corporate Platform
| Field | Value |
|---|---|
| **Path** | `/` |
| **Artifact** | `artifacts/szl-holdings` |
| **Status** | **Beta** |
| **Demo safe** | Yes — primary investor entry point |
| **Live data** | Corporate content: yes. Dashboard KPIs: seeded. Public feed integrations: active. |
| **Known gaps** | Autopilot header stats hardcoded; genome score not wired to live data |
| **Disclaimer required** | "Key performance metrics reflect seeded demonstration data" |

---

### Lyte — Business Observability (within SZL Holdings)
| Field | Value |
|---|---|
| **Path** | `/lyte/` (embedded in szl-holdings workspace) |
| **Status** | **Beta** |
| **Demo safe** | Yes — core PRISM framework, signal lifecycle, and readiness module work |
| **Live data** | Signals, scoring, and workflow: real. Connector integrations: seeded. |
| **Known gaps** | 40+ connector icons present; live connector sync requires enterprise API key per tenant |
| **Disclaimer required** | "Connector data reflects demonstration signals" |

---

### Aegis — Unified Defense & Intelligence
| Field | Value |
|---|---|
| **Path** | `/aegis/` |
| **Artifact** | `artifacts/aegis` |
| **Status** | **Beta** |
| **Demo safe** | Yes — Defense workspace (SOC), MITRE ATT&CK coverage, and compliance frameworks demoable |
| **Live data** | CISA KEV, NVD CVE, MITRE ATT&CK v14, AbuseIPDB: active. Scenario/event data: seeded. |
| **Known gaps** | 8 new security modules not wired to live API/case management. CISO Executive Dashboard not aggregated. OT/ICS decoder view partial. |
| **Disclaimer required** | "Security event and scenario data is representative; live SIEM integration not yet connected" |

---

### Vessels — Maritime Intelligence
| Field | Value |
|---|---|
| **Path** | `/vessels/` |
| **Artifact** | `artifacts/vessels` |
| **Status** | **Beta** |
| **Demo safe** | Yes — fleet dashboard, voyage economics, exception center demoable |
| **Live data** | Fleet positions: simulated AIS. Voyage economics: seeded. Sanctions screening: structured. |
| **Known gaps** | Commercial modules (charter management, freight benchmarking) not wired to live DB. Freight Rate Benchmarking page missing. Command Overview KPIs not updated for new modules. |
| **Disclaimer required** | "Fleet position data is simulated; live AIS integration available upon enterprise activation" |

---

### Terra — Real Estate Intelligence
| Field | Value |
|---|---|
| **Path** | `/terra/` |
| **Artifact** | `artifacts/terra` |
| **Status** | **Beta** |
| **Demo safe** | Yes — distress property map and deal pipeline demoable |
| **Live data** | NYC distress pipeline: live (NYC Open Data APIs). Ownership structures: live. Deal pipeline: user-created. |
| **Known gaps** | National coverage not yet built; some property enrichment fields partially populated |
| **Disclaimer required** | "Coverage limited to New York City; national expansion planned" |

---

### Carlota Jo — Private Advisory
| Field | Value |
|---|---|
| **Path** | `/carlota-jo/` |
| **Artifact** | `artifacts/carlota-jo` |
| **Status** | **Beta** |
| **Demo safe** | Yes — service catalog, inquiry flow, and brand presentation demoable |
| **Live data** | Service catalog: static. Inquiry: functional (creates DB record + triggers email if configured). |
| **Known gaps** | Client dashboard limited; survey data hardcoded in satisfaction scores |
| **Disclaimer required** | None required for external demo |

---

### Command Portal — Unified Command
| Field | Value |
|---|---|
| **Path** | `/command/` |
| **Artifact** | `artifacts/command` |
| **Status** | **Beta** |
| **Demo safe** | Yes — cross-domain command overview demoable |
| **Live data** | Aggregates signals from domain packs; some KPIs seeded |
| **Known gaps** | Cross-domain badge counts not wired to live API |
| **Disclaimer required** | "Aggregate KPIs reflect demonstration data across connected platforms" |

---

---

## Mobile Surfaces

### CORTEX — Mobile Command (SZL Holdings Mobile)
| Field | Value |
|---|---|
| **Platform** | iOS / Android (Expo / React Native) |
| **Artifact** | `artifacts/szl-holdings-mobile` |
| **Status** | **Beta** |
| **Demo safe** | Yes — with framing as mobile companion |
| **Live data** | Connected to same API server as web platforms |
| **Known gaps** | Push notifications not deep-linked to correct workspace; custom splash screen and icon not yet finalized |
| **Disclaimer required** | "Mobile platform in active development — some features available on web only" |

---

### Carlota Jo Mobile
| Field | Value |
|---|---|
| **Platform** | iOS / Android (Expo / React Native) |
| **Status** | **Beta** |
| **Demo safe** | Yes — inquiry and client engagement flows demoable |
| **Live data** | Inquiry workflow: functional |
| **Known gaps** | Same as web Carlota Jo |
| **Disclaimer required** | None |

---

## Internal Surfaces (Not Customer-Facing)

### API Server
| Field | Value |
|---|---|
| **Path** | `/api/` |
| **Artifact** | `artifacts/api-server` |
| **Status** | **Internal** |
| **Demo safe** | No — show health endpoint only |
| **Notes** | Express API server; powers all platform surfaces |

### Alloy — Execution Fabric
| Field | Value |
|---|---|
| **Status** | **Internal** |
| **Demo safe** | Yes — reference the capability in demo; show audit trail and proof chain outputs in Lyte |
| **Notes** | Not a standalone product; always demonstrated through domain pack interfaces |

### Component Preview Server
| Field | Value |
|---|---|
| **Status** | **Internal** |
| **Demo safe** | No |
| **Notes** | Mockup sandbox for design system development |

---

## Summary Scorecard

| Surface | Status | Demo Safe |
|---|---|---|
| SZL Holdings Corporate | Beta | Yes |
| Lyte (Business Observability) | Beta | Yes |
| Aegis (Defense & Intelligence) | Beta | Yes |
| Vessels (Maritime Intelligence) | Beta | Yes |
| Terra (Real Estate Intelligence) | Beta | Yes |
| Carlota Jo (Advisory) | Beta | Yes |
| Command Portal | Beta | Yes |
| CORTEX Mobile | Beta | With framing |
| API Server | Internal | No |
| Alloy | Internal | Via other surfaces |
| Component Preview | Internal | No |
| _(5 surfaces archived)_ | Archived | No — see `ops/frontier/disposition-matrix.md` |

---

*No surface should be presented as GA unless it appears in this register as GA. All Beta surfaces should carry visible status labeling in the UI.*
