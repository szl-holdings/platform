# Store Asset Inventory — CORTEX

Updated: 2026-04-16

## App Identity

| Field | Value |
|-------|-------|
| App Name (iOS) | CORTEX — Unified Command |
| Subtitle (iOS) | SZL Holdings Command Center |
| App Name (Android) | CORTEX — Unified Command |
| Bundle ID (iOS) | `com.szlholdings.executive.mobile` |
| Package Name (Android) | `com.szlholdings.executive.mobile` |
| Version | 2.0.0 |
| Category (iOS) | Business |
| Category (Android) | Business |
| Age Rating | 4+ (iOS) / Everyone (Android) |
| Content Rating | Business (no objectionable content) |
| Privacy Policy URL | https://szlholdings.com/legal/privacy |
| Support URL | https://szlholdings.com/contact |
| Marketing URL | https://szlholdings.com |

---

## Icon Assets

| Asset | Spec | Status | Notes |
|-------|------|--------|-------|
| iOS App Icon | 1024×1024 PNG, no alpha, no rounded corners | Configured | `./assets/images/icon.png` in app.json |
| Android App Icon | 512×512 PNG | Configured | Same file used for adaptive icon foreground |
| Adaptive Icon (Android) | Foreground + background layers | Configured | Foreground: `icon.png`, bg: `#090810` |

**Design Direction**: Dark background, SZL brand blue (#1E40AF) with a neural-grid motif and CORTEX wordmark. Mirror the web CORTEX header aesthetic.

---

## Screenshot Requirements

### iOS Screenshots

| Device | Dimensions | Count Required | Status |
|--------|-----------|----------------|--------|
| iPhone 15 Pro Max (6.7") | 1290×2796 px | 3–10 | Needed |
| iPhone 14 Plus (6.5") | 1284×2778 px | 3–10 | Needed |
| iPad Pro 12.9" (optional) | 2048×2732 px | 1–10 | Optional |

### Android Screenshots

| Device | Dimensions | Count Required | Status |
|--------|-----------|----------------|--------|
| Phone | 1080×1920 px minimum | 2–8 | Needed |
| Tablet 7" (optional) | 1200×1920 px | 1–8 | Optional |
| Feature Graphic | 1024×500 PNG | 1 | Required |

---

## Screenshot Content Plan

| # | Screen | Key Message |
|---|--------|-------------|
| 1 | Home dashboard — all 8 domain tiles visible | "Command everything in one view" |
| 2 | Signal feed with real-time alerts | "Live intelligence across all domains" |
| 3 | Biometric unlock screen | "Enterprise-grade security" |
| 4 | Quick action swipe cards | "Decisions at a swipe" |
| 5 | Voice command interface (mic active) | "Voice-activated command" |
| 6 | Daily digest card | "Your briefing, every morning" |
| 7 | Offline mode with sync indicator | "Works without connectivity" |
| 8 | Domain deep-dive (Vessels fleet view) | "Full domain intelligence" |

---

## Text Assets

### iOS Short Description (Subtitle) — 30 char max
```
SZL Holdings Command Center
```
*(28 chars)*

### iOS Promotional Text — 170 chars (updateable without review)
```
Command your entire business portfolio from one app. Real-time intelligence across defense, maritime, real estate, advisory, and five more domains.
```

### App Description — 4000 chars max

```
CORTEX — Unified Command by SZL Holdings

Command your entire business portfolio from a single, secure mobile app.

CORTEX is the executive command surface for SZL Holdings operators and principals — unifying eight operational domains into one intelligent, offline-capable interface.

EIGHT DOMAINS. ONE COMMAND CENTER.
• Aegis — Defense & Security Operations Center
• Vessels — Maritime Fleet Intelligence
• Terra — Real Estate Field Intelligence
• Carlota Jo — Executive Advisory
• Forge — Client & Operations Management
• Lyte — AIOps Command
• IMPERIUM — Portfolio Command
• SZL Holdings — Executive Portfolio Overview

ENTERPRISE SECURITY
• Biometric authentication (Face ID / Touch ID)
• PIN fallback with secure enclave storage
• 5-attempt lockout with automatic cooldown
• Screen capture prevention for sensitive workspaces

REAL-TIME INTELLIGENCE
• Cross-domain signal feed with priority alerts
• Push notifications with priority channels
• Daily executive digest delivered each morning

WORKS EVERYWHERE
• Full offline functionality with automatic sync
• Reconnects and syncs seamlessly on network restore

DESIGNED FOR PRINCIPALS
• Swipe-to-action decision cards
• Voice-activated command interface
• Domain workspace switching with one tap
• Personalized priority queues

Requires an active SZL Holdings account.
```

### iOS Keywords — 100 chars max
```
business,command,intelligence,executive,dashboard,operations,maritime,defense,realestate,analytics
```
*(97 chars)*

### Android Short Description — 80 chars max
```
Unified executive command center for SZL Holdings multi-domain operations.
```
*(74 chars)*

---

## App Preview Video (Optional but Recommended)

| Platform | Length | Format | Status |
|----------|--------|--------|--------|
| iOS App Preview | 15–30 seconds | MOV, H.264, 1080×1920 | Not created |
| Android Promo Video | YouTube link | Any | Not created |

**Suggested content**: Screencast showing unlock → domain dashboard → signal alert → quick action → voice command. Record on physical device at 60fps.

---

## Asset Production Checklist

- [ ] Commission icon design (Figma export, 1024×1024 master)
- [ ] Generate all iOS icon sizes via `expo-cli` or EAS
- [ ] Capture 8 screenshots on iPhone 15 Pro Max simulator
- [ ] Resize screenshots for 6.5" and Android phone sizes
- [ ] Create 1024×500 Android feature graphic (dark brand banner)
- [ ] Finalize app description (4000 char limit, expand draft above)
- [ ] Confirm keywords are <100 chars
- [ ] Create Privacy Policy page at szlholdings.com/legal/privacy
- [ ] Create Support page at szlholdings.com/contact

---

*Supersedes: `ops/mobile/store-assets-checklist.md` (that file remains as historical reference)*
