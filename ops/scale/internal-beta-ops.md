# Internal Beta Ops (Web)

Phase G · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

How the SZL web platform is operated through internal alpha → design
partner beta → general availability. Mobile is covered separately in
`mobile-beta-ops.md`.

## Phase Map

| Phase | Audience | Tier | Exit Criteria |
|-------|----------|------|---------------|
| Internal alpha | Founder + engineering only | Workspace | All canonical web artifacts run; smoke tests pass on Workspace |
| Design partner beta | Up to 3 design partners | Staging or Production with explicit consent | Each partner completes their Day-14 review per `partner-first-14-days.md` |
| Limited GA | Named accounts only | Production | Smoke tests pass on Production; first paying tenant active for 30 days without P0 |
| GA | Open to qualified inbound | Production | Limited GA for 90 days; no Tier-1 alarm trend; 5+ paying tenants |

The platform today is between Internal Alpha and Design Partner Beta.
Some surfaces (Carlota Jo) are operationally further ahead than the
overall platform; this is normal.

## Per-Surface Beta Readiness

Beta readiness is read off `ops/frontier/market-benchmark-gap-analysis.md`:

| Surface | Beta-ready for |
|---------|----------------|
| szl-holdings (flagship) | Public alpha (already serving) |
| Carlota Jo | Limited GA — operational with real backend |
| Command (unified ops) | Design partner beta |
| Terra | Design partner beta — stubbed-data caveat applies |
| Vessels | Design partner beta — stubbed-data caveat applies |
| Conduit | Design partner beta — data connector scope must be disclosed |
| Sentra | Design partner beta — demo mode feeds; live connector required for pilot |
| Counsel | Design partner beta |
| Pulse | Design partner beta |
| api-server | Underlies all the above |

## Beta Discipline Rules

1. **One canonical path per surface.** Archived artifacts do not appear in any beta material. The disposition is final per `ops/frontier/disposition-matrix.md`.

2. **No beta surface is shown without honest status.** If Aegis is
   demoed to a partner, the demo includes "STIX/TAXII feeds are
   currently in demo mode — production deployment requires a live
   feed connector we will build during the pilot."

3. **All write paths require Zod validation.** Any beta surface lacking
   Zod on a write route is not allowed in front of a partner. This is
   a release-blocker per `release-blocker-policy.md`.

4. **All beta tenants get the full launch pack.** No partner is invited
   to use a surface without `customer-launch-pack.md` delivery.

## Beta Lifecycle Per Partner

| Day | Activity | Reference |
|-----|----------|-----------|
| 0 | Sign + provision | `production-cutover-checklist.md`, `manual-console-actions-master.md` |
| 1–14 | Onboarding | `partner-first-14-days.md` |
| 15–60 | Active use; weekly working sessions | `founder-operating-rhythm.md` |
| 60–90 | Convert to annual or document non-conversion | `design-partner-onboarding.md` |
| Ongoing | Health monitoring | `telemetry-priority-matrix.md` Tier 2 + 3 |

## Beta Termination Conditions

A partner is graduated out of beta in one of three ways:

1. Annual contract signed → moves to Limited GA
2. Mutual decision to end the relationship → wind-down per data return
   clause in DPA
3. SZL-initiated termination for irreparable health-check failure →
   rare; requires written rationale and counsel review

## What Is NOT in Web Beta

- Mobile (separate lifecycle in `mobile-beta-ops.md`)
- Internal-only artifacts (mockup-sandbox)
- Archived artifacts (no exposure under any path)
- Roadmap features (these are demoed only as roadmap, never as beta)

## Operator Touchpoints

The web beta requires operator action for:

| Action | Owner | Frequency |
|--------|-------|-----------|
| Provision new beta tenant | Founder | Per signed partner |
| Apply DB migrations to Staging + Production | Engineering | Per release |
| Refresh demo seed in Workspace + Staging | Engineering | Per release |
| Check Tier 1 telemetry post-deploy | Founder | Per release |
| Quarterly DPA + subprocessor review | Counsel + Founder | Quarterly |

These are all in `manual-console-actions-master.md`.

## What Beta Discipline Buys

- A clear, defensible "what works today" story for any prospect
- A short list of design partners with evidence of real use
- A disciplined release rhythm that does not break partners
- A truthful narrative for investors that does not require hindsight
  cleanup later
