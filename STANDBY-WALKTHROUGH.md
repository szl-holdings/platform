# SZL Holdings Platform — Standby Walkthrough

**Date entering standby:** 2026-04-23
**Reason:** Funding pause. No further build work until project resumes.
**HEAD at standby:** `4eb20cb87` on `master` (working tree clean, 2,575 commits).

---

## TL;DR — what to do when you come back

1. Open this file first.
2. Read `KNOWN-GAPS.md`, `CHANGELOG.md`, `ARCHITECTURE.md` (in that order) for the engineering state.
3. Read `docs/SZL_AGENT_MESH_AUDIT.md` (does not exist yet — it is the deferred Phase 0 task) before starting the deferred Agent Mesh overhaul.
4. Refresh the GitHub OAuth token with **`workflow` scope** so the GitHub Actions tree at `.github/workflows/*` can be pushed (see "GitHub push limitation" below).
5. Restart workflows; they will spin back up automatically.

---

## Where the code is preserved

| Mirror | Status | Branch / Ref | Notes |
|---|---|---|---|
| **Local Replit checkpoint** | ✅ Current | `master @ 4eb20cb87` | Replit auto-checkpoints persist through standby. |
| **`gitsafe-backup` mirror** | ✅ **Current — this is the canonical preservation target** | `main @ 4eb20cb87` | All 2,575 commits of `master` pushed as `master:main` on 2026-04-23. |
| **GitHub `origin`** (`github.com/szl-holdings/platform`) | ⚠️ Stale (behind by ~1,598 commits) | `master @ 0cf237f70` | Push blocked — see below. |

### GitHub push limitation
The OAuth token attached to `origin` (and the Replit GitHub integration connector) does **not** carry the `workflow` scope. Our branch adds 20+ files under `.github/workflows/`, so GitHub rejects every push with:

> `refusing to allow an OAuth App to create or update workflow .github/workflows/a11y.yml without "workflow" scope`

The remote `origin/master` also has 2 small commits we don't have locally (a Dependabot tanstack bump + README metric update) that conflict in `package.json` files and `pnpm-lock.yaml`. **No data is at risk** — `gitsafe-backup` already mirrors everything. To reconcile when you return:

1. Generate a Personal Access Token with `repo` + `workflow` scopes.
2. `git remote set-url origin https://<user>:<PAT>@github.com/szl-holdings/platform.git`
3. `git fetch origin && git merge origin/master` (resolve `package.json` conflicts in favor of HEAD; keep the Dependabot tanstack version bumps).
4. `git push origin master`.

---

## Repository facts

- **Monorepo:** pnpm workspace, 17 artifacts on disk.
- **Working tree at standby:** clean (no uncommitted changes).
- **`.git` size:** 639 MB (includes full history + LFS for video assets).
- **Active branch:** `master` (also tagged locally as `pre-standby-snapshot-2026-04-23`).

### Artifact inventory (17 total)

| Artifact | Kind | Brand | Purpose | Auth on landing? |
|---|---|---|---|---|
| `szl-holdings` | web | SZL Holdings | Parent company portfolio dashboard | No (public) |
| `command` | web | Unified Command | Cross-artifact governance command surface | Sign in for full ops |
| `lyte-command-center` | web | KORA | Decision intelligence platform (Lyte brand) | No (demo seed) |
| `sentra` | web | TENAX | Cyber resilience command | No (public landing) |
| `counsel` | web | Counsel/FORGE | Legal matter command | No (public landing) |
| `vessels` | web | SEXTANT | Maritime intelligence | Yes (auth-gated demo) |
| `terra` | web | DOMAINE | Real estate intelligence | No (public landing) |
| `pulse` | web | LUMINA | AI executive briefing | Yes (auth-gated) |
| `aegis` | web | PARAGON | Investor pitch deck (`/deck`) | Yes (auth-gated) |
| `carlota-jo` | web | Carlota Jo | Premium private advisory brand | No (public landing) |
| `szl-demo-video` | video | — | Governed Autonomy demo player (Full / 60s / 30s / 15s cuts) | No |
| `szl-holdings-mobile` | expo | — | Mobile command (Quick Actions, decision history) | Yes |
| `api-server` | web | — | Backend API (Cortex, Covenant Policy, Audit) | n/a |
| `mockup-sandbox` | design | NEXUS | Design sandbox + variant explorer | n/a |
| `cortex-mobile` | (deprecated) | — | Predecessor of `szl-holdings-mobile`; kept for reference | — |
| `imperium` | web | — | Internal experiment | — |
| `prism-counsel` | web | — | Predecessor of `counsel`; kept for reference | — |

