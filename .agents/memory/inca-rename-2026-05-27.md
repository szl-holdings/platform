---
name: Inca verbiage rename (Mythos→Khipu, Glasswing→Pillpintu)
description: Canonical Series-A token rename across the monorepo and the two-scanner gotcha that nearly hid it.
---

Canonical product naming is Inca/Quechua. Mythos → **Khipu** (Inca knot-record system; fits doctrine/spec/registry). Glasswing → **Pillpintu** (Quechua for butterfly; preserves the transparency metaphor). Amaru is already the Conduit artifact — don't reuse it.

**Why:** The earlier "grandfathered live product surfaces" exception in the doctrine scanner was a deliberate hold, not a permanent carve-out. When the user calls for a full Series-A overhaul (no bandaids), the grandfather list itself is in scope and must shrink, not just the new-surface guard.

**How to apply:**
- Case-preserving rewrite across all scannable extensions (see `scripts/rename-inca.mjs` for the live token map and exclude list). Use plain `renameSync`, NOT `git mv` — destructive git ops are blocked in main agent.
- Two-scanner trap: there are **two independent** forbidden-pattern scanners.
  1. `scripts/check-doctrine-v6.mjs` — hardcoded `FORBIDDEN` list + path-exempt list.
  2. `scripts/check-forbidden-patterns.mjs` — reads its forbidden list from `packages/payload/raw/dev1_thesis/thesis_payload.json` `doctrine.forbidden_patterns` (and mirrors in raw_v7/dev2/dev3/dev4).
  If a token rewrite touches the payload mirrors, the legacy scanner starts forbidding the NEW canonical names. Always exclude `packages/payload/` in any rewrite script AND post-check that `doctrine.forbidden_patterns` across all 5 mirror files doesn't contain the new tokens.
- Path-exempts that should remain in v6 scanner after a full rename: `dossier/payload-2026-05-25/` (raw payload mirror) and `artifacts/audit/evidence/` (frozen historical typecheck stdouts pre-dating the rename). Do NOT path-exempt former product dirs like `packages/frontier-mythos/` after the rename — that directory should be removed entirely.
- Canonical author name on docs is "Stephen P. Lutar Jr." — the v6 scanner treats bare "Stephen Paul" as forbidden (case-sensitive).
