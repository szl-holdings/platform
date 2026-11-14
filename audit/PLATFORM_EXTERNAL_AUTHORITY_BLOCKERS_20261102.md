# Platform external authority blockers - evidence and runbook

- `recorded_at`: 2026-11-02 UTC
- `source_head_reviewed`: `21d4ee44d4eb9b3a8fcb30530b02f9de6ff52537`
- `scope`: Replit staging run `41375292722` and readiness-reliability run
  `41381694418`
- `state_changes`: none; no secret value was read, printed, created, replaced,
  or rotated

## Replit staging deployment: HTTP 403

Run `41375292722` checked out `dca2db629`, found nonempty
`REPLIT_STAGING_APP_ID` and `REPLIT_STAGING_DEPLOY_TOKEN`, and sent one bounded
`POST` to `https://replit.com/api/v1/repls/<app-id>/deployments`. Replit returned
HTTP 403. The workflow did not retry, follow a redirect, or claim acceptance.
Repository source cannot distinguish a rejected/expired bearer from an identity
that lacks deployment authority for the configured application, and it must not
guess or rotate either value.

The exact required binding is:

1. GitHub repository `szl-holdings/platform`, environment `staging`.
2. Environment secret `REPLIT_STAGING_APP_ID`: the exact Replit application or
   Repl identifier intended for SZL staging.
3. Environment secret `REPLIT_STAGING_DEPLOY_TOKEN`: an active Replit bearer
   credential whose owning Replit identity has permission to create deployments
   for that exact identifier. Presence alone is insufficient.

Owner-side reconciliation checklist:

- In Replit, identify the account and workspace that own the intended staging
  application. Record the non-secret account/workspace name and application ID;
  compare the ID with the effective GitHub environment secret without placing
  either secret value in an issue or log.
- Confirm that the existing bearer is active and its identity has deployment
  write authority for that application. If the credential is revoked or belongs
  to another identity, an authorized owner must replace the GitHub environment
  secret through the normal credential process.
- From a secret-safe operator shell, make an authenticated read-only request for
  that exact application's deployments. Record only UTC time, HTTP status, the
  account/workspace name, and a non-sensitive application reference. Expected
  authorization evidence is HTTP 200; do not record the bearer or response body.
- Re-run the failed staging job after the binding is corrected. Expected source
  evidence is an accepted 2xx request. Then verify the resulting deployment in
  Replit and record its deployment identifier, source commit, terminal provider
  state, and a runtime health observation. The current workflow correctly labels
  runtime readiness unknown after request acceptance.

## Readiness receipt: missing signer authority

Run `41381694418` checked out `dca2db629`, completed collection, emitted an
artifact, and failed with `unsigned receipt; path (not created)`. The shared
publisher correctly refuses unsigned bytes. The required signing binding is:

1. An Actions secret named `KHIPU_SIGNING_KEY_B64` effective for scheduled jobs
   in `szl-holdings/platform`. This workflow does not select a GitHub Environment;
   the secret must therefore be a repository secret or an organization secret
   whose selected-repository policy includes `platform`.
2. The value must be strict base64 of the existing raw 32-byte Ed25519 fleet
   seed. Do not generate or rotate a key for this repair. Its derived public key
   must match the fleet authority already used by peer readiness jobs and the
   audit-rift verifier.
3. A separate effective `HF_TOKEN` must authenticate an identity with content
   write access to the exact dataset `SZLHOLDINGS/readiness-runs`.

Owner-side reconciliation checklist:

- Locate the existing fleet seed in the authorized secret manager. Confirm its
  owner, recovery/rotation record, and derived public-key fingerprint without
  exposing the seed. Compare the fingerprint with a previously admitted signed
  fleet receipt or signer ledger.
- In GitHub Actions settings, record whether the effective secret is repository
  or organization scoped. For an organization secret, confirm `platform` is in
  its selected-repository access list. Record only scope and update time.
- Provision the existing seed as `KHIPU_SIGNING_KEY_B64`. Do not paste it into a
  workflow dispatch input, issue, pull request, shell history, or Actions log.
- Confirm `HF_TOKEN` is active and has write authority for
  `SZLHOLDINGS/readiness-runs`. The candidate workflow checks identity,
  destination, and write permission without uploading evidence.
- Re-run `READINESS-RELIABILITY`. Required evidence is: signing preflight
  `complete/ready` with the expected public `keyid`; publisher preflight
  `complete/ready`; executor output `signed:true` and `published:true`; retained
  Actions artifact; and a created dataset path under
  `receipts/readiness-reliability/<date>/`.
- Download the created dataset object and the retained receipt artifact through
  authorized channels. Compare SHA-256 of the exact envelope bytes and verify
  the Ed25519 signature against the admitted public key. Record hashes, key ID,
  remote path, workflow run ID, and source commit. Do not record either secret.

These checks close authority and evidence transport only when observed. They do
not make RED or SKIPPED runtime probes GREEN, establish staging runtime health,
or replace protected review and admission.
