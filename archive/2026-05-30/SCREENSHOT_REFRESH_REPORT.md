# Screenshot Refresh Report

**Audit Date:** April 28, 2026
**Auditor:** Platform documentation refresh (Task #3210)

---

## Summary

| Category | Count |
|----------|-------|
| Screenshots in `public-approved/` | 23 items (8 organized subfolders + 15 individual files) |
| Screenshots moved to `archive/` | 64 items |
| Screenshots needing re-capture | See table below |
| Broken image references in docs | None found |

---

## Public-Approved Screenshot Set

The following screenshots have been curated into `screenshots/public-approved/` as the canonical set for investor/buyer materials, social media, and public-facing documentation.

### Organized Subfolders (April 16, 2026 capture — highest quality set)

| Subfolder | Product | Count | Notes |
|-----------|---------|-------|-------|
| `szl-holdings/` | SZL Holdings Dashboard | 7 | Home, Platform, Portfolio, App Ecosystem, Forge, Solutions: Sentra, Solutions: Vessels |
| `aegis/` | Sentra (formerly Aegis) SOC | 10 | Marketing, SOC dashboard, MITRE ATT&CK, Citadel War Room, pricing |
| `vessels/` | Vessels Maritime | 6 | Home, Fleet Dashboard, Map (WebGL issue noted), Voyage Economics, Exceptions, Port Intel |
| `terra/` | Terra Real Estate | 5 | Home, Property Dashboard, Deal Flow, Market Analytics, Distress Engine |
| `carlota-jo/` | Carlota Jo Consulting | 5 | Home, Services, Approach, Who We Serve, Advisory Intel |
| `command/` | Unified Command | 5 | Home, Strategy Dashboard, Executive Briefing, Operations Center, Blocker Board |
| `lyte/` | Lyte Command Center | 5 | Home Dashboard, Platform Pulse, Blocker Board, Performance Intelligence, Executive Briefing |
| `cortex-mobile/` | CORTEX Mobile | 6 | Home Dashboard, Portfolio, Fleet, Defense (Sentra), Operations, Advisory |

### Individual Fresh/Clean Files (Root Level — Best Single Shots)

| File | Product | Notes |
|------|---------|-------|
| `sentra-cyber.jpg` | Sentra | Current brand name (not Aegis/Firestorm) |
| `counsel-legal.jpg` | Counsel | Only current Counsel screenshot in root |
| `unified-command.jpg` | Command | Clean composite |
| `szl-holdings-hero-fresh.jpg` | SZL Holdings | Fresh hero shot |
| `szl-holdings-ecosystem-fresh.jpg` | SZL Holdings | Ecosystem map, fresh state |
| `vessels-fleet-command.jpg` | Vessels | Fleet command view |
| `vessels-dashboard-clean.jpg` | Vessels | Clean dashboard state |
| `aegis-command-clean.jpg` | Sentra | Command surface, clean state |
| `aegis-hero-clean.jpg` | Sentra | Hero, clean state |
| `carlota-jo-hero-clean.jpg` | Carlota Jo | Hero, clean state |
| `carlota-jo-services-clean.jpg` | Carlota Jo | Services page, clean state |
| `terra-hero.jpg` | Terra | Hero shot |
| `terra-dashboard.jpg` | Terra | Dashboard view |
| `lyte-board-clean.jpg` | Lyte | Board view, clean state |
| `lyte-hero-clean.jpg` | Lyte | Hero, clean state |

---

## Archived Screenshots

Moved to `screenshots/archive/`. These are retained for reference but should not be used in new materials.

### Numbered Sequence Set (01–19) — Superseded

The numbered root files (`01-szl-holdings-dashboard.jpg` through `19-sentra.jpg`) are an older export batch that predates the organized subfolder capture of April 16. They are superseded by the cleaner subfolder set and have been archived.

### Stale Brand Names

| Pattern | Brand Issue | Count Archived |
|---------|------------|----------------|
| `prism-counsel-*` | "Prism Counsel" is the deprecated brand name. Product is now **Counsel**. | 10 files |
| `alloy-*.jpg` (root) | "Alloy" is the internal platform name, not a public-facing product. | 12 files |
| `alloy-platform/` (folder) | Same — internal brand | 1 folder |
| `firestorm-aegis.jpg` | "Firestorm" and "Aegis" brand names deprecated. Product is now **Sentra**. | 1 file |
| `nerve-center.jpg` | Unidentified / no current product mapping | 1 file |

---

## Screenshots Needing Re-Capture

These surfaces do not have satisfactory screenshots in the current set. They require capturing from a running instance.

| Product | Surface | Priority | Blocker |
|---------|---------|----------|---------|
| **Counsel** | Full dashboard, matter management, obligation tracker | High | No full Counsel capture exists |
| **Pulse** | Executive briefing view, cross-domain synthesis | High | No Pulse screenshot in set |
| **Vessels** | Fleet map with vessel positions | Medium | WebGL initialization fails in screenshot environment; requires browser with GPU |
| **Lyte** | Full action queue with live signals | Medium | Port 19291 workflow conflict in Replit env |
| **CORTEX Mobile** | All screens with real data | Medium | Requires Expo Go on physical/virtual device |
| **Command** | Strategy dashboard with live data | Low | API server must be running; current capture shows loading state |
| **Terra** | Map view with Mapbox tiles | Low | Requires Mapbox token |

---

## Documentation Image Reference Audit

Docs were scanned for broken image references (references to image files that no longer exist at the referenced path).

**Result: No broken image references found** in investor/buyer docs.

The following docs reference screenshots or contain image links:
- `screenshots/README.md` — links are to file descriptions, not embedded images
- `docs/INVESTOR_PLATFORM_BRIEF.md` — no image references
- `docs/BUYER_READINESS.md` — no image references

---

## What Was Kept vs. Archived — Decision Logic

| Decision | Rationale |
|----------|-----------|
| Keep organized subfolders intact | These are the cleanest, most systematically captured set (April 16) |
| Archive numbered root files | Older export batch; superseded by subfolder organization |
| Archive `prism-counsel-*` | Product renamed to Counsel; old brand name creates confusion |
| Archive `alloy-*` files | Alloy is the internal orchestration layer name, not a public product |
| Archive `firestorm-aegis.jpg` | Old brand name; product is Sentra |
| Keep `sentra-cyber.jpg` | Current brand name; add to public-approved |
| Keep `counsel-legal.jpg` | Only usable Counsel screenshot; high priority for re-capture |
| Keep `web-apps/` subfolder intact | Contains fresh captures from April 17; useful reference even if not all public-approved |

---

## Recommended Next Steps

1. **Capture Counsel full dashboard** — highest priority gap; no usable screenshots exist
2. **Capture Pulse executive briefing** — second priority; visible in platform but no screenshot
3. **Capture Vessels fleet map** in a browser environment with WebGL support
4. **Capture Lyte action queue** once workflow port conflict is resolved
5. **Replace any `Aegis` or `Firestorm` references** in public materials with `Sentra`
6. **Update `screenshots/README.md`** after re-captures to reflect the current set
