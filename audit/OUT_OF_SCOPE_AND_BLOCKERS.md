# Out of Scope and Blockers — A11oy Public-Readiness Audit

**Date:** 2026-04-25  
**Task:** #3474  
**Classification key:** `fixed_now` | `documented` | `needs_human_decision` | `requires_credentials` | `requires_GitHub_auth` | `requires_external_service` | `unsafe_to_change` | `deferred_to_roadmap`

---

## Blockers and Gaps

### 1. `@workspace/a11oy-fabric` package missing — A11oy build broken

| Field | Value |
|-------|-------|
| **Issue** | The `artifacts/a11oy` artifact imports from `@workspace/a11oy-fabric` across 11 pages (SEED_SIGNALS, SEED_OUTCOMES, SEED_WORKCELLS, SEED_TOOLS, SEED_PCE_CONTRACTS, SEED_PROOF_PACKETS, SEED_DEMO_SCENARIOS). This package does not exist in `packages/`. The a11oy Vite build fails. |
| **Why it matters** | A11oy cannot be built for production deployment. The artifact serves the UI but cannot pass CI build gates. |
| **Status** | `deferred_to_roadmap` |
| **Recommendation** | Create `packages/a11oy-fabric/` with seed data exports matching the import shapes. This is the primary deliverable of the downstream task "A11oy Fully Operational — consolidated build chain + acceptance gate". |
| **Owner** | Engineering (downstream task) |
| **Next action** | Downstream task: scaffold `packages/a11oy-fabric/`, add to `pnpm-workspace.yaml`, add to `artifacts/a11oy/package.json` dependencies, re-run build. |

---

### 2. `@workspace/terra` build failure — pre-existing Rollup resolution error

| Field | Value |
|-------|-------|
| **Issue** | Terra artifact fails to build with a Rollup variable resolution error. This predates Phase 1. |
| **Why it matters** | Terra (DOMAINE) cannot be deployed from a CI-clean build. Demo runs from dev server only. |
| **Status** | `documented` |
| **Recommendation** | Investigate the specific Rollup configuration causing the issue. Check for circular imports or missing peer deps. |
| **Owner** | Engineering |
| **Next action** | Dedicated Terra build investigation sprint. |

---

### 3. `@workspace/vessels` and `@workspace/sentra` build failures — missing shared-ui exports

| Field | Value |
|-------|-------|
| **Issue** | Both artifacts fail to build due to missing exports from `@workspace/shared-ui`. Pre-existing issue. |
| **Why it matters** | SEXTANT and TENAX cannot be deployed from a CI-clean build. |
| **Status** | `documented` |
| **Recommendation** | Identify which exports are missing from `@workspace/shared-ui`, add them, and re-run builds. |
| **Owner** | Engineering |
| **Next action** | Shared-UI export audit; add missing exports. |

---

### 4. Full workspace typecheck requires DATABASE_URL

| Field | Value |
|-------|-------|
| **Issue** | `pnpm typecheck` (turbo run) fails locally because `@szl-holdings/db` requires a live Postgres connection for codegen. |
| **Why it matters** | Cannot verify full monorepo type correctness in a local audit environment without infrastructure. |
| **Status** | `requires_credentials` |
| **Recommendation** | This runs correctly in CI where DATABASE_URL is injected as a repository secret. No code change needed. |
| **Owner** | CI (already handled) |
| **Next action** | None — CI is already green for this gate. |

---

### 5. API server tests and build require DATABASE_URL

| Field | Value |
|-------|-------|
| **Issue** | `@workspace/api-server` test suite and build cannot run locally without a Postgres connection. |
| **Why it matters** | Cannot verify API server correctness locally. |
| **Status** | `requires_credentials` |
| **Recommendation** | These run in CI. Last known result: green (per GitHub Actions history). |
| **Owner** | CI (already handled) |
| **Next action** | None. |

---

### 6. Branch protection rules not applied on GitHub

| Field | Value |
|-------|-------|
| **Issue** | Branch protection rules for `master` (require PR, require status checks, require review) are documented in `.github/BRANCH_PROTECTION.md` but not yet applied in the GitHub UI. |
| **Why it matters** | Without branch protection, direct commits to `master` are possible, bypassing CI gates. This is a gap for investor due diligence. |
| **Status** | `requires_GitHub_auth` |
| **Recommendation** | Apply branch protection rules via GitHub repo → Settings → Branches. See `.github/BRANCH_PROTECTION.md` for the exact settings. |
| **Owner** | Stephen Lutar (org admin required) |
| **Next action** | Manual step in GitHub UI — 15 minutes. |

---

### 7. GitHub org profile not pushed to `szl-holdings/.github`

