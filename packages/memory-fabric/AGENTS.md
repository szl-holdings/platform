# AGENTS — packages/memory-fabric

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the memory fabric package.

## What This Is

`@workspace/memory-fabric` provides 10-scope tiered cognitive memory: working, session, episodic, semantic, workflow, entity, artifact, operator-feedback, executive, and skill. Every memory record carries provenance, freshness, retention policy, and sensitivity tier. Lesson distillation and episodic summarization run automatically on expiry.

## Critical Rules

- **Provenance is mandatory.** Every `write()` call must supply a `source` (who or what wrote this memory) and a `correlationId` (what signal or action caused this write).
- **Sensitivity tiers control access.** Memory records with `sensitivity: "confidential"` or `"restricted"` must not be returned to agents operating below the required trust level. The `store` enforces this — do not bypass it with raw DB queries.
- **Retention is enforced, not suggested.** The `retention` module deletes expired records on schedule. Do not write logic that assumes memory records persist indefinitely.
- **Skill memories are governance-reviewed.** Records in the `skill` scope are surfaced for governance review before being promoted to production skills. Do not mark a skill as `approved` without the review record in the Proof Chain.

## Key Files

| File | Purpose |
|------|---------|
| `src/store.ts` | In-memory store interface |
| `src/postgres-store.ts` | PostgreSQL-backed store |
| `src/retention.ts` | Retention enforcement and expiry |
| `src/behaviors.ts` | Episodic summarization, lesson distillation |
| `src/types.ts` | Memory scope and record types |
