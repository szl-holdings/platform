# Founder Launch Kit

**Last updated:** April 2026  
**Purpose:** Actionable checklists for demos, releases, and buyer follow-up. Designed for founder use — keep it terse, keep it actionable.

---

## Kit Overview

Five checklists:

1. **Pre-Demo Checklist** — every buyer demo
2. **Pre-Release Checklist** — every platform release
3. **Post-Release Checklist** — every platform release
4. **Design Partner Launch Checklist** — every new design partner onboarded
5. **Buyer Follow-Up Checklist** — every buyer conversation that should advance

---

## Checklist 1: Pre-Demo Checklist

**Run this 30 minutes before every buyer demo.**

**Platform state:**
- [ ] `/api/health` returns 200 and DB latency < 200ms
- [ ] All demo paths load: /, /aegis/, /terra/, /vessels/, /carlota-jo/, /command/
- [ ] Demo account credentials confirmed working (do not use real partner accounts for demos)
- [ ] No pending deployments or migrations during the demo window

**Demo environment:**
- [ ] Browser cleared of non-relevant tabs
- [ ] Zoom / Meet screen share tested
- [ ] Camera and microphone checked
- [ ] Demo script reviewed — know the domain focus for this buyer
- [ ] Secondary screen or tablet if doing live mobile demo

**Buyer prep:**
- [ ] Confirmed domain of interest (Aegis / Vessels / Terra / PRISM Counsel / General)
- [ ] Confirmed who will be on the call (titles, decision roles)
- [ ] Reviewed any prior conversation notes
- [ ] Prepared 1–2 specific questions to ask during the demo

**Post-demo setup:**
- [ ] Follow-up email template ready to send within 2 hours of demo end

---

## Checklist 2: Pre-Release Checklist

**Run this before every production deployment.**

**Code quality:**
- [ ] All changes merged to main via reviewed pull request
- [ ] No `console.error` or debug output in production paths
- [ ] No hardcoded secrets or credentials in any file
- [ ] No `.env` files committed

**Tests:**
- [ ] Smoke tests passing on current workspace state
- [ ] No unresolved P0 or P1 issues outstanding

**Documentation:**
- [ ] `CHANGELOG.md` updated with release summary
- [ ] `docs/releases/v{X}.{Y}.{Z}.md` exists and is substantive
- [ ] Version bumped in relevant `package.json` files

**Communication:**
- [ ] Active design partners notified (24 hours advance if possible)
- [ ] Any breaking API changes communicated to integration partners with migration path

**Security:**
- [ ] Secret inventory reviewed — any secrets requiring rotation?
- [ ] New environment variables are in Replit Secrets (not source code)

---

## Checklist 3: Post-Release Checklist

**Run this immediately after every production deployment.**

**Automated verification:**
- [ ] `/api/health/live` returns 200
- [ ] `/api/health/ready` returns 200
- [ ] All web app paths return 200 (/, /aegis/, /terra/, /vessels/, /carlota-jo/, /command/)

**Manual spot-check:**
- [ ] Homepage loads with correct content
- [ ] Login and logout cycle works
- [ ] At least one domain pack workspace loads and renders
- [ ] No console errors in browser dev tools
- [ ] API docs at `/api/docs` loads

**Version confirmation:**
- [ ] `/api/health` returns expected version number
- [ ] GitHub release created with correct tag and notes

**Partner notification:**
- [ ] Design partners notified of deployment completion (brief Slack message)
- [ ] If any issues discovered: partners notified immediately

**Documentation:**
- [ ] Deployment logged in deployment log (see `post-deploy-verification-final.md`)

---

## Checklist 4: Design Partner Launch Checklist

**Run this at the start of every new design partner pilot.**

**Before kickoff:**
- [ ] Pilot agreement or LOI signed
- [ ] Success metrics agreed and documented
- [ ] Baseline document started (will be completed in kickoff session)
- [ ] Partner Slack channel created
- [ ] Platform access provisioned (workspace isolated, roles assigned)
- [ ] First-30-days plan ready to review

**Kickoff session:**
- [ ] Platform orientation completed (governed decision loop, Proof Chain demo)
- [ ] Role assignments confirmed and tested (all users can log in)
- [ ] Success metrics alignment session completed
- [ ] First signal scenario identified
- [ ] Check-in cadence confirmed (weekly async, bi-weekly sync)

**Post-kickoff (within 24 hours):**
- [ ] Kickoff notes sent to partner (role assignments, metrics, first signal scenario)
- [ ] 30/60/90-day checkpoint dates on calendar
- [ ] Partner added to pipeline tracker

---

## Checklist 5: Buyer Follow-Up Checklist

**Run within 2 hours of any buyer demo or discovery call.**

**Follow-up email:**
- [ ] Send within 2 hours (not 2 days)
- [ ] Reference specific things they mentioned in the call (shows you listened)
- [ ] Include the right assets for their stage:
  - Understand stage: category story, platform overview
  - Trust stage: Trust Center link, relevant domain pack page
  - Demo stage: demo request confirmation, next steps
  - Diligence stage: relevant persona path from `diligence-fast-path-final.md`
  - Design partner stage: design partner offer document

**CRM / pipeline update:**
- [ ] Update pipeline tracker with call notes, stage, next action, expected decision date
- [ ] Set follow-up reminder (3–5 business days if no response expected earlier)

**Qualification review:**
- [ ] After the call, assess: does this prospect meet design partner qualification criteria?
- [ ] Classify: qualified / not yet / no fit
- [ ] If not yet or no fit: document reason and keep or close

**Next meeting:**
- [ ] If call went well: suggest next meeting with specific agenda (technical deep-dive, diligence session, partner agreement review)
- [ ] If ambiguous: send assets appropriate to their stage and propose a 2-week check-in

---

## Follow-Up Email Template

```
Subject: [Company] × SZL Holdings — Next Steps

Hi [Name],

Thank you for [the time today / our conversation]. [One specific reference to something they said or showed about their operations — do not be generic].

Based on what you shared, the most relevant next step would be [specific suggestion tailored to their stage].

I am attaching [specific asset appropriate to their stage].

[If advancing]: I would suggest [specific next meeting type] — can you do [two specific date/time options]?

[If giving them time]: I will follow up on [specific date] to see how your team's thinking has evolved. In the meantime, [specific resource] may be useful.

Best,
[Founder name]
```

**What not to do:**
- Generic follow-up ("Great meeting you! Looking forward to connecting.")
- Multiple attachments without clear direction on what to read
- Ambiguous next step ("Let me know if you have any questions.")

---

*See also: `founder-next-90-days.md` (founder rhythm), `weekly-operating-pack.md` (weekly review structure)*
