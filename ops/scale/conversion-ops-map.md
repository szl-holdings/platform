# Conversion Ops Map

Phase D · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

End-to-end map of how an unknown visitor becomes a paying tenant. Each
stage names the surface, the instrumentation, the conversion target,
and the artifact responsible.

## The Funnel

```
Unknown visitor
    │
    ▼  (flagship site landing)
Known visitor          ── consent gate ──> client analytics
    │
    ▼  (form submit / outreach reply)
Inbound lead            ── server event ──> CRM / pipeline doc
    │
    ▼  (discovery call accepted)
Qualified prospect      ── server event ──> pipeline doc stage update
    │
    ▼  (tailored demo)
Active opportunity      ── server event ──> demo recording linked
    │
    ▼  (pilot signed)
Design partner          ── server event ──> tenant provisioned
    │
    ▼  (annual contract)
Paying customer         ── billing event ──> Stripe + revenue board
```

Each arrow is an event we instrument.

## Instrumentation Split — Client vs Server

The hard rule: **anything that affects revenue or commitment is
instrumented server-side**. Client analytics fire to inform UX, not
to decide what is real.

| Event | Tier | Source | Why |
|-------|------|--------|-----|
| Page view | Client | flagship analytics | UX only |
| CTA click | Client | flagship analytics | UX only |
| Form submit | **Server** | API endpoint behind the form | Revenue-adjacent |
| Outreach reply | Server | Email integration | Revenue-adjacent |
| Discovery call booked | Server | Calendar integration | Pipeline state |
| Demo completed | Server | Founder marks completion | Pipeline state |
| Pilot agreement sent | Server | Counsel system event | Pipeline state |
| Pilot signed | Server | DocuSign webhook | Revenue commitment |
| Tenant provisioned | Server | Internal admin route | System truth |
| Annual contract signed | Server | DocuSign webhook | Revenue commitment |
| Stripe subscription created | Server | Stripe webhook | Revenue truth |

The flagship lives in `artifacts/szl-holdings`; the API server lives in
`artifacts/api-server`. Server-side conversion events are emitted as
ATLAS events using `packages/atlas-events` strict envelope.

## Consent and Privacy

The flagship site asks for analytics consent on first visit. Only after
consent does any client-side analytics fire. The default is no
tracking. This is enforced in the flagship `App` shell.

PII never appears in analytics events. Form-submit server events
record:

- A surrogate ID for the lead (UUID generated server-side)
- The form name and the campaign source if present
- Coarse geography (country, region) — never IP

## Funnel Conversion Targets

These mirror the targets in `demo-to-pilot-flow.md` and are the levers
the founder works:

| Stage transition | Target | Lever |
|------------------|--------|-------|
| Visitor → Form submit | 2% | Landing copy, demo video, pricing transparency |
| Form submit → Discovery call | 50% | Same-business-day response (see SLA doc) |
| Discovery → Demo | 70% | Discovery script discipline |
| Demo → Pilot agreement sent | 50% | Demo prep quality |
| Agreement → Signed | 70% | Counsel response time |
| Signed pilot → Annual | 50% | Onboarding execution per Phase A docs |

Top-of-funnel volume is intentionally below most SaaS benchmarks. SZL
is a high-touch, named-account business at this stage.

## Source Attribution

| Source | Surface | Notes |
|--------|---------|-------|
| Direct | `/` flagship | Founder personal network, references |
| Inbound search | `/` with referrer | SEO; tracked via consented analytics |
| Cold outbound | Email reply | Logged as server event with campaign tag |
| Partner referral | Form with `?ref=` parameter | Highest-conversion source historically |
| Investor intro | Calendar invite | Tracked as `intro` source in pipeline |

## What Is NOT in the Funnel

- Demo signups for non-canonical surfaces (mockup sandbox, archived
  artifacts)
- Mobile app downloads independent of pilot — CORTEX mobile is a
  delivery channel for existing tenants, not a top-of-funnel asset
- Support inquiries from existing tenants — not lead-gen

## Reporting

The funnel state is reported in two places:

1. `founder-pipeline-dashboard-spec.md` — operational, daily
2. Investor update memo — monthly, derived from pipeline state

Reporting periods always end on the last day of a calendar week or
month. Cohort tracking uses the week the lead first appeared as the
cohort key.

## Data Backbone

The pipeline doc is currently a structured shared document maintained by
the founder. It will graduate to a dedicated CRM only when:

- Volume exceeds 25 active opportunities
- More than one person is updating the doc

Premature CRM adoption is more expensive than late adoption at this
scale; the doc is the system of record until it is not.
