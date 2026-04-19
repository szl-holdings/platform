# Counsel — Legal Matter Command

Legal matter intelligence surface for tracking obligations, deadlines, counterparty exposure, and compliance events across the SZL Holdings portfolio.

**Kind:** web
**Preview path:** `/counsel/`
**Artifact dir:** `artifacts/counsel/`

## Screenshots

| View | Path |
|------|------|
| Hero — Matter overview | `media/screenshots/counsel/hero.png` |
| Dashboard view | `media/screenshots/counsel/dashboard.png` |

Regenerate: `bash scripts/capture-screenshots.sh counsel`

## Local development

```bash
pnpm --filter @szl-holdings/counsel dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Matter Dashboard | Active legal matter tracking with urgency scoring |
| Obligation Timeline | Deadline and obligation management |
| Counterparty Map | Legal exposure by entity and counterparty |
| Compliance Center | Regulatory compliance status and gap analysis |
| Human Lock | Policy-mandated human review gates |

## Notes

See `media/brand-kit/tokens.md` for the visual brand standards that govern this surface.
