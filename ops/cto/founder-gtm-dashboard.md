# Founder GTM Dashboard — Spec
Generated: 2026-04-16

## Purpose
A spec for the founder-facing GTM dashboard — the single view that lets the founding team track commercial progress from site traffic to partner activation. This is a spec, not an implementation. It defines what to measure, how to structure the view, and what signals matter most at the design-partner stage.

---

## Dashboard Philosophy

At the design-partner stage, we are not optimizing for volume. We are tracking signal quality. The dashboard should answer one question at a glance:

> "Is our commercial motion working — are the right people finding us, trusting us, and taking action?"

Every metric on this dashboard should be actionable. If a number can't change founder behavior, it doesn't belong.

---

## Dashboard Sections

### Section 1: Traffic Overview

**Refresh:** Daily  
**Lookback:** 7-day rolling + 30-day trend

| Metric | Description | Target (Design-Partner Stage) |
|--------|-------------|-------------------------------|
| Unique visitors | Deduplicated site visits | Directional growth; 50–200/week is healthy |
| Sessions | Total visits including return | Session:visitor ratio > 1.3 indicates re-engagement |
| Top referral sources | Where visitors come from | ≥ 30% from named/targeted referrals |
| Geography | Country / region breakdown | Focus on US, UK, EU initially |
| Device type | Desktop vs. mobile | Desktop should dominate (B2B buyer pattern) |
| First-visit vs. return | New vs. returning visitors | Rising return % = trust building |

**Data source:** PostHog page view capture + referrer attribution

---

### Section 2: Trust Engagement

**Refresh:** Daily  
**Purpose:** Are high-intent visitors reaching the content that builds conviction?

| Metric | Description | Signal |
|--------|-------------|--------|
| Trust Center visits | `/trust` and sub-pages | High-intent B2B buyers validate security |
| Architecture page visits | `/architecture` | Technical evaluators in diligence mode |
| Case study views | `/case-studies` | Social proof seeking; near-decision |
| Company/leadership views | `/company` | Founder credibility check |
| Trust engagement rate | % of sessions that hit a trust page | Target: ≥ 15% |
| Avg scroll depth on trust pages | How far do they read? | < 30% scroll = headline-only visit |

**Data source:** PostHog event capture (`trust_center_viewed`, `architecture_page_viewed`, scroll events)

---

### Section 3: Demo Intent

**Refresh:** Real-time  
**Purpose:** Track the primary conversion signal.

| Metric | Description | Target |
|--------|-------------|--------|
| Demo page visits | `/demo` page loads | Growing week-over-week |
| Demo form starts | First field focused | ≥ 40% of demo page visitors |
| Demo requests submitted | Successful form submits | Primary KPI; every one matters |
| Demo form conversion rate | Submits / page views | Target: ≥ 20% at design-partner stage |
| Demo requests by referral source | Where do demo requests come from | Identifies highest-quality traffic sources |
| Time from landing to demo submit | Sessions that convert — how fast | Shorter = stronger product-market fit signal |

**Data source:** Server-side event on `/api/demo/submit` success + PostHog form events

---

### Section 4: Partner Interest

**Refresh:** Real-time  
**Purpose:** Track design-partner-specific signal separately from general demo intent.

| Metric | Description | Target |
|--------|-------------|--------|
| Design partner page visits | `/design-partner` | Growing as word spreads |
| Partner CTA clicks | "Apply" / "Get in touch" clicks | ≥ 30% of design partner page visitors |
| Partner contact submissions | Form submits tagged as `type: "partner"` | Every one is a potential pilot |
| Partner page → contact submit rate | Conversion on the partner path | Target: ≥ 25% |
| Partner leads in pipeline | Manual count: qualified / in diligence / active | Primary commercial health metric |
| Active pilot count | Partners in active pilot today | Target: 3–5 by end of first 90-day cohort |

**Data source:** Server-side contact submit events + manual pipeline tracking

---

### Section 5: Conversion Rate & Activation

