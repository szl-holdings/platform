# Amaru — Retention and Deletion Policy

**Document ID:** AMARU-COMP-RD-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** NYSTEC, customer data owners, privacy officers, regulators
**Classification:** Public

---

## 1. Statement

Amaru's append-only delta log is the technical centerpiece of the product. Append-only does not mean "retain forever." This policy defines, by data category, how long each kind of data is retained, how deletion is performed and verified, how an append-only architecture can honor deletion requests, and how SZL distinguishes between operational logs (its own) and customer data (the customer's).

## 2. Categories and defaults

| Category | Owner | Default retention | Maximum retention | Deletion semantics |
|---|---|---|---|---|
| **Customer payload data** (records flowing through Amaru in transit) | Customer | Pass-through; not stored beyond the configured queue/buffer | 24 hours buffer | Cryptographic shred + delete on TTL |
| **Customer durable data** (records the customer has elected to persist in Amaru — change-data-capture log, reconciliation snapshots) | Customer | Per customer policy; 365 days default | 7 years (for regulated retention requirements) | Cryptographic shred + delete on schedule or on customer-initiated deletion |
| **Classification metadata** (tier, basis, detection events) | SZL on customer's behalf | Same retention as the underlying record | Same as underlying record | Tied to record lifecycle |
| **Evidence-ledger anchors** (hash chains, attestation rows) | SZL | 7 years post record-deletion | Indefinite if customer requires immutable audit | Anchors store hashes only — not source data — so retaining anchors does not retain source content |
| **Operational logs** (Amaru's own logs about its own behavior) | SZL | 90 days | 365 days | Standard log lifecycle |
| **Audit logs** (security/access logs about Amaru itself) | SZL | 365 days | 7 years for compliance-bound deployments | Standard log lifecycle |
| **Backups** | SZL | 35 days rolling | 90 days for compliance-bound deployments | Encrypted; key-shred on deletion |

## 3. The append-only-versus-deletion problem

Most "append-only" systems become a privacy liability the moment a deletion request arrives. Amaru solves this with three guarantees:

1. **Source content vs. evidence anchor.** The evidence ledger stores cryptographic hashes that prove a record existed and what its classification was, but does **not** store the source content. Deleting the source content does not break the audit trail; it makes the trail anchor-only, which is exactly what privacy law expects.

2. **Tombstoning.** A deletion request produces an explicit `delete-event` row appended to the log. The event references the deleted record's id, classification, requester, and timestamp. The original record's payload is then cryptographically shredded (key destruction in the customer's KMS).

3. **Replay correctness preserved.** Any later replay run that touches a deleted record encounters the tombstone and returns an authentic `record_deleted` result rather than failing. This is enforced by `codex-kernel` `replay()`.

## 4. Customer-initiated deletion

Customers may request deletion via three channels:

- **Self-service** — In-product request that propagates within 1 hour to the deletion queue.
- **API** — `DELETE /v1/records/{id}` and bulk variants.
- **Email** — `privacy@szlholdings.com` for non-API workflows.

For each request, SZL produces a written deletion attestation containing:

- The record IDs deleted
- The deletion timestamp
- The deletion mechanism (key shred / overwrite / TTL expiry)
- The evidence ledger anchor of the `delete-event` row
- The expected propagation deadline to all replicas, backups, and downstream sinks

## 5. Subject-rights deletion (CCPA / GDPR / state privacy laws)

For data-subject requests reaching the *customer*, the customer is the controller and SZL is the processor. Workflow:

1. Customer initiates a subject-rights deletion against their own systems and against Amaru.
2. Amaru's deletion API accepts the request and performs §3 immediately.
3. SZL provides the customer with the §4 attestation; the customer hands it to the data subject.
4. SZL does not directly correspond with the data subject unless contractually required.

For requests reaching SZL Holdings directly (rare; SZL is rarely a controller), SZL routes to the relevant customer or, where SZL is the controller (e.g., its own marketing list), executes the request directly within statutory deadlines.

## 6. Retention overrides for legal hold

When a customer or a regulator places a legal hold:

- The affected records are flagged `legal_hold:true` in the evidence ledger.
- TTL-based deletion is suppressed for those records.
- The hold is logged with requester, scope, and expected duration.
- On hold release, normal retention resumes from the date of release.

## 7. Deletion verification

For Tier C and Tier D records (PII/PHI and CUI), Amaru runs a quarterly verification job:

1. Sample N deleted records (N = max(20, 1% of recent deletions)).
2. Attempt to read each from primary, replicas, backups, downstream sinks.
3. Confirm every read returns `record_deleted` or 404.
4. Anchor the verification result in the evidence ledger.
5. Surface the verification report to compliance-bound customers.

## 8. Backups

- Backups are encrypted with customer-managed keys (or SZL-managed for non-CMK customers).
- Deletion propagates to backups within the next backup cycle (≤ 24 hours typical).
- For backups beyond the deletion-propagation window, deletion is achieved via key shred on the backup-encryption key at the next rotation.
- Backup retention beyond 35 days requires a documented compliance basis.

## 9. Honest disclosures

- **Append-only is not magic.** Append-only is an integrity property, not a retention defense. The integrity of the evidence anchors is preserved across deletions; the actual content can and does get destroyed when policy or law requires.
- **No "we restored it from backup" loophole.** SZL does not maintain undeletable shadow copies for "operational convenience." Backups follow the same deletion schedule as primaries.
- **Deletion-time reporting is honest.** Distributed systems take time to propagate. SZL reports the propagation window honestly (typically minutes to 24 hours, max contractual 30 days for backup-resident data).

## 10. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 11. Contact

Stephen P. Lutar Jr. · `privacy@szlholdings.com` · `inquiries@szlholdings.com`
