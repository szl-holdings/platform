# Pulse — AI Executive Briefing

Generates narrative intelligence briefings synthesized from live platform signals across all domains. Surfaces trend analysis, risk summaries, and opportunity highlights in a structured report format.

**Kind:** web
**Preview path:** `/pulse/`
**Artifact dir:** `artifacts/pulse/`

## Local development

```bash
pnpm --filter @szl-holdings/pulse dev
```

## Key modules

| Module | Purpose |
|--------|---------|
| Briefing Reader | Structured narrative intelligence reports |
| Signal Synthesis | Cross-domain signal aggregation and summarization |
| Briefing Archive | Historical briefing index |

## Notable source paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Briefing reader and archive routes |
| `src/components/` | Briefing layout components |
| `src/lib/` | API client and formatting helpers |

## Key environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_DEMO_ALLOWED` | Toggle demo-mode briefings |
| `VITE_STRIPE_PRICE_PULSE_EXECUTIVE` | Stripe price ID for the Pulse Executive tier |

AI provider keys live on `api-server` (`AI_INTEGRATIONS_*`). See `ops/infra/environment-matrix.md` for the full environment variable matrix.

## Notes

- AI model integration is currently demo/static. See open task: "Connect Pulse briefings to a real AI model so content is generated live."
- PDF export is planned. See open task: "Add working PDF export to the Pulse briefing reader."
