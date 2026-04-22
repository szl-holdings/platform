# SZL Holdings — Proof Chain Specification

## Purpose

The Proof Chain is an immutable, hash-linked audit trail that records every consequential action in the governed decision operating system. It provides tamper-evident provenance for every AI recommendation, human approval, and business outcome.

## Implementation

Package: `lib/proof-chain`
API routes: `artifacts/api-server/src/routes/proof-chain.ts`

## Data Model

### Chain Entry

Each entry in the proof chain is hash-linked to its predecessor:

```
Entry N-1 ←── Entry N ←── Entry N+1
  hash          hash          hash
   ↑             ↑             ↑
   │             │             │
 content       content       content
 + prev_hash   + prev_hash   + prev_hash
```

### Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique entry identifier |
| `decision_id` | string | Links to the parent decision |
| `sequence` | number | Position in the chain |
| `timestamp` | ISO 8601 | When the action occurred |
| `actor` | ActorIdentity | Who/what performed the action |
| `action_type` | enum | signal, analysis, recommendation, approval, execution, verification, outcome |
| `action_summary` | string | Human-readable description |
| `evidence` | EvidenceBundle | Supporting data with source references |
| `policy_refs` | string[] | Which policies were evaluated |
| `confidence` | number | 0.0–1.0 confidence in the action |
| `previous_hash` | string | Hash of the previous entry (chain link) |
| `hash` | string | SHA-256 hash of this entry's content + previous_hash |
| `tenant_id` | string | Organizational scope |
| `replay_handle` | string | Reference for decision replay |

### Hash Computation

```
hash = SHA-256(
  decision_id +
  sequence +
  timestamp +
  actor.id +
  action_type +
  JSON.stringify(evidence) +
  previous_hash
)
```

## Integrity Verification

The chain can be verified by recomputing hashes from the first entry:
1. Verify entry 0 hash matches its content
2. For each subsequent entry, verify `previous_hash` matches the prior entry's `hash`
3. Recompute the hash from content and compare

Any break in the chain indicates tampering or corruption.

## Query Interface

| Endpoint | Purpose |
|----------|---------|
| `GET /api/proof-chain/:decision_id` | Full chain for a decision |
| `GET /api/proof-chain/:decision_id/verify` | Chain integrity verification |
| `GET /api/proof-chain/:decision_id/latest` | Most recent entry |
| `POST /api/proof-chain/:decision_id/entries` | Append new entry |

## Integration

- **Decision Replay**: Proof chain entries are the source data for full decision reconstruction
- **Command Arena**: Evidence completeness scoring checks proof chain coverage
- **Trust Center**: Proof chain integrity is a key trust indicator
- **Regulatory Compliance**: Chain provides the audit trail required by EU AI Act and SEC disclosure rules
