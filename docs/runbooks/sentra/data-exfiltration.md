# Data exfiltration

**Runbook ID:** `data_exfiltration`
**Incident class key:** `data-exfiltration`
**Source:** `services/sentra-core/src/sentra_core/incident_response.py::data_exfiltration()`

## When to invoke
- Outbound transfer anomaly to an untrusted destination.
- ATT&CK `T1567` (Exfiltration Over Web Service) or `T1071` (Application
  Layer Protocol) edge against a data-kind asset.

## Steps (mirrors the DSL)
1. **block_egress** — block outbound traffic from affected assets at the
   network edge.
2. **hash_artifacts** — fingerprint all suspect artefacts so they can be
   recognised in downstream feeds.
3. **await_approval: `legal_review`** — runbook pauses pending legal sign-off
   before regulator notification. Resume by re-posting with
   `approvals: { "legal_review": true }`.
4. **notify_regulators** — issue regulator notification (templated per
   jurisdiction in the operator console).

## Evidence
Egress logs, blocked-flow receipts, artefact hashes, and legal-review record
are bundled and committed to yawar topic `sentra.evidence`.

## Recovery exit
Block lifted only after legal closure and operator sign-off; post-incident
note attached.
