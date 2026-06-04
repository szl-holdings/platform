# Demo Runbook
**Phase:** 7  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Pre-Demo Setup (5 minutes before)

1. Open `/command/demo` in a fresh browser tab (Chrome incognito recommended)
2. Sign in as `demo-ceo@szl.demo` (or the persona matching your audience)
3. Click **Reset Demo** — wait for confirmation (~8 seconds)
4. Verify the Vantex Acquisition scenario is showing
5. Select your audience persona from the switcher
6. Choose your time track (10 / 20 / 45 minutes)

---

## 10-Minute Track (Investor Quick Demo)

| Stop | What to Show | Time |
|---|---|---|
| 1. Platform Overview | `/command/overview` — signal volume, governance posture, active domains | 1 min |
| 2. Decision Twin | `/lyte/decision-twin` — show Vantex approval simulation (approve vs delay) | 3 min |
| 3. Policy Compiler | `/command/operations/alloy/policy-compiler` — plain English → structured policy | 2 min |
| 4. Evidence Chain | `/lyte/evidence-explorer` — trace any decision to its proof chain | 2 min |
| 5. Governance Guard | Show human approval gate trigger; HITL in action | 1 min |
| 6. Cross-Domain | Briefly flash Aegis adversary narrative + Vessels voyage risk | 1 min |

**Key message:** Governed autonomy. Every decision traceable. Every action policy-gated.

---

## 20-Minute Track (Design Partner Demo)

Adds to the 10-minute track:

| Stop | What to Show | Time |
|---|---|---|
| 7. Signals Console | `/lyte/signals` — 47 live signals, priority sorting | 2 min |
| 8. Alloy Workflow | Build or trigger a workflow in Command | 2 min |
| 9. Domain Deep-Dive | Pick one: Aegis adversary narrative OR Vessels voyage risk twin | 3 min |
| 10. Why This Property Now | `/terra/why-this-property-now` — ranked thesis engine | 3 min |

**Key message:** Works across every domain. One platform. Six primitives.

---

## 45-Minute Track (Technical Diligence)

Adds to the 20-minute track:

| Stop | What to Show | Time |
|---|---|---|
| 11. Full 9-Step Loop | Walk Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning | 10 min |
| 12. Eval Studio | `/lyte/eval-studio` — how the platform evaluates its own agents | 5 min |
| 13. Architecture | Show proof chain immutability; tenant isolation; correlation IDs in logs | 5 min |
| 14. Persona Tour | Switch through Investor / CEO / COO / CISO / Analyst views | 5 min |

---

## Handling Common Demo Objections

| Objection | Response |
|---|---|
| "Is this real data?" | "The Vantex scenario is a seeded demo. Sanctions screening and threat feeds pull from live government sources — OFAC, EU, UN." |
| "Where's the AI?" | "AI generates recommendations; policy engine validates them; humans approve. Show the proof chain entry for the last AI-generated recommendation." |
| "Can I see a real customer?" | "We're in design-partner phase. Happy to connect you with our design partner cohort after NDA." |
| "What's the pricing?" | "Per-domain-pack SaaS. Pricing deck available. Let's talk about which packs match your use case." |
| "Vessels AIS says Demo" | "Live AIS requires a MarineTraffic API key provisioned per environment. The sanctions screening on the same page is live against OFAC/EU/UN." |

---

## Demo Reset During Presentation

If something looks wrong or data has been modified during the demo:

1. Click **Reset Demo** on the Demo Launchpad (top right of `/command/demo`)
2. Wait ~8 seconds
3. Confirm with the audience: "I'm resetting to the canonical scenario — watch how fast the platform restores its state."

This also makes a good demonstration of the platform's idempotent seed capability.

---

## Emergency Fallback

If live platform has issues:

1. Open the demo video at `/szl-demo-video/` — pre-recorded walkthrough of all six signature innovations
2. Continue narrative verbally while video plays
3. Note: "We're showing a recording to preserve time — happy to do a live walkthrough in a follow-up session."
