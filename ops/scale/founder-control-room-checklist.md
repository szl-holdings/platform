# Founder Control Room Checklist

Phase F · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The compact set of things the founder checks every day, every week,
before every demo, before every release, and after every release.
Built so that nothing important is left to memory.

## Daily — 5 minutes

- [ ] Pager: any alerts overnight?
- [ ] Tier 1 telemetry: all green?
- [ ] Inbox: anything missed SLA from `inbound-routing-and-response-sla.md`?
- [ ] Pipeline stalled list: any new entries?
- [ ] Open P1+ incidents: any?
- [ ] Slack Connect: any partner message unread for >24h?

If all green, move on. If any red, it owns the morning.

## Weekly — 30 minutes (Monday)

- [ ] Pipeline review: stage transitions in last 7 days, conversion
      ratio vs targets in `conversion-ops-map.md`
- [ ] Telemetry: Tier 2 trend lines vs prior week
- [ ] Tier 3 dashboard: any signal trending the wrong way for ≥3 weeks?
- [ ] Postmortems published this week: read all
- [ ] Risks added to `risk-register.md`: triaged?
- [ ] Manual actions list (`manual-actions-left.md`): anything completable
      this week?
- [ ] Founder weekly reset questions written and filed

## Pre-Demo (60 min before any tailored demo)

- [ ] Workspace pre-loaded with the partner's data shape
- [ ] Demo script reviewed against the running build (no roadmap features)
- [ ] Sample proof-chain entry available to show
- [ ] Recording consent confirmed
- [ ] One "we don't know" surface identified to demonstrate honesty
- [ ] Pager set to silent (not off — silent)
- [ ] Browser cleared of internal tabs
- [ ] Spare device on standby in case of hardware failure

## Pre-Release (24 hours before)

- [ ] All gates green per `deploy-and-rollback-runbook.md`:
      lint, typecheck, unit tests, code review APPROVED, Staging E2E,
      Staging smoke tests
- [ ] No P0/P1 incident open
- [ ] Release notes drafted and reviewed
- [ ] Founder release approval signed per `founder-release-approval.md`
- [ ] Last known-good tag noted (for fast rollback)
- [ ] Affected partners notified (Slack Connect) with release window
- [ ] On-call engineer confirmed available during release window
- [ ] First-30-min telemetry watch slot blocked on calendar

## Release Window

- [ ] Tag pushed; deploy workflow running
- [ ] Manual confirm gate ack'd at the right time
- [ ] Production smoke tests passing
- [ ] First user login post-deploy verified
- [ ] Tier 1 + Tier 2 metrics watched continuously for 30 min

## Post-Release (within 24 hours)

- [ ] `what-changed.md` updated with the release entry
- [ ] Affected partners post-notified (Slack Connect)
- [ ] Telemetry baseline updated if behavior shifted in a normal way
- [ ] Any new bugs filed and labeled per `incident-triage-model.md`
- [ ] Postmortem started if any incident occurred during the window

## Pre-Investor-Update (monthly)

- [ ] Pipeline state pulled from `founder-pipeline-dashboard-spec.md`
- [ ] Tier 1/2 incident summary
- [ ] Customer wins / losses summarized with named customers under
      reference rights
- [ ] Roadmap progress vs prior update
- [ ] Capital runway updated
- [ ] One ask explicit at the bottom

## Quarterly

- [ ] `risk-register.md` walked end-to-end
- [ ] `manual-actions-left.md` walked end-to-end
- [ ] `buyer-faq.md` reviewed for accuracy
- [ ] `diligence-fast-path.md` mappings re-verified against actual repo
- [ ] Roadmap reset
- [ ] Tier 2 telemetry list reviewed; demote / promote as needed
- [ ] Standing meeting list reviewed; cut what is not earning its slot

## How to Use

This is a living checklist. Items are added as new disciplines are
adopted. Items that go unused for 3+ months are removed (the checklist
does not become noise).

The daily and pre-release sections are printed and pinned to the
founder's monitor.
