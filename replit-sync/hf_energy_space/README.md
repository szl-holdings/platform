---
title: SZL Energy
emoji: ⚡
colorFrom: blue
colorTo: indigo
sdk: static
app_file: index.html
pinned: false
short_description: "Live SZL energy loop: measured joules, bounded compute"
---

# SZL HOLDINGS — ENERGY

A live, self-contained dashboard + 3D visualization of the SZL **energy loop**:

`harvest → SAMAY soak (RTX 5000) → KALLPA metabolize → heart/blood circulate → YARQA disperse → EnergyReservoir → provenance receipt → Ayni-balance → repeat`

## What this shows

- **The measured joule milestone.** `212.262` real measured joules from the `betterwithage` job, landing during a **negative-price** grid window (the grid PAID to compute). `joules_label: measured` — no longer a sample.
- **Live a11oy API.** Fetched at runtime from `https://a11oy.net/api/a11oy/v1/...` (CORS open). Endpoints: `harvest/posture`, `energy/budget`, `energy/provenance`, `heart/pulse`, `revenue/marketplace`.
- **Honest degradation.** If a fetch fails, the panel is clearly labeled **SNAPSHOT** with a last-known value — never fabricated.
- **3D loop.** A `three.js` (CDN) animation of energy particles flowing through every organ of the loop, with a glassmorphism HUD bound to the live numbers.

## Honesty doctrine (badges shown in-app)

- joules **MEASURED** (now real) vs SAMPLE elsewhere
- `sovereign = false` — the app is **not** on our own metal
- organs are **EXPERIMENTAL**
- Λ = **Conjecture 1**
- **NO free-energy** — we soak already-wasted (negative-price / curtailed) energy
- revenue figures are **ESTIMATE** — not booked, not a forecast

## Tech

Pure static HTML/CSS/JS. `three.js` via CDN (ES module import map). No server, no build step. HF Space `sdk: static`.

## Branding

Deep-space dark, teal `#01696F` / cyan / violet glow, Calibri / system font stack.
