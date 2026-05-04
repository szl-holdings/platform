# Mobile Beta to Launch

**Last updated:** April 2026
**Purpose:** Map the path from current alpha to public App Store listing

---

## Phase 1: Internal Alpha (Current → 2 Weeks)

| Task | Owner | Status |
|------|-------|--------|
| Verify EAS build succeeds (iOS + Android) | Engineering | Not started |
| Test biometric auth on physical device | Engineering | Not started |
| Test offline sync on airplane mode | Engineering | Not started |
| Create TestFlight test group | Engineering | Not started |
| Install on 3+ physical devices | Engineering | Not started |
| Fix any crash-on-launch issues | Engineering | Not started |

### Exit Criteria
- CORTEX installs and runs on iPhone 13+ and Pixel 6+
- Biometric auth works on physical devices
- At least one domain workspace renders data
- No crash-on-launch

---

## Phase 2: Founder Beta (2-4 Weeks)

| Task | Owner | Status |
|------|-------|--------|
| Distribute to founder's device via TestFlight | Engineering | Not started |
| Founder feedback on core flows | Founder | Not started |
| Fix top 5 UX issues from feedback | Engineering | Not started |
| Add push notification demo | Engineering | Not started |
| Polish dark mode consistency | Engineering | Not started |

### Exit Criteria
- Founder uses CORTEX daily for 1 week
- No crash in normal usage
- Push notifications delivered reliably
- Demo-ready for investor meetings

---

## Phase 3: Investor Beta (4-8 Weeks)

| Task | Owner | Status |
|------|-------|--------|
| Create investor TestFlight group | Engineering | Not started |
| Prepare investor demo script (mobile) | Product | Not started |
| Add "investor mode" with pre-loaded scenario | Engineering | Not started |
| Monitor crash reports via EAS | Engineering | Not started |
| Iterate based on investor feedback | Engineering | Not started |

### Exit Criteria
- 5+ investors have installed CORTEX
- < 1% crash rate
- Positive qualitative feedback
- Demo flow works reliably in meeting context

---

## Phase 4: Public Beta (Post-growth capital)

| Task | Owner | Status |
|------|-------|--------|
| App Store submission | Engineering | Not started |
| Play Store submission | Engineering | Not started |
| Privacy manifest (iOS) | Engineering | Not started |
| App Store screenshots and metadata | Design | Not started |
| Public marketing page for mobile | Marketing | Not started |

### Exit Criteria
- Listed on App Store and Play Store
- < 1% crash rate
- > 4.0 star rating
- Active user base growing week-over-week

---

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Expo SDK compatibility with physical devices | Test early on physical hardware, not just simulator |
| Firebase placeholder credentials in szl-holdings-mobile | Use CORTEX (cortex-mobile) as primary — different codebase |
| App Store review rejection | Follow Apple Human Interface Guidelines; prepare privacy manifest early |
| Performance on older devices | Set minimum device target (iPhone 12+, Pixel 5+) |