**Refresh:** Weekly  
**Purpose:** Summarize the health of the full funnel.

| Metric | Formula | Target |
|--------|---------|--------|
| Visit-to-trust rate | Trust page visits / total sessions | ≥ 15% |
| Visit-to-demo rate | Demo page visits / total sessions | ≥ 8% |
| Demo-to-submit rate | Demo submits / demo page visits | ≥ 20% |
| Contact-to-qualified rate | Qualified leads / contact submits | ≥ 40% (design-partner stage) |
| Qualified-to-pilot rate | Active pilots / qualified leads | ≥ 50% |
| Pilot-to-convert rate | Converted partners / completed pilots | Target: ≥ 60% by end of first cohort |

---

### Section 6: Activation Signals

**Refresh:** Weekly  
**Purpose:** Are active design partners actually using the platform?

| Metric | Description | Target |
|--------|-------------|--------|
| Weekly active pilot sessions | Sessions from known partner users | ≥ 3 per partner per week |
| Signal events surfaced | Lyte events shown to partner users | Growing week-over-week per partner |
| Alloy actions routed | Actions sent through Alloy | ≥ 1 per partner per week by Week 2 |
| Proof chain entries | Audit entries generated | Measures depth of operational engagement |
| Reviews completed on schedule | % of weekly reviews held on time | ≥ 90% |
| Partner NPS (manual, Week 4 + 8) | Self-reported satisfaction score | ≥ 7/10 average |

**Data source:** Platform analytics (internal) + manual review log

---

## Dashboard Layout (Wireframe Spec)

```
┌─────────────────────────────────────────────────────────────┐
│ SZL GTM Dashboard                            Week of Apr 14  │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Visitors     │ Trust Eng.   │ Demo Submits │ Active Pilots  │
│ [7d]         │ Rate [7d]    │ [7d]         │ [now]          │
│ ██ 147       │ ██ 18%       │ ██ 4         │ ██ 2           │
│ ↑ 12% vs lw  │ ↑ 3% vs lw  │ → same lw    │ ↑ 1 vs lw     │
├──────────────┴──────────────┴──────────────┴────────────────┤
│ FUNNEL SUMMARY                                               │
│ Visit → Trust: 18%   Trust → Demo: 22%   Demo → Submit: 24% │
├──────────────────────────────────────────────────────────────┤
│ DEMO REQUESTS (last 7 days)                                  │
│ [Table: Date | Org | Role | Domain Interest | Source]        │
├──────────────────────────────────────────────────────────────┤
│ PARTNER PIPELINE                                             │
│ [Table: Name | Stage | Pilot Day | Health | Last Review]     │
├──────────────────────────────────────────────────────────────┤
│ TOP TRAFFIC SOURCES          │ TRUST PAGE PERFORMANCE        │
│ [Bar: referrer, sessions]    │ [Bar: page, scroll depth]     │
└──────────────────────────────┴──────────────────────────────┘
```

---

## Alerts & Triggers

The following should trigger a founder notification (Slack DM or email):

| Trigger | Condition | Action |
|---------|-----------|--------|
| Demo request submitted | Any new submission | Immediate notification; review within 2 hours |
| Partner contact submitted | Any new partner-tagged submission | Immediate notification; qualify within 24 hours |
| Visit spike | > 2x normal weekly traffic | Investigate referral source |
| Demo form dropout spike | Conversion rate drops > 10% vs prior week | Review form for issues |
| Partner goes dark | No login from partner user for 7 days | Proactive check-in |

---

## Implementation Notes (for when this is built)

- **Data sources:** PostHog (behavior), server-side API events (commercial), manual pipeline log (partner tracking)
- **Recommended stack:** PostHog dashboards for behavior metrics; simple internal admin page (or Notion table) for partner pipeline
- **Do not:** Build a custom dashboard before you have 30 days of real data — use PostHog's built-in funnel and retention tools first
- **Access:** Founder-only; this is not a shared team dashboard

---

## Version History
- 2026-04-16: Initial draft, CTO Pass Phase G
