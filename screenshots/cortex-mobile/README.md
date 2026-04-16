# CORTEX Mobile Screenshots

**App**: CORTEX — Unified Command (szl-holdings-mobile)
**Platform**: React Native / Expo (iOS + Android)

## Status

CORTEX is a native mobile application built with Expo. It cannot be screenshot in a standard browser environment because the Expo Metro bundler serves hot-reload bundles that require the Expo runtime (not Headless Chrome).

## How to Capture Screenshots

1. Start the Expo workflow (`pnpm --filter @workspace/szl-holdings-mobile run dev`)
2. Scan the QR code with Expo Go on iOS or Android
3. Navigate to: Home Dashboard, Operations, Portfolio, Fleet, Defense, Advisory, Quick Actions

## App Screens Available

- **Home** — `app/(shell)/index.tsx` — unified command overview
- **Operations** — `app/(shell)/operations/` — real-time ops monitoring
- **Portfolio** — `app/(shell)/portfolio/` — investment portfolio view
- **Fleet** — `app/(shell)/fleet/` — vessel fleet status
- **Defense** — `app/(shell)/defense/` — security intelligence
- **Advisory** — `app/(shell)/advisory/` — advisory intelligence
- **Intelligence** — `app/(shell)/intelligence/` — threat intelligence feed
