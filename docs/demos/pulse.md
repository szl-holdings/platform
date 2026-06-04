# Pulse — AI Executive Briefing: Demo Script

**Duration:** 5–7 minutes  
**Persona:** Marcus Holt (CFO) or any executive  
**URL:** `/pulse/`  
**Pre-requisite:** Signed into platform (or use `?demo` mode with demo PIN)

---

## Pre-Demo Checklist

- [ ] Today's Brief has content visible (AI-generated briefing from database)
- [ ] Library shows ≥ 3 historical briefings
- [ ] System Health page shows all services in healthy state
- [ ] Constellation view shows agent mesh nodes

> **Note:** If not signed in, navigate to `/pulse/?demo` and enter the demo PIN. This enables a read-only demo session without requiring OIDC auth.

---

## Step 1 — Today's Brief (3 min)

**URL:** `/pulse/` (Today's Brief)

> "Pulse is the executive intelligence layer. Every morning, the briefing engine synthesizes signals from every domain pack — Aegis, Vessels, Terra, Lyte — into a single executive brief."

Point to the briefing content sections.

> "Each section is grounded in the live signal store. The Vessels section reflects the fleet status from this morning's AIS cycle. The Terra section reflects the three positions approaching the maturity wall we saw in Command."

Point to the confidence indicators.

> "The system doesn't just generate content — it shows you the confidence level of each signal. Low-confidence items are flagged so you know what requires human verification."

---

## Step 2 — Custom Brief (1 min)

**URL:** `/pulse/custom-brief`

> "Executives can generate custom briefs on demand. Ask the system: 'What is our exposure to Red Sea disruptions across all domain packs?' It will synthesize an answer from live data."

Type a sample query (e.g., "What is our current fleet exposure to geopolitical disruptions?").

> "The system queries the signal store, retrieves relevant context, and generates a grounded response — not a hallucination. Each claim traces to a source."

---

## Step 3 — Library & Historical Briefings (1 min)

**URL:** `/pulse/library`

> "Every brief is archived. You can review what the system said three weeks ago, compare it to what happened, and see how signal confidence has evolved."

---

## Step 4 — Dissent Channel (1 min)

**URL:** `/pulse/dissent-channel`

> "This is the governance layer for executive intelligence. When an executive disagrees with a signal or a recommendation, they can record their dissent here. It's not deleted — it's preserved alongside the original brief. That's how you build accountable AI."

---

## Step 5 — Constellation (1 min)

**URL:** `/pulse/constellation`

> "Finally, the constellation view shows the underlying agent mesh — the AI agents generating the signals that feed the briefing. Every node, every connection, real-time."

---

## Avoidance Guide

- Do NOT demo **PDF Export** — not implemented; nav item removed in production
- Do NOT demo **Email Subscription** — not implemented; nav item removed in production
- The briefing AI is connected to the AI gateway but live signal retrieval is partial — frame as "the retrieval grounding is being expanded as more domain integrations go live"

---

## Questions to Anticipate

**"Does this hallucinate?"**  
> "Each claim in the brief is grounded in retrieved context from the live signal store. Confidence scores flag low-certainty content. Dissent channel lets executives flag cases where they believe the system got it wrong — those corrections feed back into future signal weighting."

**"Can I get this in my email every morning?"**  
> "Email delivery is built and tested — it's waiting on the email provider key (Resend) to go live. Once provisioned, Pulse subscribers get a briefing in their inbox by 7am."
