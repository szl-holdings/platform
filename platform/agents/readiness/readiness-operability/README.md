# READINESS-OPERABILITY

Observes four source signals at an exact default-branch revision.

| | |
|---|---|
| **Schedule** | `30 3 * * *` — daily (UTC) |
| **Entry point** | `executor.py` |
| **Inputs** | Flagship repository registry and GitHub read access. |
| **Emits** | Pinned per-repository source observations and scores. |
| **Source signal criterion** | Four confirmed positive observations (score 4/4). This does not qualify runtime readiness. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-operability/<date>/<ts>.json` |

## What it observes

Resolve each repository's default branch once to an exact commit and tree SHA.
Every subsequent tree, Dockerfile and commit-history read uses that immutable
revision, including a seven-day maintenance window ending at the observation
start time. The source signals are:

1. A recognized regular root file: `ROLLBACK.md`, `RUNBOOK.md`, or
   `INCIDENT_RESPONSE.md` (case-insensitive names).
2. At least two commits in the seven-day window. Pages are exhausted before
   claiming an exact count; a request failure, duplicate response or full
   tenth page leaves this signal unknown.
3. A regular root `Dockerfile` with FROM and CMD/ENTRYPOINT instructions.
   Content must match the tree's Git blob SHA. Comments and instruction-name
   substrings do not count. This is **structure-only** instruction presence,
   not a Docker parser, image build, dependency validation or runtime check.
   No Docker command runs, including when `DOCKER_BUILD=1`.
4. A recognized regular root file: `ENVIRONMENT_VARIABLES.md`, `.env.example`,
   or `SECRETS_SETUP.md` (case-insensitive names).

Runbook and environment-document signals observe filenames only. They do not
read environment-example contents, prove documentation completeness, recognize
arbitrary README sections, or search nested docs. A false signal means the
stated source criterion was not satisfied, not that no relevant docs exist.

## Output contract

Each row records `observed_at_utc`, `default_branch`, `revision`, `tree_sha`,
`signals`, and `signal_details` with sanitized reason codes. Boolean `false`
requires readable evidence; unreadable, inaccessible, incomplete or malformed
observations are JSON `null` with state `UNKNOWN`. A provider 404 alone is not
proof that a repository/file is absent. A truncated tree cannot prove absence.

`score` is an integer only when all four signals were observed. Incomplete rows
have `score: null` and `observation_state: INCOMPLETE`; `observed_score` counts
only confirmed positives and must not be shown as a complete score. Commit
counts are null when history was not completely observed. Older consumers must
handle nulls as unverified; the existing audit-rift consumer can independently
recheck a valid integer count but still uses its own moving window, so revision
and timestamp parity of that recheck remain unqualified.

`docker_check: STRUCTURE_ONLY`, `docker_build: NOT_MEASURED`, and
`readiness_qualification: NOT_ASSESSED` keep source observations separate from
image builds and operational qualification. Score 4/4 is not a production or
rollback-execution claim.

## Execution and evidence boundaries

The existing GitHub workflow runs daily and on manual dispatch. GitHub reads
use `GH_TOKEN`; no runtime URL or OTel target is needed for these source checks.
The receipt follows the existing shared signing/publication contract. Missing
signing material remains honestly unsigned. A failed Hub publication still
fails the Actions run; successfully publishing a receipt does not establish
readiness. No credential binding, fleet registry, schedule or runtime target is
changed by this source repair.

Offline regressions run through the existing readiness test discovery:

```sh
python -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'
```

---
Doctrine v11 (LOCKED) · 749/14/163 · Author: Yachay <yachay@szlholdings.dev>
