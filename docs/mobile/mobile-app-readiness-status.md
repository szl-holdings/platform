# Mobile App Readiness Status

_Last updated: April 2026_

This document provides a truth-label for each mobile application in the portfolio: its current state, production-readiness, and what's needed before store submission.

---

## App Status Legend

| Status | Meaning |
|--------|---------|
| PRODUCTION_READY | Full app.json configured, EAS configured, passing builds, store-ready |
| NEAR_READY | App functional, missing bundle IDs, EAS config, or store metadata |
| DEVELOPMENT | Core features implemented but significant work remains |
| PLACEHOLDER | Scaffold exists; MVP not yet implemented |

---

## Lyte Mobile — AIOps Command

**Status**: NEAR_READY  
**Primary**: Yes (this is the primary release candidate)

| Item | Status |
|------|--------|
| App name | ✅ "Lyte — AIOps Command" |
| iOS bundle ID | ✅ `com.lyte.aiops.mobile` |
| Android package | ✅ `com.lyte.aiops.mobile` |
| EAS build profiles | ✅ dev / preview / production configured |
| EAS submit profiles | ✅ iOS and Android configured |
| Splash screen | ✅ |
| Icon | ✅ |
| iOS permissions | ✅ Camera, Photos, Face ID, Location, Privacy Manifest |
| Android permissions | ✅ Camera, Internet, Biometric |
| Auth token refresh | ✅ Offline-safe with proactive refresh |
| API env switching | ✅ dev/preview/production via EXPO_PUBLIC_ENV |
| Push notifications | ✅ expo-notifications configured |
| Crash reporting | ⬜ Sentry not yet integrated |
| Analytics | ⬜ Not yet integrated |
| Store screenshots | ⬜ Not yet captured |
| Store description | ⬜ Not yet written |
| Privacy policy live | ⬜ lyte.ai/privacy must be live |
| EAS Project ID | ⬜ Replace placeholder in app.json |
| Apple Team ID | ⬜ Replace placeholder in eas.json |
| ASC App ID | ⬜ Replace placeholder in eas.json |
| Google Play key | ⬜ google-play-key.json needed |

**Build confidence**: HIGH — all native deps declared, no known build blockers  
**Estimated time to store-ready**: 1–2 weeks (primarily content + Expo account setup)

---

## SZL Holdings Mobile — Executive Command

**Status**: DEVELOPMENT  
**Primary**: No

| Item | Status |
|------|--------|
| App name | ✅ "SZL Holdings" |
| iOS bundle ID | ⬜ Not set (missing `bundleIdentifier`) |
| Android package | ⬜ Not set (missing `package`) |
| EAS build profiles | ⬜ No eas.json |
| Biometric auth | ✅ expo-local-authentication configured |
| Push notifications | ✅ expo-notifications configured |
| Crash reporting | ⬜ Not integrated |

**Build confidence**: MEDIUM — biometric auth plugin requires device testing  
**Blockers**: Bundle identifiers, EAS setup, Apple Dev account connection

---

## Aegis Mobile — SOC Command Center

**Status**: DEVELOPMENT  
**Primary**: No

| Item | Status |
|------|--------|
| App name | ✅ "Aegis" |
| iOS bundle ID | ✅ `com.replit.aegis.mobile` (placeholder domain — needs update) |
| Android package | ✅ `com.replit.aegis.mobile` (placeholder domain — needs update) |
| EAS build profiles | ⬜ No eas.json |
| Crash reporting | ⬜ Not integrated |

**Build confidence**: MEDIUM  
**Blockers**: Update bundle IDs to production domain, EAS setup, store metadata

---

## Terra Mobile — Field Intelligence

**Status**: DEVELOPMENT  
**Primary**: No

| Item | Status |
|------|--------|
| App name | ✅ "Terra" |
| iOS bundle ID | ⬜ Not set |
| Android package | ⬜ Not set |
| EAS build profiles | ⬜ No eas.json |
| Camera permission | ✅ Configured |
| Location permission | ✅ Configured |
| Crash reporting | ⬜ Not integrated |

**Build confidence**: MEDIUM  
**Blockers**: Bundle IDs, EAS setup, store metadata

---

## Vessels Mobile — Fleet Command

**Status**: DEVELOPMENT  
**Primary**: No

| Item | Status |
|------|--------|
| App name | ✅ "Vessels" |
| iOS bundle ID | ⬜ Not set |
| Android package | ⬜ Not set |
| EAS build profiles | ⬜ No eas.json |
| Push notifications | ✅ expo-notifications configured |
| Crash reporting | ⬜ Not integrated |

**Build confidence**: LOW (workflow currently failing — investigate deps)  
**Blockers**: Fix build error, bundle IDs, EAS setup, store metadata

---

## Carlota Jo Mobile — Client App

**Status**: DEVELOPMENT  
**Primary**: No

| Item | Status |
|------|--------|
| App name | ✅ "Carlota Jo" |
| iOS bundle ID | ⬜ Not set |
| Android package | ⬜ Not set |
| EAS build profiles | ⬜ No eas.json |
| Crash reporting | ⬜ Not integrated |

**Build confidence**: MEDIUM  
**Blockers**: Bundle IDs, EAS setup, store metadata

---

## Stephen Mobile — Personal Command

**Status**: PLACEHOLDER  
**Primary**: No

| Item | Status |
|------|--------|
| App name | ✅ "Stephen Lutar" |
| iOS bundle ID | ⬜ Not set |
| Android package | ⬜ Not set |
| EAS build profiles | ⬜ No eas.json |
| Core features | ⬜ Minimal implementation |
| Crash reporting | ⬜ Not integrated |

**Build confidence**: MEDIUM (basic scaffold)  
**Blockers**: Feature completion, bundle IDs, EAS setup — not a near-term store candidate

---

## Summary Table

| App | Status | Bundle IDs | EAS | Store Ready |
|-----|--------|------------|-----|-------------|
| Lyte Mobile | NEAR_READY | ✅ | ✅ | ~1-2 weeks |
| SZL Holdings Mobile | DEVELOPMENT | ⬜ | ⬜ | ~4-6 weeks |
| Aegis Mobile | DEVELOPMENT | ⚠️ (placeholder) | ⬜ | ~4-6 weeks |
| Terra Mobile | DEVELOPMENT | ⬜ | ⬜ | ~4-6 weeks |
| Vessels Mobile | DEVELOPMENT | ⬜ | ⬜ | ~6-8 weeks |
| Carlota Jo Mobile | DEVELOPMENT | ⬜ | ⬜ | ~4-6 weeks |
| Stephen Mobile | PLACEHOLDER | ⬜ | ⬜ | Not scheduled |

## Recommended Priority Order

1. **Lyte Mobile** — Pilot launch candidate. Proceed to store submission prep.
2. **SZL Holdings Mobile** — Executive-facing, high business value. Set bundle IDs and EAS next.
3. **Aegis Mobile** — Already has bundle IDs (fix domain), relatively advanced.
4. **Terra Mobile** — GPS/camera permissions already set, feature-rich.
5. **Vessels Mobile** — Fix build error first before proceeding.
6. **Carlota Jo Mobile** — Client-facing; prioritize based on CJ business timeline.
7. **Stephen Mobile** — Personal/internal; deprioritize.
