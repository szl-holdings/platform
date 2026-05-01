# SZL Holdings — Demo Scenarios

*Version: 1.1 | Last updated: April 2026*

This document describes the five polished demo narratives for SZL Holdings prospect, partner, and investor demonstrations. Each narrative walks through the complete **Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning** flow.

---

## Overview

Each demo narrative is designed to be:
- **Self-contained** — can be shown independently without the others
- **Role-aware** — tailored to the persona of the audience
- **Flow-complete** — always shows the full signal-to-outcome arc
- **Evidence-grounded** — every recommendation has a cited rationale

---

## Narrative 1: Decision Intelligence / RevOps / CFO

**Pack:** KORA (at `/lyte/`)  
**Persona:** Marcus Holt, CFO — Meridian Capital Group  
**Duration:** 12 minutes  
**Audience best fit:** CFO, COO, VP RevOps, PE Operating Partner

### Scenario

A $4.2M pipeline deal has stalled for 47 days without escalation. The approval owner departed without a recorded handoff. Conventional reporting didn't surface the problem. KORA's PRISM framework detected it automatically.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | PRISM Motion dimension surfaces a 47-day pipeline stall — deal velocity collapsed to zero | KORA / Command Inbox |
| **2. Context** | 6 signals assembled across Motion, Risk, Intelligence, Pulse — close probability dropped from 84% to 31% | KORA / PRISM Framework |
| **3. Recommendation** | Beacon recommends emergency escalation — CFO sponsorship, VP BD reassignment, buyer re-engagement. Confidence: 87% | KORA / Command Inbox detail |
| **4. Policy / Approval Gate** | Marcus reviews the recommendation, adds a note ("I'll join the buyer call myself"), approves in 49 minutes | KORA / Approval Gate |
| **5. Execution** | Alloy routes: ownership reassigned, buyer email queued, CFO calendar block created, monitoring reactivated | KORA / Execution Record |
| **6. Outcome** | Buyer responds in 4 hours. Close probability: 74%. Deal reactivated in one business day | KORA / Outcome |
| **7. Summary** | Executive summary auto-generated: "$4.2M deal reactivated in 25 hours" | KORA / Executive Summary |
| **8. Proof Chain** | Decision Ledger shows every step — signal, context, recommendation, approval, execution | KORA / Decision Ledger |

### Key Talking Points

- "This is not a dashboard someone maintains. PRISM observed this automatically from the underlying systems."
- "The CFO approved in the Command Inbox — no meetings, no manual research. The reasoning was already assembled."
- "The proof chain is not generated after the fact. Every action creates an immutable record in real time."
- "Three of their other 14 portfolio companies show similar approval gaps — KORA surfaces all of them."

### Value at Risk Framing

- **Without KORA:** Deal falls out of Q2, requiring a full Q3 restart. Revenue shortfall: $4.2M vs. Q2 target. Pipeline velocity data was in the system; no one connected the dots.
- **With KORA:** Detected in 47 days, resolved in 26 hours. Close probability restored to 74%.

---

## Narrative 2: Security / SOC / Risk

**Pack:** PARAGON (at `/sentra/`)  
**Personas:** Diana Reyes (CISO) + Priya Nair (Senior SOC Analyst) — Vantage Infrastructure Partners  
**Duration:** 12 minutes  
**Audience best fit:** CISO, Head of SOC, VP Security, CRO

### Scenario

A coordinated credential stuffing attack hits the Auth Service. 2,400 failed login attempts in 3 minutes from 14 IPs that match a CISA KEV-listed botnet. Sentinel automatically correlates identity signals, maps the MITRE ATT&CK technique (T1110.004), and identifies a CVE with CVSS 9.1 active in the current Auth Service version.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Critical alert: 2,400 failed auth attempts in 3 min — CISA KEV match, MITRE T1110.004 | PARAGON / SOC Dashboard |
| **2. Context** | Threat Twin assembled — 8 signals: identity, CVE, CISA KEV, MITRE, endpoint, network, business impact | PARAGON / Threat Twin |
| **3. Recommendation** | Sentinel recommends 4-step containment playbook: IP block, rate limit, session rotation, patch. Confidence: 94% | PARAGON / Playbook P-001 |
| **4. Policy / Approval Gate** | Diana approves in 96 seconds. Note: escalate patch to P0, notify legal for GDPR window | PARAGON / Approval Gate |
| **5. Execution** | Priya executes: 14 IPs blocked, rate limiting enabled, 3 session tokens rotated, patch scheduled | PARAGON / Execution |
| **6. Outcome** | Attack contained in 23 minutes. 0 accounts compromised. No data exfiltration. GDPR notification filed | PARAGON / Outcome |
| **7. Evidence** | Evidence package assembled: firewall logs, attestations, GDPR filing, CVE remediation proof | PARAGON / Evidence Package |
| **8. Summary** | Executive summary for Diana's board report — one click | PARAGON / Executive Summary |

