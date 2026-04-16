# Sales Handoff Guide — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** Sales, implementation, and customer success teams  
**Purpose:** Everything a sales or CS team member needs to take a deal from pipeline to live

---

## Overview

SZL Holdings sells governed decision infrastructure to enterprise operators in security, maritime, real estate, legal, and professional services. The current go-to-market motion is design partner — not a standard AE/SDR sales process. Deals are relationship-driven, founder-led in most cases, and involve deep discovery about the prospect's decision accountability gaps.

This guide covers: the buying motion, what to know before your first call, qualification criteria, handoff from sales to implementation, and what success teams need to deliver value.

---

## Part 1 — What You Are Selling

### The Category
Governed decision infrastructure. Not a dashboard. Not an AI copilot. Not a SIEM. The structural layer between signal detection and action execution — enforcing governance, attribution, and outcome tracking.

**If a prospect is not experiencing the accountability gap, they are not ready to buy.** Your job in discovery is to surface the gap they already have, not to convince them they have a problem.

### The Entry Product
The design partner program. See [DESIGN_PARTNER_PROGRAM.md](DESIGN_PARTNER_PROGRAM.md) for terms and positioning. Every first conversation should be positioned as a design partnership — not a software sale.

### The Governed Decision Loop (know this cold)
```
Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
```
This is the core demo and the core thesis. Every feature maps to one of these nine steps.

### The Six Primitives (know the names)
Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, Event Fabric.

Do not call them features. They are architectural primitives. See [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md).

---

## Part 2 — Ideal Customer Profile

### Firmographic
- **Size:** Mid-market ($50M–$500M revenue) to enterprise ($500M+)
- **Industry:** Security/defense, maritime, real estate, legal/professional services
- **Regulatory exposure:** High — OFAC, IMO, SEC, EU AI Act, FINRA
- **AI maturity:** Early or mid adopters — have AI tools but lack governance infrastructure
- **Decision complexity:** Decisions involve multiple stakeholders and have compliance consequences

### Personas (by domain)
- **Aegis:** CISO, VP Security, SOC Director
- **Vessels:** Fleet Manager, VP Operations, Chief Risk Officer
- **Terra:** Head of Acquisitions, Portfolio Manager, Investment Analyst
- **Platform:** COO, CTO, VP Engineering, Chief Risk Officer

### Disqualifiers
- Companies that want fully autonomous AI with no human approval gates
- Companies seeking a pure SIEM, dashboard, or workflow tool (without accountability needs)
- Organizations without compliance or audit trail requirements
- Prospects who refuse to share their decision workflows during discovery

---

## Part 3 — The Sales Motion

### Stage 0 — Outbound / Inbound
**Goal:** Qualify the accountability gap.

**First email / cold outreach framework:**
1. Name the problem: "Most AI tools in [their domain] add recommendation volume without governance."
2. Name the consequence: "When something goes wrong — regulatory audit, litigation, board review — there is no decision trail."
3. Name the solution category: "SZL Holdings builds governed decision infrastructure."
4. CTA: Request a 20-minute qualified conversation.

**Do not lead with product features.** Lead with the accountability gap.

---

### Stage 1 — Discovery (20–30 min)
**Goal:** Confirm the accountability gap is present and quantifiable.

**Discovery questions:**
1. "How do you currently track which decisions were made, who made them, and based on what information?"
2. "When a regulatory body or legal team asks to reconstruct a decision chain, how do you respond?"
3. "How do you govern AI recommendations before they become actions?"
4. "Who in your organization is accountable when an AI-assisted action goes wrong?"
5. "What does your compliance posture look like for high-consequence operational decisions?"
6. "What does your team spend on managing decision fallout — audits, investigations, remediation?"

**Qualification criteria (MEDDIC-aligned):**
- **Metrics:** Can they quantify the cost of the accountability gap? (audit hours, incidents, fines)
- **Economic buyer:** Who signs? Is it within reach in the conversation?
- **Decision criteria:** What do they need to say yes? (SOC 2, references, pilot success)
- **Decision process:** Procurement path, timeline, stakeholders
- **Identify pain:** Is the accountability gap confirmed as a priority?
- **Champion:** Is there someone internal who will advocate for this?

---

### Stage 2 — Demo (30–45 min)
**Goal:** Show the governed decision loop in context of their domain.

Run the domain-specific demo. See [DEMO_STRATEGY.md](DEMO_STRATEGY.md) for script.

**Always show:**
- The Decision Theater (universal — any audience)
- The Proof Chain (lead with accountability — most resonant)
- Covenant Policy in action (governance, not just workflow)

**Never show:**
- Unfinished routes
- Internal admin routes
- Investor data room

