# Integration Expansion Model

**Owner:** Stephen Lutar · **Audience:** Founder, GTM, partnerships, technical buyers

Integrations are the second land-and-expand vector after the operator demo. The first integration a buyer ships is also the first time the loop touches their real system of record — which is the moment "governed decisioning" stops being a slide and starts being infrastructure.

This document defines the integration tiers, the canonical expansion path, and the commercial implication of each tier.

## The four tiers

### Tier 0 — Read-only signal ingest
- **What it is:** We pull data from a buyer system (CRM, ERP, ticketing, monitoring) and surface it as signals.
- **Time to value:** Hours. No buyer engineering required.
- **Examples:** Salesforce opportunity changes, Jira issue ageing, monitoring alerts, Slack message metadata.
- **Commercial:** Included in pilot. This is the wedge — it makes the product useful before the buyer commits to anything.
- **Governance posture:** Provenance pill on every signal carrying the source system. Read-only — no risk of mutation.

### Tier 1 — Signal + write-back of decisions/receipts
- **What it is:** We push decision receipts back into the source system (e.g. a Salesforce opportunity field, a Jira comment, a Slack thread).
- **Time to value:** Days. Buyer engineering: low — we provide the integration, they enable the field.
- **Commercial:** Activates in the first 30 days of pilot. The first time a sales-ops leader sees a recommendation receipt show up *in their CRM*, the deal is effectively won.
- **Governance posture:** Write-back carries the decision ID; the receipt is queryable from both sides.

### Tier 2 — Action execution into buyer systems
- **What it is:** We execute actions in buyer systems with policy gating (create a ticket, update a field, kick off a workflow, send a notification).
- **Time to value:** 2–4 weeks. Buyer engineering: medium — connectors must be approved through their security review.
- **Commercial:** First production-tier expansion. Pricing moves from pilot to subscription at this point.
- **Governance posture:** Every action is policy-gated; every execution writes an audit row with the buyer system as the target resource.

### Tier 3 — Bidirectional event-driven loop
- **What it is:** Buyer events trigger our loop in real time; our loop emits events back into their pub-sub or webhook infrastructure.
- **Time to value:** 4–8 weeks. Buyer engineering: high — requires their event infrastructure (Kafka, EventBridge, native webhooks).
- **Commercial:** Strategic — this is where the buyer commits to us as part of their core operating fabric. Multi-year contracts, executive sponsorship.
- **Governance posture:** See `event-and-webhook-roadmap.md` for the contract design. Provenance and receipts must carry across event boundaries without loss.

## The canonical expansion path

```
Tier 0 (pilot) → Tier 1 (30 days) → Tier 2 (90 days) → Tier 3 (12 months+)
```

A buyer who reaches Tier 2 within 90 days has crossed the threshold from "evaluating" to "operating with us." A buyer who reaches Tier 3 has, by definition, made a category-level commitment — they are no longer comparing us to other vendors; they are integrating us into their architecture.

## The first three integrations to harden

These are the integrations that will pay back fastest and that we should harden as **canonical** in the technical buyer brief:

1. **Salesforce** (Tier 0 → 1 → 2). Every operator buyer has it; every receipt should land in it.
2. **Slack** (Tier 0 → 2). Notifications, approvals, and audit pings without leaving the buyer's collaboration surface.
3. **Jira / Linear** (Tier 0 → 2). Action queue mirroring; the place where work actually happens.

A Salesforce + Slack + Jira buyer who has all three at Tier 2 inside 90 days is a reference customer.

## What expansion is not

- It is not "add more dashboards." Expansion happens when our loop touches more of the buyer's real systems — not when we render more charts.
- It is not "more users." Seat expansion is incidental; it is the integration depth that drives renewal.
- It is not "platform plays." We do not need to be a platform. We need to be the **decision layer** that sits cleanly above whatever platform they already have.

## The commercial implication

Pricing should follow tier, not seats:

- **Tier 0:** Included with pilot.
- **Tier 1:** Included with the base subscription.
- **Tier 2:** Per integration, with volume tiers on action throughput.
- **Tier 3:** Strategic agreement, multi-year, with named technical account management.

This pricing structure reinforces the trust narrative: the more of the buyer's loop we govern, the more we charge — but every dollar is tied to a measurable governance surface, not a vanity metric.

## Companion docs

- `technical-buyer-integration-brief.md` — the document we hand to the buyer's engineering lead.
- `event-and-webhook-roadmap.md` — the Tier 3 design.
- `pilot-vs-production-commercial-model.md` — pricing detail.