### Key Talking Points (Role Switching)

**As the SOC Analyst (Priya):**
- "I open the SOC dashboard and Sentinel has already done the correlation — CISA KEV match, MITRE technique, CVE. I don't look this up. It's assembled."
- "The playbook recommendation has a confidence score and a rationale. I'm not guessing."

**As the CISO (Diana):**
- "I approved this in 96 seconds. I saw the blast radius, the CVSS score, and the evidence. My approval is recorded. The analyst executes."
- "The evidence package is ready for our SOC 2 auditor and our board. It was generated automatically — not assembled after a post-incident sprint."

### Value Framing

- **Without PARAGON:** Correlation manual across 4+ tools. CISA KEV match may take hours. MITRE mapping requires analyst research. GDPR window may be missed.
- **With PARAGON:** Detection to containment: 23 minutes. CISO approval: 96 seconds. Evidence package: auto-generated.

---

## Narrative 3: Maritime / Sanctions / Fleet Operations

**Pack:** SEXTANT (at `/vessels/`)  
**Personas:** Captain James Wren (Fleet Ops Director) + Robert Tanner (CCO) — Arcturus Shipping  
**Duration:** 12 minutes  
**Audience best fit:** Head of Fleet Operations, MLRO/Compliance Officer, CFO (cargo exposure), COO

### Scenario

MV Soltana (a product tanker carrying $3.2M of refined petroleum cargo) goes dark on AIS for 134 minutes while transiting near the Strait of Hormuz. It reappears 34nm off the declared route, within 18nm of Iranian territorial waters. OFAC strict liability applies. Revenue at risk: $840,000.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Critical AIS dark event: 134-min blackout, position inconsistency, OFAC corridor proximity | SEXTANT / Fleet Dashboard |
| **2. Context** | Voyage Twin assembled — 7 signals: AIS track, OFAC screening, weather (rules out technical cause), P&L exposure | SEXTANT / Voyage Twin |
| **3. Recommendation** | Helmsman recommends hold at Karachi anchorage, file voyage incident report, notify P&I Club. Confidence: 91% | SEXTANT / Recommendation |
| **4. Policy / Approval Gate** | James approves in 5 minutes — notes he's calling P&I directly. All steps routed through Alloy | SEXTANT / Approval Gate |
| **5. Execution** | Master notified, incident report filed (INC-2026-0414-001), P&I notified, charterer ETA revised | SEXTANT / Execution |
| **6. Outcome** | OFAC clears vessel in 4.5 hours. Voyage resumes. Demurrage $112K recoverable from charterer | SEXTANT / Outcome |
| **7. Auditor View** | Switch to Robert Tanner — sees full voyage audit trail. Exports compliance package for flag state | SEXTANT / Audit Trail |
| **8. Summary** | Voyage record complete — defensible for port authority, P&I, flag state, and OFAC inquiry | SEXTANT / Executive Summary |

### Key Talking Points

- "Helmsman detected this in 6 minutes. A manual review would have taken hours — or happened only when the vessel arrived at port."
- "Weather data ruled out a technical cause — automatically. We didn't need an analyst to check that separately."
- "The OFAC exposure isn't just a compliance question. Revenue at risk: $840,000. SEXTANT makes the business consequence visible alongside the compliance risk."
- "The CCO sees a read-only view — audit trail, decisions, timing, attribution. He exports a compliance package in one click."

### OFAC / Sanctions Framing

