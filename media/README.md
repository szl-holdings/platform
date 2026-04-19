# SZL Holdings Media Kit

This directory contains all production media assets for the SZL Holdings platform.

## Structure

```
media/
├── brand-kit/
│   └── tokens.md           Visual brand tokens (colors, typography, standards)
├── screenshots/
│   ├── szl-holdings/       SZL Holdings Dashboard
│   ├── pulse/              Pulse — AI Executive Briefing
│   ├── sentra/             Sentra — Cyber Resilience Command
│   ├── lyte/               Lyte — Decision Intelligence
│   ├── vessels/            Vessels Maritime Intelligence
│   ├── terra/              Terra — Real Estate Intelligence
│   ├── prism-counsel/      PRISM Counsel — Legal Command
│   ├── counsel/            Counsel — Legal Matter Command
│   ├── aegis/              Aegis — Investor Pitch Deck
│   ├── command/            Unified Command
│   └── szl-demo-video/     Demo Video stills
└── thumbnails/             Video thumbnails (1280×720)
```

## Regenerating Screenshots

All workflows must be running before regenerating.

```bash
# Refresh all artifact screenshots
bash scripts/capture-screenshots.sh

# Refresh a single artifact (e.g. after a UI change to Sentra)
bash scripts/capture-screenshots.sh sentra
```

Screenshots are captured at 1920×1080 with deviceScaleFactor 2, producing 3840×2160 files in PNG format.

## Video Assets

The platform demo video lives at `artifacts/szl-demo-video/`. It includes:

- **Full platform demo** (70s) — complete walkthrough of SZL Holdings governance story
- **60s cut** — platform overview + proof
- **30s cut** — value proposition + close
- **15s cut** — hook + tagline

See `media/brand-kit/tokens.md` for visual brand standards that govern all video and screenshot assets.

## Brand Kit

See `media/brand-kit/tokens.md` for:
- Color palette (hex codes and usage)
- Typography (fonts, weights, roles)
- Intro / outro card specs
- Lower-thirds design
- Caption style guide
- Screenshot standards
- File organization conventions
