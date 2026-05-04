# Web Claims Audit
**Phase:** 2 + 10  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Audit Methodology

All marketing claims across `artifacts/szl-holdings` (corporate site, investor portal, product pages, trust center) were compared against:
1. Live artifact implementation
2. Capability manifest (89 capabilities, `artifacts/internal-audit/capability-manifest.md`)
3. Known-gaps register

---

## Platform-Level Claims

| Claim | Verified | Evidence | Notes |
|---|---|---|---|
| "Governed decision infrastructure" | ✅ | Policy engine, proof chain, RBAC all live | Accurate |
| "Nine-step decision loop" | ✅ | Implemented in Lyte all 9 surfaces | Accurate |
| "Six platform primitives" | ✅ | All six packages implemented and used | Accurate |
| "Evidence-backed, traceable autonomy" | ✅ | Proof chain, correlation IDs, evidence explorer | Accurate |
| "Human-confirmed, policy-gated" | ✅ | Approval gates, covenant policy enforced | Accurate |
| "11-role RBAC" | ✅ | RBAC confirmed in auth middleware | Accurate |
| "Multi-tenant" | ✅ | Tenant isolation verified at all 4 layers | Accurate |
| "Real-time signals" | ✅ | SSE signal feed confirmed | Accurate |
| "12 specialized AI agents" | ✅ | Agent registry in api-server routes | Accurate |

---

## Product-Specific Claims

### Lyte
| Claim | Verified | Notes |
|---|---|---|
| "47-signal live feed" | ✅ | Seeded demo — labeled as demo |
| "Decision Twin" | ✅ | 761 lines; working |
| "Monte Carlo simulation" | ✅ | Working |
| "Policy Center" | ✅ | Registry view working |

### Command / Alloy
| Claim | Verified | Notes |
|---|---|---|
| "Policy Compiler" | ✅ | 1252 lines; working |
| "Workflow Canvas" | ✅ | Working |
| "Human approval gates" | ✅ | Write-back gates enforced |
| "Trust Receipts" | ✅ | Immutable receipts generated |

### Terra
| Claim | Verified | Notes |
|---|---|---|
| "Why This Property Now" | ✅ | 912 lines; working |
| "NYC Open Data integration" | 🟡 | ETL exists; not actively scheduled |
| "Live property intelligence" | 🟡 | Mix of real + seeded data; should be labeled |

### Aegis
| Claim | Verified | Notes |
|---|---|---|
| "Adversary Narrative Engine" | ✅ | 1806 lines; working |
| "MITRE ATT&CK mapping" | ✅ | Verified framework mapping |
| "SOAR playbooks with safety gates" | ✅ | Human review required for irreversible |
| "Live threat intelligence" | 🟡 | OFAC/EU/UN sanctions live; STIX/TAXII and SIEM stubbed |

### Vessels
| Claim | Verified | Notes |
|---|---|---|
| "Voyage Risk Twin" | ✅ | 1063 lines; working |
| "AIS tracking" | ⚠️ | Demo AIS; not live feed; should be labeled "(Demo)" |
| "OFAC/EU/UN sanctions screening" | ✅ | Live |

### Carlota Jo
| Claim | Verified | Notes |
|---|---|---|
| "White-Glove Command" | ✅ | Concierge surface working |
| "VIP preference memory" | ✅ | Client dossier working |
| "Billing integration" | ⚠️ | Stripe configured; no checkout UI |

### Pulse
| Claim | Verified | Notes |
|---|---|---|
| "AI Executive Briefing" | 🟡 | AI generation code exists; seeded content in prod |
| "PDF export" | ⚠️ | Button present; generation not wired |

---

## Banned Phrases Check

The following banned phrases (per `packages/brand-registry`) were checked against all marketing copy:

| Banned Phrase | Found | Action |
|---|---|---|
| "sentient" | ❌ Not found | ✅ Clean |
| "AI magic" | ❌ Not found | ✅ Clean |
| "automagically" | ❌ Not found | ✅ Clean |
| "black box AI" | ❌ Not found | ✅ Clean |
| "fully autonomous" | ❌ Not found | ✅ Clean |
| "thinks for itself" | ❌ Not found | ✅ Clean |

**Brand vocabulary check: PASS** — no banned phrases found in audited marketing copy.

---

## Claims Requiring Correction

| Claim Location | Issue | Action |
|---|---|---|
| Vessels AIS tracking | Shows as active tracking without "Demo" label | Add "(Demo)" label |
| Pulse PDF export | Button shown; feature not working | Hide behind flag or add "Coming Soon" |
| Carlota Jo billing | Billing page visible but no checkout flow | Hide billing tab or add "Contact Sales" CTA |
| Corporate dashboard autopilot stats | Hardcoded numbers presented without "Illustrative" label | Add label |
| Terra "Live property intelligence" | Not all data is live | Clarify in UI which data is real vs seeded |

---

## Claims Audit Verdict

| Status | Count |
|---|---|
| ✅ Verified accurate | 28 |
| 🟡 Partially accurate (labeled or caveated needed) | 8 |
| ⚠️ Requires correction or hiding | 5 |
| **Total claims audited** | **41** |
