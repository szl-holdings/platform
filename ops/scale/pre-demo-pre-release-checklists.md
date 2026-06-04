# Pre-Demo and Pre-Release Checklists

Phase F · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The detailed forms of the pre-demo and pre-release sections from
`founder-control-room-checklist.md`. Use these in the moment.

---

# Pre-Demo Checklist

Run T-60 minutes before any tailored demo.

## Workspace prep (T-60 → T-30)

- [ ] Confirm staging or production tier per consent
- [ ] Workspace exists and is accessible
- [ ] Workspace contains data shaped like the partner's (synthetic OK
      if real not yet under DPA)
- [ ] All canonical 9-step loop steps return real responses on the
      target workflow
- [ ] One sample proof-chain entry already exists for that workflow

## Build and feature integrity (T-30 → T-15)

- [ ] Running build version recorded; demo script reviewed against it
- [ ] No demo line references a feature that is not in the running build
- [ ] Roadmap items in the demo are explicitly marked as roadmap on the
      slide / spoken
- [ ] One "we don't know" example identified for an honesty demonstration

## Hygiene (T-15 → T-5)

- [ ] Browser windows cleared of internal tabs and notifications
- [ ] Slack notifications silenced
- [ ] Email notifications silenced
- [ ] Calendar notifications silenced
- [ ] Pager set to silent (not off)
- [ ] Camera + audio tested
- [ ] Backup hotspot ready in case of network failure
- [ ] Spare device with the demo workspace logged in

## Recording (T-5 → T-0)

- [ ] Recording consent confirmed in the meeting opening
- [ ] Recording started
- [ ] Demo script visible only to founder

## During the demo

- Open with the workload restatement, not with the product
- Walk one decision through all 9 steps
- Show the proof entry
- Show the honest "we don't know" surface
- End with a written next step (date and deliverable)

## After the demo (within 1 business hour)

- [ ] Recording filed in the partner workspace folder
- [ ] Follow-up email sent per the template in `demo-to-pilot-flow.md`
- [ ] Pipeline doc updated — stage advanced or held with a reason
- [ ] Any verbatim reactions captured into the partner record

---

# Pre-Release Checklist

Run T-24h before any production release.

## Gate verification (T-24h)

- [ ] Lint workflow green
- [ ] Typecheck workflow green
- [ ] Unit tests green
- [ ] Integration tests green
- [ ] Code review verdict APPROVED for every change in the release
- [ ] Staging deploy succeeded for the release commit
- [ ] Staging E2E tests green
- [ ] Staging smoke tests green per `staging-and-prod-smoke-tests.md`

If any gate is red, the release does not proceed. No exceptions.

## Incident posture (T-24h)

- [ ] Zero P0 open
- [ ] Zero P1 open or P1 has a documented workaround
- [ ] No release-blocker labeled issue open per `release-blocker-policy.md`

## Release notes (T-24h → T-12h)

- [ ] Customer-facing release notes drafted in plain language
- [ ] Internal release notes capture the engineering scope
- [ ] Both notes reviewed by founder

## Approval (T-12h)

- [ ] Founder signs `founder-release-approval.md` for this release
- [ ] Approval recorded in `what-changed.md` (entry created in
      "scheduled" state)

## Communication (T-6h)

- [ ] Affected partners notified via Slack Connect with the release
      window
- [ ] If the release affects mobile, mobile testers notified per
      `mobile-beta-ops.md`
- [ ] Status page updated if a brief degradation is expected

## Pre-execution (T-1h → T-0)

- [ ] Last known-good tag noted (for fast rollback)
- [ ] On-call engineer confirmed available
- [ ] First-30-min telemetry watch slot blocked
- [ ] Pager confirmed working (self-test)
- [ ] Founder physically at desk; no concurrent demo

## Execution (T-0 → T+30min)

- [ ] Tag pushed
- [ ] Deploy workflow running
- [ ] Manual confirm gate ack'd
- [ ] Production smoke tests pass
- [ ] First user login post-deploy verified
- [ ] Tier 1 telemetry watched live
- [ ] Tier 2 telemetry watched live

## Stabilization (T+30min → T+24h)

- [ ] No alarm raised in the watch window
- [ ] Customer-facing release notes published
- [ ] `what-changed.md` entry moved from "scheduled" to "live" with
      timestamps
- [ ] Affected partners post-notified
- [ ] Telemetry baseline updated if needed

## If anything goes wrong

- Trigger rollback per `deploy-and-rollback-runbook.md`
- Open incident per `incident-triage-model.md`
- Founder owns the timeline
- Postmortem within 48 hours

---

## Why These Checklists Are Long

Founder-stage releases are infrequent and high-stakes. A long checklist
takes 10 minutes to walk; a missed step takes a day to recover from.
The checklist is the cheaper option every single time.
