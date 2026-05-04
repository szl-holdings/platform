# Demo Inventory
**Phase:** 7  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Demo Environment Overview

| Attribute | Value |
|---|---|
| Demo org | `org-demo-szl` (SZL Holdings Demo) |
| Central scenario | Vantex Acquisition ($4.2M / 47-day stalled approval) — `LYTE-SEED-v2` |
| Demo Launchpad | `/command/demo` |
| Demo reset | One-click from Launchpad (no terminal required) |
| Reset time | ~8 seconds |
| Demo tracks | 10-minute / 20-minute / 45-minute scripted tracks |
| Persona switcher | Investor / CEO / COO / CISO / Analyst |

---

## Six Signature Innovations

These are the "one-of-one" differentiators shown in every investor demo:

| Innovation | Route | Lines of Code | Status |
|---|---|---|---|
| Decision Twin | `/lyte/decision-twin` | 761 | ✅ Working |
| Policy Compiler | `/command/operations/alloy/policy-compiler` | 1252 | ✅ Working |
| Why This Property Now | `/terra/why-this-property-now` | 912 | ✅ Working |
| Adversary Narrative Engine | `/aegis/adversary-narrative-engine` | 1806 | ✅ Working |
| Voyage Risk Twin | `/vessels/voyage-risk-twin` | 1063 | ✅ Working |
| White-Glove Command | `/carlota-jo/concierge` | — | ✅ Working |

---

## Demo Launchpad (`/command/demo`)

| Feature | Status |
|---|---|
| 10/20/45-minute scripted tracks | ✅ Present |
| Audience persona switcher (5 personas) | ✅ Working |
| One-click reset (no terminal) | ✅ Working |
| 6-stop sequence with progress tracking | ✅ Working |
| Platform status panel (6 domain packs) | ✅ Working |
| Quick-access to 6 signature innovations | ✅ Working |
| Scenario display: Vantex Acquisition | ✅ Working |

---

## Demo Screen Coverage by Domain

### Lyte — Decision Intelligence
| Screen | Has Seeded Data | Demo Narrative | Status |
|---|---|---|---|
| Overview dashboard | ✅ | Vantex KPIs + 6 critical signals | ✅ Working |
| Signals Console | ✅ | 47 active signals | ✅ Working |
| Entity Graph | ✅ | 12-node Vantex relationship map | ✅ Working |
| Decision Center | ✅ | 8 ranked recommendations | ✅ Working |
| Decision Twin | ✅ | Approve/delay/reroute/escalate Vantex | ✅ Working |
| Workflow Health | ✅ | Per-workflow bottleneck data | ✅ Working |
| Run Console | ✅ | Agent trace log | ✅ Working |
| Evidence Explorer | ✅ | Full proof chain | ✅ Working |
| Policy Center | ✅ | 8 covenant policies | ✅ Working |
| Eval Studio | ✅ | Radar chart + eval logs | ✅ Working |

### Command / Alloy
| Screen | Has Seeded Data | Status |
|---|---|---|
| Policy Compiler | ✅ | ✅ Working |
| Workflow Canvas | ✅ | ✅ Working |
| Action Console | ✅ | ✅ Working |
| Human Approval Gates | ✅ | ✅ Working |
| Agent Monitor | ✅ | ✅ Working |
| Trust Receipts | ✅ | ✅ Working |
| Cognitive Command Center | ✅ | ✅ Working |

### Terra — Real Estate
| Screen | Has Seeded Data | Status |
|---|---|---|
| Property Map | ✅ | ✅ Working (Mapbox) |
| Why This Property Now | ✅ | ✅ Working |
| Distress Engine | ✅ | ✅ Working |
| Ownership Graph | ✅ | ✅ Working |
| Deals Pipeline | ✅ | ✅ Working |
| Investment Analysis | ✅ | ✅ Working |

### Aegis — Cyber
| Screen | Has Seeded Data | Status |
|---|---|---|
| SOC Dashboard | ✅ | ✅ Working |
| Adversary Narrative Engine | ✅ | ✅ Working |
| MITRE ATT&CK | ✅ | ✅ Working |
| Incident Management | ✅ | ✅ Working |
| Vulnerability Dashboard | ✅ | ✅ Working |

### Vessels — Maritime
| Screen | Has Seeded Data | Status |
|---|---|---|
| Fleet Dashboard | ✅ | ✅ Working |
| Voyage Risk Twin | ✅ | ✅ Working |
| Sanctions Screening | ✅ Live | ✅ Working |
| Route Anomaly Engine | ✅ | ✅ Working |

### Carlota Jo
| Screen | Has Seeded Data | Status |
|---|---|---|
| Overview | ✅ | ✅ Working |
| Client Profiles | ✅ | ✅ Working |
| Case Management | ✅ | ✅ Working |
| White-Glove Concierge | ✅ | ✅ Working |

---

## Demo Data Freshness

All demo data is deterministic and seeded from `packages/demo-seed`. After a demo reset, all data returns to canonical state.

| Data Type | Freshness | Notes |
|---|---|---|
| Signals | Seeded; timestamps realistic | Updated to "recent" timestamps on reset |
| Entity graph | Static seeded | Consistent across resets |
| Proof chain entries | Seeded; append-only | New entries added during demo are preserved until reset |
| Sanctions data | Live (OFAC/EU/UN) | Real data; always current |
| Vessel positions | Demo seeded | Labeled as demo |
| Property data | Seeded + NYC Open Data | Mix of real and illustrative |

---

## Demo Readiness Score

| Dimension | Score | Notes |
|---|---|---|
| Scenario coherence | 10/10 | Vantex narrative consistent across all domains |
| Seeded data realism | 9/10 | Real-feeling data; clearly labeled when demo |
| Persona switcher | 9/10 | 5 personas; content adapts |
| One-click reset | 10/10 | No terminal required |
| Signature innovations | 10/10 | All 6 working |
| Loading/error states | 8/10 | Most states handled; some minor gaps |
| **Overall** | **9.3/10** | Ready for investor demo |
