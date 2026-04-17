# SZL Holdings Launch Bundle

This directory holds the multichannel launch content pack for the SZL Holdings portfolio
launch cycle (Pulse, Aegis, SZL Holdings web + CORTEX mobile, Vessels, Unified Command,
Terra, Carlota Jo, API Server, plus internal tooling).

## Contents

- `linkedin.md` — long-form LinkedIn launch post + carousel image order.
- `x-thread.md` — X (Twitter) thread, tweet-by-tweet with attached screenshots.
- `assets/screenshots/` — per-product screenshots (desktop + mobile) used in the posts.

> Substack, Medium, GitHub release notes, cover image, and short-form video assets are
> tracked in their own task threads and are not regenerated here.

## Recommended posting order

1. Substack deep-dive (anchor link)
2. LinkedIn long-form post (carousel order in `linkedin.md`)
3. X thread (timed ~2 hours after LinkedIn)
4. Medium variant (next morning)
5. GitHub release notes (same day as LinkedIn)

## Aegis screenshot pack (added in task #1077)

The Aegis web app failed to boot during the original screenshot pass, so this pack adds
real captures from a clean Aegis dev server before the launch goes live. Files captured
into `assets/screenshots/`:

- `aegis-overview-desktop.jpg` — public marketing surface ("Four workspaces. One shared intelligence layer.").
- `aegis-overview-mobile.jpg` — same surface at mobile viewport (390×844).
- `aegis-executive-board-view-desktop.jpg` — CISO Executive Board view (SLA compliance, MTTD/MTTR, control coverage).
- `aegis-xdr-incident-workbench-desktop.jpg` — XDR Incident Workbench (cross-domain entity graph + analyst notes).
- `aegis-legal-workspace-desktop.jpg` — merged Legal Workspace (matter overview, deadline risk queue, settlement forecast).
- `aegis-ot-ics-atlas-runtime-desktop.jpg` — Atlas Spatial Runtime showing the OT/ICS posture twin (`OT-SCADA-CONTROL`) with the unauthorized PLC ladder logic modification incident in the live theater.

## Pre-flight checklist (run in order before publishing)

Items marked `[x]` are objectively true against the current state of this directory and
the running workspace. Items marked `[ ]` still need to be verified by the publisher
before going live (per-product screenshots and external URLs are owned by sibling
launch tasks and may not yet exist in this directory).

- [x] **Aegis app is up before the LinkedIn post goes live.** The `artifacts/aegis: web` workflow boots cleanly and serves `http://<host>/aegis/` (HTTP 200). Screenshots in this bundle were captured against this dev server on 2026-04-17.
- [x] All screenshot files referenced in `linkedin.md` (slides 1–6) and `x-thread.md` (tweets 1, 3, 4, 5, 6, 12) exist in `assets/screenshots/`.
- [x] No placeholder text (`TODO`, `TKTK`, `[ ]`) remains in any post body.
- [x] No fabricated metrics — every number traceable to a file in the repo.
- [x] Author byline + handles match the canonical block in `.local/tasks/launch-content-bundle-multichannel.md`.
- [ ] Substack post URL resolves (anchor for cross-links).
- [ ] Medium post URL resolves.
- [ ] GitHub release link points to the correct tag.
- [ ] Per-product screenshots for Pulse, CORTEX mobile, Vessels (Command Overview + Voyage P&L), Unified Command, Terra, and Carlota Jo are captured into `assets/screenshots/` and spliced into the carousel/thread (tracked in follow-up #1086). If they aren't ready at publish time, the Aegis-only spine in `linkedin.md` and `x-thread.md` already publishes coherently on its own.
- [ ] Pulse, Vessels, Terra, Command, and Carlota Jo workflows verified up before each respective social card link is shared.
