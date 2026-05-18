# Ransomware containment

**Runbook ID:** `ransomware_containment`
**Incident class key:** `ransomware`
**Source:** `services/sentra-core/src/sentra_core/incident_response.py::ransomware_containment()`

## When to invoke
- File-encryption activity detected on one or more endpoints/servers.
- ATT&CK technique `T1486` (Data Encrypted for Impact) appears in the threat
  graph against a high-exposure asset.
- Operator-initiated containment from the Sentra console.

## Steps (mirrors the DSL)
1. **isolate_hosts** — quarantine all `affected_assets`. Output records the
   list of isolated hosts.
2. **snapshot_volumes** — snapshot persistent volumes for forensic capture.
3. **await_approval: `operator_confirm_eradication`** — runbook pauses. Resume
   by re-posting with `approvals: { "operator_confirm_eradication": true }`.
4. **revoke_credentials** — invalidate every credential associated with the
   affected assets.
5. **restore_from_backup** — plan a restore from the last clean backup
   generation.

## Evidence
On completion, call `POST /api/sentra/core/evidence-pack` with the run-trace
JSON and any collected artefacts (memory dumps, malicious binaries, host
logs). The pack hash is published to yawar topic `sentra.evidence`.

## Recovery exit
Operator confirms restore completeness, re-enables the affected hosts, and
files the post-incident note against the original incident id.
