# Executive Demo Script — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Demo operator delivering to C-suite, board members, or investors
**Length:** 20 minutes (15 min demo + 5 min Q&A)
**Companion docs:** [DEMO_STRATEGY.md](demo-strategy.md) · [SALES_NARRATIVE.md](sales-narrative.md) · [BUYER_PERSONAS.md](buyer-personas.md)

---

## Audience Profile

The executive buyer is rarely the daily operator. They are evaluating whether this category — governed decision infrastructure — is real, whether SZL is a credible builder of it, and whether the commercial relationship is worth pursuing.

They will not click. They will not type. They will judge whether the thing on screen feels structural or cosmetic.

---

## What This Demo Must Deliver

| Output | Definition |
|--------|-----------|
| Category clarity | They can say "governed decision infrastructure" and mean something specific |
| Loop conviction | They saw the 9-step loop run end-to-end, in real time |
| Domain proof | They saw at least two domains share the same primitives |
| Commercial ask | They know what an evaluation costs, looks like, and produces |

---

## Pre-Demo Setup (T–5 minutes)

| Tab | URL | State |
|-----|-----|-------|
| Lyte action queue | `/command` | Two pending recommendations visible |
| Aegis incident view | `/aegis/incidents/[demo-incident-id]` | Mid-investigation |
| Proof Chain viewer | Linked from Aegis incident | Pre-filtered to today |
| Covenant Policy decision view | Linked from action queue | Showing one `escalate` decision |
| CORTEX mobile (iPad) | Logged in as same operator | On approvals tab |

Pre-warm AI agents. Confirm Aegis demo signal queued. Confirm CORTEX push notifications enabled.

---

## Script

### 0:00 — Open with category framing (90 seconds)

> "Most enterprise software answers two questions: *what happened* and *what should I do*. Dashboards answer the first. AI copilots try to answer the second. Neither answers the question that actually matters in regulated industries: *who decided, based on what, and can we prove it.*
>
> SZL Holdings builds the layer that answers that question — the governance infrastructure between signal detection and action execution. We call it governed decision infrastructure. Today I'll show you the same governed loop running across two different domains, on the same platform."

### 1:30 — The signal arrives (90 seconds)

Switch to Aegis incident view.

> "This is a real signal that arrived from a threat intel feed. It triggered an event on our platform's event fabric — the cross-domain signal layer. Notice the metadata: source, timestamp, correlation ID, tenant scope. This is not a screenshot. This is structured data that other domains can subscribe to."

Show the event in the Prism Bus log if visible. Otherwise reference it.

### 3:00 — The recommendation (3 minutes)

Switch to Lyte action queue.

> "An AI agent — Sentinel, our threat triage agent — analyzed the signal and recommended an action. But notice what is on screen: it is not just a recommendation. There are four things attached.
>
> One: provenance. The model identity, the source citations, and the confidence score.
>
> Two: a Monte Carlo simulation. Sentinel ran 10,000 trials of what happens if we contain this host versus monitor it. Here is the expected loss distribution and the variables that matter most.
>
> Three: the Covenant Policy result. This action class requires approval from a security operator before execution. The policy is enforced at the platform layer — the AI cannot bypass it.
>
> Four: an approval gate, with the role authorized to approve."

### 6:00 — The decision (2 minutes)

Approve the recommendation in the UI.

> "I approve. Watch what happens. The action executes through Alloy, our workflow engine. The Proof Chain records every step — the signal that triggered it, the agent that recommended it, the simulation evidence, the policy decision, my approval, and the execution outcome.
>
> Let me show you that proof chain."

Click into the Proof Chain viewer. Walk through the chain.

### 8:00 — The mobile loop (2 minutes)

Pick up the CORTEX iPad. Show the same approval as a push notification, then show another approval pending on mobile.

> "The same loop runs on mobile. Operators don't have to be at a desk to participate in governed decisions. They get a push notification, they review the same provenance, they approve or deny, and the proof chain captures it."

Approve a second recommendation on mobile. Show it appearing in the Lyte action queue on the desktop.

### 10:00 — Cross-domain (3 minutes)

Switch to Command Portal. Show the cross-domain dashboard.

> "Now here is what makes this structurally different from a SOC platform or a maritime tool or a real estate tool. The same six primitives — event fabric, outcome graph, proof chain, covenant policy, monte carlo, workflow engine — run across every domain.
>
> Here is a Vessels recommendation: a sanctions screen on a vessel approaching a US port. Same loop. Same proof chain. Different domain.
>
> Here is a Terra recommendation: a distressed property crossing our pursue threshold. Same loop. Same proof chain. Different domain.
>
> When you buy SZL, you are not buying a security tool, a maritime tool, or a real estate tool. You are buying the governance infrastructure that runs across all of them."

### 13:00 — Outcome Graph (90 seconds)

Show the agent performance dashboard.

