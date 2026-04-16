# Founder's Next 10 Actions

**Last updated:** April 2026
**Purpose:** Prioritized action list for the founder to execute in the next 30 days

---

## The 10 Actions (In Order)

### 1. Run the Decision Theater Demo for Yourself (Day 1)
Open `/core` → Decision Theater tab. Watch the full nine-step loop. Note any rough edges. This is the investor demo — own it.

### 2. Create the GitHub Release v0.2.0 (Day 1-2)
Tag the current main branch as v0.2.0 with substantive release notes. Investors look at release history. A clean release with "Governed Decision Infrastructure — Decision Theater, six platform primitives, nine-step canonical loop" is a signal of engineering discipline.

### 3. Rotate Production Secrets (Day 2)
- Generate unique FIELD_ENCRYPTION_KEY for production
- Generate unique SESSION_SECRET for production
- Rotate ALLOY_INTERNAL_TOKEN
- Verify no dev fallback secrets are active in production

### 4. Build CORTEX on a Physical Device (Day 3-5)
Run `eas build --platform ios --profile development`. Install on your iPhone. Test biometric login. Test one domain workspace. This is the "it's real" moment for investor meetings.

### 5. Prepare the Pitch Deck (Day 5-10)
Use the benchmark research as source material:
- Slide 1: Problem (AI accountability gap)
- Slide 2: Category (Governed Decision Infrastructure)
- Slide 3: Product (nine-step loop visualization)
- Slide 4: Demo (screenshot of Decision Theater)
- Slide 5: Market ($16.3B → $50.1B, 24.7% CAGR)
- Slide 6: Differentiation (competitive feature matrix from market-delta.md)
- Slide 7: Business model (platform + domain pack pricing)
- Slide 8: Team
- Slide 9: Ask

### 6. Set Up the Trust Center Page (Day 7-10)
The `/trust` page on the flagship site should show:
- Security posture summary
- Encryption standards
- Open-source governance primitives (GitHub links)
- Compliance roadmap (SOC 2 target timeline)

Investors check this. Vanta proved that trust centers accelerate enterprise sales.

### 7. Draft the Investor Update Template (Day 10)
Start monthly investor updates now — before you have investors. The discipline signals maturity. Template: what happened, what's next, what I need help with, key metrics.

### 8. Identify 20 Target Investors (Day 10-15)
Focus on:
- Firms that invest in enterprise infrastructure (not consumer)
- Firms that have invested in decision intelligence / compliance / AI governance
- Firms that understand defense + commercial crossover
- Partners who have written about "boring" enterprise infrastructure

### 9. Schedule 3 Practice Pitches (Day 15-20)
Pitch to advisors, friendly founders, or angel investors before approaching Series A leads. Use the Decision Theater as the demo — not slides.

### 10. Publish Governance Primitives as Open Source (Day 20-30)
Open-source `lib/proof-chain/`, `lib/covenant-policy/`, `lib/monte-carlo/`, `lib/prism-bus/`, `lib/outcome-graph/` on GitHub. This is the strongest trust signal: the architecture is real, auditable, and open.

---

## 30-Day Calendar View

| Week | Actions |
|------|---------|
| Week 1 | Demo walkthrough (#1), GitHub release (#2), secret rotation (#3) |
| Week 2 | CORTEX build (#4), pitch deck start (#5), trust center (#6) |
| Week 3 | Pitch deck finish (#5), investor update template (#7), target list (#8) |
| Week 4 | Practice pitches (#9), open-source governance (#10) |

---

## Success Metrics (End of 30 Days)

| Metric | Target |
|--------|--------|
| GitHub release published | v0.2.0 live |
| CORTEX installable on physical device | Yes |
| Pitch deck complete | 9 slides, practiced 3x |
| Trust center live | /trust page accessible |
| Investor target list | 20 firms identified |
| Practice pitches completed | 3 |
| Open-source governance repos | 5 libs published |
