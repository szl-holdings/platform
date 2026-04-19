# Sentra — Cyber Resilience Command

Domain pack for cyber resilience and threat intelligence. Surfaces active threat monitoring, AI-assisted incident triage, security posture scoring, and Guardian-approved response actions.

**Kind:** web
**Preview path:** `/sentra/`
**Artifact dir:** `artifacts/sentra/`

## Screenshots

| View | Path |
|------|------|
| Hero — Cyber posture overview | `media/screenshots/sentra/hero.png` |
| Threat dashboard | `media/screenshots/sentra/dashboard.png` |

Regenerate: `bash scripts/capture-screenshots.sh sentra`

## Local development

```bash
pnpm --filter @szl-holdings/sentra dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Threat Monitor | Real-time threat detection and severity scoring |
| Incident Triage | AI-assisted incident prioritization with Proof Chain |
| Posture Dashboard | Cross-environment security posture overview |
| Guardian Actions | Human-in-the-loop response approvals |
| Compliance Tracker | Policy adherence and audit-ready reports |

## Notes

See `media/brand-kit/tokens.md` for the visual brand standards that govern this surface.
