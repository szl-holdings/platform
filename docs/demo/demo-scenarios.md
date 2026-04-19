# SZL Holdings — Demo Scenarios

*Version: 1.0 | Last updated: April 2026*

This document describes the four polished demo narratives for SZL Holdings prospect, partner, and investor demonstrations. Each narrative walks through the complete **Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning** flow.

---

## Overview

Each demo narrative is designed to be:
- **Self-contained** — can be shown independently without the others
- **Role-aware** — tailored to the persona of the audience
- **Flow-complete** — always shows the full signal-to-outcome arc
- **Evidence-grounded** — every recommendation has a cited rationale

---

## Narrative 1: Business Observability / RevOps / CFO

**Pack:** Lyte  
**Persona:** Marcus Holt, CFO — Meridian Capital Group  
**Duration:** 12 minutes  
**Audience best fit:** CFO, COO, VP RevOps, PE Operating Partner

### Scenario

A $4.2M pipeline deal has stalled for 47 days without escalation. The approval owner departed without a recorded handoff. Conventional reporting didn't surface the problem. Lyte's PRISM framework detected it automatically.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | PRISM Motion dimension surfaces a 47-day pipeline stall — deal velocity collapsed to zero | Lyte / Command Inbox |
| **2. Context** | 6 signals assembled across Motion, Risk, Intelligence, Pulse — close probability dropped from 84% to 31% | Lyte / PRISM Framework |
| **3. Recommendation** | Beacon recommends emergency escalation — CFO sponsorship, VP BD reassignment, buyer re-engagement. Confidence: 87% | Lyte / Command Inbox detail |
| **4. Approval** | Marcus reviews the recommendation, adds a note ("I'll join the buyer call myself"), approves in 49 minutes | Lyte / Approval Gate |
| **5. Execution** | Alloy routes: ownership reassigned, buyer email queued, CFO calendar block created, monitoring reactivated | Lyte / Execution Record |
| **6. Outcome** | Buyer responds in 4 hours. Close probability: 74%. Deal reactivated in one business day | Lyte / Outcome |
| **7. Summary** | Executive summary auto-generated: "$4.2M deal reactivated in 25 hours" | Lyte / Executive Summary |
| **8. Proof Chain** | Decision Ledger shows every step — signal, context, recommendation, approval, execution | Lyte / Decision Ledger |

### Key Talking Points

- "This is not a dashboard someone maintains. PRISM observed this automatically from the underlying systems."
- "The CFO approved in the Command Inbox — no meetings, no manual research. The reasoning was already assembled."
- "The proof chain is not generated after the fact. Every action creates an immutable record in real time."
- "Three of their other 14 portfolio companies show similar approval gaps — Lyte surfaces all of them."

### Value at Risk Framing

- **Without Lyte:** Deal falls out of Q2, requiring a full Q3 restart. Revenue shortfall: $4.2M vs. Q2 target. Pipeline velocity data was in the system; no one connected the dots.
- **With Lyte:** Detected in 47 days, resolved in 26 hours. Close probability restored to 74%.

---

## Narrative 2: Security / SOC / Risk

**Pack:** Aegis  
**Personas:** Diana Reyes (CISO) + Priya Nair (Senior SOC Analyst) — Vantage Infrastructure Partners  
**Duration:** 12 minutes  
**Audience best fit:** CISO, Head of SOC, VP Security, CRO

### Scenario

