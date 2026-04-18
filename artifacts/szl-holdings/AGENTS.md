# AGENTS — artifacts/szl-holdings

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the SZL Holdings corporate dashboard artifact.

## What This Is

`szl-holdings` is the root artifact (`/`). It serves as:
1. The corporate and investor portal (public-facing brand, investor docs, Aegis pitch deck redirect).
2. The current carrier of Lyte business observability surfaces (until Lyte gets its own artifact).
3. The Forge governed agent factory UI (`/forge`).
4. The primary Decision Center for platform-level governance (`/decision-center`).

## Important: Lyte Surfaces Live Here (Temporarily)

The business observability surfaces (PRISM dashboard, decision center, strategy pages) are mounted in this artifact until Lyte gets its own artifact. When Lyte is extracted, move these pages — do not duplicate them.

## Rules

- The root path (`/`) must remain the corporate/investor portal. Do not mount operator-facing pages at root.
- The Forge UI (`/forge`) is operator-only. Guard all Forge routes with `operator` role or higher.
- The seed endpoint (`/api/admin/seed`) must not be callable in production (`NODE_ENV === "production"` check).
- Demo mode indicator must be visible whenever `DEMO_MODE=true` is set or seeded data is being displayed.

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/` | All route pages |
| `src/pages/forge/` | Forge agent factory UI |
| `src/pages/decision-center/` | Platform Decision Center |
| `src/pages/strategy/` | Strategy dashboard (Lyte surfaces) |
