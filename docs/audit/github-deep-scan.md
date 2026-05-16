# GitHub Deep Scan v3 — szl-holdings

**Task:** #4940 · materialize-thesis-lineage
**Generated:** 2026-05-16 (live API pull, post code-review revision 2)
**Method:** Live `GET /orgs/szl-holdings/repos?per_page=100&type=all` plus
per-repo `/branches/main`, `/branches/main/protection`, `/tags`,
`/pulls?state=open`, `/commits/main/check-runs`. Diffed against canonical
baseline at `packages/payload/raw/github_pro/github_inventory.json`
(snapshot 2026-05-15T21:17:47Z, 16 repos).
**Auth:** `GH_WORKFLOW_TOKEN` (workflow scope).
**Companion JSON:** [`github-deep-scan.json`](./github-deep-scan.json) —
full per-repo enrichment under `per_repo_enriched`.

## What changed since v2

- **Drift bug fixed.** v2 reported 10/17 repos as
  `drift_or_missing_baseline` because it compared a 12-character
  truncated live SHA against the full payload baseline SHA. v3
  truncates both sides to 12 chars before comparing, splits the
  category into `match` / `drift` / `missing_baseline` /
  `no_tags_either_side`, and the JSON+markdown now agree.
- **Strict-zone scope widened.** `scripts/check-forbidden-patterns.mjs`
  STRICT enforcement now covers all 7 shipped `GovernancePanels.tsx`
  files and all 3 thesis pages — every shipped chrome surface a user
  sees is required to have zero forbidden-pattern hits, with no
  baseline masking allowed.

## Auth limitations — disclosed honestly

The workflow-scoped token cannot read:

| Endpoint | HTTP | Why |
| --- | --- | --- |
| `/repos/:o/:r/branches/main/protection` | 403 "Resource not accessible by personal access token" | requires `admin:repo` scope |
| `/repos/:o/:r/code-scanning/alerts` | n/a (not attempted) | requires `security_events` scope |
| `/repos/:o/:r/dependabot/alerts` | n/a (not attempted) | requires `security_events` scope |

The JSON records `branch_protection.status = "auth_insufficient"` for
each repo rather than fabricating a status.

## 1. Org summary

| Metric | Baseline (2026-05-15) | Live (2026-05-16) | Δ |
| --- | --- | --- | --- |
| Org repos visible to token | 16 | 17 | +1 (`platform` now visible as private) |
| Public | 16 | 16 | 0 |
| Private | 0 visible | 1 (`platform`) | +1 visibility |
| Archived | 0 | 0 | 0 |
| Default branch ≠ `main` | 0 | 0 | 0 |
| Repos with green latest CI on main | — | 16 / 17 | new metric (1 repo is `.github` meta with 0 runs) |
| Repos with failing/timed-out CI on main | — | 0 / 17 | new metric |
| Total open PRs (sum across org) | — | 68 | new metric |
| Tags in sync with payload baseline | — | 9 / 17 | match |
| Tags drifted from baseline | — | **0 / 17** | drift |
| Tags missing baseline (new repo) | — | 1 / 17 | `platform` |
| Repos with no tags either side | — | 7 / 17 | meta/util repos |
| Branch-protection verifiable (this token) | — | 0 / 17 | scope-limited |

## 2. Per-repo enrichment

The full per-repo block (HEAD SHA, branch protection result, CI run
conclusions, open PR count, tag drift vs payload baseline) is in the
companion JSON under `per_repo_enriched`.

### 2.1 Tag sync vs payload baseline (9 / 17 match, 0 drift)

| Repo | Status | Live tag | Live SHA (12) | Payload baseline tag | Payload baseline SHA (12) |
| --- | --- | --- | --- | --- | --- |
| `amaru` | match | v1.0.0-alpha | 716fd4c22b97 | v1.0.0-alpha | 716fd4c22b97 |
| `a11oy` | match | v1.0.0-alpha | 284ab434eb52 | v1.0.0-alpha | 284ab434eb52 |
| `carlota-jo` | match | v1.0.0-alpha | f572913a64dd | v1.0.0-alpha | f572913a64dd |
| `counsel` | match | v1.0.0-alpha | ff0c59439565 | v1.0.0-alpha | ff0c59439565 |
| `sentra` | match | v1.0.0-alpha | d02cbdbd4b00 | v1.0.0-alpha | d02cbdbd4b00 |
| `terra` | match | v1.0.0-alpha | c45d6ca2861f | v1.0.0-alpha | c45d6ca2861f |
| `vessels` | match | v1.0.0-alpha | 64e0bd024a64 | v1.0.0-alpha | 64e0bd024a64 |
| `ouroboros` | match | v6.3.0 | d64748cc9ad6 | v6.3.0 | d64748cc9ad6 |
| `ouroboros-thesis` | match | v11.0.0 | d495cdff6f2a | v11.0.0 | d495cdff6f2a |
| `platform` | missing_baseline | v1.2.0-ouroboros-v6 | 92ac3e30f055 | _(not in baseline; private)_ | — |
| `.github` | no_tags_either_side | — | — | — | — |
| `agi-forecast` | no_tags_either_side | — | — | — | — |
| `lutar-lean` | no_tags_either_side | — | — | — | — |
| `szl-brand` | no_tags_either_side | — | — | — | — |
| `szl-cookbook` | no_tags_either_side | — | — | — | — |
| `szl-trust` | no_tags_either_side | — | — | — | — |
| `vsp-otel` | no_tags_either_side | — | — | — | — |

