# Mobile growth capital Pass

**Last updated:** April 2026
**Purpose:** Define what mobile presence signals to growth capital investors

---

## What Investors Look For in Mobile

### The Signal
A mobile app at growth capital signals: "This team builds for real operators, not just demo audiences." It does not need to be feature-complete. It needs to be real, usable, and governed.

### Competitive Mobile Patterns
- **Palantir Mobile:** Limited to specific government deployments; not publicly available
- **Anduril:** Hardware-oriented; mobile is command interface for field operators
- **Rippling:** Mobile app extends core HR/IT features; not a primary surface
- **Vercel:** No mobile app needed (developer tool)
- **Linear:** Mobile app for issue triage — focused, fast, keyboard-free

---

## CORTEX Mobile — Current State

| Capability | Status |
|-----------|--------|
| Unified 8-domain workspace | ✅ Implemented |
| Biometric auth (Face ID / Touch ID) | ✅ Implemented |
| PIN setup with SHA-256 hashing | ✅ Implemented |
| Secure storage (expo-secure-store) | ✅ Implemented |
| Offline sync engine | ✅ Implemented |
| Push notification scheduling | ✅ Implemented |
| Native device permissions | ✅ Configured |
| TestFlight / Play Store submission | ❌ Not started |
| EAS build configuration | ❌ Not started |

---

## growth capital Mobile Quality Bar

### Must Have (Before Fundraise)
1. **Builds successfully** — `eas build` produces installable artifacts
2. **Auth works** — biometric + PIN login on physical device
3. **Core loop visible** — at least one domain shows signal-to-outcome flow
4. **Offline indicator** — clear UI when offline with sync-on-reconnect
5. **No placeholder data** — real data or honest "no data yet" states

### Nice to Have
1. TestFlight available for investor demo on their device
2. Push notification demo (daily digest)
3. Cross-domain workspace switching
4. Dark mode (consistent with web)

### Not Required
1. Full feature parity with web
2. App Store public listing
3. Performance optimization
4. Accessibility audit
5. Localization

---

## Investor Demo Scenario (Mobile)

1. Show biometric login (Face ID unlock)
2. Open Vessels workspace — show signal feed
3. Switch to Aegis workspace — show correlated signal
4. View recommendation with confidence score
5. Approve action with in-app confirmation
6. Show proof chain record on mobile
7. Toggle airplane mode — show offline banner
8. Re-enable — show sync resumption

Total demo time: 2-3 minutes

---

## App Store Readiness (Post-growth capital)

| Artifact | Spec | Priority |
|----------|------|----------|
| App icon | 1024x1024 branded PNG | P0 |
| Screenshots (iPhone 6.7") | 1290x2796 | P0 |
| App description | 4000 chars, governance-focused | P0 |
| Privacy policy URL | szlholdings.com/legal/privacy | P0 |
| TestFlight beta group | Internal testers + select investors | P0 |
