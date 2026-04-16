# Demo Strategy — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, sales, partners, demo operators
**Companion docs:** [DEMO_GUIDE.md](DEMO_GUIDE.md) · [EXECUTIVE_DEMO.md](EXECUTIVE_DEMO.md) · [OPERATOR_DEMO.md](OPERATOR_DEMO.md) · [TECHNICAL_DEMO.md](TECHNICAL_DEMO.md) · [DEMO_ENVIRONMENT_CHECKLIST.md](DEMO_ENVIRONMENT_CHECKLIST.md)

---

## Why the Demo Matters

The demo is the most important sales artifact this company has. Buyers in this category have never seen "governed decision infrastructure" — there is no reference market, no analyst quadrant, no familiar competitor pattern. They have to *see* the loop work to understand what they are buying.

A good demo sells the platform. A bad demo confuses the buyer into thinking we are a dashboard or an AI copilot. The difference is structural.

---

## Demo Goals by Audience

| Audience | What they need to leave with |
|----------|------------------------------|
| Executive (CEO, COO, CFO) | A clear sentence they can repeat to their board: "this is the layer that governs every consequential decision" |
| Operator (the person who would use it daily) | "I understand how my work changes — and I want it" |
| Technical buyer (CISO, head of platform, head of compliance) | "I can answer the diligence questions" |
| Investor | "I understand the moat and the wedge" |

Each of these audiences gets a different demo flow. We do not run one demo for all of them.

---

## The Three Canonical Demos

| Demo | Length | Audience | Surface | Outcome |
|------|--------|----------|---------|---------|
| Executive | 20 min | C-suite, investors, board | Lyte action queue + one Aegis flow | Category understanding + commercial ask |
| Operator | 45 min | Domain operator (analyst, ops manager) | Domain pack + Lyte + CORTEX | Workflow buy-in |
| Technical | 60 min | CISO, head of platform, compliance | Trust Center, Proof Chain viewer, Covenant Policy, RBAC, audit export | Diligence pack opened |

See the per-audience documents for the script-level detail.

---

## The One-Sentence Demo Promise

> "In 20 minutes I will show you the same governed decision loop running across security, maritime, and real estate — same primitives, same audit trail, different domain."

Memorize this. It is the framing every demo opens with.

---

## What the Demo Always Shows

Regardless of audience, every demo includes:

1. **A signal arriving** — visible in the Event Fabric / Prism Bus UI or in the relevant domain inbox
2. **A recommendation generated** — surfaced in the Lyte action queue with provenance, confidence, and Monte Carlo result
3. **A Covenant Policy evaluation** — visible decision (permit / deny / escalate) with policy rationale
4. **A human approval (or denial)** — recorded in the Proof Chain
5. **The execution + outcome** — recorded in the Outcome Graph

This is the canonical 9-step loop, condensed. Every demo walks the buyer through the same loop with a domain-appropriate signal.

---

## What the Demo Never Shows

- Hand-waving over governance ("don't worry about that, it's audited")
- Approval gates being bypassed for time
- AI outputs without provenance ribbons
- Multi-domain capability without a real cross-domain example
- Custom builds spun up specifically for the demo

If a feature is not production-real, we do not demo it. We can describe it on the roadmap separately.

---

## Demo Environment Posture

The demo runs against the demo tenant on production infrastructure. See [TENANT_TIERS.md](TENANT_TIERS.md). Key properties:

- Synthetic data only — no PII, no real customer data
- Approval workflows execute (with side effects suppressed for outbound calls)
- Outcome Graph entries are tagged `demo: true` and excluded from aggregate metrics
- Reset cadence: weekly during pre-commercial, daily at GA
- Demo content is curated and rehearsed weekly

---

## Demo Operator Standards

| Standard | Required |
|----------|---------|
| Run-through within 24 hours of the demo | ✅ |
| Backup demo recording available if live demo fails | ✅ |
| Browser windows pre-loaded with the right tabs | ✅ |
| CORTEX device charged and signed in (for operator/exec demos) | ✅ |
| Zoom/Meet recording on (with customer permission) | ✅ |
| Trust Center URL ready to share at end | ✅ |
| Follow-up packet ready to send within 1 business day | ✅ |

---

## What the Buyer Gets in the Follow-Up

| Item | Audience |
|------|----------|
| Demo recording | All |
| One-page category positioning | Executive |
| Operator playbook excerpt for their domain | Operator |
| [TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md) | Technical |
| [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) link | Technical |
| Custom proof-of-value scope ask | Operator + Executive |
| Pricing reference (if asked) | All |

See [PROOF_OF_VALUE_PLAYBOOK.md](PROOF_OF_VALUE_PLAYBOOK.md) for what comes next if the demo lands.

---

## Demo Failure Modes & Mitigations

| Failure | Cause | Mitigation |
|---------|-------|-----------|
| AI agent slow to respond | Cold start | Pre-warm before demo; have a recorded fallback |
| Network latency to demo region | Customer's network | Pre-flight from the customer's region if possible; otherwise pre-recorded video |
| Buyer wants to see something off-script | Curiosity | Acknowledge, pin to follow-up; do not improvise governance claims |
| Buyer challenges a primitive (e.g., "is the audit really immutable?") | Healthy skepticism | Walk to the Trust Center, show the proof |
| Multi-domain story falls flat | Buyer is single-domain | Skip Command Portal section; double down on their domain |

---

## Cadence

| Cadence | What |
|---------|------|
| Weekly | Demo content review and refresh |
| After each demo | Notes captured in CRM with what landed and what did not |
| Monthly | Demo flow review with founder; trim what is not landing |
| Per pack release | Demo updated to include the new pack capability |

---

## Related Documents

| Document | Path |
|----------|------|
| Demo guide (operational) | [DEMO_GUIDE.md](DEMO_GUIDE.md) |
| Executive demo script | [EXECUTIVE_DEMO.md](EXECUTIVE_DEMO.md) |
| Operator demo script | [OPERATOR_DEMO.md](OPERATOR_DEMO.md) |
| Technical demo script | [TECHNICAL_DEMO.md](TECHNICAL_DEMO.md) |
| Demo environment checklist | [DEMO_ENVIRONMENT_CHECKLIST.md](DEMO_ENVIRONMENT_CHECKLIST.md) |
| Proof of value playbook | [PROOF_OF_VALUE_PLAYBOOK.md](PROOF_OF_VALUE_PLAYBOOK.md) |
| Sales narrative | [SALES_NARRATIVE.md](SALES_NARRATIVE.md) |
