# Incident Response Runbooks

This file is the on-call's first stop. Each runbook is a short, opinionated
triage guide for a specific alert. Severity escalation, comms templates, and
post-mortem policy live in `docs/ops-runbook.md` and
`docs/ONCALL_AND_INCIDENT_MODEL.md`.

---

## Backup upload stalled <a id="backup-upload-stalled"></a>

**Triggered by:** Lyte self-monitor signal
*"Nightly backup remote upload stalled / behind RPO"*
(severity `critical` for `error`, `high` for `warning`).

**Source signal fields**

| Field                          | Meaning                                          |
|--------------------------------|--------------------------------------------------|
| `backupRemoteStatus`           | `warning` (>RPO) or `error` (>2× RPO / failed)   |
| `backupRemoteBackend`          | `azure-blob`, `local-fs`, etc.                   |
| `backupLastSuccessfulUploadAt` | ISO timestamp of last successful remote upload   |
| `backupRemoteAgeHours`         | Hours since the last successful upload           |
| `backupRemoteRpoHours`         | Tier RPO from `BACKUP_REMOTE_RPO_HOURS`          |

The same view is exposed at `GET /api/healthz` and `GET /api/health/detailed`
under `services.backup.remoteUpload` / `backup.remoteUpload`.

### Why this fires

1. **Cron / GitHub Actions did not run the workflow.**
   `.github/workflows/backup.yml` may have failed to schedule (provider
   outage, secret expiry, branch protection change). The local manifest is
   stale, so `lastRemoteUploadAt` ages past RPO.
2. **The upload script ran but failed.**
   Object-storage credentials rotated, container deleted, network blip,
   size-mismatch verification failed. `manifest.remoteUpload.status` will be
   `"error"` and `lastAttemptMessage` carries the reason.
3. **Backend mis-configured after a deploy.**
   `BACKUP_REMOTE_BACKEND` set to `none`/unset on a tier that requires
   remote backups (the alert only fires when the backend is configured —
   `disabled` is silenced — but a *removal* of the secret looks like
   "no successful upload ever" until the next run completes).

### Triage (do these in order)

1. **Confirm the alert is real.** Hit `GET /api/health/detailed` (with
   `x-internal-token: $ALLOY_INTERNAL_TOKEN` in production) and read
   `backup.remoteUpload`. Note `lastSuccessfulUploadAt`, `ageHours`,
   `lastAttemptStatus`, `lastAttemptMessage`.
2. **Check the scheduled workflow.** Open the latest run of
   `.github/workflows/backup.yml`. If the most recent run is older than
   `ageHours`, the cron itself is the problem — go to step 4.
3. **Inspect the most recent run logs.** If the workflow ran but failed,
   the failure is in `scripts/backup-db.sh` or `scripts/backup-upload.sh`.
   The upload script emits a JSON status line; grep the run log for
   `[backup-upload]`.
4. **Run a manual backup + upload.**
   ```bash
   DATABASE_URL=... \
   BACKUP_REMOTE_BACKEND=azure-blob \
   AZURE_STORAGE_CONNECTION_STRING=... \
   AZURE_STORAGE_CONTAINER=... \
   bash scripts/backup-db.sh
   ```
   Confirm the script exits 0 and `backups/backup_manifest.json` shows
   `"lastRemoteUploadStatus": "ok"` and a fresh `lastRemoteUploadAt`.
5. **Re-fetch `/api/health/detailed`.** `backup.remoteUpload.status` should
   return to `"ok"`. The self-monitor cool-down is 10 minutes; the next
   cycle will not re-fire if the condition has cleared.
6. **If credentials are the cause**, rotate via the
   `environment-secrets` workflow (do not paste secrets into chat / PRs).
   Re-run step 4 to verify.

### When to escalate

- `error` status persists for more than **2 hours** after triage steps run.
- The most recent successful upload is older than **2× the tier RPO**
  (this is what flipped the alert from `warning` to `error`).
- A second consecutive nightly run has failed for the same reason.

Page the platform on-call and open an incident per
`docs/ONCALL_AND_INCIDENT_MODEL.md` (severity SEV-2 by default; SEV-1 if a
restore would now exceed the customer-contracted RPO).

### Done looks like

- `backup.remoteUpload.status` is `"ok"` on `/api/health/detailed`.
- `backup_manifest.json` shows `lastRemoteUploadStatus: "ok"` with a
  `lastRemoteUploadAt` from the latest run.
- The originating signal is acknowledged (resolved) in the Command Center.
- A short note is added to the next DR-drill ledger
  (`docs/operations/dr-drill-*.md`) describing what failed and how it was
  cleared.
