# GitHub Org Audit — szl-holdings · 2026-05-27

Author: ROSIE Series-A audit pass · scope: 20 repos in `szl-holdings`.

## Org inventory (20 repos · 18 public, 2 private)

| Repo | Vis | Arch | Default | Last push | Notes |
|---|---|---|---|---|---|
| agi-forecast | pub | no | main | 2026-05-27 | Scorecard + ci green, 59 runs |
| szl-cookbook | pub | no | main | 2026-05-27 | |
| szl-brand | pub | no | main | 2026-05-27 | |
| szl-trust | pub | no | main | 2026-05-27 | |
| .github | pub | no | main | 2026-05-27 | org-level workflow templates |
| rosie | pub | no | main | 2026-05-27 | **0 workflow runs** — repo exists but no CI yet |
| platform | priv | no | main | 2026-05-26 | the monorepo |
| vsp-otel | pub | no | main | 2026-05-26 | |
| uds-mesh | pub | no | main | 2026-05-25 | |
| sentra | pub | no | main | 2026-05-27 | 204 runs, scorecard + codeql + docs ci green |
| amaru | pub | no | main | 2026-05-27 | 209 runs green (1 docs-ci cancelled) |
| a11oy | pub | no | main | 2026-05-27 | 211 runs green |
| carlota-jo | pub | no | main | 2026-05-26 | |
| terra | pub | no | main | 2026-05-26 | |
| vessels | pub | no | main | 2026-05-27 | 179 runs green |
| counsel | pub | no | main | 2026-05-26 | |
| ouroboros-thesis | pub | no | main | 2026-05-26 | |
| lutar-lean | pub | no | main | 2026-05-26 | |
| ouroboros | pub | no | main | 2026-05-25 | huklla-t11 doi gate + scorecard green |
| demo-repository | priv | **yes** | main | 2026-05-05 | archived — leave |

## Hot findings

### F1 · rosie repo has zero CI (0 runs)
Other operational repos (vessels/a11oy/sentra/amaru/ouroboros/agi-forecast) run Scorecard + CodeQL + Docs CI. `rosie` has the same operational weight as those repos but **no workflows wired**.

**Fix path (manual, requires admin):** copy the `.github/workflows/{scorecard,codeql,docs-ci}.yml` triad from `vessels` → `rosie` and commit. `GH_WORKFLOW_TOKEN` *can* PATCH workflow files (that's its scope), but a one-shot bootstrap of the three files is cleanest from a desktop. Doc-only delta.

### F2 · Branch protection unverifiable via current token (HTTP 403 across the board)
`GET /repos/:org/:repo/branches/main/protection` returns **403** for every repo tested (rosie, vessels, a11oy, sentra, amaru, ouroboros, agi-forecast, platform). This is consistent with two known constraints:

- `GH_WORKFLOW_TOKEN` is a workflow-write PAT; it does **not** carry `admin:repo` scope (required to read or modify branch protection rules).
- The GitHub-app integration token in this Replit project is also non-admin (per `auto_memory: github-token-workflow-scope.md`).

**Status:** unverifiable via API from this environment. Cannot be fixed in this audit pass.

**Required manual step (web UI, one-shot per repo):**
1. Repo → Settings → Branches → Add rule → `main`
2. Enable: *Require a pull request before merging* (1 approval), *Require status checks to pass* (select `Scorecard`, `CodeQL`, `ci`), *Require signed commits*, *Require linear history*, *Do not allow bypassing the above settings*.
3. Apply to all 7 operational repos: `rosie`, `vessels`, `a11oy`, `sentra`, `amaru`, `ouroboros`, `agi-forecast`. (`platform` is private — same treatment.)

### F3 · Secret scanning + push protection unverifiable / unsettable (HTTP 403 on PATCH)
Same root cause as F2. The `security_and_analysis` object returns `null` in the bulk `GET /orgs/:org/repos` listing, and PATCH attempts to enable `secret_scanning` and `secret_scanning_push_protection` return 403 on **all 18 public repos** tested.

Note: GitHub auto-enables secret scanning + push protection on public repos at the **org default** level (org → Settings → Code security → Configurations), which is the right lever to flip. Doing it per-repo is a workaround anyway.

**Required manual step:**
1. Org → Settings → Code security → Configurations → "GitHub recommended" → Apply to → All public repos.
2. For `platform` (private), enable Advanced Security if on a paid plan; otherwise leave with a note.

### F4 · Org-level 2FA enforcement (known API no-op)
Per `auto_memory: github-org-2fa-api-noop.md`, the PATCH `/orgs/:org` to set `two_factor_requirement_enabled: true` returns 200 but the field stays false on free orgs. Same status as last audit — must be flipped in the web UI:

**Required manual step:** Org → Settings → Authentication security → Require two-factor authentication for everyone.

### F5 · UDS bundle registry ↔ org repos alignment (OK)
Cross-check from `artifacts/api-server/src/routes/uds-registry.ts`:

| Bundle slug | Org repo | Status |
|---|---|---|
| a11oy | szl-holdings/a11oy | ✓ aligned |
| amaru | szl-holdings/amaru | ✓ aligned |
| rosie | szl-holdings/rosie | ✓ aligned (CI gap, see F1) |
| sentra | szl-holdings/sentra | ✓ aligned |
| vessels | szl-holdings/vessels | ✓ aligned |

All 5 registered UDS bundle slugs map 1:1 to active org repos. No drift.

## What this audit *was* able to do
- Confirm 20 repos enumerated, default branches all `main`, only 1 archived (`demo-repository`).
- Confirm the 7 operational repos run Scorecard + CodeQL + Docs CI on every push (except `rosie`).
- Confirm UDS bundle registry slugs match repo names 1:1.

## What this audit was *blocked from* doing
- Reading/writing branch-protection settings (token lacks `admin:repo`).
- Toggling secret-scanning / push-protection per repo (same scope gap).
- Org-level 2FA enforcement (API no-op, web-UI only).

## Action checklist (operator, web UI, ~10 min)
1. [ ] Org → Settings → Authentication → require 2FA org-wide.
2. [ ] Org → Settings → Code security → apply "GitHub recommended" configuration to **all public repos**.
3. [ ] For each of `rosie`, `vessels`, `a11oy`, `sentra`, `amaru`, `ouroboros`, `agi-forecast`, `platform` — Settings → Branches → add `main` rule with 1-review + required checks + signed commits + linear history + no bypass.
4. [ ] Bootstrap `rosie` repo CI: copy `.github/workflows/{scorecard,codeql,docs-ci}.yml` from `vessels`.
5. [ ] Re-run this audit script (see `scripts/audit-github-org.sh` future) — F2/F3 should now show `200` and concrete settings.