For executive audiences: [EXECUTIVE_DEMO.md](EXECUTIVE_DEMO.md)  
For operator audiences: [OPERATOR_DEMO.md](OPERATOR_DEMO.md)  
For technical audiences: [TECHNICAL_DEMO.md](TECHNICAL_DEMO.md)

---

### Stage 3 — Design Partner Proposal
**Goal:** Structure the engagement and get signatures.

**Design partner program deliverables:**
1. Share the [DESIGN_PARTNER_PROGRAM.md](DESIGN_PARTNER_PROGRAM.md)
2. Propose a domain-specific engagement (8–12 weeks)
3. Define co-design deliverables (what the partner contributes, what they receive)
4. Confirm preferred pricing terms
5. Get legal/procurement started: NDA → Design Partner Agreement → Data Processing Agreement

**Blockers to anticipate:**
- SSO / identity provider requirements → route to Engineering
- Data residency / sovereignty requirements → route to Engineering + Legal
- SOC 2 requirement → provide Security Questionnaire Pack + timeline for certification
- References → provide reference conversations with existing partners (if available)

---

### Stage 4 — Pilot Kickoff Handoff
**Goal:** Hand off a closed deal to implementation cleanly.

Complete the handoff checklist before implementation takes ownership.

**Handoff checklist:**
- [ ] Design Partner Agreement signed
- [ ] NDA signed
- [ ] Data Processing Agreement signed (if applicable)
- [ ] Primary contacts confirmed (champion, technical lead, admin)
- [ ] Domain pack(s) scope confirmed
- [ ] Success metrics agreed upon (what does a successful pilot look like?)
- [ ] Integration requirements documented (data sources, identity provider, alerting)
- [ ] Timeline confirmed (kickoff date, milestone dates, review dates)
- [ ] Escalation path communicated to customer

**Hand off to implementation by completing the [Customer Success Kickoff section below].**

---

## Part 4 — What Implementation Needs

When a deal closes, implementation needs:

| Item | Who provides | Notes |
|---|---|---|
| Signed agreements | Sales | DA, NDA, DPA |
| Contact list | Sales | Champion, technical admin, executive sponsor |
| Domain pack scope | Sales | Which packs are in scope for this engagement |
| Success metrics | Sales + Customer | What does a successful pilot look like? Specific, measurable. |
| Integration inventory | Sales + Customer | What data sources, IdP, and alerting tools do they use? |
| Timeline | Sales | Kickoff date, milestone checkpoints, review dates |
| Known risks | Sales | Any technical, legal, or organizational blockers to watch |
| CRM record | Sales | Full deal history in CRM — notes, objections, champions |

---

## Part 5 — Competitive Displacement Situations

If the prospect has an existing tool in place:

### vs. SIEM (Splunk, Microsoft Sentinel, etc.)
**Framing:** "SIEMs show what happened. SZL Holdings governs what happens next. We can sit alongside your SIEM — the Event Fabric ingests SIEM alerts and routes them into the governed decision loop."

### vs. Dashboard / BI tools (Tableau, PowerBI, etc.)
**Framing:** "BI tools solve visibility. SZL Holdings solves accountability. Different problem, different layer."

### vs. AI copilots (GitHub Copilot, ChatGPT, etc.)
**Framing:** "Copilots add recommendation volume without governance. Every recommendation on our platform is governed by Covenant Policy before execution and recorded in the Proof Chain."

### vs. Workflow tools (ServiceNow, n8n, Zapier)
**Framing:** "Workflow tools automate sequences. SZL Holdings adds policy enforcement, simulation, and immutable attribution to every workflow step. These are complementary, not competitive."

---

## Part 6 — Common Questions from Buyers

See [FAQ.md](FAQ.md) for full answers. Key ones for sales:

| Question | Short answer |
|---|---|
| "Are you SOC 2 certified?" | Targeted Q3–Q4 2026. Architecture built to SOC 2 controls. Security Questionnaire Pack available. |
| "Do you have customer references?" | Design partner phase — reference conversations available on request. |
| "Can we use just one domain pack?" | Yes. Each domain pack is designed to work independently. |
| "How long does implementation take?" | 4–8 weeks for design partner onboarding. |
| "What data do you need access to?" | Only what is explicitly connected via integration configuration — we do not request access to data outside configured integrations. |

---

## Reference

- [Design Partner Program](DESIGN_PARTNER_PROGRAM.md) — Full program terms and pricing
- [Demo Strategy](DEMO_STRATEGY.md) — Demo scripts by audience
- [Objection Handling](OBJECTION_HANDLING.md) — Full objection response library
- [ROI Model](ROI_MODEL.md) — Value quantification framework
- [Customer Success Playbook](CUSTOMER_SUCCESS_PLAYBOOK.md) — Post-sale delivery
- [Land and Expand](LAND_AND_EXPAND.md) — Expansion motion
