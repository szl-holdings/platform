# Weekly Operating Pack

**Owner:** Founder  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This pack is run every Monday. It gives you a structured 60-minute review that covers everything you need to know to operate the company with confidence for the next 7 days. Fill in the Current Status column each week.

---

## Section 1 — Platform Health (15 min)

### API & Infrastructure

| Check | Target | Current Status | Action Needed |
|-------|--------|---------------|---------------|
| `/api/health/live` | 200 | | |
| `/api/health/ready` | 200 + DB connected | | |
| DB latency (P95) | < 100ms | | |
| API P95 latency | < 500ms | | |
| API error rate (7-day avg) | < 1% | | |
| Uptime (7-day window) | > 99.9% | | |

### Web Apps

| App | Loads Without Error | Last Tested | Notes |
|-----|-------------------|-------------|-------|
| SZL Holdings (`/`) | | | |
| Aegis (`/aegis/`) | | | |
| Terra (`/terra/`) | | | |
| Vessels (`/vessels/`) | | | |
| Carlota Jo (`/carlota-jo/`) | | | |
| Command (`/command/`) | | | |

### Incidents (Past 7 Days)

| Date | Severity | Description | Resolution | Duration |
|------|----------|-------------|------------|----------|
| | | | | |
| | | | | |

**Weekly Incident Summary:** _(0 incidents / X incidents — brief summary)_

### Security & Dependencies

| Check | Status | Notes |
|-------|--------|-------|
| `pnpm audit --audit-level high` | Pass / Fail | |
| New secrets exposed (scan) | None / Issue | |
| Credential rotation due | Yes / No | |
| Any new CVEs in critical deps | None / Issue | |

---

## Section 2 — Revenue & Pipeline (20 min)

### Deal Stage Summary

| Stage | Count | Change vs Last Week | Notes |
|-------|-------|---------------------|-------|
| Prospect (identified) | | | |
| Outreach sent | | | |
| Demo scheduled | | | |
| Demo completed | | | |
| Proposal / pilot in discussion | | | |
| Active pilot | | | |
| Closed won (paying customer) | | | |
| Closed lost | | | |

### Top 5 Active Deals

| Company | Contact | Stage | Next Action | Due |
|---------|---------|-------|-------------|-----|
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

### Demos (Past 7 Days)

| Date | Company | Attendees | Outcome | Follow-up Sent? |
|------|---------|-----------|---------|-----------------|
| | | | | |
| | | | | |

**This Week Target:** _____ demos scheduled / _____ demos delivered

### Revenue Metrics

| Metric | This Week | Last Week | Trend |
|--------|-----------|-----------|-------|
| ARR ($) | | | |
| Pipeline value ($) | | | |
| Pilots active | | | |
| Design partners signed | | | |

---

## Section 3 — Product Velocity (10 min)

### What Shipped Last Week

| Item | Type | Status | Notes |
|------|------|--------|-------|
| | Feature / Fix / Infra | Released / In Progress | |
| | | | |
| | | | |

### What Ships This Week (Planned)

| Item | Type | Owner | Priority |
|------|------|-------|----------|
| | | Founder | P0 / P1 / P2 |
| | | | |
| | | | |

### Technical Debt & Gaps

| Item | Severity | Assigned | Target Week |
|------|----------|----------|-------------|
| Zod validation (remaining routes) | Medium | | |
| Vessels + Firestorm integration tests (POST paths) | Medium | | |
| Firebase credentials for CORTEX mobile | High | | |
| EAS project linking for CORTEX mobile | High | | |
| Application Insights / OTLP wiring | Low | | |
| | | | |

---

## Section 4 — This Week's Top 3 Priorities (15 min)

Fill in at the start of each week. Limit to 3. If you have more than 3, you don't have priorities — you have a list.

| # | Priority | Why It Matters This Week | Done When |
|---|----------|------------------------|-----------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

### Blockers

| Blocker | Blocked On | Unblocking Action |
|---------|-----------|-------------------|
| | | |
| | | |

---

## Section 5 — Founder Wellbeing Check (2 min)

Burn rate and founder health are equally real operational risks.

| Question | Answer |
|----------|--------|
| Energy level (1–10) | |
| Am I doing the highest-leverage work? | Yes / No — if No, what's taking time instead? |
| What will I say No to this week? | |
| What do I need that I don't have? | |

---

## Weekly Pack Archive

Store completed packs in `ops/cto/weekly-packs/YYYY-MM-DD.md` using this template as the base.

---

*See also: `ops/cto/founder-next-90-days.md` · `ops/cto/next-15-actions.md` · `ops/cto/go-live-readiness-verdict.md`*
