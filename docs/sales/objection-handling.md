# Objection Handling — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, AEs, CSM
**Companion docs:** [SALES_NARRATIVE.md](sales-narrative.md) · [BUYER_PERSONAS.md](buyer-personas.md) · [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md)

---

## Principles

1. **Acknowledge first, answer second.** Do not pivot away from the objection.
2. **Cite the artifact, not the assertion.** If we have a doc that addresses it, link to it.
3. **Be honest about what we do not have.** Trying to bluff a CISO costs the deal and the reputation.
4. **Reframe; do not deflect.** Some objections are real critiques of our category; the right answer reframes the question, not dodges it.
5. **Know when to walk.** Some objections mean we are not the right fit yet. Saying so is more credible than pushing.

---

## Category Objections

### "This sounds like a dashboard."

> Acknowledge: "I understand why it can land that way."
> Reframe: "Dashboards answer *what happened*. We answer *who decided, on what evidence, against what policy, with what outcome*. The Proof Chain, the Covenant Policy, the Outcome Graph — those are not visualizations of past data. They are governance artifacts that get created at decision time."
> Verify: "Let me show you a live decision running through the loop."

### "This sounds like an AI copilot."

> Acknowledge: "Same reaction many people have first."
> Reframe: "Copilots add recommendation volume without adding governance. We add governance to recommendations. The AI on our platform cannot execute a consequential action without an approval that is enforced at the platform layer; the proof chain captures who approved, what evidence supported it, and what outcome resulted."
> Verify: [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md) and the Covenant Policy section.

### "We could build this internally."

> Acknowledge: "You could build a version. Many of the primitives are well understood individually."
> Reframe: "Three things make the build hard. One — the primitives compose into a single canonical loop, and the composition is the value. Two — the cross-domain story requires a shared event fabric, which most internal builds skip. Three — internal builds rarely produce an exportable Trust Center, an audited proof chain, or a Known Gaps document that a regulator will accept. We have those because we build for that buyer."
> Honest follow-up: "If you have a strong internal platform team, the right question is whether the time-to-deploy is faster with us. Usually it is."

### "We're not in a regulated industry."

> Acknowledge: "Then this might not be your moment."
> Reframe (gently): "If your decisions matter to a customer, an investor, an insurer, or your own board, governance still matters. But the urgency is lower if you don't have a regulator. We'd rather be honest with you than push."
> Walk: If they confirm no governance pressure, we are not the right fit yet. Stay in touch.

### "Where are you in Gartner / Forrester / IDC?"

> Acknowledge: "Not in any of those quadrants — the category we build does not yet exist in those reports."
> Reframe: "Categories appear in those reports after enough customers create budget for them. We're at the design partner stage of category creation. Investors and operators in our cohort think the category is real; analyst recognition follows."
> Honest signal: "If your buying process requires a Gartner Magic Quadrant, we are not where you are. That's a real disqualifier and I respect it."

---

## Technical Objections

### "We need SOC 2 Type II."

> Acknowledge: "We are aligned to SOC 2 controls but not yet certified. Certification is on the post-revenue roadmap."
> Reframe: "Most of what SOC 2 verifies is documented in our Trust Center: tenancy model, access control matrix, secrets policy, incident response, backup, retention, AI governance. Your auditor will recognize the structure. The gap is the third-party attestation, not the controls."
> Concrete: "If SOC 2 is hard-required for signing, we set expectations: we will not be ready in 2026. We can move into your buying process when we are."

### "We need on-prem."

> Acknowledge: "We do not have a fully managed on-prem option today."
> Reframe: "At Enterprise we host in the Azure region of your choice. Our Sovereign tier — customer-controlled environment, including air-gapped — is on the FY27 roadmap."
> Concrete: "If on-prem is hard-required for the next 12 months, we can have a different conversation about scoping a sovereign engagement now, with the understanding that we will be partly co-developing the deployment."

### "We need MFA."

> Acknowledge: "Native MFA at the platform level is not yet implemented (KG026 in our Known Gaps)."
> Reframe: "Customers using Azure AD SSO inherit MFA from their identity provider. For customers without an IdP, native MFA is on the Sprint 4 roadmap."
> Concrete: "If your only identity story is local accounts and you must have MFA today, we are not ready for you. Most Enterprise prospects use Azure AD or Okta and inherit MFA from there."

