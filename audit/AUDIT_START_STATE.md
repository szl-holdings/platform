# Audit Start State — Task #3473

**Captured:** 2026-04-25  
**Phase:** Screenshot capture, README rewrite, and org profile refresh  
**Branch:** master  

---

## Repository Basics

| Field | Value |
|-------|-------|
| Remote | Replit-internal subrepl remotes only (no github.com remote configured in this environment) |
| Branch | master |
| Framework | pnpm monorepo, Turbo |
| Package manager | pnpm 10+ |
| Language | TypeScript 5.x (full-stack strict) |
| Frontend | React 19 + Vite |
| Mobile | Expo SDK 53 / React Native |
| Backend | Express 5, Node.js 22 |
| Database | PostgreSQL 16, Drizzle ORM |

---

## Detected Commands

| Command | Script |
|---------|--------|
| Dev (all) | `pnpm dev` |
| Build | `pnpm build` (Turbo) |
| Typecheck | `pnpm typecheck` |
| Test | `pnpm test` |
| Lint | `pnpm lint` |
| Seed | `pnpm seed` |
| Screenshot capture | `bash scripts/capture-screenshots.sh` (existing; new: `pnpm screenshots:proof`) |
| Route QA | `pnpm qa:routes` |
| Full audit | `pnpm audit:all` |

---

## Current README Screenshot Links

The root `README.md` (before rewrite) references screenshots at:

```
docs/assets/screenshots/current/szl-holdings-dashboard.jpg
docs/assets/screenshots/current/kora-praxis-command.jpg
docs/assets/screenshots/current/sextant-fleet-command.jpg
docs/assets/screenshots/current/domaine-deal-pipeline.jpg
docs/assets/screenshots/current/carlota-jo-client-portal.jpg
docs/assets/screenshots/current/forge-command-portal-executive.jpg
docs/assets/screenshots/current/tenax-soc-command.jpg
```

All 7 files confirmed present in `docs/assets/screenshots/current/`.

---

## Current Public Image Assets

### `docs/assets/screenshots/current/` (7 files — all current)
- `carlota-jo-client-portal.jpg`
- `domaine-deal-pipeline.jpg`
- `forge-command-portal-executive.jpg`
- `kora-praxis-command.jpg`
- `sextant-fleet-command.jpg`
- `szl-holdings-dashboard.jpg`
- `tenax-soc-command.jpg`

### `docs/assets/screenshots/archive/` — existing archive of older screenshots

### `screenshots/` — large dump of 100+ screenshots, many with stale names:
- **Firestorm-named:** `02-aegis-firestorm.jpg`, `06-aegis-firestorm.jpg`, `aegis-firestorm.jpg`, `firestorm-aegis.jpg`
- **Alloy-named:** `02-alloy-platform.jpg`, `03-alloy-full-page.jpg`, `11-alloy-evolution-radar.jpg`, `alloy-connectors.jpg`, `alloy-dag.jpg`, `alloy-decisions.jpg`, `alloy-execution-history.jpg`, `alloy-governance.jpg`, `alloy-home.jpg`, `alloy-operator-control.jpg`, `alloy-platform.jpg`, `alloy-public-page.jpg`, `alloy-signals.jpg`, `alloy-skills.jpg`, `alloy-workflows.jpg`
- **Lyte-named:** `04-lyte-command-center.jpg`, `lyte-blocker-board.jpg`, `lyte-board-clean.jpg`, `lyte-board-fresh.jpg`, `lyte-board-mode.jpg`, `lyte-capabilities.jpg`, `lyte-command-center.jpg`, `lyte-dashboard.jpg`, `lyte-demo-dashboard.jpg`, + more
- **Prism-Counsel-named:** `08-prism-counsel.jpg`, `prism-counsel-*.jpg`
- **Stephen-site named:** `06-stephen-site.jpg`, `stephen-site.jpg`, `stephen-site-fresh.jpg`

### `launch-shots/` — 7 launch-phase screenshots, still valid references

### `archive/` — existing archive directories: `duplicate-artifacts/`, `media/`, `phase-a/`, `phase-d-media/`, `scripts/`, `social/`, `social-launch/`

