# SZL Holdings — Executive Demo Script

**Purpose:** Structured script for investor and enterprise executive demonstrations — a 45-minute walkthrough showing the platform thesis in motion.

**Audience:** growth capital investors, enterprise CXO evaluators, strategic partners
**Duration:** 45–60 minutes (full); 20 minutes (condensed)
**Format:** Presenter-led with live platform

---

## Before the Demo

### Setup Checklist

- [ ] API server health check: `GET /api/health` returns healthy
- [ ] All workflows running (SZL Holdings, Vessels, Aegis, Lyte)
- [ ] Demo seed data fresh (run `pnpm db:seed` if needed)
- [ ] Browser windows pre-loaded for each platform (SZL Holdings, Lyte, Vessels, Aegis, Terra)
- [ ] CORTEX mobile app loaded on device or simulator
- [ ] Screen resolution set for presentation (1920×1080 recommended)
- [ ] Notifications silenced; no unrelated browser tabs visible

### Audience Context Questions (Ask Before Starting)

Ask the evaluator 2–3 questions to tailor the demo:
1. "What industry are your portfolio companies / your organization operating in?"
2. "Where does operational decision-making break down most painfully for them today?"
3. "Are you more interested in the enterprise buyer use case or the platform architecture?"

Use their answers to weight which domain pack gets more time.

---

## Demo Script

### Opening (5 minutes)

**What to say:**
> "What we're going to show you today is not a dashboard. It's a governed intelligence loop. Most enterprise software either observes — it shows you data — or it executes — it runs workflows. What's missing is the layer in between: the layer that connects what the system knows to what actually gets decided and confirmed, with a full accountability record. That's what SZL Holdings has built."

> "Every platform you'll see today shares one intelligence backbone, one governance model, and one design language. The investment is made once. The value compounds across every vertical we add."

**Navigate to:** `szlholdings.com` (corporate surface)

**Show:**
- Platform hierarchy (Lyte → Alloy → Domain Packs → Carlota Jo)
- Trust center (mention immutable proof chain)
- Tech stack (mention shared infrastructure)

---

### Act 1: The Command Surface — Lyte (12 minutes)

**Transition:**
> "Let's start where a Chief Operating Officer would start every morning. Lyte is the command surface — the place where business leaders see operational reality across their entire system, not just one department or tool."

**Navigate to:** Lyte within the SZL Holdings workspace

**Show and explain:**

**1. PRISM Framework Overview (3 min)**
- Pulse: organizational heartbeat — what's healthy, what's degrading
- Risk: weighted risk signals from across the operation
- Intelligence: AI-synthesized context — what the system has inferred
- Signals: the live feed of anomalies and alerts
- Motion: velocity and throughput across operational processes

**Key talking point:**
> "This is not a KPI dashboard that someone maintains manually. Every signal here is observed from the underlying systems automatically. The AI synthesizes across them. The operator acts. The platform records everything."

**2. Command Inbox (3 min)**
- Show a pending action waiting for approval
- Walk through the signal → inference → approval flow

**Key talking point:**
> "This action was proposed by an AI agent — Sentinel, in this case. You can see the confidence score, the evidence chain, the policy that governs this action. The operator doesn't execute blindly. They see the reasoning. They confirm. The platform records who confirmed and when."

**3. Proof Chain / Audit Trail (3 min)**
- Open the audit trail for the action
- Show signal ID → inference ID → approval ID → outcome

**Key talking point:**
> "This is the Decision Ledger. Every consequential decision on this platform — human or AI-assisted — leaves a complete provenance record. This is what enterprise compliance, board oversight, and regulatory inquiry require. It's structural, not bolted on."

**4. Readiness Module (3 min)**
- Show readiness scoring across operational areas
- Show approval latency metrics

---

### Act 2: Domain Intelligence — Vessels (10 minutes)

**Transition:**
> "Let me show you how this architecture extends to a specific vertical — maritime operations. Vessels is built for fleet executives and operations teams. Same governance model. Different observation layer."

**Navigate to:** `/vessels/`

**Show and explain:**

**1. Fleet Dashboard (2 min)**
- Live vessel positions (acknowledge: simulated AIS; live feed available at enterprise tier)
- Dark vessel detection alert

**Key talking point:**
> "A vessel disappears from AIS for 127 minutes. Sentinel — our maritime AI agent — detects the gap, correlates it with route deviation and proximity to a sanctioned port area, and generates an inference: probable AIS manipulation. Confidence: 87%. The compliance officer is notified. They review the evidence. They hold the voyage. Two hours later, sanctions screening clears the vessel. Voyage resumes."

**2. Voyage Economics (3 min)**
- Voyage P&L with cost breakdown
- Revenue at risk calculation

**Key talking point:**
> "The business impact of that AIS anomaly isn't just a compliance question — it's an $840,000 cargo question. Vessels makes that explicit. The signal and the business consequence are the same conversation."

**3. Exception Center (3 min)**
- Show an open exception with consequence modeling
- Show the action routing to Alloy

**4. Compliance / Sanctions (2 min)**
- OFAC screening integration
- Sanctions watchlist matching

---

### Act 3: Defense Intelligence — Aegis (8 minutes)

