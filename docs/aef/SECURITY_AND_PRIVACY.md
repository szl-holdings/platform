# AEF Security and Privacy

This document describes the security controls, privacy architecture, and data governance obligations that apply to every retrieval operation executed through the Alloy Embedding Fabric.

## Privacy Tiers

AEF enforces five privacy levels. Each level corresponds to specific handling requirements enforced by the policy guard.

| Level | Description | Cross-Tenant | Cross-Region | Deletion Required |
|---|---|---|---|---|
| `public` | Unrestricted content | Allowed | Allowed | No |
| `internal` | SZL internal operational data | Blocked | Blocked | No |
| `confidential` | Client-sensitive operational data | Blocked | Blocked | No |
| `restricted` | Security-sensitive intelligence | Blocked | Blocked | No |
| `privileged` | Legal and advisory content under privilege | Blocked | Blocked | Yes |

### Privileged Content Handling

Documents indexed under `privileged` profiles (Counsel, Carlota Jo) are subject to the following additional controls:

1. **Strict tenant boundary enforcement** — privileged chunks are tagged with a `tenantId` at indexing time. The policy guard rejects any retrieval request from a different `tenantId`, even if the request otherwise passes all other checks.

2. **No cross-region replication** — the vector index must not replicate privileged chunks to regions outside the primary data residency zone. This is enforced in the profile's `retentionRules.allowCrossRegionReplication: false` field.

3. **Mandatory deletion** — when a client terminates their engagement or invokes their data deletion right, all indexed chunks associated with that `tenantId` must be purged from the vector index, the evidence ledger, and any backup stores. The `retentionRules.deletionRequired: true` flag triggers this workflow.

4. **Audit trail retention** — even after content deletion, the audit trail (evidence ledger entries confirming what was retrieved and when) is retained for the period specified in `retentionRules.auditTrailRetentionDays`. The trail records retrieval events without retaining the content of the chunks.

## Tenant Boundary Enforcement

Tenant isolation is not optional and has no override. The enforcement chain is:

1. Every retrieval request must carry a valid `tenantId` in the authentication context.
2. The profile resolver checks the tenant's `allowedProfiles` list. If the requested profile is not in the list, the request is rejected with HTTP 403 before any retrieval occurs.
3. The retrieval adapter receives the `tenantId` as a mandatory metadata filter. The vector index returns only chunks tagged with that `tenantId`.
4. The policy guard performs a second-pass check on all returned chunks, suppressing any that carry a `tenantId` mismatch (belt-and-suspenders defence against index misconfiguration).

## Encryption

All AEF profiles require encryption at rest (`encryptAtRest: true`) and in transit (`encryptInTransit: true`). These are not configurable per-request — they are fixed at the profile level.

- **At rest**: The vector index, evidence ledger store, and any JSONL export files must be stored on encrypted volumes using AES-256 or equivalent.
- **In transit**: All communication between AEF components (orchestrator to embedding worker, orchestrator to vector index, API server to orchestrator) must use TLS 1.3. Plain HTTP connections are rejected.

## Redaction

The policy guard ships a redaction hook registry. Redaction rules can be attached to a profile to strip or mask specific metadata fields before results are returned to the caller. For example, the Carlota Jo profile can be configured to redact `clientId` from chunk metadata before returning results to any caller without `privileged_content` clearance.

Redaction operates on the citation assembler output — the raw chunk scores and IDs are retained in the evidence ledger for audit purposes, but the redacted fields do not appear in the API response.

## Retention Policies

Each profile declares a retention schedule:

| Field | Description |
|---|---|
| `defaultRetentionDays` | How long indexed chunks are retained before expiry |
| `requestLogRetentionDays` | How long retrieval request logs are retained |
| `evidenceRetentionDays` | How long evidence ledger entries are retained |
| `auditTrailRetentionDays` | How long audit trail records are retained (survives content deletion) |

Retention enforcement is a background process. The scheduler runs nightly and marks chunks exceeding the `defaultRetentionDays` threshold as `expired`. Expired chunks are excluded from retrieval results by the score filter's freshness check, even if they remain in the index.

Hard deletion of expired chunks is a separate process triggered by the retention compliance workflow.

## Evidence Ledger Integrity

The evidence ledger is append-only. Once an entry is written, it cannot be modified or deleted (only the data content of associated chunks may be purged as per the deletion workflow above). The ledger supports the following integrity properties:

- **Immutability** — ledger entries carry a sequence number and a previous-entry hash, forming a tamper-evident chain.
- **Completeness** — every retrieval operation produces a ledger entry, even if it returns zero results. The ledger record for a zero-result query includes the profile version, the applied filters, and the policy decision.
- **Non-repudiation** — the ledger can be queried by request ID to produce a complete provenance report for any specific retrieval event.

## Security Scanning

The AEF package set participates in the standard workspace security scan:

```bash
pnpm run security:scan
```

This runs dependency audit and SAST analysis across `packages/aef-*`. The pipeline fails on any critical or high severity finding without a tracked exception.

## Responsible Disclosure

Security vulnerabilities in AEF components should be reported to `privacy@szlholdings.com`. Include the affected package version, a reproduction path, and your assessment of impact. Do not open public GitHub issues for security vulnerabilities.
