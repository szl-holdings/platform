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

## Notes

- AI model integration is currently demo/static. See open task: "Connect Pulse briefings to a real AI model so content is generated live."
- PDF export is planned. See open task: "Add working PDF export to the Pulse briefing reader."
