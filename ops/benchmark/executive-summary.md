# Executive Summary — Competitive Benchmark Research

**Last updated:** April 2026
**Purpose:** Top-level summary of the research pass for founder and investor consumption

---

## What Was Benchmarked

This research pass analyzed the competitive landscape across five dimensions and synthesized findings into SZL-specific strategy documents.

### Research Areas

| Area | Companies Analyzed | Key Findings |
|------|-------------------|-------------|
| Governed intelligence & decision platforms | Palantir Foundry/AIP, Anduril Lattice, Databricks Unity | SZL's nine-step loop with outcome tracking has no equivalent. Palantir governs data access; Anduril governs military ROE; SZL governs commercial decision execution. |
| Enterprise trust & buyer enablement | Vanta, Drata, Chainguard | Trust center is a GTM asset, not a checkbox. Open-source governance primitives (Chainguard pattern) are the strongest trust signal for technical buyers. |
| Operator UX & command surfaces | Linear, Rippling, Vercel, Cloudflare | Evidence rails (Stripe pattern), command palettes (Linear pattern), and deployment-style execution logs (Vercel pattern) should define SZL's operator experience. |
| API design & developer experience | Stripe, Plaid, Twilio, Cloudflare | Idempotency keys on all mutations (Stripe), decision lifecycle webhooks, and RFC 9457 error envelopes signal "integration-grade" to technical buyers. |
| Series A diligence & positioning | 2025-2026 benchmarks, investor expectations | Investors bet on the engine at Series A. Clean repo, live demo, documented architecture, and monthly releases are table stakes. |

---

## What Makes Each Surface Stronger

| Surface | Before Research | After Research |
|---------|----------------|---------------|
| **Flagship site** | Feature-focused homepage | Decision Theater as hero demo (Vercel instant-proof pattern) + trust center as first impression (Vanta pattern) |
| **Operator UX (Lyte/Command)** | Dashboard layout | Evidence rails on every panel + decision-ready actions + command palette for governed operations |
| **API** | Standard REST endpoints | Decision lifecycle webhooks + idempotency on all mutations + governance-specific error codes |
| **Trust center** | Static security page | Self-serve trust portal + open-source governance primitives + decision receipt export |
| **Mobile (CORTEX)** | Alpha app | TestFlight-ready demo for investor meetings with biometric auth + offline governance |
| **Category narrative** | "Governed Decision Infrastructure" | Same category, now backed by $16.3B market sizing, competitive feature matrix, and nine-step loop specification |

---

## Market Position

| Metric | Value |
|--------|-------|
| Decision Intelligence Market (2025) | $16.34B |
| Projected (2030) | $50.1B |
| CAGR | 24.7% |
| SZL's unique capabilities | Risk simulation inline with decisions, outcome tracking with variance, closed-loop confidence calibration, cross-domain governance |
| Direct competitors for "governed decision infrastructure" | None identified |

---

## Top 10 Founder Actions

1. Run the Decision Theater demo yourself (Day 1)
2. Create GitHub Release v0.2.0 (Day 1-2)
3. Rotate production secrets (Day 2)
4. Build CORTEX on a physical device (Day 3-5)
5. Prepare the pitch deck using benchmark research (Day 5-10)
6. Set up the trust center page (Day 7-10)
7. Draft the investor update template (Day 10)
8. Identify 20 target investors (Day 10-15)
9. Schedule 3 practice pitches (Day 15-20)
10. Publish governance primitives as open source (Day 20-30)

See `founder-next-10-actions.md` for detailed execution plan.

---

## Series A Readiness: CONDITIONALLY READY

**Strengths:** Real architecture (not mockups), category-of-one positioning, multi-domain breadth, closed-loop governance, professional documentation.

**Gaps to close before fundraising:**
- P0: Rotate production secrets, publish GitHub release, build CORTEX on device, prepare pitch deck
- P1: Trust center page, webhook API, Zod validation expansion, external log sink, open-source governance

See `series-a-readiness-verdict.md` for detailed assessment.

---

## Documents Produced

34 strategy documents in `/ops/benchmark/` covering:
- Category narrative and messaging (2 docs)
- Operating loop specification and data models (3 docs)
- Public site, proof system, and buyer journey (3 docs)
- Operator UX, evidence patterns, and demo scripts (4 docs)
- API strategy, idempotency, and quickstart (3 docs)
- Trust GTM, diligence, and security language (3 docs)
- Platform coherence, attribution, and taxonomy (4 docs)
- Observability, repo quality, and release discipline (3 docs)
- Mobile strategy (2 docs)
- Final deliverables: executive summary, changes, market delta, manual actions, founder actions, readiness verdict (6 docs)
