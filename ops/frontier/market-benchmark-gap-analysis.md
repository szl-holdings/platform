# Market Benchmark Gap Analysis

Generated: 2026-04-16 (updated)

---

## Overview

This document assesses SZL Holdings platform products against comparable commercial solutions in their respective verticals. The goal is to identify where the platform's actual implemented functionality competes, where it is at parity but unproven, and where significant gaps exist relative to market expectations.

---

## Aegis — Security & Defense Intelligence

### Comparable Products
- Palo Alto Cortex XDR / XSOAR
- Microsoft Sentinel
- Splunk SOAR
- CrowdStrike Falcon

### Implemented (Verified in Code)
- SOC command surface with incident queue
- MITRE ATT&CK v14 framework mapping
- SOAR playbook engine (code present)
- STIX/TAXII protocol support (code present)
- XDR console view
- AI-assisted triage (Sentinel agent)
- Human approval gates on AI actions
- 22 database tables for security lifecycle

### Gaps vs. Market
| Feature | Market Standard | SZL Status | Gap |
|---------|----------------|------------|-----|
| Live threat intelligence feeds | Real STIX/TAXII ingestion | Demo/stub mode | HIGH |
| Endpoint telemetry ingest | Real EDR agent integration | Not implemented | HIGH |
| SIEM log ingestion (syslog, CEF) | Core feature | Not implemented | HIGH |
| Case management workflow | Full lifecycle | Partial — forms exist | MEDIUM |
| Threat intelligence sharing | TAXII server role | Client-only | MEDIUM |
| Compliance reporting (SOC 2, ISO) | Auto-generation | Not implemented | MEDIUM |

### Verdict
Aegis has a credible UI and data model for a security command platform. The core gap is live data: STIX/TAXII, EDR, and SIEM feeds are stubbed. It is a functional alpha — not production-ready for a security operations center.

---

## Vessels — Maritime Intelligence

### Comparable Products
- Pole Star
- Windward
- Lloyd's Intelligence
- MarineTraffic Pro

### Implemented (Verified in Code)
- Fleet command UI
- AIS telemetry viewer
- Route anomaly detection (UI)
- Sanctions screening workflow
- Voyage economics calculator
- Dark vessel detection (logic present)
- Commodity trading views (fills, instruments, orders, positions)
- Marine insurance management

### Gaps vs. Market
| Feature | Market Standard | SZL Status | Gap |
|---------|----------------|------------|-----|
| Live AIS data feed | Real-time vessel positions | Demo/mock data | HIGH |
| Sanctions list updates | Daily automated refresh | Not automated | HIGH |
| EMSA / flag state integration | Core compliance | Not implemented | HIGH |
| Port call API integration | Standard | Not implemented | MEDIUM |
| Cargo tracking integration | Expected | Not implemented | MEDIUM |
| Freight rate benchmarking | Market intelligence | Partial | LOW |

### Verdict
Vessels has a compelling UI and well-structured data model. The critical gap is live AIS feed integration — without real vessel positions, this is a demo platform, not an operational one.

---

## Terra — Real Estate Intelligence

### Comparable Products
- CoStar / LoopNet
- ATTOM Data
- Reonomy
- RealPage

### Implemented (Verified in Code)
- NYC distress property pipeline
- Ownership entity graph
- Deal pipeline management
- MLS listing ingestion framework
- Commercial property analytics
- Broker workflow
- Lead scoring
- Transaction tracking

### Gaps vs. Market
| Feature | Market Standard | SZL Status | Gap |
|---------|----------------|------------|-----|
| Live MLS data feed | Real-time listings | Framework only — no live feed | HIGH |
| Public records ingestion | Automated | Manual/demo data | HIGH |
| Comparable sales (comps) | Core feature | Not implemented | MEDIUM |
| Mortgage/lien data | Standard | Not fully implemented | MEDIUM |
| Geographic coverage | National or specified | NYC-focused only | MEDIUM |
| Valuation models (AVM) | Market standard | Not implemented | MEDIUM |

