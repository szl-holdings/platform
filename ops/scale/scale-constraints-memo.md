# Scale Constraints Memo

Phase I · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

A founder memo on what will break first as the platform scales — and
the honest order in which it will need to be addressed.

## Scale Vector 1 — Customer Count

| Stage | Customer count | Constraint that hits |
|-------|----------------|----------------------|
| Today | 0–3 design partners | Founder time on each partner |
| Near (3–10) | 5+ design partners + 1–2 paying | Manual tenant provisioning; pipeline doc instead of dashboard; founder-only inbox |
| Mid (10–25) | 5–10 paying | On-call coverage; pager that actually works; second sales / customer-success person |
| Late (25+) | 25+ paying | Multi-tenant isolation invariants need automated testing every release; SOC 2; tier 2 support layer |

The first constraint to hit is **founder time per partner**. Three
concurrent design partners is the explicit ceiling per
`design-partner-onboarding.md`.

## Scale Vector 2 — Workload Volume

| Subsystem | Today's posture | First scale break |
|-----------|----------------|-------------------|
| API request rate | 200/15m global rate limit | First customer with bursty usage hits this — raise per-tenant limit, keep global |
| Database connection pool | Replit-managed defaults | First sustained 100+ rps hits pool exhaustion — document max connections per env |
| ATLAS event ingestion | In-process publish | First high-cardinality event source needs a queue |
| AI provider tokens | Best-effort cost tracking | First customer with $10k+/mo AI spend needs per-tenant cap |
| Audit log writes | Synchronous on every action | First high-write workload turns audit into a bottleneck — async with at-least-once delivery |

Rule: do not pre-optimize any of these. Each is a known scale break
with a known mitigation. Address when actually hit.

## Scale Vector 3 — Surface Count

The platform currently registers 9 active artifacts (7 canonical web
+ 1 mobile + 1 internal sandbox). Five are archived. Adding a tenth
canonical surface (a new domain pack) would:

- Require a new schema namespace
- Require new ATLAS events in the taxonomy
- Require new RBAC role conventions if the surface introduces new role
  classes
- Require its own onboarding flow in `customer-launch-pack.md`

Each new surface is a 4–8 week founder commitment minimum. New
surfaces should be added only when:

- A named design partner has signed for it
- The domain is unambiguously distinct from existing surfaces
- Founder has bandwidth to be the product owner during launch

## Scale Vector 4 — Code Volume

Today (per `ops/frontier/repo-truth-audit.md`):

- ~395 source files in api-server
- 116 schema files; 569 tables
- 157 named ATLAS events across 10 domains
- 3,000+ TypeScript source files across all artifacts

Near-term scale breaks:

- TypeScript project references graph compile time exceeds 60s — already
  near this limit
- LSP performance in workspace degrades — already noticeable
- Code review skill cannot fit larger PRs in context — adopt a 200-file
  PR cap
- Schema review per release becomes impractical without tooling

Mitigations to plan for (not build today):

- Stricter PR scope policy (one feature per PR; one schema per PR)
- Lazy-loaded TS project references
- Codebase health metrics dashboard

## Scale Vector 5 — Operational Complexity

Three operator-action lists have grown to material size:

- `manual-console-actions-master.md` — currently 60+ items
- `risk-register.md` — currently 10 named risks
- `manual-actions-left.md` — currently a focused list to drive to zero

Operational complexity scales worse than linearly. The single biggest
mitigation is automation of recurring console actions. Top automation
candidates:

| Today | Tomorrow |
|-------|----------|
| Manual tenant provisioning | Self-service tenant API behind admin auth |
| Manual EAS submit | CI-driven submit on tag |
| Manual smoke test verification | Smoke results posted to Slack automatically |
| Manual schema drift comparison | Automated tier-drift detector |
| Manual partner notification | Pipeline page emits ATLAS event → Slack notify |

## Scale Vector 6 — Cash Burn vs Revenue

Today the company runs lean by design. Two scale breaks here:

- First hire (likely number-two ops + customer success) — covered in
  `next-hires-or-outsourcing.md`
- First enterprise contract triggers SOC 2 spend (≥$50k for first audit)

Both are revenue-funded events, not capital-funded. Either is delayed
if the corresponding revenue is not in hand.

## What This Memo Is Not

- A roadmap. The roadmap is set quarterly per
  `founder-operating-rhythm.md`.
- A risk register. That is `risk-register.md`. This memo is about the
  shape of the curve we are climbing.
- A pessimistic view. Each constraint above has a known fix; the
  point is to address them in the order they hit, not in the order
  that feels prestigious.

## Re-review

- Quarterly during the roadmap reset
- After every doubling of customer count
- After every named scale break is hit (post-mortem the assumption)
