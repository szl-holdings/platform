# Partner First 14 Days

Phase A · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The first 14 days set the entire pilot trajectory. This is the
day-by-day onboarding cadence applied to every signed design partner.

## Pre-Day-1 (within 24h of signature)

- [ ] Production workspace provisioned (see manual steps in
      `manual-console-actions-master.md`, section "Provision a new tenant")
- [ ] Primary contact + decision-maker invited as users with correct
      RBAC role (use `lib/services/rbac` defaults: `org_admin` for
      decision-maker, `operator` for primary contact, `viewer` for any
      observers)
- [ ] Partner-specific Slack Connect channel opened
- [ ] Onboarding tracker doc copied into the partner's workspace
- [ ] Calendar holds sent for the four onboarding sessions

## Day 1 — Kickoff (60 min)

Goals:
- Confirm the pilot success metric and the date it will be measured
- Walk the partner through the live workspace
- Show the proof chain so they understand how decisions are recorded

Actions:
- Founder hosts; primary contact + decision-maker attend
- Record the session
- Capture three written commitments from the partner: the data they
  will load, the workflow they will run, the date they will measure
- File commitments in the partner workspace doc

## Day 2–3 — Data Load

- Founder + engineering do the first data load with the partner present
- Use the documented import paths only (no ad-hoc SQL)
- Verify with a smoke test from `staging-and-prod-smoke-tests.md`
  (production tier) executed against the partner workspace

## Day 4 — Workflow Walkthrough (45 min)

- Founder demonstrates the partner's exact workflow on their loaded data
- Show one decision running through the canonical 9-step loop
- Identify any step where the platform behaves differently on real data
  than it did on the demo dataset — file these findings as
  `partner-finding` items in the pipeline doc

## Day 5 — Self-Serve Day

- Partner runs the workflow themselves with founder available on Slack
- Founder does not intervene unless asked
- End-of-day debrief: 15 min, written

## Day 6–7 — Quiet Period

- Partner uses the system independently
- Founder monitors usage telemetry (per `telemetry-priority-matrix.md`)
- No meetings, no nudges

## Day 8 — Week-1 Review (45 min)

- Review the week's usage, errors, "would use again" signals
- Confirm or adjust the success metric
- Decide whether week 2 needs schema or workflow changes (changes that
  would benefit only this partner are deferred unless 2+ partners need
  them)

## Day 9–13 — Real Use

- Partner uses the system as their actual tool for the workflow
- Daily founder check on telemetry; intervene only on incidents
- All issues land in the support triage flow per
  `incident-triage-model.md`

## Day 14 — Onboarding Closeout (60 min)

Required outputs:

1. **Health check rating** (1–5) on each of:
   - System reliability for their workload
   - Workflow fit
   - Time-to-value
   - Likelihood to renew at full price
2. **Top three friction points** in writing
3. **Reference willingness** — anonymous yes/no, named yes/no
4. **Path to annual contract** — date and price agreed

If health check < 3 on any axis, escalate to the founder pipeline
dashboard as `at-risk`.

## What "Done" Looks Like at Day 14

- Partner has logged in ≥10 times
- Partner has executed the agreed workflow ≥3 times on real data
- Partner can name the success metric without prompting
- Founder has captured ≥3 verbatim quotes about the experience
- A renewal conversation date is on the calendar

If any of these is missing at Day 14, the partner is "stalled" and the
founder owns the recovery plan.
