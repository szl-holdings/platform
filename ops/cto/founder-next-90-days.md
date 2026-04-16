# Founder — Next 90 Days Operating Rhythm

**Owner:** Founder  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This document defines the recurring operational cadence for the first 90 days after launch. It tells you exactly what to do, when to do it, and how long each activity takes. The goal is to prevent both under-management (missing signals) and over-management (thrashing).

The first 90 days have three distinct phases:

| Phase | Days | Focus |
|-------|------|-------|
| Phase 1 — Stabilize | Days 1–30 | Health, reliability, first buyer |
| Phase 2 — Sell | Days 31–60 | Pipeline, demo volume, pilot conversion |
| Phase 3 — Prove | Days 61–90 | Pilot success, case study, funding narrative |

---

## Daily Rhythm (Every Weekday, ~30 min)

**Morning (first 15 min of the day)**

1. Check `/api/health/detailed` — confirm all systems healthy
2. Scan Replit deployment logs — look for error spikes or restarts
3. Check Slack `#ops-alerts` — clear or action any overnight alerts
4. Review support inbox (inquiries@szlholdings.com) — respond to any inbound within 24h

**End of Day (last 15 min)**

1. Update CRM / lead tracker: any buyer conversations advanced today?
2. Note any technical issues to queue for next sprint
3. Confirm no active incidents

---

## Weekly Rhythm

### Every Monday — Weekly Review (60 min)

Run the full Weekly Operating Pack (`ops/cto/weekly-operating-pack.md`). This is your operational heartbeat.

**Agenda:**
1. Platform health review (15 min) — uptime, error rates, latency, incidents
2. Revenue & pipeline review (20 min) — deals, demos scheduled, pilots active
3. Product velocity review (10 min) — what shipped last week, what's next
4. Priorities for the week (15 min) — confirm top 3 actions, clear blockers

**Output:** Updated priorities doc, any new actions added to `ops/cto/next-15-actions.md`

### Every Wednesday — Demo or Prospect Outreach (90 min)

Dedicate 90 minutes to active selling:
- Run 1–2 demos (or outreach if no demos booked)
- Follow up on all open buyer conversations older than 48 hours
- Update lead tracker

### Every Friday — Release Review & Week Close (30 min)

1. Review any releases this week — confirm `ops/cto/release-log.md` is current
2. Run smoke test if any deployment occurred
3. Close the week: write 3 sentences in your operating journal: What worked? What didn't? What's the one priority for Monday?

---

## Biweekly Rhythm

### Every Two Weeks — Investor Touchpoint (30 min per investor)

- Send brief update email or voice memo to active investors
- Format: 3 bullets — Progress, Pipeline, Ask
- Update investor overview docs if anything material has changed
- Review `docs/investor/investor-overview.md` for accuracy

### Every Two Weeks — Technical Debt Review (45 min)

- Review open `🟡 Partial` items from `ops/frontier/launch-readiness-scorecard.md`
- Prioritize one item to close in the next two weeks
- Review dependency audit output — check for new high/critical vulnerabilities
- Review any CI failures from the past two weeks

---

## Monthly Rhythm

### Month-End Review (2 hours)

**Metrics Review**
- [ ] Total demos delivered this month
- [ ] Pilots active / converted / lost
- [ ] Revenue: ARR or pipeline value change
- [ ] Platform uptime: target 99.9% (< 43 min downtime)
- [ ] Error rate trend: is it improving or degrading?
- [ ] P95 latency trend

**Document Updates**
- [ ] `docs/investor/product-readiness.md` — update to reflect what is live
- [ ] `docs/investor/investor-overview.md` — update pipeline and progress
- [ ] `ops/cto/market-readiness-scorecard.md` — re-score any dimensions that changed
- [ ] Rotate credentials if 90-day rotation is due

**Planning**
- [ ] Define top 5 product priorities for next month
- [ ] Confirm budget and burn rate against plan
- [ ] Review hiring plan (if applicable)

---

## Phase-Specific Priorities

### Days 1–30: Stabilize

Primary objective: achieve and maintain platform stability. No regressions.

| Week | Priority |
|------|----------|
| Week 1 | Verify all go-live sequence phases complete; post-deploy smoke tests green |
| Week 2 | First external demo to a qualified prospect; follow-up executed same day |
| Week 3 | Close first design partner conversation or pilot agreement |
| Week 4 | Platform stable 30 days; no SEV-1 incidents; week-1 30-day review |

### Days 31–60: Sell

Primary objective: fill the demo pipeline and convert one pilot.

| Week | Priority |
|------|----------|
| Week 5 | 3+ demos per week; update pitch based on Week 1–4 feedback |
| Week 6 | Close first paid pilot or design partner agreement |
| Week 7 | Pilot kickoff — onboard first customer to production environment |
| Week 8 | First pilot check-in; document pilot success criteria status |

### Days 61–90: Prove

Primary objective: complete first pilot successfully; build case study; advance fundraising.

| Week | Priority |
|------|----------|
| Week 9 | Pilot mid-point review — are success criteria on track? |
| Week 10 | Begin drafting case study from pilot outcomes |
| Week 11 | Pilot conclusion — collect testimonial and outcome data |
| Week 12 | 90-day review; update investor narrative; plan Day 91–180 |

---

## 90-Day Success Criteria

At Day 90, the following should be true:

- [ ] Platform has maintained 99%+ uptime for 90 consecutive days
- [ ] At least 10 qualified prospects have received a live demo
- [ ] At least 1 paid pilot or design partner agreement is signed and in progress
- [ ] At least 1 pilot outcome story is documented (case study or progress notes)
- [ ] All `🔴 Blocking` items from the launch readiness scorecard are resolved
- [ ] Investor update sent at least monthly with meaningful progress metrics
- [ ] Credential rotation schedule is current (90-day secrets rotated)

---

*See also: `ops/cto/weekly-operating-pack.md` · `ops/cto/next-15-actions.md` · `ops/cto/founder-launch-kit.md`*
