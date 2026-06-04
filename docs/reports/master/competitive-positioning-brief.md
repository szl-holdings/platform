# Competitive Positioning Brief — SZL Holdings / Lyte + Alloy
**Version:** 1.0  
**Date:** April 3, 2026  
**Audience:** Investors, design partners, strategic conversations

---

## The One-Line Position

**Lyte + Alloy** is the operational intelligence layer for companies whose operations span multiple tools and teams — surfacing what's blocked, who's responsible, and what needs to happen next, with AI that shows its reasoning and requires human approval before it acts.

---

## Market Category

**Operational intelligence / Workflow observability**

We do not call ourselves "AI automation." We call ourselves "operational intelligence with accountability." This distinction is intentional.

The problem we solve: Companies have operational data in dozens of tools. None of those tools tell them what's blocked, what's owned, or what decision needs to be made. The gap between "data exists" and "decision is made" is where operational latency lives.

---

## How We Stand Out

### 1. Trust by design, not by retrofit

Most platforms add audit logs and approval workflows as enterprise add-ons. In Lyte + Alloy, the audit trail is on every entity by default. Ownership is explicit (including "Unassigned" as a visible state). Evidence backs every AI recommendation. Approval is required before any AI action executes.

This is not a compliance checkbox. It is how the product works.

### 2. AI that shows its work

The Alloy engine produces structured decision objects — not paragraphs of text. Every decision includes evidence items with confidence scores, a rationale statement, and a clear "proposed" status that requires human approval. The AI does not act autonomously. It advises, traces its reasoning, and waits for a human.

This positions us for industries (financial services, legal, operations) where autonomous AI is a liability risk, not a feature.

### 3. Domain-agnostic execution spine with domain-specific surfaces

The Alloy engine is not tied to any domain. Lyte uses it for workflow observability. Aegis will use it for security operations. Terra will use it for real estate intelligence. Vessels will use it for maritime fleet management. Same schemas, same trust layer, same audit infrastructure.

The bet: operational intelligence as a platform, not as a point solution.

### 4. Built for the operator, not the analyst

Most business intelligence tools are built for analysts who make dashboards. Lyte is built for operators who take action. The queue-based interface, the next-action display, the approval workflow — all optimized for "what do I do right now" not "what happened last month."

---

## Competitive Landscape (Honest Framing)

We do not compete directly with most of these — we address a gap they leave:

| Category | Example Players | What They Do | What They Miss |
|----------|----------------|-------------|----------------|
| BPM / Workflow automation | Camunda, Temporal, Zapier | Automate processes | No operational visibility layer; no AI advisory |
| Observability | Datadog, Grafana, Splunk | Monitor infrastructure | Not designed for operational decisions; no ownership or escalation |
| Project management | Jira, Asana, Linear | Track work items | Not operational; no AI; no real-time signal aggregation |
| AI agents / automation | Various | Auto-execute tasks | No human-in-the-loop by default; no traceable audit |
| SIEM / SOC platforms | Sentinel, Chronicle, CrowdStrike | Security events | Domain-specific; not generalizable to operations |
| ERP / ERP-adjacent | SAP, ServiceNow | Enterprise processes | Heavyweight, expensive, built for compliance not speed |

**The gap we fill:** A lightweight, AI-native operational command plane with built-in trust infrastructure that works across domains without requiring enterprise procurement cycles.

---

## Why We Stand Out in Investor Conversations

### 1. The platform bet has low marginal cost
Each expansion lane (Aegis, Terra, Vessels) reuses the same Alloy engine, same shared-ui, same audit infrastructure, same auth. Adding a new domain is a UI and domain-data problem, not an architecture problem. The marginal cost of expansion decreases as the platform matures.

### 2. The moat is not the AI model — it's the operational context
AI models are commoditizing. The competitive moat is the structured context: the operational entity schema, the evidence retrieval against a company's own operational data, the approval workflow that accumulates human decision history. That context is hard to replicate once established.

### 3. The trust architecture differentiates in regulated markets
Financial services, healthcare, legal, and defense all face AI governance requirements. Propose-only defaults, approval gates, and immutable audit trails are not restrictions — they are features in these markets. We built them by default, not by retrofit.

### 4. Honest positioning earns trust faster
We have removed every unsubstantiated claim from our materials. We label our data state, our stage, and our gaps. This is unusual. It signals that what we do claim is real. A smart investor or design partner who does diligence will find that our claims match our code.

---

## What We Are Not Claiming

- We are not claiming to replace ERP, SIEM, or existing workflow tools
- We are not claiming to automate operations (we assist and require human approval)
- We are not claiming production-scale revenue (design-partner stage, disclosed)
- We are not claiming our expansion lanes are products (they are prototypes, labeled as such)
- We are not claiming AI that "just works" — we claim AI with traceable evidence and human accountability

---

## The Wedge Story

**Why start with Lyte?**

Lyte targets the most universal operational pain: the gap between "a signal exists" and "someone takes a decision." This problem exists in every company with more than three teams. It doesn't require a specific industry or tech stack. It requires a company that cares about operational efficiency.

Starting here builds the operational context corpus, the approval workflow history, and the design-partner relationships. The expansion lanes (security, real estate, maritime) all share the same spine — they become available as additional configuration, not as new products to build from scratch.

The wedge is deliberate. The platform is the point.

---

## For Technical Reviewers

See [architecture-brief.md](architecture-brief.md) for:
- Full stack breakdown (React, Express, PostgreSQL, HuggingFace, Expo)
- Alloy decision schema structure
- Security controls (RBAC, JWT, CodeQL, append-only audit)
- Known gaps (honest: no E2E tests yet, retrieval not tenant-partitioned)

---

*See also: [architecture-brief.md](architecture-brief.md) · [demo-script.md](demo-script.md) · [investor-confidence-checklist.md](investor-confidence-checklist.md)*
