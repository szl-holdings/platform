# READINESS-SECURITY

Read-only GitHub security evidence for public `szl-holdings/*` repositories.
The agent emits one Khipu receipt; it does not modify the observed repositories.

| | |
|---|---|
| **Schedule** | `20 * * * *` UTC in `.github/workflows/readiness-security.yml` |
| **Entry point** | `executor.py` |
| **Inputs** | Live public-repository inventory and GitHub API reads |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-security/<UTC-date>/<UTC-timestamp>.json` |

## Evidence checks

1. `gh repo list` enumerates public repositories. A failed, empty, malformed,
   duplicate, or limit-sized inventory is `HOLD`; the static `PUBLIC_REPOS` list
   is never substituted.
2. For each repo, the agent reads its default branch and exact 40-character
   head SHA. It reads workflow files at that SHA and checks SBOM, Trivy, and
   Gitleaks/secret workflow files. For `szl-holdings/platform`, the Gitleaks
   control is the `secret-scan` job inside `security.yml`: the collector reads
   that file at the observed head, requires the named scan step and `gitleaks
   detect` command without `continue-on-error`, then requires both the job and
   scan step to report success in the matching workflow run. A missing or
   unreadable file, job, step, or jobs API response cannot pass. Other repos
   retain filename-based Gitleaks/secret discovery. The most recent matching run
   must have the same branch and SHA and `status=completed`. For the Platform
   Gitleaks control, a successful job and scan step can pass even when an
   unrelated job makes the whole `security.yml` run fail; the overall run
   conclusion remains in the receipt. The other workflow controls require
   `conclusion=success`. The matching run must have a timezone-aware
   `created_at` within the previous 30 days (inclusive). Missing, malformed,
   or more than five minutes future
   timestamps yield `INVALID_RUN_TIMESTAMP`/`HOLD`; an older success yields
   `STALE_RUN`/`HOLD`. A current run still in progress yields
   `RUN_IN_PROGRESS`/`HOLD`; a failed required workflow or Gitleaks job yields
   `RED`.
   Any invalid timestamp on a matching current-head run holds that control,
   even if an older success is present. The GitHub run query reads at most 100
   branch runs. If the matching current-head
   run is outside that page, the verdict remains `HOLD`.
3. `SECURITY.md` is read at the same SHA. It needs an email contact or direct
   private-advisory URL and must not carry a stale Doctrine version marker.
   This check does not validate a policy review date.
4. The latest release metadata is inspected for `.sig` and `.crt`/`.pem`
   assets. **Asset presence is not cryptographic verification.** This executor
   does not download release assets or run `cosign verify-blob`; it reports
   `cosign.status=UNVERIFIED` and `verified=null` when both file types exist.
   A release cannot satisfy GREEN until a separate, source-bound verifier is
   implemented and observed.

A GitHub 403 rate-limit response or HTTP 429 trips a circuit. The remaining
repositories are marked `NOT_ATTEMPTED_RATE_LIMIT` without more GitHub calls.

## Verdict and receipt contract

The receipt payload has `inventory.status`, `repo_count`, `repos[]`,
`meta_verdict`, and `overall_verdict`. Each repo contains the observed `head`,
`workflows` (including per-control statuses and matched run IDs),
`security_md`, `cosign`, `missing_controls`, `verdict`, and `evidence_state`.

| `overall_verdict` | Meaning |
|---|---|
| `RED` | An observed required control is missing or failing, such as a missing workflow, failed exact-head run, missing SECURITY contact, or missing release signature asset. |
| `HOLD` | Required evidence is unavailable or unverified, including GitHub read failure, rate limit, absent current-head run, no release, or unverified cosign. |
| `GREEN` | Every listed control has affirmative evidence at the observed head and release signatures are cryptographically verified. The current release-metadata-only cosign check cannot establish this state. |

For the existing dashboard, `meta_verdict` and per-repo `verdict` encode `HOLD`
as `AMBER`; `overall_verdict` and per-repo `evidence_state` retain the literal
`HOLD`. `missing_controls` carries exact reason codes such as
`workflow:sbom:WRONG_HEAD_RUN`, `SECURITY.md:NO_CONTACT`, and
`cosign:UNVERIFIED`. A successful run of this agent means collection and
receipt publication completed; it does not mean the estate is GREEN.

`khipu.emit` prints a DSSE-style envelope with the Doctrine v11 `749/14/163`
stamp. It signs only when a valid `KHIPU_SIGNING_KEY_B64` is available. A local
run without the key or `HF_TOKEN` can print an honestly unsigned and unpublished
receipt. In GitHub Actions, failed Hub publication or an unsigned emitted
receipt exits nonzero. A signed, published `RED` or `HOLD` observation can exit
zero so its negative evidence remains available in the receipt dataset.

Run locally with `python platform/agents/readiness/readiness-security/executor.py`.
Run the focused contract tests with
`python -B -m unittest discover -s platform/agents/readiness/readiness-security -p 'test_*.py'`.

---
Doctrine v11 (LOCKED) · 749/14/163 · Author: Yachay <yachay@szlholdings.dev>
