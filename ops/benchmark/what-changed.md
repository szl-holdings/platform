# What Changed — Competitive Benchmark Research

**Last updated:** April 2026
**Purpose:** Summary of what this research pass added to the SZL strategy

---

## Before This Research

SZL had:
- Category positioning document (CATEGORY_POSITIONING.md)
- Platform primitives reference (PLATFORM_PRIMITIVES.md)
- System overview (SYSTEM-OVERVIEW.md)
- Operational documentation (ops/)
- Live Decision Theater demonstration

SZL lacked:
- Competitive intelligence against specific companies
- Researched patterns for trust-as-GTM, API design, operator UX
- Series A diligence preparation with current benchmarks
- Concrete recommendations tied to external best practices

---

## After This Research

### New Intelligence Added
1. **Category analysis** against Palantir, Anduril, Databricks, Vanta, Drata, Chainguard
2. **Market sizing** — $16.3B decision intelligence market (2025), 24.7% CAGR to $50.1B by 2030
3. **Operator UX patterns** from Linear, Rippling, Vercel, Cloudflare
4. **API design patterns** from Stripe, Plaid, Twilio, Cloudflare (RFC 9457)
5. **Trust-as-GTM patterns** from Vanta, Drata, Chainguard
6. **Series A diligence benchmarks** for 2025-2026 fundraising environment

### New Strategy Documents (34 total in /ops/benchmark/)

| Category | Documents | Key Insight |
|----------|-----------|-------------|
| Category narrative | category-narrative-lock.md, company-platform-product-message-map.md | SZL's moat is the *governed* qualifier — no competitor instruments the full signal-to-outcome chain |
| Operating loop | operating-loop-spec.md, workflow-state-model.md, action-and-decision-receipts.md | The nine-step loop maps to concrete data models and UX affordances inspired by Stripe's API receipts |
| Public site | public-site-market-pass.md, public-proof-system.md, public-buyer-journey.md | Homepage should lead with Decision Theater (Vercel's instant-proof pattern) and trust center (Vanta pattern) |
| Operator UX | operator-differentiation-pass.md, evidence-ux-final.md, executive-briefing-system.md, operator-demo-script.md | Every panel should have an "evidence rail" showing provenance — inspired by Stripe's event log pattern |
| API strategy | api-market-pass.md, api-idempotency-and-events.md, api-integration-quickstart.md | Adopt Stripe's idempotency-key pattern for all governed mutations; publish decision lifecycle webhooks |
| Trust & security | trust-as-gtm.md, diligence-self-serve-map.md, security-language-truth-final.md | Trust is a GTM asset (Vanta pattern); make Proof Chain the headline claim; open-source governance primitives |
| Platform coherence | domain-pack-system.md, portfolio-coherence-pass.md, agent-attribution-model.md, human-vs-agent-action-taxonomy.md | Shared primitives are the unifier (Palantir ontology pattern); every domain pack must use all six primitives |
| Repo & release | repo-control-tower.md, release-discipline-pass.md, observability-visible-surface.md | Repo quality at Stripe SDK level; monthly releases to demonstrate velocity |
| Mobile | mobile-series-a-pass.md, mobile-beta-to-launch.md | Mobile signals "real operator tool" — TestFlight demo is high-ROI for investor meetings |
| Final deliverables | executive-summary.md, market-delta.md, manual-actions-left.md, founder-next-10-actions.md, series-a-readiness-verdict.md | Actionable founder checklist with prioritized next steps |

---

## Key Strategic Shifts

1. **Trust-first positioning:** Inspired by Vanta/Chainguard, lead with proof (trust center, open-source primitives) rather than features
2. **Decision receipts:** Inspired by Stripe's request-ID + idempotency pattern, make every decision traceable and exportable
3. **Evidence rails:** Inspired by Stripe's event log, add provenance metadata to every data-displaying component
4. **Closed-loop differentiation:** SZL's Outcome Graph (recommendation → decision → outcome → learning) is unique — no competitor closes this loop
5. **Mobile as signal:** CORTEX on TestFlight proves the platform is real and operator-grade
