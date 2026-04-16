# Founder's Next 10 Actions — Series A Readiness

**Date:** April 16, 2026
**Purpose:** The prioritized, actionable, concrete list of what the founder must do in the next 30 days to close the gap between current state and investor-ready launch. These are ordered by urgency and blocking dependencies.

---

## The 10 Actions

### Action 1: Rotate Production Secrets (Day 1 — 2 hours)

**Why this is first:** A demo platform running with default or shared secrets is a security liability. If this is ever discovered in diligence, it ends the conversation.

**Exactly what to do:**
1. Generate a new `FIELD_ENCRYPTION_KEY`: `openssl rand -hex 32`
2. Generate a new `SESSION_SECRET`: `openssl rand -hex 64`
3. Rotate `ALLOY_INTERNAL_TOKEN`: generate a new UUID or random hex
4. Update each secret in the Replit environment secrets manager (not in code)
5. Restart the API server and confirm it boots cleanly
6. Search the codebase for any hardcoded fallback values: `grep -r "fallback\|default.*secret\|development.*key" artifacts/api-server/src/`

**Done when:** All three secrets are unique values in production environment; no dev fallbacks are present in deployed code.

---

### Action 2: Publish GitHub Release v0.2.0 (Day 1–2 — 2 hours)

**Why this matters:** Investors look at GitHub. A repository with no releases looks abandoned. A clean, substantive release demonstrates engineering discipline and velocity.

**Exactly what to do:**
1. Go to github.com → [your repo] → Releases → Draft a new release
2. Tag: `v0.2.0` on `main`
3. Title: `v0.2.0 — Governed Decision Infrastructure: Full Platform Release`
4. Release notes should cover:
   - Aegis: 8 advanced security modules added (OT/ICS, OSINT, Dark Web, SIGINT, Behavioral, Counterintelligence, Quantum, AI Threat Hunter)
   - Vessels: Commercial intelligence modules added (S&P, Demurrage, Freight, Voyage P&L)
   - Command: Unified ops surface (merged Lyte + IMPERIUM)
   - CORTEX Mobile: Biometric auth, offline sync, voice commands, push notification framework
   - Infrastructure: Automated daily backups, health monitoring, Azure Bicep IaC
   - Cleanup: 5 stale artifacts archived; canonical source map written
5. Publish release

**Done when:** v0.2.0 appears on the GitHub Releases page with substantive notes.

---

### Action 3: Create Apple Developer and Google Play Accounts (Day 2 — 2 hours)

**Why this blocks everything:** You cannot build CORTEX for distribution or demonstrate it on a physical device to investors without these accounts. This is a single founder action that unblocks all mobile work.

**Exactly what to do:**
1. Apple Developer Program: developer.apple.com → Enroll → Individual ($99/year)
2. App Store Connect: Create a new app record for CORTEX (bundle ID: `com.szlholdings.executive.mobile`)
3. Google Play Console: play.google.com/console → Create account ($25 one-time)
4. Create a Play Console app record for CORTEX
5. Create a Firebase project at console.firebase.google.com → Download service account JSON → Store as `FIREBASE_SERVICE_ACCOUNT_JSON` in secrets

**Done when:** Both developer accounts are active, both app records exist, Firebase project is created.

---

### Action 4: Build and Install CORTEX on a Physical Device (Day 3–5 — 3 hours)

**Why this is P0:** "We have a mobile app" is not the same as showing an investor a working app on your phone. The physical device demo is the "it's real" moment.

**Exactly what to do:**
1. Install EAS CLI: `pnpm add -g eas-cli`
2. In `artifacts/szl-holdings-mobile/`: `eas login` with your Expo account
3. Run: `eas build --platform ios --profile development`
4. Download the build and install via TestFlight or direct device install
5. Test: biometric login, navigate to Aegis workspace, navigate to Vessels workspace
6. Run the same for Android: `eas build --platform android --profile development`

**Done when:** CORTEX is installed and running on your iPhone (or Android device). You have demoed biometric login and at least two domain workspaces.

---

### Action 5: Configure Quick-Win API Credentials (Day 5 — 3 hours)

**Why now:** Three services are fully built and will activate immediately with a single credential. Each one makes the demo materially better for investors.

**Exactly what to do:**

**Mapbox (Terra + Vessels maps):**
1. Create account at mapbox.com
2. Generate public access token
3. Set `MAPBOX_ACCESS_TOKEN` in Replit secrets
4. Restart affected apps; confirm maps render with real tiles

**Stripe (billing infrastructure):**
1. Log into stripe.com (or create account)
2. Go to Developers → API Keys → copy Secret key
3. Set `STRIPE_SECRET_KEY` in Replit secrets
4. Set `STRIPE_WEBHOOK_SECRET` (from Stripe webhooks dashboard)
5. Billing infrastructure is now active — you can accept payments

**Email (Resend):**
1. Create account at resend.com
2. Generate API key
3. Set `RESEND_API_KEY` in Replit secrets
4. Email notification dispatch is now active

**Done when:** Mapbox maps render real tiles in Terra and Vessels. Stripe dashboard shows your API key as active. Email dispatches reach your inbox.

---

### Action 6: Prepare the Series A Pitch Deck (Day 5–10 — 8 hours)

**Why now:** You cannot have investor conversations without a pitch deck. Everything else is preparation for the conversation — the deck is the conversation.

**Exactly what to do:**

Use the benchmark research as your source material:

