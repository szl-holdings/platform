# Sales Narrative — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, AEs, marketing, partners, anyone who tells the SZL story
**Companion docs:** [CATEGORY_POSITIONING.md](category-positioning.md) · [BUYER_PERSONAS.md](buyer-personas.md) · [OBJECTION_HANDLING.md](objection-handling.md)

---

## The Five-Sentence Narrative

This is the canonical version. Memorize it. Vary the words; do not vary the structure.

> 1. **The problem.** Operators in regulated industries make consequential decisions every day, but no system records who decided, on what evidence, with what expected outcome.
> 2. **The gap.** Dashboards show what happened. AI copilots recommend what to do next. Neither answers the question that matters: was the decision governed.
> 3. **The category.** SZL Holdings builds governed decision infrastructure — the structural layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential decision.
> 4. **The proof.** Six platform primitives — Event Fabric, Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine — run a single canonical loop across every domain pack. Same governance, every domain.
> 5. **The ask.** We are running a small design partner program. Operators who want to be in the first cohort can co-design the platform on their decisions, in exchange for case study and reference rights.

---

## The 30-Second Version

> "Most enterprise software answers what happened or what to do next. Neither answers who decided, on what evidence, with what expected outcome. SZL Holdings builds the governance layer for that — six primitives, one decision loop, every domain pack. We're in design partner mode now. If you have one decision type that has to be auditable and faster, we should talk."

---

## The 5-Minute Version

### Open with the problem (1 minute)

"Take any consequential decision your team made last month. A security incident. A sanctions screen. A deal pursue-or-walk. A matter intake.

Now answer: who decided? On what evidence? Against which policy? With what simulated outcome? When was the human approval recorded? What was the actual outcome?

For most teams, the honest answer is: we have parts of that in Slack threads, parts in our SIEM, parts in spreadsheets, parts in nobody's head. There is no system that ties it all together with audit-grade attribution.

That gap is the whole reason we exist."

### Frame the category (1 minute)

"There are two adjacent categories that try to solve pieces. Dashboards — Datadog, Splunk, Grafana — answer 'what happened.' AI copilots — Microsoft Copilot, ChatGPT, vertical agents — answer 'what should I do.' Neither answers 'was the decision governed.'

We build the third category. Governed decision infrastructure. The structural layer between signal detection and action execution that enforces governance, attribution, and outcome tracking on every consequential decision."

### Walk the loop (2 minutes)

"Every decision on our platform follows the same nine steps. Signal arrives on the Event Fabric. Cross-domain context is enriched. An AI agent generates a recommendation, captured in the Outcome Graph. A Monte Carlo simulation models possible outcomes. The Covenant Policy engine enforces approval requirements. A human approves or denies. The Workflow Engine executes. The Proof Chain records every step. The actual outcome is recorded. The Outcome Graph feeds back into agent calibration.

The same nine steps run for a security incident in Aegis, a sanctions screen in Vessels, a distressed property in Terra, a matter in PRISM Counsel, an advisory engagement in Carlota Jo. Same primitives. Same loop. Different domain."

### Close with the proof (1 minute)

"Six things you can verify. Open the Trust Center — every architectural claim is documented. Open the Access Control Matrix — every role and route mapped. Open the Known Gaps — yes, we publish what's missing. Open the Proof Chain on a live demo — see your own approval recorded. Open the Outcome Graph dashboard — see acceptance and override rates.

We are running a small design partner cohort. Six slots across three domains. If your operator champion has one decision type that has to be auditable and faster, we should scope a 90-day proof of value."

---

## Narrative Building Blocks

These are the components — pull and reorder for any audience or length.

### The problem statement

Every consequential decision in regulated operations needs to answer four questions: *who decided, on what evidence, against what policy, with what outcome*. Most organizations cannot answer all four for any given decision. The gap grows as AI adoption increases.

### The category claim

Governed decision infrastructure is the structural layer between signal detection and action execution. It is not a dashboard. It is not an AI copilot. It is the governance layer all of those have lacked.

### The architectural proof

Six primitives, defined and live: Event Fabric (Prism Bus), Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine. They are libraries; they are runtime; they are visible in every domain pack.

### The domain proof

Five domain packs running the same primitives: Aegis (defense / intel), Vessels (maritime), Terra (real estate), PRISM Counsel (legal), Carlota Jo (advisory). One platform, five vocabularies.

### The governance proof

Every AI recommendation carries provenance, citations, and confidence. Every consequential action requires an approval gate enforced at the platform layer. The audit trail is append-only and exportable. Tenant isolation is enforced at the query layer through `org_id`; bypass requires an attributed override.

### The honesty proof

We publish a Known Gaps document. We publish the Trust Center. We publish the Access Control Matrix. We do not claim certifications we do not hold. Buyers can verify our claims on their own.

