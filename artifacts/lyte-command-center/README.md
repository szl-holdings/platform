# Lyte — Decision Intelligence

Decision intelligence surface for the SZL Holdings platform. Governs structured decisions with confidence scoring, scenario simulation, and human-in-the-loop approvals powered by the Alloy Fabric.

**Kind:** web
**Preview path:** `/lyte/`
**Artifact dir:** `artifacts/lyte-command-center/`

## Screenshots

| View | Path |
|------|------|
| Hero — Decision overview | `media/screenshots/lyte/hero.png` |
| Command surface | `media/screenshots/lyte/command.png` |

Regenerate: `bash scripts/capture-screenshots.sh lyte`

## Local development

```bash
pnpm --filter @szl-holdings/lyte-command-center dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Decision Queue | Active decisions requiring review or approval |
| Scenario Simulator | Monte Carlo and branch simulation for pending choices |
| Confidence Engine | Signal-weighted confidence scores per decision |
| Outcome Ledger | Historical decision outcomes with Proof Chain |
| Guardian Approvals | Policy-gated approval workflows |

## Notes

See `media/brand-kit/tokens.md` for the visual brand standards that govern this surface.