| Slide | Content | Source |
|-------|---------|--------|
| 1 | Problem: AI without accountability — decisions with no source, no approval, no outcome record | ops/benchmark/category-narrative-lock.md |
| 2 | Category: Governed Decision Infrastructure — $16.3B market, 24.7% CAGR | ops/benchmark/market-delta.md |
| 3 | Product: The nine-step loop (Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning) | ops/benchmark/operating-loop-spec.md |
| 4 | Demo: Screenshot or recording of Decision Theater | Live app at /core |
| 5 | Market: $16.3B → $50.1B, competitive feature matrix (why SZL wins) | ops/benchmark/market-delta.md |
| 6 | Domains: 6 verticals on one governance loop | ops/frontier/executive-summary.md |
| 7 | Business model: Platform + domain pack; $50K–$500K/year enterprise tier | ops/benchmark/market-delta.md |
| 8 | Team: Founder background; first 3 hires planned | — |
| 9 | Ask: Amount, use of funds (engineering + first design partner program) | — |

**Done when:** 9-slide deck complete, practiced aloud twice, timing is under 12 minutes.

---

### Action 7: Draft Financial Projections (Day 8–10 — 8 hours)

**Why now:** Investors will ask. "We haven't modeled it yet" is a signal that the founder has not thought through the business. You need a model — not a perfect one, but a credible one.

**Exactly what to do:**
1. Work with an advisor, accountant, or spreadsheet
2. Model three scenarios (conservative, base, optimistic) across 3 years
3. Key inputs: design partner count, conversion to paid, ACV, churn rate, burn rate
4. Target metrics to have: Year 1 ARR, Year 2 ARR, Year 3 ARR; path to Series B (revenue milestone)
5. Store the model in the data room (NDA-gated)

**Done when:** Financial model exists in spreadsheet form with three scenarios; you can discuss the assumptions confidently.

---

### Action 8: Identify 20 Target Investors and Schedule First Meetings (Day 10–15 — 6 hours)

**Why now:** The pipeline takes longer than the product. Start early.

**Exactly what to do:**

Filter criteria for investor list:
- Firms that invest in enterprise infrastructure (not consumer SaaS)
- Firms with portfolio companies in AI governance, decision intelligence, compliance, or security
- Firms that understand defense/commercial crossover
- Partners who have written publicly about "boring" enterprise infrastructure
- Check: Andreessen Horowitz (enterprise), Accel (enterprise infrastructure), Bessemer (DevSec, enterprise), Insight Partners, Craft Ventures

For each investor:
1. Name + firm
2. Why they're a fit (specific portfolio or thesis match)
3. Warm intro path (mutual connection, portfolio company founder, advisor)
4. Primary contact email

**Done when:** 20 investors identified with warm intro paths. First 5 meetings scheduled.

---

### Action 9: Run 3 Practice Pitches Before First Investor Conversation (Day 15–20 — 3 hours)

**Why this matters:** The first investor meeting is not for practice. Practice with advisors, friendly founders, or angels who will give hard feedback.

**Exactly what to do:**
1. Identify 3 people who will give honest feedback (not just encouragement)
2. Run the full pitch: deck + Decision Theater demo
3. Specifically ask for feedback on: Does the category make sense? What's confusing? What would you want to see in diligence? What's the biggest concern?
4. Iterate on deck and narrative after each session

**Done when:** 3 practice pitches completed; deck has been revised based on real feedback; you can answer "What makes this different from Palantir?" confidently in 90 seconds.

---

### Action 10: Open-Source the Governance Primitives (Day 20–30 — 4 hours)

**Why this is the highest-trust signal:** Publishing production-quality code under an open-source license says more than any slide. It proves the architecture is real, auditable, and built with engineering discipline. This is the Chainguard pattern — open primitives build trust faster than any marketing claim.

**Exactly what to do:**
1. Select the libraries to open-source: `lib/proof-chain/`, `lib/covenant-policy/`, `lib/monte-carlo/`, `lib/prism-bus/`, `lib/outcome-graph/`
2. Have legal counsel review license selection (MIT vs. Apache 2.0)
3. Create a GitHub organization for open-source releases: `szl-governance`
4. Add README to each lib explaining the purpose, the architecture, and how to use it
5. Publish under chosen license
6. Add GitHub links to the /trust page and pitch deck
7. Post announcement in relevant communities (Hacker News, LinkedIn)

**Done when:** 5 governance primitive libraries are public on GitHub with READMEs. Links are live on the trust center page.

---

## 30-Day Calendar

| Week | Actions | Output |
|------|---------|--------|
| Week 1 (Days 1–7) | Secret rotation (#1), GitHub release (#2), Developer accounts (#3), Device build (#4), Quick credentials (#5) | Platform is secure, release is visible, CORTEX is on your phone |
| Week 2 (Days 8–14) | Pitch deck (#6), Financial model (#7) | Deck complete; you can have investor conversations |
| Week 3 (Days 15–21) | Investor list (#8), Practice pitches (#9) | 5 meetings scheduled; pitch has been stress-tested |
| Week 4 (Days 22–30) | Open-source governance (#10) | Strongest trust signal published |

---

## 30-Day Success Criteria

| Metric | Target |
|--------|--------|
| Production secrets rotated | Yes — unique keys, no dev fallbacks |
| GitHub Release v0.2.0 | Published with substantive release notes |
| CORTEX on physical device | Yes — demoed biometric auth + 2 domains |
| Mapbox + Stripe + Email active | Yes — all three configured |
| Series A pitch deck | 9 slides, practiced 3× |
| Financial model | 3-scenario model with defensible assumptions |
| Investor target list | 20 firms, warm intro paths identified |
| Meetings scheduled | 5 first conversations on calendar |
| Practice pitches | 3 completed with honest feedback incorporated |
| Governance primitives open-sourced | 5 libraries on GitHub with READMEs |