### The commercial proof

Pricing is published. Editions are documented. Design partner program has six named slots. We say yes or no within 14 days of evaluation. We say no when we are not the right fit.

### The team proof

Founder-led. Operators in the loop. Senior engineering. We ship; the artifact is the proof. Every claim in this narrative is backed by something a buyer can open and read.

---

## Audience-Specific Cuts

### To an executive (CEO, COO, board member, investor)

Lead with the **category claim** + **architectural proof** + **commercial proof**. Do not show the loop in detail unless asked. Close with the strategic significance: "Three years from now, governed decision infrastructure will be a budget line. We are defining the category."

### To an operator (head of SOC, head of fleet, head of deals)

Lead with the **problem statement** in their words + **domain proof** + **the loop** in their domain. Close with PoV ask: "What's one decision your team would want governed first?"

### To a technical buyer (CISO, head of platform, head of compliance)

Lead with the **architectural proof** + **governance proof** + **honesty proof**. Walk the Trust Center. Hand over the diligence packet. Close with: "Read the Known Gaps and tell me where we have to be honest."

### To an investor

Lead with the **category claim** + **team proof** + **architectural proof** + **commercial proof**. Cover the design partner motion. Skip the loop unless asked. Close with the moat — see [MOAT_MAP.md](../investor/moat-map.md).

### To a partner (advisory firm, integrator)

Lead with the **category claim** + **domain proof**. Cover the partner motion in [GO_TO_MARKET_MOTION.md](go-to-market.md). Close with referral mechanics.

---

## Words We Use

| Use | Don't use |
|-----|-----------|
| Governed decision infrastructure | Decision intelligence platform |
| Operator | User |
| Loop | Pipeline |
| Primitive | Module |
| Recommendation | Suggestion |
| Approval gate | Confirmation step |
| Proof Chain | Audit log |
| Outcome Graph | Analytics |
| Covenant Policy | Permissions |
| Monte Carlo simulation | Risk model |
| Event Fabric | Event bus |
| Domain pack | Industry vertical / module |
| Tenant scope enforced at the query layer | Multi-tenant safe |

---

## Words We Do Not Use

| Avoid | Why |
|-------|-----|
| Non-bypassable | Use "enforced at [layer] through [mechanism]; bypass requires explicit, attributed override record" |
| Architecturally impossible | Same as above |
| Magic | Implies black box |
| AI-powered | Generic |
| Game-changing | Hollow |
| Best-in-class | Unverifiable |
| Disruptive | Tired |
| Revolutionary | Hollow |
| End-to-end (without specifics) | Vague |
| Plug-and-play | Misleading |
| Bank-grade security | Cliché |
| Military-grade | Reserve for IMPERIUM context only, never default |

---

## Storytelling Discipline

### Structure every story this way

1. A specific operator with a specific decision
2. The decision's current cost (time, error, audit burden)
3. The decision running through the loop
4. The proof chain
5. The outcome

### Avoid

- Hypothetical frames ("imagine if...")
- Generic personas ("any business...")
- Industry buzzwords disconnected from concrete behavior

---

## How to Verify the Narrative

Anyone hearing this narrative should be able to verify each claim:

| Claim | Verifiable at |
|-------|--------------|
| "Six primitives" | [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md) |
| "11-role RBAC" | [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) |
| "Tenant isolation enforced at query layer" | [TENANCY-MODEL.md](../architecture/tenancy-model.md) |
| "Proof Chain immutable" | [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md), live demo |
| "Five domain packs" | [DOMAIN_PACK_CATALOG.md](../product/domain-pack-catalog.md), public site |
| "Pricing published" | [PRICING_PACKAGING.md](../investor/pricing-packaging.md), `/pricing` page |
| "Known Gaps published" | [KNOWN-GAPS.md](../operations/known-gaps.md) |

If a claim cannot be verified by a buyer in 60 seconds, do not make it.

---

## Related Documents

| Document | Path |
|----------|------|
| Category positioning | [CATEGORY_POSITIONING.md](category-positioning.md) |
| Buyer personas | [BUYER_PERSONAS.md](buyer-personas.md) |
| Objection handling | [OBJECTION_HANDLING.md](objection-handling.md) |
| Go-to-market motion | [GO_TO_MARKET_MOTION.md](go-to-market.md) |
| Demo strategy | [DEMO_STRATEGY.md](demo-strategy.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md) |
| Domain pack catalog | [DOMAIN_PACK_CATALOG.md](../product/domain-pack-catalog.md) |
| Moat map | [MOAT_MAP.md](../investor/moat-map.md) |
| Investor narrative | [INVESTOR_NARRATIVE.md](../investor/investor-narrative.md) |
