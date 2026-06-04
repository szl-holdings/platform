# SZL Holdings — Provenance Stress Harness

## Purpose

Stress-test evidence completeness, replayability, audit artifacts, and tamper/failure scenarios. The goal is to make provenance robust, not performative.

## Test Classes

### 1. Missing Evidence Links
- Simulate decisions where evidence references point to nonexistent entities
- Verify the proof chain flags the gap
- Expected behavior: chain entry marked "evidence-incomplete"

### 2. Broken Replay Chains
- Inject a gap in the proof chain (remove a middle entry)
- Verify integrity check fails with specific error
- Expected behavior: verification endpoint returns `integrity: false` with gap location

### 3. Overconfident Output Artifacts
- Generate a recommendation with low-quality input but high stated confidence
- Verify the calibration loop detects the deviation after outcome measurement
- Expected behavior: model accuracy score decreases in registry

### 4. Unnatural Verification Patterns
- Submit verifications faster than physically possible
- Verify anomaly detection flags the pattern
- Expected behavior: verification flagged for review

### 5. Trace Tampering Simulations
- Modify a historical proof chain entry
- Verify hash chain breaks at the tampered entry
- Expected behavior: all subsequent entries marked invalid

### 6. Audit Gap Scenarios
- Execute a decision that bypasses the proof chain writer
- Verify the audit gap is detected in the next arena evaluation
- Expected behavior: evidence completeness score drops

### 7. Memory Manipulation Scenarios
- Inject contradictory information into entity memory
- Verify contradiction detection flags the conflict
- Expected behavior: memory write rejected or flagged for review

### 8. Tool Call Omission Scenarios
- Execute a workflow where a required tool call is skipped
- Verify the trace graph shows the missing step
- Expected behavior: replay completeness score drops in arena evaluation

## Implementation

Script: `scripts/security/run-provenance-stress.ts` (not yet created — scaffold specification only)

The stress harness integrates with Command Arena — stress scenarios are a specialized scenario pack that tests governance integrity rather than business correctness.

## Scoring

Provenance stress results feed into the Release Readiness Scorecard:
- All tamper detection tests must pass
- All gap detection tests must pass
- All integrity verification tests must pass
- Failures block release with documented reason
