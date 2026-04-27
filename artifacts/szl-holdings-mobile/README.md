# SZL Holdings — Mobile Command

> Native iOS/Android command surface for the SZL Holdings platform — key metrics, alerts, and approval workflows on the go.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-53-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Architecture](../../docs/architecture/architecture.md)

![SZL Holdings — Mobile Command](../../.github/assets/screenshots/szl-holdings-mobile-hero.jpg)

---

## What it does

The SZL Holdings mobile app is the on-the-go command surface for platform operators. It surfaces key metrics, cross-domain anomaly alerts, and Human Lock approval requests — so decision-makers can monitor and act from anywhere. It consumes the same shared API server as all web artifacts.

> **Status:** Beta — core metrics and alerts are working. Full feature parity with web apps is on the product roadmap.

## Run locally

```bash
# From the monorepo root (requires Expo Go or simulator)
pnpm install
pnpm --filter @workspace/szl-holdings-mobile start

# iOS simulator
pnpm --filter @workspace/szl-holdings-mobile ios

# Android emulator
pnpm --filter @workspace/szl-holdings-mobile android
```

**Preview path:** `/mobile/` (web preview of the Expo app)

## Key screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Cross-domain KPI summary |
| Alerts | Priority anomaly and threat alerts |
| Approvals | Human Lock approval queue |
| Fleet | Maritime asset status |
| Profile | Account and settings |

## Tech stack

Expo 53 · React Native · TypeScript (strict) · NativeWind (Tailwind CSS for RN) · Expo Router · Shared API server

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
