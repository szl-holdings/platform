---
title: SZL Khipu Constellation
emoji: 🪢
colorFrom: gray
colorTo: indigo
sdk: static
app_file: index.html
pinned: false
license: mit
short_description: Live 3D constellation of SZL Khipu BFT mesh
---

# SZL Khipu Constellation

A beautiful, honest, investor-grade static visualization of **Khipu** — SZL's
Byzantine-fault-tolerant **witnessed-agreement** layer. *Khipu* is the Quechua
knotted-cord record: every accepted fact is a knot, tied only once an independent
quorum of witnesses attests and signs a receipt.

## What you're looking at

- A **3D "constellation"** of the witness mesh, rendered with
  [`3d-force-graph`](https://github.com/vasturiano/3d-force-graph) (MIT) loaded
  via CDN import map. SZL's own build — no proprietary code embedded.
- Node colors: **teal = sovereign** (SZL-owned metal), **violet = hosted fallback**
  (third-party, *not* sovereign), **cyan = CPU/verify node**, **red = unreachable**.
- A **full mesh** view and a **3-of-4 quorum** view showing the BFT threshold subset.
- Live **KPI cards** and a **witness registry** table fed by the live probe.
- An illustrative **signed-receipt knot** (in-toto / DSSE).

## Data source & honest-degrade

The page live-fetches `https://a-11-oy.com/api/a11oy/v1/compute-pool`. When that
endpoint is unreachable (network or cross-origin restriction), it **degrades to a
clearly-labeled bundled snapshot** (`assets/snapshot-compute-pool.json`) — never to
fabricated data and never to a false "all green." The source badge always states
whether you're seeing **LIVE** or **SNAPSHOT** data. Auto-refresh ≈ every 15s.

## Honesty / doctrine (v11)

- **Khipu BFT safety & liveness = Conjecture 2** — *proposed, under active research,
  NOT proven.* It is not a formally verified theorem and is never claimed as one.
- **Λ (Lambda) = Conjecture 1** — also a conjecture, not in the locked proven set.
- **Sovereign = own-metal only.** Only SZL-owned hardware is sovereign; hosted APIs
  are explicit fallbacks. No free-energy / joule claims. No keys exposed. Builds are
  **SLSA Level 1, honestly stated.**

## Tech

Static HTML/CSS/JS. Deep-space dark theme, teal/cyan/violet glow, glassmorphism,
responsive, WCAG-contrast, `prefers-reduced-motion` aware. No build step required.

Verify SZL receipts yourself: <https://github.com/szl-holdings/a11oy/blob/main/docs/developers/VERIFY.md>