**Transition:**
> "The same architecture extends to cybersecurity. Aegis is built for CISOs, SOC analysts, and managed security providers. Three unified workspaces: Defense operations, MSP Command, and AI Research."

**Navigate to:** `/aegis/`

**Show and explain:**

**1. SOC Dashboard (3 min)**
- Active incidents with MITRE ATT&CK coverage
- Real-time threat indicators (CISA KEV, NVD CVE)

**Key talking point:**
> "The MITRE ATT&CK coverage you're seeing is real — pulled from the CISA Known Exploited Vulnerabilities catalog and NVD in real time. When a new CVE is published, it's mapped to the relevant techniques and surfaced to the analyst within minutes."

**2. Incident Lifecycle (3 min)**
- Open an incident and walk through detection → triage → containment stages
- Show the business journey: what's the operational impact of this incident?

**3. AI Research Workspace (2 min)**
- Model registry and experiment tracking
- Show agent governance: every agent has a policy scope and eval dataset

---

### Act 4: Real Estate Intelligence — Terra (5 minutes)

**Transition:**
> "The platform isn't limited to financial services or security. Terra applies the same architecture to commercial real estate — distressed property intelligence for NYC brokers and investors."

**Navigate to:** `/terra/`

**Show:**
- Distress property map (live NYC Open Data pipeline)
- Ownership structure view
- Deal pipeline managed through Alloy

**Key talking point:**
> "The distress data you're seeing is live — pulled from NYC Open Data: lis pendens filings, tax lien records, pre-foreclosure notices. Terra surfaces opportunity signals automatically. The broker's job is to evaluate and act — not to research manually across seven government databases."

---

### Act 5: The Platform Thesis (5 minutes)

**Transition:**
> "We've now seen the platform working in three different domains — business operations, maritime logistics, and real estate. Let me show you what makes the architecture compounding."

**Navigate to:** SZL Holdings corporate view (platform diagram)

**Talking points:**

> "Every domain pack we add — Vessels, Aegis, Terra, and any future vertical — shares the same execution fabric, the same design system, the same authentication model, the same AI governance framework. We build the Observe layer once for each domain. Everything else is shared."

> "The entity model is the intelligence layer. A vessel is an entity. A security asset is an entity. A property is an entity. When they connect — a vessel carrying cargo insured by a company whose infrastructure is under attack — the platform surfaces that connection. You cannot get that from siloed tools."

> "The governance model is the moat. Approval latency data, proof chains, agent attribution — these are the features that earn trust from compliance teams, from boards, from regulators. They cannot be added after the fact. They are structural."

---

### Act 6: Mobile — CORTEX (5 minutes, optional)

**Transition:**
> "Operations leaders don't sit at desks. The platform follows them."

**Show:** CORTEX mobile (iOS or Android)
- Command surface in pocket — same signals, same approvals
- Cross-domain alert summary
- Approval confirmation flow on mobile

---

### Closing (5 minutes)

**Summarize:**
> "What you've seen today is a platform that observes across multiple operational domains simultaneously, reasons across those observations using governed AI agents, routes the insight to the right human for confirmation, and records every decision with complete provenance. That loop — observe, infer, govern, confirm, record — runs in minutes, not days."

> "We are not a dashboard company. We are not an automation company. We are a governed intelligence platform. The enterprises that adopt this architecture will move faster, with more accountability, and with better outcomes than their competitors."

**Open to questions.**

---

## Common Questions and Responses

| Question | Response |
|---|---|
| "Is the data live?" | "Most core data is live — CISA KEV, NVD, NYC Open Data, the audit trail, the workflow engine. Fleet positions are currently simulated; live AIS integration is available at enterprise tier. All demo-mode data is explicitly labeled in the UI." |
| "How do you compare to Palantir?" | "Palantir is government analytics with a multi-year integration model. We're commercial-first, with a 30-day integration path and a governance model built for regulated commercial enterprises, not classified government programs." |
| "What's the AI governance model?" | "Every AI agent has a registered policy scope and action scope. Agents may advise; they may not execute consequential actions without explicit human confirmation. This is enforced at the workflow engine level — not just in the UI." |
| "What's the revenue model?" | "SaaS subscription per domain pack, per workspace. Enterprise tier includes live data feeds, SSO, SCIM, and custom SLA. We're pre-revenue; billing infrastructure is built and awaiting activation." |
| "How does a new customer get started?" | "30-day activation path: workspace provisioned, domain pack configured, first policy set deployed, first team members onboarded. No custom integration required in the first phase." |
| "What's your biggest technical risk?" | "Live data feed integration at enterprise tier — AIS, SIEM connectors, CRM data. We've built the integration model; activating it per tenant requires tenant-side API access. This is a commercial milestone, not a technical one." |

---

## Condensed 20-Minute Version

For time-constrained meetings, cover:
1. Opening thesis (2 min)
2. Lyte — Command Inbox + Proof Chain (6 min)
3. Vessels — Fleet dashboard + AIS anomaly + consequence modeling (6 min)
4. Platform compounding thesis (4 min)
5. Q&A (2 min)

---

*Update this script after each significant demo. Note which sections generated the most engagement and which questions were asked.*
