# SZL Holdings Dashboard: Demo Script

**Duration:** 5–7 minutes  
**Persona:** Founder / CEO or Investor  
**URL:** `/`  
**Pre-requisite:** Signed into platform

---

## Pre-Demo Checklist

- [ ] Landing page loads with live feed tickers (World Bank, BLS)
- [ ] Status page (`/status`) shows all services in healthy state
- [ ] Forge agent registry shows at least 3 registered agents
- [ ] Alloy workspace accessible

---

## Step 1 — Landing Page (2 min)

**URL:** `/`

> "SZL Holdings is the governed infrastructure layer for high-consequence decisions. Every subsidiary — maritime, real estate, defense, consulting — runs on the same signal-to-decision loop."

Point to the product scroll (Lyte · Aegis · Vessels · Terra · PRISM · Carlota Jo).

> "Each of those is a live domain pack. Every decision made anywhere in the portfolio is captured, attributed, and traceable."

Click **PARENT COMPANY** and **SANDBOX** tabs.

> "The parent company view is the investor and board surface — portfolio summary, key signals, governance posture. The sandbox view exposes the raw platform APIs for developer and partner integration."

---

## Step 2 — Platform Status (1 min)

**URL:** `/status`

> "This is the production status page — live health probes against every service: API, database, auth, AI layer, integrations."

Point to the service health indicators (all green in a healthy state).

> "This is not a static 'uptime' page. It probes live endpoints every 60 seconds. When a service degrades, this updates before a user reports it."

---

## Step 3 — Forge — Agent Registry (1 min)

**URL:** `/forge`

> "The Forge is where AI agents are registered, versioned, and governed. Every agent in the platform has an identity, a tool manifest, a policy tier, and an audit trail."

Click on an agent.

> "This agent is registered at Policy Tier 2 — it can act autonomously within a defined scope but requires approval for any action outside that scope. The Guardian engine enforces this at runtime."

---

## Step 4 — Alloy — Execution Fabric (1 min)

**URL:** `/alloy`

> "Alloy is the execution fabric — the layer where AI agents are orchestrated into governed workflows. Every workflow is a DAG: deterministic steps, attribution at every node, rollback on failure."

Point to an active workflow.

> "This workflow was triggered by a signal from Lyte — a stalled negotiation. Alloy composed a response: draft a follow-up, get approval, send via the CRM connector. The human was in the loop at step 2 and stepped out at step 3."

---

## Avoidance Guide

- Developer API page: some documented API samples reference stub routes — do not live-test them in demo
- Investor data room requires auth session; MFA not yet enforced — note as roadmap item
- HC-001: Autopilot genome score is illustrative — frame as "the platform's self-assessment of its own operational health"

---

## Questions to Anticipate

**"Is this profitable?"**  
> "The billing infrastructure is built and running in test mode. Live billing activates when we onboard the first paying tenant — the switch is a secrets configuration, not a code change."

**"How many tenants are on the platform?"**  
> "We're in the design-partner phase — three partners are integrated, running on the platform, giving structured feedback. Commercial launch is tied to the Series A close."
