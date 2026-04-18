# AGENTS — packages/ontology

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for this package.

## What This Package Is

`@workspace/ontology` is the single source of truth for entity types, signal types, entity links, entity snapshots, evidence references, domain taxonomy, freshness levels, confidence conventions, and policy states across the SZL Holdings platform.

**Every package that emits, stores, or reasons about these concepts must import from here.**

## Before You Change Anything

1. Read [ontology.md](../../ontology.md) — the human-readable spec this code implements.
2. Read [architecture.md](../../architecture.md) — the package concept ownership table.
3. Check that your change doesn't break `packages/atlas-core` or `packages/policy-engine`, which are the primary consumers.

## Rules for This Package

- **No internal dependencies.** This package must have zero dependencies on other `@workspace/*` or `@szl-holdings/*` packages. Only `zod` is permitted.
- **Every new type must be in the exports map** in `package.json`. Do not create types that are not exported.
- **Adding a new entity type** requires updating: `src/entities.ts`, `ENTITY_TYPE_LABELS`, `ENTITY_TYPE_DOMAINS`, and `ontology.md § Core Entity Types` in the same change.
- **Adding a new signal type** requires updating: `src/signals.ts`, `SIGNAL_TYPE_DOMAINS`, and `ontology.md § Signals` in the same change.
- **Adding a new domain** requires updating: `src/domains.ts`, `DOMAIN_LABELS`, `ENTITY_TYPE_DOMAINS`, and `ontology.md § Domains` in the same change.
- **Never change the shape of `BaseEntity`** without a migration plan for all consumers.
- **`FreshnessLevel`, `PolicyState`, `confidence` are never optional** on `BaseEntity`. Do not make them optional to work around a type error.

## Key Files

| File | Purpose |
|------|---------|
| `src/domains.ts` | Canonical domain taxonomy |
| `src/entities.ts` | Entity types, freshness, policy state, base and domain entity shapes |
| `src/signals.ts` | Signal types, severity, source, and signal shape |
| `src/entity-links.ts` | Typed relationships between entities |
| `src/entity-snapshot.ts` | Point-in-time snapshots for proof chain and replay |
| `src/evidence.ts` | Evidence references, proof entries, source classes |
| `src/index.ts` | Re-exports everything; this is the public surface |
