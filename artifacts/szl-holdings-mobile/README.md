# SZL Holdings — Mobile Command

Secondary mobile app for the SZL Holdings platform. Status: **deferred** until the CORTEX mobile flagship ships.

**Kind:** mobile (Expo / React Native)
**Preview path:** `/szl-holdings-mobile/`
**Artifact dir:** `artifacts/szl-holdings-mobile/`

## Status

This app is deferred. The primary mobile surface is `artifacts/cortex-mobile/` (CORTEX — Unified Command). Do not invest in new features here until CORTEX reaches the App Store.

See `ops/mobile/flagship-release-readiness.md` for the CORTEX release status and criteria.

## Local development

```bash
pnpm --filter @szl-holdings/szl-holdings-mobile dev
```

## Notable source paths

| Path | Purpose |
|------|---------|
| `app/` | Expo Router routes (incl. `(shell)` group and `auth.tsx`) |
| `components/` | Shared mobile UI components |
| `context/` | Auth, theme, and session contexts |
| `hooks/`, `lib/` | Data hooks and API client |
| `constants/` | App-wide constants |
| `assets/` | Icons, splash, fonts |
| `app.config.js`, `app.json`, `eas.json` | Expo / EAS configuration |
| `scripts/` | Build and release helper scripts |

## Key environment variables

All client-side variables use the `EXPO_PUBLIC_` prefix.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | API server base URL |
| `EXPO_PUBLIC_APP_ENV`, `EXPO_PUBLIC_APP_MODE` | Runtime environment and mode |
| `EXPO_PUBLIC_DOMAIN` | Public web domain (deep linking, share URLs) |
| `EXPO_PUBLIC_ISSUER_URL` | OIDC issuer URL for auth |
| `EXPO_PUBLIC_REPL_ID` | Replit identifier (dev/preview only) |
| `EXPO_PUBLIC_PULSE_URL` | Pulse briefing URL |
| `EXPO_PUBLIC_SANDBOX_API_BASE` | Sandbox API for demo mode |
| `EXPO_PUBLIC_AMPLITUDE_API_KEY` | Amplitude analytics key |
| `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` | PostHog analytics |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error reporting |
| `EXPO_PUBLIC_STRIPE_PRICE_MOBILE` | Stripe price ID for mobile tier |

EAS build/store secrets (Apple, Google Play, Firebase) are managed in `eas.json` and the EAS secrets matrix — see `ops/mobile/eas-and-store-secrets-matrix.md`.
