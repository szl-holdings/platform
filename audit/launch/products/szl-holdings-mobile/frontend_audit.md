# SZL Holdings Mobile Command: Frontend Audit
**Phase:** 2 + 10  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Summary

| Dimension | Status |
|---|---|
| Workflow | 🔵 NOT STARTED (Expo tunnel; separate build path) |
| Framework | Expo / React Native with NativeWind |
| Platform | iOS + Android |
| Auth model | OIDC required |
| Build status | Beta |

---

## Mobile Screens (Inventory)

The mobile app (CORTEX) provides:
- Mobile command dashboard
- Signal feed (condensed)
- Approval inbox (push notifications)
- Decision overview
- Notification center

---

## Mobile Build Path

The mobile app uses Expo and requires:
1. EAS (Expo Application Services) build configuration
2. Separate from Replit web publish workflow
3. iOS: TestFlight distribution; Production: App Store
4. Android: Google Play or APK distribution

For the Replit demo environment, the Expo tunnel provides a web preview. For investor demos, the iOS simulator via EAS is preferred.

---

## Issues Found

| Issue | Severity | Action |
|---|---|---|
| Expo workflow not started | P2 | Start `artifacts/szl-holdings-mobile: expo` workflow for web preview |
| No Detox E2E tests | P3 | Add mobile smoke tests in Sprint 5 |
| No self-serve mobile demo mode | P3 | Add guided walkthrough |

---

## Verdict

**Status: 🔵 Beta | Not started in current environment | Start Expo workflow for mobile preview | Separate EAS build for production**