> "And because every recommendation is tracked from agent to decision to outcome, we can show you the things that matter for governance: agent acceptance rates, override frequencies, achievement rates. The platform learns from its own decisions."

### 14:30 — Trust Center handoff (30 seconds)

Open the Trust Center URL.

> "Everything I've just shown is documented at our Trust Center. The architecture, the access control matrix, the tenancy model, the incident response process, the known gaps. Your CISO and CFO will both find what they need."

### 15:00 — The ask

> "Three ways forward. One — we send you our diligence packet and you review with your team. Two — we scope a 90-day proof-of-value with a defined success metric. Three — we invite you into the design partner program: discounted year one in exchange for case study and structured feedback. What feels right?"

---

## Q&A — Likely Questions and Crisp Answers

| Question | Crisp answer |
|----------|--------------|
| Is this a SOC platform? | No. Aegis is a domain pack on the platform. We are the governance layer all packs share. |
| How is this different from Palantir? | We are operator-tier, not nation-state-tier. The loop is the same; the consumption model and price point are different. |
| Who runs the AI? | Multi-provider stack — OpenAI, Anthropic, Gemini. Customers can supply their own at Enterprise. |
| Is the data isolated? | Tenant data is scoped at the query layer through `org_id`. Bypass requires `super_admin` role with audit logging. See [TENANCY-MODEL.md](../architecture/tenancy-model.md). |
| What if the AI is wrong? | The AI cannot execute consequential actions without a human approval that is enforced at the platform layer. Wrong recommendations are dismissed; their override ratio is tracked. |
| Are you SOC 2 certified? | We are aligned to SOC 2 controls. Certification is on the post-revenue roadmap. The Trust Center documents the current posture honestly. |
| What does a deployment look like? | Pilot tier on production for the first 90 days, then convert to Standard or Enterprise. See [TENANT_TIERS.md](../product/tenant-tiers.md). |

---

## What Not to Do in the Executive Demo

- Do not click into more than three clicks of detail on any feature
- Do not show source code or a terminal
- Do not name competitors
- Do not promise features that are not in production
- Do not skip the proof chain — that is the whole demo
- Do not improvise governance claims; if asked, point to the Trust Center

---

## Post-Demo Actions

| Action | Owner | Due |
|--------|-------|-----|
| Send recording + diligence packet | Demo operator | Same business day |
| Note the ask outcome in CRM | Demo operator | Same day |
| Schedule follow-up if requested | Demo operator | Within 24 hours |
| Trigger Proof of Value scoping if requested | Founder | Within 3 business days |

---

## Related Documents

| Document | Path |
|----------|------|
| Demo strategy | [DEMO_STRATEGY.md](demo-strategy.md) |
| Operator demo | [OPERATOR_DEMO.md](operator-demo.md) |
| Technical demo | [TECHNICAL_DEMO.md](technical-demo.md) |
| Demo environment checklist | [DEMO_ENVIRONMENT_CHECKLIST.md](demo-environment-checklist.md) |
| Sales narrative | [SALES_NARRATIVE.md](sales-narrative.md) |
| Objection handling | [OBJECTION_HANDLING.md](objection-handling.md) |
| Buyer personas | [BUYER_PERSONAS.md](buyer-personas.md) |
| Proof and policy model | [PROOF_AND_POLICY_MODEL.md](../architecture/proof-and-policy-model.md) |
| Decision simulation | [DECISION_SIMULATION.md](../architecture/decision-simulation.md) |
| Trust Center | [TRUST_CENTER_INDEX.md](../security/trust-center-index.md) |

---

## Trust & Provenance Walkthrough (Executive Track)

When executives ask *"How do I know the AI is right?"* or *"What happens if policy blocks something critical?"*, drive this sequence:

1. **Open `/trust-provenance`** in Aegis (or Terra / Vessels for domain-specific flows).
2. **Tab 1 — Proof Chains:** every AI-generated item shows source class, model/provider/version, confidence score, reviewer state, and export-safety state. Call out that blocked content cannot be exported.
3. **Tab 2 — Policy Results:** show an Allow, a Deny (with matched rule + "what needs to change"), and an Escalate. Click *Appeal* on a Deny to record a justification — this POSTs (CSRF-protected, authenticated) to `/api/audit-log/policy-appeal`, which emits a structured `policy.appeal.recorded` log entry tying the action to the signed-in actor, role, org, and correlation id.
4. **Tab 3 — Audit Trail:** filter to `human_override` to show that reviewer overrides in the approvals workflow are permanent, hashed, and actor-attributed.
5. **Tab 4 — Decision Cockpit:** pick one scenario (Best / Base / Worst), show sensitivity drivers and cost-of-waiting, then switch to *Predicted vs Actual* to prove calibration over time.

The core talking point: **nothing ships without a named human owner, and every override is a record, not a conversation.**
