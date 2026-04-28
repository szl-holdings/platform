# SZL Demo Video — Asset Pipeline

This document describes how every visual element in the demo video is produced and what its data source is.

---

## Scene Overview (Three-Act Structure)

The video has **5 scenes** covering **10 product surfaces**. Scene 2 (`reel`) is a
2.5s-per-surface montage that tours all 10 surfaces in 25s — so "Scene 1–10 inventory"
in the task refers to the 10 *surfaces* shown, not 10 separate scene files.

| Act | Scene | Name | Duration | Purpose |
|-----|-------|------|----------|---------|
| I — Problem | 1 `open` | The Governance Problem | 12s | Hook: "The era of AI without receipts is ending." |
| II — Solution | 2 `reel` | Meet the Platform | 25s | Tour all 10 product surfaces with live mock UIs |
| II — Solution | 3 `fabric` | The Alloy Fabric | 18s | Decision fabric constellation graph |
| II — Solution | 4 `cortex` | APEX Mobile | 10s | Cross-domain alert correlation on mobile (the `cortex` scene slug is preserved as a stable URL identifier per the originality audit) |
| III — Brand | 5 `close` | Governed Autonomy | 12s | SZL Holdings brand lockup + CTA |

### The 10 product surfaces (covered in Scene 2 — `reel`)

| # | Surface | Domain | Duration in reel |
|---|---------|--------|-----------------|
| 1 | Pulse | Executive briefing | 2.5s |
| 2 | Vessels | Maritime intelligence | 2.5s |
| 3 | Terra | Real estate intelligence | 2.5s |
| 4 | Aegis | Defense & intel | 2.5s |
| 5 | Carlota Jo | Private advisory | 2.5s |
| 6 | Sentra | Cyber posture | 2.5s |
| 7 | Lyte | Decision intelligence | 2.5s |
| 8 | Conduit | Reverse ETL data integration | 2.5s |
| 9 | Counsel | Legal matters | 2.5s |
| 10 | Unified Command | Cross-domain nerve center | 2.5s |

---

## Data Source Annotations

Every on-screen claim is either **sourced** (linked to a real artifact or data provider) or **illustrative** (demo data, clearly representative).

### Scene 1 — Open

| Claim | Status | Source |
|-------|--------|--------|
| `trc_01HK8N4Z2X9Q3R` | Illustrative | Demo trace ID — format matches ULID-like IDs in `artifacts/api-server` trace store |
| `SRC: AIS · S&P GLOBAL` | Illustrative — representative | Real maritime data providers; feed integration shown in `artifacts/vessels` |
| `FRESHNESS: 4m` | Illustrative | Represents the freshness metadata field in the Vessels signal pipeline |
| `CITATION: OFAC SDN 2026-04-12` | Illustrative — representative | OFAC SDN list is a real public data source; citation format matches `artifacts/vessels` |

### Scene 2 — Platform Reel

| Claim | Status | Source |
|-------|--------|--------|
| Pulse briefing: "Sanctioned crude tanker..." | Illustrative | Demo briefing; scenario mirrors `artifacts/pulse` demo seed data |
| Vessels: `IMO 9821045 PACIFIC MERIDIAN` | Illustrative | Demo vessel; AIS tracking format matches `artifacts/vessels` vessel records |
| Vessels suspicion score `94` | Illustrative | Scoring model shown in `artifacts/vessels` risk assessment module |
| Vessels cargo estimate `$151.05M` | Illustrative | Formula: cargo × crude price, as implemented in `artifacts/vessels` |
| Terra: AUM `$4.2B+` | Illustrative | Representative AUM for demo portfolio; not a live figure |
| Terra: `94.2% occupancy, NOI $4.18M` | Illustrative | Demo property data; format matches `artifacts/terra` Pro Forma module |
| Aegis: `61 critical events, 7 active threats` | Illustrative | Demo threat counts; format matches `artifacts/sentra` + `artifacts/aegis` |
| Aegis: `31,200+ simulations` | Illustrative | Representative scale; simulation engine in `artifacts/aegis` |
| Lyte: `92 CONFIDENCE` | Illustrative | Demo confidence score; format matches `artifacts/lyte-command-center` decision engine |
| Unified Command cross-domain scores | Illustrative | Demo aggregation; implemented in `artifacts/command` |

### Scene 3 — Decision Fabric

| Claim | Status | Source |
|-------|--------|--------|
| 6 fabric primitives (Constellation, Trace, etc.) | Sourced | Implemented in `artifacts/api-server` — see `packages/governance-core` |
| "Every signal → recommendation → action" | Sourced | Matches trace schema in `artifacts/api-server/src/routes/trace.ts` |

### Scene 4 — APEX Mobile

| Claim | Status | Source |
|-------|--------|--------|
| Cross-domain maritime → real-estate → legal chain | Illustrative | Scenario mirrors Constellation seed data in `scripts/seed-demo-canonical.sh` |
| `POLICY: HUMAN APPROVAL MANDATORY` | Sourced | Guardian tier T6 (Tool ACL) — implemented in governance-core |

### Scene 5 — Close

| Claim | Status | Source |
|-------|--------|--------|
| "10 surfaces" | Sourced | Pulse, Vessels, Terra, Aegis, Carlota Jo, Sentra, Lyte, Conduit, Counsel, Unified Command |
| "1 governed fabric" | Sourced | `packages/governance-core` |
| Stephen Lutar, Founder & CEO | Sourced | szl.com |

---

## Logos & Branding

- All typography is system/web fonts — no external font assets required.
- Brand tokens are in `media/brand-kit/tokens.md`.
- No external logos are embedded; product surface names are text-only.

## Screenshots / Footage

- **No external footage or stock assets** are used in this video.
- All "UI mockups" in Scene 2 are programmatic React components rendered inline — not screenshots.
- The video is a pure React animation; no video clips are imported.

## Audio

- **No audio track.** Silence is intentional: designed for auto-play LinkedIn and social contexts.
- Captions are burned into the preview (CC toggle). A WebVTT file (`deliverables/captions.vtt`) is generated for external player / social upload use.

---

## Render Pipeline

```
React (Vite build)
  └─ Playwright headless Chromium (records WebM)
       └─ ffmpeg encodes four outputs:
            ├─ deliverables/linkedin-4-17.mp4          (1920×1080, 16:9, ~77s)
            ├─ deliverables/linkedin-4-17-square.mp4   (1080×1080, 1:1,  ~77s)
            ├─ deliverables/social-30s-vertical.mp4    (1080×1920, 9:16, 30s)
            └─ deliverables/social-60s-vertical.mp4    (1080×1920, 9:16, 60s)
  └─ WebVTT generator → deliverables/captions.vtt
  └─ zip → deliverables/szl-demo-video.zip
```

### Single render command

```bash
# From monorepo root — normal
pnpm --filter @workspace/szl-demo-video render

# CI / fresh environment (installs Playwright Chromium automatically)
pnpm --filter @workspace/szl-demo-video render:ci
```

### Requirements

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | ESM required |
| ffmpeg | any | Must have libx264 |
| Chromium | 100+ | Via Playwright or system install |
| Python 3 | any | For zip generation |

The render script automatically discovers Chromium in: `PLAYWRIGHT_CHROMIUM_EXECUTABLE` env → Nix store → `~/.cache/ms-playwright` → system PATH.
