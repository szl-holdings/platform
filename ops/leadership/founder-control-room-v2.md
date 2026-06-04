# Founder Control Room v2 — SZL Holdings

**Phase:** H · **Audience:** Founder only (internal) · **Last reviewed:** 2026-04-16  
**Supersedes:** Founder Control Room v1 (early-stage personal tracker)

---

## Purpose

The Founder Control Room is the single weekly dashboard the founder reviews to know whether the company is on track. v2 reflects the design-partner phase reality: pipelines, pilots, proof, product, ops, financials, all on one surface, reviewed every Friday.

Without this, the founder has no single source of truth and runs on impression. With this, the founder makes decisions on evidence.

---

## The Five Control Room Surfaces

```
1. Pipeline       — sourcing, qualification, conversion
2. Pilots         — every active pilot, every metric
3. Proof          — case studies, references, externalizable assets
4. Product        — shipped, in-progress, critical gaps
5. Operations     — financials, runway, hires, legal
```

Each surface has 3-7 metrics, all updated weekly, visible on a single dashboard or in a single document.

---

## Surface 1 — Pipeline

### Metrics (weekly snapshot)

| Metric | Definition | Update source |
|--------|-----------|---------------|
| Active conversations | Buyers in discovery, demo, or diagnosis | CRM / pipeline tracker |
| Sourced this week | New qualified contacts added | CRM / pipeline tracker |
| Discoveries completed this week | First conversation completed | CRM / pipeline tracker |
| Diagnoses signed this week | Joint diagnosis signed | CRM / pipeline tracker |
| Proposals sent this week | Pilot or production proposals | CRM / pipeline tracker |
| Signed this week | Agreements executed | CRM / pipeline tracker |
| 30-day pipeline conversion rate | Sourced → Signed % | Pipeline tracker, rolling 30-day |

### Health indicators
- ✅ Sourced > 5 / week
- ✅ Discoveries > 3 / week
- ✅ Diagnoses > 1 / week
- ✅ Conversion rate > 5% (sourced → signed)