A coordinated credential stuffing attack hits the Auth Service. 2,400 failed login attempts in 3 minutes from 14 IPs that match a CISA KEV-listed botnet. Sentinel automatically correlates identity signals, maps the MITRE ATT&CK technique (T1110.004), and identifies a CVE with CVSS 9.1 active in the current Auth Service version.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Critical alert: 2,400 failed auth attempts in 3 min — CISA KEV match, MITRE T1110.004 | Aegis / SOC Dashboard |
| **2. Context** | Threat Twin assembled — 8 signals: identity, CVE, CISA KEV, MITRE, endpoint, network, business impact | Aegis / Threat Twin |
| **3. Recommendation** | Sentinel recommends 4-step containment playbook: IP block, rate limit, session rotation, patch. Confidence: 94% | Aegis / Playbook P-001 |
| **4. Approval** | Diana approves in 96 seconds. Note: escalate patch to P0, notify legal for GDPR window | Aegis / Approval Gate |
| **5. Execution** | Priya executes: 14 IPs blocked, rate limiting enabled, 3 session tokens rotated, patch scheduled | Aegis / Execution |
| **6. Outcome** | Attack contained in 23 minutes. 0 accounts compromised. No data exfiltration. GDPR notification filed | Aegis / Outcome |
| **7. Evidence** | Evidence package assembled: firewall logs, attestations, GDPR filing, CVE remediation proof | Aegis / Evidence Package |
| **8. Summary** | Executive summary for Diana's board report — one click | Aegis / Executive Summary |

### Key Talking Points (Role Switching)

**As the SOC Analyst (Priya):**
- "I open the SOC dashboard and Sentinel has already done the correlation — CISA KEV match, MITRE technique, CVE. I don't look this up. It's assembled."
- "The playbook recommendation has a confidence score and a rationale. I'm not guessing."

**As the CISO (Diana):**
- "I approved this in 96 seconds. I saw the blast radius, the CVSS score, and the evidence. My approval is recorded. The analyst executes."
- "The evidence package is ready for our SOC 2 auditor and our board. It was generated automatically — not assembled after a post-incident sprint."

### Value Framing

- **Without Aegis:** Correlation manual across 4+ tools. CISA KEV match may take hours. MITRE mapping requires analyst research. GDPR window may be missed.
- **With Aegis:** Detection to containment: 23 minutes. CISO approval: 96 seconds. Evidence package: auto-generated.

---

## Narrative 3: Maritime / Sanctions / Fleet Operations

**Pack:** Vessels  
**Personas:** Captain James Wren (Fleet Ops Director) + Robert Tanner (CCO) — Arcturus Shipping  
**Duration:** 12 minutes  
**Audience best fit:** Head of Fleet Operations, MLRO/Compliance Officer, CFO (cargo exposure), COO

### Scenario

MV Soltana (a product tanker carrying $3.2M of refined petroleum cargo) goes dark on AIS for 134 minutes while transiting near the Strait of Hormuz. It reappears 34nm off the declared route, within 18nm of Iranian territorial waters. OFAC strict liability applies. Revenue at risk: $840,000.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Critical AIS dark event: 134-min blackout, position inconsistency, OFAC corridor proximity | Vessels / Fleet Dashboard |
| **2. Context** | Voyage Twin assembled — 7 signals: AIS track, OFAC screening, weather (rules out technical cause), P&L exposure | Vessels / Voyage Twin |
| **3. Recommendation** | Helmsman recommends hold at Karachi anchorage, file voyage incident report, notify P&I Club. Confidence: 91% | Vessels / Recommendation |
| **4. Approval** | James approves in 5 minutes — notes he's calling P&I directly. All steps routed through Alloy | Vessels / Approval Gate |
| **5. Execution** | Master notified, incident report filed (INC-2026-0414-001), P&I notified, charterer ETA revised | Vessels / Execution |
| **6. Outcome** | OFAC clears vessel in 4.5 hours. Voyage resumes. Demurrage $112K recoverable from charterer | Vessels / Outcome |
| **7. Auditor View** | Switch to Robert Tanner — sees full voyage audit trail. Exports compliance package for flag state | Vessels / Audit Trail |
| **8. Summary** | Voyage record complete — defensible for port authority, P&I, flag state, and OFAC inquiry | Vessels / Executive Summary |

### Key Talking Points

