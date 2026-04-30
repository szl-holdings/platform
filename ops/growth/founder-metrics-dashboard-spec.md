# Founder Metrics Dashboard Spec

Last updated: 2026-04-16

## Purpose

A single-screen dashboard the founder reviews daily to understand web conversion health, demo pipeline, and platform growth signals. This is the operating instrument for growth — not a vanity metrics board.

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  FOUNDER COMMAND — Web & Conversion Metrics     [Last 7d ▼] │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│  Site Visits│  Demo Reqs  │  Conversion │   Top Referrers   │
│    1,240    │     18      │    1.45%    │  linkedin: 42%    │
│   +12% WoW  │   +3 WoW   │  +0.2% WoW  │  direct:   28%    │
│             │             │             │  google:   18%    │
├─────────────┴─────────────┴─────────────┴───────────────────┤
│                     FUNNEL BREAKDOWN                        │
│  Landing → Solution page → Demo page → Form Submit → Done  │
│    1,240       640 (52%)     210 (17%)    68 (5.5%)  18 (1.5%) │
├──────────────────────────────┬──────────────────────────────┤
│    DEMO REQUESTS THIS WEEK   │     WEB VITALS (p75)         │
│  ┌────────────────────────┐  │  LCP:  1.8s  ✓              │
│  │ Counsel    6     │  │  INP:  140ms ✓              │
│  │ Vessels          4     │  │  CLS:  0.08  ✓              │
│  │ Terra            3     │  │  TTI:  2.1s  ✓              │
│  │ Aegis            3     │  │                             │
│  │ Other            2     │  │  Sentry Error Rate: 0.2%   │
│  └────────────────────────┘  │  API p95 Latency: 340ms    │
├──────────────────────────────┴──────────────────────────────┤
│                   TOP CONTENT THIS WEEK                     │
│  1. /platform         540 views    2. /demo        210     │
│  3. /solutions        480 views    4. /trust       160     │
│  5. /insights         340 views    6. /pricing     140     │
├─────────────────────────────────────────────────────────────┤
│  INVESTOR FUNNEL      Visits: 120  Deck Views: 24  Inquiries: 3 │
└─────────────────────────────────────────────────────────────┘
```

---

## Metrics Definitions

### Primary KPIs

| Metric | Definition | Source | Target |
|--------|-----------|--------|--------|
| Site Visits | Unique visitors, 7-day rolling | Plausible | Growing WoW |
| Demo Requests | Form submissions to `/api/holdings/inquiries` with type=demo | DB `inquiries` table | ≥ 10/week at stage |
| Visit→Demo Conv. | `demo_requests / site_visits` | Calculated | > 1.5% |
| Demo→Meeting Conv. | Meetings booked / demo requests | Notion pipeline | > 40% |
| Top Referrers | Sessions by source | Plausible | LinkedIn > 30% |

### Secondary KPIs

| Metric | Definition | Source |
|--------|-----------|--------|
| Solution Page Depth | % of visitors reaching `/solutions/*` | Plausible |
| Pricing Page Visits | Sessions on `/pricing` | Plausible |
| Investor Deck Views | Clicks on data room or deck links | Plausible event |
| Newsletter Signups | Form completions | DB `newsletter_subscriptions` |
| Scroll Depth ≥ 50% | % of sessions with 50%+ scroll on homepage | Analytics event |

### Funnel Stage Definitions

```
Stage         Page                    Metric          Event
─────────────────────────────────────────────────────────────
Acquisition   Any page                Site visit      page_view
Interest      /solutions, /platform   Product view    page_view (filtered)
              /lyte, /alloy-fabric
Intent        /demo, /pricing         Demo page view  page_view (filtered)
Conversion    Demo form submit        Demo request    demo_request + form_submit
Activation    Meeting booked          Demo scheduled  (CRM → Notion)
Revenue       Contract signed         Closed won      (CRM → Notion)
```

### Platform Health Signals (Context for Founder)

| Signal | Source | Alert if |
|--------|--------|---------|
| API Error Rate | OTEL / pino-http | > 1% |
| API p95 Latency | OTEL | > 750ms |
| Sentry Error Volume | Sentry | > 50 new errors/day |
| LCP p75 | Web Vitals RUM | > 2.5s |
| Active Demo Requests (unresponded) | DB `inquiries` table | > 48h unresponded |

---

## Implementation Path

### Phase 1: Internal Admin Page (Immediate)

Add a `/admin/growth-command` page in `szl-holdings` that:
1. Queries `SELECT COUNT(*) FROM inquiries WHERE created_at > NOW() - INTERVAL '7 days' AND type = 'demo'` via existing API
2. Embeds Plausible dashboard in iframe (using Plausible shared link)
3. Shows API health metrics from `/api/health/detailed`
4. Lists recent unresponded inquiries from DB

**Files to create**:
- `artifacts/szl-holdings/src/pages/admin-growth-command.tsx`
- `artifacts/api-server/src/routes/groups/core/admin-growth.ts` (if new endpoint needed)

### Phase 2: Plausible Goals

Set up Plausible goals for:
- `demo_request` — primary conversion goal
- `form_submit` — secondary goal
- `pricing_viewed` — intent signal

### Phase 3: Full Dashboard (Q2 2026)

Connect Notion CRM pipeline data → real-time pipeline visibility in the admin page.

---

## Review Cadence

| Review | Frequency | Action |
|--------|-----------|--------|
| Founder daily check | Daily (5 min) | Review demo queue, unresponded inquiries |
| Conversion review | Weekly | Funnel % vs. prior week |
| Content performance | Weekly | Top pages, top referrers |
| Full growth review | Monthly | Cohort analysis, channel attribution |
