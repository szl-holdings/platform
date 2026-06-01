# SZL Holdings Mobile — CORTEX: Demo Script

**Duration:** 4–6 minutes  
**Persona:** Any executive or field operator  
**Pre-requisite:** CORTEX app installed on device; signed in; internet connection

---

## Pre-Demo Checklist

- [ ] App launches to authenticated home screen
- [ ] Dashboard shows domain health summary
- [ ] Vessels feed shows fleet status
- [ ] Sentra alerts feed shows at least 1 alert
- [ ] Push notification test sent (confirm device received it)

> **If Mapbox token not configured:** Skip the property map view. Show the list-based Terra feed instead.

---

## Step 1 — Home / Dashboard (1 min)

> "CORTEX is the mobile command surface. Every domain pack — Vessels, Sentra, Terra, Lyte — is accessible on the device. Executives and field operators have the same governed access as the web platform, on mobile."

Point to the domain health summary tiles.

> "The health scores sync from the same source as Command. When a domain degrades, this updates in real time — push notification is triggered."

---

## Step 2 — Vessels Fleet (1 min)

> "Swipe to the Vessels shell. Fleet status, active alerts, and the top exception — all from the same API, same tenant scope, same auth session."

Point to MV Soltana's alert.

> "The route deviation alert from the web platform is visible here. The operator can acknowledge and respond from the device."

---

## Step 3 — Sentra Alerts (1 min)

> "Swipe to the Sentra shell. Active security alerts, incident status — same data, mobile-optimized view."

Click an alert.

> "Acknowledge from the device. The acknowledgment is recorded in the platform with the same attribution as a web action — who, when, from which device."

---

## Step 4 — Push Notifications (1 min)

> "The notification system is live. When a new critical alert is created in Sentra, CORTEX sends a push notification within seconds."

*Trigger a test notification from the admin panel if available.*

> "The notification deep-links directly to the relevant screen — tapping the Sentra alert notification opens the incident detail."

---

## Step 5 — Offline Sync (1 min)

> "CORTEX has offline capability. If connectivity drops in the field, actions queue locally and sync when connection is restored. The sync engine uses an optimistic conflict resolver — last-write-wins with audit log."

---

## Avoidance Guide

- Firebase credential files are placeholders — do NOT show the raw config; only show the live app experience
- Map views require Mapbox token — skip if not configured
- Full offline sync coverage is partial — demo the queue mechanism, not edge-case conflict resolution

---

## Questions to Anticipate

**"Is this in the App Store?"**  
> "We're in the Expo-managed development build phase — the app is installable via TestFlight and the Expo Go preview. App Store submission is tracked to the commercial launch milestone."

**"Does it work on Android?"**  
> "The Expo / React Native stack targets both iOS and Android. The Android build is tested in the CI pipeline."
