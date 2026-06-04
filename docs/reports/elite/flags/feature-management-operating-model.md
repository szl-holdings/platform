# Feature Management Operating Model

## Overview
Feature flags provide controlled rollout, safe releases, and experimentation capabilities across the SZL platform.

## Flag Types
| Type | Purpose | Permanence |
|------|---------|-----------|
| Release Flag | Control new feature visibility | Temporary (remove after 100% rollout) |
| Experiment Flag | A/B test variations | Temporary (remove after experiment concludes) |
| Ops Kill Switch | Emergency disable | Semi-permanent (quarterly review) |
| Internal-Only Flag | SZL team features | Temporary (promote or remove) |
| Beta Access Flag | Beta program users | Temporary (promote to release or remove) |
| Platform Safety Flag | System-level controls | Permanent (quarterly review) |

## Ownership
- Every flag has an assigned owner
- Owner is responsible for cleanup when flag is fully rolled out
- Ownership transfers during team changes

## Lifecycle
1. **Created**: Flag registered with all required metadata
2. **Active**: Flag in use for rollout or experiment
3. **Rolled Out**: 100% enabled, ready for cleanup
4. **Removed**: Flag checks removed from code, flag deleted

## Cadence
- **Weekly**: Review flags approaching expiry
- **Monthly**: Audit active flags for staleness
- **Quarterly**: Full flag registry audit, review permanent flags

## Current State
- Feature flag schema documented
- Cleanup policy documented
- Operations guide documented
- Flag service not yet instrumented in application code (P1 gap)
