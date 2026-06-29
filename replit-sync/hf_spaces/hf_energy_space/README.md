---
title: SZL Energy
emoji: ⚡
colorFrom: green
colorTo: indigo
sdk: static
app_file: index.html
pinned: false
short_description: "Live energy view: stranded watts, bounded compute, joules"
---

# SZL HOLDINGS — ENERGY

A live, self-contained dashboard + 3D visualization of the SZL **energy loop**:

`harvest → SAMAY soak (RTX 5000) → KALLPA metabolize → heart/blood circulate → YARQA disperse → EnergyReservoir → provenance receipt → Ayni-balance → repeat`

## What this shows

- **The measured joule milestone.** `212.262` real measured joules from the `betterwithage` exporter node, landing during a **negative-price** grid window (the grid PAID to compute). `joules_label: measured`, backed by a fresh NVML evidence sample (node, timestamp, power-W) — no longer an estimate.
- **Fully-populated live a11oy API.** Every panel is fetched at runtime from `https://a-11-oy.com/api/a11oy/v1/...` (CORS open). Endpoints: `harvest/posture`, `energy/budget`, `energy/provenance`, `heart/pulse`, `anatomy/loop`, `compute-pool`, `revenue/marketplace`.
- **The story, investor-legible.** Milestone → the live loop (harvest → SAMAY soak → KALLPA → heart → YARQA → reservoir → receipt → Ayni) → anatomy circulation + compute fabric → the proof (Bekenstein bound, Landauer floor, Ayni reciprocity) → the revenue thesis (ESTIMATE, settle-to-count).
- **Honest degradation.** If a fetch fails, that panel is clearly labeled **SNAPSHOT** with a last-known value — never blank, never fabricated.
- **3D loop.** A `three.js` (CDN, our MIT build) animation of energy particles flowing through every organ of the loop, with a glassmorphism HUD bound to the live numbers. Auto-refresh ~15s. Honors `prefers-reduced-motion`.

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
