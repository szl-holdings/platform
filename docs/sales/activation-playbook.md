# Activation Playbook — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Customer success, founder, product

---

## Purpose

This playbook defines the tactics for moving new tenants from signup through activation — the moment when a customer has experienced enough platform value that renewal becomes the expected outcome. It covers the activation signals, intervention triggers, and escalation paths for the design partner and early commercial phase.

---

## Activation Definition

**Activated** = A tenant has completed all of the following within 30 days of signup:

1. Org profile complete (name, industry, timezone)
2. At least one team member invited
3. At least one signal source connected (or demo mode selected)
4. At least one workflow deployed via Alloy
5. At least one action approved or triaged with a Proof Chain entry created
6. Dashboard visited on at least 3 separate days

**Why this definition:** These six events correspond to the full governed decision loop. A tenant that has walked the complete loop has experienced the structural differentiation of the platform — not just clicked around the UI.

---

## Activation Funnel

```
Signup
  │
  ▼ (target: 100%)
Wizard started
  │
  ▼ (target: 80%)
Wizard completed (org + team + signal + workflow)
  │
  ▼ (target: 70%)
First action in queue
  │
  ▼ (target: 60%)
First action triaged / approved
  │
  ▼ (target: 50%)
Proof Chain entry created
  │
  ▼ (target: 40%)
Day-30 activated (all 6 criteria met)
```

---

## Activation Signals

### Green — On Track

| Signal | Timing | Action |
|--------|--------|--------|
| Wizard completed | Day 0 | Auto-send "welcome" email with next steps |
| Signal source connected | Day 0–3 | No action needed |
| First workflow deployed | Day 0–3 | No action needed |
| Day-3 login | Day 3 | No action needed — healthy engagement |
| First domain pack enabled | Any time | Auto-send domain pack setup guide |

### Amber — At Risk

| Signal | Timing | Action |
|--------|--------|--------|
| Wizard started but not completed | Day 1 | Auto-send "finish setup" email with direct link to wizard |
| No login after signup | Day 3 | Founder/CS sends personal check-in |
| No signal source connected | Day 5 | Auto-send integration guide for their vertical |
| No workflow deployed | Day 7 | Offer a 30-minute setup call |
| Action queue untouched | Day 10 | Send "quick win" email featuring a template workflow |

### Red — Disengaged

| Signal | Timing | Action |
|--------|--------|--------|
| No login for 14 days | Day 14 | Personal email from Stephen (design partner phase) |
| No action ever created | Day 21 | Schedule intervention call — offer to run first demo workflow together |
| No login for 30 days | Day 30 | Assess fit — close gracefully or escalate to founder |

---

## Activation Interventions

### Intervention 1: The Setup Call (Day 7, if amber)

**Trigger:** Wizard not completed or no workflow deployed after 7 days.

**Format:** 30-minute video call with CS / founder.

**Agenda:**
1. Understand their workflow and pain (10 min)
2. Configure signal source together (10 min)
3. Deploy first workflow (5 min)
4. Walk the governed decision loop (5 min)

**Goal:** Get to Proof Chain entry created before the call ends.

---

### Intervention 2: The Quick Win Email (Day 10, if amber)

**Trigger:** Action queue untouched.

**Content:**
- Subject: "Your first governed decision — 5 minutes"
- Body: Step-by-step walkthrough using their deployed workflow
- CTA: "Review your first pending action" → deep link to action queue
- No sales language — pure value

---

### Intervention 3: The Founder Touch (Day 14, if red)

**Trigger:** No login for 14 days.

**Format:** Personal email from Stephen.

**Content:**
- Acknowledge the gap without pressure
- Share one specific insight about their use case (based on their vertical selection)
- Offer: "Let me run the first session with you" — 45-minute hands-on call
- No automated follow-up on this one — fully manual

---

### Intervention 4: The Domain Pack Upsell (Post-activation)

**Trigger:** Tenant has activated (all 6 criteria met) and has visited the same domain pack page 3+ times.

**Format:** In-app banner + email.

**Content:**
- "You've been exploring [domain pack]. Ready to activate it?"
- Direct link to billing → pack activation
- Show what the pack adds to their existing workflow

---

## Email Sequences

### Sequence 1: Onboarding (Days 0–7)

| Day | Email | Trigger |
|-----|-------|---------|
| 0 (immediate) | Welcome + wizard link | Signup complete |
| 0 (after wizard) | "You're set up" + quick win | Wizard completed |
| 1 | "Your first governed decision" | Wizard NOT completed |
| 3 | "Tip: Connect your data" | No signal source |
| 7 | "Ready to talk?" (setup call offer) | No workflow |

### Sequence 2: Activation (Days 7–30)

| Day | Email | Trigger |
|-----|-------|---------|
| 10 | "Quick win: Your first approval" | No action triaged |
| 14 | "Still there?" (founder touch) | No login since signup |
| 21 | "Let's run your first demo together" | No Proof Chain entry |
| 30 | Activation summary / next steps | All 6 criteria met |

### Sequence 3: Expansion (Post-activation)

| Trigger | Email |
|---------|-------|
| Day 30 activated | "Expand your intelligence" — domain pack overview |
| 3 visits to domain pack page | "Ready to activate [pack]?" |
| Team growing (3+ members) | "Add more seats" — plan upgrade prompt |
| Approaching usage limit | "You're approaching your [limit]" — upgrade CTA |

---

## Design Partner Track (Alpha Phase)

During the design partner / alpha phase, the above sequences are supplemented with:

1. **Dedicated Slack channel** per design partner
2. **Weekly check-in** (30 min) with Stephen
3. **Feature request tracking** — every request logged in internal backlog
4. **Monthly review** — usage data + qualitative feedback
5. **Co-development access** — design partners get early access to features in return for feedback

Design partner activation is considered successful when the partner has used the platform for a real operational decision (not just a demo) and can articulate the ROI in a reference call.

---

## Activation by Vertical

### Lyte (Business Operations)

- **First meaningful outcome:** Approved a pending operational action with Proof Chain entry
- **Key activation moment:** First time they see approval latency statistics — the moment they realize the platform is measuring their decision-making speed

### Aegis (Security)

- **First meaningful outcome:** Triaged an incident with a SOAR playbook executed and audit trail created
- **Key activation moment:** First MITRE ATT&CK correlation — they see the platform make a connection their analysts hadn't

### Vessels (Maritime)

- **First meaningful outcome:** First dark vessel alert reviewed and responded to through the exception center
- **Key activation moment:** Voyage P&L simulation — they see a financial impact number attached to a routing decision

### Terra (Real Estate)

- **First meaningful outcome:** First distressed property added to deal pipeline with ownership graph explored
- **Key activation moment:** Ownership entity graph — they see connections across entities their manual research missed

---

## Reporting

Activation metrics are tracked in the internal admin dashboard (`/admin/metrics`) and reviewed weekly:

| Metric | Owner | Frequency |
|--------|-------|-----------|
| Signup to wizard completion | Product | Weekly |
| Wizard to first action | Product | Weekly |
| Time to first Proof Chain entry | Product | Weekly |
| Day-30 activation rate | CS | Monthly |
| Design partner activation | Founder | Weekly |

---

## Related Documents

| Document | Path |
|----------|------|
| Onboarding strategy | `ONBOARDING_STRATEGY.md` |
| First 10 minutes | `FIRST_10_MINUTES.md` |
| Support model | `SUPPORT_MODEL.md` |
| Product surfaces | `PRODUCT-SURFACES.md` |
