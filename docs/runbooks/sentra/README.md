# Sentra incident-response runbooks

This directory holds one runbook per incident class supported by
`services/sentra-core/src/sentra_core/incident_response.py`. The Python
runbook DSL (`step`, `branch`, `await_approval`) is the executable
specification; the documents here are the human-facing operator playbook
that mirrors each step.

Runbook classes:

- [ransomware.md](./ransomware.md) — `ransomware_containment`
- [credential-compromise.md](./credential-compromise.md) — `credential_compromise`
- [data-exfiltration.md](./data-exfiltration.md) — `data_exfiltration`

Each runbook is selected via the `runbook_name` field on the
`POST /api/sentra/core/incident-response` endpoint, which dispatches into
`sentra_core.incident_response.runbook_for(name)`.

When the runbook reaches an `await_approval` step it pauses and returns
`status: "awaiting_approval"`. Re-invoke the endpoint with the same incident
and an `approvals` map containing the step name set to `true` to resume.
