# Public Repo Recommendations — SZL Holdings GitHub

**Produced:** Phase D, April 2026  
**Repos in scope:** `szl-holdings/szl-holdings-platform`, `szl-holdings/.github`

---

## `szl-holdings/szl-holdings-platform`

### Description
**Current (applied):**
> Governed decision infrastructure — connecting what is observable to what is executable, with full attribution. 11 artifacts, 2,816 API endpoints, 798 tables. TypeScript throughout.

**Assessment:** Accurate per verified platform-facts.md inventory. Metrics are machine-generated. Acceptable to keep. No changes needed.

### Homepage
**Current:** `https://szlholdings.com`  
**Assessment:** Correct. No change needed.

### Topics
**Current (8):** `ai-governance`, `decision-intelligence`, `enterprise`, `monorepo`, `postgresql`, `react`, `typescript`, `vite`

**Recommended (add to reach 15):** `pnpm`, `drizzle-orm`, `expo`, `react-native`, `maritime`, `real-estate`, `cybersecurity`

**Rationale:** Current topics are generic. Adding domain-vertical topics (`maritime`, `real-estate`, `cybersecurity`) improves discoverability by investors and enterprise evaluators scanning GitHub. Adding `pnpm`, `drizzle-orm`, `expo` accurately signals the stack depth. Stay under 20 topics.

**Action:** Auto-apply via GitHub API (reversible). See Phase D report for confirmation of push.

### README
**Issues identified:**
1. **Screens section** references `prism-counsel.jpg` and `imperium-cloud.jpg` — both archived products. Screenshots should be removed from README until either replaced with current active-product shots or the archive status is surfaced contextually.
2. **Platform portfolio table** correctly marks PRISM Counsel as "Archived (Task #634)" and IMPERIUM as "Archived (Task #920)." Consistent with Screens fix.
3. **Metrics in badge row** (`11 artifacts`, `2,816 API endpoints`, `798 tables`) match `GITHUB_SETTINGS_APPLIED.json` and `docs/platform-facts.md` — verified.
4. **Contact section** — accurate and professional.
5. **Artifact inventory table** — up to date per `docs/APP_STATUS.md`.

**Action taken:** Screens section updated to remove archived-product screenshots. See README diff in Phase D report.

### Security Infrastructure
| Item | Status | Notes |
|------|--------|-------|
| `.github/dependabot.yml` | ✅ Present and current | Weekly, grouped, npm + GitHub Actions |
| `.github/workflows/codeql.yml` | ✅ Present and current | Pinned SHA, weekly schedule, TypeScript |
| `.github/workflows/security.yml` | ✅ Present | Gitleaks secret scan |
| Branch protection | ✅ Applied | `master` + `main`; 1 review, code owners, required checks |
| Secret scanning | ✅ Enabled | Push protection active |

No changes needed to security infrastructure. All workflows are confirmed on the public default branch (`master`).

### CODEOWNERS
**Status:** Present (`.github/CODEOWNERS`). Confirms ownership signals to investors.

### Issue Templates
**Status:** Present. Bug, feature, and security report templates in place.

### PR Template
**Status:** Present (`.github/PULL_REQUEST_TEMPLATE.md`).

---

## `szl-holdings/.github`

### Org Profile README (`.github/profile/README.md`)
**Issues identified:**
1. **Product listing includes PRISM Counsel and IMPERIUM as active** — inconsistent with main repo which marks them archived.
2. **Metrics in profile** (`11 Registered Artifacts`, `2,816 API Endpoints`, `798 Database Tables`, `450,000+ Lines of Code`) — all except LOC are verifiable from platform-facts.md. LOC is a soft estimate; acceptable but should be labeled as approximate if retained.
3. **User profile README** (`profile-readme/README.md`) similarly lists PRISM Counsel and IMPERIUM as active domain packs — needs update.

**Recommended changes:**
- In the Platform Overview code block, mark `PRISM Counsel` and `IMPERIUM` as `[archived]`
- In the Domain Packs table, mark PRISM Counsel and IMPERIUM as `(Archived)` to match main repo
- These changes should be pushed to the live `.github` repo via GitHub integration

---

## Summary of Auto-Pushed Changes (Phase D)

| Change | Target | Method |
|--------|--------|--------|
| Add 7 topics to main platform repo | `szl-holdings-platform` | GitHub API |
| Remove archived screenshots from README Screens section | `szl-holdings-platform` `README.md` | Local commit (pushed with codebase) |
| Update org profile README to mark archived products | `.github` repo | GitHub API content update |