---

## What shipped right before standby (recent merge highlights)

| Commit | What |
|---|---|
| `4eb20cb87` | **Security:** complete full-history + working-tree credential scan (Task #1442). Adds `.gitleaks.toml`, populates `KNOWN-GAPS.md`, hardens `scripts/qa/scan-secrets.js`. |
| `2231ac57f` / `e7db18727` / `9ab9a06a0` / `996763189` | **Cortex + mobile:** Quick Action **decision history** view. Per-user scoping via `decidedByUserId`, `orderBy: 'decidedAt'` using `COALESCE(approved_at, rejected_at) DESC`, super_admin org-bypass, 7 passing tests. (Task #1392 — three architect-review passes, all approved & merged.) |
| `7d9553b15` | **Migration:** historical IP-hash backfill — refactored migration script with full test coverage (`scripts/migrate-ip-hashes.test.ts`, `lib/audit/src/ip-hash.test.ts`). (Task #1441) |
| `c5920f560` | **Security:** tuned gitleaks allowlist after first real CI run. (Task #1443) |
| `dff1f02cb` | **Multi-tenant:** cross-tenant data isolation audit — completed route org scoping in `api-server`. |
| `ec7e4926c` | **Docs:** Firebase + Google Play credential rotation runbook (GAP-001). |

---

## Deferred work — DO NOT START until project resumes

**"SZL Agent Mesh" overhaul** — multi-phase spec the user described pre-standby. Acknowledged but not begun:

- **Phase 0:** Audit existing agent surfaces. Output → `docs/SZL_AGENT_MESH_AUDIT.md`. **This is the first task to file when resuming.**
- **Phase 1:** Synthesis — design the unified mesh contract.
- **Phase 2:** Packages — extract shared agent primitives into `lib/`.
- **Phase 3:** UI — surface the mesh inside Unified Command + mobile.
- **Phase 4:** Regression — golden-path tests across all 13 web artifacts.
- **Phase 5:** Rollout — feature-flagged exposure to demo orgs.

When you resume: switch into Plan mode, file Phase 0 as the first project task, and only begin Phase 1 after the audit doc is reviewed.

---

## Walkthrough — artifact by artifact (with screenshots)

All screenshots referenced below live under `screenshots/`. Today's pre-standby capture set:

| # | File | Artifact | What it shows |
|---|---|---|---|
| 01 | `screenshots/01-szl-holdings.jpg` | szl-holdings | Parent dashboard landing |
| 02 | `screenshots/02-command.jpg` | command | Unified Command home |
| 03 | `screenshots/03-sentra.jpg` | sentra | TENAX landing hero |
| 04 | `screenshots/04-counsel.jpg` | counsel | Counsel/FORGE legal landing |
| 05 | `screenshots/05-vessels.jpg` | vessels | SEXTANT landing |
| 06 | `screenshots/06-terra.jpg` | terra | DOMAINE landing — "operating surface for serious real estate" |
| 07 | `screenshots/07-pulse.jpg` | pulse | LUMINA — Authentication Required gate |
| 08 | `screenshots/08-lyte.jpg` | lyte-command-center | KORA dashboard, signals & metrics |
| 09 | `screenshots/09-aegis.jpg` | aegis | PARAGON investor pitch landing |
| 10 | `screenshots/10-carlota-jo.jpg` | carlota-jo | Premium private advisory hero |
| 11 | `screenshots/11-aegis-deck.jpg` | aegis `/deck` | Auth gate for the deck route |
| 12 | `screenshots/12-command-governance.jpg` | command `/governance` | Strategy → Governed Decision Loop nav (page-not-found content; nav is good) |
| 13 | `screenshots/13-vessels-fleet.jpg` | vessels `/fleet` | SEXTANT auth gate (security-by-default) |
| 14 | `screenshots/14-szl-portfolio.jpg` | szl-holdings `/portfolio` | KORA / DOMAINE / SEXTANT / TENAX / FORGE / Carlota Jo module tiles, live signal counts |
| 15 | `screenshots/15-lyte.jpg` | lyte-command-center `/` | KORA full intelligence panel — Vantex Acquisition incident, $4.2M Q2 risk, 47 active signals |
| 16 | `screenshots/16-counsel.jpg` | counsel `/` | Counsel landing — "Turn matters, obligations, and legal exposure into command" |
| 17 | `screenshots/17-carlota-jo.jpg` | carlota-jo `/` | Carlota Jo — "Where life's complexity finds quiet clarity" + service disciplines |
| 18 | `screenshots/18-demo-video.jpg` | szl-demo-video `/` | Governed Autonomy player — Full / 60s / 30s / 15s cut switcher |
| 19 | `screenshots/19-sentra.jpg` | sentra `/` | TENAX — "Turn cyber posture, recovery readiness, and live incidents into command" |

(Plus 169 prior captures kept in `screenshots/` from earlier sessions — total 188 images.)

### Notes on the auth-gated screenshots
`pulse`, `vessels`, `aegis/deck`, `command/governance` (operator features) all show the sign-in gate or a partial nav. **This is correct behavior** — these surfaces enforce sign-in by default, which is what we want for the demo posture. The unauthenticated landing views above are the intended public faces.

---

## Resource posture during standby

**Workflows currently still running on the Replit container** (auto-sleep when no traffic):

```
artifacts/aegis            artifacts/api-server      artifacts/carlota-jo
artifacts/command          artifacts/counsel         artifacts/lyte-command-center
artifacts/mockup-sandbox   artifacts/pulse           artifacts/sentra
artifacts/szl-demo-video   artifacts/szl-holdings    artifacts/szl-holdings-mobile
artifacts/terra            artifacts/vessels
```

These do not accrue charges while idle on the development container. **No Replit Deployments are active** — anything you previously published is the only thing that could continue to bill. Verify on the Replit dashboard → Deployments tab if billing is a concern, and contact Replit support for billing questions (I can't see or modify billing).

The OTel exporter (`VITE_OTEL_ENDPOINT`, `VITE_OTEL_HEADERS` secrets) will silently drop traces while no one uses the apps — no cost.

---

## Recurring infrastructure quirks (not regressions — ignore on return)

- **drizzle-kit push timeouts** post-merge: container OS thread/port exhaustion, intermittent. Re-running succeeds.
- **api-server flapping** (502s on first hit after idle): cold start, recovers on second request.
- **Vite WS connection refused** in browser logs: the workspace proxy doesn't forward WSS for the dev preview iframe. HMR over the proxy doesn't work; full reloads do. Cosmetic.

---

## Files to read first when resuming

1. `STANDBY-WALKTHROUGH.md` (this file)
2. `KNOWN-GAPS.md`
3. `CHANGELOG.md`
4. `ARCHITECTURE.md`
5. `ENVIRONMENT_VARIABLES.md` + `CREDENTIAL_ROTATION.md`
6. `replit.md`
7. `docs/` (full tree — buyer doc, backend hardening, audit notes)

---

*End of standby walkthrough.*
