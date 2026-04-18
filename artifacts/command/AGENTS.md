# AGENTS — artifacts/command

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the Unified Command artifact.

## What This Is

Command is the cross-domain operations hub. It surfaces signals from all eight domain packs in a unified dashboard via SSE, provides the Cognitive Consoles (`/cognitive`), and hosts the cross-domain Decision Center (`/decisions`). It is NOT a domain pack — it is the command layer above all domain packs.

## Key Principles

- **No domain-specific logic.** Command aggregates and routes; it does not implement domain intelligence. Domain rules live in the domain artifact AGENTS.md files.
- **Correlation IDs are the spine.** Every signal that arrives at Command must carry its original `correlationId` from the emitting domain. Never strip it.
- **Cross-domain signal correlation is explicit.** When a `cross_domain_alert` signal is raised, the linked signals must be surfaced with their original domain context, not merged into a single unnamed alert.

## Cognitive Consoles (`/cognitive`)

Three read-only inspection surfaces:
1. **`/cognitive`** — Cognitive Command Center: live runtime state, autonomy tier, active agent runs, verifier decisions, system reflections.
2. **`/cognitive/self-model`** — Self Model Console: ATLAS-Core self-model inspection.
3. **`/cognitive/world-model`** — CONSTELLATION world model graph explorer.

These are **read-only**. They must not expose any write operations or approval triggers. They gracefully fall back to rich demo data when real API endpoints are not yet available.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/decisions/` | Cross-domain Decision Center |
| `src/pages/cognitive/` | Cognitive Consoles |
| `src/pages/strategy/` | Strategy dashboard |
