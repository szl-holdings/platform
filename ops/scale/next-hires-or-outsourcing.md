# Next Hires or Outsourcing

Phase I · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

What the founder needs next — in people. Each role names a trigger,
the alternative (outsource), and a decision rule.

## Operating Constraints That Drive Hiring

From `scale-constraints-memo.md`:

- Founder is the bottleneck on customer time
- Founder is the bottleneck on inbound triage
- Founder is the bottleneck on release approval
- Engineering has minimum-viable on-call coverage today

Hiring removes a specific named bottleneck. Hiring without a named
bottleneck is premature.

## Role 1 — Number-two operator / customer success

| Item | Detail |
|------|--------|
| Trigger | 5+ paying tenants OR 3+ design partners + 2 enterprise opportunities open |
| Reports to | Founder |
| Owns | Inbound triage; partner Slack Connect channels; onboarding execution; pipeline doc updates; release notification |
| Does NOT own | Pricing decisions, contract redlines, release approval |
| Profile | Operator — has run customer-success or sales-ops at a growth capital startup |
| Outsource alternative | Fractional COO / chief of staff (1099) for 6–12 months |
| Decision rule | Hire full-time if pipeline coverage justifies; outsource if pipeline coverage is volatile |

This is the first hire. It removes the founder from inbox triage and
from Day-by-day onboarding execution.

## Role 2 — Senior engineer (number-two engineer)

| Item | Detail |
|------|--------|
| Trigger | First enterprise contract OR sustained release-train velocity above current engineering bandwidth |
| Reports to | Engineering lead |
| Owns | A vertical (web + API + schema for one or two domain surfaces) |
| Does NOT own | Founder-level architectural decisions |
| Profile | Senior fullstack — TypeScript, PostgreSQL, AWS or Replit-equivalent ops |
| Outsource alternative | Trusted contractor with prior SZL pattern familiarity |
| Decision rule | Hire if revenue is contracted; contract first if revenue is in pipeline only |

The first engineering hire after the founder-engineer is critical. Wrong
hire here breaks the codebase culture.

## Role 3 — Counsel (already in place, fractional)

| Item | Detail |
|------|--------|
| Trigger | Already met |
| Owns | MSA + DPA + Order Form templates; redline negotiation; subprocessor reviews |
| Outsource alternative | This is the outsource — fractional / outside counsel |
| Decision rule | Bring in-house only at $5M+ ARR |

## Role 4 — Security / Compliance lead

| Item | Detail |
|------|--------|
| Trigger | First enterprise contract requiring SOC 2 |
| Reports to | Founder |
| Owns | SOC 2 audit prep; pen test coordination; control evidence collection; subprocessor security reviews |
| Outsource alternative | Compliance-as-a-service vendor (Drata, Vanta, Tugboat) — strongly recommended over hire for the first audit |
| Decision rule | Outsource the first audit; hire if multi-cert path emerges (SOC 2 + ISO 27001 + HIPAA) |

## Role 5 — Designer (UX/UI)

| Item | Detail |
|------|--------|
| Trigger | Three+ partners give consistent UX feedback that exceeds founder + engineering bandwidth |
| Reports to | Founder |
| Owns | Visual + interaction design across canonical surfaces |
| Outsource alternative | Project-based contractor for specific surface refreshes |
| Decision rule | Outsource until designer is full-time billable on internal work — usually post-growth capital |

## Role 6 — Marketing / Demand

| Item | Detail |
|------|--------|
| Trigger | Sustained inbound exceeds founder triage capacity (>30/month) |
| Reports to | Founder |
| Owns | Flagship site copy and SEO; content calendar; investor + customer-facing collateral |
| Outsource alternative | Fractional CMO with category-creation experience |
| Decision rule | Outsource fractional first; hire when category position is clear |

## Order of Operations

The default order:

1. Number-two operator / CS (Role 1) — first
2. Counsel (Role 3) — already in place
3. Compliance-as-a-service vendor (Role 4 outsourced) — when first
   enterprise contract signs
4. Senior engineer (Role 2) — when revenue justifies
5. Marketing fractional (Role 6) — when inbound demands it
6. Designer contractor (Role 5) — when UX feedback demands it

## What the Founder Does NOT Hire For

These are explicitly retained at founder level until further notice:

- Pricing and packaging decisions
- Investor relationships
- Strategic partnerships
- Release approval (per `founder-release-approval.md`)
- Code review verdict on architecturally significant PRs
- Hiring of all of the above roles

## Outsourcing vs Hiring Test

For each open need, the test is:

1. Is the work continuous and full-time? → Hire
2. Is the work bursty or specialized? → Outsource
3. Is the work strategic to the company's identity? → Founder retains
4. Will the role learn over time and improve? → Hire if the company can
   afford the learning curve

## Anti-Patterns

- Hiring two of the same role at once because one is risky — pick one
- Hiring "to look bigger" — does not move conversion
- Outsourcing strategic work — gets the company into someone else's
  pattern
- Hiring before the bottleneck is named — wastes the runway
