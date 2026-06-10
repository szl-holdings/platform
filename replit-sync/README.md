# replit-sync

Agent-to-agent **work-order and sync scratch** (parent planner -> Forge). Files here
are operational directives, payloads, and status notes -- not product docs or
published-claims surfaces.

## Excluded from the org Doctrine grep

These docs must *quote* the doctrine's banned phrases (e.g. the SLSA-level and
Lambda-uniqueness rules) in order to **describe** the rules themselves. That made them
self-trip the org-wide Doctrine invariants. `replit-sync/` is therefore excluded from
the doctrine grep in `szl-holdings/.github` (`.github/workflows/doctrine-check.yml`),
mirroring the existing `coordination/`, `cursor-directives/`, and `corpus/`
agent-meta exclusions. This is loosen-only: no product or published-claims surface
leaves doctrine scope.

Honesty doctrine still applies to everything outside this directory: Lambda uniqueness is
Conjecture 1 (never a theorem); SLSA posture is L1-honest with build-attested
provenance scoped to the two shipping product images only.
