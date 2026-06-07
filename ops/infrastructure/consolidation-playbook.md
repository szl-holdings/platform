# Consolidation Playbook — Phase 12

Generated: 2026-04-15

## Objective

Reduce operational complexity by consolidating duplicated functionality, deregistering archived apps, and establishing clear ownership boundaries.

## Step 1: Deregister Archived Artifacts — ✅ COMPLETE

The following artifacts were deprecated and have been deregistered. Workflows removed; code directories retained for historical reference per `ops/frontier/disposition-matrix.md`.

| Artifact | Reason | Disposition |
|----------|--------|-------------|
| firestorm | Superseded by aegis (canonical defense path) | Deregistered; ARCHIVED.md added |
| imperium | Merged into command | Deregistered; DEPRECATED.md added |
| lyte-command-center | Merged into command | Deregistered; DEPRECATED.md added |
| prism-counsel | Deprecated (task #579) | Deregistered; DEPRECATED.md added |
| stephen-site | Deprecated (task #579); content moved to /founder | Deregistered; DEPRECATED.md added |

No active workflow or registered route exists for any of these surfaces. See `ops/frontier/disposition-matrix.md` for the canonical disposition record.

## Step 2: Library Consolidation Audit

Check for libraries that overlap or could be merged:

| Library Pair | Action |
|-------------|--------|
| lib/ai-engine + lib/ai-* | Verify ai-engine is the canonical AI package |
| lib/shared-ui + lib/ui-* | Verify shared-ui is the single UI package |
| lib/observability + lib/telemetry | Verify no duplication |

## Step 3: Configuration Alignment

Ensure all active artifacts share:
- Same TypeScript version and config pattern
- Same Vite version and config pattern
- Same React version
- Same Tailwind configuration approach
- Same ESLint rules

## Step 4: Workflow Cleanup

After deregistering archived artifacts:
- Remove their workflows from Replit configuration
- Free up workflow slots (currently using all available)
- Verify remaining workflows are healthy

## Step 5: Documentation

After consolidation:
- Update `replit.md` with current architecture
- Update `ops/replit-agent/repo-inventory.md`
- Archive stale documentation
- Create canonical "what runs where" map

## Success Criteria

- [ ] Active artifacts reduced to 10 (from 15)
- [ ] All workflows correspond to active artifacts
- [ ] No duplicate functionality across artifacts
- [ ] Documentation matches reality
- [ ] Build time < 3 minutes for full workspace
