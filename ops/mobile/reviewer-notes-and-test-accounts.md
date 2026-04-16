# Reviewer Notes and Test Accounts — CORTEX

Updated: 2026-04-16

## Purpose

This document provides ready-to-copy content for Apple App Store review notes and Google Play internal testing instructions. It also documents the test account strategy for internal QA and external beta testers.

---

## Apple App Store Review Notes

Copy this into App Store Connect → Your App → App Review Information → Notes for Reviewer:

```
Test Account Credentials
========================
Email:    demo@szlholdings.com
Password: [Retrieve from 1Password / team password manager — do NOT commit here]

IMPORTANT: This is a restricted-access enterprise app. The reviewer account
has full access to all eight domain workspaces without requiring organization
invite codes.

Key Flows to Test
=================
1. Launch → biometric prompt (Face ID / Touch ID) → tap "Use PIN" for reviewer device
2. Enter PIN: [retrieve from password manager]
3. View home dashboard — 8 domain tiles should be visible
4. Tap "Vessels" → browse maritime fleet intelligence
5. Tap "Aegis" → review security alerts feed
6. Tap the mic icon (top-right) → speak "Show Vessels alerts" → voice command routes
7. Swipe left on a quick-action card to dismiss; swipe right to action
8. Enable airplane mode → return to app → "Offline Mode" banner appears
9. Disable airplane mode → sync indicator appears → data refreshes
10. Go to Settings → Security → tap "Set up biometric" to demo Face ID prompt

Permission Usage Justifications
================================
• Face ID / Touch ID: Used for app unlock. Biometric data is processed
  on-device only and never transmitted. Fallback PIN always available.
• Camera: Used for QR code scanning (workspace join / document capture).
  Camera is only accessed after explicit user tap on scan icon.
• Location: Used for geospatial intelligence features (Terra property
  proximity, Vessels fleet position). Only requested when user activates
  a location-dependent feature.
• Notifications: Used for critical operational alerts and daily executive
  digest. Users control notification preferences in Settings.

Encryption Compliance
=====================
This app uses HTTPS exclusively for all API calls. It does not implement
custom encryption algorithms. ITSAppUsesNonExemptEncryption is set to false.
No export documentation is required.
```

---

## Google Play Internal Testing Notes

Include in the Play Console release notes field or tester email:

```
Welcome to CORTEX Internal Testing

Test Account
============
Email:    demo@szlholdings.com
Password: [Retrieve from team password manager]

Installation
============
1. Accept the tester invite via the opt-in link sent to your email
2. Download CORTEX from the Play Store (internal testing channel)
3. Open the app and sign in with the credentials above

Key Scenarios to Test
======================
1. Initial launch → PIN setup (biometric requires physical device with fingerprint)
2. Home dashboard — verify all 8 domain workspace tiles load
3. Open a domain (e.g., Vessels) → navigate fleet intelligence screens
4. Open Aegis → verify security alerts feed loads
5. Use voice command: tap mic icon → speak a command
6. Swipe left on a Quick Action card → confirm dismissal
7. Enable airplane mode → open app → confirm offline banner → disable airplane mode → confirm sync
8. Open Settings → Notifications → configure push preferences
9. Trigger a test push notification via the demo account portal (if available)

Known Issues in This Build
==========================
[Update this section before each test release]
• Push notifications require Firebase credentials — may not function in preview builds
• AR property viewer is a placeholder in this release (Terra workspace)

Feedback
========
Report issues via: https://szlholdings.com/contact
Or email: mobile-feedback@szlholdings.com
```

---

## Test Account Strategy

### Demo / Reviewer Account

| Property | Value |
|----------|-------|
| Email | demo@szlholdings.com |
| Role | Super Admin (all domain access) |
| Workspace | SZL Holdings — Demo Tenant |
| Biometric | N/A — use PIN fallback |
| PIN | Stored in team password manager under "CORTEX Demo PIN" |
| Data | Seeded with realistic demo data (no real PII) |
| Reset | `POST /api/admin/seed/reset-demo` to restore to clean state |

### Internal QA Accounts

| Role | Email | Purpose |
|------|-------|---------|
| Domain User — Vessels | qa-vessels@szlholdings.com | Test Vessels-only access |
| Domain User — Terra | qa-terra@szlholdings.com | Test Terra-only access |
| Read-Only Analyst | qa-readonly@szlholdings.com | Test view-only permissions |
| New User (no domains) | qa-newuser@szlholdings.com | Test onboarding flow |

All QA accounts use passwords stored in the team password manager under "CORTEX QA Accounts".

### Beta Tester Onboarding

1. Send TestFlight invite (iOS) or Play Store opt-in link (Android)
2. Include PIN/password in the TestFlight notes or Play release notes
3. Ask testers to test on physical device where possible (biometric features require hardware)
4. Collect feedback via in-app feedback link or mobile-feedback@szlholdings.com

---

## Device and OS Coverage Matrix

| Platform | Min OS | Target | Notes |
|----------|--------|--------|-------|
| iOS | iOS 16 | iOS 17+ | iOS 17 required for Privacy Manifest |
| Android | Android 10 (API 29) | Android 13+ | Expo SDK minimum |

Recommended physical test devices:
- iPhone 15 Pro (Face ID, iOS 17)
- iPhone SE 3rd gen (Touch ID, smaller screen)
- Google Pixel 7 (Android 13, fingerprint)
- Samsung Galaxy S23 (Android 13, high-volume device)

---

*Maintain this document before each TestFlight / Play release. Update credentials section only via password manager reference — never commit plain-text passwords.*