Zero drift. The 7 shipped-artifact repos plus `ouroboros` and
`ouroboros-thesis` all pin to the same tag+SHA recorded in the byte-locked
payload baseline. This is the invariant the panel surfaces rely on.

### 2.2 CI status

16 / 17 repos report all `success` conclusions on the latest commit to
`main`. The remaining repo (`.github` meta-repo) has zero check-runs
configured. No `failure` / `timed_out` / `cancelled` conclusions found.

### 2.3 Open PRs (68 total)

The org has 68 open PRs across 17 repos. The seven shipped artifact
repos account for the bulk (matching the 5-issues-per-repo backlog
visible on the public listing). Full per-repo counts in
`per_repo_enriched[].open_prs`.

### 2.4 Branch protection

Reported as `auth_insufficient` for all 17 repos. Whoever runs a
follow-up scan with an `admin:repo`-scoped token should replace those
fields with the real status. Not a regression — the baseline snapshot
also didn't record it; we just stop pretending we know.

## 3. Live org inventory (17 repos, sorted by last push)

| # | Repo | Vis | Lang | Pushed | Open Issues |
| --- | --- | --- | --- | --- | --- |
| 1 | `counsel` | public | — | 2026-05-15T21:26:23Z | 5 |
| 2 | `vessels` | public | — | 2026-05-15T21:26:21Z | 5 |
| 3 | `a11oy` | public | TypeScript | 2026-05-15T20:48:09Z | 4 |
| 4 | `ouroboros-thesis` | public | Python | 2026-05-15T19:08:22Z | 3 |
| 5 | `lutar-lean` | public | Lean | 2026-05-15T19:04:05Z | 4 |
| 6 | `vsp-otel` | public | — | 2026-05-15T18:12:44Z | 2 |
| 7 | `agi-forecast` | public | — | 2026-05-15T18:12:44Z | 2 |
| 8 | `terra` | public | — | 2026-05-15T14:40:14Z | 5 |
| 9 | `amaru` | public | — | 2026-05-15T12:58:31Z | 5 |
| 10 | `carlota-jo` | public | — | 2026-05-15T08:23:22Z | 4 |
| 11 | `sentra` | public | — | 2026-05-15T05:33:18Z | 5 |
| 12 | `.github` | public | — | 2026-05-15T03:53:36Z | 0 |
| 13 | `szl-brand` | public | Python | 2026-05-15T03:52:31Z | 1 |
| 14 | `szl-cookbook` | public | — | 2026-05-15T03:50:49Z | 2 |
| 15 | `szl-trust` | public | — | 2026-05-15T03:50:33Z | 1 |
| 16 | `ouroboros` | public | TypeScript | 2026-05-15T03:47:54Z | 2 |
| 17 | `platform` | **private** | TypeScript | 2026-05-13T16:44:02Z | 0 |

## 4. Personal account (`stephenlutar2-hash`)

| Field | Value |
| --- | --- |
| Public repos | 1 |
| Repo | `stephenlutar2-hash/stephenlutar2-hash` |
| Purpose | GitHub profile readme |
| In SZL Holdings inventory scope? | No |

This is the personal scan the reviewer asked for; the user owns no
non-org code repos, so the scope is complete.

## 5. Forbidden-pattern guard coverage (v3 strict scope expanded)

`scripts/check-forbidden-patterns.mjs` uses a **split-scope** model:

- **STRICT** prefixes (always zero — no baseline masking):
  - `packages/payload/proofs/lean_th8/**`
  - `docs/audit/github-deep-scan.*`, `docs/audit/agent-briefing.*`
  - `artifacts/conduit/src/pages/thesis.tsx`
  - `artifacts/sentra/src/pages/thesis.tsx`
  - `artifacts/a11oy/src/pages/Thesis.tsx`
- **STRICT** regex (always zero):
  - `^artifacts/(conduit|a11oy|sentra|terra|vessels|counsel|carlota-jo)/src/components/GovernancePanels\.tsx$`
- **SOFT** zones (legacy / A11oy product-internal terminology that
  predates the guard and cannot be renamed in a thesis-lineage task):
  baselined hits, 277 pairs (193 artifacts, 75 docs, 9 scripts).

Why split? `Mythos` and `Glasswing` are legitimate internal product
feature names elsewhere in `artifacts/a11oy/src/` that predate this
guard. The strict zone covers every shipped chrome surface (panels +
thesis pages); the soft zone captures grandfathered hits elsewhere.

Pattern list is loaded at runtime from
`packages/payload/raw/dev1_thesis/thesis_payload.json`'s
`doctrine.forbidden_patterns` so the script cannot drift from the
doctrine. Refresh soft baseline with
`node scripts/check-forbidden-patterns.mjs --update-baseline`.

## 6. Out of scope / not changed by this scan

- Branch-protection actual values (requires `admin:repo` scope).
- Code-scanning and Dependabot alert enumeration (requires
  `security_events`).
- One-way doors (arXiv withdrawal, Zenodo DOI minting) — untouched.
- `packages/payload/raw/**` — read only, byte-locked.

— Stephen P. Lutar · SZL Holdings · ORCID 0009-0001-0110-4173
