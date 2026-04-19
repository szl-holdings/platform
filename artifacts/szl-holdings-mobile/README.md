# SZL Holdings — Mobile Command

> Expo / React Native mobile companion app for the SZL Holdings platform.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-SDK_53-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

---

## Status

**Deferred.** This app is the secondary mobile surface. The primary mobile flagship is `artifacts/cortex-mobile/` (CORTEX — Unified Command). Do not invest in new features here until CORTEX ships to the App Store.

See [`ops/mobile/flagship-release-readiness.md`](../../ops/mobile/flagship-release-readiness.md) for the CORTEX release status and readiness criteria.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Expo SDK 53, React Native |
| **Language** | TypeScript (strict mode) |
| **Navigation** | Expo Router (file-based routing) |
| **Styling** | NativeWind (Tailwind CSS for React Native) |
| **Auth** | OIDC/PKCE with biometric unlock |
| **State** | TanStack Query v5 |
| **Analytics** | Amplitude, PostHog |
| **Error Reporting** | Sentry |
| **Builds** | Expo Application Services (EAS) |

## Local Development

```bash
# From the monorepo root
pnpm install
pnpm --filter @szl-holdings/szl-holdings-mobile dev
```

Requires the API server running:

```bash
pnpm --filter @szl-holdings/api-server dev
```

## Notable Source Paths

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

## Environment Variables

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

EAS build and App Store secrets are managed in `eas.json` and the EAS secrets matrix — see [`ops/mobile/eas-and-store-secrets-matrix.md`](../../ops/mobile/eas-and-store-secrets-matrix.md).

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