- **Without SEXTANT:** Dark event may not be detected until port arrival. No automatic OFAC screening. No route deviation alert. Compliance officer manually assembles post-voyage record.
- **With SEXTANT:** Detected 6 minutes after AIS restoration. OFAC screening already running. Incident report filed within the hold window. Full voyage record preserved.

---

## Narrative 4: Legal / Compliance / Matter Command

**Pack:** Counsel (at `/counsel/`)  
**Persona:** Sophia Marchetti (Managing Attorney) — Marchetti & Osei LLP  
**Duration:** 12 minutes  
**Audience best fit:** Plaintiff-side litigation partners, Legal Operations Director, GC, COO (legal team efficiency)

### Scenario

Rivera v. Apex Mobility Group — a personal injury matter with an estimated value of $485,000. The insurer (Continental General Insurance) has exceeded the 30-day acknowledgement window required under NY DFS Insurance Regulation 68. Counsel detected the clock violation, scored demand readiness at 91%, and surfaced a recommendation to issue a formal Reg 68 violation notice.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Clock violation detected — insurer acknowledgement window exceeded by 12 days. NY DFS Reg 68 §216.6 | Counsel / Matter Twin |
| **2. Context** | 9 signals assembled: deadline status, insurer behavior profile (3 prior violations), demand readiness (91%), settlement band ($418K median), Medicare lien status | Counsel / Context |
| **3. Recommendation** | Issue formal Reg 68 violation notice with demand packet. Confidence: 93%. Marked attorney work product | Counsel / Recommendation |
| **4. Policy / Approval Gate** | Sophia reviews, adds note about citing prior violations, approves in 44 minutes | Counsel / Approval Gate |
| **5. Execution** | Notice drafted, demand exported to Word with citations, letter transmitted, client notified, 7-day escalation deadline set | Counsel / Execution |
| **6. Outcome** | Insurer responds in 5 days. Settlement conference scheduled. Pre-conference offer: $395K (vs. median $418K) | Counsel / Outcome |
| **7. Proof Chain** | Complete, privilege-protected audit trail — every signal, AI action, human approval, document | Counsel / Proof Chain |
| **8. Summary** | "Clock violation triggered settlement response in 5 days" | Counsel / Executive Summary |

### Key Talking Points

- "Sophia didn't set a calendar reminder for the Reg 68 window. Counsel tracks every statutory clock for every matter, automatically."
- "The insurer's prior violation history is in the context — not in a file somewhere. Counsel assembled it. The recommendation cited it."
- "The demand packet was exported to Word with full source citations. The attorney reviews it, approves it, and it goes out. No manual assembly."
- "The proof chain is privilege-protected and attorney work product. It's the audit record for any bar complaint, malpractice review, or regulatory inquiry."

### Legal Operations Framing

- **Without Counsel:** Clock tracking is manual (calendar, spreadsheet, or paralegal memory). Insurer behavior profiles must be assembled per matter. Demand readiness is subjective. Proof chain assembled retrospectively.
- **With Counsel:** All statutory clocks tracked automatically. Insurer profiles built from matter history. Demand readiness scored objectively. Proof chain generated in real time.

---

## Narrative 5: Real Estate / Distress Diligence / Acquisition

**Pack:** DOMAINE (at `/terra/`)  
**Persona:** Marcus Holt (Managing Partner) — Apex Capital Partners  
**Duration:** 12 minutes  
**Audience best fit:** Distressed-asset acquirers, multifamily sponsors, family-office RE allocators, regional-bank OREO desks

### Scenario

