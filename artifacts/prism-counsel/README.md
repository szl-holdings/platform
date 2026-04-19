# PRISM Counsel — Legal Command

Legal command surface for the SZL Holdings platform. Surfaces active matters, legal exposure mapping, contract lifecycle management, and AI-assisted risk classification.

**Kind:** web
**Preview path:** `/prism-counsel/`
**Artifact dir:** `artifacts/prism-counsel/`

## Screenshots

| View | Path |
|------|------|
| Hero — Legal command overview | `media/screenshots/prism-counsel/hero.png` |
| Matters view | `media/screenshots/prism-counsel/matters.png` |

Regenerate: `bash scripts/capture-screenshots.sh prism-counsel`

## Local development

```bash
pnpm --filter @szl-holdings/prism-counsel dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Matter Center | Active legal matters with exposure scoring |
| Exposure Graph | Cross-portfolio legal risk visualization |
| Contract Monitor | Contract obligations, deadlines, and renewal triggers |
| Policy Gating | Counsel-required actions with Guardian approval queue |
| Audit Export | Immutable legal event logs for regulatory use |

## Notes

See `media/brand-kit/tokens.md` for the visual brand standards that govern this surface.