### "Walk me through your tenant isolation."

> Acknowledge: "This is the right question."
> Concrete: "Every database query that touches tenant data includes `WHERE org_id = ?`. The `org_id` is injected from the authenticated session — it cannot be supplied by the caller. The MCP gateway enforces the same — agents cannot supply `orgId` as a tool parameter. WebSocket channels include `org_id` in the channel name and use HMAC-signed tickets. Bypass requires `super_admin` role with audit logging of the bypass."
> Verify: [TENANCY-MODEL.md](../architecture/tenancy-model.md) + live query in the demo console.

### "What if your AI is wrong?"

> Acknowledge: "It will be."
> Reframe: "The platform's value is governance, not AI accuracy. Every AI recommendation carries provenance, source citations, and a confidence score. Consequential actions require human approval enforced at the platform layer; AI cannot execute past the approval gate. Override rates are tracked per agent; we surface drift."
> Concrete: "Wrong recommendations are dismissed. The Outcome Graph records the override. Confidence calibration adjusts on the next round."

### "How do we get our data out if we leave?"

> Acknowledge: "Important question; the answer should be in writing before you sign."
> Concrete: "On termination, you have a 90-day export window. Audit data, configuration, all tenant-scoped data are exportable in standard formats. After 90 days, data is permanently deleted per [DATA-RETENTION.md](../security/data-retention.md). Enterprise contracts can negotiate longer windows."

### "What about your AI provider's data handling?"

> Acknowledge: "Right question to ask."
> Concrete: "We use OpenAI, Anthropic, and Gemini under their no-training-on-customer-data terms. At Enterprise, customers can supply their own model from an allow-list. AI evaluation traces are stored with `org_id` and only returned to that tenant's authorized users. See [AI_GOVERNANCE.md](../architecture/ai-governance.md) for the full posture."

### "What about your secrets management?"

> Acknowledge: "Standard practice."
> Concrete: "All secrets live in environment variables. No secrets in source. Secret scanning is being added to CI as part of our open Sprint 3 work (we publish the gap; KG011/KG012). See [SECRETS_SETUP.md](../security/secrets-setup.md)."

### "Show me your roadmap."

> Acknowledge: "Happy to."
> Concrete: "[PRODUCT_ROADMAP.md](../product/roadmap.md) is the public version. We commit to: pack additions, scale milestones, certifications. We do not commit to: customer-specific features without an agreement that funds them."

---

## Commercial Objections

### "Your pricing is too high."

> Acknowledge: "Compared to what?"
> Reframe: "We are priced as enterprise infrastructure, not as a per-seat tool. Every customer's cost is a fraction of what they would spend internally to assemble equivalent governance — the [ROI_MODEL.md](roi-model.md) walks the math by domain."
> Concrete: "If pricing is the only blocker, we can talk about edition or pack scope. If the value isn't clear, the right next step is the [PROOF_OF_VALUE_PLAYBOOK.md](proof-of-value.md) — defined success metric, paid pilot, conversion credit."

### "Your pricing is too low — what's the catch?"

> Acknowledge: "Fair question."
> Reframe: "We are not enterprise-priced relative to nation-state platforms. We are operator-tier. The category gap we fill is at mid-market, not at three-letter agencies."
> Concrete: "Sovereign-tier and air-gapped engagements (FY27 roadmap) are a different cost structure. If that's where you are, we should scope that separately."

### "We need a 90-day free trial."

> Acknowledge: "I understand the ask."
> Reframe: "Free trials produce optionality without commitment, and the platform's value comes from operator co-design — that requires both sides to be invested. Our paid PoV is structured for the same time-window with conversion credit if you proceed."
> Concrete: "If the PoV pricing is the issue, let's talk about edition. Starter PoV is the lowest-friction option."

### "We need to evaluate you against three competitors."

> Acknowledge: "Standard procurement."
> Reframe: "We don't have direct competitors in our category. If you compare us to a SOC platform, an AI copilot, and a workflow tool, we are not equivalent to any of them — we will win or lose on different criteria. We can share a comparison framework if it helps."
> Walk: "If procurement requires a 3-vendor RFP that scores us against feature checklists from another category, you are not in the design-partner motion. Let's talk in 12 months."

