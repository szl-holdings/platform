# Series A Surface Scorecard

**Date:** 2026-04-27  
**Audience:** Investor technical diligence, Series A lead  
**Purpose:** Single-page readiness score for each product surface from three lens: enterprise buyer, technical diligence, investor.

---

## Scoring Methodology

Each surface is scored 1–5 on three lenses:

| Lens | What It Measures |
|---|---|
| **Enterprise Buyer** | Would a qualified enterprise buyer pay for this today? (1=No, 5=Yes with urgency) |
| **Technical Diligence** | Does this surface hold up to a code-level review? (1=Many red flags, 5=Clean) |
| **Investor Signal** | Does this surface strengthen or dilute the investment thesis? (1=Dilutes, 5=Strengthens) |

---

## Scorecard

### A11oy — Governed Execution Fabric

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 3/5 | Phase 1 complete; Phase 2 workcell engine needed for production workloads. Early adopters only. |
| Technical Diligence | 5/5 | Policy-shaped graph compiler with tests, hash-stable journal, budget router, OTel telemetry. Structurally sound. |
| Investor Signal | 5/5 | The core thesis. Differentiated architecture. No competitor ships this layer. |
| **Overall** | **4.3/5** | **Lead investment surface. Demo-first.** |

---

### Carlota Jo Consulting

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 5/5 | GA. Live integrations. Real booking workflow. Revenue-ready. |
| Technical Diligence | 5/5 | Most complete artifact. No known issues. |
| Investor Signal | 4/5 | Proof that the platform works end-to-end. Strong demo closer. |
| **Overall** | **4.7/5** | **Strongest single demo surface.** |

---

### LUMINA (Pulse) — AI Executive Briefing

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 4/5 | Board-ready briefing surface with attribution. Strong use case for executive teams. |
| Technical Diligence | 4/5 | Multi-provider AI routing implemented. Auth gate correct. Minor: no Redis session store yet. |
| Investor Signal | 5/5 | The "last mile" of governed AI output. Shows the full pipeline from signal to executive action. |
| **Overall** | **4.3/5** | **Strong secondary demo surface.** |

---

### PARAGON (Aegis) — Defense & Intelligence

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 4/5 | Live CISA KEV, NVD CVE, MITRE ATT&CK v14. Real signal for CISOs. |
| Technical Diligence | 4/5 | Live integrations verified. 8 new modules not yet wired to case management. |
| Investor Signal | 4/5 | Defense is a high-value vertical. Shows the platform breadth. |
| **Overall** | **4.0/5** | **Show in CISO/defense-specific conversations.** |

---

### Counsel — Legal Matter Command

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 3/5 | Matter tracking functional. Live case data pending (CourtListener token). |
| Technical Diligence | 4/5 | Core routes working. API structure clean. Token configuration gap is environmental, not architectural. |
| Investor Signal | 4/5 | Legal ops is a high-willingness-to-pay vertical. Shows domain pack strategy. |
| **Overall** | **3.7/5** | **Include with CourtListener disclosure.** |

---

### SZL Holdings Dashboard

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 3/5 | Corporate narrative, not a product for buyers. Investor-facing. |
| Technical Diligence | 4/5 | Clean. Auth gate correct. KPI data seeded (disclosed). |
| Investor Signal | 5/5 | Required context-setter. Ecosystem map, trust center, roadmap. |
| **Overall** | **4.0/5** | **Always show first in investor meetings.** |

---

### TENAX (Sentra) — Cyber Resilience

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 2/5 | UI complete but `/api/sentra/risks` route missing — API call fails. Cannot demo without fix. |
| Technical Diligence | 3/5 | Route gap is a straightforward fix. Architecture sound. |
| Investor Signal | 3/5 | Cybersecurity is a strong vertical but the missing route reduces confidence. |
| **Overall** | **2.7/5** | **Do not demo until `/api/sentra/risks` is fixed.** |

---

