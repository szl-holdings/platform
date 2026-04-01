# SZL Holdings — Next 30 Days

**Date:** April 2026  
**Context:** Post-hardening action plan. The platform is now investor-grade and public-credibility-ready. These are the highest-leverage actions for the next 30 days.

---

## Week 1: Complete the GitHub Surface

**Goal:** Every public touchpoint is polished and consistent.

- [ ] Execute all items in `docs/final/manual-actions-remaining.md`
  - Repository settings, description, topics, homepage
  - Release v0.1.0 created and published
  - Issue labels bootstrapped
  - Profile README repository created and populated
  - GitHub profile settings updated
- [ ] Push mirror to GitHub: verify master branch is current
- [ ] Run `scripts/public-mirror/validate-mirror.sh` — confirm clean pass
- [ ] Take final screenshot pass: verify all 7 platform screenshots are current
- [ ] Update LinkedIn profile with current platform status and flagship repo link

**Outcome:** GitHub profile and repository are investor-grade. Ready for any cold outbound or warm intro review.

---

## Week 2: First Investor Outreach Push

**Goal:** Begin converting the documentation into investor conversations.

- [ ] Identify 10 target investors (focus on pre-seed / seed in enterprise SaaS, vertical AI, maritime tech)
- [ ] Prepare a 3-sentence cold outreach message pointing to the GitHub repo and szlholdings.com
- [ ] Prepare a 90-second async demo video or live demo flow using the hardening materials as the guide
  - Start: SZL Holdings corporate site
  - Then: Lyte PRISM dashboard (5 minutes)
  - Then: Vessels fleet command (3 minutes)
  - Then: Aegis SOC dashboard (3 minutes)
  - Finish: GitHub repo documentation suite
- [ ] Send to first 5 investors

---

## Week 3: Design Partner Program

**Goal:** Define and launch the design partner program for Lyte.

- [ ] Draft design partner offer:
  - 90-day pilot access
  - Direct founder availability (weekly call)
  - Custom integration support for one connector
  - In exchange for: honest feedback, testimonial if positive, reference intro if valuable
- [ ] Identify 5 target design partners for Lyte (operations-led companies, 50–500 employees)
- [ ] Reach out to at least 3 design partner candidates
- [ ] Configure first Stripe product + price ID for Lyte pilot (even if not immediately billed)

---

## Week 4: Live Data Activation

**Goal:** Move at least one platform from seeded data to live data.

**Option A: Vessels (highest investor impact)**
- Subscribe to an AIS data provider (MarineTraffic API: ~$300/month for basic access)
- Wire up the live AIS endpoint to Vessels fleet dashboard
- Change DEMO badge to LIVE on vessels dashboard
- Capture new screenshot showing live vessel positions

**Option B: Lyte (highest commercial impact)**
- Activate one live connector (Jira, Salesforce, or Google Workspace)
- Connect one test organization's data
- Validate PRISM signal flow with real operational data
- Document as a case study in `docs/investor/`

**Option C: Terra (already partially live)**
- Validate NYC Open Data pipeline is refreshing on schedule
- Add data freshness indicator to property map
- Document data coverage and update cadence

---

## Ongoing: Content and Credibility

**LinkedIn cadence (once per week):**
- Week 1: Platform overview post — "What SZL Holdings builds and why"
- Week 2: Technical post — "How Lyte's PRISM framework works" (link to architecture docs)
- Week 3: Founder narrative — "Why I built Business Observability as a platform, not a product"
- Week 4: Product showcase — Vessels fleet command (with screenshot/video)

**GitHub activity:**
- Commit at least once per week (even documentation improvements keep the activity graph active)
- Every commit to master should be worth making — no noise commits

---

## 30-Day Success Metrics

| Metric | Target |
|--------|--------|
| GitHub repository has v0.1.0 release | ✅ Done |
| GitHub profile is investor-grade | ✅ Done |
| Profile README populated | Done in Week 1 |
| Investor outreach started | 5 messages sent by end of Week 2 |
| Design partner conversations | 2 active conversations by end of Week 3 |
| Live data in at least one platform | Done by end of Week 4 |
| LinkedIn posts | 4 published |

---

## The Priority Stack

If bandwidth is limited, the priority order is:

1. **Complete GitHub surface** (Week 1) — One-time setup that pays permanent dividends
2. **Live AIS data** (Week 4) — Highest single credibility multiplier for Vessels
3. **Investor outreach** (Week 2) — Revenue eventually comes from conversations
4. **Design partner program** (Week 3) — First customer is the most important milestone

Everything else can wait.
