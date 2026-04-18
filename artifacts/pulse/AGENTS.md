# AGENTS — artifacts/pulse

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the Pulse AI executive briefing artifact.

## What This Is

Pulse delivers AI-generated executive briefings — structured intelligence summaries with evidence provenance, freshness stamps, and policy clearance. Every briefing is a `brief` entity (from `@workspace/ontology`) and must pass through the Proof Chain before being surfaced.

## Critical Rules

- **Every briefing must have a Proof Chain entry.** No AI-generated brief content can be displayed without a `proofId` in the response envelope. Use `tagAIContent()` from `lib/proof-chain`.
- **Briefing sections must show freshness.** Each section of a brief is backed by signals with a freshness level. If any section's backing signals are `stale` or `expired`, the section must show a degradation indicator — never render as if current.
- **Export safety before PDF.** `assertExportSafe()` must be called before generating any exportable PDF brief. Policy state: `cleared` or `conditional` only.
- **Demo mode must be labeled.** When serving seeded briefing data, a "DEMO" badge must be visible.

## Entity Types

Pulse domain uses: `brief`. Signal types sourced from all domains (cross-domain briefing). Import from `@workspace/ontology`.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/` | Route pages |
| `src/pages/BriefingReader.tsx` | Primary briefing display |
| `src/pages/decisions.tsx` | Decision center (cross-domain) |