| Field | Value |
|-------|-------|
| **Issue** | The org profile README content is prepared in `proof-pack/GITHUB_ORG_PROFILE_COPY.md` and `.github/profile/README.md` but not yet in the live `szl-holdings/.github` repository. |
| **Why it matters** | `github.com/szl-holdings` shows a blank or outdated org profile to investors visiting the GitHub org. |
| **Status** | `requires_GitHub_auth` |
| **Recommendation** | Follow `audit/ORG_PROFILE_MANUAL_STEPS.md`. Requires org-level write access to `szl-holdings/.github`. |
| **Owner** | Stephen Lutar |
| **Next action** | Manual push or GitHub UI edit — 15 minutes. |

---

### 8. Social preview image not uploaded to GitHub

| Field | Value |
|-------|-------|
| **Issue** | The GitHub repo does not have a social preview image set. This means link previews on LinkedIn, Twitter, and Slack show a generic GitHub icon. |
| **Why it matters** | Reduces visual impact of shared links in investor outreach. |
| **Status** | `needs_human_decision` |
| **Recommendation** | Use the A11oy boardroom mode screenshot or generate a custom OG card via `pnpm generate:og`. Upload via GitHub repo → Settings → Social Preview. |
| **Owner** | Stephen Lutar |
| **Next action** | Manual step in GitHub UI — 5 minutes. |

---

### 9. GitHub repo topics, description, and website link not applied

| Field | Value |
|-------|-------|
| **Issue** | The recommended topics (enterprise-ai, agentic-ai, ai-governance, etc.), About description, and website link are documented in `audit/GITHUB_PRESENTATION_CHECKLIST.md` but not yet applied. |
| **Why it matters** | Reduces discoverability and visual quality of the GitHub repo for investors. |
| **Status** | `requires_GitHub_auth` |
| **Recommendation** | Apply via GitHub repo → Code → About gear icon. Takes 5 minutes. |
| **Owner** | Stephen Lutar |
| **Next action** | Manual step in GitHub UI. |

---

### 10. Repo visibility not yet set to public

| Field | Value |
|-------|-------|
| **Issue** | The `szl-holdings-platform` repo may still be private. Making it public requires an explicit decision. |
| **Why it matters** | Investors need to access the repo independently. Private repos require invitations. |
| **Status** | `needs_human_decision` |
| **Recommendation** | After this PR is merged and the security audit is confirmed clean: GitHub repo → Settings → Danger Zone → Make public. Review the investor proof summary first. |
| **Owner** | Stephen Lutar (explicit decision required) |
| **Next action** | Decision + manual step. This is a one-way operation. |

---

### 11. `szl-demo-video` artifact Vite config error

| Field | Value |
|-------|-------|
| **Issue** | `@workspace/szl-demo-video` fails to build due to a Vite config error. Pre-existing. |
| **Why it matters** | The demo video artifact cannot be deployed from a CI build. |
| **Status** | `documented` |
| **Recommendation** | Investigate Vite config issue in the video artifact. |
| **Owner** | Engineering |
| **Next action** | Dedicated video artifact investigation. |

---

### 12. Chunk size warnings on counsel and carlota-jo builds

| Field | Value |
|-------|-------|
| **Issue** | Counsel and Carlota Jo builds produce "chunk larger than 500 kB" warnings from Vite/Rollup. Builds succeed but are flagged. |
| **Why it matters** | Large bundles impact load time. Not a blocker for public readiness. |
| **Status** | `documented` |
| **Recommendation** | Apply `build.rollupOptions.output.manualChunks` or dynamic imports to split large vendor bundles. |
| **Owner** | Engineering |
| **Next action** | Performance optimization sprint (low priority for now). |

---

### 13. License decision

| Field | Value |
|-------|-------|
| **Issue** | `LICENSE.md` is proprietary (all rights reserved). Some investors prefer OSI-approved licenses for trust/extensibility. |
| **Why it matters** | Proprietary license limits community contributions and may raise questions in technical due diligence. |
| **Status** | `needs_human_decision` |
| **Recommendation** | No change made per task brief ("Keep LICENSE.md as-is"). If a license change is needed, that is a separate, explicit decision by SZL Holdings leadership. |
| **Owner** | Stephen Lutar |
| **Next action** | Explicit decision if investor feedback requires it. |

---

### 14. SCIM 2.0 provisioning — designed but not implemented

| Field | Value |
|-------|-------|
| **Issue** | SCIM 2.0 provisioning is in the architecture docs and mentioned in SECURITY.md but not yet implemented. |
| **Why it matters** | Enterprise buyers expect SCIM for user lifecycle management. |
| **Status** | `deferred_to_roadmap` |
| **Recommendation** | Implement SCIM 2.0 provisioning endpoint in api-server as a Phase 2 capability. |
| **Owner** | Engineering (roadmap) |
| **Next action** | Add to engineering backlog with priority for enterprise pilot customers. |

---

*Generated by Task #3474 audit pass — 2026-04-25*