- "Helmsman detected this in 6 minutes. A manual review would have taken hours — or happened only when the vessel arrived at port."
- "Weather data ruled out a technical cause — automatically. We didn't need an analyst to check that separately."
- "The OFAC exposure isn't just a compliance question. Revenue at risk: $840,000. Vessels makes the business consequence visible alongside the compliance risk."
- "The CCO sees a read-only view — audit trail, decisions, timing, attribution. He exports a compliance package in one click."

### OFAC / Sanctions Framing

- **Without Vessels:** Dark event may not be detected until port arrival. No automatic OFAC screening. No route deviation alert. Compliance officer manually assembles post-voyage record.
- **With Vessels:** Detected 6 minutes after AIS restoration. OFAC screening already running. Incident report filed within the hold window. Full voyage record preserved.

---

## Narrative 4: Legal / Compliance / Matter Command

**Pack:** PRISM Counsel  
**Persona:** Sophia Marchetti (Managing Attorney) — Marchetti & Osei LLP  
**Duration:** 12 minutes  
**Audience best fit:** Plaintiff-side litigation partners, Legal Operations Director, GC, COO (legal team efficiency)

### Scenario

Rivera v. Apex Mobility Group — a personal injury matter with an estimated value of $485,000. The insurer (Continental General Insurance) has exceeded the 30-day acknowledgement window required under NY DFS Insurance Regulation 68. PRISM Counsel detected the clock violation, scored demand readiness at 91%, and surfaced a recommendation to issue a formal Reg 68 violation notice.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Clock violation detected — insurer acknowledgement window exceeded by 12 days. NY DFS Reg 68 §216.6 | PRISM Counsel / Matter Twin |
| **2. Context** | 9 signals assembled: deadline status, insurer behavior profile (3 prior violations), demand readiness (91%), settlement band ($418K median), Medicare lien status | PRISM Counsel / Context |
| **3. Recommendation** | Issue formal Reg 68 violation notice with demand packet. Confidence: 93%. Marked attorney work product | PRISM Counsel / Recommendation |
| **4. Approval** | Sophia reviews, adds note about citing prior violations, approves in 44 minutes | PRISM Counsel / Approval Gate |
| **5. Execution** | Notice drafted, demand exported to Word with citations, letter transmitted, client notified, 7-day escalation deadline set | PRISM Counsel / Execution |
| **6. Outcome** | Insurer responds in 5 days. Settlement conference scheduled. Pre-conference offer: $395K (vs. median $418K) | PRISM Counsel / Outcome |
| **7. Proof Chain** | Complete, privilege-protected audit trail — every signal, AI action, human approval, document | PRISM Counsel / Proof Chain |
| **8. Summary** | "Clock violation triggered settlement response in 5 days" | PRISM Counsel / Executive Summary |

### Key Talking Points

- "Sophia didn't set a calendar reminder for the Reg 68 window. PRISM Counsel tracks every statutory clock for every matter, automatically."
- "The insurer's prior violation history is in the context — not in a file somewhere. PRISM assembled it. The recommendation cited it."
- "The demand packet was exported to Word with full source citations. The attorney reviews it, approves it, and it goes out. No manual assembly."
- "The proof chain is privilege-protected and attorney work product. It's the audit record for any bar complaint, malpractice review, or regulatory inquiry."

### Legal Operations Framing

- **Without PRISM Counsel:** Clock tracking is manual (calendar, spreadsheet, or paralegal memory). Insurer behavior profiles must be assembled per matter. Demand readiness is subjective. Proof chain assembled retrospectively.
- **With PRISM Counsel:** All statutory clocks tracked automatically. Insurer profiles built from matter history. Demand readiness scored objectively. Proof chain generated in real time.

---

## Narrative 5: Real Estate / Distress Diligence / Acquisition

**Pack:** Terra  
**Persona:** Marcus Holt (Managing Partner) — Apex Capital Partners  
**Duration:** 12 minutes  
**Audience best fit:** Distressed-asset acquirers, multifamily sponsors, family-office RE allocators, regional-bank OREO desks

