# SZL Holdings — Investor Pitch Deck

Interactive investor pitch deck and ATLAS runtime demonstration. Contains the Series A slides, market positioning, and the ATLAS execution engine replay and scenario-branching views.

**Kind:** web
**Preview path:** `/aegis/`
**Artifact dir:** `artifacts/aegis/`

## Screenshots

| View | Path |
|------|------|
| Hero — Deck cover | `media/screenshots/aegis/hero.png` |
| Deck slides view | `media/screenshots/aegis/deck.png` |

Regenerate: `bash scripts/capture-screenshots.sh aegis`

## Local development

```bash
pnpm --filter @szl-holdings/aegis dev
```

## Key sections

| Route | Purpose |
|-------|---------|
| `/aegis/` | Slide deck (S01 Cover through S09 Ask) |
| `/aegis/atlas` | ATLAS execution runtime demo |
| `/aegis/replay` | Execution replay viewer |
| `/aegis/branches` | Scenario branch explorer |

## Notable source paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Slide pages and ATLAS surfaces |
| `src/components/` | Slide chrome and ATLAS UI components |
| `src/data/` | Slide content and ATLAS demo data |
| `src/lib/` | API client and helpers |
| `docs/` | Pitch deck supporting docs |
| `scripts/` | Build and content scripts |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API server base URL (used by ATLAS replay views) |

See `ops/infra/environment-matrix.md` for the full environment variable matrix.

## Notes

This artifact was previously the Aegis defense intelligence app path. It now hosts the investor pitch deck and ATLAS demo. The defense intelligence surface (`firestorm/`) is archived — see root `README.md` for the archived surfaces register.
