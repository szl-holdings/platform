# Consolidation Playbook — Phase 12

Generated: 2026-04-15

## Objective

Reduce operational complexity by consolidating duplicated functionality, deregistering archived apps, and establishing clear ownership boundaries.

## Step 1: Deregister Archived Artifacts

These artifacts are deprecated and should be deregistered:

| Artifact | Reason | Dependencies to Check |
|----------|--------|----------------------|
| aegis | Duplicate of firestorm | Verify no unique routes |
| imperium | Merged into command | Verify all features in command |
| lyte-command-center | Merged into command | Verify all features in command |
| prism-counsel | Deprecated (#579) | Check for active users |
| stephen-site | Deprecated (#579) | Content moved to /founder |

### Process
1. Verify no active traffic to archived apps
2. Stop workflows for archived apps
3. Deregister artifacts
4. Remove from Replit workflow configuration
5. Keep code in repository (do not delete)

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