### Scenario

1847 Flatbush Ave, Brooklyn — a 12-unit multifamily owned by GreenHouse Realty LLC — has been in lis pendens for 136 days with no cure plan filed. Three days ago, NYC Department of Finance filed a $147,000 tax lien against the same property. Terra detected the compounded distress signal, assembled a Property Twin spanning title, tax, ownership, comparable sales, climate, zoning, rent roll, and lender posture, and surfaced a defensive offer recommendation of $1.95M – $2.10M against a $3.45M ARV.

### Flow

| Step | What Happens | Where to Show |
|------|-------------|---------------|
| **1. Signal** | Compounded distress detected — active lis pendens (136 days) plus newly filed $147K tax lien | Terra / Distress Engine |
| **2. Context** | Property Twin assembled — 11 signals: title, tax, ownership graph (LLC's other 4 holdings), lender posture, 90-day comps, rent roll, climate band, zoning, permits, owner outreach, auction window | Terra / Property Twin |
| **3. Recommendation** | Underwriting Copilot recommends defensive offer band $1.95M – $2.10M with $3.45M ARV reserve. Confidence: 91% | Terra / Underwriting Copilot |
| **4. Approval** | Marcus reviews, approves in 2.5 hours, notes to pull fresh title abstract and watchlist the LLC's other properties | Terra / Approval Review |
| **5. Execution** | Diligence file opened, title ordered, offer letter generated, comps exported, rent roll abstracted, watchlist created, SPV staged | Terra / Diligence Room |
| **6. Outcome** | Owner counters at $2.18M in 6 days. LOI signed at $2.05M. Closing scheduled 2026-06-12 | Terra / Pipeline |
| **7. Proof Chain** | Every signal, every AI action, every approval, every diligence step logged with actor attribution | Terra / Trust & Provenance |
| **8. Summary** | "Compounded distress detected, defensive offer accepted in 9 days, $1.4M ARV upside" | Terra / Executive Overview |

### Key Talking Points

- "Terra didn't wait for a broker to flag this. It detected the tax lien stacking onto the lis pendens and surfaced the opportunity the same day."
- "The Property Twin spans 11 signals across title, tax, ownership, comps, climate, zoning, rent roll, and lender posture — assembled into one surface, not 11 tabs."
- "The defensive offer band is grounded in equity cushion math, three fresh comps, and a rent-roll upside model — not a gut number."
- "When the owner's other properties get flagged, those go to a watchlist automatically. The next signal becomes a richer, faster decision."
- "The proof chain is what we hand to the LP, the bank, and the title company. Every step is timestamped and attributable."

### Value Framing

- **Without Terra:** Compounded distress gets discovered weeks after a tax lien filing. Property Twin is assembled by a junior analyst across 4–5 separate data sources. Defensive offer math is a spreadsheet. Watchlists are tribal knowledge.
- **With Terra:** Compounded distress detected the same day. Property Twin assembled automatically. Defensive offer band recommended with confidence score. Watchlist auto-extended. Proof chain ready for LP and lender review.

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
| Marcus Holt (CFO) | Executive | Lyte / Business | Approve, view financials, export |
| Diana Reyes (CISO) | Executive | Aegis / Security | Approve, view financials, manage personnel |
| Captain James Wren | Operator | Vessels | Approve + execute, full raw signals |
| Priya Nair (SOC Analyst) | Analyst | Aegis | Execute (no approve), full raw signals |
| Sophia Marchetti (Attorney) | Operator | PRISM Counsel | Approve + execute, view financials |
| Marcus Holt (Apex Capital) | Operator | Terra | Approve + execute, view financials, full raw signals |
| Robert Tanner (CCO) | Auditor | Vessels + Lyte | Read-only audit, export only |

---

*See `docs/demo/demo-day-guide.md` for setup instructions and presentation tips.*