### Failure signals
- ❌ Sourced = 0 for 2+ weeks (sourcing has stalled)
- ❌ Discoveries > 5 but no diagnoses (discovery isn't qualifying well)
- ❌ Diagnoses > 3 but no signings (proposals or close motion is broken)

---

## Surface 2 — Pilots

### Per-pilot dashboard

For every active pilot, weekly snapshot:

| Field | Source |
|-------|--------|
| Pilot name | Pilot tracker |
| Day in pilot (X / 90) | Calendar |
| Last weekly review (date) | Calendar |
| Layer 1 status (platform success) | `pilot-success-criteria.md` metrics |
| Layer 2 status (operational success) | Buyer-shared metrics |
| Layer 3 status (commercial success) | Founder qualitative read |
| Conversion likelihood | Founder estimate (low/med/high) |
| Critical gaps surfaced | Pilot tracker |
| Next milestone | Day 30 / 60 / 75 / 90 |

### Aggregate metrics

| Metric | Definition |
|--------|-----------|
| Active pilots | Currently running |
| Pilots in conversion window | Day 75-90 |
| Pilots converted this quarter | Signed production after pilot |
| Pilots exited this quarter | Did not convert |
| Conversion rate (rolling 4 quarters) | Converted / (Converted + Exited) |

### Health indicators
- ✅ Every active pilot has a weekly review in the last 10 days
- ✅ Conversion rate > 50% (design partner phase) / > 70% (early commercial)
- ✅ All Layer 1 metrics passing across active pilots

### Failure signals
- ❌ A pilot has not had a weekly review in >14 days (relationship cooling)
- ❌ A pilot is at Day 60 with no Layer 2 metrics improvement (will not convert)
- ❌ Conversion rate < 30% (design partner machine needs surgery)

---

## Surface 3 — Proof

### Metrics

| Metric | Source |
|--------|--------|
| Case studies in draft | Pilot tracker |
| Case studies published (anonymized) | Website / case study folder |
| Case studies published (named) | Website / case study folder |
| Reference accounts at Tier 4 (private reference) | Reference portfolio tracker |
| Reference accounts at Tier 5 (public reference) | Reference portfolio tracker |
| Reference calls completed this quarter | Reference portfolio tracker |
| Externalizable proof points produced this quarter | Proof engine output |

### Health indicators
- ✅ At least 1 case study moved from draft → published per quarter
- ✅ Reference portfolio: 5+ Tier 4, 1-2 Tier 5 by Day 365 of commercial motion
- ✅ Every active pilot has at least 3 captured operator quotes

### Failure signals
- ❌ Pilots completed but no case study drafts produced (proof engine not running)
- ❌ Reference accounts going cold (no quarterly check-in)
- ❌ Externalizable assets stale > 90 days

---

## Surface 4 — Product

### Metrics

| Metric | Source |
|--------|--------|
| Bets shipped this cycle | Cycle tracker |
| Bets in-progress | Cycle tracker |
| Critical bugs open (P0/P1) | Bug tracker |
| Critical bugs closed this week | Bug tracker |
| Pilot-surfaced gaps in queue | Product backlog |
| Customer-blocking gaps | Product backlog |
| Roadmap drift (planned vs. actual ship dates) | Cycle tracker |

### Health indicators
- ✅ All P0 bugs closed within 24-48 hours
- ✅ All pilot-blocking gaps in current cycle plan
- ✅ Roadmap drift < 1 cycle
- ✅ At least one pilot-surfaced gap shipped per cycle

### Failure signals
- ❌ P0 bug open > 1 week (user trust at risk)
- ❌ Pilot-blocking gap not in current cycle plan (pilot will stall)
- ❌ Roadmap drift > 2 cycles (planning is broken)

---

## Surface 5 — Operations

### Metrics

| Metric | Source |
|--------|--------|
| Cash on hand | Bank balance |
| Burn rate (monthly) | Last 3-month average |
| Runway (months) | Cash / burn |
| Revenue this quarter | Stripe / contract tracker |
| ARR (annualized) | Contract tracker |
| Net new ARR this quarter | Contract tracker |
| Open hires | Recruiting tracker |
| Critical legal items | Legal tracker (DPAs in flight, contract reviews) |
| Compliance posture | Trust center (SOC 2 prep status, etc.) |

### Health indicators
- ✅ Runway > 12 months (or fundraise plan in motion)
- ✅ Revenue trajectory matches plan ±20%
- ✅ Hires closing within 90 days of opening
- ✅ Critical legal items < 30 days outstanding

### Failure signals
- ❌ Runway < 9 months without active fundraise
- ❌ Revenue < 50% of plan for 2 consecutive quarters
- ❌ Hires open > 120 days (need to re-spec or reach further)
- ❌ Compliance gap surfaced by buyer (SOC 2 etc.) and no plan to close

---

## The Weekly Control Room Review (Friday, 30 minutes)

### Agenda
- 5 min: Pipeline surface — read the metrics, note the trajectory
- 5 min: Pilots surface — every active pilot, status check
- 5 min: Proof surface — what moved this week
- 5 min: Product surface — shipped, blocked, gaps
- 5 min: Operations surface — financial, legal, hires
- 5 min: Decisions — anything that needs a different action next week

### Output
- The Friday weekly note (see `company-operating-rhythm.md`)
- Updates to next week's calendar
- Any explicit course corrections

---

## The Monthly Control Room Deep-Dive (First Monday, 3 hours)

See `company-operating-rhythm.md` Monthly Review. Uses the Control Room as the input.

---

## The Quarterly Control Room Strategic Review (End of Quarter, full day)

See `company-operating-rhythm.md` Quarterly Review. Uses the Control Room trends across 13 weeks as the input.

---

## What v2 Adds (vs. v1)

| Surface | v1 | v2 |
|---------|----|----|
| Pipeline | Vague "active conversations" | Conversion rate, weekly velocity |
| Pilots | List | Per-pilot 3-layer status + conversion estimate |
| Proof | Not tracked | Explicit reference portfolio + case study pipeline |
| Product | Bug count | Cycle tracker + roadmap drift |
| Operations | Cash | Revenue, hires, compliance, legal |

v2 is what the company needs at the design partner phase and through early commercial. v3 will add: customer success metrics (NPS, expansion rate, churn), team health (1-on-1 cadence, hire velocity), and ecosystem signals (developer adoption, partner channel performance) — but only when those become real.

---

## Tools

The Control Room can run on:
- **Notion / Linear / Coda** — best for early-stage; one page per surface
- **Spreadsheet** — fastest to set up; sufficient through 5 pilots
- **Custom dashboard** — premature before there are 10+ pilots / customers

Pick the tool that the founder will actually update weekly. The right tool is the one that gets used.

---

## Anti-Patterns

- **Building the dashboard but never reviewing it.** The Friday review is the point.
- **Too many metrics.** 30 metrics → none of them are tracked. 3-7 per surface, max.
- **Vanity metrics.** Pageviews, GitHub stars, social followers — none of these belong in the Control Room.
- **Lagging metrics only.** Revenue is lagging. Pipeline conversion is leading. Track both.
- **Hiding bad numbers.** The Control Room is for the founder, not for investors. Honest is the only useful version.

---

*The Control Room is the founder's instrument panel. It tells the truth about the company in 30 minutes a week. Build it, run it, and let it drive the decisions.*
