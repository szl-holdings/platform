# Active vs Defer Matrix

**Date:** 2026-04-27  
**Phase:** Rehaul 9/9 — Scope Rationalization  
**Purpose:** Define what is load-bearing vs. distracting; what stays active, what goes internal-only, what is deferred or removed from public claims.

---

## Classification Criteria

| Status | Definition |
|---|---|
| **ACTIVE — Flagship** | Revenue-path or investor-facing; fully functional alpha; should be in every demo |
| **ACTIVE — Supporting** | Real signal value; operational or domain-specific; demo when relevant |
| **INTERNAL ONLY** | Real functionality but not customer-facing; remove from public claims |
| **DEFERRED** | Built but not ready for demo/claim; known gaps block external presentation |
| **ARCHIVED** | Deregistered; no active development; not in public claims |
| **CONCEPT** | Directory exists; no active development; explicitly not claimed |

---

## Artifact Matrix

| Artifact | Current Status | Classification | Rationale |
|---|---|---|---|
| **SZL Holdings Dashboard** | Beta | ACTIVE — Flagship | Primary investor and partner landing surface. Corporate narrative, ecosystem map, trust center. |
| **A11oy — Enterprise Execution Fabric** | Beta | ACTIVE — Flagship | The core product thesis. Phase 1 complete. Central to every pitch. |
| **API Server** | GA | ACTIVE — Supporting | Backend infrastructure. Not demoed directly but validates all product surfaces. |
| **Carlota Jo Consulting** | GA | ACTIVE — Flagship | Most complete artifact. Live integrations. Revenue-path product. |
| **LUMINA (Pulse) — AI Executive Briefing** | Beta (alpha working) | ACTIVE — Flagship | Multi-provider AI routing live. Board-ready decision briefings. Strong demo surface. |
| **PARAGON (Aegis) — Defense & Intelligence** | Beta (alpha working) | ACTIVE — Supporting | Live CISA KEV, NVD, MITRE ATT&CK. CISO audience. Demo when relevant. |
| **Counsel — Legal Matter Command** | Beta (alpha working) | ACTIVE — Supporting | Matter tracking functional. CourtListener token pending. Demo with disclosure. |
| **TENAX (Sentra) — Cyber Resilience** | Partial | DEFERRED from flagship | `/api/sentra/risks` route missing. Demo-able with disclosure; not investor-ready without fix. |
| **DOMAINE (Terra) — Real Estate Intelligence** | Partial | DEFERRED from flagship | Maps blank (Mapbox token). NYC distress data pipeline live; map UX is broken. Fix required. |
| **SEXTANT (Vessels) — Maritime Intelligence** | Partial | DEFERRED from flagship | AIS simulated; 3 commercial modules not wired. Demonstrate with explicit "AIS simulated" disclosure. |
| **FORGE (Command) — Unified Command** | Partial | INTERNAL ONLY (for now) | CORTEX cross-domain badge counts not live. Useful for internal ops. Not investor-demo ready. |
| **KORA (Lyte) — Decision Intelligence** | Partial | ACTIVE — Supporting | Routes functional; legacy path alias missing. Fix alias then promote to flagship. |
| **APEX (SZL Holdings Mobile)** | Beta | ACTIVE — Supporting | Mobile companion. Scaffold complete. Push notification deep linking pending. |
| **SZL Holdings Demo Video** | Demo-only | ACTIVE — Supporting | Promotional asset. Use in investor decks and partner intros. |
| **PRAXIS (Mockup Sandbox)** | Internal | INTERNAL ONLY | Design system preview. Never customer-facing. Remove from public product count claims. |

---

## Archived Artifacts (Not in Active Claims)

| Artifact | Archive Reason |
|---|---|
| Firestorm / Legacy Defense | Superseded by PARAGON (Aegis) |
| Prism Counsel (legacy) | Superseded by Counsel; data retained in API server |
| Stephen Site (founder portfolio) | Content folded into SZL Holdings `/founder` route |
| Legacy Ops Command | Functionality in FORGE (Command) |
| Imperium | Deprecated; content merged into Command/A11oy |

---

## Public Claim Surface — What to State Externally

### State as Active
- A11oy (Phase 1 complete, Phase 2 in progress)
- TENAX (with disclosure: one API route pending)
- DOMAINE (with disclosure: maps require Mapbox token)
- SEXTANT (with disclosure: AIS telemetry simulated)
- PARAGON, Counsel, LUMINA, Carlota Jo — fully claimable

### State as "In Progress" / Roadmap
- A11oy Phase 2 (workcell engine)
- FORGE (pending badge count wiring)
- Enterprise SSO/SCIM
- APEX push notification deep linking
- SOC 2 Type 1 readiness

### Remove from Public Claims Immediately
- PRAXIS/mockup-sandbox — internal tool, not a product
- CORTEX Mobile — concept-only, no build system
- Any specific route counts or metric claims not validated by `audit/source-of-truth.json`

---

*Update this matrix after each sprint or after any artifact status change. Drive from `docs/APP_STATUS.md` as the authoritative source.*
