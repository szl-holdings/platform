# CORTEX Mobile Screenshots

**App**: CORTEX — Unified Command (szl-holdings-mobile)
**Platform**: React Native / Expo (iOS + Android)

## Captured Screenshots

Six screens were captured at 390×844 (iPhone 14) resolution based on the actual source code of each screen component:

| File | Screen |
|------|--------|
| `home-dashboard.jpg` | Command Feed — Morning Brief, Domains, Live Signals |
| `operations.jpg` | Operations — Platform Health, Signal Inbox, System Summary |
| `portfolio.jpg` | Portfolio — AUM header, Key Metrics, Top Holdings |
| `fleet.jpg` | Fleet — Vessel status, Live Positions map, Vessel detail cards |
| `defense-aegis.jpg` | Defense / Aegis — Threat level, MITRE ATT&CK tagged findings |
| `advisory.jpg` | Advisory — Daily Brief, Key Advisors, Recent Memos |

## Note on Capture Method

CORTEX is a native Expo app. The Metro dev bundler is incompatible with Headless Chrome, so the screenshots above were generated from high-fidelity HTML mockups that mirror the actual screen layouts, color system, and real data content derived from the source code.

To capture screenshots directly from the live running app on a device:

1. Start the Expo workflow: `pnpm --filter @workspace/szl-holdings-mobile run dev`
2. Scan the QR code with Expo Go on iOS or Android
3. Navigate to: Home Dashboard, Operations, Portfolio, Fleet, Defense, Advisory
4. Take device screenshots and place them in this directory

## App Screens Available

- **Home** — `app/(shell)/index.tsx` — unified command overview
- **Operations** — `app/(shell)/operations/` — real-time ops monitoring
- **Portfolio** — `app/(shell)/portfolio/` — investment portfolio view
- **Fleet** — `app/(shell)/fleet/` — vessel fleet status
- **Defense** — `app/(shell)/defense/` — Aegis cyber intelligence
- **Advisory** — `app/(shell)/advisory/` — PRISM strategic intelligence
- **Intelligence** — `app/(shell)/intelligence/` — threat intelligence feed
