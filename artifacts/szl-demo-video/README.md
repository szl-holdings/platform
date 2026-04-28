# SZL Holdings — Governed Autonomy Demo Video

> Animated motion-graphics demonstration of the SZL Holdings platform — from signal detection through governed execution and Proof Chain — covering all product surfaces in one continuous narrative.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Watch Demo](https://szlholdings.com/szl-demo-video/) · [Interactive Loop](https://szlholdings.com/command/operations/governed-decision-loop) · [Investor Dashboard](https://szlholdings.com/stephen/investor)

---

## What it does

This artifact is a programmatic motion-graphics video built in React — not an edited video file. Every animation, transition, and scene is code. This means the demo can be updated like software: change the content, redeploy, done.

The video walks through the SZL Holdings platform thesis in ~70 seconds: the governance problem, a tour of all 10 product surfaces, the Continuum Fabric decision architecture, CORTEX mobile command, and the "governed autonomy" closing brand moment.

## Video Cuts

Four social cuts are selectable from the top-right corner:

| Cut | Duration | Purpose |
|-----|----------|---------|
| **Full Demo** | ~70s | Complete platform walkthrough for investor meetings |
| **60s Cut** | 60s | Platform overview + proof — LinkedIn / investor email |
| **30s Cut** | 30s | Value proposition + close — short-form social |
| **15s Cut** | 15s | Hook + tagline — stories, reels, ads |

Captions are burned in by default. Toggle with the top-left CC button.

## Scene Structure

| Scene | Name | Content |
|-------|------|---------|
| `open` | The Governance Problem | Hook: "The era of AI without receipts is ending" |
| `reel` | Meet the Platform | All 10 product surfaces cycling with animated UI frames |
| `fabric` | The Continuum Fabric | Decision fabric constellation graph (Guardian, Proof Chain, etc.) |
| `cortex` | CORTEX Mobile | Cross-domain alert correlation on mobile command |
| `close` | Governed Autonomy | SZL Holdings brand lockup + tagline |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19, Vite 7 |
| **Language** | TypeScript (strict mode) |
| **Animation** | Framer Motion (scene transitions, data animations) |
| **Rendering** | Browser-native — no video encoding required |

## Quick Start

```bash
# From the monorepo root
pnpm install
pnpm --filter @szl-holdings/szl-demo-video dev
```

## Notes

- This is a demo/marketing video artifact — not an interactive product surface
- For the interactive Governed Decision Loop walkthrough, see [`artifacts/command`](../command/) at `/command/operations/governed-decision-loop`
- Brand standards and visual tokens: [`media/brand-kit/tokens.md`](../../media/brand-kit/tokens.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