### `public/` — no screenshot subdirectory exists yet (to be created)

---

## Known A11oy Routes (from `artifacts/a11oy/src/App.tsx`)

19 routes identified:

| Route | Component |
|-------|-----------|
| `/a11oy/` | HomePage (Hero) |
| `/a11oy/now` | NowBoard |
| `/a11oy/command` | CommandSurface |
| `/a11oy/signals` | SignalMesh |
| `/a11oy/actions` | ActionRail |
| `/a11oy/proof` | ProofLedger |
| `/a11oy/governance` | Governance (Covenant) |
| `/a11oy/agents` | Agents (Operator Control Plane) |
| `/a11oy/workcells` | Workcells |
| `/a11oy/evals` | MirrorEval |
| `/a11oy/connectors` | ConnectorFirewall |
| `/a11oy/twins` | TwinFoundry |
| `/a11oy/trust` | TrustCenter |
| `/a11oy/model-router` | ModelRouter |
| `/a11oy/skills` | SkillsLibrary |
| `/a11oy/replay` | WorkcellReplay |
| `/a11oy/sovereign` | Sovereign |
| `/a11oy/boardroom` | BoardroomMode |
| `/a11oy/investor-demo` | InvestorDemo |

---

## GitHub Workflows (`.github/workflows/`)

| Workflow | File | Status |
|----------|------|--------|
| CI | `ci.yml` | Present — badge valid |
| CodeQL | `codeql.yml` | Present — badge valid |
| Security | `security.yml` | Present — badge valid |
| Build | `build.yml` | Present |
| Deploy Staging | `deploy-staging.yml` | Present |
| Deploy Production | `deploy-production.yml` | Present |
| E2E | `e2e.yml` | Present |
| README QA | `readme-qa.yml` | Present |
| Secret Scan | `secret-scan.yml`, `secret-scan-scheduled.yml` | Present |
| Dependency Review | `dependency-review.yml` | Present |
| Lighthouse | `lighthouse.yml` | Present |
| Nightly Smoke | `nightly-smoke.yml` | Present |
| A11y | `a11y.yml` | Present |
| Commitlint | `commitlint.yml` | Present |
| Backup | `backup.yml` | Present |
| NPM Publish | `npm-publish.yml` | Present |
| Container Publish | `container-publish.yml` | Present |
| Release | `release.yml` | Present |
| Audit Full | `audit-full.yml` | Present |

All three badge workflows (CI, CodeQL, Security) confirmed present — badges in README are valid.

---

## Stale Terms Detected

| Term | Scope |
|------|-------|
| `Alloy` (old product name, now A11oy) | `profile-readme/README.md`, `.github/profile/README.md` (arch diagram), various audit docs (historical) |
| `Lyte` (old product name, now KORA) | `profile-readme/README.md`, screenshots dir filenames |
| `Firestorm` (old code name for Aegis) | Screenshot filenames in `screenshots/` |
| `Prism Counsel` (legacy product) | Screenshot filenames, audit docs (historical — acceptable) |
| `Arquitecture` / `Canonical Arquitecture` | Present in some older audit docs (historical) |
| `Boss` / `Bo11y` / `Bolly` | Not found in source/doc files — only in historical audit records |
| `lorem ipsum` | Found in `docs/PRODUCTION_READINESS_CHECKLIST.md`, `docs/production-readiness.md` |

---

## Initial Risks

1. **No live screenshot capture possible at start state** — all artifact workflows are stopped. The Playwright script will record failures in the manifest. Existing 7 screenshots in `docs/assets/screenshots/current/` remain valid.
2. **Large stale screenshot dump** — `screenshots/` contains 100+ files with old names. These should be archived, not deleted.
3. **profile-readme/README.md** uses "Lyte" and "Alloy" — needs rewrite to current naming (KORA/A11oy).
4. **`.github/profile/README.md` arch diagram** references `Signal Normalization (Alloy)` — needs update to A11oy.
5. **No `public/proof/current/` or `audit/screenshots/raw/` directories** — to be created by capture script.
6. **No `org-profile/` directory** — to be created for portability mirror.
