---
title: SZL Anatomy 3D V2
emoji: 🫀
colorFrom: indigo
colorTo: red
sdk: static
pinned: false
license: apache-2.0
---

# SZL Anatomy 3D V2 — Human Substrate · Live Flagships

A WebGL (Three.js r160) anatomical visualization of the SZL substrate rendered
as a **semi-transparent human body** with the 12 named organs placed at
anatomically correct positions inside the shell, plus **6 live flagship
satellite orbs** wired into the body.

## What's live
- **6 flagships polled every 30s** (a11oy, amaru, sentra, vessels, killinchu, rosie)
  via their `/healthz` endpoints. Orb color = real status: green=UP, red=DOWN,
  gray=unknown. The bottom-left HUD shows per-flagship dot, last poll time,
  commit SHA (last 8), and Λ where exposed.
- **Honest wires**: shipped/live wires render as glowing colored TubeGeometry with
  animated traveling particles; **not-yet-shipped wires render as gray DASHED lines
  with no flow** (no fake colors).
- **Λ-spine = exactly 13 vertebrae** (Doctrine v11, 2 sacred / 7 structural / 4 introspection).
- Live Λ score + declarations/axioms/sorries pulled from a11oy `/api/a11oy/v1/honest`
  and `/api/a11oy/v1/lambda`; falls back to the 2026-06-01 snapshot with a banner
  when the live endpoint is unreachable.

## Controls
Orbit (drag) · Zoom (scroll) · Explode/Reassemble · Pulse · Reset · Hide body · Hide flagships · per-wire toggles.

## Honesty
Doctrine v11: 749 declarations, 14 unique axioms, 163 sorries, 13/13 Λ-axes.
Uniqueness remains a **Conjecture**. killinchu is not yet deployed → it renders
red/PENDING by design, never faked.

Built via `HfApi.create_commit` (direct), not GitHub Actions.