1847 Flatbush Ave, Brooklyn — a 12-unit multifamily owned by GreenHouse Realty LLC — has been in lis pendens for 136 days with no cure plan filed. Three days ago, NYC Department of Finance filed a $147,000 tax lien against the same property. DOMAINE detected the compounded distress signal, assembled a Property Twin spanning title, tax, ownership, comparable sales, climate, zoning, rent roll, and lender posture, and surfaced a defensive offer recommendation of $1.95M – $2.10M against a $3.45M ARV.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Compounded distress detected — active lis pendens (136 days) plus newly filed $147K tax lien | DOMAINE / Distress Engine |
| **2. Context** | Property Twin assembled — 11 signals: title, tax, ownership graph (LLC's other 4 holdings), lender posture, 90-day comps, rent roll, climate band, zoning, permits, owner outreach, auction window | DOMAINE / Property Twin |
| **3. Recommendation** | Underwriting Copilot recommends defensive offer band $1.95M – $2.10M with $3.45M ARV reserve. Confidence: 91% | DOMAINE / Underwriting Copilot |
| **4. Policy / Approval Gate** | Marcus reviews, approves in 2.5 hours, notes to pull fresh title abstract and watchlist the LLC's other properties | DOMAINE / Approval Review |
| **5. Execution** | Diligence file opened, title ordered, offer letter generated, comps exported, rent roll abstracted, watchlist created, SPV staged | DOMAINE / Diligence Room |
| **6. Outcome** | Owner counters at $2.18M in 6 days. LOI signed at $2.05M. Closing scheduled 2026-06-12 | DOMAINE / Pipeline |
| **7. Proof Chain** | Every signal, every AI action, every approval, every diligence step logged with actor attribution | DOMAINE / Trust & Provenance |
| **8. Summary** | "Compounded distress detected, defensive offer accepted in 9 days, $1.4M ARV upside" | DOMAINE / Executive Overview |

### Key Talking Points

- "DOMAINE didn't wait for a broker to flag this. It detected the tax lien stacking onto the lis pendens and surfaced the opportunity the same day."
- "The Property Twin spans 11 signals across title, tax, ownership, comps, climate, zoning, rent roll, and lender posture — assembled into one surface, not 11 tabs."
- "The defensive offer band is grounded in equity cushion math, three fresh comps, and a rent-roll upside model — not a gut number."
- "When the owner's other properties get flagged, those go to a watchlist automatically. The next signal becomes a richer, faster decision."
- "The proof chain is what we hand to the LP, the bank, and the title company. Every step is timestamped and attributable."

### Value Framing

- **Without DOMAINE:** Compounded distress gets discovered weeks after a tax lien filing. Property Twin is assembled by a junior analyst across 4–5 separate data sources. Defensive offer math is a spreadsheet. Watchlists are tribal knowledge.
- **With DOMAINE:** Compounded distress detected the same day. Property Twin assembled automatically. Defensive offer band recommended with confidence score. Watchlist auto-extended. Proof chain ready for LP and lender review.

---

## Cross-Narrative Talking Points

These apply regardless of which narrative you're showing:

1. **"The twin is the intelligence layer."** Every product has a domain twin (Matter Twin, Voyage Twin, Threat Twin, Portfolio Command Surface). The twin is not a dashboard — it's a structured model that AI reasons across.

2. **"AI recommends. Humans confirm."** Every consequential action requires human approval. This is enforced at the workflow engine level — not just in the UI.

3. **"Alloy is the execution fabric."** Every approval routes through Alloy. Every execution step is logged with actor attribution. This is what makes the proof chain complete.

4. **"The architecture compounds."** One investment in Alloy, the shared design system, and the entity model serves every vertical. Adding a new domain pack means building an Observe layer — the rest is shared.

5. **"The proof chain is structural."** The audit trail isn't generated after the fact. Every signal, recommendation, approval, and action writes to the Decision Ledger in real time.

---

## Persona Reference

| Persona | Role | Domain | Key Permissions |
|---------|------|--------|----------------|
| Marcus Holt (CFO) | Executive | KORA / Decision Intelligence | Approve, view financials, export |
| Diana Reyes (CISO) | Executive | PARAGON / Security | Approve, view financials, manage personnel |
| Captain James Wren | Operator | SEXTANT | Approve + execute, full raw signals |
| Priya Nair (SOC Analyst) | Analyst | PARAGON | Execute (no approve), full raw signals |
| Sophia Marchetti (Attorney) | Operator | Counsel | Approve + execute, view financials |
| Marcus Holt (Apex Capital) | Operator | DOMAINE | Approve + execute, view financials, full raw signals |
| Robert Tanner (CCO) | Auditor | SEXTANT + KORA | Read-only audit, export only |

---

*See `docs/demo/demo-day-guide.md` for setup instructions and presentation tips.*
