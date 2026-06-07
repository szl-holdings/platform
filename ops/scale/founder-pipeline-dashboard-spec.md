# Founder Pipeline Dashboard Spec

Phase D · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The single dashboard the founder reads daily to know the state of the
business. Built to replace ad-hoc spreadsheets without prematurely
adopting a CRM.

## Where It Lives

A page inside `artifacts/command` (the unified ops command artifact)
under `/command/pipeline`. Implementation is small and read-only over
the pipeline data store; this doc is the spec, not a build order.

## Source of Truth

The pipeline data is structured and lives in a Postgres table set
under `lib/db/src/schema/pipeline.ts` (to be created when this page
ships — currently the data lives in the founder's structured doc; this
spec defines what the eventual ingest will look like).

Key entities:

- `pipeline_lead` — top-of-funnel
- `pipeline_opportunity` — qualified, in-flight
- `pipeline_partner` — signed design partner
- `pipeline_customer` — annual-contract customer
- `pipeline_event` — append-only log of stage transitions
  (this is the event source — derived state computed from this log)

All stage transitions emit ATLAS events using the
`packages/atlas-events` strict envelope:

- `pipeline.lead.created`
- `pipeline.lead.qualified`
- `pipeline.opportunity.demoed`
- `pipeline.opportunity.agreement_sent`
- `pipeline.opportunity.signed`
- `pipeline.partner.activated`
- `pipeline.partner.health_changed`
- `pipeline.customer.contracted`
- `pipeline.customer.churned`

These events are added to `packages/atlas-events` taxonomy and
contribute to Tier 2 telemetry per `telemetry-priority-matrix.md`.

## Page Layout

### Header band

| Tile | Value |
|------|-------|
| Active opportunities | count + week-over-week delta |
| Active design partners | count (max 3 per Phase A) |
| Annual contracts | count + ARR |
| Pipeline coverage | (open ARR weighted by stage) ÷ (next-12-months target) |

### Funnel column

A single vertical funnel showing the stages from
`conversion-ops-map.md`. Each row shows count + dollar value + average
days-in-stage. Click drills into the list of records at that stage.

### Stalled list

The most important section. Any record that has been in its current
stage longer than the stage's median + 50% appears here with the
contact name and the days-stalled count. The founder works this list
first every morning.

### At-risk partners

Any signed partner whose Day-14 onboarding scored ≤3 on any axis (per
`partner-first-14-days.md`) appears here until the score is recovered
or the partner is graduated.

### Recent transitions

Reverse-chronological list of pipeline events from the last 7 days.
Used during Friday review to confirm the week's narrative.

## Filters

- Source (Direct, Inbound search, Outbound, Referral, Investor)
- Domain (Aegis, Vessels, Terra, Carlota Jo, Command, CORTEX, flagship)
- Owner (founder by default; multi-owner once team grows)
- Date range (default: last 30 days)

## Refresh Cadence

The page is real-time over the event store. There is no overnight
batch.

## Permissions

| Role | Access |
|------|--------|
| `founder` (custom role to be added) | Full read + edit |
| `org_admin` | Read only |
| Anyone else | No access |

This page contains commercial information and stays within the
founder's role until the company grows a sales team.

## Telemetry Embedded in the Page

Each tile shows a small data-quality indicator:

- Green dot — data refreshed in the last 5 min
- Yellow dot — last refresh 5–60 min ago
- Red dot — refresh stalled (escalates to Tier 2 alert)

Stalled refresh on this page is itself a signal that the ATLAS event
ingest is broken, which is a Tier 2 alarm anyway.

## What This Page Does NOT Show

- Individual rep activity (no reps yet; this is founder-led)
- Forecast accuracy (no forecast model at this stage; pipeline coverage
  is the only forecast lever)
- Marketing attribution beyond source — the funnel volume is too small
  for attribution math to be meaningful

## Build Order

1. Add `pipeline.*` events to `packages/atlas-events` taxonomy
2. Add `pipeline_*` schema to `lib/db/src/schema/`
3. Add `/api/pipeline/*` routes (read endpoints + the few write endpoints
   the founder needs from the page)
4. Build the page in `artifacts/command/src/operations/pipeline/`
5. Migrate the founder's existing structured doc data into the tables
6. Decommission the doc

This is a near-term build; this doc is the spec. The build itself is
out of scope for the current task.