### Verdict
Terra has a solid data model and functional UI for a real estate intelligence platform. The gap is live data: NYC public records, MLS feeds, and property data services are not yet wired to real sources.

---

## Counsel — Legal Matter Command

**Status: DEPRECATED** — Marked for archive in task #579. Not evaluated against market benchmarks as it is no longer a target product. Code has been preserved but the product is not being developed.

---

## Carlota Jo — Premium Advisory

### Comparable Products
- ServiceTitan (for service businesses)
- HoneyBook
- Bespoke luxury CRM platforms

### Implemented (Verified in Code)
- Client profile management
- Service catalog
- Booking system
- Document delivery
- Client messaging
- Inquiry tracking
- Reservation management
- 10 database tables

### Gaps vs. Market
| Feature | Market Standard | SZL Status | Gap |
|---------|----------------|------------|-----|
| Client portal (external-facing) | Core | Partial | MEDIUM |
| E-signature integration | Standard | Not implemented | MEDIUM |
| Payment processing | Standard | Stripe integrated | LOW |
| Automated follow-up | Standard | Not implemented | LOW |
| Calendar/scheduling integration | Standard | Not implemented | LOW |

### Verdict
Carlota Jo is the most production-ready product. It is a functional advisory CRM with real backend wiring. Gaps are feature gaps, not foundational ones.

---

## Command Portal — Ecosystem Hub

### Comparable Products
- Datadog
- Grafana Enterprise
- Dynatrace
- Palantir Foundry

### Implemented (Verified in Code)
- Real-time 8-domain dashboard
- SSE updates
- Composite health scoring
- Per-domain drill-downs
- Global Cmd+K search
- Executive briefing view
- Event timeline with filter chips
- Severity-based event classification

### Gaps vs. Market
| Feature | Market Standard | SZL Status | Gap |
|---------|----------------|------------|-----|
| Live signal ingestion | Real events | Mostly SSE-connected but data can be simulated | MEDIUM |
| Alerting / PagerDuty integration | Core | Not implemented | MEDIUM |
| SLA tracking | Standard | Not implemented | LOW |
| Custom dashboards per user | Standard | Not implemented | LOW |

### Verdict
Command is architecturally sophisticated — real-time SSE, multi-domain, executive views. The gap is primarily in live data signal completeness across all 8 domains.

---

## CORTEX — Unified Mobile

### Comparable Products
- Palantir Mobile
- ServiceMax
- SAP Field Service

### Implemented (Verified in Code)
- 8 domain workspace switcher
- Biometric authentication
- Cross-domain badge counts
- Workspace-adaptive copilot
- SpotlightFab quick actions

### Gaps vs. Market
| Feature | Market Standard | SZL Status | Gap |
|---------|----------------|------------|-----|
| App store release | Required | Not yet shipped | HIGH |
| Push notification routing | Core | Code present, not production tested | MEDIUM |
| Offline mode | Important | offline-engine lib exists | MEDIUM |
| Deep linking | Standard | Not yet implemented | MEDIUM |

### Verdict
CORTEX has strong architecture and a feature-complete UI. The primary gap is that it has not been submitted to or approved by any app store — it is pre-release.

---

## Summary Readiness Matrix

| Product | UI Completeness | Backend Wired | Live Data | Market Ready |
|---------|----------------|---------------|-----------|--------------|
| szl-holdings | High | High | Partial | Yes — alpha |
| api-server | High | N/A | Yes | Yes — functional |
| Aegis | High | Partial | No (stubbed) | No |
| Terra | High | Partial | No (stubbed) | No |
| Vessels | High | Partial | No (stubbed) | No |
| Carlota Jo | High | High | Yes | Yes — operational |
| Command | High | High | Partial | Yes — alpha |
| CORTEX | High | Partial | Partial | No (not in stores) |
| Lyte (Command) | High | Partial | Partial | Merged into Command |
| IMPERIUM | Medium | Partial | No | Merged into Command |