### DOMAINE (Terra) — Real Estate Intelligence

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 3/5 | NYC distress data pipeline live. Maps blank without Mapbox token. |
| Technical Diligence | 4/5 | Data pipeline architecture is strong. Token gap is environmental. |
| Investor Signal | 3/5 | Real estate is a strong vertical; map UX failure undercuts the demo. |
| **Overall** | **3.3/5** | **Add Mapbox placeholder UI, then include with disclosure.** |

---

### SEXTANT (Vessels) — Maritime Intelligence

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 2/5 | AIS simulated; 3 commercial modules not wired. Not sellable without live AIS. |
| Technical Diligence | 3/5 | Governance and economics layers solid. Simulation is clearly bounded. |
| Investor Signal | 3/5 | Maritime is a distinctive vertical. AIS simulation is a known constraint. |
| **Overall** | **2.7/5** | **Include with explicit "AIS simulated" disclosure. Skip in tight demo schedules.** |

---

### KORA (Lyte) — Decision Intelligence

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 3/5 | Routes functional. Missing path alias is a minor UX issue. |
| Technical Diligence | 3/5 | Solid architecture. Legacy alias gap needs a 1-hour fix. |
| Investor Signal | 3/5 | Decision intelligence is table-stakes; KORA needs clearer differentiation messaging. |
| **Overall** | **3.0/5** | **Fix path alias. Include in ops/executive audience demos.** |

---

### APEX (SZL Holdings Mobile)

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 3/5 | Mobile companion works. Splash/icon cosmetic gaps. Push linking pending. |
| Technical Diligence | 4/5 | Expo scaffold clean after jest downgrade. TypeScript errors resolved. |
| Investor Signal | 3/5 | Shows mobile capability. Not the primary investment signal. |
| **Overall** | **3.3/5** | **Show as "mobile command is live" — not as a primary surface.** |

---

### FORGE (Command) — Unified Command Portal

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer | 2/5 | Badge counts not live. Feels incomplete. |
| Technical Diligence | 3/5 | Architecture correct. Wiring gap is a sprint of work. |
| Investor Signal | 2/5 | Internal tool in current state. Do not include in investor demos until wired. |
| **Overall** | **2.3/5** | **Internal only until badge count wiring is complete.** |

---

## Portfolio Summary

| Artifact | Overall Score | Demo Priority |
|---|---|---|
| Carlota Jo | 4.7/5 | Tier 1 |
| A11oy | 4.3/5 | Tier 1 |
| LUMINA | 4.3/5 | Tier 1 |
| SZL Holdings Dashboard | 4.0/5 | Tier 1 (always first) |
| PARAGON | 4.0/5 | Tier 2 |
| Counsel | 3.7/5 | Tier 2 |
| KORA | 3.0/5 | Tier 2 (after path alias fix) |
| DOMAINE | 3.3/5 | Tier 2 (after Mapbox placeholder) |
| APEX | 3.3/5 | Tier 2 |
| SEXTANT | 2.7/5 | Tier 3 (with explicit disclosure) |
| TENAX | 2.7/5 | Tier 3 (after route fix) |
| FORGE | 2.3/5 | Internal only |

---

## Platform-Level Score

| Lens | Score | Rationale |
|---|---|---|
| Enterprise Buyer (platform as a whole) | 3.5/5 | Carlota Jo is GA and revenue-ready. The platform thesis needs 1–2 more GA surfaces. |
| Technical Diligence | 4.2/5 | CI is real, code is clean, architecture is sound. Known gaps are documented and fixable. |
| Investor Signal | 4.5/5 | Strong differentiated thesis. Proven execution. Honest alpha documentation. |
| **Overall Platform** | **4.1/5** | **Fundable at Series A with honest alpha positioning.** |

---

*Score this again after fixing risks #3, #5, and #10 from `top-25-risks-and-gaps.md`. Expect overall platform score to move to 4.4/5.*
