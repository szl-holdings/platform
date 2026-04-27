# Screenshot Manifest — docs/media/screenshots/

**Generated:** 2026-04-26  
**Phase:** Rehaul 8/9 — Copy Tightening & Screenshot Refresh  
**Canonical location for sales/press:** `docs/media/screenshots/` (this directory)  
**Canonical location for investor/multi-viewport:** `docs/assets/screenshots/current/` (131 verified Playwright captures, 2026-04-26)

---

## Overview

This manifest maps every image in `docs/media/screenshots/` to its artifact, route, capture date, and status. All superseded and stale captures have been **deleted from disk** in this phase. No mockups or AI-generated imagery.

**Stale files removed in Rehaul 8/9:**
- 19 superseded flat JPGs from root (aegis-hero.jpg, alloy-hero.jpg, lyte-*.jpg, vessels-*.jpg, etc.)
- `prism-counsel/` subdirectory (2 files — stale path alias; current captures are in `counsel/`)
- Root-level `screenshots/` directory (~250 files — multi-session legacy)
- Root-level `launch-shots/` directory (7 files — v0 launch captures)

---

## Current Captures — Subdirectory Format (20 files)

All PNG files are Playwright-captured from the live alpha platform.

| Filename | Product Name | Route | View | Captured | Status |
|----------|-------------|-------|------|----------|--------|
| `szl-holdings/hero.png` | SZL Holdings Dashboard | `/` | hero | 2026-04-25 | current |
| `szl-holdings/portfolio.png` | SZL Holdings Dashboard | `/#portfolio` | portfolio | 2026-04-25 | current |
| `pulse/hero.png` | LUMINA — AI Executive Briefing | `/pulse/` | hero | 2026-04-25 | current |
| `pulse/brief.png` | LUMINA — AI Executive Briefing | `/pulse/` | brief | 2026-04-25 | current |
| `sentra/hero.png` | TENAX — Cyber Resilience | `/sentra/` | hero | 2026-04-25 | current |
| `sentra/dashboard.png` | TENAX — Cyber Resilience | `/sentra/` | dashboard | 2026-04-25 | current |
| `lyte/hero.png` | KORA — Decision Intelligence | `/lyte/` | hero | 2026-04-25 | current |
| `lyte/command.png` | KORA — Decision Intelligence | `/lyte/` | command | 2026-04-25 | current |
| `vessels/hero.png` | SEXTANT — Maritime Intelligence | `/vessels/` | hero | 2026-04-25 | current |
| `vessels/fleet.png` | SEXTANT — Maritime Intelligence | `/vessels/` | fleet | 2026-04-25 | current |
| `terra/hero.png` | DOMAINE — Real Estate Intelligence | `/terra/` | hero | 2026-04-25 | current |
| `terra/portfolio.png` | DOMAINE — Real Estate Intelligence | `/terra/` | portfolio | 2026-04-25 | current |
| `counsel/hero.png` | Counsel — Legal Matter Command | `/counsel/` | hero | 2026-04-25 | current |
| `counsel/dashboard.png` | Counsel — Legal Matter Command | `/counsel/` | dashboard | 2026-04-25 | current |
| `aegis/hero.png` | PARAGON — Defense & Intelligence | `/aegis/` | hero | 2026-04-25 | current |
| `aegis/deck.png` | PARAGON — Defense & Intelligence | `/aegis/` | deck | 2026-04-25 | current |
| `command/hero.png` | FORGE — Unified Command | `/command/` | hero | 2026-04-25 | current |
| `command/dashboard.png` | FORGE — Unified Command | `/command/` | dashboard | 2026-04-25 | current |
| `szl-demo-video/hero.png` | SZL Holdings — Demo Video | `/szl-demo-video/` | hero | 2026-04-25 | current |
| `szl-holdings-mobile/hero.png` | APEX — Mobile Command | `/szl-holdings-mobile/` | hero | 2026-04-25 | current |

---

## Current Captures — Non-Artifact Files (4 files)

These flat JPG files have no Playwright capture equivalent and are retained.

| Filename | Purpose | Status |
|----------|---------|--------|
| `carlota-jo-hero.jpg` | Carlota Jo — no Playwright capture exists | current |
| `stephen-lutar-hero.jpg` | Founder portrait | current |
| `szl-founder.jpg` | Founder photo (alternate) | current |
| `trust-center.jpg` | Trust center page — no Playwright capture | current |

---

## High-Resolution Captures Reference

For investor-grade, multi-viewport captures see `docs/assets/screenshots/current/screenshot-manifest.md`.

That manifest documents **131 verified captures** (9 failed due to WebGL/Chromium constraints) taken 2026-04-26 across all A11oy routes, FORGE, TENAX, LUMINA, and Counsel.

**Usage guidance:**
- `docs/media/screenshots/` — For press kit, social, and sales doc embeds (one-per-artifact format)
- `docs/assets/screenshots/current/` — For investor pitch, README, org profile (multi-viewport, multi-route)
- `brand/screenshots/` — For README badges and public GitHub profile (Phase 6 canonical JPGs)

---

## Screenshot Policy

1. All screenshots must be unmodified captures of the live alpha platform
2. No mockups, composites, or AI-generated imagery
3. All captures must include the DEMO badge when showing seeded data
4. No PII, internal tokens, or credentials visible in any capture
5. Stale captures (>90 days or post a UI update sprint) are deleted, not archived
6. `brand/screenshots/` is the source for README and public repo profile images

*Machine-readable version: `docs/media/screenshots/manifest.json`*
