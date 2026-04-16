# Operator Demo Script — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Demo operator delivering to a domain operator (security analyst, ops manager, head of fleet, head of distressed deals, etc.)
**Length:** 45 minutes (35 min demo + 10 min Q&A)
**Companion docs:** [DEMO_STRATEGY.md](DEMO_STRATEGY.md) · [DOMAIN_PACK_CATALOG.md](DOMAIN_PACK_CATALOG.md) · [PROOF_OF_VALUE_PLAYBOOK.md](PROOF_OF_VALUE_PLAYBOOK.md)

---

## Audience Profile

The operator is the person who would use this platform daily. They are the user. They are skeptical of yet-another-tool. They want to know: how does my workflow change, and is it worth the change cost?

They will click. They will ask "what happens if I don't approve?" They will want to see the action queue from the inside.

---

## What This Demo Must Deliver

| Output | Definition |
|--------|-----------|
| Workflow clarity | The operator can describe how their daily work changes |
| Trust in the AI | They saw what the AI recommends and why; they understood when it asks for approval |
| Proof of governance | They saw the Proof Chain capture their actions |
| Personal upside | They left with one or two things they want to do differently next week |

---

## Pre-Demo Setup

The operator demo is **always domain-specific**. Pick the operator's primary domain (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo) and rehearse with that domain pack as the lead.

| Tab | URL | State |
|-----|-----|-------|
| Domain pack home | e.g. `/aegis` | Action queue + 5 demo signals queued |
| Lyte action queue | `/command` | Filtered to operator's domain |
| Proof Chain viewer | Linked | Pre-filtered to today |
| Approvals center | `/command/approvals` | 2 pending approvals visible |
| CORTEX (iPad) | Logged in as operator | On home tab |

---

## Script

### 0:00 — Empathy open (3 min)

Open with their pain, not with the platform.

> "Tell me about your week. How do you decide what to act on? Where does an AI tool already help? Where does a tool waste your time?"

Listen. Note the answers. The next 32 minutes will reference what they said.

### 3:00 — Their domain (5 min)

Open the operator's primary domain pack. Walk through:

- Where signals arrive
- The action queue, filtered to a typical day
- The agent recommendations, not yet acted on

Pause. Ask: "Does this look like the queue you would have at 9 AM on a Monday?"

### 8:00 — One signal, one decision (10 min)

Pick one signal and walk it from arrival to outcome.

1. **Signal arrives** — show the metadata. Source, time, correlation ID.
2. **Recommendation generated** — show the agent's reasoning. Walk through the provenance: model identity, sources cited, confidence score.
3. **Monte Carlo result** — show what the simulation produced. "Here is what happens if you approve. Here is what happens if you deny. Here are the variables that matter most."
4. **Covenant Policy** — show the policy result. "This action requires your approval. Here is who else can approve it. Here is what you would not be allowed to do at your role."
5. **Approve** — click approve. Show the action executing.
6. **Proof Chain** — show the chain. Walk through every entry.
7. **Outcome** — show the outcome being recorded.

> "This is your day. Every decision you care about runs this loop. Nothing happens without you. Nothing happens without a record."

### 18:00 — Show the override case (5 min)

Pick a recommendation. Override the AI. Walk the proof chain.

> "The AI is wrong sometimes. Here is what happens when you say no. The AI's confidence is recalibrated against your override. Your reasoning becomes part of the proof chain. Over time, the agent learns from your overrides — that is what the Outcome Graph is for. The platform respects your judgment."

### 23:00 — Mobile (5 min)

Pick up CORTEX. Show the same loop on mobile.

- An incoming approval arrives via push notification
- The operator can approve or escalate from the lock screen on iOS / notification shade on Android
- The full proof chain is visible on the device
- The operator can write a note on the approval

> "When you are on the road, in a meeting, or out of pocket, the loop does not stop. Approvals come to you. The Proof Chain captures who decided from where."

### 28:00 — The cross-domain moment (5 min)

If the operator works in a multi-domain organization, pivot to Command Portal.

> "Here is what changes when your organization adopts the platform across domains. Your sanctions screening team and your security team and your real estate team all see correlated signals. Same proof chain across all of them. Same policy framework. One place to ask 'what is my organization deciding right now.'"

If single-domain, skip this section and spend more time in their pack.

### 33:00 — Wrap (2 min)

> "Three things I want to leave you with. One — the loop is real, and it runs on every decision. Two — you stay in control, always. Three — your team gets a unified surface across your domains, with the same governance regardless of which domain.
>
> If we ran a 30-day proof of value on your team, what one decision would you most want this platform to handle?"

Note their answer. That is the proof-of-value scope ask.

---

## Q&A — Common Operator Questions

| Question | Crisp answer |
|----------|--------------|
| What if I don't trust the AI? | You don't have to. The AI is advisory. Approvals are enforced at the platform layer; the AI cannot execute consequential actions without you. |
| What if my team overrides everything? | That is fine. We track override rates per agent so you can see if the agent is calibrated for your workflow. |
| Will this slow me down? | The loop adds one step (the approval gate) on consequential actions. We measure operator time-to-decision in pilots; in early data, time is comparable to existing decisions and audit time drops sharply. |
| What about my existing tools? | We integrate as a signal source. Your SIEM, AIS feed, court records, etc. become events on our event fabric. We don't ask you to abandon anything. |
| What does my admin see? | Aggregate metrics — acceptance rates, override frequencies, achievement rates per agent. Not your individual decision rationale unless they have the appropriate role. |
| What about access? | The 11-role hierarchy is documented at [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md). Your role decides what you can do. |
| Mobile is real? | Yes. CORTEX is the mobile command surface — same loop, same governance. See for yourself. |

---

## What Not to Do in the Operator Demo

- Do not skip the override case — operators want to see what happens when they disagree with the AI
- Do not skip mobile — operators care about pager reality
- Do not promise integrations that are not in production
- Do not over-promise on AI accuracy; the platform's value is governance, not magic
- Do not let the demo turn into a feature tour; it should always be a workflow walk-through

---

## Post-Demo Actions

| Action | Owner | Due |
|--------|-------|-----|
| Send recording + operator playbook excerpt | Demo operator | Same business day |
| Note the proof-of-value scope ask | Demo operator | Same day |
| Schedule pilot scoping if requested | Founder + CSM | Within 3 business days |
| Add operator to the design partner pipeline if appropriate | CSM | Same day |

---

## Related Documents

| Document | Path |
|----------|------|
| Demo strategy | [DEMO_STRATEGY.md](DEMO_STRATEGY.md) |
| Executive demo | [EXECUTIVE_DEMO.md](EXECUTIVE_DEMO.md) |
| Technical demo | [TECHNICAL_DEMO.md](TECHNICAL_DEMO.md) |
| Demo environment checklist | [DEMO_ENVIRONMENT_CHECKLIST.md](DEMO_ENVIRONMENT_CHECKLIST.md) |
| Domain pack catalog | [DOMAIN_PACK_CATALOG.md](DOMAIN_PACK_CATALOG.md) |
| Proof of value playbook | [PROOF_OF_VALUE_PLAYBOOK.md](PROOF_OF_VALUE_PLAYBOOK.md) |
| Buyer personas | [BUYER_PERSONAS.md](BUYER_PERSONAS.md) |