### "Send me a deck and I'll get back to you."

> Acknowledge: "Of course."
> Concrete: "I will send the one-page positioning, the demo recording, and the Trust Center URL. If you decide to dig deeper, the next step is a 20-minute executive demo. If you decide it's not for now, please tell me — that's more useful than silence."
> Discipline: We follow up once at 7 days. If no response after 14, we deprioritize and re-engage in 90.

### "Our budget cycle is in 6 months."

> Acknowledge: "Common."
> Concrete: "Two paths. One — we run a paid PoV in this cycle scoped to a single decision type at a price that fits in current budget; results inform the FY budget conversation. Two — we maintain warm contact and re-engage 60 days before the FY budget."

### "We can't be a reference."

> Acknowledge: "We do not require it for non-design-partner customers."
> Reframe: "Design partners commit to reference calls and a case study; that is core to the program. If you cannot make those commitments, you are a standard commercial customer — at standard pricing."

---

## Trust / Posture Objections

### "I don't believe the audit trail is really immutable."

> Acknowledge: "Healthy skepticism."
> Concrete: "Proof Chain entries are append-only. Deletion of an entry requires `super_admin` role, and the deletion event itself is logged in the same audit trail. We do not claim cryptographic anchoring beyond hash chaining today; that is roadmap. If your compliance team requires anchored attestation today, we surface that in our Known Gaps."
> Verify: live walk of the Proof Chain and the audit export.

### "I don't believe the AI cannot bypass the approval gate."

> Acknowledge: "Trust that requires verification."
> Concrete: "The Covenant Policy engine is enforced at the API and workflow runtime layers, not in the UI. The AI agents call the same endpoints as human operators; an action that requires approval returns a `pending_approval` state until a human in the appropriate role approves. We can show you the code path."
> Verify: live demo + [PLATFORM_PRIMITIVES.md](../architecture/platform-primitives.md) Covenant Policy section.

### "I think you are over-claiming what the platform does."

> Acknowledge: "Here are the documents that back every claim. If anything in them is unsupported, tell me — we'll fix it. We publish a Known Gaps document for the same reason."
> Concrete: Walk [KNOWN-GAPS.md](../operations/known-gaps.md), [TRUST_CENTER_INDEX.md](../security/trust-center-index.md), [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md).

### "I think you are under-mature for our org."

> Acknowledge (when true): "You may be right."
> Concrete: "Our 2026 cohort is 6 design partners. If your org needs Vendor Risk Management questionnaires answered with full SOC 2 evidence and a referenceable Fortune 100 customer, we are not ready. If you can be patient with us, we are ready to deploy."
> Walk: We do not bluff. Some prospects are not for us today.

---

## Walk-Away Triggers

| Signal | Action |
|--------|--------|
| Procurement-led, RFP-style, multi-vendor scoring | Politely decline; revisit in 12 months |
| Hard-required SOC 2 today | Decline; nurture |
| Hard-required on-prem in next 6 months | Decline; offer Sovereign roadmap conversation |
| No engaged operator champion | Decline; not the right buyer |
| No engaged executive sponsor | Decline; sponsor must be in the room |
| "We need to evaluate for 6 months" | Decline; not the design partner motion |
| Refuses any commercial commitment | Decline |

We say no often in 2026. Saying no is part of how the cohort stays high-quality.

---

## Related Documents

| Document | Path |
|----------|------|
| Sales narrative | [SALES_NARRATIVE.md](sales-narrative.md) |
| Buyer personas | [BUYER_PERSONAS.md](buyer-personas.md) |
| Go-to-market motion | [GO_TO_MARKET_MOTION.md](go-to-market.md) |
| Technical diligence packet | [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md) |
| Trust Center index | [TRUST_CENTER_INDEX.md](../security/trust-center-index.md) |
| Known Gaps | [KNOWN-GAPS.md](../operations/known-gaps.md) |
| Tenancy model | [TENANCY-MODEL.md](../architecture/tenancy-model.md) |
| AI governance | [AI_GOVERNANCE.md](../architecture/ai-governance.md) |
| ROI model | [ROI_MODEL.md](roi-model.md) |
| Proof of value playbook | [PROOF_OF_VALUE_PLAYBOOK.md](proof-of-value.md) |
