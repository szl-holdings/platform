# P0 Remediation — Critical Fixes

## P0-001: GitHub CI Workflows (FIXED)
- **Before**: Single CI workflow only building api-server
- **After**: Matrix builds for all 8 web apps, typecheck matrix, CodeQL, dependency review, release workflow
- **Status**: DONE

## P0-002: CODEOWNERS (FIXED)
- **Before**: Missing
- **After**: All paths assigned with proper ownership
- **Status**: DONE

## P0-003: alloy-intelligence.tsx Using Local Components
- **Issue**: Uses local ConfidenceMeter/EvidenceCard instead of shared-ui ConfidenceBand/EvidencePanel/DecisionCard
- **Impact**: Inconsistent AI decision presentation
- **Fix**: Migrate to shared-ui components
- **Status**: TO FIX

## P0-004: EnvironmentLabel Not Wired Into UI
- **Issue**: Exists in shared-ui but unused in any product surface
- **Impact**: No visible environment labeling (Demo/Pilot/Live)
- **Fix**: Add to app shells
- **Status**: TO FIX

## P0-005: Retrieval Singleton No Tenant Partition
- **Issue**: alloyRetrieval has no tenantId in queries
- **Impact**: Cross-tenant data leakage risk in retrieval
- **Fix**: Add tenantId parameter to all retrieval operations
- **Status**: DEFERRED (requires tenant context refactoring)

## P0-006: Force-Push GitHub Workaround
- **Issue**: Must remove .github/workflows before pushing due to branch protection
- **Impact**: Bypasses branch protection on every push
- **Fix**: Adjust branch protection settings in GitHub UI
- **Status**: REQUIRES MANUAL ACTION
